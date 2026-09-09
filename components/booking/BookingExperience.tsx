'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Logo } from '../ui/Logo';
import styles from './BookingExperience.module.css';

type Screen = 'home' | 'service' | 'barber' | 'schedule' | 'customer' | 'review' | 'success';
type FieldErrors = Partial<Record<'name' | 'whatsapp' | 'email', string>>;

const OUTLETS = [
  { id: 'tebet', name: 'Tebet', area: 'Tebet, Jakarta Selatan', distance: '2,1 km', hours: '09.00–22.00' },
  { id: 'kemang', name: 'Kemang', area: 'Kemang, Jakarta Selatan', distance: '5,8 km', hours: '10.00–22.00' },
  { id: 'cipete', name: 'Cipete', area: 'Cipete, Jakarta Selatan', distance: '7,3 km', hours: '09.00–21.00' },
] as const;

const SERVICES = [
  { id: 'haircut', name: 'Haircut', description: 'Potong rambut + styling akhir', duration: 45, price: 65_000 },
  { id: 'haircut-wash', name: 'Haircut + Wash', description: 'Potong, keramas, dan hot towel', duration: 60, price: 85_000 },
  { id: 'premium-cut', name: 'Premium Cut', description: 'Konsultasi gaya, wash, dan treatment', duration: 75, price: 120_000 },
] as const;

const BARBERS = [
  { id: 'raka', name: 'Raka', initials: 'RK', specialty: 'Classic cut · Fade', experience: '4 tahun', rating: '4.9', bookings: 320 },
  { id: 'dimas', name: 'Dimas', initials: 'DM', specialty: 'Textured cut · Styling', experience: '3 tahun', rating: '4.8', bookings: 241 },
  { id: 'bagas', name: 'Bagas', initials: 'BG', specialty: 'Crop · Taper', experience: '5 tahun', rating: '4.9', bookings: 388 },
] as const;

const DATES = [
  { id: '2026-09-12', day: 'SAB', date: '12', month: 'SEP', label: 'Sab, 12 Sep 2026' },
  { id: '2026-09-13', day: 'MIN', date: '13', month: 'SEP', label: 'Min, 13 Sep 2026' },
  { id: '2026-09-14', day: 'SEN', date: '14', month: 'SEP', label: 'Sen, 14 Sep 2026' },
  { id: '2026-09-15', day: 'SEL', date: '15', month: 'SEP', label: 'Sel, 15 Sep 2026' },
  { id: '2026-09-16', day: 'RAB', date: '16', month: 'SEP', label: 'Rab, 16 Sep 2026' },
] as const;

const TIME_GROUPS = [
  { label: 'Pagi', slots: [{ time: '09.00', full: true }, { time: '10.00', full: false }, { time: '10.55', full: false }, { time: '11.50', full: false }, { time: '12.45', full: true }, { time: '13.40', full: false }] },
  { label: 'Sore', slots: [{ time: '15.30', full: false }, { time: '16.25', full: false }, { time: '17.20', full: true }, { time: '18.15', full: false }, { time: '19.10', full: false }, { time: '20.05', full: false }] },
] as const;

const PAYMENT_METHODS = [
  { id: 'qris', short: 'QR', name: 'QRIS', description: 'Scan melalui aplikasi pembayaran' },
  { id: 'virtual-account', short: 'VA', name: 'Virtual Account', description: 'Bayar melalui mobile atau internet banking' },
  { id: 'e-wallet', short: 'EW', name: 'E-Wallet', description: 'Bayar dari dompet digital pilihan Anda' },
] as const;

const STEP_META: Record<Exclude<Screen, 'home' | 'success'>, { title: string; step: number }> = {
  service: { title: 'Pilih layanan', step: 1 },
  barber: { title: 'Pilih kapster', step: 2 },
  schedule: { title: 'Pilih jadwal', step: 3 },
  customer: { title: 'Data booking', step: 4 },
  review: { title: 'Review & bayar', step: 5 },
};

const PREVIOUS_SCREEN: Partial<Record<Screen, Screen>> = {
  service: 'home',
  barber: 'service',
  schedule: 'barber',
  customer: 'schedule',
  review: 'customer',
};

