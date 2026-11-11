/**
 * Dashboard View - Study Commons Greeting Room Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.GreetingView = {
  messages: [],

  init() {
    this.bindEvents();
  },

  render(messages, currentUser) {
    this.messages = messages || [];
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    if (this.messages.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a; margin-top:20px;">Greeting room is quiet. Enter a room from the Peer Matching tab to begin!</div>`;
      return;
    }

    const userName = currentUser ? currentUser.displayName : 'You';
    const peerName = (currentUser && currentUser.displayName === 'Alex Rivera') ? 'Jordan Lee' : 'Alex Rivera';

    this.messages.forEach(msg => {
      const bubble = document.createElement('div');
      let typeClass = 'peer';
      let senderName = peerName;

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
    document.getElementById('form-chat-send').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-user-input');
      const text = input.value.trim();
      if (!text) return;

      const userMsg = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.messages.push(userMsg);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, this.messages);
      this.render(this.messages);
      input.value = '';

      // Simulated Peer / AI Host Response
      setTimeout(async () => {
        const peerReplies = [
          "That GDB layout regs shortcut saved me! I can now step right before the call instruction to verify the 16-byte offset.",
          "Awesome point. Are you free to review the recursive subroutine diagram together tomorrow around 2 PM?",
          "I just ran the same test case in my local assembly file. Everything aligns now on %rsp!"
        ];
        const randomReply = peerReplies[Math.floor(Math.random() * peerReplies.length)];

        const peerMsg = {
          id: `msg_${Date.now()}`,
          sender: 'peer',
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.messages.push(peerMsg);
        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES, this.messages);
        this.render(this.messages);
      }, 1000);
    });
  }
};

