import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const dir = resolve('.local', `test-${randomUUID()}`),
  port = 4107;
let server,
  output = '',
  accounts;
const base = `http://127.0.0.1:${port}/api/`;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(path, body, cookie = '', method = 'POST', origin = 'http://127.0.0.1:5173') {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : method,
    headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json', 'X-Kapster-Request': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function ok(path, body, cookie, method) {
  const result = await request(path, body, cookie, method);
  assert.ok(result.status < 300, `${path}: ${result.status} ${JSON.stringify(result.data)}`);
  return result.data;
}
async function login(role) {
  const account = accounts.find((a) => a.role === role);
  const r = await request('auth/login', { email: account.email, password: account.password });
  assert.equal(r.status, 201);
  return r.cookie;
}
async function boot() {
  server = spawn(process.execPath, ['apps/api/dist/main.js'], {
    env: { ...process.env, PORT: String(port), DB_FILE: resolve(dir, 'test.sqlite'), TEST_RATE_LIMIT: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => (output += chunk));
  server.stderr.on('data', (chunk) => (output += chunk));
  server.on('error', (error) => (output += error.stack));
  server.on('exit', (code, signal) => (output += `Exited ${code} ${signal}\n`));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await request('health')).status === 200) return;
    } catch {}
    await pause(100);
  }
  throw new Error(`Server failed to start: ${output}; cwd=${process.cwd()}; exe=${process.execPath}`);
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once('exit', resolve));
  server.kill();
  await exited;
}
before(async () => {
  await mkdir(dir, { recursive: true });
  await boot();
  accounts = JSON.parse(await readFile(resolve(dir, 'accounts.json'), 'utf8'));
});
after(async () => {
  await stop();
});

