/**
 * Dashboard View - Learning Journals Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.JournalsView = {
  journals: [],
  onDataChanged: null,
  pendingDeleteId: null,

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.bindEvents();
  },

  formatDateDisplay(dateStr) {
    if (!dateStr) return 'Today';
    const lower = String(dateStr).trim().toLowerCase();
    if (lower === 'today') return 'Today';
    if (lower === 'yesterday') return 'Yesterday';
    if (/\b\w+ - \w+ \d{1,2} \d{4}\b/i.test(dateStr)) return dateStr;

    // Check if it's a relative string like "3 days ago"
    if (lower.includes('days ago')) {
      const days = parseInt(lower, 10) || 3;
      const d = new Date();
      d.setDate(d.getDate() - days);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday} - ${month} ${d.getDate()} ${d.getFullYear()}`;
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday} - ${month} ${d.getDate()} ${d.getFullYear()}`;
    }
    return dateStr;
  },

  render(journals) {
    this.journals = journals || [];
    const container = document.getElementById('journals-list');
    container.innerHTML = '';

    if (this.journals.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a; cursor:default;">No journals recorded yet. Use the extension button or "+ New Journal" above.</div>`;
      return;
    }

    this.journals.forEach(j => {
      const card = document.createElement('div');
      card.className = j.isManual ? 'asc-card asc-card-manual' : 'asc-card';
      card.setAttribute('data-id', j.id);
      
      const isToday = (j.date === 'Today' || !j.date || j.date.toLowerCase() === 'today');

      if (isToday) {
        // Today: time recorded and journal itself (with title if provided)
        const timeDisplay = j.time ? `Today, ${j.time}` : 'Today';
        card.innerHTML = `
          <div class="asc-card-header">
            <div style="flex: 1; padding-right: 12px;">
              ${j.title ? `<div class="asc-card-title">${j.title}</div>` : ''}
            </div>
            <div class="asc-card-right-col">
              <div class="asc-card-meta">
                <span class="material-symbols-outlined" style="font-size:14px; ${j.isManual ? 'color:var(--manual-journal-color);' : ''}">${j.isManual ? 'edit_note' : 'schedule'}</span>
                <span>${timeDisplay}</span>
              </div>
              <button class="asc-btn-delete-journal" data-id="${j.id}" title="Delete journal entry" type="button">
                <span class="material-symbols-outlined">delete</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
          <div class="asc-card-summary">${j.summary || ''}</div>
        `;
      } else {
        // Yesterday and earlier: Title + date header (e.g. Sunday - Nov 8 2026), summary in middle, key reflection at bottom
        const formattedDate = this.formatDateDisplay(j.date);
        card.innerHTML = `
          <div class="asc-card-header">
            <div style="flex: 1; padding-right: 12px;">
              <div class="asc-card-title">${j.title || 'Daily Master Reflection'}</div>
            </div>
            <div class="asc-card-right-col">
              <div class="asc-card-meta">
                ${j.isManual ? `<span class="material-symbols-outlined" style="font-size:14px; color:var(--manual-journal-color);" title="Manual Entry">edit_note</span>` : ''}
                <div class="asc-card-date">${formattedDate}</div>
              </div>
              <button class="asc-btn-delete-journal" data-id="${j.id}" title="Delete journal entry" type="button">
                <span class="material-symbols-outlined">delete</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
          <div class="asc-card-summary">${j.summary || ''}</div>
          ${j.keyInsight ? `<div class="asc-card-insight"><strong>Key Reflection:</strong> ${j.keyInsight}</div>` : ''}
        `;
      }

      container.appendChild(card);
    });
  },

  openReadingModal(journalId) {
    const journal = this.journals.find(j => j.id === journalId);
    if (!journal) return;

    // Format date
    const dateFormatted = this.formatDateDisplay(journal.date || 'Today');

    // Populate Reading Mode UI
    document.getElementById('read-journal-title').textContent = journal.title || 'Daily Study Reflection';
    document.getElementById('read-journal-date').textContent = dateFormatted;
    document.getElementById('read-journal-time').textContent = journal.time ? `• ${journal.time}` : '';
    document.getElementById('read-journal-body').textContent = journal.summary || '';

    const insightBox = document.getElementById('read-journal-insight-box');
    const insightText = document.getElementById('read-journal-insight');
    if (journal.keyInsight) {
      insightText.textContent = journal.keyInsight;
      insightBox.style.display = 'block';
    } else {
      insightBox.style.display = 'none';
    }

    // Pre-populate Edit Mode Inputs
    document.getElementById('edit-journal-id').value = journal.id;
    document.getElementById('edit-journal-date').value = dateFormatted;
    document.getElementById('edit-journal-time').value = journal.time || '';
    document.getElementById('edit-journal-title').value = journal.title || '';
    document.getElementById('edit-journal-body').value = journal.summary || '';
    document.getElementById('edit-journal-insight').value = journal.keyInsight || '';

    // Switch to Reading View by default
    document.getElementById('journal-reading-mode').style.display = 'flex';
    document.getElementById('journal-edit-mode').style.display = 'none';

    const overlay = document.getElementById('modal-journal-detail-overlay');
    if (overlay) overlay.style.display = 'flex';
  },

  switchToEditMode() {
    document.getElementById('journal-reading-mode').style.display = 'none';
    document.getElementById('journal-edit-mode').style.display = 'flex';
    document.getElementById('edit-journal-body').focus();
  },

  switchToReadingMode() {
    document.getElementById('journal-edit-mode').style.display = 'none';
    document.getElementById('journal-reading-mode').style.display = 'flex';
  },

  closeModal() {
    const overlay = document.getElementById('modal-journal-detail-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  confirmDelete(id) {
    this.pendingDeleteId = id;
    const confirmOverlay = document.getElementById('modal-delete-confirm-overlay');
    if (confirmOverlay) {
      confirmOverlay.style.display = 'flex';
    }
  },

  closeConfirmDelete() {
    this.pendingDeleteId = null;
    const confirmOverlay = document.getElementById('modal-delete-confirm-overlay');
    if (confirmOverlay) {
      confirmOverlay.style.display = 'none';
    }
  },

  bindEvents() {
    // Search Filter
    document.getElementById('search-journals').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = this.journals.filter(j => 
        (j.summary && j.summary.toLowerCase().includes(q)) ||
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.keyInsight && j.keyInsight.toLowerCase().includes(q))
      );
      this.render(filtered);
    });

    // Compile Weekly Review Prompt
    document.getElementById('btn-trigger-review-prompt').addEventListener('click', async () => {
      try {
        const res = await fetch(chrome.runtime.getURL('prompt/journal_review.txt'));
        const promptTemplate = await res.text();

        const journalDigest = this.journals.map((j, i) => {
          if (j.date === 'Today' || !j.date || j.date.toLowerCase() === 'today') {
            return `[Session ${i + 1} - Today ${j.time ? `(${j.time})` : ''}]\n${j.title ? `Title: ${j.title}\n` : ''}Summary: ${j.summary}`;
          } else {
            return `[Daily Review - ${j.title || 'Summary'} - ${this.formatDateDisplay(j.date)}]\nSummary: ${j.summary}\nReflection: ${j.keyInsight || 'N/A'}`;
          }
        }).join('\n\n');

        const fullPrompt = `${promptTemplate}\n\n=== RECENT LEARNING JOURNALS ===\n\n${journalDigest}`;

        await navigator.clipboard.writeText(fullPrompt);
        window.AscDash.Toast.show(`Weekly Review prompt copied! (${this.journals.length} sessions compiled)`, 'sentiment_calm');
      } catch (e) {
        window.AscDash.Toast.show('Compiled offline: ' + e.message, 'sentiment_calm');
      }
    });

    // Inline New Journal Form Card Toggle & Actions
    const formCard = document.getElementById('form-new-journal-card');
    const titleInput = document.getElementById('input-new-journal-title');
    const bodyInput = document.getElementById('input-new-journal-body');

    const openForm = () => {
      formCard.style.display = 'flex';
      titleInput.value = '';
      bodyInput.value = '';
      titleInput.focus();
    };

    const closeForm = () => {
      formCard.style.display = 'none';
      titleInput.value = '';
      bodyInput.value = '';
    };

    document.getElementById('btn-add-manual-journal').addEventListener('click', () => {
      if (formCard.style.display === 'flex' || formCard.style.display === 'block') {
        closeForm();
      } else {
        openForm();
      }
    });

    document.getElementById('btn-cancel-new-journal').addEventListener('click', closeForm);
    document.getElementById('btn-dismiss-new-journal').addEventListener('click', closeForm);

    document.getElementById('btn-save-new-journal').addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();

      if (!body) {
        window.AscDash.Toast.show('Please enter journal reflection notes first.', 'note_alt');
        bodyInput.focus();
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      const newEntry = {
        id: `jrnl_${Date.now()}`,
        date: 'Today',
        time: timeStr,
        title: title || '',
        summary: body,
        isManual: true,
        aiFeedback: 'Manually logged into local commons.'
      };

      if (window.AscAPI && typeof window.AscAPI.saveJournal === 'function') {
        await window.AscAPI.saveJournal(newEntry);
      } else {
        this.journals.unshift(newEntry);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, this.journals);
      }
      this.render(this.journals);
      if (typeof this.onDataChanged === 'function') this.onDataChanged();
      closeForm();
      window.AscDash.Toast.show('New journal entry saved!', 'book_5');
    });

    // Click Card -> Open Smooth Reading Mode
    document.getElementById('journals-list').addEventListener('click', (e) => {
      if (e.target.closest('.asc-btn-delete-journal')) return;
      const card = e.target.closest('.asc-card');
      if (!card) return;
      const id = card.getAttribute('data-id');
      if (id) {
        this.openReadingModal(id);
      }
    });

    // Delete Journal Entry (Triggers confirmation dialog)
    document.getElementById('journals-list').addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.asc-btn-delete-journal');
      if (!deleteBtn) return;
      e.stopPropagation();

      const journalId = deleteBtn.getAttribute('data-id');
      if (journalId) {
        this.confirmDelete(journalId);
      }
    });

    // Delete Confirmation Dialog Actions (Yes / No)
    document.getElementById('btn-delete-confirm-no').addEventListener('click', () => {
      this.closeConfirmDelete();
    });

    document.getElementById('btn-delete-confirm-yes').addEventListener('click', async () => {
      if (!this.pendingDeleteId) return;
      const idToDelete = this.pendingDeleteId;

      if (window.AscAPI && typeof window.AscAPI.deleteJournal === 'function') {
        await window.AscAPI.deleteJournal(idToDelete);
      } else {
        this.journals = this.journals.filter(item => item.id !== idToDelete);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, this.journals);
      }
      this.render(this.journals);
      if (typeof this.onDataChanged === 'function') this.onDataChanged();
      
      this.closeConfirmDelete();
      this.closeModal();
      window.AscDash.Toast.show('Journal entry deleted.', 'delete');
    });

    document.getElementById('modal-delete-confirm-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-delete-confirm-overlay') {
        this.closeConfirmDelete();
      }
    });

    // Switch between Reading Mode and Edit Mode
    document.getElementById('btn-switch-to-edit').addEventListener('click', () => {
      this.switchToEditMode();
    });

    document.getElementById('btn-cancel-edit-journal').addEventListener('click', () => {
      this.switchToReadingMode();
    });

    // Set to current time button in edit mode
    document.getElementById('btn-set-current-time').addEventListener('click', () => {
      const now = new Date();
      document.getElementById('edit-journal-time').value = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const dateEl = document.getElementById('edit-journal-date');
      if (!dateEl.value.trim()) dateEl.value = 'Today';
      window.AscDash.Toast.show('Timestamp updated to current moment.', 'schedule');
    });

    // Save edited journal from edit mode
    document.getElementById('btn-save-edit-journal').addEventListener('click', async () => {
      const id = document.getElementById('edit-journal-id').value;
      const target = this.journals.find(j => j.id === id);
      if (!target) return;

      const bodyVal = document.getElementById('edit-journal-body').value.trim();
      if (!bodyVal) {
        window.AscDash.Toast.show('Journal content cannot be empty.', 'note_alt');
        document.getElementById('edit-journal-body').focus();
        return;
      }

      target.date = document.getElementById('edit-journal-date').value.trim() || 'Today';
      target.time = document.getElementById('edit-journal-time').value.trim();
      target.title = document.getElementById('edit-journal-title').value.trim();
      target.summary = bodyVal;
      target.keyInsight = document.getElementById('edit-journal-insight').value.trim();

      if (window.AscAPI && typeof window.AscAPI.saveJournal === 'function') {
        await window.AscAPI.saveJournal(target);
      } else {
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, this.journals);
      }
      this.render(this.journals);
      if (typeof this.onDataChanged === 'function') this.onDataChanged();
      
      // Update reading mode values with new content & switch to reading view
      this.openReadingModal(id);
      window.AscDash.Toast.show('Journal updated successfully!', 'check_circle');
    });

    // Delete from inside modal (Triggers confirmation dialog)
    document.getElementById('btn-delete-from-modal').addEventListener('click', () => {
      const id = document.getElementById('edit-journal-id').value;
      if (id) {
        this.confirmDelete(id);
      }
    });

    // Close modal buttons
    document.getElementById('btn-close-journal-modal').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-close-reading-modal').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-close-edit-mode').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-journal-detail-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-journal-detail-overlay') {
        this.closeModal();
      }
    });
  }
};
