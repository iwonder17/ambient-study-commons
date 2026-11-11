/**
 * Fake Google Login - Client Controller
 * Dispatches account selection to the parent Dashboard.
 */

function setupGoogleLogin() {
  console.log('[Google Login Iframe] setupGoogleLogin initialized');

  // Account selection handlers
  document.querySelectorAll('.g-account-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = item.getAttribute('data-user') || 'user_jordan_101';
      console.log('[Google Login Iframe] Account selected:', userId);
      window.parent.postMessage({
        type: 'GOOGLE_LOGIN_SUCCESS',
        userId: userId
      }, '*');
    });
  });

  // Use another account fallback
  const guestBtn = document.getElementById('account-guest');
  if (guestBtn) {
    guestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[Google Login Iframe] Guest selected: user_jordan_101');
      window.parent.postMessage({
        type: 'GOOGLE_LOGIN_SUCCESS',
        userId: 'user_jordan_101'
      }, '*');
    });
  }

  // Cancel / Close dialog
  const closeBtn = document.getElementById('g-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[Google Login Iframe] Cancelled');
      window.parent.postMessage({
        type: 'GOOGLE_LOGIN_CANCEL'
      }, '*');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupGoogleLogin);
} else {
  setupGoogleLogin();
}
