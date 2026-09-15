import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppData, dayLabel, Entity, User, labels, rupiah, shortDate, today } from './api';
import { Badge, Card, Empty, Table, exportCsv } from './ui';
import { Glyph } from './Glyph';
import { calendarLanes, cardHeight } from './calendarLanes';
import { Logo } from '../../../components/ui/Logo';
import o from '../../../components/owner/OwnerDashboard.module.css';
import c from '../../../components/cashier/CashierDashboard.module.css';
import a from '../../../components/admin/AdminDashboard.module.css';
import f from '../../../components/onboarding/FlowPage.module.css';

export const visualMenus = {
  owner: [
    ['', 'Dashboard', 'home'],
    ['bookings', 'Booking', 'clock'],
    ['calendar', 'Kalender', 'calendar'],
    ['transactions', 'Transaksi', 'receipt'],
    ['reports', 'Laporan', 'chart'],
    ['outlets', 'Outlet', 'store'],
    ['barbers', 'Kapster', 'users'],
    ['services', 'Layanan', 'scissors'],
    ['customers', 'Customer', 'customer'],
    ['cashiers', 'Kasir & Shift', 'briefcase'],
    ['settings', 'Pengaturan', 'settings'],
  ],
  cashier: [
    ['', 'Kasir', 'home'],
    ['bookings', 'Antrean', 'users'],
    ['new', 'Booking', 'calendar'],
    ['transactions', 'Transaksi', 'receipt'],
    ['customers', 'Pelanggan', 'customer'],
    ['shifts', 'Shift Kasir', 'wallet'],
    ['settings', 'Pengaturan', 'settings'],
  ],
  admin: [
    ['', 'Overview', 'home'],
    ['tenants', 'Tenants', 'store'],
    ['tenant-detail', 'Tenant Detail', 'customer'],
    ['onboarding', 'Onboarding', 'check'],
    ['subscription', 'Subscription', 'card'],
    ['operations', 'Operations', 'briefcase'],
    ['support', 'Support', 'phone'],
    ['analytics', 'Analytics', 'chart'],
    ['audit', 'Audit & Security', 'lock'],
    ['settings', 'Platform Settings', 'settings'],
  ],
};
const subtitles: Record<string, string> = {
  bookings: 'Kelola semua reservasi pelanggan dan pantau status kunjungan.',
  calendar: 'Lihat jadwal booking dan kapasitas di semua outlet dalam satu tampilan.',
  transactions: 'Pantau semua pembayaran dan refund di outlet Anda.',
  reports: 'Dapatkan insight performa bisnis barber Anda dari data operasional.',
  outlets: 'Kelola outlet, pantau performa, dan pastikan operasional berjalan lancar.',
  barbers: 'Kelola tim kapster, ketersediaan, dan jadwal kerja di setiap outlet.',
  services: 'Kelola daftar layanan, harga, dan durasi treatment barbershop Anda.',
  customers: 'Kenali pelanggan Anda dan lihat riwayat kunjungan mereka.',
  cashiers: 'Pantau aktivitas kasir, shift, dan rekonsiliasi kas di semua outlet.',
  settings: 'Kelola konfigurasi bisnis, peran tim, dan preferensi akun Anda.',
  tenants: 'Kelola seluruh bisnis yang terdaftar di platform Kapster.id.',
  audit: 'Pantau aktivitas dan perubahan akses platform.',
  shifts: 'Kelola sesi kasir dan pastikan uang kas sesuai dengan transaksi.',
  new: 'Catat kunjungan pelanggan dan pilih jadwal yang tersedia.',
};
export function Person({ name, detail }: { name: string; detail?: ReactNode }) {
  return (
    <span className={o.personCell}>
      <span className="live-avatar">
        {name
          .split(' ')
          .slice(0, 2)
          .map((n) => n[0])
          .join('')
          .toUpperCase()}
      </span>
      <span>
        <strong>{name}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </span>
  );
}
export function Metric({
  label,
  value,
  icon = 'chart',
  tone = 'Gold',
  note,
}: {
  label: string;
  value: ReactNode;
  icon?: Parameters<typeof Glyph>[0]['name'];
  tone?: string;
  note?: string;
}) {
  return (
    <article className={o.metricCard}>
      <span className={`${o.metricIcon} ${o['tone' + tone]}`}>
        <Glyph name={icon} size={22} />
      </span>
      <div>
        <span className={o.metricLabel}>{label}</span>
        <strong className={String(value).length > 11 ? o.metricValueCompact : ''}>{value}</strong>
        {note && <small className="metric-note">{note}</small>}
      </div>
    </article>
  );
}
export function Stats({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className={`${o.metricsFour} live-metrics`}>
      {items.map(([label, value], i) => (
        <Metric
          key={label}
          label={label}
          value={value}
          icon={(['coin', 'calendar', 'users', 'check'] as const)[i % 4]}
          tone={['Gold', 'Blue', 'Green', 'Purple'][i % 4]}
        />
      ))}
    </div>
  );
}
export function WorkspaceShell({
  user,
  data,
  page,
  menuOpen,
  setMenu,
  search,
  setSearch,
  logout,
  children,
}: {
  user: User;
  data: AppData | null;
  page: string;
  menuOpen: boolean;
  setMenu: (v: boolean) => void;
  search: string;
  setSearch: (s: string) => void;
  logout: () => void;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const s = user.role === 'owner' ? o : user.role === 'cashier' ? c : a;
  const base = user.role === 'cashier' ? '/kasir' : '/' + user.role;
  const menu = visualMenus[user.role];
  const shift = data?.shifts.find((v) => v.userId === user.id && !v.closed);
  const outlet = data?.outlets.find((v) => v.id === (shift?.outletId || user.outletId));
  function go(route: string) {
    navigate(base + (route ? '/' + route : ''));
    setMenu(false);
  }
  return (
    <div
      className={`${s[user.role === 'owner' ? 'dashboardApp' : user.role === 'cashier' ? 'cashierApp' : 'adminApp']} restored-workspace role-${user.role}`}
    >
      {menuOpen && (
        <button className={s.sidebarBackdrop} aria-label="Tutup navigasi" onClick={() => setMenu(false)} />
      )}
      <aside className={`${s.sidebar} ${menuOpen ? s.sidebarOpen : ''}`}>
        <Link to={base} className={user.role === 'admin' ? a.brand : s.sidebarLogo}>
          <Logo />
          {user.role === 'admin' && <small>ADMIN PLATFORM</small>}
        </Link>
        {user.role === 'owner' && (
          <button className={o.businessSwitch} onClick={() => go('outlets')}>
            <span className={o.outletImage} />
            <span>
              <strong>{data?.org.name || 'Memuat bisnis…'}</strong>
              <small>Owner</small>
            </span>
            <Glyph name="chevron" size={14} />
          </button>
        )}
        {user.role === 'cashier' && (
          <button className={c.outletSwitch} onClick={() => go('settings')}>
            <span>
              <Glyph name="store" />
            </span>
            <span>
              <small>Outlet aktif</small>
              <strong>{outlet?.name || data?.org.name || 'Memuat…'}</strong>
            </span>
            <Glyph name="lock" size={14} />
          </button>
        )}
        <nav aria-label={`Navigasi ${labels[user.role]}`}>
          {menu.map(([route, label, icon]) => (
            <button
              key={route}
              aria-current={route === page ? 'page' : undefined}
              className={route === page ? s.activeNav : ''}
              onClick={() => go(route)}
            >
              <Glyph name={icon as Parameters<typeof Glyph>[0]['name']} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        {user.role === 'owner' ? (
          <div className={o.sidebarFoot}>
            <article className={o.planCard}>
              <span>♛</span>
              <div>
                <strong>Workspace bisnis</strong>
                <small>{data?.outlets.length ?? 0} outlet · Mode lokal</small>
                <button onClick={() => go('subscription')}>
                  Lihat Langganan <Glyph name="arrow" size={14} />
                </button>
              </div>
            </article>
            <button className={o.helpCard} onClick={() => go('onboarding')}>
              <Glyph name="check" />
              <span>
                <strong>Setup Bisnis</strong>
                <small>Kelola kesiapan operasional</small>
              </span>
            </button>
          </div>
        ) : user.role === 'cashier' ? (
          <section className={c.shiftCard}>
            <div className="shift-card-heading">
              <Glyph name="wallet" size={16} />
              <strong>Sesi Kasir</strong>
              <Badge value={shift ? 'Aktif' : 'Belum dibuka'} />
            </div>
            <Person
              name={user.name}
              detail={
                shift
                  ? `Mulai ${new Date(shift.opened).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Siap melayani pelanggan'
              }
            />
            <button onClick={() => go('shifts')}>{shift ? 'Akhiri Shift' : 'Mulai Shift'}</button>
          </section>
        ) : (
          <div className={a.sidebarFoot}>
            <strong>Kapster.id Admin Platform</strong>
            <span>Lingkungan lokal</span>
          </div>
        )}
        {user.role === 'cashier' && (
          /* The icon rail hides the shift card, so keep one compact shift control there. */
          <button
            className={`rail-shift ${shift ? 'on' : ''}`}
            onClick={() => go('shifts')}
            aria-label={shift ? 'Shift aktif. Buka Shift Kasir' : 'Shift belum dibuka. Buka Shift Kasir'}
          >
            <Glyph name="wallet" />
            <small>{shift ? 'Shift aktif' : 'Mulai shift'}</small>
          </button>
        )}
      </aside>
      <div className={s.appBody}>
        <header className={s.topbar}>
          <button className={s.menuButton} aria-label="Buka navigasi" onClick={() => setMenu(!menuOpen)}>
            <Glyph name="menu" />
          </button>
          {user.role === 'cashier' ? (
            <>
              <div className={c.dateTime}>
                <small>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </small>
                <strong>
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>
              <span className={c.openBadge}>{shift ? 'Shift Aktif' : 'Shift Belum Dibuka'}</span>
              <span className={c.outletTop}>
                <Glyph name="store" size={17} />
                {outlet?.name}
              </span>
            </>
          ) : (
            <label className={user.role === 'owner' ? o.globalSearch : a.searchField}>
              <Glyph name="search" />
              <input
                aria-label="Pencarian global"
                placeholder={
                  user.role === 'admin'
                    ? 'Cari tenant, owner, atau aktivitas...'
                    : 'Cari booking, customer, kapster, atau outlet...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌕</kbd>
            </label>
          )}
          <span className={s.topbarSpacer || c.topSpacer} />
          {user.role === 'admin' && (
            <span className={a.environment}>
              <i />
              LOCAL
            </span>
          )}
          <button
            className={s.bellButton}
            aria-label="Lihat aktivitas"
            onClick={() => go(user.role === 'admin' ? 'audit' : 'settings')}
          >
            <Glyph name="bell" />
          </button>
          <span className={o.headerDivider} />
          <Person name={user.name} detail={labels[user.role]} />
          <button className="logout-button" onClick={logout}>
            Keluar
          </button>
        </header>
        <main className={`${s.workspace} live-workspace`} key={page}>
          {children}
        </main>
        {user.role === 'cashier' && (
          <nav className={c.mobileNav}>
            {menu.slice(0, 3).map(([route, label, icon]) => (
              <button key={route} onClick={() => go(route)}>
                <Glyph name={icon as Parameters<typeof Glyph>[0]['name']} />
                {label}
              </button>
            ))}
            <button onClick={() => setMenu(true)}>
              <Glyph name="menu" />
              Menu
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
export function PageTitle({
  user,
  page,
  orgName,
  children,
}: {
  user: User;
  page: string;
  orgName?: string;
  children: ReactNode;
}) {
  const title = page
    ? visualMenus[user.role].find((v) => v[0] === page)?.[1] || 'Operasional'
    : user.role === 'owner'
      ? `Selamat datang, ${user.name.split(' ')[0]}!`
      : user.role === 'cashier'
        ? 'Dashboard Kasir'
        : 'Platform Overview';
  return (
    <div className={o.pageHeading}>
      <div>
        <h1>{title}</h1>
        <p>
          {page
            ? subtitles[page] || 'Pantau dan kelola operasional platform.'
            : user.role === 'owner'
              ? `Berikut ringkasan performa ${orgName || 'bisnis Anda'} di semua outlet.`
              : user.role === 'cashier'
                ? 'Kelola antrean dan transaksi pelanggan hari ini.'
                : 'Ringkasan performa, aktivitas, dan kesehatan platform Kapster.id.'}
        </p>
      </div>
      <div className={o.pageActions}>{children}</div>
    </div>
  );
}
const dayOf = (iso: string) => new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 10);
function dayRange(count = 7) {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(today() + 'T12:00:00Z') - (count - 1 - i) * 86400000).toISOString().slice(0, 10),
  );
}
export function RevenueChart({
  payments,
  bookings,
  title = 'Pendapatan & Booking',
}: {
  payments: Entity[];
  bookings: Entity[];
  title?: string;
}) {
  const days = dayRange();
  const revenue = days.map((d) =>
    payments.filter((p) => dayOf(p.created) === d).reduce((n, p) => n + p.amount, 0),
  );
  const counts = days.map((d) => bookings.filter((b) => b.date === d).length);
  const max = Math.max(...revenue, 1),
    maxCount = Math.max(...counts, 1);
  const points = counts.map((n, i) => `${i * 61 + 20},${112 - (n / maxCount) * 92}`).join(' ');
  return (
    <section className={`${o.panel} ${o.chartPanel}`}>
      <div className={o.panelHeader}>
        <h3>{title}</h3>
        <span className="muted">7 hari terakhir</span>
      </div>
      <div className={o.chartLegend}>
        <span>
          <i className={o.legendGold} />
          Pendapatan (Rp)
        </span>
        <span>
          <i className={o.legendLine} />
          Jumlah Booking
        </span>
      </div>
      <div className={o.chartArea}>
        <div className={o.yLabels}>
          {[1, 0.75, 0.5, 0.25, 0].map((n) => (
            <span key={n}>{Math.round(max * n).toLocaleString('id-ID')}</span>
          ))}
        </div>
        <div className={o.chartCanvas}>
          {revenue.map((n, i) => (
            <i key={i} style={{ height: `${(n / max) * 90}%` }} title={`${days[i]}: ${rupiah(n)}`} />
          ))}
          <svg
            viewBox="0 0 410 120"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Jumlah booking tujuh hari terakhir: ${counts.join(', ')}`}
          >
            <polyline points={points} />
            {counts.map((n, i) => (
              <circle key={i} cx={i * 61 + 20} cy={112 - (n / maxCount) * 92} r="3" />
            ))}
          </svg>
          <div className={o.xLabels}>
            {days.map((d) => (
              <span key={d}>
                {new Date(d + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export function Distribution({
  items,
  label = 'Total Booking',
}: {
  items: { name: string; value: number }[];
  label?: string;
}) {
  const total = items.reduce((n, v) => n + v.value, 0),
    colors = ['#2594eb', '#a87932', '#20b981', '#9774c4', '#b2bbc6'];
  let running = 0;
  const gradient = items
    .filter((v) => v.value > 0)
    .map((v, i) => {
      const start = running;
      running += (v.value / total) * 100;
      return `${colors[i % 5]} ${start}% ${running}%`;
    })
    .join(',');
  return (
    <div className={o.donutRow}>
      <div className={o.donut} style={{ background: total ? `conic-gradient(${gradient})` : '#edf0f2' }}>
        <div>
          <strong>{total}</strong>
          <span>{label}</span>
        </div>
      </div>
      <div className={o.legendList}>
        {items.map((v, i) => (
          <span key={v.name}>
            <i style={{ background: colors[i % 5] }} />
            {v.name}
            <b>{v.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
export function Activity({ items }: { items: Entity[] }) {
  return (
    <div className={o.notificationList}>
      {!items.length ? (
        <Empty>Belum ada aktivitas.</Empty>
      ) : (
        items.slice(0, 5).map((v) => (
          <div className="activity-item" key={v.id}>
            <span className={`${o.noticeIcon} ${o.toneGold}`}>
              <Glyph name="bell" size={16} />
            </span>
            <span>
              <strong>{v.action}</strong>
              <small>
                {v.actorName || 'Sistem'}
                {v.reason ? ` · ${v.reason}` : ''}
              </small>
            </span>
            <time>
              {new Date(v.created).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </time>
          </div>
        ))
      )}
    </div>
  );
}
export function OwnerOverview({ data, outletFilter }: { data: AppData; outletFilter: string }) {
  const payments = data.payments.filter((v) => !outletFilter || v.outletId === outletFilter),
    bookings = data.bookings.filter((v) => !outletFilter || v.outletId === outletFilter);
  const dates = dayRange(),
    recent = bookings.filter((v) => dates.includes(v.date)),
    revenue = payments.filter((v) => dates.includes(dayOf(v.created)));
  return (
    <>
      <div className={o.overviewLayout}>
        <div className={o.overviewMain}>
          <Stats
            items={[
              ['Total Pendapatan', rupiah(revenue.reduce((n, v) => n + v.amount, 0))],
              ['Total Booking', recent.length],
              ['Layanan Selesai', recent.filter((v) => v.status === 'completed').length],
              ['Customer', new Set(recent.map((v) => v.phone)).size],
            ]}
          />
          <div className={o.overviewCharts}>
            <RevenueChart payments={payments} bookings={bookings} />
            <Card title="Performa Outlet" action={<Link to="/owner/outlets">Lihat Semua →</Link>}>
              <div className={o.outletPerformance}>
                {data.outlets
                  .filter((v) => !outletFilter || v.id === outletFilter)
                  .map((v) => (
                    <div key={v.id}>
                      <span className={o.outletImage} />
                      <span>
                        <strong>{v.name}</strong>
                        <small>{recent.filter((b) => b.outletId === v.id).length} booking</small>
                      </span>
                      <b>
                        {rupiah(revenue.filter((p) => p.outletId === v.id).reduce((n, p) => n + p.amount, 0))}
                      </b>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
          <div className={o.overviewBottom}>
            <Card title="Booking Hari Ini" action={<Link to="/owner/bookings">Lihat Semua →</Link>}>
              <div className={o.miniBookings}>
                {bookings.filter((b) => b.date === today()).length === 0 ? (
                  <Empty>Belum ada booking hari ini.</Empty>
                ) : (
                  bookings
                    .filter((b) => b.date === today())
                    .slice(0, 5)
                    .map((b) => (
                      <Link className="mini-booking-row" key={b.id} to="/owner/bookings">
                        <time>{b.time}</time>
                        <Person name={b.name} detail={b.serviceName} />
                        <Badge value={b.status} />
                      </Link>
                    ))
                )}
              </div>
            </Card>
            <Card title="Layanan Terlaris">
              <Distribution
                items={data.services
                  .map((v) => ({ name: v.name, value: recent.filter((b) => b.serviceId === v.id).length }))
                  .sort((x, y) => y.value - x.value)
                  .slice(0, 4)}
              />
            </Card>
            <Card title="Top Kapster" action={<Link to="/owner/barbers">Lihat Semua →</Link>}>
              <div className={o.rankList}>
                {data.barbers
                  .map((v) => ({
                    id: v.id,
                    name: v.name,
                    count: recent.filter((b) => b.barberId === v.id).length,
                  }))
                  .sort((x, y) => y.count - x.count)
                  .slice(0, 5)
                  .map((v, i) => (
                    <div key={v.id}>
                      <b>{i + 1}</b>
                      <Person name={v.name} detail={`${v.count} booking`} />
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
        <aside className={o.overviewAside}>
          <div className={o.insightHero}>
            <div>
              <strong>
                <span>Isi slot kosong,</span>
                <br />
                tingkatkan
                <br />
                pendapatan.
              </strong>
              <p>Cek jadwal dan buat strategi untuk waktu kunjungan yang sepi.</p>
              <Link className={o.actionButton} to="/owner/reports">
                Lihat Insight →
              </Link>
            </div>
          </div>
          <Card title="Aktivitas Terbaru" action={<Link to="/owner/settings">Lihat Semua →</Link>}>
            <Activity items={data.audit} />
          </Card>
        </aside>
      </div>
      <div className={o.bottomBanner}>
        <span className={o.bannerIcon}>
          <Glyph name="chart" />
        </span>
        <div>
          <strong>Download laporan lengkap</strong>
          <p>Ekspor data pendapatan dan booking dalam format CSV.</p>
        </div>
        <Link to="/owner/reports" className={o.actionButton}>
          Download Laporan <Glyph name="download" size={16} />
        </Link>
      </div>
    </>
  );
}
export function BookingList({
  data,
  bookings,
  actions,
  search,
  setSearch,
  base,
  cashier = false,
}: {
  data: AppData;
  bookings: Entity[];
  actions: (b: Entity, variant?: 'row' | 'panel') => ReactNode;
  search: string;
  setSearch: (s: string) => void;
  base: string;
  cashier?: boolean;
}) {
  const [selectedId, setSelected] = useState(''),
    [status, setStatus] = useState('all'),
    [drawer, setDrawer] = useState(false);
  const rows = bookings
    .filter((b) => status === 'all' || b.status === status)
    .sort((x, y) => x.starts - y.starts);
  const selected = rows.find((b) => b.id === selectedId) || rows[0];
  const todays = bookings.filter((v) => v.date === today());
  const outlet = (id: string) => data.outlets.find((v) => v.id === id)?.name;
  return (
    <>
      <Stats
        items={[
          ['Total Booking Hari Ini', todays.length],
          ['Menunggu', todays.filter((b) => b.status === 'confirmed').length],
          ['Sedang Dilayani', todays.filter((b) => b.status === 'in_service').length],
          ['Selesai', todays.filter((b) => b.status === 'completed').length],
        ]}
      />
      <div className={`${o.splitDetailLayout} ${cashier ? 'cashier-booking-layout' : ''}`}>
        <div className={o.splitMain}>
          <Card
            title={cashier ? 'Antrean Hari Ini' : 'Daftar Booking'}
            action={
              <Link to={`${base}/new`} className="primary">
                <Glyph name="plus" size={16} />
                {cashier ? 'Walk-in / Booking Kasir' : 'Buat Booking Manual'}
              </Link>
            }
          >
            <div className="booking-filters">
              <label className={o.tableSearch}>
                <Glyph name="search" size={16} />
                <input
                  aria-label="Cari booking"
                  placeholder="Cari customer atau kode booking…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select aria-label="Status booking" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">Semua status</option>
                {['confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'].map((v) => (
                  <option value={v} key={v}>
                    {labels[v]}
                  </option>
                ))}
              </select>
            </div>
            <Table
              headers={['Customer', 'Layanan', 'Outlet / Kapster', 'Jadwal', 'Status', 'Aksi']}
              rows={rows.map((b) => [
                <button
                  className="person-link"
                  aria-label={`Detail booking ${b.name}`}
                  onClick={() => {
                    setSelected(b.id);
                    setDrawer(true);
                  }}
                >
                  <Person name={b.name} detail={`#${b.id.slice(0, 8).toUpperCase()} · ${b.phone}`} />
                </button>,
                b.serviceName,
                <>
                  {outlet(b.outletId)}
                  <small>{data.barbers.find((v) => v.id === b.barberId)?.name}</small>
                </>,
                <span className="nowrap">
                  <strong>{b.time}</strong>
                  <small>{dayLabel(b.date)}</small>
                </span>,
                <span className="badge-stack">
                  <Badge value={b.status} />
                  <Badge value={b.paid ? 'Lunas' : 'Belum bayar'} />
                </span>,
                actions(b),
              ])}
            />
            <div className="table-footer">
              {rows.length} booking ditampilkan <span>Ketuk nama customer untuk melihat detail</span>
            </div>
          </Card>
        </div>
        {drawer && (
          <button
            className="detail-drawer-backdrop"
            aria-label="Tutup detail booking"
            onClick={() => setDrawer(false)}
          />
        )}
        <section
          className={`${o.panel} ${o.detailPanel} detail-drawer ${drawer ? 'open' : ''}`}
          aria-label="Detail booking"
        >
          <div className={o.detailTitle}>
            <h3>Detail Booking</h3>
            <Glyph name="calendar" size={18} />
            <button
              className="icon-button detail-drawer-close"
              aria-label="Tutup detail"
              onClick={() => setDrawer(false)}
            >
              <Glyph name="close" size={18} />
            </button>
          </div>
          {selected ? (
            <>
              <div className={o.contactHead}>
                <Person name={selected.name} detail={selected.phone} />
              </div>
              <div className={o.contactMeta}>
                <span>
                  <Glyph name="receipt" size={16} />
                  {selected.source === 'public' ? 'Booking online' : 'Booking kasir'}
                </span>
              </div>
              <hr />
              <h3>Detail Reservasi</h3>
              <dl className={o.detailList}>
                {[
                  ['Tanggal & Jam', `${shortDate(selected.date)} · ${selected.time} WIB`],
                  ['Outlet', outlet(selected.outletId)],
                  ['Kapster', data.barbers.find((v) => v.id === selected.barberId)?.name],
                  ['Status', <Badge value={selected.status} />],
                  ['Pembayaran', selected.paid ? 'Tunai tercatat' : 'Belum dibayar'],
                  ['ID Booking', selected.id.slice(0, 8).toUpperCase()],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <hr />
              <h3>Layanan</h3>
              <div className={o.serviceDetail}>
                <span className={o.haircutThumb} />
                <div>
                  <strong>{selected.serviceName}</strong>
                  <small>{selected.duration} menit</small>
                </div>
              </div>
              <div className={o.detailTotal}>
                <span>Total</span>
                <strong>{rupiah(selected.price)}</strong>
              </div>
              <div className={o.detailActions}>{actions(selected, 'panel')}</div>
            </>
          ) : (
            <Empty>Pilih booking untuk melihat detail reservasi.</Empty>
          )}
        </section>
      </div>
    </>
  );
}
export function CalendarView({
  data,
  bookings,
  actions,
}: {
  data: AppData;
  bookings: Entity[];
  actions: (b: Entity, variant?: 'row' | 'panel') => ReactNode;
}) {
  const [start, setStart] = useState(today()),
    [selected, setSelected] = useState<Entity | null>(null);
  const days = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.parse(start + 'T12:00:00Z') + i * 86400000).toISOString().slice(0, 10),
  );
  const hour = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;
  const firstHour = Math.min(7, ...data.barbers.map((b) => Math.floor(hour(b.start))));
  const lastHour = Math.max(21, ...data.barbers.map((b) => Math.ceil(hour(b.end))));
  const rows = lastHour - firstHour;
  const perDay = days.map((day) =>
    calendarLanes(bookings.filter((b) => b.date === day && !['cancelled', 'no_show'].includes(b.status))),
  );
  const columnWidths = perDay.map((items) => Math.max(130, ...items.map((p) => p.count * 72)));
  const shiftWeek = (offset: number) =>
    setStart(new Date(Date.parse(start + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10));
  return (
    <>
      <div className="toolbar calendar-toolbar">
        <div className="calendar-nav">
          <button onClick={() => shiftWeek(-7)} aria-label="Minggu sebelumnya">
            ‹
          </button>
          <strong>
            {shortDate(days[0], false)} – {shortDate(days[6], false)}
          </strong>
          <button onClick={() => shiftWeek(7)} aria-label="Minggu berikutnya">
            ›
          </button>
        </div>
        <div className="calendar-nav">
          <input
            aria-label="Mulai minggu"
            type="date"
            value={start}
            onChange={(e) => e.target.value && setStart(e.target.value)}
          />
          <button onClick={() => setStart(today())} disabled={start === today()}>
            Hari ini
          </button>
        </div>
      </div>
      <div className={o.calendarLayout}>
        <section className={`${o.panel} ${o.calendarPanel}`}>
          <div className={o.calendarPeople}>
            {data.barbers.map((b) => (
              <Person key={b.id} name={b.name} detail={data.outlets.find((v) => v.id === b.outletId)?.name} />
            ))}
          </div>
          <div className="live-calendar-scroll">
            <div
              className={o.calendarGrid}
              style={{
                height: 48 + rows * 48,
                // Busy days get wider columns (about 72px per parallel booking) and the grid scrolls sideways.
                gridTemplateColumns: `60px ${columnWidths.map((w) => `minmax(${w}px, 1fr)`).join(' ')}`,
                minWidth: 60 + columnWidths.reduce((n, w) => n + w, 0),
              }}
            >
              <div className={o.timeColumn} style={{ gridTemplateRows: `48px repeat(${rows}, 48px)` }}>
                <b>Waktu</b>
                {Array.from({ length: rows }, (_, i) => (
                  <span key={i}>{String(i + firstHour).padStart(2, '0')}:00</span>
                ))}
              </div>
              {days.map((day, index) => (
                <div key={day} className={o.dayColumn}>
                  <header className={day === today() ? o.todayHeader : ''}>
                    <b>{new Date(day + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'short' })}</b>
                    <span>
                      {new Date(day + 'T12:00:00').toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </header>
                  {perDay[index].map(({ b, lane, count }) => (
                    <button
                      key={b.id}
                      className={`${o.calendarEvent} ${b.status === 'completed' ? o.eventGray : b.status === 'confirmed' ? o.eventGreen : o.eventBlue}`}
                      aria-pressed={selected?.id === b.id}
                      aria-label={`${b.time} ${b.name}, ${b.serviceName}`}
                      style={{
                        top: 48 + (hour(b.time) - firstHour) * 48,
                        height: cardHeight(b.duration),
                        minHeight: 0,
                        left: `calc(${(lane / count) * 100}% + 3px)`,
                        width: `calc(${100 / count}% - 6px)`,
                        right: 'auto',
                      }}
                      onClick={() => setSelected(b)}
                    >
                      <small>{b.time}</small>
                      <strong>{b.name}</strong>
                      <span>{b.serviceName}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className={o.calendarAside}>
          <Card title="Hari Ini">
            <Metric
              label="Booking Hari Ini"
              value={bookings.filter((b) => b.date === today()).length}
              icon="calendar"
            />
            <Metric label="Kapster Aktif" value={data.barbers.filter((b) => b.active).length} icon="users" />
          </Card>
          <Card title={selected ? 'Detail Booking' : 'Status Booking'}>
            {selected ? (
              <div className="panel-padding">
                <Person name={selected.name} detail={selected.serviceName} />
                <p>
                  {shortDate(selected.date)} · {selected.time} WIB ·{' '}
                  {data.barbers.find((v) => v.id === selected.barberId)?.name}
                </p>
                <Badge value={selected.status} />
                {actions(selected, 'panel')}
              </div>
            ) : (
              <div className="status-legend">
                {['confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'].map((v) => (
                  <Badge key={v} value={v} />
                ))}
              </div>
            )}
          </Card>
          <Card title="Booking Mendatang">
            <div className="panel-padding">
              {bookings
                .filter((b) => b.date >= today())
                .slice(0, 5)
                .map((b) => (
                  <button className="mini-booking-row" key={b.id} onClick={() => setSelected(b)}>
                    <time>{b.time}</time>
                    <Person name={b.name} detail={dayLabel(b.date)} />
                  </button>
                ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
export function SetupBanner({ data }: { data: AppData }) {
  if (data.org.status === 'approved') return null;
  const checks = setupChecks(data),
    done = checks.filter((v) => v.done).length;
  return (
    <section className={o.onboardingBanner}>
      <div className={o.onboardingProgress}>
        <strong>{done}</strong>
        <span>
          / {checks.length} langkah
          <br />
          selesai
        </span>
      </div>
      <div className={o.onboardingCopy}>
        <span className={o.onboardingKicker}>SETUP AKUN</span>
        <h2>Lengkapi setup bisnis Anda</h2>
        <p>Selesaikan onboarding agar booking dapat dipublikasikan dan tim siap bekerja.</p>
        <div className={o.onboardingTrack}>
          <span style={{ width: `${(done / checks.length) * 100}%` }} />
        </div>
      </div>
      <Link className={o.onboardingAction} to="/owner/onboarding">
        Lanjutkan Setup <Glyph name="arrow" size={16} />
      </Link>
    </section>
  );
}
function setupChecks(data: AppData) {
  return [
    {
      name: 'Verifikasi akun Owner',
      detail: 'Email akun Anda sudah terverifikasi.',
      done: true,
      route: 'settings',
    },
    { name: 'Lengkapi profil bisnis', detail: data.org.name, done: !!data.org.name, route: 'settings' },
    {
      name: 'Buat outlet pertama',
      detail: 'Tambahkan nama dan alamat outlet.',
      done: data.outlets.length > 0,
      route: 'outlets',
    },
    {
      name: 'Tambah layanan & harga',
      detail: 'Tentukan layanan, durasi, dan harga.',
      done: data.services.some((v) => v.active),
      route: 'services',
    },
    {
      name: 'Tambah kapster',
      detail: 'Daftarkan kapster yang akan melayani pelanggan.',
      done: data.barbers.some((v) => v.active),
      route: 'barbers',
    },
    {
      name: 'Atur jadwal kapster',
      detail: 'Lengkapi hari dan jam kerja kapster.',
      done: data.barbers.some((v) => v.active && v.start && v.end),
      route: 'barbers',
    },
    {
      name: 'Undang kasir',
      detail: 'Beri akses kasir untuk mengelola operasional outlet.',
      done: data.team.some((v) => v.role === 'cashier'),
      route: 'cashiers',
    },
    {
      name: 'Kirim untuk approval',
      detail: 'Admin akan memeriksa kesiapan bisnis Anda.',
      done: ['pending', 'approved'].includes(data.org.status),
      route: 'approval',
    },
    {
      name: 'Terbitkan halaman booking',
      detail: 'Aktifkan booking publik setelah bisnis disetujui.',
      done: data.outlets.some((v) => v.published),
      route: 'outlets',
    },
  ];
}
export function SetupPage({
  data,
  children,
  approval = false,
}: {
  data: AppData;
  children: ReactNode;
  approval?: boolean;
}) {
  const checks = setupChecks(data),
    done = checks.filter((v) => v.done).length;
  return (
    <main className={`${f.flowPage} restored-flow`}>
      <section className={f.flowCard}>
        <Link className={f.flowBrand} to="/owner">
          Kapster<span>.id</span>
        </Link>
        <header className={f.flowHeader}>
          <span className={f.eyebrow}>{approval ? 'REVIEW BISNIS' : 'LANGKAH 2 DARI 2 · SETUP BISNIS'}</span>
          <h1>{approval ? 'Status pengajuan bisnis' : 'Siapkan barbershop Anda'}</h1>
          <p>Lengkapi informasi bisnis agar pelanggan dapat booking dan tim Anda siap bekerja.</p>
        </header>
        <div className={f.progressLabel}>
          <strong>Progress setup</strong>
          <span>
            {done} dari {checks.length} langkah selesai
          </span>
        </div>
        <div className={f.progress}>
          <i style={{ width: `${(done / checks.length) * 100}%` }} />
        </div>
        <div className={f.stepList}>
          {checks.map((v, i) => (
            <Link className={`${f.step} ${v.done ? f.stepDone : ''}`} key={v.name} to={`/owner/${v.route}`}>
              <span className={f.stepIcon}>{v.done ? '✓' : i + 1}</span>
              <span>
                <strong>{v.name}</strong>
                <small>{v.detail}</small>
              </span>
              <b>{v.done ? 'Selesai' : 'Lengkapi →'}</b>
            </Link>
          ))}
        </div>
        <div className="setup-review">{children}</div>
        <div className={f.flowActions}>
          <Link className={f.secondary} to="/owner">
            Kembali ke Dashboard
          </Link>
          <Link className={f.primary} to="/owner/outlets">
            Kelola Outlet →
          </Link>
        </div>
      </section>
    </main>
  );
}
