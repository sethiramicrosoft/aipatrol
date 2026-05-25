chrome.storage.local.get(['eventLog'], (result) => {
  const events = result['eventLog'] || [];
  const today = new Date().toDateString();
  const todayEvents = events.filter(
    (e) => new Date(e.timestamp).toDateString() === today
  );
  const blocked = todayEvents.filter((e) => e.action === 'BLOCK').length;

  document.getElementById('blockedCount').textContent = String(blocked);
  document.getElementById('totalCount').textContent = String(events.length);
});
