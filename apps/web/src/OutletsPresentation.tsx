import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppData, bookingLink, Entity, rupiah } from './api';
import { Badge, dayNames, Empty, Table } from './ui';
import { Metric, Person, Stats } from './WorkspacePresentation';
import { Glyph } from './Glyph';
import o from '../../../components/owner/OwnerDashboard.module.css';

export function BookingLinkCard({
  org,
  outlets,
  onEditSlug,
}: {
  org: Entity;
  outlets: Entity[];
  onEditSlug?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const published = outlets.filter((v) => v.published);
  const path = bookingLink(org.slug);
  const url = `${window.location.origin}${path}`;
  return (
    <section className="booking-link-card" aria-label="Link booking publik">
      <span className="booking-link-icon">
        <Glyph name="store" />
      </span>
      <div className="booking-link-copy">
        <strong>Link booking {org.name}</strong>
        <code>{url}</code>
        <small>
          {published.length
            ? `${published.length} outlet menerima booking online. Bagikan link ini di Instagram, WhatsApp, atau QR kasir.`
            : 'Belum ada outlet yang diterbitkan. Link aktif setelah outlet diterbitkan dari tombol Edit.'}
          {org.publishedAt && ' Link terkunci karena sudah pernah diterbitkan.'}
        </small>
      </div>
      <div className="booking-link-actions">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              window.prompt('Salin link booking:', url);
            }
          }}
        >
          {copied ? 'Tersalin ✓' : 'Salin link'}
        </button>
        {published.length > 0 && (
          <a className="primary" href={path} target="_blank" rel="noreferrer">
            Buka halaman
          </a>
        )}
        {onEditSlug && !org.publishedAt && (
          <button type="button" onClick={onEditSlug}>
            Ubah link
          </button>
        )}
      </div>
    </section>
  );
}
export function OutletsPresentation({
  data,
  add,
  edit,
  editSlug,
}: {
  data: AppData;
  add: () => void;
  edit: (outlet: Entity) => void;
  editSlug: () => void;
}) {
  const [selectedId, setSelected] = useState(''),
    [search, setSearch] = useState(''),
    [tab, setTab] = useState('shifts');
  const outlets = data.outlets.filter((v) =>
    `${v.name} ${v.address}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = outlets.find((v) => v.id === selectedId) || outlets[0];
  const bookings = data.bookings.filter((v) => v.outletId === selected?.id),
    payments = data.payments.filter((v) => v.outletId === selected?.id),
    shifts = data.shifts.filter((v) => v.outletId === selected?.id);
  const active = shifts.filter((v) => !v.closed);
  return (
    <>
      <Stats
        items={[
          ['Jumlah Outlet', data.outlets.length],
          ['Outlet Aktif', data.outlets.filter((v) => v.active).length],
          ['Booking Publik Aktif', data.outlets.filter((v) => v.published).length],
          ['Total Penerimaan', rupiah(data.payments.reduce((n, v) => n + v.amount, 0))],
        ]}
      />
      <BookingLinkCard org={data.org} outlets={data.outlets} onEditSlug={editSlug} />
      <div className="outlet-page-actions">
        <button className="primary" onClick={add}>
          ＋ Tambah outlet
        </button>
      </div>
      <div className={o.outletManagement}>
        <section className={`${o.panel} ${o.outletListPanel}`}>
          <div className={o.panelHeader}>
            <h3>Daftar Outlet</h3>
            <span>{outlets.length} outlet</span>
          </div>
          <div className={o.outletSearch}>
            <label>
              <Glyph name="search" size={16} />
              <input
                aria-label="Cari outlet"
                placeholder="Cari outlet atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {outlets.map((v) => (
            <button
              key={v.id}
              className={`${o.outletListItem} ${v.id === selected?.id ? o.activeOutlet : ''}`}
              onClick={() => setSelected(v.id)}
            >
              <span className={`${o.outletImage} ${o.outletImageLarge}`} />
              <span>
                <strong>{v.name}</strong>
                <small>{v.address}</small>
                <Badge value={v.published ? 'Booking Aktif' : 'Belum terbit'} />
              </span>
              <Glyph name="chevron" size={16} />
            </button>
          ))}
          {!outlets.length && <Empty>Belum ada outlet. Tambahkan outlet pertama Anda.</Empty>}
        </section>
        <section className={`${o.panel} ${o.outletDetailPanel}`}>
          {selected ? (
            <>
              <div className={o.outletDetailHead}>
                <span className={`${o.outletImage} ${o.outletImageLarge}`} />
                <div>
                  <h2>
                    {selected.name} <Badge value={selected.active ? 'Aktif' : 'Nonaktif'} />
                  </h2>
                  <p>{selected.address}</p>
                  <span>
                    {selected.published ? 'Halaman booking publik aktif' : 'Booking belum diterbitkan'}
                  </span>
                </div>
                <button onClick={() => edit(selected)}>Edit outlet</button>
              </div>
              <div className={o.outletMetrics}>
                <Metric label="Total Booking" value={bookings.length} icon="calendar" />
                <Metric
                  label="Kapster Aktif"
                  value={data.barbers.filter((v) => v.outletId === selected.id && v.active).length}
                  icon="users"
                />
                <Metric
                  label="Total Penerimaan"
                  value={rupiah(payments.reduce((n, v) => n + v.amount, 0))}
                  icon="coin"
                />
              </div>
              <nav className={o.outletTabs} aria-label="Detail outlet">
                {[
                  ['overview', 'Overview'],
                  ['hours', 'Jam Operasional'],
                  ['team', 'Tim'],
                  ['shifts', 'Shift & Kas'],
                ].map(([id, label]) => (
                  <button key={id} className={tab === id ? o.activeOutletTab : ''} onClick={() => setTab(id)}>
                    {label}
                  </button>
                ))}
                <Link className="primary" to="/owner/cashiers">
                  <Glyph name="settings" size={14} />
                  Kelola Shift
                </Link>
              </nav>
              {tab === 'shifts' ? (
                <div className={o.shiftSection}>
                  <div className={o.sectionInlineTitle}>
                    <div>
                      <h3>Shift & Kas</h3>
                      <p>Kelola shift kasir dan pantau arus kas outlet ini.</p>
                    </div>
                  </div>
                  <div className={o.shiftMetrics}>
                    <article>
                      <span className={`${o.bigRoundIcon} ${o.toneGreen}`}>
                        <Glyph name="customer" />
                      </span>
                      <div>
                        <small>Shift Aktif</small>
                        <strong>{active.length} kasir</strong>
                        <Badge value={active.length ? 'Berlangsung' : 'Belum dibuka'} />
                      </div>
                    </article>
                    <Metric
                      label="Kas Awal"
                      value={rupiah(active.reduce((n, v) => n + v.opening, 0))}
                      icon="wallet"
                    />
                    <Metric
                      label="Kas Masuk"
                      value={rupiah(
                        payments
                          .filter((v) => active.some((s) => s.id === v.shiftId))
                          .reduce((n, v) => n + v.amount, 0),
                      )}
                      icon="arrow"
                      tone="Green"
                    />
                    <Metric
                      label="Saldo Akhir (Saat Ini)"
                      value={rupiah(active.reduce((n, v) => n + v.expected, 0))}
                      icon="wallet"
                      tone="Green"
                    />
                  </div>
                  <div className={o.panelHeader}>
                    <h3>Riwayat Shift</h3>
                    <Link to="/owner/cashiers">Lihat Semua →</Link>
                  </div>
                  <Table
                    headers={[
                      'Tanggal',
                      'Kasir',
                      'Kas Awal',
                      'Kas Diharapkan',
                      'Kas Terhitung',
                      'Variance',
                      'Status',
                    ]}
                    rows={shifts.map((v) => [
                      new Date(v.opened).toLocaleDateString('id-ID'),
                      data.team.find((t) => t.id === v.userId)?.name || 'Owner',
                      rupiah(v.opening),
                      rupiah(v.expected),
                      v.closed ? rupiah(v.counted) : '—',
                      v.closed ? rupiah(v.counted - v.expected) : '—',
                      <Badge value={v.closed ? 'Ditutup' : 'Berlangsung'} />,
                    ])}
                  />
                </div>
              ) : tab === 'hours' ? (
                <div className="panel-padding">
                  <h3>Jadwal Layanan Kapster</h3>
                  <p>Slot booking mengikuti hari dan jam kerja masing-masing kapster.</p>
                  <Table
                    headers={['Kapster', 'Mulai', 'Selesai', 'Hari Kerja']}
                    rows={data.barbers
                      .filter((v) => v.outletId === selected.id)
                      .map((v) => [v.name, v.start, v.end, dayNames(JSON.parse(v.days))])}
                  />
                  <Link className="text-link" to="/owner/barbers">
                    Kelola Jadwal →
                  </Link>
                </div>
              ) : tab === 'team' ? (
                <div className="panel-padding">
                  <h3>Tim Outlet</h3>
                  <Table
                    headers={['Anggota Tim', 'Peran', 'Status']}
                    rows={data.team
                      .filter((v) => v.outletId === selected.id)
                      .map((v) => [
                        <Person name={v.name} detail={v.email} />,
                        v.role === 'cashier' ? 'Kasir' : v.role,
                        <Badge value={v.active ? 'Aktif' : 'Nonaktif'} />,
                      ])}
                  />
                </div>
              ) : (
                <div className="panel-padding">
                  <h3>Booking Publik</h3>
                  <p>
                    {selected.published
                      ? 'Pelanggan dapat memilih layanan dan jadwal di halaman booking.'
                      : 'Terbitkan booking melalui pengaturan outlet setelah bisnis disetujui.'}
                  </p>
                  {!!selected.published && (
                    <a
                      className="primary"
                      href={bookingLink(data.org.slug, selected.slug)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Buka booking outlet →
                    </a>
                  )}
                  <h3>Layanan Outlet</h3>
                  <Table
                    headers={['Layanan', 'Harga', 'Durasi']}
                    rows={data.services
                      .filter((v) => v.outletId === selected.id)
                      .map((v) => [v.name, rupiah(v.price), `${v.duration} menit`])}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty>Pilih outlet untuk melihat detail operasional.</Empty>
          )}
        </section>
      </div>
    </>
  );
}
