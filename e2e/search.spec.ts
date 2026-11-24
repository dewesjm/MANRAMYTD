import { expect, test } from './pages';

test('search a department, then a pernr, and go Back', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Department').selectOption('X11');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\?department=X11$/);
  const grid = page.getByRole('region', { name: 'Dose grid' });
  await expect(grid.locator('tbody tr').first()).toBeVisible();
  expect(await grid.locator('tbody tr').count()).toBeGreaterThan(5);

  await page.getByLabel('Department').selectOption('');
  await page.getByLabel('Pernr').fill('10062740');
  await page.getByLabel('Pernr').press('Enter');
  await expect(page).toHaveURL(/\?pernr=10062740$/);
  await expect(grid.locator('tbody tr')).toHaveCount(1);
  await expect(grid).toContainText('Haddad, Umar');

  await page.goBack();
  await expect(page.getByLabel('Department')).toHaveValue('X11');
  await expect(page.getByLabel('Pernr')).toHaveValue('');
});
