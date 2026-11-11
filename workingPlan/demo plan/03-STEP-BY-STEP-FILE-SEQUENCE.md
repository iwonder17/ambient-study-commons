# Ambient Study Commons — Modular File-by-File Implementation Sequence

This sequence is strictly ordered so that every single commit produces a working, testable component. You can load unpacked in Chrome at Step 2 and verify progress in DevTools after every file.

---

## Target Project Layout

```text
ambient-study-commons/
├── extension/
│   ├── manifest.json            # Manifest V3 configuration & permissions
│   ├── background.js            # Service worker handling tab launch & initial seeding
│   ├── seed_data.js             # Local-first fallback fixtures (courses, initial journal, matches)
│   ├── content.js               # Floating Mascot Pill & Auto Recap / Manual Paste modal
│   ├── content.css              # Styling for floating widget, modal & dark-mode overlays
│   ├── dashboard.html           # Full-page dark mode visual dashboard
│   ├── dashboard.css            # Clean Tailwind-like CSS styles for dashboard
│   ├── dashboard.js             # Client controller: storage sync, API calls, export & purge
│   └── icons/                   # Mascot & extension icons (SVG / PNG)
├── backend/
│   ├── requirements.txt         # FastAPI, uvicorn, pydantic, google-genai
│   ├── .env.example             # GEMINI_API_KEY placeholder
│   ├── models.py                # Pydantic models matching Section 2 Data Contracts
│   ├── heuristic_fallback.py    # Zero-network offline parser & deterministic matcher
│   ├── ai_service.py            # Gemini 2.0 Flash prompt builder & response parser
│   └── main.py                  # FastAPI app with CORS and /api/session & /api/match
├── workingPlan/
│   └── demo plan/
│       ├── 01-DEMO-ARCHITECTURE-AND-SCOPE.md
│       ├── 02-DATA-CONTRACTS-AND-SCHEMAS.md
│       └── 03-STEP-BY-STEP-FILE-SEQUENCE.md
└── README.md                    # Project overview & hackathon pitch
```

---

## Phase 1: Local-First Core & Chrome Extension Shell

### Step 1.1: Extension Base & Manifest (`extension/manifest.json`)
* **Purpose**: Register Chrome Manifest V3 with permissions for `storage`, `activeTab`, and content scripts on ChatGPT & Gemini.
* **Dependencies**: None.
* **Verification**:
  1. Open `chrome://extensions/`.
  2. Enable "Developer mode".
  3. Click "Load unpacked" and select the `extension/` folder.
  4. Ensure 0 manifest parsing errors.
* **Git Commit**: `feat(extension): scaffold Manifest V3 configuration and permissions`

---

### Step 1.2: Seed Fixtures & Local Store (`extension/seed_data.js`)
* **Purpose**: Provide self-contained mock objects (`DEFAULT_EVENTS`, `DEFAULT_JOURNAL`, `DEFAULT_SKILLS`, `DEFAULT_MATCHES`) adhering strictly to the Data Contract.
* **Dependencies**: Step 1.1.
* **Verification**: In Chrome DevTools Console, inspect `DEFAULT_EVENTS.courses[0].course_id === "CISP-310"`.
* **Git Commit**: `feat(extension): provide offline seeded fixtures for CISP 310 and 400`

---

### Step 1.3: Background Service Worker (`extension/background.js`)
* **Purpose**: Listen to `chrome.runtime.onInstalled`. If `chrome.storage.local` is empty, seed it with `seed_data.js`. Handle toolbar icon click to open `dashboard.html`.
* **Dependencies**: Step 1.1, Step 1.2.
* **Verification**:
  1. Reload extension in `chrome://extensions/`.
  2. Click service worker link to open DevTools.
  3. Run: `chrome.storage.local.get(null, console.log)` → see all initialized keys.
* **Git Commit**: `feat(extension): initialize local storage on install in service worker`

---

### Step 1.4: Floating Study Buddy Pill & Modal (`extension/content.js` + `extension/content.css`)
* **Purpose**: Injects into `chatgpt.com` and `gemini.google.com`.
  - Floating circular mascot button (top-right, draggable or fixed).
  - Click reveals 3 quick actions:
    1. **"Auto Recap"**: Detects active chat text or injects standard recap prompt.
    2. **"Paste & Send"**: Opens zero-fail textarea fallback modal.
    3. **"Open Commons"**: Opens dashboard tab.
  - Automatically saves payload to `chrome.storage.local` with visual green checkmark badge.
* **Dependencies**: Step 1.3.
* **Verification**:
  1. Open `https://gemini.google.com` or `https://chatgpt.com`.
  2. Floating widget renders cleanly in top-right.
  3. Click "Paste & Send", enter sample text, click Save. Check `chrome.storage.local.get("asc_journal_log")`.
* **Git Commit**: `feat(extension): add floating widget with auto-recap and manual-paste fallback`

---

## Phase 2: Visual Demo Dashboard

