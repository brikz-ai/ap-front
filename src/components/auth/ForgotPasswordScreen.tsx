import { useState } from 'react';
import { requestPasswordReset } from '../../auth/auth';
import { AuthShell, ErrorNote, Field, InfoNote, inputClass, linkClass, primaryBtnClass } from './AuthShell';

// O IAM responde 200 generico (nao revela se o e-mail existe).
export function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof TypeError ? 'Não foi possível conectar' : err instanceof Error ? err.message : 'Não foi possível enviar.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell eyebrow="Recuperação" title="Esqueceu a senha?" subtitle="Enviaremos um link para você redefinir sua senha.">
      {sent ? (
        <div className="mt-7 space-y-4">
          <InfoNote>
            Se houver uma conta com esse e-mail, enviamos as instruções para redefinir a senha. Verifique sua caixa de
            entrada e o spam.
          </InfoNote>
          <button type="button" onClick={onBack} className={`block w-full text-center text-sm ${linkClass}`}>
            Voltar para o login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
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

          {error && <ErrorNote>{error}</ErrorNote>}

          <button type="submit" disabled={submitting} className={primaryBtnClass}>
            {submitting ? 'Enviando…' : 'Enviar link de redefinição'}
          </button>

          <p className="text-center text-sm">
            <button type="button" onClick={onBack} className={linkClass}>
              Voltar para o login
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
