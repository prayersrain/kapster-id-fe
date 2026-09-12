'use client';

import { useEffect, useMemo, useState } from 'react';
import { Logo } from '../ui/Logo';
import styles from './CashierDashboard.module.css';

type View = 'dashboard' | 'queue' | 'detail' | 'booking' | 'bookingDetail' | 'transactions' | 'customers' | 'shift' | 'settings';
type IconName = 'home' | 'queue' | 'calendar' | 'receipt' | 'users' | 'shift' | 'settings' | 'scissors' | 'bell' | 'menu' | 'down' | 'plus' | 'search' | 'clock' | 'wallet' | 'check' | 'more' | 'back' | 'phone' | 'user' | 'lock' | 'card' | 'qr' | 'cash' | 'printer' | 'volume' | 'theme' | 'globe' | 'logout' | 'close' | 'filter';
type StatusTone = 'waiting' | 'service' | 'success' | 'info' | 'danger' | 'neutral';
type QueueStatus = 'Menunggu' | 'Sedang Dilayani' | 'Selesai';
type WalkInStep = 'service' | 'barber' | 'checkout';

type QueueItem = {
  id: number;
  time: string;
  name: string;
  phone: string;
  service: string;
  barber: string;
  status: QueueStatus;
  price: number;
  avatar: number;
};

const NAV_ITEMS: { id: View; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Kasir', icon: 'home' },
  { id: 'queue', label: 'Antrean', icon: 'queue' },
  { id: 'booking', label: 'Booking', icon: 'calendar' },
  { id: 'transactions', label: 'Transaksi', icon: 'receipt' },
  { id: 'customers', label: 'Pelanggan', icon: 'users' },
  { id: 'shift', label: 'Shift Kasir', icon: 'shift' },
  { id: 'settings', label: 'Pengaturan', icon: 'settings' },
];

const INITIAL_QUEUE: QueueItem[] = [
  { id: 1, time: '10:00', name: 'Andi Pratama', phone: '+62 812 3456 7890', service: 'Haircut', barber: 'Budi', status: 'Sedang Dilayani', price: 60000, avatar: 0 },
  { id: 2, time: '10:15', name: 'Rizky Maulana', phone: '+62 813 2345 6780', service: 'Haircut + Beard Trim', barber: 'Alex', status: 'Sedang Dilayani', price: 85000, avatar: 1 },
  { id: 3, time: '10:30', name: 'Dimas Saputra', phone: '+62 812 3456 7890', service: 'Haircut', barber: 'Budi', status: 'Menunggu', price: 60000, avatar: 2 },
  { id: 4, time: '11:00', name: 'Fajar Hidayat', phone: '+62 817 7777 8899', service: 'Haircut', barber: 'Raka', status: 'Menunggu', price: 60000, avatar: 3 },
  { id: 5, time: '11:30', name: 'Bima Setiawan', phone: '+62 821 5566 1122', service: 'Haircut + Hair Wash', barber: 'Andi', status: 'Menunggu', price: 85000, avatar: 4 },
  { id: 6, time: '13:00', name: 'Naufal Akbar', phone: '+62 812 8844 9911', service: 'Hair Coloring', barber: 'Alex', status: 'Selesai', price: 200000, avatar: 5 },
  { id: 7, time: '14:00', name: 'Galih Putra', phone: '+62 811 2345 6611', service: 'Beard Trim', barber: 'Raka', status: 'Selesai', price: 40000, avatar: 6 },
];

const BOOKINGS = [
  { code: '#BK-7281', time: '10:00', name: 'Andi Pratama', service: 'Haircut', barber: 'Budi', status: 'Menunggu', payment: 'Belum Dibayar', avatar: 0 },
  { code: '#BK-7282', time: '11:00', name: 'Rizky Maulana', service: 'Haircut + Beard Trim', barber: 'Alex', status: 'Dikonfirmasi', payment: 'Sudah Dibayar', avatar: 1 },
  { code: '#BK-7283', time: '13:00', name: 'Dimas Saputra', service: 'Haircut', barber: 'Raka', status: 'Menunggu', payment: 'Belum Dibayar', avatar: 2 },
  { code: '#BK-7284', time: '15:00', name: 'Fajar Hidayat', service: 'Hair Coloring', barber: 'Andi', status: 'Dikonfirmasi', payment: 'Sudah Dibayar', avatar: 3 },
  { code: '#BK-7285', time: '16:30', name: 'Bima Setiawan', service: 'Haircut', barber: 'Budi', status: 'Selesai', payment: 'Sudah Dibayar', avatar: 4 },
] as const;

const TRANSACTIONS = [
  ['TRX-001', 'Andi Pratama', '10:05', 'Tunai', 'Rp 60.000', 0],
  ['TRX-002', 'Rizky Maulana', '10:45', 'QRIS', 'Rp 85.000', 1],
  ['TRX-003', 'Dimas Saputra', '11:20', 'Tunai', 'Rp 60.000', 2],
  ['TRX-004', 'Fajar Hidayat', '13:10', 'Kartu', 'Rp 200.000', 3],
  ['TRX-005', 'Bima Setiawan', '15:05', 'QRIS', 'Rp 85.000', 4],
] as const;

const CUSTOMERS = [
  ['Dimas Saputra', '+62 812 3456 7890', '3x', '8 Sep 2026', 'Pelanggan Baru', 2],
  ['Rizky Maulana', '+62 878 1123 4567', '12x', '5 Sep 2026', 'Repeat', 1],
  ['Andi Pratama', '+62 815 9876 7766', '5x', '1 Sep 2026', 'Repeat', 0],
  ['Fajar Hidayat', '+62 817 0777 8899', '2x', '28 Agu 2026', 'Repeat', 3],
  ['Bima Setiawan', '+62 821 5566 1122', '7x', '8 Sep 2026', 'Pelanggan Baru', 4],
] as const;

const SERVICES = [
  { id: 'haircut', name: 'Haircut', duration: 30, price: 60000 },
  { id: 'wash', name: 'Haircut + Hair Wash', duration: 45, price: 85000 },
  { id: 'beard', name: 'Beard Trim', duration: 20, price: 40000 },
  { id: 'color', name: 'Hair Coloring', duration: 90, price: 200000 },
] as const;

