/**
 * Ambient Study Commons (Demo) - Local Storage Helper
 * Ultra-slim local storage abstraction.
 * Pure storage manager: seed fixtures live cleanly in mock_data.json!
 */

const LOCAL_STORAGE_KEYS = {
  USER: 'asc_user',
  PREFERENCES: 'asc_preferences',
  FREETIME: 'asc_freetime',
  STUDENT_FREETIME_MAP: 'asc_student_freetime_map',
  STUDENT_PROFILES_MAP: 'asc_student_profiles_map',
  SESSIONS: 'asc_sessions',
  JOURNALS: 'asc_journals',
  SKILLS: 'asc_skills',
  DREAMS: 'asc_dreams',
  CANVAS_REMINDERS: 'asc_canvas_reminders',
  INVITATIONS: 'asc_invitations',
  ROOM_MESSAGES: 'asc_room_messages',
  BUTTON_POSITION: 'asc_button_position',
  UNREAD_NOTIFICATIONS: 'asc_unread_notifications'
};

// Check if storage is completely empty
async function isStorageEmpty() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const all = await chrome.storage.local.get(null);
    return !all || Object.keys(all).length === 0;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.length === 0;
  }
  return true;
}

// Initialize storage for fresh install (fresh, empty active data with persona profiles ready for Google Login)
async function initializeFreshLoggedOutStorage(data) {
  const profilesMap = {};
  if (data && data.accounts) {
    for (const [uid, acc] of Object.entries(data.accounts)) {
      profilesMap[uid] = {
        user: acc.user,
        preferences: acc.preferences || { autoPullMockData: true },
        journals: acc.journals || [],
        canvasReminders: acc.canvasReminders || [],
        skills: acc.skills || [],
        dreams: acc.dreams || [],
        invitations: acc.invitations || [],
        roomMessages: acc.roomMessages || [],
        freetime: acc.freetime || null
      };
    }
  } else if (data && data.user) {
    profilesMap[data.user.id] = {
      user: data.user,
      preferences: data.preferences || { autoPullMockData: true },
      journals: data.journals || [],
      canvasReminders: data.canvasReminders || [],
      skills: data.skills || [],
      dreams: data.dreams || [],
      invitations: data.invitations || [],
      roomMessages: data.roomMessages || [],
      freetime: data.freetime || null
    };
  }

  const freshMap = {
    [LOCAL_STORAGE_KEYS.USER]: null,
    [LOCAL_STORAGE_KEYS.PREFERENCES]: { autoPullMockData: true },
    [LOCAL_STORAGE_KEYS.JOURNALS]: [],
    [LOCAL_STORAGE_KEYS.SKILLS]: [],
    [LOCAL_STORAGE_KEYS.DREAMS]: [],
    [LOCAL_STORAGE_KEYS.CANVAS_REMINDERS]: [],
    [LOCAL_STORAGE_KEYS.INVITATIONS]: [],
    [LOCAL_STORAGE_KEYS.ROOM_MESSAGES]: [],
    [LOCAL_STORAGE_KEYS.FREETIME]: null,
    [LOCAL_STORAGE_KEYS.UNREAD_NOTIFICATIONS]: [],
    [LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP]: profilesMap
  };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set(freshMap);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    for (const [k, v] of Object.entries(freshMap)) {
      window.localStorage.setItem(k, JSON.stringify(v));
    }
  }
  console.log('[LocalStore] Storage successfully initialized in fresh, logged-out state with Google profiles ready.');
}

// Initialize storage by requesting seed data from MockServer / mock_data.json
async function initLocalStorageIfEmpty() {
  const empty = await isStorageEmpty();
  if (empty) {
    console.log('[LocalStore] Storage is empty (fresh install). Initializing clean logged-out state with Google profiles ready...');
    try {
      const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('mockserver/mock_data.json')
        : '../mockserver/mock_data.json';
      const res = await fetch(url);
      const data = await res.json();
      await initializeFreshLoggedOutStorage(data);
    } catch (e) {
      console.error('[LocalStore] Failed to load mockserver/mock_data.json for fresh install:', e);
      await initializeFreshLoggedOutStorage(null);
    }
  }
}

