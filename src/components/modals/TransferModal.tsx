'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Calendar, Wallet as WalletIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { Wallet } from '@/types';
import { formatCash } from '@/lib/formatters';

interface TransferModalProps {
  isOpen: boolean;
  wallets: Wallet[];
  currencySymbol: string;
  onClose: () => void;
  onSubmit: (data: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    time?: string;
    notes?: string;
  }) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  wallets,
  currencySymbol,
  onClose,
  onSubmit,
}) => {
  const [fromWalletId, setFromWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setAmount('');
      setNotes('');
      setError(null);

      // Default from first wallet, to second wallet if available
      if (wallets.length >= 2) {
        setFromWalletId(wallets[0].id);
        setToWalletId(wallets[1].id);
      } else if (wallets.length === 1) {
        setFromWalletId(wallets[0].id);
        setToWalletId('');
      }
    }
  }, [isOpen, wallets]);

  if (!isOpen) return null;

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  const numAmount = Math.round(parseFloat(amount)) || 0;
  const isOverBalance = fromWallet && numAmount > fromWallet.balance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromWalletId) {
      setError('Please select a source account (From Wallet).');
      return;
    }
    if (!toWalletId) {
      setError('Please select a destination account (To Wallet).');
      return;
    }
    if (fromWalletId === toWalletId) {
      setError('Source and Destination accounts cannot be the same.');
      return;
    }
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid transfer amount.');
      return;
    }

    onSubmit({
      fromWalletId,
      toWalletId,
      amount: numAmount,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/20 text-sky-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Transfer Between Accounts</h3>
              <p className="text-[11px] text-zinc-400">ATM withdrawals, Raast, or internal balance moves</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transfer Visual Preview */}
        {fromWallet && toWallet && (
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">From</span>
                <span className="font-semibold text-zinc-200 truncate block">{fromWallet.name}</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {currencySymbol}{formatCash(fromWallet.balance)}
                </span>
              </div>
              <div className="p-1.5 rounded-full bg-white/5 text-zinc-400">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 text-right">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">To</span>
                <span className="font-semibold text-zinc-200 truncate block">{toWallet.name}</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {currencySymbol}{formatCash(toWallet.balance)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* From & To Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">From Account</label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full bg-[#181b23] text-xs text-zinc-200 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/30"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({currencySymbol}{formatCash(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">To Account</label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full bg-[#181b23] text-xs text-zinc-200 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/30"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                    {w.name} {w.id === fromWalletId ? '(Source)' : `(${currencySymbol}${formatCash(w.balance)})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-zinc-400">Transfer Amount ({currencySymbol.trim()})</label>
              {isOverBalance && (
                <span className="text-[10px] text-amber-400">Exceeds current source balance</span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#181b23] text-white font-mono text-base font-bold pl-3.5 pr-14 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                autoFocus
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 font-semibold">
                PKR
              </span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#181b23] text-xs text-zinc-200 pl-9 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Notes / Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. ATM cash withdrawal, Raast transfer to bank"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#181b23] text-xs text-zinc-200 placeholder-zinc-500 px-3.5 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-300">No impact on Income or Expense totals:</div>
            <div>Transfers reallocate your cash between accounts without distorting your freelance profit or monthly spending statistics.</div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-transparent hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Confirm Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
