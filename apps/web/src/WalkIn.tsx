import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, AppData, dayLabel, Entity, rupiah, today, User, WEEKDAY_NAMES } from './api';
import { bookingMaxDate, customerErrors } from './bookingRules';
import { Glyph } from './Glyph';

type Availability =
  | { state: 'loading' }
  | { state: 'off' }
  | { state: 'blocked'; reason: string }
  | { state: 'ready'; slots: string[] }
  | { state: 'error'; message: string };

const weekday = (date: string) => new Date(`${date}T12:00:00+07:00`).getUTCDay();
const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Cashier point-of-sale for customers who walk in: pick, check the summary, put them in the queue. */
export function WalkIn({
  data,
  user,
  shift,
  onBooked,
}: {
  data: AppData;
  user: User;
  shift: Entity;
  onBooked: () => void;
}) {
  const outlet = data.outlets.find((o) => o.id === shift.outletId);
  const services = data.services.filter((s) => s.outletId === shift.outletId && s.active);
  const barbers = data.barbers.filter((b) => b.outletId === shift.outletId && b.active);
  const [date, setDate] = useState(today()),
    [serviceId, setServiceId] = useState(''),
    [barberId, setBarberId] = useState(''),
    [time, setTime] = useState(''),
    [customer, setCustomer] = useState({ name: '', phone: '' }),
    [touched, setTouched] = useState(false),
    [availability, setAvailability] = useState<Record<string, Availability>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState<Entity | null>(null);
  const submitting = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null),
    phoneInput = useRef<HTMLInputElement>(null),
    summary = useRef<HTMLElement>(null);
  const service = services.find((s) => s.id === serviceId);
  const barber = barbers.find((b) => b.id === barberId);
  const tomorrow = new Date(Date.parse(`${today()}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  // Everything the server uses to compute free slots. Data reloads bring new objects every time, so
  // availability is re-checked only when one of these values actually changes: kapster hours and days,
  // the service duration, leave blocks, or bookings on the chosen date.
  const scheduleKey = JSON.stringify([
    service?.duration,
    barbers.map((b) => [b.id, b.start, b.end, b.days]),
    data.blocks.filter((x) => x.date === date).map((x) => [x.id, x.barberId]),
    data.bookings
      .filter((x) => x.outletId === shift.outletId && x.date === date)
      .map((x) => [x.id, x.barberId, x.starts, x.ends, x.status]),
  ]);
  // A service or kapster deactivated elsewhere disappears from the lists; drop it from the selection too.
  useEffect(() => {
    if (serviceId && !service) setServiceId('');
    if (barberId && !barber) setBarberId('');
    if ((serviceId && !service) || (barberId && !barber)) setTime('');
  }, [serviceId, service, barberId, barber]);

  const refresh = useCallback(
    (signal?: AbortSignal) => {
      if (!serviceId) return setAvailability({});
      const next: Record<string, Availability> = {};
      const pending: Entity[] = [];
      for (const b of barbers) {
        const block = data.blocks.find((x) => x.barberId === b.id && x.date === date);
        if (!JSON.parse(b.days).includes(weekday(date))) next[b.id] = { state: 'off' };
        else if (block) next[b.id] = { state: 'blocked', reason: block.reason };
        else {
          next[b.id] = { state: 'loading' };
          pending.push(b);
        }
      }
      setAvailability(next);
      for (const b of pending)
        api<{ slots: string[] }>(
          `app/slots?${new URLSearchParams({ outletId: shift.outletId, serviceId, barberId: b.id, date })}`,
          undefined,
          'GET',
          signal,
        )
          .then((r) => setAvailability((a) => ({ ...a, [b.id]: { state: 'ready', slots: r.slots } })))
          .catch((e) => {
            if (e.name !== 'AbortError')
              setAvailability((a) => ({ ...a, [b.id]: { state: 'error', message: e.message } }));
          });
    },
    [serviceId, date, shift.outletId, scheduleKey],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const current = barberId ? availability[barberId] : undefined;
  const slots = current?.state === 'ready' ? current.slots : [];
  // The chosen time is only valid while the latest check lists it. Once that check has finished with any
  // other outcome (taken, leave, day off, error), release the selection. While a check is still running
  // the selection stays visible, but submit waits for the result.
  const timeConfirmed = slots.includes(time);
  useEffect(() => {
    if (time && current && current.state !== 'loading' && !timeConfirmed) setTime('');
  }, [current, time, timeConfirmed]);

  const errors = customerErrors(customer);
  const missing = [!service && 'layanan', !barber && 'kapster', !time && 'jam'].filter(Boolean) as string[];
  const pick = (patch: () => void) => {
    patch();
    setResult(null);
    setError('');
  };

  async function submit() {
    if (submitting.current) return;
    setTouched(true);
    setError('');
    if (missing.length) {
      setError(`Pilih ${missing.join(', ')} terlebih dahulu.`);
      return;
    }
    if (errors.name || errors.phone) {
      (errors.name ? nameInput : phoneInput).current?.focus();
      summary.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (!timeConfirmed) {
      if (current?.state === 'loading')
        setError('Jadwal kapster sedang diperiksa ulang. Tunggu sebentar, lalu tekan lagi.');
      else {
        setTime('');
        setError('Jam yang dipilih sudah tidak tersedia. Pilih jam lain.');
      }
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const created = await api('app/bookings', {
        outletId: shift.outletId,
        serviceId,
        barberId,
        date,
        time,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
      });
      setResult({
        ...created,
        name: customer.name.trim(),
        serviceName: service!.name,
        price: service!.price,
        barberName: barber!.name,
        date,
        time,
      });
      setServiceId('');
      setBarberId('');
      setTime('');
      setCustomer({ name: '', phone: '' });
      setTouched(false);
      onBooked();
    } catch (e) {
      const message = (e as Error).message;
      if (e instanceof ApiError && e.status === 409) {
        setError(`${message} Daftar jam kosong sudah diperbarui.`);
        setTime('');
        refresh();
      } else setError(message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const queuePath =
    user.role === 'cashier' ? (result?.date === today() ? '/kasir' : '/kasir/bookings') : '/owner/bookings';
  const barberNote = (b: Entity) => {
    const a = availability[b.id];
    if (!serviceId) return 'Pilih layanan untuk melihat jam kosong';
    if (!a || a.state === 'loading') return 'Memeriksa jadwal…';
    if (a.state === 'off') return `Libur hari ${WEEKDAY_NAMES[weekday(date)]}`;
    if (a.state === 'blocked') return `Cuti · ${a.reason}`;
    if (a.state === 'error') return a.message;
    if (!a.slots.length) return date === today() ? 'Penuh untuk sisa hari ini' : 'Penuh di tanggal ini';
    return `Paling cepat ${a.slots[0]} · ${a.slots.length} jam kosong`;
  };

  if (!services.length || !barbers.length)
    return (
      <section className="walkin-blocked">
        <h2>Outlet belum siap menerima walk-in</h2>
        <p>
          {outlet?.name} membutuhkan minimal satu layanan dan satu kapster aktif. Minta Owner melengkapinya
          dari dashboard.
        </p>
      </section>
    );

  return (
    <div className="walkin">
      <div className="walkin-layout">
        <div className="walkin-main">
          <section className="walkin-context" aria-label="Outlet dan tanggal">
            <div className="walkin-outlet">
              <Glyph name="store" size={18} />
              <div>
                <small>Outlet sesuai shift</small>
                <strong>{outlet?.name}</strong>
              </div>
            </div>
            <div className="walkin-dates" role="group" aria-label="Tanggal kunjungan">
              {[
                [today(), 'Hari ini'],
                [tomorrow, 'Besok'],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={date === value}
                  onClick={() =>
                    pick(() => {
                      setDate(value);
                      setTime('');
                    })
                  }
                >
                  {label}
                </button>
              ))}
              <label className={![today(), tomorrow].includes(date) ? 'is-active' : ''}>
                <span>Tanggal lain</span>
                <input
                  type="date"
                  value={date}
                  min={today()}
                  max={bookingMaxDate()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value)
                      pick(() => {
                        setDate(value);
                        setTime('');
                      });
                  }}
                />
              </label>
            </div>
          </section>

          <section className="walkin-section" aria-labelledby="walkin-services">
            <header>
              <span className="walkin-step">1</span>
              <h2 id="walkin-services">Layanan</h2>
            </header>
            <div className="walkin-grid" role="group" aria-label="Pilih layanan">
              {services.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className="walkin-tile"
                  aria-pressed={serviceId === s.id}
                  onClick={() =>
                    pick(() => {
                      setServiceId(s.id);
                      setTime('');
                    })
                  }
                >
                  <span className="walkin-marker" aria-hidden="true" />
                  <strong>{s.name}</strong>
                  <small>{s.duration} menit</small>
                  <b>{rupiah(s.price)}</b>
                </button>
              ))}
            </div>
          </section>

          <section className="walkin-section" aria-labelledby="walkin-barbers">
            <header>
              <span className="walkin-step">2</span>
              <h2 id="walkin-barbers">Kapster</h2>
              {serviceId && (
                <button type="button" className="walkin-refresh" onClick={() => refresh()}>
                  <Glyph name="refresh" size={14} /> Perbarui jam
                </button>
              )}
            </header>
            <div className="walkin-grid walkin-barbers" role="group" aria-label="Pilih kapster">
              {barbers.map((b) => {
                const a = availability[b.id];
                const open = a?.state === 'ready' && a.slots.length > 0;
                return (
                  <button
                    type="button"
                    key={b.id}
                    className={`walkin-tile walkin-barber ${serviceId && !open ? 'is-unavailable' : ''}`}
                    aria-pressed={barberId === b.id}
                    disabled={!serviceId || (!!a && a.state !== 'loading' && !open)}
                    onClick={() =>
                      pick(() => {
                        setBarberId(b.id);
                        setTime('');
                      })
                    }
                  >
                    <span className="walkin-marker" aria-hidden="true" />
                    <span className="walkin-avatar" aria-hidden="true">
                      {initials(b.name)}
                    </span>
                    <strong>{b.name}</strong>
                    <small className={open ? 'is-open' : ''}>{barberNote(b)}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="walkin-section" aria-labelledby="walkin-times">
            <header>
              <span className="walkin-step">3</span>
              <h2 id="walkin-times">Jam · {dayLabel(date)}</h2>
            </header>
            {!barber ? (
              <p className="walkin-empty">Pilih layanan dan kapster untuk melihat jam yang tersedia.</p>
            ) : !slots.length ? (
              <p className="walkin-empty">{barberNote(barber)}</p>
            ) : (
              <div className="walkin-times" role="group" aria-label="Pilih jam">
                {slots.map((t, i) => (
                  <button
                    type="button"
                    key={t}
                    aria-pressed={time === t}
                    onClick={() => pick(() => setTime(t))}
                  >
                    {t}
                    {i === 0 && <small>Paling cepat</small>}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="walkin-summary" ref={summary} aria-labelledby="walkin-summary-title">
          {result ? (
            <div className="walkin-result" role="status">
              <span className="walkin-eyebrow">Masuk antrean</span>
              <h2 id="walkin-summary-title">{result.name}</h2>
              <p>
                {dayLabel(result.date)} · {result.time} WIB bersama {result.barberName}
              </p>
              <dl>
                <div>
                  <dt>Kode</dt>
                  <dd>#{String(result.id).slice(0, 8).toUpperCase()}</dd>
                </div>
                <div>
                  <dt>Layanan</dt>
                  <dd>{result.serviceName}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{rupiah(result.price)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Menunggu check-in · belum bayar</dd>
                </div>
              </dl>
              <p className="walkin-note">
                Check-in, mulai layanan, dan pembayaran tunai dicatat dari antrean.
              </p>
              <Link className="primary" to={queuePath}>
                Lihat antrean
              </Link>
              <button type="button" className="ghost-button" onClick={() => setResult(null)}>
                Tambah customer berikutnya
              </button>
            </div>
          ) : (
            <form
              className="walkin-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <h2 id="walkin-summary-title">Ringkasan kunjungan</h2>
              <div className={`walkin-field ${touched && errors.name ? 'has-error' : ''}`}>
                <label htmlFor="walkin-name">Nama customer</label>
                <input
                  id="walkin-name"
                  ref={nameInput}
                  value={customer.name}
                  autoComplete="off"
                  maxLength={120}
                  aria-invalid={touched && !!errors.name}
                  aria-describedby={touched && errors.name ? 'walkin-name-error' : undefined}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                />
                {touched && errors.name && (
                  <small id="walkin-name-error" className="field-error">
                    {errors.name}
                  </small>
                )}
              </div>
              <div className={`walkin-field ${touched && errors.phone ? 'has-error' : ''}`}>
                <label htmlFor="walkin-phone">Nomor WhatsApp</label>
                <input
                  id="walkin-phone"
                  ref={phoneInput}
                  type="tel"
                  inputMode="tel"
                  value={customer.phone}
                  autoComplete="off"
                  placeholder="081234567890"
                  aria-invalid={touched && !!errors.phone}
                  aria-describedby={touched && errors.phone ? 'walkin-phone-error' : undefined}
                  onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                />
                {touched && errors.phone && (
                  <small id="walkin-phone-error" className="field-error">
                    {errors.phone}
                  </small>
                )}
              </div>
              <dl className="walkin-lines">
                <div>
                  <dt>Layanan</dt>
                  <dd>{service?.name ?? <em>Belum dipilih</em>}</dd>
                </div>
                <div>
                  <dt>Kapster</dt>
                  <dd>{barber?.name ?? <em>Belum dipilih</em>}</dd>
                </div>
                <div>
                  <dt>Waktu</dt>
                  <dd>{time ? `${dayLabel(date)} · ${time} WIB` : <em>Belum dipilih</em>}</dd>
                </div>
                <div>
                  <dt>Durasi</dt>
                  <dd>{service ? `${service.duration} menit` : '—'}</dd>
                </div>
              </dl>
              <div className="walkin-total">
                <span>Total</span>
                <strong>{service ? rupiah(service.price) : 'Rp0'}</strong>
              </div>
              <p className="walkin-note">
                Masuk antrean sebagai belum bayar. Pembayaran tunai dicatat setelah layanan dari antrean.
              </p>
              {error && (
                <p className="walkin-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="primary walkin-submit" disabled={busy}>
                {busy ? 'Menyimpan…' : 'Masukkan antrean'}
              </button>
            </form>
          )}
        </aside>
      </div>

      {!result && (
        <div className="walkin-bar">
          <div>
            <strong>{service ? rupiah(service.price) : 'Belum ada layanan'}</strong>
            <small>
              {[service?.name, barber?.name, time && `${time} WIB`].filter(Boolean).join(' · ') ||
                'Pilih layanan, kapster, dan jam'}
            </small>
          </div>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => {
              if (missing.length) summary.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              void submit();
            }}
          >
            {busy ? 'Menyimpan…' : 'Masukkan antrean'}
          </button>
        </div>
      )}
    </div>
  );
}
