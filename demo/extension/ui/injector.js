/**
 * AscUI - Chat Injector Module
 * Finds chat inputs on ChatGPT, Gemini, Claude, or generic web pages and injects text.
 */

window.AscUI = window.AscUI || {};

window.AscUI.Injector = {
  findInput() {
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
  },

  inject(text) {
    const el = this.findInput();
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
};

