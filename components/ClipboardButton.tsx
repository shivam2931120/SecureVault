'use client';

import { useState, useEffect } from 'react';
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
      showToast(`Copied. Auto-clear in ${seconds}s`, 'success');
    } catch {
      showToast('Clipboard permission denied', 'error');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-muted hover:text-primary font-mono text-xs border border-transparent hover:border-primary px-1.5 py-0.5 transition-all"
      title={copied ? `Clears in ${countdown}s` : 'Copy to clipboard'}
    >
      {copied ? (
        <span className="text-success">[OK {countdown}s]</span>
      ) : (
        <span>[CPY]</span>
      )}
    </button>
  );
}

export default ClipboardButton;
