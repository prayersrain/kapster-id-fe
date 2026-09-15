import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Entity, today } from './api';
import { Badge, Card, Empty, Table, exportCsv } from './ui';
import { Activity, Distribution, Person, Stats } from './WorkspacePresentation';
import { Glyph } from './Glyph';
import a from '../../../components/admin/AdminDashboard.module.css';

export function AdminPresentation({
  data,
  page,
  search,
  onDecision,
}: {
  data: { orgs: Entity[]; audit: Entity[] };
  page: string;
  search: string;
  onDecision: (org: Entity, status: string) => void;
}) {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('all'),
    [selectedId, setSelected] = useState(params.get('tenant') || '');
  const orgs = data.orgs
    .filter((v) =>
      `${v.name} ${v.owners.map((u: Entity) => u.email).join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .filter(
      (v) =>
        (page !== 'onboarding' || ['draft', 'pending', 'rejected'].includes(v.status)) &&
        (status === 'all' || v.status === status),
    );
  const selected = data.orgs.find((v) => v.id === selectedId) || orgs[0];
  const counts = ['approved', 'pending', 'draft', 'rejected', 'suspended'].map((v) => ({
    name: v,
    value: data.orgs.filter((x) => x.status === v).length,
  }));
  const totals: [string, number][] = [
    ['Total Tenant', data.orgs.length],
    ['Tenant Aktif', counts[0].value],
    ['Menunggu Review', counts[1].value],
    ['Draft', counts[2].value],
    ['Perlu Revisi', counts[3].value],
    ['Ditangguhkan', counts[4].value],
  ];
  const audit = data.audit.filter((v) =>
    `${v.action} ${v.actorName} ${v.reason}`.toLowerCase().includes(search.toLowerCase()),
  );
  const decisions = (v: Entity) => (
    <div className="actions">
      {['pending', 'suspended'].includes(v.status) && (
        <button className="primary" onClick={() => onDecision(v, 'approved')}>
          Setujui
        </button>
      )}
      {v.status === 'pending' && <button onClick={() => onDecision(v, 'rejected')}>Minta revisi</button>}
      {v.status === 'approved' && <button onClick={() => onDecision(v, 'suspended')}>Tangguhkan</button>}
    </div>
  );
  const tenantTable = (
    <Table
      headers={['Tenant / Owner', 'Outlet', 'Status', 'Tindakan']}
      rows={orgs.map((v) => [
        <button
          className="person-link"
          onClick={() => setSelected(v.id)}
          aria-label={`Detail tenant ${v.name}`}
        >
          <Person name={v.name} detail={v.owners[0]?.email} />
        </button>,
        v.outlets,
        <Badge value={v.status} />,
        decisions(v),
      ])}
    />
  );
  const detail = selected ? (
    <>
      <div className="tenant-detail-heading">
        <span className={a.tenantMarkLarge}>{selected.name.slice(0, 2).toUpperCase()}</span>
        <h2>{selected.name}</h2>
        <small>Link booking: /booking/{selected.slug}</small>
        <Badge value={selected.status} />
      </div>
      <div className="panel-padding">
        <h3>Owner</h3>
        {selected.owners.map((v: Entity) => (
          <Person key={v.email} name={v.name} detail={v.email} />
        ))}
        <hr />
        <h3>Outlet</h3>
        {selected.setupOutlets.map((v: Entity) => (
          <p key={v.id}>
            <strong>{v.name}</strong>
            <small>{v.address}</small>
            <Badge value={v.published ? 'Booking aktif' : 'Belum terbit'} />
          </p>
        ))}
        <h3>Layanan</h3>
        {selected.setupServices.map((v: Entity, i: number) => (
          <p key={i}>
            {v.name}
            <small>
              Rp {Number(v.price).toLocaleString('id-ID')} · {v.duration} menit
            </small>
          </p>
        ))}
        <h3>Kapster & Jadwal</h3>
        {selected.setupBarbers.map((v: Entity, i: number) => (
          <p key={i}>
            {v.name}
            <small>
              {v.start}–{v.end} WIB
            </small>
          </p>
        ))}
        {selected.reason && <p className="notice">{selected.reason}</p>}
        {decisions(selected)}
      </div>
    </>
  ) : (
    <Empty>Pilih tenant untuk meninjau detail bisnis.</Empty>
  );
  const kpis = (
    <div className={a.kpiSix}>
      {totals.map(([label, value], i) => (
        <article className={a.kpi} key={label}>
          <span
            className={`${a.kpiIcon} ${[a.toneGold, a.toneGreen, a.toneBlue, a.toneGold, a.toneRed, a.toneRed][i]}`}
          >
            <Glyph name={i === 0 ? 'store' : i === 1 ? 'check' : i === 2 ? 'clock' : 'users'} />
          </span>
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Tenant terdaftar</small>
          </div>
        </article>
      ))}
    </div>
  );
  const days = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.parse(today() + 'T12:00:00Z') - (6 - i) * 86400000).toISOString().slice(0, 10),
  );
  const growth = days.map((d) => data.orgs.filter((v) => v.created.slice(0, 10) <= d).length),
    max = Math.max(...growth, 1);
  const growthChart = (
    <Card title="Pertumbuhan Tenant">
      <div className="tenant-growth">
        <div className="chart-top-number">
          <strong>{data.orgs.length}</strong>
          <span>tenant terdaftar</span>
        </div>
        <svg
          viewBox="0 0 500 180"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Total tenant dalam tujuh hari terakhir: ${growth.join(', ')}`}
        >
          {[30, 75, 120, 165].map((y) => (
            <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="#eceef0" />
          ))}
          <polyline
            points={growth.map((v, i) => `${i * 80 + 10},${165 - (v / max) * 135}`).join(' ')}
            fill="none"
            stroke="#af8950"
            strokeWidth="3"
          />
          {growth.map((v, i) => (
            <circle key={i} cx={i * 80 + 10} cy={165 - (v / max) * 135} r="4" fill="#af8950" />
          ))}
        </svg>
        <div className="chart-date-labels">
          {days.map((d) => (
            <span key={d}>
              {d.slice(8)}/{d.slice(5, 7)}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
  if (!page)
    return (
      <>
        {kpis}
        <div className={a.overviewMain}>
          {growthChart}
          <Card title="Distribusi Status Tenant">
            <Distribution
              items={counts.map((v) => ({
                ...v,
                name: {
                  approved: 'Aktif',
                  pending: 'Review',
                  draft: 'Draft',
                  rejected: 'Revisi',
                  suspended: 'Suspended',
                }[v.name]!,
              }))}
              label="Tenant"
            />
          </Card>
          <Card title="Perhatian Operasional">
            <div className={a.alertList}>
              {[
                ['Menunggu persetujuan', counts[1].value, 'onboarding'],
                ['Perlu melengkapi setup', counts[2].value, 'tenants'],
                ['Perlu revisi', counts[3].value, 'onboarding'],
                ['Tenant ditangguhkan', counts[4].value, 'tenants'],
              ].map(([label, value, route]) => (
                <Link className="admin-alert-row" to={`/admin/${route}`} key={label}>
                  <span className={a.alertIcon}>
                    <Glyph name="alert" />
                  </span>
                  <strong>{label}</strong>
                  <b>{value}</b>
                </Link>
              ))}
            </div>
          </Card>
        </div>
        <div className={a.overviewBottom}>
          <Card title="Tenant Terbaru" action={<Link to="/admin/tenants">Lihat Semua →</Link>}>
            {tenantTable}
          </Card>
          <Card title="Aktivitas Platform">
            <Activity items={data.audit} />
          </Card>
          <Card title="Aksi Cepat">
            <div className={a.quickActions}>
              {[
                ['Review Onboarding', 'Tinjau kelengkapan tenant baru', 'onboarding', 'check'],
                ['Kelola Tenant', 'Periksa bisnis dan status operasional', 'tenants', 'store'],
                ['Audit & Security', 'Tinjau perubahan dan akses', 'audit', 'lock'],
              ].map(([title, description, route, icon]) => (
                <Link className="admin-quick-action" to={`/admin/${route}`} key={route}>
                  <span>
                    <Glyph name={icon as 'check'} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <Glyph name="chevron" size={16} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </>
    );
  if (page === 'tenant-detail')
    return selected ? (
      <>
        <div className={`${a.tenantHero} tenant-full-hero`}>
          <span className={`${a.tenantMark} ${a.tenantMarkLarge}`}>
            {selected.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2>{selected.name}</h2>
            <p>
              Terdaftar {new Date(selected.created).toLocaleDateString('id-ID')} · /booking/{selected.slug}
            </p>
          </div>
          <Badge value={selected.status} />
          <span className="tenant-hero-spacer" />
          {decisions(selected)}
        </div>
        <nav className={a.detailTabs} aria-label="Detail tenant">
          <Link className="active-tenant-tab" to={`/admin/tenant-detail?tenant=${selected.id}`}>
            Overview
          </Link>
          <Link to="/admin/onboarding">Onboarding</Link>
          <Link to="/admin/subscription">Subscription</Link>
          <Link to="/admin/audit">Audit Log</Link>
        </nav>
        <Stats
          items={[
            ['Total Outlet', selected.outlets],
            ['Layanan', selected.setupServices.length],
            ['Kapster', selected.setupBarbers.length],
            ['Owner', selected.owners.length],
          ]}
        />
        <div className={a.detailGrid}>
          <Card title="Informasi Tenant">
            <div className="panel-padding">
              <h3>{selected.name}</h3>
              <Badge value={selected.status} />
              {selected.owners.map((v: Entity) => (
                <Person key={v.email} name={v.name} detail={v.email} />
              ))}
              {selected.reason && <p className="notice">{selected.reason}</p>}
              <h3>Daftar Outlet</h3>
              {selected.setupOutlets.map((v: Entity) => (
                <p className="tenant-info-row" key={v.id}>
                  <strong>{v.name}</strong>
                  <small>{v.address}</small>
                  <Badge value={v.published ? 'Booking aktif' : 'Belum terbit'} />
                </p>
              ))}
            </div>
          </Card>
          <Card title="Layanan & Jadwal">
            <Table
              headers={['Layanan', 'Harga', 'Durasi']}
              rows={selected.setupServices.map((v: Entity) => [
                v.name,
                `Rp ${Number(v.price).toLocaleString('id-ID')}`,
                `${v.duration} menit`,
              ])}
            />
            <div className="panel-padding">
              <h3>Kapster</h3>
              {selected.setupBarbers.map((v: Entity, i: number) => (
                <p className="tenant-info-row" key={i}>
                  <strong>{v.name}</strong>
                  <small>
                    {v.start}–{v.end} WIB
                  </small>
                </p>
              ))}
            </div>
          </Card>
          <Card title="Aktivitas Tenant">
            <Activity
              items={data.audit.filter((v) => v.orgId === selected.id || v.entityId === selected.id)}
            />
          </Card>
        </div>
      </>
    ) : (
      <Card title="Detail Tenant">
        <Empty>Belum ada tenant terdaftar.</Empty>
      </Card>
    );
  if (page === 'tenants' || page === 'onboarding')
    return (
      <>
        {kpis}
        <div className="toolbar">
          <select
            aria-label="Filter status tenant"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            {counts.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              exportCsv(
                'tenants.csv',
                ['Nama', 'Status', 'Outlet'],
                orgs.map((v) => [v.name, v.status, v.outlets]),
              )
            }
          >
            <Glyph name="download" size={15} /> Export CSV
          </button>
        </div>
        <div className={a.tenantLayout}>
          <Card title={page === 'onboarding' ? 'Onboarding Tenant' : 'Daftar Tenant'}>
            {tenantTable}
            <div className="table-footer">{orgs.length} tenant ditampilkan</div>
          </Card>
          <aside className={a.tenantAside}>
            <Card
              title="Detail Tenant"
              action={
                selected && <Link to={`/admin/tenant-detail?tenant=${selected.id}`}>Profil Lengkap →</Link>
              }
            >
              {detail}
            </Card>
          </aside>
        </div>
      </>
    );
  if (page === 'audit')
    return (
      <>
        <Stats
          items={[
            ['Aktivitas Tercatat', data.audit.length],
            ['Aktor', new Set(data.audit.map((v) => v.actor)).size],
            ['Tenant Ditangguhkan', counts[4].value],
            ['Menunggu Review', counts[1].value],
          ]}
        />
        <div className={a.tenantLayout}>
          <Card
            title="Audit platform"
            action={
              <button
                onClick={() =>
                  exportCsv(
                    'audit.csv',
                    ['Waktu', 'Aktor', 'Tindakan', 'Alasan'],
                    audit.map((v) => [v.created, v.actorName, v.action, v.reason]),
                  )
                }
              >
                Export Log
              </button>
            }
          >
            <Table
              headers={['Waktu', 'Aktor', 'Tindakan', 'Alasan']}
              rows={audit.map((v) => [
                new Date(v.created).toLocaleString('id-ID'),
                <Person name={v.actorName || 'Sistem'} />,
                v.action,
                v.reason || '—',
              ])}
            />
          </Card>
          <aside className={a.auditAside}>
            <Card title="Kontrol Akses">
              <div className="panel-padding">
                <h3>Akses berbasis peran</h3>
                <p>
                  Admin platform meninjau tenant. Data operasional outlet dibatasi untuk Owner dan Kasir yang
                  berwenang.
                </p>
                <Badge value="Session aktif" />
              </div>
            </Card>
            <Card title="Aktivitas Terbaru">
              <Activity items={data.audit} />
            </Card>
          </aside>
        </div>
      </>
    );
  if (page === 'analytics')
    return (
      <>
        {kpis}
        <div className={a.overviewMain}>
          {growthChart}
          <Card title="Status Bisnis">
            <Distribution items={counts} label="Tenant" />
          </Card>
          <Card title="Distribusi Outlet">
            <Table headers={['Tenant', 'Jumlah Outlet']} rows={orgs.map((v) => [v.name, v.outlets])} />
          </Card>
        </div>
      </>
    );
  if (page === 'operations')
    return (
      <>
        {kpis}
        <div className={a.tenantLayout}>
          <Card title="Operasional Tenant">{tenantTable}</Card>
          <Card title="Status Integrasi">
            <div className="panel-padding">
              {[
                ['Booking & Jadwal', 'Tersedia'],
                ['Kasir & Transaksi Tunai', 'Tersedia'],
                ['Payment Gateway', 'Belum diaktifkan'],
                ['WhatsApp & Email eksternal', 'Belum diaktifkan'],
              ].map(([k, v]) => (
                <p key={k}>
                  <strong>{k}</strong>
                  <small>{v}</small>
                </p>
              ))}
            </div>
          </Card>
        </div>
      </>
    );
  if (page === 'subscription')
    return (
      <>
        <Stats
          items={[
            ['Tenant', data.orgs.length],
            ['Tagihan Diterbitkan', 0],
            ['Pembayaran Langganan', 0],
            ['Paket Berbayar Aktif', 0],
          ]}
        />
        <div className={a.tenantLayout}>
          <Card title="Subscription & Billing">
            <Empty>Penagihan langganan belum diaktifkan untuk pengujian lokal.</Empty>
          </Card>
          <Card title="Kebijakan Pengujian">
            <div className="panel-padding">
              <h3>Akses setelah approval</h3>
              <p>Bisnis yang disetujui dapat mencoba operasional tanpa pembayaran langganan.</p>
              <Link className="primary" to="/admin/tenants">
                Kelola Tenant →
              </Link>
            </div>
          </Card>
        </div>
      </>
    );
  if (page === 'support')
    return (
      <div className={a.tenantLayout}>
        <Card title="Support Tickets">
          <Empty>Helpdesk belum terintegrasi. Belum ada tiket dukungan.</Empty>
        </Card>
        <Card title="Tindak Lanjut Tenant">
          <div className="panel-padding">
            <p>Tinjau catatan revisi dan alasan penangguhan pada detail tenant.</p>
            <Link className="primary" to="/admin/tenants">
              Lihat Tenant →
            </Link>
          </div>
        </Card>
      </div>
    );
  return (
    <div className={a.tenantLayout}>
      <Card title="Platform Settings">
        <div className="panel-padding">
          <h3>Lingkungan Lokal</h3>
          <dl className="summary">
            <div>
              <dt>Penyimpanan</dt>
              <dd>SQLite lokal</dd>
            </div>
            <div>
              <dt>Metode Pembayaran</dt>
              <dd>Tunai di outlet</dd>
            </div>
            <div>
              <dt>Akses Publik</dt>
              <dd>Landing page & Booking</dd>
            </div>
          </dl>
          <Link to="/forgot-password">Atur ulang password →</Link>
        </div>
      </Card>
      <Card title="Integrasi Eksternal">
        <div className="panel-padding">
          <p>Payment gateway, notifikasi eksternal, dan penagihan langganan belum diaktifkan.</p>
          <Badge value="Mode lokal" />
        </div>
      </Card>
    </div>
  );
}
