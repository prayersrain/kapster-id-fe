const data = [
  { name: 'Reza Pratama', role: 'Owner, Garasi Barber', quote: 'Kapster.id bikin operasional kita jauh lebih rapi. Booking naik, tim jadi lebih fokus melayani customer.', image: '/assets/photo/owner.webp' },
  { name: 'Andika Saputra', role: 'Owner, Housecut Barbershop', quote: 'Sistemnya mudah dipakai, fitur lengkap, dan tim support-nya responsif banget.', image: '/assets/photo/cashier.webp' },
  { name: 'Bima Santoso', role: 'Owner, Kala Barber', quote: 'Laporan dan data customer sangat membantu kita untuk berkembang. Highly recommended!', image: '/assets/photo/hero-barber.webp' }
];

export function Testimonials() {
  return <section className="section testimonials" id="testimoni">
    <div className="container">
      <div className="section-head motion-reveal">
        <div><div className="eyebrow">APA KATA MEREKA</div><h2>Dipercaya oleh Barber Profesional.</h2></div>
        <a href="#kontak">Lihat semua testimoni →</a>
      </div>
      <div className="test-grid">
        {data.map(({ name, role, quote, image }) => <article className="testimonial motion-reveal" key={name}>
          <p>“{quote}”</p>
          <div className="person">
            <span className="person-avatar"><img src={image} alt="" /></span>
            <div><strong>{name}</strong><small>{role}</small></div>
          </div>
          <div className="stars" aria-label="5 dari 5 bintang">★★★★★</div>
        </article>)}
      </div>
    </div>
  </section>;
}
