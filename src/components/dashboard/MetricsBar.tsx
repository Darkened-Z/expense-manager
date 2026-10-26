'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, Clock } from 'lucide-react';
import { Transaction, PaymentReminder, Wallet as WalletType } from '@/types';
import { formatCash, formatCurrency } from '@/lib/formatters';

interface MetricsBarProps {
  transactions: Transaction[];
  reminders: PaymentReminder[];
  wallets: WalletType[];
  currencySymbol: string;
  onNavigateTab?: (tab: string) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  transactions,
  reminders,
  wallets,
  currencySymbol,
  onNavigateTab,
}) => {
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const totalSpent = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAdded = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalReceived - totalSpent;
  const savingsRate = totalReceived > 0 ? Math.max(0, (netSavings / totalReceived) * 100) : 0;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const currentReceivables = reminders.filter(
    (r) => r.type !== 'payable' && r.status !== 'collected' && r.dueDate <= todayStr
  );
  const pendingReceivables = currentReceivables.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = currentReceivables.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total Balance */}
      <div
        onClick={() => onNavigateTab && onNavigateTab('wallets')}
        className="bg-[#111215] border border-white/[0.06] hover:border-white/20 rounded-2xl p-4 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 uppercase tracking-wider transition-colors">Total Balance</span>
            <Wallet className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight group-hover:text-sky-300 transition-colors">
            {currencySymbol}{formatCash(totalBalance)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 font-mono">
            Across {wallets.length} accounts as of today
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <span>Manage accounts</span>
          <span className="group-hover:translate-x-0.5 transition-transform font-mono text-sky-400">→</span>
        </div>
      </div>

      {/* Income */}
      <div
        onClick={() => onNavigateTab && onNavigateTab('categories')}
        className="bg-[#111215] border border-white/[0.06] hover:border-white/20 rounded-2xl p-4 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 uppercase tracking-wider transition-colors">Income</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>+In</span>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight group-hover:text-emerald-300 transition-colors">
            {currencySymbol}{formatCash(totalReceived)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 font-mono truncate">
            {transactions.filter((t) => t.type === 'income').length} earnings records
            {totalAdded > 0 && ` (excl. ${currencySymbol}${formatCash(totalAdded)} added)`}
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <span>Income sources</span>
          <span className="group-hover:translate-x-0.5 transition-transform font-mono text-emerald-400">→</span>
        </div>
      </div>

      {/* Expenses */}
      <div
        onClick={() => onNavigateTab && onNavigateTab('categories')}
        className="bg-[#111215] border border-white/[0.06] hover:border-white/20 rounded-2xl p-4 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 uppercase tracking-wider transition-colors">Expenses</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-rose-400">
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
              <span>-Out</span>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight group-hover:text-rose-300 transition-colors">
            {currencySymbol}{formatCash(totalSpent)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 font-mono">
            {transactions.filter((t) => t.type === 'expense').length} purchases as of today
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <span>Category budgets</span>
          <span className="group-hover:translate-x-0.5 transition-transform font-mono text-rose-400">→</span>
        </div>
      </div>

      {/* Cash Surplus (Income - Expenses) */}
      <div
        onClick={() => onNavigateTab && onNavigateTab('savings')}
        className="bg-[#111215] border border-white/[0.06] hover:border-white/20 rounded-2xl p-4 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 uppercase tracking-wider transition-colors">Cash Surplus</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>{savingsRate.toFixed(0)}%</span>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight group-hover:text-amber-300 transition-colors">
            {formatCurrency(netSavings, currencySymbol)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 font-mono truncate">
            {totalAdded > 0
              ? `Net profit (+${currencySymbol}${formatCash(totalAdded)} added money)`
              : 'Unspent cash position as of today'}
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <span>Savings & reserve</span>
          <span className="group-hover:translate-x-0.5 transition-transform font-mono text-amber-400">→</span>
        </div>
      </div>

      {/* Pending Receivables */}
      <div
        onClick={() => onNavigateTab && onNavigateTab('receivables')}
        className="bg-[#111215] border border-white/[0.06] hover:border-white/20 rounded-2xl p-4 shadow-sm transition-all col-span-2 sm:col-span-1 cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 uppercase tracking-wider transition-colors">To Collect</span>
            <Clock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5 tracking-tight group-hover:text-emerald-300 transition-colors">
            {currencySymbol}{formatCash(pendingReceivables)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 font-mono">
            {pendingCount === 0 ? '0 due as of today' : `${pendingCount} actionable as of today`}
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <span>Active invoices</span>
          <span className="group-hover:translate-x-0.5 transition-transform font-mono text-emerald-400">→</span>
        </div>
      </div>
    </div>
  );
};
