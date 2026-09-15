import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, AppData, dayLabel, Entity, rupiah, shortDate, today, labels } from './api';
import { useAuth, homeFor } from './auth';
import {
  ActionItem,
  ActionList,
  Badge,
  Card,
  dayNames,
  exportCsv,
  FieldSpec,
  Form,
  Modal,
  RowActions,
  Summary,
  Table,
  Toast,
  ToastView,
} from './ui';
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
import { RescheduleForm } from './Dialogs';

type Values = Record<string, any>;
type Dialog = {
  title: string;
  description?: ReactNode;
  fields?: FieldSpec[];
  endpoint?: string;
  method?: string;
  map?: (values: Values) => Values;
  submit?: string;
  tone?: 'danger';
  summary?: [string, ReactNode][];
  preview?: (values: Values) => ReactNode;
  /** Toast shown after success; receives the API result and submitted values. */
  success?: string | ((result: Entity, values: Values) => string);
  custom?: (close: () => void, done: (message: string) => void) => ReactNode;
  wide?: boolean;
};
const reasonField = (suggestions: string[], label = 'Alasan'): FieldSpec => ({
  key: 'reason',
  label,
  type: 'textarea',
  minLength: 5,
  suggestions,
  help: 'Minimal 5 karakter. Tercatat di riwayat audit.',
});
const money = (key: string, label: string, value = 0, extra: Partial<FieldSpec> = {}): FieldSpec => ({
  key,
  label,
  type: 'money',
  min: 0,
  max: 100000000,
  value,
  ...extra,
});
const options = (items: Entity[]) => items.map((i) => ({ value: i.id, label: i.name }));
const difference = (amount: number, zero: string, plus: string, minus: string) =>
  amount === 0 ? zero : `${amount > 0 ? plus : minus} ${rupiah(Math.abs(amount))}`;

