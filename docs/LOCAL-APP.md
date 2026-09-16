# Kapster.id — aplikasi lokal

## Menjalankan

Gunakan Node.js **24.14 atau lebih baru dalam major 24** dan npm. Dari root repository:

```powershell
npm.cmd install
npm.cmd run dev
```

Satu perintah membangun API lalu menjalankan tiga proses di loopback:

| URL | Aplikasi | Akses |
| --- | --- | --- |
| http://127.0.0.1:3000 | Next.js landing page | Publik |
| http://127.0.0.1:5173/booking/garasi-barber | React + Vite booking customer per barbershop | Publik |
| http://127.0.0.1:5173/login | React + Vite login | Publik |
| http://127.0.0.1:5173/owner | Owner | Session Owner |
| http://127.0.0.1:5173/kasir | Kasir | Session Kasir |
| http://127.0.0.1:5173/admin | Admin platform | Session Admin |
| http://127.0.0.1:4000/api/health | NestJS API lokal | Health saja; endpoint bisnis memerlukan session |

Setiap bisnis punya link booking sendiri: `/booking/{slug-bisnis}` (pilih outlet; langsung terpilih jika hanya satu outlet) dan `/booking/{slug-bisnis}/{slug-outlet}`. `/booking` tanpa slug hanya menampilkan kolom untuk membuka link, bukan daftar semua barbershop. Slug dibuat otomatis dari nama bisnis/outlet dan tampil di kartu **Link booking** pada menu Outlet. Rencana produksi memakai subdomain `booking.kapster.id/{slug-bisnis}`.

Gunakan hostname **127.0.0.1 secara konsisten**. Cookie tidak dibagikan antara `localhost` dan `127.0.0.1`. Rute aplikasi lama pada port 3000 diarahkan ke Vite; Next.js hanya merender landing page.

Jika port 3000, 4000, atau 5173 sudah dipakai, launcher berhenti dengan pesan port. Tutup server sebelumnya pada terminal asalnya. Jangan mematikan semua proses Node karena dapat menghentikan pekerjaan lain. Ctrl+C menghentikan stack yang dibuat launcher.

## Akun dan email lokal

Saat database kosong, API membuat organisasi contoh Garasi Barber, outlet Tebet, layanan, kapster, serta tiga akun. Password acak disimpan dalam file lokal yang diabaikan Git:

```powershell
npm.cmd run local:accounts
```

Login sesuai role. Tidak ada endpoint publik untuk membaca password akun contoh. File `.local/accounts.json` hanya untuk pengujian pada komputer ini, bukan credential produksi.

Registrasi Owner membuat organisasi baru berstatus draft. Email verifikasi, reset password, dan undangan Kasir ditulis ke **kotak email filesystem**, bukan dikirim sungguhan:

```powershell
npm.cmd run local:mail
```

Salin tautan terbaru untuk email tujuan yang benar ke browser. Token sekali pakai, kedaluwarsa 30 menit. Mengirim ulang membatalkan token sejenis sebelumnya. Reset password mencabut session lama.

## Skenario uji pengguna

