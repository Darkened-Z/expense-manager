'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, PiggyBank, Clock } from 'lucide-react';
import { Transaction, PaymentReminder, Wallet as WalletType } from '@/types';

interface MetricsBarProps {
  transactions: Transaction[];
  reminders: PaymentReminder[];
  wallets: WalletType[];
  currencySymbol: string;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  transactions,
  reminders,
  wallets,
  currencySymbol,
}) => {
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const totalSpent = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalReceived - totalSpent;
  const savingsRate = totalReceived > 0 ? Math.max(0, (netSavings / totalReceived) * 100) : 0;

  const pendingReceivables = reminders
    .filter((r) => r.status !== 'collected')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingCount = reminders.filter((r) => r.status !== 'collected').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total Balance */}
      <div className="bg-[#111215] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Balance</span>
          <Wallet className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
          {currencySymbol}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-500 mt-1 font-mono">
          Across {wallets.length} accounts
        </div>
      </div>

      {/* Income */}
      <div className="bg-[#111215] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Income</span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            <span>+In</span>
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
          {currencySymbol}{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-500 mt-1 font-mono">
          {transactions.filter((t) => t.type === 'income').length} deposits
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-[#111215] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Expenses</span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
            <ArrowDownLeft className="w-3 h-3 text-rose-400" />
            <span>-Out</span>
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
          {currencySymbol}{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-500 mt-1 font-mono">
          {transactions.filter((t) => t.type === 'expense').length} purchases
        </div>
      </div>

      {/* Net Savings */}
      <div className="bg-[#111215] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Net Savings</span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
            <PiggyBank className="w-3 h-3 text-zinc-400" />
            <span>{savingsRate.toFixed(0)}%</span>
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
          {currencySymbol}{netSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-500 mt-1 font-mono">
          Retention surplus
        </div>
      </div>

      {/* Pending Receivables */}
      <div className="bg-[#111215] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 shadow-sm transition-all col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">To Collect</span>
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
          {currencySymbol}{pendingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-400 mt-1 font-mono">
          {pendingCount} pending invoice{pendingCount === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
};
