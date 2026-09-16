# PRD Kapster.id — v2.0 (Multi-Outlet)

**Product Requirements Document — SaaS Operasional Barbershop**

| | |
|---|---|
| **Versi** | 2.0 |
| **Status** | Draft terkonsolidasi — siap direview sebelum dikunci |
| **Tanggal** | 6 September 2026 |
| **Menggantikan** | v1.x (`kapster-prd-current-open.md`, 3 September 2026) |
| **Pemilik produk** | Tim Kapster.id |
| **Target awal** | Barbershop independen dan jaringan kecil-menengah di Jabodetabek |
| **Perubahan utama** | Dukungan multi-outlet, perbaikan model ekonomi payment gateway, resolusi kontradiksi internal |

---

## 0. Cara Membaca Dokumen Ini

### 0.1 Hierarki kebenaran

Jika terjadi perbedaan antar bagian, urutan otoritas adalah:

1. **Bagian 23 — Ledger Keputusan** (paling otoritatif, setiap keputusan punya ID)
2. **Bagian 9–14** (model organisasi, RBAC, ruang lingkup, alur, aturan bisnis, data model)
3. Bagian lain sebagai konteks dan latar belakang

### 0.2 Konvensi penandaan

| Tanda | Arti |
|---|---|
| `[KUNCI]` | Keputusan sudah disepakati, tidak dibahas ulang tanpa alasan baru |
| `[USUL-v2]` | Perubahan atau tambahan baru pada v2 yang **membutuhkan persetujuan** sebelum jadi keputusan |
| `[TERBUKA]` | Belum diputuskan, terdaftar di Bagian 24 |
| `[ASUMSI]` | Angka atau pernyataan yang belum tervalidasi lapangan |

Setiap item `[USUL-v2]` juga terdaftar lengkap di **Appendix B** agar mudah direview sekaligus.

### 0.3 Ringkasan perubahan v1 → v2

**Perubahan struktural**

1. **Multi-outlet menjadi kapabilitas inti**, bukan fitur fase berikutnya. Model data, RBAC, routing link booking, laporan, shift kasir, dan billing semuanya dirancang outlet-aware sejak awal.
2. **Istilah dirapikan.** Pada v1 terjadi kerusakan penggantian kata: istilah "outlet" tergantikan menjadi "barbershop" di seluruh dokumen, menghasilkan kalimat tidak bermakna seperti *"Barbershop dengan satu atau beberapa barbershop"* dan nama paket harga *"perluasan struktur organisasi"* yang sebenarnya adalah *"Multi-outlet"*. Bagian 4 kini mengunci glosarium resmi.
3. **Ledger keputusan diberi ID dan dikelompokkan** (Bagian 23), menggantikan daftar datar ±70 butir yang banyak mengulang isi bagian lain.
4. **Item terbuka diberi ID, pemilik, dan tenggat** (Bagian 24).

**Perbaikan kontradiksi**

5. Pembayaran online wajib vs kas kasir — diperjelas ruang lingkupnya.
6. Payment online dipindahkan dari *Should have* ke *Must have* karena alur booking publik MVP bergantung padanya.
7. Diskon: kontradiksi antar bagian diselesaikan.
8. Penyedia pembayaran: kontradiksi Midtrans/Xendit vs Ojire Tech diselesaikan.
9. Hak akses kasir atas jadwal: kalimat yang saling bertentangan diselesaikan.
10. Bagian CRM yang tercampur isi laporan dikembalikan ke tempatnya.

**Perbaikan risiko bisnis dan operasional**

11. **Biaya payment gateway** — asumsi v1 "ditanggung Kapster dari subscription" berpotensi membuat margin negatif pada barbershop bervolume tinggi. Dibahas ulang di Bagian 7.4.
12. **Aliran dana** — v1 tidak menjelaskan ke rekening siapa uang customer masuk. Ini punya konsekuensi hukum. Dibahas di Bagian 7.5 dan 17.5.
13. **Uang no-show pada booking prabayar** — v1 tidak menentukan nasibnya. Diputuskan di NB-14.
14. **Kapster berhalangan mendadak** — v1 mengunci wewenang di Owner saja, menciptakan kebuntuan operasional pagi hari. Diperbaiki di RB-07.
15. **Satu akun Owner per organisasi** — risiko penguncian akses total. Diperbaiki di RB-02.

**Tambahan baru**

16. Glosarium dan konvensi istilah (Bagian 4).
17. Mekanisme penguncian slot dinyatakan eksplisit (Bagian 13.4).
18. Zona waktu dan penanganan tanggal (Bagian 13.5).
19. KPI diberi angka target, acceptance criteria dibuat terukur (Bagian 21).
20. Kebijakan retensi data dengan periode konkret (Bagian 17.6).

---

## 1. Ringkasan Eksekutif

Kapster.id adalah **B2B SaaS untuk operasional barbershop**, bukan marketplace customer-facing. Barbershop berlangganan, lalu mengelola outlet, kapster, layanan, jadwal, booking, customer, transaksi, dan laporan melalui dashboard. Kasir memakai antarmuka operasional harian. Customer tidak perlu mengunduh aplikasi atau membuat akun; mereka membuka link booking milik barbershop, misalnya `kapster.id/garasi-barber` atau `kapster.id/garasi-barber/tebet`.

Strategi ini menghapus masalah ayam-telur marketplace dua sisi. Kapster tidak perlu membangun pasokan kapster dan permintaan customer secara bersamaan. Barbershop tetap memiliki brand, kanal komunikasi, dan relasi customer, sementara Kapster menyediakan sistem operasional yang lebih rapi daripada kombinasi WhatsApp, Instagram, Google Maps, spreadsheet, dan buku catatan.

**Perubahan cakupan utama pada v2: mendukung organisasi dengan banyak outlet sejak MVP.** Satu organisasi dapat memiliki satu atau banyak outlet. Setiap outlet punya link booking, jadwal, kapster, kasir, laci kas, dan laporan sendiri, sementara Owner memperoleh laporan konsolidasi lintas outlet. Keputusan ini diambil karena segmen sekunder yang disasar adalah jaringan 2–20 outlet, dan menambahkan multi-outlet setelah data produksi berjalan jauh lebih mahal daripada menyiapkannya sejak model data.

**Cakupan MVP:**

- Dashboard Owner (lintas outlet dan per outlet)
- Dashboard Kasir (terikat pada satu outlet)
- Halaman booking publik per outlet
- Sinkronisasi booking online dan walk-in dalam satu antrean
- Penjadwalan hingga 30 hari ke depan
- Pembayaran online untuk booking publik dan pencatatan transaksi kasir
- Penggantian kapster dan reschedule, termasuk pada hari H
- Shift kasir dan rekonsiliasi laci kas
- CRM customer minimum dan komunikasi WhatsApp manual
- Laporan operasional dan pendapatan dasar, per outlet dan konsolidasi

**Bukan bagian dari MVP:** dashboard kapster, aplikasi customer, akun customer, marketplace lintas barbershop, payroll, inventory, akuntansi penuh, dan microservices.

---

## 2. Latar Belakang dan Masalah

### 2.1 Masalah barbershop

Banyak barbershop mengelola kegiatan harian dengan kombinasi WhatsApp, DM Instagram, telepon, Google Calendar, buku catatan, dan spreadsheet. Pola tersebut menimbulkan masalah:

- Booking online dan walk-in tidak berada dalam satu antrean yang sama.
- Slot kapster bisa terisi ganda atau terlewat.
- Owner sulit melihat pendapatan, okupansi kursi, performa kapster, no-show, dan customer yang kembali.
- Ketika kapster sakit atau cuti, kasir harus menyisir booking secara manual.
- Reschedule dan penggantian kapster tidak punya alur terstruktur.
- Data customer tersebar dan sulit dipakai untuk follow-up.
- Pembayaran, diskon, komisi, dan settlement sulit direkonsiliasi.
- Selisih uang laci kasir sulit ditelusuri.

### 2.2 Masalah khusus jaringan multi-outlet

Masalah berikut muncul begitu satu pemilik menjalankan lebih dari satu outlet, dan inilah yang mendorong dukungan multi-outlet sejak MVP:

- Owner harus membuka beberapa sumber data terpisah untuk melihat performa keseluruhan.
- Katalog layanan dan harga tidak konsisten antar outlet, padahal brand-nya sama.
- Kapster yang bekerja lintas outlet tidak bisa dijadwalkan tanpa risiko bentrok.
- Tidak ada pembanding performa antar outlet.
- Kasir di satu outlet berpotensi melihat data outlet lain jika sistem tidak memisahkan akses.
- Rekonsiliasi kas harus dipisah per outlet per shift, tetapi tetap perlu terlihat terpusat oleh Owner.

### 2.3 Masalah customer

Customer ingin mengetahui layanan, harga, durasi, kapster, dan slot yang tersedia; melakukan booking tanpa membuat akun atau mengunduh aplikasi; mendapat konfirmasi yang jelas; bisa mengubah jadwal bila ada kendala; dan tetap berkomunikasi langsung dengan barbershop favoritnya.

### 2.4 Kesempatan produk

Kapster dapat menjadi lapisan operasional ringan untuk barbershop: cepat dipasang, memakai link brand milik barbershop, mendukung booking dan walk-in dalam satu antrean, serta memberi Owner data yang sebelumnya tidak tersedia — dan tetap masuk akal ketika barbershop tersebut tumbuh dari satu menjadi lima outlet.

---

## 3. Visi, Misi, dan Prinsip Produk

### Visi

Menjadi sistem operasional yang membantu barbershop Indonesia mengisi kursi lebih optimal, melayani customer lebih konsisten, dan mengambil keputusan berdasarkan data.

### Misi

Menyederhanakan booking, antrean, pembayaran, pengelolaan kapster, relasi customer, dan laporan dalam satu sistem yang tetap menjaga brand serta kepemilikan relasi customer oleh barbershop.

### Prinsip produk

1. **Barbershop tetap pemilik hubungan customer.** Kapster bukan marketplace yang mengambil alih customer.
2. **Friksi customer rendah.** Tidak wajib aplikasi, akun, atau login Kapster.
3. **Kasir adalah pusat operasional.** Sistem harus tetap cepat dipakai saat outlet ramai.
4. **Online dan offline menyatu.** Booking online dan walk-in memakai sumber ketersediaan yang sama.
5. **MVP fokus pada kebutuhan inti.** Hindari microservice, dashboard kapster, dan fitur kompleks sebelum validasi.
6. **Data minimum tetapi berguna.** Simpan hanya yang diperlukan untuk booking, konfirmasi, transaksi, riwayat, refund, dan kepatuhan.
7. **Multi-outlet siap sejak model data.** Setiap query bisnis membawa scope organisasi dan outlet, tanpa menambah kompleksitas antarmuka bagi barbershop yang hanya punya satu outlet.
8. **Barbershop satu outlet tidak boleh dirugikan oleh kemampuan multi-outlet.** `[USUL-v2]` Jika organisasi hanya punya satu outlet, seluruh elemen antarmuka bernuansa multi-outlet disembunyikan — tidak ada pemilih outlet, tidak ada laporan konsolidasi, tidak ada level menu tambahan.

---

## 4. Glosarium dan Konvensi Istilah

Bagian ini baru pada v2 dan bersifat mengikat. Kerusakan istilah pada v1 berasal dari ketiadaan glosarium.

| Istilah | Definisi | Jangan dipakai untuk |
|---|---|---|
| **Organisasi** (`Organization`) | Badan usaha pelanggan Kapster. Unit langganan dan unit isolasi data tertinggi. Satu organisasi memiliki satu atau banyak outlet. | Menyebut satu lokasi fisik |
| **Outlet** (`Outlet`) | Satu lokasi fisik tempat layanan diberikan. Punya alamat, jam operasional, kapster, kasir, laci kas, link booking, dan laporan sendiri. | Menyebut badan usaha |
| **Barbershop** | Istilah percakapan untuk bisnis pelanggan Kapster secara umum. **Tidak dipakai sebagai nama entitas teknis.** | Nama tabel, field, atau scope |
| **Kapster** (`Barber`) | Penata rambut yang melayani customer. Entitas data, tanpa dashboard pada MVP. | Menyebut nama produk Kapster.id |
| **Kapster.id** | Nama produk/perusahaan penyedia SaaS. Selalu ditulis lengkap. | Menyebut individu penata rambut |
| **Customer** | Pelanggan akhir barbershop. Bukan pengguna berakun Kapster.id. | Menyebut barbershop sebagai pelanggan Kapster.id |
| **Klien** / **Pelanggan Kapster.id** | Barbershop yang berlangganan. | Customer akhir |
| **Slot** | Rentang waktu yang dapat dipesan pada seorang kapster di satu outlet. | Jadwal kerja kapster secara umum |
| **Booking** | Reservasi customer atas satu slot. Mencakup booking online maupun walk-in yang dicatat kasir. | Transaksi pembayaran |
| **Shift** | Periode kerja seorang kasir di satu outlet, dari opening sampai closing, dengan rekonsiliasi laci kas. | Jadwal kerja kapster |

**Aturan penulisan:** nama entitas teknis ditulis `PascalCase` dan dalam bahasa Inggris (`Organization`, `Outlet`, `Barber`, `Booking`). Teks naratif memakai bahasa Indonesia. Jangan pernah melakukan penggantian kata secara global pada dokumen ini tanpa memeriksa hasilnya satu per satu.

---

## 5. Target Pasar dan Penerapan Jabodetabek

### 5.1 Segmen prioritas

**Segmen utama MVP**

- Barbershop independen dengan 2–10 kapster dalam satu outlet.
- Barbershop yang sudah menerima booking lewat WhatsApp atau Instagram.
- Owner yang ingin melihat pendapatan, jadwal, dan performa tanpa spreadsheet.
- Outlet dengan volume walk-in tinggi dan masalah antrean.

