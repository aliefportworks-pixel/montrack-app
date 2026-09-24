/**
 * Router + handler endpoint Montrack.
 * Contract identik dengan mock FE (frontend/js/services/api.js):
 *   GET  ?action=categories
 *   GET  ?action=transactions&userId=...
 *   ANY  ?action=auth                 { email }        (query atau body)
 *   ANY  ?action=create_transaction   { userId, type, category, date, amount, note }
 *   ANY  ?action=delete_transaction&id=...&userId=...
 *   POST ?action=transactions         (alias create, kompatibilitas lama)
 *
 * Ketahanan redirect GAS: follow 302 kadang menurunkan POST→GET dan
 * membuang body — karena itu auth/create/delete diterima di GET maupun
 * POST, dan create memakai merge query+body (body menang bila ada).
 */

function route_(method, action, params, body) {
  if (action === 'auth') return handleAuth_(params, body);
  if (action === 'create_transaction') return createTransaction_(mergeInput_(params, body));
  if (action === 'delete_transaction') return deleteTransaction_(mergeInput_(params, body));

  if (method === 'GET') {
    if (action === 'categories') return listCategories_();
    if (action === 'transactions') return listTransactions_(params);
    return fail_('Endpoint tidak dikenal: GET ' + action);
  }

  /* POST */
  if (action === 'transactions') return createTransaction_(mergeInput_(params, body));
  return fail_('Endpoint tidak dikenal: POST ' + action);
}

function mergeInput_(params, body) {
  var out = {};
  var k;
  for (k in params) {
    if (Object.prototype.hasOwnProperty.call(params, k)) out[k] = params[k];
  }
  if (body) {
    for (k in body) {
      if (Object.prototype.hasOwnProperty.call(body, k)) out[k] = body[k];
    }
  }
  return out;
}

/* ---------------- FR-01 · Auth sederhana ---------------- */

function handleAuth_(params, body) {
  var email = String((body && body.email) || params.email || '')
    .trim()
    .toLowerCase();

  if (!isValidEmail_(email)) return fail_('Format email tidak valid.');

  var users = readObjects_('Users');
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].Email).toLowerCase() === email) {
      user = users[i];
      break;
    }
  }

  if (!user) {
    var name = email
      .split('@')[0]
      .split(/[._-]/)
      .map(function (w) {
        return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      })
      .join(' ');
    user = {
      ID: newId_('u'),
      Email: sanitize_(email, 100),
      Name: sanitize_(name, 100),
    };
    appendRow_('Users', { ID: user.ID, Email: user.Email, Name: user.Name });
  }

  return ok_({ id: String(user.ID), email: String(user.Email), name: String(user.Name) });
}

/* ---------------- FR-06 · Kategori ---------------- */

function listCategories_() {
  var rows = readObjects_('Categories');
  var out = rows.map(function (r) {
    return { id: String(r.ID), name: String(r.Name), icon: String(r.Icon) };
  });
  return ok_(out);
}

/* ---------------- FR-04 · Riwayat (terbaru dulu) ---------------- */

function listTransactions_(params) {
  var userId = String(params.userId || '');
  if (!userId) return fail_('Sesi pengguna tidak valid.');

  var rows = readObjects_('Transactions');
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.UserId) !== userId) continue;
    out.push({
      id: String(r.ID),
      userId: String(r.UserId),
      date: toISODate_(r.Date),
      type: String(r.Type),
      category: String(r.Category),
      amount: Number(r.Amount) || 0,
      note: String(r.Note || ''),
    });
  }

  out.sort(function (a, b) {
    if (a.date === b.date) return a.id < b.id ? 1 : -1;
    return a.date < b.date ? 1 : -1;
  });
  return ok_(out);
}

/* ---------------- FR-02 · Create transaksi ---------------- */

function createTransaction_(body) {
  var t = body || {};

  var userId = sanitize_(t.userId, 60);
  if (!userId) return fail_('Sesi pengguna tidak valid.');
  if (!userExists_(userId)) return fail_('Sesi pengguna tidak valid.');

  var amount = Number(t.amount);
  if (!isFinite(amount) || amount <= 0) return fail_('Nominal harus lebih dari 0.');

  var category = sanitize_(t.category, 50);
  if (!category) return fail_('Kategori wajib dipilih.');

  var date = String(t.date || '');
  if (!date) return fail_('Tanggal wajib diisi.');
  if (!isValidDate_(date)) return fail_('Tanggal wajib diisi.');

  var type = String(t.type || '');
  if (type !== 'in' && type !== 'out') return fail_('Tipe transaksi tidak valid.');

  var created = {
    ID: newId_('t'),
    UserId: userId,
    Date: date,
    Type: type,
    Category: category,
    Amount: Math.round(amount),
    Note: sanitize_(t.note, 200),
    CreatedAt: new Date().toISOString(),
  };
  appendRow_('Transactions', created);

  return ok_({
    id: created.ID,
    userId: created.UserId,
    date: created.Date,
    type: created.Type,
    category: created.Category,
    amount: created.Amount,
    note: created.Note,
  });
}

/* ---------------- US-07 · Hapus transaksi ---------------- */

function deleteTransaction_(params) {
  var id = String(params.id || '');
  var userId = String(params.userId || '');
  if (!id || !userId) return fail_('Transaksi tidak ditemukan.');

  var sh = getDb_().getSheetByName('Transactions');
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return fail_('Transaksi tidak ditemukan.');

  var values = sh.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id && String(values[i][1]) === userId) {
      sh.deleteRow(i + 2);
      return ok_({ deleted: true });
    }
  }
  return fail_('Transaksi tidak ditemukan.');
}
