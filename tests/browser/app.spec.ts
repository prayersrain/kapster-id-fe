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
    await expect(page.locator('.live-workspace h1, .ob-card:not([hidden]) h1')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
  await page.goto('/owner');
  await page.screenshot({ path: 'test-results/owner-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 850 });
  for (const route of ['', 'bookings', 'services', 'barbers', 'cashiers', 'reports']) {
    await page.goto(`/owner/${route}`);
    await expect(page.locator('.live-workspace h1, .ob-card:not([hidden]) h1')).toBeVisible();
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

test('a slow initial session check does not undo a successful login', async ({ page }) => {
  const accounts = JSON.parse(await readFile(resolve(process.env.E2E_DIR!, 'accounts.json'), 'utf8'));
  const account = accounts.find((a: any) => a.role === 'owner');
  // The anonymous session check from page load answers 401 only after the user has already logged in.
  await page.route('**/api/auth/me', async (route) => {
    const response = await route.fetch();
    await new Promise((r) => setTimeout(r, 2500));
    await route.fulfill({ response });
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('.live-workspace h1')).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL(/\/owner$/);
  await expect(page.locator('.live-workspace h1')).toBeVisible();
});

test('a slow session check from before a logout does not log the user back in', async ({ page }) => {
  const accounts = JSON.parse(await readFile(resolve(process.env.E2E_DIR!, 'accounts.json'), 'utf8'));
  const account = accounts.find((a: any) => a.role === 'owner');
  // Warm up the dev server first so a dependency-optimizer reload cannot discard the delayed response.
  await page.goto('/login');
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
  // An existing session, so the page-load check will answer 200 — but only after the logout below.
  const signIn = await page.request.post('/api/auth/login', {
    headers: { 'X-Kapster-Request': '1', Origin: 'http://127.0.0.1:5173' },
    data: { email: account.email, password: account.password },
  });
  expect(signIn.status()).toBe(201);
  // Every page-load session check answers late (a dev-server reload may repeat the page load). The
  // answer is captured when the request is made, i.e. while the old session is still valid.
  await page.route('**/api/auth/me', async (route) => {
    const response = await route.fetch();
    const status = response.status(),
      body = await response.text();
    await new Promise((r) => setTimeout(r, 8000));
    await route.fulfill({ status, contentType: 'application/json', body });
  });
  let loads = 0,
    loggedOut = false;
  const afterLogout: string[] = [];
  page.on('load', () => loads++);
  // The app bouncing back into the workspace shows up as a navigation or a data request after logout.
  page.on(
    'framenavigated',
    (frame) => loggedOut && frame === page.mainFrame() && afterLogout.push(frame.url()),
  );
  page.on(
    'request',
    (request) => loggedOut && request.url().includes('/api/app/') && afterLogout.push(request.url()),
  );
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('.live-workspace h1')).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  loggedOut = true;
  await page.waitForTimeout(9000);
  expect(loads).toBe(1);
  expect(afterLogout).toEqual([]);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeVisible();
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

test('new Owner completes guided onboarding, handles a revision, and publishes booking', async ({ page }) => {
  test.setTimeout(180000);
  const email = 'new-owner-browser@example.test',
    password = 'BrowserOwnerPassword123';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
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
  const ownerLogin = async () => {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  };
  const card = page.locator('.ob-card:not([hidden])');
  const steps = page.getByRole('navigation', { name: 'Langkah setup' });

  // A brand-new business lands in onboarding, not in the dashboard.
  await ownerLogin();
  await expect(page).toHaveURL(/\/owner\/onboarding/);
  await expect(card.getByRole('heading', { name: 'Outlet pertama' })).toBeVisible();
  await expect(page.locator('.restored-workspace')).toHaveCount(0);

  await steps.getByRole('button', { name: /Profil bisnis/ }).click();
  await card.getByLabel('Link booking').fill('barber-browser-baru');
  await page.getByRole('button', { name: 'Simpan & lanjut' }).click();
  await expect(card.getByRole('heading', { name: 'Outlet pertama' })).toBeVisible();
  await page.getByRole('button', { name: 'Simpan & lanjut' }).click();
  await expect(card.getByText('Nama outlet wajib diisi.')).toBeVisible();
  await card.getByLabel('Nama outlet').fill('Outlet Browser Baru');
  await card.getByLabel('Alamat', { exact: true }).fill('Jl. Uji Browser Jakarta');
  // The outlet is created but the follow-up data read fails once. The screen must say the save
  // worked and block a second create until the data is reloaded.
  let outletSaved = false,
    readFailed = false;
  await page.route('**/api/app/outlets', async (route) => {
    const response = await route.fetch();
    outletSaved = response.ok();
    await route.fulfill({ response });
  });
  await page.route('**/api/app/data', (route) => {
    if (!outletSaved || readFailed) return route.continue();
    readFailed = true;
    return route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Server sibuk.' }),
    });
  });
  await page.getByRole('button', { name: 'Simpan & lanjut' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'tampilan belum diperbarui' })).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Outlet pertama' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan & lanjut' })).toBeDisabled();
  await page.unroute('**/api/app/outlets');
  await page.unroute('**/api/app/data');
  await page.getByRole('button', { name: 'Muat ulang data' }).click();
  await expect(card.getByLabel('Nama outlet')).toHaveValue('Outlet Browser Baru');
  await page.getByRole('button', { name: 'Simpan & lanjut' }).click();
  expect((await (await page.request.get('/api/app/data')).json()).outlets).toHaveLength(1);

  await expect(card.getByRole('heading', { name: 'Layanan & harga' })).toBeVisible();
  const addService = card.locator('.ob-add');
  await addService.getByLabel('Nama layanan').fill('Potong Browser Baru');
  await addService.getByLabel('Harga').fill('55000');
  await addService.getByRole('button', { name: 'Tambah layanan' }).click();
  await expect(card.locator('.ob-item').filter({ hasText: 'Potong Browser Baru' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /Tersimpan pukul/ })).toBeVisible();
  const savedService = card.locator('.ob-item').filter({ hasText: 'Potong Browser Baru' });
  await savedService.getByRole('button', { name: 'Ubah' }).click();
  await savedService.getByLabel('Nama layanan').fill('Potong Draf Edit');
  await page.getByRole('button', { name: 'Lanjut ke Kapster & jadwal' }).click();
  await expect(steps.getByRole('button', { name: /Layanan & harga/ })).toContainText('Draf');
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(savedService.getByLabel('Nama layanan')).toHaveValue('Potong Draf Edit');
  await savedService.getByRole('button', { name: 'Batal' }).click();
  await expect(savedService.getByLabel('Nama layanan')).toHaveCount(0);
  await expect(steps.getByRole('button', { name: /Layanan & harga/ })).not.toContainText('Draf');
  // Unsaved input survives moving between steps.
  await addService.getByLabel('Nama layanan').fill('Draf Layanan');
  await expect(page.getByText('Ada isian belum disimpan')).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut ke Kapster & jadwal' }).click();
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(card.locator('.ob-add').getByLabel('Nama layanan')).toHaveValue('Draf Layanan');
  await page.getByRole('button', { name: 'Lanjut ke Kapster & jadwal' }).click();
  const addBarber = card.locator('.ob-add');
  await addBarber.getByLabel('Nama kapster').fill('Kapster Browser Baru');
  await addBarber.getByRole('button', { name: 'Setiap hari' }).click();
  await addBarber.getByRole('button', { name: 'Tambah kapster' }).click();
  await expect(card.locator('.ob-item').filter({ hasText: 'Kapster Browser Baru' })).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut ke Tim kasir' }).click();
  await page.getByRole('button', { name: 'Lewati untuk sekarang' }).click();
  await expect(card.getByRole('heading', { name: 'Siap diajukan untuk review' })).toBeVisible();
  await card.getByRole('button', { name: 'Ajukan untuk review' }).click();
  await expect(card.getByRole('heading', { name: 'Pengajuan sedang diperiksa Admin' })).toBeVisible();
  // Progress is stored on the server and the step is in the URL, so a refresh resumes here.
  await page.reload();
  await expect(page).toHaveURL(/langkah=ringkasan/);
  await expect(card.getByRole('heading', { name: 'Pengajuan sedang diperiksa Admin' })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, 'admin');
  await page.locator('aside nav').getByRole('button', { name: 'Tenants', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'Barber Browser Baru' });
  await row.getByRole('button', { name: 'Minta revisi', exact: true }).click();
  await page.getByLabel('Catatan revisi untuk Owner').fill('Harga layanan belum sesuai daftar outlet');
  await page.getByRole('dialog').getByRole('button', { name: 'Kirim catatan revisi', exact: true }).click();
  await expect(row.getByText('Ditolak', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();

  // The revision note and the fix happen inside the same onboarding space.
  await ownerLogin();
  const setupBanner = page.locator('section.setup-status');
  await expect(setupBanner).toContainText('Perlu revisi');
  await expect(setupBanner).not.toContainText('Disetujui');
  await setupBanner.getByRole('link', { name: 'Perbaiki setup' }).click();
  await expect(page).toHaveURL(/\/owner\/onboarding\?langkah=ringkasan$/);
  await expect(page.getByText('Harga layanan belum sesuai daftar outlet')).toBeVisible();
  await card
    .locator('.ob-summary-section')
    .filter({ hasText: 'Layanan & harga' })
    .getByRole('button', { name: 'Ubah' })
    .click();
  const service = card.locator('.ob-item').filter({ hasText: 'Potong Browser Baru' });
  await service.getByRole('button', { name: 'Ubah' }).click();
  await service.getByLabel('Harga').fill('60000');
  await service.getByRole('button', { name: 'Simpan layanan' }).click();
  await expect(card.locator('.ob-item').filter({ hasText: 'Rp 60.000' })).toBeVisible();
  await steps.getByRole('button', { name: /Ringkasan/ }).click();
  await card.getByRole('button', { name: 'Ajukan ulang' }).click();
  await expect(card.getByRole('heading', { name: 'Pengajuan sedang diperiksa Admin' })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();

  await login(page, 'admin');
  await page.locator('aside nav').getByRole('button', { name: 'Tenants', exact: true }).click();
  await row.getByRole('button', { name: 'Setujui', exact: true }).click();
  await page.getByLabel('Alasan').fill('Setup bisnis lengkap dan sudah diperiksa');
  await page.getByRole('dialog').getByRole('button', { name: 'Setujui bisnis', exact: true }).click();
  await expect(row.getByText('Disetujui', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();

  await ownerLogin();
  await expect(setupBanner).toContainText('Disetujui');
  await setupBanner.getByRole('link', { name: 'Terbitkan booking' }).click();
  await expect(page).toHaveURL(/\/owner\/onboarding\?langkah=ringkasan$/);
  await card.getByRole('button', { name: 'Terbitkan booking' }).click();
  await expect(card.getByRole('heading', { name: 'Halaman booking sudah terbit' })).toBeVisible();
  await expect(card.locator('.ob-link code')).toContainText('/booking/barber-browser-baru');
  await expect(card.getByRole('link', { name: 'Buka halaman booking' })).toHaveAttribute(
    'href',
    '/booking/barber-browser-baru',
  );
  await steps.getByRole('button', { name: /Profil bisnis/ }).click();
  await expect(card.getByLabel('Link booking')).toHaveAttribute('readonly', '');
  // Booking is live, so the dashboard no longer shows the setup banner.
  await page.goto('/owner');
  await expect(page.locator('.live-workspace h1')).toBeVisible();
  await expect(setupBanner).toHaveCount(0);

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
  expect(errors).toEqual([]);
});

test('cashier walk-in POS: validation, double tap, slot conflict, and queue follow-up', async ({
  page,
  playwright,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, 'cashier');
  await page.locator('aside nav').getByRole('button', { name: 'Walk-in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Buka shift terlebih dahulu' })).toBeVisible();
  await page.getByRole('button', { name: 'Buka shift', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Buka shift', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tambah walk-in' })).toBeVisible();
  await expect(page.locator('.walkin-outlet')).toContainText('Garasi Barber Tebet');

  // Schedule and bookings changed elsewhere must reach the POS on a normal data reload.
  const accounts = JSON.parse(await readFile(resolve(process.env.E2E_DIR!, 'accounts.json'), 'utf8'));
  const ownerAccount = accounts.find((a: any) => a.role === 'owner');
  const headers = { 'X-Kapster-Request': '1', Origin: 'http://127.0.0.1:5173' };
  const owner = await playwright.request.newContext({
    baseURL: 'http://127.0.0.1:5173',
    extraHTTPHeaders: headers,
  });
  await owner.post('/api/auth/login', {
    data: { email: ownerAccount.email, password: ownerAccount.password },
  });
  const outletId = (await (await owner.get('/api/app/data')).json()).outlets[0].id;
  const everyDay = [0, 1, 2, 3, 4, 5, 6];
  const regression = await (
    await owner.post('/api/app/barbers', {
      data: { outletId, name: 'Kapster Regresi', start: '09:00', end: '18:00', days: everyDay },
    })
  ).json();
  const reloadData = () => page.getByRole('button', { name: 'Muat ulang data' }).click();
  await reloadData();
  const posTimes = page.getByRole('group', { name: 'Pilih jam' });
  const posSummary = page.locator('.walkin-summary');
  await page.getByRole('group', { name: 'Tanggal kunjungan' }).getByRole('button', { name: 'Besok' }).click();
  await page.getByRole('button', { name: /^Haircut 45 menit/ }).click();
  await page.locator('.walkin-barber').filter({ hasText: 'Kapster Regresi' }).click();
  await posTimes.getByRole('button', { name: /^09:00/ }).click();
  await expect(posSummary).toContainText('09:00 WIB');
  const moved = await owner.patch(`/api/app/barbers/${regression.id}`, {
    data: { name: 'Kapster Regresi', start: '12:00', end: '18:00', days: everyDay, active: true },
  });
  expect(moved.status()).toBe(200);
  await reloadData();
  await expect(posTimes.getByRole('button', { name: /^09:00/ })).toHaveCount(0);
  await expect(posTimes.getByRole('button').first()).toHaveText(/^12:00/);
  await expect(posSummary).not.toContainText('09:00 WIB');
  await posTimes.getByRole('button', { name: /^12:00/ }).click();
  const tomorrow = new Date(Date.now() + 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  const serviceId = (await (await owner.get('/api/app/data')).json()).services.find(
    (s: any) => s.name === 'Haircut',
  ).id;
  const elsewhere = await page.request.post('/api/app/bookings', {
    headers,
    data: {
      outletId,
      serviceId,
      barberId: regression.id,
      date: tomorrow,
      time: '12:00',
      name: 'Booking Lain',
      phone: '081233334444',
    },
  });
  expect(elsewhere.status()).toBe(201);
  await reloadData();
  await expect(posTimes.getByRole('button', { name: /^12:00/ })).toHaveCount(0);
  await expect(posSummary).not.toContainText('12:00 WIB');

  // Leave added for the chosen date: the time must be released and cannot be submitted.
  const regressionCard = page.locator('.walkin-barber').filter({ hasText: 'Kapster Regresi' });
  await expect(regressionCard).toContainText('Paling cepat');
  const leaveTime = (await posTimes.getByRole('button').first().textContent())!
    .replace('Paling cepat', '')
    .trim();
  await posTimes.getByRole('button').first().click();
  await expect(posSummary).toContainText(`${leaveTime} WIB`);
  const leave = await (
    await owner.post('/api/app/blocks', {
      data: { barberId: regression.id, date: tomorrow, reason: 'Cuti mendadak' },
    })
  ).json();
  await reloadData();
  await expect(regressionCard).toContainText('Cuti · Cuti mendadak');
  await expect(posSummary).not.toContainText(`${leaveTime} WIB`);
  await posSummary.getByRole('button', { name: 'Masukkan antrean' }).click();
  await expect(posSummary.getByRole('alert')).toContainText('Pilih jam terlebih dahulu.');

  // While availability is being re-checked, submit waits for the latest result instead of sending the old time.
  expect((await owner.post(`/api/app/blocks/${leave.id}/remove`, { data: {} })).status()).toBe(201);
  await reloadData();
  await expect(regressionCard).toContainText('Paling cepat');
  await posTimes.getByRole('button').first().click();
  await posSummary.getByLabel('Nama customer').fill('Tidak Boleh Terkirim');
  await posSummary.getByLabel('Nomor WhatsApp').fill('081255556666');
  await page.route('**/api/app/slots**', async (route) => {
    await new Promise((r) => setTimeout(r, 4000));
    await route.continue();
  });
  const shortened = await owner.patch(`/api/app/barbers/${regression.id}`, {
    data: { name: 'Kapster Regresi', start: '12:00', end: '17:00', days: everyDay, active: true },
  });
  expect(shortened.status()).toBe(200);
  await reloadData();
  await expect(regressionCard).toContainText('Memeriksa jadwal');
  await posSummary.getByRole('button', { name: 'Masukkan antrean' }).click();
  await expect(posSummary.getByRole('alert')).toContainText('sedang diperiksa ulang');
  const pending = await (await page.request.get('/api/app/data')).json();
  expect(pending.bookings.filter((b: any) => b.name === 'Tidak Boleh Terkirim')).toHaveLength(0);
  // Once the check answers, a time still inside the shorter shift stays selected.
  await expect(regressionCard).toContainText('Paling cepat', { timeout: 10000 });
  await expect(posSummary).toContainText(`${leaveTime} WIB`);
  await page.unrouteAll({ behavior: 'wait' });
  await posSummary.getByLabel('Nama customer').fill('');
  await posSummary.getByLabel('Nomor WhatsApp').fill('');
  await owner.dispose();
  await page
    .getByRole('group', { name: 'Tanggal kunjungan' })
    .getByRole('button', { name: 'Hari ini' })
    .click();

  const summary = page.locator('.walkin-summary');
  const times = page.getByRole('group', { name: 'Pilih jam' });
  // Tomorrow keeps the test independent of the time of day.
  await page.getByRole('group', { name: 'Tanggal kunjungan' }).getByRole('button', { name: 'Besok' }).click();
  await page.getByRole('button', { name: /^Haircut 45 menit/ }).click();
  const raka = page.locator('.walkin-barber').filter({ hasText: 'Raka' });
  await expect(raka.locator('small')).toContainText('Paling cepat');
  await raka.click();
  await summary.getByRole('button', { name: 'Masukkan antrean' }).click();
  await expect(summary.getByRole('alert')).toContainText('Pilih jam terlebih dahulu.');
  const firstTime = (await times.getByRole('button').first().textContent())!
    .replace('Paling cepat', '')
    .trim();
  await times.getByRole('button').first().click();
  await summary.getByLabel('Nomor WhatsApp').fill('12345');
  await summary.getByRole('button', { name: 'Masukkan antrean' }).click();
  await expect(summary.getByText('Nama minimal 2 karakter.')).toBeVisible();
  await expect(summary.getByText(/Gunakan nomor WhatsApp Indonesia/)).toBeVisible();
  await summary.getByLabel('Nama customer').fill('Walk In Satu');
  await summary.getByLabel('Nomor WhatsApp').fill('081211223344');
  await expect(summary).toContainText(`${firstTime} WIB`);
  await summary.getByRole('button', { name: 'Masukkan antrean' }).dblclick();
  await expect(summary.getByText('Masuk antrean', { exact: true })).toBeVisible();
  await expect(summary).toContainText('Menunggu check-in · belum bayar');
  const data = await (await page.request.get('/api/app/data')).json();
  expect(data.bookings.filter((b: any) => b.name === 'Walk In Satu')).toHaveLength(1);
  expect(data.bookings.find((b: any) => b.name === 'Walk In Satu')).toMatchObject({
    paid: 0,
    status: 'confirmed',
    source: 'cashier',
  });

  // Another device takes the chosen slot before this cashier submits.
  await summary.getByRole('button', { name: 'Tambah customer berikutnya' }).click();
  await page.getByRole('button', { name: /^Haircut 45 menit/ }).click();
  await raka.click();
  const nextTime = (await times.getByRole('button').first().textContent())!
    .replace('Paling cepat', '')
    .trim();
  await times.getByRole('button').first().click();
  await summary.getByLabel('Nama customer').fill('Walk In Dua');
  await summary.getByLabel('Nomor WhatsApp').fill('081299990000');
  const booking = data.bookings.find((b: any) => b.name === 'Walk In Satu');
  const taken = await page.request.post('/api/app/bookings', {
    headers: { 'X-Kapster-Request': '1', Origin: 'http://127.0.0.1:5173' },
    data: {
      outletId: booking.outletId,
      serviceId: booking.serviceId,
      barberId: booking.barberId,
      date: booking.date,
      time: nextTime,
      name: 'Perangkat Lain',
      phone: '081277776666',
    },
  });
  expect(taken.status()).toBe(201);
  await summary.getByRole('button', { name: 'Masukkan antrean' }).click();
  await expect(summary.getByRole('alert')).toContainText('Daftar jam kosong sudah diperbarui');
  await expect(times.getByRole('button', { name: new RegExp(`^${nextTime}`) })).toHaveCount(0);
  await expect(summary).toContainText('Belum dipilih');
  await times.getByRole('button').first().click();
  await summary.getByRole('button', { name: 'Masukkan antrean' }).click();
  await expect(summary.getByText('Masuk antrean', { exact: true })).toBeVisible();

  // The visit continues through the existing queue rules.
  await summary.getByRole('link', { name: 'Lihat antrean' }).click();
  const queueRow = page.getByRole('row').filter({ hasText: 'Walk In Dua' });
  await expect(queueRow.getByText('Belum bayar', { exact: true })).toBeVisible();
  await queueRow.getByRole('button', { name: 'Check-in', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Ya, customer sudah datang', exact: true })
    .click();
  await expect(queueRow.getByText('Sudah datang', { exact: true })).toBeVisible();
  // Walk-ins never mark payment; the shift closes with no cash taken.
  await page.locator('aside nav').getByRole('button', { name: 'Shift Kasir', exact: true }).click();
  await page.getByRole('button', { name: 'Tutup shift', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tutup shift', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Shift ditutup' })).toBeVisible();
  expect(errors).toEqual([]);
});
