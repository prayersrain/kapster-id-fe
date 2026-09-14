import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom';
import { AuthProvider, AuthPage, Protected, useAuth, homeFor } from './auth';
import { Booking, BookingStatus } from './Booking';
import { Workspace } from './Workspace';
import './styles.css';
function Home() {
  const { user, loading } = useAuth();
  return loading ? <p>Memuat…</p> : <Navigate to={user ? homeFor(user) : '/booking'} replace />;
}
function OwnerAlias({ page }: { page: string }) {
  return (
    <Protected roles={['owner']}>
      <Navigate to={`/owner/${page}`} replace />
    </Protected>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />
          <Route path="/verify-email" element={<AuthPage key="verify" mode="verify" />} />
          <Route path="/forgot-password" element={<AuthPage key="forgot" mode="forgot" />} />
          <Route path="/reset-password" element={<AuthPage key="reset" mode="reset" />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/status/:token" element={<BookingStatus />} />
          <Route
            path="/owner/*"
            element={
              <Protected roles={['owner']}>
                <Workspace />
              </Protected>
            }
          />
          <Route
            path="/kasir/*"
            element={
              <Protected roles={['cashier']}>
                <Workspace />
              </Protected>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Protected roles={['admin']}>
                <Workspace />
              </Protected>
            }
          />
          <Route path="/cashier" element={<Navigate to="/kasir" replace />} />
          {['onboarding', 'approval', 'subscription'].map((page) => (
            <Route key={page} path={`/${page}`} element={<OwnerAlias page={page} />} />
          ))}
          <Route
            path="*"
            element={
              <main className="booking-wrap">
                <h1>Halaman tidak ditemukan</h1>
                <Link to="/">Kembali ke aplikasi</Link>
              </main>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
