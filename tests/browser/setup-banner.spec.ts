import { test, expect, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sizes = [
  { name: 'desktop', width: 1536, height: 1024 },
  { name: 'tablet-landscape', width: 1180, height: 820 },
  { name: 'tablet-landscape-kecil', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 850 },
  { name: 'mobile-320', width: 320, height: 720 },
];

type Expected = {
  badge: string;
  title: string;
  description: string;
  action: string;
  step: string;
  stepHeading: string;
  done: string[];
  active: string;
};

/** Geometry and contrast of the rendered card, measured in the page. */
function measure(section: HTMLElement) {
  const box = (el: Element) => el.getBoundingClientRect();
  const outer = box(section);
  const all = (selector: string) => [...section.querySelectorAll(selector)];
  const one = (selector: string) => section.querySelector(selector)!;
  const inside = (r: DOMRect) => r.left >= outer.left - 1 && r.right <= outer.right + 1;
  const overlaps = (a: DOMRect, b: DOMRect) =>
    a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  const rgb = (color: string) =>
    color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number);
  const luminance = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const background = (el: Element) => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const color = getComputedStyle(node).backgroundColor;
      if (!/rgba\(.*, 0\)$/.test(color) && color !== 'transparent') return { color: rgb(color), node };
    }
    return { color: [255, 255, 255], node: null };
  };
  const text =
    'h2, p, .setup-status-label, .setup-status-badge, .setup-status-action span, .setup-status-number, .setup-status-stage strong, .setup-status-stage small';
  const copy = box(one('.setup-status-copy')),
    action = box(one('.setup-status-action'));
  const stages = all('.setup-status-stage').map(box);
  return {
    pageOverflow: document.documentElement.scrollWidth > innerWidth,
    cardOverflow: section.scrollWidth > section.clientWidth + 1,
    width: outer.width,
    clipped: all(text)
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || !inside(box(el)))
      .map((el) => el.textContent),
    numbers: all('.setup-status-number').map((el) => [box(el).width, box(el).height]),
    copyHitsAction: overlaps(copy, action),
    stagesOverlap: stages.some((a, i) => stages.some((b, j) => i < j && overlaps(a, b))),
    stacked: action.top >= copy.bottom - 1,
    fullWidthAction: Math.abs(action.left - copy.left) <= 1 && Math.abs(action.right - copy.right) <= 1,
    sideBySide: action.left >= copy.right - 1,
    // The main area has a cream-to-white gradient, so text there must pass against its cream end too.
    lowContrast: all(text)
      .map((el) => {
        const fg = rgb(getComputedStyle(el).color);
        const bg = background(el);
        const onGradient = !!el.closest('.setup-status-main') && (bg.node === section || !bg.node);
        const cream = onGradient ? ratio(fg, [255, 250, 242]) : Infinity;
        return [el.textContent, Math.min(ratio(fg, bg.color), cream)] as const;
      })
      .filter(([, value]) => value < 4.5),
  };
}

