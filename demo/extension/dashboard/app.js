/**
 * Ambient Study Commons (Demo) - Dashboard Main Controller
 * Coordinates modular tab views, account drop-up menu, and local storage synchronization.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure local fixtures are initialized
  if (typeof LocalStore !== 'undefined') {
    await LocalStore.initLocalStorageIfEmpty();
  }

  // Tab definitions
  const TAB_HEADINGS = {
    journals: { title: 'Learning Journals', sub: 'Personal reflections & autonomous skill synthesis' },
    canvas: { title: 'Canvas Course Context', sub: 'Course syllabi and module topics cached for backend AI review' },
    skills: { title: 'Skill Profile & Competency', sub: 'Extracted competencies and verified peer trust' },
    dreams: { title: 'Dream Exploration Topics', sub: 'Passionate inquiry and elective self-study goals' },
    matches: { title: 'Peer Study Commons Matching', sub: 'Algorithmic peer pairing based on verified learning context' },
    greeting: { title: 'Study Commons Greeting Room', sub: 'AI-facilitated icebreaker session for verified study pairs' },
    settings: { title: 'Data Management & Privacy', sub: '100% Client-side local control and data exports' }
  };

  const navButtons = document.querySelectorAll('.asc-nav-item');
  const views = document.querySelectorAll('.asc-view');
  const headingTitle = document.getElementById('page-heading');
  const headingSub = document.getElementById('page-subheading');

  function switchTab(tabId) {
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    views.forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    if (TAB_HEADINGS[tabId]) {
      headingTitle.textContent = TAB_HEADINGS[tabId].title;
      headingSub.textContent = TAB_HEADINGS[tabId].sub;
    }

    if (tabId === 'greeting') {
      window.AscDash.GreetingView.scrollToBottom();
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Reload all views
  async function reloadAllViews() {
    const [journals, canvas, skills, dreams, matches, messages, prefs, user] = await Promise.all([
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER)
    ]);

    window.AscDash.JournalsView.render(journals || []);
    window.AscDash.CanvasView.render(canvas || []);
    window.AscDash.SkillsView.render(skills || []);
    window.AscDash.DreamsView.render(dreams || []);
    window.AscDash.MatchesView.render(matches || []);
    window.AscDash.GreetingView.render(messages || [], user);
    window.AscDash.SettingsView.render(prefs || {});

    // Toggle Logged-In User Card vs Logged-Out Google Sign-In Button
    const userWrapEl = document.getElementById('asc-user-dropdown-wrap');
    const loggedOutEl = document.getElementById('asc-logged-out-box');
    const isLoggedIn = !!(user && user.displayName);

    if (userWrapEl) userWrapEl.style.display = isLoggedIn ? 'block' : 'none';
    if (loggedOutEl) loggedOutEl.style.display = isLoggedIn ? 'none' : 'block';

    // Update User Profile & Trust Score in Sidebar
    const userNameEl = document.querySelector('.asc-user-name');
    const userSchoolEl = document.querySelector('.asc-user-school');
    const userAvatarEl = document.querySelector('.asc-user-avatar');
    const userTrustEl = document.getElementById('user-trust-score-val');
    const repScoreEl = document.getElementById('rep-score');

    if (userNameEl) userNameEl.textContent = isLoggedIn ? user.displayName : '(Logged Out)';
    if (userSchoolEl) userSchoolEl.textContent = isLoggedIn ? (user.institution || '') : 'Sign in to access Commons';
    if (userAvatarEl) userAvatarEl.textContent = isLoggedIn ? (user.avatarInitials || user.displayName.slice(0, 2).toUpperCase()) : '--';
    if (userTrustEl) userTrustEl.textContent = isLoggedIn ? (user.trustScore || 742) : 0;
    if (repScoreEl) repScoreEl.textContent = isLoggedIn ? (user.trustScore || 742) : 0;

    // Update Badges
    document.getElementById('badge-journal-count').textContent = (journals || []).length;
    document.getElementById('badge-canvas-count').textContent = (canvas || []).length;
    document.getElementById('badge-dreams-count').textContent = (dreams || []).length;
    document.getElementById('badge-match-count').textContent = (matches || []).filter(m => m.status === 'pending' || m.status === 'actionable').length;
  }

  // Google Sign-In Modal Controller
  const googleOverlay = document.getElementById('asc-google-modal-overlay');
  const openLoginModal = () => {
    if (googleOverlay) {
      googleOverlay.classList.add('asc-show-modal');
      const iframe = document.getElementById('asc-google-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'RESET_GOOGLE_LOGIN' }, '*');
      }
    }
  };
  const closeLoginModal = () => {
    if (googleOverlay) googleOverlay.classList.remove('asc-show-modal');
  };

  // Open Google Login modal when clicking "Sign in with Google" button
  document.getElementById('btn-open-google-login')?.addEventListener('click', openLoginModal);

  // Close Google Login modal if clicking outside dialog box
  if (googleOverlay) {
    googleOverlay.addEventListener('click', (e) => {
      if (e.target === googleOverlay) {
        closeLoginModal();
      }
    });
  }

  // User Profile Drop-Up Menu
  const userCard = document.getElementById('asc-user-card');
  const userDropup = document.getElementById('asc-user-dropup');

  if (userCard && userDropup) {
    userCard.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropup.classList.toggle('asc-show-dropup');
    });

    document.addEventListener('click', (e) => {
      if (!userDropup.contains(e.target) && !userCard.contains(e.target)) {
        userDropup.classList.remove('asc-show-dropup');
      }
    });

    // Change Account -> Open Google Sign-In Picker Modal
    document.getElementById('btn-user-change-account')?.addEventListener('click', () => {
      userDropup.classList.remove('asc-show-dropup');
      openLoginModal();
    });

    // Log Out -> Wipe all student data & reveal "Sign in with Google" button
    document.getElementById('btn-user-logout')?.addEventListener('click', async () => {
      userDropup.classList.remove('asc-show-dropup');
      if (confirm('Log out of Ambient Study Commons? This will clear active student data from view.')) {
        await LocalStore.clearAllUserData();
        await reloadAllViews();
        window.AscDash.Toast.show('Logged out. All student data wiped.', 'logout');
      }
    });
  }

  // Handle Login as Selected Persona
  async function loginAsUser(userId) {
    closeLoginModal();
    console.log('[Dashboard] Initiating login for persona:', userId);

    try {
      // 1. Fetch seed data directly for immediate, guaranteed local load
      const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('mockserver/mock_data.json')
        : '../mockserver/mock_data.json';

      const res = await fetch(url);
      const allData = await res.json();

      let targetData = null;
      if (allData && allData.accounts && allData.accounts[userId]) {
        targetData = allData.accounts[userId];
      } else if (allData && allData.user && allData.user.id === userId) {
        targetData = allData;
      }

      if (targetData) {
        await LocalStore.populateFromSeedData(targetData);
      }

      // 2. Notify MockServer in background (non-blocking)
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'LOGIN_USER',
          userId: userId
        }).catch(() => {});
      }

      // 3. Immediately reload all modular views
      await reloadAllViews();

      const user = await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER);
      const name = user ? user.displayName : 'Student';
      window.AscDash.Toast.show(`Signed in as ${name} via Google`, 'login');
    } catch (err) {
      console.error('[Dashboard] Login failed:', err);
      window.AscDash.Toast.show('Failed to log in. Please try again.', 'error');
    }
  }

  // Google Sign-In / Account Picker PostMessage Bridge
  window.addEventListener('message', async (e) => {
    if (!e.data || !e.data.type) return;

    if (e.data.type === 'GOOGLE_LOGIN_CANCEL') {
      closeLoginModal();
    }

    if (e.data.type === 'GOOGLE_LOGIN_SUCCESS') {
      const userId = e.data.userId || 'user_jordan_101';
      await loginAsUser(userId);
    }
  });

  // Initialize individual views
  window.AscDash.JournalsView.init(() => reloadAllViews());
  window.AscDash.CanvasView.init(() => reloadAllViews());
  window.AscDash.SkillsView.init();
  window.AscDash.DreamsView.init(() => reloadAllViews());
  window.AscDash.MatchesView.init(() => switchTab('greeting'));
  window.AscDash.GreetingView.init();
  window.AscDash.SettingsView.init(() => reloadAllViews());

  // Initial load
  await reloadAllViews();
});
