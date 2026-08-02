'use client';

import React from 'react';
import { assessPasswordStrength, cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
}

export function PasswordStrengthMeter({ password = '', className }: PasswordStrengthMeterProps) {
  const { score, feedback, color } = assessPasswordStrength(password);

  const barLength = 20;
  const filledLength = password ? Math.round((score / 7) * barLength) : 0;
  const bar = '\u2588'.repeat(filledLength) + '\u2591'.repeat(barLength - filledLength);

  return (
    <div className={cn('space-y-1 w-full font-mono', className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-secondary">STR:</span>
        <span className={cn('font-medium', color)}>{feedback}</span>
      </div>
      <div className="text-xs">
        <span className="text-muted">[</span>
        <span className={cn(
          password.length === 0 ? 'text-muted' :
          score <= 2 ? 'text-danger' :
          score <= 4 ? 'text-warning' : 'text-success'
        )}>{bar}</span>
        <span className="text-muted">]</span>
      </div>
    </div>
  );
}

export default PasswordStrengthMeter;
