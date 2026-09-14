import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, User } from './api';
import { Form, FieldSpec } from './ui';
import { Logo } from '../../../components/ui/Logo';
const AuthContext = createContext<{ user: User | null; setUser: (u: User | null) => void; loading: boolean }>(
  { user: null, setUser: () => {}, loading: true },
);
export const useAuth = () => useContext(AuthContext);
export const homeFor = (user: User) =>
  user.role === 'admin' ? '/admin' : user.role === 'cashier' ? '/kasir' : '/owner';
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api<User>('auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expire = () => setUser(null);
    window.addEventListener('kapster-session-expired', expire);
    return () => window.removeEventListener('kapster-session-expired', expire);
  }, []);
  return <AuthContext.Provider value={{ user, setUser, loading }}>{children}</AuthContext.Provider>;
}
export function Protected({ roles, children }: { roles: User['role'][]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading" role="status">
        Memeriksa session…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return children;
}
export function AuthPage({ mode }: { mode: 'login' | 'register' | 'verify' | 'forgot' | 'reset' }) {
  const { user, setUser } = useAuth(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [message, setMessage] = useState('');
  const heading = {
    login: 'Selamat datang kembali',
    register: 'Bangun bisnis Anda',
    verify: 'Verifikasi email',
    forgot: 'Pulihkan akses akun',
    reset: 'Atur password Anda',
  }[mode];
  const fields: FieldSpec[] =
    mode === 'register'
      ? [
          { key: 'name', label: 'Nama Owner' },
          { key: 'business', label: 'Nama bisnis' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'password', label: 'Password', type: 'password', help: 'Minimal 10 karakter.' },
          { key: 'confirm', label: 'Ulangi password', type: 'password' },
        ]
      : mode === 'login'
        ? [
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'password', label: 'Password', type: 'password' },
          ]
        : mode === 'forgot'
          ? [{ key: 'email', label: 'Email', type: 'email' }]
          : mode === 'reset'
            ? [
                { key: 'password', label: 'Password baru', type: 'password', help: 'Minimal 10 karakter.' },
                { key: 'confirm', label: 'Ulangi password', type: 'password' },
              ]
            : [];
  if (user && mode === 'login') return <Navigate to={homeFor(user)} replace />;
  return (
    <main className="auth-page">
      <aside className="auth-art">
        <a href="http://127.0.0.1:3000">
          <Logo />
        </a>
        <div>
          <span className="eyebrow">GOOD BARBERS. BETTER BUSINESS.</span>
          <h1>
            Operasional rapi.
            <br />
            <em>Fokus pada customer.</em>
          </h1>
          <p>Satu tempat untuk jadwal, booking, tim, dan kas harian barbershop Anda.</p>
        </div>
        <small>Kapster.id · Lingkungan pengujian lokal</small>
      </aside>
      <section className="auth-form">
        <span className="eyebrow">KAPSTER.ID</span>
        <h1>{heading}</h1>
        <p className="muted">
          {mode === 'login'
            ? 'Masuk untuk melanjutkan operasional barbershop.'
            : 'Email pengembangan tersedia melalui perintah npm run local:mail.'}
        </p>
        {message ? (
          <div className="success" role="status">
            {message}
            <p>
              <Link to="/login">Kembali ke login →</Link>
            </p>
          </div>
        ) : (
          <Form
            fields={fields}
            submit={mode === 'login' ? 'Masuk' : mode === 'verify' ? 'Verifikasi email' : 'Lanjutkan'}
            onSubmit={async (values) => {
              if ('confirm' in values && values.password !== values.confirm)
                throw new Error('Konfirmasi password tidak cocok.');
              if (mode === 'login') {
                const u = await api<User>('auth/login', values);
                setUser(u);
                navigate(homeFor(u));
              } else {
                const result = await api(`auth/${mode}`, { ...values, token: params.get('token') || '' });
                setMessage(result.message);
              }
            }}
          />
        )}
        <div className="auth-links">
          <Link to="/login">Masuk</Link>
          <Link to="/register">Daftar Owner</Link>
          <Link to="/forgot-password">Lupa password?</Link>
          <Link to="/booking">Booking customer</Link>
        </div>
        {mode === 'verify' && !params.get('token') && (
          <Form
            fields={[{ key: 'email', label: 'Kirim ulang tautan verifikasi', type: 'email' }]}
            submit="Kirim ulang"
            onSubmit={async (values) => {
              const result = await api('auth/resend', values);
              setMessage(result.message);
            }}
          />
        )}
      </section>
    </main>
  );
}
