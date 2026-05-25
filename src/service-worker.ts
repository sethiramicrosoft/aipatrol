/**
 * Service Worker — runs in the background (Manifest V3).
 * Handles event logging and storage. Detection runs in the content script.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('GuardPrompt installed. Protecting your prompts.');
  // Initialise default settings
  chrome.storage.local.set({
    enabled: true,
    eventLog: [],
    installDate: Date.now(),
  });
});

// Receive log events from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'LOG_EVENT') {
    appendToEventLog(message.payload);
    sendResponse({ ok: true });
  }
  return false;
});

async function appendToEventLog(event: object): Promise<void> {
  const result = await chrome.storage.local.get('eventLog');
  const eventLog: object[] = Array.isArray(result['eventLog']) ? result['eventLog'] : [];
  const updated = [event, ...eventLog].slice(0, 500); // keep last 500 events
  await chrome.storage.local.set({ eventLog: updated });
}
