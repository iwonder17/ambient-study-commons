/**
 * AscUI - Toast Notification Module
 * Manages floating in-page feedback toasts.
 */

window.AscUI = window.AscUI || {};

window.AscUI.Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'asc-toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, iconName = 'book_5') {
    this.init();
    const toast = document.createElement('div');
    toast.className = 'asc-toast';
    toast.innerHTML = `
      <div class="asc-toast-icon">${window.AscUI.Icons.get(iconName)}</div>
      <span>${message}</span>
    `;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }
};

