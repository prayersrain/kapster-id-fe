import type { Metadata } from 'next';
import { RegisterPage } from '../../components/auth/AuthPage';

export const metadata: Metadata = { title: 'Buat Akun Owner — Kapster.id', robots: { index: false, follow: false } };

export default function RegisterRoute() { return <RegisterPage />; }