// Snapshot active user's full data into their isolated student store
async function saveActiveUserProfile() {
  const user = await getLocalData(LOCAL_STORAGE_KEYS.USER);
  if (!user || !user.id) return;
  const userId = user.id;

  const [journals, canvas, skills, dreams, invitations, messages, freetime, prefs] = await Promise.all([
    getLocalData(LOCAL_STORAGE_KEYS.JOURNALS),
    getLocalData(LOCAL_STORAGE_KEYS.CANVAS_REMINDERS),
    getLocalData(LOCAL_STORAGE_KEYS.SKILLS),
    getLocalData(LOCAL_STORAGE_KEYS.DREAMS),
    getLocalData(LOCAL_STORAGE_KEYS.INVITATIONS),
    getLocalData(LOCAL_STORAGE_KEYS.ROOM_MESSAGES),
    getLocalData(LOCAL_STORAGE_KEYS.FREETIME),
    getLocalData(LOCAL_STORAGE_KEYS.PREFERENCES)
  ]);

  if (prefs && prefs.themePreset) {
    user.preferredTheme = {
      themePreset: prefs.themePreset,
      themeName: prefs.themePreset === 'slate' ? 'Nordic Slate' : (prefs.themePreset === 'amethyst' ? 'Cosmic Amethyst' : prefs.themePreset),
      accentColor: prefs.accentColor || (userId === 'user_jordan_101' ? '#64748b' : '#a855f7'),
      cardRadius: prefs.cardRadius || 'standard',
      ambientGlow: prefs.ambientGlow !== false
    };
  }

  const profileSnapshot = {
    user,
    preferences: prefs || null,
    journals: journals || [],
    canvasReminders: canvas || [],
    skills: skills || [],
    dreams: dreams || [],
    invitations: invitations || [],
    roomMessages: messages || [],
    freetime: freetime || null
  };

  const profilesMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP)) || {};
  profilesMap[userId] = profileSnapshot;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP]: profilesMap,
      [`asc_student_profile_${userId}`]: profileSnapshot
    });
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP, JSON.stringify(profilesMap));
    window.localStorage.setItem(`asc_student_profile_${userId}`, JSON.stringify(profileSnapshot));
  }
  console.log(`[LocalStore] Saved isolated character profile snapshot for ${userId} (${user.displayName})`);
}

// Retrieve isolated character profile data
async function getStudentProfileData(userId) {
  if (!userId) return null;
  const profilesMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP)) || {};
  if (profilesMap[userId]) return profilesMap[userId];
  return await getLocalData(`asc_student_profile_${userId}`);
}