**Segmen sekunder — kini didukung sejak MVP** `[USUL-v2]`

- Jaringan barbershop kecil-menengah dengan **2–20 outlet** di bawah satu organisasi.
- Barbershop premium yang membutuhkan repeat booking dan CRM.
- Barbershop besar yang membutuhkan addon dashboard kapster, komisi, atau approval.

Pada v1 segmen jaringan disebut sebagai segmen sekunder tetapi ruang lingkup MVP dibatasi satu organisasi satu outlet, sehingga segmen ini sebenarnya tidak dapat dilayani sama sekali. v2 menutup celah tersebut.

**Bukan target awal**

- Marketplace customer umum.
- Barbershop yang hanya membutuhkan payment gateway tanpa sistem operasional.
- Enterprise besar yang sejak awal menuntut implementasi sangat custom.
- Waralaba dengan kepemilikan outlet berbeda badan usaha — ini memerlukan model data lintas organisasi yang tidak masuk MVP. `[USUL-v2]`

### 5.2 Strategi cluster Jabodetabek

Go-to-market tidak dilakukan serentak. Pendekatan cluster dipilih agar onboarding, support, wawancara, dan kunjungan lapangan tetap efisien.

1. **Jakarta Selatan** — prioritas awal; kepadatan barbershop, customer urban, potensi outlet premium.
2. **BSD/Tangerang Selatan** — cluster kedua; kawasan hunian dan bisnis dengan barbershop modern.
3. **Depok** — cluster ketiga; pasar besar, sensitif harga, cocok menguji paket entry-level.
4. **Bekasi** — potensi volume dan jaringan lokal keluarga.
5. **Jakarta Barat, Jakarta Timur, Tangerang, Bogor** — ekspansi setelah pola onboarding, retensi, dan support stabil.

### 5.3 Penerapan lapangan

- Mulai dengan 10–20 outlet pilot dalam satu atau dua cluster.
- **Sertakan minimal 2 organisasi multi-outlet dalam pilot** agar jalur multi-outlet benar-benar teruji, bukan hanya tersedia di kode. `[USUL-v2]`
- Wawancarai Owner, kasir, dan minimal satu kapster per outlet.
- Observasi jam ramai, proses walk-in, metode pencatatan, pembayaran, pembagian komisi, dan penanganan kapster berhalangan.
- Berikan onboarding langsung dan migrasi ringan data layanan/kapster.
- Setiap outlet memperoleh link booking sendiri untuk ditempel di bio Instagram, WhatsApp, Google Business Profile, QR meja kasir, dan struk.
- Ukur penggunaan nyata, bukan jumlah akun terdaftar.

---

## 6. Analisis Kompetitor dan Substitusi

### 6.1 Kompetitor yang ditinjau

- **CukurPro** — kompetitor B2B operasional paling dekat; mencakup POS, booking, CRM, komisi, inventory, laporan, loyalty, dan multi-cabang menurut informasi publik.
- **Kasera** — solusi kasir/operasional salon dan barbershop dengan fokus pembayaran dan rekonsiliasi yang lebih umum.
- **BARBA, BarberBook, CukurKuy** — solusi booking dengan kedalaman operasional berbeda-beda.
- **Substitusi non-software** — WhatsApp, Instagram DM, Google Maps, telepon, buku catatan, spreadsheet, kalender pribadi. Ini adalah kompetitor sesungguhnya bagi sebagian besar prospek.

### 6.2 Catatan penting soal posisi kompetitif `[USUL-v2]`

CukurPro sudah mengklaim dukungan multi-cabang. Artinya multi-outlet **bukan diferensiasi**, melainkan **syarat minimum untuk ikut bersaing** di segmen jaringan. Ini justru memperkuat alasan memasukkannya ke MVP: tanpa itu, Kapster.id otomatis gugur pada setiap prospek yang punya lebih dari satu lokasi, termasuk prospek satu outlet yang sedang berencana membuka cabang kedua.

Diferensiasi yang masih perlu diuji:

- Hybrid online booking + walk-in dalam satu antrean.
- Workflow kasir yang cepat pada kondisi ramai.
- Penggantian kapster dan reschedule yang jelas, termasuk hari H.
- Link booking yang tetap memakai brand barbershop.
- CRM minimum tanpa memaksa customer membuat akun.
- Rekonsiliasi laci kas dengan kontrol variance.
- Onboarding dan harga yang lebih sederhana untuk barbershop kecil.

### 6.3 Implikasi

Kapster.id tidak boleh mengklaim fitur sebagai keunggulan sebelum diuji dan dibandingkan langsung. Riset kompetitor wajib diperbarui sebelum penetapan harga final dan sebelum peluncuran publik. `[TERBUKA — OP-09]`

---

## 7. Model Bisnis dan Ekonomi Unit

### 7.1 Model utama: subscription-first

Pendapatan awal berasal dari langganan. Transaction fee dapat menjadi tambahan opsional untuk pembayaran online, bukan komisi besar atas seluruh transaksi offline.

### 7.2 Struktur paket — basis penagihan multi-outlet `[USUL-v2]`

v1 memuat paket bernama "perluasan struktur organisasi", yang merupakan hasil kerusakan penggantian kata dari "Multi-outlet". Struktur berikut memulihkan maksud aslinya dan menambahkan basis penagihan yang eksplisit.

| Paket | Cakupan | Basis penagihan |
|---|---|---|
| **Starter** | 1 outlet, layanan, kapster, booking, kasir, laporan dasar | Per organisasi |
| **Growth** | Starter + CRM, reminder, laporan lengkap, promosi | Per organisasi |
| **Chain** | Growth + multi-outlet, laporan konsolidasi, role tingkat pusat, katalog terpusat | **Biaya dasar organisasi + biaya per outlet aktif** |
| **Custom/Addon** | Dashboard kapster, approval, komisi kompleks, integrasi khusus | Negosiasi |

**Prinsip penagihan multi-outlet:** organisasi ditagih berdasarkan **jumlah outlet aktif**, bukan jumlah kapster atau volume transaksi. Alasannya: outlet adalah unit yang paling mudah dipahami dan diverifikasi barbershop, tidak menghukum outlet yang ramai, dan tumbuh secara alami mengikuti pertumbuhan klien.

Outlet yang berstatus nonaktif tidak ditagih tetapi datanya dipertahankan sesuai kebijakan retensi.

Nominal harga belum diputuskan. `[TERBUKA — OP-01]`

### 7.3 Asumsi ekonomi — dikoreksi dari v1

v1 mencantumkan asumsi `Rp58.000` nilai booking rata-rata, komisi `10%`, fee tetap `Rp2.000`, dan pendapatan platform `Rp7.800` per booking. **Angka-angka itu adalah sisa dari model marketplace lama dan bertentangan dengan arah subscription-first.** Pada v2 angka tersebut dipertahankan hanya sebagai konteks GMV, bukan sebagai proyeksi pendapatan Kapster.id.

| Metrik | Nilai | Status |
|---|---|---|
| Nilai transaksi rata-rata di outlet | `Rp58.000` | `[ASUMSI]` — perlu validasi wawancara |
| Booking per outlet per hari | `20–35` | `[ASUMSI]` |
| Proporsi booking online vs walk-in awal | `20% : 80%` | `[ASUMSI]` — kemungkinan besar walk-in dominan di awal |
| Pendapatan Kapster.id per booking | **Tidak berlaku** | Model subscription, bukan komisi |
| Pendapatan Kapster.id per outlet | Nilai langganan bulanan | `[TERBUKA — OP-01]` |

### 7.4 Risiko biaya payment gateway — perlu keputusan ulang `[USUL-v2]`

v1 menetapkan: *"Biaya payment gateway ditanggung oleh Kapster melalui pendapatan subscription."* Ini adalah **risiko finansial terbesar dalam dokumen v1** dan perlu ditinjau ulang sebelum pilot berbayar.

**Ilustrasi masalah.** Dengan asumsi biaya per transaksi online sekitar `Rp2.500`–`Rp4.000` (QRIS/VA/e-wallet, bergantung metode dan provider):

| Skenario | Booking online/bulan | Biaya PG/bulan | Kondisi |
|---|---|---|---|
| Outlet sepi | 40 | ± `Rp120.000` | Aman |
| Outlet sedang | 150 | ± `Rp450.000` | Menggerus margin |
| Outlet ramai | 400 | ± `Rp1.200.000` | **Berpotensi melebihi nilai langganan** |

Semakin sukses sebuah outlet memakai Kapster.id, semakin rugi Kapster.id. Ini adalah insentif yang terbalik. Masalahnya menjadi lebih besar pada organisasi multi-outlet karena biaya berlipat mengikuti jumlah outlet.

**Opsi penanganan:**

| Opsi | Mekanisme | Konsekuensi |
|---|---|---|
| **A. Kuota wajar** | Langganan mencakup N transaksi online/bulan; kelebihan ditagih per transaksi | Melindungi margin, tetap terasa sederhana. **Rekomendasi.** |
| **B. Biaya dibebankan ke customer** | Customer membayar biaya layanan kecil di atas harga | Menambah friksi checkout, berisiko menurunkan konversi |
| **C. Biaya dibebankan ke barbershop** | Dipotong dari settlement atau ditagih terpisah | Paling lazim di industri, tetapi menambah hambatan penjualan |
| **D. Tetap ditanggung penuh** | Seperti v1 | Sederhana dijual, berbahaya secara margin |

**Rekomendasi:** Opsi A, dengan kuota ditentukan setelah data volume pilot tersedia. `[TERBUKA — OP-02]`

### 7.5 Aliran dana dan posisi hukum Kapster.id `[USUL-v2]`

v1 tidak menjelaskan **ke rekening siapa uang customer masuk**. Ini bukan detail teknis, melainkan penentu posisi hukum.

- Jika dana masuk ke rekening Kapster.id lalu diteruskan ke barbershop, Kapster.id sedang menampung dan menyalurkan dana pihak lain. Aktivitas ini berpotensi masuk kategori penyelenggara jasa pembayaran yang memerlukan izin, dan bertentangan dengan prinsip pada Bagian 17.5 yang menyatakan Kapster.id sebaiknya tidak menjadi penyelenggara jasa pembayaran.
- Jika dana langsung masuk ke akun merchant milik barbershop melalui fitur sub-merchant atau split payment dari provider berizin, Kapster.id hanya berperan sebagai perangkat lunak yang memfasilitasi. Posisi ini jauh lebih aman.

**Keputusan yang diusulkan:** gunakan model **sub-merchant / direct settlement ke rekening barbershop**. Kapster.id tidak pernah menampung dana customer. Implikasinya, setiap outlet membutuhkan identitas merchant sendiri pada provider, dan proses onboarding harus mencakup langkah tersebut.

Untuk organisasi multi-outlet, perlu diputuskan apakah rekening settlement berada di tingkat organisasi atau per outlet. Default yang diusulkan: **per outlet, dengan opsi memakai satu rekening organisasi**. `[TERBUKA — OP-03]`

### 7.6 Metrik bisnis

**Metrik langganan:** MRR, ARR, ARPA per organisasi, ARPO per outlet, net revenue retention, churn organisasi, churn outlet, CAC per organisasi, payback period, LTV/CAC.

**Metrik penggunaan:** outlet aktif mingguan, booking per outlet per hari, GMV tercatat, proporsi booking online vs walk-in, tingkat aktivasi link booking, rata-rata outlet per organisasi. Metrik terakhir ini penting untuk mengukur apakah investasi multi-outlet terbayar.

**Metrik biaya:** biaya payment gateway per outlet per bulan, rasio biaya PG terhadap nilai langganan. `[USUL-v2]`

---

## 8. Tujuan Produk dan Non-Goals

### 8.1 Tujuan MVP

1. Memudahkan barbershop menerima dan mengelola booking.
2. Menyatukan booking online, walk-in, check-in, layanan, dan pembayaran dalam satu antrean.
3. Memberi Owner visibilitas operasional dan pendapatan, per outlet maupun konsolidasi.
4. Mengurangi konflik jadwal dan beban komunikasi manual.
5. Membuktikan barbershop bersedia membayar sistem operasional secara berlangganan.
6. **Membuktikan organisasi multi-outlet dapat dilayani tanpa implementasi khusus.** `[USUL-v2]`
7. Menghasilkan data penggunaan untuk menentukan fitur tahap berikutnya.

### 8.2 Non-goals MVP

- Marketplace customer dan discovery lintas barbershop.
- Aplikasi mobile customer.
- Akun atau login customer Kapster.id.
- Dashboard kapster sebagai fitur standar.
- Payroll dan HR lengkap.
- Inventory kompleks.
- Akuntansi penuh.
- Sistem iklan atau promosi lintas barbershop.
- Microservices.
- Integrasi perangkat kasir khusus sebelum kebutuhan terbukti.
- **Transfer booking antar outlet.** Customer yang ingin pindah outlet membuat booking baru. `[USUL-v2]`
- **Waralaba lintas badan usaha.** `[USUL-v2]`
- **Stok dan inventaris produk per outlet.** `[USUL-v2]`
---

## 9. Model Organisasi Multi-Outlet

Bagian ini seluruhnya baru pada v2 dan menjadi inti perubahan.

### 9.1 Hierarki

```
Organization  (badan usaha, unit langganan, batas isolasi data)
  └── Outlet   (lokasi fisik, 1..N)
        ├── Link booking publik
        ├── Kapster yang ditugaskan
        ├── Jadwal & slot
        ├── Kasir & shift
        ├── Laci kas
        └── Transaksi & laporan
```

**Aturan pokok:**

