import type { Metadata } from 'next';
import { CashierDashboard } from '../../components/cashier/CashierDashboard';

export const metadata: Metadata = {
  title: 'Dashboard Kasir — Kapster.id',
  description: 'Prototype dashboard kasir Kapster.id untuk antrean, booking, transaksi, pelanggan, dan shift.',
};

export default function KasirPage() {
  return <CashierDashboard />;
}
