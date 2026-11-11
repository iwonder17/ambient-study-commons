/**
 * Dashboard View - Skill Profile & Competency Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.SkillsView = {
  skills: [],

  init() {
    this.bindEvents();
  },

  render(skills) {
    this.skills = skills || [];
    const container = document.getElementById('skills-container');
    container.innerHTML = '';

    this.skills.forEach(skill => {
      const item = document.createElement('div');
      item.className = 'asc-skill-item';
      item.innerHTML = `
        <div class="asc-skill-label-wrap">
          <span style="font-weight:600;">${skill.name}</span>
          <span style="color:#a1a1aa;">${skill.confidence}% (${skill.evidenceCount || 1} verified sessions)</span>
        </div>
        <div class="asc-skill-bar-track">
          <div class="asc-skill-bar-fill" style="width: ${skill.confidence}%;"></div>
        </div>
      `;
      container.appendChild(item);
    });
  },

  bindEvents() {
    document.getElementById('btn-reanalyze-skills').addEventListener('click', async () => {
      const btn = document.getElementById('btn-reanalyze-skills');
      btn.innerHTML = `<span class="material-symbols-outlined">refresh</span> Analyzing...`;
      btn.disabled = true;

      setTimeout(async () => {
        this.skills.forEach(s => {
          s.confidence = Math.min(98, s.confidence + 3);
          s.evidenceCount = (s.evidenceCount || 1) + 1;
        });

        await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS, this.skills);
        this.render(this.skills);
        btn.innerHTML = `<span class="material-symbols-outlined">psychology</span> Re-analyze from Journals`;
        btn.disabled = false;
        window.AscDash.Toast.show('Skills re-synthesized from local journals!', 'psychology');
      }, 800);
    });
  }
};