// Populate storage keys from a parsed mock data object
async function populateFromSeedData(data) {
  if (!data) return;

  const userId = data.user ? data.user.id : null;

  // Check if this student already has saved profile data in local storage
  let savedProfile = null;
  if (userId) {
    savedProfile = await getStudentProfileData(userId);
  }

  const userJournals = (savedProfile && savedProfile.journals) ? savedProfile.journals : (data.journals || []);
  const userSkills = (savedProfile && savedProfile.skills) ? savedProfile.skills : (data.skills || []);
  const userDreams = (savedProfile && savedProfile.dreams) ? savedProfile.dreams : (data.dreams || []);
  const userCanvas = (savedProfile && savedProfile.canvasReminders) ? savedProfile.canvasReminders : (data.canvasReminders || []);
  const userInvitations = (savedProfile && savedProfile.invitations) ? savedProfile.invitations : (data.invitations || []);
  const userMessages = (savedProfile && savedProfile.roomMessages) ? savedProfile.roomMessages : (data.roomMessages || []);
  let userFreetime = (savedProfile && savedProfile.freetime) ? savedProfile.freetime : data.freetime;

  // Retrieve student's personal saved free time if they previously customized it
  if (userId && !userFreetime) {
    const studentMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_FREETIME_MAP)) || {};
    if (studentMap[userId]) {
      userFreetime = studentMap[userId];
    } else {
      const perUserKey = await getLocalData(`asc_freetime_${userId}`);
      if (perUserKey) userFreetime = perUserKey;
    }
  }

  const userPrefs = (savedProfile && savedProfile.preferences) ? savedProfile.preferences : (data.preferences || { autoPullMockData: true });
  const userData = (savedProfile && savedProfile.user) ? savedProfile.user : (data.user || null);
  if (userData && userPrefs && userPrefs.themePreset) {
    userData.preferredTheme = {
      themePreset: userPrefs.themePreset,
      themeName: userPrefs.themePreset === 'slate' ? 'Nordic Slate' : (userPrefs.themePreset === 'amethyst' ? 'Cosmic Amethyst' : userPrefs.themePreset),
      accentColor: userPrefs.accentColor || (userId === 'user_jordan_101' ? '#64748b' : '#a855f7'),
      cardRadius: userPrefs.cardRadius || 'standard',
      ambientGlow: userPrefs.ambientGlow !== false
    };
  }

  const storageMap = {
    [LOCAL_STORAGE_KEYS.USER]: userData,
    [LOCAL_STORAGE_KEYS.PREFERENCES]: userPrefs,
    [LOCAL_STORAGE_KEYS.JOURNALS]: userJournals,
    [LOCAL_STORAGE_KEYS.SKILLS]: userSkills,
    [LOCAL_STORAGE_KEYS.DREAMS]: userDreams,
    [LOCAL_STORAGE_KEYS.CANVAS_REMINDERS]: userCanvas,
    [LOCAL_STORAGE_KEYS.INVITATIONS]: userInvitations,
    [LOCAL_STORAGE_KEYS.ROOM_MESSAGES]: userMessages,
    [LOCAL_STORAGE_KEYS.FREETIME]: userFreetime || {
      days: ['Tue', 'Thu'],
      slots: ['Afternoon'],
      startTime: '14:00',
      endTime: '16:30',
      summary: 'Tuesdays & Thursdays, 2:00 PM - 4:30 PM'
    },
    [LOCAL_STORAGE_KEYS.UNREAD_NOTIFICATIONS]: []
  };

  // Ensure the student freetime map preserves this student's schedule
  if (userId) {
    const studentMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_FREETIME_MAP)) || {};
    if (userFreetime) {
      studentMap[userId] = userFreetime;
      storageMap[LOCAL_STORAGE_KEYS.STUDENT_FREETIME_MAP] = studentMap;
      storageMap[`asc_freetime_${userId}`] = userFreetime;
    }

    const profilesMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP)) || {};
    profilesMap[userId] = {
      user: data.user,
      journals: userJournals,
      skills: userSkills,
      dreams: userDreams,
      canvasReminders: userCanvas,
      invitations: userInvitations,
      roomMessages: userMessages,
      freetime: userFreetime
    };
    storageMap[LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP] = profilesMap;
    storageMap[`asc_student_profile_${userId}`] = profilesMap[userId];
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set(storageMap);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    for (const [k, v] of Object.entries(storageMap)) {
      window.localStorage.setItem(k, JSON.stringify(v));
    }
  }
  console.log('[LocalStore] Successfully populated storage for user:', data.user ? data.user.displayName : 'Empty');
}

// Save free time for a specific student profile
async function saveStudentFreeTime(userId, freetimeData) {
  if (!userId || !freetimeData) return;
  const studentMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_FREETIME_MAP)) || {};
  studentMap[userId] = JSON.parse(JSON.stringify(freetimeData));
  await setLocalData(LOCAL_STORAGE_KEYS.STUDENT_FREETIME_MAP, studentMap);
  await setLocalData(`asc_freetime_${userId}`, freetimeData);
  console.log(`[LocalStore] Saved student free time for ${userId}:`, freetimeData.summary);
}

// Retrieve saved free time for a specific student profile
async function getStudentFreeTime(userId) {
  if (!userId) return null;
  const studentMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_FREETIME_MAP)) || {};
  if (studentMap[userId]) return studentMap[userId];
  return await getLocalData(`asc_freetime_${userId}`);
}

