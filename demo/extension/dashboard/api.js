/**
 * Ambient Study Commons (Demo) - Frontend Client API
 * 
 * Clean REST/RPC Client Layer:
 * Decouples all frontend views from the underlying storage.
 * All reads, writes, and mutations are dispatched through this client API,
 * communicating with MockServer via Chrome messaging (or direct mock dispatch).
 */

(function () {
  const AscAPI = {
    /**
     * Dispatch an action to the MockServer backend
     */
    async dispatch(action, payload = {}) {
      const message = { action, ...payload };

      // 1. Try Chrome extension runtime messaging (Standard Extension Context)
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          const res = await new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
              if (chrome.runtime.lastError) {
                resolve(null);
              } else {
                resolve(response);
              }
            });
          });
          if (res) return res;
        } catch (e) {
          // Fall through to direct server dispatch
        }
      }

      // 2. Direct Fallback to MockServer (Standalone / File Preview Mode)
      if (typeof MockServer !== 'undefined' && typeof MockServer.handleRequest === 'function') {
        const res = await MockServer.handleRequest(message);
        if (res) return res;
      }

      console.warn(`[AscAPI] No backend handler responded to action: ${action}`);
      return { success: false, error: 'No backend responded' };
    },

    /**
     * Fetch complete dashboard state (journals, canvas, dreams, freetime, matches, etc.)
     */
    async getDashboardData() {
      const res = await this.dispatch('GET_DASHBOARD_DATA');
      if (res && res.success && res.data) {
        return res.data;
      }
      return null;
    },

    /**
     * Save / create a learning journal
     */
    async saveJournal(journal) {
      return await this.dispatch('SAVE_JOURNAL', { journal });
    },

    /**
     * Delete a learning journal by ID
     */
    async deleteJournal(journalId) {
      return await this.dispatch('DELETE_JOURNAL', { journalId });
    },

    /**
     * Save user preferences & privacy toggles
     */
    async savePreferences(preferences) {
      return await this.dispatch('SAVE_PREFERENCES', { preferences });
    },

    /**
     * Sync Canvas course catalog & assignments from MockServer JSON files
     */
    async syncCanvasCourses(userId) {
      return await this.dispatch('SYNC_CANVAS_COURSES', { userId });
    },

    /**
     * Fetch complete Canvas courses, history & profile from mockserver/canvas data/
     */
    async fetchCanvasData(userId) {
      return await this.dispatch('FETCH_CANVAS_DATA', { userId });
    },

    /**
     * Save weekly recurring free time
     */
    async saveFreeTime(freetime, userId) {
      return await this.dispatch('SAVE_STUDENT_FREETIME', { freetime, userId });
    },

    /**
     * Get free time for student
     */
    async getFreeTime(userId) {
      const res = await this.dispatch('GET_STUDENT_FREETIME', { userId });
      return res?.freetime || null;
    },

    /**
     * Send chat message in Icebreaker Greeting Room
     */
    async sendGreetingMessage(message) {
      return await this.dispatch('SEND_GREETING_MESSAGE', { message });
    },

    /**
     * Add project / dream to wishlist
     */
    async saveDream(dream) {
      return await this.dispatch('SAVE_DREAM', { dream });
    },

    /**
     * Delete project / dream from wishlist
     */
    async deleteDream(dreamId) {
      return await this.dispatch('DELETE_DREAM', { dreamId });
    },

    /**
     * Switch / log in student user profile
     */
    async loginUser(userId) {
      return await this.dispatch('LOGIN_USER', { userId });
    },

    /**
     * Ask MockServer for user's picked theme in user data
     */
    async getUserTheme(userId) {
      const res = await this.dispatch('GET_USER_THEME', { userId });
      return res?.theme || null;
    },

    /**
     * Save user picked theme in user data to MockServer
     */
    async saveUserTheme(userId, theme) {
      return await this.dispatch('SAVE_USER_THEME', { userId, theme });
    },

    /**
     * Full data reset
     */
    async clearAllData() {
      return await this.dispatch('CLEAR_ALL_DATA');
    },

    /**
     * Listen for real-time backend broadcast events (session saved, peer match, etc.)
     */
    onBackendEvent(callback) {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
          if (message && message.type === 'BACKEND_EVENT') {
            callback(message.event, message.data);
          }
        });
      }
    }
  };

  // Expose to window
  if (typeof window !== 'undefined') {
    window.AscAPI = AscAPI;
  }
})();

