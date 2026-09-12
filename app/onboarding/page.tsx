import type { Metadata } from 'next';
import { OnboardingPage } from '../../components/onboarding/OnboardingPage';
export const metadata: Metadata = { title: 'Setup Bisnis — Kapster.id', robots: { index: false, follow: false } };
export default function OnboardingRoute() { return <OnboardingPage />; }
