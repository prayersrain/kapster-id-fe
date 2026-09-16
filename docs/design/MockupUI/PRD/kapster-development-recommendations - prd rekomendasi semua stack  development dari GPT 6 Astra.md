# Kapster.id — Development Blueprint & Rekomendasi

Versi 0.1 — draft rekomendasi Hal Hermes untuk review Zick dan Haikal.
Permintaan sumber: Discord `1546742248484380672`, thread `1545842010437722122`.
Status: dokumen perencanaan, bukan bukti aplikasi sudah dibangun atau diuji.

## 0. Acuan dan batas keputusan

Sumber: PRD v2.0 `/home/hermes/docs/kapster-prd.md`, terutama §9–16, §18–25, dan `/home/hermes/docs/kapster-prd-v2-review.md`; riwayat impor v2 pesan `1545849985252331520`. Impor draft bukan persetujuan seluruh usulan. Dokumen ini tidak mengganti PRD utama.

Label BASELINE berarti keputusan tercatat yang tidak termasuk konflik diketahui. REKOMENDASI berarti pilihan Hal Hermes, belum persetujuan pengguna. KONFLIK berarti perlu rekonsiliasi. DEPENDENSI berarti menunggu keputusan produk/bisnis/legal/provider. Seluruh detail baru di bawah, termasuk target, endpoint dan skema, adalah REKOMENDASI kecuali disebut BASELINE. Kata “wajib” menjelaskan syarat desain target, bukan klaim implementasi.

Koreksi rangkuman lama: NestJS modular monolith, PostgreSQL + Prisma dan struktur repo sudah baseline TK-01–03. Next.js publik + React/Vite dashboard baseline TK-04 dengan review OP-10. CRM tanpa label sudah DT-02. Onboarding/laporan/RBAC sudah dibahas, bukan kosong. Mockup lama bukan baseline UI final TK-07. Multi-outlet, tiga Owner, in_service, kuota PG dan direct settlement masih usulan. BK-13 no-show dan DT-04 penghapusan mewarisi konflik historis.

## 1. Rekomendasi inti dan scope

Bangun SaaS web B2B: booking publik tanpa akun customer, dashboard Owner/Kasir, backend modular monolith, PostgreSQL sebagai sumber kebenaran booking dan keuangan. BASELINE PB-01/02/04 dan RB-01: bukan marketplace, customer tanpa aplikasi/akun, dashboard kapster bukan base MVP.

Saya merekomendasikan multi-outlet sederhana sejak MVP mengikuti arah draft terbaru, tetapi satu penugasan outlet aktif per kapster pada rilis pertama. Konsekuensi multi-outlet adalah tambahan scope data, akses, laporan dan testing. Bila kapasitas tim/pilot hanya satu lokasi, model Organization–Outlet tetap dipertahankan, fitur penambahan cabang dapat ditunda atas keputusan produk.

**Model target:**
- Organization: badan usaha, tenant, unit langganan. Outlet: lokasi fisik. Barbershop: bisnis dalam narasi.
- Katalog Service dan Customer tingkat organisasi; harga/status layanan per outlet.
- Barber tingkat organisasi, assignment outlet bertanggal efektif. Rekomendasi satu assignment aktif berbeda dari MO-02/03 v2 yang menawarkan lintas outlet.
- Booking/transaksi/shift tetap pada satu outlet, tidak dipindahkan setelah dibuat.
- Owner melihat organisasi; kasir hanya outlet assignment.
- UI satu outlet tanpa selector/konsolidasi, tetapi menu Kelola Outlet tetap ada.

Pemindahan kapster memeriksa booking mendatang dan tidak mengubah histori. Jika lintas outlet langsung dipilih, wajib aturan jeda perjalanan, benturan resource global, serta pembatasan akses daftar booking terdampak.

DITUNDA: transfer booking antar outlet, franchise lintas badan usaha, regional manager, payroll, inventory, komisi kompleks, diskon, marketplace, dashboard kapster, native customer app, offline write-sync. Rating dan reminder otomatis tidak dimasukkan tanpa persetujuan scope.

## 2. Arsitektur dan repository

BASELINE: NestJS REST modular monolith; PostgreSQL + Prisma; frontend monorepo dan backend repo terpisah; Next.js + TypeScript publik, React + Vite dashboard.

Rekomendasi pertahankan baseline. OP-10 dapat ditutup “tetap dua frontend” setelah review. Dua frontend tetap memakai satu backend autentikasi dan kontrak API, bukan dua identitas terpisah.

