import { test, expect } from '../fixtures/auth';

test.describe('Child Management', () => {
  test('create a child profile and verify it appears', async ({ authenticatedPage: page }) => {
    const childName = `TestBaby-${Date.now()}`;

    // Navigate to the create child page
    await page.goto('/');

    // Look for a "Add child" / "Create child" link or button
    const addChildLink = page
      .getByRole('link', { name: /add child|create child|new child|add baby/i })
      .or(page.getByRole('button', { name: /add child|create child|new child|add baby/i }));

    if (await addChildLink.isVisible()) {
      await addChildLink.click();
    } else {
      // Fall back to direct navigation
      await page.goto('/children/new');
    }

    // Fill in the child name field
    await page.getByLabel(/name/i).fill(childName);

    // Fill in date of birth — use a date ~6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dob = sixMonthsAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    const dobField = page.getByLabel(/date of birth|birthday|born/i).first();
    if (await dobField.isVisible()) {
      await dobField.fill(dob);
    }

    // Select gender if present
    const genderSelect = page.getByLabel(/gender|sex/i).first();
    if (await genderSelect.isVisible()) {
      await genderSelect.selectOption({ index: 1 });
    }

    // Submit the form
    await page.getByRole('button', { name: /save|create|add|submit/i }).click();

    // After saving, the child name should appear somewhere on the page
    await expect(page.getByText(childName)).toBeVisible({ timeout: 10_000 });
  });
});
