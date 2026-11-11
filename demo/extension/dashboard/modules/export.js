/**
 * Dashboard Data Export & Reset Module
 * Zero-backend client-side JSON Blob generator and fixtures reset.
 */

window.AscDash = window.AscDash || {};

window.AscDash.Export = {
  async downloadJson() {
    const dump = {
      exportVersion: '1.0.0-demo',
      exportedAt: new Date().toISOString(),
      user: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.USER),
      preferences: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.PREFERENCES),
      journals: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.JOURNALS),
      canvasReminders: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.CANVAS_REMINDERS),
      skills: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.SKILLS),
      dreams: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.DREAMS),
      invitations: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.INVITATIONS),
      messages: await LocalStore.getLocalData(LocalStore.LOCAL_STORAGE_KEYS.ROOM_MESSAGES)
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ambient-study-commons-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.AscDash.Toast.show('Exported all data to JSON!', 'download');
  },

  async resetSeed(onReload) {
    if (confirm('Reset all demo data back to default offline seed fixtures?')) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.clear();
        await chrome.storage.local.set(LocalStore.DEFAULT_OFFLINE_STATE);
      }
      if (typeof onReload === 'function') {
        await onReload();
      }
      window.AscDash.Toast.show('Demo state reset to defaults!', 'refresh');
    }
  }
};