```
frontend/apps/public-web
frontend/apps/dashboard
frontend/packages/ui
frontend/packages/api-client
frontend/packages/validation
frontend/packages/config
```

Backend modul: auth, organization, outlet, catalog, barber, schedule, booking, payment, cashier, customer, reporting, billing, notification, audit. Domain tidak bergantung SDK provider. Payment adapter terpisah. API/worker boleh proses terpisah dari codebase sama.

PostgreSQL otoritas integritas; Redis/BullMQ opsional untuk antrean, retry, rate limit, bukan pengganti constraint. Transactional outbox menghubungkan commit DB dengan pekerjaan asynchronous. OpenAPI menghasilkan typed frontend client. Tidak membangun microservices MVP.

## 3. Auth, onboarding, dan pemulihan

BASELINE sumber §11.2: Owner daftar WhatsApp/email/password, OTP email, wizard layanan–kapster–jadwal, undangan kasir.

Rekomendasi RB-02: hingga tiga Owner, satu primary untuk billing; primary mengundang Owner tambahan. Owner terakhir tidak dapat dihapus; transfer primary memerlukan re-auth/audit. Bukan keputusan yang sudah disetujui.

Server-side session dengan cookie HttpOnly/Secure/SameSite sesuai deployment; same-origin API proxy bila mungkin. CSRF untuk cookie mutasi, origin allowlist, jangan simpan credential session di localStorage. Password Argon2id, parameter dibenchmark pada host. OTP/invitation/reset sekali pakai, hash tersimpan, expiry dan batas percobaan. Reset mencabut session lama; error tidak membocorkan keberadaan email.

Wizard resumable: verifikasi → organisasi/outlet → layanan valid → kapster/kemampuan → jam/jadwal/buffer → undangan kasir → preview profil → aktivasi booking setelah merchant siap. Pisahkan setup_complete, public_profile_published dan online_booking_enabled. Profil boleh terbit sebelum merchant, tetapi tidak menerima uang. KYC tidak dihitung sebagai waktu input wizard.

Undangan terikat organisasi/email/role/outlet dan expiry. Hak berasal dari membership server, bukan outlet_id browser. Perubahan assignment mencabut akses segera.

Acceptance: refresh wizard tidak menghapus progress; token terpakai/kedaluwarsa ditolak; reset session efektif; pembayaran tidak aktif sebelum merchant siap.

## 4. Role dan audit

| Aksi | Owner | Kasir |
|---|---|---|
| Organisasi/outlet/katalog/harga/jadwal dasar | Ya | Tidak |
| Booking/walk-in/check-in/reschedule | Ya | Outlet penugasan |
| Blok slot hari berjalan | Ya | Outlet aktif + alasan; usulan RB-08 |
| Cuti global/berulang | Ya | Tidak |
| Pencarian customer | Organisasi | Nama/WA minimum organisasi |
| Histori transaksi customer/laporan penuh | Ya | Tidak |
| Refund/koreksi transaksi | Approve/reject | Ajukan alasan |
| Force-close | Ya + alasan | Tidak |
| User/billing/export organisasi | Ya | Tidak |

Ketidakhadiran kasir rekomendasi hanya hari ini di outlet aktif, bukan TimeOff global yang memblokir cabang lain. Owner menangani dampak lintas lokasi. Tidak bocorkan booking outlet tanpa assignment.

Jika Owner menerima kas, rekomendasi masuk konteks operator dengan shift sendiri; ini perubahan terhadap matriks §10.5 yang menyebut shift Owner tidak berlaku, perlu approval.

Audit menyimpan aktor, tenant/outlet, waktu, aksi, entity ID, alasan, request ID dan perubahan nonrahasia. Jangan memasukkan token/password/full payload payment/PII berlebihan.

## 5. Katalog, kapster, jadwal

Service: nama, deskripsi, kategori opsional, durasi menit, status, kapster yang mampu. Harga integer rupiah, bukan floating point. Snapshot harga/nama/durasi saat booking sesuai BK-07.

Rekomendasi satu layanan per booking; paket Potong+Cuci satu item katalog. Multi-service cart ditunda. Durasi organisasi, harga outlet. Ganti layanan setelah paid melalui cancel/refund lalu booking baru, bukan mengubah nilai diam-diam. Ganti kapster untuk layanan sama mempertahankan snapshot harga.

Kapster tanpa login MVP; foto opsional; nonaktif bukan hard delete, booking mendatang diselesaikan dahulu. Jadwal dari pola mingguan, pengecualian, istirahat/cuti, jam outlet dan reservasi aktif.

