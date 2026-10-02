import type { ReactNode } from 'react';

// Shell visual das telas de auth (login, esqueci/redefinir senha): painel de
// marca ink a esquerda (telas largas) + formulario a direita sobre grade sutil.
// Port do AuthShell do fidexa, com a marca brikz | Trava-AP.
const GRID_LIGHT = {
  backgroundImage:
    'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex bg-white text-gray-900">
      {/* Painel ink (Brikz DS: band preta, grade e brilho cyan) */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-black px-12 py-14 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.55), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.30), transparent 70%)' }}
        />

        <div className="relative flex items-center gap-3 self-start">
          <img src="/brand/logo-on-dark.png" alt="brikz" className="h-9 w-auto" />
          <span className="h-5 w-px bg-white/25" aria-hidden="true" />
          <span className="font-display text-lg font-semibold tracking-[-0.01em] text-white">Trava-AP</span>
        </div>

        <div className="relative max-w-sm space-y-4">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-fg-ink-3">Registros de AP</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-white" style={{ color: '#fff' }}>
            Recebíveis registrados, travas sob controle<span className="text-accent-bright">.</span>
          </h2>
          <p className="text-sm leading-relaxed text-fg-ink-2">
            Registros, travas e liquidações na mesma operação.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Plataforma segura
        </div>
      </aside>

      {/* Painel do formulario */}
      <main className="relative flex flex-1 items-center justify-center overflow-y-auto px-6 py-12" style={GRID_LIGHT}>
        <div className="w-full max-w-sm">
          {/* Logo em telas pequenas (sem o painel de marca) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src="/brand/logo-on-light.png" alt="brikz" className="h-8 w-auto" />
            <span className="h-4 w-px bg-gray-200" aria-hidden="true" />
            <span className="font-display text-base font-semibold tracking-[-0.01em] text-gray-900">Trava-AP</span>
          </div>

          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>

          {children}
        </div>
      </main>
    </div>
  );
}

export const inputClass = 'input-soft w-full';
export const primaryBtnClass = 'btn btn-primary w-full justify-center';
export const linkClass = 'font-semibold text-cyan-700 hover:underline';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="label-mono">{label}</span>
        {hint}
      </span>
      {children}
    </label>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
      {children}
    </p>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700">
      {children}
    </p>
  );
}

export function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pr-16`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-gray-400 hover:text-gray-700"
      >
        {show ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  );
}
