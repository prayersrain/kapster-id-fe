import React from 'react';

type IconName = 'calendar' | 'store' | 'users' | 'user' | 'chart' | 'link' | 'check' | 'play' | 'mail' | 'phone' | 'pin' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'arrow';

export function Icon({ name, size = 20, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
    case 'store': return <svg {...common}><path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M7 20v-6h4v6M3 10c0 1.5 1.2 2.5 2.5 2.5S8 11.5 8 10c0 1.5 1.2 2.5 2.5 2.5S13 11.5 13 10c0 1.5 1.2 2.5 2.5 2.5S18 11.5 18 10c0 1.5 1.2 2.5 2.5 2.5S23 11.5 23 10"/></svg>;
    case 'users': return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'user': return <svg {...common}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'chart': return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20V8"/></svg>;
    case 'link': return <svg {...common}><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></svg>;
    case 'check': return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'play': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/></svg>;
    case 'mail': return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case 'phone': return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/></svg>;
    case 'pin': return <svg {...common}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></svg>;
    case 'instagram': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/></svg>;
    case 'youtube': return <svg {...common}><path d="M21 8.2a2.7 2.7 0 0 0-1.9-1.9C17.4 6 12 6 12 6s-5.4 0-7.1.3A2.7 2.7 0 0 0 3 8.2 28 28 0 0 0 2.7 12 28 28 0 0 0 3 15.8a2.7 2.7 0 0 0 1.9 1.9c1.7.3 7.1.3 7.1.3s5.4 0 7.1-.3a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .3-3.8 28 28 0 0 0-.3-3.8Z"/><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none"/></svg>;
    case 'tiktok': return <svg {...common}><path d="M15 4v10.2a4.2 4.2 0 1 1-3.2-4.1"/><path d="M15 4c.8 2.4 2.4 3.8 5 4"/></svg>;
    case 'linkedin': return <svg {...common}><rect x="3" y="9" width="4" height="11"/><path d="M5 5.5h.01M11 20V9h4v2c1-2 6-2.2 6 3v6M15 14v6"/></svg>;
    case 'arrow': return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}
