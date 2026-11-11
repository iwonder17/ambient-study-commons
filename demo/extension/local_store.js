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
    const res = await chrome.storage.local.get(LOCAL_STORAGE_KEYS.USER);
    return !res[LOCAL_STORAGE_KEYS.USER];
  }
  return true;
}

// Initialize storage by requesting seed data from MockServer / mock_data.json
async function initLocalStorageIfEmpty() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const empty = await isStorageEmpty();
    if (empty) {
      console.log('[LocalStore] Storage is empty. Requesting initial seed data from MockServer...');
      try {
        const url = chrome.runtime.getURL('mockserver/mock_data.json');
        const res = await fetch(url);
        const data = await res.json();
        await populateFromSeedData(data);
      } catch (e) {
        console.error('[LocalStore] Failed to load mockserver/mock_data.json:', e);
      }
    }
  }
}

// Populate storage keys from a parsed mock data object
async function populateFromSeedData(data) {
  if (!data || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

  const storageMap = {
    [LOCAL_STORAGE_KEYS.USER]: data.user || {},
    [LOCAL_STORAGE_KEYS.PREFERENCES]: data.preferences || { autoPullMockData: true },
    [LOCAL_STORAGE_KEYS.JOURNALS]: data.journals || [],
    [LOCAL_STORAGE_KEYS.SKILLS]: data.skills || [],
    [LOCAL_STORAGE_KEYS.DREAMS]: data.dreams || [],
    [LOCAL_STORAGE_KEYS.CANVAS_REMINDERS]: data.canvasReminders || [],
    [LOCAL_STORAGE_KEYS.INVITATIONS]: data.invitations || [],
    [LOCAL_STORAGE_KEYS.ROOM_MESSAGES]: data.roomMessages || [],
    [LOCAL_STORAGE_KEYS.UNREAD_NOTIFICATIONS]: []
  };

  await chrome.storage.local.set(storageMap);
  console.log('[LocalStore] Successfully populated storage from mock data.');
}

// Wipe all data from storage (for dev testing)
async function wipeAllLocalData() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.clear();
    console.log('[LocalStore] All local data wiped cleanly.');
  }
}

// Get data for a key
async function getLocalData(key) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(key);
    return res[key] || null;
  }
  return null;
}

// Set data for a key
async function setLocalData(key, value) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [key]: value });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LOCAL_STORAGE_KEYS,
    initLocalStorageIfEmpty,
    populateFromSeedData,
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
    wipeAllLocalData,
    getLocalData,
    setLocalData,
    isStorageEmpty
  };
}