- Satu organisasi memiliki **minimal satu** outlet. Organisasi tanpa outlet tidak dapat menerbitkan link booking.
- Data **tidak boleh** bocor antar organisasi dalam keadaan apa pun.
- Data **boleh** dibagikan antar outlet dalam satu organisasi hanya jika dinyatakan eksplisit di bagian ini.

### 9.2 Apa yang dibagi dan apa yang dipisah `[USUL-v2]`

Ini adalah keputusan desain terpenting pada multi-outlet. Salah menempatkan satu baris di sini akan menimbulkan kerja ulang besar di kemudian hari.

| Entitas | Cakupan | Alasan |
|---|---|---|
| `Organization` | — | Akar hierarki |
| `Outlet` | Milik organisasi | Lokasi fisik |
| `User` (Owner/Kasir) | Organisasi, dengan penugasan ke outlet | Satu orang bisa bekerja di beberapa outlet |
| `Service` (katalog) | **Organisasi** | Brand yang sama harus punya daftar layanan yang sama |
| `ServicePrice` | **Outlet** | Harga wajar berbeda antar lokasi |
| `Barber` | **Organisasi**, ditugaskan ke satu atau banyak outlet | Kapster bisa dipindah atau bekerja lintas outlet |
| `BarberOutletAssignment` | Outlet | Menentukan kapster mana muncul di link booking outlet mana |
| `WorkingSchedule` | **Kapster + outlet** | Kapster bisa bekerja Senin–Rabu di outlet A, Kamis–Sabtu di outlet B |
| `TimeOff` | **Kapster (lintas outlet)** | Kapster yang sakit tidak masuk di outlet mana pun |
| `Customer` | **Organisasi** | Customer yang datang ke cabang lain tetap dikenali. Lihat 9.3 |
| `Booking` | Outlet | Terjadi di satu lokasi |
| `Transaction` | Outlet | Rekonsiliasi kas per lokasi |
| `CashierShift` | **Kasir + outlet** | Laci kas bersifat fisik dan lokal |
| `Subscription` | Organisasi | Unit penagihan |
| `AuditLog` | Organisasi, dengan penanda outlet | Owner perlu telusur lintas outlet |

**Catatan penting soal `WorkingSchedule`:** karena jadwal terikat pada pasangan kapster dan outlet, sistem **wajib** memvalidasi bahwa seorang kapster tidak dijadwalkan di dua outlet pada waktu yang bertumpang tindih. Ini adalah aturan validasi baru yang tidak ada pada v1 karena v1 hanya mengenal satu outlet.

### 9.3 Customer lintas outlet — keputusan dan alasannya `[USUL-v2]`

**Keputusan: `Customer` berada pada tingkat organisasi, bukan outlet.**

Alasan:

- Customer yang biasa ke cabang Tebet lalu mencoba cabang Kemang tetap dikenali, sehingga riwayatnya utuh dan Owner memperoleh gambaran repeat customer yang benar.
- Jika customer disimpan per outlet, satu orang akan tercatat sebagai beberapa customer berbeda, membuat laporan repeat customer menyesatkan.

Konsekuensi yang harus ditangani:

- Kasir outlet A **dapat menemukan** customer yang sebelumnya hanya pernah datang ke outlet B, saat mencari berdasarkan nomor WhatsApp. Ini disengaja dan perlu dicantumkan dalam kebijakan privasi klien.
- Kasir **hanya melihat** nama dan nomor WhatsApp saat pencarian. Riwayat kunjungan di outlet lain **tidak** ditampilkan kepada kasir; hanya Owner yang dapat melihat riwayat lintas outlet.
- Pemberitahuan privasi kepada customer harus menyebut nama organisasi, bukan nama outlet, agar pemrosesan lintas cabang punya dasar yang jujur. `[TERBUKA — OP-04]`

### 9.4 Struktur link booking `[USUL-v2]`

| Kondisi | Pola URL | Perilaku |
|---|---|---|
| Organisasi satu outlet | `kapster.id/{slug-organisasi}` | Langsung ke halaman booking outlet tersebut |
| Organisasi banyak outlet | `kapster.id/{slug-organisasi}` | Halaman pemilih outlet, menampilkan alamat dan jam buka |
| Outlet spesifik | `kapster.id/{slug-organisasi}/{slug-outlet}` | Langsung ke halaman booking outlet tersebut |

**Aturan:**

- `slug-organisasi` unik secara global dan tidak dapat diubah setelah dipublikasikan tanpa proses khusus.
- `slug-outlet` unik dalam satu organisasi.
- Setiap outlet **selalu** memiliki URL langsung sendiri, bahkan pada organisasi satu outlet, agar penambahan outlet kedua tidak merusak link yang sudah tersebar di Instagram atau QR code.
- Halaman pemilih outlet mengurutkan berdasarkan jarak apabila customer mengizinkan lokasi, dan berdasarkan urutan yang ditetapkan Owner jika tidak.

### 9.5 Pengalaman satu outlet tetap sederhana `[USUL-v2]`

Persyaratan wajib: organisasi dengan satu outlet **tidak boleh** melihat kompleksitas multi-outlet.

- Pemilih outlet disembunyikan.
- Menu laporan tidak menampilkan tab konsolidasi.
- Wizard onboarding tidak menanyakan struktur cabang.
- Menu "Kelola Outlet" tetap ada tetapi hanya berisi satu entri, dan berfungsi sebagai jalur menambah outlet kedua.

Elemen multi-outlet muncul otomatis begitu outlet kedua dibuat.

### 9.6 Batas MVP untuk multi-outlet

Yang **masuk** MVP:

- Banyak outlet dalam satu organisasi.
- Katalog layanan terpusat dengan harga per outlet.
- Kapster ditugaskan ke satu atau banyak outlet.
- Kasir terikat pada outlet tertentu.
- Laporan per outlet dan laporan konsolidasi.
- Shift dan laci kas per outlet.
- Penagihan berdasarkan jumlah outlet aktif.

Yang **tidak** masuk MVP:

- Transfer booking antar outlet.
- Perpindahan stok atau produk antar outlet.
- Role manajer regional yang membawahi sebagian outlet.
- Konsolidasi keuangan tingkat lanjut atau akuntansi antar cabang.
- Perbandingan otomatis performa antar outlet dengan skor atau peringkat. Owner dapat membandingkan secara manual dari laporan konsolidasi.

---

## 10. Persona dan Hak Akses

### 10.1 Owner

Pemilik atau pengelola organisasi. Membuat outlet, layanan, harga, jadwal, kapster, user, aturan booking; melihat seluruh laporan; mengatur langganan dan pengaturan bisnis. **Akses Owner mencakup seluruh outlet dalam organisasinya.**

### 10.2 Kasir

Operator harian, **terikat pada satu atau beberapa outlet tertentu**. Mengelola antrean, booking, walk-in, check-in, assignment kapster, pembayaran, reschedule, penggantian kapster, shift dan laci kas, serta komunikasi manual ke customer.

Kasir **tidak dapat** melihat data outlet yang tidak ditugaskan kepadanya. Jika seorang kasir ditugaskan ke lebih dari satu outlet, ia harus memilih outlet aktif saat login dan hanya dapat memiliki **satu shift aktif** pada satu waktu di seluruh organisasi. `[USUL-v2]`

### 10.3 Customer

Tidak memiliki akun. Mengakses link outlet, memilih layanan, tanggal, jam, dan kapster; mengisi data minimum; membayar; menerima detail booking melalui halaman bertoken.

### 10.4 Kapster — entitas data, bukan dashboard MVP

Data kapster disimpan untuk keperluan jadwal, assignment, performa, dan addon di masa depan. Pada MVP kapster tidak login dan tidak memiliki dashboard.

### 10.5 Matriks hak akses

| Kemampuan | Owner | Kasir |
|---|---|---|
| Membuat/menonaktifkan outlet | Ya | Tidak |
| Melihat data lintas outlet | Ya | Tidak |
| Mengelola katalog layanan (tingkat organisasi) | Ya | Tidak |
| Mengubah harga layanan | Ya | Tidak |
| Menambah/menonaktifkan kapster | Ya | Tidak |
| Menugaskan kapster ke outlet | Ya | Tidak |
| Mengatur jadwal kerja dasar kapster | Ya | Tidak |
| Menandai kapster cuti/sakit — jangka panjang | Ya | Tidak |
| Menandai kapster tidak hadir — **hari ini saja** | Ya | **Ya** `[USUL-v2]` |
| Mengubah jam operasional outlet | Ya | Tidak |
| Memblokir slot tertentu hari ini karena kendala operasional | Ya | Ya |
| Membuat booking dan walk-in | Ya | Ya |
| Check-in, ubah status, catat pembayaran | Ya | Ya |
| Ganti kapster dan reschedule | Ya | Ya |
| Membatalkan booking | Ya | Ya, dengan alasan |
| Mengajukan refund | Ya | Ya |
| Menyetujui refund | Ya | Tidak |
| Mencari customer berdasarkan nama/WhatsApp | Ya | Ya, dalam organisasi |
| Melihat riwayat transaksi customer | Ya | Tidak |
| Melihat riwayat customer lintas outlet | Ya | Tidak |
| Laporan pendapatan lengkap | Ya | Tidak |
| Laporan operasional hari ini dan kemarin | Ya | Ya, outlet sendiri |
| Membuka/menutup shift | Tidak berlaku | Ya |
| Force-close shift kasir | Ya | Tidak |
| Meninjau variance laci kas | Ya | Tidak |
| Mengedit/menghapus transaksi tercatat | Tidak | Tidak |
| Mengundang user | Ya | Tidak |
| Mengelola langganan dan tagihan | Ya | Tidak |

### 10.6 Perbaikan terhadap v1 `[USUL-v2]`

**a. Beberapa akun Owner diperbolehkan.** v1 menetapkan satu organisasi memiliki satu akun Owner. Ini menciptakan titik kegagalan tunggal: jika Owner kehilangan akses email atau perangkat, seluruh organisasi terkunci, termasuk operasional kasir. v2 mengizinkan **hingga tiga akun Owner** per organisasi, dengan satu ditandai sebagai Owner utama untuk keperluan penagihan. Ini juga realistis untuk usaha yang dimiliki bersama.

**b. Kasir dapat menandai ketidakhadiran kapster untuk hari berjalan.** v1 menetapkan hanya Owner yang dapat menandai kapster sakit atau cuti. Dalam praktik, kapster mengabari sakit pukul 08.00 dan Owner belum tentu dapat dihubungi, sementara antrean sudah berjalan. v2 memisahkan dua hal:

- **Ketidakhadiran hari ini** — kasir dapat menandainya, Owner menerima notifikasi, tercatat di audit log.
- **Cuti terjadwal atau nonaktif jangka panjang** — tetap wewenang Owner.

**c. Kontradiksi wewenang jadwal diselesaikan.** v1 menyatakan pada dua baris berurutan bahwa kasir "dapat mengubah jadwal operasional/availability sesuai kebutuhan" sekaligus "tidak dapat mengubah jadwal dasar dan availability kapster secara penuh". v2 menegaskan: kasir dapat memblokir slot dan menandai ketidakhadiran **untuk hari berjalan saja**; seluruh perubahan jadwal berulang atau di masa depan adalah wewenang Owner.

---

## 11. Ruang Lingkup Fungsional MVP

### 11.1 Organisasi dan outlet

- Registrasi bisnis dan pembuatan organisasi.
- **Organisasi dapat memiliki satu atau banyak outlet.** `[USUL-v2]`
- Setiap outlet memiliki slug dan link booking sendiri.
- Profil outlet: nama, logo, alamat, koordinat, jam buka per hari, kontak, deskripsi, kebijakan pembatalan.
- Outlet dapat dinonaktifkan tanpa dihapus; link booking outlet nonaktif menampilkan pemberitahuan dan menyarankan outlet terdekat dalam organisasi yang sama. `[USUL-v2]`
- Isolasi data antar organisasi wajib dan wajib diuji.

### 11.2 Onboarding Owner

1. Membuat akun dengan nomor WhatsApp, email, dan kata sandi.
2. Verifikasi melalui OTP ke email.
3. Wizard bertahap dengan indikator kemajuan.
4. Mengisi data organisasi: nama brand, slug, badan usaha.
5. Membuat outlet pertama: nama, alamat, jam operasional, kontak.
6. Menambahkan minimal satu layanan beserta harga.
7. Menambahkan minimal satu kapster dan menugaskannya ke outlet.
8. Mengatur jadwal kerja kapster.
9. Mengundang kasir melalui email dan menugaskannya ke outlet.
10. Link booking aktif otomatis setelah syarat minimum terpenuhi.

Wizard **tidak** menanyakan jumlah cabang di awal. Outlet kedua ditambahkan belakangan lewat menu Kelola Outlet. `[USUL-v2]`

### 11.3 Manajemen layanan

- Katalog layanan berada di tingkat organisasi: nama, kategori, durasi standar, deskripsi, status aktif.
- **Harga ditetapkan per outlet.** Outlet baru mewarisi harga dari outlet pertama sebagai nilai awal, lalu dapat diubah. `[USUL-v2]`
- Layanan dapat dinonaktifkan pada outlet tertentu tanpa menghapusnya dari katalog organisasi. `[USUL-v2]`
- Penentuan kapster mana yang dapat melakukan layanan tertentu, bila diperlukan.
- **Harga dan durasi dikunci pada saat booking dibuat.** Perubahan katalog tidak mengubah transaksi historis.

### 11.4 Manajemen kapster

- Profil kapster dan status aktif/nonaktif pada tingkat organisasi.
- **Penugasan ke satu atau banyak outlet.** `[USUL-v2]`
- Layanan yang dikuasai.
- Jadwal kerja per pasangan kapster–outlet.
- Cuti dan hari libur berlaku lintas outlet.
- Availability hingga 30 hari ke depan.
- Performa dan pendapatan pada laporan, dapat difilter per outlet.
- Catatan komisi hanya bila skema tersebut diaktifkan. Perhitungan komisi kompleks bukan bagian MVP.

