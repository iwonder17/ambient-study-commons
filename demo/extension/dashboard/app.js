/**
 * Ambient Study Commons (Demo) - Dashboard Application Controller
 * 100% Zero-Backend, Offline-First Client Architecture
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure local storage is initialized with seed data
  if (typeof LocalStore !== 'undefined') {
    await LocalStore.initLocalStorageIfEmpty();
  }

  // State cache
  let currentJournals = [];
  let currentCanvas = [];
  let currentSkills = [];
  let currentDreams = [];
  let currentMatches = [];
  let currentMessages = [];
  let currentPrefs = {};

  // Tab definitions
  const TAB_HEADINGS = {
    journals: { title: 'Learning Journals', sub: 'Personal reflections & autonomous skill synthesis' },
    canvas: { title: 'Canvas LMS Tracker', sub: 'Local syllabus, deadlines & assignment rubrics' },
    skills: { title: 'Skill Profile & Competency', sub: 'Extracted competencies and verified peer trust' },
    dreams: { title: 'Dream Exploration Topics', sub: 'Passionate inquiry and elective self-study goals' },
    matches: { title: 'Peer Study Commons Matching', sub: 'Algorithmic peer pairing based on verified learning context' },
    greeting: { title: 'Study Commons Greeting Room', sub: 'AI-facilitated icebreaker session for verified study pairs' },
    settings: { title: 'Data Management & Privacy', sub: '100% Client-side local control and data exports' }
  };

  // 1. Navigation Controller
  const navButtons = document.querySelectorAll('.asc-nav-item');
  const views = document.querySelectorAll('.asc-view');
  const headingTitle = document.getElementById('page-heading');
  const headingSub = document.getElementById('page-subheading');

  function switchTab(tabId) {
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    views.forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    if (TAB_HEADINGS[tabId]) {
      headingTitle.textContent = TAB_HEADINGS[tabId].title;
      headingSub.textContent = TAB_HEADINGS[tabId].sub;
    }

    if (tabId === 'greeting') {
      scrollChatToBottom();
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // 2. Toast Notifications
  function showDashToast(message, icon = 'info') {
    const container = document.getElementById('asc-dash-toast-container');
    const toast = document.createElement('div');
    toast.className = 'asc-toast';
    toast.style.background = '#18181b';
    toast.style.border = '1px solid #3f3f46';
    toast.style.color = '#fafafa';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '12px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  // 3. Load & Render All Data
  async function reloadAllData() {
    currentJournals = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS) || [];
    currentCanvas = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS) || [];
    currentSkills = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS) || [];
    currentDreams = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS) || [];
    currentMatches = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS) || [];
    currentMessages = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES) || [];
    currentPrefs = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES) || {};

    renderJournals(currentJournals);
    renderCanvas(currentCanvas);
    renderSkills(currentSkills);
    renderDreams(currentDreams);
    renderMatches(currentMatches);
    renderMessages(currentMessages);
    renderSettings(currentPrefs);
    updateBadges();
  }

  function updateBadges() {
    document.getElementById('badge-journal-count').textContent = currentJournals.length;
    document.getElementById('badge-canvas-count').textContent = currentCanvas.length;
    document.getElementById('badge-dreams-count').textContent = currentDreams.length;
    document.getElementById('badge-match-count').textContent = currentMatches.filter(m => m.status === 'pending').length;
    document.getElementById('stat-sessions-count').textContent = currentJournals.length;
    document.getElementById('stat-skills-count').textContent = currentSkills.length;
  }

  // 4. Journals View Renderer
  function renderJournals(list) {
    const container = document.getElementById('journals-list');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a;">No journals recorded yet. Use the extension button or "+ New Journal" above.</div>`;
      return;
    }

    list.forEach(j => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      const skillsHtml = (j.skillsExtracted || []).map(s => `<span class="asc-skill-pill">${s}</span>`).join('');
      
      card.innerHTML = `
        <div class="asc-card-header">
          <div class="asc-card-meta">
            <span class="asc-tag">${j.course || 'Self Study'}</span>
            <span>•</span>
            <span>${j.date || 'Recent'}</span>
          </div>
        </div>
        <div class="asc-card-summary">${j.summary || ''}</div>
        ${j.keyInsight ? `<div class="asc-card-insight"><strong>Key Reflection:</strong> ${j.keyInsight}</div>` : ''}
        <div class="asc-skill-pill-list">${skillsHtml}</div>
      `;
      container.appendChild(card);
    });
  }

  // Search Filter
  document.getElementById('search-journals').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = currentJournals.filter(j => 
      (j.course && j.course.toLowerCase().includes(q)) ||
      (j.summary && j.summary.toLowerCase().includes(q)) ||
      (j.keyInsight && j.keyInsight.toLowerCase().includes(q))
    );
    renderJournals(filtered);
  });

  // Compile Weekly Review Prompt Button
  document.getElementById('btn-trigger-review-prompt').addEventListener('click', async () => {
    try {
      const res = await fetch(chrome.runtime.getURL('prompt/journal_review.txt'));
      const promptTemplate = await res.text();

      const journalDigest = currentJournals.map((j, i) => 
        `[Session ${i + 1} - ${j.date} - ${j.course}]\nSummary: ${j.summary}\nInsight: ${j.keyInsight || 'N/A'}\nSkills: ${(j.skillsExtracted || []).join(', ')}`
      ).join('\n\n');

      const fullPrompt = `${promptTemplate}\n\n=== RECENT LEARNING JOURNALS ===\n\n${journalDigest}`;

      await navigator.clipboard.writeText(fullPrompt);
      showDashToast(`Weekly Review prompt copied! (${currentJournals.length} sessions compiled)`, 'sentiment_calm');
    } catch (e) {
      showDashToast('Compiled offline: ' + e.message, 'sentiment_calm');
    }
  });

  // Manual Journal Add
  document.getElementById('btn-add-manual-journal').addEventListener('click', async () => {
    const summary = prompt('Enter a short reflection summary for this study session:');
    if (!summary) return;

    const course = prompt('Enter course or subject context:', 'CISP-310 Assembly Language') || 'CISP-310';
    const insight = prompt('Enter key insight or breakthrough:', 'Refined stack boundary inspection.') || 'Learned core debugging technique.';

    const newEntry = {
      id: `jrnl_${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      course: course,
      summary: summary,
      keyInsight: insight,
      skillsExtracted: ['Autonomous Inquiry', 'Problem Solving'],
      aiFeedback: 'Manually logged into local commons.'
    };

    currentJournals.unshift(newEntry);
    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, currentJournals);
    renderJournals(currentJournals);
    updateBadges();
    showDashToast('New journal entry saved!', 'book_5');
  });

  // 5. Canvas Tracker Renderer
  function renderCanvas(list) {
    const container = document.getElementById('canvas-reminders-list');
    container.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      const isDone = item.status === 'completed';

      card.innerHTML = `
        <div class="asc-card-header">
          <div class="asc-card-meta">
            <span class="asc-tag">${item.course}</span>
            <span>•</span>
            <span>Due: ${item.due}</span>
            <span>•</span>
            <span>Weight: ${item.gradeWeight || '5%'}</span>
          </div>
          <button class="asc-btn-secondary btn-toggle-canvas" data-id="${item.id}" style="padding: 4px 10px; font-size:11px;">
            ${isDone ? '✓ Completed' : '○ Mark Complete'}
          </button>
        </div>
        <div style="font-size:14px; font-weight:600; text-decoration: ${isDone ? 'line-through' : 'none'}; color: ${isDone ? '#71717a' : '#fafafa'};">
          ${item.title}
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.btn-toggle-canvas').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const target = currentCanvas.find(c => c.id === id);
        if (target) {
          target.status = target.status === 'completed' ? 'pending' : 'completed';
          await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS, currentCanvas);
          renderCanvas(currentCanvas);
          showDashToast(`Status updated: ${target.title}`, 'school');
        }
      });
    });
  }

  document.getElementById('btn-sync-canvas-mock').addEventListener('click', async () => {
    const newAssignment = {
      id: `canvas_${Date.now()}`,
      course: 'CISP-310',
      title: 'Lab 5 - 64-bit Floating Point SSE Registers',
      type: 'assignment',
      due: 'Oct 28, 11:59 PM',
      status: 'pending',
      gradeWeight: '5%'
    };
    currentCanvas.unshift(newAssignment);
    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS, currentCanvas);
    renderCanvas(currentCanvas);
    updateBadges();
    showDashToast('Simulated Canvas sync complete: New Lab 5 discovered', 'owl');
  });

  // 6. Skill Profile Renderer
  function renderSkills(list) {
    const container = document.getElementById('skills-container');
    container.innerHTML = '';

    list.forEach(skill => {
      const item = document.createElement('div');
      item.className = 'asc-skill-item';
      item.innerHTML = `
        <div class="asc-skill-label-wrap">
          <span style="font-weight:600;">${skill.name}</span>
          <span style="color:#a1a1aa;">${skill.confidence}% (${skill.evidenceCount || 1} verified sessions)</span>
        </div>
        <div class="asc-skill-bar-track">
          <div class="asc-skill-bar-fill" style="width: ${skill.confidence}%;"></div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // Re-analyze Skills
  document.getElementById('btn-reanalyze-skills').addEventListener('click', async () => {
    const btn = document.getElementById('btn-reanalyze-skills');
    btn.innerHTML = `<span class="material-symbols-outlined">refresh</span> Analyzing...`;
    btn.disabled = true;

    setTimeout(async () => {
      // Elevate confidence based on number of journals
      currentSkills.forEach(s => {
        s.confidence = Math.min(98, s.confidence + 3);
        s.evidenceCount = (s.evidenceCount || 1) + 1;
      });

      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS, currentSkills);
      renderSkills(currentSkills);
      btn.innerHTML = `<span class="material-symbols-outlined">psychology</span> Re-analyze from Journals`;
      btn.disabled = false;
      showDashToast('Skills re-synthesized from local journals!', 'psychology');
    }, 800);
  });

  // 7. Dream Topics Renderer
  function renderDreams(list) {
    const container = document.getElementById('dreams-list');
    container.innerHTML = '';

    list.forEach(d => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      card.innerHTML = `
        <div class="asc-card-header">
          <span class="asc-tag">${d.course || 'Elective'}</span>
          <span style="font-size:10px; color:#71717a;">${d.date || 'Active'}</span>
        </div>
        <div style="font-size:13px; font-weight:600;">${d.title}</div>
        <div style="font-size:12px; color:#a1a1aa;">${d.description}</div>
      `;
      container.appendChild(card);
    });
  }

  document.getElementById('form-add-dream').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('dream-title').value.trim();
    const desc = document.getElementById('dream-desc').value.trim();
    const course = document.getElementById('dream-course').value.trim();

    if (!title) return;

    const newDream = {
      id: `drm_${Date.now()}`,
      title,
      description: desc,
      course: course || 'Elective',
      date: 'Just now'
    };

    currentDreams.unshift(newDream);
    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS, currentDreams);
    renderDreams(currentDreams);
    updateBadges();

    document.getElementById('dream-title').value = '';
    document.getElementById('dream-desc').value = '';
    showDashToast('Dream exploration topic published locally!', 'rocket_launch');
  });

  // 8. Peer Matching Renderer
  function renderMatches(list) {
    const container = document.getElementById('match-cards-list');
    container.innerHTML = '';

    list.forEach(match => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      card.innerHTML = `
        <div class="asc-card-header">
          <div class="asc-card-meta">
            <span class="asc-tag">${match.course}</span>
            <span>•</span>
            <span style="color:#ffffff; font-weight:700;">${match.matchScore}% Study Compatibility</span>
          </div>
          <span class="asc-badge" style="background:#27272a;">${match.status.toUpperCase()}</span>
        </div>
        <div style="font-size:15px; font-weight:600;">Study Partner: ${match.peerName}</div>
        <div style="font-size:12px; color:#a1a1aa;"><strong>Shared Topics:</strong> ${match.sharedTopics.join(', ')}</div>
        <div style="font-size:12px; color:#a1a1aa;"><strong>Matching Availability:</strong> ${match.mutualFreeTime}</div>
        <div class="asc-btn-group" style="margin-top:6px;">
          <button class="asc-btn-primary btn-enter-room" data-room="${match.roomKey}">
            <span class="material-symbols-outlined">forum</span>
            Enter Greeting Room
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.btn-enter-room').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab('greeting');
      });
    });
  }

  // 9. Greeting Room (Icebreaker) Renderer
  function renderMessages(list) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    list.forEach(msg => {
      const bubble = document.createElement('div');
      let typeClass = 'peer';
      let senderName = 'Alex Rivera';

      if (msg.sender === 'user') {
        typeClass = 'user';
        senderName = 'You (Jordan Lee)';
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

    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  document.getElementById('form-chat-send').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-user-input');
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    const userMsg = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    currentMessages.push(userMsg);
    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, currentMessages);
    renderMessages(currentMessages);
    input.value = '';

    // Simulated Peer / AI Host Response
    setTimeout(async () => {
      const peerReplies = [
        "That GDB layout regs shortcut saved me! I can now step right before the call instruction to verify the 16-byte offset.",
        "Awesome point. Are you free to review the recursive subroutine diagram together tomorrow around 2 PM?",
        "I just ran the same test case in my local assembly file. Everything aligns now on %rsp!"
      ];
      const randomReply = peerReplies[Math.floor(Math.random() * peerReplies.length)];

      const peerMsg = {
        id: `msg_${Date.now()}`,
        sender: 'peer',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      currentMessages.push(peerMsg);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, currentMessages);
      renderMessages(currentMessages);
    }, 1000);
  });

  // 10. Data & Settings Renderer & Actions
  function renderSettings(prefs) {
    document.getElementById('pref-ai-chats').checked = prefs.collectAiChats !== false;
    document.getElementById('pref-canvas-modules').checked = prefs.collectCanvasModules !== false;
    document.getElementById('pref-canvas-grades').checked = prefs.collectCanvasGrades !== false;
  }

  ['pref-ai-chats', 'pref-canvas-modules', 'pref-canvas-grades'].forEach(id => {
    document.getElementById(id).addEventListener('change', async () => {
      currentPrefs.collectAiChats = document.getElementById('pref-ai-chats').checked;
      currentPrefs.collectCanvasModules = document.getElementById('pref-canvas-modules').checked;
      currentPrefs.collectCanvasGrades = document.getElementById('pref-canvas-grades').checked;
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, currentPrefs);
      showDashToast('Preferences saved locally.', 'check_circle');
    });
  });

  // Export JSON (Zero backend, using browser Blob)
  async function exportAllData() {
    const dump = {
      exportVersion: '1.0.0-demo',
      exportedAt: new Date().toISOString(),
      user: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER),
      preferences: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES),
      journals: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS),
      canvasReminders: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS),
      skills: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS),
      dreams: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS),
      invitations: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS),
      messages: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES)
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ambient-study-commons-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showDashToast('Exported all data to JSON!', 'download');
  }

  document.getElementById('btn-export-top').addEventListener('click', exportAllData);
  document.getElementById('btn-export-full').addEventListener('click', exportAllData);

  // Reset to Initial Seed Data
  document.getElementById('btn-reset-seed').addEventListener('click', async () => {
    if (confirm('Reset all demo data back to default offline seed fixtures?')) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.clear();
        await chrome.storage.local.set(LocalStore.DEFAULT_OFFLINE_STATE);
      }
      await reloadAllData();
      showDashToast('Demo state reset to defaults!', 'refresh');
    }
  });

  // Initial load
  await reloadAllData();
});

