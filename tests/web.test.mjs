import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBookingLink } from '../apps/web/src/links.ts';
import { calendarLanes, cardHeight, HOUR_PX } from '../apps/web/src/calendarLanes.ts';

test('pasted booking links keep the outlet segment', () => {
  const cases = [
    ['garasi-barber', '/booking/garasi-barber'],
    ['  Garasi-Barber ', '/booking/garasi-barber'],
    ['http://127.0.0.1:5173/booking/garasi-barber/tebet', '/booking/garasi-barber/tebet'],
    ['/booking/garasi-barber/tebet?ref=instagram#top', '/booking/garasi-barber/tebet'],
    ['booking.kapster.id/garasi-barber/tebet', '/booking/garasi-barber/tebet'],
    ['https://booking.kapster.id/garasi-barber', '/booking/garasi-barber'],
    ['/booking/status/abc123', ''],
    ['', ''],
  ];
  for (const [input, expected] of cases) assert.equal(parseBookingLink(input), expected, input);
});

const minute = 60_000;
// Bookings store the service duration plus the 10 minute buffer in `ends`.
const booking = (id, start, duration) => ({
  id,
  starts: start * minute,
  ends: (start + duration + 10) * minute,
  duration,
});

test('short back-to-back bookings get separate lanes because their cards overlap on screen', () => {
  const [first, second] = calendarLanes([booking('a', 0, 15), booking('b', 25, 15)]);
  assert.equal(first.b.ends, second.b.starts, 'times do not conflict');
  const firstBottom = (cardHeight(15) / HOUR_PX) * 60;
  assert.ok(firstBottom > 25, 'the first card still reaches past the second start');
  assert.notEqual(first.lane, second.lane);
  assert.equal(first.count, 2);
  assert.equal(second.count, 2);
});

test('long bookings that end before the next one share a lane', () => {
  const placed = calendarLanes([booking('a', 0, 60), booking('b', 70, 60), booking('c', 140, 45)]);
  assert.deepEqual(
    placed.map((p) => [p.b.id, p.lane, p.count]),
    [
      ['a', 0, 1],
      ['b', 0, 1],
      ['c', 0, 1],
    ],
  );
});

test('overlapping bookings sit side by side and separate clusters reset the lane count', () => {
  const placed = calendarLanes([
    booking('a', 0, 45),
    booking('b', 10, 45),
    booking('c', 20, 45),
    booking('d', 300, 45),
  ]);
  const byId = Object.fromEntries(placed.map((p) => [p.b.id, p]));
  assert.deepEqual([byId.a.lane, byId.b.lane, byId.c.lane], [0, 1, 2]);
  assert.deepEqual([byId.a.count, byId.b.count, byId.c.count], [3, 3, 3]);
  assert.deepEqual([byId.d.lane, byId.d.count], [0, 1]);
});

import { createRequire } from 'node:module';
import { customerErrors, normalizePhone } from '../apps/web/src/bookingRules.ts';
import { setupBanner, setupProgress } from '../apps/web/src/setupRules.ts';
const require = createRequire(import.meta.url);

test('walk-in and public booking accept exactly the customers the API accepts', () => {
  // Built API schema (npm test runs build:api first), so the UI cannot drift from the server rule.
  const { bookingInput } = require('../apps/api/dist/validation.js');
  const base = {
    outletId: '00000000-0000-4000-8000-000000000001',
    serviceId: '00000000-0000-4000-8000-000000000002',
    barberId: '00000000-0000-4000-8000-000000000003',
    date: '2030-01-02',
    time: '10:00',
  };
  const names = ['A', 'Ab', '  Ab  ', 'Budi Santoso', 'x'.repeat(120), 'x'.repeat(121)];
  const phones = [
    '081234567890',
    '+62 812-3456-7890',
    '6281234567',
    '08123',
    '0812345678901234',
    '021234567890',
    '',
    'abc',
  ];
  for (const name of names)
    for (const phone of phones) {
      const server = bookingInput.safeParse({ ...base, name, phone }).success;
      const errors = customerErrors({ name, phone });
      assert.equal(
        !errors.name && !errors.phone,
        server,
        `name=${JSON.stringify(name)} phone=${JSON.stringify(phone)}`,
      );
    }
  assert.equal(normalizePhone('0812-3456 7890'), '6281234567890');
});

