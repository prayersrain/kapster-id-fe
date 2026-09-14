import { ConflictException, NotFoundException } from '@nestjs/common';
import { one, all, run, id, secret, now, transaction, audit, Row } from './database';
import { bookingInput, parse, date as dateSchema } from './validation';

export function availability(
  outletId: string,
  serviceId: string,
  barberId: string,
  date: string,
  internal = false,
  ignoreId = '',
) {
  parse(dateSchema, date);
  const service = one('SELECT * FROM services WHERE id=? AND outletId=? AND active=1', serviceId, outletId);
  const barber = one('SELECT * FROM barbers WHERE id=? AND outletId=? AND active=1', barberId, outletId);
  const outlet = one(
    'SELECT o.*, g.status FROM outlets o JOIN orgs g ON g.id=o.orgId WHERE o.id=? AND o.active=1',
    outletId,
  );
  if (!service || !barber || !outlet || outlet.status !== 'approved' || (!internal && !outlet.published))
    throw new NotFoundException('Layanan atau outlet tidak tersedia.');
  const weekday = new Date(`${date}T12:00:00+07:00`).getUTCDay();
  if (
    !JSON.parse(barber.days).includes(weekday) ||
    one('SELECT id FROM blocks WHERE barberId=? AND date=?', barberId, date)
  )
    return { slots: [] as string[], service, barber, outlet };
  const opening = Date.parse(`${date}T${barber.start}:00+07:00`);
  const closing = Date.parse(`${date}T${barber.end}:00+07:00`);
  const bookings = all(
    "SELECT starts, ends FROM bookings WHERE barberId=? AND date=? AND id!=? AND status NOT IN ('cancelled','no_show')",
    barberId,
    date,
    ignoreId,
  );
  const slots: string[] = [];
  const duration = (service.duration + 10) * 60_000;
  for (let start = opening; start + duration <= closing; start += duration) {
    if (start < Date.now() + (internal ? 0 : 60 * 60_000) || start > Date.now() + 30 * 86400_000) continue;
    if (bookings.some((b) => b.starts < start + duration && b.ends > start)) continue;
    slots.push(new Date(start + 7 * 3600_000).toISOString().slice(11, 16));
  }
  return { slots, service, barber, outlet };
}
export function createBooking(body: unknown, actor?: Row) {
  const data = parse(bookingInput, body);
  return transaction(() => {
    const { slots, service, outlet } = availability(
      data.outletId,
      data.serviceId,
      data.barberId,
      data.date,
      !!actor,
    );
    if (!slots.includes(data.time))
      throw new ConflictException('Slot sudah terisi atau di luar jadwal. Pilih waktu lain.');
    const bookingId = id(),
      token = secret();
    const starts = Date.parse(`${data.date}T${data.time}:00+07:00`);
    run(
      'INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      bookingId,
      outlet.orgId,
      data.outletId,
      data.serviceId,
      data.barberId,
      data.name,
      data.phone,
      service.name,
      service.price,
      service.duration,
      data.date,
      data.time,
      starts,
      starts + (service.duration + 10) * 60000,
      'confirmed',
      0,
      actor ? 'cashier' : 'public',
      token,
      now(),
    );
    audit(actor ?? { id: 'public', orgId: outlet.orgId }, 'booking.created', bookingId);
    return { id: bookingId, token };
  });
}
export function expectedCash(shift: Row) {
  const incoming = one(
    'SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE shiftId=?',
    shift.id,
  )!.total;
  const outgoing = one(
    "SELECT COALESCE(SUM(b.price),0) AS total FROM refunds r JOIN bookings b ON b.id=r.bookingId WHERE r.cashShiftId=? AND r.status='paid'",
    shift.id,
  )!.total;
  return shift.opening + incoming - outgoing;
}
