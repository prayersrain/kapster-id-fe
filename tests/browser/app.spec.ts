import { test, expect, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function login(page: Page, role: string) {
  const accounts = JSON.parse(await readFile(resolve(process.env.E2E_DIR!, 'accounts.json'), 'utf8'));
  const account = accounts.find((a: any) => a.role === role);
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ringkasan', exact: true })).toBeVisible();
}

test('public booking feeds cashier, cash payment and close shift persist on refresh', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/owner');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/booking');
  await page.getByRole('button', { name: /Garasi Barber Tebet/ }).click();
  await page
    .getByRole('button', { name: /Haircut/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Raka/ }).click();
  const tomorrow = new Date(Date.now() + 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  await page.getByLabel('Tanggal kunjungan (WIB)').fill(tomorrow);
  await expect(page.locator('.slots button').first()).toBeVisible();
  await page.locator('.slots button').first().click();
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.getByLabel('Nama lengkap').fill('Customer Browser');
  await page.getByLabel('Nomor WhatsApp').fill('081298765432');
  await page.getByRole('button', { name: 'Periksa booking' }).click();
  await page.getByRole('button', { name: 'Konfirmasi booking · Bayar di outlet' }).click();
  await expect(page).toHaveURL(/\/booking\/status\/[a-f0-9]{64}$/);
  await expect(page.getByText('Customer Browser', { exact: true })).toBeVisible();
  await expect(page.getByText('Belum dibayar · tunai di outlet', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/booking-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 850 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/booking-mobile.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 950 });
  await login(page, 'cashier');
  await page.getByRole('button', { name: '＋ Buka shift', exact: true }).click();
  await page.getByLabel('Modal kas awal').fill('100000');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: /Antrean & Booking/ }).click();
  const row = page.getByRole('row').filter({ hasText: 'Customer Browser' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(row.getByText('Sudah datang', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Mulai', exact: true }).click();
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(row.getByText('Sedang dilayani', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Bayar tunai', exact: true }).click();
  await page.getByLabel('Uang diterima').fill('100000');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(row.getByText('Tunai tercatat', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Selesai', exact: true }).click();
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(row.getByText('Selesai', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Customer Browser', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Tutup shift');
  await page.getByRole('link', { name: /Shift Kasir/ }).click();
  await page.getByRole('button', { name: 'Tutup shift', exact: true }).click();
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test('Owner navigation, forms, mobile layout and protected role routes', async ({ page }) => {
  await login(page, 'owner');
  await page.getByRole('link', { name: /Layanan/, exact: false }).click();
  await page.getByRole('button', { name: '＋ Tambah layanan' }).click();
  await page.getByLabel('Nama layanan').fill('Layanan Browser');
  await page.getByLabel('Harga', { exact: true }).fill('75000');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByText('Layanan Browser', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Layanan Browser', { exact: true })).toBeVisible();
  const routes = [
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
    'onboarding',
    'settings',
  ];
  for (const route of routes) {
    await page.goto(`/owner/${route}`);
    await expect(page.locator('.workspace-content h1')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
  await page.goto('/owner');
  await page.screenshot({ path: 'test-results/owner-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 850 });
  for (const route of ['', 'bookings', 'services', 'barbers', 'cashiers', 'reports']) {
    await page.goto(`/owner/${route}`);
    await expect(page.locator('.workspace-content h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Buka navigasi' }).click();
  await expect(page.locator('.sidebar')).toHaveClass(/open/);
  await page.getByRole('link', { name: /Ringkasan/ }).click();
  await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  await expect
    .poll(() => page.locator('.sidebar').evaluate((el) => el.getBoundingClientRect().right))
    .toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/owner-mobile.png', fullPage: true, animations: 'disabled' });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/owner$/);
});

test('Admin actions and internal files never exposed through web server', async ({ page, request }) => {
  const workspace = process.cwd().replaceAll('\\', '/');
  for (const url of [
    `/@fs/${workspace}/.local/accounts.json`,
    `/@fs/${workspace}/docs/design/MockupUI/booking-mockup.html`,
  ]) {
    const response = await request.get(url);
    expect(response.status()).toBe(403);
  }
  await login(page, 'admin');
  await page.getByRole('link', { name: /Bisnis & Approval/ }).click();
  await expect(page.getByText('Garasi Barber', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tangguhkan', exact: true }).click();
  await page.getByLabel('Alasan').fill('Uji tangguhkan bisnis lokal');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByText('Ditangguhkan', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Setujui', exact: true }).click();
  await page.getByLabel('Alasan').fill('Selesai pengujian lokal');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByText('Disetujui', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Audit & Keamanan/ }).click();
  await expect(page.getByText('org.suspended', { exact: true }).first()).toBeVisible();
});

test('new Owner registers, verifies, completes setup, receives approval and publishes booking', async ({
  page,
}) => {
  test.setTimeout(90000);
  const email = 'new-owner-browser@example.test',
    password = 'BrowserOwnerPassword123';
  await page.goto('/register');
  await page.getByLabel('Nama Owner').fill('Owner Browser Baru');
  await page.getByLabel('Nama bisnis').fill('Barber Browser Baru');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: false }).first().fill(password);
  await page.getByLabel('Ulangi password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Akun dibuat');
  const mails = (await readFile(resolve(process.env.E2E_DIR!, 'mail.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  const verification = mails.find((mail: any) => mail.to === email && mail.kind === 'verify');
  await page.goto(verification.url);
  await page.getByRole('button', { name: 'Verifikasi email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Email terverifikasi');
  async function ownerLogin() {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ringkasan', exact: true })).toBeVisible();
  }
  await ownerLogin();
  await page
    .getByRole('link', { name: /Outlet$/, exact: false })
    .first()
    .click();
  await page.getByRole('button', { name: '＋ Tambah outlet' }).click();
  await page.getByLabel('Nama outlet').fill('Outlet Browser Baru');
  await page.getByLabel('Alamat', { exact: true }).fill('Jl. Uji Browser Jakarta');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: /Layanan/ }).click();
  await page.getByRole('button', { name: '＋ Tambah layanan' }).click();
  await page.getByLabel('Nama layanan').fill('Potong Browser Baru');
  await page.getByLabel('Harga', { exact: true }).fill('55000');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: /Kapster & Jadwal/ }).click();
  await page.getByRole('button', { name: '＋ Tambah kapster' }).click();
  await page.getByLabel('Nama kapster').fill('Kapster Browser Baru');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: /Setup Bisnis/ }).click();
  await page.getByRole('button', { name: 'Ajukan approval' }).click();
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByText('Menunggu review', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, 'admin');
  const row = page.getByRole('row').filter({ hasText: 'Barber Browser Baru' });
  await row.getByText('Detail setup', { exact: true }).click();
  await expect(row.getByText(/Potong Browser Baru/)).toBeVisible();
  await row.getByRole('button', { name: 'Setujui', exact: true }).click();
  await page.getByLabel('Alasan').fill('Setup bisnis lengkap dan sudah diperiksa');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(row.getByText('Disetujui', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await ownerLogin();
  await page
    .getByRole('link', { name: /Outlet$/, exact: false })
    .first()
    .click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Terbitkan booking publik').check();
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.goto('/booking');
  await page.getByRole('button', { name: /Outlet Browser Baru/ }).click();
  await expect(page.getByRole('button', { name: /Potong Browser Baru/ })).toBeVisible();
});
