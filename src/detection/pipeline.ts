import { DETECTION_RULES, DEFAULT_POLICY, type Match, type DetectionResult, type Policy } from './rules.js';
import { scoreContext } from './scorer.js';

// ─── Main pipeline ───────────────────────────────────────────────────────────

/**
 * Run the full detection pipeline against a text input.
 * Returns a DetectionResult with the recommended action, risk score, and matches.
 */
export function runDetectionPipeline(
  text: string,
  policy: Policy = DEFAULT_POLICY,
): DetectionResult {
  if (!text || text.trim().length < 7) {
    return { action: 'ALLOW', riskScore: 0, matches: [], reasons: [] };
  }

  // ── Layer 1: Pattern matching ──────────────────────────────────────────────
  const rawMatches: Match[] = [];

  for (const rule of DETECTION_RULES) {
    // Reset lastIndex for global regexps
    rule.pattern.lastIndex = 0;

    const match = rule.pattern.exec(text);
    if (match) {
      rawMatches.push({
        ruleType: rule.type,
        matched: match[0].substring(0, 60), // truncate for safety
        baseRisk: rule.baseRisk,
      });
    }
  }

  if (rawMatches.length === 0) {
    return { action: 'ALLOW', riskScore: 0, matches: [], reasons: [] };
  }

  // ── Layer 2: Context scoring ───────────────────────────────────────────────
  let highestRisk = 0;
  const reasons: string[] = [];
  const scoredMatches: Match[] = [];

  for (const match of rawMatches) {
    const { adjustedRisk, signals } = scoreContext(text, match);

    scoredMatches.push({ ...match, baseRisk: adjustedRisk });
    reasons.push(...signals);

    if (adjustedRisk > highestRisk) {
      highestRisk = adjustedRisk;
    }
  }

  // ── Layer 3: Policy enforcement ────────────────────────────────────────────
  let finalAction = policy.defaultAction;

  for (const match of scoredMatches) {
    const policyRule = policy.rules.find(r => r.ruleType === match.ruleType);
    if (!policyRule) continue;

    if (match.baseRisk >= policyRule.minRiskScore) {
      // Escalate action (BLOCK > WARN > LOG > ALLOW)
      if (actionPriority(policyRule.action) > actionPriority(finalAction)) {
        finalAction = policyRule.action;
      }
    }
  }

  return {
    action: finalAction,
    riskScore: highestRisk,
    matches: scoredMatches,
    reasons: [...new Set(reasons)], // deduplicate
  };
}

function actionPriority(action: string): number {
  const priorities: Record<string, number> = { ALLOW: 0, LOG: 1, WARN: 2, BLOCK: 3 };
  return priorities[action] ?? 0;
}
