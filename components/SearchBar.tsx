'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  shortcutHint?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'grep -i "search_term"...',
  className,
}: SearchBarProps) {
  return (
    <div className={cn('group relative w-full', className)}>
      <div className="flex items-center border border-border bg-background font-mono">
        <span className="text-primary text-sm px-3 border-r border-border py-2.5">{'>'}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-primary text-sm px-3 py-2.5 outline-none placeholder:text-muted caret-primary"
          aria-label={placeholder}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-muted hover:text-primary text-xs px-3 transition-colors"
            aria-label="Clear search"
          >
            [CLR]
          </button>
        ) : (
          <span className="hidden lg:inline-flex text-[10px] text-muted px-3">ctrl+k</span>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
