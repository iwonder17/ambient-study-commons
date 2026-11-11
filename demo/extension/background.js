/**
 * Ambient Study Commons (Demo) - Background Service Worker
 * Hosts the Mock Server (simulated backend) and handles dashboard tab routing.
 */

try {
  importScripts('local_store.js', 'mockserver/mock_server.js');
} catch (e) {
  console.error('[ASC Demo BG] Failed to importScripts:', e);
}

// Initialize seed data and start mock server on install/startup
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ASC Demo BG] Extension installed:', details.reason);
  if (typeof LocalStore !== 'undefined') {
    await LocalStore.initLocalStorageIfEmpty();
  }
  if (typeof MockServer !== 'undefined') {
    MockServer.init();
  }
});

// Also initialize on service worker startup
if (typeof MockServer !== 'undefined') {
  MockServer.init();
}

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
    return true;
  }

  if (message.action === 'GET_PROMPT') {
    fetch(chrome.runtime.getURL(`prompt/${message.name}`))
      .then(r => r.text())
      .then(text => sendResponse({ success: true, text }))
      .catch(err => sendResponse({ success: false, error: err.toString() }));
    return true;
  }

  // Delegate backend requests to MockServer
  if (typeof MockServer !== 'undefined') {
    MockServer.handleRequest(message, sender).then(res => {
      if (res !== null) {
        sendResponse(res);
      }
    });
    return true; // async response
  }
});
