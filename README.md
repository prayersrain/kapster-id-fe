# Kapster.id Landing Page — Final UI Baseline

Implementasi component-based dari landing page final Kapster.id.

## Stack
- Next.js 16
- React 19
- TypeScript
- CSS custom
- SVG untuk seluruh asset visual yang dikirim di folder `public/`

## Yang sudah diperbaiki
- FAQ sekarang accordion interaktif berbasis React, bukan `<details>` placeholder.
- Tombol **Lihat semua FAQ** dapat membuka/menutup seluruh jawaban.
- Navigasi tidak lagi memakai `href="#"` yang membuat halaman lompat/error.
- Navbar desktop menggunakan anchor ke section yang benar.
- Mobile navigation sekarang memiliki hamburger menu yang berfungsi.
- CTA, demo, pricing, FAQ, dan footer mempunyai target/link yang valid.
- Mockup booking mempunyai select interaktif dan tombol pengecekan slot demo.
- Semua section utama mempunyai `id` + `scroll-margin` agar sticky navbar tidak menutupi judul.
- Focus state ditambahkan untuk penggunaan keyboard.
- Asset lama PNG/JPG tidak lagi dipakai atau dikirim di folder `public/`.

## Asset SVG
Semua file di `public/` sekarang berformat SVG.

### `public/assets/photo/*.svg`
Dipakai sebagai default agar komposisi tetap sedekat mungkin dengan screenshot final. Karena foto asli berasal dari screenshot beresolusi rendah, file ini adalah **SVG container dengan image yang sudah di-upscale dan sharpen**. Ini menjaga gaya foto referensi sekaligus mengurangi blur ketika ditampilkan lebih besar.

> Catatan: mengubah foto menjadi SVG tidak otomatis menjadikan foto benar-benar vector. True vector tracing pada foto akan mengubah tampilan dan justru menjauh dari desain final.

### `public/assets/vector/*.svg`
Alternatif **100% vector** tanpa raster sama sekali. Bisa dipakai jika prioritas utama adalah ketajaman tak terbatas, dengan konsekuensi visual orang/interior menjadi ilustratif, bukan foto realistis.

Logo dan icon UI sudah berupa inline SVG/DOM sehingga tajam pada semua resolusi.

## Struktur komponen
- `Header`
- `Hero`
- `TrustBar`
- `Features`
- `HowItWorks`
- `Roles`
- `ProductShowcase`
- `Testimonials`
- `Pricing`
- `FAQ`
- `FinalCTA`
- `Footer`
- `ui/Button`
- `ui/Icon`
- `ui/Logo`
- `ui/DashboardMockup`
- `ui/BookingPhone`

## Menjalankan project
```bash
npm install
npm run dev
```

Lalu buka:

```text
http://localhost:3000
```

Untuk mengecek production build:

```bash
npm run build
npm run start
```

## Catatan konten
Nominal pricing pada mockup masih placeholder sampai keputusan pricing produk final dikunci. FAQ juga menggunakan wording konservatif untuk item yang masih berupa draft/usulan/dependensi di PRD.
