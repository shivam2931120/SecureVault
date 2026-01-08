'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function DebugPage() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiTests, setApiTests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    setServerStatus('checking');
    const tests: Record<string, boolean> = {};

    try {
      // Test 1: Can we reach the server at all?
      const healthResponse = await fetch('/api/auth/register', {
        method: 'OPTIONS',
      }).catch(() => null);
      
      tests['Server Reachable'] = healthResponse !== null;

      // Test 2: Can we make a POST request?
      const registerTest = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', salt: 'testsalt' }),
      }).catch(() => null);
      
      tests['POST Request Works'] = registerTest !== null;
      tests['Register Endpoint'] = registerTest?.status === 201 || registerTest?.status === 400;

      // Test 3: Browser online status
      tests['Browser Online'] = navigator.onLine;

      setApiTests(tests);
      setServerStatus(Object.values(tests).every(Boolean) ? 'online' : 'offline');
    } catch (error) {
      console.error('Debug error:', error);
      setServerStatus('offline');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          🔧 SecureVault Debug Panel
        </h1>

        <div className="space-y-6">
          {/* Server Status */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Server Status
            </h2>
            <div className="flex items-center gap-3">
              {serverStatus === 'checking' && (
                <>
                  <ArrowPathIcon className="w-5 h-5 text-warning animate-spin" />
                  <span className="text-text-secondary">Checking...</span>
                </>
              )}
              {serverStatus === 'online' && (
                <>
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                  <span className="text-success font-medium">Server is Online</span>
                </>
              )}
              {serverStatus === 'offline' && (
                <>
                  <XCircleIcon className="w-5 h-5 text-danger" />
                  <span className="text-danger font-medium">Server is Offline</span>
                </>
              )}
            </div>
          </div>

          {/* API Tests */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              API Tests
            </h2>
            <div className="space-y-3">
              {Object.entries(apiTests).map(([test, passed]) => (
                <div key={test} className="flex items-center justify-between">
                  <span className="text-text-secondary">{test}</span>
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5 text-success" />
                        <span className="text-success text-sm font-medium">Pass</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-5 h-5 text-danger" />
                        <span className="text-danger text-sm font-medium">Fail</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="card p-6 bg-primary/5 border-primary/20">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Troubleshooting Steps
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary">
              <li>Make sure the development server is running: <code className="px-2 py-1 bg-surface rounded text-primary">npm run dev</code></li>
              <li>Check the terminal for any error messages</li>
              <li>Try opening the browser console (F12) and check for errors</li>
              <li>Clear your browser cache and cookies</li>
              <li>Try disabling browser extensions</li>
              <li>Make sure you're not in browser offline mode (check bottom right of dev tools)</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={checkServer}
              className="btn-primary"
            >
              <ArrowPathIcon className="w-5 h-5 inline mr-2" />
              Recheck Status
            </button>
            <a
              href="/auth/register"
              className="btn-secondary"
            >
              Try Registration
            </a>
            <a
              href="/auth/login"
              className="btn-secondary"
            >
              Try Login
            </a>
          </div>

          {/* Browser Info */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Browser Information
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">User Agent:</span>
                <span className="text-text-primary font-mono text-xs truncate max-w-md">
                  {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Online Status:</span>
                <span className="text-text-primary">
                  {typeof window !== 'undefined' && navigator.onLine ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Current URL:</span>
                <span className="text-text-primary font-mono text-xs">
                  {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
