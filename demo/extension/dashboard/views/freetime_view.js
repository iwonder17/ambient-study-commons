/**
 * Dashboard View - Study Free Time & Availability Tab
 * Provides interactive weekly schedule controls:
 * - Individual customization for EACH DAY of the week (Mon - Sun)
 * - Per-day on/off toggle and custom start/end time windows
 * - Preferred time-of-day blocks (Morning, Afternoon, Evening) per day
 * - Quick schedule presets (Tue/Thu Standard, All Weekdays, Everyday)
 * - Copy day hours across all active study days
 * - Visual 7-day timetable matrix displaying individual day hours and peer overlap
 * - Dynamic synchronization with Peer Matching & Greeting Room availability
 */

window.AscDash = window.AscDash || {};

window.AscDash.FreeTimeView = {
  DAY_KEYS: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  
  DAY_MAP: {
    Mon: 'Mondays',
    Tue: 'Tuesdays',
    Wed: 'Wednesdays',
    Thu: 'Thursdays',
    Fri: 'Fridays',
    Sat: 'Saturdays',
    Sun: 'Sundays'
  },

  DAY_FULL_NAMES: {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday'
  },

  state: {
    selectedDay: 'Tue',
    dailySchedules: {
      Mon: { enabled: false, slots: ['Evening'], startTime: '18:00', endTime: '20:30' },
      Tue: { enabled: true, slots: ['Afternoon'], startTime: '14:00', endTime: '16:30' },
      Wed: { enabled: false, slots: ['Morning'], startTime: '09:00', endTime: '12:00' },
      Thu: { enabled: true, slots: ['Afternoon'], startTime: '14:00', endTime: '16:30' },
      Fri: { enabled: false, slots: ['Afternoon'], startTime: '13:00', endTime: '16:00' },
      Sat: { enabled: false, slots: ['Morning'], startTime: '10:00', endTime: '13:00' },
      Sun: { enabled: false, slots: ['Evening'], startTime: '16:00', endTime: '19:00' }
    },
    days: ['Tue', 'Thu'],
    slots: ['Afternoon'],
    startTime: '14:00',
    endTime: '16:30',
    summary: 'Tuesdays & Thursdays, 2:00 PM - 4:30 PM'
  },
  onDataChanged: null,

  ensureDailySchedules() {
    if (!this.state.dailySchedules || typeof this.state.dailySchedules !== 'object') {
      this.state.dailySchedules = {};
    }
    const activeDays = this.state.days || ['Tue', 'Thu'];
    const activeSlots = this.state.slots || ['Afternoon'];
    const defaultStart = this.state.startTime || '14:00';
    const defaultEnd = this.state.endTime || '16:30';

    this.DAY_KEYS.forEach(key => {
      if (!this.state.dailySchedules[key]) {
        const isEnabled = activeDays.includes(key);
        this.state.dailySchedules[key] = {
          enabled: isEnabled,
          slots: isEnabled ? [...activeSlots] : ['Afternoon'],
          startTime: defaultStart,
          endTime: defaultEnd
        };
      }
    });

    if (!this.state.selectedDay || !this.DAY_KEYS.includes(this.state.selectedDay)) {
      this.state.selectedDay = activeDays[0] || 'Tue';
    }
  },

  formatTime12h(time24) {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  },

  generateSummary() {
    this.ensureDailySchedules();
    const activeKeys = this.DAY_KEYS.filter(k => this.state.dailySchedules[k] && this.state.dailySchedules[k].enabled);
    
    if (activeKeys.length === 0) {
      return 'Flexible Schedule (No fixed days)';
    }

    // Check if all active days share the exact same start and end times
    const firstSched = this.state.dailySchedules[activeKeys[0]];
    const allSameTime = activeKeys.every(k => {
      const s = this.state.dailySchedules[k];
      return s.startTime === firstSched.startTime && s.endTime === firstSched.endTime;
    });

    const timeStr = `${this.formatTime12h(firstSched.startTime)} - ${this.formatTime12h(firstSched.endTime)}`;

    if (allSameTime) {
      if (activeKeys.length === 7) {
        return `Everyday, ${timeStr}`;
      }
      if (activeKeys.length === 5 && !activeKeys.includes('Sat') && !activeKeys.includes('Sun')) {
        return `Mon - Fri, ${timeStr}`;
      }
      if (activeKeys.length === 2) {
        return `${this.DAY_MAP[activeKeys[0]]} & ${this.DAY_MAP[activeKeys[1]]}, ${timeStr}`;
      }
      const dayNames = activeKeys.map(k => this.DAY_MAP[k]);
      return `${dayNames.slice(0, -1).join(', ')} & ${dayNames[dayNames.length - 1]}, ${timeStr}`;
    }

    // Individual days have distinct times
    return activeKeys.map(k => {
      const s = this.state.dailySchedules[k];
      return `${k} (${this.formatTime12h(s.startTime)}-${this.formatTime12h(s.endTime)})`;
    }).join(' • ');
  },

  generateBadgeLabel() {
    this.ensureDailySchedules();
    const activeKeys = this.DAY_KEYS.filter(k => this.state.dailySchedules[k] && this.state.dailySchedules[k].enabled);
    if (activeKeys.length === 7) return 'Everyday';
    if (activeKeys.length === 5 && !activeKeys.includes('Sat') && !activeKeys.includes('Sun')) return 'Mon-Fri';
    if (activeKeys.length === 2 && activeKeys.includes('Tue') && activeKeys.includes('Thu')) return 'Tue/Thu';
    if (activeKeys.length === 0) return 'Flexible';
    return activeKeys.join('/');
  },

  async saveAndSync() {
    this.ensureDailySchedules();
    // Keep backward-compatible arrays in sync
    this.state.days = this.DAY_KEYS.filter(k => this.state.dailySchedules[k].enabled);
    const curr = this.state.dailySchedules[this.state.selectedDay] || {};
    this.state.slots = curr.slots || ['Afternoon'];
    this.state.startTime = curr.startTime || '14:00';
    this.state.endTime = curr.endTime || '16:30';
    this.state.summary = this.generateSummary();

    // 1. Save to active free time key
    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.FREETIME, this.state);

    // 2. Save directly into student profile data for persistent retrieval on login
    const currentUser = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
    if (currentUser && currentUser.id) {
      if (typeof LocalStore.saveStudentFreeTime === 'function') {
        await LocalStore.saveStudentFreeTime(currentUser.id, this.state);
      } else {
        await LocalStore.setLocalData(`asc_freetime_${currentUser.id}`, this.state);
      }

      // Notify MockServer in background
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'SAVE_STUDENT_FREETIME',
          userId: currentUser.id,
          freetime: this.state
        }).catch(() => {});
      }
    }

    // Sync with invitations (peer match availability)
    const invitations = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS)) || [];
    if (invitations.length > 0) {
      invitations.forEach(inv => {
        inv.mutualFreeTime = this.state.summary;
      });
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS, invitations);
      if (window.AscDash.MatchesView) {
        window.AscDash.MatchesView.render(invitations);
      }
    }

    this.updateUI();
    const studentName = currentUser ? currentUser.displayName.split(' ')[0] : 'Student';
    window.AscDash.Toast.show(`Saved ${studentName}'s free time! Suggestions rearranged.`, 'event_available');
    if (typeof this.onDataChanged === 'function') this.onDataChanged();
  },

  selectDay(dayKey) {
    if (!this.DAY_KEYS.includes(dayKey)) return;
    this.state.selectedDay = dayKey;
    this.updateUI();
  },

  updateUI() {
    this.ensureDailySchedules();
    const curDayKey = this.state.selectedDay || 'Tue';
    const curDayName = this.DAY_FULL_NAMES[curDayKey] || curDayKey;
    const curSched = this.state.dailySchedules[curDayKey] || { enabled: false, slots: ['Afternoon'], startTime: '14:00', endTime: '16:30' };

    // Update Overall Summary Text
    const summaryEl = document.getElementById('freetime-summary-text');
    if (summaryEl) {
      summaryEl.textContent = this.generateSummary();
    }

    // Update Nav Badge
    const badgeEl = document.getElementById('badge-freetime-summary');
    if (badgeEl) {
      badgeEl.textContent = this.generateBadgeLabel();
    }

    // Update Day Chips (highlight active days and the currently selected day)
    const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    this.DAY_KEYS.forEach((key, idx) => {
      const btn = document.getElementById(`btn-day-${dayIds[idx]}`);
      if (btn) {
        const isEnabled = this.state.dailySchedules[key] && this.state.dailySchedules[key].enabled;
        const isSelected = (key === curDayKey);
        btn.classList.toggle('active', isEnabled);
        btn.classList.toggle('selected-day', isSelected);
      }
    });

    // Update Selected Day Labels
    const labelMain = document.getElementById('freetime-active-day-label');
    const labelSlots = document.getElementById('freetime-active-day-label-slots');
    const labelTimes = document.getElementById('freetime-active-day-label-times');
    const labelDisabled = document.getElementById('freetime-active-day-label-disabled');
    if (labelMain) labelMain.textContent = curDayName;
    if (labelSlots) labelSlots.textContent = curDayName;
    if (labelTimes) labelTimes.textContent = curDayName;
    if (labelDisabled) labelDisabled.textContent = curDayName;

    // Update Day Toggle Checkbox
    const toggleEl = document.getElementById('freetime-day-enable-toggle');
    if (toggleEl) {
      toggleEl.checked = !!curSched.enabled;
    }

    // Update Active / Inactive Status Pill
    const pillEl = document.getElementById('freetime-active-day-status-pill');
    if (pillEl) {
      if (curSched.enabled) {
        pillEl.textContent = 'Active';
        pillEl.style.background = 'rgba(34, 197, 94, 0.15)';
        pillEl.style.color = '#4ade80';
      } else {
        pillEl.textContent = 'Unavailable';
        pillEl.style.background = 'rgba(113, 113, 122, 0.2)';
        pillEl.style.color = '#a1a1aa';
      }
    }

    // Show/hide Day Editor Content vs Disabled Note
    const contentWrap = document.getElementById('freetime-day-content-wrap');
    const disabledNote = document.getElementById('freetime-day-disabled-note');
    if (contentWrap) contentWrap.style.display = curSched.enabled ? 'flex' : 'none';
    if (disabledNote) disabledNote.style.display = curSched.enabled ? 'none' : 'block';

    // Update Slot Chips for Selected Day
    const slots = curSched.slots || [];
    const slotMorning = document.getElementById('btn-slot-morning');
    const slotAfternoon = document.getElementById('btn-slot-afternoon');
    const slotEvening = document.getElementById('btn-slot-evening');
    if (slotMorning) slotMorning.classList.toggle('active', slots.includes('Morning'));
    if (slotAfternoon) slotAfternoon.classList.toggle('active', slots.includes('Afternoon'));
    if (slotEvening) slotEvening.classList.toggle('active', slots.includes('Evening'));

    // Update Time Inputs for Selected Day
    const startInp = document.getElementById('freetime-time-start');
    const endInp = document.getElementById('freetime-time-end');
    if (startInp && curSched.startTime) startInp.value = curSched.startTime;
    if (endInp && curSched.endTime) endInp.value = curSched.endTime;

    // Update Timetable Matrix
    this.renderTimetableMatrix();
  },

  renderTimetableMatrix() {
    const matrixEl = document.getElementById('freetime-matrix-body');
    if (!matrixEl) return;
    matrixEl.innerHTML = '';
    this.ensureDailySchedules();

    const curDayKey = this.state.selectedDay || 'Tue';

    this.DAY_KEYS.forEach(k => {
      const label = this.DAY_FULL_NAMES[k];
      const sched = this.state.dailySchedules[k] || { enabled: false, slots: [], startTime: '14:00', endTime: '16:30' };
      const isDayActive = sched.enabled;
      const isSelected = (k === curDayKey);
      const isAfternoonActive = isDayActive && (sched.slots || []).includes('Afternoon');
      const isMorningActive = isDayActive && (sched.slots || []).includes('Morning');
      const isEveningActive = isDayActive && (sched.slots || []).includes('Evening');

      const isOverlapDay = (k === 'Tue' || k === 'Thu') && isAfternoonActive;

      const timeRangeStr = isDayActive 
        ? `${this.formatTime12h(sched.startTime)} - ${this.formatTime12h(sched.endTime)}`
        : 'Unavailable';

      const row = document.createElement('div');
      row.className = `asc-matrix-row ${isDayActive ? 'asc-matrix-day-active' : ''} ${isSelected ? 'selected-matrix-row' : ''}`;
      row.title = `Click to configure ${label}'s study hours`;

      row.innerHTML = `
        <div class="asc-matrix-day-col">
          <span class="asc-matrix-day-dot ${isDayActive ? 'active' : ''}"></span>
          <div>
            <strong style="color: ${isSelected ? '#60a5fa' : 'var(--text-main)'};">${label}</strong>
            <span class="asc-matrix-time-pill ${isDayActive ? '' : 'disabled'}">${timeRangeStr}</span>
          </div>
        </div>
        <div class="asc-matrix-slot-cell ${isMorningActive ? 'active' : ''}">
          ${isMorningActive ? '<span class="material-symbols-outlined">check_circle</span> Open' : '—'}
        </div>
        <div class="asc-matrix-slot-cell ${isAfternoonActive ? 'active' : ''} ${isOverlapDay ? 'match-highlight' : ''}">
          ${isOverlapDay 
            ? '<span class="material-symbols-outlined">check_circle</span> Overlap (2-4:30 PM)' 
            : (isAfternoonActive ? '<span class="material-symbols-outlined">check_circle</span> Open' : '—')}
        </div>
        <div class="asc-matrix-slot-cell ${isEveningActive ? 'active' : ''}">
          ${isEveningActive ? '<span class="material-symbols-outlined">check_circle</span> Open' : '—'}
        </div>
      `;

      row.addEventListener('click', () => {
        this.selectDay(k);
      });

      matrixEl.appendChild(row);
    });
  },

  render(freetimeData) {
    if (freetimeData) {
      this.state = { ...this.state, ...freetimeData };
    }
    this.ensureDailySchedules();
    this.state.summary = this.generateSummary();
    this.updateUI();
  },

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.ensureDailySchedules();

    // 1. Day chips - clicking a day selects that day for editing
    const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    this.DAY_KEYS.forEach((key, idx) => {
      const btn = document.getElementById(`btn-day-${dayIds[idx]}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.selectDay(key);
        });
      }
    });

    // 2. Day enable/disable toggle
    const toggleEl = document.getElementById('freetime-day-enable-toggle');
    if (toggleEl) {
      toggleEl.addEventListener('change', async (e) => {
        this.ensureDailySchedules();
        const curKey = this.state.selectedDay || 'Tue';
        this.state.dailySchedules[curKey].enabled = e.target.checked;
        await this.saveAndSync();
      });
    }

    // 3. Slot chips for currently selected day
    const slotConfigs = [
      { id: 'btn-slot-morning', name: 'Morning', start: '09:00', end: '12:00' },
      { id: 'btn-slot-afternoon', name: 'Afternoon', start: '14:00', end: '16:30' },
      { id: 'btn-slot-evening', name: 'Evening', start: '18:00', end: '21:00' }
    ];
    slotConfigs.forEach(cfg => {
      const btn = document.getElementById(cfg.id);
      if (btn) {
        btn.addEventListener('click', async () => {
          this.ensureDailySchedules();
          const curKey = this.state.selectedDay || 'Tue';
          this.state.dailySchedules[curKey].slots = [cfg.name];
          this.state.dailySchedules[curKey].startTime = cfg.start;
          this.state.dailySchedules[curKey].endTime = cfg.end;
          await this.saveAndSync();
        });
      }
    });

    // 4. Time input changes for currently selected day
    const startInp = document.getElementById('freetime-time-start');
    const endInp = document.getElementById('freetime-time-end');
    const btnSave = document.getElementById('btn-save-freetime-grid');

    const handleTimeChange = () => {
      this.ensureDailySchedules();
      const curKey = this.state.selectedDay || 'Tue';
      if (startInp && startInp.value) this.state.dailySchedules[curKey].startTime = startInp.value;
      if (endInp && endInp.value) this.state.dailySchedules[curKey].endTime = endInp.value;
    };

    if (startInp) startInp.addEventListener('change', handleTimeChange);
    if (endInp) endInp.addEventListener('change', handleTimeChange);

    // 5. Copy current day's hours to all active study days
    const btnCopy = document.getElementById('btn-apply-to-all-days');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        this.ensureDailySchedules();
        const curKey = this.state.selectedDay || 'Tue';
        const source = this.state.dailySchedules[curKey];
        if (!source) return;

        let appliedCount = 0;
        this.DAY_KEYS.forEach(k => {
          if (k !== curKey && this.state.dailySchedules[k].enabled) {
            this.state.dailySchedules[k].startTime = source.startTime;
            this.state.dailySchedules[k].endTime = source.endTime;
            this.state.dailySchedules[k].slots = [...(source.slots || ['Afternoon'])];
            appliedCount++;
          }
        });

        await this.saveAndSync();
        const curName = this.DAY_FULL_NAMES[curKey];
        window.AscDash.Toast.show(`Copied ${curName}'s hours to ${appliedCount} active day(s)!`, 'content_copy');
      });
    }

    // 6. Presets
    const btnTueThu = document.getElementById('btn-preset-tue-thu');
    const btnWeekdays = document.getElementById('btn-preset-weekdays');
    const btnAll = document.getElementById('btn-preset-all');

    if (btnTueThu) {
      btnTueThu.addEventListener('click', async () => {
        this.ensureDailySchedules();
        this.DAY_KEYS.forEach(k => {
          const isTueThu = (k === 'Tue' || k === 'Thu');
          this.state.dailySchedules[k].enabled = isTueThu;
          if (isTueThu) {
            this.state.dailySchedules[k].startTime = '14:00';
            this.state.dailySchedules[k].endTime = '16:30';
            this.state.dailySchedules[k].slots = ['Afternoon'];
          }
        });
        this.state.selectedDay = 'Tue';
        await this.saveAndSync();
      });
    }

    if (btnWeekdays) {
      btnWeekdays.addEventListener('click', async () => {
        this.ensureDailySchedules();
        this.DAY_KEYS.forEach(k => {
          const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(k);
          this.state.dailySchedules[k].enabled = isWeekday;
          if (isWeekday) {
            this.state.dailySchedules[k].startTime = '13:00';
            this.state.dailySchedules[k].endTime = '17:00';
            this.state.dailySchedules[k].slots = ['Afternoon'];
          }
        });
        this.state.selectedDay = 'Mon';
        await this.saveAndSync();
      });
    }

    if (btnAll) {
      btnAll.addEventListener('click', async () => {
        this.ensureDailySchedules();
        this.DAY_KEYS.forEach(k => {
          this.state.dailySchedules[k].enabled = true;
          this.state.dailySchedules[k].startTime = '10:00';
          this.state.dailySchedules[k].endTime = '18:00';
          this.state.dailySchedules[k].slots = ['Morning', 'Afternoon'];
        });
        this.state.selectedDay = 'Mon';
        await this.saveAndSync();
      });
    }

    // 7. Save button
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        handleTimeChange();
        await this.saveAndSync();
      });
    }

    // Modal buttons (for backward compatibility if modal is triggered)
    const modal = document.getElementById('modal-freetime-schedule');
    const btnOpen = document.getElementById('btn-open-freetime-modal');
    const btnClose = document.getElementById('btn-close-freetime-modal');
    const btnCancel = document.getElementById('btn-cancel-freetime-modal');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        this.updateUI();
        modal.style.display = 'flex';
      });
    }
    const closeModal = () => {
      if (modal) modal.style.display = 'none';
    };
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
  }
};

// Aliases for seamless integration
window.AscDash.FreeTimeController = window.AscDash.FreeTimeView;
