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
    activities: { title: 'Activities & Wishlist', sub: 'Virtual project incubators & verified local community opportunities' },
    freetime: { title: 'Study Free Time & Availability', sub: 'Weekly recurring study hours for peer matching and activity suggestions' },
    dreams: { title: 'Activities & Wishlist', sub: 'Virtual project incubators & verified local community opportunities' },
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

  // Sidebar Collapse Controller
  const sidebar = document.querySelector('.asc-sidebar');
  const btnSidebarCollapse = document.getElementById('btn-sidebar-collapse');

  function setSidebarCollapsed(collapsed) {
    if (!sidebar) return;
    sidebar.classList.toggle('asc-collapsed', collapsed);
    const sidebarIcon = btnSidebarCollapse?.querySelector('.material-symbols-outlined');
    if (sidebarIcon) {
      sidebarIcon.textContent = collapsed ? 'menu' : 'menu_open';
    }
    if (btnSidebarCollapse) {
      btnSidebarCollapse.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    }
    try {
      localStorage.setItem('asc_sidebar_collapsed', collapsed ? 'true' : 'false');
    } catch (e) {}
  }

  function toggleSidebar() {
    if (!sidebar) return;
    const isCurrentlyCollapsed = sidebar.classList.contains('asc-collapsed');
    setSidebarCollapsed(!isCurrentlyCollapsed);
  }

  btnSidebarCollapse?.addEventListener('click', toggleSidebar);

  // Restore saved collapse state
  try {
    if (localStorage.getItem('asc_sidebar_collapsed') === 'true') {
      setSidebarCollapsed(true);
    }
  } catch (e) {}

  // Theme & Manual Journal Accent Controller
  window.AscDash = window.AscDash || {};
  window.AscDash.applyManualJournalColor = function(hex) {
    if (!hex) hex = '#d97706';
    document.documentElement.style.setProperty('--manual-journal-color', hex);
    let r = 217, g = 119, b = 6;
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match) {
      r = parseInt(match[1], 16);
      g = parseInt(match[2], 16);
      b = parseInt(match[3], 16);
    }
    document.documentElement.style.setProperty('--manual-journal-bg', `rgba(${r}, ${g}, ${b}, 0.08)`);
    document.documentElement.style.setProperty('--manual-journal-border', `rgba(${r}, ${g}, ${b}, 0.35)`);
    document.documentElement.style.setProperty('--manual-journal-glow', `rgba(${r}, ${g}, ${b}, 0.12)`);
  };

  // Reload all views
  async function reloadAllViews() {
    const [journals, canvas, skills, dreams, matches, messages, prefs, user, freetime] = await Promise.all([
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER),
      LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.FREETIME)
    ]);

    let activeFreetime = freetime;
    if (user && user.id) {
      const savedUserFreetime = (typeof LocalStore.getStudentFreeTime === 'function')
        ? await LocalStore.getStudentFreeTime(user.id)
        : await LocalStore.getLocalData(`asc_freetime_${user.id}`);
      if (savedUserFreetime) {
        activeFreetime = savedUserFreetime;
      }
    }

    if (prefs && prefs.manualJournalColor) {
      window.AscDash.applyManualJournalColor(prefs.manualJournalColor);
    } else {
      window.AscDash.applyManualJournalColor('#d97706');
    }

    window.AscDash.JournalsView.render(journals || []);
    window.AscDash.CanvasView.render(canvas || [], user);
    if (window.AscDash.ActivitiesView) {
      window.AscDash.ActivitiesView.render(dreams || [], user);
    } else if (window.AscDash.DreamsView) {
      window.AscDash.DreamsView.render(dreams || []);
    }
    window.AscDash.MatchesView.render(matches || []);
    window.AscDash.GreetingView.render(messages || [], user);
    window.AscDash.SettingsView.render(prefs || {});
    if (window.AscDash.FreeTimeView) {
      window.AscDash.FreeTimeView.render(activeFreetime);
    }

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

    if (userNameEl) userNameEl.textContent = isLoggedIn ? user.displayName : '(Logged Out)';
    if (userSchoolEl) userSchoolEl.textContent = isLoggedIn ? (user.institution || '') : 'Sign in to access Commons';
    if (userAvatarEl) userAvatarEl.textContent = isLoggedIn ? (user.avatarInitials || user.displayName.slice(0, 2).toUpperCase()) : '--';
    if (userTrustEl) userTrustEl.textContent = isLoggedIn ? (user.trustScore || 742) : 0;

    // Update Badges
    document.getElementById('badge-journal-count').textContent = (journals || []).length;
    document.getElementById('badge-canvas-count').textContent = (canvas || []).length;
    const badgeAct = document.getElementById('badge-activities-count');
    if (badgeAct) badgeAct.textContent = (dreams || []).length;
    const badgeDrm = document.getElementById('badge-dreams-count');
    if (badgeDrm) badgeDrm.textContent = (dreams || []).length;
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
      // 1. Snapshot active student's state before switching profiles
      if (typeof LocalStore.saveActiveUserProfile === 'function') {
        await LocalStore.saveActiveUserProfile();
      }

      // 2. Fetch seed data directly for immediate, guaranteed local load
      const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('mockserver/mock_data.json')
        : '../mockserver/mock_data.json';

      const res = await fetch(url);
      const allData = await res.json();

      // Check if this student already has saved profile data in LocalStore
      let targetData = null;
      if (typeof LocalStore.getStudentProfileData === 'function') {
        targetData = await LocalStore.getStudentProfileData(userId);
      }

      if (!targetData) {
        if (allData && allData.accounts && allData.accounts[userId]) {
          targetData = JSON.parse(JSON.stringify(allData.accounts[userId]));
        } else if (allData && allData.user && allData.user.id === userId) {
          targetData = JSON.parse(JSON.stringify(allData));
        }
      }

      if (targetData) {
        // Retrieve student's custom saved free time if previously customized
        let savedFreetime = null;
        if (typeof LocalStore.getStudentFreeTime === 'function') {
          savedFreetime = await LocalStore.getStudentFreeTime(userId);
        } else {
          savedFreetime = await LocalStore.getLocalData(`asc_freetime_${userId}`);
        }

        if (savedFreetime) {
          targetData.freetime = savedFreetime;
          console.log(`[Dashboard] Restoring persistent free time for student ${userId}:`, savedFreetime.summary);
        }

        await LocalStore.populateFromSeedData(targetData);
      }

      // 3. Notify MockServer in background (non-blocking)
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'LOGIN_USER',
          userId: userId
        }).catch(() => {});
      }

      // 4. Immediately reload all modular views
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
  if (window.AscDash.ActivitiesView) {
    window.AscDash.ActivitiesView.init(() => reloadAllViews());
  } else if (window.AscDash.DreamsView) {
    window.AscDash.DreamsView.init(() => reloadAllViews());
  }
  if (window.AscDash.FreeTimeView) {
    window.AscDash.FreeTimeView.init(() => reloadAllViews());
  }
  window.AscDash.MatchesView.init(() => switchTab('greeting'));
  window.AscDash.GreetingView.init();
  window.AscDash.SettingsView.init(() => reloadAllViews());

  // Live Real-Time Storage & Backend Synchronization
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        console.log('[Dashboard] Local storage updated, automatically refreshing views...');
        reloadAllViews();
      }
    });
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === 'BACKEND_EVENT') {
        console.log('[Dashboard] Backend event received:', message.event, message.data);
        reloadAllViews();
        if (message.event === 'SESSION_SAVED' && message.data) {
          window.AscDash.Toast.show(`New journal saved: ${message.data.course}`, 'book_5');
        }
      }
    });
  }

  // Initial load
  await reloadAllViews();
});
