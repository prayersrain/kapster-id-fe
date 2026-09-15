import { useEffect, useState } from 'react';
import { dayLabel, today } from './api';
import { Glyph } from './Glyph';

const dayMs = 86_400_000;
const stamp = (date: string) => Date.parse(`${date}T12:00:00Z`);

/** One date control for the entire server-supported booking window. */
export function BookingDates({
  value,
  max,
  onChange,
}: {
  value: string;
  max: string;
  onChange: (date: string) => void;
}) {
  const min = today();
  const last = Math.max(0, Math.round((stamp(max) - stamp(min)) / dayMs));
  const index = Math.max(0, Math.min(last, Math.round((stamp(value) - stamp(min)) / dayMs)));
  const [offset, setOffset] = useState(() => Math.floor(index / 7) * 7);
  useEffect(() => {
    setOffset(Math.floor(index / 7) * 7);
  }, [value, min]);
  const dates = Array.from({ length: Math.min(7, last - offset + 1) }, (_, i) =>
    new Date(stamp(min) + (offset + i) * dayMs).toISOString().slice(0, 10),
  );
  const month = (date: string) =>
    new Date(stamp(date)).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <section className="booking-dates" aria-label="Pilih tanggal kunjungan">
      <div className="booking-date-nav">
        <strong aria-live="polite">
          {month(dates[0])}
          {month(dates[0]) !== month(dates.at(-1)!) ? ` – ${month(dates.at(-1)!)}` : ''}
        </strong>
        <div className="date-paging">
          <button
            type="button"
            aria-label="Tujuh hari sebelumnya"
            disabled={offset === 0}
            onClick={() => setOffset((n) => Math.max(0, n - 7))}
          >
            <Glyph name="chevron" size={17} />
          </button>
          <button
            type="button"
            aria-label="Tujuh hari berikutnya"
            disabled={offset + 7 > last}
            onClick={() => setOffset((n) => n + 7)}
          >
            <Glyph name="chevron" size={17} />
          </button>
        </div>
      </div>
      <div className="booking-date-grid" role="group" aria-label="Tanggal kunjungan">
        {dates.map((date) => (
          <button
            type="button"
            key={date}
            aria-label={`Tanggal ${date}: ${dayLabel(date)}`}
            aria-pressed={value === date}
            onClick={() => onChange(date)}
          >
            <small>
              {new Date(stamp(date)).toLocaleDateString('id-ID', { weekday: 'short', timeZone: 'UTC' })}
            </small>
            <strong>{Number(date.slice(-2))}</strong>
          </button>
        ))}
      </div>
      <p className="booking-date-summary" aria-live="polite">
        {dayLabel(value)} · pilih jam di bawah
      </p>
    </section>
  );
}