test('setup readiness mirrors the approval rule for every active outlet', () => {
  const org = { name: 'Barber', slug: 'barber', status: 'draft' };
  const outlet = (id, active = 1) => ({ id, name: `Outlet ${id}`, active, published: 0 });
  const base = { org, team: [], outlets: [outlet('a'), outlet('b'), outlet('c', 0)] };
  const partial = setupProgress({
    ...base,
    services: [
      { outletId: 'a', active: 1 },
      { outletId: 'b', active: 0 },
    ],
    barbers: [
      { outletId: 'a', active: 1 },
      { outletId: 'b', active: 1 },
    ],
  });
  assert.equal(partial.ready, false);
  assert.deepEqual(partial.missing, ['Outlet b belum punya layanan aktif.']);
  // Inactive outlets are ignored, exactly like POST app/approval.
  const ready = setupProgress({
    ...base,
    services: [
      { outletId: 'a', active: 1 },
      { outletId: 'b', active: 1 },
    ],
    barbers: [
      { outletId: 'a', active: 1 },
      { outletId: 'b', active: 1 },
    ],
  });
  assert.equal(ready.ready, true);
  assert.equal(ready.canSubmit, true);
  assert.equal(
    setupProgress({ ...base, outlets: [], services: [], barbers: [] }).missing[0],
    'Tambahkan outlet pertama.',
  );
  assert.equal(
    setupProgress({ ...base, org: { ...org, status: 'pending' }, services: [], barbers: [] }).canSubmit,
    false,
  );
});

test('setup banner follows the business status and only links to onboarding steps', () => {
  const outlet = { id: 'a', name: 'Outlet a', active: 1, published: 0 };
  const complete = {
    org: { name: 'Barber', slug: 'barber', status: 'draft' },
    team: [],
    outlets: [outlet],
    services: [{ outletId: 'a', active: 1 }],
    barbers: [{ outletId: 'a', active: 1 }],
  };
  const withStatus = (status, patch = {}) =>
    setupBanner({ ...complete, ...patch, org: { ...complete.org, status } });
  const summary = (view) => [
    view.badge,
    view.title,
    view.action,
    view.to,
    view.stages.map((s) => `${s.label}:${s.state}:${s.note}`).join(' | '),
  ];

  assert.deepEqual(summary(withStatus('draft', { services: [] })), [
    'Belum selesai',
    'Siapkan bisnis untuk booking pertama',
    'Lanjutkan setup',
    '/owner/onboarding?langkah=layanan',
    'Data bisnis:active:Lengkapi setup | Review Admin:next:Belum diajukan | Publikasi:next:Setelah disetujui',
  ]);
  assert.equal(
    withStatus('draft', { outlets: [], services: [], barbers: [] }).to,
    '/owner/onboarding?langkah=outlet',
  );
  assert.equal(withStatus('draft', { barbers: [] }).to, '/owner/onboarding?langkah=kapster');
  assert.equal(withStatus('draft').to, '/owner/onboarding?langkah=ringkasan');
  assert.equal(withStatus('draft').stages[0].note, 'Siap diajukan');

  assert.deepEqual(summary(withStatus('pending')), [
    'Menunggu review',
    'Pengajuan Anda sedang ditinjau',
    'Lihat pengajuan',
    '/owner/onboarding?langkah=ringkasan',
    'Data bisnis:done:Sudah dikirim | Review Admin:active:Dalam proses | Publikasi:next:Setelah disetujui',
  ]);

  // A revision is never shown as an approved review.
  const rejected = withStatus('rejected');
  assert.deepEqual(summary(rejected), [
    'Perlu revisi',
    'Ada data yang perlu diperbaiki',
    'Perbaiki setup',
    '/owner/onboarding?langkah=ringkasan',
    'Data bisnis:active:Perlu diperbaiki | Review Admin:next:Ajukan ulang | Publikasi:next:Setelah disetujui',
  ]);
  assert.equal(rejected.tone, 'attention');

  assert.deepEqual(summary(withStatus('approved')), [
    'Disetujui',
    'Bisnis siap menerima booking',
    'Terbitkan booking',
    '/owner/onboarding?langkah=ringkasan',
    'Data bisnis:done:Lengkap | Review Admin:done:Disetujui | Publikasi:active:Siap diterbitkan',
  ]);
  assert.equal(withStatus('approved', { barbers: [] }).stages[2].note, 'Lengkapi outlet dulu');
  // Booking is live: the banner is hidden.
  assert.equal(withStatus('approved', { outlets: [{ ...outlet, published: 1 }] }), null);

  // Suspended: no publish invitation, only the status in the summary.
  const suspended = withStatus('suspended');
  assert.equal(suspended.badge, 'Ditangguhkan');
  assert.equal(suspended.to, '/owner/onboarding?langkah=ringkasan');
  assert.doesNotMatch(`${suspended.action} ${suspended.title}`, /terbit/i);
  assert.equal(withStatus('archived'), null);

  for (const status of ['draft', 'pending', 'rejected', 'approved', 'suspended']) {
    const view = withStatus(status);
    assert.equal(view.stages.filter((s) => s.state === 'active').length, 1, status);
    assert.match(view.to, /^\/owner\/onboarding\?langkah=/);
  }
});
