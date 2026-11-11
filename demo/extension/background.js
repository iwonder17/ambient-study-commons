/**
 * Ambient Study Commons (Demo) - Background Service Worker
 * 100% Zero-Backend Chrome Extension Service Worker
 */

try {
  importScripts('local_store.js');
} catch (e) {
  console.error('[ASC Demo BG] Failed to importScripts:', e);
}

// Initialize seed data on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ASC Demo BG] Extension installed:', details.reason);
  if (typeof LocalStore !== 'undefined') {
    await LocalStore.initLocalStorageIfEmpty();
  }
});

// Click extension toolbar icon to open Dashboard tab
chrome.action.onClicked.addListener(async () => {
  await openDashboardTab();
});

// Open or activate dashboard tab
async function openDashboardTab() {
  const dashboardUrl = chrome.runtime.getURL('dashboard/index.html');
  const tabs = await chrome.tabs.query({ url: dashboardUrl });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: dashboardUrl });
  }
}

// Handle runtime messages from content script or dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_DASHBOARD') {
    openDashboardTab().then(() => sendResponse({ status: 'ok' }));
    return true; // async response
  }

  if (message.action === 'GET_PROMPT') {
    fetch(chrome.runtime.getURL(`prompt/${message.name}`))
      .then(r => r.text())
      .then(text => sendResponse({ success: true, text }))
      .catch(err => sendResponse({ success: false, error: err.toString() }));
    return true;
  }

  if (message.action === 'SAVE_AI_SESSION') {
    (async () => {
      try {
        const sessions = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SESSIONS);
        const newSession = {
          id: `sess_${Date.now()}`,
          platform: message.platform || 'ai_chat',
          timestamp: new Date().toISOString(),
          courseContext: message.courseContext || 'General Study',
          rawText: message.text || ''
        };
        sessions.unshift(newSession);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.SESSIONS, sessions);

        // Also add a synthetic journal entry if requested
        const journals = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS);
        const newJournal = {
          id: `jrnl_${Date.now()}`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          course: message.courseContext || 'Self Study',
          summary: message.summary || (message.text.substring(0, 140) + '...'),
          keyInsight: message.insight || 'Recorded from ambient session injection.',
          skillsExtracted: ['Autonomous Learning', 'Problem Solving'],
          aiFeedback: 'Offline session captured successfully.'
        };
        journals.unshift(newJournal);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, journals);

        sendResponse({ success: true, session: newSession, journal: newJournal });
      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true;
  }

  if (message.action === 'GET_JOURNALS_FOR_REVIEW') {
    (async () => {
      try {
        const journals = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS);
        const promptRes = await fetch(chrome.runtime.getURL('prompt/journal_review.txt'));
        const promptTemplate = await promptRes.text();

        const formattedJournals = journals.map((j, idx) => 
          `[Session ${idx + 1} - ${j.date} - ${j.course}]\nSummary: ${j.summary}\nInsight: ${j.keyInsight}\nSkills: ${(j.skillsExtracted || []).join(', ')}`
        ).join('\n\n');

        const combinedPrompt = `${promptTemplate}\n\n=== RECENT LEARNING JOURNALS ===\n\n${formattedJournals}`;

        sendResponse({ success: true, text: combinedPrompt, count: journals.length });
      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true;
  }
});

