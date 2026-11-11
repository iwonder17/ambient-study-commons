/**
 * AscUI - Icons & Fonts Module
 * Injects Material Symbols and provides icon helper.
 */

window.AscUI = window.AscUI || {};

window.AscUI.Icons = {
  init() {
    if (!document.getElementById('asc-material-symbols-link')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'asc-material-symbols-link';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
      document.head.appendChild(fontLink);
    }
  },

  get(name) {
    return `<span class="material-symbols-outlined">${name}</span>`;
  }
};
