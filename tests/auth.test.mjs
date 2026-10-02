import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Ambiente minimo de browser para o auth.ts (sem DOM).
const loc = { origin: 'https://ap.brikz.ai', pathname: '/', search: '' };
const replaced = [];
globalThis.window = {
  location: loc,
  history: { replaceState: (_s, _t, url) => { replaced.push(url); } },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
};

const auth = await import('../src/auth/auth.ts');

// Usuario do oidc-client-ts reduzido ao que o auth.ts le.
const usuario = (access, extra = {}) => ({
  access_token: access,
  expired: false,
  profile: { sub: 'u-1', name: 'Fulana', email: 'f@brikz.ai' },
  ...extra,
});

// Gerenciador falso: registra as chamadas e devolve o que cada teste pedir.
function falso(opcoes = {}) {
  const chamadas = [];
  const ouvintes = { loaded: [], unloaded: [] };
  const g = {
    chamadas,
    guardado: opcoes.guardado ?? null,
    renovado: opcoes.renovado ?? null,
    events: {
      addUserLoaded: (cb) => ouvintes.loaded.push(cb),
      addUserUnloaded: (cb) => ouvintes.unloaded.push(cb),
    },
    async getUser() { chamadas.push(['getUser']); return g.guardado; },
    async signinRedirect(args) { chamadas.push(['signinRedirect', args]); },
    async signinRedirectCallback() {
      chamadas.push(['signinRedirectCallback']);
      if (opcoes.callbackFalha) throw new Error('code invalido');
      return opcoes.callback;
    },
    async signinSilent() {
      chamadas.push(['signinSilent']);
      if (!g.renovado) throw new Error('refresh recusado');
      return g.renovado;
    },
    async signoutRedirect() { chamadas.push(['signoutRedirect']); },
    async removeUser() { chamadas.push(['removeUser']); ouvintes.unloaded.forEach((cb) => cb()); },
  };
  auth.usarGerenciador(g);
  return g;
}

let fetches;
function mockFetch(respostas) {
  fetches = [];
  globalThis.fetch = async (url, init) => {
    fetches.push({ url: String(url), auth: new Headers(init?.headers).get('Authorization') });
    return new Response('{}', { status: respostas.shift() ?? 200 });
  };
}

beforeEach(() => {
  loc.pathname = '/';
  loc.search = '';
  replaced.length = 0;
});

test('configuracao padrao aponta para o realm ap e o client ap-console', () => {
  assert.equal(auth.KEYCLOAK_ISSUER, 'https://auth.brikz.ai/realms/ap');
  assert.equal(auth.KEYCLOAK_CLIENT_ID, 'ap-console');
});

test('Entrar com Google vai direto ao Google (kc_idp_hint)', async () => {
  const g = falso();
  await auth.entrar({ google: true, voltar: '/contratos?a=1' });
  const [, args] = g.chamadas.find((c) => c[0] === 'signinRedirect');
  assert.deepEqual(args.extraQueryParams, { kc_idp_hint: 'google' });
  assert.equal(args.login_hint, undefined);
  assert.deepEqual(args.state, { voltar: '/contratos?a=1' });
});

test('e-mail segue como login_hint, normalizado', async () => {
  const g = falso();
  await auth.entrar({ email: '  Fulana@Empresa.COM ' });
  const [, args] = g.chamadas.find((c) => c[0] === 'signinRedirect');
  assert.equal(args.login_hint, 'fulana@empresa.com');
  assert.equal(args.extraQueryParams, undefined);
});

test('voltarSeguro so aceita caminho interno', () => {
  assert.equal(auth.voltarSeguro('/contratos?x=1'), '/contratos?x=1');
  for (const ruim of [null, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/login', '/login?voltar=/x', '/auth/callback?code=1']) {
    assert.equal(auth.voltarSeguro(ruim), '/', String(ruim));
  }
});

test('boot sem sessao guardada fica deslogado', async () => {
  falso();
  assert.deepEqual(await auth.iniciarSessao(), { erro: null });
  assert.equal(auth.getSession(), null);
});

test('boot recupera a sessao guardada', async () => {
  falso({ guardado: usuario('tok-1') });
  await auth.iniciarSessao();
  const s = auth.getSession();
  assert.equal(s.access, 'tok-1');
  assert.deepEqual(s.user, { id: 'u-1', name: 'Fulana', email: 'f@brikz.ai' });
});

test('boot com access token vencido renova em silencio', async () => {
  const g = falso({ guardado: usuario('velho', { expired: true }), renovado: usuario('novo') });
  await auth.iniciarSessao();
  assert.ok(g.chamadas.some((c) => c[0] === 'signinSilent'));
  assert.equal(auth.getSession().access, 'novo');
});

test('boot no /auth/callback troca o code e volta para a rota pedida', async () => {
  loc.pathname = '/auth/callback';
  falso({ callback: usuario('tok-cb', { state: { voltar: '/agenda' } }) });
  await auth.iniciarSessao();
  assert.equal(auth.getSession().access, 'tok-cb');
  assert.deepEqual(replaced, ['/agenda']);
});

test('callback com erro volta ao /login com mensagem', async () => {
  loc.pathname = '/auth/callback';
  falso({ callbackFalha: true });
  const r = await auth.iniciarSessao();
  assert.match(r.erro, /Não foi possível entrar/);
  assert.deepEqual(replaced, ['/login']);
  assert.equal(auth.getSession(), null);
});

test('authFetch manda o access token do Keycloak no Bearer', async () => {
  falso({ guardado: usuario('tok-1') });
  await auth.iniciarSessao();
  mockFetch([200]);
  const res = await auth.authFetch('https://contratos/api');
  assert.equal(res.status, 200);
  assert.deepEqual(fetches, [{ url: 'https://contratos/api', auth: 'Bearer tok-1' }]);
});

test('authFetch em 401 renova uma vez e repete com o token novo', async () => {
  const g = falso({ guardado: usuario('tok-1'), renovado: usuario('tok-2') });
  await auth.iniciarSessao();
  mockFetch([401, 200]);
  const res = await auth.authFetch('https://optin/api');
  assert.equal(res.status, 200);
  assert.deepEqual(fetches.map((f) => f.auth), ['Bearer tok-1', 'Bearer tok-2']);
  assert.equal(g.chamadas.filter((c) => c[0] === 'signinSilent').length, 1);
  assert.equal(auth.getSession().access, 'tok-2');
});

test('authFetch com renovacao recusada encerra a sessao', async () => {
  const g = falso({ guardado: usuario('tok-1') });
  await auth.iniciarSessao();
  let avisos = 0;
  const parar = auth.onSessionChange(() => { avisos += 1; });
  mockFetch([401]);
  const res = await auth.authFetch('https://agenda/api');
  parar();
  assert.equal(res.status, 401);
  assert.equal(fetches.length, 1);
  assert.ok(g.chamadas.some((c) => c[0] === 'removeUser'));
  assert.equal(auth.getSession(), null);
  assert.ok(avisos > 0);
});

test('sair chama o end_session do Keycloak', async () => {
  const g = falso({ guardado: usuario('tok-1') });
  await auth.iniciarSessao();
  await auth.sair();
  assert.ok(g.chamadas.some((c) => c[0] === 'signoutRedirect'));
});
