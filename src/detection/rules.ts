// Detection rule types and interfaces
import rulesJson from './rules.json';

export type Action = 'BLOCK' | 'WARN' | 'LOG' | 'ALLOW';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

// Severity → numeric risk mapping
const SEVERITY_RISK: Record<Severity, { baseRisk: number; minRiskScore: number }> = {
  critical: { baseRisk: 0.95, minRiskScore: 0.50 },
  high:     { baseRisk: 0.85, minRiskScore: 0.65 },
  medium:   { baseRisk: 0.70, minRiskScore: 0.55 },
  low:      { baseRisk: 0.55, minRiskScore: 0.45 },
};

// Derive RuleType from the JSON ids at compile time
export type RuleType = typeof rulesJson.rules[number]['id'];

export interface Match {
  ruleType: string;
  matched: string;      // the actual matched text (truncated for safety)
  baseRisk: number;     // 0.0 – 1.0
}

export interface DetectionResult {
  action: Action;
  riskScore: number;    // final score after context adjustment
  matches: Match[];
  reasons: string[];    // human-readable explanation for the UI
}

export interface Policy {
  rules: Array<{
    ruleType: string;
    minRiskScore: number;
    action: Action;
  }>;
  defaultAction: Action;
}

// ─── Detection rules — built from rules.json ──────────────────────────────
export interface DetectionRule {
  type: string;
  pattern: RegExp;
  baseRisk: number;
  description: string;
  severity: Severity;
}

export const DETECTION_RULES: DetectionRule[] = rulesJson.rules.map(r => ({
  type: r.id,
  pattern: new RegExp(r.pattern, r.flags),
  baseRisk: SEVERITY_RISK[r.severity as Severity].baseRisk,
  description: r.description,
  severity: r.severity as Severity,
}));

// ─── Default policy — built from rules.json ───────────────────────────────
export const DEFAULT_POLICY: Policy = {
  rules: rulesJson.rules.map(r => ({
    ruleType: r.id,
    minRiskScore: SEVERITY_RISK[r.severity as Severity].minRiskScore,
    action: r.action as Action,
  })),
  defaultAction: 'ALLOW',
};

// ─── Luhn check for credit cards ───────────────────────────────────────────
export function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');
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
