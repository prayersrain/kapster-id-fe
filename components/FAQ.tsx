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
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set());
  const allOpen = openItems.size === items.length;
  const columns = [
    items.map((item, index) => ({ item, index })).filter(({ index }) => index % 2 === 0),
    items.map((item, index) => ({ item, index })).filter(({ index }) => index % 2 === 1)
  ];

  function toggleItem(index: number) {
    setOpenItems(current => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleAll() {
    setOpenItems(allOpen ? new Set() : new Set(items.map((_, index) => index)));
  }

  return <section className="section faq" id="faq">
    <div className="container">
      <div className="section-head">
        <div><div className="eyebrow">PERTANYAAN YANG SERING DIAJUKAN</div><h2>Masih Ada Pertanyaan?</h2></div>
        <button className="text-link" type="button" onClick={toggleAll}>{allOpen ? 'Tutup semua FAQ ↑' : 'Lihat semua FAQ →'}</button>
      </div>
      <div className="faq-grid">
        {columns.map((column, columnIndex) => <div className="faq-column" key={columnIndex}>
          {column.map(({ item, index }) => {
            const isOpen = openItems.has(index);
            return <article className={`faq-item ${isOpen ? 'open' : ''}`} style={{ order: index }} key={item.q}>
              <button className="faq-question" type="button" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => toggleItem(index)}>
                <span>{item.q}</span><span className="faq-chevron" aria-hidden="true">⌄</span>
              </button>
              <div className="faq-answer" id={`faq-answer-${index}`} role="region" aria-hidden={!isOpen}>
                <div><p>{item.a}</p></div>
              </div>
            </article>;
          })}
        </div>)}
      </div>
    </div>
  </section>;
}
