'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  type?: 'password' | 'text';
  className?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  trailingAction?: React.ReactNode;
  monospace?: boolean;
}

export function SecureInput({
  value,
  onChange,
  placeholder,
  label,
  type = 'password',
  className,
  required,
  autoComplete,
  error,
  trailingAction,
  monospace = true,
}: SecureInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('w-full space-y-1.5 font-mono', className)}>
      {label && (
        <label className="block text-xs text-text-secondary uppercase tracking-wider">
          <span className="text-muted">// </span>{label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type === 'password' ? (visible ? 'text' : 'password') : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={cn(
            'form-input pr-20',
            monospace && 'font-mono',
            trailingAction && 'pr-36',
            error && 'border-danger',
          )}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {trailingAction}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              className="text-muted hover:text-primary text-xs border border-transparent hover:border-primary px-1.5 py-0.5 transition-all"
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? '[HIDE]' : '[SHOW]'}
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export default SecureInput;
