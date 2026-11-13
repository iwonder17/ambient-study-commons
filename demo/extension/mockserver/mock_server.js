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
      peerName: 'Devon Brooks',
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

  // Default theme settings for persona accounts
  userThemes: {
    'user_jordan_101': {
      themePreset: 'slate',
      themeName: 'Nordic Slate',
      accentColor: '#64748b',
      cardRadius: 'standard',
      ambientGlow: true
    },
    'user_alex_202': {
      themePreset: 'amethyst',
      themeName: 'Cosmic Amethyst',
      accentColor: '#a855f7',
      cardRadius: 'standard',
      ambientGlow: true
    }
  },

  // Function to return user picked theme in user data
  async getUserPickedTheme(userId) {
    let targetId = userId;
    if (!targetId && typeof LocalStore !== 'undefined') {
      const activeUser = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
      if (activeUser && activeUser.id) targetId = activeUser.id;
    }
    targetId = targetId || 'user_jordan_101';

    // 1. Check MockServer in-memory state
    if (this.userThemes && this.userThemes[targetId]) {
      return { ...this.userThemes[targetId] };
    }

    // 2. Check LocalStore saved student profile
    if (typeof LocalStore !== 'undefined') {
      const profile = await LocalStore.getStudentProfileData(targetId);
      if (profile && profile.user && profile.user.preferredTheme) {
        this.userThemes[targetId] = { ...profile.user.preferredTheme };
        return { ...profile.user.preferredTheme };
      }
      if (profile && profile.preferences && profile.preferences.themePreset) {
        const pTheme = {
          themePreset: profile.preferences.themePreset,
          themeName: profile.preferences.themePreset === 'slate' ? 'Nordic Slate' : (profile.preferences.themePreset === 'amethyst' ? 'Cosmic Amethyst' : profile.preferences.themePreset),
          accentColor: profile.preferences.accentColor || (targetId === 'user_jordan_101' ? '#64748b' : '#a855f7'),
          cardRadius: profile.preferences.cardRadius || 'standard',
          ambientGlow: profile.preferences.ambientGlow !== false
        };
        this.userThemes[targetId] = pTheme;
        return pTheme;
      }
    }

    // 3. Fallback to mock_data.json seed fixture
    const allData = await this.fetchMockSeedData();
    if (allData && allData.accounts && allData.accounts[targetId]) {
      const acc = allData.accounts[targetId];
      if (acc.user && acc.user.preferredTheme) {
        this.userThemes[targetId] = { ...acc.user.preferredTheme };
        return { ...acc.user.preferredTheme };
      }
      if (acc.preferences && acc.preferences.themePreset) {
        const sTheme = {
          themePreset: acc.preferences.themePreset,
          themeName: acc.preferences.themePreset === 'slate' ? 'Nordic Slate' : (acc.preferences.themePreset === 'amethyst' ? 'Cosmic Amethyst' : acc.preferences.themePreset),
          accentColor: acc.preferences.accentColor || (targetId === 'user_jordan_101' ? '#64748b' : '#a855f7'),
          cardRadius: acc.preferences.cardRadius || 'standard',
          ambientGlow: acc.preferences.ambientGlow !== false
        };
        this.userThemes[targetId] = sTheme;
        return sTheme;
      }
    }

    // 4. Default by persona (Jordan: Nordic Slate, Alex: Cosmic Amethyst)
    const fallbackTheme = (targetId === 'user_jordan_101') ? {
      themePreset: 'slate',
      themeName: 'Nordic Slate',
      accentColor: '#64748b',
      cardRadius: 'standard',
      ambientGlow: true
    } : {
      themePreset: 'amethyst',
      themeName: 'Cosmic Amethyst',
      accentColor: '#a855f7',
      cardRadius: 'standard',
      ambientGlow: true
    };
    this.userThemes[targetId] = fallbackTheme;
    return fallbackTheme;
  },

  // Save / persist user picked theme in user data on MockServer
  async saveUserPickedTheme(userId, themeData) {
    let targetId = userId;
    if (!targetId && typeof LocalStore !== 'undefined') {
      const activeUser = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
      if (activeUser && activeUser.id) targetId = activeUser.id;
    }
    targetId = targetId || 'user_jordan_101';
    if (!themeData) return null;

    const defaultTheme = (targetId === 'user_jordan_101')
      ? { themePreset: 'slate', themeName: 'Nordic Slate', accentColor: '#64748b' }
      : { themePreset: 'amethyst', themeName: 'Cosmic Amethyst', accentColor: '#a855f7' };

    const normalizedTheme = {
      themePreset: themeData.themePreset || defaultTheme.themePreset,
      themeName: themeData.themeName || (themeData.themePreset === 'slate' ? 'Nordic Slate' : (themeData.themePreset === 'amethyst' ? 'Cosmic Amethyst' : themeData.themePreset)),
      accentColor: themeData.accentColor || defaultTheme.accentColor,
      cardRadius: themeData.cardRadius || 'standard',
      ambientGlow: themeData.ambientGlow !== false
    };

    this.userThemes[targetId] = normalizedTheme;

    // Persist to LocalStore for active user, preferences & student profiles
    if (typeof LocalStore !== 'undefined') {
      const activeUser = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
      if (activeUser && activeUser.id === targetId) {
        activeUser.preferredTheme = normalizedTheme;
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER, activeUser);
      }

      const prefs = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES)) || {};
      prefs.themePreset = normalizedTheme.themePreset;
      prefs.accentColor = normalizedTheme.accentColor;
      prefs.cardRadius = normalizedTheme.cardRadius;
      prefs.ambientGlow = normalizedTheme.ambientGlow;
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, prefs);

      const profilesMap = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP)) || {};
      if (profilesMap[targetId]) {
        profilesMap[targetId].user = profilesMap[targetId].user || {};
        profilesMap[targetId].user.preferredTheme = normalizedTheme;
        profilesMap[targetId].preferences = profilesMap[targetId].preferences || {};
        profilesMap[targetId].preferences.themePreset = normalizedTheme.themePreset;
        profilesMap[targetId].preferences.accentColor = normalizedTheme.accentColor;
        profilesMap[targetId].preferences.cardRadius = normalizedTheme.cardRadius;
        profilesMap[targetId].preferences.ambientGlow = normalizedTheme.ambientGlow;
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP, profilesMap);
      }
    }

    console.log(`[MockServer] Persisted picked theme for student ${targetId}:`, normalizedTheme);
    return normalizedTheme;
  },

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
      const targetUserId = message.userId || (allData && allData.user ? allData.user.id : 'user_jordan_101');
      if (allData && allData.accounts && allData.accounts[targetUserId]) {
        targetData = JSON.parse(JSON.stringify(allData.accounts[targetUserId]));
      } else if (allData && allData.user && allData.user.id === targetUserId) {
        targetData = JSON.parse(JSON.stringify(allData));
      }

      // Attach user picked theme to user data
      const userTheme = await this.getUserPickedTheme(targetUserId);
      if (targetData && targetData.user) {
        targetData.user.preferredTheme = userTheme;
      }
      if (targetData && targetData.preferences) {
        targetData.preferences.themePreset = userTheme.themePreset;
        targetData.preferences.accentColor = userTheme.accentColor;
        targetData.preferences.cardRadius = userTheme.cardRadius;
        targetData.preferences.ambientGlow = userTheme.ambientGlow;
      }

      if (targetData && typeof LocalStore !== 'undefined') {
        await LocalStore.populateFromSeedData(targetData);
      }
      return { success: true, user: targetData ? targetData.user : null, data: targetData, theme: userTheme };
    }

    // 1b. Return user picked theme in user data
    if (action === 'GET_USER_THEME' || action === 'GET_USER_PICKED_THEME') {
      const targetUserId = message.userId;
      const theme = await this.getUserPickedTheme(targetUserId);
      return { success: true, userId: targetUserId, theme: theme };
    }

    // 1c. Save user picked theme in user data to MockServer
    if (action === 'SAVE_USER_THEME' || action === 'SAVE_USER_PICKED_THEME') {
      const targetUserId = message.userId;
      const themeData = message.theme || message.themeData || message.preferences;
      const savedTheme = await this.saveUserPickedTheme(targetUserId, themeData);
      return { success: true, userId: targetUserId, theme: savedTheme };
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

    // 7. Fetch Canvas Data from mockserver for active student
    if (action === 'FETCH_CANVAS_DATA' || action === 'SYNC_CANVAS_COURSES') {
      const targetUserId = message.userId || 'user_jordan_101';
      const studentFolder = (targetUserId === 'user_alex_202') ? 'student_2' : 'student_1';
      try {
        const getUrl = (relPath) => (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
          ? chrome.runtime.getURL(`mockserver/canvas data/${studentFolder}/${relPath}`)
          : `../mockserver/canvas data/${studentFolder}/${relPath}`;

        const [resCurrent, resPrevious, resProfile] = await Promise.all([
          fetch(getUrl('current courses/current_courses.json')).catch(() => null),
          fetch(getUrl('previous course/previous_courses.json')).catch(() => null),
          fetch(getUrl('canvas_student_profile.json')).catch(() => null)
        ]);

        const currentData = resCurrent && resCurrent.ok ? await resCurrent.json() : null;
        const previousData = resPrevious && resPrevious.ok ? await resPrevious.json() : null;
        const profileData = resProfile && resProfile.ok ? await resProfile.json() : null;

        return {
          success: true,
          userId: targetUserId,
          courses: currentData ? currentData.courses : [],
          previousCourses: previousData ? previousData.courses : [],
          previousSummary: previousData ? previousData.summary : null,
          profile: profileData ? profileData.student : null,
          semester: currentData ? currentData.term : 'Fall 2026'
        };
      } catch (err) {
        console.error('[MockServer] Failed to fetch canvas data:', err);
        return { success: false, error: err.toString() };
      }
    }

    // 8. Save Student Profile Free Time
    if (action === 'SAVE_STUDENT_FREETIME') {
      const targetUserId = message.userId || 'user_jordan_101';
      const freetimeData = message.freetime;
      if (typeof LocalStore !== 'undefined' && freetimeData) {
        await LocalStore.saveStudentFreeTime(targetUserId, freetimeData);
      }
      return { success: true, userId: targetUserId, freetime: freetimeData };
    }

    // 9. Get Student Profile Free Time
    if (action === 'GET_STUDENT_FREETIME') {
      const targetUserId = message.userId || 'user_jordan_101';
      let freetime = null;
      if (typeof LocalStore !== 'undefined') {
        freetime = await LocalStore.getStudentFreeTime(targetUserId);
      }
      return { success: true, userId: targetUserId, freetime: freetime };
    }

    // 10. GET_DASHBOARD_DATA (Consolidated endpoint for entire dashboard view tree)
    if (action === 'GET_DASHBOARD_DATA') {
      if (typeof LocalStore === 'undefined') {
        return { success: false, error: 'LocalStore unavailable' };
      }
      const [journals, canvas, skills, dreams, matches, messages, prefs, user, freetime] = await Promise.all([
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER),
        LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.FREETIME)
      ]);

      const seedData = await this.fetchMockSeedData();
      const communityActivities = seedData?.communityActivities || [];

      // If user is logged out, clear active student-specific views
      if (!user || !user.id) {
        return {
          success: true,
          data: {
            user: null,
            journals: journals || [],
            canvas: [],
            skills: [],
            dreams: [],
            matches: [],
            messages: [],
            communityActivities: [],
            preferences: prefs || {},
            freetime: null
          }
        };
      }

      let activeFreetime = freetime;
      if (typeof LocalStore.getStudentFreeTime === 'function') {
        const saved = await LocalStore.getStudentFreeTime(user.id);
        if (saved) activeFreetime = saved;
      }

      // Attach user picked theme to returned dashboard user and preferences
      const pickedTheme = await this.getUserPickedTheme(user.id);
      user.preferredTheme = pickedTheme;
      if (prefs) {
        prefs.themePreset = pickedTheme.themePreset;
        prefs.accentColor = pickedTheme.accentColor;
        prefs.cardRadius = pickedTheme.cardRadius;
        prefs.ambientGlow = pickedTheme.ambientGlow;
      }

      return {
        success: true,
        data: {
          user: user,
          journals: journals || [],
          canvas: canvas || [],
          skills: skills || [],
          dreams: dreams || [],
          matches: matches || [],
          messages: messages || [],
          communityActivities: communityActivities,
          preferences: prefs || {},
          freetime: activeFreetime || null
        }
      };
    }

    // 11. SAVE_JOURNAL (Creates or updates a learning journal through the backend)
    if (action === 'SAVE_JOURNAL') {
      if (typeof LocalStore === 'undefined') {
        return { success: false, error: 'LocalStore unavailable' };
      }
      const entry = message.journal || {};
      const journals = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS)) || [];
      
      const newEntry = {
        id: entry.id || `jrnl_${Date.now()}`,
        date: entry.date || 'Today',
        time: entry.time || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        title: entry.title || '',
        summary: entry.summary || '',
        keyInsight: entry.keyInsight || '',
        course: entry.course || 'Independent Reflection',
        isManual: !!entry.isManual,
        aiFeedback: entry.aiFeedback || 'Saved via MockServer internal API.'
      };

      journals.unshift(newEntry);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, journals);

      // Award trust points
      const user = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
      if (user && typeof user.trustScore === 'number') {
        user.trustScore = Math.min(1000, user.trustScore + 6);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER, user);
      }

      await this.broadcastEvent('JOURNAL_SAVED', { journal: newEntry, trustScore: user?.trustScore });
      return { success: true, journal: newEntry, trustScore: user?.trustScore };
    }

    // 12. DELETE_JOURNAL (Removes journal by ID)
    if (action === 'DELETE_JOURNAL') {
      if (typeof LocalStore === 'undefined') {
        return { success: false, error: 'LocalStore unavailable' };
      }
      const journalId = message.journalId;
      let journals = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS)) || [];
      journals = journals.filter(j => j.id !== journalId);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, journals);
      return { success: true, deletedId: journalId };
    }

    // 13. SAVE_PREFERENCES (Updates app settings and privacy toggles)
    if (action === 'SAVE_PREFERENCES') {
      if (typeof LocalStore === 'undefined') {
        return { success: false, error: 'LocalStore unavailable' };
      }
      const newPrefs = message.preferences || {};
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, newPrefs);

      // Persist picked theme to user data on MockServer if theme properties are present
      if (newPrefs.themePreset || newPrefs.accentColor || newPrefs.cardRadius || typeof newPrefs.ambientGlow !== 'undefined') {
        const activeUser = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
        const targetId = message.userId || (activeUser ? activeUser.id : 'user_jordan_101');
        await this.saveUserPickedTheme(targetId, newPrefs);
      }

      return { success: true, preferences: newPrefs };
    }

    // 14. SEND_GREETING_MESSAGE (Appends chat message to Icebreaker Greeting Room)
    if (action === 'SEND_GREETING_MESSAGE') {
      if (typeof LocalStore === 'undefined') {
        return { success: false, error: 'LocalStore unavailable' };
      }
      const msg = message.message || {};
      const roomMessages = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES)) || [];
      const newMsg = {
        id: msg.id || `msg_${Date.now()}`,
        sender: msg.sender || 'Jordan Lee',
        role: msg.role || 'user',
        peerName: msg.peerName || null,
        matchId: msg.matchId || null,
        text: msg.text || '',
        timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      roomMessages.push(newMsg);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, roomMessages);
      await this.broadcastEvent('ROOM_MESSAGE_RECEIVED', newMsg);
      return { success: true, message: newMsg };
    }

    // 15. SAVE_DREAM / DELETE_DREAM
    if (action === 'SAVE_DREAM') {
      if (typeof LocalStore === 'undefined') return { success: false, error: 'LocalStore unavailable' };
      const dreams = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS)) || [];
      const newDream = message.dream;
      if (newDream) {
        dreams.unshift(newDream);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS, dreams);
      }
      return { success: true, dream: newDream };
    }

    if (action === 'DELETE_DREAM') {
      if (typeof LocalStore === 'undefined') return { success: false, error: 'LocalStore unavailable' };
      let dreams = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS)) || [];
      dreams = dreams.filter(d => d.id !== message.dreamId);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS, dreams);
      return { success: true, deletedId: message.dreamId };
    }

    // 16. CLEAR_ALL_DATA (Full reset)
    if (action === 'CLEAR_ALL_DATA') {
      if (typeof LocalStore === 'undefined') return { success: false, error: 'LocalStore unavailable' };
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, []);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.SESSIONS, []);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, []);
      return { success: true };
    }

    return null;
  }
};

// Aliases for convenience
MockServer.getUserTheme = MockServer.getUserPickedTheme;
MockServer.setUserTheme = MockServer.saveUserPickedTheme;

// Global export for service worker / background
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MockServer };
} else if (typeof globalThis !== 'undefined') {
  globalThis.MockServer = MockServer;
}

