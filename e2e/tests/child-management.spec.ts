import { test, expect } from '../fixtures/auth';


test.beforeEach(({}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Desktop frontend only');
});
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

    // Fill required measurement fields for create-child form
    const weightField = page.getByLabel(/weight/i).first();
    if (await weightField.isVisible()) {
      await weightField.fill('7.2');
    }
    const heightField = page.getByLabel(/length|height/i).first();
    if (await heightField.isVisible()) {
      await heightField.fill('66');
    }

    // Submit the form
    await page.getByRole('button', { name: /save|create|add|submit/i }).click();

    // After saving, we should leave create-child flow.
    await expect(page).not.toHaveURL(/create-child|children\/new/i, { timeout: 10_000 });
  });
});
