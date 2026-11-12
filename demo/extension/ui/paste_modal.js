/**
 * AscUI - Paste Modal Module
 * Pop-up dialog to paste a single chunk of AI study session summary into local commons storage.
 */

window.AscUI = window.AscUI || {};

window.AscUI.PasteModal = {
  overlayEl: null,

  init() {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'asc-modal-overlay';
    this.overlayEl.innerHTML = `
      <div class="asc-modal-window">
        <div class="asc-modal-header">
          <div class="asc-modal-title">
            ${window.AscUI.Icons.get('note_alt')} Upload Your Journal
          </div>
          <button class="asc-modal-close-btn" id="asc-modal-close">✕</button>
        </div>
        <div class="asc-modal-body">
          <div class="asc-form-group">
            <textarea class="asc-form-textarea" id="asc-input-summary" placeholder="Paste your AI recap, explanation, or study session notes here..."></textarea>
          </div>
          <div class="asc-modal-actions">
            <button class="asc-btn-secondary" id="asc-btn-prefill-sample">
              ✨ Pre-fill Demo Sample
            </button>
            <button class="asc-btn-primary" id="asc-btn-save-session">
              Save to Journal
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlayEl);

    // Event listeners
    document.getElementById('asc-modal-close').addEventListener('click', () => this.hide());
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.hide();
    });

    const textarea = document.getElementById('asc-input-summary');
    textarea.addEventListener('input', () => this.adjustHeight());

    document.getElementById('asc-btn-prefill-sample').addEventListener('click', () => {
      document.getElementById('asc-input-summary').value =
        `### Learning Session Recap:\n` +
        `- **Topic**: x86-64 Stack Frame Alignment & Subroutines\n` +
        `- **Key Insight**: System V AMD64 ABI requires the stack pointer %rsp to be aligned to 16 bytes prior to any CALL instruction. Misalignment caused SIGSEGV.\n` +
        `- **Next Step**: Implement recursive factorial using aligned push/pop pairs and verify stack offset in GDB.`;
      this.adjustHeight();
      window.AscUI.Toast.show('Demo sample pre-filled!', 'note_alt');
    });

    document.getElementById('asc-btn-save-session').addEventListener('click', () => {
      this.handleSave();
    });
  },

  adjustHeight() {
    const el = document.getElementById('asc-input-summary');
    if (!el) return;
    el.style.height = 'auto';
    const scrollH = el.scrollHeight;
    if (scrollH > 260) {
      el.style.height = '260px';
      el.style.overflowY = 'auto';
    } else {
      el.style.height = Math.max(110, scrollH) + 'px';
      el.style.overflowY = 'hidden';
    }
  },

  show() {
    this.init();
    this.overlayEl.classList.add('asc-show');
    this.adjustHeight();
    document.getElementById('asc-input-summary').focus();
  },

  hide() {
    if (this.overlayEl) {
      this.overlayEl.classList.remove('asc-show');
    }
  },

  async handleSave() {
    const text = document.getElementById('asc-input-summary').value.trim();

    if (!text) {
      window.AscUI.Toast.show('Please enter or paste summary text first.', 'note_alt');
      return;
    }

    const cleanSummary = text.replace(/^[#*\s-]+/gm, '').trim();
    const summary = cleanSummary.substring(0, 160) + (cleanSummary.length > 160 ? '...' : '');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const payload = {
      action: 'SAVE_AI_SESSION',
      platform: 'ambient_demo',
      text: text,
      summary: summary,
      time: timeStr
    };

    // Direct local store write for instant persistence
    if (typeof LocalStore !== 'undefined') {
      try {
        const journals = (await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS)) || [];
        const newJournal = {
          id: `jrnl_${Date.now()}`,
          date: 'Today',
          time: timeStr,
          summary: summary,
          aiFeedback: 'Captured from ambient study session.'
        };
        journals.unshift(newJournal);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, journals);
      } catch (e) {
        console.warn('[PasteModal] LocalStore write fallback:', e);
      }
    }

    // Send to MockServer backend
    try {
      chrome.runtime.sendMessage(payload, () => {
        this.hide();
        document.getElementById('asc-input-summary').value = '';
        this.adjustHeight();
        window.AscUI.Toast.show('Session saved to Journal!', 'book_5');
      });
    } catch (err) {
      this.hide();
      document.getElementById('asc-input-summary').value = '';
      this.adjustHeight();
      window.AscUI.Toast.show('Session saved to Journal!', 'book_5');
    }
  }
};
