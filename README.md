# Kapster.id Landing Page

Landing page responsif untuk Kapster.id, platform SaaS yang membantu operasional barbershop mengelola booking, jadwal, kasir, customer, outlet, dan laporan dalam satu sistem.

## Teknologi

- Next.js 16
- React 19
- TypeScript
- Custom CSS tanpa UI framework
- Intersection Observer untuk animasi masuk yang ringan

## Fitur antarmuka

- Hero dan product showcase dengan mockup dashboard Kapster.id.
- Navigasi desktop dan menu hamburger mobile.
- Layout responsif untuk desktop, tablet, dan mobile.
- FAQ accordion aksesibel yang hanya membuka satu jawaban dalam satu waktu.
- Transisi halus pada card, tombol, mockup, FAQ, dan container utama.
- Dukungan `prefers-reduced-motion` untuk pengguna yang mengurangi animasi.
- Focus state untuk navigasi keyboard.
- Anchor setiap section disesuaikan dengan sticky header.

## Kebijakan aset visual

Aset foto yang dipakai pada halaman **tetap menggunakan WebP, bukan foto yang dibungkus di dalam SVG**.

| Jenis aset | Format runtime | Penggunaan |
| --- | --- | --- |
| Foto hero, owner, kasir, testimonial, dan CTA | WebP | `public/assets/photo/*.webp` |
| Mockup booking customer | PNG transparan | `public/assets/ui/booking-phone.png` |
| Ikon UI dan logo | Inline SVG/DOM | Dirender langsung oleh komponen React |
| Favicon | SVG | `public/favicon.svg` |

Jadi, project ini tidak memakai SVG sebagai pengganti aset foto. SVG hanya digunakan untuk elemen yang memang bersifat vector seperti ikon, logo, dan favicon. File alternatif di `public/assets/vector/` dan sumber PNG di `public/assets/photo/png/` tidak direferensikan oleh halaman runtime saat ini.

## Struktur utama

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  Header.tsx
  Hero.tsx
  Features.tsx
  HowItWorks.tsx
  Roles.tsx
  ProductShowcase.tsx
  Testimonials.tsx
  Pricing.tsx
  FAQ.tsx
  FinalCTA.tsx
  Footer.tsx
  MotionEffects.tsx
  ui/
public/
  assets/photo/       # Foto WebP
  assets/ui/          # Mockup UI raster
  assets/vector/      # Alternatif vector, tidak dipakai runtime
```

## Menjalankan project

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` pada browser.

## Validasi

```bash
npm run typecheck
npm run build
```

`typecheck` memvalidasi TypeScript, sedangkan `build` memastikan project dapat dikompilasi sebagai production build Next.js.

## Catatan konten

Nominal paket, klaim bisnis, serta kebijakan komersial masih berupa konten landing page dan perlu diverifikasi kembali sebelum digunakan pada peluncuran produksi.
