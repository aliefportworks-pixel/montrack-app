# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Montrack App

**STATUS: DRAFT SEMENTARA**

| | |
| --- | --- |
| **Nama Produk** | Montrack App |
| **Versi Dokumen** | v0.1 (Detailed PRD) |
| **Disusun oleh** | Tim Pengembang AI |
| **Untuk** | Pemilik Produk / Klien |
| **Tanggal** | 23 September 2026 |
| **Tech Stack Terkunci** | Single HTML5 + Vue.js 3 CDN + Tailwind CSS CDN + Google Apps Script REST API + Google Sheets |

---

# 1. Problem Statements

Kondisi manajemen keuangan pribadi saat ini di Indonesia telah bergeser secara drastis ke arah ekosistem digital yang terfragmentasi. Pengguna rata-rata memiliki lebih dari tiga sumber dana aktif, mulai dari rekening bank konvensional hingga berbagai platform *e-wallet* seperti GoPay, OVO, dan Dana. Status quo menunjukkan bahwa meskipun transaksi menjadi lebih mudah secara digital, transparansi pengeluaran justru menurun karena data tersebar di berbagai aplikasi dengan antarmuka yang berbeda-beda. Pencatatan manual masih menjadi andalan bagi mereka yang ingin disiplin, namun prosesnya seringkali melelahkan, tidak terstruktur, dan dilakukan pada media yang tidak mendukung analisis data secara instan.

Dampak negatif dari masalah fragmentasi ini adalah hilangnya kendali finansial atau yang sering disebut sebagai "kebocoran halus". Tanpa visibilitas yang terpusat, pengguna seringkali terkejut melihat saldo akhir bulan yang menipis tanpa mengetahui kategori pengeluaran mana yang paling boros. Ketidakkonsistenan dalam mencatat menyebabkan data yang terkumpul menjadi tidak valid untuk dijadikan dasar pengambilan keputusan, seperti saat ingin menabung untuk tujuan jangka panjang atau melakukan investasi. Secara psikologis, ketidakpastian kondisi keuangan ini menimbulkan kecemasan finansial yang berkelanjutan bagi masyarakat produktif.

Montrack App hadir sebagai solusi jembatan yang menawarkan sentralisasi pencatatan keuangan dengan pendekatan yang sangat sederhana namun terstruktur. Aplikasi ini dirancang untuk memusatkan seluruh arus kas masuk dan keluar ke dalam satu dasbor visual yang mudah diakses melalui perangkat seluler. Dengan mengeliminasi kompleksitas fitur yang sering ditemukan pada aplikasi perbankan, Montrack berfokus pada kecepatan input dan kejelasan visualisasi data. Pengguna dapat dengan cepat mengategorikan transaksi dan melihat status anggaran mereka secara *real-time*, sehingga fungsi kontrol keuangan kembali ke tangan pengguna sepenuhnya.

Nilai tambah utama Montrack terletak pada transparansi dan kedaulatan data melalui penggunaan Google Sheets sebagai *database* utama. Berbeda dengan aplikasi keuangan komersial yang mengunci data pengguna di server tertutup, Montrack memberikan fleksibilitas bagi pengguna untuk memiliki data mereka sendiri dalam format spreadsheet yang familiar. Diferensiasi ini, dikombinasikan dengan arsitektur teknologi yang ringan (Single HTML5), memastikan aplikasi dapat berjalan dengan sangat cepat di berbagai spesifikasi smartphone tanpa beban *loading* yang berat, menjadikannya alat pemantau keuangan yang paling efisien di kelasnya.

# 2. Goals & Success Metrics

| Goal Statement | Measurable Metric (dengan angka spesifik) | Target Timeframe |
| --- | --- | --- |
| Meningkatkan efisiensi waktu input transaksi harian pengguna. | Rata-rata waktu penyelesaian input transaksi di bawah 10 detik. | 1 Bulan setelah rilis |
| Mendorong konsistensi pencatatan keuangan pengguna. | 70% pengguna aktif melakukan minimal 1 input data setiap hari selama 30 hari pertama. | 3 Bulan setelah rilis |
| Memberikan visibilitas kondisi keuangan yang akurat. | Tingkat akurasi saldo di aplikasi vs saldo asli pengguna mencapai 95% melalui rekonsiliasi mandiri. | 2 Bulan setelah rilis |
| Mengoptimalkan performa aplikasi pada perangkat mobile. | Skor Google PageSpeed Insights untuk performa mobile minimal 90/100. | Peluncuran MVP |
| Mengurangi pengeluaran impulsif pengguna melalui monitoring budget. | 40% pengguna melaporkan penurunan pengeluaran pada kategori non-esensial sebesar 10% setelah 3 bulan. | 6 Bulan setelah rilis |

