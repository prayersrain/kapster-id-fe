export function Logo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 20 : 26;
  return <span className="logo-lockup" aria-label="Kapster.id">
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M5 7.5 11.4 3v8L5 15.5z" fill="currentColor"/>
      <path d="M12.8 2.2 20 6.9v8.5l-7.2 4.7z" fill="currentColor"/>
      <path d="M5 17.3 11.4 13v8L5 25.5z" fill="currentColor"/>
      <path d="M12.8 21.9 20 17.2V26l-7.2-4.1z" fill="currentColor"/>
    </svg>
    <strong>Kapster.id</strong>
  </span>
}
