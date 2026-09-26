/**
 * Auth: hash password, session token, validasi sesi.
 * - Password disimpan TIDAK PERNAH plaintext: `<salt>$<sha256hex(salt+password)>`.
 * - Token acak 32 hex, berlaku 30 hari, disimpan di kolom Token/TokenExpiresAt
 *   (epoch millis number — aman dari koersi Sheets jadi Date).
 */

var TOKEN_TTL_MS_ = 30 * 24 * 60 * 60 * 1000; /* 30 hari */

function toHex_(bytes) {
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i];
    if (b < 0) b += 256;
    out += (b < 16 ? '0' : '') + b.toString(16);
  }
  return out;
}

function sha256Hex_(text) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text),
    Utilities.Charset.UTF_8
  );
  return toHex_(bytes);
}

function hashPassword_(password, salt) {
  return salt + '$' + sha256Hex_(salt + String(password));
}

function verifyPassword_(password, stored) {
  stored = String(stored || '');
  if (!stored || stored.indexOf('$') === -1) return false;
  var salt = stored.split('$')[0];
  return hashPassword_(password, salt) === stored;
}

function newToken_() {
  return Utilities.getUuid().replace(/-/g, '');
}

function newSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}

function sessionExpired_(user) {
  var exp = Number(user && user.TokenExpiresAt);
  if (!isFinite(exp) || exp <= 0) return true;
  return Date.now() > exp;
}

/**
 * Guard untuk semua endpoint data (transactions).
 * Pesan identik mock FE: 'Sesi pengguna tidak valid.'
 */
function requireSession_(userId, token) {
  if (!userId || !token) return false;
  var users = readObjects_('Users');
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (String(u.ID) !== String(userId)) continue;
    if (!u.Token || String(u.Token) !== String(token)) return false;
    if (sessionExpired_(u)) return false;
    return true;
  }
  return false;
}

/** Terbitkan token baru untuk user (overwrite token lama). */
function issueToken_(userId) {
  var token = newToken_();
  updateObject_('Users', 'ID', userId, {
    Token: token,
    TokenExpiresAt: String(Date.now() + TOKEN_TTL_MS_),
  });
  return token;
}

/** Cabut token (logout). */
function clearToken_(userId) {
  updateObject_('Users', 'ID', userId, { Token: '', TokenExpiresAt: '' });
}

/** Payload sukses auth — format identik mock FE. */
function authPayload_(user, token) {
  return {
    id: String(user.ID),
    email: String(user.Email),
    name: String(user.Name),
    token: String(token),
  };
}
