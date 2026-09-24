# Montrack App

Aplikasi pencatat keuangan pribadi — SPA Vue 3 (single HTML) + backend Google Apps Script + database Google Sheets, di-host di Firebase Hosting.

## Struktur

- `frontend/` — SPA (Vue 3 CDN + Tailwind CDN, hash router, mock data)
- `backend/` — Google Apps Script via CLASP (`Code.gs`, `routes.gs`, `utils/`)
- `test-*.js` — skrip verifikasi kontrak (Node.js lokal, bukan bagian stack)
- `AGENTS.md` — aturan & workflow proyek (wajib dibaca agent)

## Menjalankan lokal

```powershell
npx -y serve frontend -l 3000
```

Buka http://localhost:3000 — login: `ayu@montrack.id` (mock). Jangan buka `fetch` via `file://`.

## Verifikasi

```powershell
node test-mock-api.js     # kontrak mock FE
node test-be.js           # kontrak routes.gs (stub Google API)
node test-fe-live-url.js  # translasi URL live di api.js
node test-live.js         # e2e ke backend Dev (butuh internet; tunggu cooldown kuota GAS ~15 menit antar run)
```

## Backend (GAS)

- Dev: `https://script.google.com/macros/s/AKfycbw-TVXZP85v1QW--6vZ6Gk_8K1iNbhANWEeB69Z1mPqkoUdAzHQsadtC_KtTq3taqxc/exec`
- Pro: `https://script.google.com/macros/s/AKfycbypv4i-9f110wKAnDR1aG6e4oP1VWlvbjrbv-PFV1Rdf6xfM0ogXQH8TmE8Ljd-8ee4/exec`
- Update: `clasp push --force` → `clasp create-version` → `clasp update-deployment {DEV_ID} -V {ver}` (detail di AGENTS.md)
- DB Spreadsheet + folder Drive **"Montrack App"** dibuat/diatur otomatis oleh backend pada request pertama.

## Deploy FE

Push ke `main` → GitHub Actions menjalankan test lalu `firebase deploy` (secret `FIREBASE_TOKEN`).
