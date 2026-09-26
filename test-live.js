/**
 * Live smoke test — menjalankan frontend/js/services/api.js (USE_MOCK dipaksa false)
 * terhadap backend GAS sungguhan. API_BASE & API_KEY dibaca dari api.js (sumber tunggal).
 *
 * Jalankan: node test-live.js
 * Butuh internet. Data uji dibersihkan (pre-clean + sweep akhir); email user uji
 * persisten antar run.
 *
 * Catatan transport: GAS kadang membalas 404/HTML untuk request yang SEBENARNYA
 * sudah dieksekusi (terutama saat rate limit). Karena itu:
 *   - semua request di-retry (GET idempoten; POST ditambatkan dengan rekonsiliasi),
 *   - create diberi note unik per run → orphan akibat create ganda dibersihkan,
 *   - delete diverifikasi ulang via list (absen/present) sebelum diambil keputusan.
 * Pacing 5s/request agar tetap di bawah kuota eksekusi GAS.
 */
const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'frontend', 'js', 'services', 'api.js');
let src = fs.readFileSync(apiPath, 'utf8');

const baseMatch = src.match(/var API_BASE =\s*\n?\s*'([^']+)'/);
const keyMatch = src.match(/var API_KEY = '[^']*'/);
if (!baseMatch || !keyMatch) {
  console.error('API_BASE/API_KEY tidak ditemukan di api.js');
  process.exit(1);
}
const API_BASE = baseMatch[1];
const API_KEY = (src.match(/var API_KEY = '([^']+)'/) || [])[1];
if (!API_KEY) {
  console.error('API_KEY kosong di api.js — isi dulu (lihat AGENTS.md §3.3).');
  process.exit(1);
}

src = src.replace('var USE_MOCK = true', 'var USE_MOCK = false');
global.window = {};
global.navigator = { onLine: true };

const realFetch = global.fetch;
global.fetch = async function (url, opts) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await realFetch(url, opts);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('CT=' + ct);
      await new Promise((r) => setTimeout(r, 5000));
      return res;
    } catch (e) {
      lastErr = e;
      console.log('TRANSPORT [' + i + '] ' + e.message + ' :: ' + url);
      if (i < 2) await new Promise((r) => setTimeout(r, 10000));
    }
  }
  throw lastErr;
};

eval(src);
const Api = global.window.Api;

let failures = 0;
function check(label, cond, extra) {
  if (cond) {
    console.log('PASS ' + label);
  } else {
    failures++;
    console.log('FAIL ' + label + (extra !== undefined ? ' => ' + JSON.stringify(extra) : ''));
  }
}

async function expectError(label, promise, message) {
  try {
    await promise;
    check(label, false, 'tidak melempar error');
  } catch (e) {
    check(label, e.message === message, e.message);
  }
}

async function rowsOf(uid, token) {
  const l = await Api.getTransactions(uid, token);
  return l.data;
}

async function rawGet(query) {
  const sep = API_BASE.includes('?') ? '&' : '?';
  const res = await fetch(API_BASE + sep + query);
  return { status: res.status, ct: res.headers.get('content-type') || '', body: await res.json() };
}

