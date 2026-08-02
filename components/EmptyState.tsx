'use client';

import React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, primaryAction, secondaryAction, action }: EmptyStateProps) {
  const mainAction = primaryAction || action;

  return (
    <div className="border border-border relative overflow-hidden px-8 py-16 text-center font-mono">
      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <pre className="text-muted text-xs mb-4 text-center leading-relaxed">
{`╔══════════════════════════╗
║                          ║
║   [ NO DATA FOUND ]      ║
║                          ║
╚══════════════════════════╝`}
        </pre>
        <div className="mb-4 border border-primary/20 bg-primary/5 p-4">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider text-glow">{title}</h3>
        <p className="mt-2 max-w-md text-xs leading-6 text-text-secondary">
          <span className="text-muted">// </span>{description}
        </p>

        {(mainAction || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {secondaryAction && (
              <button onClick={secondaryAction.onClick} className="btn-secondary">
                [ {secondaryAction.label.toUpperCase()} ]
              </button>
            )}
            {mainAction && (
              <button onClick={mainAction.onClick} className="btn-primary">
                [ {mainAction.label.toUpperCase()} ]
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
