"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/detection/rules.json
  var rules_default;
  var init_rules = __esm({
    "src/detection/rules.json"() {
      rules_default = {
        version: "1.0.0",
        _schema: {
          description: "AIPatrol detection rules. Add a new rule by copying any entry and filling in the fields below.",
          fields: {
            id: "Unique identifier for this rule (no spaces, use underscores)",
            pattern: "Regular expression to match sensitive data. Use \\\\ for backslash.",
            flags: "Regex flags: 'i' = ignore case, 'm' = multiline, 'g' = global, '' = none",
            severity: "How sensitive is this data? Choose one: critical / high / medium / low",
            description: "Human-readable label shown in the warning banner",
            action: "What to do when matched. Always use 'WARN' (never hard-blocks the user)"
          },
          severity_guide: {
            critical: "Almost certainly a real secret. Warns even with minimal context. Examples: API keys, private keys, SSNs, passport numbers.",
            high: "Very likely sensitive. Warns when context confirms it. Examples: IBAN, Slack token, driver's license, Azure key.",
            medium: "Probably sensitive but needs supporting context to avoid false positives. Examples: IP address, phone number, street address.",
            low: "Might be sensitive. Only warns when surrounded by other risk signals. Examples: generic keywords, single env lines."
          }
        },
        rules: [
          {
            id: "aws_access_key",
            pattern: "\\bAKIA[0-9A-Z]{16}\\b",
            flags: "",
            description: "AWS Access Key ID",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "github_token",
            pattern: "\\bghp_[a-zA-Z0-9]{36}\\b|\\bgho_[a-zA-Z0-9]{36}\\b|\\bghs_[a-zA-Z0-9]{36}\\b",
            flags: "",
            description: "GitHub Personal Access Token",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "openai_key",
            pattern: "\\bsk-[a-zA-Z0-9]{48}\\b",
            flags: "",
            description: "OpenAI API Key",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "stripe_key",
            pattern: "\\bsk_live_[a-zA-Z0-9]{24,}\\b",
            flags: "",
            description: "Stripe Secret Key (Live)",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "jwt_token",
            pattern: "\\beyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\b",
            flags: "",
            description: "JSON Web Token (JWT)",
            action: "WARN",
            severity: "high"
          },
          {
            id: "private_key_pem",
            pattern: "-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
            flags: "",
            description: "Private Key (PEM format)",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "ssh_private_key",
            pattern: "-----BEGIN OPENSSH PRIVATE KEY-----|ssh-rsa AAAA[A-Za-z0-9+/]{100,}",
            flags: "",
            description: "SSH Private Key",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "db_connection_string",
            pattern: `(?:postgresql|mysql|mongodb(?:\\+srv)?|redis):\\/\\/[^:@\\s]+:[^@\\s]+@[^\\s"']+`,
            flags: "i",
            description: "Database connection string with credentials",
            action: "WARN",
            severity: "high"
          },
          {
            id: "azure_key",
            pattern: "DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]{80,}",
            flags: "",
            description: "Azure Storage Account Key or Connection String",
            action: "WARN",
            severity: "high"
          },
          {
            id: "slack_token",
            pattern: "\\bxox[bpso]-[0-9A-Za-z\\-]{10,}\\b",
            flags: "",
            description: "Slack Token",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "google_api_key",
            pattern: "\\bAIza[0-9A-Za-z\\-_]{35}\\b",
            flags: "",
            description: "Google API Key",
            action: "WARN",
            severity: "critical"
          },
          {
            id: "env_file",
            pattern: "^[A-Z][A-Z0-9_]{2,}=.{1,200}$",
            flags: "m",
            description: "Environment variable file (.env)",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "credit_card",
            pattern: "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b",
            flags: "",
            description: "Credit / debit card number",
            action: "WARN",
            severity: "high"
          },
          {
            id: "ssn",
            pattern: "\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b",
            flags: "",
            description: "US Social Security Number",
            action: "WARN",
            severity: "low"
          },
          {
            id: "bulk_email",
            pattern: "(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})",
            flags: "g",
            description: "Bulk email addresses (potential PII export)",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "internal_ip",
            pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
            flags: "",
            description: "IP address (potential infrastructure data)",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "ip_block",
            pattern: "(?:\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b[\\s,;]+){4,}\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b",
            flags: "",
            description: "Block of IP addresses (potential infrastructure data)",
            action: "WARN",
            severity: "high"
          },
          {
            id: "confidential_document",
            pattern: "(?:all rights reserved|proprietary and confidential|without (?:the )?prior written (?:consent|permission)|do not (?:copy|distribute|share|disclose)|for internal use only|strictly confidential|trade secret|non-disclosure|intellectual property of|copyright \\d{4}|\xA9\\s*\\d{4})",
            flags: "i",
            description: "Confidential / proprietary document content",
            action: "WARN",
            severity: "high"
          },
          {
            id: "phone_number",
            pattern: "\\b(?:\\+?1[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b",
            flags: "",
            description: "Phone number",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "passport_number",
            pattern: "\\b[A-Z]{1,2}[0-9]{6,9}\\b",
            flags: "",
            description: "Passport number",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "us_ein",
            pattern: "\\b\\d{2}-\\d{7}\\b",
            flags: "",
            description: "US Employer Identification Number (EIN)",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "uk_nino",
            pattern: "\\b[A-CEGHJ-PR-TW-Z]{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?[A-D]\\b",
            flags: "i",
            description: "UK National Insurance Number",
            action: "WARN",
            severity: "high"
          },
          {
            id: "iban",
            pattern: "\\b[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}(?:[A-Z0-9]?){0,16}\\b",
            flags: "",
            description: "IBAN (International Bank Account Number)",
            action: "WARN",
            severity: "high"
          },
          {
            id: "date_of_birth",
            pattern: "(?:dob|date of birth|born on|birth date)[:\\s]+\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4}",
            flags: "i",
            description: "Date of birth (with PII label)",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "drivers_license",
            pattern: "(?:driver'?s?\\s+licen[sc]e|DL#?|license\\s+no\\.?)[:\\s]+[A-Z0-9]{5,15}",
            flags: "i",
            description: "Driver's license number (with label)",
            action: "WARN",
            severity: "high"
          },
          {
            id: "medicare_number",
            pattern: "\\b\\d{4}[- ]?\\d{5}[- ]?\\d{1}\\b",
            flags: "",
            description: "Medicare / health insurance number",
            action: "WARN",
            severity: "medium"
          },
          {
            id: "physical_address",
            pattern: "\\b\\d{1,5}\\s+[A-Za-z0-9\\s]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way)\\b",
            flags: "i",
            description: "Physical street address",
            action: "WARN",
            severity: "medium"
          }
        ]
      };
    }
  });

  // src/detection/rules.ts
  function luhnCheck(num) {
    const digits = num.replace(/\D/g, "");
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if (alt) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      alt = !alt;
    }
    return sum % 10 === 0;
  }
  var SEVERITY_RISK, DETECTION_RULES, DEFAULT_POLICY;
  var init_rules2 = __esm({
    "src/detection/rules.ts"() {
      "use strict";
      init_rules();
      SEVERITY_RISK = {
        critical: { baseRisk: 0.95, minRiskScore: 0.5 },
        high: { baseRisk: 0.85, minRiskScore: 0.65 },
        medium: { baseRisk: 0.7, minRiskScore: 0.55 },
        low: { baseRisk: 0.55, minRiskScore: 0.45 }
      };
      DETECTION_RULES = rules_default.rules.map((r) => ({
        type: r.id,
        pattern: new RegExp(r.pattern, r.flags),
        baseRisk: SEVERITY_RISK[r.severity].baseRisk,
        description: r.description,
        severity: r.severity
      }));
      DEFAULT_POLICY = {
        rules: rules_default.rules.map((r) => ({
          ruleType: r.id,
          minRiskScore: SEVERITY_RISK[r.severity].minRiskScore,
          action: r.action
        })),
        defaultAction: "ALLOW"
      };
    }
  });

  // src/detection/scorer.ts
  function shannonEntropy(str) {
    const freq = {};
    for (const ch of str) freq[ch] = (freq[ch] ?? 0) + 1;
    const len = str.length;
    return -Object.values(freq).reduce((acc, f) => {
      const p = f / len;
      return acc + p * Math.log2(p);
    }, 0);
  }
  function isExampleValue(value) {
    return /example|dummy|test|fake|sample|placeholder/i.test(value);
  }
  function hasExampleLanguage(text) {
    return /\b(?:example|dummy|placeholder|your[_\-]?(?:key|token|secret|api)|replace|changeme|xxx+|foo|bar|test123)\b/i.test(text);
  }
  function isHighEntropy(value) {
    if (value.length < 16) return false;
    return shannonEntropy(value) > 3.5;
  }
  function countEmails(text) {
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return matches ? new Set(matches).size : 0;
  }
  function countEnvLines(text) {
    const lines = text.split("\n");
    return lines.filter((l) => /^[A-Z][A-Z0-9_]{2,}=.+$/.test(l.trim())).length;
  }
  function scoreContext(text, match) {
    let score = match.baseRisk;
    const signals = [];
    if (hasExampleLanguage(text) || isExampleValue(match.matched)) {
      score -= 0.3;
      signals.push("example_language_detected");
    }
    if (text.length < 50) {
      score -= 0.1;
      signals.push("short_text");
    }
    if (text.length > 500) {
      score += 0.1;
      signals.push("large_paste");
    }
    if (isHighEntropy(match.matched)) {
      score += 0.15;
      signals.push("high_entropy_value");
    }
    if (match.ruleType === "env_file") {
      const envLineCount = countEnvLines(text);
      if (envLineCount >= 3) {
        score += 0.15;
        signals.push(`env_file_${envLineCount}_lines`);
      } else if (envLineCount < 3) {
        score -= 0.2;
        signals.push("single_env_line_low_confidence");
      }
    }
    if (match.ruleType === "bulk_email") {
      const emailCount = countEmails(text);
      if (emailCount < 5) {
        score -= 0.4;
        signals.push(`only_${emailCount}_emails_not_bulk`);
      } else {
        score += 0.1 * Math.min(emailCount - 4, 5);
        signals.push(`bulk_${emailCount}_emails`);
      }
    }
    if (match.ruleType === "ssn") {
      const hasPIIContext = /\b(?:ssn|social\s+security|dob|date\s+of\s+birth|name|address|zip)\b/i.test(text);
      if (!hasPIIContext) {
        score -= 0.2;
        signals.push("ssn_no_pii_context");
      }
    }
    if (match.ruleType === "credit_card") {
      if (!luhnCheck(match.matched)) {
        score -= 0.6;
        signals.push("credit_card_luhn_failed");
      } else {
        signals.push("credit_card_luhn_passed");
      }
    }
    return {
      adjustedRisk: Math.min(1, Math.max(0, score)),
      signals
    };
  }
  var init_scorer = __esm({
    "src/detection/scorer.ts"() {
      "use strict";
      init_rules2();
    }
  });

  // src/detection/pipeline.ts
  function runDetectionPipeline(text, policy = DEFAULT_POLICY) {
    if (!text || text.trim().length < 7) {
      return { action: "ALLOW", riskScore: 0, matches: [], reasons: [] };
    }
    const rawMatches = [];
    for (const rule of DETECTION_RULES) {
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(text);
      if (match) {
        rawMatches.push({
          ruleType: rule.type,
          matched: match[0].substring(0, 60),
          // truncate for safety
          baseRisk: rule.baseRisk
        });
      }
    }
    if (rawMatches.length === 0) {
      return { action: "ALLOW", riskScore: 0, matches: [], reasons: [] };
    }
    let highestRisk = 0;
    const reasons = [];
    const scoredMatches = [];
    for (const match of rawMatches) {
      const { adjustedRisk, signals } = scoreContext(text, match);
      scoredMatches.push({ ...match, baseRisk: adjustedRisk });
      reasons.push(...signals);
      if (adjustedRisk > highestRisk) {
        highestRisk = adjustedRisk;
      }
    }
    let finalAction = policy.defaultAction;
    for (const match of scoredMatches) {
      const policyRule = policy.rules.find((r) => r.ruleType === match.ruleType);
      if (!policyRule) continue;
      if (match.baseRisk >= policyRule.minRiskScore) {
        if (actionPriority(policyRule.action) > actionPriority(finalAction)) {
          finalAction = policyRule.action;
        }
      }
    }
    return {
      action: finalAction,
      riskScore: highestRisk,
      matches: scoredMatches,
      reasons: [...new Set(reasons)]
      // deduplicate
    };
  }
  function actionPriority(action) {
    const priorities = { ALLOW: 0, LOG: 1, WARN: 2, BLOCK: 3 };
    return priorities[action] ?? 0;
  }
  var init_pipeline = __esm({
    "src/detection/pipeline.ts"() {
      "use strict";
      init_rules2();
      init_scorer();
    }
  });

  // src/content/banner.ts
  function showWarningBanner(result, onSendAnyway, onDismiss) {
    removeWarningBanner();
    const detectedTypes = result.matches.map((m) => RULE_LABELS[m.ruleType] ?? m.ruleType).join(", ");
    const accentColor = "#E67E22";
    const headline = "AIPatrol detected sensitive data";
    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "alert");
    banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 360px;
    background: #1a1a1a;
    border-left: 4px solid ${accentColor};
    border-radius: 8px;
    padding: 16px 18px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    color: #f0f0f0;
    line-height: 1.5;
    animation: AIPatrol-slide-in 0.2s ease-out;
  `;
    banner.innerHTML = `
    <style>
      @keyframes AIPatrol-slide-in {
        from { transform: translateX(20px); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
      #${BANNER_ID} button {
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        padding: 7px 14px;
        font-family: inherit;
      }
    </style>
    <div style="display:flex; align-items:flex-start; gap:10px;">
      <span style="font-size:20px; flex-shrink:0">\u26A0\uFE0F</span>
      <div style="flex:1">
        <div style="font-weight:700; color:#ffffff; margin-bottom:4px;">${headline}</div>
        <div style="color:#c0b8b0; font-size:13px; margin-bottom:12px;">
          Found: <strong style="color:#f0f0f0">${detectedTypes}</strong>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button id="gp-send-anyway" style="background:#CC4A12; color:white;">Send anyway</button>
          <button id="gp-dismiss" style="background:#2d2d2d; color:#c0b8b0;">Dismiss</button>
        </div>
      </div>
      <button id="gp-close-x" style="background:transparent; color:#666; font-size:18px; padding:0 4px; align-self:flex-start; margin-top:-4px;">\xD7</button>
    </div>
  `;
    document.body.appendChild(banner);
    document.getElementById("gp-dismiss")?.addEventListener("click", () => {
      removeWarningBanner();
      onDismiss();
    });
    document.getElementById("gp-close-x")?.addEventListener("click", () => {
      removeWarningBanner();
      onDismiss();
    });
    document.getElementById("gp-send-anyway")?.addEventListener("click", () => {
      removeWarningBanner();
      onSendAnyway();
    });
    document.getElementById("gp-send-anyway-override")?.addEventListener("click", () => {
      removeWarningBanner();
      onSendAnyway();
    });
    setTimeout(() => removeWarningBanner(), 12e3);
  }
  function removeWarningBanner() {
    document.getElementById(BANNER_ID)?.remove();
  }
  var BANNER_ID, RULE_LABELS;
  var init_banner = __esm({
    "src/content/banner.ts"() {
      "use strict";
      BANNER_ID = "AIPatrol-warning-banner";
      RULE_LABELS = {
        aws_access_key: "AWS Access Key",
        github_token: "GitHub Token",
        openai_key: "OpenAI API Key",
        stripe_key: "Stripe Secret Key",
        jwt_token: "JWT Token",
        private_key_pem: "Private Key (PEM)",
        db_connection_string: "Database Credentials",
        env_file: "Environment File (.env)",
        ssn: "Social Security Number",
        credit_card: "Credit Card Number",
        bulk_email: "Bulk Email Addresses"
      };
    }
  });

  // src/content/sites.ts
  function detectCurrentSite() {
    const host = window.location.hostname;
    if (host.includes("chatgpt.com") || host.includes("openai.com")) return SITE_CONFIGS[0];
    if (host.includes("claude.ai")) return SITE_CONFIGS[1];
    if (host.includes("gemini.google")) return SITE_CONFIGS[2];
    if (host.includes("perplexity.ai")) return SITE_CONFIGS[3];
    if (host.includes("copilot.microsoft")) return SITE_CONFIGS[4];
    if (host.includes("google.com")) return SITE_CONFIGS[5];
    if (host.includes("bing.com")) return SITE_CONFIGS[6];
    return SITE_CONFIGS[7];
  }
  var SITE_CONFIGS;
  var init_sites = __esm({
    "src/content/sites.ts"() {
      "use strict";
      SITE_CONFIGS = [
        {
          name: "ChatGPT",
          // chatgpt.com uses a contenteditable div, not a textarea
          textareaSelector: '#prompt-textarea, div[contenteditable="true"][data-virtuoso-scroller]',
          sendButtonSelector: '[data-testid="send-button"], button[aria-label="Send prompt"]',
          getContent: (el) => el.innerText || el.value || ""
        },
        {
          name: "Claude",
          textareaSelector: '.ProseMirror[contenteditable="true"]',
          sendButtonSelector: 'button[aria-label="Send message"], button[data-testid="send-button"]',
          getContent: (el) => el.innerText || ""
        },
        {
          name: "Gemini",
          textareaSelector: '.ql-editor[contenteditable="true"], rich-textarea .ql-editor',
          sendButtonSelector: 'button.send-button, button[aria-label*="send" i]',
          getContent: (el) => el.innerText || ""
        },
        {
          name: "Perplexity",
          // Perplexity uses a textarea inside a form
          textareaSelector: 'textarea[placeholder*="Ask"], textarea[placeholder*="ask"], textarea',
          sendButtonSelector: 'button[aria-label="Submit"], button[type="submit"], button[aria-label*="send" i]',
          getContent: (el) => el.value || ""
        },
        {
          name: "Copilot",
          // Copilot (bing) uses a textarea or contenteditable
          textareaSelector: 'textarea[placeholder*="Message Copilot" i], textarea[placeholder*="ask me" i], textarea',
          sendButtonSelector: 'button[aria-label*="send" i], button[aria-label*="Submit" i], button[type="submit"]',
          getContent: (el) => el.value || el.innerText || ""
        },
        {
          name: "Google",
          textareaSelector: 'textarea[name="q"], input[name="q"]',
          sendButtonSelector: 'button[aria-label*="Search" i], input[type="submit"], button[type="submit"]',
          getContent: (el) => el.value || el.value || ""
        },
        {
          name: "Bing",
          textareaSelector: '#sb_form_q, textarea[id="sb_form_q"], input[id="sb_form_q"]',
          sendButtonSelector: '#search_icon, button[type="submit"], #sb_form_go',
          getContent: (el) => el.value || ""
        },
        {
          name: "Generic",
          textareaSelector: 'textarea, [contenteditable="true"]',
          sendButtonSelector: 'button[data-testid="send-button"], button[aria-label="Send message"], button.send, button[type="submit"]',
          getContent: (el) => el.innerText || el.value || ""
        }
      ];
    }
  });

  // src/content/interceptor.ts
  var require_interceptor = __commonJS({
    "src/content/interceptor.ts"() {
      init_pipeline();
      init_banner();
      init_sites();
      var site = detectCurrentSite();
      var bypassUntil = 0;
      var isBypassed = () => Date.now() < bypassUntil;
      var setBypassed = () => {
        bypassUntil = Date.now() + 5e3;
      };
      var pendingSubmitFn = null;
      document.addEventListener(
        "paste",
        (event) => {
          if (isBypassed()) return;
          const text = event.clipboardData?.getData("text/plain") ?? "";
          if (text.length < 7) return;
          const result = runDetectionPipeline(text);
          if (result.action === "BLOCK") {
            event.preventDefault();
            event.stopImmediatePropagation();
            const target = event.target;
            const sendAnyway = () => {
              removeWarningBanner();
              setBypassed();
              if (target.value !== void 0) {
                const ta = target;
                const start = ta.selectionStart ?? ta.value.length;
                ta.value = ta.value.slice(0, start) + text + ta.value.slice(ta.selectionEnd ?? start);
                ta.dispatchEvent(new Event("input", { bubbles: true }));
              } else if (target.contentEditable === "true") {
                const sel = window.getSelection();
                if (sel && sel.rangeCount) {
                  const range = sel.getRangeAt(0);
                  range.deleteContents();
                  range.insertNode(document.createTextNode(text));
                  range.collapse(false);
                }
                target.dispatchEvent(new Event("input", { bubbles: true }));
              }
            };
            showWarningBanner(result, sendAnyway, () => removeWarningBanner());
          } else if (result.action === "WARN") {
            showWarningBanner(
              result,
              () => {
                setBypassed();
                removeWarningBanner();
              },
              () => removeWarningBanner()
            );
            logEvent(result, "paste");
          } else if (result.action === "LOG") {
            logEvent(result, "paste");
          }
        },
        /* capture phase = */
        true
      );
      document.addEventListener("keydown", async (event) => {
        if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey) return;
        if (isBypassed()) return;
        const textarea = document.querySelector(site.textareaSelector);
        if (!textarea || document.activeElement !== textarea) return;
        const text = site.getContent(textarea);
        if (!text || text.trim().length < 20) return;
        const result = runDetectionPipeline(text);
        if (result.action === "BLOCK" || result.action === "WARN") {
          event.preventDefault();
          event.stopImmediatePropagation();
          pendingSubmitFn = () => {
            setBypassed();
            const newEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
            textarea.dispatchEvent(newEvent);
          };
          showWarningBanner(
            result,
            () => {
              pendingSubmitFn?.();
              pendingSubmitFn = null;
            },
            () => {
              pendingSubmitFn = null;
            }
          );
          if (result.action === "WARN") logEvent(result, "keyboard");
        } else if (result.action === "LOG") {
          logEvent(result, "keyboard");
        }
      }, true);
      var HOOKED_ATTR = "data-gp-hooked";
      function hookSendButton() {
        const button = document.querySelector(site.sendButtonSelector);
        if (!button || button.getAttribute(HOOKED_ATTR)) return;
        button.setAttribute(HOOKED_ATTR, "1");
        button.addEventListener("click", async (event) => {
          if (isBypassed()) return;
          const textarea = document.querySelector(site.textareaSelector);
          if (!textarea) return;
          const text = site.getContent(textarea);
          if (!text || text.trim().length < 20) return;
          const result = runDetectionPipeline(text);
          if (result.action === "BLOCK" || result.action === "WARN") {
            event.preventDefault();
            event.stopImmediatePropagation();
            pendingSubmitFn = () => {
              const newClick = new MouseEvent("click", { bubbles: true, cancelable: true });
              button.removeAttribute(HOOKED_ATTR);
              button.dispatchEvent(newClick);
              button.setAttribute(HOOKED_ATTR, "1");
            };
            showWarningBanner(
              result,
              () => {
                pendingSubmitFn?.();
                pendingSubmitFn = null;
              },
              () => {
                pendingSubmitFn = null;
              }
            );
            if (result.action === "WARN") logEvent(result, "button_click");
          } else if (result.action === "LOG") {
            logEvent(result, "button_click");
          }
        }, true);
      }
      new MutationObserver(hookSendButton).observe(document.body, {
        childList: true,
        subtree: true
      });
      hookSendButton();
      var SENSITIVE_EXTENSIONS = [".env", ".pem", ".key", ".p12", ".pfx", ".sql", ".json", ".yaml", ".yml", ".csv"];
      document.addEventListener("change", async (event) => {
        const input = event.target;
        if (input.type !== "file" || !input.files?.length) return;
        for (const file of Array.from(input.files)) {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          const isSensitiveExt = SENSITIVE_EXTENSIONS.includes(ext);
          const isTextLike = file.type.startsWith("text/") || isSensitiveExt;
          if (!isTextLike) continue;
          const text = await file.text();
          const result = runDetectionPipeline(text);
          if (result.action === "BLOCK" || result.action === "WARN") {
            input.value = "";
            showWarningBanner(
              result,
              () => removeWarningBanner(),
              () => removeWarningBanner()
            );
            if (result.action === "WARN") logEvent(result, "file_upload");
          }
        }
      }, true);
      function logEvent(result, trigger) {
        chrome.runtime.sendMessage({
          type: "LOG_EVENT",
          payload: {
            url: window.location.hostname,
            trigger,
            action: result.action,
            riskScore: result.riskScore,
            ruleTypes: result.matches.map((m) => m.ruleType),
            timestamp: Date.now()
          }
        }).catch(() => {
        });
      }
    }
  });
  require_interceptor();
})();
//# sourceMappingURL=interceptor.js.map