function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat('id-ID').format(value)}`;
}

function validateCustomer(name: string, whatsapp: string, email: string): FieldErrors {
  const errors: FieldErrors = {};
  const cleanPhone = whatsapp.replace(/\D/g, '');

  if (name.trim().length < 3) errors.name = 'Masukkan nama lengkap minimal 3 karakter.';
  if (!/^(?:62|0)8\d{8,11}$/.test(cleanPhone)) errors.whatsapp = 'Gunakan nomor WhatsApp Indonesia yang valid.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email belum valid.';

  return errors;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>;
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>;
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
}

function MessageIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-3.8-.9L3 20.5l1.5-5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.5 8.5c.5 3 2 4.5 5 5"/></svg>;
}

function StepHeader({ screen, onBack }: { screen: Exclude<Screen, 'home' | 'success'>; onBack: () => void }) {
  const meta = STEP_META[screen];

  return (
    <header className={styles.stepHeader}>
      <div className={styles.stepRow}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Kembali ke langkah sebelumnya">
          <ArrowLeftIcon />
        </button>
        <div className={styles.stepCopy}>
          <strong>{meta.title}</strong>
          <span>Langkah {meta.step} dari 5</span>
        </div>
        <span className={styles.stepPercent}>{meta.step * 20}%</span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${meta.step * 20}%` }} />
      </div>
    </header>
  );
}

function FixedAction({ children }: { children: React.ReactNode }) {
  return <div className={styles.fixedAction}>{children}</div>;
}

