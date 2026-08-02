'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <div className="border border-danger p-0 max-w-md w-full">
        <div className="bg-danger/10 border-b border-danger px-4 py-2 flex items-center gap-2">
          <span className="text-danger font-mono text-xs uppercase tracking-wider">[ SYSTEM ERROR ]</span>
        </div>
        <div className="p-6">
          <pre className="text-danger font-mono text-sm mb-4 whitespace-pre-wrap">
{`ERR: ${error.message || 'An unexpected error occurred'}
CODE: ${error.digest || 'UNKNOWN'}
STATUS: FATAL`}
          </pre>
          <div className="ascii-divider mb-4 text-danger/50">{'─'.repeat(40)}</div>
          <button
            onClick={reset}
            className="w-full p-3 border border-danger text-danger font-mono text-sm uppercase tracking-wider hover:bg-danger hover:text-background transition-colors"
          >
            [ RETRY OPERATION ]
          </button>
        </div>
      </div>
    </div>
  )
}
