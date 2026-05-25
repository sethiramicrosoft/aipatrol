var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/service-worker.ts
var require_service_worker = __commonJS({
  "src/service-worker.ts"() {
    chrome.runtime.onInstalled.addListener(() => {
      console.log("GuardPrompt installed. Protecting your prompts.");
      chrome.storage.local.set({
        enabled: true,
        eventLog: [],
        installDate: Date.now()
      });
    });
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "LOG_EVENT") {
        appendToEventLog(message.payload);
        sendResponse({ ok: true });
      }
      return false;
    });
    async function appendToEventLog(event) {
      const result = await chrome.storage.local.get("eventLog");
      const eventLog = Array.isArray(result["eventLog"]) ? result["eventLog"] : [];
      const updated = [event, ...eventLog].slice(0, 500);
      await chrome.storage.local.set({ eventLog: updated });
    }
  }
});
export default require_service_worker();
//# sourceMappingURL=service-worker.js.map
