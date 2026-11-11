/**
 * AscUI - Master Floating Button Module
 * Renders:
 * 1. Circular floating trigger button with rotating rainbow halo
 * 2. Event-driven red notification dot (only active when backend emits an event)
 * 3. Compact 2-line speech bubble notification wrapper (pure notification, zero confirmation buttons, 25s auto-dismiss)
 */

window.AscUI = window.AscUI || {};

window.AscUI.MasterButton = {
  rootEl: null,
  btnWrapper: null,
  btnEl: null,
  notifDot: null,
  matchBubble: null,
  bubbleTimer: null,

  async init() {
    this.rootEl = document.createElement('div');
    this.rootEl.id = 'asc-master-button-root';

    // Button Wrapper holding Rainbow Ring, Button, and Notification Dot
    this.btnWrapper = document.createElement('div');
    this.btnWrapper.className = 'asc-btn-wrapper';

    this.btnWrapper.innerHTML = `
      <!-- 1. Color Rainbow Ring -->
      <div class="asc-rainbow-ring" title="Study Commons"></div>

      <!-- 2. Master Button -->
      <button class="asc-master-btn" id="asc-master-btn-trigger" title="Ambient Study Commons (Click to open, drag to move)">
        ${window.AscUI.Icons.get('book_5')}
        <!-- 3. Red Notification Dot (only shows when backend sends an event) -->
        <span class="asc-notification-dot" id="asc-notification-dot"></span>
      </button>
    `;

    // 3. Compact 2-Line Pure Notification Bubble
    this.matchBubble = document.createElement('div');
    this.matchBubble.id = 'asc-match-bubble';
    this.matchBubble.className = 'asc-match-bubble';
    this.matchBubble.title = 'Click to dismiss';
    this.matchBubble.innerHTML = `
      <div class="asc-bubble-content">
        <div class="asc-bubble-line1">
          <span class="asc-bubble-icon">${window.AscUI.Icons.get('waving_hand')}</span>
          <span class="asc-bubble-title">Study Match Found</span>
        </div>
        <div class="asc-bubble-line2" id="asc-bubble-text">
          Alex Rivera • 94% match (CISP-310)
        </div>
      </div>
      <!-- Triangle pointer beak pointing toward button -->
      <div class="asc-bubble-tail"></div>
    `;

    this.rootEl.appendChild(this.matchBubble);
    this.rootEl.appendChild(this.btnWrapper);
    document.body.appendChild(this.rootEl);

    this.btnEl = document.getElementById('asc-master-btn-trigger');
    this.notifDot = document.getElementById('asc-notification-dot');

    // Clicking anywhere on the notification bubble dismisses it
    this.matchBubble.addEventListener('click', () => {
      this.hideMatchBubble();
    });

    // Initialize Dropdown inside root
    window.AscUI.DropdownMenu.init(this.rootEl);

    // Initialize Draggable with click callback
    window.AscUI.Draggable.init(this.rootEl, this.btnEl, () => {
      this.clearNotificationDot();
      this.hideMatchBubble();
      const rect = this.rootEl.getBoundingClientRect();
      window.AscUI.DropdownMenu.toggle(rect);
    });

    // Check initial unread status from storage
    await this.checkUnreadState();

    // Listen for Backend Push Events (from Mock Server)
    this.listenToBackendEvents();
  },

  async checkUnreadState() {
    try {
      const res = await chrome.storage.local.get('asc_unread_notifications');
      const unread = res.asc_unread_notifications;
      if (Array.isArray(unread) && unread.length > 0) {
        this.showNotificationDot();
      }
    } catch (e) {}
  },

  listenToBackendEvents() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === 'BACKEND_EVENT') {
        console.log('[MasterButton] Received Backend Event from MockServer:', message.event, message.data);
        this.showNotificationDot();

        // When a Peer Match event arrives from the mock server, trigger the 2-line speech bubble!
        if (message.event === 'PEER_MATCH_FOUND' && message.data) {
          this.showMatchBubble(message.data);
        }
      }
    });
  },

  showNotificationDot() {
    if (this.notifDot) {
      this.notifDot.classList.add('asc-show-dot');
    }
  },

  clearNotificationDot() {
    if (this.notifDot) {
      this.notifDot.classList.remove('asc-show-dot');
    }
    try {
      chrome.runtime.sendMessage({ action: 'CLEAR_NOTIFICATIONS' });
    } catch (e) {}
  },

  // Show compact 2-line notification bubble for exactly 25 seconds
  showMatchBubble(data) {
    if (!this.matchBubble) return;

    const peer = data.peerName || 'Peer';
    const score = data.matchScore ? `${data.matchScore}% match` : 'Matched';
    const course = data.course || 'CISP-310';

    const textEl = document.getElementById('asc-bubble-text');
    if (textEl) {
      textEl.textContent = `${peer} • ${score} (${course})`;
    }

    if (this.bubbleTimer) {
      clearTimeout(this.bubbleTimer);
    }

    this.matchBubble.classList.add('asc-show-bubble');

    // Auto-dismiss after 25 seconds
    this.bubbleTimer = setTimeout(() => {
      this.hideMatchBubble();
    }, 25000);
  },

  hideMatchBubble() {
    if (this.matchBubble) {
      this.matchBubble.classList.remove('asc-show-bubble');
    }
    if (this.bubbleTimer) {
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = null;
    }
  }
};
