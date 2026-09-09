'use client';

import { useState } from 'react';

export function BookingPhone({ idPrefix = 'booking' }: { idPrefix?: string }){
  const [checked, setChecked] = useState(false);
  const outletId = `${idPrefix}-outlet`;
  const serviceId = `${idPrefix}-service`;
  const slotId = `${idPrefix}-slot`;
  return <div className="phone" aria-label="Mockup halaman booking customer">
    <div className="phone-notch"/>
    <div className="phone-screen">
      <div className="phone-brand">GARASI BARBER</div>
      <h3>Book Your<br/>Next Cut</h3>
      <p>Pilih layanan, kapster, dan waktu.</p>
      <label htmlFor={outletId}>Pilih Outlet</label>
      <select id={outletId} defaultValue="Tebet" onChange={() => setChecked(false)}><option>Tebet</option><option>Kemang</option></select>
      <label htmlFor={serviceId}>Pilih Layanan</label>
      <select id={serviceId} defaultValue="Haircut · 45 menit" onChange={() => setChecked(false)}><option>Haircut · 45 menit</option><option>Haircut + Wash · 60 menit</option></select>
      <label>Pilih Kapster</label>
      <div className="barber-row" aria-label="Pilihan kapster"><span/><span/><span/><span/></div>
      <label htmlFor={slotId}>Pilih Tanggal & Waktu</label>
      <select id={slotId} defaultValue="Kam, 11 Sep · 10:00" onChange={() => setChecked(false)}><option>Kam, 11 Sep · 10:00</option><option>Kam, 11 Sep · 11:00</option><option>Kam, 11 Sep · 13:30</option></select>
      <button type="button" onClick={() => setChecked(true)}>{checked ? '3 Slot Tersedia ✓' : 'Lihat Slot Tersedia →'}</button>
      <div className="phone-feedback" aria-live="polite">{checked ? 'Demo: slot berhasil diperiksa.' : ''}</div>
    </div>
  </div>
}