export function BookingExperience() {
  const [screen, setScreen] = useState<Screen>('home');
  const [outletId, setOutletId] = useState<(typeof OUTLETS)[number]['id']>('tebet');
  const [serviceId, setServiceId] = useState<(typeof SERVICES)[number]['id']>('haircut');
  const [barberId, setBarberId] = useState<(typeof BARBERS)[number]['id']>('raka');
  const [dateId, setDateId] = useState<(typeof DATES)[number]['id']>('2026-09-12');
  const [time, setTime] = useState('10.55');
  const [name, setName] = useState('Andi Pratama');
  const [whatsapp, setWhatsapp] = useState('0812 3456 7890');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]['id']>('qris');
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const paymentTitleRef = useRef<HTMLHeadingElement>(null);

  const outlet = useMemo(() => OUTLETS.find((item) => item.id === outletId) ?? OUTLETS[0], [outletId]);
  const service = useMemo(() => SERVICES.find((item) => item.id === serviceId) ?? SERVICES[0], [serviceId]);
  const barber = useMemo(() => BARBERS.find((item) => item.id === barberId) ?? BARBERS[0], [barberId]);
  const bookingDate = useMemo(() => DATES.find((item) => item.id === dateId) ?? DATES[0], [dateId]);
  const schedule = `${bookingDate.label} · ${time}`;

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  useEffect(() => {
    if (paymentOpen) paymentTitleRef.current?.focus();
  }, [paymentOpen]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function navigate(next: Screen) {
    setScreen(next);
  }

  function back() {
    const previous = PREVIOUS_SCREEN[screen];
    if (previous) navigate(previous);
  }

  function continueFromCustomer() {
    const nextErrors = validateCustomer(name, whatsapp, email);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) navigate('review');
  }

  function submitPayment() {
    if (paying) return;
    setPaying(true);
    window.setTimeout(() => {
      setPaying(false);
      setPaymentOpen(false);
      navigate('success');
    }, 1100);
  }

  function restart() {
    setPaymentOpen(false);
    setPaying(false);
    navigate('home');
  }

  function showPrototypeNotice(message: string) {
    setNotice(message);
  }

  return (
    <main className={styles.bookingStage}>
      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />

      <section className={styles.phoneShell} aria-label="Prototype booking Garasi Barber">
        <div className={styles.viewport} ref={viewportRef}>
          <nav className={styles.topbar} aria-label="Navigasi booking">
            <Logo compact />
            <span className={styles.secureBadge}><LockIcon /> Booking resmi</span>
          </nav>

          {screen === 'home' && (
            <div className={styles.screen}>
              <section className={styles.bookingHero}>
                <div className={styles.heroImage} aria-hidden="true" />
                <div className={styles.heroShade} aria-hidden="true" />
                <div className={styles.heroContent}>
                  <span className={styles.officialPill}><span /> GARASI BARBER · OFFICIAL BOOKING</span>
                  <h1>Garasi Barber</h1>
                  <p>Potongan rapi, konsultasi gaya, dan pengalaman grooming yang nyaman.</p>
                </div>
              </section>

              <div className={styles.homeContent}>
                <article className={styles.shopCard}>
                  <div className={styles.shopIdentity}>
                    <span className={styles.shopLogo}>GB</span>
                    <span><strong>Garasi Barber</strong><small>Men&apos;s grooming · Jakarta Selatan</small></span>
                  </div>
                  <div className={styles.factList}>
                    <span>★ 4.9</span><span>Buka s.d. 22.00</span><span>Booking online</span>
                  </div>
                </article>

                <div className={styles.sectionTitle}>
                  <div><span>LOKASI TERDEKAT</span><h2>Pilih outlet</h2></div>
                  <small>{OUTLETS.length} outlet tersedia</small>
                </div>

                <div className={styles.optionList}>
                  {OUTLETS.map((item) => {
                    const selected = item.id === outletId;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`${styles.optionCard} ${selected ? styles.selectedCard : ''}`}
                        onClick={() => setOutletId(item.id)}
                        aria-pressed={selected}
                      >
                        <span className={styles.optionBody}>
                          <span className={styles.optionHeading}><strong>Garasi Barber {item.name}</strong><em>Buka</em></span>
                          <span className={styles.optionAddress}><PinIcon />{item.area}</span>
                          <span className={styles.optionMeta}><span>± {item.distance}</span><span><ClockIcon />{item.hours}</span></span>
                        </span>
                        <span className={styles.optionChevron}><ChevronIcon /></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <FixedAction>
                <button type="button" className={styles.primaryButton} onClick={() => navigate('service')}>
                  Lanjut di Garasi Barber {outlet.name}<ChevronIcon />
                </button>
              </FixedAction>
            </div>
          )}

          {screen === 'service' && (
            <div className={styles.screen}>
              <StepHeader screen="service" onBack={back} />
              <div className={styles.stepContent}>
                <div className={styles.outletMini}><span className={styles.shopLogo}>GB</span><span><strong>Garasi Barber {outlet.name}</strong><small>Outlet pilihan Anda</small></span></div>
                <div className={styles.pageIntro}><span>LAYANAN</span><h2>Mau treatment apa?</h2><p>Pilih satu layanan. Harga dan durasi akan dikunci untuk booking ini.</p></div>
                <div className={styles.optionList}>
                  {SERVICES.map((item) => {
                    const selected = item.id === serviceId;
                    return (
                      <button type="button" key={item.id} className={`${styles.optionCard} ${styles.serviceCard} ${selected ? styles.selectedCard : ''}`} onClick={() => setServiceId(item.id)} aria-pressed={selected}>
                        <span className={styles.optionBody}><strong>{item.name}</strong><small>{item.description} · {item.duration} menit</small></span>
                        <span className={styles.servicePrice}>{formatRupiah(item.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <FixedAction><button type="button" className={styles.primaryButton} onClick={() => navigate('barber')}>Pilih Kapster<ChevronIcon /></button></FixedAction>
            </div>
          )}

          {screen === 'barber' && (
            <div className={styles.screen}>
              <StepHeader screen="barber" onBack={back} />
              <div className={styles.stepContent}>
                <div className={styles.pageIntro}><span>KAPSTER TERSEDIA</span><h2>Pilih yang paling cocok.</h2><p>Semua kapster di bawah tersedia untuk layanan {service.name}.</p></div>
                <div className={styles.optionList}>
                  {BARBERS.map((item) => {
                    const selected = item.id === barberId;
                    return (
                      <button type="button" key={item.id} className={`${styles.optionCard} ${styles.barberCard} ${selected ? styles.selectedCard : ''}`} onClick={() => setBarberId(item.id)} aria-pressed={selected}>
                        <span className={styles.barberAvatar}>{item.initials}</span>
                        <span className={styles.optionBody}><strong>{item.name}</strong><small>{item.specialty} · {item.experience} pengalaman</small><em>★ {item.rating} · {item.bookings} booking</em></span>
                        <span className={styles.cardCheck}><CheckIcon /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <FixedAction><button type="button" className={styles.primaryButton} onClick={() => navigate('schedule')}>Pilih Jadwal<ChevronIcon /></button></FixedAction>
            </div>
          )}

          {screen === 'schedule' && (
            <div className={styles.screen}>
              <StepHeader screen="schedule" onBack={back} />
              <div className={styles.stepContent}>
                <div className={styles.pageIntro}><span>WAKTU KUNJUNGAN</span><h2>Kapan Anda datang?</h2><p>Waktu mengikuti zona outlet. Slot yang penuh tidak dapat dipilih.</p></div>
                <div className={styles.dateStrip} aria-label="Pilih tanggal">
                  {DATES.map((item) => {
                    const selected = item.id === dateId;
                    return (
                      <button type="button" key={item.id} className={`${styles.dateCard} ${selected ? styles.selectedDate : ''}`} onClick={() => setDateId(item.id)} aria-pressed={selected} aria-label={item.label}>
                        <small>{item.day}</small><strong>{item.date}</strong><small>{item.month}</small>
                      </button>
                    );
                  })}
                </div>
                {TIME_GROUPS.map((group) => (
                  <section className={styles.timeGroup} key={group.label}>
                    <div className={styles.timeGroupTitle}><strong>{group.label}</strong><span>WIB</span></div>
                    <div className={styles.timeGrid}>
                      {group.slots.map((slot) => (
                        <button
                          type="button"
                          key={slot.time}
                          className={`${styles.timeButton} ${time === slot.time ? styles.selectedTime : ''}`}
                          disabled={slot.full}
                          onClick={() => setTime(slot.time)}
                          aria-pressed={!slot.full && time === slot.time}
                        >
                          {slot.time}{slot.full && <small>Penuh</small>}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <FixedAction><button type="button" className={styles.primaryButton} onClick={() => navigate('customer')}>Isi Data Booking<ChevronIcon /></button></FixedAction>
            </div>
          )}

          {screen === 'customer' && (
            <div className={styles.screen}>
              <StepHeader screen="customer" onBack={back} />
              <div className={styles.stepContent}>
                <div className={styles.pageIntro}><span>TANPA PERLU AKUN</span><h2>Detail customer</h2><p>Data hanya digunakan untuk booking dan komunikasi terkait jadwal.</p></div>
                <form className={styles.customerForm} noValidate onSubmit={(event) => { event.preventDefault(); continueFromCustomer(); }}>
                  <label className={styles.field}>
                    <span>Nama lengkap</span>
                    <input value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }} autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
                    {errors.name && <small id="name-error" className={styles.fieldError}>{errors.name}</small>}
                  </label>
                  <label className={styles.field}>
                    <span>Nomor WhatsApp</span>
                    <div className={styles.phoneInput}><b>🇮🇩</b><input value={whatsapp} onChange={(event) => { setWhatsapp(event.target.value); setErrors((current) => ({ ...current, whatsapp: undefined })); }} inputMode="tel" autoComplete="tel" maxLength={20} aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? 'whatsapp-error' : 'whatsapp-help'} /></div>
                    {errors.whatsapp ? <small id="whatsapp-error" className={styles.fieldError}>{errors.whatsapp}</small> : <small id="whatsapp-help">Kasir dapat menghubungi nomor ini jika ada perubahan jadwal.</small>}
                  </label>
                  <label className={styles.field}>
                    <span>Email <em>(opsional)</em></span>
                    <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })); }} autoComplete="email" placeholder="nama@email.com" maxLength={120} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
                    {errors.email && <small id="email-error" className={styles.fieldError}>{errors.email}</small>}
                  </label>
                  <button type="submit" className={styles.visuallyHidden}>Review booking</button>
                </form>
                <div className={styles.privacyNote}><LockIcon /><span><strong>Data Anda tetap aman.</strong> Kapster.id tidak akan meminta password atau kode OTP customer.</span></div>
              </div>
              <FixedAction><button type="button" className={styles.primaryButton} onClick={continueFromCustomer}>Review Booking<ChevronIcon /></button></FixedAction>
            </div>
          )}

          {screen === 'review' && (
            <div className={styles.screen}>
              <StepHeader screen="review" onBack={back} />
              <div className={styles.stepContent}>
                <div className={styles.pageIntro}><span>LANGKAH TERAKHIR</span><h2>Cek sekali lagi.</h2><p>Pastikan semua detail sudah benar sebelum melakukan pembayaran.</p></div>
                <div className={styles.reviewStack}>
                  <article className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}><h3>Detail booking</h3><button type="button" onClick={() => navigate('service')}>Ubah</button></div>
                    <dl>
                      <div><dt>Outlet</dt><dd>Garasi Barber {outlet.name}</dd></div>
                      <div><dt>Layanan</dt><dd>{service.name}<small>{service.duration} menit</small></dd></div>
                      <div><dt>Kapster</dt><dd>{barber.name}</dd></div>
                      <div><dt>Jadwal</dt><dd>{schedule}<small>Waktu Indonesia Barat</small></dd></div>
                      <div><dt>Customer</dt><dd>{name.trim()}</dd></div>
                    </dl>
                  </article>
                  <article className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}><h3>Pembayaran</h3><span>Lunas online</span></div>
                    <dl><div><dt>Harga layanan</dt><dd>{formatRupiah(service.price)}</dd></div><div><dt>Biaya layanan</dt><dd>Rp0</dd></div></dl>
                    <div className={styles.totalRow}><span>Total bayar</span><strong>{formatRupiah(service.price)}</strong></div>
                  </article>
                  <div className={styles.policyNote}><InfoIcon /><span>Dengan melanjutkan, Anda menyetujui <button type="button" onClick={() => showPrototypeNotice('Halaman kebijakan akan tersedia pada versi berikutnya.')}>kebijakan pembatalan dan no-show</button> outlet.</span></div>
                </div>
              </div>
              <FixedAction><button type="button" className={styles.primaryButton} onClick={() => setPaymentOpen(true)}>Bayar {formatRupiah(service.price)}</button></FixedAction>
            </div>
          )}

          {screen === 'success' && (
            <div className={`${styles.screen} ${styles.successScreen}`}>
              <div className={styles.successGlow} aria-hidden="true" />
              <div className={styles.successContent}>
                <span className={styles.successIcon}><CheckIcon /></span>
                <span className={styles.bookingCode}>BOOKING #GB-0912-1055</span>
                <h1>Booking berhasil.</h1>
                <p>Pembayaran dummy sudah dikonfirmasi. Simpan detail ini untuk ditunjukkan saat datang.</p>
                <article className={styles.successCard}>
                  <div className={styles.successShop}><span className={styles.shopLogo}>GB</span><span><strong>Garasi Barber {outlet.name}</strong><small>{outlet.area}</small></span></div>
                  <div className={styles.ticketDivider}><span /><b>DETAIL BOOKING</b><span /></div>
                  <dl>
                    <div><dt>Layanan</dt><dd>{service.name}</dd></div>
                    <div><dt>Kapster</dt><dd>{barber.name}</dd></div>
                    <div><dt>Jadwal</dt><dd>{schedule}</dd></div>
                    <div><dt>Status</dt><dd className={styles.paidStatus}><span />Confirmed · Paid</dd></div>
                  </dl>
                </article>
                <button type="button" className={styles.primaryButton} onClick={() => showPrototypeNotice('Prototype: detail booking siap dikirim ke WhatsApp.')}><MessageIcon />Kirim Detail ke WhatsApp</button>
                <button type="button" className={styles.secondaryButton} onClick={() => showPrototypeNotice('Prototype: jadwal siap ditambahkan ke kalender.')}><CalendarIcon />Simpan ke Kalender</button>
                <button type="button" className={styles.textButton} onClick={restart}>Buat booking lain</button>
              </div>
            </div>
          )}
        </div>

        {paymentOpen && (
          <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !paying) setPaymentOpen(false); }}>
            <section className={styles.paymentSheet} role="dialog" aria-modal="true" aria-labelledby="payment-title">
              <span className={styles.sheetHandle} aria-hidden="true" />
              <div className={styles.sheetHeader}>
                <div><span>PEMBAYARAN AMAN</span><h2 id="payment-title" ref={paymentTitleRef} tabIndex={-1}>Pilih metode bayar</h2><p>Ini simulasi. Tidak ada transaksi uang nyata.</p></div>
                <button type="button" className={styles.closeButton} onClick={() => setPaymentOpen(false)} disabled={paying} aria-label="Tutup pilihan pembayaran">×</button>
              </div>
              <div className={styles.paymentMethods}>
                {PAYMENT_METHODS.map((method) => {
                  const selected = method.id === paymentMethod;
                  return (
                    <button type="button" key={method.id} className={`${styles.paymentMethod} ${selected ? styles.selectedPayment : ''}`} onClick={() => setPaymentMethod(method.id)} aria-pressed={selected} disabled={paying}>
                      <span className={styles.methodIcon}>{method.short}</span><span><strong>{method.name}</strong><small>{method.description}</small></span><i />
                    </button>
                  );
                })}
              </div>
              <div className={styles.paymentTotal}><span>Total pembayaran</span><strong>{formatRupiah(service.price)}</strong></div>
              <button type="button" className={styles.primaryButton} onClick={submitPayment} disabled={paying}>{paying ? <><span className={styles.spinner} />Memproses pembayaran…</> : `Bayar ${formatRupiah(service.price)}`}</button>
            </section>
          </div>
        )}
      </section>

      <aside className={styles.prototypeNote}><span>●</span><strong>Interactive prototype</strong><small>Data & pembayaran dummy</small></aside>
      {notice && <div className={styles.toast} role="status"><CheckIcon />{notice}</div>}
    </main>
  );
}
