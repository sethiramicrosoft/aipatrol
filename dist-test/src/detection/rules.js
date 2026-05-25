"use strict";
// Detection rule types and interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETECTION_RULES = void 0;
exports.luhnCheck = luhnCheck;
exports.DETECTION_RULES = [
    {
        type: 'aws_access_key',
        // AKIA + 16 uppercase alphanumeric chars — very specific, near-zero FP
        pattern: /\bAKIA[0-9A-Z]{16}\b/,
        baseRisk: 0.95,
        description: 'AWS Access Key ID',
    },
    {
        type: 'github_token',
        pattern: /\bghp_[a-zA-Z0-9]{36}\b|\bgho_[a-zA-Z0-9]{36}\b|\bghs_[a-zA-Z0-9]{36}\b/,
        baseRisk: 0.95,
        description: 'GitHub Personal Access Token',
    },
    {
        type: 'openai_key',
        pattern: /\bsk-[a-zA-Z0-9]{48}\b/,
        baseRisk: 0.95,
        description: 'OpenAI API Key',
    },
    {
        type: 'stripe_key',
        pattern: /\bsk_live_[a-zA-Z0-9]{24,}\b/,
        baseRisk: 0.95,
        description: 'Stripe Secret Key (Live)',
    },
    {
        type: 'jwt_token',
        // 3 base64url segments separated by dots — header.payload.signature
        pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
        baseRisk: 0.80,
        description: 'JSON Web Token (JWT)',
    },
    {
        type: 'private_key_pem',
        pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
        baseRisk: 0.99,
        description: 'Private Key (PEM format)',
    },
    {
        type: 'db_connection_string',
        // Matches postgresql://, mysql://, mongodb:// with embedded credentials
        pattern: /(?:postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[^:@\s]+:[^@\s]+@[^\s"']+/i,
        baseRisk: 0.90,
        description: 'Database connection string with credentials',
    },
    {
        type: 'env_file',
        // 3+ lines of UPPER_CASE=value — strongly indicates a .env file
        pattern: /^[A-Z][A-Z0-9_]{2,}=.{1,200}$/m,
        baseRisk: 0.70,
        description: 'Environment variable file (.env)',
    },
    {
        type: 'ssn',
        // US Social Security Number — requires context boost to avoid false positives
        pattern: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/,
        baseRisk: 0.60,
        description: 'US Social Security Number',
    },
    {
        type: 'credit_card',
        // Visa, Mastercard, Amex — validated later with Luhn check
        pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/,
        baseRisk: 0.80,
        description: 'Credit / debit card number',
    },
    {
        type: 'bulk_email',
        // 5+ distinct-looking email addresses — indicates bulk PII, not a single contact
        pattern: /(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        baseRisk: 0.65,
        description: 'Bulk email addresses (potential PII export)',
    },
];
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