Horizon baseline 30 hari; batas tanggal inklusif dibakukan test. Timestamp UTC; timezone IANA outlet default Asia/Jakarta rekomendasi DT-06. Buffer baseline 10 menit. Buffer configurable dan cutoff online hari ini default 60 menit masih usulan BK-05/06. Walk-in boleh waktu sekarang jika tersedia. Rekomendasi rentang layanan termasuk buffer harus muat dalam availability.

Acceptance: perubahan harga tidak mengubah histori; nonaktif tidak menerima booking baru; perubahan jadwal menampilkan dampak, bukan auto-cancel; tidak ada slot di luar jam yang sah.

## 6. Slot locking dan konkurensi

KONFLIK §13.4: unique jam mulai tidak melindungi interval berbeda yang overlap. Redis key per start juga tidak cukup.

Rekomendasi PostgreSQL exclusion constraint pada `tstzrange(start_at, occupied_until, '[)')`, per organisasi/kapster untuk reservasi aktif. Rentang termasuk buffer; resource key tidak memasukkan outlet agar kapster sama tetap tidak overlap lintas lokasi.

SlotReservation punya state aktif eksplisit, bukan predicate indeks memakai now(). Expiry menonaktifkan dalam transaksi. Prisma migration dapat menggunakan SQL khusus; verifikasi dukungan btree_gist.

Alur: validasi server → transaksi singkat expire hold relevan dan insert reservasi+pending booking → commit → create payment intent idempotent. Jangan tahan DB transaction selama panggilan provider. Hold maksimal 15 menit PY-02, server clock otoritas. Worker expiry plus request-time cleanup menghindari lock tertahan ketika worker terlambat.

Slot search hanya snapshot; create dapat 409 SLOT_UNAVAILABLE. Reschedule menguasai slot baru dan melepas lama atomik; gagal tetap slot lama. Expected version menolak layar usang. Timeout provider masuk rekonsiliasi sebelum create ulang.

Acceptance: overlap start berbeda, buffer, rentang bersebelahan, online vs walk-in, concurrent reschedule, worker mati dan expiry semuanya tidak double-book.

## 7. Booking publik dan halaman customer

BASELINE BK-08: layanan → kapster → tanggal → jam → data → review → payment; memilih kapster tertentu tanpa akun.

Halaman: landing produk, profil/selector outlet, langkah booking, review/pending/sukses/gagal/expired, status token dan kebijakan. `/{organizationSlug}` langsung outlet tunggal atau selector; `/{organizationSlug}/{outletSlug}` selalu URL langsung. Reserve slug api/admin/login; organisasi unik global, outlet unik organisasi. Perubahan slug perlu redirect terkontrol. Outlet nonaktif menampilkan informasi dan alternatif organisasi sama.

Nama/WA wajib, email opsional, tanpa OTP customer DT-01. Normalisasi nomor tidak memberi hak melihat histori. Public endpoint tidak membocorkan keberadaan/nama pemilik nomor.

Review memuat outlet/layanan/kapster/waktu lokal/durasi/harga/kebijakan dan fee yang disetujui, bukan asumsi OP-02. Modal atau redirect mengikuti provider; redirect sukses bukan bukti paid.

Token status random opaque, hash tersimpan, scope satu booking dan bisa dicabut; usulan expiry tujuh hari setelah jadwal perlu review support/privacy. No-store/noindex, referrer policy ketat, tanpa tracker PII. Link hilang ditangani kasir dengan verifikasi minimum, bukan pencarian publik terbuka.

Mobile-first, input aman dipertahankan saat retry; loading/empty/error/conflict/offline/expired jelas. Tidak ada sukses palsu ketika jaringan terputus.

## 8. State booking, no-show, dan antrean

Rekomendasi:
```
pending_payment -> confirmed -> checked_in -> in_service -> completed
pending_payment -> expired
confirmed -> no_show
confirmed/checked_in -> cancelled_by_customer | cancelled_by_outlet
```
Manual/walk-in dapat confirmed/checked_in dengan payment terpisah. Completed bukan paid. Reschedule adalah event, refunded domain payment/refund, bukan terminal booking.

KONFLIK BK-10: in_service sebelumnya sengaja dihapus. Saya rekomendasikan ditambah kembali untuk membedakan antrean dan sedang dilayani; ini pembalikan eksplisit.

