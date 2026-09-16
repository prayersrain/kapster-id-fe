import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import s from '../../../components/auth/AuthPage.module.css';

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className={`${s.page} restored-auth`}>
      <aside className={s.visualPane}>
        <a className={s.visualLogo} href="http://127.0.0.1:3000">
          <Logo />
        </a>
        <div className={s.visualContent}>
          <span className={s.kicker}>BUILT FOR GOOD BARBERS</span>
          <h1>
            Bangun operasional yang <em>lebih tenang.</em>
          </h1>
          <p>Kelola booking, jadwal kapster, dan performa barbershop dari satu tempat.</p>
          <ul>
            {[
              'Booking lebih rapi, antrean lebih terkendali',
              'Tim dan outlet terhubung dalam satu sistem',
              'Keputusan bisnis berdasarkan data',
            ].map((v) => (
              <li key={v}>
                <span aria-hidden="true">•</span>
                {v}
              </li>
            ))}
          </ul>
        </div>
        <div className={s.visualFooter}>GOOD BARBERS. BETTER BUSINESS.</div>
      </aside>
      <section className={s.formPane}>
        <Link to="/booking" className={s.mobileLogo}>
          <Logo />
        </Link>
        <div className={s.formWrap}>
          <span className={s.formEyebrow}>SELAMAT DATANG DI KAPSTER.ID</span>
          <h2>{title}</h2>
          <p className={s.formDescription}>{description}</p>
          {children}
        </div>
        <p className={s.formLegal}>Kapster.id · Good barbers. Better business.</p>
      </section>
    </main>
  );
}
