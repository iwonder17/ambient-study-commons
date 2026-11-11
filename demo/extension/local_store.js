/**
 * Ambient Study Commons (Demo) - Local Storage Helper
 * Ultra-slim local storage abstraction.
 * Pure storage manager: seed fixtures live cleanly in mock_data.json!
 */

const LOCAL_STORAGE_KEYS = {
  USER: 'asc_user',
  PREFERENCES: 'asc_preferences',
  FREETIME: 'asc_freetime',
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

// Initialize storage by requesting seed data from MockServer / mock_data.json
async function initLocalStorageIfEmpty() {
  const empty = await isStorageEmpty();
  if (empty) {
    console.log('[LocalStore] Storage is empty. Requesting initial seed data from MockServer...');
    try {
      const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('mockserver/mock_data.json')
        : '../mockserver/mock_data.json';
      const res = await fetch(url);
      const data = await res.json();
      await populateFromSeedData(data);
    } catch (e) {
      console.error('[LocalStore] Failed to load mockserver/mock_data.json:', e);
    }
  }
}

// Populate storage keys from a parsed mock data object
async function populateFromSeedData(data) {
  if (!data) return;

  const storageMap = {
    [LOCAL_STORAGE_KEYS.USER]: data.user || null,
    [LOCAL_STORAGE_KEYS.PREFERENCES]: data.preferences || { autoPullMockData: true },
    [LOCAL_STORAGE_KEYS.JOURNALS]: data.journals || [],
    [LOCAL_STORAGE_KEYS.SKILLS]: data.skills || [],
    [LOCAL_STORAGE_KEYS.DREAMS]: data.dreams || [],
    [LOCAL_STORAGE_KEYS.CANVAS_REMINDERS]: data.canvasReminders || [],
    [LOCAL_STORAGE_KEYS.INVITATIONS]: data.invitations || [],
    [LOCAL_STORAGE_KEYS.ROOM_MESSAGES]: data.roomMessages || [],
    [LOCAL_STORAGE_KEYS.UNREAD_NOTIFICATIONS]: []
  };

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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LOCAL_STORAGE_KEYS,
    initLocalStorageIfEmpty,
    populateFromSeedData,
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
    populateFromSeedData,
    clearAllUserData,
    wipeAllLocalData,
    getLocalData,
    setLocalData,
    isStorageEmpty
  };
}
