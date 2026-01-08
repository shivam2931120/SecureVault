'use client';

import { useState, useEffect } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { copyToClipboard } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface ClipboardButtonProps {
  text: string;
  duration?: number;
}

export function ClipboardButton({ text, duration = 15000 }: ClipboardButtonProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { showToast } = useUIStore();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0 && copied) {
      setCopied(false);
    }
  }, [countdown, copied]);

  const handleCopy = async () => {
    await copyToClipboard(text, duration);
    setCopied(true);
    setCountdown(Math.floor(duration / 1000));
    showToast('Copied to clipboard. Will clear in 15s', 'success');
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-all"
      title={copied ? `Clipboard clears in ${countdown}s` : 'Copy to clipboard'}
    >
      {copied ? (
        <div className="flex items-center gap-1">
          <CheckIcon className="w-4 h-4 text-success" />
          <span className="text-xs text-success">{countdown}s</span>
        </div>
      ) : (
        <ClipboardIcon className="w-4 h-4" />
      )}
    </button>
  );
}
