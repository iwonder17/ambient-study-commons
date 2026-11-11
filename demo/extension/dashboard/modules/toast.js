/**
 * Dashboard Toast Module
 */

window.AscDash = window.AscDash || {};

window.AscDash.Toast = {
  show(message, icon = 'info') {
    const container = document.getElementById('asc-dash-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'asc-toast';
    toast.style.background = '#18181b';
    toast.style.border = '1px solid #3f3f46';
    toast.style.color = '#fafafa';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '12px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }
};