### 11.5 Jadwal dan slot

- Owner mengatur jadwal kapster hingga 30 hari ke depan.
- Customer dapat memesan hari yang sama atau tanggal hingga 30 hari ke depan.
- Customer **wajib** memilih kapster tertentu. Opsi "kapster mana saja" tidak tersedia pada MVP.
- Sistem menghitung slot dari jam buka outlet, durasi layanan, availability kapster, booking aktif, dan buffer.
- Interval slot mengikuti durasi layanan yang dipilih.
- Buffer default antar booking `10 menit`, dapat dikonfigurasi per outlet. `[USUL-v2]`
- Contoh: layanan 45 menit menghasilkan slot berikutnya 55 menit setelahnya, sehingga waktu seperti `10.55` dapat muncul.
- Slot yang bentrok tidak boleh ditawarkan.
- Perubahan jadwal wajib memvalidasi ulang benturan.
- **Validasi baru:** seorang kapster tidak boleh memiliki jadwal yang bertumpang tindih di dua outlet. `[USUL-v2]`
- **Batas pemesanan hari yang sama:** slot hanya dapat dipesan online jika waktu mulainya minimal `60 menit` dari sekarang, agar customer tidak memesan slot yang praktis sudah dimulai. Nilai ini dapat dikonfigurasi per outlet. `[USUL-v2]`

### 11.6 Halaman booking publik

- Link publik per outlet, dan halaman pemilih outlet untuk organisasi multi-outlet.
- Informasi outlet: alamat, jam buka, kontak, deskripsi.
- Urutan alur: layanan → kapster → tanggal → jam → data customer → review → pembayaran.
- Kalender menampilkan 30 hari; slot terisi ditampilkan dalam keadaan tidak dapat dipilih.
- Jika tidak ada slot tersedia, sistem menampilkan tanggal terdekat yang tersedia dan menawarkan kapster lain.
- **Jika tidak ada slot pada seluruh kapster di outlet tersebut, dan organisasi memiliki outlet lain, sistem menawarkan outlet terdekat.** `[USUL-v2]`
- Form data customer: nama dan nomor WhatsApp wajib, email opsional.
- Review menampilkan layanan, kapster, outlet, tanggal, jam, durasi, harga, dan kebijakan pembatalan.
- Pembayaran online wajib untuk menyelesaikan booking melalui alur publik.
- Modal penyedia pembayaran dibuka di atas halaman review.
- Booking menjadi `confirmed` setelah pembayaran berhasil dikonfirmasi melalui webhook.
- Halaman status booking tanpa login menggunakan token acak yang aman dan memiliki masa berlaku.
- Halaman berhasil memuat nomor booking, detail, status pembayaran, instruksi datang, serta tombol "Ajukan pembatalan" dan "Minta reschedule" yang hanya membuka komunikasi ke kasir.
- UX mobile: satu kolom, tombol utama menempel di bawah, target sentuh besar, validasi langsung.

### 11.7 Booking dari kasir

Kasir dapat melihat agenda dan antrean harian outlet aktifnya; membuat booking manual; mencatat walk-in; memilih layanan dan kapster; mengubah status booking; melakukan check-in; menandai sedang dilayani dan selesai; mencatat pembayaran; membatalkan booking sesuai hak akses; mengganti kapster; melakukan reschedule; dan menghubungi customer melalui WhatsApp.

### 11.8 Penggantian kapster dan reschedule

**Kasus:** customer sudah memesan, lalu kapster sakit, cuti, atau berhalangan.

**Alur:**

1. Owner atau kasir menandai kapster tidak tersedia, sesuai batas wewenang pada Bagian 10.5.
2. Sistem menampilkan daftar booking terdampak, **dikelompokkan per outlet** jika kapster bertugas di beberapa outlet. `[USUL-v2]`
3. Kasir membuka booking.
4. Kasir memilih salah satu: ganti kapster pada waktu sama; reschedule tanggal/jam; ganti kapster sekaligus reschedule; atau batalkan dengan alasan dan refund bila relevan.
5. Sistem memvalidasi slot baru.
6. Perubahan tersimpan sebagai riwayat pada `BookingEvent`.
7. Kasir menghubungi customer secara manual melalui WhatsApp.
8. Status booking dan audit log diperbarui.

Fitur berlaku sebelum maupun pada hari H. Penggantian kapster **tidak** dapat memindahkan booking ke outlet lain.

### 11.9 Pembatalan, reschedule, dan no-show

- Customer tidak dapat membatalkan atau melakukan reschedule secara mandiri; keduanya melalui kasir.
- Customer dapat mengajukan pembatalan kapan saja sebelum jadwal dimulai.
- Pembatalan customer yang disetujui menghasilkan refund penuh atas nilai yang dibayarkan.
- Kasir dapat melakukan reschedule tanpa batas jumlah selama slot baru tersedia.
- Jika outlet yang membatalkan karena kendala operasional, Owner menentukan penanganan per kasus.
- Status `no_show` ditentukan manual oleh kasir.
- Toleransi keterlambatan default `15 menit`, dapat dikonfigurasi per outlet. `[USUL-v2]`
- Booking yang belum dibayar otomatis kedaluwarsa dan slotnya dikembalikan.

### 11.10 Pembayaran dan transaksi

**Ruang lingkup pembayaran online — diperjelas dari v1** `[USUL-v2]`

v1 menyatakan "semua booking customer wajib dibayar online, tidak ada opsi bayar di barbershop", namun secara bersamaan menetapkan sistem laci kas, transaksi tunai walk-in, dan rekonsiliasi shift. Kedua hal ini hanya konsisten jika ruang lingkupnya dibedakan secara tegas:

| Jalur | Pembayaran | Alasan |
|---|---|---|
| **Booking melalui link publik** | Wajib online, penuh, di muka | Mengunci komitmen customer dan mencegah no-show pada slot yang dipesan jarak jauh |
| **Walk-in dicatat kasir** | Tunai, EDC, atau QRIS statis di outlet | Customer sudah berada di tempat; memaksa pembayaran online justru memperlambat antrean |
| **Booking manual dibuat kasir** | Mengikuti kebijakan outlet | Biasanya customer yang sudah dikenal |

**Ketentuan lain:**

- Metode pembayaran online yang tersedia dikonfigurasi oleh Owner, dan **dapat berbeda per outlet.** `[USUL-v2]`
- Slot ditahan maksimal `15 menit` selama proses pembayaran.
- Jika pembayaran tidak selesai, booking kedaluwarsa dan slot dikembalikan.
- Status pembayaran final ditentukan oleh webhook penyedia; redirect hanya untuk tampilan.
- Webhook wajib idempotent dan diverifikasi tanda tangannya.
- Kasir mengajukan refund dengan alasan; Owner menyetujui atau menolak.
- Refund parsial tidak tersedia pada MVP.
- Status pembayaran: `unpaid`, `pending`, `paid`, `refunded`, `cancelled`, `expired`.
- Nomor transaksi unik dalam lingkup organisasi, dengan penanda outlet agar mudah ditelusuri. `[USUL-v2]`
- Struk sederhana tersedia.

**Nasib dana pada no-show booking prabayar** `[USUL-v2]`

v1 tidak mengatur hal ini padahal seluruh booking publik dibayar di muka. Keputusan yang diusulkan: **dana no-show tidak dikembalikan dan menjadi hak outlet.** Inilah alasan utama pembayaran di muka diberlakukan. Ketentuan ini wajib dinyatakan jelas pada halaman review sebelum customer membayar, dan tercantum dalam kebijakan pembatalan outlet.

**Komisi kapster.** Ketentuan v1 tentang "komisi 10%" adalah sisa model marketplace dan **dihapus** dari v2. Kapster.id tidak memungut komisi atas transaksi barbershop. Skema bagi hasil antara barbershop dan kapsternya adalah urusan internal barbershop, dan pencatatannya bukan bagian MVP.

### 11.11 Shift kasir dan laci kas

- Tipe shift: pagi, sore, dan long shift.
- Satu kasir hanya boleh memiliki satu shift aktif dalam satu waktu, **lintas seluruh outlet**. `[USUL-v2]`
- **Shift selalu terikat pada satu outlet.** Laci kas bersifat fisik dan lokal. `[USUL-v2]`
- Opening pertama memakai input saldo manual; shift berikutnya di outlet yang sama mewarisi saldo akhir shift sebelumnya.
- Transaksi tunai wajib dicatat dan dikaitkan dengan booking.
- Sistem menghitung saldo kas yang diharapkan dari saldo awal, transaksi tunai, refund tunai, dan koreksi sah.
- Selisih dicatat sebagai variance, wajib diberi alasan, dan ditinjau Owner.
- Closing tetap dapat dilakukan meski terdapat variance.
- Kasir tidak dapat logout sebelum closing selesai.
- Jika kasir lupa closing, sistem mempertahankan shift aktif dan memblokir shift berikutnya di outlet tersebut; Owner dapat melakukan force-close dengan alasan wajib.
- Transaksi yang sudah tercatat tidak dapat diedit atau dihapus oleh kasir; koreksi diajukan kasir dan disetujui Owner.
- Owner menerima notifikasi setiap variance, **disertai nama outlet.** `[USUL-v2]`

### 11.12 CRM customer minimum

- Nama dan nomor WhatsApp wajib; email opsional.
- Nomor WhatsApp cukup divalidasi formatnya; OTP tidak diperlukan.
- **Customer berada pada tingkat organisasi**, dengan riwayat kunjungan yang menyimpan penanda outlet. `[USUL-v2]`
- Kasir dapat mencari customer dalam organisasi, tetapi hanya melihat nama dan nomor WhatsApp.
- Riwayat transaksi hanya dapat dilihat Owner.
- Tidak ada catatan internal maupun label customer pada MVP.
- Customer tidak dapat melihat riwayat; hanya menerima detail booking terakhir melalui link bertoken.
- Permintaan penghapusan data: data personal dihapus, data transaksi dianonimkan untuk keperluan pencatatan dan pajak.

*(Catatan: pada v1, bagian CRM tercampur dengan isi laporan akibat kesalahan penyuntingan. Isi laporan telah dikembalikan ke Bagian 11.13.)*

### 11.13 Laporan

**Laporan Owner — per outlet**

- Pendapatan dan jumlah booking.
- Perbandingan booking online dan walk-in.
- Layanan terlaris.
- No-show, pembatalan, dan status terkait sebagai metrik terpisah.
- Customer yang kembali, secara sederhana.
- Rekap pembayaran: pendapatan kotor, refund, pendapatan bersih.
- Performa kapster: jumlah booking per kapster.
- Kartu ringkasan dan grafik tren booking serta pendapatan.

**Laporan Owner — konsolidasi lintas outlet** `[USUL-v2]`

- Ringkasan seluruh organisasi dengan pemilih outlet: seluruh outlet, atau satu outlet tertentu.
- Tabel perbandingan antar outlet: pendapatan, jumlah booking, okupansi, no-show, rata-rata nilai transaksi.
- Performa kapster lintas outlet bagi kapster yang bertugas di lebih dari satu lokasi.
- Ringkasan variance laci kas seluruh outlet.

**Laporan kasir**

- Laporan operasional lengkap untuk hari ini dan kemarin, **terbatas pada outlet yang ditugaskan**.
- Mendukung rekonsiliasi laci kas pada opening dan closing shift.

**Ketentuan umum**

- Periode laporan utama bulanan.
- Ekspor CSV tersedia; ekspor konsolidasi menyertakan kolom outlet. `[USUL-v2]`
- **Diskon tidak masuk MVP** dan tidak muncul sebagai komponen laporan. Entitas `Discount` tetap disiapkan di model data untuk fase berikutnya, tetapi tidak ada antarmuka maupun perhitungan diskon pada MVP. *(Ini menyelesaikan kontradiksi v1 yang menyatakan diskon ditunda namun tetap mencantumkan pencatatan diskon dan skenario demo dengan diskon.)*
- Filter laporan tambahan di luar rentang tanggal dan pemilih outlet tidak tersedia pada MVP.
- Biaya payment gateway tidak dibebankan ke laporan pendapatan barbershop, sesuai keputusan pada Bagian 7.4 yang masih terbuka.

### 11.14 Notifikasi

| Peristiwa | Penerima | Kanal MVP | Status |
|---|---|---|---|
| Konfirmasi booking | Customer | Halaman berhasil + tautan WhatsApp manual dari kasir | Must have |
| Pengingat booking | Customer | Manual oleh kasir | Must have |
| Perubahan/reschedule | Customer | Manual oleh kasir | Must have |
| Pembatalan | Customer | Manual oleh kasir | Must have |
| Booking baru masuk | Kasir outlet terkait | Dalam aplikasi | Must have `[USUL-v2]` |
| Variance laci kas | Owner | Dalam aplikasi + email | Must have |
| Ketidakhadiran kapster ditandai kasir | Owner | Dalam aplikasi + email | Must have `[USUL-v2]` |
| Permintaan refund | Owner | Dalam aplikasi + email | Must have |
| Otomasi WhatsApp | Customer | — | Fase berikutnya |

**Catatan penting** `[USUL-v2]`: karena email customer bersifat opsional dan otomasi WhatsApp belum tersedia, **satu-satunya konfirmasi yang pasti diterima customer adalah halaman berhasil di layarnya.** Ini berisiko, terutama untuk booking beberapa hari ke depan. Mitigasi MVP: halaman berhasil menyediakan tombol "Simpan ke kalender" dan "Kirim detail ke WhatsApp saya" yang membuka WhatsApp dengan pesan berisi detail booking, sehingga customer memiliki catatan di perangkatnya sendiri.
---

