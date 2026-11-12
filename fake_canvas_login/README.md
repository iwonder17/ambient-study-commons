# Fake Canvas OAuth Login & Verification Animation

This directory contains a standalone mock Canvas OAuth login/logout modal with the 5-stage verification stepper animation specified in `workingPlan/work space.md`.

## Features

- **No backend dependencies**: Pure client-side simulation.
- **Session Persistence**: Persists mock session state in `localStorage` under the key `"demo_canvas_session"`.
- **UI States**:
  - **Disconnected**: Displays the "Connect Canvas Account" button and integration overview.
  - **Connected**: Displays the student name, institutional domain, synced courses list, and "Disconnect Account" button (which clears `localStorage` immediately and reverts the UI).
- **Exact 2300ms Animation Sequence**:
  - **Trigger**: Clicking "Connect Canvas Account" opens Stage 1 (OAuth Consent) showing dummy student profile, read-only API scopes (`/api/v1/courses`, `/api/v1/users/self/todo`), "Authorize & Sync", and "Cancel".
  - **On "Authorize & Sync"**: Swaps immediately to Stage 2 (Verification Stepper):
    1. **Step 1 (0–650ms)**: *"Handshaking with institutional LMS..."* — active bright text + rotating CSS border spinner; morphs to green checkmark (✓) at 650ms.
    2. **Step 2 (650–1300ms)**: *"Validating OAuth2 Bearer token..."* — active + spinner; morphs to green checkmark (✓) at 1300ms.
    3. **Step 3 (1300–1950ms)**: *"Fetching active courses..."* — active + spinner; morphs to green checkmark (✓) at 1950ms.
    4. **Hold (1950–2300ms)**: Pauses 350ms with all 3 green checkmarks visible and completion status.
    5. **Commit (2300ms)**: Saves mock user and course payload to `localStorage["demo_canvas_session"]`, closes modal, and renders Connected UI state.

---

## File Structure

```text
fake_canvas_login/
├── index.html        # Interactive demo page
├── styles.css        # Clean dark-mode styles with Canvas red & verification animations
├── canvas_auth.js    # CanvasAuthController handling modal state & timing sequence
└── README.md         # Documentation & integration guide
```

---

## Testing & Preview

You can open `index.html` directly in any web browser:
1. Double-click `fake_canvas_login/index.html` (or run a local static server like `npx serve fake_canvas_login`).
2. Click **"Connect Canvas Account"**.
3. Inspect the requested scopes and dummy student info.
4. Click **"Authorize & Sync"** and observe the 2300ms 3-step verification sequence.
5. Check your browser's Developer Tools -> Application -> Local Storage to verify `"demo_canvas_session"`.
6. Click **"Disconnect Account"** to immediately clear the session and return to the disconnected state.

---

## Future Integration into Dashboard

When ready to integrate into `demo/extension/dashboard/`:
1. Copy the modal markup from `index.html` into `demo/extension/dashboard/index.html` (under the Canvas Context section or as a global modal).
2. Copy the CSS styles into `demo/extension/dashboard/styles.css`.
3. Use `window.canvasAuth` or import `canvas_auth.js` directly into `canvas_view.js` to control the sync/connect button.

