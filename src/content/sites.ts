// Per-site configuration: how to find the input and send button
export interface SiteConfig {
  name: string;
  textareaSelector: string;
  sendButtonSelector: string;
  getContent: (el: Element) => string;
}

export const SITE_CONFIGS: SiteConfig[] = [
  {
    name: 'ChatGPT',
    // chatgpt.com uses a contenteditable div, not a textarea
    textareaSelector: '#prompt-textarea, div[contenteditable="true"][data-virtuoso-scroller]',
    sendButtonSelector: '[data-testid="send-button"], button[aria-label="Send prompt"]',
    getContent: (el) => (el as HTMLElement).innerText || (el as HTMLTextAreaElement).value || '',
  },
  {
    name: 'Claude',
    textareaSelector: '.ProseMirror[contenteditable="true"]',
    sendButtonSelector: 'button[aria-label="Send message"], button[data-testid="send-button"]',
    getContent: (el) => (el as HTMLElement).innerText || '',
  },
  {
    name: 'Gemini',
    textareaSelector: '.ql-editor[contenteditable="true"], rich-textarea .ql-editor',
    sendButtonSelector: 'button.send-button, button[aria-label*="send" i]',
    getContent: (el) => (el as HTMLElement).innerText || '',
  },
  {
    name: 'Perplexity',
    // Perplexity uses a textarea inside a form
    textareaSelector: 'textarea[placeholder*="Ask"], textarea[placeholder*="ask"], textarea',
    sendButtonSelector: 'button[aria-label="Submit"], button[type="submit"], button[aria-label*="send" i]',
    getContent: (el) => (el as HTMLTextAreaElement).value || '',
  },
  {
    name: 'Copilot',
    // Copilot (bing) uses a textarea or contenteditable
    textareaSelector: 'textarea[placeholder*="Message Copilot" i], textarea[placeholder*="ask me" i], textarea',
    sendButtonSelector: 'button[aria-label*="send" i], button[aria-label*="Submit" i], button[type="submit"]',
    getContent: (el) => (el as HTMLTextAreaElement).value || (el as HTMLElement).innerText || '',
  },
  {
    name: 'Google',
    textareaSelector: 'textarea[name="q"], input[name="q"]',
    sendButtonSelector: 'button[aria-label*="Search" i], input[type="submit"], button[type="submit"]',
    getContent: (el) => (el as HTMLTextAreaElement).value || (el as HTMLInputElement).value || '',
  },
  {
    name: 'Bing',
    textareaSelector: '#sb_form_q, textarea[id="sb_form_q"], input[id="sb_form_q"]',
    sendButtonSelector: '#search_icon, button[type="submit"], #sb_form_go',
    getContent: (el) => (el as HTMLInputElement).value || '',
  },
  {
    name: 'Generic',
    textareaSelector: 'textarea, [contenteditable="true"]',
    sendButtonSelector: 'button[data-testid="send-button"], button[aria-label="Send message"], button.send, button[type="submit"]',
    getContent: (el) => (el as HTMLElement).innerText || (el as HTMLTextAreaElement).value || '',
  },
];

export function detectCurrentSite(): SiteConfig {
  const host = window.location.hostname;
  if (host.includes('chatgpt.com') || host.includes('openai.com')) return SITE_CONFIGS[0];
  if (host.includes('claude.ai'))         return SITE_CONFIGS[1];
  if (host.includes('gemini.google'))     return SITE_CONFIGS[2];
  if (host.includes('perplexity.ai'))     return SITE_CONFIGS[3];
  if (host.includes('copilot.microsoft')) return SITE_CONFIGS[4];
  if (host.includes('google.com'))        return SITE_CONFIGS[5];
  if (host.includes('bing.com'))          return SITE_CONFIGS[6];
  return SITE_CONFIGS[7]; // Generic fallback
}