1. Buka link booking bisnis tanpa login, misalnya `/booking/garasi-barber`. Pilih outlet, layanan, kapster, tanggal, jam, dan isi customer. Konfirmasi menyimpan booking dengan **belum dibayar**, lalu menampilkan tautan status pribadi. Tidak ada klaim WhatsApp terkirim atau pembayaran online berhasil.
2. Login Kasir. Buka shift dengan modal awal. Customer datang langsung dicatat di menu **Walk-in**: pilih layanan, kapster (terlihat jam kosong paling cepat, libur, atau cuti), jam, lalu isi nama dan WhatsApp dan tekan **Masukkan antrean**. Walk-in masuk sebagai belum bayar; check-in, mulai layanan, catat uang tunai diterima, dan selesai tetap dilakukan dari antrean. Booking yang belum dibayar tidak dapat diselesaikan.
3. Jika perlu koreksi pembayaran, ajukan refund penuh. Login Owner pada browser/session lain untuk menyetujui atau menolak. Kasir mencatat pengembalian tunai hanya setelah uang diserahkan; dana mengurangi shift yang membayarkan refund.
4. Tutup shift dengan uang fisik terhitung. Selisih harus disertai alasan. Logout ditolak selama operator memiliki shift aktif. Owner dapat force-close dengan alasan.
5. Login Owner. Cek transaksi, laporan per outlet dan konsolidasi, serta ekspor CSV. Refresh browser dan restart API; data tetap ada.
6. Daftar Owner baru dan verifikasi melalui email lokal. Login pertama membuka **onboarding** (`/owner/onboarding`) tanpa sidebar dashboard: profil bisnis dan link, outlet pertama, layanan dan harga, kapster dan jadwal (wajib), tim kasir (opsional), lalu ringkasan dan pengajuan. Setiap langkah langsung disimpan ke API; langkah aktif ada di URL sehingga refresh melanjutkan di tempat yang sama.
7. Login Admin, periksa detail setup, setujui atau minta revisi dengan alasan. Catatan revisi tampil di onboarding Owner; perbaiki lewat tombol Ubah di ringkasan lalu ajukan ulang. Setelah disetujui, Owner menerbitkan outlet dari ringkasan onboarding (atau Edit outlet → Terima booking online) lalu menyalin atau membuka link bisnis. Nama bisnis hanya bisa diubah saat draft atau revisi. Link bisnis hanya bisa diubah sebelum outlet pertama diterbitkan; setelah itu terkunci permanen walau publikasi dimatikan. Bisnis yang ditangguhkan tidak muncul di booking publik; data transaksi tetap tersimpan.
8. Coba jadwal bertumpang tindih, pergantian kapster, blok cuti, dan reschedule. Blok cuti tidak otomatis menghapus booking: daftar jumlah booking terdampak ditampilkan untuk ditangani operator.

Untuk dua role sekaligus, gunakan browser atau profil terpisah karena satu browser memakai satu cookie session.

## Struktur dan batas implementasi

- `app/`, komponen landing dan `public/assets/`: Next.js landing tetap di root agar migrasi tidak mengubah aset pemasaran.
- `apps/web/`: React + Vite dan React Router; halaman operasional membaca API. Komponen presentasi memakai ulang CSS module dari implementasi awal di `main`: booking berbentuk layar ponsel, onboarding terpisah, serta dashboard Owner/Kasir/Admin dengan sidebar gelap dan aksen emas.
- `apps/api/`: NestJS; auth, akses organisasi/outlet, katalog, jadwal, booking, kas, approval, dan audit.
- `.local/kapster.sqlite`: database SQLite file; `.local/mail.jsonl`: email pengembangan. Keduanya diabaikan Git dan tidak dilayani aplikasi.
- `docs/design/MockupUI/`: PRD dan referensi desain yang sebelumnya berada di `public`.
- `prototypes/next-routes/` dan komponen dashboard lama: referensi implementasi awal, tidak dirutekan pada aplikasi aktif. Smoke test UI lama hanya berlaku untuk prototype sebelum migrasi.

Layout dashboard diuji pada desktop, tablet landscape (1024–1279px memakai sidebar ikon; tombol menu membuka sidebar penuh), tablet portrait (≤900px memakai drawer), dan ponsel. Detail booking Owner tampil sebagai panel geser di bawah 1280px. Dialog aksi selalu menampilkan ringkasan data, keterangan, tombol Batal, dan notifikasi hasil; jadwal kapster memakai pilihan hari dan jam, reschedule memakai jam kosong dari server.

Tampilan memakai data API: angka, jumlah baris, status, dan keadaan kosong dapat berbeda dari contoh di `main`. Grafik menghitung data tersimpan; fitur eksternal yang belum terintegrasi tetap ditandai belum aktif. Halaman Owner memuat kalender mingguan, detail booking, pengelolaan outlet, layanan, tim, kas, dan laporan. Kasir mempertahankan tampilan hitam/emas di `main`, termasuk antrean, detail customer, shift, dan pengaturan. Panel detail tenant Admin tersedia dari menu Tenant Detail atau tautan Profil Lengkap.

