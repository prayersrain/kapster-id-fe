import { Logo } from './Logo';

type DashboardMockupProps = {
  laptop?: boolean;
  view?: 'overview' | 'report';
};

const menu = [
  ['⌂', 'Beranda'],
  ['▦', 'Booking'],
  ['▤', 'Kasir'],
  ['◷', 'Jadwal'],
  ['◉', 'Customer'],
  ['▥', 'Laporan'],
  ['◇', 'Outlet'],
  ['⚙', 'Pengaturan']
];

export function DashboardMockup({ laptop = false, view = 'overview' }: DashboardMockupProps) {
  const dashboard = <div className={`dash-window dash-${view}`}>
    <div className="dash-top">
      <div className="mini-brand"><Logo compact /></div>
      <div className="avatar-line"><span className="avatar-dot" /><span>Garasi Barber<small>Owner</small></span></div>
    </div>
    <div className="dash-body">
      <aside>{menu.map(([icon, label]) => <div className={`side ${(view === 'overview' && label === 'Beranda') || (view === 'report' && label === 'Laporan') ? 'active' : ''}`} key={label}><b>{icon}</b><span>{label}</span></div>)}</aside>
      {view === 'report' ? <ReportContent /> : <OverviewContent />}
    </div>
  </div>;

  if (!laptop) return dashboard;

  return <div className="laptop" aria-label="Mockup dashboard laporan Kapster.id pada laptop">
    <div className="laptop-camera" />
    <div className="laptop-screen">{dashboard}</div>
    <div className="laptop-base"><span /></div>
  </div>;
}

function OverviewContent() {
  return <main>
    <div className="dash-title">Selamat datang, Garasi Barber!</div>
    <div className="dash-sub">Berikut ringkasan hari ini.</div>
    <div className="metric-grid">
      <Metric tone="blue" label="Booking Hari Ini" value="24" delta="+12%" />
      <Metric tone="green" label="Pendapatan" value="Rp 2.430.000" delta="+8%" />
      <Metric tone="purple" label="Okupansi Kursi" value="78%" delta="+6%" />
      <Metric tone="violet" label="Customer Baru" value="6" delta="+2%" />
    </div>
  </main>;
}

function ReportContent() {
  const bars = [38, 53, 46, 68, 62, 82, 91];
  return <main>
    <div className="report-heading"><div><div className="dash-title">Laporan</div><div className="dash-sub">Pantau performa bisnis Anda.</div></div><span>Ags 2025⌄</span></div>
    <div className="report-tabs"><span className="active">Pendapatan</span><span>Booking</span><span>Layanan</span><span>Kapster</span></div>
    <div className="report-card">
      <small>Total Pendapatan</small><strong>Rp 12.490.000</strong><em>+18,2% dari bulan lalu</em>
      <div className="bar-chart" aria-label="Grafik pendapatan tujuh hari">
        {bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
      </div>
    </div>
  </main>;
}

function Metric({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: string }) {
  return <div className={`metric ${tone}`}><div className="metric-icon" /><span>{label}</span><strong>{value}</strong><em>{delta} dari kemarin</em></div>;
}
