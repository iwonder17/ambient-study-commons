/**
 * Fake Canvas OAuth Login / Logout Controller
 * Handles 5-stage verification animation sequence (2300ms total)
 * Persists session state in localStorage under 'demo_canvas_session'
 */

(function () {
  const STORAGE_KEY = 'demo_canvas_session';

  const MOCK_SESSION_DATA = {
    connected: true,
    student: {
      name: 'Alex Chen',
      id: 'STU-882910',
      domain: 'losrios.instructure.com',
      email: 'chena8829@student.losrios.edu'
    },
    scopes: [
      '/api/v1/courses',
      '/api/v1/users/self/todo'
    ],
    syncedAt: new Date().toISOString(),
    courses: [
      {
        code: 'CISP-310',
        name: 'Assembly Language & Computer Organization',
        term: 'Fall 2026',
        status: 'Active'
      },
      {
        code: 'MATH-400',
        name: 'Calculus I: Analytic Geometry',
        term: 'Fall 2026',
        status: 'Active'
      },
      {
        code: 'ENGWR-300',
        name: 'College Composition & Research',
        term: 'Fall 2026',
        status: 'Active'
      },
      {
        code: 'PHYS-410',
        name: 'Mechanics of Solids & Fluids',
        term: 'Fall 2026',
        status: 'Active'
      }
    ]
  };

  class CanvasAuthController {
    constructor() {
      this.dom = {};
      this.isAnimating = false;
      this.timeouts = [];
    }

    init() {
      this.cacheDom();
      this.bindEvents();
      this.render();
    }

    cacheDom() {
      this.dom = {
        // Main Card
        cardDisconnected: document.getElementById('card-disconnected'),
        cardConnected: document.getElementById('card-connected'),
        statusBadge: document.getElementById('status-badge'),
        btnConnect: document.getElementById('btn-connect-canvas'),
        btnDisconnect: document.getElementById('btn-disconnect-canvas'),
        studentAvatar: document.getElementById('student-avatar'),
        studentName: document.getElementById('student-name'),
        studentDomain: document.getElementById('student-domain'),
        coursesGrid: document.getElementById('courses-grid'),
        coursesCount: document.getElementById('courses-count'),

        // Modal
        backdrop: document.getElementById('modal-backdrop'),
        modalWindow: document.getElementById('modal-window'),
        stageConsent: document.getElementById('stage-consent'),
        stageStepper: document.getElementById('stage-stepper'),
        btnCancel: document.getElementById('btn-modal-cancel'),
        btnAuthorize: document.getElementById('btn-modal-authorize'),

        // Stepper elements
        step1: document.getElementById('step-1'),
        step2: document.getElementById('step-2'),
        step3: document.getElementById('step-3'),
        progressFill: document.getElementById('stepper-progress-fill')
      };
    }

    bindEvents() {
      if (this.dom.btnConnect) {
        this.dom.btnConnect.addEventListener('click', () => this.openConsentModal());
      }
      if (this.dom.btnDisconnect) {
        this.dom.btnDisconnect.addEventListener('click', () => this.disconnect());
      }
      if (this.dom.btnCancel) {
        this.dom.btnCancel.addEventListener('click', () => this.closeModal());
      }
      if (this.dom.btnAuthorize) {
        this.dom.btnAuthorize.addEventListener('click', () => this.startVerificationSequence());
      }

      // Close modal on backdrop click if not animating
      if (this.dom.backdrop) {
        this.dom.backdrop.addEventListener('click', (e) => {
          if (e.target === this.dom.backdrop && !this.isAnimating) {
            this.closeModal();
          }
        });
      }

      // Escape key to close modal if not animating
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.isAnimating && this.isModalOpen()) {
          this.closeModal();
        }
      });
    }

    getSession() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.error('Failed to parse Canvas session from localStorage:', err);
        return null;
      }
    }

    saveSession(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to save Canvas session to localStorage:', err);
      }
    }

    clearSession() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('Failed to clear Canvas session:', err);
      }
    }

    render() {
      const session = this.getSession();

      if (session && session.connected) {
        // Render Connected View
        this.dom.cardDisconnected.style.display = 'none';
        this.dom.cardConnected.style.display = 'flex';

        this.dom.statusBadge.className = 'badge badge-connected';
        this.dom.statusBadge.innerHTML = '<span class="badge-dot"></span>Connected & Synced';

        const student = session.student || {};
        this.dom.studentName.textContent = student.name || 'Student';
        this.dom.studentDomain.textContent = student.domain || 'canvas.instructure.com';
        
        const initials = (student.name || 'S')
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        this.dom.studentAvatar.textContent = initials;

        // Render Courses
        const courses = session.courses || [];
        this.dom.coursesCount.textContent = `${courses.length} Active Courses`;
        this.dom.coursesGrid.innerHTML = '';

        courses.forEach(course => {
          const card = document.createElement('div');
          card.className = 'course-card';
          card.innerHTML = `
            <span class="course-code">${course.code}</span>
            <span class="course-name">${course.name}</span>
            <div class="course-meta">
              <span>${course.term}</span>
              <span>•</span>
              <span style="color: var(--success-green);">${course.status}</span>
            </div>
          `;
          this.dom.coursesGrid.appendChild(card);
        });
      } else {
        // Render Disconnected View
        this.dom.cardDisconnected.style.display = 'block';
        this.dom.cardConnected.style.display = 'none';

        this.dom.statusBadge.className = 'badge badge-disconnected';
        this.dom.statusBadge.innerHTML = '<span class="badge-dot"></span>Not Connected';
      }
    }

    isModalOpen() {
      return this.dom.backdrop.classList.contains('active');
    }

    openConsentModal() {
      this.clearTimeouts();
      this.isAnimating = false;

      // Reset modal stages
      this.dom.stageConsent.style.display = 'block';
      this.dom.stageStepper.style.display = 'none';

      // Reset stepper steps
      [this.dom.step1, this.dom.step2, this.dom.step3].forEach(step => {
        step.className = 'step-row';
      });
      if (this.dom.progressFill) {
        this.dom.progressFill.style.width = '0%';
      }

      this.dom.backdrop.classList.add('active');
    }

    closeModal() {
      this.clearTimeouts();
      this.isAnimating = false;
      this.dom.backdrop.classList.remove('active');
    }

    disconnect() {
      this.clearSession();
      this.render();
    }

    clearTimeouts() {
      this.timeouts.forEach(t => clearTimeout(t));
      this.timeouts = [];
    }

    /**
     * 5-Stage Verification Sequence (2300ms total)
     * - 0ms: Swap to Stage 2 (Verification Stepper)
     * - Step 1 (0–650ms): "Handshaking with institutional LMS..." (active spinner)
     *   -> at 650ms: morphs to green checkmark (✓)
     * - Step 2 (650–1300ms): "Validating OAuth2 Bearer token..." (active spinner)
     *   -> at 1300ms: morphs to green checkmark (✓)
     * - Step 3 (1300–1950ms): "Fetching active courses..." (active spinner)
     *   -> at 1950ms: morphs to green checkmark (✓)
     * - Hold (1950–2300ms): Pause 350ms with all 3 checkmarks visible
     * - Commit (2300ms): Save to localStorage, close modal, render connected state
     */
    startVerificationSequence() {
      if (this.isAnimating) return;
      this.isAnimating = true;

      // Swap view from Consent to Stepper
      this.dom.stageConsent.style.display = 'none';
      this.dom.stageStepper.style.display = 'flex';

      // ==========================================
      // STAGE 1 / STEP 1: Handshaking (0ms - 650ms)
      // ==========================================
      this.dom.step1.className = 'step-row active';
      this.dom.step2.className = 'step-row';
      this.dom.step3.className = 'step-row';
      if (this.dom.progressFill) this.dom.progressFill.style.width = '33%';

      // At 650ms: Step 1 completes -> Step 2 starts
      const t1 = setTimeout(() => {
        // ====================================================
        // STAGE 2 / STEP 2: Validating Bearer (650ms - 1300ms)
        // ====================================================
        this.dom.step1.className = 'step-row completed';
        this.dom.step2.className = 'step-row active';
        if (this.dom.progressFill) this.dom.progressFill.style.width = '66%';
      }, 650);
      this.timeouts.push(t1);

      // At 1300ms: Step 2 completes -> Step 3 starts
      const t2 = setTimeout(() => {
        // ====================================================
        // STAGE 3 / STEP 3: Fetching Courses (1300ms - 1950ms)
        // ====================================================
        this.dom.step2.className = 'step-row completed';
        this.dom.step3.className = 'step-row active';
        if (this.dom.progressFill) this.dom.progressFill.style.width = '100%';
      }, 1300);
      this.timeouts.push(t2);

      // At 1950ms: Step 3 completes -> Hold (1950ms - 2300ms)
      const t3 = setTimeout(() => {
        // ====================================================
        // STAGE 4: Hold with all 3 green checkmarks visible
        // ====================================================
        this.dom.step3.className = 'step-row completed';
      }, 1950);
      this.timeouts.push(t3);

      // At 2300ms: Commit payload & close modal
      const t4 = setTimeout(() => {
        // ====================================================
        // STAGE 5: Commit & Transition UI
        // ====================================================
        const sessionPayload = {
          ...MOCK_SESSION_DATA,
          syncedAt: new Date().toISOString()
        };
        this.saveSession(sessionPayload);
        this.closeModal();
        this.render();
      }, 2300);
      this.timeouts.push(t4);
    }
  }

  // Auto-instantiate when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.canvasAuth = new CanvasAuthController();
    window.canvasAuth.init();
  });
})();

