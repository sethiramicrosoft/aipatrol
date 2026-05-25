import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '../dist');

test('DIAG: is content script injecting?', async () => {
  const context = await chromium.launchPersistentContext('', {
    channel: 'msedge',
    headless: false,
    args: [
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();

  // Capture all console messages from the page
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

  await page.goto('http://localhost:7474');
  await page.waitForTimeout(1500);

  // Check if send button has data-gp-hooked (set by content script)
  const hooked = await page.locator('[data-testid="send-button"]').getAttribute('data-gp-hooked');
  console.log('Button hooked attr:', hooked);
  console.log('Console logs:', JSON.stringify(logs, null, 2));

  // Check what extensions are loaded
  const swPage = await context.newPage();
  await swPage.goto('edge://extensions');
  await swPage.waitForTimeout(500);
  const title = await swPage.title();
  console.log('Extensions page title:', title);

  await context.close();
});
