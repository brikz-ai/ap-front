import { useEffect, useRef, useState } from 'react';
import { confirmPasswordReset } from '../../auth/auth';
import { AuthShell, ErrorNote, Field, InfoNote, PasswordInput, inputClass, linkClass, primaryBtnClass } from './AuthShell';

// Aberta pelo link do e-mail: /reset-password?uid=..&token=..
// uid e token vem por props (o App le a query); onDone volta para o login.
export function ResetPasswordScreen({ uid, token, onDone }: { uid: string; token: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(uid, token, password);
      setDone(true);
      timer.current = setTimeout(onDone, 2500);
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof TypeError
          ? 'Não foi possível conectar'
          : err instanceof Error
            ? err.message
            : 'Não foi possível redefinir a senha.',
      );
    }
  }

  let body;
  if (!uid || !token) {
    body = (
      <div className="mt-7 space-y-4">
        <ErrorNote>Link inválido ou incompleto. Solicite um novo link de redefinição.</ErrorNote>
        <button type="button" onClick={onDone} className={`block w-full text-center text-sm ${linkClass}`}>
          Voltar para o login
        </button>
      </div>
    );
  } else if (done) {
    body = (
      <div className="mt-7 space-y-4">
        <InfoNote>Senha redefinida com sucesso. Redirecionando para o login…</InfoNote>
        <button type="button" onClick={onDone} className={`block w-full text-center text-sm ${linkClass}`}>
          Ir para o login agora
        </button>
      </div>
    );
  } else {
    body = (
      <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
        <Field label="Nova senha">
          <PasswordInput
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar nova senha">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a senha"
            className={inputClass}
          />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        <button type="submit" disabled={submitting} className={primaryBtnClass}>
          {submitting ? 'Salvando…' : 'Redefinir senha'}
        </button>

        <p className="text-center text-sm">
          <button type="button" onClick={onDone} className={linkClass}>
            Voltar para o login
          </button>
        </p>
      </form>
    );
  }

  return (
    <AuthShell eyebrow="Redefinição" title="Crie uma nova senha" subtitle="Escolha uma senha forte para sua conta.">
      {body}
    </AuthShell>
  );
}
