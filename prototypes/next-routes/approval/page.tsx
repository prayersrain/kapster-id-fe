import type { Metadata } from 'next';
import { ApprovalPage } from '../../components/approval/ApprovalPage';
export const metadata: Metadata = { title: 'Approval Bisnis — Kapster.id', robots: { index: false, follow: false } };
export default function ApprovalRoute() { return <ApprovalPage />; }
