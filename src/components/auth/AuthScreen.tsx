'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, UserPlus, AlertTriangle, Database } from 'lucide-react';
import { authenticateAccount, getRememberedUsername } from '@/lib/auth';

interface AuthScreenProps {
  hasLegacyLocalData: boolean;
  onAuthSuccess: (params: {
    mode: 'login' | 'register';
    username: string;
    vaultId: string;
    rememberMe: boolean;
    carryOverLocalData: boolean;
  }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  hasLegacyLocalData,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [carryOverLocalData, setCarryOverLocalData] = useState(hasLegacyLocalData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const remembered = getRememberedUsername();
    if (remembered) {
      setUsername(remembered);
    }
  }, []);

  useEffect(() => {
    setCarryOverLocalData(hasLegacyLocalData);
  }, [hasLegacyLocalData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(cleanUser)) {
      setError('Username must be 3-24 characters using letters, numbers, ".", "_", or "-".');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const res = await authenticateAccount(mode, cleanUser, password);
    setIsSubmitting(false);

    if (!res.success || !res.user) {
      setError(res.error || 'Authentication failed.');
      return;
    }

    onAuthSuccess({
      mode,
      username: res.user.username,
      vaultId: res.user.vaultId,
      rememberMe,
      carryOverLocalData: mode === 'register' && hasLegacyLocalData && carryOverLocalData,
    });
  };

  return (
    <div className="min-h-screen bg-[#090a0c] text-[#f1f3f7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12141a] border border-[#2c303d] rounded-none p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 border-b border-[#22252f] pb-5">
          <div className="w-11 h-11 rounded-none overflow-hidden border border-[#353a4a] bg-[#16181f] shrink-0">
            <img src="/logo.png" alt="Expense Manager" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Expense Manager</h1>
            <p className="text-xs text-zinc-400">Sign in to access your isolated private database</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 bg-[#16181f] p-1 border border-[#2c303d] rounded-none">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`h-9 text-xs font-semibold rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-[#262a37] text-white border border-[#3f4557]' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`h-9 text-xs font-semibold rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-[#262a37] text-white border border-[#3f4557]' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Box */}
        {error && (
          <div className="p-3 bg-[#261116] border border-rose-800 rounded-none text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                placeholder="e.g. ahsan or ali_work"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 bg-[#16181f] text-white text-xs pl-9 pr-3 rounded-none border border-[#2c303d] focus:outline-none focus:border-[#52596e]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                placeholder="Enter password (min 4 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 bg-[#16181f] text-white text-xs pl-9 pr-10 rounded-none border border-[#2c303d] focus:outline-none focus:border-[#52596e]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 bg-[#16181f] text-white text-xs pl-9 pr-3 rounded-none border border-[#2c303d] focus:outline-none focus:border-[#52596e]"
                />
              </div>
            </div>
          )}

          {/* Save login option */}
          <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded-none border-[#2c303d] bg-[#16181f] accent-white cursor-pointer"
            />
            <span>Save login on this device (stay signed in behind 4-digit PIN)</span>
          </label>

          {/* Optional pre-existing local data carryover when creating first account */}
          {mode === 'register' && hasLegacyLocalData && (
            <label className="flex items-start gap-2.5 p-3 bg-[#16181f] border border-[#2c303d] text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={carryOverLocalData}
                onChange={(e) => setCarryOverLocalData(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded-none border-[#2c303d] bg-[#12141a] accent-white cursor-pointer shrink-0"
              />
              <span>
                Import existing local data on this device into this account (uncheck for a completely empty database)
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-none border border-zinc-100 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>
              {isSubmitting
                ? mode === 'login'
                  ? 'Signing In...'
                  : 'Creating Account...'
                : mode === 'login'
                ? 'Sign In to Account'
                : 'Create Account & Private Database'}
            </span>
          </button>
        </form>

        <div className="pt-4 border-t border-[#22252f] flex items-center gap-2 text-[11px] text-zinc-500">
          <Database className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Each account connects to its own separate cloud vault and keeps its own 4-digit PIN lock.</span>
        </div>
      </div>
    </div>
  );
};
