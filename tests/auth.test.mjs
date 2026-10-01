import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear(),
};
const loc = { origin: 'https://ap.brikz.ai', pathname: '/contratos', search: '?a=1', hash: '' };
const replaced = [];
globalThis.window = { location: loc, history: { replaceState: (...a) => { replaced.push(a); } } };

const auth = await import('../src/auth/auth.ts');
const USER = { id: 1, name: 'Fulana', email: 'f@brikz.ai', cpf: '', fone_number: '', is_staff: false, is_superuser: false, is_active: true };

const json = (status, body = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let calls;
function mockFetch(route) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return route(String(url), init);
  };
}
const refreshCalls = () => calls.filter((c) => c.url.includes('/api/auth/refresh'));
const seed = () => auth.storeSession({ access: 'old', refresh: 'ref', user: USER });

beforeEach(() => {
  store.clear();
  loc.hash = '';
  replaced.length = 0;
});

test('login guarda a sessao com as chaves brikz.ap.auth.*', async () => {
  mockFetch(() => json(200, { access: 'a1', refresh: 'r1', user: USER }));
  const s = await auth.login('f@brikz.ai', 'segredo');
  assert.equal(s.access, 'a1');
  assert.equal(store.get('brikz.ap.auth.access'), 'a1');
  assert.equal(store.get('brikz.ap.auth.refresh'), 'r1');
  assert.equal(JSON.parse(store.get('brikz.ap.auth.user')).email, 'f@brikz.ai');
  assert.equal(auth.getSession().user.email, 'f@brikz.ai');
  assert.ok(calls[0].url.endsWith('/api/auth/login'));
});

test('login com erro lanca a mensagem do servidor e nao guarda sessao', async () => {
  mockFetch(() => json(401, { detail: 'Credenciais invalidas' }));
  await assert.rejects(() => auth.login('x', 'y'), /Credenciais invalidas/);
  assert.equal(auth.getSession(), null);
});

test('authFetch anexa o Bearer', async () => {
  seed();
  mockFetch(() => json(200));
  await auth.authFetch('https://api/x');
  assert.equal(new Headers(calls[0].init.headers).get('Authorization'), 'Bearer old');
});

test('401, refresh ok e repeticao ok', async () => {
  seed();
  mockFetch((url, init) => {
    if (url.includes('/api/auth/refresh')) return json(200, { access: 'new' });
    return new Headers(init.headers).get('Authorization') === 'Bearer new' ? json(200) : json(401);
  });
  const res = await auth.authFetch('https://api/x');
  assert.equal(res.status, 200);
  assert.equal(refreshCalls().length, 1);
  assert.equal(store.get('brikz.ap.auth.access'), 'new');
});

test('dois 401 simultaneos geram um unico refresh', async () => {
  seed();
  mockFetch(async (url, init) => {
    if (url.includes('/api/auth/refresh')) {
      await new Promise((r) => setTimeout(r, 10));
      return json(200, { access: 'new' });
    }
    return new Headers(init.headers).get('Authorization') === 'Bearer new' ? json(200) : json(401);
  });
  const rs = await Promise.all([auth.authFetch('https://api/a'), auth.authFetch('https://api/b')]);
  assert.deepEqual(rs.map((r) => r.status), [200, 200]);
  assert.equal(refreshCalls().length, 1);
});

test('refresh com 401 limpa a sessao e emite onSessionChange', async () => {
  seed();
  let changes = 0;
  const off = auth.onSessionChange(() => { changes++; });
  mockFetch((url) => (url.includes('/api/auth/refresh') ? json(401) : json(401)));
  const res = await auth.authFetch('https://api/x');
  off();
  assert.equal(res.status, 401);
  assert.equal(auth.getSession(), null);
  assert.ok(changes >= 1);
});

test('refresh com 500 ou rede fora nao limpa a sessao', async () => {
  seed();
  mockFetch((url) => (url.includes('/api/auth/refresh') ? json(500) : json(401)));
  const res = await auth.authFetch('https://api/x');
  assert.equal(res.status, 401);
  assert.equal(auth.getSession().access, 'old');
  mockFetch((url) => {
    if (url.includes('/api/auth/refresh')) throw new TypeError('Failed to fetch');
    return json(401);
  });
  await auth.authFetch('https://api/x');
  assert.equal(auth.getSession().access, 'old');
});

test('consumeLoginHash le e limpa o hash', () => {
  loc.hash = '#access=AAA&refresh=RRR';
  const t = auth.consumeLoginHash();
  assert.deepEqual(t, { access: 'AAA', refresh: 'RRR' });
  assert.equal(replaced.length, 1);
  assert.equal(replaced[0][2], '/contratos?a=1');
  loc.hash = '#outra=coisa';
  assert.equal(auth.consumeLoginHash(), null);
});

test('googleStartUrl inclui return_to com a origem', () => {
  const u = auth.googleStartUrl();
  assert.ok(u.includes('/api/auth/google/start?return_to=' + encodeURIComponent('https://ap.brikz.ai')));
});

test('requestPasswordReset envia return_to', async () => {
  mockFetch(() => json(200));
  await auth.requestPasswordReset('f@brikz.ai');
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: 'f@brikz.ai', return_to: 'https://ap.brikz.ai' });
});

test('fetchMe com access usa fetch cru com Bearer', async () => {
  mockFetch(() => json(200, USER));
  const me = await auth.fetchMe('tok');
  assert.equal(me.email, 'f@brikz.ai');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok');
});

test('nao sobrou DEV_JWT em src/', () => {
  const hits = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(n) && readFileSync(p, 'utf8').includes('DEV_JWT')) hits.push(p);
    }
  };
  walk('src');
  assert.deepEqual(hits, []);
});
