/**
 * vtest Content Script.
 * Injected into gemini.google.com, chatgpt.com, and *.instructure.com (Canvas).
 * Implements UI components and behaviors from programDescribeDetail.txt lines 126-292, 789-825, 843-870.
 */

(function () {
  if (document.getElementById("asc-floating-root")) return;

  const hostname = window.location.hostname;
  const isCanvas = hostname.includes("instructure.com");
  const isChatGPT = hostname.includes("chatgpt.com");
  const isGemini = hostname.includes("gemini.google.com");
  const platform = isGemini ? "gemini" : (isChatGPT ? "chatgpt" : "canvas");

  const DATA_COLLECTING_PROMPT = 
    "i want to make a journal about what we have done todya, can you give me summary and journal " +
    "ready for this session. Also adding details about highlight\\outstanding moment in thsi session; " +
    "and what i need to imporve";

  // Create Root
  const root = document.createElement("div");
  root.id = "asc-floating-root";

  const mascotUrl = chrome.runtime.getURL("assets/mascot/mascot-pet.png");
  const excitedMascotUrl = chrome.runtime.getURL("assets/mascot/mascot-pet-excited.png");

  // Icon URLs
  const iconAutoJournal = chrome.runtime.getURL("assets/icons/auto-journal-icon.svg");
  const iconCopy = chrome.runtime.getURL("assets/icons/clipboard-copy-icon.svg");
  const iconPaste = chrome.runtime.getURL("assets/icons/clipboard-paste-icon.svg");
  const iconDash = chrome.runtime.getURL("assets/icons/dashboard-icon.svg");
  const iconWeekly = chrome.runtime.getURL("assets/icons/weekly-review-icon.svg");
  const iconSend = chrome.runtime.getURL("assets/icons/send-icon.svg");

  root.innerHTML = `
    <!-- Mascot Button -->
    <div class="asc-mascot-btn" id="asc-mascot-btn" title="Study Buddy">
      <img src="${mascotUrl}" class="asc-mascot-img" alt="mascot">
      ${isCanvas ? `<span class="asc-badge-overlay">Canvas</span>` : ''}
      <div class="asc-notification-dot" id="asc-notif-dot" style="display: none;"></div>
    </div>

    <!-- AI Chat Dropdown (ChatGPT / Gemini) -->
    <div class="asc-dropdown-panel" id="asc-dropdown-panel">
      ${!isCanvas ? `
        <button class="asc-btn-row primary" id="asc-btn-auto-journal">
          <img src="${iconAutoJournal}" class="asc-icon-svg" alt="auto">
          <span>Auto Journal</span>
        </button>
        <button class="asc-btn-row" id="asc-btn-manual-copy">
          <img src="${iconCopy}" class="asc-icon-svg" alt="copy">
          <span>Manual Copy</span>
        </button>
        <button class="asc-btn-row" id="asc-btn-manual-paste">
          <img src="${iconPaste}" class="asc-icon-svg" alt="paste">
          <span>Paste &amp; Send</span>
        </button>
        <button class="asc-btn-row weekly-glow" id="asc-btn-weekly-review">
          <img src="${iconWeekly}" class="asc-icon-svg" alt="weekly">
          <span>Weekly Review ✨</span>
        </button>
      ` : `
        <!-- Canvas Specific Dropdown -->
        <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">Canvas Collection</div>
        <label style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" id="chk-modules" checked> Modules
        </label>
        <label style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" id="chk-syllabus" checked> Syllabus
        </label>
        <label style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" id="chk-grades" checked> Grades
        </label>
        <label style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" id="chk-events" checked> Calendar Events
        </label>
        <button class="asc-btn-row primary" id="asc-btn-scrape-canvas" style="margin-top: 6px; justify-content: center;">
          <span>Collect Now</span>
        </button>
      `}
      <button class="asc-btn-row" id="asc-btn-open-dash">
        <img src="${iconDash}" class="asc-icon-svg" alt="dash">
        <span>Open Dashboard</span>
      </button>
    </div>

    <!-- Paste Modal -->
    <div class="asc-modal-overlay" id="asc-paste-modal">
      <div class="asc-modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 15px; font-weight: 700;">Paste your AI's response</span>
          <button id="asc-modal-close" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
        </div>
        <textarea class="asc-textarea" id="asc-paste-text" placeholder="Paste the journal summary from your AI here..."></textarea>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="asc-btn-row" id="asc-btn-cancel-modal">Cancel</button>
          <button class="asc-btn-row primary" id="asc-btn-send-session">
            <img src="${iconSend}" class="asc-icon-svg" alt="send">
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Match Popup (Lines 789-809) -->
    <div class="asc-match-popup" id="asc-match-popup">
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        <img src="${excitedMascotUrl}" style="width: 40px; height: 40px;" alt="excited">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: #10b981; margin-bottom: 2px;">Peer Match Found!</div>
          <p style="font-size: 11px; color: #cbd5e1; line-height: 1.4; margin-bottom: 10px;" id="asc-match-popup-text">
            I found someone who shares your dream on Systems Programming! Want me to arrange a small greeting?
          </p>
          <div style="display: flex; gap: 8px;">
            <button class="asc-btn-row primary" id="asc-btn-match-yes" style="padding: 4px 10px; font-size: 11px;">Yes, let's meet!</button>
            <button class="asc-btn-row" id="asc-btn-match-later" style="padding: 4px 10px; font-size: 11px;">Maybe later</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div class="asc-toast" id="asc-toast">
      <span id="asc-toast-msg">Notification</span>
    </div>
  `;

  document.body.appendChild(root);

  // Element handles
  const mascotBtn = document.getElementById("asc-mascot-btn");
  const dropdown = document.getElementById("asc-dropdown-panel");
  const pasteModal = document.getElementById("asc-paste-modal");
  const toast = document.getElementById("asc-toast");
  const toastMsg = document.getElementById("asc-toast-msg");
  const matchPopup = document.getElementById("asc-match-popup");

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add("asc-toast-show");
    setTimeout(() => toast.classList.remove("asc-toast-show"), 3500);
  }

  // Toggle Dropdown
  mascotBtn.addEventListener("click", () => {
    dropdown.classList.toggle("asc-visible");
  });

  // Open Dashboard
  document.getElementById("asc-btn-open-dash").addEventListener("click", () => {
    dropdown.classList.remove("asc-visible");
    chrome.runtime.sendMessage({ action: "OPEN_DASHBOARD" });
  });

  // Manual Copy Prompt
  const btnCopy = document.getElementById("asc-btn-manual-copy");
  if (btnCopy) {
    btnCopy.addEventListener("click", () => {
      dropdown.classList.remove("asc-visible");
      navigator.clipboard.writeText(DATA_COLLECTING_PROMPT);
      showToast("📋 Prompt copied! Paste it into your AI chat.");
    });
  }

  // Paste & Send Modal
  const btnPaste = document.getElementById("asc-btn-manual-paste");
  if (btnPaste) {
    btnPaste.addEventListener("click", () => {
      dropdown.classList.remove("asc-visible");
      pasteModal.classList.add("asc-visible");
    });
  }

  document.getElementById("asc-modal-close").addEventListener("click", () => pasteModal.classList.remove("asc-visible"));
  document.getElementById("asc-btn-cancel-modal").addEventListener("click", () => pasteModal.classList.remove("asc-visible"));

  // Send Session to Backend
  document.getElementById("asc-btn-send-session").addEventListener("click", async () => {
    const text = document.getElementById("asc-paste-text").value.trim();
    if (!text) {
      showToast("⚠️ Please enter response text first");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          source: platform,
          collectionMethod: "manual",
          timestamp: new Date().toISOString()
        })
      });
      if (res.ok) {
        pasteModal.classList.remove("asc-visible");
        document.getElementById("asc-paste-text").value = "";
        showToast("✅ Session saved to Study Buddy database!");
      }
    } catch (e) {
      showToast("❌ Could not connect to backend server");
    }
  });

  // Auto Journal
  const btnAuto = document.getElementById("asc-btn-auto-journal");
  if (btnAuto) {
    btnAuto.addEventListener("click", () => {
      dropdown.classList.remove("asc-visible");
      showToast("✨ Auto-injecting journal prompt...");
      let inputEl = null;
      if (isChatGPT) {
        inputEl = document.querySelector("#prompt-textarea") || document.querySelector("div[contenteditable='true']");
      } else if (isGemini) {
        inputEl = document.querySelector("rich-textarea p") || document.querySelector("textarea") || document.querySelector("div[contenteditable='true']");
      }

      if (inputEl) {
        if (inputEl.tagName === "TEXTAREA" || inputEl.tagName === "INPUT") {
          inputEl.value = DATA_COLLECTING_PROMPT;
        } else {
          inputEl.innerText = DATA_COLLECTING_PROMPT;
        }
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        showToast("✨ Prompt injected! Send it and click Paste & Send when done.");
      } else {
        navigator.clipboard.writeText(DATA_COLLECTING_PROMPT);
        showToast("📋 Prompt copied to clipboard!");
      }
    });
  }

  // Weekly Review Button Workflow (Lines 833-870)
  const btnWeekly = document.getElementById("asc-btn-weekly-review");
  if (btnWeekly) {
    btnWeekly.addEventListener("click", () => {
      dropdown.classList.remove("asc-visible");
      chrome.runtime.sendMessage({ action: "FETCH_WEEKLY_REVIEW" }, (res) => {
        if (res && res.success) {
          navigator.clipboard.writeText(res.data.bundle);
          showToast("📋 Weekly review package copied! Open your favorite AI and paste it to start reflecting.");
        } else {
          showToast("⚠️ Could not bundle weekly journals");
        }
      });
    });
  }

  // Canvas Scrape Button
  const btnScrape = document.getElementById("asc-btn-scrape-canvas");
  if (btnScrape) {
    btnScrape.addEventListener("click", async () => {
      dropdown.classList.remove("asc-visible");
      showToast("📚 Scraping Canvas course data...");
      const pageTitle = document.title;
      await fetch("http://localhost:8000/api/canvas/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pageTitle, url: window.location.href, scrapedAt: new Date().toISOString() })
      });
      showToast("✅ Canvas module records saved to backend!");
    });
  }

  // Check Matches Notification
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: "CHECK_MATCHES" }, (res) => {
      if (res && res.success && res.invitations && res.invitations.length > 0) {
        const top = res.invitations[0];
        document.getElementById("asc-match-popup-text").textContent = 
          `I found someone who shares your interest in ${top.matchedDreamTopics[0] || 'projects'}! Want me to arrange a small greeting?`;
        matchPopup.classList.add("asc-visible");

        document.getElementById("asc-btn-match-yes").addEventListener("click", () => {
          matchPopup.classList.remove("asc-visible");
          chrome.runtime.sendMessage({ action: "OPEN_DASHBOARD" });
        });
        document.getElementById("asc-btn-match-later").addEventListener("click", () => {
          matchPopup.classList.remove("asc-visible");
        });
      }
    });
  }, 2500);

  console.log("[vtest] Study Buddy content script mounted on " + platform);
})();

