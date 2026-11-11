/**
 * Dashboard View - Dream Exploration Topics Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.DreamsView = {
  dreams: [],
  onDataChanged: null,

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.bindEvents();
  },

  render(dreams) {
    this.dreams = dreams || [];
    const container = document.getElementById('dreams-list');
    container.innerHTML = '';

    if (this.dreams.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a;">No dream topics recorded yet. Sign in with Google to explore your elective interests.</div>`;
      return;
    }

    this.dreams.forEach(d => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      card.innerHTML = `
        <div class="asc-card-header">
          <span class="asc-tag">${d.course || 'Elective'}</span>
          <span style="font-size:10px; color:#71717a;">${d.date || 'Active'}</span>
        </div>
        <div style="font-size:13px; font-weight:600;">${d.title}</div>
        <div style="font-size:12px; color:#a1a1aa;">${d.description}</div>
      `;
      container.appendChild(card);
    });
  },

  bindEvents() {
    document.getElementById('form-add-dream').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('dream-title').value.trim();
      const desc = document.getElementById('dream-desc').value.trim();
      const course = document.getElementById('dream-course').value.trim();

      if (!title) return;

      const newDream = {
        id: `drm_${Date.now()}`,
        title,
        description: desc,
        course: course || 'Elective',
        date: 'Just now'
      };

      this.dreams.unshift(newDream);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS, this.dreams);
      this.render(this.dreams);
      if (typeof this.onDataChanged === 'function') this.onDataChanged();

      document.getElementById('dream-title').value = '';
      document.getElementById('dream-desc').value = '';
      window.AscDash.Toast.show('Dream exploration topic published locally!', 'rocket_launch');
    });
  }
};