const BARBERS = [
  { id: 'budi', name: 'Budi Santoso', availability: 'Tersedia sekarang', avatar: 0 },
  { id: 'alex', name: 'Alex Wijaya', availability: 'Tersedia sekarang', avatar: 1 },
  { id: 'raka', name: 'Raka Pratama', availability: 'Tersedia 11:00', avatar: 2 },
  { id: 'andi', name: 'Andi Kurniawan', availability: 'Tersedia sekarang', avatar: 3 },
] as const;

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'home': return <svg {...common}><path d="M4 10.5 12 4l8 6.5V20H4Z" /><path d="M9 20v-6h6v6" /></svg>;
    case 'queue': return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /><path d="M8 2v4M16 2v4" /></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
    case 'receipt': return <svg {...common}><path d="M5 3h14v18l-2-1.5L15 21l-3-1.5L9 21l-2-1.5L5 21Z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
    case 'users': return <svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 7M17 14a5 5 0 0 1 4.5 5" /></svg>;
    case 'shift': return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 11v3h4v-3" /></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l-2.8 2.8a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6h-4a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4L4.2 17a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 14v-4a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2L7 4.2a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 3h4a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4L19.8 7a1.8 1.8 0 0 0-.4 2A1.8 1.8 0 0 0 21 10v4a1.8 1.8 0 0 0-1.6 1Z" /></svg>;
    case 'scissors': return <svg {...common}><circle cx="6" cy="7" r="3" /><circle cx="6" cy="17" r="3" /><path d="m8.5 8.5 10 7M8.5 15.5 19 8" /></svg>;
    case 'bell': return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M10 19h4" /></svg>;
    case 'menu': return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case 'down': return <svg {...common}><path d="m7 10 5 5 5-5" /></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'wallet': return <svg {...common}><path d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14v3" /><path d="M16 12h5" /></svg>;
    case 'check': return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case 'more': return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
    case 'back': return <svg {...common}><path d="m15 18-6-6 6-6M9 12h11" /></svg>;
    case 'phone': return <svg {...common}><path d="M5 4h4l2 5-2.5 1.5a14 14 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>;
    case 'user': return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case 'lock': return <svg {...common}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case 'card': return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>;
    case 'qr': return <svg {...common}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM18 14h2v5h-2zM14 18h2v2h-2z" /></svg>;
    case 'cash': return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M7 9H5v2M17 15h2v-2" /></svg>;
    case 'printer': return <svg {...common}><path d="M7 8V3h10v5M7 17H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3" /><path d="M7 14h10v7H7z" /></svg>;
    case 'volume': return <svg {...common}><path d="M5 10v4h4l5 4V6l-5 4Z" /><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>;
    case 'theme': return <svg {...common}><path d="M21 12.5A8.5 8.5 0 1 1 11.5 3 6.5 6.5 0 0 0 21 12.5Z" /></svg>;
    case 'globe': return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    case 'logout': return <svg {...common}><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>;
    case 'close': return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case 'filter': return <svg {...common}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
  }
}

function Avatar({ index, size = 34 }: { index: number; size?: number }) {
  const initials = ['AP', 'RM', 'DS', 'FH', 'BS', 'NA', 'GP'][index % 7];
  const images = ['/assets/photo/owner.webp', '/assets/photo/cashier.webp'];
  return (
    <span className={`${styles.avatar} ${styles[`avatar${index % 5}`]}`} style={{ width: size, height: size }} aria-label={initials}>
      {index < 2 ? <img src={images[index]} alt="" /> : initials}
    </span>
  );
}