## 12. Alur Bisnis End-to-End

### 12.1 Onboarding organisasi dan outlet pertama

1. Owner mendaftar dan memverifikasi email melalui OTP.
2. Membuat organisasi: nama brand, slug, data badan usaha.
3. Membuat outlet pertama: nama, alamat, koordinat, jam operasional, kontak.
4. Menambahkan layanan ke katalog organisasi beserta harga untuk outlet tersebut.
5. Menambahkan kapster dan menugaskannya ke outlet.
6. Mengatur jadwal kerja hingga 30 hari.
7. Mengundang kasir dan menugaskannya ke outlet.
8. Menyelesaikan pendaftaran merchant pembayaran.
9. Link booking aktif.
10. Membagikan link melalui Instagram, WhatsApp, Google Business Profile, dan QR.

### 12.2 Menambah outlet berikutnya `[USUL-v2]`

1. Owner membuka Kelola Outlet dan memilih Tambah Outlet.
2. Mengisi nama, slug, alamat, jam operasional, dan kontak.
3. Sistem menyalin katalog layanan organisasi beserta harga outlet pertama sebagai nilai awal; Owner dapat menyesuaikan.
4. Owner menugaskan kapster: memindahkan yang sudah ada, menugaskan lintas outlet, atau menambah kapster baru.
5. Owner mengatur jadwal kerja untuk outlet baru; sistem memvalidasi tidak ada tumpang tindih jadwal kapster lintas outlet.
6. Owner menugaskan kasir.
7. Owner menyelesaikan pendaftaran merchant pembayaran untuk outlet tersebut.
8. Link booking outlet aktif, dan halaman pemilih outlet organisasi otomatis muncul.
9. Langganan diperbarui mengikuti jumlah outlet aktif.

### 12.3 Booking customer

1. Customer membuka link organisasi atau langsung link outlet.
2. Jika organisasi memiliki banyak outlet dan customer membuka link organisasi, ia memilih outlet lebih dulu.
3. Memilih layanan.
4. Memilih kapster.
5. Memilih tanggal dan jam dari slot yang tersedia.
6. Mengisi nama dan nomor WhatsApp.
7. Melihat review, termasuk kebijakan pembatalan dan ketentuan no-show.
8. Membayar melalui modal penyedia pembayaran.
9. Sistem menahan slot maksimal 15 menit.
10. Webhook mengonfirmasi pembayaran; booking menjadi `confirmed`.
11. Customer melihat halaman berhasil dan dapat mengirim detail ke WhatsApp-nya sendiri.
12. Booking muncul di antrean kasir outlet terkait dan agenda Owner.

### 12.4 Walk-in

1. Customer datang ke outlet.
2. Kasir memilih Tambah Walk-in.
3. Kasir mencari customer berdasarkan nomor WhatsApp, atau membuat data baru.
4. Kasir memilih layanan dan kapster yang tersedia.
5. Sistem memvalidasi ketersediaan dan memasukkan ke antrean.
6. Kasir memproses check-in, layanan, dan pembayaran tunai atau EDC.
7. Transaksi tercatat pada shift kasir yang aktif.

### 12.5 Hari H

1. Kasir membuka shift dan mencatat saldo awal laci.
2. Kasir membuka antrean hari ini untuk outlet aktifnya.
3. Customer check-in setelah kasir memverifikasi nama dan nomor WhatsApp.
4. Kasir mengatur status dan assignment.
5. Kapster melayani customer.
6. Kasir mencatat pembayaran untuk walk-in, atau menandai selesai untuk booking prabayar.
7. Kasir menutup shift, mencatat saldo akhir, dan menjelaskan variance bila ada.
8. Transaksi masuk laporan outlet dan laporan konsolidasi organisasi.

### 12.6 Kapster berhalangan

1. Kapster mengabari tidak dapat hadir.
2. Kasir menandai ketidakhadiran untuk hari ini, atau Owner menandai cuti terjadwal.
3. Sistem memblokir availability dan menampilkan booking terdampak, dikelompokkan per outlet.
4. Kasir mengganti kapster atau melakukan reschedule.
5. Kasir menghubungi customer secara manual melalui WhatsApp.
6. Sistem mencatat perubahan, aktor, alasan, dan waktu.
7. Owner menerima notifikasi.

### 12.7 Pembayaran gagal atau kedaluwarsa

1. Customer tidak menyelesaikan pembayaran dalam 15 menit.
2. Sistem menandai booking `expired` dan mengembalikan slot.
3. Halaman pending menampilkan hitung mundur, tombol melanjutkan pembayaran, dan tawaran memesan ulang setelah kedaluwarsa.
4. Kasir tidak menerima notifikasi untuk kasus ini pada MVP.

---

## 13. Status dan Aturan Bisnis

### 13.1 Status booking

Alur utama: `pending` → `confirmed` → `checked_in` → `in_service` → `completed`

Status alternatif: `cancelled_by_customer`, `cancelled_by_outlet`, `no_show`, `rescheduled`, `refunded`, `expired`

*(v1 memakai `cancelled_by_barbershop`; diganti menjadi `cancelled_by_outlet` agar konsisten dengan glosarium. Status `in_service` ditambahkan karena alur kasir pada v1 sudah menyebut "sedang dilayani" tanpa status resminya.)* `[USUL-v2]`

### 13.2 Aturan booking

- Booking tidak boleh melewati availability kapster.
- Booking tidak boleh bentrok dengan booking aktif lain pada kapster yang sama.
- Booking tidak boleh berada di luar jam operasional outlet.
- Batas maksimum pemesanan 30 hari ke depan.
- Booking hari yang sama dapat diaktifkan atau dinonaktifkan per outlet.
- Slot hari yang sama hanya dapat dipesan online bila mulai minimal 60 menit dari sekarang.
- Outlet dapat menetapkan cutoff time dan kebijakan pembatalan sendiri.
- Harga dan durasi dikunci saat booking dibuat.
- Pembatalan, reschedule, dan penggantian kapster wajib memiliki aktor, timestamp, dan alasan.
- Nomor WhatsApp divalidasi dengan format lokal yang disepakati.
- **Setiap query bisnis wajib membawa scope organisasi, dan bila relevan scope outlet.** Tidak ada pengecualian.

### 13.3 Aturan shift dan laci kas

- Satu kasir hanya memiliki satu shift aktif dalam satu waktu di seluruh organisasi.
- Shift terikat pada satu outlet.
- Setiap shift memiliki saldo awal, daftar transaksi, saldo diharapkan, saldo aktual, dan variance.
- Kasir wajib menutup shift sebelum logout.
- Variance wajib diberi alasan dan ditinjau Owner.
- Kasir tidak dapat mengubah atau menghapus transaksi tercatat.
- Seluruh aktivitas shift masuk audit log dengan penanda outlet.

### 13.4 Mekanisme penguncian slot `[USUL-v2]`

v1 mensyaratkan tidak boleh ada double booking akibat race condition, tetapi tidak menyebutkan mekanismenya. Bagian ini menutup celah tersebut.

**Persyaratan:** dua permintaan booking atas slot yang sama, yang tiba dalam selang waktu sangat singkat, hanya boleh menghasilkan satu booking.

**Mekanisme yang diusulkan — dua lapis:**

1. **Lapis basis data (wajib).** Constraint unik pada kombinasi kapster, tanggal, dan waktu mulai untuk booking berstatus aktif. Ini adalah jaminan terakhir dan tidak boleh dilewati, apa pun yang terjadi di lapis aplikasi.
2. **Lapis penahanan sementara (disarankan).** Kunci bertenggat pada Redis dengan pola `lock:slot:{outlet_id}:{barber_id}:{waktu_mulai}` dan TTL 15 menit, dibuat sebelum customer diarahkan ke pembayaran. Kunci ini memberi umpan balik cepat kepada customer kedua tanpa perlu menunggu kegagalan basis data, dan otomatis lepas bila pembayaran tidak selesai.

Jika Redis dianggap menambah kompleksitas infrastruktur pada tahap awal, lapis kedua dapat digantikan oleh baris booking berstatus `pending` dengan waktu kedaluwarsa, yang dibersihkan oleh job terjadwal. Lapis pertama tetap wajib.

### 13.5 Zona waktu dan penanganan tanggal `[USUL-v2]`

Tidak dibahas sama sekali pada v1, padahal ini sumber kesalahan yang umum.

- Seluruh timestamp disimpan dalam UTC.
- Setiap outlet memiliki atribut zona waktu; nilai awal `Asia/Jakarta` (WIB).
- Seluruh tampilan waktu kepada customer, kasir, dan Owner memakai zona waktu outlet terkait.
- Laporan konsolidasi lintas outlet yang berbeda zona waktu menampilkan waktu dalam zona masing-masing outlet, dan agregasi harian memakai batas hari zona waktu outlet.
- Batas hari untuk shift kasir dan laporan harian mengikuti zona waktu outlet, bukan UTC.

Meskipun target awal seluruhnya WIB, atribut ini disiapkan sejak awal karena mengubahnya setelah ada data produksi sangat mahal.

---

## 14. Data Model Konseptual

### 14.1 Entitas inti

| Entitas | Cakupan | Catatan |
|---|---|---|
| `Organization` | — | Akar, unit langganan |
| `Outlet` | Organisasi | **Baru sebagai entitas penuh** `[USUL-v2]` |
| `User` | Organisasi | Owner atau Kasir |
| `UserOutletAssignment` | User + Outlet | **Baru** — menentukan outlet mana yang dapat diakses `[USUL-v2]` |
| `Role` | — | Owner, Kasir |
| `Barber` | Organisasi | |
| `BarberOutletAssignment` | Barber + Outlet | **Baru** `[USUL-v2]` |
| `Service` | Organisasi | Katalog terpusat |
| `ServiceOutletPrice` | Service + Outlet | **Baru** — harga dan status aktif per outlet `[USUL-v2]` |
| `BarberService` | Barber + Service | Kemampuan kapster |
| `WorkingSchedule` | Barber + Outlet | **Cakupan diperluas** `[USUL-v2]` |
| `TimeOff` | Barber | Berlaku lintas outlet |
| `Customer` | Organisasi | Lihat Bagian 9.3 |
| `Booking` | Outlet | |
| `BookingEvent` | Booking | Riwayat perubahan |
| `Payment` | Booking | |
| `Transaction` | Outlet | |
| `TransactionItem` | Transaction | |
| `CashierShift` | User + Outlet | **Cakupan diperjelas** `[USUL-v2]` |
| `CashMovement` | CashierShift | **Baru** — mutasi laci kas dan koreksi `[USUL-v2]` |
| `Discount` | Organisasi | Disiapkan, tidak dipakai pada MVP |
| `AuditLog` | Organisasi + Outlet opsional | |
| `Notification` | User | |
| `Subscription` | Organisasi | Jumlah outlet aktif memengaruhi tagihan |

### 14.2 Relasi utama

- `Organization` memiliki banyak `Outlet`, `User`, `Barber`, `Service`, `Customer`, dan satu `Subscription`.
- `Outlet` memiliki banyak `Booking`, `Transaction`, `CashierShift`, dan `ServiceOutletPrice`.
- `User` terhubung ke banyak `Outlet` melalui `UserOutletAssignment`.
- `Barber` terhubung ke banyak `Outlet` melalui `BarberOutletAssignment`, dan memiliki `WorkingSchedule` per outlet.
- `Booking` mengacu pada `Outlet`, `Customer`, `Service`, dan `Barber`; memiliki riwayat melalui `BookingEvent`.
- `Transaction` berasal dari satu `Booking`, baik online maupun walk-in.
- `TimeOff` memengaruhi availability `Barber` di seluruh outlet.
- `CashierShift` mengumpulkan `Transaction` dan `CashMovement` untuk satu outlet dalam satu periode.

### 14.3 Aturan integritas data

- Setiap tabel yang memuat data bisnis wajib memiliki kolom `organization_id`.
- Tabel yang bersifat lokal wajib juga memiliki `outlet_id`.
- Seluruh akses data melewati lapisan yang menyisipkan scope organisasi secara otomatis; query tanpa scope harus gagal, bukan mengembalikan seluruh data.
- Penghapusan bersifat lunak untuk entitas yang direferensikan transaksi historis.
- Data customer dipisahkan antar organisasi dan diproses hanya sesuai tujuan yang diberitahukan.

---

## 15. Arsitektur Teknis

### 15.1 Repository

- **Frontend monorepo**: situs publik/booking dan dashboard internal.
- **Backend repo terpisah**: API dan domain.
- Monorepo adalah strategi repositori, bukan keharusan microservice.

### 15.2 Backend

- NestJS, modular monolith, REST API pada MVP.
- PostgreSQL dengan Prisma ORM.
- Modul terpisah: auth, tenant, outlet, catalog, schedule, booking, cashier, payment, CRM, reporting, billing, audit.
- Modularitas dijaga agar modul dapat dipisahkan bila skala benar-benar menuntut.
- **Middleware scope organisasi dan outlet wajib berada di lapisan paling luar**, bukan diserahkan ke masing-masing query. `[USUL-v2]`

### 15.3 Frontend

- **Next.js + TypeScript** untuk landing page dan booking publik, karena kebutuhan SEO dan performa halaman publik.
- **React + Vite** untuk dashboard Owner dan kasir, karena SPA internal tidak memerlukan SEO.
- Shared package untuk types, API client, skema validasi, dan UI primitives.

**Catatan untuk ditinjau** `[USUL-v2]`: dua aplikasi frontend berarti dua konfigurasi build, dua sistem autentikasi di sisi klien, dan duplikasi komponen UI. Untuk tim kecil pada tahap MVP, satu aplikasi Next.js yang melayani halaman publik sekaligus dashboard dapat memangkas beban pemeliharaan cukup besar, dengan konsekuensi bundel dashboard ikut terpengaruh konfigurasi Next.js. Keputusan ini tidak mendesak dan dapat ditinjau saat technical design. `[TERBUKA — OP-10]`

