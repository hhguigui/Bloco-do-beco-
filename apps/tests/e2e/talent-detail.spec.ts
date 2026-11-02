import { test, expect } from '@playwright/test';

test.describe('Talent Detail Page', () => {
  test('should show participation form for approved talents', async ({ page }) => {
    // First, get a list of talents to find an approved one
    await page.goto('/talentos');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="talent-card"]', { timeout: 5000 });

    // Click on the first talent card to go to detail page
    const firstCard = page.locator('[data-testid="talent-card"]').first();
    await firstCard.click();

    // Wait for detail page to load
    await page.waitForSelector('[data-testid="talent-name"]', { timeout: 5000 });

    // Check for participation form (should be visible for approved talents)
    const participationForm = page.locator('[data-testid="participation-form"]');
    await expect(participationForm).toBeVisible();
  });
});
