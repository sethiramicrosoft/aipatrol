import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '../dist');

async function launchWithExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-test-'));
  return chromium.launchPersistentContext(userDataDir, {
    channel: 'msedge',
    headless: false,
    args: [
      `--load-extension=${extensionPath}`,
      `--disable-extensions-except=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    permissions: ['clipboard-read', 'clipboard-write'],
  });
}

async function pasteAndExpectBanner(page, text, timeoutMs = 6000) {
  await page.click('body');
  await page.evaluate((t) => navigator.clipboard.writeText(t), text);
  await page.keyboard.press('Control+V');
  await expect(page.locator('#guardprompt-warning-banner')).toBeVisible({ timeout: timeoutMs });
}

const PLATFORMS = [
  { name: 'Claude',       url: 'https://claude.ai' },
  { name: 'ChatGPT',      url: 'https://chat.openai.com' },
  { name: 'Gemini',       url: 'https://gemini.google.com' },
  { name: 'Perplexity',   url: 'https://www.perplexity.ai' },
  { name: 'Copilot',      url: 'https://copilot.microsoft.com' },
];

const PAYLOADS = [
  { label: 'AWS key',        text: 'AKIAIOSFODNN7EXAMPLE' },
  { label: 'Private key',    text: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...' },
  { label: 'DB connection',  text: 'postgresql://admin:s3cr3t@prod.db.company.com:5432/appdb' },
];

for (const platform of PLATFORMS) {
  for (const payload of PAYLOADS) {
    test(`[${platform.name}] blocks ${payload.label} on paste`, async () => {
      const context = await launchWithExtension();
      const page = await context.newPage();
      await page.goto(platform.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      await pasteAndExpectBanner(page, payload.text);

      // Also verify "Send anyway" dismisses the banner
      await page.locator('#guardprompt-warning-banner button#gp-send-anyway').click();
      await expect(page.locator('#guardprompt-warning-banner')).toBeHidden({ timeout: 3000 });

      await context.close();
    });
  }
}