### 15.4 Infrastruktur awal

Docker; VPS atau managed PostgreSQL; Redis dan BullMQ untuk job terjadwal, penguncian slot, dan notifikasi; object storage S3-compatible untuk logo dan aset; Sentry untuk error monitoring; PostHog untuk product analytics; Metabase untuk laporan internal; CI/CD dengan environment development, staging, dan production.

### 15.5 Auth dan keamanan

- Session atau token auth yang aman untuk Owner dan kasir.
- RBAC berbasis peran **dan scope outlet**. `[USUL-v2]`
- Password hashing dan rate limiting.
- Validasi input di sisi server.
- Proteksi CSRF, XSS, dan SQL injection sesuai stack.
- Secret disimpan di secret manager, tidak pernah di repositori.
- Audit log untuk perubahan booking, pembayaran, role, jadwal, shift, dan data sensitif.
- Backup basis data dan prosedur restore yang teruji.
- Token halaman status booking bersifat acak, panjang, dan memiliki masa berlaku.

### 15.6 Testing

- Unit test untuk domain dan aturan availability.
- Integration test untuk API dan basis data.
- **Test isolasi tenant wajib**, mencakup skenario lintas organisasi dan lintas outlet dalam satu organisasi. `[USUL-v2]`
- Contract test untuk booking publik dan dashboard.
- E2E Playwright untuk booking, walk-in, pembayaran, penggantian kapster, reschedule, dan shift kasir.
- **Test konkurensi khusus** untuk pemesanan slot yang sama secara bersamaan. `[USUL-v2]`
- Load test ringan untuk endpoint slot dan booking sebelum pilot diperbesar.

---

## 16. Integrasi Eksternal

### 16.1 Payment — kontradiksi v1 diselesaikan `[USUL-v2]`

v1 memuat dua pernyataan yang bertentangan: Bagian 14 menyebut "Midtrans atau Xendit setelah due diligence", sementara Bagian 9.9 dan ledger keputusan menetapkan `Ojire Tech` sebagai penyedia terpilih.

**Penyelesaian yang diusulkan:**

- `Ojire Tech` **tetap dievaluasi** sebagai kandidat, tetapi belum dapat dinyatakan sebagai keputusan final sebelum due diligence selesai.
- Karena terdapat kedekatan antara tim dan penyedia tersebut, due diligence justru harus lebih ketat, bukan lebih longgar, dan sebaiknya didokumentasikan agar keputusan dapat dipertanggungjawabkan di kemudian hari kepada mitra atau investor.
- Siapkan **satu penyedia pembanding berizin** sebagai alternatif, agar integrasi tidak terkunci pada satu pihak.
- Rancang lapisan integrasi pembayaran sebagai **adapter dengan antarmuka seragam**, sehingga penggantian penyedia tidak menyentuh domain booking.

Daftar periksa due diligence: legalitas dan izin, kemampuan sub-merchant atau split payment, metode pembayaran yang didukung termasuk QRIS, biaya per metode, jadwal settlement, keandalan dan keamanan webhook, alur refund, penanganan dispute, kualitas sandbox, dan SLA dukungan teknis. `[TERBUKA — OP-05]`

### 16.2 WhatsApp

MVP menyediakan tombol komunikasi manual berbasis tautan. Otomasi WhatsApp Business API dipertimbangkan setelah persetujuan, template, biaya, dan penyedia jelas. Biaya per pesan harus dimasukkan ke perhitungan margin sebelum diaktifkan. `[TERBUKA — OP-06]`

### 16.3 Analytics dan monitoring

- Product analytics: funnel booking publik, konversi, no-show, repeat booking, **dan segmentasi berdasarkan outlet**. `[USUL-v2]`
- Monitoring: error rate, latency, kegagalan job, kegagalan webhook, uptime.

---

## 17. Legalitas dan Kepatuhan

Bagian ini adalah daftar periksa produk dan bisnis, bukan opini hukum. Verifikasi dengan notaris atau konsultan hukum sebelum pilot berbayar.

### 17.1 Bentuk usaha

- **PT Perorangan** layak dipertimbangkan untuk satu pendiri pada tahap UMK/MVP.
- **PT biasa** lebih tepat bila ada co-founder, investor, pembagian saham, atau kebutuhan korporasi formal.
- Keputusan mempertimbangkan status UMK, risiko, pajak, perbankan, dan rencana pendanaan.

### 17.2 Administrasi usaha

Pendirian badan usaha; NIB dan perizinan melalui OSS; KBLI yang sesuai untuk aktivitas perangkat lunak dan SaaS; NPWP dan kewajiban pajak; pendaftaran merek Kapster.id melalui DJKI bila nama sudah final; rekening bisnis dan pembukuan.

### 17.3 PSE dan data pribadi

Karena Kapster.id mengoperasikan sistem elektronik dan memproses data customer, lakukan penilaian dan pendaftaran PSE Lingkup Privat bila kriterianya terpenuhi.

Dokumen minimum: Privacy Policy; Terms of Service atau SaaS Agreement; Data Processing Agreement dengan barbershop; kebijakan retensi dan penghapusan data; kebijakan insiden dan tanggap kebocoran; kebijakan refund, pembatalan, dan dispute; consent atau notice untuk pengumpulan nomor WhatsApp dan komunikasi.

### 17.4 Prinsip pelindungan data pribadi

- Tujuan pemrosesan jelas dan diberitahukan.
- Data yang dikumpulkan minimum dan relevan.
- Akses berdasarkan peran dan kebutuhan, termasuk pembatasan lintas outlet.
- Customer dapat menggunakan haknya sesuai peraturan.
- Pemrosesan oleh vendor dan penyedia pembayaran diatur kontrak.
- Data customer barbershop tidak dijual atau dipakai untuk tujuan yang tidak disetujui.

**Tambahan multi-outlet** `[USUL-v2]`: karena customer berada pada tingkat organisasi dan datanya dapat diakses dari outlet mana pun dalam organisasi tersebut, pemberitahuan privasi pada halaman booking wajib menyebutkan bahwa pengendali data adalah organisasi, bukan outlet tunggal.

### 17.5 Posisi Kapster.id dalam alur pembayaran

Kapster.id sebaiknya **tidak** menjadi penyelenggara jasa pembayaran. Gunakan penyedia berizin dan usahakan dana customer **langsung masuk ke akun merchant barbershop**, bukan ditampung Kapster.id. Lihat Bagian 7.5. Bila model sub-merchant tidak tersedia pada penyedia terpilih, konsekuensi hukumnya harus dikaji sebelum integrasi. `[TERBUKA — OP-03]`

### 17.6 Retensi data `[USUL-v2]`

v1 menyebut perlunya kebijakan retensi tanpa angka. Usulan awal untuk direview bersama penasihat hukum:

| Jenis data | Periode simpan | Setelah periode |
|---|---|---|
| Data personal customer aktif | Selama organisasi berlangganan | — |
| Data personal customer tidak aktif | 24 bulan sejak kunjungan terakhir | Dianonimkan |
| Data transaksi | Sesuai kewajiban perpajakan | Dianonimkan, agregat dipertahankan |
| Audit log | 24 bulan | Diarsipkan |
| Data organisasi setelah berhenti berlangganan | 90 hari masa tenggang untuk ekspor | Dihapus atau dianonimkan |
| Log teknis dan monitoring | 90 hari | Dihapus |

Barbershop harus dapat mengekspor datanya sendiri sebelum masa tenggang berakhir.

### 17.7 Estimasi biaya awal `[ASUMSI]`

PT biasa sekitar `Rp7–15 juta` bergantung layanan, alamat, dan pendampingan; PT dengan alamat sendiri sekitar `Rp6–12 juta`; PT dengan virtual office sekitar `Rp9–17 juta`; PT Perorangan dengan PNBP sekitar `Rp50.000` belum termasuk pendampingan dan biaya operasional lain. Angka wajib dikonfirmasi ulang karena dapat berubah.

### 17.8 Urutan legal dan development

Berjalan paralel: susun PRD, arsitektur, dan prototipe internal; urus badan usaha, NIB, dan kaji KBLI; bangun MVP dengan data dummy dan sandbox pembayaran; siapkan kontrak, Privacy Policy, Terms, DPA, dan kontrol keamanan; jalankan pilot eksternal setelah legal minimum terpenuhi; jangan memakai data customer asli secara luas sebelum dasar pemrosesan dan kontrol tersedia.

---

## 18. Non-Functional Requirements

### 18.1 Performance

| Aspek | Target `[USUL-v2]` |
|---|---|
| Muat halaman booking publik | Interaktif di bawah 3 detik pada 4G umum |
| Respons pencarian slot | Di bawah 800 ms pada kondisi normal |
| Muat antrean harian kasir | Di bawah 1,5 detik |
| Laporan konsolidasi hingga 20 outlet | Di bawah 5 detik |
| Penolakan konflik booking | Atomik di backend, tanpa pengecualian |

### 18.2 Availability dan reliability

Backup terjadwal dan diuji; retry webhook dan notifikasi dengan idempotency key; tidak ada double booking akibat race condition; monitoring endpoint kritis; incident log dan prosedur rollback.

### 18.3 Security

Isolasi tenant wajib diuji, termasuk isolasi antar outlet dalam satu organisasi; least privilege untuk setiap peran; secret tidak masuk git maupun log; data sensitif diminimalkan dan dienkripsi saat transit; audit trail untuk seluruh aksi penting.

### 18.4 Accessibility dan usability

Dashboard dapat dioperasikan dengan keyboard dasar; kontras dan ukuran teks memadai; kasir dapat menyelesaikan alur umum dengan sesedikit mungkin klik; bahasa antarmuka awal Bahasa Indonesia; responsif untuk desktop kasir dan mobile Owner.

**Tambahan multi-outlet** `[USUL-v2]`: perpindahan outlet aktif pada dashboard tidak boleh memerlukan muat ulang halaman penuh, dan outlet yang sedang aktif harus selalu terlihat jelas agar kasir tidak salah mencatat transaksi ke outlet yang keliru.
---

## 19. Prioritas Fitur

### Must have — MVP pilot

- Auth Owner dan Kasir dengan RBAC berbasis peran dan scope outlet.
- Organisasi dan **multi-outlet**.
- Katalog layanan tingkat organisasi dengan harga per outlet.
- Kapster, penugasan lintas outlet, dan availability.
- Booking publik hingga 30 hari, dengan halaman pemilih outlet.
- **Pembayaran online untuk booking publik.** Dipindahkan dari *Should have* pada v1 karena seluruh alur booking publik bergantung padanya; tanpa ini, MVP tidak dapat berjalan seperti yang dirancang. `[USUL-v2]`
- Booking manual dan walk-in.
- Antrean kasir per outlet.
- Check-in, status layanan, pencatatan pembayaran tunai dan EDC.
- Ganti kapster dan reschedule, sebelum maupun pada hari H.
- Shift kasir dan rekonsiliasi laci kas.
- Customer minimum dengan nomor WhatsApp, pada tingkat organisasi.
- Dashboard Owner dasar, per outlet dan konsolidasi.
- Laporan pendapatan dan booking dasar dengan ekspor CSV.
- Audit log untuk aksi penting.
- Penguncian slot yang teruji terhadap konkurensi.

### Should have — setelah alur inti stabil

Reminder otomatis; QR booking per outlet; loyalty sederhana; promo dan diskon; pengisian slot kosong; perbandingan performa antar outlet yang lebih kaya; laporan berbasis rentang tanggal bebas.

### Could have — addon atau eksperimen

Dashboard kapster; komisi dan approval kompleks; availability mandiri oleh kapster; integrasi WhatsApp API penuh; inventory; payroll; integrasi POS dan perangkat; role manajer regional.

### Won't have — base MVP

Marketplace lintas barbershop; aplikasi customer; akun customer Kapster.id; microservices; transfer booking antar outlet; waralaba lintas badan usaha; fitur enterprise yang belum divalidasi.

---

## 20. Roadmap Penerapan

### Fase 0 — Discovery dan validasi

Wawancara Owner, kasir, dan kapster; validasi proses booking, walk-in, cuti, komisi, pembayaran, dan laporan; **validasi kebutuhan multi-outlet pada minimal 3 prospek jaringan**; validasi willingness-to-pay dan basis penagihan per outlet; audit ulang kompetitor; memilih 10–20 outlet pilot termasuk minimal 2 organisasi multi-outlet.

### Fase 1 — Foundation

Legal minimum berjalan paralel; monorepo frontend dan repo backend; design system setelah arah visual disepakati; skema basis data **dengan scope organisasi dan outlet sejak awal**; auth, RBAC berbasis outlet, audit log, CI/CD, staging.

### Fase 2 — MVP internal

Onboarding Owner; pembuatan outlet kedua; booking publik dan halaman pemilih outlet; antrean kasir; walk-in; integrasi pembayaran sandbox; shift kasir; reschedule dan ganti kapster; laporan per outlet dan konsolidasi; pengujian dengan data dummy dua outlet.

### Fase 3 — Pilot terbatas

Onboarding outlet nyata dengan persetujuan dan dokumen; dukungan langsung; pemantauan booking, no-show, konflik slot, waktu transaksi, variance kas, dan umpan balik; perbaikan keandalan sebelum menambah fitur.

### Fase 4 — Paid beta dan perluasan cluster

Penetapan harga berbayar dengan basis per outlet; pembayaran online produksi dan reminder bila siap; perluasan dari Jakarta Selatan dan BSD ke Depok dan Bekasi; penambahan CRM dan loyalty berdasarkan data penggunaan.