test('public booking, role boundaries, cash shift, refund, snapshot, and restart persistence', async () => {
  assert.equal((await request('app/data')).status, 401);
  assert.equal((await request('admin/data')).status, 401);
  const owner = await login('owner'),
    cashier = await login('cashier');
  assert.equal((await request('admin/data', undefined, owner)).status, 403);
  assert.equal((await request('app/services', { name: 'Unauthorized' }, cashier)).status, 403);
  assert.equal((await request('auth/logout', {}, owner, 'POST', 'https://attacker.invalid')).status, 403);
  assert.equal((await request('public/catalog')).status, 404);
  assert.equal((await request('public/shops/tidak-ada')).status, 404);
  const catalog = await ok('public/shops/garasi-barber');
  assert.equal(catalog.org.name, 'Garasi Barber');
  assert.equal(catalog.outlets[0].slug, 'tebet');
  assert.ok(catalog.outlets.length);
  assert.equal('orgId' in catalog.outlets[0], false);
  const outletId = catalog.outlets[0].id,
    service = catalog.services[0],
    barber = catalog.barbers[0];
  const date = new Date(Date.now() + 86400_000 + 7 * 3600_000).toISOString().slice(0, 10);
  const slotData = await ok(
    `public/slots?${new URLSearchParams({ outletId, serviceId: service.id, barberId: barber.id, date })}`,
  );
  assert.ok(slotData.slots.length >= 2);
  const input = {
    outletId,
    serviceId: service.id,
    barberId: barber.id,
    date,
    time: slotData.slots[0],
    name: 'Customer Test',
    phone: '081234567890',
  };
  const simultaneous = await Promise.all([
    request('public/bookings', input),
    request('public/bookings', input),
  ]);
  assert.deepEqual(simultaneous.map((r) => r.status).sort(), [201, 409]);
  const booking = simultaneous.find((r) => r.status === 201).data;
  assert.equal((await request(`public/bookings/${booking.id}`)).status, 404);
  const detail = await ok(`public/bookings/${booking.token}`);
  assert.equal(detail.price, service.price);
  assert.equal(detail.orgSlug, 'garasi-barber');
  // Reschedule availability ignores the booking itself, so its current slot stays selectable.
  const moveSlots = await ok(
    `app/slots?${new URLSearchParams({ outletId, serviceId: service.id, barberId: barber.id, date, bookingId: booking.id })}`,
    undefined,
    cashier,
  );
  assert.ok(moveSlots.slots.includes(input.time));
  assert.equal((await request('app/org', { slug: 'garasi-baru' }, owner, 'PATCH')).status, 409);
  // Resending an unchanged locked link (as a profile form does) is not a change.
  assert.equal(
    (await ok('app/org', { slug: 'garasi-barber' }, owner, 'PATCH')).message,
    'Tidak ada perubahan.',
  );
  assert.equal((await request('app/org', { name: 'Garasi Barber Baru' }, owner, 'PATCH')).status, 409);
  assert.equal((await request('app/org', {}, owner, 'PATCH')).status, 400);
  assert.equal('phone' in detail, false);
  assert.equal(
    (await request(`app/bookings/${booking.id}/pay`, { tendered: service.price }, cashier)).status,
    409,
  );
  const shift = await ok('app/shifts/open', { outletId, opening: 100000 }, cashier);
  assert.equal((await request('app/shifts/open', { outletId, opening: 0 }, cashier)).status, 409);
  assert.equal((await request('auth/logout', {}, cashier)).status, 409);
  assert.equal(
    (await request(`app/bookings/${booking.id}/pay`, { tendered: service.price - 1 }, cashier)).status,
    400,
  );
  // Archiving a service must not block rescheduling bookings that already use it.
  await ok(
    `app/services/${service.id}`,
    { name: service.name, price: service.price, duration: service.duration, active: false },
    owner,
    'PATCH',
  );
  const archivedSlots = await ok(
    `app/slots?${new URLSearchParams({ outletId, serviceId: service.id, barberId: barber.id, date, bookingId: booking.id })}`,
    undefined,
    cashier,
  );
  assert.ok(archivedSlots.slots.includes(input.time));
  assert.equal(
    (
      await request(
        `app/slots?${new URLSearchParams({ outletId, serviceId: service.id, barberId: barber.id, date })}`,
        undefined,
        cashier,
      )
    ).status,
    404,
  );
  await ok(
    `app/services/${service.id}`,
    { name: service.name, price: service.price + 10000, duration: 60, active: true },
    owner,
    'PATCH',
  );
  await ok(`app/bookings/${booking.id}/status`, { status: 'checked_in' }, cashier);
  await ok(`app/bookings/${booking.id}/status`, { status: 'in_service' }, cashier);
  assert.equal(
    (await request(`app/bookings/${booking.id}/status`, { status: 'completed' }, cashier)).status,
    409,
  );
  await ok(`app/bookings/${booking.id}/pay`, { tendered: 100000 }, cashier);
  await ok(`app/bookings/${booking.id}/pay`, { tendered: 100000 }, cashier);
  await ok(`app/bookings/${booking.id}/status`, { status: 'completed' }, cashier);
  let data = await ok('app/data', undefined, owner);
  assert.equal(data.payments.length, 1);
  assert.equal(data.payments[0].amount, service.price);
  assert.equal(data.shifts.find((s) => s.id === shift.id).expected, 100000 + service.price);
  const refund = await ok(
    `app/bookings/${booking.id}/refund`,
    { reason: 'Customer meminta pengembalian' },
    cashier,
  );
  assert.equal(
    (await request(`app/refunds/${refund.id}/decision`, { approved: true, reason: 'Setuju refund' }, cashier))
      .status,
    403,
  );
  await ok(
    `app/refunds/${refund.id}/decision`,
    { approved: true, reason: 'Disetujui Owner setelah pemeriksaan' },
    owner,
  );
  await ok(`app/refunds/${refund.id}/disburse`, {}, cashier);
  assert.equal((await request(`app/refunds/${refund.id}/disburse`, {}, cashier)).status, 409);
  assert.equal(
    (await request(`app/shifts/${shift.id}/close`, { counted: 99999, reason: '' }, cashier)).status,
    400,
  );
  await ok(`app/shifts/${shift.id}/close`, { counted: 100000, reason: '' }, cashier);
  await ok('auth/logout', {}, cashier);
  assert.equal((await request('app/data', undefined, cashier)).status, 401);
  await stop();
  await boot();
  data = await ok('app/data', undefined, owner);
  assert.equal(data.bookings.find((b) => b.id === booking.id).status, 'completed');
  assert.equal(data.shifts.find((s) => s.id === shift.id).expected, 100000);
});

