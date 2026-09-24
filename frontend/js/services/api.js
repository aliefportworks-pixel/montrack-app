/*
 * API service layer — native fetch (larangan: Axios/jQuery).
 * Format respons backend (wajib 1:1 dengan mock):
 *   sukses : { success: true,  data: <payload> }
 *   gagal  : { success: false, message: <string> }
 *
 * Mock (USE_MOCK=true) memakai path:
 *   POST /auth, GET /categories, GET/POST /transactions, DELETE /transactions
 *
 * Live GAS di-call dengan query (?action=...&key=...):
 *   GET  ?action=categories
 *   GET  ?action=transactions&userId=...
 *   POST ?action=auth                + email ikut di query & body
 *   POST ?action=create_transaction   + field ikut di query & body
 *   POST ?action=delete_transaction&id=...&userId=...
 * Field data selalu disertakan di query: redirect 302 GAS kadang menurunkan
 * POST→GET dan membuang body — BE menerima action di GET/POST dan merge
 * query+body, jadi request tetap utuh meski body hilang.
 * Catatan GAS: hanya GET/POST (DELETE dikonversi ke POST), body JSON dikirim
 * tanpa header Content-Type (request sederhana → tanpa preflight CORS),
 * API key via query (header kustom juga memicu preflight), respons selalu 200
 * → cek payload.success, JSON bukan-HTML ditangani sebagai gagal.
 *
 * Catatan: sajikan FE via HTTP (firebase serve / npx serve / clasp).
 * Membuka index.html via file:// memblokir fetch mock data.
 */
