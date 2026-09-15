import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppData, dayLabel, Entity, User, rupiah, shortDate, today } from './api';
import { Badge, Empty, Table } from './ui';
import { Person } from './WorkspacePresentation';
import { Glyph } from './Glyph';
import c from '../../../components/cashier/CashierDashboard.module.css';

export function CashierCustomers({ data }: { data: AppData }) {
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all');
  const customers = [...new Set(data.bookings.map((b) => b.phone))].map((phone) => {
    const visits = data.bookings.filter((v) => v.phone === phone).sort((x, y) => y.starts - x.starts);
    return {
      phone,
      name: visits[0].name,
      visits,
      completed: visits.filter((v) => v.status === 'completed').length,
    };
  });
  const rows = customers.filter(
    (v) =>
      `${v.name} ${v.phone}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'all' || (filter === 'new' ? v.visits.length === 1 : v.visits.length > 1)),
  );
  return (
    <section className={c.panel}>
      <div className={c.customerToolbar}>
        <label className={c.searchBox}>
          <Glyph name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cari pelanggan"
            placeholder="Cari nama pelanggan atau nomor WhatsApp..."
          />
        </label>
        <div className={c.pillTabs}>
          {[
            ['all', 'Semua'],
            ['new', 'Pelanggan Baru'],
            ['repeat', 'Repeat'],
          ].map(([id, name]) => (
            <button key={id} className={filter === id ? c.activePill : ''} onClick={() => setFilter(id)}>
              {name}
            </button>
          ))}
        </div>
      </div>
      <Table
        headers={['No.', 'Pelanggan', 'Kontak', 'Kunjungan Selesai', 'Booking Terakhir', 'Label', 'Aksi']}
        rows={rows.map((v, i) => [
          i + 1,
          <Person name={v.name} />,
          v.phone,
          v.completed,
          shortDate(v.visits[0].date),
          <Badge value={v.visits.length > 1 ? 'Repeat' : 'Pelanggan Baru'} />,
          <Link className="primary" to="/kasir/new">
            Booking
          </Link>,
        ])}
      />
      <div className="table-footer">{rows.length} pelanggan ditampilkan</div>
    </section>
  );
}

export function CashierSettings({ data, user }: { data: AppData; user: User }) {
  const outlet = data.outlets.find((v) => v.id === user.outletId);
  return (
    <>
      <div className={c.detailTop}>
        <span className={c.outletBadge}>
          <Glyph name="lock" size={16} />
          Outlet Tetap: {outlet?.name}
        </span>
      </div>
      <div className={c.settingsGrid}>
        <div className={c.settingsColumn}>
          <section className={c.settingsGroup}>
            <h2>Profil Kasir</h2>
            <Link className={c.profileCard} to="/forgot-password">
              <Person name={user.name} detail={user.email} />
              <span>›</span>
            </Link>
            <Link className="text-link" to="/forgot-password">
              Atur ulang password →
            </Link>
          </section>
          <section className={c.settingsGroup}>
            <h2>Informasi Outlet (Terkunci)</h2>
            <div className={c.lockedCard}>
              <Glyph name="lock" />
              <div>
                <strong>Outlet Penugasan: {outlet?.name}</strong>
                <p>{outlet?.address}</p>
                <p>Penugasan outlet dikelola oleh Owner. Hubungi Owner jika penugasan perlu diubah.</p>
              </div>
            </div>
          </section>
          <section className={c.settingsGroup}>
            <h2>Printer & Struk</h2>
            <div className="cashier-setting-row">
              <Glyph name="receipt" />
              <span>
                <strong>Printer Struk</strong>
                <small>Printer khusus belum terhubung</small>
              </span>
              <Badge value="Belum aktif" />
            </div>
            <p className={c.infoNote}>Detail booking dapat dicetak melalui halaman status booking.</p>
          </section>
        </div>
        <div className={c.settingsColumn}>
          <section className={c.settingsGroup}>
            <h2>Metode Pembayaran</h2>
            {[
              ['Tunai', true],
              ['QRIS', false],
              ['Kartu Debit / Kredit', false],
            ].map(([name, active]) => (
              <div className="cashier-setting-row" key={String(name)}>
                <Glyph name={active ? 'wallet' : 'card'} />
                <span>
                  <strong>{name}</strong>
                  <small>{active ? 'Pencatatan kas outlet' : 'Belum diaktifkan'}</small>
                </span>
                <span
                  className={`${c.toggle} ${active ? c.toggleOn : ''}`}
                  aria-label={`${name}: ${active ? 'aktif' : 'belum aktif'}`}
                >
                  <i />
                </span>
              </div>
            ))}
          </section>
          <section className={c.settingsGroup}>
            <h2>Preferensi Aplikasi</h2>
            {[
              ['Tema Aplikasi', 'Terang'],
              ['Bahasa', 'Bahasa Indonesia'],
              ['Zona Waktu', 'WIB'],
            ].map(([name, value]) => (
              <div key={name} className="cashier-setting-row">
                <Glyph name="settings" />
                <span>
                  <strong>{name}</strong>
                </span>
                <small>{value}</small>
              </div>
            ))}
          </section>
          <Link className="primary" to="/kasir/shifts">
            Kelola Shift Kasir →
          </Link>
        </div>
      </div>
    </>
  );
}

export function CashierQueue({
  data,
  bookings,
  actions,
  search,
  setSearch,
  compact = false,
}: {
  data: AppData;
  bookings: Entity[];
  actions: (b: Entity, variant?: 'row' | 'panel') => ReactNode;
  search: string;
  setSearch: (v: string) => void;
  compact?: boolean;
}) {
  const [selectedId, setSelected] = useState(''),
    [filter, setFilter] = useState('all'),
    [tab, setTab] = useState('service');
  const selected = data.bookings.find((v) => v.id === selectedId);
  const filters = [
    ['all', 'Semua'],
    ['confirmed', 'Menunggu'],
    ['checked_in', 'Sudah Datang'],
    ['in_service', 'Sedang Dilayani'],
    ['completed', 'Selesai'],
  ];
  const rows = bookings
    .filter((v) => filter === 'all' || v.status === filter)
    .sort((x, y) => x.starts - y.starts);
  const barber = (id: string) => data.barbers.find((v) => v.id === id)?.name;
  const todays = data.bookings.filter((v) => v.date === today());
  const cash = data.payments
    .filter((v) => new Date(Date.parse(v.created) + 7 * 3600000).toISOString().slice(0, 10) === today())
    .reduce((n, v) => n + v.amount, 0);
  if (selected)
    return (
      <>
        <button className={c.backButton} onClick={() => setSelected('')}>
          ← Kembali ke Antrean
        </button>
        <div className={c.detailLayout}>
          <section className={`${c.panel} ${c.customerDetail}`}>
            <div className={c.detailCodeRow}>
              <span className={c.codePill}>#BK-{selected.id.slice(0, 8).toUpperCase()}</span>
              <Badge value={selected.status} />
            </div>
            <div className={c.customerHero}>
              <Person name={selected.name} detail={selected.phone} />
            </div>
            <div className={c.detailTabs}>
              <button
                className={tab === 'service' ? c.activeDetailTab : ''}
                onClick={() => setTab('service')}
              >
                Layanan (1)
              </button>
              <button
                className={tab === 'history' ? c.activeDetailTab : ''}
                onClick={() => setTab('history')}
              >
                Riwayat
              </button>
            </div>
            {tab === 'service' ? (
              <article className={c.serviceLine}>
                <span className={c.roundIcon}>
                  <Glyph name="scissors" />
                </span>
                <div>
                  <strong>{selected.serviceName}</strong>
                  <small>{selected.duration} menit</small>
                </div>
                <span>{barber(selected.barberId)}</span>
                <b>{rupiah(selected.price)}</b>
              </article>
            ) : (
              <div className={c.historyList}>
                {data.bookings
                  .filter((v) => v.phone === selected.phone)
                  .map((v) => (
                    <p key={v.id}>
                      <span />
                      <b>
                        {shortDate(v.date)} · {v.serviceName}
                      </b>
                      <Badge value={v.status} />
                    </p>
                  ))}
              </div>
            )}
          </section>
          <aside className={c.detailAside}>
            <section className={c.panel}>
              <h3>Informasi Booking</h3>
              <dl className={c.bookingInfo}>
                {[
                  ['Waktu', `${shortDate(selected.date)} · ${selected.time} WIB`],
                  ['Jenis', selected.source === 'public' ? 'Booking Online' : 'Booking Kasir'],
                  ['Kapster', barber(selected.barberId)],
                  ['Durasi total', `${selected.duration} menit`],
                  ['Pembayaran', selected.paid ? 'Tunai tercatat' : 'Belum dibayar'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={`${c.panel} ${c.actionStack}`}>
              <h3>Tindakan</h3>
              {actions(selected, 'panel')}
            </section>
          </aside>
        </div>
      </>
    );
  return (
    <>
      {!compact && (
        <div className={c.metricsGrid}>
          {[
            [
              'Menunggu',
              todays.filter((v) => ['confirmed', 'checked_in'].includes(v.status)).length,
              'users',
              'Gold',
            ],
            ['Sedang Dilayani', todays.filter((v) => v.status === 'in_service').length, 'scissors', 'Blue'],
            ['Selesai Hari Ini', todays.filter((v) => v.status === 'completed').length, 'check', 'Green'],
            ['Pendapatan Hari Ini', rupiah(cash), 'wallet', 'Gold'],
          ].map(([label, value, icon, tone]) => (
            <article className={c.metricCard} key={label}>
              <span className={`${c.metricIcon} ${c['metric' + tone]}`}>
                <Glyph name={icon as 'users'} />
              </span>
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
                <em>{icon === 'wallet' ? 'Penerimaan tunai' : 'customer'}</em>
              </div>
            </article>
          ))}
        </div>
      )}
      <section className={c.panel}>
        <div className={c.queueHead}>
          <div>
            <h2>{compact ? 'Antrean & Booking' : 'Antrean Hari Ini'}</h2>
            {compact && <p>Kelola kunjungan customer di outlet aktif.</p>}
          </div>
          <div className={c.queueActions}>
            <label className={c.searchBox}>
              <Glyph name="search" />
              <input
                aria-label="Cari booking"
                placeholder="Cari nama atau nomor HP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <Link className="primary" to="/kasir/new">
              <Glyph name="plus" size={15} />
              Tambah Walk-in
            </Link>
          </div>
        </div>
        <div className={c.pillTabs} role="tablist" aria-label="Filter antrean">
          {filters.map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={value === filter}
              className={filter === value ? c.activePill : ''}
              onClick={() => setFilter(value)}
            >
              {label}{' '}
              <span>
                ({value === 'all' ? bookings.length : bookings.filter((v) => v.status === value).length})
              </span>
            </button>
          ))}
        </div>
        <Table
          headers={['No.', 'Waktu', 'Nama Customer', 'Layanan / Kapster', 'Status', 'Aksi']}
          rows={rows.map((v, i) => [
            i + 1,
            <span className="nowrap">
              <strong>{v.time}</strong>
              <small>{dayLabel(v.date)}</small>
            </span>,
            <button
              className="person-link"
              onClick={() => setSelected(v.id)}
              aria-label={`Detail booking ${v.name}`}
            >
              <Person name={v.name} detail={v.phone} />
            </button>,
            <>
              {v.serviceName}
              <small>{barber(v.barberId)}</small>
            </>,
            <span className="badge-stack">
              <Badge value={v.status} />
              <Badge value={v.paid ? 'Lunas' : 'Belum bayar'} />
            </span>,
            actions(v),
          ])}
        />
        <div className="table-footer">
          Menampilkan {rows.length} customer<span>Pilih nama customer untuk melihat detail</span>
        </div>
      </section>
    </>
  );
}
export function CashierShift({
  data,
  user,
  open,
  close,
  history,
}: {
  data: AppData;
  user: User;
  open: () => void;
  close: (s: Entity) => void;
  history: ReactNode;
}) {
  const shift = data.shifts.find((v) => v.userId === user.id && !v.closed);
  const payments = data.payments.filter((v) => v.shiftId === shift?.id);
  const refunds = data.refunds.filter((v) => v.cashShiftId === shift?.id && v.status === 'paid');
  const amount = payments.reduce((n, v) => n + v.amount, 0),
    refundAmount = refunds.reduce(
      (n, v) => n + (data.bookings.find((b) => b.id === v.bookingId)?.price || 0),
      0,
    );
  return (
    <>
      {!shift ? (
        <section className={`${c.panel} ${c.closedShift}`}>
          <span className={c.largeRoundIcon}>
            <Glyph name="wallet" />
          </span>
          <h2>Mulai shift sebelum bertransaksi</h2>
          <p>Masukkan saldo awal laci. Transaksi tunai akan dikaitkan ke shift aktif ini.</p>
          <button className="primary" onClick={open}>
            Buka Shift Kasir
          </button>
        </section>
      ) : (
        <>
          <div className={c.shiftMeta}>Mulai: {new Date(shift.opened).toLocaleString('id-ID')}</div>
          <div className={c.shiftLayout}>
            <section className={`${c.panel} ${c.shiftSummary}`}>
              <h2>Ringkasan Shift</h2>
              <dl>
                <div>
                  <dt>
                    <Glyph name="wallet" />
                    Saldo Awal (Kas)
                  </dt>
                  <dd>{rupiah(shift.opening)}</dd>
                </div>
                <div>
                  <dt>
                    <Glyph name="receipt" />
                    Total Transaksi Tunai<small>{payments.length} transaksi</small>
                  </dt>
                  <dd>{rupiah(amount)}</dd>
                </div>
                <div>
                  <dt>
                    <Glyph name="wallet" />
                    Pengeluaran / Refund<small>{refunds.length} transaksi</small>
                  </dt>
                  <dd>{rupiah(refundAmount)}</dd>
                </div>
              </dl>
              <div className={c.shiftTotal}>
                <span>Saldo Akhir (Diharapkan)</span>
                <strong>{rupiah(shift.expected)}</strong>
              </div>
              <p className={c.infoNote}>Hitung uang fisik sebelum menutup shift.</p>
              <button className="primary" onClick={() => close(shift)}>
                Tutup shift
              </button>
            </section>
            <section className={`${c.panel} ${c.timelinePanel}`}>
              <h2>Riwayat Shift</h2>
              <div className={c.timeline}>
                <article>
                  <time>
                    {new Date(shift.opened).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  <i className={c.dotSuccess} />
                  <div>
                    <strong>Shift dibuka</strong>
                    <span>oleh {user.name}</span>
                  </div>
                </article>
                {payments.map((v) => (
                  <article key={v.id}>
                    <time>
                      {new Date(v.created).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    <i className={c.dotSuccess} />
                    <div>
                      <strong>Transaksi #{v.id.slice(0, 8).toUpperCase()}</strong>
                      <span>{rupiah(v.amount)} (Tunai)</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
      <details className="shift-history">
        <summary>Riwayat seluruh shift</summary>
        {history}
      </details>
    </>
  );
}
