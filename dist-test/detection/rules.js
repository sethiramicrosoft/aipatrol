"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POLICY = exports.DETECTION_RULES = void 0;
exports.luhnCheck = luhnCheck;
// Detection rule types and interfaces
const rules_json_1 = __importDefault(require("./rules.json"));
// Severity → numeric risk mapping
const SEVERITY_RISK = {
    critical: { baseRisk: 0.95, minRiskScore: 0.50 },
    high: { baseRisk: 0.85, minRiskScore: 0.65 },
    medium: { baseRisk: 0.70, minRiskScore: 0.55 },
    low: { baseRisk: 0.55, minRiskScore: 0.45 },
};
exports.DETECTION_RULES = rules_json_1.default.rules.map(r => ({
    type: r.id,
    pattern: new RegExp(r.pattern, r.flags),
    baseRisk: SEVERITY_RISK[r.severity].baseRisk,
    description: r.description,
    severity: r.severity,
}));
// ─── Default policy — built from rules.json ───────────────────────────────
exports.DEFAULT_POLICY = {
    rules: rules_json_1.default.rules.map(r => ({
        ruleType: r.id,
        minRiskScore: SEVERITY_RISK[r.severity].minRiskScore,
        action: r.action,
    })),
    defaultAction: 'ALLOW',
};
// ─── Luhn check for credit cards ───────────────────────────────────────────
function luhnCheck(num) {
    const digits = num.replace(/\D/g, '');
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let d = parseInt(digits[i], 10);
        if (alt) {
            d *= 2;
            if (d > 9)
                d -= 9;
        }
        sum += d;
        alt = !alt;
    }
    return sum % 10 === 0;
}
//# sourceMappingURL=rules.js.map