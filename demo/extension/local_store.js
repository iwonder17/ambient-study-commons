/**
 * Ambient Study Commons (Demo) - Local Storage & Offline Seed Data
 * Enables 100% zero-backend functionality via chrome.storage.local.
 */

const LOCAL_STORAGE_KEYS = {
  USER: 'asc_user',
  PREFERENCES: 'asc_preferences',
  FREETIME: 'asc_freetime',
  SESSIONS: 'asc_sessions',
  JOURNALS: 'asc_journals',
  SKILLS: 'asc_skills',
  DREAMS: 'asc_dreams',
  CANVAS_REMINDERS: 'asc_canvas_reminders',
  CANVAS_DATA: 'asc_canvas_data',
  INVITATIONS: 'asc_invitations',
  CREDIT_SCORE: 'asc_credit_score',
  ROOM_MESSAGES: 'asc_room_messages',
  BUTTON_POSITION: 'asc_button_position'
};

const DEFAULT_OFFLINE_STATE = {
  [LOCAL_STORAGE_KEYS.USER]: {
    id: "user_jordan_101",
    displayName: "Jordan Lee",
    email: "jordan.lee@crc.losrios.edu",
    institution: "Cosumnes River College",
    term: "Fall 2026",
    avatarInitials: "JL"
  },
  [LOCAL_STORAGE_KEYS.PREFERENCES]: {
    collectAiChats: true,
    collectCanvasModules: true,
    collectCanvasGrades: true,
    collectCanvasSyllabi: true,
    collectCanvasEvents: true,
    reviewCycleDays: 7
  },
  [LOCAL_STORAGE_KEYS.SESSIONS]: [
    {
      id: "sess_01",
      platform: "gemini",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      courseContext: "CISP-310",
      rawText: "Debugging segmentation fault in x86-64 recursive factorial subroutine. Discovered System V AMD64 ABI enforces 16-byte stack boundary alignment before call instructions. Inspected registers with GDB using layout regs."
    },
    {
      id: "sess_02",
      platform: "chatgpt",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      courseContext: "CISP-400",
      rawText: "Explored smart pointer memory management and custom allocator design in C++20 for high-performance data buffers."
    }
  ],
  [LOCAL_STORAGE_KEYS.JOURNALS]: [
    {
      id: "jour_01",
      date: new Date().toISOString().split("T")[0],
      headline: "Overcoming x86-64 Stack Misalignment in Recursion",
      summary: "Spent 2 hours resolving stack frame alignment faults on CISP 310 Lab 4. Confirmed that 64-bit ABI constraints mandate 16-byte RSP alignment before external subroutine invocation.",
      highlights: [
        "Enforced 16-byte stack boundary rule before calling external functions.",
        "Preserved callee-saved registers (%rbx, %r12-%r15) across nested subroutine boundaries.",
        "Utilized GDB register layout view ('layout regs') for live inspection."
      ],
      tomorrowFocus: "Implement recursive base case and run regression disas tests.",
      sessionCount: 2
    },
    {
      id: "jour_02",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      headline: "Designing Polymorphic Smart Pointer Allocators",
      summary: "Constructed RAII memory managers with std::unique_ptr and custom deallocators in CISP 400. Verified zero memory leaks under Valgrind.",
      highlights: [
        "Eliminated manual raw pointer lifecycle risks via custom RAII wrappers.",
        "Configured custom memory arena pools to reduce allocation overhead."
      ],
      tomorrowFocus: "Complete templated container unit test suite.",
      sessionCount: 2
    }
  ],
  [LOCAL_STORAGE_KEYS.SKILLS]: {
    demonstrated: [
      { name: "x86-64 Assembly", category: "Systems Programming", confidence: "Advanced", evidence: "System V AMD64 ABI 16-byte stack alignment and frame pointer tracking." },
      { name: "gdb Disassembly & Inspection", category: "Debugging Tools", confidence: "Advanced", evidence: "Proficient with layout regs, register inspection, and memory dumps." },
      { name: "Modern C++ (Pointers & Memory)", category: "Software Engineering", confidence: "Intermediate", evidence: "RAII smart pointers and arena allocators in CISP 400." }
    ],
    growth: [
      "Buffer allocation bounds checking",
      "Floating-point register manipulation (XMM0-XMM7)"
    ],
    teamRoles: ["Systems Debugger", "Architecture Designer", "Researcher"],
    mindset: "Methodical, systems-first thinker who thrives when inspecting low-level mechanics and solving root-cause bugs with calm persistence."
  },
  [LOCAL_STORAGE_KEYS.DREAMS]: [
    {
      id: "dream_01",
      topic: "Setup Minecraft Server & Networking",
      mentionCount: 30,
      recentTimestamps: ["Nov 10", "Nov 08", "Nov 05", "Nov 03", "Oct 28"],
      status: "tracking"
    },
    {
      id: "dream_02",
      topic: "Bare-Metal OS & Kernel Emulation",
      mentionCount: 12,
      recentTimestamps: ["Nov 09", "Nov 04", "Oct 30"],
      status: "tracking"
    }
  ],
  [LOCAL_STORAGE_KEYS.CANVAS_REMINDERS]: [
    {
      id: "rem_01",
      title: "CISP 310 Lab 4: Stack Alignment & Subroutines",
      course: "CISP 310 - Assembly Language & Architecture",
      dueDate: "Tomorrow at 11:59 PM",
      urgency: "Due Tomorrow",
      type: "assignment"
    },
    {
      id: "rem_02",
      title: "CISP 400 HW 3: Smart Pointers & Custom Allocators",
      course: "CISP 400 - Object-Oriented Programming with C++",
      dueDate: "In 4 Days at 11:59 PM",
      urgency: "This Week",
      type: "assignment"
    },
    {
      id: "rem_03",
      title: "CISP 310 Midterm Architecture Exam",
      course: "CISP 310 - Assembly Language & Architecture",
      dueDate: "In 6 Days at 2:00 PM",
      urgency: "Upcoming",
      type: "exam"
    }
  ],
  [LOCAL_STORAGE_KEYS.INVITATIONS]: [
    {
      id: "match_crc_310_01",
      peer: {
        name: "Alex Rivera",
        initials: "AR",
        program: "Computer Science (AS-T)",
        course: "CISP 310 (Assembly Language)"
      },
      affinity: 94,
      sharedTopic: "CISP 310 Lab 4 Stack Frames & GDB",
      rationale: "Alex is working through GDB frame unwinding on Lab 4, where your journal demonstrates mastery. You both share an interest in systems architecture.",
      venue: "CRC MESA Center, Table 3",
      suggestedTime: "Today, 2:30 PM - 4:00 PM",
      status: "actionable"
    }
  ],
  [LOCAL_STORAGE_KEYS.CREDIT_SCORE]: {
    score: 98,
    rating: "High Trust",
    totalScheduled: 5,
    attended: 5,
    noShows: 0
  },
  [LOCAL_STORAGE_KEYS.ROOM_MESSAGES]: [
    {
      id: "msg_01",
      sender: "ai_host",
      text: "Welcome Jordan and Alex! I'm excited to introduce you both. 🎉",
      timestamp: "2:30 PM"
    },
    {
      id: "msg_02",
      sender: "ai_host",
      text: "You are both currently working on CISP 310 Lab 4 stack alignment and subroutine conventions. Jordan, would you like to share your debugging setup in GDB?",
      timestamp: "2:31 PM"
    }
  ]
};

async function initLocalStorageIfEmpty() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(LOCAL_STORAGE_KEYS.USER);
    if (!res[LOCAL_STORAGE_KEYS.USER]) {
      console.log("[ASC Demo] Initializing local storage fixtures...");
      await chrome.storage.local.set(DEFAULT_OFFLINE_STATE);
    }
  }
}

async function getLocalData(key) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(key);
    return res[key] || DEFAULT_OFFLINE_STATE[key];
  }
  return DEFAULT_OFFLINE_STATE[key];
}

async function setLocalData(key, value) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [key]: value });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LOCAL_STORAGE_KEYS, DEFAULT_OFFLINE_STATE, initLocalStorageIfEmpty, getLocalData, setLocalData };
} else if (typeof globalThis !== 'undefined') {
  globalThis.LocalStore = { LOCAL_STORAGE_KEYS, DEFAULT_OFFLINE_STATE, initLocalStorageIfEmpty, getLocalData, setLocalData };
}

