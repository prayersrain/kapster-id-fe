type IconName =
  | 'home'
  | 'calendar'
  | 'receipt'
  | 'chart'
  | 'store'
  | 'users'
  | 'scissors'
  | 'customer'
  | 'briefcase'
  | 'settings'
  | 'search'
  | 'bell'
  | 'menu'
  | 'chevron'
  | 'plus'
  | 'download'
  | 'clock'
  | 'wallet'
  | 'refresh'
  | 'filter'
  | 'star'
  | 'coin'
  | 'check'
  | 'arrow'
  | 'more'
  | 'mail'
  | 'phone'
  | 'lock'
  | 'card'
  | 'alert'
  | 'close';

export function Glyph({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V21h14V10.5M9 21v-6h6v6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case 'receipt':
      return (
        <svg {...common}>
          <path d="M5 3h14v18l-2-1.5L15 21l-3-1.5L9 21l-2-1.5L5 21Z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <rect x="3" y="12" width="4" height="9" rx="1" />
          <rect x="10" y="7" width="4" height="14" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      );
    case 'store':
      return (
        <svg {...common}>
          <path d="M4 10v10h16V10M3 10l2-6h14l2 6" />
          <path d="M8 20v-5h4v5M3 10c0 1.4 1.1 2.4 2.5 2.4S8 11.4 8 10c0 1.4 1.1 2.4 2.5 2.4S13 11.4 13 10c0 1.4 1.1 2.4 2.5 2.4S18 11.4 18 10c0 1.4 1.1 2.4 2.5 2.4S23 11.4 23 10" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 4a4 4 0 0 1 0 8M18 14a5 5 0 0 1 4 5v2" />
        </svg>
      );
    case 'scissors':
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="3" />
          <circle cx="6" cy="17" r="3" />
          <path d="m8.5 8.5 10 7M8.5 15.5 19 8" />
        </svg>
      );
    case 'customer':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V4h8v3M3 12h18M10 11v3h4v-3" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M10 19h4" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 18v3h16v-3" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...common}>
          <path d="M3 7h16a2 2 0 0 1 2 2v10H3Z" />
          <path d="M3 7V5a2 2 0 0 1 2-2h13v4M15 12h6v4h-6a2 2 0 0 1 0-4Z" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...common}>
          <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />
        </svg>
      );
    case 'coin':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 8.5c-.6-.6-1.5-1-2.5-1-1.4 0-2.5.7-2.5 1.8 0 2.8 5 1.3 5 4.2 0 1.2-1.1 2-2.7 2-1.1 0-2.2-.4-2.9-1.1M12 6v12" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14m-5-5 5 5-5 5" />
        </svg>
      );
    case 'more':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 17v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 2 2.4Z" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M7 15h3" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3 2.7 20h18.6ZM12 9v4M12 17h.01" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
  }
}
