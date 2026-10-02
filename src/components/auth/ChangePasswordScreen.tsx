import { useState } from 'react';
import { changePassword, fetchMe, getSession, storeSession, type AuthUser } from '../../auth/auth';
import { AuthShell, ErrorNote, Field, inputClass, primaryBtnClass } from './AuthShell';

// Troca obrigatoria no primeiro acesso (senha temporaria). O App prende o
// usuario aqui enquanto user.must_change_password estiver ativo.
export function ChangePasswordScreen({ user }: { user: AuthUser }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(current, next);
      // storeSession dispara onSessionChange e o App libera o app.
      const session = getSession();
      if (session) {
        let fresh: AuthUser;
        try {
          fresh = await fetchMe();
        } catch {
          fresh = session.user;
        }
        storeSession({ ...session, user: { ...fresh, must_change_password: false } });
      }
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof TypeError
          ? 'Não foi possível conectar'
          : err instanceof Error
            ? err.message
            : 'Não foi possível alterar a senha.',
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Segurança"
      title="Defina uma nova senha"
      subtitle={
        user.email
          ? `Você entrou com uma senha temporária (${user.email}). Crie uma senha definitiva para continuar.`
          : 'Você entrou com uma senha temporária. Crie uma senha definitiva para continuar.'
      }
    >
      <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
        <Field label="Senha temporária">
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="A senha que você recebeu"
            className={inputClass}
          />
        </Field>
        <Field label="Nova senha">
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
          />
        </Field>
        <Field label="Confirmar nova senha">
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a nova senha"
            className={inputClass}
          />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        <button type="submit" disabled={submitting} className={primaryBtnClass}>
          {submitting ? 'Salvando…' : 'Salvar e continuar'}
        </button>
      </form>
    </AuthShell>
  );
}
