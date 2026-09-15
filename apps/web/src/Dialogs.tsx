import { useEffect, useState } from 'react';
import { api, dayLabel, Entity, today } from './api';
import { Glyph } from './Glyph';

/** Reschedule by picking from real availability instead of typing a time. */
export function RescheduleForm({
  booking,
  barbers,
  onCancel,
  onDone,
}: {
  booking: Entity;
  barbers: Entity[];
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [barberId, setBarber] = useState(booking.barberId),
    [date, setDate] = useState(booking.date >= today() ? booking.date : today()),
    [time, setTime] = useState(''),
    [reason, setReason] = useState(''),
    [slots, setSlots] = useState<string[]>([]),
    [loading, setLoading] = useState(false),
    [slotError, setSlotError] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [touched, setTouched] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSlotError('');
    setTime('');
    api<{ slots: string[] }>(
      `app/slots?${new URLSearchParams({ outletId: booking.outletId, serviceId: booking.serviceId, barberId, date, bookingId: booking.id })}`,
      undefined,
      'GET',
      controller.signal,
    )
      .then((data) => setSlots(data.slots))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setSlots([]);
        setSlotError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [barberId, date, booking.id, booking.outletId, booking.serviceId]);
  const dates = Array.from({ length: 14 }, (_, i) =>
    new Date(Date.parse(`${today()}T12:00:00Z`) + i * 86400_000).toISOString().slice(0, 10),
  );
  const reasonError = reason.trim().length < 5 ? 'Alasan minimal 5 karakter.' : '';
  const maxDate = new Date(Date.now() + 30 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10);
  return (
    <form
      className="form reschedule-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setTouched(true);
        if (!time || reasonError || busy) return;
        setBusy(true);
        setError('');
        try {
          await api(`app/bookings/${booking.id}/reschedule`, { barberId, date, time, reason: reason.trim() });
          const barber = barbers.find((b) => b.id === barberId)?.name ?? 'kapster';
          onDone(`${booking.name} dipindah ke ${dayLabel(date)} · ${time} WIB bersama ${barber}.`);
        } catch (err) {
          setError((err as Error).message);
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>
        <div className="field field-wide">
          <span className="field-label">Kapster</span>
          <div className="choice-row" role="group" aria-label="Pilih kapster">
            {barbers.map((b) => (
              <button
                type="button"
                key={b.id}
                aria-pressed={barberId === b.id}
                onClick={() => setBarber(b.id)}
              >
                <span className="live-avatar">{b.name.slice(0, 2).toUpperCase()}</span>
                {b.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field field-wide">
          <span className="field-label">Tanggal</span>
          <div className="date-row" role="group" aria-label="Pilih tanggal">
            {dates.map((d) => (
              <button type="button" key={d} aria-pressed={date === d} onClick={() => setDate(d)}>
                <small>{dayLabel(d).split(',')[0]}</small>
                <strong>{Number(d.slice(8))}</strong>
              </button>
            ))}
          </div>
          <label className="inline-date">
            <span>Tanggal lain</span>
            <input
              type="date"
              value={date}
              min={today()}
              max={maxDate}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </label>
        </div>
        <div className={`field field-wide ${touched && !time ? 'has-error' : ''}`}>
          <span className="field-label">
            Jam tersedia · {dayLabel(date)} <em>(durasi {booking.duration} menit)</em>
          </span>
          {loading ? (
            <p className="slot-state" role="status">
              Memeriksa jadwal kapster…
            </p>
          ) : slotError ? (
            <p className="slot-state error-text" role="alert">
              {slotError}
            </p>
          ) : !slots.length ? (
            <p className="slot-state">
              <Glyph name="calendar" size={16} /> Tidak ada jam kosong. Coba tanggal atau kapster lain.
            </p>
          ) : (
            <div className="slot-grid" role="group" aria-label="Pilih jam">
              {slots.map((t) => {
                const current = t === booking.time && date === booking.date && barberId === booking.barberId;
                return (
                  <button
                    type="button"
                    key={t}
                    aria-pressed={time === t}
                    disabled={current}
                    onClick={() => setTime(t)}
                  >
                    {t}
                    {current && <small>saat ini</small>}
                  </button>
                );
              })}
            </div>
          )}
          {touched && !time && <small className="field-error">Pilih jam baru terlebih dahulu.</small>}
        </div>
        <div className={`field field-wide ${touched && reasonError ? 'has-error' : ''}`}>
          <label htmlFor="reschedule-reason">Alasan perubahan</label>
          <textarea
            id="reschedule-reason"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="chip-row">
            {['Permintaan customer', 'Kapster berhalangan', 'Outlet terlalu penuh'].map((v) => (
              <button
                type="button"
                className="chip"
                key={v}
                aria-pressed={reason === v}
                onClick={() => setReason(v)}
              >
                {v}
              </button>
            ))}
          </div>
          {touched && reasonError ? (
            <small className="field-error">{reasonError}</small>
          ) : (
            <small>Tercatat di riwayat audit. Harga dan durasi booking tidak berubah.</small>
          )}
        </div>
        {error && (
          <p className="error form-error" role="alert">
            <Glyph name="alert" size={16} />
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            Batal
          </button>
          <button className="primary" type="submit">
            {busy ? 'Menyimpan…' : time ? `Pindahkan ke ${time}` : 'Simpan jadwal baru'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
