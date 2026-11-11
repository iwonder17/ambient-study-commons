/**
 * vtest Dashboard SPA Controller.
 * Manages full production feature tabs, live WebSockets, data syncing, and API flows.
 */

const API_BASE = "http://localhost:8000";
let currentMeetingId = "meet_room_88";
let socket = null;
let currentDreamToSubmit = null;

// Tab Switching
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

    button.classList.add("active");
    const target = button.dataset.tab;
    const pane = document.getElementById(`tab-${target}`);
    if (pane) pane.classList.add("active");

    if (target === "greeting") {
      initWebSocketChat(currentMeetingId);
    }
  });
});

function showToast(msg) {
  const t = document.getElementById("dash-toast");
  const txt = document.getElementById("dash-toast-text");
  txt.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3500);
}

// 1. Fetch Profile & Preferences
async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/me`);
    if (res.ok) {
      const data = await res.json();
      document.getElementById("sidebar-user-name").textContent = data.user.displayName;
      document.getElementById("sidebar-user-email").textContent = data.user.email;
      renderPermissions(data.preferences);
    }
  } catch (e) {
    console.warn("Could not load profile:", e);
  }
}

// 2. Load Journals
async function loadJournals() {
  const container = document.getElementById("journal-list");
  try {
    const res = await fetch(`${API_BASE}/api/journals?page=1&limit=20`);
    if (res.ok) {
      const data = await res.json();
      container.innerHTML = "";
      data.items.forEach(j => {
        const card = document.createElement("div");
        card.className = "p-5 rounded-2xl bg-slate-900 border border-slate-800 transition hover:border-slate-700 cursor-pointer";
        card.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-emerald-400">${j.date}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">from ${j.sessionCount} sessions</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed mb-3">${j.content}</p>
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800 mb-2">
            <span class="text-[10px] font-bold uppercase text-slate-400">Highlight:</span>
            <div class="text-xs text-slate-200">${j.highlights}</div>
          </div>
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300">Growth Focus:</strong> ${j.improvements}
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (e) {
    container.innerHTML = "<p class='text-xs text-slate-500'>Offline or backend unreachable.</p>";
  }
}

// Trigger Pipeline
document.getElementById("btn-trigger-pipeline").addEventListener("click", async () => {
  showToast("⚙️ Running Nightly AI Pipeline...");
  try {
    const res = await fetch(`${API_BASE}/api/pipeline/trigger`, { method: "POST" });
    if (res.ok) {
      showToast("✨ Master Journal synthesized successfully!");
      loadJournals();
      loadSkills();
      loadDreams();
    }
  } catch (e) {
    showToast("❌ Error running pipeline");
  }
});

// 3. Load Canvas Reminders
async function loadCanvas() {
  const container = document.getElementById("canvas-reminder-list");
  try {
    const res = await fetch(`${API_BASE}/api/canvas/reminders`);
    if (res.ok) {
      const items = await res.json();
      container.innerHTML = "";
      items.forEach(r => {
        const card = document.createElement("div");
        card.className = "p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between";
        const iconName = r.type === "exam" ? "exam-icon.svg" : (r.type === "event" ? "event-icon.svg" : "assignment-icon.svg");
        card.innerHTML = `
          <div class="flex items-center gap-3">
            <img src="assets/icons/${iconName}" class="w-6 h-6" alt="type">
            <div>
              <div class="text-xs font-bold text-white">${r.title}</div>
              <div class="text-[11px] text-slate-400">${r.courseName}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold text-slate-300">${r.dueDate}</div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${r.type === 'exam' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
              ${r.type === 'exam' ? 'Upcoming Exam' : 'Due Soon'}
            </span>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (e) {
    container.innerHTML = "<p class='text-xs text-slate-500'>Canvas data unavailable.</p>";
  }
}

// 4. Load Skills
async function loadSkills() {
  try {
    const res = await fetch(`${API_BASE}/api/skills`);
    if (res.ok) {
      const data = await res.json();
      const stContainer = document.getElementById("skills-strengths");
      const wkContainer = document.getElementById("skills-weaknesses");
      const roContainer = document.getElementById("skills-roles");

      stContainer.innerHTML = data.strengths.map(s => `<span class="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">${s}</span>`).join("");
      wkContainer.innerHTML = data.weaknesses.map(w => `<span class="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">${w}</span>`).join("");
      roContainer.innerHTML = data.teamRoles.map(r => `<span class="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold">${r}</span>`).join("");
      document.getElementById("skills-mindset").textContent = data.mindset + " " + data.characterAnalysis;
    }
  } catch (e) {
    console.warn("Could not load skills:", e);
  }
}

