'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardButton } from '@/components/ClipboardButton';
import { PageHeader } from '@/components/PageHeader';
import { generatePassword } from '@/lib/crypto';
import { assessPasswordStrength, cn } from '@/lib/utils';

const presets = [
  { label: 'Google', length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true },
  { label: 'AWS', length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true },
  { label: 'GitHub', length: 20, uppercase: true, lowercase: true, numbers: true, symbols: false },
  { label: 'Database', length: 28, uppercase: true, lowercase: true, numbers: true, symbols: false },
  { label: 'Random', length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true },
];

export default function GeneratorPage() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(20);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  const selectedOptionCount = [includeUppercase, includeLowercase, includeNumbers, includeSymbols].filter(Boolean).length;

  const generateNewPassword = () => {
    const nextPassword = generatePassword(length, includeUppercase, includeLowercase, includeNumbers, includeSymbols);
    setPassword(nextPassword);
    setHistory((prev) => [nextPassword, ...prev.filter((entry) => entry !== nextPassword)].slice(0, 6));
  };

  useEffect(() => {
    generateNewPassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const strength = assessPasswordStrength(password);
  const entropy = useMemo(() => Math.max(28, Math.round((length * Math.max(selectedOptionCount, 1)) * 2.6)), [length, selectedOptionCount]);

  const toggleOption = (key: 'uppercase' | 'lowercase' | 'numbers' | 'symbols') => {
    if (selectedOptionCount === 1) return;
    if (key === 'uppercase') setIncludeUppercase((value) => !value);
    if (key === 'lowercase') setIncludeLowercase((value) => !value);
    if (key === 'numbers') setIncludeNumbers((value) => !value);
    if (key === 'symbols') setIncludeSymbols((value) => !value);
  };

  const applyPreset = (preset: typeof presets[number]) => {
    setLength(preset.length);
    setIncludeUppercase(preset.uppercase);
    setIncludeLowercase(preset.lowercase);
    setIncludeNumbers(preset.numbers);
    setIncludeSymbols(preset.symbols);
  };

  return (
    <div className="space-y-6 font-mono">
      <PageHeader
        eyebrow="security modules"
        title="PWD_GEN"
        description="Generate cryptographically strong passwords locally. Keys remain in memory."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Left column - Controls */}
        <section className="border border-border p-5 bg-background">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <span className="text-primary text-xs">┌──</span>
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider text-glow">PARAMS</h2>
            <span className="text-primary text-xs">──┐</span>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-text-secondary uppercase tracking-wider">LENGTH</span>
                <span className="text-primary text-xs border border-border px-1.5 py-0.5">{length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-1 bg-border appearance-none cursor-pointer outline-none slider-thumb-primary"
                style={{
                  background: `linear-gradient(to right, #33ff00 0%, #33ff00 ${(length - 8) / (64 - 8) * 100}%, #1f521f ${(length - 8) / (64 - 8) * 100}%, #1f521f 100%)`
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-muted uppercase tracking-widest mb-2">// character sets</div>
              {[
                ['uppercase', includeUppercase, 'A-Z'],
                ['lowercase', includeLowercase, 'a-z'],
                ['numbers', includeNumbers, '0-9'],
                ['symbols', includeSymbols, '!@#'],
              ].map(([key, checked, label]) => (
                <button
                  type="button"
                  key={String(key)}
                  onClick={() => checked ? toggleOption(key as 'uppercase' | 'lowercase' | 'numbers' | 'symbols') : (
                    key === 'uppercase' ? setIncludeUppercase(true) :
                    key === 'lowercase' ? setIncludeLowercase(true) :
                    key === 'numbers' ? setIncludeNumbers(true) :
                    setIncludeSymbols(true)
                  )}
                  className="flex w-full items-center justify-between border border-border px-3 py-2 text-left hover:border-primary transition-all group"
                >
                  <span className="text-xs text-text-secondary group-hover:text-primary transition-colors">{label}</span>
                  <span className={cn('text-xs font-bold', checked ? 'text-primary' : 'text-muted')}>
                    [{checked ? 'X' : ' '}]
                  </span>
                </button>
              ))}
            </div>

            <div>
              <div className="text-[10px] text-muted uppercase tracking-widest mb-2">// presets</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="text-[10px] uppercase border border-border text-text-secondary px-2 py-1 hover:border-primary hover:text-primary transition-all">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right column - Output */}
        <section className="space-y-6">
          <div className="border border-primary p-6 bg-primary/5" style={{ boxShadow: '0 0 20px rgba(51, 255, 0, 0.05)' }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full">
                <div className="text-[10px] text-muted uppercase tracking-widest mb-2">// output buffer</div>
                <div className="border border-primary bg-background p-4 flex items-center justify-between">
                  <div className="font-mono text-lg md:text-2xl text-primary break-all text-glow">{password}</div>
                  <div className="flex items-center gap-2 pl-4 shrink-0">
                    <ClipboardButton text={password} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-3">
               <button type="button" onClick={generateNewPassword} className="btn-primary w-full md:w-auto">
                 [ REGENERATE ]
               </button>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'STR', value: strength.feedback, color: strength.color },
                  { label: 'ENTROPY', value: `${entropy}b`, color: 'text-primary' },
                  { label: 'LEN', value: `${password.length}`, color: 'text-text-primary' },
                ].map((metric) => (
                  <div key={metric.label} className="border border-border p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted">{metric.label}</div>
                    <div className={cn('mt-1 text-lg font-bold', metric.color)}>{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-border p-5 bg-background">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-primary text-xs">┌──</span>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider text-glow">HISTORY</h3>
                <span className="text-primary text-xs">──┐</span>
              </div>
              <span className="text-[10px] text-muted">{history.length} ITEMS</span>
            </div>
            <div className="space-y-2">
              {history.map((entry, index) => (
                <div key={`${entry}-${index}`} className="flex items-center justify-between border border-border px-3 py-2 bg-background hover:bg-primary/5 transition-colors group">
                  <div className="truncate font-mono text-xs text-text-secondary group-hover:text-primary">{entry}</div>
                  <ClipboardButton text={entry} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
