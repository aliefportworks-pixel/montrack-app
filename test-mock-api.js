/* Smoke test logika API mock — jalankan: node test-mock-api.js */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.window = global;
global.navigator = { onLine: true };

const root = path.join(__dirname, 'frontend');
for (const f of ['mock/data.js', 'js/utils.js', 'js/services/api.js']) {
  eval(fs.readFileSync(path.join(root, f), 'utf8'));
}

(async () => {
  // 1. login valid
  let res = await Api.login('ayu@montrack.id');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.id, 'u-001');

  // 2. login invalid
  await assert.rejects(() => Api.login('bukan-email'), /Format email tidak valid/);

  // 3. auto-register email baru
  res = await Api.login('budi.santoso@example.com');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.name, 'Budi Santoso');

  // 4. kategori
  res = await Api.getCategories();
  assert.ok(res.data.length >= 10);

  // 5. transaksi user seed
  res = await Api.getTransactions('u-001');
  const initial = res.data.length;
  assert.strictEqual(initial, 23);
  // urut terbaru dulu
  assert.ok(res.data[0].date >= res.data[res.data.length - 1].date);

  // 6. create valid
  res = await Api.createTransaction({
    userId: 'u-001', type: 'out', category: 'Makanan',
    date: '2026-09-23', amount: 50000, note: 'Makan malam',
  });
  assert.strictEqual(res.success, true);
  assert.ok(res.data.id);

  // 7. validasi FR-02
  await assert.rejects(
    () => Api.createTransaction({ userId: 'u-001', type: 'out', category: 'Makanan', date: '2026-09-23', amount: 0 }),
    /Nominal harus lebih dari 0/
  );
  await assert.rejects(
    () => Api.createTransaction({ userId: 'u-001', type: 'out', category: '', date: '2026-09-23', amount: 1000 }),
    /Kategori wajib dipilih/
  );

  // 8. list bertambah
  res = await Api.getTransactions('u-001');
  assert.strictEqual(res.data.length, initial + 1);

  // 9. delete
  const createdId = (await Api.getTransactions('u-001')).data.find((t) => t.note === 'Makan malam').id;
  res = await Api.deleteTransaction(createdId, 'u-001');
  assert.deepStrictEqual(res.data, { deleted: true });
  res = await Api.getTransactions('u-001');
  assert.strictEqual(res.data.length, initial);

  // 10. delete ganda gagal
  await assert.rejects(() => Api.deleteTransaction(createdId, 'u-001'), /tidak ditemukan/);

  // 11. offline → pesan PRD US-08
  global.navigator.onLine = false;
  await assert.rejects(
    () => Api.createTransaction({ userId: 'u-001', type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }),
    /Gagal menyimpan data\. Periksa koneksi Anda\./
  );
  global.navigator.onLine = true;

  // 12. format respons selalu { success, ... }
  const raw = await Api.getTransactions('u-001');
  assert.strictEqual(raw.success, true);
  assert.ok(Array.isArray(raw.data));

  console.log('ALL_API_TESTS_PASS');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