**Implementasi ini adalah alur operasional lokal, bukan implementasi produksi seluruh PRD.** Fitur yang sudah dihubungkan: auth, verifikasi/reset lokal, setup dan approval, publikasi outlet, CRUD layanan/kapster, jadwal/cuti, undangan dan penonaktifan Kasir, booking publik/kasir, check-in/layanan, reschedule/pembatalan/no-show, kas/shift, refund penuh manual, customer, laporan CSV dan audit.

Tidak dibuat: payment gateway, subscription berbayar, pengiriman email/WhatsApp eksternal, reminder, Google Calendar, upload file, PDF laporan khusus, support ticket, analytics pemasaran, payroll, inventory, atau fitur dummy lain yang belum menjadi alur MVP terkonfirmasi. Halaman tidak menampilkan status integrasi palsu.

Keputusan kerja **khusus versi lokal**, tidak mengganti `[KUNCI]`/`[USUL-v2]` PRD secara diam-diam:

| Area | Implementasi lokal |
| --- | --- |
| Frontend | Next.js landing saja; React/Vite untuk aplikasi dan booking sesuai arahan pengguna terbaru |
| Penyimpanan | SQLite `node:sqlite` agar dapat diuji tanpa instalasi DB; baseline PostgreSQL + Prisma masih pekerjaan pra-produksi |
| Backend repo | Sementara di `apps/api` dalam checkout ini; pemisahan repository dilakukan saat handoff backend |
| Pembayaran | Booking publik bayar tunai di outlet, khusus pengujian tanpa gateway |
| Organisasi | Banyak outlet per bisnis; satu penugasan outlet per Kasir dan Kapster; Owner mengakses seluruh outlet organisasinya |
| Jadwal | WIB, hari kerja per kapster, buffer 10 menit, booking publik minimal 60 menit ke depan, horizon 30 hari |
| Approval | Admin meninjau setup; outlet harus diterbitkan Owner setelah disetujui |
| Link booking | Path `/booking/{slug-bisnis}[/{slug-outlet}]` (struktur PRD §9.4 masih `[USUL-v2]`); slug bisnis unik global dan terkunci permanen setelah pertama kali terbit. Belum ada pengalihan link lama maupun proses ubah link oleh Admin. Subdomain produksi belum dikonfigurasi |
| Subscription | Tidak ditagihkan dan tidak menjadi hambatan uji lokal |
| Refund | Refund penuh tunai: pengajuan → keputusan Owner → pencatatan kas keluar; tidak memanggil provider |

## Keamanan dan verifikasi

Semua layanan hanya bind `127.0.0.1`. API menolak startup `NODE_ENV=production`. Session berupa token acak yang hash-nya disimpan di database, cookie HttpOnly + SameSite Strict. Cookie Secure belum digunakan karena HTTP loopback. Mutasi memerlukan origin lokal yang diizinkan, JSON dan header khusus. Validasi data, otorisasi per endpoint, scope organisasi/outlet, snapshot harga, transaksi DB dan trigger bentrok slot diterapkan server-side. File database, kotak email, PRD, dan prototype ditolak oleh filesystem serving Vite.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:browser
npm.cmd run build
```

Browser test membutuhkan Chrome di `C:\Program Files\Google\Chrome\Application\chrome.exe` serta port 4000 dan 5173 kosong. Tes memakai database terpisah di `.local/test-*` dan `.local/browser-*`, bukan data manual pengguna. Hasil visual/trace ada di `test-results/` dan diabaikan Git.

`node:sqlite` masih mengeluarkan ExperimentalWarning pada Node 24. API memakai operasi SQLite sinkron; ini cukup untuk pengujian lokal, bukan keputusan kapasitas produksi. Sebelum deployment: migrasi PostgreSQL/Prisma, audit ulang RBAC dan query, konfigurasi HTTPS/session/origin, provider email, retensi/backup teruji, pengujian beban serta finalisasi keputusan bisnis terkait.
