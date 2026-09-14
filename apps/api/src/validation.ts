import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
export function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success)
    throw new BadRequestException(
      result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    );
  return result.data;
}
export const text = z.string().trim().min(2).max(120);
export const email = z
  .string()
  .trim()
  .email()
  .max(200)
  .transform((v) => v.toLowerCase());
export const password = z.string().min(10, 'Password minimal 10 karakter').max(128);
export const uuid = z.string().uuid();
export const money = z.number().int().min(0).max(100_000_000);
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    'Tanggal tidak valid',
  );
export const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const phone = z
  .string()
  .transform((v) => v.replace(/[\s()+-]/g, '').replace(/^0/, '62'))
  .pipe(z.string().regex(/^628\d{8,11}$/, 'Nomor WhatsApp Indonesia tidak valid'));
export const reason = z.string().trim().min(5, 'Alasan minimal 5 karakter').max(500);
export const bookingInput = z.object({
  outletId: uuid,
  serviceId: uuid,
  barberId: uuid,
  date,
  time,
  name: text,
  phone,
});
export function jakartaDate() {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
}
