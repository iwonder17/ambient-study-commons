# 🦉 Ambient Study Commons

An ambient study companion and peer collaboration platform that passively captures your AI learning sessions (Gemini & ChatGPT), builds personalized skill and growth profiles, syncs Canvas LMS coursework, and connects classmates through complementary skill matching and AI-facilitated greeting rooms.

**Demo status:** This prototype demonstrates the intended workflow using sample student data, simulated integrations, and sample AI outputs. Live model calls, external API integrations, and scheduled processing are proposed backend capabilities.

**AI and API backbone:** In the proposed backend, Canvas APIs supply academic context, and model APIs analyze study notes and journals to build evolving profiles of demonstrated skills, interests, and project goals. Those profiles drive complementary peer matching and AI-facilitated introductions. Planned activity-search APIs would also find relevant opportunities; a provider has not yet been specified.

---

## 📁 Project Structure

```text
ambient-study-commons/
├── workflow.txt          # 📋 Executive system workflow & judge summary (~60s read)
├── demo/                 # Ready-to-run Chrome extension demo and local mock environment
│   └── extension/        # Chrome Extension (Manifest V3) source code
│       ├── assets/       # Mascot illustrations and SVG UI icons
│       ├── dashboard/    # Tabbed web dashboard (Journals, Canvas, Matching, Greeting Room)
│       ├── fake_canvas_login/  # Local mock Canvas authentication flow
│       ├── fake_google_login/  # Local mock Google OAuth authentication flow
│       ├── mockserver/   # Mock student datasets and Canvas course files
│       ├── prompt/       # Core AI prompts (data collection, review, skills, matching)
│       └── ui/           # Floating mascot widget injected into ChatGPT & Gemini
├── workingPlan/          # System design documents, requirements, and architecture specs
└── vtest/                # Test suite, backend sandbox, and verification scripts
    ├── backend/          # Python/FastAPI test backend
    ├── dashboard/        # Test dashboard fixtures
    ├── extension/        # Test extension build
    └── tests/            # Automated test cases for matching, sessions, and auth
```

### Folder & File Breakdown
* **`workflow.txt`**: A clean, scannable document written specifically for judges and reviewers. Summarizes the entire 6-step user journey, architecture flow, matching algorithms, and privacy guardrails in ~60 seconds.
* **`demo/`**: Contains the full, unpackable demo version of the platform.
  * **`demo/extension/`**: The complete Chromium extension (Manifest V3), including background service workers, content script injectors, and the local storage layer.
  * **`demo/extension/dashboard/`**: The interactive student dashboard containing views for Daily Journals, Canvas Context, Free Time scheduling, Peer Matching, and Greeting Rooms.
  * **`demo/extension/prompt/`**: System prompt templates used for session data capture (`data_collecting.txt`), weekly reflection bundles (`journal_review.txt`), daily skill & dream extraction (`skill_analysis.txt`), and peer synergy evaluation (`peer_matching.txt`).
  * **`demo/extension/mockserver/`**: Simulated student personas, courses, syllabi, and assignment records for offline testing.
  * **`demo/extension/fake_google_login/` & `fake_canvas_login/`**: Mock sign-in flows for local demonstrations without requiring live OAuth keys or school credentials.
  * **`demo/extension/ui/`**: Injected content scripts and UI styles for the floating mascot widget on ChatGPT and Gemini.
* **`workingPlan/`**: Detailed project specifications, data model schemas (`UserSkill`, `UserDream`, `MatchRecord`), UI component breakdowns, and development roadmaps.
* **`vtest/`**: Testing and backend sandbox environment, containing a Python/FastAPI server (`backend/`), test suites (`tests/`), and mock extension builds.

---

## 📋 Executive Workflow (For Judges & Reviewers)

> [!TIP]
> **Looking for the big picture?** Read **[`workflow.txt`](workflow.txt)** in the root folder for a scannable overview of the intended 6-step user journey, high-level architecture diagram, proposed matching criteria, and privacy design.

---

## 🌟 Key Features

* **Daily AI Study Journals**: Automatically captures learning takeaways from ChatGPT & Gemini, consolidating daytime micro-sessions into structured daily master journals.
* **Canvas LMS Integration**: Tracks active courses, syllabi, and upcoming assignment due dates with granular student permission toggles.
* **Double-Opt-In Peer Matching**: Pairs classmates who share complementary skills, identical courses, and overlapping weekly free time.
* **AI-Facilitated Greeting Rooms**: Private study rooms hosted by **AI Host Owl** with scheduled countdown timers, developer time-acceleration, and embedded chat.
* **Ambient Themes & Local Privacy**: Ships with customizable visual ergonomics (Nordic Slate, Cosmic Amethyst). All data lives 100% locally in `chrome.storage.local` with one-click data export and full wipe controls.

---

## 📦 How to Install the Demo

1. Clone or download this repository.
2. Open Google Chrome (or any Chromium-based browser like Brave or Edge) and go to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** (top-left).
5. Select the **`demo/extension`** folder from this project directory.
---

## 🚀 How to Use the Demo

1. **Sign In / Choose Persona**:
   - In the bottom-left of the dashboard, click **Sign In**.
   - Select a student persona (e.g. **Jordan Lee** or **Alex Rivera**). Notice how each persona automatically loads their personalized theme and saved data.

2. **Explore Dashboard Tabs**:
   - **Journals**: View daily study summaries and technical reflections.
   - **Canvas Context**: Inspect synced courses (e.g. CISP-310, ENGR-312), assignments, and upcoming deadlines.
   - **Free Time**: Set your weekly open hours and study availability.
   - **Peer Matching**: Browse recommended study partners filtered by skill synergy and free-time overlap.

3. **Schedule a Peer Meeting**:
   - On a peer card in the **Peer Matching** tab, click **Confirm Alignment** (Double-Opt-In).
   - Once confirmed, the button turns into a live countdown timer (`Starts in 2d 15h 15m`).

4. **Enter Greeting Room**:
   - Open the **Greeting Room** tab to view your confirmed sessions.
   - Click the meeting card to expand its details.
   - **Developer Shortcut**: Click **⚡ Boost Time** to fast-forward the countdown immediately to 0.
   - Click the glowing **Ready to start** button to connect the live embedded chat console.
   - Chat with your peer and **AI Host Owl**!

5. **Test on Live AI Sites**:
   - Visit [ChatGPT](https://chatgpt.com) or [Google Gemini](https://gemini.google.com).
   - Look for the floating mascot button in the top-right corner to capture session recaps.


