

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
   - In the top-right of the dashboard, click **Sign In**.
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
   - Look for the floating mascot button in the bottom-right corner to capture session recaps.

---

## 🧪 Run Automated Verification Tests

You can run the complete 12-suite automated test suite directly from your terminal (requires Python 3):

```bash
python demo/test_demo.py
```

All 12 test suites verify Manifest V3 schema validity, DOM ID mappings, zero-DOM dumb server compliance, and theme/chat features.
