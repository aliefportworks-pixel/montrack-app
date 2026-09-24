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
for (const f of ['Code.gs', 'routes.gs', 'utils/validation.gs', 'utils/sheets.gs']) {
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
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'bukan-email' }) } });
  assert.strictEqual(res.message, 'Format email tidak valid.');

  // 5. Auth: auto-register
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com' }) } });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.name, 'Budi Santoso');
  const userId = res.data.id;

  // 6. Auth: login ulang → id sama
  res = call('POST', { parameter: { action: 'auth', key }, postData: { contents: JSON.stringify({ email: 'budi.santoso@example.com' }) } });
  assert.strictEqual(res.data.id, userId);

  // 7. Create valid
  res = call('POST', {
    parameter: { action: 'transactions', key },
    postData: {
      contents: JSON.stringify({
        userId, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 50000, note: 'Makan siang',
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
  await expectFail({ userId, type: 'out', category: 'Makanan', date: '2026-09-23', amount: 0 }, 'Nominal harus lebih dari 0.');
  await expectFail({ userId, type: 'out', category: '', date: '2026-09-23', amount: 1000 }, 'Kategori wajib dipilih.');
  await expectFail({ userId, type: 'out', category: 'Makanan', date: '', amount: 1000 }, 'Tanggal wajib diisi.');
  await expectFail({ userId, type: 'xx', category: 'Makanan', date: '2026-09-23', amount: 1000 }, 'Tipe transaksi tidak valid.');
  await expectFail({ userId: 'u-tidak-ada', type: 'out', category: 'Makanan', date: '2026-09-23', amount: 1000 }, 'Sesi pengguna tidak valid.');

  // 9. List: hanya milik user + sort desc
  res = call('GET', { parameter: { action: 'transactions', key, userId } });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.length, 1);
  res = call('GET', { parameter: { action: 'transactions', key, userId: 'u-lain' } });
  assert.strictEqual(res.data.length, 0);
  res = call('GET', { parameter: { action: 'transactions', key } });
  assert.strictEqual(res.message, 'Sesi pengguna tidak valid.');

  // Tambah transaksi tanggal lain untuk uji sort
  call('POST', {
    parameter: { action: 'transactions', key },
    postData: { contents: JSON.stringify({ userId, type: 'in', category: 'Gaji', date: '2026-09-01', amount: 1000, note: 'Gaji' }) },
  });
  res = call('GET', { parameter: { action: 'transactions', key, userId } });
  assert.strictEqual(res.data.length, 2);
  assert.strictEqual(res.data[0].date, '2026-09-23', 'terbaru dulu');

  // 10. Anti formula injection
  call('POST', {
    parameter: { action: 'transactions', key },
    postData: { contents: JSON.stringify({ userId, type: 'out', category: 'Lainnya', date: '2026-09-20', amount: 1000, note: '=SUM(A1:A9)' }) },
  });
  res = call('GET', { parameter: { action: 'transactions', key, userId } });
  const evil = res.data.find((t) => t.note && t.note.indexOf('SUM') !== -1);
  assert.ok(evil, 'transaksi catatan formula tersimpan');
  assert.ok(evil.note.startsWith("'"), 'note diprefix apostrof, got: ' + evil.note);

  // 11. Tanggal objek Date dinormalisasi ke ISO
  const txFake = dbBook.getSheetByName('Transactions');
  txFake._data.splice(1, 0, ['t-fake', userId, new Date(2026, 8, 10), 'out', 'Lainnya', 5000, '', '']);
  res = call('GET', { parameter: { action: 'transactions', key, userId } });
  const fake = res.data.find((t) => t.id === 't-fake');
  assert.strictEqual(fake.date, '2026-09-10');

  // 12. Delete
  res = call('POST', { parameter: { action: 'delete_transaction', key, id: txId, userId } });
  assert.deepStrictEqual(res, { success: true, data: { deleted: true } });
  res = call('POST', { parameter: { action: 'delete_transaction', key, id: txId, userId } });
  assert.strictEqual(res.message, 'Transaksi tidak ditemukan.');
  res = call('POST', { parameter: { action: 'delete_transaction', key, id: 't-fake', userId: 'u-lain' } });
  assert.strictEqual(res.message, 'Transaksi tidak ditemukan.', 'delete harus cocok userId');

  // 12b. Toleransi redirect GAS: auth/create/delete diterima via GET (query penuh)
  res = call('GET', { parameter: { action: 'auth', key, email: 'fitri@example.com' } });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.email, 'fitri@example.com');

  res = call('GET', {
    parameter: {
      action: 'create_transaction', key, userId,
      type: 'in', category: 'Freelance', date: '2026-09-22', amount: 77000, note: 'via-query',
    },
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.amount, 77000);
  const qTxId = res.data.id;

  res = call('GET', { parameter: { action: 'delete_transaction', key, id: qTxId, userId } });
  assert.deepStrictEqual(res, { success: true, data: { deleted: true } });

  // 12c. create_transaction via POST (merge query+body, body menang)
  res = call('POST', {
    parameter: { action: 'create_transaction', key, amount: '1' },
    postData: {
      contents: JSON.stringify({
        userId, type: 'out', category: 'Makanan', date: '2026-09-24', amount: 42000, note: 'merge',
      }),
    },
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.amount, 42000, 'body menang atas query');
  call('POST', { parameter: { action: 'delete_transaction', key, id: res.data.id, userId } });

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