# 3. Target Users

| Role Name | Description | Primary Needs | Pain Points | Most Used Features |
| --- | --- | --- | --- | --- |
| Pengguna Utama (The Tracker) | Individu produktif (20-40 tahun) yang memiliki mobilitas tinggi dan menggunakan berbagai metode pembayaran digital. | Pencatatan cepat, ringkasan pengeluaran bulanan, dan pengelompokan kategori transaksi. | Lupa mencatat transaksi kecil, bingung melihat total saldo dari berbagai akun, dan malas membuka aplikasi yang berat. | Form Input Transaksi, Dashboard Visual, Riwayat Transaksi. |

# 4. User Stories

| ID | User Story | Acceptance Criteria | Priority |
| --- | --- | --- | --- |
| US-01 | Sebagai Pengguna, saya ingin masuk ke aplikasi menggunakan email dan password, sehingga data saya tidak bercampur dengan orang lain dan tidak bisa dibuka pihak lain. | 1. Sistem memvalidasi email + password. 2. Sesi berupa token (30 hari). 3. Data dimuat sesuai ID pengguna. | MVP |
| US-02 | Sebagai Pengguna, saya ingin mencatat pengeluaran baru dengan cepat, sehingga saya tidak lupa detail transaksi. | 1. Input jumlah, kategori, dan catatan. 2. Notifikasi sukses muncul setelah simpan. | MVP |
| US-03 | Sebagai Pengguna, saya ingin mencatat pemasukan, sehingga saya tahu total aliran dana masuk. | 1. Pilihan tipe transaksi 'Pemasukan'. 2. Saldo otomatis bertambah di dashboard. | MVP |
| US-04 | Sebagai Pengguna, saya ingin melihat ringkasan saldo total, sehingga saya tahu kondisi keuangan saat ini. | 1. Menampilkan total saldo (Pemasukan - Pengeluaran). 2. Update otomatis setiap ada transaksi baru. | MVP |
| US-05 | Sebagai Pengguna, saya ingin melihat grafik pengeluaran per kategori, sehingga saya tahu kemana uang paling banyak keluar. | 1. Grafik pie/bar yang jelas. 2. Data sinkron dengan tabel transaksi. | MVP |
| US-06 | Sebagai Pengguna, saya ingin melihat daftar riwayat transaksi, sehingga saya bisa meninjau aktivitas masa lalu. | 1. Daftar urut berdasarkan tanggal terbaru. 2. Menampilkan ikon kategori dan nominal. | MVP |
| US-07 | Sebagai Pengguna, saya ingin menghapus transaksi yang salah input, sehingga data tetap akurat. | 1. Opsi hapus pada setiap item transaksi. 2. Konfirmasi sebelum penghapusan permanen. | MVP |
| US-08 | Sebagai Pengguna, saya ingin menerima notifikasi gagal jika koneksi internet terputus saat menyimpan data. | 1. Pesan error yang jelas saat API gagal. 2. Data tidak hilang dari form saat gagal kirim. | MVP |
| US-09 | Sebagai Pengguna, saya ingin mencari transaksi berdasarkan nama/catatan, sehingga saya bisa menemukan data spesifik dengan cepat. | 1. Kolom pencarian berfungsi secara real-time. 2. Hasil pencarian akurat sesuai kata kunci. | MVP |
| US-10 | Sebagai Pengguna, saya ingin memilih tanggal transaksi secara manual, sehingga saya bisa mencatat transaksi yang terjadi kemarin. | 1. Komponen date picker yang mudah digunakan. 2. Default tanggal adalah hari ini. | MVP |
| US-11 | Sebagai Pengguna, saya ingin mengedit kategori transaksi, sehingga saya bisa menyesuaikan klasifikasi keuangan saya. | 1. Fitur tambah/ubah nama kategori. 2. Perubahan tercermin di semua transaksi terkait. | Later |

