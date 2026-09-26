/**
 * Montrack Backend — entry point Google Apps Script Web App.
 *
 * Routing via query ?action=... (pathInfo /exec/auth butuh login Google — tidak dipakai).
 * Metode: GET & POST saja (GAS tidak mendukung DELETE/OPTIONS → 405).
 * Respons selalu HTTP 200 dengan format:
 *   sukses : { success: true,  data: <payload> }
 *   gagal  : { success: false, message: <string> }
 * API key: query ?key= dicocokkan dengan Script Property MONTRACK_API_KEY (fail-closed).
 */

function doGet(e) {
  return handleRequest_('GET', e);
}

function doPost(e) {
  return handleRequest_('POST', e);
}

function handleRequest_(method, e) {
  try {
    var params = (e && e.parameter) || {};

    var keyStatus = checkApiKey_(params);
    if (keyStatus !== true) return jsonOut_(fail_(keyStatus));

    ensureDb_();
    ensureUsersSchema_();
    ensureProjectFolder_();

    var body = parseBody_(e);
    var result = route_(method, String(params.action || ''), params, body);
    return jsonOut_(result);
  } catch (err) {
    console.error('Montrack error: ' + (err && err.stack ? err.stack : err));
    return jsonOut_(fail_('Terjadi kesalahan server. Coba lagi.'));
  }
}

function checkApiKey_(params) {
  var expected = PropertiesService.getScriptProperties().getProperty('MONTRACK_API_KEY');
  if (!expected) {
    return 'API key belum dikonfigurasi. Setel script property MONTRACK_API_KEY.';
  }
  var given = String(params.key || '');
  if (given !== expected) return 'API key tidak valid.';
  return true;
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return {};
    }
  }
  return {};
}

/* ---------------- Database (lazy init) ---------------- */

function getDb_() {
  if (typeof DB_CACHE_ !== 'undefined' && DB_CACHE_) return DB_CACHE_;
  var id = PropertiesService.getScriptProperties().getProperty('MONTRACK_SHEET_ID');
  DB_CACHE_ = SpreadsheetApp.openById(id);
  return DB_CACHE_;
}

function ensureDb_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('MONTRACK_SHEET_ID')) return;

  var ss = SpreadsheetApp.create('Montrack DB');
  ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());

  var users = ss.getSheets()[0];
  users.setName('Users');
  users.getRange(1, 1, 1, 6).setValues([USERS_HEADERS_]);

  var tx = ss.insertSheet('Transactions');
  tx.getRange(1, 1, 1, 8).setValues([
    ['ID', 'UserId', 'Date', 'Type', 'Category', 'Amount', 'Note', 'CreatedAt'],
  ]);
  /* Format teks agar string tanggal tidak dikonversi Sheets jadi Date serial */
  tx.getRange(2, 3, Math.max(2, tx.getMaxRows() - 1), 1).setNumberFormat('@');
  tx.getRange(2, 8, Math.max(2, tx.getMaxRows() - 1), 1).setNumberFormat('@');

  var cats = ss.insertSheet('Categories');
  cats.getRange(1, 1, 1, 3).setValues([['ID', 'Name', 'Icon']]);
  cats.getRange(2, 1, 10, 3).setValues(DEFAULT_CATEGORIES_);

  props.setProperty('MONTRACK_SHEET_ID', ss.getId());
  DB_CACHE_ = ss;
}

/* ---------------- Skema Users (idempoten — legacy 3 kolom → 6 kolom) ---------------- */

var USERS_HEADERS_ = ['ID', 'Email', 'Name', 'PasswordHash', 'Token', 'TokenExpiresAt'];

/**
 * Tambah kolom auth yang belum ada pada sheet Users lama (ID, Email, Name).
 * Jalan setiap request — satu baca baris 1 saja; bila kolom sudah lengkap, no-op.
 */
function ensureUsersSchema_() {
  var sh = getDb_().getSheetByName('Users');
  if (!sh) return;
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h);
  });
  var missing = [];
  for (var i = 0; i < USERS_HEADERS_.length; i++) {
    if (headers.indexOf(USERS_HEADERS_[i]) === -1) missing.push(USERS_HEADERS_[i]);
  }
  if (!missing.length) return;
  sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
}

/* ---------------- Folder proyek di Google Drive (otomatis, idempoten) ---------------- */

var PROJECT_FOLDER_NAME_ = 'Montrack App';

function ensureProjectFolder_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('MONTRACK_FOLDER_ID')) return;

  try {
    var folder;
    var it = DriveApp.getFoldersByName(PROJECT_FOLDER_NAME_);
    folder = it.hasNext() ? it.next() : DriveApp.createFolder(PROJECT_FOLDER_NAME_);

    var sheetId = props.getProperty('MONTRACK_SHEET_ID');
    if (sheetId) {
      var file = DriveApp.getFileById(sheetId);
      var parents = file.getParents();
      var inside = false;
      while (parents.hasNext()) {
        if (parents.next().getId() === folder.getId()) {
          inside = true;
          break;
        }
      }
      if (!inside) file.moveTo(folder);
    }

    props.setProperty('MONTRACK_FOLDER_ID', folder.getId());
  } catch (err) {
    /* Gagal set-up folder tidak boleh menjatuhkan API — coba lagi di request berikut */
    console.error('Project folder setup: ' + err);
  }
}

var DEFAULT_CATEGORIES_ = [
  ['c-01', 'Makanan', '🍔'],
  ['c-02', 'Transport', '🚗'],
  ['c-03', 'Belanja', '🛍️'],
  ['c-04', 'Tagihan', '📄'],
  ['c-05', 'Hiburan', '🎬'],
  ['c-06', 'Kesehatan', '🏥'],
  ['c-07', 'Pendidikan', '📚'],
  ['c-08', 'Gaji', '💼'],
  ['c-09', 'Freelance', '🧑‍💻'],
  ['c-10', 'Lainnya', '➕'],
];

/* ---------------- Helper respons ---------------- */

function ok_(data) {
  return { success: true, data: data };
}

function fail_(message) {
  return { success: false, message: message };
}

function jsonOut_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/* ---------------- Setup helpers (jalankan via editor/clasp run) ---------------- */

function montrackPing() {
  return 'pong ' + new Date().toISOString();
}

function montrackGenerateApiKey() {
  var key = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('MONTRACK_API_KEY', key);
  return key;
}

function montrackSetupInfo() {
  ensureDb_();
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('MONTRACK_SHEET_ID');
  var folderId = props.getProperty('MONTRACK_FOLDER_ID');
  return JSON.stringify(
    {
      sheetUrl: 'https://docs.google.com/spreadsheets/d/' + id,
      folderName: PROJECT_FOLDER_NAME_,
      folderUrl: folderId
        ? 'https://drive.google.com/drive/folders/' + folderId
        : '(folder dibuat otomatis pada request pertama)',
      apiKeyConfigured: !!props.getProperty('MONTRACK_API_KEY'),
      webAppUrl: ScriptApp.getService().getUrl() || '(deploy dulu untuk melihat URL)',
    },
    null,
    2
  );
}
