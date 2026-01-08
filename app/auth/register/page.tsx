'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SecureInput } from '@/components/SecureInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { validateEmail } from '@/lib/utils';
import { generateSalt, deriveMasterKey, uint8ArrayToBase64 } from '@/lib/crypto';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser, setMasterKey, setSalt } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      // Check if we can reach the server first
      console.log('[Register] Starting registration for:', email);
      
      // Generate unique salt for the user
      const saltArray = generateSalt();
      const saltBase64 = uint8ArrayToBase64(saltArray);
      console.log('[Register] Salt generated');
      
      // Derive master key (this stays client-side only)
      console.log('[Register] Deriving master key...');
      const masterKey = await deriveMasterKey(password, saltArray);
      console.log('[Register] Master key derived');

      // Register with backend (send only email and salt, never the password or key)
      console.log('[Register] Sending request to /api/auth/register');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, salt: saltBase64 }),
      }).catch((err) => {
        console.error('[Register] Network error:', err);
        throw new Error('Network error: Could not reach server. Please check if the development server is running.');
      });

      console.log('[Register] Response status:', response.status);
      const data = await response.json();
      console.log('[Register] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store user, key, and salt in auth store
      console.log('[Register] Registration successful, storing auth data');
      setUser(data.user);
      setMasterKey(masterKey);
      setSalt(saltBase64);

      showToast('Account created successfully!', 'success');
      console.log('[Register] Redirecting to vault');
      router.push('/vault');
    } catch (error: any) {
      console.error('[Register] Error during registration:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
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
            <h1 className="text-xl font-bold text-text-primary">Create Account</h1>
            <p className="text-sm text-text-secondary mt-1">Join SecureVault Today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
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
                placeholder="Enter a strong master password"
                required
                autoComplete="new-password"
              />
            </div>

            <PasswordStrengthMeter password={password} />

            <div>
              <SecureInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
                placeholder="Re-enter your master password"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-xs text-warning leading-relaxed">
                <strong>Important:</strong> Your master password cannot be recovered. 
                Make sure to remember it or store it securely.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center border-t border-border pt-4">
            <p className="text-sm text-text-secondary">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:text-blue-400 hover:underline font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