function Status({ children, tone }: { children: React.ReactNode; tone: StatusTone }) {
  return <span className={`${styles.status} ${styles[`status${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>{children}</span>;
}

function statusTone(status: string): StatusTone {
  if (status === 'Menunggu' || status === 'Belum Dibayar') return 'waiting';
  if (status === 'Sedang Dilayani') return 'service';
  if (status === 'Dikonfirmasi' || status === 'Repeat') return 'info';
  if (status === 'Dibatalkan') return 'danger';
  return 'success';
}

function PrimaryButton({ children, icon, secondary = false, danger = false, onClick, disabled = false, className = '' }: { children: React.ReactNode; icon?: IconName; secondary?: boolean; danger?: boolean; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button type="button" className={`${styles.button} ${secondary ? styles.buttonSecondary : ''} ${danger ? styles.buttonDanger : ''} ${className}`} onClick={onClick} disabled={disabled}>{icon ? <Icon name={icon} /> : null}{children}</button>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className={styles.searchBox}><Icon name="search" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function PageHeading({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <header className={styles.pageHeading}><div><h1>{title}</h1><p>{subtitle}</p></div>{children ? <div className={styles.headingAction}>{children}</div> : null}</header>;
}

function MetricCard({ label, value, footnote, icon, tone = 'gold' }: { label: string; value: string; footnote: string; icon: IconName; tone?: 'gold' | 'blue' | 'green' }) {
  return <article className={styles.metricCard}><span className={`${styles.metricIcon} ${styles[`metric${tone[0].toUpperCase()}${tone.slice(1)}`]}`}><Icon name={icon} /></span><div><small>{label}</small><strong>{value}</strong><em>{footnote}</em></div></article>;
}

function QueuePage({ queue, query, setQuery, filter, setFilter, onOpen, onStart, onWalkIn, compact = false }: { queue: QueueItem[]; query: string; setQuery: (value: string) => void; filter: string; setFilter: (value: string) => void; onOpen: (item: QueueItem) => void; onStart: (item: QueueItem) => void; onWalkIn: () => void; compact?: boolean }) {
  const filtered = useMemo(() => queue.filter((item) => (filter === 'Semua' || item.status === filter) && `${item.name} ${item.phone}`.toLowerCase().includes(query.toLowerCase())), [queue, query, filter]);
  return <div className={styles.pageContent}>
    {!compact ? <div className={styles.metricsGrid}>
      <MetricCard label="Menunggu" value="3" footnote="customer" icon="user" tone="gold" />
      <MetricCard label="Sedang Dilayani" value="4" footnote="customer" icon="scissors" tone="blue" />
      <MetricCard label="Selesai Hari Ini" value="12" footnote="customer" icon="check" tone="green" />
      <MetricCard label="Pendapatan Hari Ini" value="Rp 2.340.000" footnote="↑ 12% dari kemarin" icon="wallet" tone="gold" />
    </div> : null}
    <section className={styles.panel}>
      <div className={styles.queueHead}><div><h2>Antrean Hari Ini</h2>{compact ? <p>Kelola urutan customer di outlet aktif.</p> : null}</div><div className={styles.queueActions}><SearchBox value={query} onChange={setQuery} placeholder="Cari nama atau nomor HP..." /><PrimaryButton icon="plus" onClick={onWalkIn}>Tambah Walk-in</PrimaryButton></div></div>
      <div className={styles.pillTabs} role="tablist" aria-label="Filter antrean">{['Semua', 'Menunggu', 'Sedang Dilayani', 'Selesai'].map((item) => <button type="button" role="tab" aria-selected={filter === item} className={filter === item ? styles.activePill : ''} key={item} onClick={() => setFilter(item)}>{item} <span>({item === 'Semua' ? queue.length : queue.filter((row) => row.status === item).length})</span></button>)}</div>
      <div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>No.</th><th>Waktu</th><th>Nama Customer</th><th>Layanan</th><th>Kapster</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((item, index) => <tr key={item.id} onClick={() => onOpen(item)}><td data-label="No.">{index + 1}</td><td data-label="Waktu"><time>{item.time}</time></td><td data-label="Customer"><span className={styles.personCell}><Avatar index={item.avatar} /><span><strong>{item.name}</strong><small>{item.phone}</small></span></span></td><td data-label="Layanan">{item.service}</td><td data-label="Kapster">{item.barber}</td><td data-label="Status"><Status tone={statusTone(item.status)}>{item.status}</Status></td><td data-label="Aksi" onClick={(event) => event.stopPropagation()}>{item.status === 'Menunggu' ? <PrimaryButton className={styles.smallButton} onClick={() => onStart(item)}>Mulai</PrimaryButton> : <button type="button" className={styles.iconButton} aria-label={`Aksi ${item.name}`} onClick={() => onOpen(item)}><Icon name="more" /></button>}</td></tr>)}</tbody></table></div>
      {!filtered.length ? <div className={styles.emptyState}><Icon name="search" size={24} /><strong>Customer tidak ditemukan</strong><span>Coba nama, nomor HP, atau filter lain.</span></div> : null}
    </section>
  </div>;
}

function CustomerDetail({ item, onBack, onStart, notify }: { item: QueueItem; onBack: () => void; onStart: () => void; notify: (message: string) => void }) {
  const [tab, setTab] = useState<'service' | 'history'>('service');
  return <div className={styles.pageContent}>
    <button type="button" className={styles.backButton} onClick={onBack}><Icon name="back" />Kembali ke Antrean</button>
    <div className={styles.detailLayout}>
      <section className={`${styles.panel} ${styles.customerDetail}`}>
        <div className={styles.detailCodeRow}><span className={styles.codePill}>#BK-7283</span><Status tone={statusTone(item.status)}>{item.status}</Status></div>
        <div className={styles.customerHero}><Avatar index={item.avatar} size={76} /><div><h1>{item.name}</h1><p><Icon name="phone" />{item.phone}</p><Status tone="success">Pelanggan baru</Status></div></div>
        <label className={styles.noteField}><span>Catatan</span><textarea placeholder="Tambah catatan tentang customer..." /></label>
        <div className={styles.detailTabs}><button className={tab === 'service' ? styles.activeDetailTab : ''} onClick={() => setTab('service')}>Layanan (1)</button><button className={tab === 'history' ? styles.activeDetailTab : ''} onClick={() => setTab('history')}>Riwayat (3)</button></div>
        {tab === 'service' ? <><article className={styles.serviceLine}><span className={styles.roundIcon}><Icon name="scissors" /></span><div><strong>{item.service}</strong><small>30 menit</small></div><span>{item.barber}</span><b>{rupiah(item.price)}</b><button className={styles.iconButton} aria-label="Opsi layanan"><Icon name="more" /></button></article><PrimaryButton secondary icon="plus" onClick={() => notify('Pemilih layanan tambahan dibuka')}>Tambah Layanan</PrimaryButton></> : <div className={styles.historyList}>{['18 Agu · Haircut · Budi', '2 Jul · Beard Trim · Alex', '10 Jun · Haircut · Budi'].map((history) => <p key={history}><span /><b>{history}</b><Status tone="success">Selesai</Status></p>)}</div>}
      </section>
      <aside className={styles.detailAside}>
        <section className={styles.panel}><h3>Informasi Booking</h3><dl className={styles.bookingInfo}><div><dt><Icon name="clock" />Waktu</dt><dd>10:30</dd></div><div><dt><Icon name="scissors" />Jenis</dt><dd>Walk-in</dd></div><div><dt><Icon name="user" />Kapster</dt><dd>{item.barber}</dd></div><div><dt><Icon name="clock" />Durasi total</dt><dd>30 menit</dd></div></dl></section>
        <section className={`${styles.panel} ${styles.actionStack}`}><PrimaryButton icon="scissors" onClick={onStart}>{item.status === 'Sedang Dilayani' ? 'Selesaikan Layanan' : 'Mulai Layanan'}</PrimaryButton><PrimaryButton secondary icon="user" onClick={() => notify('Pemilih kapster dibuka')}>Ubah Kapster</PrimaryButton><PrimaryButton secondary icon="calendar" onClick={() => notify('Pemilih jadwal dibuka')}>Reschedule</PrimaryButton><PrimaryButton secondary danger onClick={() => notify('Pembatalan memerlukan alasan sebelum diproses')}>Batalkan</PrimaryButton><PrimaryButton secondary icon="printer" onClick={() => notify('Pratinjau struk dibuka')}>Cetak Struk</PrimaryButton></section>
      </aside>
    </div>
  </div>;
}

function BookingPage({ query, setQuery, onOpen, notify }: { query: string; setQuery: (value: string) => void; onOpen: (index: number) => void; notify: (message: string) => void }) {
  const [status, setStatus] = useState('Semua');
  const [date, setDate] = useState(0);
  const dates = [['Sen', '8 Sep'], ['Sel', '9 Sep'], ['Rab', '10 Sep'], ['Kam', '11 Sep'], ['Jum', '12 Sep'], ['Sab', '13 Sep'], ['Min', '14 Sep']];
  const rows = BOOKINGS.filter((item) => (status === 'Semua' || item.status === status) && item.name.toLowerCase().includes(query.toLowerCase()));
  return <div className={styles.pageContent}>
    <PageHeading title="Booking" subtitle="Kelola jadwal booking pelanggan."><PrimaryButton icon="plus" onClick={() => notify('Form tambah booking manual dibuka')}>Tambah Booking</PrimaryButton></PageHeading>
    <div className={styles.dateStrip}><button aria-label="Minggu sebelumnya">‹</button>{dates.map((item, index) => <button className={date === index ? styles.activeDate : ''} key={item[1]} onClick={() => setDate(index)}><b>{item[0]}</b><span>{item[1]}</span></button>)}<button aria-label="Minggu berikutnya">›</button></div>
    <section className={styles.panel}>
      <div className={styles.toolbar}><div className={styles.pillTabs}>{['Semua', 'Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'].map((item) => <button key={item} className={status === item ? styles.activePill : ''} onClick={() => setStatus(item)}>{item}</button>)}</div><div className={styles.toolbarSearch}><SearchBox value={query} onChange={setQuery} placeholder="Cari nama pelanggan, nomor HP, atau kode booking..." /><button className={styles.squareButton} aria-label="Filter booking"><Icon name="filter" /></button></div></div>
      <div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>No.</th><th>Waktu</th><th>Pelanggan</th><th>Layanan</th><th>Kapster</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{rows.map((item, index) => <tr key={item.code} onClick={() => onOpen(BOOKINGS.indexOf(item))}><td data-label="No.">{index + 1}</td><td data-label="Waktu">{item.time}</td><td data-label="Pelanggan"><span className={styles.personCell}><Avatar index={item.avatar} /><span><strong>{item.name}</strong><small>{item.code}</small></span></span></td><td data-label="Layanan">{item.service}</td><td data-label="Kapster">{item.barber}</td><td data-label="Status"><Status tone={statusTone(item.status)}>{item.status}</Status></td><td data-label="Aksi"><button className={styles.iconButton} aria-label={`Detail ${item.name}`}><Icon name="more" /></button></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

function BookingDetail({ index, onBack, notify }: { index: number; onBack: () => void; notify: (message: string) => void }) {
  const booking = BOOKINGS[index] ?? BOOKINGS[2];
  const [reschedule, setReschedule] = useState(false);
  const [time, setTime] = useState('13:00');
  const [cancelled, setCancelled] = useState(false);
  const times = ['10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '16:00', '16:30', '17:00'];
  return <div className={styles.pageContent}>
    <div className={styles.detailTop}><button type="button" className={styles.backButton} onClick={onBack}><Icon name="back" />Detail Booking</button><span className={styles.outletBadge}><Icon name="lock" />Outlet Tetap: Garasi Barber - Tebet</span></div>
    <div className={styles.bookingDetailLayout}>
      <section className={`${styles.panel} ${styles.bookingDetailCard}`}>
        <div className={styles.detailCodeRow}><span className={styles.codePill}>{booking.code}</span><Status tone={cancelled ? 'danger' : statusTone(booking.status)}>{cancelled ? 'Dibatalkan' : booking.status}</Status></div>
        <div className={styles.customerHero}><Avatar index={booking.avatar} size={74} /><div><h1>{booking.name}</h1><p><Icon name="phone" />+62 812 3456 7890</p><Status tone="success">Pelanggan baru</Status></div></div>
        <dl className={styles.detailFacts}><div><dt><Icon name="calendar" />Tanggal & Waktu</dt><dd>Sen, 8 Sep 2026<br />{reschedule ? time : `${booking.time} - 14:00`}</dd></div><div><dt><Icon name="scissors" />Layanan</dt><dd>{booking.service}<br /><small>60 menit · Rp 60.000</small></dd></div><div><dt><Icon name="user" />Kapster</dt><dd>{booking.barber} Pratama</dd></div><div><dt><Icon name="card" />Status Pembayaran</dt><dd><Status tone={booking.payment === 'Sudah Dibayar' ? 'success' : 'waiting'}>{booking.payment}</Status></dd></div><div><dt><Icon name="receipt" />Catatan</dt><dd>Ingin potongan seperti foto referensi.<br />Rambut agak tipis di samping.</dd></div></dl>
        <div className={styles.inlineActions}><PrimaryButton secondary icon="calendar" onClick={() => setReschedule(true)}>Ubah Jadwal</PrimaryButton><PrimaryButton secondary icon="phone" onClick={() => notify('Membuka WhatsApp dengan template booking')}>Kirim Customer</PrimaryButton><PrimaryButton secondary danger onClick={() => { setCancelled(true); notify('Booking dibatalkan dengan alasan operasional (prototype)'); }}>Batalkan</PrimaryButton></div>
        <PrimaryButton onClick={() => notify('Booking dikonfirmasi dan riwayat diperbarui')}>Konfirmasi Booking</PrimaryButton>
      </section>
      {reschedule ? <aside className={`${styles.panel} ${styles.reschedulePanel}`}><div className={styles.panelTitleRow}><div><h2>Ubah Jadwal Booking</h2><p>Pilih tanggal dan waktu baru.</p></div><button className={styles.iconButton} onClick={() => setReschedule(false)} aria-label="Tutup"><Icon name="close" /></button></div><div className={styles.dateChooser}><button>‹</button><strong>Sel, 9 Sep 2026</strong><button>›</button></div><h3>Pilih Waktu Tersedia</h3><div className={styles.timeGrid}>{times.map((slot) => <button className={time === slot ? styles.activeTime : ''} key={slot} onClick={() => setTime(slot)}>{slot}</button>)}</div><PrimaryButton className={styles.pushBottom} onClick={() => { notify(`Jadwal baru ${time} tersimpan`); setReschedule(false); }}>Simpan Jadwal Baru</PrimaryButton></aside> : <aside className={`${styles.panel} ${styles.bookingHelp}`}><span className={styles.largeRoundIcon}><Icon name="calendar" /></span><h2>Kelola jadwal dengan aman</h2><p>Perubahan waktu tetap tercatat di riwayat booking dan harus memakai slot yang tersedia.</p><PrimaryButton secondary onClick={() => setReschedule(true)}>Pilih Jadwal Baru</PrimaryButton></aside>}
    </div>
  </div>;
}

function TransactionsPage({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  const [method, setMethod] = useState('Semua');
  const rows = TRANSACTIONS.filter((item) => (method === 'Semua' || item[3] === method) && `${item[0]} ${item[1]}`.toLowerCase().includes(query.toLowerCase()));
  return <div className={styles.pageContent}>
    <div className={styles.transactionHeading}><PageHeading title="Transaksi" subtitle="Riwayat transaksi pembayaran pelanggan." /><MetricCard label="Total Transaksi Hari Ini" value="Rp 2.340.000" footnote="↑ 12% dari kemarin" icon="calendar" tone="gold" /></div>
    <section className={styles.panel}><div className={styles.toolbar}><div className={styles.pillTabs}>{['Semua', 'Tunai', 'QRIS', 'Kartu'].map((item) => <button className={method === item ? styles.activePill : ''} key={item} onClick={() => setMethod(item)}>{item} <span>({item === 'Semua' ? 12 : item === 'Tunai' ? 6 : item === 'QRIS' ? 4 : 2})</span></button>)}<button><Icon name="calendar" />Sen, 8 Sep 2026</button></div><div className={styles.toolbarSearch}><SearchBox value={query} onChange={setQuery} placeholder="Cari kode transaksi, nama pelanggan..." /><button className={styles.squareButton} aria-label="Filter transaksi"><Icon name="filter" /></button></div></div>
      <div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>No.</th><th>Kode</th><th>Pelanggan</th><th>Waktu</th><th>Metode</th><th>Nominal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row[0]}><td data-label="No.">{index + 1}</td><td data-label="Kode"><b>{row[0]}</b></td><td data-label="Pelanggan"><span className={styles.personCell}><Avatar index={row[5]} /><strong>{row[1]}</strong></span></td><td data-label="Waktu">{row[2]}</td><td data-label="Metode">{row[3]}</td><td data-label="Nominal"><b>{row[4]}</b></td><td data-label="Status"><Status tone="success">Selesai</Status></td><td data-label="Aksi"><button className={styles.iconButton} aria-label={`Detail ${row[0]}`}><Icon name="more" /></button></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

function CustomersPage({ query, setQuery, notify }: { query: string; setQuery: (value: string) => void; notify: (message: string) => void }) {
  const [label, setLabel] = useState('Semua');
  const rows = CUSTOMERS.filter((row) => (label === 'Semua' || row[4] === label) && `${row[0]} ${row[1]}`.toLowerCase().includes(query.toLowerCase()));
  return <div className={styles.pageContent}>
    <PageHeading title="Pelanggan" subtitle="Data pelanggan di outlet Anda."><PrimaryButton icon="plus" onClick={() => notify('Form tambah pelanggan dibuka')}>Tambah Pelanggan</PrimaryButton></PageHeading>
    <section className={styles.panel}><div className={styles.customerToolbar}><SearchBox value={query} onChange={setQuery} placeholder="Cari nama pelanggan atau nomor WhatsApp..." /><div className={styles.pillTabs}>{['Semua', 'Pelanggan Baru', 'Repeat'].map((item) => <button className={label === item ? styles.activePill : ''} onClick={() => setLabel(item)} key={item}>{item} <span>({item === 'Semua' ? 24 : item === 'Repeat' ? 10 : 8})</span></button>)}</div></div>
      <div className={styles.tableScroll}><table className={styles.dataTable}><thead><tr><th>No.</th><th>Pelanggan</th><th>Kontak</th><th>Total Kunjungan</th><th>Terakhir Datang</th><th>Label</th><th>Aksi</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row[0]}><td data-label="No.">{index + 1}</td><td data-label="Pelanggan"><span className={styles.personCell}><Avatar index={row[5]} /><strong>{row[0]}</strong></span></td><td data-label="Kontak"><span className={styles.contactCell}>{row[1]}</span></td><td data-label="Total Kunjungan">{row[2]}</td><td data-label="Terakhir Datang">{row[3]}</td><td data-label="Label"><Status tone={statusTone(row[4])}>{row[4]}</Status></td><td data-label="Aksi"><div className={styles.rowActions}><button className={`${styles.squareButton} ${styles.whatsappButton}`} onClick={() => notify(`Membuka WhatsApp ${row[0]}`)} aria-label={`WhatsApp ${row[0]}`}><Icon name="phone" /></button><button className={styles.squareButton} onClick={() => notify(`Booking baru untuk ${row[0]}`)} aria-label={`Booking ${row[0]}`}><Icon name="calendar" /></button></div></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

function ShiftPage({ active, onClose, onOpen }: { active: boolean; onClose: () => void; onOpen: () => void }) {
  if (!active) return <div className={styles.pageContent}><PageHeading title="Shift Kasir" subtitle="Kelola pembukaan dan penutupan shift Anda."><Status tone="neutral">Shift Belum Dibuka</Status></PageHeading><section className={`${styles.panel} ${styles.closedShift}`}><span className={styles.largeRoundIcon}><Icon name="wallet" /></span><h2>Mulai shift sebelum bertransaksi</h2><p>Masukkan saldo awal laci dan tipe shift. Transaksi tunai akan dikaitkan ke shift aktif ini.</p><PrimaryButton onClick={onOpen}>Buka Shift Kasir</PrimaryButton></section></div>;
  return <div className={styles.pageContent}>
    <PageHeading title="Shift Kasir" subtitle="Kelola pembukaan dan penutupan shift Anda."><Status tone="success">● Shift Sedang Berlangsung</Status></PageHeading>
    <div className={styles.shiftMeta}>Mulai: Sen, 8 Sep 2026 08:00</div>
    <div className={styles.shiftLayout}>
      <section className={`${styles.panel} ${styles.shiftSummary}`}><h2>Ringkasan Shift</h2><dl><div><dt><Icon name="wallet" />Saldo Awal (Kas)</dt><dd>Rp 500.000</dd></div><div><dt><Icon name="receipt" />Total Transaksi Tunai<small>12 transaksi</small></dt><dd>Rp 960.000</dd></div><div><dt><Icon name="wallet" />Pengeluaran / Refund<small>2 transaksi</small></dt><dd>Rp 50.000</dd></div></dl><div className={styles.shiftTotal}><span>Saldo Akhir (Diharapkan)</span><strong>Rp 1.410.000</strong></div><div className={styles.shiftTotal}><span>Saldo Aktual (Hitung Kas)</span><strong>Rp 1.410.000</strong></div><div className={`${styles.shiftTotal} ${styles.variance}`}><span>Selisih (Variance)</span><strong>Rp 0</strong></div><PrimaryButton onClick={onClose}>Tutup Shift</PrimaryButton></section>
      <section className={`${styles.panel} ${styles.timelinePanel}`}><h2>Riwayat Shift</h2><div className={styles.timeline}>{[['09:00', 'Shift dibuka', 'oleh Budi Santoso', 'success'], ['10:05', 'Transaksi #TRX-001', 'Rp 60.000 (Tunai)', 'success'], ['12:30', 'Pengeluaran', 'Beli sabun · Rp 50.000', 'danger'], ['15:20', 'Transaksi #TRX-008', 'Rp 85.000 (QRIS)', 'info']].map((item) => <article key={item[0]}><time>{item[0]}</time><i className={styles[`dot${item[3][0].toUpperCase()}${item[3].slice(1)}`]} /><div><strong>{item[1]}</strong><span>{item[2]}</span></div></article>)}</div><div className={styles.infoNote}>Pastikan saldo kas sudah sesuai sebelum menutup shift.</div></section>
    </div>
  </div>;
}

function Toggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={active} aria-label={label} className={`${styles.toggle} ${active ? styles.toggleOn : ''}`} onClick={onClick}><i /></button>;
}

function SettingsPage({ notify, shiftActive }: { notify: (message: string) => void; shiftActive: boolean }) {
  const [cash, setCash] = useState(true); const [qris, setQris] = useState(true); const [card, setCard] = useState(true); const [autoPrint, setAutoPrint] = useState(true); const [sound, setSound] = useState(true);
  return <div className={styles.pageContent}>
    <div className={styles.detailTop}><button type="button" className={styles.backButton}><Icon name="back" />Pengaturan</button><span className={styles.outletBadge}><Icon name="lock" />Outlet Tetap: Garasi Barber - Tebet</span></div>
    <div className={styles.settingsGrid}>
      <div className={styles.settingsColumn}><section className={styles.settingsGroup}><h2>Profil Kasir</h2><button className={styles.profileCard} onClick={() => notify('Profil kasir dibuka')}><Avatar index={0} size={46} /><span><strong>Budi Santoso</strong><small>Kasir</small><small>budi.santoso@kapster.id</small></span><span>›</span></button></section><section className={styles.settingsGroup}><h2>Informasi Outlet (Terkunci)</h2><div className={styles.lockedCard}><Icon name="lock" /><div><strong>Outlet Penugasan: Garasi Barber - Tebet</strong><p>Outlet ini adalah penugasan tetap Anda sebagai kasir dan tidak dapat diubah melalui dashboard. Jika ada perubahan penugasan, silakan hubungi admin/Owner.</p></div></div></section><section className={styles.settingsGroup}><h2>Printer & Struk</h2><SettingRow icon="printer" title="Printer Struk" value="Bluetooth Printer" status="Terhubung" /><SettingRow icon="printer" title="Cetak Struk Otomatis"><Toggle active={autoPrint} onClick={() => setAutoPrint(!autoPrint)} label="Cetak otomatis" /></SettingRow></section></div>
      <div className={styles.settingsColumn}><section className={styles.settingsGroup}><h2>Metode Pembayaran</h2><SettingRow icon="cash" title="Tunai"><Toggle active={cash} onClick={() => setCash(!cash)} label="Pembayaran tunai" /></SettingRow><SettingRow icon="qr" title="QRIS"><Toggle active={qris} onClick={() => setQris(!qris)} label="Pembayaran QRIS" /></SettingRow><SettingRow icon="card" title="Kartu (EDC)"><Toggle active={card} onClick={() => setCard(!card)} label="Pembayaran kartu" /></SettingRow></section><section className={styles.settingsGroup}><h2>Informasi Pembayaran</h2><SettingRow icon="qr" title="QRIS Outlet" value="Tampilkan QR saat transaksi" arrow /><SettingRow icon="card" title="EDC / Kartu" value="BCA · 1234" status="Aktif" arrow /></section><section className={styles.settingsGroup}><h2>Preferensi Aplikasi</h2><SettingRow icon="volume" title="Suara Notifikasi"><Toggle active={sound} onClick={() => setSound(!sound)} label="Suara notifikasi" /></SettingRow><SettingRow icon="theme" title="Tema Aplikasi" value="Terang" arrow /><SettingRow icon="globe" title="Bahasa" value="Bahasa Indonesia" arrow /></section><PrimaryButton danger secondary icon="logout" onClick={() => notify(shiftActive ? 'Tutup shift terlebih dahulu sebelum keluar dari aplikasi' : 'Anda telah keluar dari aplikasi')}>Keluar dari Aplikasi</PrimaryButton></div>
    </div>
  </div>;
}

function SettingRow({ icon, title, value, status, arrow, children }: { icon: IconName; title: string; value?: string; status?: string; arrow?: boolean; children?: React.ReactNode }) {
  return <div className={styles.settingRow}><span className={styles.settingIcon}><Icon name={icon} /></span><div><strong>{title}</strong>{value ? <small>{value}{status ? <em>{status}</em> : null}</small> : null}</div>{children ?? (arrow ? <span className={styles.settingArrow}>›</span> : null)}</div>;
}

function WalkInModal({ step, setStep, onClose, onComplete, notify }: { step: WalkInStep; setStep: (step: WalkInStep) => void; onClose: () => void; onComplete: (serviceId: string, barberId: string, payment: string) => void; notify: (message: string) => void }) {
  const [serviceId, setServiceId] = useState('haircut'); const [barberId, setBarberId] = useState('budi'); const [payment, setPayment] = useState('Tunai'); const [paid, setPaid] = useState('60000');
  const service = SERVICES.find((item) => item.id === serviceId) ?? SERVICES[0];
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={styles.walkInModal} role="dialog" aria-modal="true" aria-labelledby="walkin-title"><header><button className={styles.iconButton} aria-label="Kembali" onClick={() => step === 'service' ? onClose() : setStep(step === 'checkout' ? 'barber' : 'service')}><Icon name="back" /></button><h1 id="walkin-title">{step === 'service' ? 'Tambah Walk-in' : step === 'barber' ? 'Pilih Kapster' : 'Checkout'}</h1><button className={styles.iconButton} onClick={onClose} aria-label="Tutup"><Icon name="close" /></button></header><div className={styles.walkInBody}>
    {step !== 'barber' ? <div className={styles.selectedCustomer}><Avatar index={1} size={50} /><div><small>Customer</small><strong>Rizal Firmansyah</strong><span><Icon name="phone" />+62 813 1234 5678</span></div><Status tone="success">Pelanggan baru</Status></div> : null}
    {step === 'service' ? <><h2>Pilih Layanan</h2><div className={styles.optionList}>{SERVICES.map((item) => <button key={item.id} className={serviceId === item.id ? styles.selectedOption : ''} onClick={() => setServiceId(item.id)}><span className={styles.optionIcon}><Icon name="scissors" /></span><span><strong>{item.name}</strong><small>{item.duration} menit</small></span><b>{rupiah(item.price)}</b><i>{serviceId === item.id ? <Icon name="check" /> : null}</i></button>)}</div><PrimaryButton className={styles.modalAction} onClick={() => setStep('barber')}>Lanjut ke Kapster</PrimaryButton></> : null}
    {step === 'barber' ? <><div className={styles.dateChooser}><button aria-label="Hari sebelumnya">‹</button><strong>Hari ini, 8 Sep 2026</strong><button aria-label="Hari berikutnya">›</button></div><div className={styles.optionList}>{BARBERS.map((item) => <button key={item.id} className={barberId === item.id ? styles.selectedOption : ''} onClick={() => setBarberId(item.id)}><Avatar index={item.avatar} size={47} /><span><strong>{item.name}</strong><small className={item.availability.includes('sekarang') ? styles.available : ''}>{item.availability}</small></span><i>{barberId === item.id ? <span className={styles.radioChecked} /> : <span className={styles.radio} />}</i></button>)}</div><PrimaryButton className={styles.modalAction} onClick={() => setStep('checkout')}>Lanjut ke Checkout</PrimaryButton></> : null}
    {step === 'checkout' ? <><h2>Ringkasan Order</h2><div className={styles.orderSummary}><span>{service.name}<b>{rupiah(service.price)}</b></span><strong>Total <b>{rupiah(service.price)}</b></strong></div><h2>Metode Pembayaran</h2><div className={styles.paymentGrid}>{[['Tunai', 'cash'], ['QRIS', 'qr'], ['Kartu', 'card']].map((item) => <button className={payment === item[0] ? styles.selectedPayment : ''} key={item[0]} onClick={() => setPayment(item[0])}><Icon name={item[1] as IconName} /><span>{item[0]}</span></button>)}</div><label className={styles.paymentField}><span>Jumlah Dibayar</span><span>Rp <input inputMode="numeric" value={paid} onChange={(event) => setPaid(event.target.value.replace(/\D/g, ''))} /></span></label><div className={styles.changeRow}><span>Kembalian</span><strong>{rupiah(Math.max(0, Number(paid) - service.price))}</strong></div><PrimaryButton disabled={Number(paid) < service.price && payment === 'Tunai'} className={styles.modalAction} onClick={() => { if (Number(paid) < service.price && payment === 'Tunai') { notify('Jumlah pembayaran tunai belum cukup'); return; } onComplete(serviceId, barberId, payment); }}>Selesaikan Transaksi</PrimaryButton></> : null}
  </div></section></div>;
}

function CloseShiftModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (actual: number, reason: string) => void }) {
  const [actual, setActual] = useState('1410000'); const [reason, setReason] = useState(''); const variance = Number(actual) - 1410000;
  return <div className={styles.modalBackdrop}><section className={`${styles.walkInModal} ${styles.closeShiftModal}`} role="dialog" aria-modal="true" aria-labelledby="close-shift-title"><header><span className={styles.headerIcon}><Icon name="wallet" /></span><h1 id="close-shift-title">Tutup Shift Kasir</h1><button className={styles.iconButton} onClick={onClose} aria-label="Tutup"><Icon name="close" /></button></header><div className={styles.walkInBody}><div className={styles.shiftCheck}><span>Saldo diharapkan</span><strong>Rp 1.410.000</strong></div><label className={styles.formField}><span>Saldo aktual hasil hitung kas</span><span className={styles.moneyInput}>Rp <input autoFocus inputMode="numeric" value={actual} onChange={(event) => setActual(event.target.value.replace(/\D/g, ''))} /></span></label><div className={`${styles.variancePreview} ${variance !== 0 ? styles.varianceWarning : ''}`}><span>Variance</span><strong>{rupiah(variance)}</strong></div>{variance !== 0 ? <label className={styles.formField}><span>Alasan variance <b>*</b></span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Jelaskan penyebab selisih kas..." /></label> : null}<div className={styles.modalButtons}><PrimaryButton secondary onClick={onClose}>Kembali</PrimaryButton><PrimaryButton disabled={!actual || (variance !== 0 && !reason.trim())} onClick={() => onConfirm(Number(actual), reason)}>Konfirmasi Tutup Shift</PrimaryButton></div></div></section></div>;
}

function OpenShiftModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (balance: number, type: string) => void }) {
  const [balance, setBalance] = useState('500000'); const [type, setType] = useState('Pagi');
  return <div className={styles.modalBackdrop}><section className={`${styles.walkInModal} ${styles.closeShiftModal}`} role="dialog" aria-modal="true" aria-labelledby="open-shift-title"><header><span className={styles.headerIcon}><Icon name="wallet" /></span><h1 id="open-shift-title">Buka Shift Kasir</h1><button className={styles.iconButton} onClick={onClose} aria-label="Tutup"><Icon name="close" /></button></header><div className={styles.walkInBody}><label className={styles.formField}><span>Tipe shift</span><span className={styles.shiftTypeGrid}>{['Pagi', 'Sore', 'Long Shift'].map((item) => <button type="button" className={type === item ? styles.activeShiftType : ''} onClick={() => setType(item)} key={item}>{item}</button>)}</span></label><label className={styles.formField}><span>Saldo awal laci kas</span><span className={styles.moneyInput}>Rp <input autoFocus inputMode="numeric" value={balance} onChange={(event) => setBalance(event.target.value.replace(/\D/g, ''))} /></span></label><div className={styles.infoNote}>Pastikan saldo awal sesuai dengan kas fisik sebelum shift dimulai.</div><div className={styles.modalButtons}><PrimaryButton secondary onClick={onClose}>Kembali</PrimaryButton><PrimaryButton disabled={!balance} onClick={() => onConfirm(Number(balance), type)}>Mulai Shift</PrimaryButton></div></div></section></div>;
}

export function CashierDashboard() {
  const [view, setView] = useState<View>('dashboard');
  const [lastMainView, setLastMainView] = useState<View>('dashboard');
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [queueFilter, setQueueFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<QueueItem>(INITIAL_QUEUE[2]);
  const [selectedBooking, setSelectedBooking] = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walkInStep, setWalkInStep] = useState<WalkInStep | null>(null);
  const [closingShift, setClosingShift] = useState(false);
  const [openingShift, setOpeningShift] = useState(false);
  const [shiftActive, setShiftActive] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function notify(message: string) { setToast(message); }
  function navigate(next: View) { setQuery(''); setSidebarOpen(false); setView(next); if (next !== 'detail' && next !== 'bookingDetail') setLastMainView(next); }
  function openCustomer(item: QueueItem) { setSelectedCustomer(item); setLastMainView(view === 'queue' ? 'queue' : 'dashboard'); setView('detail'); }
  function updateService(item: QueueItem) {
    const next: QueueStatus = item.status === 'Sedang Dilayani' ? 'Selesai' : 'Sedang Dilayani';
    setQueue((current) => current.map((row) => row.id === item.id ? { ...row, status: next } : row));
    setSelectedCustomer((current) => current.id === item.id ? { ...current, status: next } : current);
    notify(next === 'Selesai' ? 'Layanan selesai dan siap diproses ke pembayaran' : `${item.name} mulai dilayani`);
  }
  function completeWalkIn(serviceId: string, barberId: string, payment: string) {
    const service = SERVICES.find((item) => item.id === serviceId) ?? SERVICES[0]; const barber = BARBERS.find((item) => item.id === barberId) ?? BARBERS[0];
    setQueue((current) => [...current, { id: Date.now(), time: '10:24', name: 'Rizal Firmansyah', phone: '+62 813 1234 5678', service: service.name, barber: barber.name.split(' ')[0], status: 'Selesai', price: service.price, avatar: 1 }]);
    setWalkInStep(null); setView('dashboard'); setLastMainView('dashboard'); notify(`Transaksi ${payment} berhasil dicatat`);
  }

  return <main className={styles.cashierApp}>
    {sidebarOpen ? <button type="button" className={styles.sidebarBackdrop} aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} /> : null}
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarLogo}><Logo /></div>
      <button type="button" className={styles.outletSwitch} onClick={() => notify('Akun ini hanya ditugaskan ke Garasi Barber - Tebet')}><span><Icon name="lock" /></span><span><small>Outlet Tetap</small><strong>Garasi Barber - Tebet</strong></span><Icon name="down" /></button>
      <nav aria-label="Navigasi kasir">{NAV_ITEMS.map((item) => { const active = view === item.id || (view === 'detail' && lastMainView === item.id) || (view === 'bookingDetail' && item.id === 'booking'); return <button type="button" key={item.id} aria-current={active ? 'page' : undefined} className={active ? styles.activeNav : ''} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span></button>; })}</nav>
      <section className={styles.shiftCard}><span>Sesi Kasir</span><div><Avatar index={0} size={37} /><p><strong>Budi Santoso</strong><small>{shiftActive ? 'Mulai shift 09.00' : 'Shift telah ditutup'}</small></p></div><button type="button" onClick={() => shiftActive ? setClosingShift(true) : setOpeningShift(true)}>{shiftActive ? 'Akhiri Shift' : 'Mulai Shift'}</button></section>
    </aside>
    <div className={styles.appBody}>
      <header className={styles.topbar}><button type="button" className={styles.menuButton} onClick={() => setSidebarOpen(true)} aria-label="Buka menu"><Icon name="menu" /></button><div className={styles.dateTime}><small>Sen, 8 Sep 2026</small><strong>10:24</strong></div><span className={styles.openBadge}>● Outlet Buka</span><span className={styles.outletTop}><Icon name="lock" />Outlet Tetap: Garasi Barber - Tebet</span><div className={styles.topSpacer} /><button type="button" className={styles.bellButton} onClick={() => notify('Tidak ada notifikasi baru')} aria-label="Notifikasi"><Icon name="bell" /></button><button type="button" className={styles.userButton} onClick={() => navigate('settings')}><span>BS</span><p><strong>Budi Santoso</strong><small>Kasir</small></p></button></header>
      <section className={styles.workspace}>
        {(view === 'dashboard' || view === 'queue') ? <QueuePage queue={queue} query={query} setQuery={setQuery} filter={queueFilter} setFilter={setQueueFilter} onOpen={openCustomer} onStart={updateService} onWalkIn={() => shiftActive ? setWalkInStep('service') : notify('Buka shift kasir sebelum menambahkan walk-in')} compact={view === 'queue'} /> : null}
        {view === 'detail' ? <CustomerDetail item={selectedCustomer} onBack={() => setView(lastMainView)} onStart={() => updateService(selectedCustomer)} notify={notify} /> : null}
        {view === 'booking' ? <BookingPage query={query} setQuery={setQuery} notify={notify} onOpen={(index) => { setSelectedBooking(index); setView('bookingDetail'); }} /> : null}
        {view === 'bookingDetail' ? <BookingDetail index={selectedBooking} onBack={() => setView('booking')} notify={notify} /> : null}
        {view === 'transactions' ? <TransactionsPage query={query} setQuery={setQuery} /> : null}
        {view === 'customers' ? <CustomersPage query={query} setQuery={setQuery} notify={notify} /> : null}
        {view === 'shift' ? <ShiftPage active={shiftActive} onClose={() => setClosingShift(true)} onOpen={() => setOpeningShift(true)} /> : null}
        {view === 'settings' ? <SettingsPage notify={notify} shiftActive={shiftActive} /> : null}
      </section>
      <nav className={styles.mobileNav} aria-label="Navigasi cepat"><button type="button" aria-current={view === 'queue' || view === 'dashboard' || view === 'detail' ? 'page' : undefined} className={view === 'queue' || view === 'dashboard' || view === 'detail' ? styles.activeMobile : ''} onClick={() => navigate('queue')}><Icon name="queue" /><span>Antrean</span></button><button type="button" aria-current={view === 'booking' || view === 'bookingDetail' ? 'page' : undefined} className={view === 'booking' || view === 'bookingDetail' ? styles.activeMobile : ''} onClick={() => navigate('booking')}><Icon name="calendar" /><span>Booking</span></button><button type="button" aria-current={view === 'transactions' ? 'page' : undefined} className={view === 'transactions' ? styles.activeMobile : ''} onClick={() => navigate('transactions')}><Icon name="receipt" /><span>Transaksi</span></button><button type="button" className={view === 'customers' || view === 'shift' || view === 'settings' ? styles.activeMobile : ''} onClick={() => setSidebarOpen(true)}><Icon name="menu" /><span>Menu</span></button></nav>
    </div>
    {walkInStep ? <WalkInModal step={walkInStep} setStep={setWalkInStep} onClose={() => setWalkInStep(null)} onComplete={completeWalkIn} notify={notify} /> : null}
    {closingShift ? <CloseShiftModal onClose={() => setClosingShift(false)} onConfirm={(_, reason) => { setClosingShift(false); setShiftActive(false); notify(reason ? 'Shift ditutup dan variance dikirim untuk ditinjau Owner' : 'Shift berhasil ditutup tanpa variance'); }} /> : null}
    {openingShift ? <OpenShiftModal onClose={() => setOpeningShift(false)} onConfirm={(balance, type) => { setOpeningShift(false); setShiftActive(true); notify(`Shift ${type.toLowerCase()} dibuka dengan saldo ${rupiah(balance)}`); }} /> : null}
    {toast ? <div className={styles.toast} role="status"><span><Icon name="check" /></span>{toast}<button onClick={() => setToast('')} aria-label="Tutup notifikasi"><Icon name="close" size={14} /></button></div> : null}
  </main>;
}
