import 'reflect-metadata';
import { Module, Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PublicController } from './public.controller';
import { AppController } from './app.controller';
import { AdminController } from './admin.controller';
import { seed } from './database';

@Catch()
class Errors implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      res.status(error.getStatus()).json({ message: error.message });
      return;
    }
    if (String(error?.message).includes('SLOT_CONFLICT')) {
      res.status(409).json({ message: 'Slot sudah terisi. Pilih waktu lain.' });
      return;
    }
    if (String(error?.message).includes('UNIQUE constraint')) {
      res.status(409).json({ message: 'Data sudah digunakan atau transaksi sudah diproses.' });
      return;
    }
    console.error('API error:', error?.message);
    res.status(500).json({ message: 'Terjadi kesalahan pada server. Coba kembali.' });
  }
}
@Module({ controllers: [PublicController, AppController, AdminController] })
class AppModule {}

async function bootstrap() {
  // Staging/production hanya boleh dijalankan dengan opt-in eksplisit. Tanpa flag ini
  // perilaku lama dipertahankan: backend menolak start di luar lingkungan lokal.
  if (process.env.NODE_ENV === 'production' && process.env.KAPSTER_ALLOW_HOSTED !== '1')
    throw new Error('Backend ini khusus lokal. Selesaikan konfigurasi produksi sebelum deployment.');
  seed();
  const app = await NestFactory.create(AppModule);
  app.use(helmet({ referrerPolicy: { policy: 'no-referrer' } }));
  app.use(cookieParser());
  const allowedOrigins = new Set(
    (process.env.KAPSTER_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const rates = new Map<string, { n: number; until: number }>();
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (
        !allowedOrigins.has(req.headers.origin ?? '') ||
        req.headers['x-kapster-request'] !== '1' ||
        !req.is('application/json')
      ) {
        res.status(403).json({ message: 'Asal permintaan tidak diizinkan.' });
        return;
      }
      if (req.path.startsWith('/api/auth/') || req.path === '/api/public/bookings') {
        const key = `${req.ip}:${req.path}`;
        const rate = rates.get(key);
        const limit = process.env.TEST_RATE_LIMIT ? 500 : 30;
        if (rate && rate.until > Date.now() && rate.n >= limit) {
          res.status(429).json({ message: 'Terlalu banyak percobaan. Coba lagi dalam 10 menit.' });
          return;
        }
        rates.set(
          key,
          rate && rate.until > Date.now()
            ? { ...rate, n: rate.n + 1 }
            : { n: 1, until: Date.now() + 600_000 },
        );
      }
    }
    next();
  });
  app.useGlobalFilters(new Errors());
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 4000), '127.0.0.1');
  console.log('API lokal siap. Akun: npm run local:accounts | Email: npm run local:mail');
}
bootstrap().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
