/**
 * Dashboard View - Study Commons Greeting Room Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.GreetingView = {
  messages: [],
  matches: [],
  currentUser: null,
  activeMatchId: null,
  expandedMatchId: null,
  activeChatMeetingId: null,
  countdownInterval: null,
  onSwitchToMatches: null,

  init(onSwitchToMatches) {
    this.onSwitchToMatches = onSwitchToMatches;
    this.bindEvents();
  },

  setActiveMatch(matchId) {
    this.activeMatchId = matchId;
    this.expandedMatchId = matchId;
    this.updateRoomContext();
    this.renderConfirmedMeetings();
    if (this.activeChatMeetingId) {
      this.renderMessages();
    }
  },

  formatCountdown(targetTimestamp) {
    if (!targetTimestamp) return '2d 15h 15m';
    const now = Date.now();
    const diffMs = targetTimestamp - now;
    if (diffMs <= 0) return 'Ready to start';

    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  },

  startCountdownTicker() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      let needsReRender = false;
      const countdownEls = document.querySelectorAll('#view-greeting .asc-countdown-timer-val[data-target]');
      countdownEls.forEach(el => {
        const target = parseInt(el.getAttribute('data-target'), 10);
        if (target) {
          const formatted = this.formatCountdown(target);
          el.textContent = formatted;
          if (target <= Date.now() && formatted === 'Ready to start') {
            needsReRender = true;
          }
        }
      });
      if (needsReRender) {
        // Automatically switch countdown pill to "Ready to start" button when time reaches zero
        const unreadyBtns = document.querySelectorAll('#view-greeting .btn-dev-boost-time');
        if (unreadyBtns.length > 0) {
          this.renderConfirmedMeetings();
        }
      }
    }, 1000);
  },

  async boostMeetingTime(matchId) {
    const match = (this.matches || []).find(m => m.id === matchId);
    if (!match) return;

    // Fast-forward meeting timestamp to now (1 second in past so diff <= 0)
    match.meetingTimestamp = Date.now() - 1000;

    // Persist to invitations in LocalStore
    try {
      if (typeof LocalStore !== 'undefined') {
        const allMatches = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS)) || this.matches;
        const targetInStore = allMatches.find(m => m.id === matchId);
        if (targetInStore) {
          targetInStore.meetingTimestamp = match.meetingTimestamp;
        }
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS, allMatches);
      }
    } catch (e) {
      console.warn('Could not persist boosted match time:', e);
    }

    if (window.AscAPI && typeof window.AscAPI.updateInvitation === 'function') {
      await window.AscAPI.updateInvitation(match);
    }

    const hasEarlier = this.getMeetingChatHistory(match.id).length > 0;
    const actionLabel = hasEarlier ? 'Resume Chat' : 'Ready to start';

    if (window.AscDash && window.AscDash.Toast) {
      window.AscDash.Toast.show(`⚡ Dev Boost: Fast-forwarded session with ${match.peerName} to NOW! Click "${actionLabel}" to open chat.`, 'bolt');
    }

    // Auto-select and expand this match
    this.activeMatchId = match.id;
    this.expandedMatchId = match.id;

    this.renderConfirmedMeetings();
    this.updateRoomContext();

    if (this.activeChatMeetingId === match.id) {
      this.renderMessages();
    }
  },

  openMeetingChat(matchId) {
    const match = (this.matches || []).find(m => m.id === matchId);
    if (!match) return;

    this.activeChatMeetingId = match.id;
    this.activeMatchId = match.id;
    this.expandedMatchId = match.id;

    this.renderConfirmedMeetings();
    this.mountEmbeddedChat();
    this.updateRoomContext();
    this.renderMessages();

    const historyCount = this.getMeetingChatHistory(match.id).length;
    if (window.AscDash && window.AscDash.Toast) {
      if (historyCount > 0) {
        window.AscDash.Toast.show(`🦉 Resumed study chat with ${match.peerName} (${historyCount} earlier messages restored).`, 'forum');
      } else {
        window.AscDash.Toast.show(`🦉 Welcome! Fresh Greeting Room opened with ${match.peerName}.`, 'waving_hand');
      }
    }

    // Smooth scroll to embedded chat
    setTimeout(() => {
      this.scrollToBottom();
      const inputEl = document.getElementById('chat-user-input');
      if (inputEl) inputEl.focus();
    }, 150);
  },

  mountEmbeddedChat() {
    const chatContainer = document.getElementById('greeting-chat-container') || document.querySelector('.asc-chat-container');
    const viewSection = document.getElementById('view-greeting');
    if (!chatContainer) return;

    if (!this.activeChatMeetingId) {
      chatContainer.style.display = 'none';
      if (viewSection && chatContainer.parentElement !== viewSection) {
        viewSection.appendChild(chatContainer);
      }
      return;
    }

    const activeCard = document.querySelector(`.asc-greeting-meeting-card[data-id="${this.activeChatMeetingId}"]`);
    if (activeCard) {
      const slot = activeCard.querySelector('.asc-embedded-chat-slot');
      if (slot) {
        if (chatContainer.parentElement !== slot) {
          slot.appendChild(chatContainer);
        }
        chatContainer.style.display = 'flex';
        return;
      }
    }

    chatContainer.style.display = 'none';
  },

  getActiveMatch() {
    const confirmed = (this.matches || []).filter(m => m.status === 'confirmed');
    if (this.activeChatMeetingId) {
      const match = (this.matches || []).find(m => m.id === this.activeChatMeetingId);
      if (match) return match;
    }
    if (this.activeMatchId) {
      const match = (this.matches || []).find(m => m.id === this.activeMatchId);
      if (match) return match;
    }
    if (confirmed.length > 0) {
      this.activeMatchId = confirmed[0].id;
      return confirmed[0];
    }
    return null;
  },

  /**
   * Retrieves isolated chat history belonging specifically to a meeting section
   */
  getMeetingChatHistory(matchId) {
    if (!matchId) return [];
    return (this.messages || []).filter(m => {
      // Exclude synthetic intro messages that might have been saved
      if (m.id && (m.id.startsWith('msg_host_') || m.id.startsWith('msg_peer_'))) return false;
      return m.matchId === matchId;
    });
  },

  updateRoomContext() {
    const activeMatch = this.getActiveMatch();
    const isAlex = this.currentUser && this.currentUser.id === 'user_alex_202';
    const userName = this.currentUser ? this.currentUser.displayName : 'You';
    const defaultPeer = isAlex ? 'Elena Rostova' : 'Samira Patel';

    const roomTitleEl = document.getElementById('greeting-room-title');
    const roomSubEl = document.getElementById('greeting-room-sub');
    const userPillEl = document.getElementById('greeting-user-pill');
    const peerPillEl = document.getElementById('greeting-peer-pill');

    if (userPillEl) {
      userPillEl.textContent = `${userName} (You)`;
    }

    if (activeMatch) {
      if (roomTitleEl) {
        roomTitleEl.textContent = activeMatch.missionTitle || activeMatch.targetProject || 'Collaborative Study Session';
      }
      if (roomSubEl) {
        const categoryOrCourse = activeMatch.course
          ? `${activeMatch.course} • ${activeMatch.purposeCategory || 'Collaborative Sprint'}`
          : (activeMatch.purposeCategory || (isAlex ? 'Cross-Disciplinary Eco-Media Collective' : 'Engineering & Systems Incubator'));
        roomSubEl.textContent = `Presided by AI Host Owl • ${categoryOrCourse}`;
      }
      if (peerPillEl) {
        peerPillEl.textContent = activeMatch.peerName || defaultPeer;
      }
    } else {
      if (roomTitleEl) {
        roomTitleEl.textContent = isAlex
          ? 'Eco-Simulation & 3D Shaders Room'
          : 'Robotics & Embedded Systems Pairing';
      }
      if (roomSubEl) {
        roomSubEl.textContent = isAlex
          ? 'Presided by AI Host Owl • Cross-Disciplinary Eco-Media Collective'
          : 'Presided by AI Host Owl • Engineering & Systems Incubator';
      }
      if (peerPillEl) {
        peerPillEl.textContent = defaultPeer;
      }
    }
  },

  renderConfirmedMeetings() {
    const chatContainer = document.getElementById('greeting-chat-container') || document.querySelector('.asc-chat-container');
    const viewSection = document.getElementById('view-greeting');

    // CRITICAL: Safely park chatContainer back to viewSection BEFORE clearing listContainer.innerHTML
    // This ensures listContainer.innerHTML = '' NEVER destroys the chatContainer DOM node!
    if (chatContainer && viewSection && chatContainer.parentElement !== viewSection) {
      viewSection.appendChild(chatContainer);
    }

    const confirmed = (this.matches || []).filter(m => m.status === 'confirmed');
    const badgeEl = document.getElementById('greeting-meetings-count-badge');
    if (badgeEl) {
      badgeEl.textContent = `${confirmed.length} Scheduled`;
    }

    const listContainer = document.getElementById('greeting-meetings-list');
    if (!listContainer) return;

    // If no approved meetings exist, ensure embedded chat card is hidden
    if (confirmed.length === 0) {
      this.activeChatMeetingId = null;
      if (chatContainer) chatContainer.style.display = 'none';

      listContainer.innerHTML = `
        <div class="asc-card" style="padding: 16px 20px; border: 1px dashed var(--border-color); color: var(--text-muted); font-size: 13px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="material-symbols-outlined" style="color: #a1a1aa; font-size: 22px;">event_busy</span>
            <div>
              <div style="font-weight: 600; color: var(--text-main);">No approved meetings scheduled yet</div>
              <div style="font-size: 11.5px; color: var(--text-secondary);">Confirm a proposed match in the Peer Matching tab to schedule an upcoming room session with live countdown.</div>
            </div>
          </div>
          <button class="asc-btn-secondary btn-goto-matches" type="button" style="padding: 6px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 15px;">handshake</span>
            <span>Review Peer Matches</span>
          </button>
        </div>
      `;
      const btnGo = listContainer.querySelector('.btn-goto-matches');
      if (btnGo) {
        btnGo.addEventListener('click', () => {
          if (typeof this.onSwitchToMatches === 'function') {
            this.onSwitchToMatches();
          }
        });
      }
      return;
    }

    // Verify activeChatMeetingId still belongs to a confirmed meeting
    if (this.activeChatMeetingId) {
      const exists = confirmed.some(m => m.id === this.activeChatMeetingId);
      if (!exists) {
        this.activeChatMeetingId = null;
      }
    }

    listContainer.innerHTML = '';

    confirmed.forEach(match => {
      const targetTime = match.meetingTimestamp || (Date.now() + (2 * 24 + 15) * 3600 * 1000 + 15 * 60 * 1000);
      match.meetingTimestamp = targetTime;
      const countdownStr = this.formatCountdown(targetTime);
      const isReady = targetTime <= Date.now();
      const isChatActive = this.activeChatMeetingId === match.id;
      // If chat is active for this card, body is guaranteed to be expanded and visible
      const isExpanded = isChatActive || (this.expandedMatchId === match.id);
      const isActive = isChatActive || (this.activeMatchId === match.id);

      // Check if this meeting section has earlier chat messages saved
      const earlierMsgs = this.getMeetingChatHistory(match.id);
      const hasEarlierChat = earlierMsgs.length > 0;

      const card = document.createElement('div');
      card.className = `asc-card asc-greeting-meeting-card ${isExpanded ? 'expanded' : ''} ${isActive ? 'active-meeting' : ''}`;
      card.setAttribute('data-id', match.id);

      card.innerHTML = `
        <div class="asc-meeting-card-header" data-id="${match.id}" role="button" tabindex="0" title="Click to view details and switch room context">
          <div class="asc-meeting-card-header-left">
            <div class="asc-match-partner-avatar">${match.peerAvatar || 'PR'}</div>
            <div class="asc-meeting-header-text">
              <div class="asc-meeting-peer-title">
                <span class="asc-meeting-peer-name">${match.peerName}</span>
                <span class="asc-meeting-peer-college">• ${match.peerCollege || 'Peer'}</span>
                ${isChatActive ? '<span class="asc-tag asc-tag-emerald" style="margin-left: 6px; font-size: 10.5px; padding: 2px 7px;">Chat Connected</span>' : ''}
              </div>
              <div class="asc-meeting-course-snippet">
                <span class="asc-meeting-course-tag">${match.course || ''}</span>
                <span class="asc-meeting-mission-preview">${match.missionTitle || match.targetProject || 'Collaborative Study Session'}</span>
              </div>
            </div>
          </div>

          <div class="asc-meeting-card-header-right">
            ${!isReady ? `
              <div class="asc-meeting-countdown-pill" title="Live Countdown to Scheduled Session">
                <span class="material-symbols-outlined" style="font-size: 16px; color: #10b981;">schedule</span>
                <div style="text-align: right;">
                  <span style="font-size: 9px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; line-height: 1;">Starts In</span>
                  <strong class="asc-countdown-timer-val" data-target="${targetTime}" style="font-size: 13px; color: #34d399; font-family: monospace;">${countdownStr}</strong>
                </div>
              </div>
              <button type="button" class="asc-btn-secondary btn-dev-boost-time" data-id="${match.id}" title="Dev Fast-Forward: Set meeting time to NOW">
                <span class="material-symbols-outlined" style="font-size: 14px; color: #f59e0b;">bolt</span>
                <span>Boost Time</span>
              </button>
            ` : `
              ${!isChatActive ? `
                <button type="button" class="asc-btn-primary btn-ready-to-start" data-id="${match.id}" title="${hasEarlierChat ? 'Click to resume earlier chat session' : 'Session unlocked! Click to connect live Greeting Room chat'}">
                  <span class="material-symbols-outlined" style="font-size: 16px;">${hasEarlierChat ? 'forum' : 'play_circle'}</span>
                  <span>${hasEarlierChat ? 'Resume Chat' : 'Ready to start'}</span>
                </button>
              ` : `
                <span class="asc-tag asc-tag-emerald" style="padding: 5px 11px; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                  <span class="material-symbols-outlined" style="font-size: 15px;">forum</span>
                  <span>In Session (Chat Connected)</span>
                </span>
              `}
              <button type="button" class="asc-btn-secondary btn-dev-boost-time" data-id="${match.id}" title="Dev: Timestamp boosted to start" style="opacity: 0.7;">
                <span class="material-symbols-outlined" style="font-size: 14px; color: #f59e0b;">bolt</span>
                <span>Boosted</span>
              </button>
            `}

            <!-- Expand / Collapse Indicator -->
            <div class="asc-meeting-expand-toggle" title="${isExpanded ? 'Collapse meeting details' : 'Click to expand meeting details'}">
              <span class="material-symbols-outlined asc-meeting-expand-chevron">
                ${isExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </div>
        </div>

        <!-- Collapsible Details Body (Hidden by default, expands on click) -->
        <div class="asc-greeting-meeting-card-body" style="display: ${isExpanded ? 'block' : 'none'};">
          <div style="margin-bottom: 12px; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 6px;">
              <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">
                ${match.missionTitle || match.targetProject || 'Collaborative Study Session'}
              </div>
              <span style="display: inline-flex; align-items: center; gap: 4px; color: #34d399; font-size: 11.5px; font-weight: 600; white-space: nowrap;">
                <span class="material-symbols-outlined" style="font-size: 14px;">verified</span>
                <span>Double-Opt-In Approved</span>
              </span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--text-muted); margin-top: 6px;">
              <span style="display: flex; align-items: center; gap: 5px;">
                <span class="material-symbols-outlined" style="font-size: 15px; color: #60a5fa;">calendar_month</span>
                <span>Confirmed Window: <strong style="color: var(--text-main);">${match.proposedWindow ? match.proposedWindow.split('(')[0].trim() : 'Upcoming Window'}</strong></span>
              </span>
              <span style="display: flex; align-items: center; gap: 5px;">
                <span class="material-symbols-outlined" style="font-size: 15px; color: #a78bfa;">category</span>
                <span>${match.purposeCategory || 'Private Project Incubator'}</span>
              </span>
            </div>
          </div>

          ${match.synergyHighlight ? `
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; padding: 10px 12px; background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; border-radius: 4px; line-height: 1.45;">
              <strong style="color: #60a5fa;">AI Skill Synergy:</strong> ${match.synergyHighlight}
            </div>
          ` : ''}

          ${isReady && !isChatActive ? `
            <div class="asc-meeting-ready-callout">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="material-symbols-outlined" style="color: #34d399; font-size: 26px;">${hasEarlierChat ? 'forum' : 'lock_open'}</span>
                <div>
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">
                    ${hasEarlierChat ? `Resume Discussion (${earlierMsgs.length} messages saved)` : 'Study Session Unlocked'}
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary);">
                    ${hasEarlierChat ? 'You have prior messages in this meeting section. Click below to reconnect and restore earlier conversation.' : 'Both peers approved this session. Click "Ready to start" to open and connect the greeting room chat right inside this card.'}
                  </div>
                </div>
              </div>
              <button type="button" class="asc-btn-primary btn-ready-to-start" data-id="${match.id}">
                <span class="material-symbols-outlined" style="font-size: 16px;">${hasEarlierChat ? 'forum' : 'play_circle'}</span>
                <span>${hasEarlierChat ? 'Resume Chat' : 'Ready to start'}</span>
              </button>
            </div>
          ` : ''}

          ${!isReady ? `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color); font-size: 11.5px; color: var(--text-muted);">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span class="material-symbols-outlined" style="font-size: 15px; color: #10b981;">hourglass_top</span>
                <span>Session chat unlocks when countdown completes or when you click "Boost Time".</span>
              </span>
              <button type="button" class="asc-btn-secondary btn-dev-boost-time" data-id="${match.id}" style="padding: 4px 10px; font-size: 11px;">
                <span class="material-symbols-outlined" style="font-size: 13px; color: #f59e0b;">bolt</span>
                <span>Boost to Start Time</span>
              </button>
            </div>
          ` : ''}

          <!-- Embedded Chat Slot: When 'Ready to start' or 'Resume Chat' is clicked, the chat card connects directly here -->
          <div class="asc-embedded-chat-slot" data-id="${match.id}"></div>
        </div>
      `;

      // Header click toggles expand/collapse and sets active match
      const headerEl = card.querySelector('.asc-meeting-card-header');
      if (headerEl) {
        headerEl.addEventListener('click', (e) => {
          // If clicking buttons inside header, don't toggle accordion
          if (e.target.closest('.btn-dev-boost-time') || e.target.closest('.btn-ready-to-start')) return;

          // If chat is currently active in this card, keep it expanded
          if (this.activeChatMeetingId === match.id) return;

          this.expandedMatchId = (this.expandedMatchId === match.id) ? null : match.id;
          this.activeMatchId = match.id;
          this.updateRoomContext();
          this.renderConfirmedMeetings();
        });
      }

      // Dev Boost button click
      const btnBoostList = card.querySelectorAll('.btn-dev-boost-time');
      btnBoostList.forEach(btnBoost => {
        btnBoost.addEventListener('click', (e) => {
          e.stopPropagation();
          this.boostMeetingTime(match.id);
        });
      });

      // Ready to start / Resume Chat button click
      const btnReadyList = card.querySelectorAll('.btn-ready-to-start');
      btnReadyList.forEach(btnReady => {
        btnReady.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openMeetingChat(match.id);
        });
      });

      listContainer.appendChild(card);
    });

    // Mount embedded chat container into active slot if opened
    this.mountEmbeddedChat();
  },

  render(messages, currentUser, matches) {
    if (currentUser !== undefined) {
      this.currentUser = currentUser || null;
    }
    if (matches !== undefined) {
      this.matches = matches || [];
    }
    if (messages !== undefined) {
      this.messages = messages || [];
    }

    const viewSection = document.getElementById('view-greeting');
    const noticeWrap = document.getElementById('greeting-login-notice-wrap');
    const meetingsWrap = document.getElementById('greeting-meetings-wrap');
    const chatContainer = document.getElementById('greeting-chat-container') || document.querySelector('.asc-chat-container');

    if (!this.currentUser || !this.currentUser.id) {
      this.activeChatMeetingId = null;
      if (chatContainer) {
        chatContainer.style.display = 'none';
        if (viewSection && chatContainer.parentElement !== viewSection) {
          viewSection.appendChild(chatContainer);
        }
      }
      if (meetingsWrap) meetingsWrap.style.display = 'none';
      if (noticeWrap) {
        noticeWrap.style.display = 'block';
        if (typeof window.AscDash.renderLoggedOutNotice === 'function') {
          noticeWrap.innerHTML = window.AscDash.renderLoggedOutNotice(
            'Study Commons Greeting Room',
            'Sign in with your student Google account to enter private, AI-facilitated study rooms with verified student peers.',
            'waving_hand'
          );
        }
      }
      return;
    }

    if (noticeWrap) noticeWrap.style.display = 'none';
    if (meetingsWrap) meetingsWrap.style.display = 'flex';

    // Render countdown meeting cards for approved/confirmed sessions
    this.renderConfirmedMeetings();
    this.startCountdownTicker();

    // Dynamically update greeting room title, subtitle, and peer pill based on approved session
    this.updateRoomContext();

    // Mount embedded chat container
    this.mountEmbeddedChat();

    // Render chat messages if chat session is active
    if (this.activeChatMeetingId) {
      this.renderMessages();
    } else if (chatContainer) {
      chatContainer.style.display = 'none';
    }
  },

  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = '';

    const activeMatch = this.getActiveMatch();
    if (!activeMatch) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a; margin-top:20px;">No active meeting selected. Click "Ready to start" on an approved meeting to begin!</div>`;
      return;
    }

    const isAlex = this.currentUser && this.currentUser.id === 'user_alex_202';
    const userName = this.currentUser ? this.currentUser.displayName : 'You';
    const peerName = activeMatch.peerName || (isAlex ? 'Elena Rostova' : 'Samira Patel');

    // 1. Initial greeting for this specific meeting
    const initialMsgs = [
      {
        id: `msg_host_${activeMatch.id}`,
        matchId: activeMatch.id,
        sender: 'ai_host',
        peerName: '🦉 Study Commons AI Host',
        text: `Welcome @${userName} and @${peerName}! You have both confirmed alignment on "${activeMatch.missionTitle || activeMatch.targetProject}". AI Host Owl is presiding to facilitate your collaboration goals, sync schedule milestones, and guide your session.`,
        timestamp: 'Scheduled'
      },
      {
        id: `msg_peer_${activeMatch.id}`,
        matchId: activeMatch.id,
        sender: 'peer',
        peerName: peerName,
        text: activeMatch.discussionSnippet || `Hi ${userName}! Excited to work on ${activeMatch.missionTitle || 'this project'} together. Looking forward to our session!`,
        timestamp: 'Scheduled'
      }
    ];

    // 2. Load earlier chat messages and replies specifically for this meeting section
    const earlierMsgs = this.getMeetingChatHistory(activeMatch.id);

    // Combine initial intro with earlier conversation
    const displayMsgs = [...initialMsgs, ...earlierMsgs];

    displayMsgs.forEach(msg => {
      const bubble = document.createElement('div');
      let typeClass = 'peer';
      let senderName = msg.peerName || peerName;

      if (msg.sender === 'user') {
        typeClass = 'user';
        senderName = `You (${userName})`;
      } else if (msg.sender === 'ai_host') {
        typeClass = 'host';
        senderName = '🦉 Study Commons AI Host';
      }

      bubble.className = `asc-message-bubble ${typeClass}`;
      bubble.innerHTML = `
        <span class="asc-msg-sender">${senderName} • ${msg.timestamp || 'Now'}</span>
        <div>${msg.text}</div>
      `;
      container.appendChild(bubble);
    });

    this.scrollToBottom();
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  bindEvents() {
    const formEl = document.getElementById('form-chat-send');
    if (!formEl) return;

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-user-input');
      const text = input ? input.value.trim() : '';
      if (!text) return;

      const activeMatch = this.getActiveMatch();
      const isAlex = this.currentUser && this.currentUser.id === 'user_alex_202';
      const userName = this.currentUser ? this.currentUser.displayName : 'You';
      const peerName = activeMatch ? activeMatch.peerName : (isAlex ? 'Elena Rostova' : 'Samira Patel');

      const userMsg = {
        id: `msg_${Date.now()}`,
        matchId: activeMatch ? activeMatch.id : null,
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.messages.push(userMsg);
      if (input) input.value = '';
      this.renderMessages();

      if (window.AscAPI && typeof window.AscAPI.sendGreetingMessage === 'function') {
        await window.AscAPI.sendGreetingMessage(userMsg);
      } else {
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, this.messages);
      }

      // Simulated Peer / AI Host Response tailored to active match context
      setTimeout(async () => {
        let replyText = '';
        if (activeMatch && activeMatch.synergyHighlight) {
          const matchReplies = [
            `That sounds like a great plan! ${activeMatch.synergyHighlight}`,
            `Awesome! Let's align on ${activeMatch.course || 'the project'} milestones as soon as we kick off our session.`,
            `I've got the notes ready on my end. Looking forward to synchronizing our work!`
          ];
          replyText = matchReplies[Math.floor(Math.random() * matchReplies.length)];
        } else if (isAlex) {
          const peerReplies = [
            "That shader translucency tweak looks fantastic under the golden hour lighting preset!",
            "I just set up the Niagara fluid emitter for the river stream in UE5! It blends smoothly with your oak canopy shaders.",
            "Awesome idea! Let's pair the 3D foliage models with the ambisonic wetland audio for the film screening."
          ];
          replyText = peerReplies[Math.floor(Math.random() * peerReplies.length)];
        } else {
          const peerReplies = [
            "That GDB layout regs shortcut saved me! I can now step right before the call instruction to verify the 16-byte offset.",
            "Awesome point. Are you free to review the recursive subroutine diagram together tomorrow around 2 PM?",
            "I just ran the same test case in my local assembly file. Everything aligns now on %rsp!"
          ];
          replyText = peerReplies[Math.floor(Math.random() * peerReplies.length)];
        }

        const peerMsg = {
          id: `msg_${Date.now()}`,
          matchId: activeMatch ? activeMatch.id : null,
          sender: 'peer',
          peerName: peerName,
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.messages.push(peerMsg);
        this.renderMessages();

        if (window.AscAPI && typeof window.AscAPI.sendGreetingMessage === 'function') {
          await window.AscAPI.sendGreetingMessage(peerMsg);
        } else {
          await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, this.messages);
        }
      }, 1000);
    });
  }
};
