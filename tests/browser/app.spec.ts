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
  await expect(page.locator('.live-workspace h1')).toBeVisible();
}

test('public booking feeds cashier, cash payment and close shift persist on refresh', async ({ page }) => {
  const errors: string[] = [];
  const capture = (step: string) =>
    page.screenshot({ path: `test-results/booking-step-${step}.png`, animations: 'disabled' });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/owner');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/booking');
  await expect(page.getByRole('heading', { name: 'Buka link booking barbershop Anda' })).toBeVisible();
  // A pasted outlet link must keep the outlet segment.
  await page
    .getByLabel('Link atau nama barbershop')
    .fill('http://127.0.0.1:5173/booking/garasi-barber/tebet');
  await page.getByRole('button', { name: /Buka halaman booking/ }).click();
  await expect(page).toHaveURL(/\/booking\/garasi-barber\/tebet$/);
  await expect(page.getByRole('heading', { name: 'Garasi Barber', exact: true })).toBeVisible();
  // A shop with one outlet opens with that outlet already selected.
  await expect(page.getByRole('button', { name: /^Garasi Barber Tebet/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await capture('outlet');
  await page.getByRole('button', { name: /Lanjut di/ }).click();
  await page
    .getByRole('button', { name: /Haircut/ })
    .first()
    .click();
  await capture('layanan');
  await page.getByRole('button', { name: 'Pilih Kapster', exact: false }).click();
  await page.getByRole('button', { name: /Raka/ }).click();
  await capture('kapster');
  await page.getByRole('button', { name: 'Pilih Jadwal', exact: false }).click();
  const tomorrow = new Date(Date.now() + 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  await expect(page.locator('.booking-dates input[type="date"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tujuh hari berikutnya', exact: true }).click();
  const nextWeek = new Date(Date.now() + 7 * 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  await expect(page.getByRole('button', { name: new RegExp(`^Tanggal ${nextWeek}:`) })).toBeVisible();
  for (let week = 0; week < 3; week++)
    await page.getByRole('button', { name: 'Tujuh hari berikutnya', exact: true }).click();
  const lastDay = new Date(Date.now() + 30 * 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  await expect(page.getByRole('button', { name: new RegExp(`^Tanggal ${lastDay}:`) })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tujuh hari berikutnya', exact: true })).toBeDisabled();
  for (let week = 0; week < 4; week++)
    await page.getByRole('button', { name: 'Tujuh hari sebelumnya', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`^Tanggal ${tomorrow}:`) }).click();
  await expect(page.locator('[class*=timeGrid] button').first()).toBeVisible();
  await page.locator('[class*=timeGrid] button').first().click();
  await capture('jadwal');
  await page.getByRole('button', { name: /Isi Data Booking/ }).click();
  await page.getByLabel('Nama lengkap').fill('Customer Browser');
  await page.getByLabel('Nomor WhatsApp').fill('081298765432');
  await capture('customer');
  await page.getByRole('button', { name: 'Periksa booking' }).click();
  await capture('review');
  await page.getByRole('button', { name: 'Konfirmasi booking · Bayar di outlet' }).click();
  await expect(page).toHaveURL(/\/booking\/status\/[a-f0-9]{64}$/);
  await expect(page.getByText('Customer Browser', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Belum dibayar · tunai di outlet', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/booking-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 850 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/booking-mobile.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 950 });
  await login(page, 'cashier');
  await page.locator('aside nav').getByRole('button', { name: 'Shift Kasir', exact: true }).click();
  await page.getByRole('button', { name: 'Buka Shift Kasir', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Hitung uang di laci');
  await page.getByLabel('Modal kas awal').fill('100000');
  await page.getByRole('dialog').getByRole('button', { name: 'Buka shift', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Shift dibuka' })).toBeVisible();
  await page.locator('aside nav').getByRole('button', { name: 'Antrean', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'Customer Browser' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Check-in', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Customer Browser');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Ya, customer sudah datang', exact: true })
    .click();
  await expect(row.getByText('Sudah datang', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Mulai layanan', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Mulai sekarang', exact: true }).click();
  await expect(row.getByText('Sedang dilayani', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Bayar tunai', exact: true }).click();
  await page.getByLabel('Uang diterima').fill('100000');
  await expect(page.getByRole('dialog')).toContainText('Kembalian');
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan pembayaran', exact: true }).click();
  await expect(row.getByText('Lunas', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Selesai', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tandai selesai', exact: true }).click();
  await expect(row.getByText('Selesai', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Customer Browser', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Tutup shift');
  await page.locator('aside nav').getByRole('button', { name: 'Shift Kasir', exact: true }).click();
  await page.getByRole('button', { name: 'Tutup shift', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tutup shift', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test('Owner navigation, forms, mobile layout and protected role routes', async ({ page }) => {
  await login(page, 'owner');
  await page.locator('aside nav').getByRole('button', { name: 'Layanan', exact: true }).click();
  await page.getByRole('button', { name: '＋ Tambah layanan' }).click();
  await page.getByLabel('Nama layanan').fill('Layanan Browser');
  await page.getByLabel('Harga', { exact: true }).fill('75000');
  await page.getByRole('dialog').getByRole('button', { name: 'Tambah layanan', exact: true }).click();
  await expect(page.getByText('Layanan Browser', { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('Layanan Browser', { exact: true }).first()).toBeVisible();
  await page.locator('aside nav').getByRole('button', { name: 'Kapster', exact: true }).click();
  await page.getByRole('button', { name: '＋ Tambah kapster' }).click();
  await page.getByLabel('Nama kapster').fill('Kapster Jadwal');
  await page.getByRole('button', { name: '10–20' }).click();
  await page.getByRole('button', { name: 'Min', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Setiap hari · 10:00–20:00 WIB');
  await page.getByRole('dialog').getByRole('button', { name: 'Tambah kapster', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Kapster Jadwal' })).toContainText('Setiap hari');
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
    await expect(page.locator('.live-workspace h1, .restored-flow h1')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
  await page.goto('/owner');
  await page.screenshot({ path: 'test-results/owner-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 850 });
  for (const route of ['', 'bookings', 'services', 'barbers', 'cashiers', 'reports']) {
    await page.goto(`/owner/${route}`);
    await expect(page.locator('.live-workspace h1, .restored-flow h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Buka navigasi' }).click();
  await expect(page.locator('.restored-workspace > aside')).toHaveClass(/sidebarOpen/);
  await page.locator('aside nav').getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.restored-workspace > aside')).not.toHaveClass(/sidebarOpen/);
  await expect
    .poll(() =>
      page.locator('.restored-workspace > aside').evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/owner-mobile.png', fullPage: true, animations: 'disabled' });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/owner$/);
});

test('landscape tablet touch: rail menu, row actions, reschedule and booking drawer', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const headers = { 'X-Kapster-Request': '1', Origin: 'http://127.0.0.1:5173' };
  const shop = await (await page.request.get('/api/public/shops/garasi-barber')).json();
  const outletId = shop.outlets[0].id,
    serviceId = shop.services[0].id,
    barberId = shop.barbers[0].id;
  const date = new Date(Date.now() + 2 * 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  const { slots } = await (
    await page.request.get(
      `/api/public/slots?${new URLSearchParams({ outletId, serviceId, barberId, date })}`,
    )
  ).json();
  expect(slots.length).toBeGreaterThan(1);
  const created = await page.request.post('/api/public/bookings', {
    headers,
    data: {
      outletId,
      serviceId,
      barberId,
      date,
      time: slots[0],
      name: 'Customer Tablet',
      phone: '081277788899',
    },
  });
  expect(created.status()).toBe(201);
  await login(page, 'owner');
  const rail = page.locator('.restored-workspace > aside');
  expect((await rail.boundingBox())!.width).toBeLessThan(120);
  await page.getByRole('button', { name: 'Buka navigasi' }).tap();
  await expect(rail).toHaveClass(/sidebarOpen/);
  await page.locator('aside nav').getByRole('button', { name: 'Booking', exact: true }).tap();
  await expect(page).toHaveURL(/\/owner\/bookings$/);
  await expect(rail).not.toHaveClass(/sidebarOpen/);
  const row = page.getByRole('row').filter({ hasText: 'Customer Tablet' });
  await row.getByRole('button', { name: 'Tindakan lain untuk Customer Tablet' }).tap();
  await page.getByRole('menuitem', { name: 'Ubah jadwal', exact: true }).tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(`${slots[0]} WIB`);
  const times = dialog.getByRole('group', { name: 'Pilih jam' });
  await expect(times.getByRole('button', { name: /saat ini/ })).toBeDisabled();
  const next = times.getByRole('button', { disabled: false }).first();
  const newTime = (await next.textContent())!.trim();
  await next.tap();
  await dialog.getByRole('button', { name: 'Permintaan customer' }).tap();
  await dialog.getByRole('button', { name: `Pindahkan ke ${newTime}` }).tap();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Customer Tablet dipindah' })).toBeVisible();
  await expect(row).toContainText(newTime);
  const drawer = page.locator('.detail-drawer');
  await expect(drawer).not.toBeInViewport();
  await row.getByRole('button', { name: 'Detail booking Customer Tablet' }).tap();
  await expect(drawer).toBeInViewport();
  await expect(drawer).toContainText(`${newTime} WIB`);
  await drawer.getByRole('button', { name: 'Tutup detail' }).tap();
  await expect(drawer).not.toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
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
  await page.locator('aside nav').getByRole('button', { name: 'Tenants', exact: true }).click();
  await expect(page.getByText('Garasi Barber', { exact: true }).first()).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: 'Garasi Barber' })
    .getByRole('button', { name: 'Tangguhkan', exact: true })
    .click();
  await page.getByLabel('Alasan').fill('Uji tangguhkan bisnis lokal');
  await page.getByRole('dialog').getByRole('button', { name: 'Tangguhkan', exact: true }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Garasi Barber' }).getByText('Ditangguhkan', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: 'Garasi Barber' })
    .getByRole('button', { name: 'Setujui', exact: true })
    .click();
  await page.getByLabel('Alasan').fill('Selesai pengujian lokal');
  await page.getByRole('dialog').getByRole('button', { name: 'Setujui bisnis', exact: true }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Garasi Barber' }).getByText('Disetujui', { exact: true }),
  ).toBeVisible();
  await page.locator('aside nav').getByRole('button', { name: 'Audit & Security', exact: true }).click();
  await expect(page.getByText('org.suspended', { exact: true }).first()).toBeVisible();
});

test('new Owner registers, verifies, completes setup, receives approval and publishes booking', async ({
  page,
}) => {
  test.setTimeout(120000);
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
  await page.goto(new URL(verification.url).pathname + new URL(verification.url).search);
  await page.getByRole('button', { name: 'Verifikasi email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Email terverifikasi');
  async function ownerLogin() {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.locator('.live-workspace h1')).toBeVisible();
  }
  await ownerLogin();
  await page.locator('aside nav').getByRole('button', { name: 'Outlet', exact: true }).click();
  await page.getByRole('button', { name: '＋ Tambah outlet' }).click();
  await page.getByLabel('Nama outlet').fill('Outlet Browser Baru');
  await page.getByLabel('Alamat', { exact: true }).fill('Jl. Uji Browser Jakarta');
  await page.getByRole('dialog').getByRole('button', { name: 'Tambah outlet', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.locator('aside nav').getByRole('button', { name: 'Layanan', exact: true }).click();
  await page.getByRole('button', { name: '＋ Tambah layanan' }).click();
  await page.getByLabel('Nama layanan').fill('Potong Browser Baru');
  await page.getByLabel('Harga', { exact: true }).fill('55000');
  await page.getByRole('dialog').getByRole('button', { name: 'Tambah layanan', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.locator('aside nav').getByRole('button', { name: 'Kapster', exact: true }).click();
  await page.getByRole('button', { name: '＋ Tambah kapster' }).click();
  await page.getByLabel('Nama kapster').fill('Kapster Browser Baru');
  await page.getByRole('dialog').getByRole('button', { name: 'Tambah kapster', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: /Setup Bisnis/ }).click();
  await page.getByRole('button', { name: 'Ajukan approval' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Kirim untuk review', exact: true }).click();
  await expect(page.getByText('Menunggu review', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Kembali ke Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, 'admin');
  const row = page.getByRole('row').filter({ hasText: 'Barber Browser Baru' });
  await page.locator('aside nav').getByRole('button', { name: 'Tenants', exact: true }).click();
  await row.getByRole('button', { name: 'Detail tenant Barber Browser Baru' }).click();
  await expect(page.locator('aside').getByText(/Potong Browser Baru/)).toBeVisible();
  await row.getByRole('button', { name: 'Setujui', exact: true }).click();
  await page.getByLabel('Alasan').fill('Setup bisnis lengkap dan sudah diperiksa');
  await page.getByRole('dialog').getByRole('button', { name: 'Setujui bisnis', exact: true }).click();
  await expect(row.getByText('Disetujui', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await ownerLogin();
  await page.locator('aside nav').getByRole('button', { name: 'Outlet', exact: true }).click();
  await page.getByRole('button', { name: 'Edit outlet', exact: true }).click();
  await page.getByRole('switch', { name: 'Terima booking online' }).click();
  await expect(page.getByRole('switch', { name: 'Terima booking online' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan outlet', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.booking-link-card code')).toContainText('/booking/barber-browser-baru');
  await page.goto('/booking/barber-browser-baru');
  await expect(page.getByRole('heading', { name: 'Barber Browser Baru', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Garasi Barber Tebet/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Outlet Browser Baru/ }).click();
  await page.getByRole('button', { name: /Lanjut di/ }).click();
  await expect(page.getByRole('button', { name: /Potong Browser Baru/ })).toBeVisible();
  await page.goto('/booking/garasi-barber');
  await expect(page.getByRole('button', { name: /Outlet Browser Baru/ })).toHaveCount(0);
  await page.goto('/booking/tidak-terdaftar');
  await expect(page.getByRole('heading', { name: 'Halaman booking tidak tersedia' })).toBeVisible();
});
