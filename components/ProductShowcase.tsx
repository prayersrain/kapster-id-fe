import { Button } from './ui/Button';
import { DashboardMockup } from './ui/DashboardMockup';
import { BookingPhone } from './ui/BookingPhone';

export function ProductShowcase() {
  return <section className="section product" id="demo">
    <div className="container product-grid">
      <div className="product-copy motion-reveal">
        <div className="eyebrow">BOOKING PUBLIK &amp; DASHBOARD</div>
        <h2>Pengalaman Modern<br />untuk Customer,<br />Kontrol Penuh untuk Anda.</h2>
        <p>Customer booking dengan mudah. Anda tetap punya kontrol penuh di belakang layar.</p>
        <Button href="#kontak">Lihat Demo Sistem</Button>
      </div>
      <div className="product-visual motion-reveal">
        <div className="product-device-stage">
          <DashboardMockup laptop view="report" />
          <BookingPhone />
        </div>
        <div className="hand-note note-a">Tampilan booking<br />untuk customer</div>
        <svg className="scribble-arrow arrow-a" viewBox="0 0 100 48" aria-hidden="true"><path d="M4 40c24-2 43-8 65-22 7-4 13-8 23-10M82 4l11 4-5 11" /></svg>
        <div className="hand-note note-b">Dashboard lengkap<br />untuk operasional<br />barbershop</div>
        <svg className="scribble-arrow arrow-b" viewBox="0 0 90 64" aria-hidden="true"><path d="M82 6C70 25 57 38 22 51M30 41l-9 10 13 4" /></svg>
      </div>
    </div>
  </section>;
}
