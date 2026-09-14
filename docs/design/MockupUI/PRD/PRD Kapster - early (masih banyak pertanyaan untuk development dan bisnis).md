# PRD Kapster.id

**Product Requirements Document — SaaS Operasional Barbershop**  
**Status:** Draft hasil kesepakatan awal  
**Tanggal:** 3 September 2026  
**Pemilik produk:** Tim Kapster.id  
**Target awal:** Barbershop independen dan jaringan kecil-menengah di Jabodetabek

> Dokumen ini menggabungkan isi presentasi awal Kapster.id, hasil analisis prospek Jabodetabek, riset kompetitor, pembahasan legalitas, keputusan produk, serta keputusan arsitektur yang disepakati dalam percakapan tim. Angka pasar dan ekonomi unit yang masih berupa asumsi harus divalidasi lewat wawancara dan pilot.

---

## 1. Ringkasan Eksekutif

Kapster.id dibangun sebagai **B2B SaaS untuk operasional barbershop**, bukan marketplace customer-facing pada tahap MVP. Barbershop mendaftar ke Kapster, mengelola outlet, kapster, layanan, jadwal, booking, customer, transaksi, dan laporan melalui dashboard owner. Kasir menggunakan antarmuka operasional harian. Customer tidak perlu mengunduh aplikasi atau membuat akun Kapster; mereka cukup membuka link booking/checkout milik barbershop, misalnya `kapster.id/nama-barbershop`.

Strategi ini mengurangi kompleksitas marketplace dua sisi. Kapster tidak perlu membangun supply kapster dan demand customer secara bersamaan. Barbershop tetap memiliki brand, kanal komunikasi, dan relasi langsung dengan customer, sementara Kapster menyediakan sistem operasional yang lebih rapi daripada WhatsApp, Instagram, Google Maps, spreadsheet, atau pencatatan manual.

MVP difokuskan pada:

- Dashboard owner.
- Dashboard kasir.
- Public booking/checkout page per outlet.
- Sinkronisasi booking online dan walk-in.
- Penjadwalan hingga 30 hari.
- Pembayaran dan pencatatan transaksi.
- Penggantian kapster dan reschedule, termasuk pada hari H.
- CRM customer minimum dan komunikasi manual melalui WhatsApp.
- Laporan operasional dan pendapatan dasar.

**Dashboard kapster bukan bagian dari base MVP.** Fitur ini disiapkan sebagai addon/custom untuk barbershop besar setelah kebutuhan dan willingness-to-pay terbukti.

---

## 2. Latar Belakang dan Masalah

### 2.1 Masalah barbershop

Banyak barbershop mengelola kegiatan harian dengan kombinasi WhatsApp, DM Instagram, telepon, Google Calendar, buku catatan, dan spreadsheet. Pola tersebut menimbulkan masalah:

- Booking online dan walk-in tidak berada di satu antrean.
- Slot kapster dapat terisi ganda atau terlewat.
- Owner sulit melihat pendapatan, okupansi kursi, performa kapster, no-show, dan repeat customer.
- Ketika kapster sakit atau cuti, kasir harus mencari booking secara manual.
- Reschedule dan penggantian kapster tidak memiliki alur terstruktur.
- Data customer tersebar dan sulit digunakan untuk follow-up atau loyalty.
- Jaringan multi-outlet membutuhkan konsistensi data dan kontrol akses.
- Pembayaran, diskon, komisi, dan settlement sulit direkonsiliasi.

### 2.2 Masalah customer

Customer ingin:

- Mengetahui layanan, harga, durasi, kapster, dan slot yang tersedia.
- Booking tanpa membuat akun atau mengunduh aplikasi baru.
- Mendapat konfirmasi yang jelas.
- Bisa mengubah jadwal jika terjadi kendala.
- Tetap berkomunikasi langsung dengan barbershop favoritnya.

### 2.3 Kesempatan produk

Kapster dapat menjadi lapisan operasional ringan untuk barbershop: mudah dipasang, memakai link brand milik outlet, mendukung booking dan walk-in, serta memberi owner data yang sebelumnya tidak tersedia.

---

## 3. Visi, Misi, dan Prinsip Produk

### Visi

Menjadi sistem operasional yang membantu barbershop Indonesia mengisi kursi lebih optimal, melayani customer lebih konsisten, dan mengambil keputusan berdasarkan data.

### Misi

Menyederhanakan booking, antrean, pembayaran, pengelolaan kapster, customer relationship, dan laporan dalam satu sistem yang tetap menjaga brand serta kepemilikan relasi customer oleh barbershop.

### Prinsip produk

1. **Barbershop tetap menjadi pemilik hubungan customer.** Kapster bukan marketplace yang mengambil alih customer.
2. **Customer friction rendah.** Tidak wajib app, akun, atau login Kapster.
3. **Kasir adalah pusat operasional outlet.** Sistem harus cepat dipakai saat outlet ramai.
4. **Online dan offline harus menyatu.** Booking online dan walk-in menggunakan sumber ketersediaan yang sama.
5. **MVP fokus pada kebutuhan inti.** Hindari microservice, dashboard kapster, dan fitur kompleks sebelum validasi.
6. **Data minimum tetapi berguna.** Simpan data yang diperlukan untuk booking, konfirmasi, transaksi, riwayat, refund, dan loyalty.
7. **Multi-outlet siap sejak model data, bukan dengan kompleksitas berlebihan.**

