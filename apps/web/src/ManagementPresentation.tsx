import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppData, bookingLink, Entity, rupiah, shortDate, User } from './api';
import { Badge, Card, Empty, Table, WEEKDAYS } from './ui';
import { Activity, Distribution, Metric, Person, RevenueChart, Stats } from './WorkspacePresentation';
import { Glyph } from './Glyph';
import o from '../../../components/owner/OwnerDashboard.module.css';
import c from '../../../components/cashier/CashierDashboard.module.css';
import { CashierSettings, CashierCustomers } from './CashierPresentation';
import { BookingLinkCard } from './OutletsPresentation';

export function ManagementView({
  data,
  page,
  user,
  children,
  outletFilter,
}: {
  data: AppData;
  page: string;
  user: User;
  children: ReactNode;
  outletFilter: string;
}) {
  const [selectedId, setSelected] = useState('');
  const scoped = (items: Entity[]) => items.filter((v) => !outletFilter || v.outletId === outletFilter);
  const payments = scoped(data.payments),
    bookings = scoped(data.bookings),
    barbers = scoped(data.barbers),
    services = scoped(data.services),
    shifts = scoped(data.shifts),
    team = scoped(data.team).filter((v) => v.role === 'cashier');
  const revenue = payments.reduce((n, v) => n + v.amount, 0);
  const paidRefunds = scoped(data.refunds).filter((v) => v.status === 'paid');
  const refundAmount = paidRefunds.reduce(
    (n, v) => n + (data.bookings.find((b) => b.id === v.bookingId)?.price || 0),
    0,
  );
  const owner = user.role === 'owner';
  const base = owner ? '/owner' : '/kasir';
  if (!owner && page === 'settings') return <CashierSettings data={data} user={user} />;
  if (!owner && page === 'customers') return <CashierCustomers data={data} />;
  if (!owner && page === 'transactions')
    return (
      <>
        <div className="cashier-transaction-total">
          <Metric label="Total Penerimaan Tunai" value={rupiah(revenue)} icon="wallet" />
        </div>
        {children}
      </>
    );
  const customers = [...new Set(bookings.map((v) => v.phone))].map((phone) => {
    const visits = bookings.filter((v) => v.phone === phone);
    return {
      id: phone,
      name: visits[0].name,
      phone,
      visits: visits.length,
      total: visits.filter((v) => v.paid).reduce((n, v) => n + v.price, 0),
    };
  });
  const sources: Record<string, Entity[]> = {
    outlets: data.outlets,
    barbers,
    services,
    customers,
    cashiers: team,
    shifts,
  };
  const items = sources[page as keyof typeof sources] || [];
  const selected = items.find((v) => v.id === selectedId) || items[0];
  const stats: Record<string, [string, ReactNode][]> = {
    outlets: [
      ['Total Outlet', data.outlets.length],
      ['Outlet Aktif', data.outlets.filter((v) => v.active).length],
      ['Booking Publik Aktif', data.outlets.filter((v) => v.published).length],
      ['Total Kapster', data.barbers.length],
    ],
    barbers: [
      ['Total Kapster', barbers.length],
      ['Kapster Aktif', barbers.filter((v) => v.active).length],
      ['Jadwal Diblokir', scoped(data.blocks).length],
      ['Total Booking', bookings.length],
    ],
    services: [
      ['Total Layanan', services.length],
      ['Layanan Aktif', services.filter((v) => v.active).length],
      [
        'Rata-rata Harga',
        rupiah(services.length ? services.reduce((n, v) => n + v.price, 0) / services.length : 0),
      ],
      ['Total Booking', bookings.length],
    ],
    customers: [
      ['Total Customer', customers.length],
      ['Pelanggan Kembali', customers.filter((v) => v.visits > 1).length],
      ['Total Kunjungan', bookings.filter((v) => v.status === 'completed').length],
      ['Total Transaksi', payments.length],
    ],
    cashiers: [
      ['Total Kasir', team.length],
      ['Kasir Aktif', team.filter((v) => v.active).length],
      ['Shift Berjalan', shifts.filter((v) => !v.closed).length],
      [
        'Variance Kas',
        rupiah(shifts.filter((v) => v.closed).reduce((n, v) => n + v.counted - v.expected, 0)),
      ],
    ],
    shifts: [
      ['Shift Berjalan', shifts.filter((v) => !v.closed).length],
      ['Shift Ditutup', shifts.filter((v) => v.closed).length],
      ['Kas Shift Aktif', rupiah(shifts.filter((v) => !v.closed).reduce((n, v) => n + v.expected, 0))],
      [
        'Variance Kas',
        rupiah(shifts.filter((v) => v.closed).reduce((n, v) => n + v.counted - v.expected, 0)),
      ],
    ],
    transactions: [
      ['Total Penerimaan', rupiah(revenue)],
      ['Transaksi Selesai', payments.length],
      [
        'Belum Dibayar',
        bookings.filter((v) => !v.paid && !['cancelled', 'no_show'].includes(v.status)).length,
      ],
      ['Total Refund', rupiah(refundAmount)],
    ],
    reports: [
      ['Total Penerimaan', rupiah(revenue)],
      ['Total Booking', bookings.length],
      ['Total Customer', customers.length],
      ['Rata-rata Transaksi', rupiah(payments.length ? revenue / payments.length : 0)],
    ],
  };
  if (page === 'new') return <div className="walk-in-workspace">{children}</div>;
  if (page === 'subscription')
    return (
      <div className={o.settingsLayout}>
        <div>{children}</div>
        <aside>
          <Card title="Workspace Anda">
            <div className="panel-padding">
              <div className={o.planDetail}>
                <span>♛</span>
                <div>
                  <h2>Pengujian Lokal</h2>
                  <p>Operasional tersedia setelah bisnis disetujui.</p>
                </div>
              </div>
              <div className={o.planFeatures}>
                {['Booking publik', 'Jadwal kapster', 'Transaksi tunai', 'Laporan kas'].map((v) => (
                  <span key={v}>• {v}</span>
                ))}
              </div>
            </div>
          </Card>
        </aside>
      </div>
    );
  if (page === 'settings')
    return (
      <div className={`${o.settingsLayout} settings-live`}>
        <div>
          {owner && <BookingLinkCard org={data.org} outlets={data.outlets} />}
          <nav className={o.settingsTabs} aria-label="Pengaturan bisnis">
            {[
              ['Akun & Akses', 'settings', 'lock'],
              ['Outlet', 'outlets', 'store'],
              ['Tim & Akses', 'cashiers', 'users'],
              ['Langganan', 'subscription', 'card'],
            ]
              .filter((v) => owner || v[1] === 'settings')
              .map(([name, route, icon]) => (
                <Link
                  className={route === page ? o.activeSettingsTab : ''}
                  key={route}
                  to={`${base}/${route}`}
                >
                  <Glyph name={icon as 'lock'} />
                  {name}
                </Link>
              ))}
          </nav>
          {owner && (
            <Card
              title="Kelola Tim & Akses"
              action={
                <Link className="primary" to="/owner/cashiers">
                  Kelola Anggota
                </Link>
              }
            >
              <div className={o.roleCards}>
                {[
                  ['Owner', data.team.filter((v) => v.role === 'owner').length, o.toneGold],
                  ['Kasir', data.team.filter((v) => v.role === 'cashier').length, o.toneGreen],
                ].map(([name, count, tone]) => (
                  <article key={name} className={String(tone)}>
                    <Glyph name="users" />
                    <div>
                      <strong>{name}</strong>
                      <small>{count} anggota</small>
                    </div>
                  </article>
                ))}
              </div>
              <Table
                headers={['Nama', 'Peran', 'Outlet Akses', 'Status']}
                rows={data.team.map((v) => [
                  <Person name={v.name} detail={v.email} />,
                  v.role === 'owner' ? 'Owner' : 'Kasir',
                  data.outlets.find((outlet) => outlet.id === v.outletId)?.name || 'Semua Outlet',
                  <Badge value={v.active ? 'Aktif' : 'Nonaktif'} />,
                ])}
              />
            </Card>
          )}
          {children}
        </div>
        <aside className={o.settingsAside}>
          <Card title="Profil Bisnis">
            <div className="panel-padding">
              <div className={o.planDetail}>
                <span>♛</span>
                <div>
                  <h2>{data.org.name}</h2>
                  <Badge value={data.org.status} />
                  <p>{data.outlets.length} outlet terdaftar.</p>
                </div>
              </div>
              {owner && (
                <Link className="text-link" to="/owner/onboarding">
                  Kelola Setup →
                </Link>
              )}
            </div>
          </Card>
          <Card title="Penggunaan Outlet">
            <div className="outlet-tiles">
              {data.outlets.map((v) => (
                <Link key={v.id} to={owner ? '/owner/outlets' : '/kasir/bookings'}>
                  <span className={o.outletImage} />
                  <strong>{v.name}</strong>
                  <Badge value={v.published ? 'Publik' : 'Belum terbit'} />
                </Link>
              ))}
            </div>
          </Card>
          <Card title="Integrasi">
            <div className="panel-padding">
              {[
                ['WhatsApp', 'Notifikasi booking'],
                ['Payment Gateway', 'Pembayaran online'],
                ['Google Calendar', 'Sinkronisasi jadwal'],
              ].map(([k, v]) => (
                <div className="integration-row" key={k}>
                  <span className={o.noticeIcon}>
                    <Glyph
                      name={k === 'WhatsApp' ? 'phone' : k === 'Google Calendar' ? 'calendar' : 'card'}
                    />
                  </span>
                  <div>
                    <strong>{k}</strong>
                    <small>{v}</small>
                  </div>
                  <Badge value="Belum aktif" />
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    );
  if (!stats[page]) return <>{children}</>;
  const details = selected ? (
    <>
      <div className="panel-padding">
        <select
          aria-label={`Pilih detail ${page}`}
          value={selected.id}
          onChange={(e) => setSelected(e.target.value)}
        >
          {items.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name ||
                `${v.closed ? 'Shift ditutup' : 'Shift aktif'} · ${new Date(v.opened).toLocaleDateString('id-ID')}`}
            </option>
          ))}
        </select>
      </div>
      {page === 'outlets' ? (
        <>
          <div className="outlet-detail-photo" role="img" aria-label="Ilustrasi barbershop" />
          <div className="panel-padding">
            <h2>{selected.name}</h2>
            <p className="muted">{selected.address}</p>
            <Badge value={selected.published ? 'Booking aktif' : 'Belum terbit'} />
            <dl className="summary">
              <div>
                <dt>Kapster</dt>
                <dd>{data.barbers.filter((v) => v.outletId === selected.id).length}</dd>
              </div>
              <div>
                <dt>Layanan</dt>
                <dd>{data.services.filter((v) => v.outletId === selected.id).length}</dd>
              </div>
              <div>
                <dt>Booking</dt>
                <dd>{data.bookings.filter((v) => v.outletId === selected.id).length}</dd>
              </div>
            </dl>
            {!!selected.published && (
              <a
                className="primary"
                href={bookingLink(data.org.slug, selected.slug)}
                target="_blank"
                rel="noreferrer"
              >
                Lihat Halaman Booking →
              </a>
            )}
          </div>
        </>
      ) : page === 'barbers' ? (
        <>
          <div className="panel-padding">
            <Person
              name={selected.name}
              detail={data.outlets.find((v) => v.id === selected.outletId)?.name}
            />
            <hr />
            <h3>Jadwal Kerja</h3>
            <p>
              {selected.start}–{selected.end} WIB
            </p>
            <div className="week-days">
              {WEEKDAYS.map((day, i) => (
                <span
                  key={day}
                  className={
                    (typeof selected.days === 'string'
                      ? JSON.parse(selected.days)
                      : selected.days || []
                    ).includes(i)
                      ? 'working'
                      : ''
                  }
                >
                  {day}
                </span>
              ))}
            </div>
            <Badge value={selected.active ? 'Aktif' : 'Nonaktif'} />
            <hr />
            <h3>Booking Kapster</h3>
            {bookings
              .filter((v) => v.barberId === selected.id)
              .slice(0, 4)
              .map((v) => (
                <div className="mini-booking-row" key={v.id}>
                  <time>{v.time}</time>
                  <Person name={v.name} detail={shortDate(v.date)} />
                </div>
              ))}
          </div>
        </>
      ) : page === 'services' ? (
        <>
          <div className="service-detail-photo" />
          <div className="panel-padding">
            <h2>{selected.name}</h2>
            <p className="muted">
              {selected.duration} menit · {data.outlets.find((v) => v.id === selected.outletId)?.name}
            </p>
            <strong className="detail-price">{rupiah(selected.price)}</strong>
            <Badge value={selected.active ? 'Aktif' : 'Nonaktif'} />
            <hr />
            <p>
              {bookings.filter((v) => v.serviceId === selected.id).length} booking menggunakan layanan ini.
            </p>
          </div>
        </>
      ) : page === 'customers' ? (
        <div className="panel-padding">
          <Person name={selected.name} detail={selected.phone} />
          <hr />
          <h3>Ringkasan Customer</h3>
          <dl className="summary">
            <div>
              <dt>Total Booking</dt>
              <dd>{selected.visits}</dd>
            </div>
            <div>
              <dt>Total Dibayarkan</dt>
              <dd>{rupiah(selected.total)}</dd>
            </div>
          </dl>
          <h3>Riwayat Kunjungan</h3>
          {bookings
            .filter((v) => v.phone === selected.phone)
            .slice(0, 5)
            .map((v) => (
              <div className="customer-visit" key={v.id}>
                <strong>{v.serviceName}</strong>
                <small>
                  {shortDate(v.date)} · {v.time}
                </small>
                <Badge value={v.status} />
              </div>
            ))}
        </div>
      ) : (
        <div className="panel-padding">
          <Person
            name={selected.name || data.team.find((v) => v.id === selected.userId)?.name || user.name}
            detail={selected.email || data.outlets.find((v) => v.id === selected.outletId)?.name}
          />
          <hr />
          <h3>Shift Kasir</h3>
          {shifts
            .filter((v) => (page === 'shifts' ? v.id === selected.id : v.userId === selected.id))
            .slice(0, 4)
            .map((v) => (
              <div className="shift-summary-item" key={v.id}>
                <Badge value={v.closed ? 'Ditutup' : 'Aktif'} />
                <dl className="summary">
                  <div>
                    <dt>Kas Awal</dt>
                    <dd>{rupiah(v.opening)}</dd>
                  </div>
                  <div>
                    <dt>Kas Diharapkan</dt>
                    <dd>{rupiah(v.expected)}</dd>
                  </div>
                  {v.closed && (
                    <div>
                      <dt>Uang Terhitung</dt>
                      <dd>{rupiah(v.counted)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
        </div>
      )}
    </>
  ) : (
    <Empty>Belum ada data. Tambahkan data untuk melihat detail.</Empty>
  );
  return (
    <>
      <Stats items={stats[page]} />
      {page === 'reports' && (
        <div className={o.reportCharts}>
          <RevenueChart payments={payments} bookings={bookings} title="Tren Pendapatan" />
          <Card title="Sumber Booking">
            <Distribution
              items={[
                { name: 'Booking Publik', value: bookings.filter((v) => v.source === 'public').length },
                { name: 'Booking Kasir', value: bookings.filter((v) => v.source !== 'public').length },
              ]}
            />
          </Card>
        </div>
      )}
      <div
        className={`${o.splitDetailLayout} management-layout ${page === 'services' ? 'services-live' : ''}`}
      >
        <div className="management-main">
          {children}
          {['cashiers', 'shifts'].includes(page) && (
            <div className={o.cashierCharts}>
              <Card title="Status Shift">
                <Distribution
                  items={[
                    { name: 'Aktif', value: shifts.filter((v) => !v.closed).length },
                    { name: 'Ditutup', value: shifts.filter((v) => v.closed).length },
                  ]}
                  label="Shift"
                />
              </Card>
              <Card title="Aktivitas Terbaru">
                <Activity items={data.audit} />
              </Card>
              <Card title="Coverage Shift per Outlet">
                <div className="panel-padding">
                  {data.outlets.map((v) => (
                    <div className="coverage-item" key={v.id}>
                      <Glyph name="store" size={17} />
                      <span>
                        <strong>{v.name}</strong>
                        <small>
                          {data.team.filter((t) => t.outletId === v.id && t.role === 'cashier').length} kasir
                          terdaftar
                        </small>
                      </span>
                      <b>{data.shifts.filter((s) => s.outletId === v.id && !s.closed).length} aktif</b>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
        <aside className={o.transactionsAside}>
          {['transactions', 'reports'].includes(page) ? (
            <>
              <Card title="Distribusi Metode Pembayaran">
                <Distribution items={[{ name: 'Tunai', value: payments.length }]} label="Transaksi" />
              </Card>
              <Card title="Transaksi Perlu Perhatian">
                <div className="panel-padding">
                  {bookings
                    .filter((v) => !v.paid && !['cancelled', 'no_show'].includes(v.status))
                    .slice(0, 5)
                    .map((v) => (
                      <Link to={`${base}/bookings`} className="mini-booking-row" key={v.id}>
                        <span className={o.noticeIcon}>
                          <Glyph name="clock" />
                        </span>
                        <Person name={v.name} detail="Menunggu pembayaran" />
                        <strong>{rupiah(v.price)}</strong>
                      </Link>
                    ))}
                  {data.refunds
                    .filter((v) => v.status === 'pending')
                    .map((v) => (
                      <p key={v.id}>
                        <Badge value="pending" /> Refund · {v.reason}
                      </p>
                    ))}
                </div>
              </Card>
              <div className={o.asideBanner}>
                <span className={o.bannerIcon}>
                  <Glyph name="chart" />
                </span>
                <div>
                  <strong>Analisis transaksi</strong>
                  <p>Pantau penerimaan dan pengembalian tunai per outlet.</p>
                </div>
              </div>
            </>
          ) : (
            <Card
              title={`Detail ${page === 'outlets' ? 'Outlet' : page === 'barbers' ? 'Kapster' : page === 'services' ? 'Layanan' : page === 'customers' ? 'Customer' : 'Kasir & Shift'}`}
            >
              {details}
            </Card>
          )}
        </aside>
        {page === 'services' && selected && (
          <aside className={o.servicePricePanel}>
            <span>Harga Layanan</span>
            <strong>{rupiah(selected.price)}</strong>
            <Badge value={selected.active ? 'Aktif' : 'Nonaktif'} />
            <p>{selected.duration} menit</p>
            <p>{bookings.filter((v) => v.serviceId === selected.id).length} booking</p>
            <Link className="primary" to="/owner/new">
              Buat Booking
            </Link>
            <small>Ubah harga dan durasi melalui tombol Edit pada daftar layanan.</small>
          </aside>
        )}
      </div>
    </>
  );
}
