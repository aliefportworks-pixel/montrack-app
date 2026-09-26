const fs = require('fs');
const path = require('path');

let src = fs.readFileSync(
  path.join(__dirname, 'frontend', 'js', 'services', 'api.js'),
  'utf8'
);
src = src.replace('var USE_MOCK = true', 'var USE_MOCK = false');
src = src.replace(/var API_KEY = '[^']*'/, "var API_KEY = 'TESTKEY123'");

global.window = {};
global.navigator = { onLine: true };
const calls = [];
global.fetch = async (url, opts) => {
  calls.push({ url, method: (opts && opts.method) || 'GET', body: opts && opts.body });
  return { ok: true, json: async () => ({ success: true, data: [] }) };
};

eval(src);
const Api = global.window.Api;

(async () => {
  await Api.getCategories();
  await Api.getTransactions('u-1', 'tok-1');
  await Api.login('ayu@montrack.id', 'rahasia123');
  await Api.register('baru@montrack.id', 'rahasia123');
  await Api.changePassword('u-1', 'tok-1', 'rahasia123', 'barubanget1');
  await Api.createTransaction({
    userId: 'u-1',
    token: 'tok-1',
    type: 'out',
    category: 'Makanan',
    date: '2026-09-23',
    amount: 25000,
    note: 'x',
  });
  await Api.deleteTransaction('t-1', 'u-1', 'tok-1');
  await Api.logout('u-1', 'tok-1');

  const expect = [
    ['GET', '?action=categories&key=TESTKEY123', undefined],
    ['GET', '?action=transactions&userId=u-1&token=tok-1&key=TESTKEY123', undefined],
    /* password TIDAK pernah muncul di query — hanya body */
    [
      'POST',
      '?action=auth&email=ayu%40montrack.id&key=TESTKEY123',
      '{"email":"ayu@montrack.id","password":"rahasia123"}',
    ],
    [
      'POST',
      '?action=register&email=baru%40montrack.id&key=TESTKEY123',
      '{"email":"baru@montrack.id","password":"rahasia123"}',
    ],
    [
      'POST',
      '?action=change_password&userId=u-1&token=tok-1&key=TESTKEY123',
      '{"userId":"u-1","token":"tok-1","oldPassword":"rahasia123","newPassword":"barubanget1"}',
    ],
    [
      'POST',
      '?action=create_transaction&userId=u-1&type=out&category=Makanan&date=2026-09-23&amount=25000&note=x&token=tok-1&key=TESTKEY123',
      '{"userId":"u-1","token":"tok-1","type":"out","category":"Makanan","date":"2026-09-23","amount":25000,"note":"x"}',
    ],
    ['POST', '?action=delete_transaction&id=t-1&userId=u-1&token=tok-1&key=TESTKEY123', undefined],
    [
      'POST',
      '?action=logout&userId=u-1&token=tok-1&key=TESTKEY123',
      '{"userId":"u-1","token":"tok-1"}',
    ],
  ];

  let pass = calls.length === expect.length;
  for (let i = 0; i < expect.length; i++) {
    const [m, q, body] = expect[i];
    const c = calls[i];
    if (!c) {
      console.log('FAIL missing call', i);
      pass = false;
      continue;
    }
    const suffix = c.url.slice(c.url.indexOf('?'));
    if (c.method !== m || suffix !== q || (body !== undefined && c.body !== body)) {
      console.log('FAIL idx', i, JSON.stringify(c));
      pass = false;
    }
    if (c.url.indexOf('script.google.com/macros/s/') === -1) {
      console.log('FAIL base url idx', i, c.url);
      pass = false;
    }
  }

  /* jaminan ekstra: tidak ada nilai password yang bocor ke URL */
  const leaked = calls.filter((c) =>
    /password=|rahasia123|barubanget1/i.test(c.url)
  );
  if (leaked.length) {
    console.log('FAIL password bocor di query:', leaked.map((c) => c.url));
    pass = false;
  }

  console.log(pass ? 'LIVE_URL_TESTS_PASS' : 'LIVE_URL_TESTS_FAIL');
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