// 5. Load Dreams & Topics
async function loadDreams() {
  const container = document.getElementById("dreams-list");
  try {
    const res = await fetch(`${API_BASE}/api/dreams?page=1&limit=20`);
    if (res.ok) {
      const data = await res.json();
      container.innerHTML = "";
      data.items.forEach(d => {
        const card = document.createElement("div");
        card.className = "p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between";
        card.innerHTML = `
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-bold text-white">${d.topic}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Mentioned ${d.mentionCount} times
              </span>
            </div>
            <div class="text-[11px] text-slate-400 mb-2">Recent mentions: ${d.recentTimestamps.slice(0, 5).join(", ")}</div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${d.status === 'submitted_to_pool' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}">
              ${d.status.toUpperCase()}
            </span>
          </div>
          <div>
            ${d.status === 'tracking' ? `
              <button class="btn-primary text-xs flex items-center gap-1.5 btn-submit-dream" data-id="${d.id}" data-topic="${d.topic}">
                <img src="assets/icons/rocket-icon.svg" class="w-3.5 h-3.5" alt="rocket">
                <span>Submit to Find Teammates</span>
              </button>
            ` : `<span class="text-xs text-slate-500">In Pool</span>`}
          </div>
        `;
        container.appendChild(card);
      });

      document.querySelectorAll(".btn-submit-dream").forEach(btn => {
        btn.addEventListener("click", () => {
          currentDreamToSubmit = btn.dataset.id;
          document.getElementById("dream-title-input").value = btn.dataset.topic;
          document.getElementById("modal-submit-dream").classList.remove("hidden");
        });
      });
    }
  } catch (e) {
    container.innerHTML = "<p class='text-xs text-slate-500'>Dreams unavailable.</p>";
  }
}

// Confirm Submit Dream
document.getElementById("btn-confirm-submit-dream").addEventListener("click", async () => {
  if (!currentDreamToSubmit) return;
  const payload = {
    title: document.getElementById("dream-title-input").value,
    description: document.getElementById("dream-desc-input").value,
    tag_string: document.getElementById("dream-tags-input").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/dreams/${currentDreamToSubmit}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      document.getElementById("modal-submit-dream").classList.add("hidden");
      showToast("🚀 Dream submitted to matching pool! Checking for peers...");
      loadDreams();
      loadInvitations();
    }
  } catch (e) {
    showToast("❌ Error submitting dream");
  }
});