---

## 4. Target Pasar dan Penerapan Jabodetabek

### 4.1 Segmen prioritas

**Segmen utama MVP:**

- Barbershop independen dengan 2–10 kapster.
- Barbershop dengan satu atau beberapa outlet.
- Outlet yang sudah menerima booking lewat WhatsApp/Instagram.
- Owner yang ingin melihat pendapatan, jadwal, dan performa tanpa spreadsheet.
- Barbershop dengan volume walk-in tinggi dan masalah antrean.

**Segmen sekunder:**

- Jaringan barbershop kecil-menengah dengan 2–20 outlet.
- Barbershop premium yang membutuhkan repeat booking, loyalty, dan CRM.
- Barbershop besar yang membutuhkan addon dashboard kapster, komisi, atau approval.

**Bukan target awal:**

- Marketplace customer umum.
- Barbershop yang hanya membutuhkan payment gateway tanpa sistem operasional.
- Enterprise besar yang sejak awal membutuhkan implementasi sangat custom.

### 4.2 Strategi cluster Jabodetabek

Go-to-market tidak dilakukan serentak ke seluruh Jabodetabek. Pendekatan awal menggunakan cluster agar onboarding, support, wawancara, dan kunjungan lapangan efisien.

1. **Jakarta Selatan** — prioritas awal; kepadatan barbershop, customer urban, dan potensi outlet premium.
2. **BSD/Tangerang Selatan** — cluster kedua; banyak kawasan hunian dan bisnis dengan outlet modern.
3. **Depok** — cluster ketiga; pasar besar, sensitif terhadap harga, cocok untuk menguji paket entry-level.
4. **Bekasi** — cluster berikutnya; potensi volume dan outlet keluarga/jaringan lokal.
5. **Jakarta Barat, Jakarta Timur, Tangerang, Bogor** — ekspansi setelah pola onboarding, retention, dan support stabil.

### 4.3 Penerapan lapangan

- Mulai dengan 10–20 barbershop pilot dalam satu atau dua cluster.
- Lakukan wawancara owner, kasir, dan minimal satu kapster per outlet.
- Observasi jam ramai, proses walk-in, metode pencatatan, pembayaran, pembagian komisi, dan penanganan kapster berhalangan.
- Berikan onboarding langsung dan migrasi data layanan/kapster secara ringan.
- Setiap outlet memperoleh link booking khusus yang dapat ditempel di bio Instagram, WhatsApp, Google Business Profile, QR meja kasir, dan struk.
- Ukur penggunaan nyata, bukan hanya jumlah akun terdaftar.

---

## 5. Analisis Kompetitor dan Substitusi

### 5.1 Kompetitor yang ditinjau

- **CukurPro:** kompetitor B2B operasional paling dekat; mencakup POS, booking, CRM, komisi, inventory, laporan, loyalty, dan multi-cabang berdasarkan informasi publik.
- **Kasera:** solusi kasir/operasional salon dan barbershop dengan fokus pembayaran dan rekonsiliasi yang lebih general.
- **BARBA, BarberBook, CukurKuy:** contoh solusi booking/barbershop dengan tingkat kedalaman operasional berbeda.
- **Substitusi non-software:** WhatsApp, Instagram DM, Google Maps, telepon, buku catatan, spreadsheet, dan kalender pribadi.

### 5.2 Posisi Kapster

Kapster tidak bersaing hanya pada fitur booking. Diferensiasi yang perlu diuji:

- Hybrid online booking + walk-in dalam satu antrean.
- Workflow kasir yang cepat untuk kondisi outlet ramai.
- Penggantian kapster dan reschedule yang jelas, termasuk hari H.
- Link booking yang tetap memakai brand outlet.
- CRM customer minimum tanpa memaksa customer membuat akun.
- Insight okupansi kursi, no-show, repeat booking, dan jam kosong.
- Pengisian slot kosong dan repeat booking sebagai arah pengembangan.
- Harga dan onboarding yang lebih sederhana untuk barbershop kecil.

### 5.3 Implikasi kompetitif

Kapster tidak boleh mengklaim fitur sebagai keunggulan sebelum diuji dan dibandingkan. Riset kompetitor harus diperbarui sebelum pricing final dan sebelum peluncuran publik.

---

## 6. Model Bisnis

### 6.1 Model utama: subscription-first

Pendapatan awal direkomendasikan berasal dari langganan per outlet. Transaction fee dapat menjadi add-on atau biaya opsional untuk pembayaran online, bukan komisi besar atas semua transaksi offline.

Contoh struktur yang perlu divalidasi:

- **Starter:** satu outlet, layanan, kapster, booking, kasir, laporan dasar.
- **Growth:** CRM, reminder, loyalty, laporan lebih lengkap, dan fitur promosi.
- **Multi-outlet:** konsolidasi laporan, role pusat, dan kontrol beberapa outlet.
- **Custom/addon:** dashboard kapster, approval, komisi kompleks, atau integrasi khusus.

Harga final tidak diputuskan dalam dokumen ini sebelum wawancara willingness-to-pay.

### 6.2 Asumsi ekonomi awal

Asumsi diskusi yang belum tervalidasi:

