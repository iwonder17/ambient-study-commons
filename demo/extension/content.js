/**
 * Ambient Study Commons (Demo) - Content Script Coordinator
 * Initializes the modular in-page UI components.
 */

(function () {
  if (window.__asc_demo_injected) return;
  window.__asc_demo_injected = true;

  // 1. Initialize Icons & Styles
  window.AscUI.Icons.init();

  // 2. Initialize Toasts
  window.AscUI.Toast.init();

  // 3. Initialize Paste Modal
  window.AscUI.PasteModal.init();

  // 4. Initialize Master Floating Button & Dropdown
  window.AscUI.MasterButton.init();
})();
