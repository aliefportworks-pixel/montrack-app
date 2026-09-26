/* Smoke test logika API mock — jalankan: node test-mock-api.js */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.window = global;
global.navigator = { onLine: true };

const root = path.join(__dirname, 'frontend');
for (const f of ['mock/data.js', 'js/utils.js', 'js/services/api.js']) {
  let src = fs.readFileSync(path.join(root, f), 'utf8');
  if (f.endsWith('services/api.js')) {
    // default produksi USE_MOCK=false — paksa mock untuk uji kontrak mock
    src = src.replace('var USE_MOCK = false', 'var USE_MOCK = true');
  }
  eval(src);
}

(async () => {
  // 1. login valid (email + password) → token terbit
  let res = await Api.login('ayu@montrack.id', 'montrack123');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.id, 'u-001');
  assert.ok(res.data.token, 'login menerbitkan token');
  let token = res.data.token;

  // 2. login invalid
  await assert.rejects(
    () => Api.login('bukan-email', 'montrack123'),
    /Format email tidak valid/
  );

  // 3. login tanpa password
  await assert.rejects(() => Api.login('ayu@montrack.id', ''), /Password wajib diisi/);

  // 4. login password salah / email tak dikenal → pesan sama (tidak bocor info akun)
  await assert.rejects(() => Api.login('ayu@montrack.id', 'salah-banget'), /Email atau password salah/);
  await assert.rejects(() => Api.login('tidak-ada@example.com', 'rahasia123'), /Email atau password salah/);

  // 5. register email baru
  res = await Api.register('budi.santoso@example.com', 'rahasia123');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.name, 'Budi Santoso');
  assert.ok(res.data.token);
  const budiId = res.data.id;
  assert.ok(budiId.startsWith('u-'));

  // 6. register duplikat dengan password berbeda → ditolak
  await assert.rejects(
    () => Api.register('ayu@montrack.id', 'password-baru-lain'),
    /Email sudah terdaftar/
  );

  // 6b. register ulang dengan password sama → idempoten (fallback login)
  res = await Api.register('ayu@montrack.id', 'montrack123');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.id, 'u-001');
  token = res.data.token; /* login mengganti token — perbarui sesi */

  // 6c. register password terlalu pendek
  await assert.rejects(
    () => Api.register('pendek@montrack.id', 'abc'),
    /Password minimal 8 karakter/
  );

  // 7. legacy user (pernah auto-register tanpa password) → login ditolak,
  //    daftar ulang memakai ID lama (data transaksi tetap terkait)
  MOCK_DATA.users.push({ id: 'u-legacy', email: 'legacy@montrack.id', name: 'Legacy User' });
  await assert.rejects(
    () => Api.login('legacy@montrack.id', 'apapun-juga'),
    /Akun ini belum diatur password. Silakan daftar ulang./
  );
  res = await Api.register('legacy@montrack.id', 'baru-123456');
  assert.strictEqual(res.data.id, 'u-legacy', 'ID lama dipakai ulang');

  // 8. transaksi wajib token yang valid
  res = await Api.getTransactions('u-001', token);
  const initial = res.data.length;
  assert.strictEqual(initial, 23);
  // urut terbaru dulu
  assert.ok(res.data[0].date >= res.data[res.data.length - 1].date);
  await assert.rejects(() => Api.getTransactions('u-001', 'token-salah'), /Sesi pengguna tidak valid/);
  await assert.rejects(() => Api.getTransactions('u-001', ''), /Sesi pengguna tidak valid/);
  // isolasi antar user
  res = await Api.getTransactions('u-legacy', (await Api.login('legacy@montrack.id', 'baru-123456')).data.token);
  assert.strictEqual(res.data.length, 0);

  // 9. create valid
  res = await Api.createTransaction({
    userId: 'u-001', token, type: 'out', category: 'Makanan',
    date: '2026-09-23', amount: 50000, note: 'Makan malam',
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data.id);

  // 10. validasi FR-02 + sesi
  await assert.rejects(
    () => Api.createTransaction({ userId: 'u-001', token, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 0 }),
    /Nominal harus lebih dari 0/
  );
  await assert.rejects(
    () => Api.createTransaction({ userId: 'u-001', token, type: 'out', category: '', date: '2026-09-23', amount: 1000 }),
    /Kategori wajib dipilih/
  );
  await assert.rejects(
    () => Api.createTransaction({ userId: 'u-001', token: 'token-salah', type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }),
    /Sesi pengguna tidak valid/
  );

  // 11. list bertambah
  res = await Api.getTransactions('u-001', token);
  assert.strictEqual(res.data.length, initial + 1);

  // 12. delete
  const createdId = (await Api.getTransactions('u-001', token)).data.find((t) => t.note === 'Makan malam').id;
  res = await Api.deleteTransaction(createdId, 'u-001', token);
  assert.deepStrictEqual(res.data, { deleted: true });
  res = await Api.getTransactions('u-001', token);
  assert.strictEqual(res.data.length, initial);

  // 13. delete ganda gagal
  await assert.rejects(() => Api.deleteTransaction(createdId, 'u-001', token), /tidak ditemukan/);

  // 13b. delete dengan token salah
  await assert.rejects(() => Api.deleteTransaction(createdId, 'u-001', 'token-salah'), /Sesi pengguna tidak valid/);

  // 14. ganti password
  await assert.rejects(
    () => Api.changePassword('u-001', token, 'password-salah', 'barubanget1'),
    /Password lama salah/
  );
  await assert.rejects(
    () => Api.changePassword('u-001', token, 'montrack123', 'abc'),
    /Password minimal 8 karakter/
  );
  res = await Api.changePassword('u-001', token, 'montrack123', 'barubanget1');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.token, token, 'token tetap setelah ganti password');
  await assert.rejects(() => Api.login('ayu@montrack.id', 'montrack123'), /Email atau password salah/);
  res = await Api.login('ayu@montrack.id', 'barubanget1');
  assert.strictEqual(res.success, true, 'password baru bisa dipakai');
  token = res.data.token;
  // kembalikan ke password seed
  await Api.changePassword('u-001', token, 'barubanget1', 'montrack123');
  res = await Api.login('ayu@montrack.id', 'montrack123');
  token = res.data.token;

  // 15. logout mencabut token
  res = await Api.logout('u-001', token);
  assert.deepStrictEqual(res.data, { loggedOut: true });
  await assert.rejects(() => Api.getTransactions('u-001', token), /Sesi pengguna tidak valid/);
  await assert.rejects(() => Api.logout('u-001', token), /Sesi pengguna tidak valid/);
  res = await Api.login('ayu@montrack.id', 'montrack123');
  token = res.data.token;

  // 16. offline → pesan PRD US-08
  global.navigator.onLine = false;
  await assert.rejects(
    () => Api.createTransaction({ userId: 'u-001', token, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }),
    /Gagal menyimpan data\. Periksa koneksi Anda\./
  );
  global.navigator.onLine = true;

  // 17. format respons selalu { success, ... }
  const raw = await Api.getTransactions('u-001', token);
  assert.strictEqual(raw.success, true);
  assert.ok(Array.isArray(raw.data));

  // 18. budi tetap terdaftar
  assert.ok(MOCK_DATA.users.find((u) => u.id === budiId && u.email === 'budi.santoso@example.com'));

  console.log('ALL_API_TESTS_PASS');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
