/**
 * Ambient Study Commons - Background Service Worker
 * Manages initial storage seeding, dashboard tab opening, and message routing.
 */

try {
  importScripts('seed_data.js');
} catch (e) {
  console.warn('Seed data import fallback in service worker:', e);
}

// Initialize seed data on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ASC Background] Extension installed/updated:', details.reason);
  
  try {
    const keys = globalThis.SeedDataBundle ? globalThis.SeedDataBundle.STORAGE_KEYS : {
      JOURNAL_LOG: 'asc_journal_log',
      SKILLS_LEDGER: 'asc_skills_ledger',
      EVENTS_DATA: 'asc_events_data',
      PEER_MATCHES: 'asc_peer_matches',
      STUDENT_PROFILE: 'asc_student_profile',
      APP_CONFIG: 'asc_app_config'
    };

    const current = await chrome.storage.local.get([keys.JOURNAL_LOG]);
    
    // Seed storage if empty
    if (!current[keys.JOURNAL_LOG]) {
      console.log('[ASC Background] Seeding local-first state for demo...');
      const bundle = globalThis.SeedDataBundle;
      if (bundle) {
        await chrome.storage.local.set({
          [keys.STUDENT_PROFILE]: bundle.DEFAULT_STUDENT_PROFILE,
          [keys.EVENTS_DATA]: bundle.DEFAULT_EVENTS,
          [keys.JOURNAL_LOG]: bundle.DEFAULT_JOURNAL,
          [keys.SKILLS_LEDGER]: bundle.DEFAULT_SKILLS,
          [keys.PEER_MATCHES]: bundle.DEFAULT_MATCHES,
          [keys.APP_CONFIG]: bundle.DEFAULT_CONFIG
        });
        console.log('[ASC Background] Seed data successfully written.');
      }
    }
  } catch (err) {
    console.error('[ASC Background] Error seeding storage:', err);
  }

  // Open the visual dashboard on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
});

// Extension Action icon click -> open dashboard
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

// Message listener from content script or dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_DASHBOARD') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'RESEED_DEMO') {
    const bundle = globalThis.SeedDataBundle;
    if (bundle) {
      const keys = bundle.STORAGE_KEYS;
      chrome.storage.local.set({
        [keys.STUDENT_PROFILE]: bundle.DEFAULT_STUDENT_PROFILE,
        [keys.EVENTS_DATA]: bundle.DEFAULT_EVENTS,
        [keys.JOURNAL_LOG]: bundle.DEFAULT_JOURNAL,
        [keys.SKILLS_LEDGER]: bundle.DEFAULT_SKILLS,
        [keys.PEER_MATCHES]: bundle.DEFAULT_MATCHES,
        [keys.APP_CONFIG]: bundle.DEFAULT_CONFIG
      }).then(() => {
        sendResponse({ success: true, message: 'Storage reseeded with demo data' });
      });
      return true;
    }
  }
});

