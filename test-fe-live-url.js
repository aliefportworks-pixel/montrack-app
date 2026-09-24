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
  await Api.getTransactions('u-1');
  await Api.login('ayu@montrack.id');
  await Api.createTransaction({
    userId: 'u-1',
    type: 'out',
    category: 'Makanan',
    date: '2026-09-23',
    amount: 25000,
    note: 'x',
  });
  await Api.deleteTransaction('t-1', 'u-1');

  const expect = [
    ['GET', '?action=categories&key=TESTKEY123', undefined],
    ['GET', '?action=transactions&userId=u-1&key=TESTKEY123', undefined],
    ['POST', '?action=auth&email=ayu%40montrack.id&key=TESTKEY123', '{"email":"ayu@montrack.id"}'],
    [
      'POST',
      '?action=create_transaction&userId=u-1&type=out&category=Makanan&date=2026-09-23&amount=25000&note=x&key=TESTKEY123',
      '{"userId":"u-1","type":"out","category":"Makanan","date":"2026-09-23","amount":25000,"note":"x"}',
    ],
    ['POST', '?action=delete_transaction&id=t-1&userId=u-1&key=TESTKEY123', undefined],
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

  console.log(pass ? 'LIVE_URL_TESTS_PASS' : 'LIVE_URL_TESTS_FAIL');
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
