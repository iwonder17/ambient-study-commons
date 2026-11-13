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

    // Render Theme Studio Controls
    this.renderThemeControls();

    // Dev auto-pull toggle
    const devAutoPullEl = document.getElementById('dev-toggle-autopull');
    if (devAutoPullEl) {
      devAutoPullEl.checked = this.prefs.autoPullMockData !== false;
    }

    // Dev manual journal color picker
    const devColorEl = document.getElementById('dev-color-manual-journal');
    if (devColorEl) {
      devColorEl.value = this.prefs.manualJournalColor || '#d97706';
    }
  },

  renderThemeControls() {
    const activePreset = this.prefs.themePreset || 'midnight';
    const activeAccent = (this.prefs.accentColor || '#3b82f6').toLowerCase();
    const activeRadius = this.prefs.cardRadius || 'standard';
    const ambientGlow = this.prefs.ambientGlow !== false;

    // 1. Preset Cards
    const presets = ['midnight', 'emerald', 'cyberpunk', 'amethyst', 'sunset', 'slate'];
    presets.forEach(key => {
      const card = document.getElementById(`theme-preset-${key}`);
      if (card) {
        if (key === activePreset) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      }
    });

    // 2. Accent Swatches
    const swatchMap = {
      'theme-accent-blue': '#3b82f6',
      'theme-accent-emerald': '#10b981',
      'theme-accent-amber': '#f59e0b',
      'theme-accent-violet': '#a855f7',
      'theme-accent-rose': '#f43f5e',
      'theme-accent-cyan': '#06b6d4'
    };

    let matchedSwatch = false;
    Object.entries(swatchMap).forEach(([id, color]) => {
      const swatch = document.getElementById(id);
      if (swatch) {
        if (color.toLowerCase() === activeAccent) {
          swatch.classList.add('active');
          matchedSwatch = true;
        } else {
          swatch.classList.remove('active');
        }
      }
    });

    // Custom Color Input
    const customAccentEl = document.getElementById('theme-custom-accent');
    if (customAccentEl) {
      customAccentEl.value = this.prefs.accentColor || '#3b82f6';
      if (!matchedSwatch) {
        customAccentEl.style.boxShadow = `0 0 0 2px #ffffff, 0 0 8px ${customAccentEl.value}`;
      } else {
        customAccentEl.style.boxShadow = 'none';
      }
    }

    // 3. Card Radius Segmented Control
    const radiusMap = {
      'btn-radius-sharp': 'sharp',
      'btn-radius-standard': 'standard',
      'btn-radius-smooth': 'smooth'
    };
    Object.entries(radiusMap).forEach(([id, rad]) => {
      const btn = document.getElementById(id);
      if (btn) {
        if (rad === activeRadius) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    // 4. Ambient Glow Toggle
    const glowToggleEl = document.getElementById('pref-theme-ambient-glow');
    if (glowToggleEl) {
      glowToggleEl.checked = ambientGlow;
    }
  },

  bindEvents() {
    // 1. Theme Presets Selection
    const presets = [
      { id: 'theme-preset-midnight', key: 'midnight', name: 'Midnight Obsidian' },
      { id: 'theme-preset-emerald', key: 'emerald', name: 'Forest Emerald' },
      { id: 'theme-preset-cyberpunk', key: 'cyberpunk', name: 'Ocean Cyberpunk' },
      { id: 'theme-preset-amethyst', key: 'amethyst', name: 'Cosmic Amethyst' },
      { id: 'theme-preset-sunset', key: 'sunset', name: 'Warm Amber Sunset' },
      { id: 'theme-preset-slate', key: 'slate', name: 'Nordic Slate' }
    ];

    presets.forEach(p => {
      const card = document.getElementById(p.id);
      if (card) {
        card.addEventListener('click', async () => {
          this.prefs.themePreset = p.key;
          const defaultAccent = (window.AscDash.THEME_PRESETS && window.AscDash.THEME_PRESETS[p.key])
            ? window.AscDash.THEME_PRESETS[p.key].accentColor
            : '#3b82f6';
          this.prefs.accentColor = defaultAccent;

          if (typeof window.AscDash.applyDashboardTheme === 'function') {
            window.AscDash.applyDashboardTheme(this.prefs);
          }
          this.renderThemeControls();
          await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
          window.AscDash.Toast.show(`Applied ${p.name} theme!`, 'palette');
        });
      }
    });

    // 2. Predefined Accent Swatches
    const swatches = [
      { id: 'theme-accent-blue', color: '#3b82f6', name: 'Sapphire Blue' },
      { id: 'theme-accent-emerald', color: '#10b981', name: 'Emerald Green' },
      { id: 'theme-accent-amber', color: '#f59e0b', name: 'Amber Gold' },
      { id: 'theme-accent-violet', color: '#a855f7', name: 'Amethyst Violet' },
      { id: 'theme-accent-rose', color: '#f43f5e', name: 'Neon Rose' },
      { id: 'theme-accent-cyan', color: '#06b6d4', name: 'Cyan Electric' }
    ];

    swatches.forEach(sw => {
      const btn = document.getElementById(sw.id);
      if (btn) {
        btn.addEventListener('click', async () => {
          this.prefs.accentColor = sw.color;
          if (typeof window.AscDash.applyDashboardTheme === 'function') {
            window.AscDash.applyDashboardTheme(this.prefs);
          }
          this.renderThemeControls();
          await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
          window.AscDash.Toast.show(`Accent set to ${sw.name}`, 'colors');
        });
      }
    });

    // 3. Custom Accent Picker
    const customAccentEl = document.getElementById('theme-custom-accent');
    if (customAccentEl) {
      customAccentEl.addEventListener('input', async (e) => {
        const hex = e.target.value;
        this.prefs.accentColor = hex;
        if (typeof window.AscDash.applyDashboardTheme === 'function') {
          window.AscDash.applyDashboardTheme(this.prefs);
        }
        this.renderThemeControls();
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
      });
    }

    // 4. Card Corner Radius Controls
    const radiusButtons = [
      { id: 'btn-radius-sharp', radius: 'sharp', label: 'Sharp (4px)' },
      { id: 'btn-radius-standard', radius: 'standard', label: 'Standard (10px)' },
      { id: 'btn-radius-smooth', radius: 'smooth', label: 'Smooth (18px)' }
    ];

    radiusButtons.forEach(rb => {
      const btn = document.getElementById(rb.id);
      if (btn) {
        btn.addEventListener('click', async () => {
          this.prefs.cardRadius = rb.radius;
          if (typeof window.AscDash.applyDashboardTheme === 'function') {
            window.AscDash.applyDashboardTheme(this.prefs);
          }
          this.renderThemeControls();
          await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
          window.AscDash.Toast.show(`Corner style: ${rb.label}`, 'rounded_corner');
        });
      }
    });

    // 5. Ambient Glow Toggle
    const glowToggleEl = document.getElementById('pref-theme-ambient-glow');
    if (glowToggleEl) {
      glowToggleEl.addEventListener('change', async () => {
        this.prefs.ambientGlow = glowToggleEl.checked;
        if (typeof window.AscDash.applyDashboardTheme === 'function') {
          window.AscDash.applyDashboardTheme(this.prefs);
        }
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
        window.AscDash.Toast.show(
          this.prefs.ambientGlow ? 'Ambient aurora glow enabled' : 'Ambient glow disabled',
          'light_mode'
        );
      });
    }

    // 6. Reset to Default Theme
    const btnResetTheme = document.getElementById('btn-reset-theme-default');
    if (btnResetTheme) {
      btnResetTheme.addEventListener('click', async () => {
        this.prefs.themePreset = 'midnight';
        this.prefs.accentColor = '#3b82f6';
        this.prefs.cardRadius = 'standard';
        this.prefs.ambientGlow = true;

        if (typeof window.AscDash.applyDashboardTheme === 'function') {
          window.AscDash.applyDashboardTheme(this.prefs);
        }
        this.renderThemeControls();
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
        window.AscDash.Toast.show('Reset theme to Midnight Obsidian default.', 'restart_alt');
      });
    }

    // 7. Privacy Toggles
    ['pref-ai-chats', 'pref-canvas-modules', 'pref-canvas-grades'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', async () => {
          this.prefs.collectAiChats = document.getElementById('pref-ai-chats').checked;
          this.prefs.collectCanvasModules = document.getElementById('pref-canvas-modules').checked;
          this.prefs.collectCanvasGrades = document.getElementById('pref-canvas-grades').checked;
          await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
          window.AscDash.Toast.show('Preferences saved locally.', 'check_circle');
        });
      }
    });

    // 8. Export JSON
    document.getElementById('btn-export-top')?.addEventListener('click', () => {
      window.AscDash.Export.downloadJson();
    });

    document.getElementById('btn-export-full')?.addEventListener('click', () => {
      window.AscDash.Export.downloadJson();
    });

    document.getElementById('btn-reset-seed')?.addEventListener('click', async () => {
      await window.AscDash.Export.resetSeed(this.onDataChanged);
    });

    // 9. Dev Section: Toggle Auto-Pull from MockServer
    const devAutoPullEl = document.getElementById('dev-toggle-autopull');
    if (devAutoPullEl) {
      devAutoPullEl.addEventListener('change', async () => {
        const isEnabled = devAutoPullEl.checked;
        this.prefs.autoPullMockData = isEnabled;
        chrome.runtime.sendMessage({
          action: 'TOGGLE_AUTO_PULL',
          enabled: isEnabled
        }, () => {
          const statusText = isEnabled ? 'Auto-pull enabled (every 40s)' : 'Auto-pull disabled';
          window.AscDash.Toast.show(statusText, isEnabled ? 'check_circle' : 'refresh');
        });
      });
    }

    // 10. Dev Section: Ask MockServer to Send Data
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

    // 11. Dev Section: Wipe All Data
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

    // 12. Dev Section: Manual Trigger Match Event
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

    // 13. Dev Section: Manual Journal Card Custom Color Wheel
    const colorPicker = document.getElementById('dev-color-manual-journal');
    const btnResetColor = document.getElementById('btn-reset-journal-color');

    if (colorPicker) {
      colorPicker.addEventListener('input', async (e) => {
        const hex = e.target.value;
        if (typeof window.AscDash.applyManualJournalColor === 'function') {
          window.AscDash.applyManualJournalColor(hex);
        }
        this.prefs.manualJournalColor = hex;
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
      });
    }

    if (btnResetColor) {
      btnResetColor.addEventListener('click', async () => {
        const defaultColor = '#d97706';
        if (colorPicker) colorPicker.value = defaultColor;
        if (typeof window.AscDash.applyManualJournalColor === 'function') {
          window.AscDash.applyManualJournalColor(defaultColor);
        }
        this.prefs.manualJournalColor = defaultColor;
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES, this.prefs);
        window.AscDash.Toast.show('Reset manual journal theme to warm luxury gold.', 'check_circle');
      });
    }
  }
};
