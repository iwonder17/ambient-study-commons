/**
 * Dashboard View - Data Management & Privacy Settings Tab
 * Includes Developer Controls:
 * - Toggle auto pull from MockServer
 * - Wipe all local data
 * - Ask MockServer to send data from mock_data.json
 * - Manually trigger peer match event
 */

window.AscDash = window.AscDash || {};

window.AscDash.SettingsView = {
  prefs: {},
  onDataChanged: null,

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.bindEvents();
  },

  render(prefs) {
    this.prefs = prefs || {};
    document.getElementById('pref-ai-chats').checked = this.prefs.collectAiChats !== false;
    document.getElementById('pref-canvas-modules').checked = this.prefs.collectCanvasModules !== false;
    document.getElementById('pref-canvas-grades').checked = this.prefs.collectCanvasGrades !== false;

    // Dev auto-pull toggle
    const devAutoPullEl = document.getElementById('dev-toggle-autopull');
    if (devAutoPullEl) {
      devAutoPullEl.checked = this.prefs.autoPullMockData !== false;
    }
  },

  bindEvents() {
    // 1. Privacy Toggles
    ['pref-ai-chats', 'pref-canvas-modules', 'pref-canvas-grades'].forEach(id => {
      document.getElementById(id).addEventListener('change', async () => {
        this.prefs.collectAiChats = document.getElementById('pref-ai-chats').checked;
        this.prefs.collectCanvasModules = document.getElementById('pref-canvas-modules').checked;
        this.prefs.collectCanvasGrades = document.getElementById('pref-canvas-grades').checked;
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
        window.AscDash.Toast.show('Preferences saved locally.', 'check_circle');
      });
    });

    // 2. Export JSON
    document.getElementById('btn-export-top').addEventListener('click', () => {
      window.AscDash.Export.downloadJson();
    });

    document.getElementById('btn-export-full').addEventListener('click', () => {
      window.AscDash.Export.downloadJson();
    });

    document.getElementById('btn-reset-seed').addEventListener('click', async () => {
      await window.AscDash.Export.resetSeed(this.onDataChanged);
    });

    // 3. Dev Section: Toggle Auto-Pull from MockServer
    const devAutoPullEl = document.getElementById('dev-toggle-autopull');
    if (devAutoPullEl) {
      devAutoPullEl.addEventListener('change', async () => {
        const isEnabled = devAutoPullEl.checked;
        this.prefs.autoPullMockData = isEnabled;
        chrome.runtime.sendMessage({
          action: 'TOGGLE_AUTO_PULL',
          enabled: isEnabled
        }, (res) => {
          const statusText = isEnabled ? 'Auto-pull enabled (every 40s)' : 'Auto-pull disabled';
          window.AscDash.Toast.show(statusText, isEnabled ? 'check_circle' : 'refresh');
        });
      });
    }

    // 4. Dev Section: Ask MockServer to Send Data (loads mock_data.json)
    const btnRequestMock = document.getElementById('btn-dev-request-mock-data');
    if (btnRequestMock) {
      btnRequestMock.addEventListener('click', () => {
        btnRequestMock.disabled = true;
        btnRequestMock.innerHTML = `<span class="material-symbols-outlined">refresh</span> Requesting from MockServer...`;

        chrome.runtime.sendMessage({ action: 'PULL_MOCK_DATA' }, async (response) => {
          btnRequestMock.disabled = false;
          btnRequestMock.innerHTML = `<span class="material-symbols-outlined">download</span> Ask MockServer to Send Data`;

          if (response && response.success) {
            if (typeof this.onDataChanged === 'function') {
              await this.onDataChanged();
            }
            window.AscDash.Toast.show('MockServer data uploaded & loaded into Commons!', 'check_circle');
          } else {
            window.AscDash.Toast.show('Failed to fetch data from MockServer', 'info');
          }
        });
      });
    }

    // 5. Dev Section: Wipe All Data
    const btnWipeData = document.getElementById('btn-dev-wipe-data');
    if (btnWipeData) {
      btnWipeData.addEventListener('click', async () => {
        if (confirm('Wipe all local Commons data? Dashboard will become completely empty.')) {
          await LocalStore.wipeAllLocalData();
          if (typeof this.onDataChanged === 'function') {
            await this.onDataChanged();
          }
          window.AscDash.Toast.show('All local data wiped cleanly!', 'refresh');
        }
      });
    }

    // 6. Dev Section: Manual Trigger Match Event
    const btnSimMatch = document.getElementById('btn-sim-match-event');
    if (btnSimMatch) {
      btnSimMatch.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          action: 'TRIGGER_MOCK_EVENT',
          eventType: 'PEER_MATCH_FOUND'
        }, () => {
          window.AscDash.Toast.show('MockServer peer match sent! Check floating button.', 'sentiment_calm');
        });
      });
    }
  }
};