- Average booking: `Rp58.000`.
- Skenario komisi: `10%`.
- Fee tetap: `Rp2.000`.
- Pendapatan platform per booking pada skenario gabungan: `Rp7.800`.

Angka tersebut adalah alat simulasi, bukan janji pendapatan. Model subscription-first dipilih karena lebih mudah dipahami outlet dan tidak terlalu mengurangi margin transaksi offline.

### 6.3 Metrik bisnis

- MRR dan ARR.
- Outlet aktif berbayar.
- Net revenue retention.
- Churn outlet.
- CAC per outlet.
- Payback period.
- LTV/CAC.
- Booking per outlet per hari.
- GMV yang tercatat.
- Persentase booking online vs walk-in.
- Payment take rate jika payment online diaktifkan.

---

## 7. Tujuan Produk dan Non-goals

### 7.1 Tujuan MVP

1. Memudahkan outlet menerima dan mengelola booking.
2. Menyatukan booking online, walk-in, check-in, layanan, dan pembayaran.
3. Memberi owner visibilitas operasional dan pendapatan.
4. Mengurangi konflik jadwal dan beban komunikasi manual.
5. Membuktikan bahwa barbershop mau membayar sistem per outlet.
6. Menghasilkan data penggunaan untuk menentukan fitur tahap berikutnya.

### 7.2 Non-goals MVP

- Marketplace customer dan discovery lintas barbershop.
- Aplikasi mobile customer.
- Akun/login customer Kapster.
- Dashboard kapster sebagai fitur standar.
- Payroll dan HR lengkap.
- Inventory kompleks.
- Akuntansi penuh.
- Sistem iklan atau promosi lintas outlet.
- Microservices.
- Integrasi perangkat kasir khusus sebelum kebutuhan terbukti.

---

## 8. Persona dan Hak Akses

### 8.1 Owner

Pemilik atau pengelola barbershop. Membuat outlet, layanan, harga, jadwal, kapster, user, aturan booking, melihat laporan, dan mengatur pengaturan bisnis.

### 8.2 Kasir

Operator outlet harian. Mengelola antrean, booking, walk-in, check-in, assignment kapster, pembayaran, reschedule, penggantian kapster, dan komunikasi manual ke customer.

### 8.3 Customer

Tidak wajib membuat akun. Mengakses link outlet, memilih layanan/tanggal/jam/kapster, mengisi data minimum, dan menerima detail booking.

### 8.4 Kapster — data entity, bukan dashboard MVP

Data kapster tetap disimpan agar dapat dipakai untuk jadwal, assignment, performa, dan addon masa depan. Pada MVP, kapster tidak harus login atau memiliki dashboard sendiri.

### 8.5 Hak akses minimum

- Owner: seluruh data outlet yang dimiliki; dapat mengundang dan menonaktifkan user.
- Kasir: data operasional outlet sesuai scope; tidak dapat mengubah billing, role owner, atau konfigurasi sensitif.
- Customer: hanya data booking miliknya melalui token/link yang aman.
- Aksi sensitif harus dicatat dalam audit log.

---

## 9. Ruang Lingkup Fungsional MVP

### 9.1 Tenant, organisasi, dan outlet

- Registrasi bisnis dan pembuatan organisasi.
- Satu organisasi dapat memiliki satu atau beberapa outlet.
- Setiap outlet memiliki slug/link booking sendiri.
- Profil outlet: nama, logo, alamat, jam buka, kontak, deskripsi, dan kebijakan.
- Isolasi data antar organisasi wajib.

### 9.2 Onboarding owner

- Buat akun owner.
- Buat outlet pertama.
- Tambahkan layanan.
- Tambahkan kapster.
- Atur jam operasional.
- Atur jadwal/availability maksimal 30 hari ke depan.
- Undang kasir.
- Terbitkan link booking.
- Checklist onboarding dan data dummy/sandbox untuk demo.

### 9.3 Manajemen layanan

- Nama layanan.
- Kategori layanan.
- Harga.
- Durasi.
- Status aktif/nonaktif.
- Kapster yang dapat melakukan layanan, bila diperlukan.
- Harga dapat berbeda per outlet.
- Perubahan harga tidak mengubah transaksi historis.

### 9.4 Manajemen kapster

- Profil kapster dan status aktif/nonaktif.
- Layanan yang dikuasai.
- Jadwal kerja dan hari libur/cuti.
- Availability hingga 30 hari.
- Performa layanan dan pendapatan pada laporan.
- Catatan komisi hanya bila skema tersebut diaktifkan.

### 9.5 Jadwal dan slot

- Owner dapat mengatur jadwal kapster hingga 30 hari.
- Customer dapat memilih booking hari yang sama atau tanggal tertentu sampai satu bulan ke depan.
- Sistem menghitung slot berdasarkan jam buka, durasi layanan, availability kapster, booking aktif, dan buffer jika ada.
- Slot yang bentrok tidak boleh ditawarkan.
- Perubahan jadwal harus memvalidasi benturan ulang.
- Cuti/sakit dapat memblokir availability kapster.

### 9.6 Public booking/checkout page

- Link publik per outlet.
- Informasi outlet dan layanan.
- Pilih layanan.
- Pilih kapster atau opsi "siapa saja" bila outlet mengaktifkan.
- Pilih tanggal dan jam.
- Form nama dan nomor WhatsApp.
- Ringkasan harga, durasi, outlet, kapster, dan waktu.
- Konfirmasi booking.
- Opsi pembayaran online jika provider telah diintegrasikan.
- Halaman status booking tanpa login menggunakan token aman.
- Instruksi datang dan kebijakan pembatalan.

