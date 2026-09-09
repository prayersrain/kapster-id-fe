'use client';

import { useState } from 'react';

const items = [
  {
    q: 'Apakah ada biaya setup?',
    a: 'Belum ada keputusan final mengenai biaya setup. Struktur harga dan detail komersial masih perlu dikunci sebelum peluncuran berbayar.'
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Desain produk mensyaratkan isolasi data antar organisasi, pembatasan akses berbasis role, validasi server, audit log, dan perlindungan data sensitif. Implementasinya tetap harus diuji sebelum produksi.'
  },
  {
    q: 'Apakah bisa digunakan di beberapa outlet?',
    a: 'Arah PRD terbaru menyiapkan model organisasi dan outlet agar mendukung multi-outlet. Detail cakupan rilis pertama masih dalam review produk.'
  },
  {
    q: 'Apakah ada kontrak jangka panjang?',
    a: 'Ketentuan kontrak dan masa berlangganan belum ditetapkan di PRD. Bagian ini akan disesuaikan setelah kebijakan komersial final.'
  },
  {
    q: 'Bagaimana cara customer melakukan booking?',
    a: 'Customer membuka link booking barbershop, memilih layanan, kapster, tanggal dan jam, mengisi nama serta nomor WhatsApp, lalu meninjau detail booking. Customer tidak perlu membuat akun Kapster.id.'
  },
  {
    q: 'Apa saja metode pembayaran yang didukung?',
    a: 'Pencatatan pembayaran kasir dapat mencakup metode yang dikonfigurasi outlet. Integrasi pembayaran online dan provider masih bergantung pada keputusan serta validasi teknis dan bisnis.'
  }
];

export function FAQ() {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const columns = [
    items.map((item, index) => ({ item, index })).filter(({ index }) => index % 2 === 0),
    items.map((item, index) => ({ item, index })).filter(({ index }) => index % 2 === 1)
  ];

  function toggleItem(index: number) {
    setOpenItem(current => current === index ? null : index);
  }

  return <section className="section faq" id="faq">
    <div className="container">
      <div className="section-head motion-reveal">
        <div><div className="eyebrow">PERTANYAAN YANG SERING DIAJUKAN</div><h2>Masih Ada Pertanyaan?</h2></div>
        <a className="text-link" href="#kontak">Hubungi kami →</a>
      </div>
      <div className="faq-grid">
        {columns.map((column, columnIndex) => <div className="faq-column" key={columnIndex}>
          {column.map(({ item, index }) => {
            const isOpen = openItem === index;
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;
            return <article className={`faq-item motion-reveal ${isOpen ? 'open' : ''}`} style={{ order: index }} key={item.q}>
              <h3 className="faq-heading">
                <button className="faq-question" id={questionId} type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => toggleItem(index)}>
                  <span>{item.q}</span>
                  <span className="faq-chevron" aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false"><path d="m5 7.5 5 5 5-5" /></svg></span>
                </button>
              </h3>
              <div className="faq-answer" id={answerId} role="region" aria-labelledby={questionId} aria-hidden={!isOpen}>
                <div><p>{item.a}</p></div>
              </div>
            </article>;
          })}
        </div>)}
      </div>
    </div>
  </section>;
}
