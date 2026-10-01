import React from 'react';

export type StatusTone = 'ready' | 'idle' | 'success' | 'warning' | 'danger';

interface StatusPillProps {
  tone: StatusTone;
  children: React.ReactNode;
}

export const StatusPill: React.FC<StatusPillProps> = ({ tone, children }) => (
  <span className={`status status-${tone}`}>{children}</span>
);