### 9.7 Booking dari kasir

Kasir dapat:

- Melihat agenda dan antrean harian.
- Membuat booking manual.
- Mencatat walk-in.
- Memilih layanan dan kapster.
- Mengubah status booking.
- Check-in customer.
- Menandai sedang dilayani dan selesai.
- Mencatat pembayaran.
- Membatalkan booking sesuai hak akses.
- Mengubah kapster.
- Reschedule ke slot lain.
- Menghubungi customer melalui nomor WhatsApp yang tersimpan.

### 9.8 Penggantian kapster dan reschedule

Ini merupakan kebutuhan penting yang disepakati.

**Kasus:** customer sudah booking untuk tanggal tertentu, kemudian kapster sakit, cuti, atau berhalangan.

**Alur:**

1. Owner/kasir menandai kapster tidak tersedia.
2. Sistem menampilkan booking terdampak.
3. Kasir membuka booking.
4. Kasir memilih salah satu:
   - Ganti kapster pada waktu yang sama.
   - Reschedule tanggal/jam.
   - Ganti kapster sekaligus reschedule.
   - Batalkan dan catat alasan/refund bila relevan.
5. Sistem memvalidasi slot baru.
6. Perubahan tersimpan sebagai riwayat.
7. Kasir menghubungi customer secara manual melalui WhatsApp.
8. Status booking dan audit log diperbarui.

Fitur harus berlaku sebelum hari H maupun pada hari H.

### 9.9 Pembayaran dan transaksi

- Metode pembayaran configurable: tunai, transfer, QRIS/payment provider bila tersedia.
- Status: unpaid, pending, paid, partially refunded, refunded, cancelled.
- Diskon dan harga final tercatat.
- Nomor transaksi unik.
- Receipt sederhana.
- Refund dan dispute mengikuti kebijakan outlet serta provider.
- Kapster tidak langsung dikenakan komisi 10% atas semua transaksi sebagai asumsi default.

### 9.10 CRM customer minimum

- Nama.
- Nomor WhatsApp.
- Riwayat booking dan layanan.
- Total transaksi.
- Outlet asal.
- Catatan operasional yang relevan dan tidak berlebihan.
- Status customer baru/repeat/member jika fitur loyalty diaktifkan.
- Tombol tindakan untuk membuka WhatsApp secara manual.

Customer tetap tidak wajib membuat akun Kapster.

### 9.11 Laporan owner

Laporan MVP:

- Pendapatan per hari/minggu/bulan.
- Jumlah booking.
- Booking online vs walk-in.
- Layanan terlaris.
- Performa kapster.
- Okupansi slot/kursi sebagai metrik operasional.
- No-show dan pembatalan.
- Repeat customer sederhana.
- Rekap pembayaran.
- Export CSV pada tahap yang disetujui.

### 9.12 Notifikasi

Prioritas MVP:

- Konfirmasi booking.
- Pengingat booking jika provider tersedia.
- Perubahan/reschedule.
- Pembatalan.

Pengiriman dapat dimulai dengan template WhatsApp/manual link. Otomasi WhatsApp memerlukan kajian provider, biaya, consent, dan kepatuhan.

---

## 10. Alur Bisnis End-to-End

### 10.1 Onboarding barbershop

1. Owner mendaftar.
2. Membuat organisasi dan outlet.
3. Mengisi profil outlet.
4. Menambahkan layanan, harga, durasi, dan kapster.
5. Mengatur jam operasional dan availability 30 hari.
6. Mengundang kasir.
7. Mengaktifkan link booking.
8. Membagikan link melalui Instagram, WhatsApp, Google, dan QR.

### 10.2 Booking customer

1. Customer membuka link outlet.
2. Memilih layanan.
3. Memilih kapster/tanggal/jam.
4. Mengisi nama dan nomor WhatsApp.
5. Melihat ringkasan.
6. Membayar online atau memilih bayar di outlet, sesuai kebijakan.
7. Sistem membuat booking.
8. Customer menerima detail booking.
9. Booking muncul di dashboard kasir dan agenda owner.

### 10.3 Walk-in

1. Customer datang.
2. Kasir memilih `+ Walk-in`.
3. Kasir mengisi data minimum.
4. Kasir memilih layanan dan kapster yang tersedia.
5. Sistem membuat antrean.
6. Kasir memproses check-in, layanan, dan pembayaran.
7. Riwayat customer tersimpan.

### 10.4 Hari H

1. Kasir membuka antrean hari ini.
2. Customer check-in.
3. Kasir mengatur status dan assignment.
4. Kapster melayani customer.
5. Kasir menerima pembayaran.
6. Transaksi selesai dan laporan diperbarui.

### 10.5 Kapster berhalangan

1. Owner mengetahui cuti/sakit.
2. Availability diblokir.
3. Sistem menampilkan booking terdampak.
4. Kasir mengganti kapster atau reschedule.
5. Customer dihubungi manual melalui WhatsApp.
6. Sistem mencatat perubahan, alasan, dan waktu.

---

## 11. Status dan Aturan Bisnis

### 11.1 Status booking

