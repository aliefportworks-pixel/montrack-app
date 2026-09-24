/**
 * Validasi & sanitasi input sisi server (PRD §7 Security).
 * Pesan error IDENTIK dengan mock FE supaya UX konsisten.
 */

function isValidEmail_(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidDate_(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  var p = v.split('-');
  var y = Number(p[0]);
  var m = Number(p[1]);
  var d = Number(p[2]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  var probe = new Date(y, m - 1, d);
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d;
}

/**
 * Buang kontrol char, batasi panjang, dan cegah formula injection ke Sheets
 * (nilai yang diawali =, +, -, @, tab, CR diberi prefix apostrof).
 */
function sanitize_(value, maxLen) {
  var s = String(value === null || value === undefined ? '' : value);
  s = s.replace(/[\u0000-\u001F\u007F]/g, '');
  s = s.slice(0, maxLen || 200);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

/** ISO 'YYYY-MM-DD' dari string biasa atau objek Date Sheets. */
function toISODate_(v) {
  if (v instanceof Date) {
    var m = String(v.getMonth() + 1).padStart(2, '0');
    var d = String(v.getDate()).padStart(2, '0');
    return v.getFullYear() + '-' + m + '-' + d;
  }
  var s = String(v || '');
  var match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s;
}

function newId_(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}
