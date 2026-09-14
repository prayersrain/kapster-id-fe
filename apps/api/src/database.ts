import { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export const databaseFile = resolve(process.env.DB_FILE || '.local/kapster.sqlite');
export const localDir = dirname(databaseFile);
mkdirSync(localDir, { recursive: true });
export const db = new DatabaseSync(databaseFile);
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS orgs (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', reason TEXT NOT NULL DEFAULT '', created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS outlets (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), name TEXT NOT NULL, address TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, orgId TEXT REFERENCES orgs(id), outletId TEXT REFERENCES outlets(id), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','cashier','admin')), verified INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS tokens (token TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), outletId TEXT NOT NULL REFERENCES outlets(id), name TEXT NOT NULL, price INTEGER NOT NULL CHECK(price >= 0), duration INTEGER NOT NULL CHECK(duration > 0), active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS barbers (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), outletId TEXT NOT NULL REFERENCES outlets(id), name TEXT NOT NULL, start TEXT NOT NULL DEFAULT '09:00', end TEXT NOT NULL DEFAULT '18:00', days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]', active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS blocks (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), outletId TEXT NOT NULL REFERENCES outlets(id), barberId TEXT NOT NULL REFERENCES barbers(id), date TEXT NOT NULL, reason TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), outletId TEXT NOT NULL REFERENCES outlets(id), serviceId TEXT NOT NULL REFERENCES services(id), barberId TEXT NOT NULL REFERENCES barbers(id), name TEXT NOT NULL, phone TEXT NOT NULL, serviceName TEXT NOT NULL, price INTEGER NOT NULL, duration INTEGER NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, starts INTEGER NOT NULL, ends INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'confirmed', paid INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL, token TEXT NOT NULL UNIQUE, created TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS booking_overlap ON bookings(barberId, starts, ends, status);
  CREATE TRIGGER IF NOT EXISTS booking_insert_overlap BEFORE INSERT ON bookings
  WHEN NEW.status NOT IN ('cancelled','no_show') AND EXISTS(SELECT 1 FROM bookings WHERE barberId=NEW.barberId AND status NOT IN ('cancelled','no_show') AND starts < NEW.ends AND ends > NEW.starts)
  BEGIN SELECT RAISE(ABORT, 'SLOT_CONFLICT'); END;
  CREATE TRIGGER IF NOT EXISTS booking_update_overlap BEFORE UPDATE OF starts, ends, barberId, status ON bookings
  WHEN NEW.status NOT IN ('cancelled','no_show') AND EXISTS(SELECT 1 FROM bookings WHERE id!=NEW.id AND barberId=NEW.barberId AND status NOT IN ('cancelled','no_show') AND starts < NEW.ends AND ends > NEW.starts)
  BEGIN SELECT RAISE(ABORT, 'SLOT_CONFLICT'); END;
  CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), outletId TEXT NOT NULL REFERENCES outlets(id), userId TEXT NOT NULL REFERENCES users(id), opening INTEGER NOT NULL, opened TEXT NOT NULL, closed TEXT, counted INTEGER, expected INTEGER, reason TEXT NOT NULL DEFAULT '');
  CREATE UNIQUE INDEX IF NOT EXISTS one_open_shift ON shifts(userId) WHERE closed IS NULL;
  CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), outletId TEXT NOT NULL REFERENCES outlets(id), bookingId TEXT NOT NULL UNIQUE REFERENCES bookings(id), shiftId TEXT NOT NULL REFERENCES shifts(id), amount INTEGER NOT NULL, tendered INTEGER NOT NULL, created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS refunds (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), outletId TEXT NOT NULL REFERENCES outlets(id), bookingId TEXT NOT NULL UNIQUE REFERENCES bookings(id), reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', requestedBy TEXT NOT NULL REFERENCES users(id), decidedBy TEXT REFERENCES users(id), decisionReason TEXT, cashShiftId TEXT REFERENCES shifts(id), created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, orgId TEXT, actor TEXT NOT NULL, action TEXT NOT NULL, entityId TEXT NOT NULL, reason TEXT NOT NULL, created TEXT NOT NULL);
`);
export type Row = Record<string, any>;
export function all(sql: string, ...args: SQLInputValue[]): Row[] {
  return db.prepare(sql).all(...args) as Row[];
}
export function one(sql: string, ...args: SQLInputValue[]): Row | undefined {
  return db.prepare(sql).get(...args) as Row | undefined;
}
export function run(sql: string, ...args: SQLInputValue[]) {
  return db.prepare(sql).run(...args);
}
if (!all('PRAGMA table_info(refunds)').some((column) => column.name === 'paidAt'))
  db.exec('ALTER TABLE refunds ADD COLUMN paidAt TEXT');
export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export const id = () => randomUUID();
export const secret = () => randomBytes(32).toString('hex');
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function hashPassword(value: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(value, salt, 64).toString('hex')}`;
}
export function checkPassword(value: string, stored: string) {
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(value, salt, 64));
}
export const now = () => new Date().toISOString();
export function audit(actor: Row, action: string, entityId: string, reason = '') {
  run(
    'INSERT INTO audit VALUES(?,?,?,?,?,?,?)',
    id(),
    actor.orgId ?? null,
    actor.id,
    action,
    entityId,
    reason,
    now(),
  );
}
export function localMail(user: Row, kind: 'verify' | 'reset') {
  const token = secret();
  run('DELETE FROM tokens WHERE userId=? AND kind=?', user.id, kind);
  run('INSERT INTO tokens VALUES(?,?,?,?)', digest(token), user.id, kind, Date.now() + 30 * 60_000);
  appendFileSync(
    resolve(localDir, 'mail.jsonl'),
    JSON.stringify({
      to: user.email,
      kind,
      url: `http://127.0.0.1:5173/${kind === 'verify' ? 'verify-email' : 'reset-password'}?token=${token}`,
      expiresMinutes: 30,
    }) + '\n',
    { mode: 0o600 },
  );
}
export function seed() {
  if (one('SELECT id FROM users LIMIT 1')) return;
  const org = id(),
    outlet = id();
  run('INSERT INTO orgs VALUES(?,?,?,?,?)', org, 'Garasi Barber', 'approved', '', now());
  run(
    'INSERT INTO outlets VALUES(?,?,?,?,?,?)',
    outlet,
    org,
    'Garasi Barber Tebet',
    'Tebet, Jakarta Selatan',
    1,
    1,
  );
  run('INSERT INTO services VALUES(?,?,?,?,?,?,?)', id(), org, outlet, 'Haircut', 65000, 45, 1);
  run('INSERT INTO services VALUES(?,?,?,?,?,?,?)', id(), org, outlet, 'Haircut + Wash', 85000, 60, 1);
  run(
    'INSERT INTO barbers VALUES(?,?,?,?,?,?,?,?)',
    id(),
    org,
    outlet,
    'Raka',
    '09:00',
    '18:00',
    '[0,1,2,3,4,5,6]',
    1,
  );
  const accounts = ['admin', 'owner', 'cashier'].map((role) => {
    const password = secret().slice(0, 20);
    const email = `${role}@kapster.local`;
    run(
      'INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)',
      id(),
      role === 'admin' ? null : org,
      role === 'cashier' ? outlet : null,
      role === 'cashier' ? 'Kasir Tebet' : role === 'owner' ? 'Owner Garasi' : 'Admin Platform',
      email,
      hashPassword(password),
      role,
      1,
      1,
    );
    return { email, password, role };
  });
  writeFileSync(resolve(localDir, 'accounts.json'), JSON.stringify(accounts, null, 2), { mode: 0o600 });
}
