'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export function Toast() {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast?.visible) return null;

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-success" />,
    error: <XCircleIcon className="w-5 h-5 text-danger" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-warning" />,
    info: <InformationCircleIcon className="w-5 h-5 text-primary" />,
  };

  const colors = {
    success: 'border-success/20 bg-success/10',
    error: 'border-danger/20 bg-danger/10',
    warning: 'border-warning/20 bg-warning/10',
    info: 'border-primary/20 bg-primary/10',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-[9999]"
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[toast.type]} backdrop-blur-sm min-w-[300px] max-w-md shadow-lg`}
        >
          {icons[toast.type]}
          <p className="text-sm text-text-primary flex-1">{toast.message}</p>
          <button
            onClick={hideToast}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
