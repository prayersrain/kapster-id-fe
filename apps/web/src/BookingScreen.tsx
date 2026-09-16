import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingLink, Catalog, Entity, rupiah, shortDate, today } from './api';
import { parseBookingLink } from './links';
import { Badge, Empty, Form } from './ui';
import { customerErrors } from './bookingRules';
import { Logo } from '../../../components/ui/Logo';
import { Glyph } from './Glyph';
import { BookingDates } from './BookingDates';
import s from '../../../components/booking/BookingExperience.module.css';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'K.';
export function BookingFrame({
  children,
  step,
  home = '/booking',
}: {
  children: ReactNode;
  step?: number;
  home?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0 });
  }, [step]);
  return (
    <main className={`${s.bookingStage} restored-booking`}>
      <div className={s.ambientOne} />
      <div className={s.ambientTwo} />
      <section className={s.phoneShell}>
        <div className={s.viewport} ref={viewport}>
          <nav className={s.topbar}>
            <Link to={home} aria-label="Kembali ke halaman barbershop">
              <Logo compact />
            </Link>
            <span className={s.secureBadge}>
              <Glyph name="lock" size={12} /> Booking resmi
            </span>
          </nav>
          {children}
        </div>
      </section>
    </main>
  );
}
type Props = {
  catalog: Catalog | null;
  step: number;
  error: string;
  outletId: string;
  serviceId: string;
  barberId: string;
  date: string;
  maxDate: string;
  time: string;
  slots: string[];
  loading: boolean;
  busy: boolean;
  customer: { name: string; phone: string };
  onStep: (step: number) => void;
  onOutlet: (id: string) => void;
  onService: (id: string) => void;
  onBarber: (id: string) => void;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
  onCustomer: (customer: { name: string; phone: string }) => void;
  onConfirm: () => void;
};
export function BookingScreen(p: Props) {
  const outlet = p.catalog?.outlets.find((o) => o.id === p.outletId);
  const shopName = p.catalog?.org?.name ?? outlet?.name ?? '';
  const service = p.catalog?.services.find((o) => o.id === p.serviceId);
  const barber = p.catalog?.barbers.find((o) => o.id === p.barberId);
  const names = [
    'Pilih outlet',
    'Pilih layanan',
    'Pilih kapster',
    'Pilih jadwal',
    'Data customer',
    'Review booking',
  ];
  const intros = [
    '',
    'Mau treatment apa?',
    'Pilih kapster favorit.',
    'Kapan Anda datang?',
    'Detail customer',
    'Cek sekali lagi.',
  ];
  const details = [
    '',
    'Pilih layanan yang sesuai dengan kebutuhan Anda.',
    'Setiap kapster siap membantu Anda tampil lebih rapi.',
    'Pilih tanggal dan waktu yang tersedia.',
    'Isi data agar outlet dapat mengenali booking Anda.',
    'Pastikan semua detail sudah sesuai sebelum konfirmasi.',
  ];
  const choices =
    p.step === 0
      ? p.catalog?.outlets
      : p.step === 1
        ? p.catalog?.services.filter((x) => x.outletId === p.outletId && x.active !== 0)
        : p.catalog?.barbers.filter((x) => x.outletId === p.outletId && x.active !== 0);
  const selectedId = [p.outletId, p.serviceId, p.barberId][p.step];
  const nextLabels = [
    `Lanjut di ${outlet?.name || 'outlet pilihan'}`,
    'Pilih Kapster',
    'Pilih Jadwal',
    'Isi Data Booking',
    '',
    'Konfirmasi booking · Bayar di outlet',
  ];
  return (
    <BookingFrame step={p.step} home={p.catalog?.org ? bookingLink(p.catalog.org.slug) : '/booking'}>
      {
        <div className={s.screen} key={p.step}>
          {p.step > 0 && (
            <header className={s.stepHeader}>
              <div className="booking-step-title">
                {p.step > 0 && (
                  <button
                    className={s.backButton}
                    aria-label="Kembali ke langkah sebelumnya"
                    disabled={p.busy}
                    onClick={() => p.onStep(p.step - 1)}
                  >
                    ←
                  </button>
                )}
                <strong>{names[p.step]}</strong>
                <span>{p.step} / 5</span>
              </div>
              <div className={s.progressTrack}>
                <span style={{ width: `${p.step * 20}%` }} />
              </div>
            </header>
          )}
          {p.step === 0 && (
            <div className={s.bookingHero}>
              <div className={s.heroImage} />
              <div className={s.heroShade} />
              <div className={s.heroContent}>
                <div className={s.officialPill}>
                  <span />
                  BOOKING RESMI BARBERSHOP
                </div>
                <h1>{shopName || 'Memuat barbershop…'}</h1>
                <p>
                  {(p.catalog?.outlets.length ?? 0) > 1
                    ? 'Pilih outlet terdekat, lalu atur layanan, kapster, dan jadwal Anda.'
                    : 'Pilih layanan, kapster, dan jadwal Anda. Tanpa akun, bayar di outlet.'}
                </p>
              </div>
            </div>
          )}
          <div className={p.step === 0 ? s.homeContent : s.stepContent}>
            {p.step === 0 ? (
              <>
                <article className={s.shopCard}>
                  <div className={s.shopIdentity}>
                    <span className={s.shopLogo}>{initials(shopName)}</span>
                    <span>
                      <strong>{shopName || 'Memuat…'}</strong>
                      <small>
                        {(p.catalog?.outlets.length ?? 0) > 1
                          ? `${p.catalog?.outlets.length} outlet menerima booking online`
                          : outlet?.address}
                      </small>
                    </span>
                  </div>
                  <div className={s.factList}>
                    <span>
                      <Glyph name="customer" size={12} /> Tanpa akun
                    </span>
                    <span>
                      <Glyph name="clock" size={12} /> Jadwal real-time
                    </span>
                    <span>Bayar di outlet</span>
                  </div>
                </article>
                <div className={s.sectionTitle}>
                  <div>
                    <span>LOKASI</span>
                    <h2>Pilih outlet</h2>
                  </div>
                  <small>{p.catalog?.outlets.length ?? 0} outlet</small>
                </div>
              </>
            ) : (
              <>
                <div className={s.outletMini}>
                  <span className={s.shopLogo}>{initials(shopName)}</span>
                  <span>
                    <strong>{outlet?.name}</strong>
                    <small>{outlet?.address}</small>
                  </span>
                </div>
                <div className={s.pageIntro}>
                  <span>{names[p.step].toUpperCase()}</span>
                  <h2>{intros[p.step]}</h2>
                  <p>{details[p.step]}</p>
                </div>
              </>
            )}
            {p.error && (
              <p className="error" role="alert">
                {p.error}
              </p>
            )}
            {!p.catalog ? (
              <p role="status">Memuat katalog…</p>
            ) : (
              <>
                {p.step <= 2 && (
                  <div className={s.optionList}>
                    {!choices?.length && (
                      <Empty>Belum ada pilihan tersedia. Silakan pilih outlet lain.</Empty>
                    )}
                    {choices?.map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={selectedId === item.id}
                        className={`${s.optionCard} ${p.step === 1 ? s.serviceCard : p.step === 2 ? s.barberCard : ''} ${selectedId === item.id ? s.selectedCard : ''}`}
                        onClick={() => [p.onOutlet, p.onService, p.onBarber][p.step](item.id)}
                      >
                        {p.step === 2 && (
                          <span className={s.barberAvatar}>{item.name.slice(0, 2).toUpperCase()}</span>
                        )}
                        <span className={s.optionBody}>
                          <span className={s.optionHeading}>
                            <strong>{item.name}</strong>
                            {p.step === 0 && <em>Booking aktif</em>}
                          </span>
                          <span className={s.optionAddress}>
                            {p.step === 0
                              ? item.address
                              : p.step === 1
                                ? `${item.duration} menit`
                                : 'Lihat jadwal tersedia'}
                          </span>
                          {p.step === 0 && (
                            <span className={s.optionMeta}>Pilih jadwal pada langkah berikutnya</span>
                          )}
                        </span>
                        {p.step === 1 ? (
                          <span className="service-choice-end">
                            <span className={s.servicePrice}>{rupiah(item.price)}</span>
                            <span className="selection-marker" aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="selection-marker" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {p.step === 3 && (
                  <>
                    <BookingDates value={p.date} max={p.maxDate} onChange={p.onDate} />
                    {p.loading ? (
                      <p role="status">Memeriksa jadwal…</p>
                    ) : !p.slots.length ? (
                      <Empty>Tidak ada slot tersedia. Coba tanggal atau kapster lain.</Empty>
                    ) : (
                      [
                        ['Pagi & siang', p.slots.filter((t) => t < '15:00')],
                        ['Sore & malam', p.slots.filter((t) => t >= '15:00')],
                      ].map(
                        ([name, times]) =>
                          (times as string[]).length > 0 && (
                            <section className={s.timeGroup} key={name as string}>
                              <div className={s.timeGroupTitle}>
                                <strong>{name as string}</strong>
                                <span>WIB</span>
                              </div>
                              <div className={s.timeGrid}>
                                {(times as string[]).map((t) => (
                                  <button
                                    key={t}
                                    className={`${s.timeButton} ${p.time === t ? s.selectedTime : ''}`}
                                    aria-pressed={p.time === t}
                                    onClick={() => p.onTime(t)}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </section>
                          ),
                      )
                    )}
                  </>
                )}
                {p.step === 4 && (
                  <>
                    <Form
                      fields={[
                        { key: 'name', label: 'Nama lengkap', value: p.customer.name },
                        {
                          key: 'phone',
                          label: 'Nomor WhatsApp',
                          type: 'tel',
                          value: p.customer.phone,
                          help: 'Contoh: 081234567890',
                        },
                      ]}
                      submit="Periksa booking"
                      onSubmit={async (values) => {
                        const problems = customerErrors({ name: values.name, phone: values.phone });
                        if (problems.name || problems.phone)
                          throw new Error([problems.name, problems.phone].filter(Boolean).join(' '));
                        p.onCustomer({ name: values.name, phone: values.phone });
                        p.onStep(5);
                      }}
                    />
                    <p className={s.privacyNote}>
                      ♧ Data Anda digunakan untuk keperluan booking di outlet pilihan.
                    </p>
                  </>
                )}
                {p.step === 5 && (
                  <div className={s.reviewStack}>
                    <article className={s.reviewCard}>
                      <div className={s.reviewCardHeader}>
                        <h3>Detail booking</h3>
                        <button onClick={() => p.onStep(1)}>Ubah</button>
                      </div>
                      <dl>
                        {[
                          ['Outlet', outlet?.name],
                          ['Layanan', service?.name],
                          ['Durasi', `${service?.duration} menit`],
                          ['Kapster', barber?.name],
                          ['Jadwal', `${shortDate(p.date)} · ${p.time} WIB`],
                          ['Customer', p.customer.name],
                          ['WhatsApp', p.customer.phone],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                    <article className={s.reviewCard}>
                      <div className={s.reviewCardHeader}>
                        <h3>Pembayaran</h3>
                        <span>Di outlet</span>
                      </div>
                      <p className="muted">Bayar tunai saat kunjungan Anda.</p>
                      <div className={s.totalRow}>
                        <span>Total pembayaran</span>
                        <strong>{rupiah(service?.price ?? 0)}</strong>
                      </div>
                    </article>
                    <p className={s.policyNote}>
                      Slot dipesan setelah konfirmasi berhasil. Hubungi outlet untuk perubahan jadwal atau
                      pembatalan.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          {p.step !== 4 && (
            <div className={s.fixedAction}>
              <button
                className={s.primaryButton}
                disabled={
                  !p.catalog ||
                  p.busy ||
                  (p.step <= 2 && !selectedId) ||
                  (p.step === 3 && (!p.time || p.loading))
                }
                onClick={() => (p.step === 5 ? p.onConfirm() : p.onStep(p.step + 1))}
              >
                {p.busy ? 'Menyimpan…' : nextLabels[p.step]} {p.step !== 5 && '→'}
              </button>
              <small>
                {p.step === 5 ? 'Pembayaran dilakukan langsung di outlet.' : 'Pilih sesuai kebutuhan Anda.'}
              </small>
            </div>
          )}
        </div>
      }
    </BookingFrame>
  );
}
export function BookingTicket({ data, error }: { data: Entity | null; error: string }) {
  return (
    <BookingFrame home={data?.orgSlug ? bookingLink(data.orgSlug) : '/booking'}>
      <div className={s.successScreen}>
        <div className={s.successGlow} />
        <div className={s.successContent}>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : !data ? (
            <p role="status">Memuat booking…</p>
          ) : (
            <>
              <div className={s.successIcon}>
                <Glyph name="receipt" size={30} />
              </div>
              <span className={s.bookingCode}>#{data.id.slice(0, 8).toUpperCase()}</span>
              <h1>Jadwal Anda sudah tercatat.</h1>
              <p>Simpan tautan pribadi ini untuk melihat status booking Anda.</p>
              <article className={s.successCard}>
                <div className={s.successShop}>
                  <span className={s.shopLogo}>{initials(data.orgName)}</span>
                  <span>
                    <strong>{data.outletName}</strong>
                    <small>{data.address}</small>
                  </span>
                </div>
                <div className={s.ticketDivider}>
                  <span />
                  <b>DETAIL BOOKING</b>
                  <span />
                </div>
                <dl>
                  {[
                    ['Customer', data.name],
                    ['Layanan', data.serviceName],
                    ['Kapster', data.barberName],
                    ['Jadwal', `${shortDate(data.date)} · ${data.time} WIB`],
                    ['Total', rupiah(data.price)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <Badge value={data.status} />
                    </dd>
                  </div>
                  <div>
                    <dt>Pembayaran</dt>
                    <dd>
                      {data.refundStatus === 'paid'
                        ? 'Uang sudah dikembalikan'
                        : data.paid
                          ? 'Tunai tercatat'
                          : 'Belum dibayar · tunai di outlet'}
                    </dd>
                  </div>
                </dl>
              </article>
              <button className={s.primaryButton} onClick={() => window.print()}>
                Cetak / simpan PDF
              </button>
              {data.orgSlug && (
                <Link className={s.secondaryButton} to={bookingLink(data.orgSlug)}>
                  Booking lagi di {data.orgName}
                </Link>
              )}
              <p className={s.policyNote}>Hubungi outlet untuk perubahan atau pembatalan.</p>
            </>
          )}
        </div>
      </div>
    </BookingFrame>
  );
}

export function BookingMissing({
  message,
  shop,
}: {
  message: string;
  shop?: { name: string; href: string };
}) {
  return (
    <BookingFrame home={shop?.href}>
      <div className={s.successScreen}>
        <div className={s.successContent}>
          <div className={s.successIcon} aria-hidden="true">
            ?
          </div>
          <h1>Halaman booking tidak tersedia</h1>
          <p>{message}</p>
          <p className={s.policyNote}>
            Pastikan link sesuai dengan yang dibagikan barbershop, misalnya lewat Instagram atau WhatsApp.
          </p>
          {shop ? (
            <Link className={s.primaryButton} to={shop.href}>
              Lihat outlet {shop.name}
            </Link>
          ) : (
            <Link className={s.secondaryButton} to="/booking">
              Masukkan link lain
            </Link>
          )}
        </div>
      </div>
    </BookingFrame>
  );
}
export function BookingDirectory() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const target = parseBookingLink(value);
  return (
    <BookingFrame>
      <div className={s.successScreen}>
        <div className={s.successContent}>
          <span className={s.bookingCode}>BOOKING KAPSTER.ID</span>
          <h1>Buka link booking barbershop Anda</h1>
          <p>
            Setiap barbershop punya link booking sendiri, contohnya <b>/booking/garasi-barber</b> atau link
            outlet seperti <b>/booking/garasi-barber/tebet</b>. Link biasanya dibagikan lewat Instagram,
            WhatsApp, atau QR di kasir.
          </p>
          <form
            className="booking-directory"
            onSubmit={(e) => {
              e.preventDefault();
              if (target) navigate(target);
            }}
          >
            <label htmlFor="shop-link">Link atau nama barbershop</label>
            <input
              id="shop-link"
              value={value}
              autoCapitalize="none"
              autoComplete="off"
              placeholder="garasi-barber"
              onChange={(e) => setValue(e.target.value)}
            />
            <button className={s.primaryButton} type="submit" disabled={!target}>
              Buka halaman booking →
            </button>
          </form>
        </div>
      </div>
    </BookingFrame>
  );
}
