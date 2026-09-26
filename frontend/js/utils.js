window.Utils = {
  rupiah: function (n) {
    var v = Number(n) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);
  },

  grouped: function (n) {
    var v = Number(n) || 0;
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v);
  },

  parseISO: function (iso) {
    var p = String(iso).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  },

  todayISO: function () {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  },

  dateLabel: function (iso) {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var d = Utils.parseISO(iso);
    var diff = Math.round((now - d) / 86400000);
    if (diff === 0) return 'Hari ini';
    if (diff === 1) return 'Kemarin';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  },

  shortDate: function (iso) {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(
      Utils.parseISO(iso)
    );
  },

  isValidEmail: function (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  },

  isValidPassword: function (password) {
    return String(password || '').length >= 8;
  },

  uid: function (prefix) {
    return (
      prefix +
      '-' +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6)
    );
  },

  totals: function (transactions) {
    var income = 0;
    var expense = 0;
    (transactions || []).forEach(function (t) {
      if (t.type === 'in') income += t.amount;
      else expense += t.amount;
    });
    return { income: income, expense: expense, balance: income - expense };
  },

  weekDays: function () {
    return ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  },

  /* ISO Senin minggu berjalan */
  weekStart: function () {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var shift = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - shift);
    return d;
  },

  /* Totals pengeluaran/pemasukan per hari Sen–Min minggu ini */
  weeklySeries: function (transactions, type) {
    var start = Utils.weekStart();
    var totals = [0, 0, 0, 0, 0, 0, 0];
    (transactions || []).forEach(function (t) {
      if (t.type !== type) return;
      var d = Utils.parseISO(t.date);
      var idx = Math.floor((d - start) / 86400000);
      if (idx >= 0 && idx < 7) totals[idx] += t.amount;
    });
    return totals;
  },

  byCategory: function (transactions, type) {
    var map = {};
    (transactions || []).forEach(function (t) {
      if (t.type !== type) return;
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.keys(map)
      .map(function (name) {
        return { name: name, amount: map[name] };
      })
      .sort(function (a, b) {
        return b.amount - a.amount;
      });
  },

  categoryIcon: function (categories, name) {
    var found = (categories || []).find(function (c) {
      return c.name === name;
    });
    return found ? found.icon : '➕';
  },
};
