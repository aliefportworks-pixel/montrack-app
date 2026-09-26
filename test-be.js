/* Smoke test logika BE (stub Google API) — jalankan: node test-be.js */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

/* ---------------- Stub Google Apps Script API ---------------- */

const scriptProps = new Map();
let dbBook = null;

function fakeRange(sheet, r, c, rows, cols) {
  return {
    getValues() {
      const out = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push(sheet._data[r - 1 + i] ? sheet._data[r - 1 + i][c - 1 + j] : undefined);
        }
        out.push(row);
      }
      return out;
    },
    setValues(values) {
      values.forEach((row, i) => {
        if (!sheet._data[r - 1 + i]) sheet._data[r - 1 + i] = [];
        row.forEach((v, j) => {
          sheet._data[r - 1 + i][c - 1 + j] = v;
        });
      });
      return this;
    },
    setNumberFormat() {
      return this;
    },
  };
}

function fakeSheet(book, name) {
  const sheet = {
    _name: name,
    _data: [],
    getName() {
      return this._name;
    },
    setName(n) {
      this._name = n;
      return this;
    },
    getLastRow() {
      return this._data.length;
    },
    getLastColumn() {
      return this._data[0] ? this._data[0].length : 0;
    },
    getMaxRows() {
      return Math.max(100, this._data.length);
    },
    getRange(r, c, rows, cols) {
      return fakeRange(this, r, c, rows, cols);
    },
    appendRow(row) {
      this._data.push(row.slice());
    },
    deleteRow(idx) {
      this._data.splice(idx - 1, 1);
    },
  };
  book._sheets.push(sheet);
  return sheet;
}

function fakeBook(name) {
  const book = {
    _name: name,
    _sheets: [],
    setSpreadsheetTimeZone() {
      return this;
    },
    getId() {
      return 'sheet-id-stub';
    },
    insertSheet(n) {
      return fakeSheet(this, n);
    },
    getSheets() {
      return this._sheets;
    },
    getSheetByName(n) {
      return this._sheets.find((s) => s.getName() === n) || null;
    },
  };
  const first = fakeSheet(book, 'Sheet1');
  void first;
  return book;
}

global.PropertiesService = {
  getScriptProperties() {
    return {
      getProperty: (k) => (scriptProps.has(k) ? scriptProps.get(k) : null),
      setProperty: (k, v) => scriptProps.set(k, String(v)),
    };
  },
};

global.SpreadsheetApp = {
  create(name) {
    dbBook = fakeBook(name);
    driveFiles_.set(dbBook.getId(), { id: dbBook.getId(), parents: ['root'] });
    return dbBook;
  },
  openById() {
    return dbBook;
  },
};

global.Session = { getScriptTimeZone: () => 'Asia/Jakarta' };

/* ---------------- Stub Google Drive (folder proyek) ---------------- */

const driveFolders_ = new Map();
const driveFiles_ = new Map();
driveFolders_.set('root', { id: 'root', name: '(root)' });
let driveFolderCreates_ = 0;

function folderHandle_(f) {
  return { getId: () => f.id };
}

function fileHandle_(f) {
  return {
    getParents() {
      let i = 0;
      const list = f.parents.map((id) => driveFolders_.get(id)).filter(Boolean);
      return {
        hasNext: () => i < list.length,
        next: () => folderHandle_(list[i++]),
      };
    },
    moveTo(folder) {
      f.parents = [folder.getId()];
      return this;
    },
  };
}

global.DriveApp = {
  getFoldersByName(name) {
    const found = [...driveFolders_.values()].filter((f) => f.name === name);
    let i = 0;
    return {
      hasNext: () => i < found.length,
      next: () => folderHandle_(found[i++]),
    };
  },
  createFolder(name) {
    driveFolderCreates_++;
    const f = { id: 'folder-' + driveFolderCreates_, name };
    driveFolders_.set(f.id, f);
    return folderHandle_(f);
  },
  getFileById(id) {
    if (!driveFiles_.has(id)) driveFiles_.set(id, { id, parents: ['root'] });
    return fileHandle_(driveFiles_.get(id));
  },
};

global.ScriptApp = {
  getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/stub/exec' }),
};

global.Utilities = {
  getUuid: () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      const v = ch === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }),
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  Charset: { UTF_8: 'UTF_8' },
  /* byte signed ala GAS — toHex_ di auth.gs harus menanganinya */
  computeDigest: (alg, text) =>
    [...require('crypto').createHash('sha256').update(String(text), 'utf8').digest()].map(
      (b) => (b > 127 ? b - 256 : b)
    ),
};

