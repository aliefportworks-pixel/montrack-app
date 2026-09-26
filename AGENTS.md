# AGENTS.md — Universal Project Rules

## Overview
Dokumen ini berisi instruksi dan workflow wajib untuk AI agent. Setiap agent wajib mematuhi aturan ini secara ketat tanpa pengecualian.

## 0. Status Repo & Verifikasi
- Repo berisi dokumen (`prd.md`, `design.md`), FE di `frontend/`, dan backend Google Apps Script di `backend/` (scriptId + deployment Dev/Prod sudah terpasang). `.github` & Firebase Hosting menyusul.
- **Sumber kebenaran**: `prd.md` = scope/user story/requirement; `design.md` = token desain (catatan: file itu dibungkus fence ` ```markdown ` — jangan tempel fence ke kode).
- **Preview FE wajib via HTTP** (`npx -y serve frontend` / `firebase serve`); membuka `index.html` via `file://` memblokir fetch mock → aplikasi tampak kosong.
- **Verifikasi wajib — semua harus PASS**:
  1. `node test-mock-api.js` → `ALL_API_TESTS_PASS` (kontrak mock FE)
  2. `node test-be.js` → `ALL_BE_TESTS_PASS` (kontrak routes.gs dgn stub Google API)
  3. `node test-fe-live-url.js` → `LIVE_URL_TESTS_PASS` (translation URL live di api.js)
  4. `node test-live.js` → `ALL_LIVE_TESTS_PASS` (e2e ke backend Dev; butuh internet; data uji dibersihkan otomatis)
- Belum ada lint/typecheck/test runner — buka FE via HTTP lalu cek route `#/`, `#/transaksi`, `#/riwayat`, `#/analitik`, `#/pengaturan` (tanpa sesi login yang tampil adalah view login; itu normal).

## 1. Tech Stack
- **Frontend**: Single HTML5 + Vue 3 CDN + Tailwind CSS CDN
- **Backend**: Google Apps Script (CLASP)
- **Database**: Google Sheets
- **FE Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions
- **DILARANG KERAS**: Menggunakan React, Angular, Node.js, Python, Vite, Webpack, atau Single File Components (.vue).
- Catatan: Node.js HANYA untuk skrip verifikasi lokal `test-*.js` di root — bukan bagian stack aplikasi.

## 2. Frontend Rules

### 2.1 Single Page Application (SPA)
- Project ini ADALAH SPA (Single Page Application).
- Hanya menggunakan **SATU** file `index.html` sebagai entry point.
- Dilarang membuat multiple HTML pages.
- Routing harus menggunakan **hash router** murni (`#/path`).
- Semua halaman dan view di-load secara dinamis oleh Vue tanpa me-reload `index.html`.

### 2.2 Component Structure
- Komponen Vue HARUS ditulis sebagai **Plain JavaScript Objects** (`.js` files).
- JANGAN PERNAH membuat file `.vue`.
- Gunakan `template: \`...\` ` literal string untuk merender HTML di dalam komponen.
- Daftarkan komponen secara global ke instance Vue utama.

### 2.3 API Service Layer
- Gunakan **Native `fetch()` API** untuk semua komunikasi dengan backend.
- Dilarang menggunakan Axios, jQuery, atau library HTTP pihak ketiga.
- Parse respons JSON selalu dilakukan dengan `.json()`.
- Wajib menghandle error dengan blok `try/catch` yang membungkus `fetch`.
- Live branch (`USE_MOCK=false`) memanggil GAS via `?action=...&key=...`: body JSON dikirim **tanpa** header `Content-Type` (request sederhana → tanpa preflight CORS), `DELETE` dikirim sebagai POST `delete_transaction`, create memakai `action=create_transaction`, dan field data (`email` / `userId,type,category,date,amount,note,token`) **ikut disertakan di query** (lihat §3.3 — tahan terhadap redirect GAS), **kecuali password** (lihat §2.5 — hanya body, tidak pernah query), respons non-JSON atau `payload.success===false` → anggap gagal.
- `API_BASE` (URL deployment Dev) & `API_KEY` live ada di `frontend/js/services/api.js` — sumber tunggal yang dibaca `test-live.js`.

### 2.4 Mockup Data System
- Frontend HARUS dapat berjalan secara independen dari Backend menggunakan Mock Data.
- Sediakan flag `USE_MOCK: true` di service API (saat ini default tetap `true`; ganti ke `false` hanya untuk testing live).
- Jika `USE_MOCK` aktif, aplikasi merender data dari file mock statis lokal (`./mock/data.js`).
- Format response Mock Data harus 100% mereplika format response dari Backend.
- **Mock dipersist ke `localStorage['montrack_mock_v2']`** (users + categories + transactions) agar akun hasil daftar dan data bertahan saat reload — tanpa persistensi, user mock tidak bisa login ulang. Guard `typeof localStorage === 'undefined'` (test Node tetap pakai seed segar). Ganti versi key bila struktur mock berubah.

### 2.5 Aturan Auth (Wajib — Email + Password)
Aturan masuk aplikasi; mock FE, BE GAS, dan keempat test kontrak WAJIB sinkron 1:1.

**Alur masuk & daftar**
- Rute publik hanya `#/login` (email + password) dan `#/daftar` (register); rute lain memaksa `#/login` (lihat `store.js` `isPublicPath`). Rute `#/daftar` disembunyikan dari bottom nav.
- **Tidak ada auto-register lagi**: login ke email yang tidak terdaftar → `Email atau password salah.` (pesan sama untuk password salah — tidak bocor info akun).
- User lama (baris `Users` pra-password, mis. dari auto-register sebelumnya) saat login → `Akun ini belum diatur password. Silakan daftar ulang.`; daftar ulang memakai email sama → **ID & seluruh data transaksi lama terpakai kembali**.
- Register (`Api.register`) idempoten: bila BE membalas `Email sudah terdaftar.` → fallback `Api.login(email, password)` — men-cover pola GAS "eksekusi dahulu, respons 404/HTML belakangan".
- Session: login/register menghasilkan `{id, email, name, token}`; token disimpan di `localStorage['montrack_session']` bersama profil (**password tidak pernah disimpan di FE**).

**Kontrak endpoint (query ∖ body)**
| Action | Field di query | Field di body |
| --- | --- | --- |
| `auth` (login) | `email` | `email`, `password` |
| `register` | `email` | `email`, `password` |
| `logout` | `userId`, `token` | `userId`, `token` |
| `change_password` | `userId`, `token` | `userId`, `token`, `oldPassword`, `newPassword` |
| `transactions` / `create_transaction` / `delete_transaction` | `userId`, `token` (+ `id`) | payload + `token` |

**Aturan password (KEWAJIBAN, jangan dilanggar)**
- Password / oldPassword / newPassword **HANYA dikirim di body JSON — TIDAK PERNAH di query string** (URL bocor ke riwayat/log eksekusi GAS).
- Karena password tidak ikut query, bila redirect GAS membuang body BE membalas `Password wajib diisi.` → `frontend/js/services/api.js` **auto-retry 1×** untuk action `auth|register|change_password` saat gagal dengan: `Password wajib diisi.`, respons non-JSON (SyntaxError), atau network error (TypeError). Jangan hapus logika retry ini.
- BE **hanya membaca password dari `body`**, mengabaikan `params.password` (lihat `handleAuth_`/`handleRegister_`/`handleChangePassword_`).

**Token sesi**
- Token acak 32 hex, TTL **30 hari** (`TOKEN_TTL_MS_` di `backend/src/utils/auth.gs`), disimpan di kolom `Token` + `TokenExpiresAt` (epoch millis number — jangan simpan sebagai tanggal, Sheets bisa mengubahnya jadi Date serial).
- Semua endpoint data (list/create/delete transaksi) wajib lolos `requireSession_(userId, token)` → gagal = `Sesi pengguna tidak valid.`
- FE: saat BE membalas `Sesi pengguna tidak valid.` → `handleSessionError()` di `store.js` memaksa logout + toast (token kedaluwarsa/cabut).
- Logout memanggil `action=logout` (mencabut token di server), lalu bersihkan `localStorage`.

**Password hashing (server)**
- Format `PasswordHash` = `<salt>$<sha256hex(salt+password)>` via `Utilities.computeDigest` (salt uuid baru tiap ganti password). Jangan simpan plaintext, jangan kirim hash ke FE.
- Pesan error kontrak FE=BE (daftar tertutup, ubah = ubah di `routes.gs`, mock `api.js`, dan keempat test sekaligus): `Format email tidak valid.`, `Password wajib diisi.`, `Password minimal 8 karakter.`, `Email atau password salah.`, `Akun ini belum diatur password. Silakan daftar ulang.`, `Email sudah terdaftar.`, `Password lama salah.`, `Sesi pengguna tidak valid.`
- FE-only: `Email wajib diisi.`, `Password tidak cocok.` (validasi form), toast `Password berhasil diubah.`

**Skema sheet Users**
- `ID | Email | Name | PasswordHash | Token | TokenExpiresAt` — kolom lama (3 kolom) ditambahkan otomatis oleh `ensureUsersSchema_()` (idempoten, jalan tiap request).

**Seed mock**: user `ayu@montrack.id` / password `montrack123` (hanya di `frontend/mock/data.js`; README & smoke manual memakai kredensial ini).

## 3. Backend Rules (Google Apps Script via CLASP)

### 3.1 Clasp Setup & Init
- **clasp v3.4.1** — perintah v2 lama (`clasp init`, `clasp deploy` tanpa argumen, `clasp open`) TIDAK ADA. Semua perintah clasp dijalankan dari direktori `backend/` (lokasi `.clasp.json`).
- Inisialisasi (sudah dilakukan): `clasp create-script --type webapp --title "Montrack Backend"` lalu `clasp push --force`.
- Struktur backend: `src/Code.gs` (dispatcher `doGet`/`doPost`, guard API key, lazy init DB + `ensureUsersSchema_`), `src/routes.gs` (handler endpoint), `src/utils/validation.gs`, `src/utils/sheets.gs`, `src/utils/auth.gs` (hash password, token, `requireSession_`), `appsscript.json`, `.clasp.json`.
- `appsscript.json` wajib memuat: `oauthScopes` (spreadsheets, drive) dan `webapp: { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" }` (field resmi manifest, huruf kecil — `clasp create-deployment` menerapkannya sebagai entryPoints deployment).
- Dilarang push/deploy dari Editor UI web — semua via CLI.

### 3.2 Deployment Management (Dev + Prod)
- **Prinsip**: Satu scriptId, dua deployment tetap — JANGAN membuat deployment baru berulang.
- ID terpasang:
  - scriptId: `1wjgwGJkHOMdSUbznkSTkW8mgdYUft96ZyN3lmTCBfB915UIwPkfKShd4`
  - DEV: `AKfycbw-TVXZP85v1QW--6vZ6Gk_8K1iNbhANWEeB69Z1mPqkoUdAzHQsadtC_KtTq3taqxc` — `https://script.google.com/macros/s/AKfycbw-TVXZP85v1QW--6vZ6Gk_8K1iNbhANWEeB69Z1mPqkoUdAzHQsadtC_KtTq3taqxc/exec` (sumber `API_BASE` FE)
  - PROD: `AKfycbypv4i-9f110wKAnDR1aG6e4oP1VWlvbjrbv-PFV1Rdf6xfM0ogXQH8TmE8Ljd-8ee4`
  - Lihat ulang: `clasp list-deployments` dan `clasp list-versions`.
- **Alur update (terverifikasi, urut)**:
  1. Edit kode backend.
  2. `clasp push --force`
  3. `clasp create-version "Update <tanggal>"` → catat nomor version (`-V`).
  4. Update Dev: `clasp update-deployment {DEV_ID} -V {ver} -d "Update Dev"`
  5. Verifikasi: `node test-be.js` + `node test-live.js` (menyasar URL Dev) + smoke FE.
  6. Jika OK, Prod pakai version yang SAMA (artefak yang sudah dites): `clasp update-deployment {PROD_ID} -V {ver} -d "Release Prod"`
- Pin saat ini: Dev = version 5, Prod = version 5 (2026-09-26 — auth email+password + session token).

### 3.3 Batasan GAS (terverifikasi — jangan dilawan, sudah diakomodasi)
- Hanya metode **GET & POST** (DELETE/OPTIONS → 405; `doOptions` tidak ada).
- `pathInfo` (`/exec/auth`) butuh login Google → routing **wajib** via query `?action=auth|register|logout|change_password|categories|transactions|create_transaction|delete_transaction`.
- **Password tidak pernah ikut query** (lihat §2.5): `email`/`userId`/`token`/field transaksi tetap di query demi ketahanan redirect, tetapi `password`/`oldPassword`/`newPassword` hanya body — BE membaca password dari body saja dan membalas `Password wajib diisi.` bila body hilang (klien mengulang request).
- **Redirect 302 GAS tidak selalu ramah**: follow dari `script.google.com` ke `script.googleusercontent.com` kadang menurunkan POST→GET dan **membuang body** (respons aneh seperti `Endpoint tidak dikenal: GET auth` / `Sesi pengguna tidak valid.` padahal request valid) dan/atau membalas 404 HTML **setelah** eksekusi. Akomodasi wajib: (a) klien mengirim field data juga di query, (b) BE menerima `auth`/`create_transaction`/`delete_transaction` di GET maupun POST + merge query+body (body menang), (c) test live merekonsiliasi keadaan akhir sheet (create diberi note unik per run, delete diverifikasi via list) — bukan hanya membaca respons.
- CORS anonymous: preflight pasti gagal → klien wajib **request sederhana**: tanpa header `Content-Type`/`x-api-key`, API key dikirim via `?key=`, body JSON sebagai string (fetch default `text/plain`).
- Respons GAS selalu **HTTP 200** → sukses/gagal ditentukan field `payload.success` (`false` + `message` = gagal); respons HTML (mis. 403) → anggap gagal.
- `clasp run-function` **TIDAK BERFUNGSI** di lingkungan ini (`server error ... reading from storage. NOT_FOUND` — eksekusi via Apps Script API butuh proyek OAuth GCP terpisah yang belum dikonfigurasi). Jangan buang waktu memakainya.
- **Setup manual sekali via Editor script** (`https://script.google.com/d/{scriptId}/edit`):
  - `montrackGenerateApiKey` → menghasilkan key 32 hex → salin ke `API_KEY` di `frontend/js/services/api.js` (tersimpan sebagai Script Property `MONTRACK_API_KEY`; guard fail-closed — jika property kosong semua request ditolak).
  - `montrackSetupInfo` → URL Spreadsheet DB + status key + URL web app.
  - `montrackPing` → healthcheck (`pong <ISO time>`).
- **Folder Google Drive "Montrack App"** (sesuai nama project) dibuat **otomatis** backend pada request pertama (`ensureProjectFolder_` di `Code.gs`): buat folder bila belum ada → pindahkan Spreadsheet DB ke dalamnya → tandai idempoten via Script Property `MONTRACK_FOLDER_ID`. Status/URL folder ada di `montrackSetupInfo`.
- Contract respons 1:1 dengan mock FE — daftar pesan error persis ada di `frontend/js/services/api.js` (mock) dan `backend/src/routes.gs`; sumber verifikasi = `test-mock-api.js` + `test-live.js`.

## 4. CI/CD & Firebase Hosting

### 4.1 GitHub Actions Workflow
- Frontend wajib memiliki CI/CD menggunakan GitHub Actions.
- Target deployment: **Firebase Hosting**.
- Workflow (`.github/workflows/deploy.yml`) **sudah ada**: mendengarkan `push` ke `main`, menjalankan 3 test kontrak, lalu `firebase deploy --only hosting`.
- Gunakan `firebase-tools` dalam pipeline dan `FIREBASE_TOKEN` via repo secrets.

## 5. Folder Structure Standard
AI wajib menginisialisasi project baru dengan struktur berikut:

```
{project-name}/
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── app.js
│   │   ├── components/
│   │   └── services/
│   └── mock/
├── backend/
│   ├── src/
│   │   ├── Code.gs
│   │   ├── routes.gs
│   │   └── utils/
│   ├── appsscript.json
│   └── .clasp.json
├── .github/
│   └── workflows/
│       └── deploy.yml
├── test-mock-api.js
├── test-be.js
├── test-fe-live-url.js
├── test-live.js
├── firebase.json
├── .firebaserc
├── .gitignore
└── README.md
```

## 6. Commit Conventions
- Format: `{type}: {description}`
- Types: `feat` (fitur baru), `fix` (perbaikan bug), `chore` (maintenance), `docs` (dokumentasi).