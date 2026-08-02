'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85"
            ref={overlayRef}
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              'relative flex max-h-[90vh] w-full flex-col overflow-hidden border border-primary bg-background font-mono',
              maxWidthClasses[maxWidth]
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{ boxShadow: '0 0 30px rgba(51, 255, 0, 0.1)' }}
          >
            <div className="flex items-center justify-between border-b border-primary px-4 py-2 bg-primary/5">
              <div className="flex items-center gap-2">
                <span className="text-primary text-xs">┌──</span>
                <h2 id="modal-title" className="text-xs font-bold text-primary uppercase tracking-wider text-glow">
                  {title}
                </h2>
                <span className="text-primary text-xs">──┐</span>
              </div>
              <button
                onClick={onClose}
                className="text-primary hover:text-danger text-sm transition-colors"
                aria-label="Close modal"
              >
                [×]
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
