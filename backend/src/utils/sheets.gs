/**
 * Akses Google Sheets — baca batch (getValues sekali per request),
 * mapping baris↔objek memakai header sebagai key.
 */

function readObjects_(sheetName) {
  var sh = getDb_().getSheetByName(sheetName);
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sh.getLastColumn();
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function (h) {
    return String(h);
  });
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    out.push(obj);
  }
  return out;
}

function appendRow_(sheetName, obj) {
  var sh = getDb_().getSheetByName(sheetName);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) {
    var v = obj[h];
    return v === undefined || v === null ? '' : v;
  });
  sh.appendRow(row);
}

function userExists_(userId) {
  var users = readObjects_('Users');
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].ID) === userId) return true;
  }
  return false;
}

/**
 * Update baris pada sheet berdasarkan kunci (mis. ID user).
 * Tulis per kolom via setValues — aman untuk sheet legacy
 * (kolom baru sudah ditambahkan ensureUsersSchema_).
 */
function updateObject_(sheetName, keyHeader, keyValue, updates) {
  var sh = getDb_().getSheetByName(sheetName);
  if (!sh) return false;
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return false;
  var lastCol = sh.getLastColumn();
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function (h) {
    return String(h);
  });
  var keyIdx = headers.indexOf(keyHeader);
  if (keyIdx === -1) return false;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][keyIdx]) !== String(keyValue)) continue;
    var keys = Object.keys(updates);
    for (var j = 0; j < keys.length; j++) {
      var colIdx = headers.indexOf(keys[j]);
      if (colIdx === -1) continue;
      sh.getRange(i + 1, colIdx + 1, 1, 1).setValues([[updates[keys[j]]]]);
    }
    return true;
  }
  return false;
}
