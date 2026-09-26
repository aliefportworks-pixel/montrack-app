/* Global app state + actions. Diakses komponen via this.store / this.actions. */
(function () {
  var STORAGE_KEY = 'montrack_session';

  var store = Vue.reactive({
    user: null,
    route: { path: '/login', query: {} },
    categories: [],
    transactions: [],
    loading: false,
    toast: null, // { message, type }
    showBalance: true,
    confirm: null, // { message, confirmLabel, onConfirm }
    stats: { income: 0, expense: 0, balance: 0 },
  });

  var toastTimer = null;

  function recomputeStats() {
    store.stats = Utils.totals(store.transactions);
  }

  function persistSession() {
    try {
      if (store.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(store.user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* storage penuh/di-block — sesi tetap jalan di memori */
    }
  }

  function restoreSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) store.user = JSON.parse(raw);
    } catch (e) {
      store.user = null;
    }
  }

  function parseRoute() {
    var hash = window.location.hash.slice(1) || '/';
    var parts = hash.split('?');
    var path = parts[0] || '/';
    if (path.length > 1 && path.slice(-1) === '/') path = path.slice(0, -1);
    var query = {};
    if (parts[1]) {
      new URLSearchParams(parts[1]).forEach(function (v, k) {
        query[k] = v;
      });
    }
    return { path: path || '/', query: query };
  }

  function navigate(path) {
    window.location.hash = path;
  }

  /* Rute yang boleh dikunjungi tanpa sesi login */
  function isPublicPath(path) {
    return path === '/login' || path === '/daftar';
  }

  /* Token tidak ada/kedaluwarsa (BE membalas 'Sesi pengguna tidak valid.') → paksa logout */
  function handleSessionError(err) {
    if (err && err.message === 'Sesi pengguna tidak valid.') {
      actions.showToast('Sesi berakhir. Silakan masuk kembali.', 'error');
      actions.logout();
      return true;
    }
    return false;
  }

  var actions = {
    showToast: function (message, type) {
      store.toast = { message: message, type: type || 'success' };
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        store.toast = null;
      }, 3000); // FR-05: toast tampil 3 detik
    },

    askConfirm: function (options) {
      store.confirm = {
        message: options.message,
        confirmLabel: options.confirmLabel || 'Hapus',
        onConfirm: options.onConfirm,
      };
    },

    closeConfirm: function () {
      store.confirm = null;
    },

    toggleBalance: function () {
      store.showBalance = !store.showBalance;
    },

    login: async function (email, password) {
      var res = await Api.login(email, password);
      store.user = res.data;
      persistSession();
      await actions.loadData();
      navigate('/');
      return res.data;
    },

    register: async function (email, password) {
      var res = await Api.register(email, password);
      store.user = res.data;
      persistSession();
      await actions.loadData();
      navigate('/');
      return res.data;
    },

    changePassword: async function (oldPassword, newPassword) {
      var res = await Api.changePassword(
        store.user.id,
        store.user.token,
        oldPassword,
        newPassword
      );
      store.user = res.data;
      persistSession();
      return res.data;
    },

    logout: function () {
      var u = store.user;
      if (u && u.token) {
        /* cabut token di server (fire-and-forget; token mati/kadaluarsa → abaikan) */
        Api.logout(u.id, u.token).catch(function () {});
      }
      store.user = null;
      store.transactions = [];
      store.categories = [];
      recomputeStats();
      persistSession();
      navigate('/login');
    },

    loadData: async function () {
      if (!store.user) return;
      store.loading = true;
      try {
        var results = await Promise.all([
          Api.getCategories(),
          Api.getTransactions(store.user.id, store.user.token),
        ]);
        store.categories = results[0].data;
        store.transactions = results[1].data;
        recomputeStats();
      } catch (err) {
        if (!handleSessionError(err)) actions.showToast(err.message || 'Gagal memuat data.', 'error');
      } finally {
        store.loading = false;
      }
    },

    saveTransaction: async function (payload) {
      payload.userId = store.user.id;
      payload.token = store.user.token;
      try {
        var res = await Api.createTransaction(payload);
        store.transactions = [res.data].concat(
          store.transactions.filter(function (t) {
            return t.id !== res.data.id;
          })
        );
        recomputeStats();
        return res.data;
      } catch (err) {
        handleSessionError(err);
        throw err;
      }
    },

    removeTransaction: async function (id) {
      try {
        await Api.deleteTransaction(id, store.user.id, store.user.token);
      } catch (err) {
        handleSessionError(err);
        throw err;
      }
      store.transactions = store.transactions.filter(function (t) {
        return t.id !== id;
      });
      recomputeStats();
    },

    bootstrap: function () {
      restoreSession();
      store.route = parseRoute();
      if (!store.user && !isPublicPath(store.route.path)) {
        navigate('/login');
        store.route = parseRoute();
      }
      if (store.user && isPublicPath(store.route.path)) {
        navigate('/');
        store.route = parseRoute();
      }
      if (store.user) actions.loadData();
    },
  };

  window.addEventListener('hashchange', function () {
    var next = parseRoute();
    if (!store.user && !isPublicPath(next.path)) {
      navigate('/login');
      return;
    }
    if (store.user && isPublicPath(next.path)) {
      navigate('/');
      return;
    }
    store.route = next;
  });

  window.store = store;
  window.actions = actions;
})();
