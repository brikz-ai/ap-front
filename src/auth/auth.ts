// Sessao do Trava-AP com o brikz-iam (login unico). Port enxuto de
// frontend-fidexa/src/lib/auth.ts: sem Firebase e sem cookie de SSR.
// Sintaxe TS apagavel de proposito (importavel pelo node --test).
const env = (import.meta as { env?: Record<string, string | undefined> }).env;
export const AUTH_URL: string = env?.VITE_AUTH_API_URL ?? 'http://localhost:8004';

export type ModulePerms = { view: boolean; create: boolean; edit: boolean; delete: boolean };
export type PermissionMap = Record<string, ModulePerms>;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  cpf: string;
  fone_number: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  must_change_password?: boolean;
  role?: number | null;
  role_name?: string | null;
  permissions?: PermissionMap;
};

export type Session = { user: AuthUser; access: string; refresh: string };

const ACCESS_KEY = 'brikz.ap.auth.access';
const REFRESH_KEY = 'brikz.ap.auth.refresh';
const USER_KEY = 'brikz.ap.auth.user';

// --- Mudanca de sessao ------------------------------------------------------
const listeners = new Set<() => void>();

export function onSessionChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emitSessionChange(): void {
  for (const cb of [...listeners]) {
    try {
      cb();
    } catch {
      // um ouvinte quebrado nao pode afetar os demais
    }
  }
}

// --- Armazenamento ----------------------------------------------------------
export function storeSession(s: Session): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, s.access);
  localStorage.setItem(REFRESH_KEY, s.refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(s.user));
  emitSessionChange();
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  emitSessionChange();
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  const raw = localStorage.getItem(USER_KEY);
  if (!access || !refresh || !raw) return null;
  try {
    return { access, refresh, user: JSON.parse(raw) as AuthUser };
  } catch {
    return null;
  }
}

// Extrai uma mensagem legivel de um erro do DRF: {detail} ou {campo:[msgs]}.
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') return data.detail;
    const first = Object.values(data ?? {})[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
  } catch {
    // corpo nao-JSON: usa o fallback
  }
  return fallback;
}

// --- Chamadas ao IAM --------------------------------------------------------
export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${AUTH_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new HttpError(await errorMessage(res, 'Falha ao entrar.'), res.status);
  const session = (await res.json()) as Session;
  storeSession(session);
  return session;
}

// Com `access` informado (retorno do Google): sessao ainda nao existe, entao
// fetch cru. Sem argumento: via authFetch (anexa token e renova em 401).
export async function fetchMe(access?: string): Promise<AuthUser> {
  const url = `${AUTH_URL}/api/auth/me`;
  const res = access
    ? await fetch(url, { headers: { Authorization: `Bearer ${access}` } })
    : await authFetch(url);
  if (!res.ok) throw new Error(await errorMessage(res, 'Sessão inválida.'));
  return (await res.json()) as AuthUser;
}

// O IAM nunca revela se o e-mail existe (200 generico). return_to faz o link
// do e-mail voltar para esta origem.
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${AUTH_URL}/api/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, return_to: window.location.origin }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Falha ao solicitar a redefinição.'));
}

export async function confirmPasswordReset(uid: string, token: string, password: string): Promise<void> {
  const res = await fetch(`${AUTH_URL}/api/auth/password/reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, token, password }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Não foi possível redefinir a senha.'));
}

export async function changePassword(current: string, next: string): Promise<void> {
  const res = await authFetch(`${AUTH_URL}/api/auth/password/change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: current, new_password: next }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Não foi possível alterar a senha.'));
}

// --- Google -----------------------------------------------------------------
export function googleStartUrl(): string {
  return `${AUTH_URL}/api/auth/google/start?return_to=${encodeURIComponent(window.location.origin)}`;
}

// O callback volta para a origem com #access=..&refresh=.. Le e limpa o hash.
export function consumeLoginHash(): { access: string; refresh: string } | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;
  const params = new URLSearchParams(hash.slice(1));
  const access = params.get('access');
  const refresh = params.get('refresh');
  if (!access || !refresh) return null;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return { access, refresh };
}

// --- Refresh ----------------------------------------------------------------
// Apenas 401/403 do proprio endpoint de refresh mata a sessao; rede/5xx sao
// transientes e preservam a sessao.
export type RefreshResult =
  | { status: 'ok'; access: string }
  | { status: 'dead' }
  | { status: 'transient' };

let inFlightRefresh: Promise<RefreshResult> | null = null;

export function refreshAccess(): Promise<RefreshResult> {
  if (inFlightRefresh) return inFlightRefresh;
  const pending: Promise<RefreshResult> = performRefresh().finally(() => {
    if (inFlightRefresh === pending) inFlightRefresh = null;
  });
  inFlightRefresh = pending;
  return pending;
}

async function performRefresh(): Promise<RefreshResult> {
  const refresh = getRefreshToken();
  if (!refresh) return { status: 'dead' };

  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
  } catch {
    return { status: 'transient' };
  }

  if (res.status === 401 || res.status === 403) return { status: 'dead' };
  if (!res.ok) return { status: 'transient' };

  try {
    const { access } = (await res.json()) as { access?: unknown };
    if (typeof access !== 'string' || !access) return { status: 'transient' };
    localStorage.setItem(ACCESS_KEY, access);
    return { status: 'ok', access };
  } catch {
    return { status: 'transient' };
  }
}

// Fetch com JWT: anexa o Bearer; em 401 renova uma vez e repete. Se o refresh
// for recusado (401/403), limpa a sessao (o App reage via onSessionChange).
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (t: string | null): RequestInit => {
    const headers = new Headers(init.headers || {});
    if (t) headers.set('Authorization', `Bearer ${t}`);
    return { ...init, headers };
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
  const res = await fetch(input, withAuth(token));
  if (res.status !== 401) return res;

  const refreshed = await refreshAccess();
  if (refreshed.status === 'transient') return res;
  if (refreshed.status === 'ok') return fetch(input, withAuth(refreshed.access));

  clearSession();
  return res;
}
