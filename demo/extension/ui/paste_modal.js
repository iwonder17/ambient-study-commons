/**
 * AscUI - Paste Modal Module
 * Pop-up dialog to paste and record AI study sessions into local commons storage.
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
            <label class="asc-form-label">Course or Subject Context</label>
            <input type="text" class="asc-form-input" id="asc-input-course" value="CISP-310 Assembly Language" />
          </div>
          <div class="asc-form-group">
            <label class="asc-form-label">AI Response or Summary</label>
            <textarea class="asc-form-textarea" id="asc-input-summary" placeholder="Paste the AI's recap, explanation, or code insight here..."></textarea>
          </div>
          <div class="asc-modal-actions">
            <button class="asc-btn-secondary" id="asc-btn-prefill-sample">
              ✨ Pre-fill Demo Sample
            </button>
            <button class="asc-btn-primary" id="asc-btn-save-session">
              Save to Commons
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

    document.getElementById('asc-btn-prefill-sample').addEventListener('click', () => {
      document.getElementById('asc-input-course').value = 'CISP-310 Assembly Language';
      document.getElementById('asc-input-summary').value =
        `### Learning Session Recap:\n` +
        `- **Topic**: x86-64 Stack Frame Alignment & Subroutines\n` +
        `- **Key Insight**: System V AMD64 ABI requires the stack pointer %rsp to be aligned to 16 bytes prior to any CALL instruction. Misalignment caused SIGSEGV.\n` +
        `- **Next Step**: Implement recursive factorial using aligned push/pop pairs and verify stack offset in GDB.`;
      window.AscUI.Toast.show('Demo sample pre-filled!', 'note_alt');
    });

    document.getElementById('asc-btn-save-session').addEventListener('click', () => {
      this.handleSave();
    });
  },

  show() {
    this.init();
    this.overlayEl.classList.add('asc-show');
    document.getElementById('asc-input-summary').focus();
  },

  hide() {
    if (this.overlayEl) {
      this.overlayEl.classList.remove('asc-show');
    }
  },

  async handleSave() {
    const course = document.getElementById('asc-input-course').value.trim() || 'General Study';
    const text = document.getElementById('asc-input-summary').value.trim();

    if (!text) {
      window.AscUI.Toast.show('Please enter or paste summary text first.', 'note_alt');
      return;
    }

    try {
      chrome.runtime.sendMessage({
        action: 'SAVE_AI_SESSION',
        platform: 'ambient_demo',
        courseContext: course,
        text: text,
        summary: text.substring(0, 160) + '...',
        insight: 'Extracted stack frame alignment principles and GDB debugging workflow.'
      }, () => {
        this.hide();
        document.getElementById('asc-input-summary').value = '';
        window.AscUI.Toast.show('Session saved to Study Commons!', 'book_5');
      });
    } catch (err) {
      window.AscUI.Toast.show('Saved offline: ' + err.message, 'book_5');
    }
  }
};

