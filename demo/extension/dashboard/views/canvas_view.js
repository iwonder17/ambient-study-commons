/**
 * Dashboard View - Canvas Course Context Tab
 * Features:
 * 1. Minimal toolbar line with semester on left and "Data & Sync" settings button on right.
 * 2. Data & Sync settings modal with toggles (courses, modules, grades: Total vs Individual),
 *    Export Canvas JSON, Import Canvas JSON, and Data Remove scope modal.
 * 3. Selective Data Removal modal with scope (Current, Previous, Whole Timeline) and data categories.
 * 4. Logout confirmation prompt before disconnecting Canvas sync.
 * 5. Fake Canvas login 5-stage verification stepper animation (2300ms) on reconnection.
 * 6. Minimalist previous courses toggle (clean divider/text, not a heavy button).
 * 7. Interactive expandable course cards with part-by-part scanning buttons.
 */

window.AscDash = window.AscDash || {};

window.AscDash.CanvasView = {
  canvasItems: [],
  currentUser: null,
  isPreviousExpanded: false,
  isCanvasConnected: true,
  expandedCourseCode: null,
  activeStepperTimeouts: [],
  onDataChanged: null,

  // Course theme gradients matching authentic Canvas LMS palette
  COURSE_THEMES: {
    'CISP-310': { gradient: 'linear-gradient(135deg, #0374b5 0%, #004c77 100%)', accent: '#0374b5' },
    'MATH-400': { gradient: 'linear-gradient(135deg, #00875a 0%, #005a3c 100%)', accent: '#00875a' },
    'CISP-300': { gradient: 'linear-gradient(135deg, #7e57c2 0%, #512da8 100%)', accent: '#7e57c2' },
    'CISP-400': { gradient: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', accent: '#1565c0' },
    'STAT-300': { gradient: 'linear-gradient(135deg, #c2185b 0%, #880e4f 100%)', accent: '#c2185b' },
    'CISP-360': { gradient: 'linear-gradient(135deg, #3f51b5 0%, #283593 100%)', accent: '#3f51b5' },
    'MATH-370': { gradient: 'linear-gradient(135deg, #0097a7 0%, #006064 100%)', accent: '#0097a7' },
    'PHYS-410': { gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', accent: '#d97706' },
    'ENGWR-300': { gradient: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)', accent: '#e11d48' },
    'CISP-301': { gradient: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', accent: '#4b5563' },
    'ENGR-312': { gradient: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)', accent: '#ea580c' },
    'PHIL-300': { gradient: 'linear-gradient(135deg, #059669 0%, #065f46 100%)', accent: '#059669' },
    'ART-380': { gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', accent: '#7c3aed' },
    'NATR-300': { gradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)', accent: '#059669' },
    'PHOTO-390': { gradient: 'linear-gradient(135deg, #0284c7 0%, #075985 100%)', accent: '#0284c7' },
    'ART-320': { gradient: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)', accent: '#db2777' },
    'BIOL-300': { gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', accent: '#10b981' },
    'DESGN-301': { gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', accent: '#f59e0b' },
    'GEOG-300': { gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', accent: '#14b8a6' }
  },

  DEFAULT_THEME: {
    gradient: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
    accent: '#4b5563'
  },

  STUDENT_DATA_FIXTURES: {
    user_jordan_101: {
      student: { name: 'Jordan Lee', email: 'jordan.lee@crc.losrios.edu', avatar: 'JL' },
      semester: 'Fall 2026',
      current: [
        {
          code: 'CISP-310',
          name: 'Assembly Language Architecture & Computer Organization',
          term: 'Fall 2026',
          instructor: 'Prof. Marcus Thorne',
          units: 4,
          grade: '93.4% · A',
          syllabusSummary: 'Hardware architecture, x86-64 register models, stack alignment, calling conventions (System V ABI), and SIMD vector processing.',
          inProgressModule: 'Module 4: Subroutine Call Conventions & Stack Framing',
          activeTopics: ['16-byte Stack Alignment', 'System V ABI', 'Callee-saved Regs'],
          allModules: ['Mod 1: Intro', 'Mod 2: Registers', 'Mod 3: Branching', 'Mod 4: Stack Frames (Active)', 'Mod 5: SIMD (Locked)', 'Mod 6: Syscalls (Locked)'],
          lockedModulesCount: 2,
          lockedModulesPreview: 'Module 5 (SIMD Vectorization), Module 6 (OS Syscalls)',
          upcomingExam: 'Midterm Exam 2: Stack ABI (Nov 25)'
        },
        {
          code: 'ENGR-312',
          name: 'Autonomous Robotics & Embedded Microcontrollers',
          term: 'Fall 2026',
          instructor: 'Dr. Arthur Pendelton',
          units: 4,
          grade: '94.6% · A',
          syllabusSummary: 'Microcontroller interfacing, real-time operating systems (RTOS), sensor fusion (LIDAR, IMU), PID motor control loops, and ROS2 robot telemetry.',
          inProgressModule: 'Module 3: PID Closed-Loop Velocity Control',
          activeTopics: ['PID Velocity Tuning', 'Deadband Calibration', 'ROS2 Telemetry'],
          allModules: ['Mod 1: Microcontrollers', 'Mod 2: PWM Drivers', 'Mod 3: PID Loops (Active)', 'Mod 4: LIDAR SLAM (Locked)', 'Mod 5: Pathfinding (Locked)'],
          lockedModulesCount: 2,
          lockedModulesPreview: 'Module 4 (LIDAR SLAM Navigation), Module 5 (Autonomous Pathfinding)',
          upcomingExam: 'Lab Practicum: PID Tuning Benchmark (Nov 22)'
        },
        {
          code: 'CISP-300',
          name: 'Algorithm Design & Problem Solving',
          term: 'Fall 2026',
          instructor: 'Prof. David Krum',
          units: 3,
          grade: '96.0% · A',
          syllabusSummary: 'Asymptotic complexity, sorting benchmarks, divide-and-conquer methodologies, dynamic programming, and greedy graph models.',
          inProgressModule: 'Module 3: Divide-and-Conquer & Dynamic Programming',
          activeTopics: ['Memoization', 'Tabulation', '0/1 Knapsack'],
          allModules: ['Mod 1: Pseudocode', 'Mod 2: Sorting', 'Mod 3: Dynamic Programming (Active)', 'Mod 4: Greedy Graphs (Locked)'],
          lockedModulesCount: 1,
          lockedModulesPreview: 'Module 4 (Graph Search & Greedy Paradigms)',
          upcomingExam: 'DP Benchmark Assessment (Nov 21)'
        }
      ],
      previous: [
        {
          term: 'Spring 2026',
          courses: [
            {
              code: 'CISP-360',
              name: 'Structured Programming with C++',
              instructor: 'Prof. Marcus Thorne',
              units: 4,
              finalGrade: 'A (95.8%)',
              modulesCompleted: 5,
              topicsCovered: ['Pointers & Dynamic Memory', 'Structs & Basic Classes', 'Binary File I/O']
            },
            {
              code: 'MATH-370',
              name: 'Pre-Calculus Mathematics',
              instructor: 'Dr. Eleanor Vance',
              units: 5,
              finalGrade: 'A (94.0%)',
              modulesCompleted: 5,
              topicsCovered: ['Analytic Trigonometry', 'Polar Coordinates & Vectors', 'Conic Sections']
            },
            {
              code: 'PHYS-410',
              name: 'Mechanics of Solids and Fluids',
              instructor: 'Dr. Arthur Pendelton',
              units: 4,
              finalGrade: 'A- (91.2%)',
              modulesCompleted: 5,
              topicsCovered: ['Rotational Dynamics & Angular Momentum', 'Conservation Laws', 'Fluid Statics']
            }
          ]
        },
        {
          term: 'Fall 2025',
          courses: [
            {
              code: 'CISP-301',
              name: 'Automata & Discrete Structures for CS',
              instructor: 'Prof. David Krum',
              units: 3,
              finalGrade: 'A (96.5%)',
              modulesCompleted: 4,
              topicsCovered: ['Mathematical Induction', 'Graph Theory', 'DFA & Regular Languages']
            },
            {
              code: 'ENGWR-300',
              name: 'College Composition & Research Writing',
              instructor: 'Prof. Sarah Miller',
              units: 3,
              finalGrade: 'B+ (88.5%)',
              modulesCompleted: 4,
              topicsCovered: ['Academic Rhetoric', 'Peer-Reviewed Research', 'MLA Bibliography']
            }
          ]
        }
      ]
    },
    user_alex_202: {
      student: { name: 'Alex Rivera', email: 'alex.rivera@arc.losrios.edu', avatar: 'AR' },
      semester: 'Fall 2026',
      current: [
        {
          code: 'ART-380',
          name: '3D Modeling, Texturing & Procedural Shading',
          term: 'Fall 2026',
          instructor: 'Prof. Maya Lin',
          units: 4,
          grade: '96.5% · A',
          syllabusSummary: 'Organic and hard-surface polygonal topology, procedural shader networks, UV unwrapping, subsurface scattering (SSS) for organic tissue and foliage, and GPU raytracing in Blender and Unreal Engine 5.',
          inProgressModule: 'Module 4: Organic Subsurface Scattering & Environmental Foliage',
          activeTopics: ['Subsurface Scattering (SSS)', 'California Oak Foliage', 'Translucency Shaders'],
          allModules: ['Mod 1: Topology', 'Mod 2: UV Mapping', 'Mod 3: Shaders', 'Mod 4: SSS Foliage (Active)', 'Mod 5: Raytracing (Locked)', 'Mod 6: Capstone Portfolio (Locked)'],
          lockedModulesCount: 2,
          lockedModulesPreview: 'Module 5 (Real-Time Raytracing), Module 6 (3D Ecosystem Portfolio)',
          upcomingExam: 'Midterm Portfolio: Foliage Shaders (Nov 20)'
        },
        {
          code: 'NATR-300',
          name: 'California Ecology, Wildlife Habitats & Conservation',
          term: 'Fall 2026',
          instructor: 'Dr. Julian Sterling',
          units: 3,
          grade: '94.8% · A',
          syllabusSummary: 'Ecology of California biomes with emphasis on the Central Valley and Sierra foothills. Habitat assessment, bioacoustic field monitoring, riparian ecosystem restoration, and GIS wildlife corridor mapping.',
          inProgressModule: 'Module 4: Bioacoustic Ultrasonic Field Monitoring',
          activeTopics: ['Ultrasonic Songbird Frequencies', 'Audio Spectrograms', 'Habitat Monitoring'],
          allModules: ['Mod 1: Biomes', 'Mod 2: Soil Microbiology', 'Mod 3: GIS Mapping', 'Mod 4: Bioacoustics (Active)', 'Mod 5: Encroachment (Locked)', 'Mod 6: Field Survey (Locked)'],
          lockedModulesCount: 2,
          lockedModulesPreview: 'Module 5 (Urban Encroachment Mitigation), Module 6 (Field Survey Proposal)',
          upcomingExam: 'Field Report: Bioacoustic Survey (Nov 23)'
        },
        {
          code: 'PHOTO-390',
          name: 'Environmental Documentary & Field Cinematography',
          term: 'Fall 2026',
          instructor: 'Prof. Chloe Moreau',
          units: 3,
          grade: '95.2% · A',
          syllabusSummary: 'Cinematography for natural history and conservation advocacy. Field lighting, high dynamic range log recording, ambisonic spatial audio recording, and color grading in DaVinci Resolve.',
          inProgressModule: 'Module 4: Color Grading, Log Profiles & ACES Color Spaces',
          activeTopics: ['ACES Color Transform', 'Specular Highlight Rolloff', 'DaVinci Resolve'],
          allModules: ['Mod 1: HDR Sensors', 'Mod 2: Spatial Audio', 'Mod 3: Natural Light', 'Mod 4: Color Grading (Active)', 'Mod 5: Editing (Locked)', 'Mod 6: Final Screening (Locked)'],
          lockedModulesCount: 2,
          lockedModulesPreview: 'Module 5 (Documentary Editing), Module 6 (Final Screening Short)',
          upcomingExam: 'Rough Cut Review: Parkway Wildlife Film (Nov 27)'
        }
      ],
      previous: [
        {
          term: 'Spring 2026',
          courses: [
            {
              code: 'ART-320',
              name: 'Digital Painting & Concept Art',
              instructor: 'Prof. Maya Lin',
              units: 3,
              finalGrade: 'A (96.0%)',
              modulesCompleted: 5,
              topicsCovered: ['Digital brushwork', 'Atmospheric perspective', 'Flora character design']
            },
            {
              code: 'BIOL-300',
              name: 'General Biology & Environmental Systems',
              instructor: 'Dr. Sarah Thornton',
              units: 4,
              finalGrade: 'A (93.5%)',
              modulesCompleted: 5,
              topicsCovered: ['Photosynthesis kinetics', 'Trophic energy flow', 'Aquatic ecosystems']
            }
          ]
        },
        {
          term: 'Fall 2025',
          courses: [
            {
              code: 'DESGN-301',
              name: 'Visual Communication & Environmental Design',
              instructor: 'Prof. Victor Vance',
              units: 3,
              finalGrade: 'A (95.0%)',
              modulesCompleted: 4,
              topicsCovered: ['Information hierarchy', 'Wayfinding typography', 'Exhibition layouts']
            },
            {
              code: 'GEOG-300',
              name: "Physical Geography: Earth's Environmental Systems",
              instructor: 'Dr. Ronald Wu',
              units: 3,
              finalGrade: 'A (94.2%)',
              modulesCompleted: 4,
              topicsCovered: ['Microclimates', 'Fluvial geomorphology', 'Central Valley watershed']
            }
          ]
        }
      ]
    }
  },

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.bindEvents();
  },

  bindEvents() {
    // 1. Legacy sync button (retained for backward compatibility and test runner)
    const btnSync = document.getElementById('btn-sync-canvas-mock');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        window.AscDash.Toast.show('Canvas course context cached for AI review', 'owl');
      });
    }

    // 2. Data & Sync settings button in header line
    const btnDataSync = document.getElementById('btn-canvas-data-sync');
    if (btnDataSync) {
      btnDataSync.addEventListener('click', () => {
        const modal = document.getElementById('modal-canvas-data-sync');
        if (modal) modal.style.display = 'flex';
      });
    }

    // Close settings modal
    const btnCloseSettings = document.getElementById('btn-close-canvas-settings');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        const modal = document.getElementById('modal-canvas-data-sync');
        if (modal) modal.style.display = 'none';
      });
    }

    // Save settings modal
    const btnSaveSettings = document.getElementById('btn-save-canvas-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const modal = document.getElementById('modal-canvas-data-sync');
        if (modal) modal.style.display = 'none';
        window.AscDash.Toast.show('Canvas sync preferences saved', 'owl');
      });
    }

    // Total Grade toggle (Yes/No tick box with expanding sub-settings)
    const toggleTotalGrade = document.getElementById('canvas-sync-toggle-total-grade');
    const gradeSubSettings = document.getElementById('canvas-grade-sub-settings');
    const gradeYesNoBadge = document.getElementById('canvas-grade-yes-no-badge');

    if (toggleTotalGrade) {
      toggleTotalGrade.addEventListener('change', () => {
        const isYes = toggleTotalGrade.checked;
        if (gradeSubSettings) {
          gradeSubSettings.style.display = isYes ? 'flex' : 'none';
        }
        if (gradeYesNoBadge) {
          gradeYesNoBadge.textContent = isYes ? 'YES' : 'NO';
          if (isYes) {
            gradeYesNoBadge.style.background = 'rgba(34, 197, 94, 0.15)';
            gradeYesNoBadge.style.color = '#4ade80';
            gradeYesNoBadge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
          } else {
            gradeYesNoBadge.style.background = 'var(--bg-subtle)';
            gradeYesNoBadge.style.color = 'var(--text-muted)';
            gradeYesNoBadge.style.borderColor = 'var(--border-color)';
          }
        }
      });
    }

    // 3. Export Canvas Data button
    const btnExport = document.getElementById('btn-canvas-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        this.exportCanvasData();
      });
    }

    // 4. Import Canvas Data button
    const btnImport = document.getElementById('btn-canvas-import');
    const fileImport = document.getElementById('canvas-import-file');
    if (btnImport && fileImport) {
      btnImport.addEventListener('click', () => {
        fileImport.click();
      });
      fileImport.addEventListener('change', (e) => {
        this.importCanvasData(e);
      });
    }

    // 5. Open Data Remove Modal button
    const btnOpenRemove = document.getElementById('btn-canvas-open-remove-modal');
    if (btnOpenRemove) {
      btnOpenRemove.addEventListener('click', () => {
        const removeModal = document.getElementById('modal-canvas-remove-data');
        if (removeModal) removeModal.style.display = 'flex';
      });
    }

    // Close Data Remove Modal
    const btnCloseRemove = document.getElementById('btn-close-canvas-remove');
    if (btnCloseRemove) {
      btnCloseRemove.addEventListener('click', () => {
        const removeModal = document.getElementById('modal-canvas-remove-data');
        if (removeModal) removeModal.style.display = 'none';
      });
    }

    const btnCancelRemove = document.getElementById('btn-cancel-canvas-remove');
    if (btnCancelRemove) {
      btnCancelRemove.addEventListener('click', () => {
        const removeModal = document.getElementById('modal-canvas-remove-data');
        if (removeModal) removeModal.style.display = 'none';
      });
    }

    // Confirm Data Removal
    const btnConfirmRemove = document.getElementById('btn-confirm-canvas-remove');
    if (btnConfirmRemove) {
      btnConfirmRemove.addEventListener('click', () => {
        this.executeDataRemoval();
      });
    }

    // 6. Logout button inside settings card (opens confirmation dialog)
    const btnLogout = document.getElementById('btn-canvas-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        const confirmModal = document.getElementById('modal-canvas-logout-confirm');
        if (confirmModal) confirmModal.style.display = 'flex';
      });
    }

    // Cancel logout
    const btnCancelLogout = document.getElementById('btn-cancel-canvas-logout');
    if (btnCancelLogout) {
      btnCancelLogout.addEventListener('click', () => {
        const confirmModal = document.getElementById('modal-canvas-logout-confirm');
        if (confirmModal) confirmModal.style.display = 'none';
      });
    }

    // Confirm logout
    const btnConfirmLogout = document.getElementById('btn-confirm-canvas-logout');
    if (btnConfirmLogout) {
      btnConfirmLogout.addEventListener('click', () => {
        const confirmModal = document.getElementById('modal-canvas-logout-confirm');
        const settingsModal = document.getElementById('modal-canvas-data-sync');
        if (confirmModal) confirmModal.style.display = 'none';
        if (settingsModal) settingsModal.style.display = 'none';

        this.isCanvasConnected = false;
        this.renderConnectionState();
        window.AscDash.Toast.show('Canvas account disconnected from sync', 'owl');
      });
    }

    // 7. Reconnect Canvas button (triggers fake OAuth login with 5-stage animation)
    const btnReconnect = document.getElementById('btn-reconnect-canvas');
    if (btnReconnect) {
      btnReconnect.addEventListener('click', () => {
        this.openCanvasAuthModal();
      });
    }

    // Auth modal cancel
    const btnAuthCancel = document.getElementById('btn-canvas-modal-cancel');
    if (btnAuthCancel) {
      btnAuthCancel.addEventListener('click', () => {
        this.closeCanvasAuthModal();
      });
    }

    // Auth modal authorize (triggers 2300ms 5-stage stepper)
    const btnAuthAuthorize = document.getElementById('btn-canvas-modal-authorize');
    if (btnAuthAuthorize) {
      btnAuthAuthorize.addEventListener('click', () => {
        this.startCanvasAuthStepper();
      });
    }

    // 8. Minimalist Previous Courses Toggle
    const btnTogglePrev = document.getElementById('btn-toggle-previous-courses');
    if (btnTogglePrev) {
      btnTogglePrev.addEventListener('click', () => {
        this.isPreviousExpanded = !this.isPreviousExpanded;
        this.updatePreviousCoursesVisibility();
      });
    }
  },

  exportCanvasData() {
    const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'user_jordan_101';
    const studentData = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];

    const exportPayload = {
      exportType: 'CanvasCourseContext',
      exportedAt: new Date().toISOString(),
      student: studentData.student,
      activeSemester: studentData.semester,
      currentCourses: studentData.current,
      previousCourses: studentData.previous,
      remindersContext: this.canvasItems
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-context-export-${studentData.student.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.AscDash.Toast.show('Canvas course context exported to JSON', 'download');
  },

  importCanvasData(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'user_jordan_101';

        if (imported.currentCourses || imported.current) {
          this.STUDENT_DATA_FIXTURES[userId].current = imported.currentCourses || imported.current;
        }
        if (imported.previousCourses || imported.previous) {
          this.STUDENT_DATA_FIXTURES[userId].previous = imported.previousCourses || imported.previous;
        }
        if (imported.activeSemester || imported.semester) {
          this.STUDENT_DATA_FIXTURES[userId].semester = imported.activeSemester || imported.semester;
        }

        this.render(this.canvasItems, this.currentUser);
        window.AscDash.Toast.show('Canvas context imported successfully!', 'upload');
      } catch (err) {
        console.error('Error importing Canvas JSON:', err);
        window.AscDash.Toast.show('Failed to parse Canvas JSON file', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  executeDataRemoval() {
    const scopeCurrent = document.getElementById('canvas-remove-scope-current');
    const scopePrevious = document.getElementById('canvas-remove-scope-previous');
    const scopeAll = document.getElementById('canvas-remove-scope-all');

    const catSyllabi = document.getElementById('canvas-remove-cat-syllabi');
    const catModules = document.getElementById('canvas-remove-cat-modules');
    const catGrades = document.getElementById('canvas-remove-cat-grades');
    const catReminders = document.getElementById('canvas-remove-cat-reminders');

    const removeCurrent = (scopeCurrent && scopeCurrent.checked) || (scopeAll && scopeAll.checked);
    const removePrevious = (scopePrevious && scopePrevious.checked) || (scopeAll && scopeAll.checked);

    const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'user_jordan_101';
    const studentData = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];

    if (removeCurrent) {
      if (catSyllabi && catSyllabi.checked && catModules && catModules.checked && catGrades && catGrades.checked && catReminders && catReminders.checked) {
        studentData.current = [];
      } else {
        studentData.current.forEach(c => {
          if (catSyllabi && catSyllabi.checked) c.syllabusSummary = 'Syllabus context cleared.';
          if (catModules && catModules.checked) {
            c.inProgressModule = 'Module details removed.';
            c.allModules = [];
            c.activeTopics = [];
          }
          if (catGrades && catGrades.checked) c.grade = 'N/A (Grade sync removed)';
          if (catReminders && catReminders.checked) {
            c.upcomingExam = null;
            c.lockedModulesCount = 0;
            c.lockedModulesPreview = '';
          }
        });
      }
    }

    if (removePrevious) {
      studentData.previous = [];
    }

    const removeModal = document.getElementById('modal-canvas-remove-data');
    if (removeModal) removeModal.style.display = 'none';

    this.render(this.canvasItems, this.currentUser);
    window.AscDash.Toast.show('Selected Canvas data removed from ambient memory', 'delete');
  },

  openCanvasAuthModal() {
    this.clearStepperTimeouts();
    const modal = document.getElementById('modal-canvas-auth');
    const stageConsent = document.getElementById('stage-canvas-consent');
    const stageStepper = document.getElementById('stage-canvas-stepper');

    if (stageConsent) stageConsent.style.display = 'block';
    if (stageStepper) stageStepper.style.display = 'none';

    // Populate active student persona
    const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'user_jordan_101';
    const fixture = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];
    const student = fixture.student || { name: 'Jordan Lee', email: 'jordan.lee@crc.losrios.edu', avatar: 'JL' };

    const nameEl = document.getElementById('canvas-student-display-name');
    const emailEl = document.getElementById('canvas-student-email');
    const avatarEl = document.getElementById('canvas-student-avatar');

    if (nameEl) nameEl.textContent = student.name;
    if (emailEl) emailEl.textContent = `${student.email} • losrios.instructure.com`;
    if (avatarEl) avatarEl.textContent = student.avatar;

    // Reset steps
    const s1 = document.getElementById('canvas-step-1');
    const s2 = document.getElementById('canvas-step-2');
    const s3 = document.getElementById('canvas-step-3');
    const progressFill = document.getElementById('canvas-stepper-progress-fill');

    if (s1) s1.className = 'step-row';
    if (s2) s2.className = 'step-row';
    if (s3) s3.className = 'step-row';
    if (progressFill) progressFill.style.width = '0%';

    if (modal) modal.style.display = 'flex';
  },

  closeCanvasAuthModal() {
    this.clearStepperTimeouts();
    const modal = document.getElementById('modal-canvas-auth');
    if (modal) modal.style.display = 'none';
  },

  clearStepperTimeouts() {
    this.activeStepperTimeouts.forEach(t => clearTimeout(t));
    this.activeStepperTimeouts = [];
  },

  startCanvasAuthStepper() {
    const stageConsent = document.getElementById('stage-canvas-consent');
    const stageStepper = document.getElementById('stage-canvas-stepper');
    const s1 = document.getElementById('canvas-step-1');
    const s2 = document.getElementById('canvas-step-2');
    const s3 = document.getElementById('canvas-step-3');
    const progressFill = document.getElementById('canvas-stepper-progress-fill');

    if (stageConsent) stageConsent.style.display = 'none';
    if (stageStepper) stageStepper.style.display = 'flex';

    // Step 1: Handshaking (0–650ms)
    if (s1) s1.className = 'step-row active';
    if (s2) s2.className = 'step-row';
    if (s3) s3.className = 'step-row';
    if (progressFill) progressFill.style.width = '33%';

    // Step 2: Validating Token (650–1300ms)
    const t1 = setTimeout(() => {
      if (s1) s1.className = 'step-row completed';
      if (s2) s2.className = 'step-row active';
      if (progressFill) progressFill.style.width = '66%';
    }, 650);
    this.activeStepperTimeouts.push(t1);

    // Step 3: Fetching Courses (1300–1950ms)
    const t2 = setTimeout(() => {
      if (s2) s2.className = 'step-row completed';
      if (s3) s3.className = 'step-row active';
      if (progressFill) progressFill.style.width = '100%';
    }, 1300);
    this.activeStepperTimeouts.push(t2);

    // Hold with all 3 checkmarks (1950–2300ms)
    const t3 = setTimeout(() => {
      if (s3) s3.className = 'step-row completed';
    }, 1950);
    this.activeStepperTimeouts.push(t3);

    // Commit at 2300ms: Ask MockServer or retrieve data from MockServer to update current courses
    const t4 = setTimeout(async () => {
      await this.fetchUpdatedCoursesFromMockServer();
      this.closeCanvasAuthModal();
      this.isCanvasConnected = true;
      this.renderConnectionState();
      window.AscDash.Toast.show('Canvas account authorized & course data synced from MockServer!', 'owl');
    }, 2300);
    this.activeStepperTimeouts.push(t4);
  },

  async fetchUpdatedCoursesFromMockServer() {
    const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'user_jordan_101';
    const studentFolder = (userId === 'user_alex_202') ? 'student_2' : 'student_1';

    console.log(`[CanvasView] Requesting updated course data from MockServer for ${userId} (${studentFolder})...`);
    let freshCourses = null;

    // 1. Ask MockServer via chrome.runtime messaging if available
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'FETCH_CANVAS_DATA', userId: userId }, (res) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(res);
          });
        });
        if (response && response.success && response.courses) {
          freshCourses = response.courses;
          console.log('[CanvasView] Received fresh courses via MockServer messaging:', freshCourses.length);
        }
      } catch (e) {
        console.warn('[CanvasView] Messaging to MockServer failed, falling back to direct fetch:', e);
      }
    }

    // 2. Direct fetch from mockserver/canvas data/... if not retrieved via messaging
    if (!freshCourses) {
      try {
        const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
          ? chrome.runtime.getURL(`mockserver/canvas data/${studentFolder}/current courses/current_courses.json`)
          : `../mockserver/canvas data/${studentFolder}/current courses/current_courses.json`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && json.courses) {
            freshCourses = json.courses;
            console.log('[CanvasView] Fetched fresh courses directly from MockServer data files:', freshCourses.length);
          }
        }
      } catch (err) {
        console.warn('[CanvasView] Direct MockServer fetch error:', err);
      }
    }

    // 3. Map retrieved MockServer courses into the active student fixture
    if (freshCourses && freshCourses.length > 0) {
      const studentData = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];

      studentData.current = freshCourses.map(c => {
        const inProgressMod = (c.modules || []).find(m => m.status === 'in_progress');
        const lockedMods = (c.modules || []).filter(m => m.status === 'locked' || m.isFutureModule);
        const upcomingExam = (c.upcomingTestsAndAssignments || []).find(t => t.status === 'locked' || t.isFutureTest);

        return {
          code: c.courseCode,
          name: c.courseName,
          term: studentData.semester || 'Fall 2026',
          instructor: c.instructor,
          units: c.units || 4,
          grade: `${c.currentGradePercent}% · ${c.currentLetterGrade}`,
          syllabusSummary: c.syllabusSummary,
          inProgressModule: inProgressMod ? inProgressMod.name : 'Module in progress',
          activeTopics: inProgressMod ? (inProgressMod.topicsCovered || []) : [],
          allModules: (c.modules || []).map(m => m.name),
          lockedModulesCount: lockedMods.length,
          lockedModulesPreview: lockedMods.map(m => m.name).join(', '),
          upcomingExam: upcomingExam ? `${upcomingExam.title} (${upcomingExam.unlockAt ? upcomingExam.unlockAt.slice(5, 10) : 'Upcoming'})` : null
        };
      });
    }

    // Re-render current courses grid with the updated MockServer data
    const studentData = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];
    this.renderCurrentCourses(studentData.current || []);
  },

  renderConnectionState() {
    const disconnectedEl = document.getElementById('canvas-disconnected-card');
    const connectedEl = document.getElementById('canvas-connected-content');

    if (this.isCanvasConnected) {
      if (disconnectedEl) disconnectedEl.style.display = 'none';
      if (connectedEl) connectedEl.style.display = 'block';
    } else {
      if (disconnectedEl) disconnectedEl.style.display = 'block';
      if (connectedEl) connectedEl.style.display = 'none';
    }

    // Previous courses section is preserved below unless user explicitly removed previous courses
    const prevWrapperEl = document.getElementById('canvas-previous-wrapper');
    const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'user_jordan_101';
    const studentData = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];
    const hasPrevious = (studentData.previous || []).length > 0;

    if (prevWrapperEl) {
      prevWrapperEl.style.display = hasPrevious ? 'block' : 'none';
    }
  },

  updatePreviousCoursesVisibility() {
    const sectionEl = document.getElementById('canvas-previous-courses-section');
    const iconEl = document.getElementById('icon-toggle-previous');
    const textEl = document.getElementById('text-toggle-previous');

    if (!sectionEl) return;

    const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 'user_jordan_101';
    const studentData = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];
    let count = 0;
    (studentData.previous || []).forEach(tg => count += (tg.courses || []).length);

    if (this.isPreviousExpanded) {
      sectionEl.style.display = 'block';
      if (iconEl) iconEl.textContent = 'expand_less';
      if (textEl) textEl.textContent = `Hide previous courses`;
    } else {
      sectionEl.style.display = 'none';
      if (iconEl) iconEl.textContent = 'expand_more';
      if (textEl) textEl.textContent = `Show previous courses (${count})`;
    }
  },

  render(items, user) {
    this.canvasItems = items || [];
    this.currentUser = user || null;

    const userId = (user && user.id) ? user.id : 'user_jordan_101';
    const studentData = this.STUDENT_DATA_FIXTURES[userId] || this.STUDENT_DATA_FIXTURES['user_jordan_101'];

    // Update Semester header toolbar line
    const semText = document.getElementById('canvas-current-semester-text');
    if (semText) semText.textContent = studentData.semester || 'Fall 2026';

    // Render connection state
    this.renderConnectionState();

    // Render Current Courses Grid
    this.renderCurrentCourses(studentData.current || []);

    // Render Previous Courses Grouped by Term
    this.renderPreviousCourses(studentData.previous || []);

    // Legacy render for test runner backward compatibility
    this.renderLegacyList(this.canvasItems);

    // Update Badges
    const badgeCurrent = document.getElementById('badge-canvas-current-count');
    if (badgeCurrent) badgeCurrent.textContent = (studentData.current || []).length;

    const navBadge = document.getElementById('badge-canvas-count');
    if (navBadge) navBadge.textContent = (studentData.current || []).length;

    let totalPast = 0;
    (studentData.previous || []).forEach(termGroup => {
      totalPast += (termGroup.courses || []).length;
    });

    const badgePastCount = document.getElementById('badge-previous-count');
    if (badgePastCount) badgePastCount.textContent = totalPast;

    const badgePastTotal = document.getElementById('badge-canvas-previous-total');
    if (badgePastTotal) badgePastTotal.textContent = `${totalPast} Completed Courses`;

    // Ensure toggle UI matches state
    this.updatePreviousCoursesVisibility();
  },

  renderCurrentCourses(courses) {
    const container = document.getElementById('canvas-current-courses-grid');
    if (!container) return;
    container.innerHTML = '';

    if (!courses || courses.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a; grid-column: 1/-1;">No active Canvas courses found for this term.</div>`;
      return;
    }

    courses.forEach(course => {
      const theme = this.COURSE_THEMES[course.code] || this.DEFAULT_THEME;
      const isExpanded = this.expandedCourseCode === course.code;
      const card = document.createElement('div');
      card.className = `canvas-course-card ${isExpanded ? 'is-expanded' : ''}`;
      card.setAttribute('data-course', course.code);

      const modulesHtml = (course.allModules || [])
        .map(m => `<span style="font-size:10px; background:var(--bg-subtle); border:1px solid var(--border-color); padding:2px 6px; border-radius:4px; color:#d4d4d8;">${m}</span>`)
        .join('');

      card.innerHTML = `
        <div class="canvas-card-top" style="background: ${theme.gradient};">
          <div class="canvas-card-top-header">
            <span class="canvas-card-code-pill">${course.code}</span>
            <div class="canvas-card-top-icons">
              <span class="material-symbols-outlined canvas-star-icon" title="Favorite course">star</span>
              <span class="material-symbols-outlined canvas-more-icon" title="Course options">more_vert</span>
            </div>
          </div>
          <div class="canvas-card-banner-bg-code">${course.code}</div>
        </div>

        <div class="canvas-card-body">
          <div class="canvas-card-title" title="${course.name}">
            ${course.name}
          </div>
          <div class="canvas-card-meta">
            <span>${course.term}</span>
            <span>•</span>
            <span>${course.units} Units</span>
            <span>•</span>
            <span>${course.instructor}</span>
          </div>

          <div style="display:flex; align-items:center; gap: 8px; margin-top: 2px;">
            <span class="canvas-grade-badge">
              <span class="canvas-grade-dot"></span>
              Current Standing: ${course.grade}
            </span>
          </div>

          <div class="canvas-progress-row" style="margin-top: 6px;">
            <span class="material-symbols-outlined" style="font-size:15px; color:#38bdf8; flex-shrink:0;">play_circle</span>
            <strong style="color:#fafafa; font-size:12px; flex-shrink:0;">In Progress:</strong>
            <span style="color:#a1a1aa; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${course.inProgressModule}
            </span>
          </div>
        </div>

        <!-- Expanded Course Details (Revealed upon clicking the card) -->
        <div class="canvas-course-details-expand">
          <div class="canvas-expand-title">Course Syllabus &amp; Overview</div>
          <p class="canvas-expand-desc">${course.syllabusSummary || 'Comprehensive academic syllabus registered on Canvas LMS.'}</p>

          ${course.upcomingExam || course.lockedModulesCount ? `
            <div style="margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; background: var(--bg-main); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 11px;">
              ${course.upcomingExam ? `
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="material-symbols-outlined" style="font-size:14px; color:#f87171;">event_upcoming</span>
                  <strong style="color:#f87171;">Upcoming Exam:</strong>
                  <span style="color:#e4e4e7;">${course.upcomingExam}</span>
                </div>
              ` : ''}
              ${course.lockedModulesCount ? `
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="material-symbols-outlined" style="font-size:14px; color:#fbbf24;">lock</span>
                  <span style="color:#fbbf24; font-weight:500;">${course.lockedModulesCount} Future Modules Locked:</span>
                  <span style="color:#71717a;">${course.lockedModulesPreview}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="canvas-expand-title" style="margin-top:8px;">Curriculum Outline (Modules)</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:12px;">
            ${modulesHtml}
          </div>

          <!-- Part-by-Part Scan Actions -->
          <div class="canvas-expand-title" style="margin-top:10px;">Ambient AI Data Scanners (Part-by-Part)</div>
          <div class="canvas-scan-actions-grid">
            <button class="canvas-scan-btn" data-action="modules" data-course="${course.code}">
              <span class="material-symbols-outlined" style="font-size:14px;">view_module</span>
              <span>Scan Modules &amp; Topics</span>
            </button>
            <button class="canvas-scan-btn" data-action="exams" data-course="${course.code}">
              <span class="material-symbols-outlined" style="font-size:14px;">event_note</span>
              <span>Scan Upcoming Tests</span>
            </button>
            <button class="canvas-scan-btn" data-action="grades" data-course="${course.code}">
              <span class="material-symbols-outlined" style="font-size:14px;">analytics</span>
              <span>Scan Grade Standing</span>
            </button>
            <button class="canvas-scan-btn" data-action="full" data-course="${course.code}">
              <span class="material-symbols-outlined" style="font-size:14px;">sync_saved_locally</span>
              <span>Scan Full Syllabus</span>
            </button>
          </div>
        </div>

        <div class="canvas-card-footer">
          <div class="canvas-footer-icons">
            <span class="material-symbols-outlined canvas-footer-icon-btn" title="Announcements">campaign</span>
            <span class="material-symbols-outlined canvas-footer-icon-btn" title="Assignments">assignment</span>
            <span class="material-symbols-outlined canvas-footer-icon-btn" title="Discussions">forum</span>
            <span class="material-symbols-outlined canvas-footer-icon-btn" title="Files">folder</span>
          </div>
          <span class="canvas-card-expand-hint">
            <span>${isExpanded ? 'Collapse Details' : 'Click to View Details'}</span>
            <span class="material-symbols-outlined" style="font-size:14px;">${isExpanded ? 'expand_less' : 'expand_more'}</span>
          </span>
        </div>
      `;

      // Click card to toggle expansion (ignoring scan buttons or links)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.canvas-scan-btn') || e.target.closest('.canvas-footer-icon-btn') || e.target.closest('.canvas-star-icon') || e.target.closest('.canvas-more-icon')) {
          return;
        }
        this.expandedCourseCode = (this.expandedCourseCode === course.code) ? null : course.code;
        this.renderCurrentCourses(courses);
      });

      // Part-by-part scan button handlers
      card.querySelectorAll('.canvas-scan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const courseCode = btn.getAttribute('data-course');
          this.handlePartByPartScan(btn, action, courseCode);
        });
      });

      container.appendChild(card);
    });
  },

  handlePartByPartScan(btn, action, courseCode) {
    if (btn.classList.contains('scanning')) return;
    btn.classList.add('scanning');

    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px; animation: ascSpin 0.65s linear infinite;">sync</span><span>Scanning...</span>`;

    setTimeout(() => {
      btn.classList.remove('scanning');
      btn.classList.add('scanned');

      let label = 'Module topics';
      if (action === 'exams') label = 'Upcoming test schedules';
      if (action === 'grades') label = 'Course grade standing';
      if (action === 'full') label = 'Complete course syllabus';

      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px; color:#4ade80;">check</span><span>${label} Synced</span>`;
      window.AscDash.Toast.show(`Synced ${courseCode} ${label.toLowerCase()} to ambient AI memory`, 'owl');
    }, 750);
  },

  renderPreviousCourses(termGroups) {
    const container = document.getElementById('canvas-previous-courses-container');
    if (!container) return;
    container.innerHTML = '';

    if (!termGroups || termGroups.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a;">No past courses on record.</div>`;
      return;
    }

    termGroups.forEach(group => {
      const termWrapper = document.createElement('div');
      termWrapper.className = 'canvas-term-group';

      let totalUnits = 0;
      (group.courses || []).forEach(c => totalUnits += (c.units || 0));

      termWrapper.innerHTML = `
        <div class="canvas-term-group-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="material-symbols-outlined" style="color: #60a5fa;">calendar_month</span>
            <span class="canvas-term-name">${group.term}</span>
          </div>
          <span class="asc-badge" style="font-size:11px;">
            ${(group.courses || []).length} Courses • ${totalUnits} Units
          </span>
        </div>
        <div class="canvas-courses-grid" style="margin-top: 10px;"></div>
      `;

      const grid = termWrapper.querySelector('.canvas-courses-grid');

      (group.courses || []).forEach(course => {
        const theme = this.COURSE_THEMES[course.code] || this.DEFAULT_THEME;
        const card = document.createElement('div');
        card.className = 'canvas-course-card canvas-past-card';

        const topicsHtml = (course.topicsCovered || [])
          .slice(0, 3)
          .map(t => `<span class="canvas-topic-pill">${t}</span>`)
          .join('');

        card.innerHTML = `
          <div class="canvas-card-top canvas-card-top-past" style="background: ${theme.gradient};">
            <div class="canvas-card-top-header">
              <span class="canvas-card-code-pill">${course.code}</span>
              <span class="asc-badge" style="background:rgba(34,197,94,0.25); color:#4ade80; border:1px solid rgba(34,197,94,0.4);">
                <span class="material-symbols-outlined" style="font-size:12px; margin-right:2px;">check_circle</span>
                Completed
              </span>
            </div>
            <div class="canvas-card-banner-bg-code">${course.code}</div>
          </div>

          <div class="canvas-card-body">
            <div class="canvas-card-title">${course.name}</div>
            <div class="canvas-card-meta">
              <span>${group.term}</span>
              <span>•</span>
              <span>${course.units} Units</span>
              <span>•</span>
              <span>${course.instructor}</span>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:4px;">
              <span class="canvas-past-grade-badge">
                Final Grade: <strong>${course.finalGrade}</strong>
              </span>
              <span style="font-size:11px; color:#71717a;">${course.modulesCompleted} Modules</span>
            </div>

            <div class="canvas-topics-wrap">
              ${topicsHtml}
            </div>
          </div>

          <div class="canvas-card-footer">
            <div class="canvas-footer-icons">
              <span class="material-symbols-outlined canvas-footer-icon-btn" title="Archived Syllabus">book_5</span>
              <span class="material-symbols-outlined canvas-footer-icon-btn" title="Past Files">folder</span>
            </div>
            <span style="font-size:11px; color:#71717a;">Academic Archive</span>
          </div>
        `;

        grid.appendChild(card);
      });

      container.appendChild(termWrapper);
    });
  },

  renderLegacyList(items) {
    const container = document.getElementById('canvas-reminders-list');
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a;">No Canvas context collected yet. Course modules will appear here when synced.</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      card.innerHTML = `
        <div class="asc-card-header">
          <div class="asc-card-meta">
            <span class="asc-tag">${item.course}</span>
            <span>•</span>
            <span>Context ID: ${item.id}</span>
          </div>
          <span class="asc-badge" style="font-size:10px;">FOR BACKEND AI REVIEW</span>
        </div>
        <div style="font-size:14px; font-weight:600; color: #fafafa;">
          ${item.title}
        </div>
        <div style="font-size:12px; color:#a1a1aa; line-height:1.4;">
          <strong>Course Topics:</strong> ${Array.isArray(item.topicsCovered) ? item.topicsCovered.join(', ') : 'Subroutine Alignment, Calling Conventions, GDB Debugging'}
        </div>
      `;
      container.appendChild(card);
    });
  }
};
