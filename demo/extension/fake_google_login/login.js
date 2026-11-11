/**
 * Fake Google Login - Client Controller
 * Displays an authentic 2-3 second Google loading screen with multi-color spinner
 * and indeterminate progress bar before dispatching account selection to the parent Dashboard.
 */

let activeTimer = null;

function resetToPickerView() {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  const pickerView = document.getElementById('g-view-picker');
  const loadingView = document.getElementById('g-view-loading');
  const progressBar = document.getElementById('g-progress-bar');

  if (pickerView) pickerView.style.display = 'block';
  if (loadingView) loadingView.style.display = 'none';
  if (progressBar) progressBar.classList.remove('active');
}

function startGoogleLoadingFlow(userMeta) {
  const { userId, name, email, avatar, bg } = userMeta;

  // 1. Populate loading view persona metadata
  const nameEl = document.getElementById('g-loading-name');
  const emailEl = document.getElementById('g-loading-email');
  const avatarEl = document.getElementById('g-loading-avatar');
  const statusEl = document.getElementById('g-loading-status');

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (avatarEl) {
    avatarEl.textContent = avatar;
    avatarEl.className = `g-avatar ${bg || 'jordan'}`;
  }
  if (statusEl) statusEl.textContent = 'Verifying account credentials...';

  // 2. Switch from account picker to Google loading screen
  const pickerView = document.getElementById('g-view-picker');
  const loadingView = document.getElementById('g-view-loading');
  const progressBar = document.getElementById('g-progress-bar');

  if (pickerView) pickerView.style.display = 'none';
  if (loadingView) loadingView.style.display = 'block';
  if (progressBar) progressBar.classList.add('active');

  // 3. Random duration between 2000ms (2s) and 3000ms (3s)
  const randomDelayMs = Math.floor(Math.random() * 1000) + 2000;
  console.log(`[Google Login] Authenticating as ${name}... Simulated Google OAuth delay: ${(randomDelayMs / 1000).toFixed(1)}s`);

  // Progress update halfway through
  setTimeout(() => {
    if (statusEl) statusEl.textContent = 'Connecting to Ambient Study Commons...';
  }, Math.floor(randomDelayMs / 2));

  // 4. Complete login after the 2-3 second delay
  activeTimer = setTimeout(() => {
    console.log(`[Google Login] OAuth authorization successful for ${userId}`);
    window.parent.postMessage({
      type: 'GOOGLE_LOGIN_SUCCESS',
      userId: userId
    }, '*');

    // Reset view so subsequent opens start on the account picker
    setTimeout(() => {
      resetToPickerView();
    }, 600);
  }, randomDelayMs);
}

function setupGoogleLogin() {
  console.log('[Google Login Iframe] Controller initialized');

  // Account selection handlers
  document.querySelectorAll('.g-account-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const userMeta = {
        userId: item.getAttribute('data-user') || 'user_jordan_101',
        name: item.getAttribute('data-name') || 'Student',
        email: item.getAttribute('data-email') || 'student@losrios.edu',
        avatar: item.getAttribute('data-avatar') || 'ST',
        bg: item.getAttribute('data-bg') || 'jordan'
      };
      startGoogleLoadingFlow(userMeta);
    });
  });

  // Use another account fallback
  const guestBtn = document.getElementById('account-guest');
  if (guestBtn) {
    guestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const guestMeta = {
        userId: 'user_jordan_101',
        name: 'Jordan Lee',
        email: 'jordan.lee@crc.losrios.edu',
        avatar: 'JL',
        bg: 'jordan'
      };
      startGoogleLoadingFlow(guestMeta);
    });
  }

  // Cancel / Close dialog
  const closeBtn = document.getElementById('g-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetToPickerView();
      window.parent.postMessage({
        type: 'GOOGLE_LOGIN_CANCEL'
      }, '*');
    });
  }

  // Listen for reset events from parent dashboard
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'RESET_GOOGLE_LOGIN') {
      resetToPickerView();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupGoogleLogin);
} else {
  setupGoogleLogin();
}
