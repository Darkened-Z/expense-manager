'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, Clock, Tag, Wallet as WalletIcon } from 'lucide-react';
import { Category, Wallet, TransactionType } from '@/types';
import { formatDateDDMMYYYY } from '@/lib/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  categories: Category[];
  wallets: Wallet[];
  currencySymbol: string;
  onClose: () => void;
  onSubmit: (tx: {
    amount: number;
    type: TransactionType;
    title: string;
    categoryId: string;
    walletId: string;
    clientOrPayer?: string;
    date: string;
    time: string;
    notes?: string;
    token?: string;
    frequency?: 'once' | 'monthly';
    createReminder?: boolean;
  }) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  initialType = 'expense',
  categories,
  wallets,
  currencySymbol,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [clientOrPayer, setClientOrPayer] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [token, setToken] = useState<string>('PKR');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [createReminder, setCreateReminder] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setAmount('');
      setTitle('');
      setClientOrPayer('');
      setNotes('');
      setError(null);
      setFrequency('once');
      setCreateReminder(false);

      // Default date & time to right now
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));

      // Filter available categories for type
      const suitableCats = categories.filter((c) => c.type === initialType);
      setCategoryId(suitableCats[0]?.id || categories[0]?.id || '');
      setWalletId(wallets[0]?.id || '');
      setToken(wallets[0]?.currency || 'PKR');
    }
  }, [isOpen, initialType, categories, wallets]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title or description');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!walletId) {
      setError('Please select a wallet / payment account');
      return;
    }

    onSubmit({
      amount: parsedAmount,
      type,
      title: title.trim(),
      clientOrPayer: clientOrPayer.trim() || undefined,
      categoryId,
      walletId,
      date,
      time,
      token,
      frequency,
      createReminder: frequency === 'monthly' ? createReminder : false,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#12141a] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h2 className="text-base font-bold text-white tracking-wide">
            Add {type === 'expense' ? 'Expense' : 'Income'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-[#171922] p-1 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cats = categories.filter((c) => c.type === 'expense');
                if (cats.length > 0) setCategoryId(cats[0].id);
              }}
              className={`py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
              <span>Expense (Spent)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                const cats = categories.filter((c) => c.type === 'income');
                if (cats.length > 0) setCategoryId(cats[0].id);
              }}
              className={`py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              <span>Income (Received)</span>
            </button>
          </div>

          {/* Amount and Token */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs font-semibold select-none">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#171922] text-white text-base font-mono font-bold pl-12 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency</label>
              <input
                type="text"
                value="PKR"
                disabled
                readOnly
                className="w-full bg-[#171922] text-zinc-400 text-xs font-mono uppercase px-3 py-3 rounded-xl border border-white/10 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Payment Schedule: Once vs Monthly */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Payment Schedule
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#171922] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setFrequency('once');
                  setCreateReminder(false);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  frequency === 'once'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Once (One-off)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFrequency('monthly');
                  setCreateReminder(true);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly (Recurring)
              </button>
            </div>

            {frequency === 'monthly' && (
              <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none text-zinc-300">
                <input
                  type="checkbox"
                  checked={createReminder}
                  onChange={(e) => setCreateReminder(e.target.checked)}
                  className="rounded border-white/20 bg-[#171922] text-zinc-200 focus:ring-0 w-3.5 h-3.5 accent-white cursor-pointer"
                />
                <span className="text-[11px] text-zinc-300">
                  {type === 'expense'
                    ? 'Schedule monthly reminder for this expense (salaries, rent, bills)'
                    : 'Schedule monthly reminder for this income (client retainer)'}
                </span>
              </label>
            )}
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Title / Description
            </label>
            <input
              type="text"
              placeholder={type === 'expense' ? 'e.g. Figma Subscription, Coffee, Uber' : 'e.g. Website Milestone 1, Retainer'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              required
            />
          </div>

          {/* Client or Payer (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Client / Vendor (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Studio, Apple, Starbucks"
              value={clientOrPayer}
              onChange={(e) => setClientOrPayer(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Category & Wallet Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                {type === 'expense' ? 'Expense Category' : 'Income Source'}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Wallet / Channel</label>
              <select
                value={walletId}
                onChange={(e) => {
                  setWalletId(e.target.value);
                  const wal = wallets.find((w) => w.id === e.target.value);
                  if (wal) setToken(wal.currency);
                }}
                className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.symbol}{w.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-zinc-400">Date</label>
                {date && (
                  <span className="text-[10px] font-mono text-zinc-400 font-medium">
                    ({formatDateDDMMYYYY(date)})
                  </span>
                )}
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Notes / Tags (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Tax deductible, invoice #42"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>

          {error && <div className="text-rose-400 text-xs font-medium">{error}</div>}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm"
            >
              Save {type === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
