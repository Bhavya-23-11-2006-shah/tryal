// Playwright E2E tests for SaathiBus (Phase D)
import { test, expect } from '@playwright/test';

// Helper to capture screenshots in docs/evidence
const screenshot = async (page, name: string) => {
  await page.screenshot({ path: `../docs/evidence/${name}.png`, fullPage: true });
};

// Four personas (seeded users) will use the same UI flow
const personas = [
  { name: 'Asha', from: 'Esplanade', to: 'Salt Lake Sector V' },
  { name: 'Rohan', from: 'Howrah Station', to: 'Airport Gate 1' },
  { name: 'Meera', from: 'Esplanade', to: 'Science City' },
  { name: 'Dev', from: 'New Town Bus Terminus', to: 'Esplanade' },
];

test.describe('SaathiBus full booking flow', () => {
  test.beforeAll(async () => {
    // Ensure docs/evidence folder exists
    const fs = require('fs');
    if (!fs.existsSync('../docs/evidence')) {
      fs.mkdirSync('../docs/evidence', { recursive: true });
    }
  });

  for (const p of personas) {
    test(`booking flow for ${p.name}`, async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/$/);
      await screenshot(page, `${p.name}-home`);

      // Input origin and destination
      await page.fill('[data-testid="origin-input"]', p.from);
      await page.fill('[data-testid="dest-input"]', p.to);
      await page.click('[data-testid="search-button"]');
      await page.waitForSelector('[data-testid="trip-card"]');
      await screenshot(page, `${p.name}-search-results`);

      // Choose earlier bus (first card)
      await page.click('[data-testid="trip-card"] >> nth=0');
      await page.click('[data-testid="confirm-button"]');
      await page.waitForSelector('[data-testid="ticket-page"]');
      await screenshot(page, `${p.name}-ticket`);

      // Conductor alert flow
      await page.click('[data-testid="conductor-alert"]');
      await page.waitForSelector('[data-testid="alert-confirmed"]');
      await screenshot(page, `${p.name}-conductor-alert`);

      // Cancel booking
      await page.click('[data-testid="cancel-booking"]');
      await page.waitForSelector('[data-testid="cancel-confirmed"]');
      await screenshot(page, `${p.name}-cancelled`);
    });
  }

  test('SOS and unknown place handling', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="origin-input"]', 'Esplanade');
    await page.fill('[data-testid="dest-input"]', 'Gotham'); // unknown location
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('[data-testid="error-message"]').first()).toContainText('not part of Kolkata');
    await screenshot(page, `unknown-location`);

    // SOS flow
    await page.click('[data-testid="sos-button"]');
    await expect(page.locator('[data-testid="sos-confirmed"]')).toBeVisible();
    await screenshot(page, `sos-triggered`);
  });
});
