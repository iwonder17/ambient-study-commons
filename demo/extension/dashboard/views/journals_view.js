/**
 * Dashboard View - Learning Journals Tab
 */

window.AscDash = window.AscDash || {};

window.AscDash.JournalsView = {
  journals: [],
  onDataChanged: null,

  init(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.bindEvents();
  },

  render(journals) {
    this.journals = journals || [];
    const container = document.getElementById('journals-list');
    container.innerHTML = '';

    if (this.journals.length === 0) {
      container.innerHTML = `<div class="asc-card" style="text-align:center; color:#71717a;">No journals recorded yet. Use the extension button or "+ New Journal" above.</div>`;
      return;
    }

    this.journals.forEach(j => {
      const card = document.createElement('div');
      card.className = 'asc-card';
      const skillsHtml = (j.skillsExtracted || []).map(s => `<span class="asc-skill-pill">${s}</span>`).join('');
      
      card.innerHTML = `
        <div class="asc-card-header">
          <div class="asc-card-meta">
            <span class="asc-tag">${j.course || 'Self Study'}</span>
            <span>•</span>
            <span>${j.date || 'Recent'}</span>
          </div>
        </div>
        <div class="asc-card-summary">${j.summary || ''}</div>
        ${j.keyInsight ? `<div class="asc-card-insight"><strong>Key Reflection:</strong> ${j.keyInsight}</div>` : ''}
        <div class="asc-skill-pill-list">${skillsHtml}</div>
      `;
      container.appendChild(card);
    });
  },

  bindEvents() {
    // Search Filter
    document.getElementById('search-journals').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = this.journals.filter(j => 
        (j.course && j.course.toLowerCase().includes(q)) ||
        (j.summary && j.summary.toLowerCase().includes(q)) ||
        (j.keyInsight && j.keyInsight.toLowerCase().includes(q))
      );
      this.render(filtered);
    });

    // Compile Weekly Review Prompt
    document.getElementById('btn-trigger-review-prompt').addEventListener('click', async () => {
      try {
        const res = await fetch(chrome.runtime.getURL('prompt/journal_review.txt'));
        const promptTemplate = await res.text();

        const journalDigest = this.journals.map((j, i) => 
          `[Session ${i + 1} - ${j.date} - ${j.course}]\nSummary: ${j.summary}\nInsight: ${j.keyInsight || 'N/A'}\nSkills: ${(j.skillsExtracted || []).join(', ')}`
        ).join('\n\n');

        const fullPrompt = `${promptTemplate}\n\n=== RECENT LEARNING JOURNALS ===\n\n${journalDigest}`;

        await navigator.clipboard.writeText(fullPrompt);
        window.AscDash.Toast.show(`Weekly Review prompt copied! (${this.journals.length} sessions compiled)`, 'sentiment_calm');
      } catch (e) {
        window.AscDash.Toast.show('Compiled offline: ' + e.message, 'sentiment_calm');
      }
    });

    // Add Manual Journal
    document.getElementById('btn-add-manual-journal').addEventListener('click', async () => {
      const summary = prompt('Enter a short reflection summary for this study session:');
      if (!summary) return;

      const course = prompt('Enter course or subject context:', 'CISP-310 Assembly Language') || 'CISP-310';
      const insight = prompt('Enter key insight or breakthrough:', 'Refined stack boundary inspection.') || 'Learned core debugging technique.';

      const newEntry = {
        id: `jrnl_${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        course: course,
        summary: summary,
        keyInsight: insight,
        skillsExtracted: ['Autonomous Inquiry', 'Problem Solving'],
        aiFeedback: 'Manually logged into local commons.'
      };

      this.journals.unshift(newEntry);
      await LocalStore.setLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS, this.journals);
      this.render(this.journals);
      if (typeof this.onDataChanged === 'function') this.onDataChanged();
      window.AscDash.Toast.show('New journal entry saved!', 'book_5');
    });
  }
};

