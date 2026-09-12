import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '../../components/auth/AuthPage';

export const metadata: Metadata = { title: 'Masuk — Kapster.id', robots: { index: false, follow: false } };

export default function LoginRoute() { return <Suspense fallback={<main style={{ minHeight: '100svh', background: '#fbf7f1' }} />}><LoginPage /></Suspense>; }
