import type { Metadata } from 'next';
import { BookingExperience } from '../../components/booking/BookingExperience';

export const metadata: Metadata = {
  title: 'Booking Garasi Barber — Kapster.id',
  description: 'Prototype alur booking online Garasi Barber melalui Kapster.id.',
  robots: { index: false, follow: false },
};

export default function BookingPage() {
  return <BookingExperience />;
}
