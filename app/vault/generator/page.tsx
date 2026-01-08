'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generatePassword } from '@/lib/crypto';
import { assessPasswordStrength } from '@/lib/utils';
import { ClipboardButton } from '@/components/ClipboardButton';
import { useUIStore } from '@/stores/uiStore';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function GeneratorPage() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  const { showToast } = useUIStore();
  const strength = assessPasswordStrength(password);

  useEffect(() => {
    generateNewPassword();
  }, []);

  const generateNewPassword = () => {
    const newPassword = generatePassword(
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols
    );
    setPassword(newPassword);
  };

  useEffect(() => {
    generateNewPassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Password Generator</h1>
        <p className="text-sm text-text-secondary mt-1">
          Generate secure, random passwords
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Password Display */}
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">
                Generated Password
              </h2>
              <div className="flex items-center gap-2">
                <ClipboardButton text={password} />
                <button
                  onClick={generateNewPassword}
                  className="p-2 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-all"
                  title="Generate new password"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-surface border border-border rounded-lg p-3 mb-3">
              <p className="text-lg font-mono text-text-primary break-all select-all">
                {password}
              </p>
            </div>

            {/* Strength Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Strength</span>
                <span className={`text-sm font-medium ${strength.color}`}>
                  {strength.feedback}
                </span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(strength.score / 7) * 100}%` }}
                  className={`h-full transition-all duration-300 ${
                    strength.score <= 2
                      ? 'bg-danger'
                      : strength.score <= 4
                      ? 'bg-warning'
                      : 'bg-success'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="md:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              Password Options
            </h2>

            {/* Length Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-text-primary">
                  Length
                </label>
                <span className="text-lg font-semibold text-primary">
                  {length}
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                    ((length - 8) / (64 - 8)) * 100
                  }%, #121822 ${((length - 8) / (64 - 8)) * 100}%, #121822 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-text-primary group-hover:text-primary transition-colors">
                  Include Uppercase Letters (A-Z)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-text-primary group-hover:text-primary transition-colors">
                  Include Lowercase Letters (a-z)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-text-primary group-hover:text-primary transition-colors">
                  Include Numbers (0-9)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-text-primary group-hover:text-primary transition-colors">
                  Include Symbols (!@#$%^&*)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
