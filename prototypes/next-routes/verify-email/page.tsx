import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailPage } from '../../components/auth/AuthPage';

export const metadata: Metadata = { title: 'Verifikasi Email — Kapster.id', robots: { index: false, follow: false } };

export default function VerifyEmailRoute() { return <Suspense fallback={<main style={{ minHeight: '100svh', background: '#fbf7f1' }} />}><VerifyEmailPage /></Suspense>; }