KONFLIK BK-13: jawaban historis otomatis salah dirangkum manual. Rekomendasi otomatis setelah toleransi 15 menit hanya confirmed belum check-in; kasir koreksi dengan alasan/audit. Bila slot terisi lagi, koreksi tidak boleh membuat reservasi bentrok. Toleransi configurable usulan v2.

PY-05 nasib uang no-show terpisah; tidak otomatis forfeiture/refund tanpa kebijakan dan notice yang disetujui. Overtime/terlambat memberi peringatan dan opsi kapster/waktu alternatif, tidak diam-diam menggeser booking berikutnya. Koreksi completed/no-show aksi khusus, bukan dropdown bebas semua state.

Acceptance: race check-in/no-show satu transisi sah; invalid transition ditolak; koreksi tidak overbook; status selesai tidak dipakai memaksa angka keuangan cocok.

## 9. Walk-in, manual booking, reschedule

Rekomendasi PY-01: public prepaid online, walk-in tunai/EDC/QRIS statis, manual kasir boleh unpaid lalu lunas sebelum completed. Kebijakan masih perlu review.

Walk-in: shift → cari/buat customer → layanan/kapster → validasi slot → check-in → layanan → catat payment → complete. Tidak boleh overbook karena customer sudah datang. Manual booking mengikuti validasi jadwal sama, tanpa menambah payment link otomatis yang belum dibutuhkan.

BASELINE BK-11/12: ganti kapster/reschedule sebelum dan hari H, customer melalui kasir. Reschedule berulang selama valid dan tercatat. Transfer outlet ditunda. Perubahan layanan/nilai bukan edit booking paid diam-diam.

Kapster berhalangan: blok sesuai scope, daftar dampak sesuai akses, pilih ganti waktu/kapster/batal, commit, WA manual. Cancel melepas slot, refund workflow terpisah. Pembatalan customer yang disetujui mengikuti kebutuhan sumber refund penuh; waktu eksekusi tergantung approval/provider. Pembatalan outlet Owner menangani per kasus.

## 10. Payment, refund, rekonsiliasi

BASELINE PY-02/03/04, RB-06: hold 15 menit, webhook otoritatif, tanpa refund parsial, kasir ajukan–Owner approve.

DEPENDENSI OP-05/03/02: Ojire Tech kandidat belum tervalidasi; legalitas/kemitraan, biaya/metode, merchant, settlement, sandbox, signature, refund, SLA harus diverifikasi. Merchant tidak sama dengan rekening settlement; jangan mewajibkan satu merchant per outlet tanpa bukti provider.

Adapter: createPayment/fetchPaymentStatus/verifyWebhook/requestRefund/fetchRefundStatus. Simpan amount/currency/merchant/reference/attempt/idempotency key. Payment state created/pending/paid/failed/expired/cancelled; Refund requested/approved/rejected/processing/succeeded/failed. Approval bukan refund sukses. Payment sukses ganda harus terdeteksi.

Webhook signature, dedupe event, cocokkan amount/currency/merchant, durable inbox, atomic state+outbox. Out-of-order tidak menurunkan paid ke pending. Mismatch masuk review. Retry bounded backoff/dead-letter; jangan log credential.

Late paid setelah hold expired: rekomendasi jangan auto-confirm meski slot tampak kosong. Booking tetap expired, payment paid + reconciliation required, review/refund penuh dan notifikasi Owner. Jangan membatalkan booking sah orang lain. Otomatisasi refund bergantung provider/approval.

Timeout create intent diperiksa reference sama sebelum create baru. Refund timeout bukan bukti gagal; query status sebelum retry. Refund setelah settlement membutuhkan sumber dana OP-03. Refund tunai terkait transaksi awal/laci aktif/approval. Rekonsiliasi berkala internal-provider mendeteksi pending macet dan mismatch.

Acceptance: webhook palsu ditolak, duplicate/out-of-order aman, late paid tidak double-book, timeout tidak menggandakan uang, transaksi dapat ditelusuri ujung-ke-ujung.

## 11. Shift, laci, dan koreksi transaksi

BASELINE KS-01–05: opening/closing, alasan variance/review Owner, transaksi tidak diedit kasir, force-close Owner, logout normal setelah closing.

Rekomendasi satu laci aktif per outlet, satu shift aktif per laci, satu shift aktif per kasir organisasi. Banyak laci paralel ditunda. Serah-terima bukan akun bersama.

Saldo diharapkan = awal + penerimaan tunai + penambahan sah − refund tunai − pengeluaran sah. Online/EDC/QRIS statis tidak masuk kas fisik. Mutasi menyimpan sumber/aktor/waktu/outlet/shift.

