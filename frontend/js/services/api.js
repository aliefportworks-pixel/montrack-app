/*
 * API service layer — native fetch (larangan: Axios/jQuery).
 * Format respons backend (wajib 1:1 dengan mock):
 *   sukses : { success: true,  data: <payload> }
 *   gagal  : { success: false, message: <string> }
 *
 * Mock (USE_MOCK=true) memakai path:
 *   POST /auth, /register, /logout, /change_password,
 *   GET /categories, GET/POST /transactions, DELETE /transactions
 *
 * Live GAS di-call dengan query (?action=...&key=...):
 *   GET  ?action=categories
 *   GET  ?action=transactions&userId=...&token=...
 *   POST ?action=auth|register        + email ikut di query & body
 *   POST ?action=logout               + userId&token ikut di query & body
 *   POST ?action=change_password      + userId&token ikut di query (password HANYA body)
 *   POST ?action=create_transaction   + field ikut di query & body (termasuk token)
 *   POST ?action=delete_transaction&id=...&userId=...&token=...
 * Field data selalu disertakan di query: redirect 302 GAS kadang menurunkan
 * POST→GET dan membuang body — BE menerima action di GET/POST dan merge
 * query+body, jadi request tetap utuh meski body hilang.
 *
 * ATURAN PASSWORD (AGENTS.md §2.5): password/oldPassword/newPassword TIDAK
 * PERNAH dikirim di query (bocor ke log & URL) — hanya body JSON. Konsekuensi:
 * bila redirect GAS membuang body, BE membalas 'Password wajib diisi.' /
 * respons non-JSON → request auth|register|change_password di-retry 1×.
 * Register juga fallback ke login bila balasan 'Email sudah terdaftar.'
 * (eksekusi dahulu-respons-hilang khas GAS → registrasi tetap idempoten).
 *
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

  var CREATE_FIELDS = ['userId', 'type', 'category', 'date', 'amount', 'note', 'token'];
  var SESSION_FIELDS = ['userId', 'token'];

  function appendField(extra, name, value) {
    if (value == null) return extra;
    return extra + '&' + name + '=' + encodeURIComponent(String(value));
  }

  function toLiveAction(path, method, body) {
    var url = new URL(path, 'http://montrack.local');
    var p = url.pathname.replace(/\/$/, '');
    var action;
    var extra = '';

    if (method === 'DELETE' && p === '/transactions') {
      action = 'delete_transaction';
      method = 'POST';
    } else if (p === '/auth' || p === '/register') {
      action = p.replace(/^\//, '');
      if (body && body.email != null) extra = appendField(extra, 'email', body.email);
    } else if (p === '/logout' || p === '/change_password') {
      action = p.replace(/^\//, '');
      for (var s = 0; s < SESSION_FIELDS.length; s++) {
        extra = appendField(extra, SESSION_FIELDS[s], body && body[SESSION_FIELDS[s]]);
      }
    } else if (p === '/categories') {
      action = 'categories';
    } else if (p === '/transactions') {
      if (method === 'POST') {
        action = 'create_transaction';
        for (var i = 0; i < CREATE_FIELDS.length; i++) {
          var f = CREATE_FIELDS[i];
          if (body && body[f] != null) {
            extra = appendField(extra, f, body[f]);
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

    return { url: API_BASE + query, method: method, action: action };
  }

  /* Auth flow: password hanya di body — retry bila body dibuang / respons bukan JSON */
  var RETRY_ACTIONS = { auth: 1, register: 1, change_password: 1 };

  async function request(path, options) {
    options = options || {};
    if (USE_MOCK) return mockRequest(path, options.method || 'GET', options.body);

    var live = toLiveAction(path, options.method || 'GET', options.body);
    var attempts = RETRY_ACTIONS[live.action] ? 2 : 1;

    for (var attempt = 0; attempt < attempts; attempt++) {
      try {
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
        var retryable =
          err instanceof TypeError ||
          err instanceof SyntaxError ||
          err.message === 'Password wajib diisi.';
        if (attempt < attempts - 1 && retryable) continue;
        if (err instanceof TypeError) throw new Error(NETWORK_MSG);
        if (err instanceof SyntaxError) throw new Error(BAD_RESPONSE_MSG);
        throw err;
      }
    }
    throw new Error(BAD_RESPONSE_MSG);
  }

  /* ---------------- Mock (format identik dgn backend) ---------------- */

  /*
   * Mock dipersist ke localStorage (browser saja — di Node test tidak ada
   * localStorage → seed segar tiap run). Tanpa ini, akun hasil daftar hilang
   * saat reload dan user tidak bisa masuk lagi.
   */
  var MOCK_STORE_KEY = 'montrack_mock_v2';
  var mockLoaded = false;

  function restoreMockDb() {
    try {
      if (typeof localStorage === 'undefined') return;
      var raw = localStorage.getItem(MOCK_STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && saved.users && saved.categories && saved.transactions) {
        window.MOCK_DATA.users = saved.users;
        window.MOCK_DATA.categories = saved.categories;
        window.MOCK_DATA.transactions = saved.transactions;
      }
    } catch (e) {
      /* data korup / storage di-block → pakai seed dari data.js */
    }
  }

  function persistMockDb() {
    try {
      if (typeof localStorage === 'undefined') return;
      var d = window.MOCK_DATA;
      localStorage.setItem(
        MOCK_STORE_KEY,
        JSON.stringify({ users: d.users, categories: d.categories, transactions: d.transactions })
      );
    } catch (e) {
      /* storage penuh/di-block — mock tetap jalan di memori */
    }
  }

  function db() {
    if (!mockLoaded) {
      mockLoaded = true;
      restoreMockDb();
    }
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

  var TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; /* 30 hari — sama dgn BE */

  function mockToken() {
    var hex = '';
    for (var i = 0; i < 32; i++) hex += Math.floor(Math.random() * 16).toString(16);
    return hex;
  }

  function findMockUser(email) {
    return db().users.find(function (u) {
      return u.email === email;
    });
  }

  function findMockUserById(userId) {
    return db().users.find(function (u) {
      return u.id === userId;
    });
  }

  function issueMockToken(user) {
    user.token = mockToken();
    user.tokenExpires = Date.now() + TOKEN_TTL_MS;
    return user.token;
  }

  function mockAuthPayload(user) {
    return { id: user.id, email: user.email, name: user.name, token: user.token };
  }

  /* Cerminan requireSession_ BE: token cocok + belum kedaluwarsa */
  function mockSessionValid(userId, token) {
    var user = findMockUserById(userId);
    if (!user || !token || !user.token || user.token !== token) return false;
    if (!user.tokenExpires || Date.now() > user.tokenExpires) return false;
    return true;
  }

  function deriveName(email) {
    return email
      .split('@')[0]
      .split(/[._-]/)
      .map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
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
      var password = body && body.password != null ? String(body.password) : '';
      if (!Utils.isValidEmail(email)) result = fail('Format email tidak valid.');
      else if (!password) result = fail('Password wajib diisi.');
      else {
        var found = findMockUser(email);
        if (!found || !found.password || found.password !== password) {
          result = fail(
            found && !found.password
              ? 'Akun ini belum diatur password. Silakan daftar ulang.'
              : 'Email atau password salah.'
          );
        } else {
          issueMockToken(found);
          result = ok(mockAuthPayload(found));
        }
      }
    } else if (method === 'POST' && pathname === '/register') {
      var regEmail = String((body && body.email) || '').trim().toLowerCase();
      var regPassword = body && body.password != null ? String(body.password) : '';
      if (!Utils.isValidEmail(regEmail)) result = fail('Format email tidak valid.');
      else if (!regPassword) result = fail('Password wajib diisi.');
      else if (regPassword.length < 8) result = fail('Password minimal 8 karakter.');
      else {
        var existing = findMockUser(regEmail);
        if (existing && existing.password) {
          result = fail('Email sudah terdaftar.');
        } else if (existing) {
          /* Legacy tanpa password: pakai ulang ID & data lama */
          existing.password = regPassword;
          issueMockToken(existing);
          result = ok(mockAuthPayload(existing));
        } else {
          var newUser = {
            id: Utils.uid('u'),
            email: regEmail,
            name: deriveName(regEmail),
            password: regPassword,
          };
          db().users.push(newUser);
          issueMockToken(newUser);
          result = ok(mockAuthPayload(newUser));
        }
      }
    } else if (method === 'POST' && pathname === '/logout') {
      var outUser = findMockUserById((body && body.userId) || '');
      if (!outUser || !body || !mockSessionValid(body.userId, body.token)) {
        result = fail('Sesi pengguna tidak valid.');
      } else {
        outUser.token = '';
        outUser.tokenExpires = 0;
        result = ok({ loggedOut: true });
      }
    } else if (method === 'POST' && pathname === '/change_password') {
      var chUser = findMockUserById((body && body.userId) || '');
      var oldPassword = body && body.oldPassword != null ? String(body.oldPassword) : '';
      var newPassword = body && body.newPassword != null ? String(body.newPassword) : '';
      if (!chUser || !body || !mockSessionValid(body.userId, body.token)) {
        result = fail('Sesi pengguna tidak valid.');
      } else if (!oldPassword || !newPassword) result = fail('Password wajib diisi.');
      else if (newPassword.length < 8) result = fail('Password minimal 8 karakter.');
      else if (chUser.password !== oldPassword) result = fail('Password lama salah.');
      else {
        chUser.password = newPassword;
        result = ok(mockAuthPayload(chUser));
      }
    } else if (method === 'GET' && pathname === '/categories') {
      result = ok(db().categories);
    } else if (method === 'GET' && pathname === '/transactions') {
      var userId = url.searchParams.get('userId');
      var token = url.searchParams.get('token');
      if (!mockSessionValid(userId, token)) result = fail('Sesi pengguna tidak valid.');
      else {
        result = ok(
          sortDesc(
            db().transactions.filter(function (t) {
              return t.userId === userId;
            })
          )
        );
      }
    } else if (method === 'POST' && pathname === '/transactions') {
      var t = body || {};
      if (!mockSessionValid(t.userId, t.token)) result = fail('Sesi pengguna tidak valid.');
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
      var delToken = url.searchParams.get('token');
      if (!id || !uid) result = fail('Transaksi tidak ditemukan.');
      else if (!mockSessionValid(uid, delToken)) result = fail('Sesi pengguna tidak valid.');
      else {
        var idx = db().transactions.findIndex(function (x) {
          return x.id === id && x.userId === uid;
        });
        if (idx === -1) result = fail('Transaksi tidak ditemukan.');
        else {
          db().transactions.splice(idx, 1);
          result = ok({ deleted: true });
        }
      }
    } else {
      result = fail('Endpoint tidak dikenal: ' + method + ' ' + path);
    }

    persistMockDb(); /* simpan mutasi (login/register/transaksi) agar reload tidak hilang */

    if (result.success === false) {
      var e = new Error(result.message);
      e.payload = result;
      throw e;
    }
    return result;
  }

  window.Api = {
    USE_MOCK: USE_MOCK,
    login: function (email, password) {
      return request('/auth', { method: 'POST', body: { email: email, password: password } });
    },
    register: function (email, password) {
      var creds = { email: email, password: password };
      return request('/register', { method: 'POST', body: creds }).catch(function (err) {
        /* GAS bisa mengeksekusi register lalu membalas 404/HTML → jawaban berikutnya
         * 'Email sudah terdaftar.' — kalau password cocok, berarti registrasi SUKSES. */
        if (err.message !== 'Email sudah terdaftar.') throw err;
        return request('/auth', { method: 'POST', body: creds }).catch(function () {
          throw err;
        });
      });
    },
    logout: function (userId, token) {
      return request('/logout', { method: 'POST', body: { userId: userId, token: token } });
    },
    changePassword: function (userId, token, oldPassword, newPassword) {
      return request('/change_password', {
        method: 'POST',
        body: { userId: userId, token: token, oldPassword: oldPassword, newPassword: newPassword },
      });
    },
    getCategories: function () {
      return request('/categories');
    },
    getTransactions: function (userId, token) {
      return request(
        '/transactions?userId=' +
          encodeURIComponent(userId) +
          '&token=' +
          encodeURIComponent(token || '')
      );
    },
    createTransaction: function (payload) {
      return request('/transactions', { method: 'POST', body: payload });
    },
    deleteTransaction: function (id, userId, token) {
      return request(
        '/transactions?id=' +
          encodeURIComponent(id) +
          '&userId=' +
          encodeURIComponent(userId) +
          '&token=' +
          encodeURIComponent(token || ''),
        { method: 'DELETE' }
      );
    },
  };
})();
