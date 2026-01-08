'use client';

import { assessPasswordStrength } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const { score, feedback, color } = assessPasswordStrength(password);
  const percentage = (score / 7) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Password Strength</span>
        <span className={cn('text-sm font-medium', color)}>{feedback}</span>
      </div>
      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            score <= 2 && 'bg-danger',
            score > 2 && score <= 4 && 'bg-warning',
            score > 4 && 'bg-success'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
