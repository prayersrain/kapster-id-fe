import { FormEvent, ReactNode, useEffect, useId, useRef, useState } from 'react';
import { labels, rupiah } from './api';
import { Glyph } from './Glyph';
export function Badge({ value }: { value: string }) {
  return <span className={`badge badge-${value}`}>{labels[value] || value}</span>;
}
export function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Empty({ children = 'Belum ada data untuk ditampilkan.' }: { children?: ReactNode }) {
  return (
    <div className="empty">
      <span>▤</span>
      <p>{children}</p>
    </div>
  );
}
export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return rows.length ? (
    <div className="table-scroll" tabIndex={0} aria-label="Tabel data, geser untuk kolom lain">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}

export const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
// Monday-first matches how Indonesian shops read a work week.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const dayNames = (days: number[]) => {
  const sorted = WEEK_ORDER.filter((d) => days.includes(d));
  if (sorted.length === 7) return 'Setiap hari';
  if (sorted.join() === '1,2,3,4,5,6') return 'Senin–Sabtu';
  if (sorted.join() === '1,2,3,4,5') return 'Senin–Jumat';
  return sorted.map((d) => WEEKDAYS[d]).join(', ');
};
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export type FieldValue = string | number | boolean | number[];
export type FieldSpec = {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'number'
    | 'date'
    | 'checkbox'
    | 'money'
    | 'days'
    | 'clock'
    | 'duration'
    | 'textarea';
  value?: FieldValue;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number | string;
  max?: number | string;
  minLength?: number;
  help?: string;
  placeholder?: string;
  /** Tap-to-fill reasons for textarea/text fields. */
  suggestions?: string[];
  /** Quick amounts for money fields. */
  quick?: { label: string; value: number }[];
  /** Presets that set several fields at once, e.g. a start and end time. */
  presets?: { label: string; values: Record<string, FieldValue> }[];
  wide?: boolean;
};
const initial = (f: FieldSpec): FieldValue => {
  if (f.value !== undefined) return f.value;
  if (f.type === 'checkbox') return false;
  if (f.type === 'days') return [];
  if (f.type === 'money' || f.type === 'duration') return 0;
  return f.options?.[0]?.value ?? '';
};
function fieldError(f: FieldSpec, value: FieldValue): string {
  const required = f.required !== false && f.type !== 'checkbox';
  if (f.type === 'days') return (value as number[]).length ? '' : 'Pilih minimal satu hari kerja.';
  if (f.type === 'money' || f.type === 'duration' || f.type === 'number') {
    const n = Number(value);
    if (f.min !== undefined && n < Number(f.min))
      return f.type === 'duration' ? `Minimal ${f.min} menit.` : `Minimal ${f.min}.`;
    if (f.max !== undefined && n > Number(f.max))
      return f.type === 'money' ? `Maksimal ${rupiah(Number(f.max))}.` : `Maksimal ${f.max}.`;
    return '';
  }
  const text = String(value ?? '').trim();
  if (required && !text) return `${f.label} wajib diisi.`;
  if (f.minLength && text && text.length < f.minLength) return `${f.label} minimal ${f.minLength} karakter.`;
  if (f.type === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
    return 'Format email belum benar.';
  return '';
}
export function Form({
  fields,
  onSubmit,
  submit = 'Simpan',
  children,
  onCancel,
  tone,
  preview,
}: {
  fields: FieldSpec[];
  onSubmit: (values: Record<string, any>) => Promise<unknown>;
  submit?: string;
  children?: ReactNode;
  onCancel?: () => void;
  tone?: 'danger';
  preview?: (values: Record<string, any>) => ReactNode;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [touched, setTouched] = useState(false);
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, initial(f)])),
  );
  const set = (patch: Record<string, FieldValue>) => setValues((v) => ({ ...v, ...patch }));
  const errors = Object.fromEntries(fields.map((f) => [f.key, fieldError(f, values[f.key])]));
  const clockOrder = fields.filter((f) => f.type === 'clock');
  if (clockOrder.length === 2 && !errors[clockOrder[1].key]) {
    const [start, end] = clockOrder.map((f) => String(values[f.key]));
    if (start && end && minutes(end) <= minutes(start))
      errors[clockOrder[1].key] = 'Jam selesai harus setelah jam mulai.';
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setTouched(true);
    const invalid = fields.find((f) => errors[f.key]);
    if (invalid) {
      event.currentTarget
        .querySelector<HTMLElement>(
          `[data-field="${invalid.key}"] input, [data-field="${invalid.key}"] select, [data-field="${invalid.key}"] textarea, [data-field="${invalid.key}"] button`,
        )
        ?.focus();
      return;
    }
    const out: Record<string, any> = {};
    for (const f of fields) {
      const v = values[f.key];
      out[f.key] = ['number', 'money', 'duration'].includes(f.type ?? '')
        ? Number(v)
        : f.type === 'days'
          ? [...(v as number[])].sort()
          : f.type === 'checkbox'
            ? !!v
            : String(v ?? '').trim();
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(out);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Penyimpanan gagal.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={send} className="form" noValidate>
      <fieldset disabled={busy}>
        <div className="form-grid">
          {fields.map((f) => (
            <Field
              key={f.key}
              field={f}
              value={values[f.key]}
              error={touched ? errors[f.key] : ''}
              onChange={(v) => set({ [f.key]: v })}
              onPreset={set}
            />
          ))}
        </div>
        {children}
        {error && (
          <p className="error form-error" role="alert">
            <Glyph name="alert" size={16} />
            {error}
          </p>
        )}
        <div className="form-actions">
          {preview && <div className="form-preview">{preview(values)}</div>}
          {onCancel && (
            <button type="button" className="ghost-button" onClick={onCancel}>
              Batal
            </button>
          )}
          <button
            className={`primary ${tone === 'danger' ? 'danger' : ''}`}
            type="submit"
            aria-label={busy ? 'Menyimpan…' : submit}
          >
            {busy ? 'Menyimpan…' : submit}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
function Field({
  field: f,
  value,
  error,
  onChange,
  onPreset,
}: {
  field: FieldSpec;
  value: FieldValue;
  error: string;
  onChange: (value: FieldValue) => void;
  onPreset: (values: Record<string, FieldValue>) => void;
}) {
  const id = useId();
  const described = [f.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const wide = f.wide || ['days', 'textarea', 'checkbox'].includes(f.type ?? '') || !!f.quick;
  const common = { id, 'aria-invalid': !!error || undefined, 'aria-describedby': described };
  let control: ReactNode;
  if (f.options)
    control = (
      <select {...common} value={String(value)} onChange={(e) => onChange(e.target.value)}>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  else if (f.type === 'checkbox')
    control = (
      <button
        {...common}
        type="button"
        role="switch"
        aria-checked={!!value}
        className={`switch ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <i />
        <span>{value ? 'Aktif' : 'Nonaktif'}</span>
      </button>
    );
  else if (f.type === 'days') {
    const days = value as number[];
    control = (
      <div className="day-picker" role="group" aria-labelledby={`${id}-label`} aria-describedby={described}>
        {WEEK_ORDER.map((d) => (
          <button
            type="button"
            key={d}
            aria-pressed={days.includes(d)}
            onClick={() => onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
          >
            {WEEKDAYS[d]}
          </button>
        ))}
      </div>
    );
  } else if (f.type === 'clock') {
    const steps = Array.from({ length: 36 }, (_, i) => {
      const m = 6 * 60 + i * 30;
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    });
    if (value && !steps.includes(String(value))) steps.push(String(value));
    steps.sort();
    control = (
      <span className="select-with-icon">
        <Glyph name="clock" size={16} />
        <select {...common} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {steps.map((t) => (
            <option key={t} value={t}>
              {t} WIB
            </option>
          ))}
        </select>
      </span>
    );
  } else if (f.type === 'money')
    control = (
      <span className="affix-input">
        <b>Rp</b>
        <input
          {...common}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={Number(value) ? Number(value).toLocaleString('id-ID') : ''}
          onChange={(e) =>
            onChange(Math.min(Number(e.target.value.replace(/\D/g, '').slice(0, 10)) || 0, 999_999_999))
          }
        />
      </span>
    );
  else if (f.type === 'duration')
    control = (
      <span className="affix-input suffix">
        <input
          {...common}
          inputMode="numeric"
          value={Number(value) || ''}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '').slice(0, 3)) || 0)}
        />
        <b>menit</b>
      </span>
    );
  else if (f.type === 'textarea')
    control = (
      <textarea
        {...common}
        rows={3}
        maxLength={500}
        placeholder={f.placeholder}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  else
    control = (
      <input
        {...common}
        type={f.type === 'number' ? 'text' : f.type || 'text'}
        inputMode={f.type === 'number' ? 'numeric' : f.type === 'tel' ? 'tel' : undefined}
        value={String(value ?? '')}
        min={f.min}
        max={f.max}
        placeholder={f.placeholder}
        maxLength={f.type === 'password' ? 128 : 500}
        autoComplete={f.type === 'password' ? 'new-password' : undefined}
        onChange={(e) => onChange(f.type === 'number' ? e.target.value.replace(/\D/g, '') : e.target.value)}
      />
    );
  const chips =
    f.type === 'duration'
      ? [15, 30, 45, 60, 90, 120].map((n) => ({ label: `${n}`, value: n as FieldValue }))
      : f.quick
        ? f.quick.map((q) => ({ label: q.label, value: q.value as FieldValue }))
        : f.suggestions?.map((s) => ({ label: s, value: s as FieldValue }));
  return (
    <div className={`field ${wide ? 'field-wide' : ''} ${error ? 'has-error' : ''}`} data-field={f.key}>
      <label htmlFor={f.type === 'days' ? undefined : id} id={`${id}-label`}>
        {f.label}
        {f.required === false && f.type !== 'checkbox' && <em> · opsional</em>}
      </label>
      {control}
      {f.presets && (
        <div className="chip-row" aria-label={`Pilihan cepat ${f.label}`}>
          {f.presets.map((p) => (
            <button type="button" className="chip" key={p.label} onClick={() => onPreset(p.values)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
      {f.type === 'days' && (
        <div className="chip-row">
          {[
            ['Senin–Sabtu', [1, 2, 3, 4, 5, 6]],
            ['Senin–Jumat', [1, 2, 3, 4, 5]],
            ['Setiap hari', [0, 1, 2, 3, 4, 5, 6]],
          ].map(([label, days]) => (
            <button
              type="button"
              className="chip"
              key={String(label)}
              onClick={() => onChange(days as number[])}
            >
              {String(label)}
            </button>
          ))}
        </div>
      )}
      {chips && (
        <div className="chip-row">
          {chips.map((c) => (
            <button
              type="button"
              key={c.label}
              className="chip"
              aria-pressed={value === c.value}
              onClick={() => onChange(c.value)}
            >
              {f.type === 'duration' ? `${c.label} mnt` : c.label}
            </button>
          ))}
        </div>
      )}
      {f.help && !error && <small id={`${id}-help`}>{f.help}</small>}
      {error && (
        <small className="field-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}

export function Modal({
  title,
  description,
  close,
  children,
  tone,
  size,
}: {
  title: string;
  description?: ReactNode;
  close: () => void;
  children: ReactNode;
  tone?: 'danger';
  size?: 'wide';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${tone === 'danger' ? 'modal-danger' : ''} ${size === 'wide' ? 'modal-wide' : ''}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-head">
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description && (
            <p id={`${id}-desc`} className="modal-description">
              {description}
            </p>
          )}
        </div>
        <button type="button" className="icon-button" aria-label="Tutup dialog" onClick={close}>
          <Glyph name="close" size={18} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Summary({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="dialog-summary">
      {rows
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export type Toast = { tone: 'success' | 'error'; title: string; message?: string };
export function ToastView({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, toast.tone === 'error' ? 9000 : 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon">
        <Glyph name={toast.tone === 'error' ? 'alert' : 'bell'} size={18} />
      </span>
      <div>
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>
      <button type="button" className="icon-button" aria-label="Tutup notifikasi" onClick={onClose}>
        <Glyph name="close" size={16} />
      </button>
    </div>
  );
}

/** Items without a tone can become the visible next step; secondary and danger stay in the menu. */
export type ActionItem = { label: string; onClick: () => void; tone?: 'danger' | 'secondary' };
const supportsPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
/** One visible next step plus an overflow menu, so table rows stay one line on tablets. */
export function RowActions({ items, label }: { items: ActionItem[]; label: string }) {
  const id = useId().replace(/:/g, '');
  const menu = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const hide = () => {
      if (menu.current?.matches(':popover-open')) menu.current.hidePopover();
    };
    window.addEventListener('resize', hide);
    document.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('resize', hide);
      document.removeEventListener('scroll', hide, true);
    };
  }, []);
  if (!items.length) return <span className="muted row-actions-none">—</span>;
  const [first, ...rest] = items;
  const primary = first.tone ? undefined : first;
  const more = primary ? rest : items;
  const place = () =>
    requestAnimationFrame(() => {
      const t = trigger.current?.getBoundingClientRect(),
        m = menu.current;
      if (!t || !m) return;
      const top = t.bottom + 6 + m.offsetHeight > innerHeight - 8 ? t.top - m.offsetHeight - 6 : t.bottom + 6;
      m.style.top = `${Math.max(8, top)}px`;
      m.style.left = `${Math.max(8, Math.min(t.right - m.offsetWidth, innerWidth - m.offsetWidth - 8))}px`;
    });
  return (
    <div className="row-actions">
      {primary && (
        <button type="button" className="row-primary" onClick={primary.onClick}>
          {primary.label}
        </button>
      )}
      {more.length > 0 &&
        (supportsPopover ? (
          <>
            <button
              ref={trigger}
              type="button"
              className="row-more"
              aria-label={`Tindakan lain untuk ${label}`}
              aria-haspopup="menu"
              popoverTarget={`menu-${id}`}
              onClick={place}
            >
              <Glyph name="more" size={16} />
            </button>
            <div ref={menu} id={`menu-${id}`} popover="auto" className="row-menu" role="menu">
              {more.map((item) => (
                <button
                  type="button"
                  role="menuitem"
                  key={item.label}
                  className={item.tone === 'danger' ? 'danger-text' : ''}
                  onClick={() => {
                    menu.current?.hidePopover();
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          more.map((item) => (
            <button type="button" key={item.label} onClick={item.onClick}>
              {item.label}
            </button>
          ))
        ))}
    </div>
  );
}
export function ActionList({ items }: { items: ActionItem[] }) {
  if (!items.length) return <p className="muted">Tidak ada tindakan untuk status ini.</p>;
  return (
    <div className="action-list">
      {items.map((item, i) => (
        <button
          type="button"
          key={item.label}
          className={i === 0 && !item.tone ? 'primary' : item.tone === 'danger' ? 'danger-outline' : ''}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function exportCsv(filename: string, headers: string[], rows: unknown[][]) {
  const cell = (value: unknown) => {
    const text = String(value ?? '');
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`;
  };
  const blob = new Blob(['\uFEFF' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