---

## 21. KPI dan Acceptance Criteria

### 21.1 KPI produk dengan target `[USUL-v2]`

v1 mencantumkan daftar KPI tanpa angka, sehingga tidak dapat dipakai menilai keberhasilan. Target berikut adalah usulan awal untuk pilot dan wajib ditinjau setelah data pertama masuk.

| KPI | Target pilot |
|---|---|
| Waktu onboarding sampai link booking aktif | Di bawah 45 menit dengan pendampingan |
| Outlet yang menyelesaikan setup minimum | Di atas 90% dari yang mendaftar |
| Booking publik berhasil tanpa bantuan support | Di atas 85% |
| Booking online yang berakhir `completed` | Di atas 75% |
| Waktu kasir membuat walk-in | Di bawah 45 detik |
| Waktu kasir melakukan reschedule atau ganti kapster | Di bawah 90 detik |
| Tingkat double booking | Nol |
| Tingkat no-show pada booking prabayar | Di bawah 10% |
| Outlet aktif mingguan | Di atas 80% dari outlet pilot |
| Retensi 30 / 60 / 90 hari | 90% / 80% / 70% |
| Shift ditutup dengan benar | Di atas 95% |
| Rata-rata outlet per organisasi pilot | Minimal 1,4 |

### 21.2 Acceptance criteria MVP

**Organisasi dan outlet**

- Owner dapat membuat organisasi, outlet pertama, layanan, kapster, dan availability 30 hari.
- Owner dapat menambah outlet kedua tanpa bantuan tim Kapster.id.
- Katalog layanan tersalin ke outlet baru dan harganya dapat diubah tanpa memengaruhi outlet lain.
- Kapster dapat ditugaskan ke dua outlet, dan sistem menolak jadwal yang bertumpang tindih.
- Organisasi satu outlet tidak melihat satu pun elemen antarmuka multi-outlet.

**Booking**

- Customer dapat memesan hari yang sama maupun sampai 30 hari ke depan sesuai kebijakan outlet.
- Dua permintaan bersamaan atas slot yang sama hanya menghasilkan satu booking; permintaan kedua mendapat pesan yang jelas.
- Booking publik muncul di antrean kasir outlet yang benar dalam waktu kurang dari 5 detik.
- Booking yang tidak dibayar dalam 15 menit menjadi kedaluwarsa dan slotnya kembali tersedia.
- Halaman pemilih outlet muncul otomatis begitu organisasi memiliki dua outlet aktif.

**Operasional kasir**

- Kasir dapat membuat walk-in, check-in, menandai selesai, dan mencatat pembayaran.
- Kasir dapat mengganti kapster tanpa menghilangkan riwayat booking.
- Kasir dapat melakukan reschedule sebelum dan pada hari H.
- Kasir dapat menandai ketidakhadiran kapster untuk hari berjalan, dan Owner menerima notifikasi.
- Kasir wajib menutup shift sebelum logout, dan variance wajib diberi alasan.

**Isolasi dan keamanan**

- Kasir outlet A tidak dapat melihat booking, transaksi, laporan, maupun shift outlet B, termasuk melalui manipulasi parameter permintaan.
- Data antar organisasi tidak bocor dalam pengujian otomatis maupun manual.
- Seluruh perubahan booking kritis, aksi shift, dan perubahan peran tercatat di audit log dengan penanda outlet.

**Laporan**

- Owner dapat melihat laporan satu outlet dan laporan konsolidasi seluruh outlet.
- Angka konsolidasi sama persis dengan penjumlahan laporan per outlet pada periode yang sama.
- Ekspor CSV konsolidasi memuat kolom outlet.

---

## 22. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Owner enggan meninggalkan kebiasaan WhatsApp dan manual | Adopsi rendah | Onboarding langsung, setup cepat, fokus pada pain point kasir |
| Kasir merasa sistem memperlambat antrean | Ditinggalkan saat jam ramai | Uji usability pada jam ramai, kurangi klik, dukung walk-in cepat |
| Double booking | Hilangnya kepercayaan | Constraint basis data, penguncian slot, test konkurensi |
| Kapster sakit mendadak | Customer kecewa | Daftar booking terdampak, wewenang kasir untuk hari berjalan, audit trail |
| **Biaya payment gateway melebihi nilai langganan** | **Margin negatif pada klien tersukses** | **Kuota wajar, tinjau setelah data volume pilot** `[USUL-v2]` |
| **Kapster.id dianggap menampung dana pihak lain** | **Risiko regulasi** | **Model sub-merchant, dana langsung ke rekening barbershop** `[USUL-v2]` |
| **Customer tidak menerima konfirmasi karena email opsional dan WA belum otomatis** | **No-show naik, keluhan** | **Tombol kirim detail ke WhatsApp sendiri, simpan ke kalender** `[USUL-v2]` |
| Kebocoran data customer | Risiko hukum dan reputasi | Isolasi tenant, RBAC, minimisasi data, logging, DPA |
| **Kompleksitas multi-outlet memperlambat MVP** | **Peluncuran mundur** | **Batasi cakupan sesuai Bagian 9.6; sembunyikan UI multi-outlet untuk klien satu outlet** `[USUL-v2]` |
| **Kasir salah mencatat transaksi ke outlet keliru** | **Laporan dan kas kacau** | **Indikator outlet aktif selalu terlihat, shift terikat outlet** `[USUL-v2]` |
| Terlalu cepat membangun marketplace | Fokus dan biaya melebar | Subscription-first, marketplace hanya setelah metrik terbukti |
| Scope creep dashboard kapster | MVP terlambat | Jadikan addon, cukup simpan entitas dan batas API |
| Kompetitor lebih matang | Sulit diferensiasi | Fokus workflow kasir, hybrid online/offline, onboarding dan cluster |
| **Ketergantungan pada satu penyedia pembayaran yang belum tervalidasi** | **Terkunci atau gagal integrasi** | **Adapter pembayaran, siapkan penyedia pembanding** `[USUL-v2]` |
| Asumsi pasar tidak akurat | Salah harga dan proyeksi | Wawancara, pilot, analisis kohort, perbarui asumsi |

---

## 23. Ledger Keputusan

Keputusan berikut mengalahkan pernyataan mana pun di bagian lain. Item bertanda `[USUL-v2]` **belum final** dan menunggu persetujuan.

### 23.1 Produk dan model bisnis (PB)

| ID | Keputusan | Status |
|---|---|---|
| PB-01 | Kapster.id adalah SaaS operasional B2B, bukan marketplace | `[KUNCI]` |
| PB-02 | Customer tidak memerlukan aplikasi atau akun Kapster.id | `[KUNCI]` |
| PB-03 | Monetisasi subscription-first | `[KUNCI]` |
| PB-04 | Dashboard kapster bukan bagian base MVP | `[KUNCI]` |
| PB-05 | **Multi-outlet masuk MVP** | `[USUL-v2]` |
| PB-06 | **Penagihan berbasis biaya dasar organisasi + biaya per outlet aktif** | `[USUL-v2]` |
| PB-07 | **Asumsi komisi 10% dan fee Rp2.000 dihapus; Kapster.id tidak memungut komisi transaksi** | `[USUL-v2]` |
| PB-08 | **Biaya payment gateway ditinjau ulang; opsi kuota wajar direkomendasikan** | `[USUL-v2]` |
| PB-09 | **Dana customer masuk langsung ke akun merchant barbershop, bukan ditampung Kapster.id** | `[USUL-v2]` |

### 23.2 Struktur organisasi dan akses (RB)

| ID | Keputusan | Status |
|---|---|---|
| RB-01 | MVP hanya memiliki peran Owner dan Kasir | `[KUNCI]` |
| RB-02 | **Satu organisasi dapat memiliki hingga tiga akun Owner; satu ditandai Owner utama** | `[USUL-v2]` |
| RB-03 | **Kasir terikat pada satu atau beberapa outlet; tidak dapat melihat data outlet lain** | `[USUL-v2]` |
| RB-04 | **Satu kasir hanya boleh memiliki satu shift aktif di seluruh organisasi** | `[USUL-v2]` |
| RB-05 | Kasir tidak dapat mengubah harga layanan | `[KUNCI]` |
| RB-06 | Kasir mengajukan refund, Owner menyetujui atau menolak | `[KUNCI]` |
| RB-07 | **Kasir dapat menandai ketidakhadiran kapster untuk hari berjalan; cuti terjadwal tetap wewenang Owner** | `[USUL-v2]` |
| RB-08 | **Kasir dapat memblokir slot hari berjalan; perubahan jadwal berulang tetap wewenang Owner** | `[USUL-v2]` |
| RB-09 | Kasir dapat mencari customer, tetapi riwayat transaksi hanya untuk Owner | `[KUNCI]` |
| RB-10 | **Kasir tidak melihat riwayat kunjungan customer di outlet lain** | `[USUL-v2]` |
| RB-11 | Aksi sensitif wajib masuk audit log | `[KUNCI]` |

### 23.3 Model data multi-outlet (MO)

| ID | Keputusan | Status |
|---|---|---|
| MO-01 | **Katalog layanan berada di tingkat organisasi; harga per outlet** | `[USUL-v2]` |
| MO-02 | **Kapster berada di tingkat organisasi, ditugaskan ke satu atau banyak outlet** | `[USUL-v2]` |
| MO-03 | **Jadwal kerja terikat pasangan kapster–outlet; cuti berlaku lintas outlet** | `[USUL-v2]` |
| MO-04 | **Kapster tidak boleh memiliki jadwal bertumpang tindih di dua outlet** | `[USUL-v2]` |
| MO-05 | **Customer berada di tingkat organisasi, riwayat menyimpan penanda outlet** | `[USUL-v2]` |
| MO-06 | **Booking, transaksi, dan shift terikat pada satu outlet** | `[USUL-v2]` |
| MO-07 | **Setiap outlet memiliki URL booking langsung; organisasi multi-outlet mendapat halaman pemilih outlet** | `[USUL-v2]` |
| MO-08 | **UI multi-outlet disembunyikan bagi organisasi satu outlet** | `[USUL-v2]` |
| MO-09 | **Transfer booking antar outlet tidak masuk MVP** | `[USUL-v2]` |
| MO-10 | **Setiap query bisnis wajib membawa scope organisasi, dan outlet bila relevan** | `[USUL-v2]` |

### 23.4 Booking dan penjadwalan (BK)

| ID | Keputusan | Status |
|---|---|---|
| BK-01 | Owner mengatur jadwal maksimal 30 hari ke depan | `[KUNCI]` |
| BK-02 | Customer dapat memesan hari yang sama sampai 30 hari ke depan | `[KUNCI]` |
| BK-03 | Customer wajib memilih kapster tertentu | `[KUNCI]` |
| BK-04 | Interval slot mengikuti durasi layanan; buffer default 10 menit | `[KUNCI]` |
| BK-05 | **Buffer dan toleransi keterlambatan dapat dikonfigurasi per outlet** | `[USUL-v2]` |
| BK-06 | **Booking hari yang sama minimal 60 menit sebelum waktu mulai** | `[USUL-v2]` |
| BK-07 | Harga dan durasi dikunci saat booking dibuat | `[KUNCI]` |
| BK-08 | Urutan booking: layanan → kapster → tanggal → jam → data → review → pembayaran | `[KUNCI]` |
| BK-09 | **Penguncian slot memakai constraint basis data sebagai jaminan utama, ditambah kunci bertenggat sebagai umpan balik cepat** | `[USUL-v2]` |
| BK-10 | **Status `in_service` ditambahkan; `cancelled_by_barbershop` menjadi `cancelled_by_outlet`** | `[USUL-v2]` |
| BK-11 | Penggantian kapster dan reschedule tersedia sebelum dan pada hari H | `[KUNCI]` |
| BK-12 | Customer tidak dapat membatalkan atau reschedule mandiri | `[KUNCI]` |
| BK-13 | No-show ditandai manual oleh kasir, toleransi default 15 menit | `[KUNCI]` |

### 23.5 Pembayaran (PY)

| ID | Keputusan | Status |
|---|---|---|
| PY-01 | **Booking melalui link publik wajib dibayar online; walk-in boleh tunai atau EDC di outlet** | `[USUL-v2]` |
| PY-02 | Slot ditahan maksimal 15 menit selama pembayaran | `[KUNCI]` |
| PY-03 | Status pembayaran final ditentukan webhook, bukan redirect | `[KUNCI]` |
| PY-04 | Refund parsial tidak tersedia pada MVP | `[KUNCI]` |
| PY-05 | **Dana no-show pada booking prabayar tidak dikembalikan dan menjadi hak outlet; wajib dinyatakan sebelum pembayaran** | `[USUL-v2]` |
| PY-06 | **Metode pembayaran dapat dikonfigurasi berbeda per outlet** | `[USUL-v2]` |
| PY-07 | **`Ojire Tech` berstatus kandidat, bukan keputusan final; siapkan penyedia pembanding dan lapisan adapter** | `[USUL-v2]` |
| PY-08 | **Pembayaran online masuk Must have, bukan Should have** | `[USUL-v2]` |

### 23.6 Operasional kasir (KS)

| ID | Keputusan | Status |
|---|---|---|
| KS-01 | Kasir wajib melakukan opening dan closing shift | `[KUNCI]` |
| KS-02 | Kasir tidak dapat logout sebelum closing | `[KUNCI]` |
| KS-03 | Variance wajib diberi alasan dan ditinjau Owner | `[KUNCI]` |
| KS-04 | Transaksi tercatat tidak dapat diedit atau dihapus kasir; koreksi disetujui Owner | `[KUNCI]` |
| KS-05 | Owner dapat force-close shift dengan alasan wajib | `[KUNCI]` |
| KS-06 | **Shift selalu terikat pada satu outlet; saldo diwariskan hanya dalam outlet yang sama** | `[USUL-v2]` |