(async () => {
  const RUN = Date.now().toString(36);
  const MARK = 'SMOKE-' + RUN;
  const EMAIL = 'smoke-test@montrack.id';
  const PASS = 'Smoke12345!';

  const cats = await Api.getCategories();
  check('GET categories: 10 item', cats.data && cats.data.length === 10, cats.data && cats.data.length);
  check(
    'GET categories: icon emoji utuh',
    cats.data[0] && cats.data[0].icon.codePointAt(0) === 0x1f354,
    cats.data[0] && cats.data[0].icon
  );
  check(
    'GET categories: nama default cocok',
    cats.data[1] && cats.data[1].name === 'Transport' && cats.data[1].id === 'c-02',
    cats.data[1]
  );

  /* register idempoten: run pertama membuat akun; run berikutnya fallback login.
   * (email user uji persisten — akun lama pra-password ditangani jalur legacy) */
  const user = await Api.register(EMAIL, PASS);
  check('POST register: user baru/ulang', user.data && user.data.id && user.data.email === EMAIL, user.data);
  check('POST register: token terbit', user.data && typeof user.data.token === 'string' && user.data.token.length >= 32, user.data);
  const uid = user.data.id;
  let token = user.data.token;

  /* idempoten: bersihkan sisa data uji dari run sebelumnya */
  for (const row of await rowsOf(uid, token)) await Api.deleteTransaction(row.id, uid, token);

  const user2 = await Api.register('smoke-b@montrack.id', PASS);
  const uid2 = user2.data.id;
  const token2 = user2.data.token;
  for (const row of await rowsOf(uid2, token2)) await Api.deleteTransaction(row.id, uid2, token2);

  await expectError(
    'POST auth: email invalid',
    Api.login('bukan-email', PASS),
    'Format email tidak valid.'
  );
  await expectError(
    'POST auth: password salah',
    Api.login(EMAIL, 'password-salah-xyz'),
    'Email atau password salah.'
  );
  await expectError(
    'POST auth: email tak terdaftar',
    Api.login('belum-pernah-' + RUN + '@montrack.id', PASS),
    'Email atau password salah.'
  );
  await expectError(
    'GET transactions: token salah',
    Api.getTransactions(uid, 'token-salah'),
    'Sesi pengguna tidak valid.'
  );
  await expectError(
    'POST register: duplikat beda password',
    Api.register(EMAIL, 'Bedanya12345!'),
    'Email sudah terdaftar.'
  );

  const t1 = await Api.createTransaction({
    userId: uid,
    token,
    type: 'out',
    category: 'Makanan',
    date: '2026-09-23',
    amount: 25000,
    note: MARK + '-a',
  });
  check(
    'POST transactions: create',
    t1.data && t1.data.id && t1.data.amount === 25000 && t1.data.userId === uid,
    t1.data
  );

  const t2 = await Api.createTransaction({
    userId: uid,
    token,
    type: 'in',
    category: 'Gaji',
    date: '2026-09-01',
    amount: 5000000,
    note: MARK + '-b',
  });
  check('POST transactions: create kedua', t2.data && t2.data.id, t2.data);

  /* bersihkan orphan create ganda (404-datang-setelah-eksekusi + retry) */
  let rows = await rowsOf(uid, token);
  const orphans = rows.filter(
    (r) => String(r.note || '').indexOf(MARK) === 0 && r.id !== t1.data.id && r.id !== t2.data.id
  );
  for (const o of orphans) await Api.deleteTransaction(o.id, uid, token);
  if (orphans.length) console.log('NOTE: orphan create dibersihkan = ' + orphans.length);

  await expectError(
    'validasi amount 0',
    Api.createTransaction({ userId: uid, token, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 0 }),
    'Nominal harus lebih dari 0.'
  );
  await expectError(
    'validasi kategori kosong',
    Api.createTransaction({ userId: uid, token, type: 'out', category: '', date: '2026-09-23', amount: 1000 }),
    'Kategori wajib dipilih.'
  );
  await expectError(
    'validasi tanggal kosong',
    Api.createTransaction({ userId: uid, token, type: 'out', category: 'Makanan', date: '', amount: 1000 }),
    'Tanggal wajib diisi.'
  );
  await expectError(
    'validasi tipe invalid',
    Api.createTransaction({ userId: uid, token, type: 'xx', category: 'Makanan', date: '2026-09-23', amount: 1000 }),
    'Tipe transaksi tidak valid.'
  );
  await expectError(
    'validasi user tidak ada',
    Api.createTransaction({ userId: 'u-tidak-ada', token, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }),
    'Sesi pengguna tidak valid.'
  );

  rows = await rowsOf(uid, token);
  const ids = rows.map((x) => x.id);
  check('GET transactions: 2 milik user', rows.length === 2, ids);
  check(
    'GET transactions: urutan terbaru dulu',
    ids.indexOf(t1.data.id) === 0 && ids.indexOf(t2.data.id) === 1,
    ids
  );
  const rows2 = await rowsOf(uid2, token2);
  check('GET transactions: isolasi antar user', rows2.length === 0, rows2.length);

  /* delete t1: keputusan berdasarkan keadaan sheet (absen = sukses) */
  let delErr = null;
  try {
    await Api.deleteTransaction(t1.data.id, uid, token);
  } catch (e) {
    delErr = e.message;
  }
  rows = await rowsOf(uid, token);
  const t1Gone = !rows.some((r) => r.id === t1.data.id);
  check('POST delete_transaction: hapus', t1Gone, { delErr: delErr, rows: rows.map((r) => r.id) });

  delErr = null;
  try {
    await Api.deleteTransaction(t1.data.id, uid, token);
  } catch (e) {
    delErr = e.message;
  }
  rows = await rowsOf(uid, token);
  const t1StillGone = !rows.some((r) => r.id === t1.data.id);
  check(
    'POST delete_transaction: ulang → tidak ditemukan',
    delErr === 'Transaksi tidak ditemukan.' && t1StillGone,
    { delErr: delErr, t1StillGone: t1StillGone }
  );

  delErr = null;
  try {
    await Api.deleteTransaction(t2.data.id, uid2, token2);
  } catch (e) {
    delErr = e.message;
  }
  rows = await rowsOf(uid, token);
  const t2Still = rows.some((r) => r.id === t2.data.id);
  check(
    'POST delete_transaction: user lain → tidak ditemukan',
    delErr === 'Transaksi tidak ditemukan.' && t2Still,
    { delErr: delErr, t2Still: t2Still }
  );

  /* logout mencabut token di server */
  const lo = await Api.logout(uid2, token2);
  check('POST logout: sukses', lo.data && lo.data.loggedOut === true, lo.data);
  await expectError(
    'GET transactions: token sudah dicabut',
    Api.getTransactions(uid2, token2),
    'Sesi pengguna tidak valid.'
  );

  /* ganti password e2e — akun khusus unik per run (tidak perlu di-restore) */
  const CH_EMAIL = 'smoke-chpw-' + RUN + '@montrack.id';
  const CH_OLD = 'ChpwOld123!';
  const CH_NEW = 'ChpwNew1234!';
  const ch = await Api.register(CH_EMAIL, CH_OLD);
  check('POST register: akun ganti-password', ch.data && ch.data.id, ch.data);
  const chUid = ch.data.id;
  const chTok = ch.data.token;
  await expectError(
    'change_password: password lama salah',
    Api.changePassword(chUid, chTok, 'salah-lama-juga', CH_NEW),
    'Password lama salah.'
  );
  await expectError(
    'change_password: password baru pendek',
    Api.changePassword(chUid, chTok, CH_OLD, 'abc'),
    'Password minimal 8 karakter.'
  );
  const chRes = await Api.changePassword(chUid, chTok, CH_OLD, CH_NEW);
  check(
    'change_password: sukses, token tetap',
    chRes.data && chRes.data.token === chTok && chRes.data.id === chUid,
    chRes.data
  );
  await expectError(
    'POST auth: password lama mati',
    Api.login(CH_EMAIL, CH_OLD),
    'Email atau password salah.'
  );
  const chLogin = await Api.login(CH_EMAIL, CH_NEW);
  check(
    'POST auth: password baru hidup',
    chLogin.data && chLogin.data.id === chUid,
    chLogin.data
  );
  await expectError(
    'POST register: duplikat',
    Api.register(CH_EMAIL, 'Bedanya12345!'),
    'Email sudah terdaftar.'
  );

  const badKey = await rawGet('action=categories&key=salah');
  check(
    'key salah → API key tidak valid.',
    badKey.status === 200 &&
      badKey.ct.includes('application/json') &&
      badKey.body.success === false &&
      badKey.body.message === 'API key tidak valid.',
    badKey.body
  );
  const noKey = await rawGet('action=categories');
  check(
    'tanpa key → API key tidak valid.',
    noKey.body && noKey.body.success === false && noKey.body.message === 'API key tidak valid.',
    noKey.body
  );

  delErr = null;
  try {
    await Api.deleteTransaction(t2.data.id, uid, token);
  } catch (e) {
    delErr = e.message;
  }
  rows = await rowsOf(uid, token);
  const t2Gone = !rows.some((r) => r.id === t2.data.id);
  check('cleanup: hapus sisa transaksi', t2Gone, { delErr: delErr });

  /* sweep final: pastikan tidak ada baris uji yang tertinggal */
  for (const row of await rowsOf(uid, token)) await Api.deleteTransaction(row.id, uid, token);
  const finalRows = await rowsOf(uid, token);
  check('cleanup: tidak ada sisa', finalRows.length === 0, finalRows.length);

  if (failures === 0) {
    console.log('ALL_LIVE_TESTS_PASS');
    process.exit(0);
  }
  console.log('LIVE_TESTS_FAIL count=' + failures);
  process.exit(1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