`pending` → `confirmed` → `checked_in` → `in_service` → `completed`

Status alternatif:

- `cancelled_by_customer`
- `cancelled_by_outlet`
- `no_show`
- `rescheduled`
- `awaiting_payment`

### 11.2 Aturan booking

- Booking tidak boleh melewati availability kapster.
- Booking tidak boleh bentrok dengan booking aktif lain.
- Batas maksimum booking customer: 30 hari ke depan pada MVP.
- Same-day booking boleh diaktifkan/nonaktifkan per outlet.
- Outlet dapat menetapkan cutoff time dan kebijakan pembatalan.
- Harga dan durasi dikunci pada saat booking agar histori tidak berubah saat katalog diperbarui.
- Pembatalan, reschedule, dan penggantian kapster harus memiliki actor, timestamp, dan alasan opsional/wajib sesuai kebijakan.
- Nomor WhatsApp harus divalidasi dengan format lokal yang disepakati.
- Semua query bisnis wajib membawa tenant/outlet scope.

---

## 12. Data Model Konseptual

Entitas inti:

- `Organization`
- `Outlet`
- `User`
- `Role`
- `Barber`
- `Service`
- `BarberService`
- `WorkingSchedule`
- `TimeOff`
- `Customer`
- `Booking`
- `BookingEvent`
- `Payment`
- `Transaction`
- `TransactionItem`
- `Discount`
- `AuditLog`
- `Notification`
- `Subscription`

Relasi utama:

- Organization memiliki banyak Outlet.
- Outlet memiliki banyak User, Barber, Service, Customer, Booking, dan Transaction.
- Booking mengacu pada Outlet, Customer, Service, dan optional Barber.
- Booking memiliki histori perubahan melalui BookingEvent.
- Transaction dapat berasal dari satu booking atau walk-in.
- TimeOff memengaruhi availability Barber.
- User memiliki role dan scope outlet.

Data customer harus dipisahkan antar tenant dan diproses sesuai tujuan yang diberitahukan.

---

## 13. Arsitektur Teknis yang Disepakati

### 13.1 Repository

- **Frontend satu monorepo:** public website/booking dan dashboard internal.
- **Backend repo terpisah:** API dan domain backend.
- Monorepo adalah strategi repository, bukan berarti backend harus microservice.

### 13.2 Backend

- NestJS.
- Modular monolith.
- REST API pada MVP.
- PostgreSQL.
- Prisma ORM.
- Modul terpisah untuk auth, tenant, outlet, catalog, schedule, booking, cashier, payment, CRM, reporting, billing, dan audit.
- Modularitas dijaga agar modul tertentu dapat dipisahkan jika skala benar-benar menuntut.

### 13.3 Frontend

- **Next.js + TypeScript:** landing page dan public booking karena SEO, routing publik, dan performa halaman publik.
- **React + Vite:** dashboard owner dan kasir karena internal SPA tidak membutuhkan SEO dan lebih ringan untuk kebutuhan operasional.
- Shared package untuk types, API client, validation schema, dan UI primitives bila diperlukan.

### 13.4 Infrastruktur awal

- Docker.
- VPS atau managed PostgreSQL.
- Redis + BullMQ bila queue/notifikasi diperlukan.
- Object storage S3-compatible untuk logo/asset.
- Sentry untuk error monitoring.
- PostHog untuk product analytics.
- Metabase untuk laporan internal.
- CI/CD dengan environment development, staging, dan production.

### 13.5 Auth dan keamanan

- Session/token auth yang aman untuk owner/kasir.
- RBAC dan tenant isolation.
- Password hashing dan rate limiting.
- Validasi input server-side.
- Proteksi CSRF/XSS/SQL injection sesuai stack.
- Secret disimpan di secret manager/environment aman, tidak di repository.
- Audit log untuk perubahan booking, pembayaran, role, jadwal, dan data sensitif.
- Backup database dan prosedur restore.
- Retensi data dan penghapusan sesuai kebijakan.

### 13.6 Testing

- Unit test domain dan aturan availability.
- Integration test API dan database.
- Contract test untuk public booking dan dashboard.
- E2E Playwright untuk alur booking, walk-in, pembayaran, penggantian kapster, dan reschedule.
- Load test ringan untuk endpoint slot/booking sebelum pilot lebih besar.

---

## 14. Integrasi Eksternal

### Payment

Gunakan payment provider yang berizin dan sesuai kebutuhan transaksi, misalnya Midtrans atau Xendit setelah due diligence. Kapster tidak menyimpan data kartu. Status pembayaran harus ditangani melalui webhook yang idempotent.

### WhatsApp

MVP dapat menyediakan tombol komunikasi manual. Otomasi WhatsApp Business/API dipertimbangkan setelah consent, template, biaya, dan provider jelas.

### Analytics dan monitoring

- Product analytics: funnel public booking, conversion, no-show, repeat booking.
- Monitoring: error rate, latency, job failure, webhook failure, dan uptime.

---

## 15. Legalitas dan Kepatuhan

Bagian ini adalah checklist produk/bisnis, bukan opini hukum final. Verifikasi dengan notaris/konsultan/legal profesional sebelum pilot berbayar.

### 15.1 Bentuk usaha

