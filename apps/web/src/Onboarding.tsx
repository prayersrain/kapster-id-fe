import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, AppData, bookingLink, Entity, labels, rupiah, User } from './api';
import { Badge, dayNames, FieldSpec, FieldValue, Form } from './ui';
import { Glyph } from './Glyph';
import { Logo } from '../../../components/ui/Logo';
import {
  barberFields,
  inviteFields,
  outletFields,
  outletPicker,
  schedulePreview,
  serviceFields,
} from './setupFields';
import { setupProgress } from './setupRules';

type StepId = 'profil' | 'outlet' | 'layanan' | 'kapster' | 'kasir' | 'ringkasan';
const STEPS: { id: StepId; title: string; hint: string; optional?: boolean }[] = [
  { id: 'profil', title: 'Profil bisnis', hint: 'Nama dan link booking' },
  { id: 'outlet', title: 'Outlet pertama', hint: 'Lokasi barbershop' },
  { id: 'layanan', title: 'Layanan & harga', hint: 'Minimal satu per outlet' },
  { id: 'kapster', title: 'Kapster & jadwal', hint: 'Minimal satu per outlet' },
  { id: 'kasir', title: 'Tim kasir', hint: 'Bisa diatur nanti', optional: true },
  { id: 'ringkasan', title: 'Ringkasan & pengajuan', hint: 'Periksa, ajukan, terbitkan' },
];
const DASHBOARD_CHOICE = 'kapster-onboarding-dashboard';
/** Owners who leave onboarding on purpose are not sent back to it on the next dashboard visit. */
export const prefersDashboard = () => {
  try {
    return sessionStorage.getItem(DASHBOARD_CHOICE) === '1';
  } catch {
    return false;
  }
};

