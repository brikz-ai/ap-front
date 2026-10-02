import { useState } from 'react';
import { HttpError, googleStartUrl, login } from '../../auth/auth';
import { AuthShell, ErrorNote, Field, PasswordInput, inputClass, primaryBtnClass } from './AuthShell';

// Login unico com o brikz-iam: Google (SSO) ou e-mail e senha. O login()
// guarda a sessao e o App reage via onSessionChange.
export function LoginScreen({
  onForgot,
  initialError,
}: {
  onForgot: () => void;
  initialError?: string | null;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!password) {
      setError('Informe sua senha.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setSubmitting(false);
      // fetch rejeita com TypeError sem rede; o IAM responde 400 para credenciais ruins
      if (err instanceof HttpError && err.status === 400) setError('E-mail ou senha inválidos');
      else if (err instanceof TypeError) setError('Não foi possível conectar');
      else setError('Não foi possível entrar. Tente novamente.');
    }
  }

  function handleGoogle() {
    setError(null);
    window.location.href = googleStartUrl();
  }

  return (
    <AuthShell
      eyebrow="Acesso"
      title="Entrar no Trava-AP"
      subtitle="Acesse com sua conta Google ou com e-mail e senha."
    >
      <button type="button" onClick={handleGoogle} className="btn btn-soft mt-7 w-full justify-center gap-3 py-2.5">
        <GoogleIcon />
        Entrar com Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="label-mono">ou com e-mail</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="E-mail">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            className={inputClass}
          />
        </Field>

        <Field
          label="Senha"
          hint={
            <button type="button" onClick={onForgot} className="text-xs font-medium text-cyan-700 hover:underline">
              Esqueceu?
            </button>
          }
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
            placeholder="Sua senha"
            autoComplete="current-password"
          />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        <button type="submit" disabled={submitting} className={primaryBtnClass}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
