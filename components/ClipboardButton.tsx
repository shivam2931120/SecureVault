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
    if (!copied) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    const resetId = window.setTimeout(() => {
      setCopied(false);
      setCountdown(0);
    }, duration);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(resetId);
    };
  }, [copied, duration]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(text, duration);
      const seconds = Math.floor(duration / 1000);
      setCopied(true);
      setCountdown(seconds);
      showToast(`Copied to clipboard. Will clear in ${seconds}s`, 'success');
    } catch {
      showToast('Clipboard permission denied', 'error');
    }
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
