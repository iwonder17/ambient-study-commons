/**
 * vtest Extension Background Service Worker.
 * Handles active user detection, tab management, and notification dispatching.
 */

const DASHBOARD_URL = "http://localhost:8000/dashboard/index.html";
const API_BASE = "http://localhost:8000";

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[vtest Background] Installed:", details.reason);
  if (details.reason === "install") {
    chrome.tabs.create({ url: DASHBOARD_URL });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: DASHBOARD_URL });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "OPEN_DASHBOARD") {
    chrome.tabs.create({ url: DASHBOARD_URL });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "FETCH_WEEKLY_REVIEW") {
    fetch(`${API_BASE}/api/weekly-review/bundle`)
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.toString() }));
    return true;
  }

  if (request.action === "CHECK_MATCHES") {
    fetch(`${API_BASE}/api/invitations`)
      .then(res => res.json())
      .then(data => sendResponse({ success: true, invitations: data.items }))
      .catch(err => sendResponse({ success: false, error: err.toString() }));
    return true;
  }
});

