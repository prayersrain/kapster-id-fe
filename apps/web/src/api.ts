export type Entity = Record<string, any>;
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'cashier' | 'admin';
  orgId: string | null;
  outletId: string | null;
};
export type Catalog = {
  outlets: Entity[];
  services: Entity[];
  barbers: Entity[];
  org?: { name: string; slug: string };
};
export type AppData = Catalog & {
  org: Entity;
  bookings: Entity[];
  payments: Entity[];
  refunds: Entity[];
  blocks: Entity[];
  shifts: Entity[];
  team: Entity[];
  audit: Entity[];
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = Entity>(
  path: string,
  body?: unknown,
  method = 'POST',
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: body === undefined ? 'GET' : method,
    credentials: 'same-origin',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json', 'X-Kapster-Request': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const result = await res.json().catch(() => ({ message: 'Server tidak memberikan respons yang valid.' }));
  if (!res.ok) {
    if (res.status === 401 && (path.startsWith('app/') || path.startsWith('admin/')))
      window.dispatchEvent(new Event('kapster-session-expired'));
    throw new ApiError(result.message || 'Permintaan gagal.', res.status);
  }
  return result as T;
}
export const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value,
  );
export const today = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
/** "Sel, 15 Sep" for a WIB calendar date (YYYY-MM-DD). */
export const shortDate = (date: string, withWeekday = true) =>
  new Date(`${date}T12:00:00+07:00`).toLocaleDateString('id-ID', {
    weekday: withWeekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  });
export const dayLabel = (date: string) => {
  const offset = Math.round(
    (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today()}T12:00:00Z`)) / 86400_000,
  );
  return offset === 0 ? 'Hari ini' : offset === 1 ? 'Besok' : offset === -1 ? 'Kemarin' : shortDate(date);
};
export { bookingLink } from './links';
export const labels: Record<string, string> = {
  draft: 'Draft',
  pending: 'Menunggu review',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  suspended: 'Ditangguhkan',
  confirmed: 'Dikonfirmasi',
  checked_in: 'Sudah datang',
  in_service: 'Sedang dilayani',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak hadir',
  paid: 'Dikembalikan',
  owner: 'Owner',
  cashier: 'Kasir',
  admin: 'Admin Platform',
};