# 5. User Flow

### 5.1 Happy Path: Mencatat Pengeluaran Harian
1. **Action Name**: Membuka Aplikasi.
   - **Description**: Pengguna membuka URL aplikasi di browser smartphone.
   - **Output**: Dashboard utama menampilkan saldo dan ringkasan.
2. **Action Name**: Klik Tombol "Tambah Transaksi".
   - **Description**: Pengguna menekan tombol (+) di navigasi bawah.
   - **Output**: Form input transaksi muncul.
3. **Action Name**: Mengisi Detail Transaksi.
   - **Description**: Pengguna memasukkan nominal (misal: 50.000), memilih kategori "Makanan", dan mengisi catatan "Makan Siang".
   - **Output**: Data tervalidasi di sisi klien.
4. **Action Name**: Klik "Simpan".
   - **Description**: Menekan tombol simpan untuk mengirim data ke Google Sheets via GAS.
   - **Decision Point**: Jika koneksi OK, lanjut ke sukses. Jika gagal, tampilkan pesan error.
5. **Action Name**: Menerima Feedback & Update.
   - **Description**: Muncul notifikasi "Transaksi Berhasil Disimpan".
   - **Output**: Halaman kembali ke Dashboard, saldo berkurang, dan riwayat bertambah.

### 5.2 Alur Alternatif: Penanganan Kegagalan API
1. **Action Name**: Klik "Simpan" saat Offline.
   - **Description**: Pengguna mencoba menyimpan data tanpa koneksi internet.
2. **Decision Point**: Sistem mendeteksi kegagalan respon dari Google Apps Script.
3. **Action Name**: Tampilkan Notifikasi Gagal.
   - **Description**: Muncul toast/alert "Gagal menyimpan data. Periksa koneksi Anda."
4. **Action Name**: Retensi Data Form.
   - **Description**: Sistem tidak membersihkan form agar pengguna bisa mencoba lagi saat sinyal stabil.

# 6. Functional Requirements

