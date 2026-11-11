/**
 * AscUI - Dropdown Menu Module
 * Holds the dropdown menu items, icons, and click actions.
 * Easily tweak button labels, icons, or actions right here.
 */

window.AscUI = window.AscUI || {};

window.AscUI.DropdownMenu = {
  menuEl: null,
  isOpen: false,

  init(containerEl) {
    this.menuEl = document.createElement('div');
    this.menuEl.id = 'asc-dropdown-menu';
    this.menuEl.innerHTML = `
      <div class="asc-menu-header">
        <div class="asc-menu-title">
          ${window.AscUI.Icons.get('book_5')} Study Commons
        </div>
        <span class="asc-menu-badge">Demo</span>
      </div>

      <div class="asc-menu-section">
        <!-- 1. Create Journal -->
        <button class="asc-menu-item" id="asc-btn-recap-copy" title="Copy prompt and paste to your AI">
          <div class="asc-item-icon">${window.AscUI.Icons.get('content_copy')}</div>
          <div class="asc-item-content">
            <div class="asc-item-label">Creating Journal</div>
            <div class="asc-item-desc">Paste and send to your AI</div>
          </div>
        </button>

        <!-- 2. Upload Your Journal -->
        <button class="asc-menu-item" id="asc-btn-paste-modal" title="Upload and save your journal">
          <div class="asc-item-icon">${window.AscUI.Icons.get('note_alt')}</div>
          <div class="asc-item-content">
            <div class="asc-item-label">Upload Your Journal</div>
            <div class="asc-item-desc">Save your journal content</div>
          </div>
        </button>

        <!-- 3. Journal Review -->
        <button class="asc-menu-item" id="asc-btn-journal-review" title="A cozy look at your weekly progress">
          <div class="asc-item-icon">${window.AscUI.Icons.get('sentiment_calm')}</div>
          <div class="asc-item-content">
            <div class="asc-item-label">Journal Review</div>
            <div class="asc-item-desc">A cozy look at how you've grown 🌱</div>
          </div>
        </button>

        <!-- 4. Personalise with Canvas -->
        <button class="asc-menu-item" id="asc-btn-canvas-collect" title="Connect Canvas course topics with your dreams">
          <div class="asc-item-icon">${window.AscUI.Icons.get('owl')}</div>
          <div class="asc-item-content">
            <div class="asc-item-label">Personalise with Canvas</div>
            <div class="asc-item-desc">Sort topics by your passions & dreams ✨</div>
          </div>
        </button>
      </div>

      <div class="asc-menu-divider"></div>

      <div class="asc-menu-footer">
        <button class="asc-dashboard-link" id="asc-link-dashboard">
          ${window.AscUI.Icons.get('dashboard')} Open Study Commons Dashboard ↗
        </button>
      </div>
    `;

    containerEl.appendChild(this.menuEl);
    this.bindEvents();
  },

  toggle(parentRect) {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.menuEl.classList.add('asc-show');
      if (parentRect && parentRect.left < 310) {
        this.menuEl.style.right = 'auto';
        this.menuEl.style.left = '0';
      } else {
        this.menuEl.style.left = 'auto';
        this.menuEl.style.right = '0';
      }
    } else {
      this.menuEl.classList.remove('asc-show');
    }
  },

  close() {
    this.isOpen = false;
    this.menuEl.classList.remove('asc-show');
  },

  bindEvents() {
    // 1. Merged Prompt Inject & Copy
    document.getElementById('asc-btn-recap-copy').addEventListener('click', async () => {
      this.close();
      try {
        const url = chrome.runtime.getURL('prompt/data_collecting.txt');
        const res = await fetch(url);
        const promptText = await res.text();

        await navigator.clipboard.writeText(promptText);
        const injected = window.AscUI.Injector.inject(promptText);

        if (injected) {
          window.AscUI.Toast.show('Prompt injected & copied to clipboard!', 'content_copy');
        } else {
          window.AscUI.Toast.show('Prompt copied to clipboard! Paste into your chat.', 'content_copy');
        }
      } catch (err) {
        window.AscUI.Toast.show('Prompt error: ' + err.message, 'content_copy');
      }
    });

    // 2. Open Paste Modal
    document.getElementById('asc-btn-paste-modal').addEventListener('click', () => {
      this.close();
      window.AscUI.PasteModal.show();
    });

    // 3. Weekly Journal Review
    document.getElementById('asc-btn-journal-review').addEventListener('click', () => {
      this.close();
      chrome.runtime.sendMessage({ action: 'GET_JOURNALS_FOR_REVIEW' }, async (response) => {
        if (response && response.success) {
          await navigator.clipboard.writeText(response.text);
          window.AscUI.Injector.inject(response.text);
          window.AscUI.Toast.show(`Journal Review ready! (${response.count} sessions copied)`, 'sentiment_calm');
        } else {
          window.AscUI.Toast.show('Failed to compile review prompt', 'sentiment_calm');
        }
      });
    });

    // 4. Collect Canvas Data (ambient background context for AI backend review)
    document.getElementById('asc-btn-canvas-collect').addEventListener('click', async () => {
      this.close();
      const courseCode = 'CISP-310';
      const canvasData = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS);
      const newModule = {
        id: `canvas_${Date.now()}`,
        course: courseCode,
        title: 'Module 4: Subroutine Call Conventions & Stack Framing',
        type: 'course_context',
        status: 'synced_for_ai_review',
        topicsCovered: ['Stack Frames', 'Callee-saved Registers', 'ABI Conventions']
      };
      canvasData.unshift(newModule);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS, canvasData);
      window.AscUI.Toast.show(`Canvas course context collected for backend review`, 'owl');
    });

    // 5. Open Dashboard Link
    document.getElementById('asc-link-dashboard').addEventListener('click', () => {
      this.close();
      chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.menuEl.contains(e.target) && !e.target.closest('#asc-master-button-root') && this.isOpen) {
        this.close();
      }
    });
  }
};

