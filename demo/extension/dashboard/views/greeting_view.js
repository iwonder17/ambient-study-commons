/**
 * Dashboard View - Study Commons Greeting Room Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.GreetingView = {
  messages: [],
  currentUser: null,

  init() {
    this.bindEvents();
  },

  render(messages, currentUser) {
    if (currentUser !== undefined) {
      this.currentUser = currentUser || null;
    }
    this.messages = messages || [];
    const viewSection = document.getElementById('view-greeting');
    const noticeWrap = document.getElementById('greeting-login-notice-wrap');
    const chatContainer = viewSection ? viewSection.querySelector('.asc-chat-container') : null;
    const container = document.getElementById('chat-messages');

    if (!this.currentUser || !this.currentUser.id) {
      if (chatContainer) chatContainer.style.display = 'none';
      if (noticeWrap) {
        noticeWrap.style.display = 'block';
        if (typeof window.AscDash.renderLoggedOutNotice === 'function') {
          noticeWrap.innerHTML = window.AscDash.renderLoggedOutNotice(
            'Study Commons Greeting Room',
            'Sign in with your student Google account to enter private, AI-facilitated study rooms with verified student peers.',
            'waving_hand'
          );
        }
      }
      return;
    }

    if (noticeWrap) noticeWrap.style.display = 'none';
    if (chatContainer) chatContainer.style.display = 'flex';

    if (!container) return;
    container.innerHTML = '';

    const isAlex = this.currentUser && this.currentUser.id === 'user_alex_202';
    const userName = this.currentUser ? this.currentUser.displayName : 'You';
    const peerName = isAlex ? 'Elena Rostova' : 'Samira Patel';

    // Update Greeting Room Header & Participants
    const roomTitleEl = document.getElementById('greeting-room-title');
    const roomSubEl = document.getElementById('greeting-room-sub');
    const userPillEl = document.getElementById('greeting-user-pill');
    const peerPillEl = document.getElementById('greeting-peer-pill');

    if (roomTitleEl) {
      roomTitleEl.textContent = isAlex
        ? 'Eco-Simulation & 3D Shaders Room'
        : 'Robotics & Embedded Systems Pairing';
    }
    if (roomSubEl) {
      roomSubEl.textContent = isAlex
        ? 'Presided by AI Host Owl • Cross-Disciplinary Eco-Media Collective'
        : 'Presided by AI Host Owl • Engineering & Systems Incubator';
    }
    if (userPillEl) {
      userPillEl.textContent = `${userName} (You)`;
    }
    if (peerPillEl) {
      peerPillEl.textContent = peerName;
    }

    if (this.messages.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a; margin-top:20px;">Greeting room is quiet. Enter a room from the Peer Matching tab to begin!</div>`;
      return;
    }

    this.messages.forEach(msg => {
      const bubble = document.createElement('div');
      let typeClass = 'peer';
      let senderName = msg.peerName || peerName;

      if (msg.sender === 'user') {
        typeClass = 'user';
        senderName = `You (${userName})`;
      } else if (msg.sender === 'ai_host') {
        typeClass = 'host';
        senderName = '🦉 Study Commons AI Host';
      }

      bubble.className = `asc-message-bubble ${typeClass}`;
      bubble.innerHTML = `
        <span class="asc-msg-sender">${senderName} • ${msg.timestamp || 'Now'}</span>
        <div>${msg.text}</div>
      `;
      container.appendChild(bubble);
    });

    this.scrollToBottom();
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  bindEvents() {
    const formEl = document.getElementById('form-chat-send');
    if (!formEl) return;

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-user-input');
      const text = input ? input.value.trim() : '';
      if (!text) return;

      const userMsg = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.messages.push(userMsg);
      if (window.AscAPI && typeof window.AscAPI.sendGreetingMessage === 'function') {
        await window.AscAPI.sendGreetingMessage(userMsg);
      } else {
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, this.messages);
      }
      this.render(this.messages, this.currentUser);
      if (input) input.value = '';

      // Simulated Peer / AI Host Response tailored to persona
      setTimeout(async () => {
        const isAlex = this.currentUser && this.currentUser.id === 'user_alex_202';
        const peerReplies = isAlex ? [
          "That shader translucency tweak looks fantastic under the golden hour lighting preset!",
          "I just set up the Niagara fluid emitter for the river stream in UE5! It blends smoothly with your oak canopy shaders.",
          "Awesome idea! Let's pair the 3D foliage models with the ambisonic wetland audio for the film screening."
        ] : [
          "That GDB layout regs shortcut saved me! I can now step right before the call instruction to verify the 16-byte offset.",
          "Awesome point. Are you free to review the recursive subroutine diagram together tomorrow around 2 PM?",
          "I just ran the same test case in my local assembly file. Everything aligns now on %rsp!"
        ];
        const randomReply = peerReplies[Math.floor(Math.random() * peerReplies.length)];

        const peerMsg = {
          id: `msg_${Date.now()}`,
          sender: 'peer',
          peerName: isAlex ? 'Elena Rostova' : 'Samira Patel',
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.messages.push(peerMsg);
        if (window.AscAPI && typeof window.AscAPI.sendGreetingMessage === 'function') {
          await window.AscAPI.sendGreetingMessage(peerMsg);
        } else {
          await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, this.messages);
        }
        this.render(this.messages, this.currentUser);
      }, 1000);
    });
  }
};

