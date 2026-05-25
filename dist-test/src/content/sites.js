"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SITE_CONFIGS = void 0;
exports.detectCurrentSite = detectCurrentSite;
exports.SITE_CONFIGS = [
    {
        name: 'ChatGPT',
        textareaSelector: '#prompt-textarea, [data-id="root"] textarea',
        sendButtonSelector: '[data-testid="send-button"], button[aria-label="Send prompt"]',
        getContent: (el) => el.innerText || el.value || '',
    },
    {
        name: 'Claude',
        textareaSelector: '.ProseMirror[contenteditable="true"]',
        sendButtonSelector: 'button[aria-label="Send message"], button[data-testid="send-button"]',
        getContent: (el) => el.innerText || '',
    },
    {
        name: 'Gemini',
        textareaSelector: '.ql-editor[contenteditable="true"], rich-textarea .ql-editor',
        sendButtonSelector: 'button.send-button, button[aria-label*="send" i]',
        getContent: (el) => el.innerText || '',
    },
    {
        name: 'Perplexity',
        textareaSelector: 'textarea[placeholder], textarea',
        sendButtonSelector: 'button[aria-label="Submit"], button[type="submit"]',
        getContent: (el) => el.value || '',
    },
    {
        name: 'Copilot',
        textareaSelector: 'textarea[aria-label], cib-text-input textarea',
        sendButtonSelector: 'button[aria-label*="send" i], cib-button[type="submit"]',
        getContent: (el) => el.value || '',
    },
];
function detectCurrentSite() {
    const host = window.location.hostname;
    if (host.includes('openai.com'))
        return exports.SITE_CONFIGS[0];
    if (host.includes('claude.ai'))
        return exports.SITE_CONFIGS[1];
    if (host.includes('gemini.google'))
        return exports.SITE_CONFIGS[2];
    if (host.includes('perplexity.ai'))
        return exports.SITE_CONFIGS[3];
    if (host.includes('copilot.microsoft'))
        return exports.SITE_CONFIGS[4];
    return undefined;
}
//# sourceMappingURL=sites.js.map