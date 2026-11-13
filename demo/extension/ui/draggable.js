/**
 * AscUI - Draggable Controller Module
 * Handles dragging movement, viewport boundary clamping, and storage persistence.
 */

window.AscUI = window.AscUI || {};

window.AscUI.Draggable = {
  rootEl: null,
  isDragging: false,
  hasMoved: false,
  startX: 0,
  startY: 0,
  initialLeft: 0,
  initialTop: 0,

  async init(rootEl, triggerEl, onToggleClick) {
    this.rootEl = rootEl;
    await this.restorePosition();

    triggerEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.hasMoved = false;
      this.startX = e.clientX;
      this.startY = e.clientY;

      const rect = this.rootEl.getBoundingClientRect();
      this.initialLeft = rect.left;
      this.initialTop = rect.top;

      this.rootEl.style.left = `${this.initialLeft}px`;
      this.rootEl.style.top = `${this.initialTop}px`;
      this.rootEl.style.right = 'auto';
      this.rootEl.style.bottom = 'auto';

      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.startX;
      const deltaY = e.clientY - this.startY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        this.hasMoved = true;
      }

      if (this.hasMoved) {
        let newLeft = this.initialLeft + deltaX;
        let newTop = this.initialTop + deltaY;

        // Viewport bounds clamping
        const maxLeft = window.innerWidth - 60;
        const maxTop = window.innerHeight - 60;
        newLeft = Math.max(10, Math.min(maxLeft, newLeft));
        newTop = Math.max(10, Math.min(maxTop, newTop));

        this.rootEl.style.left = `${newLeft}px`;
        this.rootEl.style.top = `${newTop}px`;
      }
    });

    window.addEventListener('mouseup', async () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.hasMoved) {
        // Drag finished: persist position
        const rect = this.rootEl.getBoundingClientRect();
        await chrome.storage.local.set({
          asc_button_position: { x: rect.left, y: rect.top }
        });
      } else {
        // Simple click: toggle dropdown
        if (typeof onToggleClick === 'function') {
          onToggleClick();
        }
      }
    });
  },

  async restorePosition() {
    try {
      const res = await chrome.storage.local.get('asc_button_position');
      const pos = res.asc_button_position;
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        const clampedX = Math.max(10, Math.min(window.innerWidth - 62, pos.x));
        const clampedY = Math.max(10, Math.min(window.innerHeight - 62, pos.y));
        this.rootEl.style.left = `${clampedX}px`;
        this.rootEl.style.top = `${clampedY}px`;
        this.rootEl.style.right = 'auto';
        this.rootEl.style.bottom = 'auto';
      } else {
        this.rootEl.style.right = '24px';
        this.rootEl.style.top = '20%';
        this.rootEl.style.left = 'auto';
        this.rootEl.style.bottom = 'auto';
      }
    } catch {
      this.rootEl.style.right = '24px';
      this.rootEl.style.top = '20%';
      this.rootEl.style.left = 'auto';
      this.rootEl.style.bottom = 'auto';
    }
  }
};