| Feature ID | Feature Name | Detailed Description | Inputs | Outputs | Validation Rules | Data Structure (Google Sheets) |
| --- | --- | --- | --- | --- | --- | --- |
| FR-01 | Login (Email + Password) | Masuk ke aplikasi memakai email + password; server menerbitkan session token 30 hari. | Email, Password | Akses ke Dashboard + token sesi | Email valid; password wajib; kredensial salah → 'Email atau password salah.'. | Sheet: 'Users' (ID, Email, Name, PasswordHash, Token, TokenExpiresAt) |
| FR-07 | Registrasi | Halaman Daftar (#/daftar): buat akun email + password; email lama tanpa password didaftarkan ulang dengan ID & data lama dipakai ulang. | Email, Password (min 8, konfirmasi) | Baris baru di Users + auto-login | Email belum terdaftar; password ≥ 8 karakter; duplikat → 'Email sudah terdaftar.'. | Sheet: 'Users' (kolom sama dgn FR-01) |
| FR-08 | Ganti Password | Form di Pengaturan: password lama → password baru. | Password lama, password baru (×2) | PasswordHash diganti | Password lama benar; password baru ≥ 8 karakter. | Sheet: 'Users' (PasswordHash) |
| FR-02 | Input Transaksi | Modul untuk memasukkan data arus kas. | Nominal, Tipe (In/Out), Kategori, Tanggal, Catatan | Baris data baru di Sheets | Nominal > 0, Kategori wajib dipilih. | Sheet: 'Transactions' (ID, Date, Type, Category, Amount, Note) |
| FR-03 | Dashboard Visual | Ringkasan kondisi keuangan dalam bentuk angka dan grafik. | Data dari Sheets | Total Saldo, Grafik Pie Kategori | Kalkulasi otomatis (Sum In - Sum Out). | N/A (Computed Data) |
| FR-04 | Riwayat Data | Tabel list transaksi yang pernah diinput. | Filter/Search Query | List item transaksi | Menampilkan 20 data terbaru (pagination). | Sheet: 'Transactions' |
| FR-05 | Notifikasi UI | Feedback visual atas aksi pengguna. | Trigger Sukses/Gagal | Toast/Alert Message | Muncul selama 3 detik. | N/A |
| FR-06 | Manajemen Kategori | Pengaturan daftar kategori transaksi. | Nama Kategori, Ikon | Daftar pilihan di dropdown | Nama kategori unik (tidak duplikat). | Sheet: 'Categories' (ID, Name, Icon) |

# 7. Non-Functional Requirements

*   **UX/Design:**
    *   Desain wajib *Mobile-First* menggunakan Tailwind CSS.
    *   Ukuran tombol minimal 44x44 pixel untuk memudahkan ketukan jari.
    *   Skema warna kontras tinggi untuk penggunaan di bawah sinar matahari.
    *   Loading state (spinner) wajib muncul saat aplikasi berkomunikasi dengan API.
    *   Transisi antar halaman harus halus (minimal 300ms fade/slide).
    *   Tipografi menggunakan font sans-serif yang bersih (misal: Inter atau Roboto).
*   **Performance:**
    *   Waktu muat awal (First Contentful Paint) harus di bawah 2 detik.
    *   Ukuran total aset (HTML/JS/CSS) tidak boleh melebihi 500KB (Gzipped).
    *   Respon API Google Apps Script harus ditangani secara asinkron agar tidak memblokir UI.
*   **Security:**
    *   Akses ke Google Apps Script wajib menggunakan API Key atau validasi token sederhana.
    *   Password disimpan sebagai hash (SHA-256 + salt) — tidak pernah plaintext, dan tidak pernah dikirim lewat query string URL.
    *   LocalStorage hanya berisi profil + token sesi (bukan password); token kedaluwarsa 30 hari dan dapat dicabut via logout.
    *   Validasi input di sisi server (GAS) untuk mencegah *script injection* ke Google Sheets.
*   **Compatibility:**
    *   Mendukung browser mobile modern (Chrome Mobile, Safari iOS, Samsung Internet).
    *   Responsif terhadap berbagai rasio layar smartphone (16:9 hingga 21:9).
*   **Technical Constraints:**
    *   Keterbatasan limit kuota harian Google Apps Script (50.000 eksekusi/hari).
    *   Google Sheets terbatas pada 10 juta sel (sangat cukup untuk penggunaan personal).
    *   Tidak ada database relasional (semua relasi data ditangani secara manual di level logika Vue.js).

# 8. Scope

## 8.1 In Scope (MVP)

| Feature | Description | Reason for Priority |
| --- | --- | --- |
| Pencatatan Transaksi | Input pemasukan dan pengeluaran dasar. | Fungsi inti aplikasi. |
| Dashboard Saldo | Tampilan total uang yang dimiliki. | Kebutuhan informasi utama pengguna. |
| Riwayat Transaksi | Daftar aktivitas keuangan masa lalu. | Untuk audit dan pengecekan ulang data. |
| Integrasi Google Sheets | Penyimpanan data ke spreadsheet pribadi. | Keamanan dan kepemilikan data pengguna. |
| Notifikasi Sistem | Alert sukses/gagal simpan. | Memberikan kepastian status aksi pengguna. |

## 8.2 Out of Scope (Phase 2)

| Feature | Description | Reason for Delay |
| --- | --- | --- |
| Integrasi Bank Otomatis | Sinkronisasi saldo bank secara otomatis via API. | Kompleksitas keamanan dan legalitas tinggi. |
| Panel CMS Admin | Dashboard khusus untuk konfigurasi sistem global. | Belum diperlukan untuk penggunaan personal. |
| Multi-Currency | Dukungan untuk berbagai mata uang asing. | Fokus saat ini hanya pada mata uang domestik (IDR). |
| Ekspor PDF/Excel | Fitur untuk mengunduh laporan bulanan formal. | Pengguna bisa langsung akses via Google Sheets. |
| Budgeting Alert | Notifikasi jika pengeluaran melebihi batas budget. | Memerlukan logika penjadwalan yang lebih rumit. |