import type { DetectionResult } from '../detection/rules.js';

const BANNER_ID = 'guardprompt-warning-banner';

const RULE_LABELS: Record<string, string> = {
  aws_access_key:       'AWS Access Key',
  github_token:         'GitHub Token',
  openai_key:           'OpenAI API Key',
  stripe_key:           'Stripe Secret Key',
  jwt_token:            'JWT Token',
  private_key_pem:      'Private Key (PEM)',
  db_connection_string: 'Database Credentials',
  env_file:             'Environment File (.env)',
  ssn:                  'Social Security Number',
  credit_card:          'Credit Card Number',
  bulk_email:           'Bulk Email Addresses',
};

export function showWarningBanner(
  result: DetectionResult,
  onSendAnyway: () => void,
  onDismiss: () => void,
): void {
  removeWarningBanner();

  const detectedTypes = result.matches
    .map(m => RULE_LABELS[m.ruleType] ?? m.ruleType)
    .join(', ');

  const accentColor = '#E67E22';
  const headline = 'GuardPrompt detected sensitive data';

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.setAttribute('role', 'alert');
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
    animation: guardprompt-slide-in 0.2s ease-out;
  `;

  banner.innerHTML = `
    <style>
      @keyframes guardprompt-slide-in {
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
      <span style="font-size:20px; flex-shrink:0">⚠️</span>
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
      <button id="gp-close-x" style="background:transparent; color:#666; font-size:18px; padding:0 4px; align-self:flex-start; margin-top:-4px;">×</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Event handlers
  document.getElementById('gp-dismiss')?.addEventListener('click', () => {
    removeWarningBanner();
    onDismiss();
  });

  document.getElementById('gp-close-x')?.addEventListener('click', () => {
    removeWarningBanner();
    onDismiss();
  });

  document.getElementById('gp-send-anyway')?.addEventListener('click', () => {
    removeWarningBanner();
    onSendAnyway();
  });

  document.getElementById('gp-send-anyway-override')?.addEventListener('click', () => {
    removeWarningBanner();
    onSendAnyway();
  });

  // Auto-dismiss after 12 seconds
  setTimeout(() => removeWarningBanner(), 12_000);
}

export function removeWarningBanner(): void {
  document.getElementById(BANNER_ID)?.remove();
}
