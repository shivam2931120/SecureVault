'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';

const prefixes = {
  success: '[OK]',
  error: '[ERR]',
  warning: '[WARN]',
  info: '[SYS]',
};

const borderColors = {
  success: 'border-success',
  error: 'border-danger',
  warning: 'border-warning',
  info: 'border-primary',
};

const textColors = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-primary',
};

export function Toast() {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`flex items-center gap-3 min-w-[320px] max-w-md px-4 py-3 border bg-background font-mono ${borderColors[toast.type]}`}
            role="alert"
            style={{ boxShadow: '0 0 20px rgba(51, 255, 0, 0.1)' }}
          >
            <span className={`text-xs font-bold ${textColors[toast.type]}`}>{prefixes[toast.type]}</span>
            <p className="flex-1 text-xs text-primary">
              {toast.message}
            </p>
            <button
              onClick={hideToast}
              className="text-muted hover:text-primary text-xs transition-colors flex-shrink-0"
              aria-label="Close"
            >
              [×]
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
