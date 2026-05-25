"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POLICY = void 0;
exports.runDetectionPipeline = runDetectionPipeline;
const rules_js_1 = require("./rules.js");
const scorer_js_1 = require("./scorer.js");
// ─── Default policy (free tier) ─────────────────────────────────────────────
exports.DEFAULT_POLICY = {
    rules: [
        { ruleType: 'aws_access_key', minRiskScore: 0.70, action: 'BLOCK' },
        { ruleType: 'github_token', minRiskScore: 0.70, action: 'BLOCK' },
        { ruleType: 'openai_key', minRiskScore: 0.70, action: 'BLOCK' },
        { ruleType: 'stripe_key', minRiskScore: 0.70, action: 'BLOCK' },
        { ruleType: 'private_key_pem', minRiskScore: 0.50, action: 'BLOCK' },
        { ruleType: 'db_connection_string', minRiskScore: 0.70, action: 'BLOCK' },
        { ruleType: 'jwt_token', minRiskScore: 0.75, action: 'WARN' },
        { ruleType: 'env_file', minRiskScore: 0.70, action: 'WARN' },
        { ruleType: 'credit_card', minRiskScore: 0.75, action: 'BLOCK' },
        { ruleType: 'ssn', minRiskScore: 0.70, action: 'WARN' },
        { ruleType: 'bulk_email', minRiskScore: 0.65, action: 'WARN' },
    ],
    defaultAction: 'ALLOW',
};
// ─── Main pipeline ───────────────────────────────────────────────────────────
/**
 * Run the full detection pipeline against a text input.
 * Returns a DetectionResult with the recommended action, risk score, and matches.
 */
function runDetectionPipeline(text, policy = exports.DEFAULT_POLICY) {
    if (!text || text.trim().length < 10) {
        return { action: 'ALLOW', riskScore: 0, matches: [], reasons: [] };
    }
    // ── Layer 1: Pattern matching ──────────────────────────────────────────────
    const rawMatches = [];
    for (const rule of rules_js_1.DETECTION_RULES) {
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
    const reasons = [];
    const scoredMatches = [];
    for (const match of rawMatches) {
        const { adjustedRisk, signals } = (0, scorer_js_1.scoreContext)(text, match);
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
        if (!policyRule)
            continue;
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
function actionPriority(action) {
    const priorities = { ALLOW: 0, LOG: 1, WARN: 2, BLOCK: 3 };
    return priorities[action] ?? 0;
}
//# sourceMappingURL=pipeline.js.map