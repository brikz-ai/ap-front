import React from 'react';

export type StatusTone = 'ready' | 'idle' | 'success' | 'warning' | 'danger';

interface StatusPillProps {
  tone: StatusTone;
  children: React.ReactNode;
}

// Mapa literal: o Tailwind precisa achar cada classe no codigo para nao purgar o @layer components.
const TONE_CLASS: Record<StatusTone, string> = {
  ready: 'status status-ready',
  idle: 'status status-idle',
  success: 'status status-success',
  warning: 'status status-warning',
  danger: 'status status-danger',
};

export const StatusPill: React.FC<StatusPillProps> = ({ tone, children }) => (
  <span className={TONE_CLASS[tone]}>{children}</span>
);
