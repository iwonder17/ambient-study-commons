/**
 * Ambient Study Commons - Content Script
 * Injected into chatgpt.com and gemini.google.com
 * Provides the floating study mascot, Auto Recap prompt injection, and Manual Paste fallback.
 */

(function () {
  // Prevent duplicate injection
  if (document.getElementById('asc-floating-root')) return;

  const isGemini = window.location.hostname.includes('gemini.google.com');
  const isChatGPT = window.location.hostname.includes('chatgpt.com');
  const platformName = isGemini ? 'gemini' : (isChatGPT ? 'chatgpt' : 'ai_assistant');

  const SAMPLE_RECAP_TEXT = 
`[CISP 310 Lab 4 Study Session]
Debugging segmentation fault in x86-64 recursive factorial subroutine.
- Key Discovery: System V AMD64 ABI enforces 16-byte stack alignment prior to 'call' instructions.
- GDB Techniques: Used 'layout regs' and 'x/20gx $rsp' to inspect misaligned frames.
- Solution: Subtracted 8 bytes from %rsp before printf call to preserve alignment.
- Next Target: Implement base case branch and test register preservation (%rbx, %r12).`;

  // 1. Create Root Element
  const root = document.createElement('div');
  root.id = 'asc-floating-root';

  const mascotUrl = chrome.runtime.getURL('icons/icon48.png');

  root.innerHTML = `
    <!-- Mascot Toggle Button -->
    <div class="asc-mascot-btn" id="asc-mascot-btn" title="Study Buddy (Click to open)">
      <img src="${mascotUrl}" class="asc-mascot-img" alt="Study Buddy Mascot" />
      <div class="asc-status-dot"></div>
    </div>

    <!-- Dropdown Panel -->
    <div class="asc-dropdown-panel" id="asc-dropdown-panel">
      <div class="asc-panel-header">
        <span>🦉 Study Buddy</span>
        <span class="asc-badge-course">CISP-310 Lab 4</span>
      </div>
      <button class="asc-btn-action asc-primary" id="asc-btn-auto-recap">
        <span>✨</span>
        <span>Auto Recap</span>
      </button>
      <button class="asc-btn-action" id="asc-btn-open-paste">
        <span>📋</span>
        <span>Paste &amp; Send</span>
      </button>
      <button class="asc-btn-action" id="asc-btn-dashboard">
        <span>📊</span>
        <span>Open Commons</span>
      </button>
    </div>

    <!-- Modal for Manual Paste Fallback -->
    <div class="asc-modal-overlay" id="asc-modal-overlay">
      <div class="asc-modal-card">
        <div class="asc-modal-header">
          <div class="asc-modal-title">
            <span>📝</span>
            <span>Log Study Session</span>
          </div>
          <button class="asc-modal-close" id="asc-modal-close">&times;</button>
        </div>
        <textarea class="asc-textarea" id="asc-modal-textarea" placeholder="Paste your AI study summary or takeaways here..."></textarea>
        <div class="asc-modal-footer">
          <button class="asc-btn-sample" id="asc-btn-insert-sample">Insert Sample Lab 4 Recap</button>
          <button class="asc-btn-submit" id="asc-btn-save-session">Save to Storage</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div class="asc-toast" id="asc-toast">
      <span>✅</span>
      <span id="asc-toast-msg">Session logged to Local Storage!</span>
    </div>
  `;

  document.body.appendChild(root);

  // 2. DOM Elements
  const mascotBtn = document.getElementById('asc-mascot-btn');
  const dropdownPanel = document.getElementById('asc-dropdown-panel');
  const btnAutoRecap = document.getElementById('asc-btn-auto-recap');
  const btnOpenPaste = document.getElementById('asc-btn-open-paste');
  const btnDashboard = document.getElementById('asc-btn-dashboard');
  const modalOverlay = document.getElementById('asc-modal-overlay');
  const modalClose = document.getElementById('asc-modal-close');
  const modalTextarea = document.getElementById('asc-modal-textarea');
  const btnInsertSample = document.getElementById('asc-btn-insert-sample');
  const btnSaveSession = document.getElementById('asc-btn-save-session');
  const toast = document.getElementById('asc-toast');
  const toastMsg = document.getElementById('asc-toast-msg');

  // 3. UI Helpers
  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('asc-toast-show');
    setTimeout(() => {
      toast.classList.remove('asc-toast-show');
    }, 2800);
  }

  function toggleDropdown() {
    dropdownPanel.classList.toggle('asc-visible');
  }

  function closeDropdown() {
    dropdownPanel.classList.remove('asc-visible');
  }

  // Click outside to close dropdown
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      closeDropdown();
    }
  });

  mascotBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Open Dashboard
  btnDashboard.addEventListener('click', () => {
    closeDropdown();
    chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
  });

  // Open Paste Modal
  btnOpenPaste.addEventListener('click', () => {
    closeDropdown();
    modalOverlay.classList.add('asc-visible');
    modalTextarea.focus();
  });

  modalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('asc-visible');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('asc-visible');
    }
  });

  btnInsertSample.addEventListener('click', () => {
    modalTextarea.value = SAMPLE_RECAP_TEXT;
  });

  // Save session directly to chrome.storage.local
  async function persistSession(text) {
    if (!text || !text.trim()) {
      showToast('⚠️ Please enter recap content first.');
      return;
    }

    const newRecord = {
      session_id: 'sess_' + Date.now(),
      platform: platformName,
      timestamp: new Date().toISOString(),
      course_context: 'CISP-310',
      recap_text: text.trim()
    };

    try {
      const storageKey = 'asc_journal_log';
      const result = await chrome.storage.local.get([storageKey]);
      const currentLog = result[storageKey] || {
        last_updated: new Date().toISOString(),
        today_master_journal: null,
        raw_sessions: []
      };

      currentLog.raw_sessions = currentLog.raw_sessions || [];
      currentLog.raw_sessions.unshift(newRecord);
      currentLog.last_updated = new Date().toISOString();

      await chrome.storage.local.set({ [storageKey]: currentLog });
      showToast('✅ Session saved to Local Storage!');
      modalOverlay.classList.remove('asc-visible');
      modalTextarea.value = '';
    } catch (err) {
      console.error('[ASC] Error saving session:', err);
      showToast('❌ Error saving session to storage');
    }
  }

  btnSaveSession.addEventListener('click', () => {
    persistSession(modalTextarea.value);
  });

  // Auto Recap Handler: Attempt to inject prompt or grab chat summary
  btnAutoRecap.addEventListener('click', async () => {
    closeDropdown();
    showToast('✨ Triggering Auto Recap...');

    // Attempt to inject prompt into active chat input
    let inputEl = null;
    if (isChatGPT) {
      inputEl = document.querySelector('#prompt-textarea') || 
                document.querySelector('div[contenteditable="true"]');
    } else if (isGemini) {
      inputEl = document.querySelector('rich-textarea p') || 
                document.querySelector('textarea') || 
                document.querySelector('div[contenteditable="true"]');
    }

    const recapPrompt = "Please generate a concise 3-bullet recap of the technical concepts, assembly instructions, and debugging methods we just worked through.";

    if (inputEl) {
      if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
        inputEl.value = recapPrompt;
      } else {
        inputEl.innerText = recapPrompt;
      }
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      showToast('✨ Recap prompt injected! Press Enter to send.');
    } else {
      // Graceful fallback: open paste modal with pre-filled sample
      modalTextarea.value = SAMPLE_RECAP_TEXT;
      modalOverlay.classList.add('asc-visible');
      showToast('📋 Ready! Review or edit recap below.');
    }
  });

  console.log('[ASC] Study Buddy widget mounted for ' + platformName);
})();
