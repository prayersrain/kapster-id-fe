/**
 * Customer rules shared by the public booking page and the cashier walk-in screen.
 * Mirrors `bookingInput` in apps/api/src/validation.ts: a trimmed name of 2–120 characters and an
 * Indonesian mobile number that normalises to 628 followed by 8–11 digits.
 */
export const normalizePhone = (phone: string) => phone.replace(/[\s()+-]/g, '').replace(/^0/, '62');

export function customerErrors(customer: { name: string; phone: string }) {
  const errors: { name?: string; phone?: string } = {};
  const name = customer.name.trim();
  if (name.length < 2) errors.name = 'Nama minimal 2 karakter.';
  else if (name.length > 120) errors.name = 'Nama maksimal 120 karakter.';
  if (!customer.phone.trim()) errors.phone = 'Nomor WhatsApp wajib diisi.';
  else if (!/^628\d{8,11}$/.test(normalizePhone(customer.phone)))
    errors.phone = 'Gunakan nomor WhatsApp Indonesia, contoh 081234567890.';
  return errors;
}

/** Last date the server accepts a booking for: 30 days ahead in WIB. */
export const bookingMaxDate = () =>
  new Date(Date.now() + 30 * 86_400_000 + 7 * 3_600_000).toISOString().slice(0, 10);