export function Workspace() {
  const { user, setUser } = useAuth();
  const location = useLocation(),
    navigate = useNavigate();
  const [data, setData] = useState<AppData | null>(null),
    [admin, setAdmin] = useState<{ orgs: Entity[]; audit: Entity[] } | null>(null);
  const [error, setError] = useState(''),
    [toast, setToast] = useState<Toast | null>(null),
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
  const closeToast = useCallback(() => setToast(null), []);
  useEffect(() => {
    void reload();
    const timer = setInterval(reload, 15000);
    return () => clearInterval(timer);
  }, [reload]);
  useEffect(() => {
    setMenu(false);
    setSearch('');
  }, [location.pathname]);
  if (!user) return null;
  const base = homeFor(user),
    page = location.pathname.slice(base.length).replace(/^\//, '') || '';
  const owner = user.role === 'owner';
  const open = (spec: Dialog) => setDialog(spec);
  const succeed = (title: string, message?: string) => {
    setDialog(null);
    setToast({ tone: 'success', title, message });
    void reload();
  };
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
  const bookingSummary = (b: Entity): [string, ReactNode][] => [
    ['Customer', `${b.name} · ${b.phone}`],
    ['Layanan', `${b.serviceName} · ${b.duration} menit`],
    ['Kapster', barberName(b.barberId)],
    ['Jadwal', `${dayLabel(b.date)} · ${b.time} WIB`],
    ['Total', rupiah(b.price)],
  ];
  const status = (b: Entity, next: string, spec: Omit<Dialog, 'endpoint'>) =>
    open({
      endpoint: `app/bookings/${b.id}/status`,
      summary: bookingSummary(b),
      map: (v) => ({ ...v, status: next }),
      ...spec,
    });
  function bookingItems(b: Entity): ActionItem[] {
    const items: ActionItem[] = [];
    const pay: ActionItem = {
      label: 'Bayar tunai',
      onClick: () => {
        const quick = [...new Set([50000, 100000, 200000].map((step) => Math.ceil(b.price / step) * step))]
          .filter((v) => v > b.price)
          .slice(0, 3);
        open({
          title: 'Terima pembayaran tunai',
          description: 'Masukkan jumlah uang yang diterima dari customer. Kembalian dihitung otomatis.',
          endpoint: `app/bookings/${b.id}/pay`,
          summary: bookingSummary(b),
          fields: [
            money('tendered', 'Uang diterima', b.price, {
              quick: [
                { label: 'Uang pas', value: b.price },
                ...quick.map((v) => ({ label: rupiah(v), value: v })),
              ],
            }),
          ],
          preview: (v) =>
            v.tendered >= b.price ? (
              <span className="preview-ok">
                {v.tendered === b.price
                  ? 'Uang pas · tidak ada kembalian'
                  : `Kembalian ${rupiah(v.tendered - b.price)}`}
              </span>
            ) : (
              <span className="preview-warn">Uang kurang {rupiah(b.price - v.tendered)}</span>
            ),
          submit: 'Simpan pembayaran',
          success: (r) =>
            `Pembayaran ${rupiah(b.price)} dari ${b.name} tercatat.${r.change ? ` Kembalian ${rupiah(r.change)}.` : ''}`,
        });
      },
    };
    const unpaid = !b.paid && !['cancelled', 'no_show'].includes(b.status);
    if (b.status === 'confirmed')
      items.push({
        label: 'Check-in',
        onClick: () =>
          status(b, 'checked_in', {
            title: 'Check-in customer',
            description: 'Pastikan customer sudah tiba di outlet. Booking akan masuk antrean siap dilayani.',
            submit: 'Ya, customer sudah datang',
            success: `${b.name} sudah check-in dan menunggu dilayani.`,
          }),
      });
    if (b.status === 'checked_in')
      items.push({
        label: 'Mulai layanan',
        onClick: () =>
          status(b, 'in_service', {
            title: 'Mulai layanan',
            description: `${barberName(b.barberId)} mulai melayani customer ini. Status berubah menjadi Sedang dilayani.`,
            submit: 'Mulai sekarang',
            success: `Layanan ${b.name} dimulai.`,
          }),
      });
    if (b.status === 'in_service') {
      if (unpaid) items.push(pay);
      else
        items.push({
          label: 'Selesai',
          onClick: () =>
            status(b, 'completed', {
              title: 'Selesaikan layanan',
              description: 'Tandai layanan sudah selesai. Pembayaran untuk booking ini sudah tercatat.',
              submit: 'Tandai selesai',
              success: `Layanan ${b.name} selesai.`,
            }),
        });
    } else if (unpaid) items.push({ ...pay, tone: items.length ? 'secondary' : undefined });
    if (['confirmed', 'checked_in'].includes(b.status)) {
      items.push({
        label: 'Ubah jadwal',
        tone: 'secondary',
        onClick: () =>
          open({
            title: 'Ubah jadwal booking',
            description: `Saat ini: ${dayLabel(b.date)} · ${b.time} WIB bersama ${barberName(b.barberId)}. Pilih jam kosong yang baru.`,
            wide: true,
            custom: (close, done) => (
              <RescheduleForm
                booking={b}
                barbers={(data?.barbers ?? []).filter((r) => r.outletId === b.outletId && r.active)}
                onCancel={close}
                onDone={done}
              />
            ),
          }),
      });
      items.push({
        label: 'Batalkan booking',
        tone: 'danger',
        onClick: () =>
          status(b, 'cancelled', {
            title: 'Batalkan booking?',
            description: b.paid
              ? 'Booking akan dibatalkan dan slot kembali tersedia. Pembayaran tidak otomatis dikembalikan; ajukan refund terpisah.'
              : 'Booking akan dibatalkan dan slot kapster kembali tersedia untuk customer lain.',
            tone: 'danger',
            fields: [
              reasonField(['Customer membatalkan', 'Kapster berhalangan', 'Customer minta ganti hari']),
            ],
            submit: 'Batalkan booking',
            success: `Booking ${b.name} dibatalkan.`,
          }),
      });
    }
    if (b.status === 'confirmed')
      items.push({
        label: 'Tidak hadir',
        tone: 'danger',
        onClick: () =>
          status(b, 'no_show', {
            title: 'Tandai tidak hadir?',
            description: 'Gunakan jika customer tidak datang setelah toleransi 15 menit dari jadwal.',
            tone: 'danger',
            fields: [reasonField(['Tidak datang setelah 15 menit', 'Tidak bisa dihubungi'])],
            submit: 'Tandai tidak hadir',
            success: `${b.name} ditandai tidak hadir.`,
          }),
      });
    if (!!b.paid && !data?.refunds.some((r) => r.bookingId === b.id))
      items.push({
        label: 'Ajukan refund',
        tone: 'secondary',
        onClick: () =>
          open({
            title: 'Ajukan refund penuh',
            description: `Owner perlu menyetujui sebelum ${rupiah(b.price)} dikembalikan tunai kepada customer.`,
            endpoint: `app/bookings/${b.id}/refund`,
            summary: bookingSummary(b),
            fields: [
              reasonField([
                'Customer komplain hasil layanan',
                'Salah input pembayaran',
                'Layanan batal dikerjakan',
              ]),
            ],
            submit: 'Kirim pengajuan',
            success: 'Pengajuan refund terkirim ke Owner.',
          }),
      });
    return items;
  }
  const bookingActions = (b: Entity, variant: 'row' | 'panel' = 'row') =>
    variant === 'panel' ? (
      <ActionList items={bookingItems(b)} />
    ) : (
      <RowActions items={bookingItems(b)} label={b.name} />
    );
  const openShift = () =>
    open({
      title: 'Buka shift kasir',
      description: 'Hitung uang di laci sebelum mulai. Semua pembayaran tunai akan tercatat pada shift ini.',
      endpoint: 'app/shifts/open',
      fields: [
        ...(user.role === 'cashier' ? [] : [outletField]),
        money('opening', 'Modal kas awal', 0, {
          quick: [0, 100000, 200000, 500000].map((v) => ({ label: v ? rupiah(v) : 'Kosong', value: v })),
          help: 'Uang tunai yang sudah ada di laci saat shift dibuka.',
        }),
      ],
      map: (v) => ({ outletId: user.outletId ?? v.outletId, ...v }),
      submit: 'Buka shift',
      success: (_, v) => `Shift dibuka dengan modal ${rupiah(v.opening)}.`,
    });
  const closeShift = (s: Entity) => {
    const own = s.userId === user.id;
    open({
      title: own ? 'Tutup shift' : 'Tutup paksa shift kasir',
      description: own
        ? 'Hitung uang fisik di laci, lalu masukkan jumlahnya. Alasan wajib diisi jika ada selisih.'
        : 'Shift ini milik operator lain. Alasan wajib diisi dan tercatat di audit.',
      tone: own ? undefined : 'danger',
      endpoint: `app/shifts/${s.id}/close`,
      summary: [
        ['Operator', data?.team.find((t) => t.id === s.userId)?.name ?? (own ? user.name : 'Operator')],
        ['Dibuka', new Date(s.opened).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })],
        ['Modal awal', rupiah(s.opening)],
        ['Saldo menurut sistem', rupiah(s.expected)],
      ],
      fields: [
        money('counted', 'Uang fisik terhitung', s.expected, {
          quick: [{ label: 'Sesuai sistem', value: s.expected }],
        }),
        {
          ...reasonField(
            ['Uang kembalian kurang', 'Salah hitung kembalian', 'Pengeluaran operasional'],
            'Alasan selisih',
          ),
          required: !own,
          minLength: undefined,
          help: own ? 'Wajib jika uang fisik berbeda dengan saldo sistem.' : 'Minimal 5 karakter.',
        },
      ],
      preview: (v) => {
        const diff = v.counted - s.expected;
        return (
          <span className={diff === 0 ? 'preview-ok' : 'preview-warn'}>
            {difference(diff, 'Uang fisik sesuai saldo sistem', 'Lebih', 'Kurang')}
            {diff === 0 ? '' : ' · alasan wajib diisi'}
          </span>
        );
      },
      submit: own ? 'Tutup shift' : 'Tutup paksa',
      success: (r) =>
        `Shift ditutup. ${difference(r.variance ?? 0, 'Kas sesuai.', 'Selisih lebih', 'Selisih kurang')}`,
    });
  };
  function shiftsPanel() {
    return (
      <Card
        title="Shift dan laci kas"
        action={
          !activeShift && (
            <button className="primary" onClick={openShift}>
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
            'Saldo sistem',
            'Kas terhitung',
            'Status',
            'Tindakan',
          ]}
          rows={filtered(data?.shifts ?? []).map((s) => [
            data?.team.find((t) => t.id === s.userId)?.name ??
              (s.userId === user!.id ? user!.name : 'Operator'),
            outletName(s.outletId),
            <span className="nowrap">
              {new Date(s.opened).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>,
            rupiah(s.opening),
            rupiah(s.expected),
            s.closed ? (
              <>
                {rupiah(s.counted)}
                <small>
                  {difference(s.counted - s.expected, 'Sesuai', 'Lebih', 'Kurang')}
                  {s.reason ? ` · ${s.reason}` : ''}
                </small>
              </>
            ) : (
              '—'
            ),
            <Badge value={s.closed ? 'Ditutup' : 'Aktif'} />,
            !s.closed && (owner || s.userId === user!.id) ? (
              <button onClick={() => closeShift(s)}>Tutup shift</button>
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
              open({
                title: 'Kirim bisnis untuk review',
                description:
                  'Admin platform akan memeriksa outlet, layanan, dan kapster Anda. Data tetap bisa dilihat selama menunggu.',
                endpoint: 'app/approval',
                summary: [
                  ['Bisnis', data!.org.name],
                  ['Outlet', `${data!.outlets.length} outlet`],
                  ['Layanan aktif', `${data!.services.filter((s) => s.active).length} layanan`],
                  ['Kapster aktif', `${data!.barbers.filter((b) => b.active).length} kapster`],
                ],
                submit: 'Kirim untuk review',
                success: 'Pengajuan terkirim. Status bisnis sekarang menunggu review Admin.',
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
  const editSlug = () =>
    open({
      title: 'Ubah link booking',
      description:
        'Link dipakai customer untuk membuka halaman booking bisnis Anda. Setelah outlet pertama diterbitkan, link terkunci permanen agar link yang sudah dibagikan tidak rusak.',
      endpoint: 'app/org',
      method: 'PATCH',
      fields: [
        {
          key: 'slug',
          label: 'Link booking',
          value: data?.org.slug,
          minLength: 3,
          help: `Huruf kecil, angka, dan tanda hubung. Hasil: ${window.location.origin}/booking/nama-link`,
          wide: true,
        },
      ],
      preview: (v) => (
        <span className="preview-ok">
          {window.location.origin}/booking/{String(v.slug).toLowerCase()}
        </span>
      ),
      submit: 'Simpan link',
      success: (r) => r.message,
    });
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
            initialOutlet={activeShift.outletId}
            catalog={{
              outlets: data.outlets.filter((o) => o.id === activeShift.outletId),
              services: data.services.filter((s) => s.active),
              barbers: data.barbers.filter((b) => b.active),
              org: { name: data.org.name, slug: data.org.slug },
            }}
            onBooked={() => void reload()}
          />
        ) : (
          <Card title="Buka shift terlebih dahulu">
            <p>Booking kasir dan penerimaan tunai terikat pada shift outlet.</p>
            <button className="primary" onClick={openShift}>
              Buka shift
            </button>
          </Card>
        );
      case 'outlets':
        return (
          <OutletsPresentation
            data={data}
            editSlug={editSlug}
            add={() =>
              open({
                title: 'Tambah outlet',
                description:
                  'Outlet baru belum tampil di halaman booking. Tambahkan layanan dan kapster, lalu terbitkan dari tombol Edit outlet.',
                endpoint: 'app/outlets',
                fields: [
                  {
                    key: 'name',
                    label: 'Nama outlet',
                    minLength: 2,
                    placeholder: 'Contoh: Garasi Barber Kemang',
                    wide: true,
                  },
                  {
                    key: 'address',
                    label: 'Alamat',
                    type: 'textarea',
                    minLength: 2,
                    placeholder: 'Jalan, nomor, kecamatan, kota',
                  },
                ],
                submit: 'Tambah outlet',
                success: (_, v) => `${v.name} ditambahkan.`,
              })
            }
            edit={(outlet) =>
              open({
                title: 'Edit outlet',
                description: 'Perubahan nama dan alamat langsung tampil di halaman booking outlet ini.',
                endpoint: `app/outlets/${outlet.id}`,
                method: 'PATCH',
                fields: [
                  { key: 'name', label: 'Nama outlet', value: outlet.name, minLength: 2, wide: true },
                  { key: 'address', label: 'Alamat', type: 'textarea', value: outlet.address, minLength: 2 },
                  {
                    key: 'published',
                    label: 'Terima booking online',
                    type: 'checkbox',
                    value: !!outlet.published,
                    help: `Customer dapat booking lewat /booking/${data.org.slug}/${outlet.slug}. Butuh bisnis disetujui serta minimal satu layanan dan kapster aktif.`,
                  },
                ],
                submit: 'Simpan outlet',
                success: (_, v) =>
                  v.published
                    ? `${v.name} menerima booking online.`
                    : `${v.name} disimpan (booking online nonaktif).`,
              })
            }
          />
        );
      case 'services': {
        const serviceFields = (s?: Entity): FieldSpec[] => [
          ...(s ? [] : [outletField]),
          {
            key: 'name',
            label: 'Nama layanan',
            value: s?.name,
            minLength: 2,
            placeholder: 'Contoh: Haircut + Wash',
          },
          money('price', 'Harga', s?.price ?? 0, { min: 0 }),
          {
            key: 'duration',
            label: 'Durasi',
            type: 'duration',
            min: 5,
            max: 240,
            value: s?.duration ?? 45,
            wide: true,
          },
          ...(s
            ? [
                {
                  key: 'active',
                  label: 'Layanan aktif',
                  type: 'checkbox',
                  value: !!s.active,
                  help: 'Layanan nonaktif tidak bisa dipilih di booking baru.',
                } as FieldSpec,
              ]
            : []),
        ];
        return (
          <Card
            title="Layanan & harga"
            action={
              <button
                className="primary"
                disabled={!data.outlets.length}
                onClick={() =>
                  open({
                    title: 'Tambah layanan',
                    description:
                      'Durasi menentukan panjang slot booking. Sistem menambah jeda 10 menit antar booking.',
                    endpoint: 'app/services',
                    fields: serviceFields(),
                    submit: 'Tambah layanan',
                    success: (_, v) => `${v.name} · ${rupiah(v.price)} ditambahkan.`,
                  })
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
                <Badge value={s.active ? 'Aktif' : 'Nonaktif'} />,
                <button
                  onClick={() =>
                    open({
                      title: `Edit layanan · ${s.name}`,
                      description: 'Perubahan harga dan durasi hanya berlaku untuk booking baru.',
                      endpoint: `app/services/${s.id}`,
                      method: 'PATCH',
                      fields: serviceFields(s),
                      submit: 'Simpan layanan',
                      success: (_, v) => `${v.name} diperbarui.`,
                    })
                  }
                >
                  Edit
                </button>,
              ])}
            />
          </Card>
        );
      }
      case 'barbers': {
        const barberFields = (b?: Entity): FieldSpec[] => [
          ...(b ? [] : [outletField]),
          {
            key: 'name',
            label: 'Nama kapster',
            value: b?.name,
            minLength: 2,
            placeholder: 'Contoh: Raka Pratama',
          },
          {
            key: 'start',
            label: 'Mulai kerja',
            type: 'clock',
            value: b?.start ?? '09:00',
            presets: [
              { label: '09–18', values: { start: '09:00', end: '18:00' } },
              { label: '10–20', values: { start: '10:00', end: '20:00' } },
              { label: '10–22', values: { start: '10:00', end: '22:00' } },
            ],
          },
          { key: 'end', label: 'Selesai kerja', type: 'clock', value: b?.end ?? '18:00' },
          {
            key: 'days',
            label: 'Hari kerja',
            type: 'days',
            value: b ? JSON.parse(b.days) : [1, 2, 3, 4, 5, 6],
          },
          ...(b
            ? [
                {
                  key: 'active',
                  label: 'Kapster aktif',
                  type: 'checkbox',
                  value: !!b.active,
                  help: 'Kapster nonaktif tidak muncul di booking baru.',
                } as FieldSpec,
              ]
            : []),
        ];
        const hours = (v: Values) => {
          const span =
            Number(v.end.slice(0, 2)) * 60 +
            Number(v.end.slice(3)) -
            (Number(v.start.slice(0, 2)) * 60 + Number(v.start.slice(3)));
          return span > 0
            ? `${Math.floor(span / 60)} jam${span % 60 ? ` ${span % 60} menit` : ''} per hari`
            : 'Jam belum valid';
        };
        const schedulePreview = (v: Values) =>
          v.days.length ? (
            <span className="preview-ok">
              {dayNames(v.days)} · {v.start}–{v.end} WIB · {hours(v)}
            </span>
          ) : (
            <span className="preview-warn">Belum ada hari kerja dipilih</span>
          );
        return (
          <>
            <Card
              title="Kapster & jadwal mingguan"
              action={
                <button
                  className="primary"
                  disabled={!data.outlets.length}
                  onClick={() =>
                    open({
                      title: 'Tambah kapster',
                      description: 'Slot booking dibuat otomatis dari jam dan hari kerja kapster.',
                      endpoint: 'app/barbers',
                      fields: barberFields(),
                      preview: schedulePreview,
                      submit: 'Tambah kapster',
                      success: (_, v) => `${v.name} ditambahkan · ${dayNames(v.days)} ${v.start}–${v.end}.`,
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
                  <span className="nowrap">
                    {b.start}–{b.end}
                  </span>,
                  dayNames(JSON.parse(b.days)),
                  <Badge value={b.active ? 'Aktif' : 'Nonaktif'} />,
                  <button
                    onClick={() =>
                      open({
                        title: `Edit jadwal · ${b.name}`,
                        description:
                          'Jadwal tidak bisa dipersempit jika masih ada booking mendatang di luar jam atau hari baru.',
                        endpoint: `app/barbers/${b.id}`,
                        method: 'PATCH',
                        fields: barberFields(b),
                        preview: schedulePreview,
                        submit: 'Simpan jadwal',
                        success: (_, v) => `Jadwal ${v.name} diperbarui.`,
                      })
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
                    open({
                      title: 'Blok jadwal kapster',
                      description:
                        'Kapster tidak menerima booking baru di tanggal ini. Booking yang sudah ada tetap tercatat dan perlu dipindah atau dibatalkan dari menu Booking.',
                      endpoint: 'app/blocks',
                      fields: [
                        { key: 'barberId', label: 'Kapster', options: options(filtered(data.barbers)) },
                        { key: 'date', label: 'Tanggal', type: 'date', min: today(), value: today() },
                        reasonField(['Cuti', 'Sakit', 'Pelatihan', 'Libur nasional']),
                      ],
                      submit: 'Blok tanggal ini',
                      success: (r, v) =>
                        `${barberName(v.barberId)} diblok pada ${shortDate(v.date)}.${r.affected?.length ? ` ${r.affected.length} booking terdampak perlu ditangani.` : ''}`,
                    })
                  }
                >
                  ＋ Blok jadwal
                </button>
              }
            >
              <Table
                headers={['Kapster', 'Tanggal', 'Alasan', 'Booking terdampak', 'Tindakan']}
                rows={filtered(data.blocks).map((b) => {
                  const affected = data.bookings.filter(
                    (r) =>
                      r.barberId === b.barberId &&
                      r.date === b.date &&
                      !['cancelled', 'completed', 'no_show'].includes(r.status),
                  ).length;
                  return [
                    barberName(b.barberId),
                    <span className="nowrap">{shortDate(b.date)}</span>,
                    b.reason,
                    affected ? <Badge value={`${affected} booking`} /> : 'Tidak ada',
                    <button
                      onClick={() =>
                        open({
                          title: 'Buka kembali jadwal?',
                          description: 'Kapster akan kembali menerima booking pada tanggal ini.',
                          endpoint: `app/blocks/${b.id}/remove`,
                          summary: [
                            ['Kapster', barberName(b.barberId)],
                            ['Tanggal', shortDate(b.date)],
                            ['Alasan blok', b.reason],
                          ],
                          submit: 'Buka jadwal',
                          success: `Jadwal ${barberName(b.barberId)} pada ${shortDate(b.date)} dibuka kembali.`,
                        })
                      }
                    >
                      Hapus blok
                    </button>,
                  ];
                })}
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
                    open({
                      title: 'Undang kasir',
                      description:
                        'Kasir menerima email untuk membuat password. Pada mode lokal, email tersimpan di kotak email lokal (npm run local:mail).',
                      endpoint: 'app/team',
                      fields: [
                        { key: 'name', label: 'Nama', minLength: 2 },
                        { key: 'email', label: 'Email', type: 'email' },
                        { ...outletField, wide: true },
                      ],
                      submit: 'Kirim undangan',
                      success: (_, v) => `Undangan untuk ${v.email} dibuat.`,
                    })
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
                        open({
                          title: `Akses kasir · ${t.name}`,
                          description: 'Menyimpan perubahan akan mengeluarkan kasir dari semua perangkat.',
                          endpoint: `app/team/${t.id}`,
                          method: 'PATCH',
                          fields: [
                            { ...outletField, value: t.outletId, wide: true },
                            {
                              key: 'active',
                              label: 'Akses aktif',
                              type: 'checkbox',
                              value: !!t.active,
                              help: 'Kasir nonaktif tidak bisa login.',
                            },
                          ],
                          submit: 'Simpan akses',
                          success: `Akses ${t.name} diperbarui.`,
                        })
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
            open={openShift}
            close={closeShift}
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
                  <span className="nowrap">
                    {new Date(p.created).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>,
                ])}
              />
              <p className="muted">
                Pembayaran tidak diedit atau dihapus. Koreksi melalui pengajuan refund penuh.
              </p>
            </Card>
            <Card title="Pengajuan refund">
              <Table
                headers={['Booking', 'Alasan', 'Status', 'Keputusan Owner', 'Tindakan']}
                rows={filtered(data.refunds).map((r) => {
                  const b = data.bookings.find((v) => v.id === r.bookingId);
                  const refundSummary: [string, ReactNode][] = [
                    ['Booking', `#${bookingCode(r.bookingId)}${b ? ` · ${b.name}` : ''}`],
                    ['Jumlah', b ? rupiah(b.price) : '—'],
                    ['Alasan kasir', r.reason],
                  ];
                  const items: ActionItem[] = [];
                  if (owner && r.status === 'pending')
                    items.push(
                      {
                        label: 'Setujui',
                        onClick: () =>
                          open({
                            title: 'Setujui refund',
                            description:
                              'Setelah disetujui, kasir mengembalikan uang tunai dan mencatatnya dari shift aktif.',
                            endpoint: `app/refunds/${r.id}/decision`,
                            summary: refundSummary,
                            fields: [
                              reasonField(['Komplain valid', 'Kesalahan input kasir'], 'Catatan keputusan'),
                            ],
                            map: (v) => ({ ...v, approved: true }),
                            submit: 'Setujui refund',
                            success: 'Refund disetujui. Kasir dapat mengembalikan uang.',
                          }),
                      },
                      {
                        label: 'Tolak',
                        tone: 'danger',
                        onClick: () =>
                          open({
                            title: 'Tolak refund?',
                            description: 'Pengajuan ditutup dan uang tidak dikembalikan.',
                            tone: 'danger',
                            endpoint: `app/refunds/${r.id}/decision`,
                            summary: refundSummary,
                            fields: [
                              reasonField(['Layanan sudah sesuai', 'Bukti tidak cukup'], 'Alasan penolakan'),
                            ],
                            map: (v) => ({ ...v, approved: false }),
                            submit: 'Tolak refund',
                            success: 'Refund ditolak.',
                          }),
                      },
                    );
                  if (r.status === 'approved')
                    items.push({
                      label: 'Uang sudah dikembalikan',
                      onClick: () =>
                        open({
                          title: 'Catat pengembalian tunai',
                          description:
                            'Lakukan hanya setelah uang benar-benar diserahkan kepada customer. Saldo shift aktif Anda akan berkurang.',
                          endpoint: `app/refunds/${r.id}/disburse`,
                          summary: refundSummary,
                          submit: 'Ya, uang sudah diserahkan',
                          success: 'Pengembalian tunai tercatat pada shift aktif.',
                        }),
                    });
                  return [
                    bookingCode(r.bookingId),
                    r.reason,
                    <Badge value={r.status} />,
                    r.decisionReason || '—',
                    <RowActions items={items} label={`refund ${bookingCode(r.bookingId)}`} />,
                  ];
                })}
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
                      <span className="nowrap">
                        {new Date(a.created).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>,
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
  const close = () => setDialog(null);
  const modal = dialog && (
    <Modal
      title={dialog.title}
      description={dialog.description}
      tone={dialog.tone}
      size={dialog.wide ? 'wide' : undefined}
      close={close}
    >
      {dialog.summary && <Summary rows={dialog.summary} />}
      {dialog.custom ? (
        dialog.custom(close, (message) => succeed('Berhasil disimpan', message))
      ) : (
        <Form
          fields={dialog.fields ?? []}
          submit={dialog.submit}
          tone={dialog.tone}
          preview={dialog.preview}
          onCancel={close}
          onSubmit={async (values) => {
            const result = await api(
              dialog.endpoint!,
              dialog.map ? dialog.map(values) : values,
              dialog.method ?? 'POST',
            );
            const message =
              typeof dialog.success === 'function' ? dialog.success(result, values) : dialog.success;
            succeed(
              dialog.tone === 'danger' ? 'Tindakan dicatat' : 'Berhasil disimpan',
              message ?? result.message,
            );
          }}
        />
      )}
    </Modal>
  );
  const toastView = <ToastView toast={toast} onClose={closeToast} />;
  if (owner && data && ['onboarding', 'approval'].includes(page))
    return (
      <>
        <SetupPage data={data} approval={page === 'approval'}>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {setupPanel()}
        </SetupPage>
        {modal}
        {toastView}
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
            setToast({ tone: 'error', title: 'Belum bisa keluar', message: (e as Error).message });
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
            <span aria-hidden="true">↻</span> {reloading ? 'Memuat…' : 'Muat ulang'}
          </button>
        </PageTitle>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {user.role === 'admin' ? (
          admin ? (
            <AdminPresentation
              data={admin}
              page={page}
              search={search}
              onDecision={(org, next) =>
                open({
                  title:
                    next === 'approved'
                      ? `Setujui ${org.name}?`
                      : next === 'rejected'
                        ? `Minta revisi ${org.name}`
                        : `Tangguhkan ${org.name}?`,
                  description:
                    next === 'suspended'
                      ? 'Semua outlet berhenti menerima booking publik. Data transaksi tetap tersimpan dan bisa diaktifkan kembali.'
                      : next === 'approved'
                        ? 'Owner dapat mulai beroperasi dan menerbitkan halaman booking outlet.'
                        : 'Owner akan melihat catatan ini dan dapat mengajukan ulang setelah memperbaiki setup.',
                  tone: next === 'approved' ? undefined : 'danger',
                  endpoint: `admin/orgs/${org.id}/status`,
                  summary: [
                    ['Bisnis', org.name],
                    ['Owner', org.owners?.[0]?.email],
                    ['Outlet', `${org.outlets} outlet`],
                    ['Status saat ini', labels[org.status] ?? org.status],
                  ],
                  fields: [
                    reasonField(
                      next === 'approved'
                        ? ['Setup lengkap dan sesuai', 'Masalah sudah diselesaikan']
                        : next === 'rejected'
                          ? ['Data layanan belum lengkap', 'Alamat outlet belum jelas']
                          : ['Pelanggaran ketentuan', 'Permintaan Owner'],
                      next === 'rejected' ? 'Catatan revisi untuk Owner' : 'Alasan',
                    ),
                  ],
                  map: (v) => ({ ...v, status: next }),
                  submit:
                    next === 'approved'
                      ? 'Setujui bisnis'
                      : next === 'rejected'
                        ? 'Kirim catatan revisi'
                        : 'Tangguhkan',
                  success: `${org.name}: ${labels[next]}.`,
                })
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
      {toastView}
    </>
  );
}
