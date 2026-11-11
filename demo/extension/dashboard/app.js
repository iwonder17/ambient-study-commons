/**
 * Ambient Study Commons (Demo) - Dashboard Main Controller
 * Coordinates modular tab views and local storage synchronization.
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
    window.AscDash.GreetingView.render(messages || []);
    window.AscDash.SettingsView.render(prefs || {});

    // Update User Profile in Sidebar
    const userNameEl = document.querySelector('.asc-user-name');
    const userSchoolEl = document.querySelector('.asc-user-school');
    const userAvatarEl = document.querySelector('.asc-user-avatar');
    if (userNameEl) userNameEl.textContent = user ? user.displayName : '(Empty State)';
    if (userSchoolEl) userSchoolEl.textContent = user ? user.institution : 'Use Dev Tools to load data';
    if (userAvatarEl) userAvatarEl.textContent = user ? user.avatarInitials : '--';

    // Update Badges & Top Stats
    document.getElementById('badge-journal-count').textContent = (journals || []).length;
    document.getElementById('badge-canvas-count').textContent = (canvas || []).length;
    document.getElementById('badge-dreams-count').textContent = (dreams || []).length;
    document.getElementById('badge-match-count').textContent = (matches || []).filter(m => m.status === 'pending' || m.status === 'actionable').length;
    document.getElementById('stat-sessions-count').textContent = (journals || []).length;
    document.getElementById('stat-skills-count').textContent = (skills || []).length;
  }

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
