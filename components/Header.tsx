'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';

const nav = [
  ['Fitur', '#fitur'],
  ['Harga', '#harga'],
  ['Testimoni', '#testimoni'],
  ['FAQ', '#faq'],
];

export function Header(){
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <div className="container nav-wrap">
      <a className="brand" href="#top" aria-label="Kapster.id - kembali ke atas"><Logo/></a>
      <nav className="desktop-nav" aria-label="Navigasi utama">
        {nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <div className="nav-actions">
        <a className="login" href="#kontak">Masuk</a>
        <Button className="nav-cta" href="#kontak">Coba Gratis</Button>
        <button className="menu-toggle" type="button" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} onClick={() => setOpen(v => !v)}>
          <span/><span/><span/>
        </button>
      </div>
    </div>
    {open && <nav className="mobile-nav" aria-label="Navigasi mobile">
      <div className="container">
        {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <a href="#kontak" onClick={() => setOpen(false)}>Masuk / Hubungi</a>
      </div>
    </nav>}
  </header>
}
