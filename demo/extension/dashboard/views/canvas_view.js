/**
 * Dashboard View - Canvas Course Context Tab
 * Pure background knowledge base collected for backend AI review (no schedule notifications).
 */

window.AscDash = window.AscDash || {};

window.AscDash.CanvasView = {
  canvasItems: [],
  onDataChanged: null,

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.bindEvents();
  },

  render(items) {
    this.canvasItems = items || [];
    const container = document.getElementById('canvas-reminders-list');
    container.innerHTML = '';

    if (this.canvasItems.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a;">No Canvas context collected yet. Course modules will appear here when synced.</div>`;
      return;
    }

    this.canvasItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'asc-card';

      card.innerHTML = `
        <div class="asc-card-header">
          <div class="asc-card-meta">
            <span class="asc-tag">${item.course}</span>
            <span>•</span>
            <span>Context ID: ${item.id}</span>
          </div>
          <span class="asc-badge" style="font-size:10px;">FOR BACKEND AI REVIEW</span>
        </div>
        <div style="font-size:14px; font-weight:600; color: #fafafa;">
          ${item.title}
        </div>
        <div style="font-size:12px; color:#a1a1aa; line-height:1.4;">
          <strong>Course Topics:</strong> ${Array.isArray(item.topicsCovered) ? item.topicsCovered.join(', ') : 'Subroutine Alignment, Calling Conventions, GDB Debugging'}
        </div>
      `;
      container.appendChild(card);
    });
  },

  bindEvents() {
    document.getElementById('btn-sync-canvas-mock').addEventListener('click', async () => {
      const newContext = {
        id: `canvas_${Date.now()}`,
        course: 'CISP-310',
        title: 'Module 5: 64-bit Floating Point & Vector SSE Operations',
        type: 'course_context',
        status: 'synced_for_ai_review',
        topicsCovered: ['SIMD Vectorization', 'XMM Registers', 'Floating Point ABI']
      };
      this.canvasItems.unshift(newContext);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS, this.canvasItems);
      this.render(this.canvasItems);
      if (typeof this.onDataChanged === 'function') this.onDataChanged();
      window.AscDash.Toast.show('Canvas course context cached for AI review', 'owl');
    });
  }
};