Opening awal manual, berikutnya saldo aktual closing terdahulu; variance tetap tercatat. Force-close tanpa hitung aktual tidak membuat angka fiktif, opening berikut wajib verifikasi fisik. Koreksi adjustment/reversal approved, bukan rewrite transaksi original. Retry closing/payment cash idempotent.

Clarification KS-02: session expiry/revoke/emergency logout/browser ditutup tetap mungkin. Shift bertahan server dan dapat dilanjutkan/force-close; jangan menjaga session bocor demi closing. OP-12 rekomendasi pagi/sore/long sebagai label, jam aktual sebagai data, bukan jadwal hardcoded.

Acceptance: shift paralel laci sama ditolak; payment online tidak mengubah kas; retry aman; session expiry tidak menghapus shift; force-close alasan wajib.

## 12. CRM, privasi dan retensi

BASELINE DT-01/02, RB-09: nama/WA wajib, email opsional, tanpa OTP, label/catatan internal, histori transaksi Owner saja.

Customer organisasi MO-05 masih usulan. Normalisasi nomor untuk dedupe/pencarian, bukan asumsi nomor selalu satu orang. Nomor keluarga/daur ulang/salah input membutuhkan koreksi/merge Owner dengan audit, tidak lintas tenant. Kasir hasil minimum, paginated/rate-limited, tanpa mass export.

KONFLIK DT-04: jawaban tanpa label tidak menyetujui anonymization. Rekomendasi deletion request melalui Owner/support dengan verifikasi, bukan public delete tanpa auth. UI penghapusan, dasar hukum dan periode retensi keputusan berbeda.

Pisahkan PII dan financial minimum; deletion request berstatus, anonymization idempotent, legal hold bila relevan, propagasi cache/export/storage. Backup mengikuti expiry dan deletion replay setelah restore. Angka retensi 24 bulan/90 hari v2 tetap usulan untuk legal, bukan kewajiban yang dipastikan engineering.

## 13. Laporan dan ekspor

Sumber telah mencakup booking, pendapatan, online/walk-in, layanan terlaris, no-show/cancel, repeat customer, refund dan booking per kapster. Kasir hari ini/kemarin; konsolidasi/export DT-05 usulan.

Rekomendasi Owner: overview bulan, date range/outlet, tren, tabel layanan/kapster, transaksi/refund/variance, CSV. Kasir operasional outlet dan shift saja.

Definisi wajib:
- Booking created terpisah layanan completed.
- Penerimaan bruto paid_at, refund sukses succeeded_at, neto penerimaan = bruto minus refund periode. Bukan otomatis pengakuan revenue akuntansi.
- Pendapatan layanan completed terpisah penerimaan prepaid lintas bulan.
- Fee PG dan settlement terpisah, menunggu OP-02.
- No-show rate cohort eligible, expired payment bukan no-show.
- Repeat dari kunjungan completed sebelumnya; unique lintas outlet dedupe customer ID.
- Okupansi rencana menit layanan terpesan/menit tersedia; aktual hanya jika event cukup andal.
- Rasio/rata-rata konsolidasi dihitung ulang, bukan dijumlah.

CSV scoped/filter/timezone, export besar async, download terbatas expiry, mitigasi formula injection. Acceptance fixture refund lintas bulan, no-show paid, expired, customer dua outlet, denominator nol benar; nominal aditif konsolidasi cocok; kasir tidak bisa export Owner.

## 14. Notifikasi dan komunikasi

Rekomendasi in-app booking confirmed baru ke kasir outlet; refund request/variance/ketidakhadiran ke Owner. Email internal untuk tindakan penting, retry/dead-letter.

WA manual dengan template detail/perubahan/pembatalan; buka WA bukan bukti terkirim. Customer bisa salin/simpan detail, kalender tambahan kecil setelah inti stabil. Halaman sukses tidak dijamin dilihat bila browser ditutup.

KONFLIK reminder: v2 manual Must have, riwayat pernah menolak. Rekomendasi tanpa scheduler reminder wajib; cukup tombol komunikasi booking. WA Business API/otomatisasi OP-06 ditunda. Polling ringan dulu, SSE bila target update tidak tercapai. Notifikasi persisted/scoped, buka booking mengambil state terbaru.

## 15. Billing dan operasi internal

Pisahkan uang customer-barbershop dari subscription barbershop-Kapster.id: invoice/ledger/reference berbeda. Rekomendasi pilot entitlement/status tersedia, aktivasi manual diaudit; charging otomatis setelah OP-01/02 final. Jangan menganggap kuota PG telah dipilih.

