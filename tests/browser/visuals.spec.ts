import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('all restored screens render on desktop and phone without page overflow', async ({ page }) => {
  test.setTimeout(300000);
  const accounts = JSON.parse(await readFile(resolve(process.env.E2E_DIR!, 'accounts.json'), 'utf8'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const routes = {
    owner: [
      '',
      'bookings',
      'calendar',
      'transactions',
      'reports',
      'outlets',
      'barbers',
      'services',
      'customers',
      'cashiers',
      'settings',
      'onboarding',
      'approval',
      'subscription',
      'new',
    ],
    cashier: ['', 'bookings', 'transactions', 'customers', 'shifts', 'settings', 'new'],
    admin: [
      '',
      'tenants',
      'tenant-detail',
      'onboarding',
      'subscription',
      'operations',
      'support',
      'analytics',
      'audit',
      'settings',
    ],
  };
  for (const role of ['owner', 'cashier', 'admin'] as const) {
    const account = accounts.find((a: any) => a.role === role);
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.locator('.live-workspace h1')).toBeVisible();
    const base = role === 'cashier' ? '/kasir' : '/' + role;
    for (const size of [
      { width: 1536, height: 1024 },
      { width: 390, height: 850 },
    ]) {
      await page.setViewportSize(size);
      for (const route of routes[role]) {
        await page.goto(`${base}/${route}`);
        await expect(page.locator('.live-workspace h1, .restored-flow h1')).toBeVisible();
        await expect(page.getByText(/Memuat data (operasional|platform)/)).toHaveCount(0);
        await expect(page.getByRole('alert')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (await page.locator('.live-workspace').count()) {
          expect(
            await page.locator('.live-workspace').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          ).toBe(true);
        }
        await page.screenshot({
          path: `test-results/visual-${role}-${route || 'dashboard'}-${size.width}.png`,
          animations: 'disabled',
        });
      }
    }
    await page.goto(base);
    await page.getByRole('button', { name: 'Keluar', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
  }
  await page.goto('/booking');
  await expect(page.getByRole('heading', { name: 'Pilih outlet', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/visual-booking-home-390.png', animations: 'disabled' });
  await page.goto('/login');
  await page.screenshot({ path: 'test-results/visual-auth-390.png', animations: 'disabled' });
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.screenshot({ path: 'test-results/visual-auth-1536.png', animations: 'disabled' });
  expect(errors).toEqual([]);
});
