/**
 * GuardPrompt — Content Script
 *
 * Runs on GenAI sites. Intercepts paste events, keyboard submit, and button
 * clicks to scan input text before it reaches the AI model.
 *
 * Uses DOM interception (Manifest V3 compatible — no webRequest blocking needed).
 */

import { runDetectionPipeline } from '../detection/pipeline.js';
import { showWarningBanner, removeWarningBanner } from './banner.js';
import { detectCurrentSite } from './sites.js';

const site = detectCurrentSite();

// ── Bypass window: after "Send anyway", allow submissions for 5 seconds ──────
let bypassUntil = 0;
const isBypassed = () => Date.now() < bypassUntil;
const setBypassed = () => { bypassUntil = Date.now() + 5000; };

// ── Pending submit: stored so user can "send anyway" after a WARN/BLOCK ──────
let pendingSubmitFn: (() => void) | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Hook 1: Paste event — highest value, catches clipboard data leaks
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('paste', (event: ClipboardEvent) => {
  if (isBypassed()) return;

  const text = event.clipboardData?.getData('text/plain') ?? '';
  if (text.length < 7) return; // too short to be interesting (min: valid IP like 1.1.1.1)

  const result = runDetectionPipeline(text);

  if (result.action === 'BLOCK') {
    event.preventDefault();
    event.stopImmediatePropagation();

    // "Send anyway" manually inserts the text into the focused element
    const target = event.target as HTMLElement;
    const sendAnyway = () => {
      removeWarningBanner();
      setBypassed();
      if ((target as HTMLTextAreaElement).value !== undefined) {
        // Regular textarea / input
        const ta = target as HTMLTextAreaElement;
        const start = ta.selectionStart ?? ta.value.length;
        ta.value = ta.value.slice(0, start) + text + ta.value.slice(ta.selectionEnd ?? start);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (target.contentEditable === 'true') {
        // ContentEditable (Claude ProseMirror, Gemini)
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
        }
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    showWarningBanner(result, sendAnyway, () => removeWarningBanner());

  } else if (result.action === 'WARN') {
    // Text already pasted — "Send anyway" just approves the next submit
    showWarningBanner(
      result,
      () => { setBypassed(); removeWarningBanner(); },
      () => removeWarningBanner(),
    );
    logEvent(result, 'paste');

  } else if (result.action === 'LOG') {
    logEvent(result, 'paste');
  }
}, /* capture phase = */ true);


// ─────────────────────────────────────────────────────────────────────────────
// Hook 2: Keyboard Enter — submit intercept
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', async (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey) return;
  if (isBypassed()) return;

  const textarea = document.querySelector<HTMLElement>(site.textareaSelector);
  if (!textarea || document.activeElement !== textarea) return;

  const text = site.getContent(textarea);
  if (!text || text.trim().length < 20) return;

  const result = runDetectionPipeline(text);

  if (result.action === 'BLOCK' || result.action === 'WARN') {
    event.preventDefault();
    event.stopImmediatePropagation();

    pendingSubmitFn = () => {
      setBypassed();
      const newEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      textarea.dispatchEvent(newEvent);
    };

    showWarningBanner(
      result,
      () => { pendingSubmitFn?.(); pendingSubmitFn = null; },
      () => { pendingSubmitFn = null; },
    );

    if (result.action === 'WARN') logEvent(result, 'keyboard');
  } else if (result.action === 'LOG') {
    logEvent(result, 'keyboard');
  }
}, true);


// ─────────────────────────────────────────────────────────────────────────────
// Hook 3: Send button click — MutationObserver watches for dynamic renders
// ─────────────────────────────────────────────────────────────────────────────
const HOOKED_ATTR = 'data-gp-hooked';

function hookSendButton(): void {
  const button = document.querySelector<HTMLElement>(site!.sendButtonSelector);
  if (!button || button.getAttribute(HOOKED_ATTR)) return;

  button.setAttribute(HOOKED_ATTR, '1');
  button.addEventListener('click', async (event: MouseEvent) => {
    if (isBypassed()) return; // user already approved

    const textarea = document.querySelector<HTMLElement>(site!.textareaSelector);
    if (!textarea) return;

    const text = site!.getContent(textarea);
    if (!text || text.trim().length < 20) return;

    const result = runDetectionPipeline(text);

    if (result.action === 'BLOCK' || result.action === 'WARN') {
      event.preventDefault();
      event.stopImmediatePropagation();

      pendingSubmitFn = () => {
        const newClick = new MouseEvent('click', { bubbles: true, cancelable: true });
        button.removeAttribute(HOOKED_ATTR); // temporarily unhook to avoid loop
        button.dispatchEvent(newClick);
        button.setAttribute(HOOKED_ATTR, '1'); // re-hook
      };

      showWarningBanner(
        result,
        () => { pendingSubmitFn?.(); pendingSubmitFn = null; },
        () => { pendingSubmitFn = null; },
      );

      if (result.action === 'WARN') logEvent(result, 'button_click');
    } else if (result.action === 'LOG') {
      logEvent(result, 'button_click');
    }
  }, true);
}

// Re-hook whenever the DOM changes (React re-renders the button)
new MutationObserver(hookSendButton).observe(document.body, {
  childList: true,
  subtree: true,
});
hookSendButton(); // hook on initial load too


// ─────────────────────────────────────────────────────────────────────────────
// Hook 4: File upload — warn before files with sensitive extensions are sent
// ─────────────────────────────────────────────────────────────────────────────
const SENSITIVE_EXTENSIONS = ['.env', '.pem', '.key', '.p12', '.pfx', '.sql', '.json', '.yaml', '.yml', '.csv'];

document.addEventListener('change', async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.type !== 'file' || !input.files?.length) return;

  for (const file of Array.from(input.files)) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isSensitiveExt = SENSITIVE_EXTENSIONS.includes(ext);
    const isTextLike = file.type.startsWith('text/') || isSensitiveExt;

    if (!isTextLike) continue;

    // Read file content and scan it
    const text = await file.text();
    const result = runDetectionPipeline(text);

    if (result.action === 'BLOCK' || result.action === 'WARN') {
      // Can't cancel a file input change, but we can clear it and warn
      input.value = '';
      showWarningBanner(
        result,
        () => removeWarningBanner(),
        () => removeWarningBanner(),
      );
      if (result.action === 'WARN') logEvent(result, 'file_upload');
    }
  }
}, true);


// ─────────────────────────────────────────────────────────────────────────────
// Async event logger — fire-and-forget to service worker (Team tier)
// ─────────────────────────────────────────────────────────────────────────────
function logEvent(result: ReturnType<typeof runDetectionPipeline>, trigger: string): void {
  chrome.runtime.sendMessage({
    type: 'LOG_EVENT',
    payload: {
      url: window.location.hostname,
      trigger,
      action: result.action,
      riskScore: result.riskScore,
      ruleTypes: result.matches.map(m => m.ruleType),
      timestamp: Date.now(),
    },
  }).catch(() => { /* background may not be listening in free tier */ });
}
