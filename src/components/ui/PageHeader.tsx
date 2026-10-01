import React from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-3.5">
      <span className="line-accent" />
      <span className="eyebrow">{eyebrow}</span>
    </div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.03em] text-gray-900 truncate">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  </div>
);
