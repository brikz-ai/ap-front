import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'default' | 'danger' | 'success';
}

const toneClass = { default: 'text-gray-900', danger: 'text-red-500', success: 'text-green-600' };

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, tone = 'default' }) => (
  <div className="panel px-5 py-[18px]">
    <div className="label-mono">{label}</div>
    <div className={`mt-2.5 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] ${toneClass[tone]}`}>
      {value}
    </div>
    {hint && <div className="mt-2 text-xs text-gray-500">{hint}</div>}
  </div>
);
