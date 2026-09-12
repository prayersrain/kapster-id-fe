'use client';

import { FormEvent, ReactNode, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '../../components/ui/Logo';
import styles from './AuthPage.module.css';

type AuthMode = 'login' | 'register' | 'verify';

const benefits = [
  'Kelola booking dan antrean lebih rapi',
  'Pantau operasional dari satu dashboard',
  'Mulai tanpa kartu kredit',
];

function AuthShell({ eyebrow, title, description, children, mode }: { eyebrow: string; title: string; description: string; children: ReactNode; mode: AuthMode }) {
  return <main className={styles.page}>
    <div className={styles.visualPane}>
      <a href="/" className={styles.visualLogo} aria-label="Kapster.id - kembali ke beranda"><Logo /></a>
      <div className={styles.visualContent}>
        <span className={styles.kicker}>SISTEM OPERASIONAL BARBERSHOP</span>
        <h1>Bangun operasional yang lebih <em>tenang.</em></h1>
        <p>Kapster.id membantu Owner dan tim mengelola barbershop tanpa kehilangan fokus pada customer.</p>
        <ul>{benefits.map((benefit) => <li key={benefit}><span>✓</span>{benefit}</li>)}</ul>
      </div>
      <span className={styles.visualFooter}>Good Barbers Build Better People.</span>
    </div>
    <section className={styles.formPane}>
      <div className={styles.mobileLogo}><a href="/" aria-label="Kembali ke beranda"><Logo /></a></div>
      <div className={styles.formWrap}>
        <span className={styles.formEyebrow}>{eyebrow}</span>
        <h2>{title}</h2>
        <p className={styles.formDescription}>{description}</p>
        {children}
        {mode === 'login' && <p className={styles.formSwitch}>Belum punya akun? <a href="/register">Coba gratis</a></p>}
        {mode === 'register' && <p className={styles.formSwitch}>Sudah punya akun? <a href="/login">Masuk</a></p>}
      </div>
      <span className={styles.formLegal}>Dengan melanjutkan, Anda menyetujui Terms of Service dan Privacy Policy Kapster.id.</span>
    </section>
  </main>;
}

function Field({ label, type = 'text', placeholder, required = true }: { label: string; type?: string; placeholder: string; required?: boolean }) {
  return <label className={styles.field}><span>{label}</span><input type={type} placeholder={placeholder} required={required} /></label>;
}

function SubmitButton({ children }: { children: ReactNode }) {
  return <button className={styles.submit} type="submit">{children}<span>→</span></button>;
}

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); router.push('/owner'); }
  return <AuthShell mode="login" eyebrow="SELAMAT DATANG KEMBALI" title="Masuk ke Kapster.id" description={params.get('verified') ? 'Email berhasil diverifikasi. Masuk untuk melanjutkan setup akun Anda.' : 'Kelola operasional barbershop Anda dari satu tempat.'}>
    <form className={styles.form} onSubmit={submit}>
      <Field label="Email" type="email" placeholder="nama@barbershop.com" />
      <label className={styles.field}><span>Password</span><input type="password" placeholder="Masukkan password" required /></label>
      <div className={styles.formMeta}><label className={styles.remember}><input type="checkbox" /> Ingat saya</label><a href="/forgot-password">Lupa password?</a></div>
      {error && <p className={styles.error}>{error}</p>}
      <SubmitButton>Masuk ke Dashboard</SubmitButton>
    </form>
  </AuthShell>;
}

export function RegisterPage() {
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const email = String(form.get('email') ?? ''); router.push(`/verify-email?email=${encodeURIComponent(email)}`); }
  return <AuthShell mode="register" eyebrow="MULAI DENGAN KAPSTER.ID" title="Buat akun Owner" description="Siapkan fondasi operasional barbershop Anda. Gratis untuk memulai, tanpa kartu kredit.">
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.fieldGrid}><Field label="Nama Owner" placeholder="Nama lengkap Anda" /><Field label="Nama barbershop" placeholder="Contoh: Garasi Barber" /></div>
      <Field label="Email kerja" type="email" placeholder="nama@barbershop.com" />
      <Field label="Nomor WhatsApp" type="tel" placeholder="08xxxxxxxxxx" />
      <div className={styles.fieldGrid}><Field label="Password" type="password" placeholder="Minimal 8 karakter" /><Field label="Konfirmasi password" type="password" placeholder="Ulangi password" /></div>
      <label className={styles.consent}><input type="checkbox" required /> <span>Saya menyetujui Terms of Service dan Privacy Policy.</span></label>
      <SubmitButton>Buat Akun Gratis</SubmitButton>
    </form>
  </AuthShell>;
}

export function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || 'email Anda';
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (code.length < 4) { setMessage('Masukkan kode verifikasi yang valid.'); return; } router.push('/login?verified=1'); }
  return <AuthShell mode="verify" eyebrow="LANGKAH 1 DARI 2" title="Verifikasi email Anda" description={`Kami mengirim kode verifikasi ke ${email}. Masukkan kode tersebut untuk melanjutkan.`}>
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}><span>Kode verifikasi</span><input className={styles.codeInput} inputMode="numeric" maxLength={6} value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '')); setMessage(''); }} placeholder="000000" required /></label>
      {message && <p className={styles.error}>{message}</p>}
      <SubmitButton>Verifikasi Email</SubmitButton>
      <button className={styles.resend} type="button" onClick={() => setMessage('Kode baru sudah dikirim.')}>Kirim ulang kode</button>
      <a className={styles.backLink} href="/register">← Ganti alamat email</a>
    </form>
  </AuthShell>;
}
