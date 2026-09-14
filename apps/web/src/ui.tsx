import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { labels } from './api';
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
export type FieldSpec = {
  key: string;
  label: string;
  type?: string;
  value?: string | number | boolean;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number | string;
  max?: number | string;
  help?: string;
};
export function Form({
  fields,
  onSubmit,
  submit = 'Simpan',
  children,
}: {
  fields: FieldSpec[];
  onSubmit: (values: Record<string, any>) => Promise<unknown>;
  submit?: string;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const values: Record<string, any> = {};
    for (const f of fields)
      values[f.key] =
        f.type === 'number'
          ? Number(data.get(f.key))
          : f.type === 'checkbox'
            ? data.has(f.key)
            : String(data.get(f.key) ?? '');
    setBusy(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Penyimpanan gagal.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={send} className="form">
      <fieldset disabled={busy}>
        <div className="form-grid">
          {fields.map((f) => (
            <label className={f.type === 'checkbox' ? 'check-field' : 'field'} key={f.key}>
              <span>{f.label}</span>
              {f.options ? (
                <select
                  name={f.key}
                  defaultValue={String(f.value ?? f.options[0]?.value ?? '')}
                  required={f.required !== false}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <input name={f.key} type="checkbox" defaultChecked={!!f.value} />
              ) : (
                <input
                  name={f.key}
                  type={f.type || 'text'}
                  defaultValue={String(f.value ?? '')}
                  required={f.required !== false}
                  min={f.min}
                  max={f.max}
                  maxLength={f.type === 'password' ? 128 : 500}
                  autoComplete={f.type === 'password' ? 'new-password' : undefined}
                />
              )}{' '}
              {f.help && <small>{f.help}</small>}
            </label>
          ))}
        </div>
        {children}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" type="submit">
          {busy ? 'Menyimpan…' : submit}
        </button>
      </fieldset>
    </form>
  );
}
export function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={close}>
      <div className="card-head">
        <h2>{title}</h2>
        <button type="button" className="icon-button" aria-label="Tutup dialog" onClick={close}>
          ×
        </button>
      </div>
      {children}
    </dialog>
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
