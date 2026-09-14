import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, Catalog, Entity, rupiah, today } from './api';
import { Badge, Card, Empty, Form } from './ui';
import { Logo } from '../../../components/ui/Logo';

export function Booking({
  internal = false,
  catalog: supplied,
  onBooked,
}: {
  internal?: boolean;
  catalog?: Catalog;
  onBooked?: () => void;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(supplied ?? null),
    [error, setError] = useState(''),
    [step, setStep] = useState(0);
  const [outletId, setOutlet] = useState(''),
    [serviceId, setService] = useState(''),
    [barberId, setBarber] = useState('');
  const [date, setDate] = useState(today()),
    [time, setTime] = useState(''),
    [slots, setSlots] = useState<string[]>([]),
    [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '' }),
    [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Entity | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!supplied)
      api<Catalog>('public/catalog')
        .then(setCatalog)
        .catch((e) => setError(e.message));
  }, [supplied]);
  useEffect(() => {
    if (!outletId || !serviceId || !barberId) return;
    const controller = new AbortController();
    setTime('');
    setSlots([]);
    setLoading(true);
    setError('');
    api<{ slots: string[] }>(
      `${internal ? 'app' : 'public'}/slots?${new URLSearchParams({ outletId, serviceId, barberId, date })}`,
      undefined,
      'GET',
      controller.signal,
    )
      .then((data) => setSlots(data.slots))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [outletId, serviceId, barberId, date, internal]);
  const service = catalog?.services.find((s) => s.id === serviceId),
    barber = catalog?.barbers.find((b) => b.id === barberId),
    outlet = catalog?.outlets.find((o) => o.id === outletId);
  const steps = ['Outlet', 'Layanan', 'Kapster', 'Jadwal', 'Data Anda', 'Konfirmasi'];
  const maxDate = new Date(Date.now() + 30 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10);
  const content = (
    <>
      <div className="booking-title">
        <span className="eyebrow">{internal ? 'BOOKING KASIR / WALK-IN' : 'RESERVASI BARBERSHOP'}</span>
        <h1>{result ? 'Booking tersimpan' : 'Waktu terbaik untuk tampil rapi.'}</h1>
        <p className="muted">
          {internal
            ? 'Pilih slot yang tersedia pada outlet shift Anda.'
            : 'Pilih layanan dan jadwal. Pembayaran tunai dilakukan di outlet.'}
        </p>
      </div>
      {result ? (
        <Card title="Booking berhasil dicatat">
          <p>
            Kode: <strong>{result.id.slice(0, 8).toUpperCase()}</strong>
          </p>
          <p>Booking sudah masuk ke antrean outlet. Pembayaran belum dicatat.</p>
          <div className="actions">
            <Link className="primary" to={`/booking/status/${result.token}`}>
              Lihat detail booking
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setStep(0);
                setTime('');
              }}
            >
              Buat booking lain
            </button>
          </div>
        </Card>
      ) : (
        <>
          <ol className="stepper">
            {steps.map((s, i) => (
              <li key={s} className={i === step ? 'current' : i < step ? 'done' : ''}>
                <span>{i < step ? '✓' : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <Card title={`${step + 1}. ${steps[step]}`}>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {!catalog ? (
              <p role="status">Memuat katalog…</p>
            ) : (
              <>
                {step === 0 && (
                  <div className="choice-grid">
                    {catalog.outlets.length === 0 && <Empty>Belum ada outlet yang tersedia.</Empty>}
                    {catalog.outlets.map((o) => (
                      <button
                        key={o.id}
                        className="choice"
                        onClick={() => {
                          setOutlet(o.id);
                          setService('');
                          setBarber('');
                          setStep(1);
                        }}
                      >
                        <span className="choice-icon">⌂</span>
                        <strong>{o.name}</strong>
                        <small>{o.address}</small>
                        <b>Pilih outlet →</b>
                      </button>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <div className="choice-grid">
                    {catalog.services
                      .filter((s) => s.outletId === outletId && s.active !== 0)
                      .map((s) => (
                        <button
                          key={s.id}
                          className="choice"
                          onClick={() => {
                            setService(s.id);
                            setBarber('');
                            setStep(2);
                          }}
                        >
                          <span className="choice-icon">✂</span>
                          <strong>{s.name}</strong>
                          <small>{s.duration} menit · buffer 10 menit</small>
                          <b>{rupiah(s.price)}</b>
                        </button>
                      ))}
                  </div>
                )}
                {step === 2 && (
                  <div className="choice-grid">
                    {catalog.barbers
                      .filter((b) => b.outletId === outletId && b.active !== 0)
                      .map((b) => (
                        <button
                          key={b.id}
                          className="choice"
                          onClick={() => {
                            setBarber(b.id);
                            setStep(3);
                          }}
                        >
                          <span className="avatar">{b.name.slice(0, 2).toUpperCase()}</span>
                          <strong>{b.name}</strong>
                          <small>Lihat jadwal tersedia →</small>
                        </button>
                      ))}
                  </div>
                )}
                {step === 3 && (
                  <>
                    <label className="field">
                      <span>Tanggal kunjungan (WIB)</span>
                      <input
                        type="date"
                        value={date}
                        min={today()}
                        max={maxDate}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </label>
                    {loading ? (
                      <p role="status">Memeriksa jadwal…</p>
                    ) : slots.length ? (
                      <div className="slots">
                        {slots.map((s) => (
                          <button
                            key={s}
                            className={time === s ? 'selected' : ''}
                            aria-pressed={time === s}
                            onClick={() => setTime(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Empty>Tidak ada slot tersedia. Coba tanggal atau kapster lain.</Empty>
                    )}
                    <button className="primary" disabled={!time || loading} onClick={() => setStep(4)}>
                      Lanjutkan
                    </button>
                  </>
                )}
                {step === 4 && (
                  <Form
                    fields={[
                      { key: 'name', label: 'Nama lengkap', value: customer.name },
                      {
                        key: 'phone',
                        label: 'Nomor WhatsApp',
                        type: 'tel',
                        value: customer.phone,
                        help: 'Contoh: 081234567890. Nomor digunakan untuk keperluan booking.',
                      },
                    ]}
                    submit="Periksa booking"
                    onSubmit={async (values) => {
                      if (
                        values.name.trim().length < 2 ||
                        !/^(?:0|62|\+62)8[\d\s-]{8,15}$/.test(values.phone)
                      )
                        throw new Error('Periksa nama dan nomor WhatsApp Anda.');
                      setCustomer({ name: values.name, phone: values.phone });
                      setStep(5);
                    }}
                  />
                )}
                {step === 5 && (
                  <>
                    <dl className="summary">
                      <div>
                        <dt>Outlet</dt>
                        <dd>{outlet?.name}</dd>
                      </div>
                      <div>
                        <dt>Layanan</dt>
                        <dd>{service?.name}</dd>
                      </div>
                      <div>
                        <dt>Kapster</dt>
                        <dd>{barber?.name}</dd>
                      </div>
                      <div>
                        <dt>Jadwal</dt>
                        <dd>
                          {date} · {time} WIB
                        </dd>
                      </div>
                      <div>
                        <dt>Customer</dt>
                        <dd>
                          {customer.name} · {customer.phone}
                        </dd>
                      </div>
                      <div>
                        <dt>Total, bayar di outlet</dt>
                        <dd>{rupiah(service?.price ?? 0)}</dd>
                      </div>
                    </dl>
                    <p className="notice">
                      Slot baru dipesan setelah konfirmasi berhasil. Untuk membatalkan atau mengubah jadwal,
                      hubungi outlet. Belum ada pembayaran online atau pengiriman WhatsApp otomatis.
                    </p>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setError('');
                        try {
                          const data = await api(`${internal ? 'app' : 'public'}/bookings`, {
                            outletId,
                            serviceId,
                            barberId,
                            date,
                            time,
                            ...customer,
                          });
                          if (internal) {
                            setResult(data);
                            onBooked?.();
                          } else navigate(`/booking/status/${data.token}`);
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? 'Menyimpan…' : 'Konfirmasi booking · Bayar di outlet'}
                    </button>
                  </>
                )}
              </>
            )}
            {step > 0 && (
              <button
                className="back"
                disabled={busy}
                onClick={() => {
                  setStep((s) => s - 1);
                  setError('');
                }}
              >
                ← Kembali
              </button>
            )}
          </Card>
        </>
      )}
    </>
  );
  return internal ? (
    content
  ) : (
    <div className="public-page">
      <header className="public-header">
        <a href="http://127.0.0.1:3000">
          <Logo />
        </a>
        <Link to="/login">Login pengelola →</Link>
      </header>
      <main className="booking-wrap">{content}</main>
      <footer className="public-footer">Kapster.id · Booking tanpa akun · Waktu Indonesia Barat</footer>
    </div>
  );
}
export function BookingStatus() {
  const { token } = useParams(),
    [data, setData] = useState<Entity | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    const load = () =>
      api(`public/bookings/${token}`)
        .then(setData)
        .catch((e) => setError(e.message));
    void load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [token]);
  return (
    <main className="booking-wrap">
      <Link to="/booking">
        <Logo />
      </Link>
      <div className="booking-title">
        <span className="eyebrow">DETAIL RESERVASI</span>
        <h1>Jadwal Anda sudah tercatat.</h1>
        <p className="muted">Simpan tautan ini untuk memeriksa status. Tautan bersifat pribadi.</p>
      </div>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : !data ? (
        <p role="status">Memuat booking…</p>
      ) : (
        <Card title={`Booking ${data.id.slice(0, 8).toUpperCase()}`} action={<Badge value={data.status} />}>
          <dl className="summary">
            {[
              ['Customer', data.name],
              ['Outlet', data.outletName],
              ['Alamat', data.address],
              ['Layanan', data.serviceName],
              ['Kapster', data.barberName],
              ['Jadwal', `${data.date} · ${data.time} WIB`],
              ['Total', rupiah(data.price)],
              [
                'Pembayaran',
                data.refundStatus === 'paid'
                  ? 'Uang sudah dikembalikan'
                  : data.paid
                    ? 'Tunai tercatat'
                    : 'Belum dibayar · tunai di outlet',
              ],
            ].map(([a, b]) => (
              <div key={a}>
                <dt>{a}</dt>
                <dd>{b}</dd>
              </div>
            ))}
          </dl>
          <p className="notice">
            Hubungi outlet untuk perubahan atau pembatalan. Konfirmasi WhatsApp otomatis belum tersedia.
          </p>
          <div className="actions">
            <button onClick={() => window.print()}>Cetak / simpan PDF</button>
            <Link className="primary" to="/booking">
              Booking lainnya
            </Link>
          </div>
        </Card>
      )}
    </main>
  );
}
