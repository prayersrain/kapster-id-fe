import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, AppData, Entity, rupiah, today, labels } from './api';
import { useAuth, homeFor } from './auth';
import { Badge, Card, Table, Form, Modal, FieldSpec, exportCsv } from './ui';
import { Booking } from './Booking';
import {
  WorkspaceShell,
  PageTitle,
  OwnerOverview,
  BookingList,
  CalendarView,
  SetupBanner,
  SetupPage,
} from './WorkspacePresentation';
import { AdminPresentation } from './AdminPresentation';
import { ManagementView } from './ManagementPresentation';
import { CashierQueue, CashierShift } from './CashierPresentation';
import { OutletsPresentation } from './OutletsPresentation';

type Dialog = {
  title: string;
  fields: FieldSpec[];
  endpoint: string;
  method?: string;
  map?: (values: Entity) => Entity;
  description?: string;
};
const fieldReason: FieldSpec = {
  key: 'reason',
  label: 'Alasan',
  help: 'Minimal 5 karakter. Tercatat dalam audit.',
};
const amount = (key: string, label: string, value = 0): FieldSpec => ({
  key,
  label,
  type: 'number',
  min: 0,
  max: 100000000,
  value,
});
const options = (items: Entity[]) => items.map((i) => ({ value: i.id, label: i.name }));

