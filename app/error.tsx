'use client';

import { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error Boundary] Caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card max-w-lg text-center">
        <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <ExclamationTriangleIcon className="w-8 h-8 text-danger" />
        </div>
        
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Something Went Wrong
        </h1>
        
        <p className="text-text-secondary mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="btn-primary w-full"
          >
            Try Again
          </button>
          
          <a
            href="/"
            className="btn-secondary w-full block"
          >
            Go Home
          </a>

          <a
            href="/debug"
            className="text-primary hover:underline block"
          >
            Open Debug Panel
          </a>
        </div>

        {error.digest && (
          <p className="text-xs text-text-secondary mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
