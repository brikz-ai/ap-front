// Sessao do AP com o Keycloak (auth.brikz.ai, realm ap, client publico
// ap-console): authorization code + PKCE S256 via oidc-client-ts. A senha
// nunca passa por aqui: a tela /login so escolhe o caminho (Google direto ou
// e-mail como login_hint) e o Keycloak autentica. O access token vai no
// Authorization: Bearer de toda chamada aos backends (ver authFetch) e e
// renovado em silencio com o refresh token antes de expirar.
// Sintaxe TS apagavel de proposito (importavel pelo node --test).
import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';

const env = (import.meta as { env?: Record<string, string | undefined> }).env;
export const KEYCLOAK_ISSUER: string = (env?.VITE_KEYCLOAK_ISSUER || 'https://auth.brikz.ai/realms/ap').replace(/\/+$/, '');
export const KEYCLOAK_CLIENT_ID: string = env?.VITE_KEYCLOAK_CLIENT_ID || 'ap-console';

export const LOGIN_PATH = '/login';
export const CALLBACK_PATH = '/auth/callback';

export type AuthUser = { id: string; name: string; email: string };
export type Session = { user: AuthUser; access: string };

// Subconjunto do UserManager que o app usa (os testes trocam por um falso).
export type Gerenciador = Pick<
  UserManager,
  'getUser' | 'signinRedirect' | 'signinRedirectCallback' | 'signinSilent' | 'signoutRedirect' | 'removeUser'
> & {
  events: Pick<UserManager['events'], 'addUserLoaded' | 'addUserUnloaded'>;
};

let gerenciador: Gerenciador | null = null;
let atual: User | null = null;
let inicio: Promise<{ erro: string | null }> | null = null;
let renovando: Promise<User | null> | null = null;

const listeners = new Set<() => void>();

export function onSessionChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emitSessionChange(): void {
  listeners.forEach((cb) => cb());
}

function definirAtual(u: User | null): void {
  atual = u && !u.expired ? u : null;
  emitSessionChange();
}

function ligarEventos(g: Gerenciador): Gerenciador {
  // userLoaded dispara no login e em cada renovacao silenciosa; userUnloaded
  // no logout e quando a sessao some do storage.
  g.events.addUserLoaded((u) => definirAtual(u));
  g.events.addUserUnloaded(() => definirAtual(null));
  return g;
}

function obterGerenciador(): Gerenciador {
  if (gerenciador) return gerenciador;
  const origem = window.location.origin;
  gerenciador = ligarEventos(
    new UserManager({
      authority: KEYCLOAK_ISSUER,
      client_id: KEYCLOAK_CLIENT_ID,
      redirect_uri: `${origem}${CALLBACK_PATH}`,
      post_logout_redirect_uri: `${origem}${LOGIN_PATH}`,
      response_type: 'code',
      scope: 'openid profile email',
      // Renova com o refresh token um pouco antes do access token (5 min) vencer.
      automaticSilentRenew: true,
      // localStorage: a sessao vale para todas as abas do AP, como antes.
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    }),
  );
  return gerenciador;
}

// Testes: injeta um gerenciador falso e zera o estado do modulo.
export function usarGerenciador(g: Gerenciador | null): void {
  gerenciador = g ? ligarEventos(g) : null;
  atual = null;
  inicio = null;
  renovando = null;
}

function usuarioDe(u: User): AuthUser {
  const p = u.profile;
  const email = typeof p.email === 'string' ? p.email : '';
  const nome = [p.name, p.preferred_username, email].find((v) => typeof v === 'string' && v.trim());
  return { id: p.sub, name: (nome as string | undefined) ?? 'Usuário', email };
}

export function getSession(): Session | null {
  if (!atual || atual.expired) return null;
  return { user: usuarioDe(atual), access: atual.access_token };
}

// So aceita caminho interno ("/x"), nunca "//host" ou URL absoluta: o voltar
// vem da query e iria direto para o history depois do login.
export function voltarSeguro(v: string | null | undefined): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return '/';
  if (v === LOGIN_PATH || v.startsWith(`${LOGIN_PATH}?`) || v.startsWith(CALLBACK_PATH)) return '/';
  return v;
}

// Vai para o Keycloak. Google: kc_idp_hint pula a tela do Keycloak e cai
// direto no Google. E-mail: segue como login_hint, ja preenchido la.
export async function entrar(opcoes: { google?: boolean; email?: string; voltar?: string | null } = {}): Promise<void> {
  const email = opcoes.email?.trim().toLowerCase();
  await obterGerenciador().signinRedirect({
    ...(opcoes.google ? { extraQueryParams: { kc_idp_hint: 'google' } } : {}),
    ...(email ? { login_hint: email } : {}),
    state: { voltar: voltarSeguro(opcoes.voltar) },
  });
}

export async function sair(): Promise<void> {
  // end_session do Keycloak (encerra a sessao SSO) e volta para /login.
  // O oidc-client-ts manda o id_token_hint e apaga o usuario do storage.
  try {
    await obterGerenciador().signoutRedirect();
  } catch {
    await obterGerenciador().removeUser();
    definirAtual(null);
    window.location.assign(LOGIN_PATH);
  }
}

// Renovacao silenciosa (refresh token), uma por vez.
function renovar(): Promise<User | null> {
  if (renovando) return renovando;
  const pendente: Promise<User | null> = obterGerenciador()
    .signinSilent()
    .catch(() => null)
    .finally(() => {
      if (renovando === pendente) renovando = null;
    });
  renovando = pendente;
  return pendente;
}

async function carregarSessao(): Promise<void> {
  const g = obterGerenciador();
  let u = await g.getUser();
  if (u && u.expired) u = await renovar();
  if (!u) await g.removeUser();
  definirAtual(u);
}

async function concluirLogin(): Promise<string> {
  const u = await obterGerenciador().signinRedirectCallback();
  definirAtual(u);
  return voltarSeguro((u.state as { voltar?: string } | undefined)?.voltar);
}

// Boot do app, uma vez por carga (o StrictMode roda efeitos 2x): na volta do
// Keycloak (/auth/callback) troca o code pelos tokens; senao recupera a sessao
// guardada, renovando se o access token ja venceu.
export function iniciarSessao(): Promise<{ erro: string | null }> {
  if (inicio) return inicio;
  inicio = (async () => {
    if (window.location.pathname === CALLBACK_PATH) {
      try {
        const destino = await concluirLogin();
        window.history.replaceState(null, '', destino);
        return { erro: null };
      } catch {
        window.history.replaceState(null, '', LOGIN_PATH);
        return { erro: 'Não foi possível entrar. Tente novamente.' };
      }
    }
    try {
      await carregarSessao();
    } catch {
      definirAtual(null);
    }
    return { erro: null };
  })();
  return inicio;
}

// Fetch com o access token do Keycloak: anexa o Bearer; em 401 renova uma vez
// e repete. Se a renovacao falhar, a sessao acabou: limpa e o App volta ao
// /login (via onSessionChange).
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (t: string | null): RequestInit => {
    const headers = new Headers(init.headers || {});
    if (t) headers.set('Authorization', `Bearer ${t}`);
    return { ...init, headers };
  };

  const token = getSession()?.access ?? null;
  const res = await fetch(input, withAuth(token));
  if (res.status !== 401 || !token) return res;

  const novo = await renovar();
  if (!novo || novo.expired) {
    await obterGerenciador().removeUser();
    definirAtual(null);
    return res;
  }
  definirAtual(novo);
  return fetch(input, withAuth(novo.access_token));
}
