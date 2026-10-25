'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Check, RefreshCw } from 'lucide-react';
import { hashPasscode } from '@/lib/storage';

interface PasscodeLockModalProps {
  isOpen: boolean;
  isSetupMode?: boolean;
  savedHash: string | null;
  onSuccess: (newHash?: string) => void;
  onCancel?: () => void;
}

export const PasscodeLockModal: React.FC<PasscodeLockModalProps> = ({
  isOpen,
  isSetupMode = false,
  savedHash,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>(isSetupMode ? 'create' : 'enter');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setError(null);
      setStep(isSetupMode ? 'create' : 'enter');
    }
  }, [isOpen, isSetupMode]);

  if (!isOpen) return null;

  const handleKeyPress = async (num: string) => {
    if (pin.length >= 6) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setError(null);

    // Auto-check on 4 digits (standard PIN length)
    if (nextPin.length === 4) {
      if (step === 'enter') {
        const hashed = await hashPasscode(nextPin);
        if (hashed === savedHash) {
          onSuccess();
        } else {
          setShake(true);
          setError('Incorrect passcode. Try again.');
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 600);
        }
      } else if (step === 'create') {
        setConfirmPin(nextPin);
        setPin('');
        setStep('confirm');
      } else if (step === 'confirm') {
        if (nextPin === confirmPin) {
          const hashed = await hashPasscode(nextPin);
          onSuccess(hashed);
        } else {
          setShake(true);
          setError('Passcodes do not match. Start over.');
          setTimeout(() => {
            setPin('');
            setConfirmPin('');
            setStep('create');
            setShake(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div
        className={`bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center transition-all ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Shield Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-200 mb-4 shadow-sm">
          {step === 'enter' ? <Lock className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
        </div>

        {/* Title & subtitle */}
        <h2 className="text-lg font-bold text-white">
          {step === 'enter'
            ? 'Enter Security Passcode'
            : step === 'create'
            ? 'Create 4-Digit Passcode'
            : 'Confirm Your Passcode'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {step === 'enter'
            ? 'Unlock your private freelance financial records'
            : step === 'create'
            ? 'Choose a 4-digit PIN to secure your expense manager'
            : 'Re-enter your 4-digit PIN to confirm'}
        </p>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3.5 my-7">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-white scale-110 shadow-sm'
                    : 'bg-zinc-800 border border-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-rose-400 text-xs font-medium mb-4 flex items-center justify-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-16 rounded-2xl bg-[#181a22] hover:bg-[#222530] active:scale-95 text-lg font-semibold text-zinc-100 font-mono border border-white/5 transition-all flex items-center justify-center cursor-pointer shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-2xl bg-[#14161d] hover:bg-[#1a1d25] text-xs font-medium text-zinc-400 border border-white/5 flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-[#181a22] hover:bg-[#222530] active:scale-95 text-lg font-semibold text-zinc-100 font-mono border border-white/5 flex items-center justify-center cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-[#14161d] hover:bg-[#1a1d25] text-xs font-medium text-zinc-400 border border-white/5 flex items-center justify-center"
          >
            Del
          </button>
        </div>

        {/* Cancel button if in setup mode */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
