/**
 * Ambient Study Commons (Demo) - Content Script
 * 100% Zero-Backend Offline Extension Controller
 * Features:
 * - Draggable master floating button with bounds clamping & position persistence.
 * - Material Symbols (book_5, content_copy, note_alt, sentiment_calm, owl).
 * - Decoupled prompts loaded dynamically from prompt/*.txt.
 * - Merged Auto Journal & Copy: Injects into chat input + copies to clipboard in 1 click.
 * - Paste modal with demo pre-fill.
 * - Weekly Journal Review prompt builder.
 * - Colorless, minimal, friendly UI.
 */

(function () {
  if (window.__asc_demo_injected) return;
  window.__asc_demo_injected = true;

  // 1. Inject Material Symbols font link
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=book_5,content_copy,note_alt,sentiment_calm,owl,dashboard,close,content_paste';
  document.head.appendChild(fontLink);

  // Fallback SVG icon helper
  function getIcon(name) {
    return `<span class="material-symbols-outlined">${name}</span>`;
  }

  // 2. State & References
  let isMenuOpen = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialLeft = 0;
  let initialTop = 0;
  let hasMoved = false;

  // 3. Create DOM Elements
  const root = document.createElement('div');
  root.id = 'asc-master-button-root';

  const masterBtn = document.createElement('button');
  masterBtn.className = 'asc-master-btn';
  masterBtn.title = 'Ambient Study Commons (Click to open, drag to move)';
  masterBtn.innerHTML = `
    ${getIcon('book_5')}
    <span class="asc-pulse-dot"></span>
  `;

  // Dropdown Menu
  const menu = document.createElement('div');
  menu.id = 'asc-dropdown-menu';
  menu.innerHTML = `
    <div class="asc-menu-header">
      <div class="asc-menu-title">
        ${getIcon('book_5')} Study Commons
      </div>
      <span class="asc-menu-badge">Demo</span>
    </div>

    <div class="asc-menu-section">
      <!-- 1. Merged Prompt Inject & Copy -->
      <button class="asc-menu-item" id="asc-btn-recap-copy" title="Inject prompt into chat and copy to clipboard">
        <div class="asc-item-icon">${getIcon('content_copy')}</div>
        <div class="asc-item-content">
          <div class="asc-item-label">Auto Journal & Copy</div>
          <div class="asc-item-desc">Injects prompt & copies to clipboard</div>
        </div>
      </button>

      <!-- 2. Paste AI Response Modal -->
      <button class="asc-menu-item" id="asc-btn-paste-modal" title="Record AI response into local storage">
        <div class="asc-item-icon">${getIcon('note_alt')}</div>
        <div class="asc-item-content">
          <div class="asc-item-label">Paste & Save AI Response</div>
          <div class="asc-item-desc">Record session to local Commons</div>
        </div>
      </button>

      <!-- 3. Journal Review -->
      <button class="asc-menu-item" id="asc-btn-journal-review" title="Compile weekly journal review prompt">
        <div class="asc-item-icon">${getIcon('sentiment_calm')}</div>
        <div class="asc-item-content">
          <div class="asc-item-label">Journal Review</div>
          <div class="asc-item-desc">Weekly synthesis prompt</div>
        </div>
      </button>

      <!-- 4. Canvas Data Collector -->
      <button class="asc-menu-item" id="asc-btn-canvas-collect" title="Collect syllabus, modules & deadlines">
        <div class="asc-item-icon">${getIcon('owl')}</div>
        <div class="asc-item-content">
          <div class="asc-item-label">Collect Canvas Data</div>
          <div class="asc-item-desc">Save modules, grades & deadlines</div>
        </div>
      </button>
    </div>

    <div class="asc-menu-divider"></div>

    <div class="asc-menu-footer">
      <button class="asc-dashboard-link" id="asc-link-dashboard">
        ${getIcon('dashboard')} Open Study Commons Dashboard ↗
      </button>
    </div>
  `;

  // Paste Response Modal
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'asc-modal-overlay';
  modalOverlay.innerHTML = `
    <div class="asc-modal-window">
      <div class="asc-modal-header">
        <div class="asc-modal-title">
          ${getIcon('note_alt')} Record AI Learning Session
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

  // Toast Container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'asc-toast-container';

  root.appendChild(masterBtn);
  root.appendChild(menu);
  document.body.appendChild(root);
  document.body.appendChild(modalOverlay);
  document.body.appendChild(toastContainer);

  // 4. Restore Saved Position or Default
  async function restoreButtonPosition() {
    try {
      const result = await chrome.storage.local.get('asc_button_position');
      const pos = result.asc_button_position;
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        // Clamp to current viewport
        const clampedX = Math.max(10, Math.min(window.innerWidth - 62, pos.x));
        const clampedY = Math.max(10, Math.min(window.innerHeight - 62, pos.y));
        root.style.left = `${clampedX}px`;
        root.style.top = `${clampedY}px`;
        root.style.right = 'auto';
        root.style.bottom = 'auto';
      } else {
        // Default: Bottom-right corner
        root.style.right = '28px';
        root.style.bottom = '28px';
        root.style.left = 'auto';
        root.style.top = 'auto';
      }
    } catch (e) {
      root.style.right = '28px';
      root.style.bottom = '28px';
    }
  }
  restoreButtonPosition();

  // 5. Draggable Handler with bounds clamping
  masterBtn.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    isDragging = true;
    hasMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const rect = root.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // Switch from right/bottom to absolute left/top during drag
    root.style.left = `${initialLeft}px`;
    root.style.top = `${initialTop}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';

    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      hasMoved = true;
    }

    if (hasMoved) {
      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;

      // Clamping within viewport
      const maxLeft = window.innerWidth - 60;
      const maxTop = window.innerHeight - 60;
      newLeft = Math.max(10, Math.min(maxLeft, newLeft));
      newTop = Math.max(10, Math.min(maxTop, newTop));

      root.style.left = `${newLeft}px`;
      root.style.top = `${newTop}px`;
    }
  });

  window.addEventListener('mouseup', async (e) => {
    if (!isDragging) return;
    isDragging = false;

    if (hasMoved) {
      // It was a drag: persist position
      const rect = root.getBoundingClientRect();
      const pos = { x: rect.left, y: rect.top };
      await chrome.storage.local.set({ asc_button_position: pos });
    } else {
      // It was a click: toggle menu
      toggleMenu();
    }
  });

  // Toggle Menu
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
      menu.classList.add('asc-show');
      // Position menu intelligently if too close to right edge
      const rect = root.getBoundingClientRect();
      if (rect.left < 310) {
        menu.style.right = 'auto';
        menu.style.left = '0';
      } else {
        menu.style.left = 'auto';
        menu.style.right = '0';
      }
    } else {
      menu.classList.remove('asc-show');
    }
  }

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target) && isMenuOpen) {
      isMenuOpen = false;
      menu.classList.remove('asc-show');
    }
  });

  // 6. Toast Notification Helper
  function showToast(message, iconName = 'book_5') {
    const toast = document.createElement('div');
    toast.className = 'asc-toast';
    toast.innerHTML = `
      <div class="asc-toast-icon">${getIcon(iconName)}</div>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // 7. Dynamic Prompt Loader (from prompt/*.txt)
  async function loadPrompt(fileName) {
    const url = chrome.runtime.getURL(`prompt/${fileName}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${fileName}`);
    return await res.text();
  }

  // 8. Chat Input Box Finder & Injector
  function findChatInput() {
    // ChatGPT
    const chatGpt = document.querySelector('#prompt-textarea') ||
                    document.querySelector('textarea[data-id="root"]') ||
                    document.querySelector('div[contenteditable="true"][id*="prompt"]');
    if (chatGpt) return chatGpt;

    // Gemini
    const gemini = document.querySelector('.ql-editor') ||
                   document.querySelector('rich-textarea textarea') ||
                   document.querySelector('rich-textarea [contenteditable="true"]');
    if (gemini) return gemini;

    // Claude
    const claude = document.querySelector('div[contenteditable="true"].ProseMirror') ||
                   document.querySelector('fieldset textarea');
    if (claude) return claude;

    // Generic fallback
    return document.querySelector('textarea, div[contenteditable="true"]');
  }

  function injectTextIntoInput(el, text) {
    if (!el) return false;
    el.focus();
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (el.isContentEditable) {
      el.innerText = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  }

  // 9. Button Handlers

  // Button 1: Merged "Auto Journal & Copy"
  document.getElementById('asc-btn-recap-copy').addEventListener('click', async () => {
    isMenuOpen = false;
    menu.classList.remove('asc-show');

    try {
      const promptText = await loadPrompt('data_collecting.txt');
      
      // Execute copy to clipboard
      await navigator.clipboard.writeText(promptText);

      // Attempt injection into active chat
      const inputEl = findChatInput();
      const injected = injectTextIntoInput(inputEl, promptText);

      if (injected) {
        showToast('Prompt injected & copied to clipboard!', 'content_copy');
      } else {
        showToast('Prompt copied to clipboard! Paste into your chat.', 'content_copy');
      }
    } catch (err) {
      showToast('Error loading prompt: ' + err.message, 'content_copy');
    }
  });

  // Button 2: Paste & Save AI Response Modal
  document.getElementById('asc-btn-paste-modal').addEventListener('click', () => {
    isMenuOpen = false;
    menu.classList.remove('asc-show');
    modalOverlay.classList.add('asc-show');
    document.getElementById('asc-input-summary').focus();
  });

  document.getElementById('asc-modal-close').addEventListener('click', () => {
    modalOverlay.classList.remove('asc-show');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('asc-show');
    }
  });

  // Pre-fill demo sample
  document.getElementById('asc-btn-prefill-sample').addEventListener('click', () => {
    document.getElementById('asc-input-course').value = 'CISP-310 Assembly Language';
    document.getElementById('asc-input-summary').value = 
      `### Learning Session Recap:\n` +
      `- **Topic**: x86-64 Stack Frame Alignment & Subroutines\n` +
      `- **Key Insight**: System V AMD64 ABI requires the stack pointer %rsp to be aligned to 16 bytes prior to any CALL instruction. Misalignment caused SIGSEGV.\n` +
      `- **Next Step**: Implement recursive factorial using aligned push/pop pairs and verify stack offset in GDB.`;
    showToast('Demo sample pre-filled!', 'note_alt');
  });

  // Save session to Local Storage
  document.getElementById('asc-btn-save-session').addEventListener('click', async () => {
    const course = document.getElementById('asc-input-course').value.trim() || 'General Study';
    const text = document.getElementById('asc-input-summary').value.trim();

    if (!text) {
      showToast('Please enter or paste summary text first.', 'note_alt');
      return;
    }

    try {
      // Save session via message or local store
      chrome.runtime.sendMessage({
        action: 'SAVE_AI_SESSION',
        platform: 'ambient_demo',
        courseContext: course,
        text: text,
        summary: text.substring(0, 160) + '...',
        insight: 'Extracted stack frame alignment principles and GDB debugging workflow.'
      }, (res) => {
        modalOverlay.classList.remove('asc-show');
        document.getElementById('asc-input-summary').value = '';
        showToast('Session saved to Study Commons!', 'book_5');
      });
    } catch (err) {
      showToast('Saved offline: ' + err.message, 'book_5');
    }
  });

  // Button 3: Journal Review
  document.getElementById('asc-btn-journal-review').addEventListener('click', async () => {
    isMenuOpen = false;
    menu.classList.remove('asc-show');

    try {
      chrome.runtime.sendMessage({ action: 'GET_JOURNALS_FOR_REVIEW' }, async (response) => {
        if (response && response.success) {
          await navigator.clipboard.writeText(response.text);
          const inputEl = findChatInput();
          injectTextIntoInput(inputEl, response.text);
          showToast(`Journal Review ready! (${response.count} sessions copied)`, 'sentiment_calm');
        } else {
          showToast('Failed to compile review prompt', 'sentiment_calm');
        }
      });
    } catch (err) {
      showToast('Review error: ' + err.message, 'sentiment_calm');
    }
  });

  // Button 4: Collect Canvas Data
  document.getElementById('asc-btn-canvas-collect').addEventListener('click', async () => {
    isMenuOpen = false;
    menu.classList.remove('asc-show');

    // Scrape or mock Canvas LMS data
    const pageTitle = document.title || 'Canvas Course';
    const isCanvas = window.location.hostname.includes('instructure.com') ||
                     document.querySelector('#application.ic-app');

    const courseCode = isCanvas ? (document.querySelector('.course-title')?.innerText || 'CISP-310') : 'CISP-310';
    
    // Save to local storage
    const canvasReminders = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS);
    const newReminder = {
      id: `canvas_${Date.now()}`,
      course: courseCode,
      title: 'Lab 4 Verification & Stack Framing',
      type: 'assignment',
      due: 'Tomorrow, 11:59 PM',
      status: 'pending',
      gradeWeight: '5%'
    };
    canvasReminders.unshift(newReminder);
    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS, canvasReminders);

    showToast(`Canvas data updated for ${courseCode}!`, 'owl');
  });

  // Link: Open Dashboard
  document.getElementById('asc-link-dashboard').addEventListener('click', () => {
    isMenuOpen = false;
    menu.classList.remove('asc-show');
    chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
  });

})();

