import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import {
  all,
  one,
  run,
  id,
  now,
  hashPassword,
  transaction,
  localMail,
  audit,
  Row,
  outletSlug,
  slugify,
  reservedSlugs,
} from './database';
import { parse, text, email, uuid, money, reason, date, time, jakartaDate } from './validation';
import { AuthGuard, AuthRequest, scope, role, operational } from './auth';
import { availability, createBooking, expectedCash } from './booking';

@Controller('api/app')
@UseGuards(AuthGuard)
export class AppController {
  private booking(user: Row, bookingId: string) {
    const booking = one('SELECT * FROM bookings WHERE id=? AND orgId=?', bookingId, user.orgId);
    if (!booking) throw new NotFoundException('Booking tidak ditemukan.');
    scope(user, booking.outletId);
    return booking;
  }
  @Get('data') data(@Req() req: AuthRequest) {
    const user = req.user;
    scope(user);
    const params = user.role === 'cashier' ? [user.orgId, user.outletId] : [user.orgId];
    const filter = user.role === 'cashier' ? 'orgId=? AND outletId=?' : 'orgId=?';
    const shifts = all(`SELECT * FROM shifts WHERE ${filter} ORDER BY opened DESC`, ...params).map(
      (shift) => ({ ...shift, expected: shift.closed ? shift.expected : expectedCash(shift) }),
    );
    const bookingFilter = user.role === 'cashier' ? `${filter} AND date>=?` : filter;
    const bookingParams = user.role === 'cashier' ? [...params, jakartaDate()] : params;
    const bookings = all(
      `SELECT id,orgId,outletId,serviceId,barberId,name,phone,serviceName,price,duration,date,time,starts,ends,status,paid,source,created FROM bookings WHERE ${bookingFilter} ORDER BY starts DESC`,
      ...bookingParams,
    );
    return {
      org: one('SELECT * FROM orgs WHERE id=?', user.orgId),
      outlets: all(
        user.role === 'cashier'
          ? 'SELECT * FROM outlets WHERE orgId=? AND id=?'
          : 'SELECT * FROM outlets WHERE orgId=?',
        ...params,
      ),
      services: all(`SELECT * FROM services WHERE ${filter}`, ...params),
      barbers: all(`SELECT * FROM barbers WHERE ${filter}`, ...params),
      blocks: all(`SELECT * FROM blocks WHERE ${filter}`, ...params),
      bookings,
      payments: all(`SELECT * FROM payments WHERE ${filter} ORDER BY created DESC`, ...params),
      shifts,
      refunds: all(`SELECT * FROM refunds WHERE ${filter} ORDER BY created DESC`, ...params),
      team:
        user.role === 'owner'
          ? all('SELECT id,name,email,role,outletId,active,verified FROM users WHERE orgId=?', user.orgId)
          : [],
      audit:
        user.role === 'owner'
          ? all(
              'SELECT a.*, u.name AS actorName FROM audit a LEFT JOIN users u ON u.id=a.actor WHERE a.orgId=? ORDER BY a.created DESC LIMIT 150',
              user.orgId,
            )
          : [],
    };
  }
  @Post('outlets') outlet(@Req() req: AuthRequest, @Body() body: unknown) {
    role(req.user, 'owner');
    const data = parse(z.object({ name: text, address: text }), body);
    const outletId = id();
    transaction(() => {
      run(
        'INSERT INTO outlets(id,orgId,name,address,published,active,slug) VALUES(?,?,?,?,?,?,?)',
        outletId,
        req.user.orgId,
        data.name,
        data.address,
        0,
        1,
        outletSlug(req.user.orgId, data.name),
      );
      audit(req.user, 'outlet.created', outletId);
    });
    return { id: outletId };
  }
  @Patch('org') editOrg(@Req() req: AuthRequest, @Body() body: unknown) {
    role(req.user, 'owner');
    const data = parse(
      z.object({
        slug: z
          .string()
          .trim()
          .toLowerCase()
          .regex(
            /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/,
            'Gunakan 3–48 huruf kecil, angka, atau tanda hubung.',
          ),
      }),
      body,
    );
    if (slugify(data.slug) !== data.slug || reservedSlugs.has(data.slug))
      throw new BadRequestException('Link booking tidak dapat memakai nama tersebut.');
    return transaction(() => {
      // A link that was ever published may already be shared; unpublishing later does not make it safe to change.
      if (one('SELECT publishedAt FROM orgs WHERE id=?', req.user.orgId)?.publishedAt)
        throw new ConflictException(
          'Link booking terkunci karena sudah pernah diterbitkan dan mungkin sudah dibagikan ke customer.',
        );
      if (one('SELECT id FROM orgs WHERE slug=? AND id!=?', data.slug, req.user.orgId))
        throw new ConflictException('Link booking sudah dipakai bisnis lain. Coba nama lain.');
      run('UPDATE orgs SET slug=? WHERE id=?', data.slug, req.user.orgId);
      audit(req.user, 'org.slug_updated', req.user.orgId, data.slug);
      return { ok: true, message: `Link booking diperbarui menjadi /booking/${data.slug}.` };
    });
  }
  @Patch('outlets/:id') editOutlet(
    @Req() req: AuthRequest,
    @Param('id') outletId: string,
    @Body() body: unknown,
  ) {
    role(req.user, 'owner');
    scope(req.user, outletId);
    const data = parse(z.object({ name: text, address: text, published: z.boolean() }), body);
    if (data.published) {
      operational(req.user);
      if (
        !one('SELECT id FROM services WHERE outletId=? AND active=1', outletId) ||
        !one('SELECT id FROM barbers WHERE outletId=? AND active=1', outletId)
      )
        throw new BadRequestException('Tambahkan layanan dan kapster sebelum menerbitkan booking.');
    }
    transaction(() => {
      if (data.published)
        run('UPDATE orgs SET publishedAt=COALESCE(publishedAt, ?) WHERE id=?', now(), req.user.orgId);
      run(
        'UPDATE outlets SET name=?,address=?,published=? WHERE id=?',
        data.name,
        data.address,
        +data.published,
        outletId,
      );
      audit(req.user, 'outlet.updated', outletId);
    });
    return { ok: true };
  }
  @Post('services') service(@Req() req: AuthRequest, @Body() body: unknown) {
    role(req.user, 'owner');
    const data = parse(
      z.object({ outletId: uuid, name: text, price: money, duration: z.number().int().min(5).max(240) }),
      body,
    );
    scope(req.user, data.outletId);
    const serviceId = id();
    transaction(() => {
      run(
        'INSERT INTO services VALUES(?,?,?,?,?,?,?)',
        serviceId,
        req.user.orgId,
        data.outletId,
        data.name,
        data.price,
        data.duration,
        1,
      );
      audit(req.user, 'service.created', serviceId);
    });
    return { id: serviceId };
  }
  @Patch('services/:id') editService(
    @Req() req: AuthRequest,
    @Param('id') serviceId: string,
    @Body() body: unknown,
  ) {
    role(req.user, 'owner');
    if (!one('SELECT id FROM services WHERE id=? AND orgId=?', serviceId, req.user.orgId))
      throw new NotFoundException();
    const data = parse(
      z.object({ name: text, price: money, duration: z.number().int().min(5).max(240), active: z.boolean() }),
      body,
    );
    transaction(() => {
      run(
        'UPDATE services SET name=?,price=?,duration=?,active=? WHERE id=?',
        data.name,
        data.price,
        data.duration,
        +data.active,
        serviceId,
      );
      audit(req.user, 'service.updated', serviceId);
    });
    return { ok: true };
  }
  @Post('barbers') barber(@Req() req: AuthRequest, @Body() body: unknown) {
    role(req.user, 'owner');
    const data = parse(
      z.object({
        outletId: uuid,
        name: text,
        start: time,
        end: time,
        days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
      }),
      body,
    );
    scope(req.user, data.outletId);
    if (data.start >= data.end) throw new BadRequestException('Jam tutup harus setelah jam buka.');
    const barberId = id();
    transaction(() => {
      run(
        'INSERT INTO barbers VALUES(?,?,?,?,?,?,?,?)',
        barberId,
        req.user.orgId,
        data.outletId,
        data.name,
        data.start,
        data.end,
        JSON.stringify([...new Set(data.days)]),
        1,
      );
      audit(req.user, 'barber.created', barberId);
    });
    return { id: barberId };
  }
  @Patch('barbers/:id') editBarber(
    @Req() req: AuthRequest,
    @Param('id') barberId: string,
    @Body() body: unknown,
  ) {
    role(req.user, 'owner');
    if (!one('SELECT id FROM barbers WHERE id=? AND orgId=?', barberId, req.user.orgId))
      throw new NotFoundException();
    const data = parse(
      z.object({
        name: text,
        start: time,
        end: time,
        days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
        active: z.boolean(),
      }),
      body,
    );
    if (data.start >= data.end) throw new BadRequestException('Jam tutup harus setelah jam buka.');
    const future = all(
      "SELECT * FROM bookings WHERE barberId=? AND ends>? AND status NOT IN ('cancelled','no_show','completed')",
      barberId,
      Date.now(),
    );
    if (
      future.some(
        (b) =>
          !data.active ||
          b.time < data.start ||
          new Date(b.ends + 7 * 3600_000).toISOString().slice(11, 16) > data.end ||
          !data.days.includes(new Date(`${b.date}T12:00:00+07:00`).getUTCDay()),
      )
    )
      throw new ConflictException(
        'Pindahkan atau batalkan booking terdampak sebelum mengubah jadwal kapster.',
      );
    transaction(() => {
      run(
        'UPDATE barbers SET name=?,start=?,end=?,days=?,active=? WHERE id=?',
        data.name,
        data.start,
        data.end,
        JSON.stringify([...new Set(data.days)]),
        +data.active,
        barberId,
      );
      audit(req.user, 'barber.updated', barberId);
    });
    return { ok: true };
  }
  @Post('blocks') block(@Req() req: AuthRequest, @Body() body: unknown) {
    role(req.user, 'owner');
    const data = parse(z.object({ barberId: uuid, date, reason }), body);
    const barber = one('SELECT * FROM barbers WHERE id=? AND orgId=?', data.barberId, req.user.orgId);
    if (!barber) throw new NotFoundException();
    const blockId = id();
    transaction(() => {
      run(
        'INSERT INTO blocks VALUES(?,?,?,?,?,?)',
        blockId,
        req.user.orgId,
        barber.outletId,
        barber.id,
        data.date,
        data.reason,
      );
      audit(req.user, 'schedule.blocked', blockId, data.reason);
    });
    return {
      id: blockId,
      affected: all(
        "SELECT id FROM bookings WHERE barberId=? AND date=? AND status NOT IN ('cancelled','no_show','completed')",
        barber.id,
        data.date,
      ).map((b) => b.id),
    };
  }
  @Post('blocks/:id/remove') removeBlock(@Req() req: AuthRequest, @Param('id') blockId: string) {
    role(req.user, 'owner');
    if (!one('SELECT id FROM blocks WHERE id=? AND orgId=?', blockId, req.user.orgId))
      throw new NotFoundException();
    transaction(() => {
      run('DELETE FROM blocks WHERE id=?', blockId);
      audit(req.user, 'schedule.unblocked', blockId);
    });
    return { ok: true };
  }
  @Post('team') team(@Req() req: AuthRequest, @Body() body: unknown) {
    role(req.user, 'owner');
    const data = parse(z.object({ name: text, email, outletId: uuid }), body);
    scope(req.user, data.outletId);
    if (one('SELECT id FROM users WHERE email=?', data.email))
      throw new ConflictException('Email sudah digunakan.');
    const userId = id();
    transaction(() => {
      run(
        'INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)',
        userId,
        req.user.orgId,
        data.outletId,
        data.name,
        data.email,
        hashPassword(id()),
        'cashier',
        0,
        1,
      );
      audit(req.user, 'team.invited', userId);
    });
    localMail(one('SELECT * FROM users WHERE id=?', userId)!, 'reset');
    return { id: userId, message: 'Undangan pengaturan password tersedia di kotak email lokal.' };
  }
  @Patch('team/:id') editTeam(@Req() req: AuthRequest, @Param('id') userId: string, @Body() body: unknown) {
    role(req.user, 'owner');
    const data = parse(z.object({ active: z.boolean(), outletId: uuid }), body);
    scope(req.user, data.outletId);
    if (!one("SELECT id FROM users WHERE id=? AND orgId=? AND role='cashier'", userId, req.user.orgId))
      throw new NotFoundException();
    if (one('SELECT id FROM shifts WHERE userId=? AND closed IS NULL', userId))
      throw new ConflictException('Tutup shift anggota ini terlebih dahulu.');
    transaction(() => {
      run('UPDATE users SET active=?,outletId=? WHERE id=?', +data.active, data.outletId, userId);
      run('DELETE FROM sessions WHERE userId=?', userId);
      audit(req.user, 'team.updated', userId);
    });
    return { ok: true };
  }
  @Post('approval') approval(@Req() req: AuthRequest) {
    role(req.user, 'owner');
    const org = one('SELECT * FROM orgs WHERE id=?', req.user.orgId)!;
    if (!['draft', 'rejected'].includes(org.status))
      throw new ConflictException('Status bisnis tidak dapat diajukan ulang saat ini.');
    const outlets = all('SELECT id FROM outlets WHERE orgId=? AND active=1', req.user.orgId);
    if (
      !outlets.length ||
      outlets.some(
        (o) =>
          !one('SELECT id FROM services WHERE outletId=? AND active=1', o.id) ||
          !one('SELECT id FROM barbers WHERE outletId=? AND active=1', o.id),
      )
    )
      throw new BadRequestException('Lengkapi outlet, layanan, dan kapster pada setiap outlet.');
    transaction(() => {
      run("UPDATE orgs SET status='pending',reason='' WHERE id=?", req.user.orgId);
      audit(req.user, 'org.submitted', req.user.orgId);
    });
    return { ok: true };
  }
  @Get('slots') slots(@Req() req: AuthRequest, @Query() query: unknown) {
    operational(req.user);
    const data = parse(
      z.object({ outletId: uuid, serviceId: uuid, barberId: uuid, date, bookingId: uuid.optional() }),
      query,
    );
    scope(req.user, data.outletId);
    // Rescheduling keeps the booking's snapshot duration and must not collide with itself.
    const booking = data.bookingId ? this.booking(req.user, data.bookingId) : undefined;
    return {
      slots: availability(data.outletId, data.serviceId, data.barberId, data.date, true, booking).slots,
    };
  }
  @Post('bookings') book(@Req() req: AuthRequest, @Body() body: unknown) {
    operational(req.user);
    const data = parse(z.object({ outletId: uuid }).passthrough(), body);
    scope(req.user, data.outletId);
    if (
      !one(
        'SELECT id FROM shifts WHERE userId=? AND outletId=? AND closed IS NULL',
        req.user.id,
        data.outletId,
      )
    )
      throw new ConflictException('Buka shift pada outlet ini sebelum membuat booking kasir.');
    return createBooking(body, req.user);
  }
  @Post('bookings/:id/status') status(
    @Req() req: AuthRequest,
    @Param('id') bookingId: string,
    @Body() body: unknown,
  ) {
    operational(req.user);
    const data = parse(
      z.object({
        status: z.enum(['checked_in', 'in_service', 'completed', 'cancelled', 'no_show']),
        reason: z.string().max(500).optional(),
      }),
      body,
    );
    return transaction(() => {
      const booking = this.booking(req.user, bookingId);
      const allowed: Record<string, string[]> = {
        confirmed: ['checked_in', 'cancelled', 'no_show'],
        checked_in: ['in_service', 'cancelled'],
        in_service: ['completed'],
        completed: [],
        cancelled: [],
        no_show: [],
      };
      if (!allowed[booking.status]?.includes(data.status))
        throw new ConflictException('Perubahan status tidak diizinkan. Muat ulang booking.');
      if (['cancelled', 'no_show'].includes(data.status)) parse(reason, data.reason);
      if (data.status === 'no_show' && Date.now() < booking.starts + 15 * 60000)
        throw new BadRequestException('No-show hanya setelah toleransi 15 menit terlewati.');
      if (data.status === 'completed' && !booking.paid)
        throw new ConflictException('Catat pembayaran sebelum menyelesaikan layanan.');
      run('UPDATE bookings SET status=? WHERE id=?', data.status, bookingId);
      audit(req.user, `booking.${data.status}`, bookingId, data.reason ?? '');
      return { ok: true };
    });
  }
  @Post('bookings/:id/reschedule') reschedule(
    @Req() req: AuthRequest,
    @Param('id') bookingId: string,
    @Body() body: unknown,
  ) {
    operational(req.user);
    const data = parse(z.object({ barberId: uuid, date, time, reason }), body);
    return transaction(() => {
      const booking = this.booking(req.user, bookingId);
      if (!['confirmed', 'checked_in'].includes(booking.status))
        throw new ConflictException('Booking tidak dapat dijadwalkan ulang.');
      const barber = one(
        'SELECT * FROM barbers WHERE id=? AND outletId=? AND active=1',
        data.barberId,
        booking.outletId,
      );
      if (
        !barber ||
        !JSON.parse(barber.days).includes(new Date(`${data.date}T12:00:00+07:00`).getUTCDay()) ||
        one('SELECT id FROM blocks WHERE barberId=? AND date=?', data.barberId, data.date)
      )
        throw new BadRequestException('Kapster tidak tersedia pada hari ini.');
      const starts = Date.parse(`${data.date}T${data.time}:00+07:00`),
        ends = starts + (booking.duration + 10) * 60000;
      if (
        starts < Date.now() ||
        starts > Date.now() + 30 * 86400_000 ||
        data.time < barber.start ||
        ends > Date.parse(`${data.date}T${barber.end}:00+07:00`)
      )
        throw new BadRequestException('Waktu di luar jadwal yang diperbolehkan.');
      if (
        one(
          "SELECT id FROM bookings WHERE barberId=? AND id!=? AND status NOT IN ('cancelled','no_show') AND starts<? AND ends>?",
          data.barberId,
          bookingId,
          ends,
          starts,
        )
      )
        throw new ConflictException('Jadwal kapster bertumpang tindih.');
      run(
        "UPDATE bookings SET barberId=?,date=?,time=?,starts=?,ends=?,status='confirmed' WHERE id=?",
        data.barberId,
        data.date,
        data.time,
        starts,
        ends,
        bookingId,
      );
      audit(
        req.user,
        'booking.rescheduled',
        bookingId,
        `${booking.date} ${booking.time} -> ${data.date} ${data.time}: ${data.reason}`,
      );
      return { ok: true };
    });
  }
  @Post('shifts/open') open(@Req() req: AuthRequest, @Body() body: unknown) {
    operational(req.user);
    const data = parse(z.object({ outletId: uuid, opening: money }), body);
    scope(req.user, data.outletId);
    return transaction(() => {
      if (one('SELECT id FROM shifts WHERE userId=? AND closed IS NULL', req.user.id))
        throw new ConflictException('Anda sudah memiliki shift aktif.');
      const shiftId = id();
      run(
        'INSERT INTO shifts(id,orgId,outletId,userId,opening,opened) VALUES(?,?,?,?,?,?)',
        shiftId,
        req.user.orgId,
        data.outletId,
        req.user.id,
        data.opening,
        now(),
      );
      audit(req.user, 'shift.opened', shiftId);
      return { id: shiftId };
    });
  }
  @Post('shifts/:id/close') close(
    @Req() req: AuthRequest,
    @Param('id') shiftId: string,
    @Body() body: unknown,
  ) {
    const data = parse(z.object({ counted: money, reason: z.string().max(500).default('') }), body);
    return transaction(() => {
      const shift = one('SELECT * FROM shifts WHERE id=? AND orgId=?', shiftId, req.user.orgId);
      if (!shift) throw new NotFoundException();
      scope(req.user, shift.outletId);
      if (shift.userId !== req.user.id) {
        role(req.user, 'owner');
        parse(reason, data.reason);
      }
      if (shift.closed) throw new ConflictException('Shift sudah ditutup.');
      const expected = expectedCash(shift);
      if (expected !== data.counted) parse(reason, data.reason);
      run(
        'UPDATE shifts SET closed=?,counted=?,expected=?,reason=? WHERE id=?',
        now(),
        data.counted,
        expected,
        data.reason,
        shiftId,
      );
      audit(req.user, 'shift.closed', shiftId, data.reason);
      return { expected, variance: data.counted - expected };
    });
  }
  @Post('bookings/:id/pay') pay(
    @Req() req: AuthRequest,
    @Param('id') bookingId: string,
    @Body() body: unknown,
  ) {
    operational(req.user);
    const data = parse(z.object({ tendered: money }), body);
    return transaction(() => {
      const booking = this.booking(req.user, bookingId);
      if (booking.paid) return { ok: true, alreadyPaid: true };
      if (['cancelled', 'no_show'].includes(booking.status))
        throw new ConflictException('Booking sudah tidak aktif.');
      const shift = one(
        'SELECT * FROM shifts WHERE userId=? AND outletId=? AND closed IS NULL',
        req.user.id,
        booking.outletId,
      );
      if (!shift) throw new ConflictException('Buka shift outlet ini sebelum menerima pembayaran.');
      if (data.tendered < booking.price)
        throw new BadRequestException('Uang diterima kurang dari total tagihan.');
      run(
        'INSERT INTO payments VALUES(?,?,?,?,?,?,?,?)',
        id(),
        req.user.orgId,
        booking.outletId,
        booking.id,
        shift.id,
        booking.price,
        data.tendered,
        now(),
      );
      run('UPDATE bookings SET paid=1 WHERE id=?', bookingId);
      audit(req.user, 'payment.cash', bookingId);
      return { ok: true, change: data.tendered - booking.price };
    });
  }
  @Post('bookings/:id/refund') refund(
    @Req() req: AuthRequest,
    @Param('id') bookingId: string,
    @Body() body: unknown,
  ) {
    operational(req.user);
    const data = parse(z.object({ reason }), body);
    return transaction(() => {
      const booking = this.booking(req.user, bookingId);
      if (!booking.paid) throw new BadRequestException('Booking belum dibayar.');
      if (one('SELECT id FROM refunds WHERE bookingId=?', bookingId))
        throw new ConflictException('Refund sudah pernah diajukan.');
      const refundId = id();
      run(
        'INSERT INTO refunds(id,orgId,outletId,bookingId,reason,requestedBy,created) VALUES(?,?,?,?,?,?,?)',
        refundId,
        req.user.orgId,
        booking.outletId,
        bookingId,
        data.reason,
        req.user.id,
        now(),
      );
      audit(req.user, 'refund.requested', refundId, data.reason);
      return { id: refundId };
    });
  }
  @Post('refunds/:id/decision') decideRefund(
    @Req() req: AuthRequest,
    @Param('id') refundId: string,
    @Body() body: unknown,
  ) {
    role(req.user, 'owner');
    const data = parse(z.object({ approved: z.boolean(), reason }), body);
    return transaction(() => {
      const refund = one('SELECT * FROM refunds WHERE id=? AND orgId=?', refundId, req.user.orgId);
      if (!refund || refund.status !== 'pending') throw new ConflictException('Pengajuan tidak tersedia.');
      run(
        'UPDATE refunds SET status=?,decidedBy=?,decisionReason=? WHERE id=?',
        data.approved ? 'approved' : 'rejected',
        req.user.id,
        data.reason,
        refundId,
      );
      audit(req.user, 'refund.decided', refundId, data.reason);
      return { ok: true };
    });
  }
  @Post('refunds/:id/disburse') disburse(@Req() req: AuthRequest, @Param('id') refundId: string) {
    operational(req.user);
    return transaction(() => {
      const refund = one('SELECT * FROM refunds WHERE id=? AND orgId=?', refundId, req.user.orgId);
      if (!refund) throw new NotFoundException();
      scope(req.user, refund.outletId);
      if (refund.status !== 'approved')
        throw new ConflictException('Refund belum disetujui atau sudah dibayarkan.');
      const shift = one(
        'SELECT * FROM shifts WHERE userId=? AND outletId=? AND closed IS NULL',
        req.user.id,
        refund.outletId,
      );
      if (!shift) throw new ConflictException('Buka shift untuk pengeluaran refund.');
      const amount = one('SELECT price FROM bookings WHERE id=?', refund.bookingId)!.price;
      if (expectedCash(shift) < amount) throw new ConflictException('Saldo laci tidak mencukupi.');
      run("UPDATE refunds SET status='paid',cashShiftId=?,paidAt=? WHERE id=?", shift.id, now(), refundId);
      audit(req.user, 'refund.cash_disbursed', refundId);
      return { ok: true };
    });
  }
}
