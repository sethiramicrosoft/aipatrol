/**
 * Unit tests for the detection pipeline — runs with Jest, no browser needed.
 */

// For Jest (CommonJS), we import directly without .js extensions
// The tsconfig.test.json handles this
const { runDetectionPipeline } = require('../dist-test/detection/pipeline');

describe('Detection Pipeline', () => {

  // ── AWS Access Keys ─────────────────────────────────────────────────────
  describe('AWS Access Keys', () => {
    test('detects a real-format AWS access key', () => {
      // AKIA + exactly 16 uppercase alphanumeric chars, followed by a word boundary
      const result = runDetectionPipeline('My key is AKIAIOSFODNN7EXAMPLE here');
      expect(result.matches.some((m) => m.ruleType === 'aws_access_key')).toBe(true);
    });

    test('blocks a real AWS key in a code paste', () => {
      const code = `
        const s3 = new AWS.S3();
        const creds = { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' };
      `;
      const result = runDetectionPipeline(code);
      expect(result.action).toBe('WARN');
    });

    test('does not flag placeholder text', () => {
      const result = runDetectionPipeline(
        'Replace YOUR_AWS_KEY with your actual AKIAIOSFODNN7EXAMPLE key'
      );
      // example_language_detected should lower the score (but entropy boost partially offsets)
      expect(result.riskScore).toBeLessThan(0.85);
    });
  });

  // ── Private Keys ────────────────────────────────────────────────────────
  describe('Private Keys', () => {
    test('detects PEM private key header', () => {
      const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...';
      const result = runDetectionPipeline(pem);
      expect(result.action).toBe('WARN');
      expect(result.matches.some((m) => m.ruleType === 'private_key_pem')).toBe(true);
    });

    test('detects EC private key', () => {
      const result = runDetectionPipeline('-----BEGIN EC PRIVATE KEY-----\nMHQCAQEE...');
      expect(result.action).toBe('WARN');
    });
  });

  // ── Database Connection Strings ─────────────────────────────────────────
  describe('Database Connection Strings', () => {
    test('detects PostgreSQL connection string with credentials', () => {
      const result = runDetectionPipeline('postgresql://admin:supersecret@prod.db.acme.com:5432/appdb');
      expect(result.action).toBe('WARN');
    });

    test('detects MongoDB connection string', () => {
      const result = runDetectionPipeline('mongodb+srv://user:p4ssw0rd@cluster0.abc.mongodb.net/mydb');
      expect(result.action).toBe('WARN');
    });

    test('does not flag connection strings without credentials', () => {
      const result = runDetectionPipeline('postgresql://localhost:5432/mydb');
      expect(result.action).toBe('ALLOW');
    });
  });

  // ── GitHub Tokens ────────────────────────────────────────────────────────
  describe('GitHub Tokens', () => {
    test('detects GitHub PAT (ghp_)', () => {
      const result = runDetectionPipeline('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij');
      expect(result.matches.some((m) => m.ruleType === 'github_token')).toBe(true);
    });
  });

  // ── Credit Cards ─────────────────────────────────────────────────────────
  describe('Credit Cards', () => {
    test('detects a valid Visa card number (Luhn-valid)', () => {
      // 4111111111111111 is the standard test Visa number — Luhn valid
      const result = runDetectionPipeline('4111111111111111');
      expect(result.matches.some((m) => m.ruleType === 'credit_card')).toBe(true);
    });

    test('does not flag a random 16-digit number that fails Luhn', () => {
      const result = runDetectionPipeline('4111111111111112'); // Luhn invalid
      // Should be ALLOW or low risk after Luhn failure
      if (result.matches.some((m) => m.ruleType === 'credit_card')) {
        expect(result.riskScore).toBeLessThan(0.75);
      } else {
        expect(result.action).toBe('ALLOW');
      }
    });
  });

  // ── Env Files ────────────────────────────────────────────────────────────
  describe('Environment Files', () => {
    test('detects a multi-line .env file paste', () => {
      const env = `
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=abc123xyz789supersecret
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG
STRIPE_SECRET_KEY=sk_live_abc123
      `.trim();
      const result = runDetectionPipeline(env);
      expect(result.action).toBe('WARN');
    });
  });

  // ── Bulk Emails ─────────────────────────────────────────────────────────
  describe('Bulk Emails', () => {
    test('warns on 5+ distinct email addresses', () => {
      const text = `
john@example.com, jane@company.org, bob@acme.io,
alice@startup.co, dave@corp.net, eve@demo.com
      `;
      const result = runDetectionPipeline(text);
      expect(result.action).not.toBe('ALLOW');
    });

    test('allows text with fewer than 5 emails', () => {
      const result = runDetectionPipeline('Contact me at john@example.com or jane@company.org');
      expect(result.action).toBe('ALLOW');
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────
  describe('Edge cases', () => {
    test('allows very short text', () => {
      const result = runDetectionPipeline('Hello world');
      expect(result.action).toBe('ALLOW');
    });

    test('allows normal code without secrets', () => {
      const code = `
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
      `;
      const result = runDetectionPipeline(code);
      expect(result.action).toBe('ALLOW');
    });

    test('allows empty input', () => {
      const result = runDetectionPipeline('');
      expect(result.action).toBe('ALLOW');
    });
  });

});
