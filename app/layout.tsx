import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kapster.id — Sistem Operasional Barbershop',
  description: 'Kelola booking, kasir, jadwal kapster, customer, dan laporan dalam satu sistem.',
  icons: { icon: '/favicon.svg' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