Status target trial/active/past_due/suspended/cancelled. Harga/trial/grace belum diisi. Suspended rekomendasi blok booking baru tetapi penanganan existing/refund/export tetap sesuai hak/policy.

Tool operasi internal minimal untuk health tenant, job/webhook gagal, refund queue, aktivasi. Bukan role ketiga pelanggan RB-01. Tidak memberi support PII global default. Break-glass terbatas waktu/alasan/audit; impersonation customer ditunda.

## 16. Model data dan integritas

Konseptual, bukan migration final:
- Tenant/auth: Organization, Outlet, User, OrganizationMembership, UserOutletAssignment, Session, Invitation.
- Katalog: Service, ServiceOutletPrice, Barber, BarberService, BarberOutletAssignment.
- Jadwal: WorkingSchedule, ScheduleException, TimeOff, SlotReservation.
- Booking: Booking, BookingEvent.
- Keuangan: PaymentAttempt, PaymentEvent, Refund, Transaction, TransactionItem.
- Kas: CashDrawer, CashierShift, CashMovement, CorrectionRequest.
- CRM: Customer, DataDeletionRequest.
- Operasi: AuditLog, Notification, OutboxEvent, Subscription, SubscriptionInvoice.

Business record: opaque ID, organization_id, outlet_id bila lokal, UTC timestamps, actor/version relevan. FK komposit tenant+entity mencegah referensi silang. User/Session global auth terpisah membership; tidak semua tabel outlet_id. Customer/Service scoped organisasi.

Guard, repository scope, DB integrity, job context dan test bersama; middleware saja tidak cukup. RLS opsional setelah pooling/worker context diuji. Indeks booking outlet/time, barber/range, customer tenant/phone, transaction outlet/paid_at, shift drawer/state, outbox state/next_attempt. Explain query sebelum menambah indeks. Soft delete master berhistori, append-only financial/audit melalui API normal. Jangan menambah tabel Discount belum dipakai hanya future-proof.

## 17. Kontrak API dan jobs

REST /v1 + OpenAPI, typed client generated. Contoh endpoint usulan:
- POST /v1/auth/login, /logout, /password-reset.
- POST /v1/organizations, /v1/outlets; GET /v1/onboarding/status.
- /v1/services, /v1/barbers, /v1/schedules, /v1/time-off.
- GET /v1/public/organizations/{orgSlug}/outlets/{outletSlug}/slots.
- POST /v1/public/bookings; GET /v1/public/booking-status dengan token aman/redacted.
- GET /v1/bookings; POST /v1/bookings/{id}/check-in, /start, /complete, /reschedule, /change-barber, /cancel.
- POST /v1/payments/{id}/refund-requests; POST /v1/refunds/{id}/approve.
- POST /v1/webhooks/payments/{provider}.
- POST /v1/shifts/open; POST /v1/shifts/{id}/close, /force-close.
- GET /v1/reports/summary; POST /v1/exports.

Mutasi kritis idempotency key + expected version. Envelope code/message aman/request_id/field_errors. 401 auth, 403 forbidden, 404 sesuai anti-enumeration, 409 conflict, 422 invalid, 429 limit. Server memeriksa tenant/filter, pagination/query cap, RFC3339 waktu, integer IDR.

Jobs expire hold, reconciliation, outbox/email, no-show bila disetujui, export, retensi setelah legal. Scope/dedupe/retry bounded/dead-letter. DB update+publish queue perlu outbox/recovery.

## 18. UI/UX dan perangkat

BASELINE TK-07 UI final belum ditetapkan. Prototype HTML/CSS/JS terisolasi dengan data dummy, review referensi dan visual dahulu. Tidak overwrite aplikasi atau port sebelum approval; link preview harus externally rendered/verified. Prototype bukan fitur production.

Target customer mobile-first, Owner desktop/mobile, kasir desktop/tablet landscape dan layar kecil darurat. Native/offline transaksi ditunda.

Inventaris layar: auth/verify/reset/invite; wizard; Owner overview/outlet/katalog/kapster/jadwal/booking/customer/laporan/refund/variance/users/settings/billing; kasir opening/antrean/walk-in/detail/reschedule/payment/struk/search/closing; public brand/selector/booking/review/status/kebijakan.