- **PT Perorangan** layak dipertimbangkan untuk satu pendiri dan tahap UMK/MVP.
- **PT biasa** lebih tepat jika terdapat co-founder, investor, pembagian saham, atau kebutuhan korporasi formal.
- Keputusan bentuk badan usaha harus mempertimbangkan status UMK, risiko, pajak, perbankan, dan rencana pendanaan.

### 15.2 Administrasi usaha

- Pendirian badan usaha sesuai bentuk yang dipilih.
- NIB dan perizinan melalui OSS.
- KBLI yang sesuai dengan aktivitas software/SaaS dan layanan terkait.
- NPWP dan kewajiban pajak.
- Pendaftaran merek Kapster.id melalui DJKI bila nama sudah final.
- Rekening bisnis dan pembukuan.

### 15.3 PSE dan data pribadi

Karena Kapster mengoperasikan sistem elektronik dan memproses data customer, lakukan penilaian serta pendaftaran PSE Lingkup Privat bila kriterianya terpenuhi.

Dokumen minimum yang perlu disiapkan:

- Privacy Policy.
- Terms of Service/SaaS Agreement.
- Data Processing Agreement dengan barbershop jika Kapster bertindak sebagai processor.
- Kebijakan retensi dan penghapusan data.
- Kebijakan insiden dan breach response.
- Kebijakan refund, pembatalan, dan dispute.
- Consent/notice untuk pengumpulan nomor WhatsApp dan komunikasi.

### 15.4 Prinsip PDP

- Tujuan pemrosesan harus jelas.
- Data yang dikumpulkan minimum dan relevan.
- Akses berdasarkan role dan kebutuhan.
- Customer dapat meminta hak yang berlaku menurut peraturan.
- Pemrosesan oleh vendor/payment provider harus diatur kontrak.
- Hindari menjual atau menggunakan data customer barbershop untuk tujuan yang tidak disetujui.

### 15.5 Payment

Kapster sebaiknya tidak menjadi penyelenggara jasa pembayaran sendiri. Gunakan provider berizin dan pastikan alur settlement, biaya, refund, webhook, dan rekonsiliasi sesuai kontrak provider.

### 15.6 Estimasi biaya awal yang pernah dibahas

- PT biasa: sekitar `Rp7–15 juta`, bergantung layanan, alamat, dan pendampingan.
- PT dengan alamat sendiri: sekitar `Rp6–12 juta` pada asumsi pembahasan awal.
- PT dengan virtual office: sekitar `Rp9–17 juta` pada asumsi pembahasan awal.
- PT Perorangan: PNBP sekitar `Rp50.000`, belum termasuk jasa pendampingan, alamat, dan biaya operasional lain.

Angka ini harus dikonfirmasi ulang kepada notaris/portal resmi karena biaya dan ketentuan dapat berubah.

### 15.7 Urutan legal dan development

Development planning dan legalitas berjalan paralel:

1. Susun PRD, arsitektur, dan prototype internal.
2. Urus badan usaha/NIB dan kaji KBLI.
3. Bangun MVP menggunakan data dummy dan payment sandbox.
4. Siapkan kontrak, Privacy Policy, Terms, DPA, dan kontrol keamanan.
5. Jalankan pilot eksternal setelah legal minimum dan readiness terpenuhi.
6. Jangan memakai data customer asli secara luas sebelum dasar pemrosesan dan kontrol tersedia.

---

## 16. Non-functional Requirements

### Performance

- Public booking page cepat dimuat pada jaringan mobile umum.
- Pencarian slot normal merespons dalam target yang ditentukan saat technical design.
- Kasir dapat membuka antrean harian tanpa reload yang mengganggu.
- Konflik booking harus ditolak secara atomik di backend.

### Availability dan reliability

- Backup terjadwal.
- Retry webhook/notifikasi dengan idempotency key.
- Tidak ada double booking akibat race condition.
- Monitoring endpoint kritis.
- Incident log dan prosedur rollback.

### Security

- Tenant isolation wajib diuji.
- Least privilege untuk role.
- Secret tidak masuk git/log.
- Data sensitif diminimalkan dan dienkripsi saat transit.
- Audit trail untuk aksi penting.

### Accessibility dan usability

- Dashboard dapat dipakai dengan keyboard dasar.
- Kontras dan ukuran teks memadai.
- Kasir dapat menyelesaikan alur umum dengan sedikit klik.
- Bahasa antarmuka awal: Bahasa Indonesia.
- Responsif untuk desktop kasir dan mobile owner.

---

## 17. Prioritas Fitur

### Must have — MVP pilot

- Auth owner/kasir.
- Organization dan outlet.
- Catalog layanan.
- Kapster dan availability.
- Booking publik hingga 30 hari.
- Booking manual/walk-in.
- Antrean kasir.
- Check-in, status layanan, pembayaran manual.
- Ganti kapster dan reschedule sebelum maupun pada hari H.
- Customer minimum + nomor WhatsApp.
- Dashboard owner dasar.
- Laporan pendapatan dan booking dasar.
- Audit log penting.

### Should have — setelah alur inti stabil

- Payment online.
- Reminder otomatis.
- QR booking.
- Export CSV.
- Loyalty sederhana.
- Promo/diskon.
- Multi-outlet reporting.
- Pengisian slot kosong.

### Could have — addon/eksperimen

