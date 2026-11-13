/**
 * Dashboard View - Purpose-Driven Peer Study Commons Matching Tab
 * Features:
 * - Purpose Anchors (Private Project Incubator & Canvas Course Lab/Exam Cram)
 * - Double-Opt-In Mutual Confirmation (both peers must approve)
 * - 24-Hour Expiration Window with live remaining time calculation
 * - AI Host greeting & shared goal discussion
 * - Complementary Superpower / Skill Synergy highlighting
 * - Pre-aligned study meeting windows synchronized with Free Time availability
 * - Greeting Room unlock upon mutual confirmation
 */

window.AscDash = window.AscDash || {};

window.AscDash.MatchesView = {
  matches: [],
  currentFilter: 'all',
  onSwitchToGreeting: null,

  init(onSwitchToGreeting) {
    this.onSwitchToGreeting = onSwitchToGreeting;
    this.bindFilterEvents();
  },

  formatTimeLeft(expiresAt) {
    if (!expiresAt) return '23h 48m left';
    const now = Date.now();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return '23h 48m left';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m left`;
    }
    return `${mins}m left`;
  },

  bindFilterEvents() {
    const filters = [
      { id: 'btn-filter-match-all', key: 'all' },
      { id: 'btn-filter-match-confirmed', key: 'confirmed' },
      { id: 'btn-filter-match-pending', key: 'pending' },
      { id: 'btn-filter-match-actionable', key: 'actionable' }
    ];

    filters.forEach(f => {
      const btn = document.getElementById(f.id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.currentFilter = f.key;
          filters.forEach(other => {
            const b = document.getElementById(other.id);
            if (b) b.classList.toggle('active', other.key === f.key);
          });
          this.renderList();
        });
      }
    });
  },

  updateFilterBadges() {
    const all = this.matches.length;
    const confirmed = this.matches.filter(m => m.status === 'confirmed').length;
    const pending = this.matches.filter(m => m.status === 'pending').length;
    const actionable = this.matches.filter(m => m.status === 'actionable').length;

    const bAll = document.getElementById('badge-filter-match-all');
    const bConf = document.getElementById('badge-filter-match-confirmed');
    const bPend = document.getElementById('badge-filter-match-pending');
    const bAct = document.getElementById('badge-filter-match-actionable');

    if (bAll) bAll.textContent = all;
    if (bConf) bConf.textContent = confirmed;
    if (bPend) bPend.textContent = pending;
    if (bAct) bAct.textContent = actionable;
  },

  render(matches) {
    this.matches = matches || [];
    this.updateFilterBadges();
    this.renderList();
  },

  renderList() {
    const container = document.getElementById('match-cards-list');
    if (!container) return;
    container.innerHTML = '';

    let filtered = this.matches;
    if (this.currentFilter === 'confirmed') {
      filtered = this.matches.filter(m => m.status === 'confirmed');
    } else if (this.currentFilter === 'pending') {
      filtered = this.matches.filter(m => m.status === 'pending');
    } else if (this.currentFilter === 'actionable') {
      filtered = this.matches.filter(m => m.status === 'actionable');
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="asc-card" style="text-align: center; color: var(--text-muted); padding: 36px 20px;">
          <span class="material-symbols-outlined" style="font-size: 36px; color: #52525b; margin-bottom: 8px;">search_off</span>
          <p style="margin: 0; font-size: 14px;">No matches found under this filter category.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(match => {
      const card = this.createMatchCard(match);
      container.appendChild(card);
    });
  },

  createMatchCard(match) {
    const isProject = (match.purposeType === 'wishlist_project');
    const status = match.status || 'actionable';

    const card = document.createElement('div');
    card.className = `asc-match-card asc-card status-${status}`;
    card.setAttribute('data-id', match.id);

    // Purpose Tag & Header Badges
    const purposeIcon = isProject ? 'rocket_launch' : 'menu_book';
    const purposeCat = match.purposeCategory || (isProject ? 'Private Project Incubator' : 'Canvas Course Lab');
    const purposeTagClass = isProject ? 'asc-tag-primary' : 'asc-tag-warning';

    // Status Badge UI
    let statusBadgeHtml = '';
    let timeLeftText = this.formatTimeLeft(match.expiresAt);

    if (status === 'confirmed') {
      statusBadgeHtml = `
        <span class="asc-badge" style="background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); display: flex; align-items: center; gap: 4px;">
          <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span>
          <span>MUTUAL CONFIRMED</span>
        </span>
      `;
    } else if (status === 'pending') {
      statusBadgeHtml = `
        <span class="asc-badge" style="background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); display: flex; align-items: center; gap: 4px;">
          <span class="material-symbols-outlined" style="font-size: 14px;">hourglass_top</span>
          <span>PENDING PEER (${timeLeftText})</span>
        </span>
      `;
    } else if (status === 'expired') {
      statusBadgeHtml = `
        <span class="asc-badge" style="background: rgba(113, 113, 122, 0.2); color: #a1a1aa; border: 1px solid rgba(113, 113, 122, 0.35);">
          <span>EXPIRED (24H PASSED)</span>
        </span>
      `;
    } else {
      statusBadgeHtml = `
        <span class="asc-badge" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3);">
          <span>PROPOSED MATCH</span>
        </span>
      `;
    }

    // Skills chips HTML
    const mySkills = match.mySkills || ['C++20', 'Embedded RTOS', 'Sensor Telemetry'];
    const peerSkills = match.peerSkills || ['Blender Shaders', 'Procedural 3D', 'Field Ecology'];

    const mySkillsHtml = mySkills.map(s => `<span class="asc-skill-pill my-skill">${s}</span>`).join('');
    const peerSkillsHtml = peerSkills.map(s => `<span class="asc-skill-pill peer-skill">${s}</span>`).join('');

    const discussionSnippetHtml = match.discussionSnippet ? `
      <!-- Small Discussion About the Shared Project -->
      <div class="asc-match-discussion-snippet">
        <span class="material-symbols-outlined asc-quote-icon">chat</span>
        <div class="asc-match-quote-text">
          <strong style="color: #93c5fd;">Project Discussion:</strong> "${match.discussionSnippet}"
        </div>
      </div>
    ` : '';

    card.innerHTML = `
      <!-- Card Top: Purpose & Status -->
      <div class="asc-match-header">
        <div class="asc-match-header-left">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span class="asc-tag ${purposeTagClass}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; font-size: 11px;">
              <span class="material-symbols-outlined" style="font-size: 13px;">${purposeIcon}</span>
              <span>${purposeCat}</span>
            </span>
            <span style="font-size: 11.5px; color: var(--text-muted);">${match.course || ''}</span>
          </div>
          <h3 class="asc-match-mission-title">${match.missionTitle || match.course}</h3>
        </div>
        <div class="asc-match-header-right">
          <span class="asc-match-score-pill">${match.matchScore}% Match</span>
          ${statusBadgeHtml}
        </div>
      </div>

      <!-- Partner Profile & Synergy Line -->
      <div class="asc-match-partner-line">
        <div class="asc-match-partner-avatar">${match.peerAvatar || 'PR'}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">
            ${match.peerName} <span style="font-size: 11.5px; font-weight: 400; color: var(--text-muted);">• ${match.peerCollege || 'Peer'}</span>
          </div>
          <div class="asc-match-synergy-line">
            <span class="material-symbols-outlined" style="font-size: 14px; color: #10b981;">bolt</span>
            <span>${match.synergyHighlight || 'Complementary expertise for this project.'}</span>
          </div>
        </div>
      </div>

      ${discussionSnippetHtml}

      <!-- Skills Each Person Brings -->
      <div class="asc-match-skills-matrix">
        <div class="asc-match-skill-row">
          <span class="asc-skill-side-label"><span class="material-symbols-outlined" style="font-size: 13px; color: #60a5fa;">person</span> You bring:</span>
          <div class="asc-skill-chips-wrap">
            ${mySkillsHtml}
          </div>
        </div>
        <div class="asc-match-skill-row">
          <span class="asc-skill-side-label"><span class="material-symbols-outlined" style="font-size: 13px; color: #34d399;">group</span> ${match.peerName.split(' ')[0]} brings:</span>
          <div class="asc-skill-chips-wrap">
            ${peerSkillsHtml}
          </div>
        </div>
      </div>

      <!-- Quick Info Bar (Meeting Time & Session Goal) -->
      <div class="asc-match-info-strip">
        <div class="asc-match-info-item">
          <span class="material-symbols-outlined">calendar_today</span>
          <div>
            <span class="asc-info-label">Proposed Time</span>
            <strong class="asc-info-val">${match.proposedWindow ? match.proposedWindow.split('(')[0].trim() : 'Thursday @ 2:30 PM PST'}</strong>
          </div>
        </div>
        <div class="asc-match-info-item">
          <span class="material-symbols-outlined">schedule</span>
          <div>
            <span class="asc-info-label">Mutual Free Time</span>
            <strong class="asc-info-val">${match.mutualFreeTime || 'Flexible'}</strong>
          </div>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="asc-match-actions-bar">
        ${this.renderActionsForStatus(match)}
      </div>
    `;

    this.attachCardEventListeners(card, match);
    return card;
  },

  renderActionsForStatus(match) {
    const status = match.status || 'actionable';

    if (status === 'confirmed') {
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 12px; color: #34d399; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
            <span>Meeting confirmed for <strong>${match.proposedWindow ? match.proposedWindow.split('(')[0].trim() : 'Scheduled Window'}</strong>!</span>
          </div>
          <button class="asc-btn-primary btn-enter-room" data-room="${match.roomKey}" style="background: #059669; border-color: #10b981; padding: 7px 16px; font-size: 12.5px; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 17px;">forum</span>
            <span>Enter Greeting Room</span>
          </button>
        </div>
      `;
    }

    if (status === 'pending') {
      const timeLeftText = this.formatTimeLeft(match.expiresAt);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 12px; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 16px;">hourglass_top</span>
            <span>Waiting for <strong>${match.peerName}</strong> • Expires in ${timeLeftText}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="asc-btn-secondary btn-simulate-peer-confirm" style="font-size: 11px; padding: 5px 10px; border-color: rgba(59, 130, 246, 0.4); color: #93c5fd;" title="Simulate peer accepting the invite in this demo">
              <span class="material-symbols-outlined" style="font-size: 13px;">auto_mode</span>
              <span>[Demo] Simulate Peer Approval</span>
            </button>
            <button class="asc-btn-secondary btn-cancel-request" style="font-size: 11.5px; padding: 5px 10px;">Cancel</button>
          </div>
        </div>
      `;
    }

    if (status === 'expired') {
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 12px; color: var(--text-muted);">24-hour window passed without response.</span>
          <button class="asc-btn-secondary btn-reopen-match" style="font-size: 11.5px; padding: 5px 12px;">
            <span class="material-symbols-outlined" style="font-size: 14px;">refresh</span>
            <span>Re-send</span>
          </button>
        </div>
      `;
    }

    // Default: 'actionable' / 'new'
    const peerHasConfirmedNote = match.peerConfirmed
      ? `<span style="font-size: 11.5px; color: #60a5fa;">⚡ ${match.peerName.split(' ')[0]} already confirmed!</span>`
      : `<span style="font-size: 11.5px; color: var(--text-muted);">Both peers confirm before session starts</span>`;

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
        <div>${peerHasConfirmedNote}</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="asc-btn-secondary btn-decline-match" style="font-size: 11.5px; padding: 6px 12px;">Not Now</button>
          <button class="asc-btn-primary btn-confirm-match" style="display: flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 12px;">
            <span class="material-symbols-outlined" style="font-size: 15px;">check_circle</span>
            <span>Confirm Invitation</span>
          </button>
        </div>
      </div>
    `;
  },

  attachCardEventListeners(card, match) {
    // 1. Confirm Match
    const btnConfirm = card.querySelector('.btn-confirm-match');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', async () => {
        match.myConfirmed = true;
        if (match.peerConfirmed) {
          match.status = 'confirmed';
          window.AscDash.Toast.show(`Mutual confirmation complete! Meeting scheduled with ${match.peerName}.`, 'event_available');
        } else {
          match.status = 'pending';
          match.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
          window.AscDash.Toast.show(`Invitation sent to ${match.peerName}! Window active for 24 hours.`, 'schedule_send');
        }
        await this.persistMatches();
        this.updateFilterBadges();
        this.renderList();
      });
    }

    // 2. Simulate Peer Approval (Demo Helper)
    const btnSimPeer = card.querySelector('.btn-simulate-peer-confirm');
    if (btnSimPeer) {
      btnSimPeer.addEventListener('click', async () => {
        match.peerConfirmed = true;
        match.status = 'confirmed';
        window.AscDash.Toast.show(`${match.peerName} confirmed! Greeting Room unlocked with AI Host Owl.`, 'how_to_reg');
        await this.persistMatches();
        this.updateFilterBadges();
        this.renderList();
      });
    }

    // 3. Cancel Request
    const btnCancel = card.querySelector('.btn-cancel-request');
    if (btnCancel) {
      btnCancel.addEventListener('click', async () => {
        match.myConfirmed = false;
        match.status = 'actionable';
        match.expiresAt = null;
        window.AscDash.Toast.show('Invitation cancelled.', 'cancel');
        await this.persistMatches();
        this.updateFilterBadges();
        this.renderList();
      });
    }

    // 4. Decline Match
    const btnDecline = card.querySelector('.btn-decline-match');
    if (btnDecline) {
      btnDecline.addEventListener('click', async () => {
        this.matches = this.matches.filter(m => m.id !== match.id);
        window.AscDash.Toast.show('Match dismissed.', 'close');
        await this.persistMatches();
        this.updateFilterBadges();
        this.renderList();
      });
    }

    // 5. Re-open Expired Match
    const btnReopen = card.querySelector('.btn-reopen-match');
    if (btnReopen) {
      btnReopen.addEventListener('click', async () => {
        match.status = 'actionable';
        match.myConfirmed = false;
        match.peerConfirmed = false;
        match.expiresAt = null;
        window.AscDash.Toast.show('Proposal reopened.', 'refresh');
        await this.persistMatches();
        this.updateFilterBadges();
        this.renderList();
      });
    }

    // 6. Enter Greeting Room
    const btnEnter = card.querySelector('.btn-enter-room');
    if (btnEnter) {
      btnEnter.addEventListener('click', () => {
        if (typeof this.onSwitchToGreeting === 'function') {
          this.onSwitchToGreeting();
        }
      });
    }
  },

  async persistMatches() {
    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS, this.matches);
  }
};