test('registration, token replay, onboarding review, tenant isolation and suspension', async () => {
  const owner = await login('owner'),
    admin = await login('admin');
  const registered = await ok('auth/register', {
    name: 'Owner Kedua',
    business: 'Bisnis Kedua',
    email: 'second@example.test',
    password: 'ExamplePassword123',
  });
  assert.ok(registered.message);
  assert.equal(
    (await request('auth/login', { email: 'second@example.test', password: 'ExamplePassword123' })).status,
    401,
  );
  let mails = (await readFile(resolve(dir, 'mail.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  const token = new URL(mails.at(-1).url).searchParams.get('token');
  await ok('auth/verify', { token });
  assert.equal((await request('auth/verify', { token })).status, 400);
  const second = (
    await request('auth/login', { email: 'second@example.test', password: 'ExamplePassword123' })
  ).cookie;
  const firstData = await ok('app/data', undefined, owner);
  const secondData = await ok('app/data', undefined, second);
  assert.equal(secondData.bookings.length, 0);
  assert.equal(secondData.org.slug, 'bisnis-kedua');
  assert.equal((await request('app/org', { slug: 'garasi-barber' }, second, 'PATCH')).status, 409);
  assert.equal((await request('app/org', { slug: 'Bad Slug!' }, second, 'PATCH')).status, 400);
  await ok('app/org', { name: 'Bisnis Kedua Barber', slug: 'kedua-barber' }, second, 'PATCH');
  assert.equal((await ok('app/data', undefined, second)).org.name, 'Bisnis Kedua Barber');
  secondData.org.slug = 'kedua-barber';
  const foreign = firstData.outlets[0];
  assert.equal(
    (await request('app/services', { outletId: foreign.id, name: 'Foreign', price: 1, duration: 10 }, second))
      .status,
    403,
  );
  const bookingId = firstData.bookings[0].id;
  assert.equal(
    (
      await request(
        `app/bookings/${bookingId}/status`,
        { status: 'cancelled', reason: 'Tidak punya akses' },
        second,
      )
    ).status,
    403,
  );
  const outlet = await ok('app/outlets', { name: 'Outlet Baru', address: 'Alamat outlet baru' }, second);
  await ok('app/services', { outletId: outlet.id, name: 'Potong Baru', price: 50000, duration: 30 }, second);
  await ok(
    'app/barbers',
    { outletId: outlet.id, name: 'Kapster Baru', start: '09:00', end: '18:00', days: [0, 1, 2, 3, 4, 5, 6] },
    second,
  );
  assert.equal(
    (
      await request(
        `app/outlets/${outlet.id}`,
        { name: 'Outlet Baru', address: 'Alamat outlet baru', published: true },
        second,
        'PATCH',
      )
    ).status,
    403,
  );
  await ok('app/approval', {}, second);
  assert.equal((await request('app/org', { name: 'Ganti Saat Review' }, second, 'PATCH')).status, 409);
  await ok(
    `admin/orgs/${secondData.org.id}/status`,
    { status: 'approved', reason: 'Data onboarding lengkap' },
    admin,
  );
  assert.equal(
    (
      await request(
        `app/bookings/${bookingId}/status`,
        { status: 'cancelled', reason: 'Tidak punya akses' },
        second,
      )
    ).status,
    404,
  );
  await ok(
    `app/outlets/${outlet.id}`,
    { name: 'Outlet Baru', address: 'Alamat outlet baru', published: true },
    second,
    'PATCH',
  );
  assert.ok((await ok(`public/shops/${secondData.org.slug}`)).outlets.every((o) => o.id === outlet.id));
  // Once a link has been published it may already be shared, so unpublishing must not unlock it.
  await ok(
    `app/outlets/${outlet.id}`,
    { name: 'Outlet Baru', address: 'Alamat outlet baru', published: false },
    second,
    'PATCH',
  );
  assert.equal((await request('app/org', { slug: 'kedua-ganti' }, second, 'PATCH')).status, 409);
  assert.ok((await ok('app/data', undefined, second)).org.publishedAt);
  await ok(
    `app/outlets/${outlet.id}`,
    { name: 'Outlet Baru', address: 'Alamat outlet baru', published: true },
    second,
    'PATCH',
  );
  assert.equal(
    (await ok('public/shops/garasi-barber')).outlets.some((o) => o.id === outlet.id),
    false,
  );
  await ok(
    `admin/orgs/${secondData.org.id}/status`,
    { status: 'suspended', reason: 'Pengujian pembatasan akses' },
    admin,
  );
  assert.equal((await request(`public/shops/${secondData.org.slug}`)).status, 404);
  assert.equal((await request('app/shifts/open', { outletId: outlet.id, opening: 0 }, second)).status, 403);
  await ok('auth/forgot', { email: 'second@example.test' });
  mails = (await readFile(resolve(dir, 'mail.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  const resetToken = new URL(mails.at(-1).url).searchParams.get('token');
  await ok('auth/reset', { token: resetToken, password: 'NewPassword12345' });
  assert.equal((await request('app/data', undefined, second)).status, 401);
  assert.equal(
    (await request('auth/reset', { token: resetToken, password: 'OtherPassword12345' })).status,
    400,
  );
});

test('database constraints independently reject overlapping bookings', async () => {
  const database = new DatabaseSync(resolve(dir, 'test.sqlite'));
  const row = database.prepare('SELECT * FROM bookings LIMIT 1').get();
  assert.throws(
    () =>
      database
        .prepare(
          'INSERT INTO bookings SELECT ?,orgId,outletId,serviceId,barberId,name,phone,serviceName,price,duration,date,time,starts,ends,status,paid,source,?,created FROM bookings WHERE id=?',
        )
        .run(randomUUID(), 'constraint-test-token', row.id),
    /SLOT_CONFLICT/,
  );
  database.close();
});