### 23.7 Data, laporan, dan kepatuhan (DT)

| ID | Keputusan | Status |
|---|---|---|
| DT-01 | Data customer minimum: nama dan WhatsApp wajib, email opsional, tanpa OTP | `[KUNCI]` |
| DT-02 | Tidak ada catatan internal maupun label customer pada MVP | `[KUNCI]` |
| DT-03 | **Diskon sepenuhnya di luar MVP, termasuk pencatatan dan skenario demo** | `[USUL-v2]` |
| DT-04 | Permintaan penghapusan: data personal dihapus, transaksi dianonimkan | `[KUNCI]` |
| DT-05 | **Laporan tersedia per outlet dan konsolidasi; ekspor konsolidasi memuat kolom outlet** | `[USUL-v2]` |
| DT-06 | **Seluruh timestamp disimpan UTC; tampilan mengikuti zona waktu outlet** | `[USUL-v2]` |
| DT-07 | **Periode retensi data ditetapkan sesuai tabel Bagian 17.6** | `[USUL-v2]` |
| DT-08 | Kapster.id tidak menjadi penyelenggara jasa pembayaran | `[KUNCI]` |

### 23.8 Teknis (TK)

| ID | Keputusan | Status |
|---|---|---|
| TK-01 | Backend NestJS modular monolith, bukan microservices | `[KUNCI]` |
| TK-02 | PostgreSQL dengan Prisma | `[KUNCI]` |
| TK-03 | Frontend monorepo, backend repo terpisah | `[KUNCI]` |
| TK-04 | Next.js untuk publik, React + Vite untuk dashboard | `[KUNCI]`, ditinjau di OP-10 |
| TK-05 | **Middleware scope organisasi dan outlet berada di lapisan terluar** | `[USUL-v2]` |
| TK-06 | **Test isolasi tenant dan test konkurensi slot bersifat wajib** | `[USUL-v2]` |
| TK-07 | UI/UX final belum ditetapkan; mockup lama bukan baseline | `[KUNCI]` |

---

## 24. Item Terbuka

| ID | Item | Pertanyaan yang harus dijawab | Pemilik | Kebutuhan waktu |
|---|---|---|---|---|
| OP-01 | Harga dan paket | Nominal per paket, biaya per outlet tambahan, trial, grace period, biaya onboarding | Founder | Sebelum paid beta |
| OP-02 | Model biaya payment gateway | Opsi A/B/C/D, besar kuota wajar, tarif kelebihan | Founder | Sebelum pilot berbayar |
| OP-03 | Aliran dana dan merchant | Sub-merchant per outlet atau per organisasi; konsekuensi bila penyedia tidak mendukung | Founder + legal | Sebelum integrasi |
| OP-04 | Privasi customer lintas outlet | Redaksi pemberitahuan, dasar pemrosesan, pengendali data | Legal | Sebelum pilot |
| OP-05 | Due diligence penyedia pembayaran | Legalitas, biaya, settlement, webhook, refund, sandbox, SLA | Founder | Sebelum integrasi |
| OP-06 | Otomasi WhatsApp | Penyedia, biaya per pesan, template, consent | Product | Fase berikutnya |
| OP-07 | Target dan kriteria pilot | Jumlah pilot, profil, kriteria lulus menuju paid beta | GTM | Sebelum pilot |
| OP-08 | Support dan SLA | Kanal, jam layanan, batas respons, eskalasi | Ops | Sebelum pilot |
| OP-09 | Audit ulang kompetitor | Perbandingan fitur multi-outlet dan harga terbaru | Product | Sebelum penetapan harga |
| OP-10 | Arsitektur frontend | Tetap dua aplikasi atau satu aplikasi Next.js | Engineering | Saat technical design |
| OP-11 | Pengumpulan rating kapster | Mekanisme dan waktu pengumpulan; wajib atau tidak | Product | Fase berikutnya |
| OP-12 | Konfigurasi jam shift | Definisi jam pagi, sore, dan long shift per outlet | Ops | Sebelum MVP internal |

---

## 25. Next Actions

| Prioritas | Aksi | Output | Pemilik | Status |
|---|---|---|---|---|
| P0 | **Review dan setujui seluruh item `[USUL-v2]`** | Ledger keputusan final | Tim produk | Menunggu |
| P0 | Validasi alur operasional lewat wawancara Owner, kasir, kapster | Catatan wawancara dan process map | Tim produk | Belum dimulai |
| P0 | **Validasi kebutuhan multi-outlet pada minimal 3 prospek jaringan** | Temuan dan konfirmasi basis penagihan | Tim produk | Belum dimulai |
| P0 | Menentukan badan usaha, NIB, KBLI, dan review legal | Legal checklist | Founder + legal | Paralel |
| P0 | **Memutuskan model biaya payment gateway** | Keputusan OP-02 | Founder | Belum dimulai |
| P0 | Menentukan struktur repo dan domain model multi-outlet | Architecture decision record | Engineering | Belum dimulai |
| P1 | **Due diligence penyedia pembayaran dan model sub-merchant** | Hasil OP-03 dan OP-05 | Founder | Belum dimulai |
| P1 | Menyusun referensi UI/UX | Reference board | Product | Belum dimulai |
| P1 | Membangun foundation auth, tenant, outlet, RBAC | Foundation teruji | Engineering | Belum dimulai |
| P1 | Membangun booking, kasir, dan penjadwalan | Vertical slice MVP | Engineering | Belum dimulai |
| P1 | Menyiapkan 10–20 outlet pilot termasuk 2 organisasi multi-outlet | Daftar pilot dan rencana onboarding | GTM | Belum dimulai |
| P2 | Menentukan harga | Keputusan OP-01 | Founder | Belum dimulai |

---

## 26. Referensi

- Presentasi awal `Kapster_id_Presentasi.pptx`.
- PRD v1 `kapster-prd-current-open.md`, 3 September 2026.
- Percakapan keputusan produk dan arsitektur tim.
- Riset publik kompetitor: CukurPro, Kasera, BARBA, BarberBook, CukurKuy.
- OSS dan AHU untuk bentuk usaha dan perizinan.
- Bank Indonesia untuk perizinan penyelenggara sistem pembayaran.
- UU Pelindungan Data Pribadi.
- Panduan PSE Lingkup Privat Komdigi.

Informasi kompetitor, angka pasar, estimasi biaya, dan asumsi pendapatan wajib diverifikasi ulang saat keputusan komersial diambil.

---

## Appendix A — Skenario Demo Multi-Outlet

**Organisasi:** Garasi Barber
**Outlet:** Garasi Barber Tebet, Garasi Barber Kemang
**Kapster:** Dimas (Tebet), Raka (Tebet dan Kemang), Bagas (Kemang)
**Layanan:** Potong, Potong + Cuci, Premium Cut
**Customer:** Andi Pratama

1. Andi membuka `kapster.id/garasi-barber` dari Instagram.
2. Karena Garasi Barber memiliki dua outlet, Andi melihat halaman pemilih outlet dan memilih Tebet.
3. Memilih Potong + Cuci, kapster Dimas, dan slot 10.00.
4. Mengisi nama dan nomor WhatsApp, membaca kebijakan pembatalan dan ketentuan no-show, lalu membayar online.
5. Booking menjadi `confirmed` setelah webhook diterima, dan muncul di antrean kasir Tebet.
6. Pagi harinya Dimas mengabari sakit. Kasir Tebet menandai ketidakhadiran untuk hari ini; Owner menerima notifikasi.
7. Sistem menampilkan booking terdampak. Kasir memindahkan Andi ke Raka pada jam yang sama, karena Raka dijadwalkan di Tebet hari itu.
8. Kasir menghubungi Andi melalui WhatsApp.
9. Andi datang, kasir melakukan check-in, dan Raka melayani.
10. Booking prabayar ditandai selesai. Tidak ada pembayaran tambahan.
11. Transaksi masuk laporan outlet Tebet dan laporan konsolidasi Garasi Barber.
12. Sore harinya kasir menutup shift; saldo laci sesuai dan tidak ada variance.

*(Perbedaan dari skenario v1: tidak ada diskon, karena diskon di luar MVP; pembayaran sudah lunas di muka, sehingga kasir tidak mencatat pembayaran tunai; dan alur kini melewati pemilihan outlet serta memakai kapster lintas outlet.)*

Skenario ini menjadi alur prioritas untuk prototipe dan E2E test MVP.

---

## Appendix B — Daftar Lengkap Perubahan v1 → v2

### B.1 Perbaikan istilah

| Lokasi v1 | Teks v1 | Perbaikan v2 |
|---|---|---|
| §3 prinsip 7 | "perluasan struktur organisasi siap sejak model data" | "Multi-outlet siap sejak model data" |
| §4.1 | "Barbershop dengan satu atau beberapa barbershop" | "Barbershop dengan satu atau beberapa outlet" |
| §4.1 | "Jaringan barbershop kecil-menengah dengan 2–20 barbershop" | "…dengan 2–20 outlet" |
| §6.1 | Paket "perluasan struktur organisasi" | Paket "Chain" |
| §2.1 | "Jaringan perluasan struktur organisasi membutuhkan konsistensi data" | "Jaringan multi-outlet membutuhkan konsistensi data" |
| §17 | "perluasan struktur organisasi reporting" | "Laporan konsolidasi multi-outlet" |
| §12 | Entitas `barbershop` huruf kecil | Entitas `Outlet` |
| Seluruh dokumen | "barbershop" untuk lokasi fisik | "outlet" |

### B.2 Kontradiksi yang diselesaikan

| # | Kontradiksi pada v1 | Penyelesaian v2 |
|---|---|---|
| 1 | Pembayaran online wajib untuk semua booking, tetapi ada laci kas, transaksi tunai walk-in, dan rekonsiliasi shift | PY-01: wajib online hanya untuk booking via link publik; walk-in boleh tunai atau EDC |
| 2 | Payment online sebagai *Should have*, padahal booking publik MVP bergantung padanya | PY-08: dipindahkan ke *Must have* |
| 3 | Diskon dinyatakan ditunda, tetapi tetap ada pencatatan diskon, entitas `Discount`, dan skenario demo dengan diskon | DT-03: diskon sepenuhnya di luar MVP; skenario demo diperbaiki |
| 4 | §14 menyebut Midtrans/Xendit, §9.9 dan ledger menyebut `Ojire Tech` | PY-07: `Ojire Tech` berstatus kandidat, disiapkan pembanding dan adapter |
| 5 | Kasir "dapat mengubah jadwal operasional sesuai kebutuhan" sekaligus "tidak dapat mengubah jadwal dan availability secara penuh" | RB-08: kasir hanya untuk hari berjalan; perubahan berulang milik Owner |
| 6 | §9.10 CRM memuat paragraf laporan yang mengulang §9.11 | Isi dikembalikan ke Bagian 11.13 |
| 7 | Komisi 10% atas transaksi disebut di bagian pembayaran, bertentangan dengan subscription-first | PB-07: komisi dihapus seluruhnya |

### B.3 Celah yang ditutup

| # | Celah pada v1 | Penanganan v2 |
|---|---|---|
| 1 | Biaya payment gateway ditanggung Kapster.id tanpa batas | Bagian 7.4, PB-08 |
| 2 | Tidak dijelaskan ke rekening siapa dana customer masuk | Bagian 7.5, PB-09 |
| 3 | Nasib uang no-show pada booking prabayar tidak diatur | PY-05 |
| 4 | Mekanisme penguncian slot tidak disebutkan | Bagian 13.4, BK-09 |
| 5 | Zona waktu tidak dibahas | Bagian 13.5, DT-06 |
| 6 | Satu akun Owner per organisasi, berisiko penguncian total | RB-02 |
| 7 | Hanya Owner boleh menandai kapster sakit, menimbulkan kebuntuan pagi hari | RB-07 |
| 8 | Booking hari yang sama tanpa batas waktu minimum | BK-06 |
| 9 | Status "sedang dilayani" dipakai tanpa status resmi | BK-10 |
| 10 | Customer bisa tidak menerima konfirmasi apa pun | Bagian 11.14 |
| 11 | KPI tanpa angka target | Bagian 21.1 |
| 12 | Acceptance criteria tidak terukur | Bagian 21.2 |
| 13 | Kebijakan retensi tanpa periode | Bagian 17.6 |
| 14 | Tidak ada glosarium | Bagian 4 |
| 15 | Ledger keputusan datar tanpa ID dan banyak duplikasi | Bagian 23 |
| 16 | Item terbuka tanpa pemilik dan tenggat | Bagian 24 |

### B.4 Penambahan multi-outlet

Seluruh Bagian 9; entitas `Outlet`, `UserOutletAssignment`, `BarberOutletAssignment`, `ServiceOutletPrice`, `CashMovement`; struktur URL bertingkat; halaman pemilih outlet; laporan konsolidasi; validasi jadwal lintas outlet; shift terikat outlet; penagihan per outlet; test isolasi antar outlet; serta persyaratan bahwa klien satu outlet tidak melihat kompleksitas tambahan.

---

## Appendix C — Batasan Dokumen

PRD ini bukan dokumen desain visual final, bukan kontrak hukum, bukan spesifikasi API final, dan bukan model finansial final. Detail tersebut disusun setelah discovery, validasi legal, technical design, dan persetujuan cakupan.

Seluruh item bertanda `[USUL-v2]` adalah usulan yang menunggu persetujuan dan **belum boleh diperlakukan sebagai keputusan** sampai ditinjau tim.

Seluruh angka bertanda `[ASUMSI]` belum tervalidasi dan tidak boleh dipakai sebagai dasar komitmen komersial.
