import type { Metadata } from 'next';
import { AdminDashboard } from '../../components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Platform — Kapster.id',
  description: 'Prototype dashboard internal Admin Platform Kapster.id dengan data demonstrasi.',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