export function Workspace() {
  const { user, setUser } = useAuth();
  const location = useLocation(),
    navigate = useNavigate();
  const [data, setData] = useState<AppData | null>(null),
    [admin, setAdmin] = useState<{ orgs: Entity[]; audit: Entity[] } | null>(null);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [menuOpen, setMenu] = useState(false);
  const [outletFilter, setOutletFilter] = useState(''),
    [search, setSearch] = useState('');
  const [from, setFrom] = useState(today()),
    [to, setTo] = useState(today());
  const [reloading, setReloading] = useState(false);
  const reload = useCallback(async () => {
    if (!user) return;
    setReloading(true);
    try {
      if (user.role === 'admin') setAdmin((await api('admin/data')) as any);
      else setData(await api<AppData>('app/data'));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReloading(false);
    }
  }, [user]);
  useEffect(() => {
    void reload();
    const timer = setInterval(reload, 15000);
    return () => clearInterval(timer);
  }, [reload]);
  useEffect(() => {
    setMenu(false);
    setSearch('');
  }, [location.pathname]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  if (!user) return null;
  const base = homeFor(user),
    page = location.pathname.slice(base.length).replace(/^\//, '') || '';
  const owner = user.role === 'owner';
  const action = (title: string, endpoint: string, fields: FieldSpec[] = [], extra: Partial<Dialog> = {}) =>
    setDialog({ title, endpoint, fields, ...extra });
  const outletField: FieldSpec = {
    key: 'outletId',
    label: 'Outlet',
    options: options(data?.outlets ?? []),
    value: outletFilter || user.outletId || data?.outlets[0]?.id,
  };
  const filtered = (items: Entity[]) => items.filter((i) => !outletFilter || i.outletId === outletFilter);
  const bookings = data
    ? filtered(data.bookings).filter((b) =>
        `${b.name} ${b.phone} ${b.id}`.toLowerCase().includes(search.toLowerCase()),
      )
    : [];
  const outletName = (id: string) => data?.outlets.find((o) => o.id === id)?.name ?? 'Outlet';
  const barberName = (id: string) => data?.barbers.find((b) => b.id === id)?.name ?? 'Kapster';
  const bookingCode = (id: string) => id.slice(0, 8).toUpperCase();
  const activeShift = data?.shifts.find((s) => !s.closed && s.userId === user.id);
  const paidRefunds = data?.refunds.filter((r) => r.status === 'paid') ?? [];
  function bookingActions(b: Entity) {
    return (
      <div className="actions small-actions">
        {b.status === 'confirmed' && (
          <button
            onClick={() =>
              action('Konfirmasi kedatangan', `app/bookings/${b.id}/status`, [], {
                map: () => ({ status: 'checked_in' }),
              })
            }
          >
            Check-in
          </button>
        )}
        {b.status === 'checked_in' && (
          <button
            onClick={() =>
              action('Mulai layanan', `app/bookings/${b.id}/status`, [], {
                map: () => ({ status: 'in_service' }),
              })
            }
          >
            Mulai
          </button>
        )}
        {b.status === 'in_service' && (
          <button
            onClick={() =>
              action('Selesaikan layanan', `app/bookings/${b.id}/status`, [], {
                map: () => ({ status: 'completed' }),
              })
            }
          >
            Selesai
          </button>
        )}
        {!b.paid && !['cancelled', 'no_show'].includes(b.status) && (
          <button
            onClick={() =>
              action(
                `Pembayaran tunai · ${rupiah(b.price)}`,
                `app/bookings/${b.id}/pay`,
                [amount('tendered', 'Uang diterima', b.price)],
                {
                  description:
                    'Pastikan uang sudah diterima. Kembalian = uang diterima dikurangi total tagihan.',
                },
              )
            }
          >
            Bayar tunai
          </button>
        )}
        {['confirmed', 'checked_in'].includes(b.status) && (
          <>
            <button
              onClick={() =>
                action(
                  'Ubah jadwal / kapster',
                  `app/bookings/${b.id}/reschedule`,
                  [
                    {
                      key: 'barberId',
                      label: 'Kapster',
                      value: b.barberId,
                      options: options(
                        (data?.barbers ?? []).filter((r) => r.outletId === b.outletId && r.active),
                      ),
                    },
                    { key: 'date', label: 'Tanggal', type: 'date', value: b.date, min: today() },
                    { key: 'time', label: 'Jam (WIB)', type: 'time', value: b.time },
                    fieldReason,
                  ],
                  {
                    description:
                      'Server memeriksa jam kerja dan bentrok. Harga serta durasi booking lama tetap dipertahankan.',
                  },
                )
              }
            >
              Reschedule
            </button>
            <button
              onClick={() =>
                action('Batalkan booking', `app/bookings/${b.id}/status`, [fieldReason], {
                  map: (v) => ({ ...v, status: 'cancelled' }),
                  description: b.paid
                    ? 'Pembatalan tidak otomatis mengembalikan uang. Ajukan refund terpisah.'
                    : undefined,
                })
              }
            >
              Batalkan
            </button>
          </>
        )}
        {b.status === 'confirmed' && (
          <button
            onClick={() =>
              action('Tandai tidak hadir', `app/bookings/${b.id}/status`, [fieldReason], {
                map: (v) => ({ ...v, status: 'no_show' }),
              })
            }
          >
            No-show
          </button>
        )}
        {!!b.paid && !data?.refunds.some((r) => r.bookingId === b.id) && (
          <button onClick={() => action('Ajukan refund penuh', `app/bookings/${b.id}/refund`, [fieldReason])}>
            Refund
          </button>
        )}
      </div>
    );
  }
  function shiftsPanel() {
    return (
      <Card
        title="Shift dan laci kas"
        action={
          !activeShift && (
            <button
              className="primary"
              onClick={() =>
                action('Buka shift kasir', 'app/shifts/open', [
                  outletField,
                  amount('opening', 'Modal kas awal'),
                ])
              }
            >
              ＋ Buka shift
            </button>
          )
        }
      >
        <p className="muted">
          Setiap operator memiliki satu shift aktif. Saldo dihitung dari modal awal + pembayaran tunai −
          refund yang dibayarkan.
        </p>
        <Table
          headers={[
            'Operator',
            'Outlet',
            'Dibuka',
            'Modal awal',
            'Saldo / ekspektasi',
            'Kas terhitung',
            'Status',
            'Tindakan',
          ]}
          rows={filtered(data?.shifts ?? []).map((s) => [
            data?.team.find((t) => t.id === s.userId)?.name ??
              (s.userId === user!.id ? user!.name : 'Operator'),
            outletName(s.outletId),
            new Date(s.opened).toLocaleString('id-ID'),
            rupiah(s.opening),
            rupiah(s.expected),
            s.closed ? (
              <>
                {rupiah(s.counted)}
                <small>
                  Selisih {rupiah(s.counted - s.expected)} · {s.reason || 'Sesuai'}
                </small>
              </>
            ) : (
              '—'
            ),
            s.closed ? 'Ditutup' : 'Aktif',
            !s.closed && (owner || s.userId === user!.id) ? (
              <button
                onClick={() =>
                  action(
                    s.userId === user!.id ? 'Tutup shift' : 'Force-close shift',
                    `app/shifts/${s.id}/close`,
                    [
                      amount('counted', 'Uang fisik terhitung', s.expected),
                      { ...fieldReason, required: s.userId !== user!.id },
                    ],
                    {
                      description:
                        'Hitung uang fisik sebelum mengisi. Alasan wajib jika ada selisih atau menutup shift orang lain.',
                    },
                  )
                }
              >
                Tutup shift
              </button>
            ) : (
              '—'
            ),
          ])}
        />
      </Card>
    );
  }
  function setupPanel() {
    const checks = [
      ['Outlet pertama', (data?.outlets.length ?? 0) > 0, 'outlets'],
      ['Layanan dan harga', (data?.services.filter((s) => s.active).length ?? 0) > 0, 'services'],
      ['Kapster dan jadwal', (data?.barbers.filter((b) => b.active).length ?? 0) > 0, 'barbers'],
      ['Undang kasir', (data?.team.filter((t) => t.role === 'cashier').length ?? 0) > 0, 'cashiers'],
    ];
    return (
      <Card title="Setup bisnis">
        <p>Lengkapi profil operasional, ajukan review, lalu terbitkan halaman booking dari menu Outlet.</p>
        <div className="checklist">
          {checks.map(([label, ok, route]) => (
            <Link key={String(label)} to={`${base}/${route}`}>
              <span>{ok ? '✓' : '○'}</span>
              <strong>{String(label)}</strong>
              <small>{ok ? 'Tersimpan' : 'Lengkapi →'}</small>
            </Link>
          ))}
        </div>
        <p>
          Status bisnis: <Badge value={data!.org.status} />
        </p>
        {data!.org.reason && <p className="notice">Catatan Admin: {data!.org.reason}</p>}
        {['draft', 'rejected'].includes(data!.org.status) && (
          <button
            className="primary"
            onClick={() =>
              action('Kirim bisnis untuk review', 'app/approval', [], {
                description:
                  'Admin platform akan memeriksa kelengkapan bisnis. Data tetap tersimpan selama menunggu.',
              })
            }
          >
            Ajukan approval
          </button>
        )}
        {data!.org.status === 'approved' && (
          <p className="success">
            Bisnis disetujui. Aktifkan link booking melalui menu Outlet. Subscription belum ditagihkan dalam
            pengujian lokal.
          </p>
        )}
      </Card>
    );
  }
  function renderApp(): ReactNode {
    if (!data) return <p role="status">Memuat data operasional…</p>;
    switch (page) {
      case '':
        return owner ? (
          <OwnerOverview data={data} outletFilter={outletFilter} />
        ) : (
          <CashierQueue
            data={data}
            bookings={bookings.filter((b) => b.date === today())}
            actions={bookingActions}
            search={search}
            setSearch={setSearch}
          />
        );
      case 'bookings':
        return owner ? (
          <BookingList
            data={data}
            bookings={bookings}
            actions={bookingActions}
            search={search}
            setSearch={setSearch}
            base={base}
          />
        ) : (
          <CashierQueue
            data={data}
            bookings={bookings}
            actions={bookingActions}
            search={search}
            setSearch={setSearch}
            compact
          />
        );
      case 'calendar':
        return <CalendarView data={data} bookings={bookings} actions={bookingActions} />;
      case 'new':
        return activeShift ? (
          <Booking
            internal
            catalog={{
              outlets: data.outlets.filter((o) => o.id === activeShift.outletId),
              services: data.services,
              barbers: data.barbers,
            }}
            onBooked={() => void reload()}
          />
        ) : (
          <Card title="Buka shift terlebih dahulu">
            <p>Booking kasir dan penerimaan tunai terikat pada shift outlet.</p>
            <button
              className="primary"
              onClick={() =>
                action('Buka shift', 'app/shifts/open', [outletField, amount('opening', 'Modal awal')])
              }
            >
              Buka shift
            </button>
          </Card>
        );
      case 'outlets':
        return (
          <OutletsPresentation
            data={data}
            add={() =>
              action('Tambah outlet', 'app/outlets', [
                { key: 'name', label: 'Nama outlet' },
                { key: 'address', label: 'Alamat' },
              ])
            }
            edit={(outlet) =>
              action(
                'Pengaturan outlet',
                `app/outlets/${outlet.id}`,
                [
                  { key: 'name', label: 'Nama outlet', value: outlet.name },
                  { key: 'address', label: 'Alamat', value: outlet.address },
                  {
                    key: 'published',
                    label: 'Terbitkan booking publik',
                    type: 'checkbox',
                    value: !!outlet.published,
                  },
                ],
                { method: 'PATCH' },
              )
            }
          />
        );
      case 'services':
        return (
          <Card
            title="Layanan & harga"
            action={
              <button
                className="primary"
                disabled={!data.outlets.length}
                onClick={() =>
                  action('Tambah layanan', 'app/services', [
                    outletField,
                    { key: 'name', label: 'Nama layanan' },
                    amount('price', 'Harga'),
                    { key: 'duration', label: 'Durasi (menit)', type: 'number', min: 5, max: 240, value: 45 },
                  ])
                }
              >
                ＋ Tambah layanan
              </button>
            }
          >
            <Table
              headers={['Layanan', 'Outlet', 'Harga', 'Durasi', 'Status', 'Tindakan']}
              rows={filtered(data.services).map((s) => [
                s.name,
                outletName(s.outletId),
                rupiah(s.price),
                `${s.duration} menit`,
                s.active ? 'Aktif' : 'Arsip',
                <button
                  onClick={() =>
                    action(
                      'Edit layanan',
                      `app/services/${s.id}`,
                      [
                        { key: 'name', label: 'Nama', value: s.name },
                        amount('price', 'Harga', s.price),
                        {
                          key: 'duration',
                          label: 'Durasi (menit)',
                          type: 'number',
                          min: 5,
                          max: 240,
                          value: s.duration,
                        },
                        { key: 'active', label: 'Aktif', type: 'checkbox', value: !!s.active },
                      ],
                      {
                        method: 'PATCH',
                        description: 'Perubahan harga dan durasi tidak mengubah booking yang sudah dibuat.',
                      },
                    )
                  }
                >
                  Edit
                </button>,
              ])}
            />
          </Card>
        );
      case 'barbers': {
        const barberFields = (b?: Entity): FieldSpec[] => [
          { key: 'name', label: 'Nama kapster', value: b?.name },
          { key: 'start', label: 'Mulai kerja (WIB)', type: 'time', value: b?.start ?? '09:00' },
          { key: 'end', label: 'Selesai kerja (WIB)', type: 'time', value: b?.end ?? '18:00' },
          {
            key: 'days',
            label: 'Hari kerja',
            value: b ? JSON.parse(b.days).join(',') : '1,2,3,4,5,6',
            help: '0=Minggu, 1=Senin, … 6=Sabtu. Pisahkan dengan koma.',
          },
        ];
        return (
          <>
            <Card
              title="Kapster & jadwal mingguan"
              action={
                <button
                  className="primary"
                  disabled={!data.outlets.length}
                  onClick={() =>
                    action('Tambah kapster', 'app/barbers', [outletField, ...barberFields()], {
                      map: (v) => ({ ...v, days: v.days.split(',').map(Number) }),
                    })
                  }
                >
                  ＋ Tambah kapster
                </button>
              }
            >
              <Table
                headers={['Nama', 'Outlet', 'Jam kerja', 'Hari kerja', 'Status', 'Tindakan']}
                rows={filtered(data.barbers).map((b) => [
                  b.name,
                  outletName(b.outletId),
                  `${b.start}–${b.end}`,
                  JSON.parse(b.days)
                    .map((n: number) => ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][n])
                    .join(', '),
                  b.active ? 'Aktif' : 'Nonaktif',
                  <button
                    onClick={() =>
                      action(
                        'Edit jadwal kapster',
                        `app/barbers/${b.id}`,
                        [
                          ...barberFields(b),
                          { key: 'active', label: 'Aktif', type: 'checkbox', value: !!b.active },
                        ],
                        { method: 'PATCH', map: (v) => ({ ...v, days: v.days.split(',').map(Number) }) },
                      )
                    }
                  >
                    Edit
                  </button>,
                ])}
              />
            </Card>
            <Card
              title="Cuti / blok jadwal"
              action={
                <button
                  disabled={!data.barbers.length}
                  onClick={() =>
                    action(
                      'Blok satu hari',
                      'app/blocks',
                      [
                        { key: 'barberId', label: 'Kapster', options: options(data.barbers) },
                        { key: 'date', label: 'Tanggal', type: 'date', min: today(), value: today() },
                        fieldReason,
                      ],
                      {
                        description:
                          'Booking lama tetap tercatat. Pindahkan atau batalkan booking terdampak melalui menu Booking.',
                      },
                    )
                  }
                >
                  ＋ Blok jadwal
                </button>
              }
            >
              <Table
                headers={['Kapster', 'Tanggal', 'Alasan', 'Booking terdampak', 'Tindakan']}
                rows={filtered(data.blocks).map((b) => [
                  barberName(b.barberId),
                  b.date,
                  b.reason,
                  data.bookings.filter(
                    (r) =>
                      r.barberId === b.barberId &&
                      r.date === b.date &&
                      !['cancelled', 'completed', 'no_show'].includes(r.status),
                  ).length,
                  <button onClick={() => action('Buka kembali jadwal', `app/blocks/${b.id}/remove`)}>
                    Hapus blok
                  </button>,
                ])}
              />
            </Card>
          </>
        );
      }
      case 'cashiers':
        return (
          <>
            <Card
              title="Tim kasir"
              action={
                <button
                  className="primary"
                  disabled={!data.outlets.length}
                  onClick={() =>
                    action(
                      'Undang kasir',
                      'app/team',
                      [
                        { key: 'name', label: 'Nama' },
                        { key: 'email', label: 'Email', type: 'email' },
                        outletField,
                      ],
                      { description: 'Undangan pengaturan password dikirim ke kotak email lokal.' },
                    )
                  }
                >
                  ＋ Undang kasir
                </button>
              }
            >
              <Table
                headers={['Nama', 'Email', 'Role', 'Outlet', 'Status', 'Tindakan']}
                rows={data.team.map((t) => [
                  t.name,
                  t.email,
                  <Badge value={t.role} />,
                  t.role === 'owner' ? 'Semua outlet' : outletName(t.outletId),
                  t.active ? (t.verified ? 'Aktif' : 'Menunggu undangan') : 'Nonaktif',
                  t.role === 'cashier' ? (
                    <button
                      onClick={() =>
                        action(
                          'Edit akses kasir',
                          `app/team/${t.id}`,
                          [
                            { ...outletField, value: t.outletId },
                            { key: 'active', label: 'Akses aktif', type: 'checkbox', value: !!t.active },
                          ],
                          { method: 'PATCH', description: 'Perubahan akan mencabut session login kasir.' },
                        )
                      }
                    >
                      Edit akses
                    </button>
                  ) : (
                    '—'
                  ),
                ])}
              />
            </Card>
            {shiftsPanel()}
          </>
        );
      case 'shifts':
        return owner ? (
          shiftsPanel()
        ) : (
          <CashierShift
            data={data}
            user={user!}
            open={() =>
              action('Buka shift kasir', 'app/shifts/open', [
                outletField,
                amount('opening', 'Modal kas awal'),
              ])
            }
            close={(s) =>
              action(
                'Tutup shift',
                `app/shifts/${s.id}/close`,
                [amount('counted', 'Uang fisik terhitung', s.expected), { ...fieldReason, required: false }],
                { description: 'Hitung uang fisik sebelum mengisi. Alasan wajib jika ada selisih.' },
              )
            }
            history={shiftsPanel()}
          />
        );
      case 'customers': {
        const customers = [...new Set(data.bookings.map((b) => b.phone))]
          .map((phone) => {
            const visits = data.bookings.filter((b) => b.phone === phone);
            return {
              phone,
              name: visits[0].name,
              count: visits.length,
              total: visits.filter((b) => b.paid).reduce((n, b) => n + b.price, 0),
            };
          })
          .filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));
        return (
          <Card title="Customer">
            <div className="toolbar">
              <input
                aria-label="Cari customer"
                placeholder="Cari nama atau WhatsApp…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Table
              headers={owner ? ['Nama', 'WhatsApp', 'Booking', 'Pembayaran tercatat'] : ['Nama', 'WhatsApp']}
              rows={customers.map((c) =>
                owner ? [c.name, c.phone, c.count, rupiah(c.total)] : [c.name, c.phone],
              )}
            />
            <p className="muted">
              Data berasal dari booking. Riwayat dan ringkasan transaksi customer hanya ditampilkan kepada
              Owner.
            </p>
          </Card>
        );
      }
      case 'transactions':
        return (
          <>
            <Card title="Pembayaran tunai tercatat">
              <Table
                headers={['Kode', 'Customer', 'Outlet', 'Jumlah', 'Diterima / kembali', 'Waktu']}
                rows={filtered(data.payments).map((p) => [
                  bookingCode(p.bookingId),
                  data.bookings.find((b) => b.id === p.bookingId)?.name ?? 'Customer',
                  outletName(p.outletId),
                  rupiah(p.amount),
                  `${rupiah(p.tendered)} / ${rupiah(p.tendered - p.amount)}`,
                  new Date(p.created).toLocaleString('id-ID'),
                ])}
              />
              <p className="muted">
                Pembayaran tidak diedit atau dihapus. Koreksi melalui pengajuan refund penuh.
              </p>
            </Card>
            <Card title="Pengajuan refund">
              <Table
                headers={['Booking', 'Alasan', 'Status', 'Keputusan Owner', 'Tindakan']}
                rows={filtered(data.refunds).map((r) => [
                  bookingCode(r.bookingId),
                  r.reason,
                  <Badge value={r.status} />,
                  r.decisionReason || '—',
                  <div className="actions">
                    {owner && r.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            action('Setujui refund', `app/refunds/${r.id}/decision`, [fieldReason], {
                              map: (v) => ({ ...v, approved: true }),
                            })
                          }
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() =>
                            action('Tolak refund', `app/refunds/${r.id}/decision`, [fieldReason], {
                              map: (v) => ({ ...v, approved: false }),
                            })
                          }
                        >
                          Tolak
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button
                        onClick={() =>
                          action('Catat pengembalian tunai', `app/refunds/${r.id}/disburse`, [], {
                            description:
                              'Lakukan hanya setelah uang benar-benar dikembalikan kepada customer. Saldo shift aktif akan dikurangi.',
                          })
                        }
                      >
                        Uang sudah dikembalikan
                      </button>
                    )}
                  </div>,
                ])}
              />
            </Card>
          </>
        );
      case 'reports': {
        const payments = filtered(data.payments).filter((p) => {
          const d = new Date(Date.parse(p.created) + 7 * 3600000).toISOString().slice(0, 10);
          return d >= from && d <= to;
        });
        const rows = data.outlets
          .filter((o) => !outletFilter || o.id === outletFilter)
          .map((o) => {
            const total = payments.filter((p) => p.outletId === o.id).reduce((s, p) => s + p.amount, 0);
            const refunds = paidRefunds
              .filter((r) => r.outletId === o.id)
              .filter((r) => {
                const d = r.paidAt
                  ? new Date(Date.parse(r.paidAt) + 7 * 3600000).toISOString().slice(0, 10)
                  : '';
                return d >= from && d <= to;
              })
              .reduce((s, r) => s + (data.bookings.find((b) => b.id === r.bookingId)?.price ?? 0), 0);
            return [o.name, total, refunds, total - refunds];
          });
        return (
          <Card
            title="Laporan penerimaan tunai"
            action={
              <button
                onClick={() =>
                  exportCsv('laporan-kas.csv', ['Outlet', 'Penerimaan', 'Refund dibayar', 'Bersih'], rows)
                }
              >
                Ekspor CSV
              </button>
            }
          >
            <div className="toolbar">
              <label className="field">
                <span>Dari</span>
                <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="field">
                <span>Sampai</span>
                <input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
            <Table
              headers={['Outlet', 'Penerimaan tunai', 'Refund dibayar', 'Bersih']}
              rows={rows.map((r) => [r[0], rupiah(Number(r[1])), rupiah(Number(r[2])), rupiah(Number(r[3]))])}
            />
            <p className="notice">
              Periode mengikuti WIB dan waktu pencatatan kas. Total bersih:{' '}
              <strong>{rupiah(rows.reduce((s, r) => s + Number(r[3]), 0))}</strong>. Ini laporan penerimaan
              kas, bukan perhitungan laba.
            </p>
          </Card>
        );
      }
      case 'onboarding':
      case 'approval':
        return setupPanel();
      case 'subscription':
        return (
          <Card title="Langganan">
            <p>
              Penagihan subscription belum diaktifkan. Pengujian lokal dapat berjalan setelah bisnis disetujui
              tanpa memasukkan pembayaran.
            </p>
            <Link to={`${base}/outlets`}>Kelola publikasi booking →</Link>
          </Card>
        );
      case 'settings':
        return (
          <>
            <Card title="Akun & akses">
              <dl className="summary">
                <div>
                  <dt>Nama</dt>
                  <dd>{user!.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user!.email}</dd>
                </div>
                <div>
                  <dt>Peran</dt>
                  <dd>{labels[user!.role]}</dd>
                </div>
              </dl>
              <Link to="/forgot-password">Atur ulang password →</Link>
            </Card>
            {owner && (
              <>
                <Card title="Integrasi & langganan">
                  <p>
                    Payment gateway dan notifikasi eksternal belum diaktifkan. Pembayaran saat ini hanya
                    pencatatan tunai di outlet.
                  </p>
                  <Link to={`${base}/subscription`}>Status langganan →</Link>
                </Card>
                <Card title="Riwayat audit">
                  <Table
                    headers={['Waktu', 'Aktor', 'Tindakan', 'Alasan']}
                    rows={data.audit.map((a) => [
                      new Date(a.created).toLocaleString('id-ID'),
                      a.actorName || a.actor,
                      a.action,
                      a.reason || '—',
                    ])}
                  />
                </Card>
              </>
            )}
          </>
        );
      default:
        return (
          <Card title="Halaman tidak ditemukan">
            <Link to={base}>Kembali ke ringkasan</Link>
          </Card>
        );
    }
  }
  const modal = (
    <>
      {' '}
      {dialog && (
        <Modal title={dialog.title} close={() => setDialog(null)}>
          {dialog.description && <p className="muted">{dialog.description}</p>}
          <Form
            fields={dialog.fields}
            onSubmit={async (values) => {
              const result = await api(
                dialog.endpoint,
                dialog.map ? dialog.map(values) : values,
                dialog.method ?? 'POST',
              );
              setDialog(null);
              setNotice(
                result.message ??
                  (result.affected?.length
                    ? `Tersimpan. ${result.affected.length} booking terdampak; periksa menu Booking.`
                    : 'Perubahan berhasil disimpan.'),
              );
              await reload();
            }}
          />
        </Modal>
      )}
    </>
  );
  if (owner && data && ['onboarding', 'approval'].includes(page))
    return (
      <>
        <SetupPage data={data} approval={page === 'approval'}>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="success">
              {notice}
            </p>
          )}
          {setupPanel()}
        </SetupPage>
        {modal}
      </>
    );
  return (
    <>
      <WorkspaceShell
        user={user}
        data={data}
        page={page}
        menuOpen={menuOpen}
        setMenu={setMenu}
        search={search}
        setSearch={setSearch}
        logout={async () => {
          try {
            await api('auth/logout', {});
            setUser(null);
            navigate('/login');
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        {owner && data && !page && <SetupBanner data={data} />}
        <PageTitle user={user} page={page} orgName={data?.org.name}>
          {owner && data && (
            <select
              aria-label="Filter outlet"
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
            >
              <option value="">Semua outlet</option>
              {data.outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          <button disabled={reloading} onClick={() => void reload()} aria-label="Muat ulang data">
            {reloading ? 'Memuat…' : '↻ Muat ulang'}
          </button>
        </PageTitle>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="success" role="status">
            {notice}
          </div>
        )}
        {user.role === 'admin' ? (
          admin ? (
            <AdminPresentation
              data={admin}
              page={page}
              search={search}
              onDecision={(org, status) =>
                action(
                  status === 'approved'
                    ? 'Setujui bisnis'
                    : status === 'rejected'
                      ? 'Kembalikan untuk revisi'
                      : 'Tangguhkan bisnis',
                  `admin/orgs/${org.id}/status`,
                  [fieldReason],
                  {
                    map: (v) => ({ ...v, status }),
                    description:
                      status === 'suspended'
                        ? 'Booking publik dihentikan. Data transaksi tetap tersimpan.'
                        : 'Keputusan dan alasan dicatat dalam audit.',
                  },
                )
              }
            />
          ) : (
            <p role="status">Memuat data platform…</p>
          )
        ) : data &&
          page &&
          !['bookings', 'calendar', 'outlets', ...(!owner ? ['shifts'] : [])].includes(page) ? (
          <ManagementView key={page} data={data} page={page} user={user} outletFilter={outletFilter}>
            {renderApp()}
          </ManagementView>
        ) : (
          renderApp()
        )}
      </WorkspaceShell>
      {modal}
    </>
  );
}
