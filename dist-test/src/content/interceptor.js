"use strict";
/**
 * GuardPrompt — Content Script
 *
 * Runs on GenAI sites. Intercepts paste events, keyboard submit, and button
 * clicks to scan input text before it reaches the AI model.
 *
 * Uses DOM interception (Manifest V3 compatible — no webRequest blocking needed).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const pipeline_js_1 = require("../detection/pipeline.js");
const banner_js_1 = require("./banner.js");
const sites_js_1 = require("./sites.js");
const site = (0, sites_js_1.detectCurrentSite)();
if (!site) {
    // Not a recognised site — content script does nothing
    throw new Error('GuardPrompt: unrecognised site, skipping');
}
// ── Pending submit: stored so user can "send anyway" after a WARN ──────────
let pendingSubmitFn = null;
// ─────────────────────────────────────────────────────────────────────────────
// Hook 1: Paste event — highest value, catches clipboard data leaks
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('paste', (event) => {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (text.length < 20)
        return; // too short to be interesting
    const result = (0, pipeline_js_1.runDetectionPipeline)(text);
    if (result.action === 'BLOCK') {
        event.preventDefault();
        event.stopImmediatePropagation();
        (0, banner_js_1.showWarningBanner)(result, () => { }, () => { });
    }
    else if (result.action === 'WARN') {
        // Let the paste happen, but show warning
        (0, banner_js_1.showWarningBanner)(result, () => (0, banner_js_1.removeWarningBanner)(), () => (0, banner_js_1.removeWarningBanner)());
        logEvent(result, 'paste');
    }
    else if (result.action === 'LOG') {
        logEvent(result, 'paste');
    }
}, /* capture phase = */ true);
// ─────────────────────────────────────────────────────────────────────────────
// Hook 2: Keyboard Enter — submit intercept
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', async (event) => {
    // Most GenAI UIs submit on Enter (not Shift+Enter which is a newline)
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey)
        return;
    const textarea = document.querySelector(site.textareaSelector);
    if (!textarea || document.activeElement !== textarea)
        return;
    const text = site.getContent(textarea);
    if (!text || text.trim().length < 20)
        return;
    const result = (0, pipeline_js_1.runDetectionPipeline)(text);
    if (result.action === 'BLOCK' || result.action === 'WARN') {
        event.preventDefault();
        event.stopImmediatePropagation();
        // Store a "send anyway" callback that re-dispatches a new Enter keydown
        pendingSubmitFn = () => {
            const newEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
            textarea.dispatchEvent(newEvent);
        };
        (0, banner_js_1.showWarningBanner)(result, () => { pendingSubmitFn?.(); pendingSubmitFn = null; }, () => { pendingSubmitFn = null; });
        if (result.action === 'WARN')
            logEvent(result, 'keyboard');
    }
    else if (result.action === 'LOG') {
        logEvent(result, 'keyboard');
    }
}, true);
// ─────────────────────────────────────────────────────────────────────────────
// Hook 3: Send button click — MutationObserver watches for dynamic renders
// ─────────────────────────────────────────────────────────────────────────────
const HOOKED_ATTR = 'data-gp-hooked';
function hookSendButton() {
    const button = document.querySelector(site.sendButtonSelector);
    if (!button || button.getAttribute(HOOKED_ATTR))
        return;
    button.setAttribute(HOOKED_ATTR, '1');
    button.addEventListener('click', async (event) => {
        const textarea = document.querySelector(site.textareaSelector);
        if (!textarea)
            return;
        const text = site.getContent(textarea);
        if (!text || text.trim().length < 20)
            return;
        const result = (0, pipeline_js_1.runDetectionPipeline)(text);
        if (result.action === 'BLOCK' || result.action === 'WARN') {
            event.preventDefault();
            event.stopImmediatePropagation();
            pendingSubmitFn = () => {
                const newClick = new MouseEvent('click', { bubbles: true, cancelable: true });
                button.removeAttribute(HOOKED_ATTR); // temporarily unhook to avoid loop
                button.dispatchEvent(newClick);
                button.setAttribute(HOOKED_ATTR, '1'); // re-hook
            };
            (0, banner_js_1.showWarningBanner)(result, () => { pendingSubmitFn?.(); pendingSubmitFn = null; }, () => { pendingSubmitFn = null; });
            if (result.action === 'WARN')
                logEvent(result, 'button_click');
        }
        else if (result.action === 'LOG') {
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
document.addEventListener('change', async (event) => {
    const input = event.target;
    if (input.type !== 'file' || !input.files?.length)
        return;
    for (const file of Array.from(input.files)) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const isSensitiveExt = SENSITIVE_EXTENSIONS.includes(ext);
        const isTextLike = file.type.startsWith('text/') || isSensitiveExt;
        if (!isTextLike)
            continue;
        // Read file content and scan it
        const text = await file.text();
        const result = (0, pipeline_js_1.runDetectionPipeline)(text);
        if (result.action === 'BLOCK' || result.action === 'WARN') {
            // Can't cancel a file input change, but we can clear it and warn
            input.value = '';
            (0, banner_js_1.showWarningBanner)(result, () => (0, banner_js_1.removeWarningBanner)(), () => (0, banner_js_1.removeWarningBanner)());
            if (result.action === 'WARN')
                logEvent(result, 'file_upload');
        }
    }
}, true);
// ─────────────────────────────────────────────────────────────────────────────
// Async event logger — fire-and-forget to service worker (Team tier)
// ─────────────────────────────────────────────────────────────────────────────
function logEvent(result, trigger) {
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
    }).catch(() => { });
}
//# sourceMappingURL=interceptor.js.map