global.ContentService = {
  MimeType: { JSON: 'application/json' },
  createTextOutput(content) {
    const out = { content, mimeType: null, setMimeType(m) { this.mimeType = m; return this; } };
    global.__lastOutput = out;
    return out;
  },
};

/* ---------------- Load source .gs ---------------- */

const src = path.join(__dirname, 'backend', 'src');
for (const f of ['Code.gs', 'routes.gs', 'utils/validation.gs', 'utils/sheets.gs', 'utils/auth.gs']) {
  eval(fs.readFileSync(path.join(src, f), 'utf8'));
}

function call(method, e) {
  if (method === 'GET') doGet(e); else doPost(e);
  return JSON.parse(global.__lastOutput.content);
}

/* ---------------- Tests ---------------- */

(async () => {
  // 1. Fail-closed: key belum dikonfigurasi
  let res = call('GET', { parameter: { action: 'categories' } });
  assert.strictEqual(res.success, false);
  assert.match(res.message, /API key belum dikonfigurasi/);

  // Siapkan key
  const key = montrackGenerateApiKey();
  assert.ok(key.length >= 16);

  // 2. Key salah
  res = call('GET', { parameter: { action: 'categories', key: 'salah' } });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.message, 'API key tidak valid.');

  // 3. Lazy init + kategori ter-seed
  res = call('GET', { parameter: { action: 'categories', key } });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.length, 10);
  assert.deepStrictEqual(res.data[0], { id: 'c-01', name: 'Makanan', icon: '🍔' });
  assert.ok(scriptProps.get('MONTRACK_SHEET_ID'));

  // 3b. Folder proyek Drive dibuat otomatis + spreadsheet dipindah ke dalamnya
  assert.ok(scriptProps.get('MONTRACK_FOLDER_ID'), 'MONTRACK_FOLDER_ID harus ter-set');
  assert.strictEqual(driveFolderCreates_, 1, 'folder dibuat tepat satu kali');
  const projFolder = driveFolders_.get(scriptProps.get('MONTRACK_FOLDER_ID'));
  assert.strictEqual(projFolder.name, 'Montrack App', 'nama folder sesuai project');
  assert.deepStrictEqual(
    driveFiles_.get('sheet-id-stub').parents,
    [scriptProps.get('MONTRACK_FOLDER_ID')],
    'spreadsheet dipindah ke folder project'
  );
  call('GET', { parameter: { action: 'categories', key } });
  assert.strictEqual(driveFolderCreates_, 1, 'idempoten — tidak dibuat dua kali');

  // 4. Auth: email invalid
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'bukan-email', password: 'rahasia123' }) } });
  assert.strictEqual(res.message, 'Format email tidak valid.');

  // 4b. Auth: tanpa password (mis. body dibuang redirect GAS)
  res = call('POST', { parameter: { action: 'auth', key, email: 'budi.santoso@example.com' } });
  assert.strictEqual(res.message, 'Password wajib diisi.');

  // 4c. Auth: email belum terdaftar → tidak boleh bocor info akun
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'belum-ada@example.com', password: 'rahasia123' }) } });
  assert.strictEqual(res.message, 'Email atau password salah.');

  // 4d. Register: password terlalu pendek
  res = call('POST', { parameter: { action: 'register', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'abc' }) } });
  assert.strictEqual(res.message, 'Password minimal 8 karakter.');

  // 5. Register: user baru → auto-login + token
  res = call('POST', { parameter: { action: 'register', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'rahasia123' }) } });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.name, 'Budi Santoso');
  assert.ok(res.data.token && res.data.token.length >= 32, 'token diterbitkan');
  const userId = res.data.id;
  let token = res.data.token;

  // 5b. Register duplikat → tolak
  res = call('POST', { parameter: { action: 'register', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'lainnya12345' }) } });
  assert.strictEqual(res.message, 'Email sudah terdaftar.');

  // 5c. Auth: login password salah
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'salah-salah' }) } });
  assert.strictEqual(res.message, 'Email atau password salah.');

  // 5d. Auth: login benar → id sama, token baru
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'rahasia123' }) } });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.id, userId);
  token = res.data.token;
  assert.ok(token);

  // 5e. Legacy user (baris lama tanpa PasswordHash): login ditolak, daftar ulang pakai ID lama
  call('POST', { parameter: { action: 'register', key }, postData: { contents: JSON.stringify({ email: 'legacy@montrack.id', password: 'legacy-12345' }) } });
  const legacyRow = dbBook.getSheetByName('Users')._data.find((r) => String(r[1]) === 'legacy@montrack.id');
  const legacyId = legacyRow[0];
  legacyRow[3] = ''; legacyRow[4] = ''; legacyRow[5] = ''; // simulasi baris pra-password
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'legacy@montrack.id', password: 'legacy-12345' }) } });
  assert.strictEqual(res.message, 'Akun ini belum diatur password. Silakan daftar ulang.');
  res = call('POST', { parameter: { action: 'register', key }, postData: { contents: JSON.stringify({ email: 'legacy@montrack.id', password: 'baru-123456' }) } });
  assert.strictEqual(res.success, true, 'daftar ulang legacy sukses');
  assert.strictEqual(res.data.id, legacyId, 'ID & data lama tetap dipakai');
  const legacyToken = res.data.token;

  // 5f. GET auth (toleransi redirect) — password tidak pernah di query
  res = call('GET', { parameter: { action: 'auth', key, email: 'fitri@example.com' } });
  assert.strictEqual(res.message, 'Password wajib diisi.');

  // 5g. Logout mencabut token
  res = call('POST', { parameter: { action: 'logout', key, userId, token } });
  assert.deepStrictEqual(res, { success: true, data: { loggedOut: true } });
  res = call('GET', { parameter: { action: 'transactions', key, userId, token } });
  assert.strictEqual(res.message, 'Sesi pengguna tidak valid.', 'token lama setelah logout');
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'rahasia123' }) } });
  token = res.data.token;

  // 5h. Ganti password
  res = call('POST', {
    parameter: { action: 'change_password', key, userId, token },
    postData: { contents: JSON.stringify({ oldPassword: 'salah-salah', newPassword: 'barubanget1' }) },
  });
  assert.strictEqual(res.message, 'Password lama salah.');
  res = call('POST', {
    parameter: { action: 'change_password', key, userId, token },
    postData: { contents: JSON.stringify({ oldPassword: 'rahasia123', newPassword: 'abc' }) },
  });
  assert.strictEqual(res.message, 'Password minimal 8 karakter.');
  res = call('POST', {
    parameter: { action: 'change_password', key, userId, token },
    postData: { contents: JSON.stringify({ oldPassword: 'rahasia123', newPassword: 'barubanget1' }) },
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.token, token, 'token tetap setelah ganti password');
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'rahasia123' }) } });
  assert.strictEqual(res.message, 'Email atau password salah.', 'password lama mati');
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com', password: 'barubanget1' }) } });
  assert.strictEqual(res.success, true, 'password baru bisa dipakai');
  token = res.data.token;

  // 7. Create valid
  res = call('POST', {
    parameter: { action: 'transactions', key },
    postData: {
      contents: JSON.stringify({
        userId, token, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 50000, note: 'Makan siang',
      }),
    },
  });
  assert.strictEqual(res.success, true);
  const txId = res.data.id;
  assert.strictEqual(res.data.amount, 50000);

  // 8. Validasi FR-02 — pesan identik mock
  const expectFail = async (payload, msg) => {
    const r = call('POST', {
      parameter: { action: 'transactions', key },
      postData: { contents: JSON.stringify(payload) },
    });
    assert.strictEqual(r.success, false, 'seharusnya gagal: ' + msg);
    assert.strictEqual(r.message, msg);
  };
  await expectFail({ userId, token, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 0 }, 'Nominal harus lebih dari 0.');
  await expectFail({ userId, token, type: 'out', category: '', date: '2026-09-23', amount: 1000 }, 'Kategori wajib dipilih.');
  await expectFail({ userId, token, type: 'out', category: 'Makanan', date: '', amount: 1000 }, 'Tanggal wajib diisi.');
  await expectFail({ userId, token, type: 'xx', category: 'Makanan', date: '2026-09-23', amount: 1000 }, 'Tipe transaksi tidak valid.');
  await expectFail({ userId: 'u-tidak-ada', token, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }, 'Sesi pengguna tidak valid.');
  await expectFail({ userId, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }, 'Sesi pengguna tidak valid.', 'tanpa token');
  await expectFail({ userId, token: 'token-salah', type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }, 'Sesi pengguna tidak valid.', 'token salah');

  // 9. List: hanya milik user + sort desc + wajib token
  res = call('GET', { parameter: { action: 'transactions', key, userId, token } });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.length, 1);
  res = call('GET', { parameter: { action: 'transactions', key, userId, token: 'token-salah' } });
  assert.strictEqual(res.message, 'Sesi pengguna tidak valid.', 'token salah ditolak');
  // user lain (terdaftar) — miliknya tetap kosong, isolasi antar user
  res = call('POST', { parameter: { action: 'register', key }, postData: { contents: JSON.stringify({ email: 'lina@example.com', password: 'linalina123' }) } });
  const linaId = res.data.id;
  const linaToken = res.data.token;
  res = call('GET', { parameter: { action: 'transactions', key, userId: linaId, token: linaToken } });
  assert.strictEqual(res.data.length, 0, 'user lain tanpa transaksi');
  res = call('GET', { parameter: { action: 'transactions', key } });
  assert.strictEqual(res.message, 'Sesi pengguna tidak valid.');

  // Tambah transaksi tanggal lain untuk uji sort
  call('POST', {
    parameter: { action: 'transactions', key },
    postData: { contents: JSON.stringify({ userId, token, type: 'in', category: 'Gaji', date: '2026-09-01', amount: 1000, note: 'Gaji' }) },
  });
  res = call('GET', { parameter: { action: 'transactions', key, userId, token } });
  assert.strictEqual(res.data.length, 2);
  assert.strictEqual(res.data[0].date, '2026-09-23', 'terbaru dulu');

  // 10. Anti formula injection
  call('POST', {
    parameter: { action: 'transactions', key },
    postData: { contents: JSON.stringify({ userId, token, type: 'out', category: 'Lainnya', date: '2026-09-20', amount: 1000, note: '=SUM(A1:A9)' }) },
  });
  res = call('GET', { parameter: { action: 'transactions', key, userId, token } });
  const evil = res.data.find((t) => t.note && t.note.indexOf('SUM') !== -1);
  assert.ok(evil, 'transaksi catatan formula tersimpan');
  assert.ok(evil.note.startsWith("'"), 'note diprefix apostrof, got: ' + evil.note);

  // 11. Tanggal objek Date dinormalisasi ke ISO
  const txFake = dbBook.getSheetByName('Transactions');
  txFake._data.splice(1, 0, ['t-fake', userId, new Date(2026, 8, 10), 'out', 'Lainnya', 5000, '', '']);
  res = call('GET', { parameter: { action: 'transactions', key, userId, token } });
  const fake = res.data.find((t) => t.id === 't-fake');
  assert.strictEqual(fake.date, '2026-09-10');

  // 12. Delete
  res = call('POST', { parameter: { action: 'delete_transaction', key, id: txId, userId, token } });
  assert.deepStrictEqual(res, { success: true, data: { deleted: true } });
  res = call('POST', { parameter: { action: 'delete_transaction', key, id: txId, userId, token } });
  assert.strictEqual(res.message, 'Transaksi tidak ditemukan.');
  res = call('POST', { parameter: { action: 'delete_transaction', key, id: 't-fake', userId: linaId, token: linaToken } });
  assert.strictEqual(res.message, 'Transaksi tidak ditemukan.', 'sesi valid tapi baris bukan miliknya');
  res = call('POST', { parameter: { action: 'delete_transaction', key, id: txId, userId: linaId, token: 'token-salah' } });
  assert.strictEqual(res.message, 'Sesi pengguna tidak valid.', 'token salah ditolak');

  // 12b. Toleransi redirect GAS: create/delete diterima via GET (query penuh, token ikut query)
  res = call('GET', {
    parameter: {
      action: 'create_transaction', key, userId, token,
      type: 'in', category: 'Freelance', date: '2026-09-22', amount: 77000, note: 'via-query',
    },
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.amount, 77000);
  const qTxId = res.data.id;

  res = call('GET', { parameter: { action: 'delete_transaction', key, id: qTxId, userId, token } });
  assert.deepStrictEqual(res, { success: true, data: { deleted: true } });

  // 12c. create_transaction via POST (merge query+body, body menang)
  res = call('POST', {
    parameter: { action: 'create_transaction', key, amount: '1' },
    postData: {
      contents: JSON.stringify({
        userId, token, type: 'out', category: 'Makanan', date: '2026-09-24', amount: 42000, note: 'merge',
      }),
    },
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.amount, 42000, 'body menang atas query');
  call('POST', { parameter: { action: 'delete_transaction', key, id: res.data.id, userId, token } });

  // 13. Endpoint tak dikenal
  res = call('GET', { parameter: { action: 'unknown', key } });
  assert.strictEqual(res.message, 'Endpoint tidak dikenal: GET unknown');
  res = call('POST', { parameter: { action: 'unknown', key } });
  assert.strictEqual(res.message, 'Endpoint tidak dikenal: POST unknown');

  // 14. Setup info
  const info = JSON.parse(montrackSetupInfo());
  assert.ok(info.sheetUrl.includes('docs.google.com/spreadsheets/'));
  assert.strictEqual(info.apiKeyConfigured, true);

  console.log('ALL_BE_TESTS_PASS');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
