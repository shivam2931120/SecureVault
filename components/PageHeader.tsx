'use client';

import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, meta, children, action }: PageHeaderProps) {
  const rightContent = action || children;

  return (
    <div className="flex flex-col gap-4 font-mono">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          {eyebrow && (
            <div className="text-[10px] uppercase tracking-widest text-muted">
              // {eyebrow}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-primary text-sm">$</span>
            <h1 className="text-2xl font-bold text-primary uppercase tracking-wider text-glow lg:text-3xl">{title}</h1>
          </div>
          {description && (
            <p className="max-w-3xl text-xs leading-6 text-text-secondary pl-5">
              <span className="text-muted">// </span>{description}
            </p>
          )}
          {meta && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              {meta}
            </div>
          )}
          <div className="text-muted text-xs pl-5">{'─'.repeat(40)}</div>
        </div>

        {rightContent && (
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
