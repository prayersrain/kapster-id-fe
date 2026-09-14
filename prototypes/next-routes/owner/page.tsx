import type { Metadata } from 'next';
import { OwnerDashboard } from '../../components/owner/OwnerDashboard';

export const metadata: Metadata = {
  title: 'Dashboard Owner — Kapster.id',
  description: 'Prototype dashboard Owner Kapster.id dengan data demonstrasi.',
  robots: { index: false, follow: false },
};

export default function OwnerPage() {
  return <OwnerDashboard />;
}