// 6. Load Invitations
async function loadInvitations() {
  const container = document.getElementById("invitations-list");
  try {
    const res = await fetch(`${API_BASE}/api/invitations`);
    if (res.ok) {
      const data = await res.json();
      container.innerHTML = "";
      document.getElementById("badge-invites").textContent = data.items.length;
      data.items.forEach(inv => {
        const card = document.createElement("div");
        card.className = "p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 border border-emerald-500/30";
        card.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-emerald-400">🔥 ${(inv.similarityScore * 100).toFixed(0)}% Compatibility</span>
            <span class="text-xs text-slate-400">${inv.suggestedGreetingTime}</span>
          </div>
          <h4 class="text-sm font-bold text-white mb-1">${inv.matchedDreamTopics.join(" / ")}</h4>
          <p class="text-xs text-slate-300 mb-3">${inv.skillComplementNotes}</p>
          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <span class="text-xs text-slate-400">Status: <strong class="text-white">${inv.status}</strong></span>
            <div class="flex gap-2">
              <button class="btn-primary text-xs btn-accept-invite" data-id="${inv.id}">Yes, arrange greeting!</button>
              <button class="btn-secondary text-xs btn-decline-invite" data-id="${inv.id}">Not now</button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      document.querySelectorAll(".btn-accept-invite").forEach(btn => {
        btn.addEventListener("click", async () => {
          await fetch(`${API_BASE}/api/invitations/${btn.dataset.id}/respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "accept" })
          });
          showToast("🤝 Greeting agreed! Opening Greeting Room...");
          loadInvitations();
        });
      });
    }
  } catch (e) {
    container.innerHTML = "<p class='text-xs text-slate-500'>Invitations unavailable.</p>";
  }
}

// 7. Greeting Room & WebSocket Chat
async function initWebSocketChat(meetingId) {
  const container = document.getElementById("chat-messages-container");
  
  // Load message history first
  try {
    const res = await fetch(`${API_BASE}/api/greeting-room/${meetingId}`);
    if (res.ok) {
      const data = await res.json();
      container.innerHTML = "";
      data.messages.forEach(m => renderChatMessage(m));
      document.getElementById("room-topic-badge").textContent = `Topic: ${data.topic}`;
    }
  } catch (e) {
    console.warn("Could not load meeting messages:", e);
  }

  // Connect WebSocket
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = new WebSocket(`ws://localhost:8000/ws/greeting-room/${meetingId}`);
    
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      renderChatMessage(msg);
    };

    socket.onopen = () => console.log("[WS] Connected to greeting room:", meetingId);
    socket.onclose = () => console.log("[WS] Greeting room disconnected.");
  }
}

function renderChatMessage(msg) {
  const container = document.getElementById("chat-messages-container");
  const row = document.createElement("div");
  row.className = `bubble-row ${msg.sender === 'self' ? 'self' : ''}`;

  let bubbleClass = "bubble other";
  let avatarImg = "assets/mascot/mascot-pet-excited.png";
  if (msg.sender === "ai_host") {
    bubbleClass = "bubble ai-host";
    avatarImg = "assets/mascot/mascot-pet-host.png";
  } else if (msg.sender === "self") {
    bubbleClass = "bubble self";
  }

  row.innerHTML = `
    ${msg.sender !== 'self' ? `<img src="${avatarImg}" class="w-8 h-8 rounded-full border border-slate-700 mt-1" alt="avatar">` : ''}
    <div>
      <div class="${bubbleClass}">
        ${msg.text}
      </div>
      <div class="text-[10px] text-slate-500 mt-1 ${msg.sender === 'self' ? 'text-right' : ''}">${msg.timestamp}</div>
    </div>
  `;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

document.getElementById("btn-chat-send").addEventListener("click", () => {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (text && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ sender: "self", text }));
    input.value = "";
  }
});
document.getElementById("chat-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") document.getElementById("btn-chat-send").click();
});

// 8. Settings & Permissions
function renderPermissions(prefs) {
  const container = document.getElementById("permissions-container");
  if (!container || !prefs) return;
  const toggles = [
    { key: "collectAiChats", label: "AI Chat Sessions (Gemini & ChatGPT)" },
    { key: "collectCanvasModules", label: "Canvas Course Modules" },
    { key: "collectCanvasGrades", label: "Canvas Grades" },
    { key: "collectCanvasSyllabi", label: "Canvas Syllabi" },
    { key: "collectCanvasEvents", label: "Canvas Calendar Events" }
  ];

  container.innerHTML = toggles.map(t => `
    <label class="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer">
      <span class="text-xs font-semibold text-slate-200">${t.label}</span>
      <input type="checkbox" class="pref-toggle w-4 h-4 accent-emerald-500" data-key="${t.key}" ${prefs[t.key] ? 'checked' : ''}>
    </label>
  `).join("");

  document.querySelectorAll(".pref-toggle").forEach(chk => {
    chk.addEventListener("change", async () => {
      const update = { [chk.dataset.key]: chk.checked };
      await fetch(`${API_BASE}/api/me/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update)
      });
      showToast("Settings updated");
    });
  });
}

// Free Time Grid
const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const blocks = ["MORNING", "AFTERNOON", "EVENING"];
let localSlots = [];

function initFreeTimeGrid() {
  const tbody = document.getElementById("freetime-tbody");
  tbody.innerHTML = "";
  blocks.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="py-2.5 font-bold text-slate-400 text-left">${b}</td>` + 
      days.map(d => `<td class="p-1"><div class="cell-slot available" data-day="${d}" data-block="${b}">Free</div></td>`).join("");
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".cell-slot").forEach(cell => {
    cell.addEventListener("click", () => {
      cell.classList.toggle("available");
      cell.classList.toggle("unavailable");
      cell.textContent = cell.classList.contains("available") ? "Free" : "Busy";
    });
  });
}

document.getElementById("btn-save-freetime").addEventListener("click", async () => {
  const slots = [];
  document.querySelectorAll(".cell-slot").forEach(cell => {
    slots.push({
      userId: "user_jordan_101",
      dayOfWeek: cell.dataset.day,
      timeBlock: cell.dataset.block,
      isAvailable: cell.classList.contains("available")
    });
  });
  await fetch(`${API_BASE}/api/me/freetime`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slots)
  });
  showToast("✅ Free time schedule saved");
});

// Export & Wipe
document.getElementById("btn-export-zip").addEventListener("click", () => {
  window.location.href = `${API_BASE}/api/data/export`;
  showToast("📥 Generating full data export zip...");
});

document.getElementById("btn-wipe-all").addEventListener("click", async () => {
  const conf = prompt("Type DELETE to confirm permanent erasure of all your data:");
  if (conf === "DELETE") {
    await fetch(`${API_BASE}/api/data/wipe`, { method: "DELETE" });
    alert("All study data wiped from server.");
    location.reload();
  }
});

// Initial boot
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadJournals();
  loadCanvas();
  loadSkills();
  loadDreams();
  loadInvitations();
  initFreeTimeGrid();
});