/** `stale`: the server accepted the change but re-reading the data failed, so the screen is out of date. */
type SaveState = { state: 'idle' | 'saving' | 'saved' | 'stale' | 'error'; at?: string; message?: string };
const clock = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export function Onboarding({
  data,
  user,
  reload,
  logout,
  startAtSummary = false,
}: {
  data: AppData;
  user: User;
  reload: () => Promise<boolean>;
  logout: () => void;
  startAtSummary?: boolean;
}) {
  const { org } = data;
  const progress = setupProgress(data);
  const [params, setParams] = useSearchParams();
  const [initial] = useState<StepId>(() =>
    startAtSummary
      ? 'ringkasan'
      : !progress.outlet
        ? 'outlet'
        : !progress.services
          ? 'layanan'
          : !progress.barbers
            ? 'kapster'
            : 'ringkasan',
  );
  const current = (STEPS.find((s) => s.id === params.get('langkah'))?.id ?? initial) as StepId;
  const index = STEPS.findIndex((s) => s.id === current);
  const [save, setSave] = useState<SaveState>({ state: 'idle' });
  // Unsaved input per form ("layanan:edit:<id>"), kept here so it outlives forms that unmount.
  const [drafts, setDrafts] = useState<Record<string, Record<string, FieldValue>>>({});
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [outletId, setOutletId] = useState('');
  // Open item editor per step; not reset when leaving a step, so an unfinished edit is still open on return.
  const [editing, setEditing] = useState<Partial<Record<StepId, string>>>({});
  const main = useRef<HTMLElement>(null);
  const activeOutlets = progress.outlets.map((o) => o.outlet);
  const outlet = activeOutlets.find((o) => o.id === outletId) ?? activeOutlets[0];
  const origin = window.location.origin;

  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    // On narrow screens the steps scroll sideways; keep the active one visible.
    document
      .querySelector('.ob-steps [aria-current="step"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [current]);

  const go = (id: StepId) => setParams({ langkah: id });
  const bump = (key: string) => setVersions((v) => ({ ...v, [key]: (v[key] ?? 0) + 1 }));
  const draftKey = (step: StepId, key: string) => `${step}:${key}`;
  const draftFor = (step: StepId, key: string) => ({
    draft: drafts[draftKey(step, key)],
    onDraft: (values: Record<string, FieldValue> | null) =>
      setDrafts((d) => {
        const k = draftKey(step, key);
        if (!values) {
          if (!(k in d)) return d;
          const { [k]: _, ...rest } = d;
          return rest;
        }
        return { ...d, [k]: values };
      }),
  });
  const discard = (step: StepId, key: string) => draftFor(step, key).onDraft(null);
  const stepDirty = (step: StepId) => Object.keys(drafts).some((k) => k.startsWith(`${step}:`));
  const anyDirty = STEPS.some((s) => stepDirty(s.id));
  const stale = save.state === 'stale';
  /**
   * Saves through the existing API, then re-reads it. A failed re-read is not a failed save: the change
   * already exists on the server, so the forms stay locked until the data is reloaded. Otherwise the
   * screen would still look empty and invite creating the same outlet or service again.
   */
  async function persist<T>(request: () => Promise<T>): Promise<{ result: T; fresh: boolean }> {
    setSave({ state: 'saving' });
    let result: T;
    try {
      result = await request();
    } catch (error) {
      setSave({ state: 'error', message: (error as Error).message });
      throw error;
    }
    const fresh = await reload();
    setSave({ state: fresh ? 'saved' : 'stale', at: clock() });
    return { result, fresh };
  }
  async function refresh() {
    const at = save.at;
    setSave({ state: 'saving', at });
    const fresh = await reload();
    setSave(
      fresh ? { state: 'saved', at: clock() } : { state: 'stale', at, message: 'Masih gagal memuat data.' },
    );
  }
  // The periodic dashboard reload may succeed first; fresh data means the screen is no longer stale.
  useEffect(() => {
    setSave((s) => (s.state === 'stale' ? { state: 'saved', at: clock() } : s));
  }, [data]);

  const complete: Record<StepId, boolean> = {
    profil: progress.profile,
    outlet: progress.outlet,
    layanan: progress.services,
    kapster: progress.barbers,
    kasir: progress.cashiers,
    ringkasan: ['pending', 'approved'].includes(org.status),
  };
  const stepState = (id: StepId) => {
    if (id === 'ringkasan')
      return org.status === 'approved'
        ? progress.published
          ? 'Booking terbit'
          : 'Disetujui'
        : org.status === 'draft'
          ? 'Belum diajukan'
          : org.status === 'rejected'
            ? 'Perlu revisi'
            : (labels[org.status] ?? org.status);
    if (complete[id]) return 'Lengkap';
    return STEPS.find((s) => s.id === id)?.optional ? 'Opsional' : 'Belum lengkap';
  };
  const saving = save.state === 'saving';

  const outletChips = activeOutlets.length > 1 && (
    <div className="ob-outlets" role="group" aria-label="Pilih outlet">
      {progress.outlets.map((o) => (
        <button
          type="button"
          key={o.outlet.id}
          aria-pressed={o.outlet.id === outlet?.id}
          onClick={() => {
            setOutletId(o.outlet.id);
          }}
        >
          <strong>{o.outlet.name}</strong>
          <small>{current === 'kapster' ? `${o.barbers} kapster` : `${o.services} layanan`}</small>
        </button>
      ))}
    </div>
  );

  const renderStep = (id: StepId): ReactNode => {
    switch (id) {
      case 'profil': {
        const nameEditable = ['draft', 'rejected'].includes(org.status);
        const slugLocked = !!org.publishedAt;
        const fields: FieldSpec[] = [
          {
            key: 'name',
            label: 'Nama bisnis',
            value: org.name,
            minLength: 2,
            readOnly: !nameEditable,
            wide: true,
            help: nameEditable
              ? 'Tampil di halaman booking dan dilihat Admin saat review.'
              : 'Nama tidak bisa diubah selama review atau setelah disetujui.',
          },
          {
            key: 'slug',
            label: 'Link booking',
            value: org.slug,
            minLength: 3,
            readOnly: slugLocked,
            wide: true,
            help: slugLocked
              ? 'Terkunci karena sudah pernah diterbitkan dan mungkin sudah dibagikan.'
              : 'Huruf kecil, angka, dan tanda hubung. Bisa diubah sampai outlet pertama diterbitkan.',
          },
        ];
        return (
          <Form
            key={`profil-${versions.profil ?? 0}`}
            id="ob-form-profil"
            actions={false}
            fields={fields}
            {...draftFor('profil', 'form')}
            preview={(v) => (
              <span className="preview-ok">
                {origin}
                {bookingLink(String(v.slug).trim().toLowerCase() || org.slug)}
              </span>
            )}
            onSubmit={async (v) => {
              const body: Record<string, string> = {};
              if (nameEditable && v.name !== org.name) body.name = v.name;
              if (!slugLocked && v.slug.toLowerCase() !== org.slug) body.slug = v.slug.toLowerCase();
              const saved = Object.keys(body).length
                ? await persist(() => api('app/org', body, 'PATCH'))
                : { fresh: true };
              // The server has the input now, so it is no longer a draft even if the re-read failed.
              discard('profil', 'form');
              if (!saved.fresh) return;
              bump('profil');
              go('outlet');
            }}
          />
        );
      }
      case 'outlet': {
        const first = outlet;
        return (
          <>
            {activeOutlets.length > 1 && (
              <p className="ob-note">
                Bisnis ini punya {activeOutlets.length} outlet aktif. Setiap outlet perlu layanan dan kapster
                sebelum diajukan. Outlet tambahan dikelola dari menu Outlet di dashboard.
              </p>
            )}
            {outletChips}
            <Form
              key={`outlet-${first?.id ?? 'new'}-${versions.outlet ?? 0}`}
              id="ob-form-outlet"
              actions={false}
              fields={outletFields(first)}
              {...draftFor('outlet', first?.id ?? 'new')}
              onSubmit={async (v) => {
                const saved = !first
                  ? await persist(() => api('app/outlets', v))
                  : v.name !== first.name || v.address !== first.address
                    ? await persist(() =>
                        api(`app/outlets/${first.id}`, { ...v, published: !!first.published }, 'PATCH'),
                      )
                    : { fresh: true };
                discard('outlet', first?.id ?? 'new');
                if (!saved.fresh) return;
                bump('outlet');
                go('layanan');
              }}
            />
          </>
        );
      }
      case 'layanan':
      case 'kapster': {
        const services = id === 'layanan';
        const noun = services ? 'layanan' : 'kapster';
        if (!outlet)
          return (
            <div className="ob-empty">
              <p>
                Tambahkan outlet terlebih dahulu. {services ? 'Layanan' : 'Kapster'} selalu terikat ke outlet.
              </p>
              <button type="button" className="ghost-button" onClick={() => go('outlet')}>
                Isi outlet
              </button>
            </div>
          );
        const items = (services ? data.services : data.barbers).filter((x) => x.outletId === outlet.id);
        const endpoint = services ? 'app/services' : 'app/barbers';
        const fieldsFor = services ? serviceFields : barberFields;
        const addKey = `${id}-add-${outlet.id}`;
        return (
          <>
            {outletChips}
            <div className="ob-list" aria-label={`Daftar ${noun} ${outlet.name}`}>
              {!items.length && (
                <p className="ob-list-empty">
                  Belum ada {noun} di {outlet.name}. Tambahkan minimal satu yang aktif.
                </p>
              )}
              {items.map((item) => {
                const open = editing[id] === item.id;
                const editKey = `edit:${item.id}`;
                const hasDraft = draftKey(id, editKey) in drafts;
                const close = () => setEditing((e) => ({ ...e, [id]: '' }));
                return (
                  <article key={item.id} className={`ob-item ${item.active ? '' : 'is-inactive'}`}>
                    <div className="ob-item-main">
                      <span className="ob-item-mark" aria-hidden="true">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {services
                            ? `${item.duration} menit · ${rupiah(item.price)}`
                            : `${dayNames(JSON.parse(item.days))} · ${item.start}–${item.end} WIB`}
                          {hasDraft && !open && (
                            <em className="ob-item-draft"> · Ada perubahan belum disimpan</em>
                          )}
                        </small>
                      </div>
                      <Badge value={item.active ? 'Aktif' : 'Nonaktif'} />
                      <button
                        type="button"
                        className="ghost-button"
                        aria-expanded={open}
                        onClick={() => setEditing((e) => ({ ...e, [id]: open ? '' : item.id }))}
                      >
                        {open ? 'Tutup' : hasDraft ? 'Lanjutkan' : 'Ubah'}
                      </button>
                    </div>
                    {open && (
                      <div className="ob-item-edit">
                        <Form
                          fields={fieldsFor(item)}
                          submit={`Simpan ${noun}`}
                          preview={services ? undefined : schedulePreview}
                          {...draftFor(id, editKey)}
                          onCancel={() => {
                            discard(id, editKey);
                            close();
                          }}
                          onSubmit={async (v) => {
                            await persist(() => api(`${endpoint}/${item.id}`, v, 'PATCH'));
                            discard(id, editKey);
                            close();
                          }}
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            <section className="ob-add">
              <h3>Tambah {noun}</h3>
              <Form
                key={`${addKey}-${versions[addKey] ?? 0}`}
                fields={fieldsFor()}
                submit={`Tambah ${noun}`}
                preview={services ? undefined : schedulePreview}
                {...draftFor(id, addKey)}
                onSubmit={async (v) => {
                  await persist(() => api(endpoint, { ...v, outletId: outlet.id }));
                  discard(id, addKey);
                  bump(addKey);
                }}
              />
            </section>
          </>
        );
      }
      case 'kasir': {
        const cashiers = data.team.filter((t) => t.role === 'cashier');
        const outletField = outletPicker(
          activeOutlets.map((o) => ({ value: o.id, label: o.name })),
          outlet?.id,
        );
        return (
          <>
            <p className="ob-note">
              Owner juga bisa membuka shift dan melayani sendiri. Undang kasir jika ada staf yang menjaga
              outlet; undangan berisi tautan untuk membuat password.
            </p>
            {cashiers.length > 0 && (
              <div className="ob-list">
                {cashiers.map((c) => (
                  <article key={c.id} className="ob-item">
                    <div className="ob-item-main">
                      <span className="ob-item-mark" aria-hidden="true">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          {c.email} · {data.outlets.find((o) => o.id === c.outletId)?.name}
                        </small>
                      </div>
                      <Badge value={c.active ? (c.verified ? 'Aktif' : 'Menunggu undangan') : 'Nonaktif'} />
                    </div>
                  </article>
                ))}
              </div>
            )}
            {activeOutlets.length ? (
              <section className="ob-add">
                <h3>Undang kasir</h3>
                <Form
                  key={`kasir-${versions.kasir ?? 0}`}
                  fields={inviteFields(outletField)}
                  submit="Kirim undangan"
                  {...draftFor('kasir', 'invite')}
                  onSubmit={async (v) => {
                    await persist(() => api('app/team', v));
                    discard('kasir', 'invite');
                    bump('kasir');
                  }}
                />
              </section>
            ) : (
              <p className="ob-list-empty">Tambahkan outlet dulu agar kasir bisa ditugaskan.</p>
            )}
          </>
        );
      }
      case 'ringkasan':
        return <Summary data={data} progress={progress} go={go} persist={persist} origin={origin} />;
    }
  };

  const step = STEPS[index];
  const next = STEPS[index + 1];
  const formStep = current === 'profil' || current === 'outlet';
  const incompleteRequired = !step.optional && current !== 'ringkasan' && !complete[current];

  return (
    <div className="onboarding">
      <header className="ob-top">
        <Link to="/owner" className="ob-brand" aria-label="Kapster.id">
          <Logo />
        </Link>
        <div className="ob-business">
          <strong>{org.name}</strong>
          <small>Setup bisnis · {user.name}</small>
        </div>
        <p
          className={`ob-save ob-save-${anyDirty && !['saving', 'stale', 'error'].includes(save.state) ? 'draft' : save.state}`}
          role="status"
        >
          {save.state === 'saving'
            ? 'Menyimpan…'
            : save.state === 'error'
              ? 'Gagal menyimpan'
              : stale
                ? 'Tersimpan, tampilan belum diperbarui'
                : anyDirty
                  ? 'Ada isian belum disimpan'
                  : save.state === 'saved'
                    ? `Tersimpan pukul ${save.at}`
                    : 'Semua data tersimpan di server'}
        </p>
        <Link
          to="/owner"
          className="ob-exit"
          onClick={() => {
            try {
              sessionStorage.setItem(DASHBOARD_CHOICE, '1');
            } catch {}
          }}
        >
          Ke dashboard
        </Link>
        <button type="button" className="ob-logout" onClick={logout}>
          Keluar
        </button>
      </header>

      <div className="ob-layout">
        <nav className="ob-steps" aria-label="Langkah setup">
          <div className="ob-steps-progress">
            <span>
              Langkah {index + 1} dari {STEPS.length}
            </span>
            <i style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
          </div>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={s.id === current ? 'step' : undefined}
                  className={`${complete[s.id] ? 'is-complete' : ''} ${s.id === 'ringkasan' && org.status === 'rejected' ? 'is-attention' : ''}`}
                  onClick={() => go(s.id)}
                >
                  <span className="ob-step-number">{i + 1}</span>
                  <span className="ob-step-text">
                    <strong>{s.title}</strong>
                    <small>
                      {s.optional ? 'Opsional' : 'Wajib'} · {stepState(s.id)}
                      {stepDirty(s.id) && <em> · Draf</em>}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="ob-main" ref={main}>
          {org.status === 'rejected' && org.reason && (
            <div className="ob-banner ob-banner-attention" role="note">
              <strong>Admin meminta revisi</strong>
              <p>{org.reason}</p>
            </div>
          )}
          {org.status === 'pending' && current !== 'ringkasan' && (
            <div className="ob-banner" role="note">
              <strong>Sedang direview Admin</strong>
              <p>Perubahan tetap bisa disimpan dan langsung terlihat oleh Admin.</p>
            </div>
          )}
          {STEPS.map((s, i) => (
            <section
              key={s.id}
              className="ob-card"
              hidden={s.id !== current}
              aria-labelledby={`ob-title-${s.id}`}
            >
              <header className="ob-card-head">
                <span className="ob-eyebrow">
                  Langkah {i + 1} dari {STEPS.length} · {s.optional ? 'Opsional' : 'Wajib'}
                </span>
                <h1 id={`ob-title-${s.id}`}>{s.title}</h1>
                <p>{stepIntro[s.id]}</p>
              </header>
              {/* Locked while stale so a change the server already has cannot be submitted twice. */}
              <fieldset className="ob-card-body" disabled={stale}>
                {renderStep(s.id)}
              </fieldset>
            </section>
          ))}
          <footer className={`ob-footer ${current === 'ringkasan' ? 'is-static' : ''}`}>
            {save.state === 'error' && (
              <p className="ob-footer-error" role="alert">
                {save.message}
              </p>
            )}
            {stale && (
              <div className="ob-footer-stale" role="alert">
                <p>
                  Perubahan tersimpan di server, tetapi tampilan belum diperbarui
                  {save.message ? ` (${save.message})` : ''}. Muat ulang data sebelum melanjutkan agar tidak
                  tersimpan dua kali.
                </p>
                <button type="button" className="ghost-button" onClick={() => void refresh()}>
                  Muat ulang data
                </button>
              </div>
            )}
            {incompleteRequired && !formStep && (
              <p className="ob-footer-hint">Langkah ini wajib sebelum bisnis bisa diajukan.</p>
            )}
            {stepDirty(current) && !formStep && (
              <p className="ob-footer-hint">Isian yang belum disimpan tetap ada di langkah ini.</p>
            )}
            <div className="ob-footer-actions">
              {index > 0 && (
                <button type="button" className="ghost-button" onClick={() => go(STEPS[index - 1].id)}>
                  Kembali
                </button>
              )}
              {formStep ? (
                <button
                  type="submit"
                  className="primary"
                  form={`ob-form-${current}`}
                  disabled={saving || stale}
                >
                  {saving ? 'Menyimpan…' : 'Simpan & lanjut'}
                </button>
              ) : next ? (
                <button
                  type="button"
                  className="primary"
                  disabled={stale}
                  onClick={() => go(next.id)}
                  aria-label={
                    current === 'kasir' && !progress.cashiers
                      ? 'Lewati untuk sekarang'
                      : `Lanjut ke ${next.title}`
                  }
                >
                  {current === 'kasir' && !progress.cashiers ? (
                    'Lewati untuk sekarang'
                  ) : (
                    <>
                      <span className="ob-next-long">Lanjut ke {next.title}</span>
                      <span className="ob-next-short">Lanjut</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

const stepIntro: Record<StepId, string> = {
  profil: 'Nama bisnis dan link booking yang akan dibagikan ke customer.',
  outlet: 'Lokasi tempat customer datang. Outlet baru belum tampil ke publik sampai Anda menerbitkannya.',
  layanan: 'Durasi menentukan panjang slot booking. Sistem menambah jeda 10 menit antar booking.',
  kapster: 'Slot booking dibuat dari hari dan jam kerja setiap kapster.',
  kasir: 'Beri akses staf untuk membuka shift, mencatat walk-in, dan menerima pembayaran tunai.',
  ringkasan: 'Periksa kembali data bisnis, ajukan untuk review, lalu terbitkan halaman booking.',
};

function Summary({
  data,
  progress,
  go,
  persist,
  origin,
}: {
  data: AppData;
  progress: ReturnType<typeof setupProgress>;
  go: (id: StepId) => void;
  persist: <T>(request: () => Promise<T>) => Promise<{ result: T; fresh: boolean }>;
  origin: string;
}) {
  const { org } = data;
  const [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [copied, setCopied] = useState(false);
  const link = `${origin}${bookingLink(org.slug)}`;
  const run = async (key: string, request: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(key);
    setError('');
    try {
      await persist(request);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };
  const section = (title: string, step: StepId, body: ReactNode) => (
    <section className="ob-summary-section">
      <header>
        <h3>{title}</h3>
        <button type="button" className="ghost-button" onClick={() => go(step)}>
          Ubah
        </button>
      </header>
      {body}
    </section>
  );
  const list = (items: Entity[], render: (item: Entity) => string) =>
    items.length ? (
      <ul>
        {items.map((item) => (
          <li key={item.id} className={item.active === 0 ? 'is-inactive' : ''}>
            <strong>{item.name}</strong>
            <span>{render(item)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="ob-missing">Belum ada data.</p>
    );

  let status: ReactNode;
  if (org.status === 'draft' || org.status === 'rejected')
    status = (
      <div className={`ob-status ${org.status === 'rejected' ? 'is-attention' : ''}`}>
        <div>
          <span className="ob-eyebrow">{org.status === 'rejected' ? 'Perlu revisi' : 'Belum diajukan'}</span>
          <h2>
            {!progress.ready
              ? 'Lengkapi data wajib dulu'
              : org.status === 'rejected'
                ? 'Perbaiki sesuai catatan Admin, lalu ajukan ulang'
                : 'Siap diajukan untuk review'}
          </h2>
          <p>
            {progress.ready
              ? 'Admin platform memeriksa outlet, layanan, dan kapster. Anda tetap bisa mengubah data selama review.'
              : 'Server menolak pengajuan jika ada outlet aktif tanpa layanan atau kapster.'}
          </p>
          {!progress.ready && (
            <ul className="ob-missing-list">
              {progress.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          className="primary"
          disabled={!progress.ready || !!busy}
          onClick={() => run('submit', () => api('app/approval', {}))}
        >
          {busy === 'submit'
            ? 'Mengirim…'
            : org.status === 'rejected'
              ? 'Ajukan ulang'
              : 'Ajukan untuk review'}
        </button>
      </div>
    );
  else if (org.status === 'pending')
    status = (
      <div className="ob-status">
        <div>
          <span className="ob-eyebrow">Menunggu review</span>
          <h2>Pengajuan sedang diperiksa Admin</h2>
          <p>
            Anda akan melihat hasilnya di halaman ini: disetujui untuk mulai beroperasi, atau catatan revisi
            dari Admin. Data yang Anda ubah sekarang ikut terlihat saat review.
          </p>
        </div>
      </div>
    );
  else if (org.status === 'suspended')
    status = (
      <div className="ob-status is-attention">
        <div>
          <span className="ob-eyebrow">Ditangguhkan</span>
          <h2>Booking publik dihentikan sementara</h2>
          <p>{org.reason || 'Hubungi Admin platform untuk informasi lebih lanjut.'}</p>
        </div>
      </div>
    );
  else
    status = (
      <div className="ob-status is-approved">
        <div>
          <span className="ob-eyebrow">Disetujui</span>
          <h2>{progress.published ? 'Halaman booking sudah terbit' : 'Terbitkan halaman booking'}</h2>
          <p>
            Customer bisa booking setelah minimal satu outlet diterbitkan. Link bisnis terkunci setelah terbit
            pertama agar link yang sudah dibagikan tidak rusak.
          </p>
          <div className="ob-publish">
            {progress.outlets.map((o) => (
              <div key={o.outlet.id} className="ob-publish-row">
                <div>
                  <strong>{o.outlet.name}</strong>
                  <small>
                    {o.ready
                      ? o.outlet.published
                        ? `Terbit · ${origin}${bookingLink(org.slug, o.outlet.slug)}`
                        : 'Siap diterbitkan'
                      : 'Butuh layanan dan kapster aktif'}
                  </small>
                </div>
                {o.outlet.published ? (
                  <Badge value="Booking aktif" />
                ) : (
                  <button
                    type="button"
                    className="primary"
                    disabled={!o.ready || !!busy}
                    onClick={() =>
                      run(o.outlet.id, () =>
                        api(
                          `app/outlets/${o.outlet.id}`,
                          { name: o.outlet.name, address: o.outlet.address, published: true },
                          'PATCH',
                        ),
                      )
                    }
                  >
                    {busy === o.outlet.id ? 'Menerbitkan…' : 'Terbitkan booking'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {progress.published && (
            <div className="ob-link">
              <code>{link}</code>
              <div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      window.prompt('Salin link booking:', link);
                    }
                  }}
                >
                  {copied ? 'Link tersalin' : 'Salin link'}
                </button>
                <a className="primary" href={bookingLink(org.slug)} target="_blank" rel="noreferrer">
                  Buka halaman booking
                </a>
                <Link className="ghost-button" to="/owner">
                  Ke dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );

  return (
    <div className="ob-summary">
      {status}
      {error && (
        <p className="error form-error" role="alert">
          <Glyph name="alert" size={16} />
          {error}
        </p>
      )}
      <div className="ob-summary-grid">
        {section(
          'Profil bisnis',
          'profil',
          <dl>
            <div>
              <dt>Nama</dt>
              <dd>{org.name}</dd>
            </div>
            <div>
              <dt>Link booking</dt>
              <dd>
                {origin}
                {bookingLink(org.slug)}
              </dd>
            </div>
          </dl>,
        )}
        {section(
          'Outlet',
          'outlet',
          list(data.outlets, (o) => o.address),
        )}
        {section(
          'Layanan & harga',
          'layanan',
          list(
            data.services,
            (s) => `${s.duration} menit · ${rupiah(s.price)}${s.active ? '' : ' · nonaktif'}`,
          ),
        )}
        {section(
          'Kapster & jadwal',
          'kapster',
          list(
            data.barbers,
            (b) => `${dayNames(JSON.parse(b.days))} · ${b.start}–${b.end}${b.active ? '' : ' · nonaktif'}`,
          ),
        )}
        {section(
          'Tim kasir',
          'kasir',
          list(
            data.team.filter((t) => t.role === 'cashier'),
            (t) => `${t.email} · ${t.verified ? 'aktif' : 'menunggu undangan'}`,
          ),
        )}
      </div>
    </div>
  );
}
