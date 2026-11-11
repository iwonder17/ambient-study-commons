/**
 * Dashboard View - Peer Study Commons Matching Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.MatchesView = {
  matches: [],
  onSwitchToGreeting: null,

  init(onSwitchToGreeting) {
    this.onSwitchToGreeting = onSwitchToGreeting;
  },

  render(matches) {
    this.matches = matches || [];
    const container = document.getElementById('match-cards-list');
    container.innerHTML = '';

    if (this.matches.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a;">No study commons matches active. Sign in with Google to discover matching peers.</div>`;
      return;
    }

    this.matches.forEach(match => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      card.innerHTML = `
        <div class="asc-card-header">
          <div class="asc-card-meta">
            <span class="asc-tag">${match.course}</span>
            <span>•</span>
            <span style="color:#ffffff; font-weight:700;">${match.matchScore}% Study Compatibility</span>
          </div>
          <span class="asc-badge" style="background:#27272a;">${match.status.toUpperCase()}</span>
        </div>
        <div style="font-size:15px; font-weight:600;">Study Partner: ${match.peerName}</div>
        <div style="font-size:12px; color:#a1a1aa;"><strong>Shared Topics:</strong> ${match.sharedTopics.join(', ')}</div>
        <div style="font-size:12px; color:#a1a1aa;"><strong>Matching Availability:</strong> ${match.mutualFreeTime}</div>
        <div class="asc-btn-group" style="margin-top:6px;">
          <button class="asc-btn-primary btn-enter-room" data-room="${match.roomKey}">
            <span class="material-symbols-outlined">forum</span>
            Enter Greeting Room
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.btn-enter-room').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof this.onSwitchToGreeting === 'function') {
          this.onSwitchToGreeting();
        }
      });
    });
  }
};

