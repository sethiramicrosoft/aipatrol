import { DETECTION_RULES, luhnCheck, type Match, type RuleType } from './rules.js';

// ─── Shannon entropy ────────────────────────────────────────────────────────
function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const ch of str) freq[ch] = (freq[ch] ?? 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((acc, f) => {
    const p = f / len;
    return acc + p * Math.log2(p);
  }, 0);
}

// ─── Context signals ────────────────────────────────────────────────────────

/** Returns true if the match value itself looks like a known example */
function isExampleValue(value: string): boolean {
  return /example|dummy|test|fake|sample|placeholder/i.test(value);
}

/** Returns true if the surrounding text looks like tutorial/example content */
function hasExampleLanguage(text: string): boolean {
  return /\b(?:example|dummy|placeholder|your[_\-]?(?:key|token|secret|api)|replace|changeme|xxx+|foo|bar|test123)\b/i.test(text);
}

/** Returns true if the match value looks like a real secret (high entropy) */
function isHighEntropy(value: string): boolean {
  // Only meaningful for strings >= 16 chars
  if (value.length < 16) return false;
  return shannonEntropy(value) > 3.5;
}

/** Count email addresses in text */
function countEmails(text: string): number {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  return matches ? new Set(matches).size : 0;
}

/** Count .env-style lines */
function countEnvLines(text: string): number {
  const lines = text.split('\n');
  return lines.filter(l => /^[A-Z][A-Z0-9_]{2,}=.+$/.test(l.trim())).length;
}

// ─── Context scorer ─────────────────────────────────────────────────────────

export interface ContextScore {
  adjustedRisk: number;
  signals: string[];
}

export function scoreContext(
  text: string,
  match: Match,
): ContextScore {
  let score = match.baseRisk;
  const signals: string[] = [];

  // ── Downward adjusters (reduce false positives) ──────────────────────────
  if (hasExampleLanguage(text) || isExampleValue(match.matched)) {
    score -= 0.30;
    signals.push('example_language_detected');
  }

  if (text.length < 50) {
    // Very short text is unlikely to be a real credential dump
    score -= 0.10;
    signals.push('short_text');
  }

  // ── Upward adjusters (increase confidence) ───────────────────────────────

  // Large paste is a strong signal for accidental data dump
  if (text.length > 500) {
    score += 0.10;
    signals.push('large_paste');
  }

  // High entropy on the matched value → likely a real secret, not an example
  if (isHighEntropy(match.matched)) {
    score += 0.15;
    signals.push('high_entropy_value');
  }

  // Multiple env-style lines indicate a .env file dump
  if (match.ruleType === 'env_file') {
    const envLineCount = countEnvLines(text);
    if (envLineCount >= 3) {
      score += 0.15;
      signals.push(`env_file_${envLineCount}_lines`);
    } else if (envLineCount < 3) {
      // Single env line could be from documentation
      score -= 0.20;
      signals.push('single_env_line_low_confidence');
    }
  }

  // Bulk email requires >= 5 distinct addresses to be actionable
  if (match.ruleType === 'bulk_email') {
    const emailCount = countEmails(text);
    if (emailCount < 5) {
      score -= 0.40; // fewer than 5 is not "bulk"
      signals.push(`only_${emailCount}_emails_not_bulk`);
    } else {
      score += 0.10 * Math.min(emailCount - 4, 5); // up to +0.50 for many emails
      signals.push(`bulk_${emailCount}_emails`);
    }
  }

  // SSN requires additional PII context to reduce false positives
  if (match.ruleType === 'ssn') {
    const hasPIIContext = /\b(?:ssn|social\s+security|dob|date\s+of\s+birth|name|address|zip)\b/i.test(text);
    if (!hasPIIContext) {
      score -= 0.20;
      signals.push('ssn_no_pii_context');
    }
  }

  // Credit card: run Luhn check — if it fails, it's almost certainly not real
  if (match.ruleType === 'credit_card') {
    if (!luhnCheck(match.matched)) {
      score -= 0.60;
      signals.push('credit_card_luhn_failed');
    } else {
      signals.push('credit_card_luhn_passed');
    }
  }

  return {
    adjustedRisk: Math.min(1.0, Math.max(0.0, score)),
    signals,
  };
}
