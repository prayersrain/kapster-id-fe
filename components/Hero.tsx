import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { DashboardMockup } from './ui/DashboardMockup';
import { BookingPhone } from './ui/BookingPhone';

export function Hero() {
  return <section className="hero" id="top">
    <div className="hero-media" aria-hidden="true"><img src="/assets/photo/hero-barber.webp" alt="" /></div>
    <div className="hero-overlay" />
    <div className="container hero-grid">
      <div className="hero-copy motion-reveal">
        <div className="eyebrow gold">SISTEM OPERASIONAL BARBERSHOP</div>
        <h1>Kelola Barbershop<br />Lebih Mudah,<br /><span>Kursi Selalu Terisi.</span></h1>
        <p>Kapster.id adalah SaaS untuk barbershop. Atur booking, jadwal, kasir, customer, dan laporan dalam satu sistem. Tanpa ribet. Tanpa spreadsheet.</p>
        <div className="hero-actions">
          <Button href="#kontak">Coba Gratis</Button>
          <a className="btn btn-outline-light" href="#demo"><Icon name="play" size={18} />Lihat Demo</a>
        </div>
        <div className="hero-benefits"><span><b>✓</b> Setup cepat</span><span><b>✓</b> Tanpa kartu kredit</span><span><b>✓</b> Didukung tim lokal</span></div>
      </div>
      <div className="hero-product motion-reveal"><DashboardMockup /><BookingPhone /></div>
    </div>
  </section>
}
