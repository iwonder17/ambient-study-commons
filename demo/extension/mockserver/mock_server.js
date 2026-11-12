/**
 * Ambient Study Commons (Demo) - Mock Backend Server
 * 
 * PURE DUMB SERVER:
 * - Zero DOM manipulation (no HTML, no document, no CSS).
 * - Reads seed data directly from mockserver/mock_data.json on request.
 * - Supports dev controls: toggle auto-pull, wipe data, and on-demand mock data upload.
 * - Emits backend events to clients (content scripts, dashboard tabs) via chrome messaging.
 */

const MockServer = {
  // Recurring Notification Interval: 40 seconds
  notificationIntervalMs: 40000,
  recurringTimer: null,
  isAutoPullEnabled: true,

  // Diverse pool of peer study matches for recurring 40-second alerts
  matchPool: [
    {
      peerName: 'Alex Rivera',
      course: 'CISP-310',
      matchScore: 94,
      sharedTopics: ['x86-64 Subroutines', 'Stack Alignment', 'GDB']
    },
    {
      peerName: 'Taylor Chen',
      course: 'CISP-310',
      matchScore: 92,
      sharedTopics: ['Linux System Calls', 'GDB layout regs']
    },
    {
      peerName: 'Samira Patel',
      course: 'CISP-310',
      matchScore: 96,
      sharedTopics: ['Recursive Factorial', 'Stack Frames']
    },
    {
      peerName: 'Marcus Vance',
      course: 'CISP-310',
      matchScore: 89,
      sharedTopics: ['AMD64 ABI', 'Register Allocation']
    }
  ],
  matchIndex: 0,
  timeline: [],

  // Start server background timers
  async init() {
    console.log('[MockServer] Initializing simulated backend server...');
    
    // Check user preference for auto-pull
    if (typeof LocalStore !== 'undefined') {
      const prefs = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES);
      if (prefs && typeof prefs.autoPullMockData === 'boolean') {
        this.isAutoPullEnabled = prefs.autoPullMockData;
      }
    }

    if (this.isAutoPullEnabled) {
      this.startRecurringNotifications();
    }
  },

  // Fetch clean JSON seed data from mockserver/mock_data.json
  async fetchMockSeedData() {
    try {
      const url = chrome.runtime.getURL('mockserver/mock_data.json');
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      console.error('[MockServer] Error loading mockserver/mock_data.json:', e);
      return null;
    }
  },

  startRecurringNotifications() {
    if (this.recurringTimer) {
      clearInterval(this.recurringTimer);
    }

    const fireNextMatch = async () => {
      if (!this.isAutoPullEnabled) return;

      const match = { ...this.matchPool[this.matchIndex % this.matchPool.length] };
      match.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.matchIndex++;
      await this.broadcastEvent('PEER_MATCH_FOUND', match);
    };

    // Set recurring timer every 40 seconds
    this.recurringTimer = setInterval(fireNextMatch, this.notificationIntervalMs);
  },

  stopRecurringNotifications() {
    if (this.recurringTimer) {
      clearInterval(this.recurringTimer);
      this.recurringTimer = null;
    }
  },

  // Analyze pasted AI session text to extract dynamic competency skills
  extractDynamicSkills(text) {
    const lower = (text || '').toLowerCase();
    const skills = [];
    if (lower.includes('assembly') || lower.includes('x86') || lower.includes('rsp') || lower.includes('rip') || lower.includes('subroutine')) {
      skills.push('x86-64 Assembly');
    }
    if (lower.includes('gdb') || lower.includes('debug') || lower.includes('registers') || lower.includes('breakpoint')) {
      skills.push('GDB Disassembly & Inspection');
    }
    if (lower.includes('stack') || lower.includes('alignment') || lower.includes('frame') || lower.includes('call')) {
      skills.push('Stack Alignment');
    }
    if (lower.includes('c++') || lower.includes('pointer') || lower.includes('memory') || lower.includes('raii') || lower.includes('arena')) {
      skills.push('Modern C++ & Memory Safety');
    }
    if (lower.includes('syscall') || lower.includes('abi') || lower.includes('linux')) {
      skills.push('Linux System Calls & ABI');
    }
    if (lower.includes('verilog') || lower.includes('fpga') || lower.includes('hardware') || lower.includes('alu')) {
      skills.push('Systems Architecture & HDL');
    }
    if (skills.length === 0) {
      skills.push('Autonomous Learning', 'Problem Solving');
    }
    return skills.slice(0, 3);
  },

  // Broadcast an event to all extension views (content scripts and tabs)
  async broadcastEvent(eventType, eventData) {
    console.log(`[MockServer] 🚀 Emitting Backend Event: ${eventType}`, eventData);

    if (typeof LocalStore !== 'undefined') {
      const currentUnread = (await LocalStore.getLocalData('asc_unread_notifications')) || [];
      currentUnread.push({
        id: `notif_${Date.now()}`,
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString()
      });
      await LocalStore.setLocalData('asc_unread_notifications', currentUnread);
    }

    const payload = {
      source: 'MOCK_BACKEND',
      type: 'BACKEND_EVENT',
      event: eventType,
      data: eventData,
      unreadCount: 1
    };

    try {
      chrome.runtime.sendMessage(payload).catch(() => {});
    } catch (e) {}

    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
        }
      }
    } catch (e) {}
  },

  // Process requests sent from frontend clients
  async handleRequest(message, sender) {
    const action = message.action;

    // 1. Ask MockServer to Send Initial / Seed Data from mockserver/mock_data.json
    if (action === 'PULL_MOCK_DATA' || action === 'GET_INITIAL_DATA' || action === 'LOGIN_USER') {
      const allData = await this.fetchMockSeedData();
      let targetData = allData;
      const targetUserId = message.userId || (allData.user ? allData.user.id : 'user_jordan_101');
      if (allData && allData.accounts && allData.accounts[targetUserId]) {
        targetData = allData.accounts[targetUserId];
      }
      if (targetData && typeof LocalStore !== 'undefined') {
        await LocalStore.populateFromSeedData(targetData);
      }
      return { success: true, user: targetData.user, data: targetData };
    }

    // 2. Dev Toggle: Auto Pull Mock Data
    if (action === 'TOGGLE_AUTO_PULL') {
      this.isAutoPullEnabled = !!message.enabled;
      if (this.isAutoPullEnabled) {
        this.startRecurringNotifications();
      } else {
        this.stopRecurringNotifications();
      }
      if (typeof LocalStore !== 'undefined') {
        const prefs = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES)) || {};
        prefs.autoPullMockData = this.isAutoPullEnabled;
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, prefs);
      }
      return { success: true, isAutoPullEnabled: this.isAutoPullEnabled };
    }

    // 3. Save AI Study Session (pure summary chunk without skill processing)
    if (action === 'SAVE_AI_SESSION') {
      const text = message.text || '';

      const sessions = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SESSIONS)) || [];
      const newSession = {
        id: `sess_${Date.now()}`,
        platform: message.platform || 'ambient_demo',
        timestamp: new Date().toISOString(),
        rawText: text
      };
      sessions.unshift(newSession);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.SESSIONS, sessions);

      // Clean summary from text
      let autoSummary = message.summary;
      if (!autoSummary || autoSummary.length < 10) {
        const clean = text.replace(/^[#*\s-]+/gm, '').trim();
        autoSummary = clean.substring(0, 160) + (clean.length > 160 ? '...' : '');
      }

      const journals = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS)) || [];
      const timeStr = message.time || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const newJournal = {
        id: `jrnl_${Date.now()}`,
        date: 'Today',
        time: timeStr,
        summary: autoSummary,
        aiFeedback: 'Captured from ambient study session.'
      };
      journals.unshift(newJournal);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, journals);

      // Bump trust score for active study reflection
      const user = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
      if (user && typeof user.trustScore === 'number') {
        user.trustScore = Math.min(1000, user.trustScore + 6);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER, user);
      }

      // Broadcast backend event to all active extension tabs and views
      await this.broadcastEvent('SESSION_SAVED', {
        summary: newJournal.summary,
        time: timeStr,
        trustScore: user?.trustScore
      });

      return { success: true, session: newSession, journal: newJournal, trustScore: user?.trustScore };
    }

    // 4. Compile Weekly Review Prompt
    if (action === 'GET_JOURNALS_FOR_REVIEW') {
      const journals = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS)) || [];
      const promptRes = await fetch(chrome.runtime.getURL('prompt/journal_review.txt'));
      const promptTemplate = await promptRes.text();

      const formattedJournals = journals.map((j, idx) => 
        `[Session ${idx + 1} - ${j.date} - ${j.course}]\nSummary: ${j.summary}\nInsight: ${j.keyInsight}\nSkills: ${(j.skillsExtracted || []).join(', ')}`
      ).join('\n\n');

      const combinedPrompt = `${promptTemplate}\n\n=== RECENT LEARNING JOURNALS ===\n\n${formattedJournals}`;
      return { success: true, text: combinedPrompt, count: journals.length };
    }

    // 5. Clear Notifications
    if (action === 'CLEAR_NOTIFICATIONS') {
      await LocalStore.setLocalData('asc_unread_notifications', []);
      return { success: true, unreadCount: 0 };
    }

    // 6. Manual Trigger Event (for dev simulation)
    if (action === 'TRIGGER_MOCK_EVENT') {
      const match = { ...this.matchPool[this.matchIndex % this.matchPool.length] };
      match.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.matchIndex++;
      await this.broadcastEvent('PEER_MATCH_FOUND', match);
      return { success: true };
    }

    return null;
  }
};

// Global export for service worker / background
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MockServer };
} else if (typeof globalThis !== 'undefined') {
  globalThis.MockServer = MockServer;
}