### Step 2.1: Full-Page Dashboard Structure (`extension/dashboard.html` + `extension/dashboard.css`)
* **Purpose**: High-contrast, modern dark-mode dashboard (slate-900 palette with emerald and cyan accents).
  - Top Bar: System Status badge ("Local-First Offline-Ready"), active student identity.
  - Left Column: Today's Master Journal & Raw Sessions timeline.
  - Right Column: Demonstrated Skills Ledger, Recurring Passions list, and Actionable Peer Match Card.
  - Privacy Footer: "Export Plain-Text Files" and "Purge All Data" buttons.
* **Dependencies**: None (pure HTML/CSS previewable in browser).
* **Verification**: Double-click `dashboard.html` in browser; inspect layout responsiveness.
* **Git Commit**: `feat(dashboard): build responsive dark-mode dashboard UI structure`

---

### Step 2.2: Reactive Dashboard Controller (`extension/dashboard.js`)
* **Purpose**:
  - Pulls live state from `chrome.storage.local`.
  - Re-renders cards instantly when data changes.
  - Implements **"Export Plain-Text Files"** (triggers instantaneous browser download of `study_journal.txt` and `skills_ledger.json`).
  - Implements **"Purge Data"** (clears `chrome.storage.local` and re-seeds with blank demo template).
  - "Synthesize with AI" button that calls the local FastAPI endpoint (with automatic fallback).
* **Dependencies**: Step 1.2, Step 2.1.
* **Verification**:
  1. Open dashboard via extension icon.
  2. Click "Export Plain-Text Files" → verify `.txt` download in browser.
  3. Click "Purge Data" → verify state clears immediately.
* **Git Commit**: `feat(dashboard): bind storage state, export mechanisms, and privacy controls`

---

## Phase 3: Minimal FastAPI Backend & Gemini Pipeline

### Step 3.1: Python Environment & Data Models (`backend/requirements.txt`, `backend/models.py`)
* **Purpose**: Define Pydantic request/response models for `/api/session` and `/api/match`.
* **Dependencies**: Python 3.10+.
* **Verification**: Run `python -c "import models; print(models.SessionRequest)"`.
* **Git Commit**: `feat(backend): configure dependencies and pydantic schema contracts`

---

### Step 3.2: Deterministic Heuristic Fallback Engine (`backend/heuristic_fallback.py`)
* **Purpose**: Offline-first safety net. If Gemini API key is unset or network drops, this module uses regex and keyword heuristics to extract skills (e.g. `gdb`, `x86`, `stack frame`) and return a valid response adhering 100% to the schema.
* **Dependencies**: Step 3.1.
* **Verification**: Run `python -c "from heuristic_fallback import mock_session_parse; print(mock_session_parse('sample text'))"`.
* **Git Commit**: `feat(backend): implement deterministic zero-network heuristic fallback engine`

---

### Step 3.3: Gemini AI Service (`backend/ai_service.py`)
* **Purpose**: Construct structured system prompt for Gemini 2.0 Flash with JSON response schema.
  - Extracts technical strengths, growth areas, and long-term passion projects.
  - Generates cohesive master journal entry.
* **Dependencies**: Step 3.1, Step 3.2.
* **Verification**: Run with test prompt; verify output JSON structure.
* **Git Commit**: `feat(backend): integrate Gemini 2.0 structured extraction service`

---

### Step 3.4: FastAPI App & Endpoints (`backend/main.py`)
* **Purpose**:
  - Expose `POST /api/session` and `POST /api/match`.
  - Enable CORS for Chrome Extension origin (`chrome-extension://*`).
  - Gracefully wrap AI service with heuristic fallback on exception.
* **Dependencies**: Steps 3.1-3.3.
* **Verification**:
  1. Start server: `uvicorn main:app --reload --port 8000`.
  2. Test endpoint with curl:
     ```bash
     curl -X POST http://localhost:8000/api/match -H "Content-Type: application/json" -d "{\"student_skills\":[\"x86-64\"],\"course_id\":\"CISP-310\",\"active_assignment\":\"lab_04\"}"
     ```
  3. Verify 200 OK with `affinity_percentage: 94`.
* **Git Commit**: `feat(backend): expose FastAPI endpoints with CORS and graceful error handling`

---

## Phase 4: End-to-End Integration & Demo Rehearsal

### Step 4.1: Extension-Backend Hookup
* **Purpose**: Connect dashboard's "Synthesize Today's Session" button to `http://localhost:8000/api/session`.
* **Verification**: Submit recap in ChatGPT tab → Open dashboard → Click Synthesize → Watch skills ledger update in real time.
* **Git Commit**: `feat(integration): wire dashboard actions to backend pipeline`

---

### Step 4.2: Demo Video Run-Through & Documentation
* **Purpose**: Update `README.md` with:
  - Architecture RFC diagram.
  - 1-minute quickstart setup instructions.
  - 2.5-minute demo video link / timestamps.
* **Verification**: Perform dry-run recording following the 2.5-minute script from `01-DEMO-ARCHITECTURE-AND-SCOPE.md`.
* **Git Commit**: `docs: update README with hackathon demo walkthrough and production RFC`

