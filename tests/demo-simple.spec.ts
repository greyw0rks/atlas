import { test } from '@playwright/test';

/**
 * Simple Atlas Demo Video
 * Records the current Atlas UI showing the architecture
 */

// Configure video recording at top level
test.use({
  video: 'on',
  viewport: { width: 1920, height: 1080 }
});

test('Atlas UI Demo', async ({ page }) => {
  test.setTimeout(120000);

  // 1. Homepage
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 2. Show the form
  await page.waitForTimeout(2000);

  // 3. Enter an example address
  const addressInput = page.locator('input[type="text"]');
  await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  await page.waitForTimeout(2000);

  // 4. Hover over trace button
  const traceButton = page.locator('button:has-text("Trace")');
  await traceButton.hover();
  await page.waitForTimeout(1500);

  // 5. Show the UI is ready
  await page.waitForTimeout(2000);

  // 6. Clear and show another address
  await addressInput.clear();
  await page.waitForTimeout(1000);
  await addressInput.fill('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  await page.waitForTimeout(2000);

  // 7. Final pause
  await page.waitForTimeout(3000);
});