- Dashboard kapster.
- Komisi dan approval kompleks.
- Kapster availability self-service.
- Integrasi WhatsApp API penuh.
- Inventory.
- Payroll.
- Integrasi POS/perangkat.

### Won't have — base MVP

- Marketplace lintas barbershop.
- Aplikasi customer.
- Customer account Kapster.
- Microservices.
- Fitur enterprise yang belum divalidasi.

---

## 18. Roadmap Penerapan

### Fase 0 — Discovery dan validasi

- Wawancara owner, kasir, dan kapster.
- Validasi proses booking, walk-in, cuti/sakit, komisi, pembayaran, dan laporan.
- Validasi pricing dan willingness-to-pay.
- Audit ulang kompetitor.
- Pilih 10–20 outlet pilot.

### Fase 1 — Foundation

- Badan usaha/legal minimum paralel.
- Monorepo frontend dan repo backend.
- Design system setelah referensi UI/UX disepakati.
- Schema tenant/outlet/user/service/barber/customer/booking.
- Auth, RBAC, audit log, CI/CD, staging.

### Fase 2 — MVP internal

- Owner setup.
- Public booking.
- Cashier queue.
- Walk-in.
- Payment manual.
- Reschedule dan ganti kapster.
- Laporan dasar.
- Test dengan data dummy.

### Fase 3 — Pilot terbatas

- Onboarding outlet nyata dengan persetujuan dan dokumen.
- Support langsung.
- Pantau booking, no-show, konflik slot, waktu transaksi, dan feedback.
- Perbaiki reliability sebelum menambah fitur.

### Fase 4 — Paid beta dan scale cluster

- Pricing berbayar.
- Payment online dan reminder bila siap.
- Expand dari Jakarta Selatan/BSD ke Depok/Bekasi.
- Tambahkan CRM/loyalty berdasarkan data penggunaan.

---

## 19. KPI dan Acceptance Criteria

### KPI produk

- Waktu onboarding outlet sampai link booking aktif.
- Persentase outlet yang membuat minimal satu layanan dan jadwal.
- Booking berhasil tanpa bantuan support.
- Booking online yang berubah menjadi completed.
- Persentase booking online dan walk-in tercatat di sistem.
- Waktu kasir membuat walk-in.
- Waktu reschedule/ganti kapster.
- Conflict/double booking rate.
- No-show rate.
- Weekly active outlets.
- Retention 30/60/90 hari.

### Acceptance criteria MVP

- Owner dapat membuat outlet, layanan, kapster, dan availability 30 hari.
- Customer dapat booking same-day atau tanggal hingga 30 hari jika kebijakan outlet mengizinkan.
- Slot bentrok tidak dapat dipesan secara bersamaan.
- Booking publik muncul di dashboard kasir.
- Kasir dapat membuat walk-in dari antrean.
- Kasir dapat check-in, menandai selesai, dan mencatat pembayaran.
- Kasir dapat mengganti kapster tanpa menghilangkan histori.
- Kasir dapat reschedule sebelum hari H dan pada hari H.
- Customer dapat diidentifikasi melalui nama dan nomor WhatsApp.
- Owner dapat melihat pendapatan, booking, layanan, performa kapster, no-show, dan pembatalan dasar.
- Akses kasir tidak dapat mengubah pengaturan owner yang sensitif.
- Semua perubahan booking kritis tercatat di audit log.
- Data antar outlet/organisasi tidak bocor dalam pengujian.

---

## 20. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Owner tidak mau mengubah kebiasaan WhatsApp/manual | Adopsi rendah | Onboarding langsung, setup cepat, fokus pain point kasir |
| Kasir merasa sistem memperlambat antrean | Sistem ditinggalkan saat jam ramai | Uji usability di jam ramai, kurangi klik, dukung walk-in |
| Double booking | Hilangnya kepercayaan | Validasi atomik, database constraint, integration test |
| Kapster sakit/cuti mendadak | Customer kecewa | Impacted booking list, ganti kapster/reschedule hari H, audit trail |
| Biaya/payment dispute | Risiko finansial | Provider berizin, webhook idempotent, kebijakan refund jelas |
| Kebocoran data customer | Risiko hukum dan reputasi | Tenant isolation, RBAC, minimisasi data, logging, DPA |
| Terlalu cepat membangun marketplace | Fokus dan biaya melebar | Subscription-first, marketplace sebagai fase setelah metrik terbukti |
| Scope creep dashboard kapster | MVP terlambat | Jadikan addon/custom, simpan entity dan API boundary seperlunya |
| Kompetitor lebih matang | Sulit diferensiasi | Fokus workflow kasir, hybrid online/offline, onboarding dan cluster |
| Angka pasar/asumsi bisnis tidak akurat | Salah pricing/forecast | Wawancara, pilot, cohort analysis, update asumsi |

---

## 21. Open Questions yang Harus Divalidasi

1. Paket harga dan batas outlet/kapster yang paling dapat diterima.
2. Apakah customer default memilih kapster tertentu atau opsi siapa saja.
3. Apakah same-day booking selalu aktif atau configurable.
4. Durasi buffer antar layanan.
5. Kebijakan deposit, pembayaran di muka, pembatalan, dan no-show.
6. Provider payment dan kebutuhan QRIS.
7. Apakah reminder dimulai manual atau otomatis.
8. Kebutuhan komisi kapster pada tiap segmen.
9. Apakah satu nomor customer dapat digunakan lintas outlet dalam satu organisasi.
10. Kebutuhan inventory dan payroll setelah pilot.
11. Kebutuhan dashboard kapster untuk outlet besar.
12. Persyaratan legal final berdasarkan struktur usaha dan alur payment.
13. Nama/brand final dan ketersediaan merek/domain.
14. SLA, support channel, dan proses incident response.

