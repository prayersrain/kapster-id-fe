import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const dir = resolve('.local', `test-migration-${randomUUID()}`),
  file = resolve(dir, 'legacy.sqlite'),
  port = 4109;
const base = `http://127.0.0.1:${port}/api/`;
const tables = [
  'orgs',
  'outlets',
  'users',
  'sessions',
  'tokens',
  'services',
  'barbers',
  'blocks',
  'bookings',
  'shifts',
  'payments',
  'refunds',
  'audit',
];
const keyOf = (table) => (['sessions', 'tokens'].includes(table) ? 'token' : 'id');
let server;

async function request(path, body, cookie = '', method = 'POST') {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : method,
    headers: {
      Cookie: cookie,
      Origin: 'http://127.0.0.1:5173',
      'Content-Type': 'application/json',
      'X-Kapster-Request': '1',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
async function boot() {
  let output = '';
  server = spawn(process.execPath, ['apps/api/dist/main.js'], {
    env: { ...process.env, PORT: String(port), DB_FILE: file },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => (output += chunk));
  server.stderr.on('data', (chunk) => (output += chunk));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await request('health')).status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Server failed to start: ${output}`);
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise((r) => server.once('exit', r));
  server.kill();
  await exited;
}
after(stop);

const hash = (password) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};
/** Column names per table, as the database currently has them. */
function columnsOf() {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    return Object.fromEntries(
      tables.map((table) => [
        table,
        db
          .prepare(`PRAGMA table_info(${table})`)
          .all()
          .map((column) => column.name),
      ]),
    );
  } finally {
    db.close();
  }
}
/** Rows of every table, restricted to the given columns per table, in a stable order. */
function snapshot(columns) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    return Object.fromEntries(
      tables.map((table) => {
        const cols =
          columns?.[table] ??
          db
            .prepare(`PRAGMA table_info(${table})`)
            .all()
            .map((c) => c.name);
        return [table, db.prepare(`SELECT ${cols.join(',')} FROM ${table} ORDER BY ${keyOf(table)}`).all()];
      }),
    );
  } finally {
    db.close();
  }
}

test('legacy database migrates once, keeps data, locks shared links, and is stable across restarts', async () => {
  await mkdir(dir, { recursive: true });
  const legacy = new DatabaseSync(file);
  legacy.exec(await readFile(resolve('tests/fixtures/legacy-schema.sql'), 'utf8'));
  const insert = (table, row) =>
    legacy
      .prepare(
        `INSERT INTO ${table}(${Object.keys(row).join(',')}) VALUES(${Object.keys(row)
          .map(() => '?')
          .join(',')})`,
      )
      .run(...Object.values(row));
  const date = new Date(Date.now() + 2 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10);
  const at = (time) => Date.parse(`${date}T${time}:00+07:00`);
  // A: live outlet. B: reserved name, unpublished now but already took public bookings.
  // C: same name as A, draft with only cashier bookings. D: accented name, never used publicly.
  const orgs = {
    a: {
      name: 'Garasi Barber',
      status: 'approved',
      created: '2026-09-01T00:00:00.000Z',
      outlet: 'Garasi Barber Tebet',
      published: 1,
    },
    b: {
      name: 'Status',
      status: 'approved',
      created: '2026-09-02T00:00:00.000Z',
      outlet: 'Cabang Utama',
      published: 0,
    },
    c: {
      name: 'Garasi Barber',
      status: 'draft',
      created: '2026-09-05T00:00:00.000Z',
      outlet: 'Garasi Barber',
      published: 0,
    },
    d: {
      name: 'Barbér Café & Co',
      status: 'approved',
      created: '2026-09-06T00:00:00.000Z',
      outlet: 'Kemang',
      published: 0,
    },
  };
  const ids = {};
  insert('users', {
    id: randomUUID(),
    orgId: null,
    outletId: null,
    name: 'Admin',
    email: 'admin@legacy.test',
    password: hash('LegacyAdmin12345'),
    role: 'admin',
    verified: 1,
    active: 1,
  });
  for (const [key, org] of Object.entries(orgs)) {
    const id = (ids[key] = {
      org: randomUUID(),
      outlet: randomUUID(),
      service: randomUUID(),
      barber: randomUUID(),
      owner: randomUUID(),
    });
    insert('orgs', { id: id.org, name: org.name, status: org.status, reason: '', created: org.created });
    insert('outlets', {
      id: id.outlet,
      orgId: id.org,
      name: org.outlet,
      address: `Alamat ${key}`,
      published: org.published,
      active: 1,
    });
    insert('users', {
      id: id.owner,
      orgId: id.org,
      outletId: null,
      name: `Owner ${key}`,
      email: `owner-${key}@legacy.test`,
      password: hash('LegacyOwner12345'),
      role: 'owner',
      verified: 1,
      active: 1,
    });
    insert('services', {
      id: id.service,
      orgId: id.org,
      outletId: id.outlet,
      name: 'Haircut',
      price: 60000,
      duration: 45,
      active: 1,
    });
    insert('barbers', {
      id: id.barber,
      orgId: id.org,
      outletId: id.outlet,
      name: `Kapster ${key}`,
      start: '09:00',
      end: '18:00',
      days: '[0,1,2,3,4,5,6]',
      active: 1,
    });
  }
  const booking = (key, source, time, extra = {}) => {
    const id = randomUUID();
    insert('bookings', {
      id,
      orgId: ids[key].org,
      outletId: ids[key].outlet,
      serviceId: ids[key].service,
      barberId: ids[key].barber,
      name: `Customer ${key}`,
      phone: '6281234567890',
      serviceName: 'Haircut',
      price: 60000,
      duration: 45,
      date,
      time,
      starts: at(time),
      ends: at(time) + 55 * 60_000,
      status: 'confirmed',
      paid: 0,
      source,
      token: randomBytes(32).toString('hex'),
      created: '2026-09-10T00:00:00.000Z',
      ...extra,
    });
    return id;
  };
  const paidBooking = booking('a', 'public', '10:00', { status: 'completed', paid: 1 });
  booking('b', 'public', '11:00');
  booking('c', 'cashier', '12:00');
  const shift = randomUUID();
  insert('shifts', {
    id: shift,
    orgId: ids.a.org,
    outletId: ids.a.outlet,
    userId: ids.a.owner,
    opening: 100000,
    opened: '2026-09-10T01:00:00.000Z',
    closed: null,
    counted: null,
    expected: null,
    reason: '',
  });
  insert('payments', {
    id: randomUUID(),
    orgId: ids.a.org,
    outletId: ids.a.outlet,
    bookingId: paidBooking,
    shiftId: shift,
    amount: 60000,
    tendered: 100000,
    created: '2026-09-10T02:00:00.000Z',
  });
  insert('blocks', {
    id: randomUUID(),
    orgId: ids.d.org,
    outletId: ids.d.outlet,
    barberId: ids.d.barber,
    date,
    reason: 'Cuti',
  });
  insert('audit', {
    id: randomUUID(),
    orgId: ids.a.org,
    actor: ids.a.owner,
    action: 'booking.created',
    entityId: paidBooking,
    reason: '',
    created: '2026-09-10T00:00:00.000Z',
  });
  legacy.close();

  const legacyColumns = columnsOf();
  const before = snapshot(legacyColumns);
  assert.equal(legacyColumns.orgs.includes('slug'), false, 'fixture is a pre-migration database');

  await boot();
  await stop();
  assert.deepEqual(snapshot(legacyColumns), before, 'existing rows and columns are unchanged');
  const migrated = snapshot();
  const org = (key) => migrated.orgs.find((o) => o.id === ids[key].org);
  const outlet = (key) => migrated.outlets.find((o) => o.id === ids[key].outlet);
  assert.deepEqual(
    ['a', 'b', 'c', 'd'].map((k) => [org(k).slug, outlet(k).slug, !!org(k).publishedAt]),
    [
      ['garasi-barber', 'tebet', true],
      ['status-barber', 'cabang-utama', true],
      ['garasi-barber-2', 'garasi-barber', false],
      ['barber-cafe-co', 'kemang', false],
    ],
  );
  const db = new DatabaseSync(file, { readOnly: true });
  const indexes = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name IN ('org_slug','outlet_slug') ORDER BY name",
    )
    .all()
    .map((i) => i.name);
  db.close();
  assert.deepEqual(indexes, ['org_slug', 'outlet_slug']);

  await boot();
  await stop();
  assert.deepEqual(snapshot(), migrated, 'a second start changes nothing');

  await boot();
  const owner = async (key) =>
    (await request('auth/login', { email: `owner-${key}@legacy.test`, password: 'LegacyOwner12345' })).cookie;
  const a = await owner('a');
  assert.ok(a, 'legacy password hashes still log in');
  const shop = await request('public/shops/garasi-barber');
  assert.equal(shop.status, 200);
  assert.deepEqual(
    shop.data.outlets.map((o) => o.slug),
    ['tebet'],
  );
  assert.equal((await request('public/shops/garasi-barber-2')).status, 404, 'draft shop stays private');
  assert.equal((await request('app/org', { slug: 'garasi-baru' }, a, 'PATCH')).status, 409);
  assert.equal((await request('app/org', { slug: 'status-baru' }, await owner('b'), 'PATCH')).status, 409);
  assert.equal((await request('app/org', { slug: 'cafe-kemang' }, await owner('d'), 'PATCH')).status, 200);
  const data = await request('app/data', undefined, a);
  assert.equal(data.data.payments.length, 1);
  assert.equal(data.data.bookings.length, 1);
  await stop();
});
