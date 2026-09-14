import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Param,
  Query,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  all,
  one,
  run,
  id,
  secret,
  digest,
  now,
  hashPassword,
  checkPassword,
  transaction,
  localMail,
  audit,
} from './database';
import { parse, text, email, password, uuid } from './validation';
import { AuthGuard, AuthRequest, safeUser } from './auth';
import { availability, createBooking } from './booking';

@Controller('api')
export class PublicController {
  @Get('health') health() {
    return { ok: true, mode: 'local', paymentGateway: false };
  }
  @Post('auth/register') register(@Body() body: unknown) {
    const data = parse(z.object({ name: text, business: text, email, password }), body);
    if (one('SELECT id FROM users WHERE email=?', data.email))
      throw new ConflictException('Email tidak dapat digunakan. Gunakan login atau pemulihan akun.');
    const user = transaction(() => {
      const orgId = id(),
        userId = id();
      run('INSERT INTO orgs VALUES(?,?,?,?,?)', orgId, data.business, 'draft', '', now());
      run(
        'INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)',
        userId,
        orgId,
        null,
        data.name,
        data.email,
        hashPassword(data.password),
        'owner',
        0,
        1,
      );
      return one('SELECT * FROM users WHERE id=?', userId)!;
    });
    localMail(user, 'verify');
    return { message: 'Akun dibuat. Buka tautan verifikasi dari kotak email lokal (npm run local:mail).' };
  }
  @Post('auth/login') login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const data = parse(z.object({ email, password: z.string().min(1).max(128) }), body);
    const user = one('SELECT * FROM users WHERE email=?', data.email);
    if (!user || !user.active || !checkPassword(data.password, user.password))
      throw new UnauthorizedException('Email atau password salah.');
    if (!user.verified) throw new UnauthorizedException('Verifikasi email terlebih dahulu.');
    const token = secret();
    run('INSERT INTO sessions VALUES(?,?,?)', digest(token), user.id, Date.now() + 12 * 3600_000);
    res.cookie('kapster_session', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      path: '/api',
      maxAge: 12 * 3600_000,
    });
    audit(user, 'auth.login', user.id);
    return safeUser(user);
  }
  @Post('auth/verify') verify(@Body() body: unknown) {
    const { token } = parse(z.object({ token: z.string().length(64) }), body);
    transaction(() => {
      const item = one(
        "SELECT * FROM tokens WHERE token=? AND kind='verify' AND expires>?",
        digest(token),
        Date.now(),
      );
      if (!item) throw new BadRequestException('Tautan tidak valid atau sudah kedaluwarsa.');
      run('UPDATE users SET verified=1 WHERE id=?', item.userId);
      run('DELETE FROM tokens WHERE token=?', digest(token));
    });
    return { message: 'Email terverifikasi. Silakan masuk.' };
  }
  @Post('auth/resend') resend(@Body() body: unknown) {
    const data = parse(z.object({ email }), body);
    const user = one('SELECT * FROM users WHERE email=? AND active=1 AND verified=0', data.email);
    if (user) localMail(user, 'verify');
    return { message: 'Jika akun memenuhi syarat, tautan tersedia di kotak email lokal.' };
  }
  @Post('auth/forgot') forgot(@Body() body: unknown) {
    const data = parse(z.object({ email }), body);
    const user = one('SELECT * FROM users WHERE email=? AND active=1', data.email);
    if (user) localMail(user, 'reset');
    return { message: 'Jika akun terdaftar, tautan pemulihan tersedia di kotak email lokal.' };
  }
  @Post('auth/reset') reset(@Body() body: unknown) {
    const data = parse(z.object({ token: z.string().length(64), password }), body);
    transaction(() => {
      const item = one(
        "SELECT * FROM tokens WHERE token=? AND kind='reset' AND expires>?",
        digest(data.token),
        Date.now(),
      );
      if (!item) throw new BadRequestException('Tautan tidak valid atau sudah kedaluwarsa.');
      run('UPDATE users SET password=?, verified=1 WHERE id=?', hashPassword(data.password), item.userId);
      run('DELETE FROM sessions WHERE userId=?', item.userId);
      run('DELETE FROM tokens WHERE userId=?', item.userId);
    });
    return { message: 'Password diperbarui. Silakan masuk kembali.' };
  }
  @Get('auth/me') @UseGuards(AuthGuard) me(@Req() req: AuthRequest) {
    return safeUser(req.user);
  }
  @Post('auth/logout') @UseGuards(AuthGuard) logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (one('SELECT id FROM shifts WHERE userId=? AND closed IS NULL', req.user.id))
      throw new ConflictException('Tutup shift aktif sebelum keluar.');
    run('DELETE FROM sessions WHERE token=?', digest(req.cookies.kapster_session));
    res.clearCookie('kapster_session', { path: '/api', sameSite: 'strict' });
    return { ok: true };
  }
  @Get('public/catalog') catalog() {
    return {
      outlets: all(
        "SELECT o.id,o.name,o.address FROM outlets o JOIN orgs g ON g.id=o.orgId WHERE o.active=1 AND o.published=1 AND g.status='approved'",
      ),
      services: all(
        "SELECT s.id,s.outletId,s.name,s.price,s.duration FROM services s JOIN outlets o ON o.id=s.outletId JOIN orgs g ON g.id=o.orgId WHERE s.active=1 AND o.active=1 AND o.published=1 AND g.status='approved'",
      ),
      barbers: all(
        "SELECT b.id,b.outletId,b.name FROM barbers b JOIN outlets o ON o.id=b.outletId JOIN orgs g ON g.id=o.orgId WHERE b.active=1 AND o.active=1 AND o.published=1 AND g.status='approved'",
      ),
    };
  }
  @Get('public/slots') slots(@Query() query: unknown) {
    const data = parse(
      z.object({ outletId: uuid, serviceId: uuid, barberId: uuid, date: z.string() }),
      query,
    );
    return { slots: availability(data.outletId, data.serviceId, data.barberId, data.date).slots };
  }
  @Post('public/bookings') book(@Body() body: unknown) {
    return createBooking(body);
  }
  @Get('public/bookings/:token') booking(@Param('token') token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new NotFoundException('Booking tidak ditemukan.');
    const booking = one(
      'SELECT b.id,b.name,b.serviceName,b.price,b.date,b.time,b.status,b.paid,o.name AS outletName,o.address,r.name AS barberName,(SELECT status FROM refunds WHERE bookingId=b.id) AS refundStatus FROM bookings b JOIN outlets o ON o.id=b.outletId JOIN barbers r ON r.id=b.barberId WHERE b.token=?',
      token,
    );
    if (!booking) throw new NotFoundException('Booking tidak ditemukan.');
    return booking;
  }
}