Semua layar loading/empty/error/retry/success/permission/stale/conflict. Form label jelas, keyboard/focus dialog, kontras/status bukan hanya warna. Konfirmasi destructive menyebut booking/outlet terdampak. Network putus tidak auto-sync transaksi offline atau menampilkan sukses palsu; retry idempotent.

## 19. Keamanan dan observability

Baseline HTTPS, hashing, server validation, least privilege, audit, secrets di luar repo, backup/restore. Rekomendasi CORS allowlist/CSRF/CSP, rate limit login/OTP/public booking/search/token; signed upload/download tenant scoped; image type/size allowlist, decode-reencode/strip metadata, random object key; SVG tanpa sanitasi ditolak.

Redact password/token/full phone/signature/payload sensitif. Dependency/secret scan dan lockfile. Log correlation ID; metric latency/error/DB pool/worker lag/expiry lag/webhook failures/reconciliation backlog. Alert operator dengan runbook tanpa PII. Audit export/refund/koreksi/role/merchant. Tidak session-replay form PII/payment default.

## 20. CI/CD, backup, deployment

Dev dummy, staging sandbox, production terpisah DB/storage/secret/provider/webhook. Tidak pakai DB production untuk staging. Docker/reverse proxy HTTPS, DB private, SSH terbatas, readiness API/worker terpisah. Sizing VPS mengikuti load/budget, free-tier bukan jaminan produksi.

CI lint → typecheck → unit → integration DB nyata → migration smoke → build → E2E staging → review → approval produksi. FE/BE beda repo tetap matriks kompatibilitas API.

Migration expand/contract; destruktif review khusus; rollback aplikasi bukan rollback data, perlu kompatibilitas/roll-forward. Backup encrypted off-host. Usulan pilot RPO 24 jam/RTO 4 jam harus diuji, bukan SLA. Bila transaksi berbayar tidak toleran kehilangan sehari, WAL/PITR dan RPO lebih ketat wajib disepakati sebelum launch.

Restore drill isolated: constraint/migration/tenant/control totals finansial/aset/login dummy, catat waktu nyata. Replay webhook idempotent dan deletion request supaya PII tidak muncul kembali. Runbook DB/provider down, backlog/refund timeout/token bocor/shift macet/rollback/restore. Maintenance dapat stop booking baru tanpa menghapus akses existing/refund.

## 21. Test plan dan acceptance

Ini kriteria yang harus diuji nanti, bukan hasil sudah lulus.

| ID | Skenario | Hasil lulus |
|---|---|---|
| AC-01 | Tenant/outlet tampering API/export/job/file | Tidak bocor/berubah lintas hak |
| AC-02 | Onboarding merchant belum siap | Tidak menerima payment |
| AC-03 | Slot sama/start berbeda/buffer overlap | Satu reservasi sah |
| AC-04 | Online lawan walk-in bersamaan | Tidak double-book |
| AC-05 | Reschedule gagal | Slot lama utuh |
| AC-06 | Worker expiry mati | Cleanup/recovery availability |
| AC-07 | Webhook palsu/mismatch | Tidak paid |
| AC-08 | Duplicate/out-of-order | Tidak transaksi ganda |
| AC-09 | Late paid slot diambil | Tidak auto-confirm, reconciliation |
| AC-10 | Timeout intent/refund | Tidak uang/refund ganda |
| AC-11 | Check-in vs no-show, koreksi slot terisi | Transisi sah, tanpa overlap |
| AC-12 | Opening paralel/closing retry | Shift/mutasi tidak ganda |
| AC-13 | Cash vs online/refund | Kas fisik sesuai arus tunai |
| AC-14 | Session revoke saat shift aktif | Akses dicabut, shift bertahan |
| AC-15 | Laporan refund lintas bulan/konsolidasi | Definisi/rasio benar |
| AC-16 | Status token ditebak/expired | Tidak terbuka |
| AC-17 | CSV formula/upload invalid | Ditolak/disanitasi |
| AC-18 | Browser tutup setelah bayar | Webhook tetap otoritas |
| AC-19 | Jadwal/master nonaktif | Tidak booking invalid |
| AC-20 | Mobile/keyboard/offline | Usable, tidak sukses palsu |
| AC-21 | Restore/replay/migration | Integritas/dedupe/kompatibilitas |

Unit slot/timezone/state/snapshot/kas/metrik. Integration PostgreSQL nyata, bukan SQLite pengganti constraint. Contract OpenAPI/provider sandbox. E2E Playwright booking sampai kasir, walk-in, reschedule/refund/closing. Security tenant/enumeration/CSRF/escalation. Load slot/booking burst/report/worker lag.