---

## 22. Keputusan yang Sudah Disepakati

- Kapster dimulai sebagai **SaaS operasional B2B**, bukan marketplace.
- Barbershop mendaftar dan memperoleh dashboard owner, dashboard kasir, dan link booking outlet.
- Customer tidak perlu app atau akun Kapster.
- Data customer tetap disimpan minimum untuk booking, konfirmasi, transaksi, riwayat, refund, dan loyalty.
- Dashboard kapster tidak masuk base MVP; menjadi addon/custom.
- Kasir menjadi pusat booking, walk-in, check-in, assignment, pembayaran, reschedule, dan penggantian kapster.
- Owner mengatur jadwal maksimal 30 hari ke depan.
- Customer dapat booking hari yang sama atau tanggal hingga satu bulan ke depan.
- Penggantian kapster dan reschedule tersedia sebelum hari H maupun pada hari H.
- Customer dapat dihubungi manual melalui nomor WhatsApp yang tersimpan.
- Subscription-first menjadi arah monetisasi awal.
- Legalitas dan development berjalan paralel.
- PT Perorangan dapat dipertimbangkan untuk satu pendiri/UMK; PT biasa untuk kebutuhan co-founder/investor/skala lebih formal.
- Frontend public menggunakan Next.js; dashboard owner/kasir menggunakan React + Vite.
- Frontend dikelola dalam satu monorepo; backend terpisah.
- Backend menggunakan NestJS modular monolith, bukan microservices.
- UI/UX final belum ditetapkan. Mockup desain sebelumnya dihapus dan tidak menjadi baseline desain.

---

## 23. Next Actions

| Prioritas | Action | Output | Owner | Status |
|---|---|---|---|---|
| P0 | Validasi alur operasional melalui wawancara owner/kasir/kapster | Interview notes dan process map | Tim produk | Belum dimulai |
| P0 | Mengunci scope MVP dan acceptance criteria | PRD disetujui | Tim produk | Draft ini |
| P0 | Menentukan badan usaha, NIB, KBLI, dan review legal | Legal checklist | Founder + legal | Paralel |
| P0 | Menentukan struktur repo dan domain model | Architecture decision record | Engineering | Belum dimulai |
| P1 | Menyusun referensi UI/UX dari produk pembanding | Reference board | FE/Product | Belum dimulai |
| P1 | Membuat prototype baru setelah arah visual disetujui | Prototype terpisah | Product/Design | Ditunda |
| P1 | Membangun foundation auth, tenant, outlet, RBAC | Tested foundation | Engineering | Belum dimulai |
| P1 | Membangun booking, kasir, dan scheduling | MVP vertical slice | Engineering | Belum dimulai |
| P1 | Menyiapkan 10–20 outlet pilot | Pilot list dan onboarding plan | GTM | Belum dimulai |
| P2 | Menentukan pricing dan payment provider | Pricing/payment decision | Founder | Belum dimulai |

---

## 24. Referensi dan Catatan Sumber

Referensi yang digunakan dalam pembahasan awal:

- Presentasi awal `Kapster_id_Presentasi.pptx` yang dibagikan dalam percakapan.
- Percakapan keputusan produk dan arsitektur tim.
- Riset publik kompetitor: CukurPro, Kasera, BARBA, BarberBook, dan CukurKuy.
- OSS dan AHU untuk bentuk usaha/perizinan.
- Bank Indonesia untuk perizinan penyelenggara sistem pembayaran.
- UU Pelindungan Data Pribadi.
- Panduan PSE Lingkup Privat Komdigi.
- Data publik BPS untuk konteks wilayah Jabodetabek.

Informasi publik kompetitor, angka pasar, estimasi biaya, dan asumsi revenue perlu diverifikasi ulang pada saat keputusan komersial dibuat.

---

## Appendix A — Contoh Demo Scenario

**Outlet:** Garasi Barber, Tebet  
**Kapster:** Dimas, Raka, Bagas  
**Layanan:** Potong, Potong + Cuci, Premium Cut  
**Customer:** Andi Pratama  

1. Andi membuka link Garasi Barber dari Instagram.
2. Memilih Potong + Cuci dan slot 10:00 dengan Dimas.
3. Booking muncul di antrean kasir.
4. Andi check-in.
5. Dimas ternyata tidak dapat hadir.
6. Kasir membuka booking terdampak dan memilih Raka pada jam yang sama.
7. Kasir menghubungi Andi melalui WhatsApp.
8. Andi tetap dilayani Raka.
9. Kasir mencatat pembayaran Rp50.000 setelah diskon.
10. Booking menjadi completed dan masuk laporan owner.

Skenario ini menjadi alur prioritas untuk prototype dan E2E test MVP.

---

## Appendix B — Batasan Dokumen

PRD ini bukan dokumen desain visual final, kontrak hukum, spesifikasi API final, atau financial model final. Detail tersebut dibuat setelah discovery, validasi legal, technical design, dan persetujuan scope.