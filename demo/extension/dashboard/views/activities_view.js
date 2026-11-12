/**
 * Dashboard View - Activities & Wishlist Tab
 * Features:
 * 1. Virtual & Private Projects Pool:
 *    - Large cards showing robotics, coding, 3D rendering, anime/film, and art projects.
 *    - Persona-tailored paths: Jordan (coding/systems/robotics) and Alex (art/nature/rendering).
 *    - Clicking anywhere on a card opens a comfortable, large detailed view modal with full roadmap and scope.
 *    - "Ready to Participate" toggle button (no direct join; AI pools students until team forms).
 *    - "Submit your dream to the pool" button on top of private section toggles the proposal form.
 * 2. Verified Local Community Activities:
 *    - Public volunteer, hackathons, and ecological restoration by verified organizations.
 *    - AI Filter Toggle: "Sorted by AI (Recommended)" vs "All Available".
 *    - "Join via Host Site" button routing directly to trusted external host platform.
 */

window.AscDash = window.AscDash || {};

window.AscDash.ActivitiesView = {
  privateProjects: [],
  communityActivities: [],
  currentUser: null,
  activeFilter: 'ai', // 'ai' or 'all'
  activeModalProjectId: null,
  onDataChanged: null,

  // Fallback verified community activities pool
  DEFAULT_COMMUNITY_ACTIVITIES: [
    {
      id: 'act_civic_hackathon',
      title: 'Sacramento Civic Tech & Open Transit Hackathon',
      organization: 'Code for Sacramento',
      category: 'Civic Tech & Open Source',
      personaTarget: 'coding',
      date: 'Saturday, Dec 5, 2026',
      time: '9:00 AM - 6:00 PM PST',
      location: 'Sacramento Urban Hive & Virtual (Hybrid)',
      badge: 'Verified 501(c)(3)',
      description: 'Collaborate with regional developers and civic data scientists to build public transit route optimizers, air quality heatmaps, and open municipal APIs.',
      skills: ['Python', 'Open Data', 'FastAPI', 'Transit GTFS', 'Data Viz'],
      hostUrl: 'https://www.volunteermatch.org',
      attendeesCount: 42
    },
    {
      id: 'act_robotics_mentor',
      title: 'Youth Robotics League Championship Mentor & Tech Judge',
      organization: 'FIRST Robotics NorCal',
      category: 'STEM Mentorship & Robotics',
      personaTarget: 'coding',
      date: 'Saturday, Nov 28, 2026',
      time: '10:00 AM - 2:30 PM PST',
      location: 'Elk Grove Youth Technology Center',
      badge: 'Verified STEM Partner',
      description: 'Guide high school student teams through live PID motor debugging, sensor calibration, and autonomous routine inspection for regional competition.',
      skills: ['Robotics', 'PID Loops', 'Arduino / C++', 'Hardware Debugging'],
      hostUrl: 'https://www.volunteermatch.org',
      attendeesCount: 28
    },
    {
      id: 'act_canopy_iot',
      title: 'Urban Canopy Tree Planting & Environmental IoT Sensor Deployment',
      organization: 'Sacramento Tree Foundation & Urban AgTech',
      category: 'Tech & Conservation Fieldwork',
      personaTarget: 'both',
      date: 'Saturday, Nov 21, 2026',
      time: '8:30 AM - 1:00 PM PST',
      location: 'South Sacramento Community Canopy',
      badge: 'Verified Urban Forestry',
      description: 'Plant 60 native shade saplings and deploy low-power solar IoT soil moisture and ambient temperature sensors to monitor urban heat island reduction.',
      skills: ['Native Flora', 'Micro-Sensors', 'IoT Telemetry', 'Community Ecology'],
      hostUrl: 'https://www.volunteermatch.org',
      attendeesCount: 55
    },
    {
      id: 'act_river_restoration',
      title: 'American River Parkway Native Flora & Riparian Restoration',
      organization: 'American River Parkway Conservancy',
      category: 'Habitat & Wildlife Conservation',
      personaTarget: 'art_nature',
      date: 'Saturday, Nov 21, 2026',
      time: '8:00 AM - 12:00 PM PST',
      location: 'American River Parkway · Mile 14 Habitat Zone',
      badge: 'Verified Conservancy',
      description: 'Restore native valley oak and elderberry buffer zones along critical riparian nesting habitats. Remove invasive yellow star-thistle and document regrowth.',
      skills: ['Native Restoration', 'Riparian Ecology', 'Habitat Assessment', 'Conservation'],
      hostUrl: 'https://www.volunteermatch.org',
      attendeesCount: 64
    },
    {
      id: 'act_eco_film_screening',
      title: 'NorCal Environmental Film Festival Screening & Media Lab',
      organization: 'Sierra Club & Sacramento Media Collective',
      category: 'Visual Arts & Environmental Film',
      personaTarget: 'art_nature',
      date: 'Friday, Dec 4, 2026',
      time: '6:00 PM - 9:30 PM PST',
      location: 'Tower Community Arts Annex',
      badge: 'Verified Arts Council',
      description: 'Community exhibition of student documentaries focusing on California watershed conservation. Includes post-screening panel with local cinematographers and sound designers.',
      skills: ['Documentary Film', 'Sound Design', 'Color Grading', 'Visual Storytelling'],
      hostUrl: 'https://www.volunteermatch.org',
      attendeesCount: 90
    },
    {
      id: 'act_arboretum_photogrammetry',
      title: 'UC Davis Arboretum 3D Photogrammetry & Digital Herbarium',
      organization: 'Sacramento Botanical Society & UC Davis Herbarium',
      category: 'Digital Art & Botanical Archive',
      personaTarget: 'art_nature',
      date: 'Sunday, Nov 29, 2026',
      time: '1:00 PM - 4:30 PM PST',
      location: 'UC Davis Arboretum Environmental Center',
      badge: 'Verified University Affiliate',
      description: 'Capture macro photographic series and 3D textured mesh photogrammetry of rare native California plants for the open public digital herbarium.',
      skills: ['3D Photogrammetry', 'Macro Photography', 'Botanical Archive', '3D Texturing'],
      hostUrl: 'https://www.volunteermatch.org',
      attendeesCount: 32
    }
  ],

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.bindEvents();
  },

  async render(projects, user) {
    this.currentUser = user || null;
    this.privateProjects = projects || [];
    this.communityActivities = this.DEFAULT_COMMUNITY_ACTIVITIES;

    this.renderPrivateProjects();
    this.renderCommunityActivities();
  },

  renderPrivateProjects() {
    const container = document.getElementById('private-projects-list');
    if (!container) return;
    container.innerHTML = '';

    if (!this.privateProjects || this.privateProjects.length === 0) {
      container.innerHTML = `
        <div class="asc-card" style="text-align:center; color:#71717a; padding:32px;">
          <span class="material-symbols-outlined" style="font-size:36px; color:#52525b; margin-bottom:8px; display:block;">interests</span>
          No private projects recorded yet. Submit your dream to the pool above or sign in to explore active collaborative incubators.
        </div>
      `;
      return;
    }

    this.privateProjects.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'asc-card asc-project-card-large';
      card.style.cursor = 'pointer';

      const isReady = !!proj.isReady;
      const readyCount = proj.readyCount || 1;
      const targetPeers = proj.targetPeers || 4;
      const progressPercent = Math.min(100, Math.round((readyCount / targetPeers) * 100));

      const techBadges = (proj.techStack || ['Research', 'Collab'])
        .map(t => `<span class="asc-tag asc-tag-subtle">${t}</span>`)
        .join(' ');

      card.innerHTML = `
        <div class="asc-project-header">
          <div class="asc-project-meta-wrap">
            <span class="asc-tag asc-tag-primary">${proj.category || 'Project Pool'}</span>
            <span class="asc-project-scope-pill">${proj.scope || 'Collaborative Sprint'}</span>
          </div>
          <div class="asc-ready-status-badge ${isReady ? 'asc-status-ready' : ''}">
            <span class="material-symbols-outlined" style="font-size:16px;">${isReady ? 'check_circle' : 'hourglass_top'}</span>
            <span>${isReady ? 'Marked Ready' : 'Gathering Peers'}</span>
          </div>
        </div>

        <div class="asc-project-title">${proj.title}</div>
        <div class="asc-project-desc">${proj.description}</div>

        <div style="font-size:11px; color:#9ca3af; margin-bottom:12px; display:flex; align-items:center; gap:5px;">
          <span class="material-symbols-outlined" style="font-size:14px; color:#60a5fa;">open_in_full</span>
          <span>Click card to view full scope & roadmap</span>
        </div>

        <div class="asc-project-tech-list">
          ${techBadges}
        </div>

        <div class="asc-project-footer">
          <div class="asc-peer-pool-progress">
            <div class="asc-peer-pool-label">
              <span class="material-symbols-outlined" style="font-size:15px; vertical-align:middle; margin-right:4px;">group</span>
              <strong>${readyCount} of ${targetPeers}</strong> peers ready to build
            </div>
            <div class="asc-peer-pool-bar">
              <div class="asc-peer-pool-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>

          <div class="asc-project-actions">
            <button class="asc-btn-ready ${isReady ? 'asc-btn-ready-active' : ''}" data-project-id="${proj.id}">
              <span class="material-symbols-outlined">${isReady ? 'task_alt' : 'how_to_reg'}</span>
              <span>${isReady ? 'Marked Ready (Joined Pool)' : 'Ready to Participate'}</span>
            </button>
          </div>
        </div>
      `;

      // Clicking card opens the large full detail modal (unless clicking the button)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.asc-btn-ready')) return;
        this.openProjectDetailModal(proj);
      });

      container.appendChild(card);
    });

    // Bind "Ready to Participate" toggle buttons on card faces
    container.querySelectorAll('.asc-btn-ready').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const projId = btn.getAttribute('data-project-id');
        await this.toggleReadyStatus(projId);
      });
    });
  },

  openProjectDetailModal(proj) {
    if (!proj) return;
    this.activeModalProjectId = proj.id;

    const modal = document.getElementById('modal-project-detail');
    const titleEl = document.getElementById('modal-project-title');
    const catEl = document.getElementById('modal-project-category');
    const scopeEl = document.getElementById('modal-project-scope');
    const descEl = document.getElementById('modal-project-desc');
    const techEl = document.getElementById('modal-project-tech');
    const peersEl = document.getElementById('modal-project-peers');
    const readyBtn = document.getElementById('modal-project-ready-btn');

    if (titleEl) titleEl.textContent = proj.title;
    if (catEl) catEl.textContent = proj.category || 'Incubator Project';
    if (scopeEl) scopeEl.textContent = proj.scope || 'Collaborative Sprint';
    if (descEl) descEl.textContent = proj.description;

    if (techEl) {
      techEl.innerHTML = (proj.techStack || ['Research', 'Collab'])
        .map(t => `<span class="asc-tag asc-tag-primary" style="font-size:12px; padding:4px 10px;">${t}</span>`)
        .join(' ');
    }

    const readyCount = proj.readyCount || 1;
    const targetPeers = proj.targetPeers || 4;
    if (peersEl) {
      peersEl.textContent = `${readyCount} / ${targetPeers} Peers Ready`;
      peersEl.style.color = proj.isReady ? '#10b981' : '#eab308';
    }

    if (readyBtn) {
      readyBtn.className = `asc-btn-ready ${proj.isReady ? 'asc-btn-ready-active' : ''}`;
      readyBtn.style.width = 'auto';
      readyBtn.style.padding = '10px 22px';
      readyBtn.innerHTML = `
        <span class="material-symbols-outlined">${proj.isReady ? 'task_alt' : 'how_to_reg'}</span>
        <span>${proj.isReady ? 'Marked Ready (Joined Pool)' : 'Ready to Participate'}</span>
      `;
      readyBtn.onclick = async () => {
        await this.toggleReadyStatus(proj.id);
        const updated = this.privateProjects.find(p => p.id === proj.id);
        if (updated) {
          this.openProjectDetailModal(updated);
        }
      };
    }

    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeProjectDetailModal() {
    const modal = document.getElementById('modal-project-detail');
    if (modal) {
      modal.style.display = 'none';
    }
    this.activeModalProjectId = null;
  },

  async toggleReadyStatus(projectId) {
    const proj = this.privateProjects.find(p => p.id === projectId);
    if (!proj) return;

    proj.isReady = !proj.isReady;
    if (proj.isReady) {
      proj.readyCount = (proj.readyCount || 1) + 1;
      window.AscDash.Toast.show('You are marked ready! Ambient AI will notify you when a team forms.', 'diversity_3');
    } else {
      proj.readyCount = Math.max(1, (proj.readyCount || 2) - 1);
      window.AscDash.Toast.show('Readiness status updated.', 'check');
    }

    await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS, this.privateProjects);
    this.renderPrivateProjects();
    if (typeof this.onDataChanged === 'function') this.onDataChanged();
  },

  renderCommunityActivities() {
    const container = document.getElementById('community-activities-list');
    const noteEl = document.getElementById('community-ai-pill-note');
    if (!container) return;
    container.innerHTML = '';

    const isJordan = this.currentUser && this.currentUser.id === 'user_jordan_101';
    const isAlex = this.currentUser && this.currentUser.id === 'user_alex_202';
    const currentPersona = isAlex ? 'art_nature' : 'coding';

    let displayList = this.communityActivities;

    if (this.activeFilter === 'ai') {
      displayList = this.communityActivities.filter(a => {
        if (a.personaTarget === 'both') return true;
        return a.personaTarget === currentPersona;
      });

      if (noteEl) {
        noteEl.style.display = 'inline-flex';
        noteEl.innerHTML = `
          <span class="material-symbols-outlined" style="font-size:14px; margin-right:4px;">psychology</span>
          Curated by AI for <strong>${this.currentUser ? this.currentUser.displayName : 'Your Profile'}</strong> based on your active coursework & reflections
        `;
      }
    } else {
      if (noteEl) {
        noteEl.style.display = 'inline-flex';
        noteEl.innerHTML = `
          <span class="material-symbols-outlined" style="font-size:14px; margin-right:4px;">public</span>
          Showing all regional verified opportunities (${this.communityActivities.length} available)
        `;
      }
    }

    displayList.forEach(act => {
      const card = document.createElement('div');
      card.className = 'asc-card asc-community-card';

      const skillBadges = (act.skills || [])
        .map(s => `<span class="asc-tag asc-tag-subtle">${s}</span>`)
        .join(' ');

      card.innerHTML = `
        <div class="asc-community-header">
          <div class="asc-community-org-wrap">
            <span class="material-symbols-outlined asc-verified-icon">verified</span>
            <span class="asc-community-org">${act.organization}</span>
            <span class="asc-verified-pill">${act.badge || 'Verified Host'}</span>
          </div>
          <span class="asc-tag asc-tag-primary">${act.category}</span>
        </div>

        <div class="asc-community-title">${act.title}</div>
        <div class="asc-community-desc">${act.description}</div>

        <div class="asc-community-info-grid">
          <div class="asc-comm-info-item">
            <span class="material-symbols-outlined">calendar_month</span>
            <span>${act.date} · ${act.time}</span>
          </div>
          <div class="asc-comm-info-item">
            <span class="material-symbols-outlined">location_on</span>
            <span>${act.location}</span>
          </div>
          <div class="asc-comm-info-item">
            <span class="material-symbols-outlined">group</span>
            <span>${act.attendeesCount} peers registered</span>
          </div>
        </div>

        <div class="asc-project-tech-list" style="margin-top:10px;">
          ${skillBadges}
        </div>

        <div class="asc-community-actions">
          <a href="${act.hostUrl}" target="_blank" rel="noopener noreferrer" class="asc-btn-join-host">
            <span class="material-symbols-outlined">open_in_new</span>
            <span>Join via Host Site</span>
          </a>
        </div>
      `;

      container.appendChild(card);
    });
  },

  bindEvents() {
    // 1. "Submit your dream to the pool" Toggle Button
    const btnToggle = document.getElementById('btn-toggle-submit-dream');
    const formWrap = document.getElementById('project-submit-form-wrap');
    const btnCancel = document.getElementById('btn-cancel-submit-dream');
    const btnCancelAlt = document.getElementById('btn-cancel-submit-dream-alt');

    if (btnToggle && formWrap) {
      btnToggle.addEventListener('click', () => {
        const isCurrentlyHidden = formWrap.style.display === 'none' || !formWrap.style.display;
        formWrap.style.display = isCurrentlyHidden ? 'block' : 'none';
        if (isCurrentlyHidden) {
          const titleInput = document.getElementById('project-title');
          if (titleInput) titleInput.focus();
          formWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    const closeForm = () => {
      if (formWrap) formWrap.style.display = 'none';
    };

    if (btnCancel) btnCancel.addEventListener('click', closeForm);
    if (btnCancelAlt) btnCancelAlt.addEventListener('click', closeForm);

    // 2. Modal Close Listeners
    const btnCloseModal = document.getElementById('btn-close-project-detail');
    const modalDetail = document.getElementById('modal-project-detail');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => this.closeProjectDetailModal());
    }
    if (modalDetail) {
      modalDetail.addEventListener('click', (e) => {
        if (e.target === modalDetail) this.closeProjectDetailModal();
      });
    }

    // 3. AI vs All Community Filter Toggles
    const btnAi = document.getElementById('btn-filter-community-ai');
    const btnAll = document.getElementById('btn-filter-community-all');

    if (btnAi) {
      btnAi.addEventListener('click', () => {
        this.activeFilter = 'ai';
        btnAi.classList.add('active');
        btnAll?.classList.remove('active');
        this.renderCommunityActivities();
      });
    }

    if (btnAll) {
      btnAll.addEventListener('click', () => {
        this.activeFilter = 'all';
        btnAll.classList.add('active');
        btnAi?.classList.remove('active');
        this.renderCommunityActivities();
      });
    }

    // 4. Submit new exploration project form
    const formAdd = document.getElementById('form-add-project');
    if (formAdd) {
      formAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titleEl = document.getElementById('project-title');
        const descEl = document.getElementById('project-desc');
        const catEl = document.getElementById('project-category');
        const techEl = document.getElementById('project-tech');

        const title = titleEl ? titleEl.value.trim() : '';
        const desc = descEl ? descEl.value.trim() : '';
        const category = catEl ? catEl.value.trim() : 'Collaborative Project';
        const techRaw = techEl ? techEl.value.trim() : '';

        if (!title) return;

        const techStack = techRaw
          ? techRaw.split(',').map(s => s.trim()).filter(Boolean)
          : ['Collab', 'Exploration'];

        const newProject = {
          id: `proj_${Date.now()}`,
          title,
          description: desc,
          category: category || 'Student Incubator',
          scope: 'Rapid Prototype (2-3 Students)',
          techStack,
          readyCount: 1,
          targetPeers: 3,
          isReady: true,
          date: 'Just published'
        };

        this.privateProjects.unshift(newProject);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS, this.privateProjects);
        this.renderPrivateProjects();
        if (typeof this.onDataChanged === 'function') this.onDataChanged();

        if (titleEl) titleEl.value = '';
        if (descEl) descEl.value = '';
        if (techEl) techEl.value = '';

        closeForm();
        window.AscDash.Toast.show('Project published to incubator pool! Ambient AI is matching peers.', 'rocket_launch');
      });
    }
  }
};

// Backward-compatible alias for any residual legacy checks
window.AscDash.DreamsView = window.AscDash.ActivitiesView;