Usulan target belum teruji: p95 slot <800 ms, p95 antrean <1,5 detik, confirmed terlihat <5 detik, laporan pilot <5 detik. Dataset/concurrency/host/network wajib ditentukan pada benchmark.

## 22. Tahapan implementasi dan Definition of Done

A — Review scope/konflik, state/RBAC/ERD/OpenAPI/ADR, referensi → prototype → approval.
B — Repo/CI/staging/migration/auth/tenant/outlet/audit, master/jadwal, seed dummy; gate isolasi/onboarding/migration.
C — Vertical slice public slot → hold → sandbox → webhook → kasir → selesai; gate concurrency/late payment/timeout.
D — Walk-in/shift/reschedule/refund/CRM/laporan/notifikasi/export; gate angka finansial terlacak dan E2E.
E — Hardening/security/performance/restore/runbook/pilot terbatas. Pilot menerima uang nyata memerlukan payment production meski subscription gratis. Legal/privacy/merchant/support siap sebelum data nyata.

Tidak memberi tanggal tanpa kapasitas tim dan spike integrasi. DoD: acceptance lulus dengan bukti, semua UI states, RBAC/audit, migration/recovery, review, staging verification, tidak secret/PII dalam fixture. Halaman selesai bukan modul selesai; deployment keputusan terpisah.

## 23. Ledger rekomendasi dan dependensi keputusan

Bukan kuesioner baru. Detail engineering rutin dapat direview sebagai satu paket.

| ID | Sumber | Rekomendasi/status |
|---|---|---|
| REV-01 | PB-05, MO | Multi-outlet sederhana, katalog/customer organisasi; usulan |
| REV-02 | MO-02/03 | Satu assignment kapster rilis awal; berbeda usulan v2 |
| REV-03 | RB-02/03/07/08 | Tiga Owner, kasir scoped dan ketidakhadiran lokal; usulan |
| REV-04 | TK-04, OP-10 | Tetap dua frontend baseline |
| REV-05 | BK-05/06 | Config buffer/cutoff 60 menit; usulan |
| REV-06 | BK-09 | Constraint rentang/atomic reservation; koreksi engineering |
| REV-07 | BK-10 | in_service, reschedule event/refund terpisah; pembalikan/review |
| REV-08 | BK-13 | No-show otomatis + koreksi diaudit; konflik historis |
| REV-09 | PY-01/05 | Public prepaid/walk-in offline; dana no-show perlu keputusan terpisah |
| REV-10 | PY-02/03, OP-03/05 | Late paid tidak auto-confirm; provider dependency |
| REV-11 | KS-02/06, OP-12 | Satu laci/shift, expiry session aman; clarification |
| REV-12 | DT-04/07 | Deletion terverifikasi, retensi legal; konflik/dependency |
| REV-13 | DT-05 | Definisi penerimaan vs layanan/konsolidasi; usulan |
| REV-14 | §11.14, OP-06 | WA manual tanpa scheduler wajib; konflik reminder |
| REV-15 | §10.5 | Owner menerima kas memakai shift; usulan tambahan |
| REV-16 | PB-06/08/09, OP-01/02/03/05 | Billing pilot manual, merchant/fee tidak diasumsikan |

Dependensi bisnis tetap terpisah:
- OP-01 harga/trial/grace: entitlement disiapkan, angka tidak dikarang.
- OP-02 penanggung fee/kuota/refund memengaruhi checkout/ledger/report/invoice.
- OP-03 merchant/rekening/sumber refund; direct settlement direkomendasikan melalui provider sesuai, perlu validasi hukum/teknis.
- OP-05 legalitas/kemitraan/metode/biaya/sandbox/signature/refund/settlement/SLA belum terverifikasi.
- OP-04 dan DT-04/07 notice/hak customer/retensi/penghapusan.
- OP-07/08 pilot/support sebelum data nyata; OP-09 kompetitor bukan blocker foundation; OP-11 rating belum masuk scope target.

## 24. Batas hasil dan tindak lanjut

Dokumen rekomendasi mencakup scope, alur, akses, data, integrasi, UI, testing dan operasi. Tidak mengubah PRD utama atau mengunci usulan v2. Tidak ada klaim implementasi, due diligence, payment, migration atau deployment selesai.

Setelah review, turunkan ke SRS final per modul, ERD/migration, OpenAPI, ADR, prototype approved, backlog dan bukti test. Rekomendasi bukan pengganti keputusan produk dan masih harus dibuktikan pada stack/provider nyata.
