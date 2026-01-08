'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SecureInput } from '@/components/SecureInput';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { validateEmail } from '@/lib/utils';
import { deriveMasterKey, base64ToUint8Array } from '@/lib/crypto';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser, setMasterKey, setSalt } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!password) {
      showToast('Please enter your password', 'error');
      return;
    }

    setLoading(true);

    try {
      console.log('[Login] Starting login for:', email);
      
      // Get user's salt from backend
      console.log('[Login] Fetching salt from /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch((err) => {
        console.error('[Login] Network error:', err);
        throw new Error('Network error: Could not reach server. Please check if the development server is running.');
      });

      console.log('[Login] Response status:', response.status);
      const data = await response.json();
      console.log('[Login] Received data');

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Derive master key from password and salt
      console.log('[Login] Deriving master key...');
      const saltArray = base64ToUint8Array(data.salt);
      const masterKey = await deriveMasterKey(password, saltArray);
      console.log('[Login] Master key derived');

      // Store everything
      console.log('[Login] Login successful, storing auth data');
      setUser(data.user);
      setMasterKey(masterKey);
      setSalt(data.salt);

      showToast('Welcome back!', 'success');
      console.log('[Login] Redirecting to vault');
      router.push('/vault');
    } catch (error: any) {
      console.error('[Login] Error during login:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Subtle decorative background - behind content */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-success rounded-full blur-3xl" />
      </div>

      {/* Content - above background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-surface border border-border rounded-xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3 shadow-md">
              <LockClosedIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">Welcome Back</h1>
            <p className="text-sm text-text-secondary mt-1">Sign in to your vault</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <SecureInput
                value={password}
                onChange={setPassword}
                label="Master Password"
                placeholder="Enter your master password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center border-t border-border pt-4">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:text-blue-400 hover:underline font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