async function checkState(page: Page, state: string, expected: Expected) {
  const banner = page.locator('section.setup-status');
  for (const size of sizes) {
    const label = `${state} @ ${size.width}px`;
    await page.setViewportSize(size);
    await page.goto('/owner');
    await expect(page.locator('.live-workspace h1')).toBeVisible();
    await expect(banner, label).toBeVisible();
    await expect(banner.getByRole('heading', { level: 2 })).toHaveText(expected.title);
    const report = await banner.evaluate(measure);
    expect(report.pageOverflow, label).toBe(false);
    expect(report.cardOverflow, label).toBe(false);
    expect(report.clipped, label).toEqual([]);
    expect(report.copyHitsAction, label).toBe(false);
    expect(report.stagesOverlap, label).toBe(false);
    expect(report.lowContrast, label).toEqual([]);
    expect(report.numbers, label).toHaveLength(3);
    for (const [width, height] of report.numbers) {
      expect(width, label).toBeCloseTo(28, 0);
      expect(height, label).toBeCloseTo(28, 0);
    }
    if (report.width <= 600) {
      expect(report.stacked, label).toBe(true);
      expect(report.fullWidthAction, label).toBe(true);
    } else expect(report.sideBySide, label).toBe(true);
    await banner.screenshot({
      path: `test-results/setup-banner/${state}-${size.name}.png`,
      animations: 'disabled',
    });
    if (['desktop', 'mobile'].includes(size.name))
      await page.screenshot({
        path: `test-results/setup-banner/${state}-${size.name}-halaman.png`,
        animations: 'disabled',
      });
  }

  await page.setViewportSize(sizes[0]);
  await page.goto('/owner');
  await expect(banner).toBeVisible();
  expect(await banner.locator('.setup-status-label').evaluate((el) => (el as HTMLElement).innerText)).toBe(
    'SETUP BISNIS',
  );
  await expect(banner.locator('.setup-status-badge')).toHaveText(expected.badge);
  await expect(banner.getByText(expected.description, { exact: true })).toBeVisible();
  const stages = banner.getByRole('list', { name: 'Tahapan aktivasi bisnis' }).getByRole('listitem');
  await expect(stages).toHaveCount(3);
  await expect(stages.nth(0)).toContainText('Data bisnis');
  await expect(stages.nth(1)).toContainText('Review Admin');
  await expect(stages.nth(2)).toContainText('Publikasi');
  await expect(banner.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(banner.locator('[aria-current="step"]')).toContainText(expected.active);
  await expect(banner.locator('[data-state="done"] strong')).toHaveText(expected.done);
  // No checkmark glyph and nothing left of the old ring and progress bar.
  await expect(banner.locator('path[d="m5 12 4 4L19 6"]')).toHaveCount(0);
  await expect(page.locator('[class*="onboardingProgress"], [class*="onboardingTrack"]')).toHaveCount(0);

  // Keyboard: Tab from the description reaches the action, and the focus ring is visible.
  const action = banner.getByRole('link', { name: expected.action, exact: true });
  await expect(action).toHaveAttribute('href', `/owner/onboarding?langkah=${expected.step}`);
  await banner.getByText(expected.description, { exact: true }).click();
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  expect(await action.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/owner/onboarding\\?langkah=${expected.step}$`));
  await expect(page.locator('.ob-card:not([hidden]) h1')).toHaveText(expected.stepHeading);
  return banner;
}

test('owner setup banner: every business status on desktop, tablet and phone', async ({
  page,
  playwright,
  baseURL,
}) => {
  test.setTimeout(420000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const accounts = JSON.parse(await readFile(resolve(process.env.E2E_DIR!, 'accounts.json'), 'utf8'));
  const context = () =>
    playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { 'X-Kapster-Request': '1', Origin: baseURL! },
    });
  const email = 'banner-owner@example.test',
    password = 'BannerOwnerPassword123';

  // A new business in the separate test database, moved through each status by the real API.
  const owner = await context();
  expect(
    (
      await owner.post('/api/auth/register', {
        data: { name: 'Owner Banner', business: 'Barber Status Banner', email, password },
      })
    ).status(),
  ).toBe(201);
  const mails = (await readFile(resolve(process.env.E2E_DIR!, 'mail.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  const token = new URL(mails.find((m: any) => m.to === email && m.kind === 'verify').url).searchParams.get(
    'token',
  );
  expect((await owner.post('/api/auth/verify', { data: { token } })).status()).toBe(201);
  expect((await owner.post('/api/auth/login', { data: { email, password } })).status()).toBe(201);
  const admin = await context();
  const adminAccount = accounts.find((a: any) => a.role === 'admin');
  await admin.post('/api/auth/login', {
    data: { email: adminAccount.email, password: adminAccount.password },
  });
  const data = async () => (await owner.get('/api/app/data')).json();
  const orgId = (await data()).org.id;
  const setStatus = async (status: string, reason: string) =>
    expect((await admin.post(`/api/admin/orgs/${orgId}/status`, { data: { status, reason } })).status()).toBe(
      201,
    );
  const submit = async () => expect((await owner.post('/api/app/approval', { data: {} })).status()).toBe(201);

  const outlet = await (
    await owner.post('/api/app/outlets', { data: { name: 'Outlet Banner', address: 'Jl. Banner Jakarta' } })
  ).json();

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('.live-workspace h1')).toBeVisible();

  await checkState(page, 'draft', {
    badge: 'Belum selesai',
    title: 'Siapkan bisnis untuk booking pertama',
    description: 'Lengkapi data bisnis, outlet, layanan, dan jadwal kapster sebelum mengajukan review.',
    action: 'Lanjutkan setup',
    step: 'layanan',
    stepHeading: 'Layanan & harga',
    done: [],
    active: 'Data bisnis',
  });

  await owner.post('/api/app/services', {
    data: { outletId: outlet.id, name: 'Potong Banner', price: 50000, duration: 45 },
  });
  await owner.post('/api/app/barbers', {
    data: {
      outletId: outlet.id,
      name: 'Kapster Banner',
      start: '09:00',
      end: '18:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
  });
  await submit();
  await checkState(page, 'pending', {
    badge: 'Menunggu review',
    title: 'Pengajuan Anda sedang ditinjau',
    description:
      'Data bisnis sudah dikirim ke Admin. Setelah disetujui, Anda bisa menerbitkan halaman booking.',
    action: 'Lihat pengajuan',
    step: 'ringkasan',
    stepHeading: 'Ringkasan & pengajuan',
    done: ['Data bisnis'],
    active: 'Review Admin',
  });

  await setStatus('rejected', 'Harga layanan belum sesuai daftar outlet');
  const rejected = await checkState(page, 'revisi', {
    badge: 'Perlu revisi',
    title: 'Ada data yang perlu diperbaiki',
    description: 'Baca catatan Admin, perbaiki data yang diminta, lalu kirim ulang pengajuan Anda.',
    action: 'Perbaiki setup',
    step: 'ringkasan',
    stepHeading: 'Ringkasan & pengajuan',
    done: [],
    active: 'Data bisnis',
  });
  await expect(page.getByText('Harga layanan belum sesuai daftar outlet')).toBeVisible();
  await page.goto('/owner');
  await expect(rejected).not.toContainText('Disetujui');

  await submit();
  await setStatus('approved', 'Data bisnis lengkap dan sesuai');
  await checkState(page, 'disetujui', {
    badge: 'Disetujui',
    title: 'Bisnis siap menerima booking',
    description:
      'Pengajuan Anda telah disetujui. Terbitkan outlet agar halaman booking bisa diakses customer.',
    action: 'Terbitkan booking',
    step: 'ringkasan',
    stepHeading: 'Ringkasan & pengajuan',
    done: ['Data bisnis', 'Review Admin'],
    active: 'Publikasi',
  });
  // The banner only opens the summary; publishing stays an explicit action there.
  await expect(
    page.locator('.ob-card:not([hidden])').getByRole('button', { name: 'Terbitkan booking' }),
  ).toBeVisible();
  const afterClick = await data();
  expect(afterClick.org.status).toBe('approved');
  expect(afterClick.outlets.filter((o: any) => o.published)).toHaveLength(0);

  await setStatus('suspended', 'Langganan bisnis sedang ditinjau ulang');
  const suspended = await checkState(page, 'ditangguhkan', {
    badge: 'Ditangguhkan',
    title: 'Booking publik dihentikan sementara',
    description:
      'Admin menangguhkan bisnis ini sehingga halaman booking tidak bisa diakses customer. Lihat catatan Admin di ringkasan setup.',
    action: 'Lihat status',
    step: 'ringkasan',
    stepHeading: 'Ringkasan & pengajuan',
    done: ['Data bisnis'],
    active: 'Review Admin',
  });
  await expect(page.getByText('Langganan bisnis sedang ditinjau ulang')).toBeVisible();
  await page.goto('/owner');
  await expect(suspended).toBeVisible();
  await expect(suspended).not.toContainText(/terbit/i);

  // Once a business is approved and published, the banner is gone.
  await setStatus('approved', 'Penangguhan bisnis sudah selesai');
  expect(
    (
      await owner.patch(`/api/app/outlets/${outlet.id}`, {
        data: { name: 'Outlet Banner', address: 'Jl. Banner Jakarta', published: true },
      })
    ).status(),
  ).toBe(200);
  await page.goto('/owner');
  await expect(page.locator('.live-workspace h1')).toBeVisible();
  await expect(page.locator('section.setup-status')).toHaveCount(0);

  await owner.dispose();
  await admin.dispose();
  expect(errors).toEqual([]);
});