// Clear all student data on logout (keeps storage initialized with empty lists)
async function clearAllUserData() {
  const emptyMap = {
    [LOCAL_STORAGE_KEYS.USER]: null,
    [LOCAL_STORAGE_KEYS.JOURNALS]: [],
    [LOCAL_STORAGE_KEYS.SKILLS]: [],
    [LOCAL_STORAGE_KEYS.DREAMS]: [],
    [LOCAL_STORAGE_KEYS.CANVAS_REMINDERS]: [],
    [LOCAL_STORAGE_KEYS.INVITATIONS]: [],
    [LOCAL_STORAGE_KEYS.ROOM_MESSAGES]: [],
    [LOCAL_STORAGE_KEYS.FREETIME]: null,
    [LOCAL_STORAGE_KEYS.UNREAD_NOTIFICATIONS]: []
  };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set(emptyMap);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    for (const [k, v] of Object.entries(emptyMap)) {
      window.localStorage.setItem(k, JSON.stringify(v));
    }
  }
  console.log('[LocalStore] All student data cleared on logout.');
}

// Wipe all data completely from storage (for dev testing)
async function wipeAllLocalData() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.clear();
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
  console.log('[LocalStore] All local data wiped cleanly.');
}

// Get data for a key
async function getLocalData(key) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(key);
    return res[key] || null;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(key);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return raw;
    }
  }
  return null;
}

// Set data for a key
async function setLocalData(key, value) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [key]: value });
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  // If this key is a student-specific property, mirror it to the active student's isolated profile
  const studentKeys = [
    LOCAL_STORAGE_KEYS.JOURNALS,
    LOCAL_STORAGE_KEYS.SKILLS,
    LOCAL_STORAGE_KEYS.DREAMS,
    LOCAL_STORAGE_KEYS.CANVAS_REMINDERS,
    LOCAL_STORAGE_KEYS.INVITATIONS,
    LOCAL_STORAGE_KEYS.ROOM_MESSAGES,
    LOCAL_STORAGE_KEYS.FREETIME
  ];

  if (studentKeys.includes(key)) {
    try {
      const activeUser = await getLocalData(LOCAL_STORAGE_KEYS.USER);
      if (activeUser && activeUser.id) {
        const userId = activeUser.id;
        const keyPropMap = {
          [LOCAL_STORAGE_KEYS.JOURNALS]: 'journals',
          [LOCAL_STORAGE_KEYS.SKILLS]: 'skills',
          [LOCAL_STORAGE_KEYS.DREAMS]: 'dreams',
          [LOCAL_STORAGE_KEYS.CANVAS_REMINDERS]: 'canvasReminders',
          [LOCAL_STORAGE_KEYS.INVITATIONS]: 'invitations',
          [LOCAL_STORAGE_KEYS.ROOM_MESSAGES]: 'roomMessages',
          [LOCAL_STORAGE_KEYS.FREETIME]: 'freetime'
        };
        const propName = keyPropMap[key];
        if (propName) {
          const profilesMap = (await getLocalData(LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP)) || {};
          profilesMap[userId] = profilesMap[userId] || { user: activeUser };
          profilesMap[userId][propName] = JSON.parse(JSON.stringify(value));
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({
              [LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP]: profilesMap,
              [`asc_student_profile_${userId}`]: profilesMap[userId]
            });
          }
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(LOCAL_STORAGE_KEYS.STUDENT_PROFILES_MAP, JSON.stringify(profilesMap));
            window.localStorage.setItem(`asc_student_profile_${userId}`, JSON.stringify(profilesMap[userId]));
          }
        }
      }
    } catch (e) {
      // Non-fatal profile mirroring
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LOCAL_STORAGE_KEYS,
    initLocalStorageIfEmpty,
    initializeFreshLoggedOutStorage,
    populateFromSeedData,
    saveActiveUserProfile,
    getStudentProfileData,
    saveStudentFreeTime,
    getStudentFreeTime,
    clearAllUserData,
    wipeAllLocalData,
    getLocalData,
    setLocalData,
    isStorageEmpty
  };
} else if (typeof globalThis !== 'undefined') {
  globalThis.LocalStore = {
    LOCAL_STORAGE_KEYS,
    initLocalStorageIfEmpty,
    initializeFreshLoggedOutStorage,
    populateFromSeedData,
    saveActiveUserProfile,
    getStudentProfileData,
    saveStudentFreeTime,
    getStudentFreeTime,
    clearAllUserData,
    wipeAllLocalData,
    getLocalData,
    setLocalData,
    isStorageEmpty
  };
}
