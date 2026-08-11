import { test, expect } from '@playwright/test';

/**
 * Atlas Demo Video Script
 * Records a <3min walkthrough showing CockroachDB agentic memory in action
 *
 * Flow:
 * 1. Show homepage with example addresses
 * 2. Trace an address (demonstrates memory writes to CockroachDB)
 * 3. View investigation results (demonstrates memory retrieval)
 * 4. Show vector similarity search (demonstrates distributed vector indexing)
 * 5. Generate AI narrative via Bedrock (demonstrates AWS integration)
 */

// Configure video recording at top level
test.use({
  video: {
    mode: 'on',
    size: { width: 1920, height: 1080 }
  },
  viewport: { width: 1920, height: 1080 }
});

test.describe('Atlas Demo - CockroachDB Agentic Memory', () => {
  test('Full demo walkthrough', async ({ page }) => {
    // Slower actions for better video recording
    test.slow();

    // 1. Homepage - show the landing
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 2. Enter example address
    const exampleAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    await page.fill('input[type="text"]', exampleAddress);
    await page.waitForTimeout(1000);

    // 3. Trace the address (memory write to CockroachDB)
    await page.click('button:has-text("Trace")');
    await page.waitForTimeout(1500);

    // Wait for investigation to complete
    await page.waitForSelector('text=Investigation Complete', { timeout: 60000 });
    await page.waitForTimeout(2000);

    // 4. View results - memory retrieval from CockroachDB
    const txCount = await page.locator('[data-testid="tx-count"]').textContent();
    const chainCount = await page.locator('[data-testid="chain-count"]').textContent();

    console.log(`Found ${txCount} transactions across ${chainCount} chains`);
    await page.waitForTimeout(3000);

    // 5. Scroll through transaction history
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(2000);

    // 6. Show bridge activity if present
    const bridgeSection = page.locator('[data-testid="bridge-activity"]');
    if (await bridgeSection.isVisible()) {
      await bridgeSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);
    }

    // 7. Trigger vector similarity search
    await page.click('button:has-text("Find Similar")');
    await page.waitForTimeout(1500);
    await page.waitForSelector('[data-testid="similar-addresses"]', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 8. Generate AI narrative via Bedrock
    await page.click('button:has-text("Generate Report")');
    await page.waitForTimeout(1500);
    await page.waitForSelector('[data-testid="ai-narrative"]', { timeout: 30000 });
    await page.waitForTimeout(4000);

    // 9. Scroll to show full narrative
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(3000);

    // Final pause to show completed investigation
    await page.waitForTimeout(2000);
  });
});
