/**
 * Ambient Study Commons - Seed Data & Schema Constants
 * Local-First fallback fixtures for zero-failure demonstration.
 */

const STORAGE_KEYS = {
  JOURNAL_LOG: 'asc_journal_log',
  SKILLS_LEDGER: 'asc_skills_ledger',
  EVENTS_DATA: 'asc_events_data',
  PEER_MATCHES: 'asc_peer_matches',
  STUDENT_PROFILE: 'asc_student_profile',
  APP_CONFIG: 'asc_app_config'
};

const DEFAULT_STUDENT_PROFILE = {
  student_id: 'crc_student_9021',
  display_name: 'Jordan Lee',
  avatar_initials: 'JL',
  institution: 'Cosumnes River College',
  program: 'Computer Science (AS-T)',
  term: 'Fall 2026',
  reliability_score: '98% (High Trust)'
};

const DEFAULT_EVENTS = {
  student_id: 'crc_student_9021',
  term: 'Fall 2026',
  courses: [
    {
      course_id: 'CISP-310',
      course_name: 'Assembly Language and Computer Architecture',
      instructor: 'Prof. D. Ellis',
      active_assignment: {
        assignment_id: 'lab_04',
        title: 'Lab 4: x86-64 Subroutine Calling Conventions & Stack Alignment',
        due_date: '2026-11-13T23:59:00-08:00',
        key_topics: [
          'x86-64 Assembly',
          'Stack Frames (%rbp / %rsp)',
          '16-Byte Stack Alignment',
          'gdb Disassembly'
        ]
      }
    },
    {
      course_id: 'CISP-400',
      course_name: 'Object-Oriented Programming with C++',
      instructor: 'Prof. M. Ross',
      active_assignment: {
        assignment_id: 'hw_03',
        title: 'Assignment 3: Polymorphic Memory Managers & Smart Pointers',
        due_date: '2026-11-17T23:59:00-08:00',
        key_topics: [
          'C++20',
          'std::unique_ptr',
          'Custom Allocators',
          'Valgrind Memcheck'
        ]
      }
    }
  ],
  campus_locations: [
    {
      id: 'loc_mesa',
      name: 'CRC MESA Center',
      description: 'Library Building 2nd Floor, Collaborative STEM Study Area',
      preferred_tables: ['Table 3 (Hardware/CS)']
    }
  ]
};

const DEFAULT_JOURNAL = {
  last_updated: '2026-11-11T00:15:00-08:00',
  today_master_journal: {
    date: '2026-11-11',
    headline: 'Overcoming x86-64 Stack Misalignment in Recursion',
    summary: 'Spent 2 hours debugging a segmentation fault on CISP 310 Lab 4. Discovered that the 64-bit ABI requires a 16-byte boundary alignment before `call` instructions. Inspected registers with GDB and successfully verified stack frame unwinding.',
    key_takeaways: [
      'Mastered caller-saved vs. callee-saved register preservation (%rbx, %r12-%r15).',
      'Configured custom GDB layout with `layout regs` and breakpoint triggers.',
      'Identified that odd push counts require `sub $8, %rsp` padding before external function calls.'
    ],
    tomorrow_focus: 'Implement the recursive factorial subroutine using clean stack frames.',
    session_count: 2
  },
  raw_sessions: [
    {
      session_id: 'sess_101',
      platform: 'gemini',
      timestamp: '2026-11-10T21:30:00-08:00',
      course_context: 'CISP-310',
      recap_text: 'I was working on CISP 310 Lab 4 trying to implement recursive subroutine calls in NASM. I kept getting segfaults on Ubuntu 24.04 inside printf. Gemini explained that System V AMD64 ABI requires %rsp to be a multiple of 16 right before calling any external function. After pushing %rbp and an odd number of arguments, I had to align with `sub rsp, 8`. We also stepped through gdb with `x/20gx $rsp`.'
    }
  ]
};

const DEFAULT_SKILLS = {
  last_updated: '2026-11-11T00:15:00-08:00',
  demonstrated_skills: [
    {
      name: 'x86-64 Assembly',
      category: 'Systems Programming',
      confidence: 'Intermediate',
      evidence_snippet: 'Understands System V AMD64 ABI calling conventions and stack padding.',
      last_demonstrated: '2026-11-10'
    },
    {
      name: 'gdb Disassembly & Inspection',
      category: 'Debugging Tools',
      confidence: 'Advanced',
      evidence_snippet: 'Proficient with `layout regs`, examining memory via `x/gx`, register unwinding.',
      last_demonstrated: '2026-11-10'
    },
    {
      name: 'Modern C++ (Pointers & Memory)',
      category: 'Software Engineering',
      confidence: 'Intermediate',
      evidence_snippet: 'Working on smart pointer resource management in CISP 400.',
      last_demonstrated: '2026-11-08'
    }
  ],
  areas_for_growth: [
    'Buffer allocation bounds checking',
    'Floating-point register manipulation (XMM0-XMM7)'
  ],
  recurring_passions: [
    {
      topic: 'Bare-Metal OS & Kernel Emulation',
      mention_count: 3,
      first_mentioned: '2026-11-02',
      last_mentioned: '2026-11-10',
      status: 'active_interest'
    }
  ]
};

const DEFAULT_MATCHES = {
  matches: [
    {
      match_id: 'match_crc_310_01',
      peer: {
        display_name: 'Alex Rivera',
        avatar_initials: 'AR',
        program: 'Computer Science (AS-T)',
        shared_course: 'CISP 310 (Assembly)',
        current_target: 'Lab 4 Stack Frames'
      },
      affinity_score: 94,
      complementary_rationale: 'Alex is struggling with GDB memory inspection on Lab 4, where your journal demonstrates mastery. You both share an interest in systems architecture and are free Tuesday afternoon.',
      meeting_proposal: {
        venue: 'CRC MESA Center, Table 3',
        suggested_time: 'Today, 2:30 PM - 4:00 PM',
        study_objective: 'Pair-debug Lab 4 stack pointer alignment and run gdb disas test suite.'
      },
      status: 'actionable'
    }
  ]
};

const DEFAULT_CONFIG = {
  backend_url: 'http://localhost:8000',
  local_first_active: true,
  auto_recap_prompt: 'Please provide a 3-bullet recap of what technical concepts I learned, what errors I debugged, and what my next study focus should be.'
};

// Export for Service Worker, Content Scripts, and Node test environments
const SeedDataBundle = {
  STORAGE_KEYS,
  DEFAULT_STUDENT_PROFILE,
  DEFAULT_EVENTS,
  DEFAULT_JOURNAL,
  DEFAULT_SKILLS,
  DEFAULT_MATCHES,
  DEFAULT_CONFIG
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeedDataBundle;
} else if (typeof globalThis !== 'undefined') {
  globalThis.SeedDataBundle = SeedDataBundle;
}