(function () {
  var USE_MOCK = true;
  var API_BASE =
    'https://script.google.com/macros/s/AKfycbw-TVXZP85v1QW--6vZ6Gk_8K1iNbhANWEeB69Z1mPqkoUdAzHQsadtC_KtTq3taqxc/exec';
  var API_KEY = '94a0f2417c1141fc8d74a8617bc7becb';

  var NETWORK_MSG = 'Gagal menyimpan data. Periksa koneksi Anda.';
  var BAD_RESPONSE_MSG = 'Permintaan gagal. Coba lagi.';

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  var CREATE_FIELDS = ['userId', 'type', 'category', 'date', 'amount', 'note'];

  function toLiveAction(path, method, body) {
    var url = new URL(path, 'http://montrack.local');
    var p = url.pathname.replace(/\/$/, '');
    var action;
    var extra = '';

    if (method === 'DELETE' && p === '/transactions') {
      action = 'delete_transaction';
      method = 'POST';
    } else if (p === '/auth') {
      action = 'auth';
      if (body && body.email != null) {
        extra += '&email=' + encodeURIComponent(String(body.email));
      }
    } else if (p === '/categories') {
      action = 'categories';
    } else if (p === '/transactions') {
      if (method === 'POST') {
        action = 'create_transaction';
        for (var i = 0; i < CREATE_FIELDS.length; i++) {
          var f = CREATE_FIELDS[i];
          if (body && body[f] != null) {
            extra += '&' + f + '=' + encodeURIComponent(String(body[f]));
          }
        }
      } else {
        action = 'transactions';
      }
    } else {
      action = p.replace(/^\//, '');
    }

    var qs = '';
    if (url.search) qs = '&' + url.search.slice(1);
    var query =
      '?action=' + encodeURIComponent(action) + qs + extra +
      (API_KEY ? '&key=' + encodeURIComponent(API_KEY) : '');

    return { url: API_BASE + query, method: method };
  }

  async function request(path, options) {
    options = options || {};
    if (USE_MOCK) return mockRequest(path, options.method || 'GET', options.body);

    try {
      var live = toLiveAction(path, options.method || 'GET', options.body);
      var res = await fetch(live.url, {
        method: live.method,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      var payload = await res.json();
      if (!res.ok || payload.success === false) {
        throw new Error(payload.message || BAD_RESPONSE_MSG);
      }
      return payload;
    } catch (err) {
      if (err instanceof TypeError) throw new Error(NETWORK_MSG);
      if (err instanceof SyntaxError) throw new Error(BAD_RESPONSE_MSG);
      throw err;
    }
  }

  /* ---------------- Mock (format identik dgn backend) ---------------- */

  function db() {
    return window.MOCK_DATA;
  }

  function fail(message) {
    return { success: false, message: message };
  }

  function ok(data) {
    return { success: true, data: data };
  }

  function sortDesc(list) {
    return list.slice().sort(function (a, b) {
      if (a.date === b.date) return String(b.id).localeCompare(String(a.id));
      return a.date < b.date ? 1 : -1;
    });
  }

  async function mockRequest(path, method, body) {
    await delay(300);

    if (navigator.onLine === false) {
      var offline = fail(NETWORK_MSG);
      var errOffline = new Error(offline.message);
      errOffline.payload = offline;
      throw errOffline;
    }

    var url = new URL(path, 'http://mock.local');
    var pathname = url.pathname.replace(/\/$/, '');

    var result;
    if (method === 'POST' && pathname === '/auth') {
      var email = String((body && body.email) || '').trim().toLowerCase();
      if (!Utils.isValidEmail(email)) {
        result = fail('Format email tidak valid.');
      } else {
        var user = db().users.find(function (u) {
          return u.email === email;
        });
        if (!user) {
          var name = email
            .split('@')[0]
            .split(/[._-]/)
            .map(function (w) {
              return w.charAt(0).toUpperCase() + w.slice(1);
            })
            .join(' ');
          user = { id: Utils.uid('u'), email: email, name: name };
          db().users.push(user);
        }
        result = ok(user);
      }
    } else if (method === 'GET' && pathname === '/categories') {
      result = ok(db().categories);
    } else if (method === 'GET' && pathname === '/transactions') {
      var userId = url.searchParams.get('userId');
      result = ok(
        sortDesc(
          db().transactions.filter(function (t) {
            return t.userId === userId;
          })
        )
      );
    } else if (method === 'POST' && pathname === '/transactions') {
      var t = body || {};
      if (!t.userId) result = fail('Sesi pengguna tidak valid.');
      else if (!(Number(t.amount) > 0)) result = fail('Nominal harus lebih dari 0.');
      else if (!t.category) result = fail('Kategori wajib dipilih.');
      else if (!t.date) result = fail('Tanggal wajib diisi.');
      else if (t.type !== 'in' && t.type !== 'out') result = fail('Tipe transaksi tidak valid.');
      else {
        var created = {
          id: Utils.uid('t'),
          userId: t.userId,
          date: t.date,
          type: t.type,
          category: t.category,
          amount: Math.round(Number(t.amount)),
          note: String(t.note || '').slice(0, 200),
        };
        db().transactions.push(created);
        result = ok(created);
      }
    } else if (method === 'DELETE' && pathname === '/transactions') {
      var id = url.searchParams.get('id');
      var uid = url.searchParams.get('userId');
      var idx = db().transactions.findIndex(function (x) {
        return x.id === id && x.userId === uid;
      });
      if (idx === -1) result = fail('Transaksi tidak ditemukan.');
      else {
        db().transactions.splice(idx, 1);
        result = ok({ deleted: true });
      }
    } else {
      result = fail('Endpoint tidak dikenal: ' + method + ' ' + path);
    }

    if (result.success === false) {
      var e = new Error(result.message);
      e.payload = result;
      throw e;
    }
    return result;
  }

  window.Api = {
    USE_MOCK: USE_MOCK,
    login: function (email) {
      return request('/auth', { method: 'POST', body: { email: email } });
    },
    getCategories: function () {
      return request('/categories');
    },
    getTransactions: function (userId) {
      return request('/transactions?userId=' + encodeURIComponent(userId));
    },
    createTransaction: function (payload) {
      return request('/transactions', { method: 'POST', body: payload });
    },
    deleteTransaction: function (id, userId) {
      return request(
        '/transactions?id=' +
          encodeURIComponent(id) +
          '&userId=' +
          encodeURIComponent(userId),
        { method: 'DELETE' }
      );
    },
  };
})();
