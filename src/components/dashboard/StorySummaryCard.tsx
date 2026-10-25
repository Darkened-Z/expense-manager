'use client';

import React from 'react';
import { Sparkles, ArrowDownRight, ArrowUpRight, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { Transaction, PaymentReminder, Category } from '@/types';

interface StorySummaryCardProps {
  transactions: Transaction[];
  reminders: PaymentReminder[];
  categories: Category[];
  currencySymbol: string;
}

export const StorySummaryCard: React.FC<StorySummaryCardProps> = ({
  transactions,
  reminders,
  categories,
  currencySymbol,
}) => {
  // Compute analytics for story summary
  const totalSpent = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingReceivables = reminders
    .filter((r) => r.status !== 'collected')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingCount = reminders.filter((r) => r.status !== 'collected').length;
  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;

  // Compute category breakdown for expenses
  const categorySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpending[t.categoryId] = (categorySpending[t.categoryId] || 0) + t.amount;
    });

  const sortedCatEntries = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
  const topCat1 = sortedCatEntries[0] ? categories.find((c) => c.id === sortedCatEntries[0][0]) : null;
  const topCat1Amount = sortedCatEntries[0] ? sortedCatEntries[0][1] : 0;
  const topCat2 = sortedCatEntries[1] ? categories.find((c) => c.id === sortedCatEntries[1][0]) : null;
  const topCat2Amount = sortedCatEntries[1] ? sortedCatEntries[1][1] : 0;

  // Highest single expense
  const expenseTxs = transactions.filter((t) => t.type === 'expense');
  const highestSpend = expenseTxs.length > 0 ? Math.max(...expenseTxs.map((t) => t.amount)) : 0;

  // Most used token or currency
  const tokenCounts: Record<string, number> = {};
  transactions.forEach((t) => {
    const tok = t.token || 'USD';
    tokenCounts[tok] = (tokenCounts[tok] || 0) + 1;
  });
  const mostUsedToken = Object.entries(tokenCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD';

  return (
    <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide">Freelance Financial Story Summary</h2>
      </div>

      {/* Natural Narrative Text */}
      <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-4xl">
        <span>In the last 30 days, you spent </span>
        <span className="font-semibold text-white font-mono">{currencySymbol}{totalSpent.toFixed(2)}</span>
        <span> across </span>
        <span className="font-semibold text-white">{transactions.length} transactions</span>
        <span> and collected </span>
        <span className="font-semibold text-emerald-400 font-mono">{currencySymbol}{totalReceived.toFixed(2)}</span>
        <span> in freelance revenue. </span>

        {topCat1 && (
          <>
            <span>Your biggest expense category was </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] sm:text-xs text-orange-300 font-medium border border-white/5">
              {topCat1.name} — {currencySymbol}{topCat1Amount.toFixed(2)}
            </span>
          </>
        )}

        {topCat2 && (
          <>
            <span> followed by </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] sm:text-xs text-zinc-300 font-medium border border-white/5">
              {topCat2.name} — {currencySymbol}{topCat2Amount.toFixed(2)}
            </span>
            .
          </>
        )}

        {pendingCount > 0 && (
          <span className="block mt-2 text-[11px] sm:text-xs text-zinc-400">
            <span className="text-amber-400 font-medium">Payment Alert:</span> You have{' '}
            <strong className="text-white">{pendingCount} client receivables</strong> totaling{' '}
            <strong className="text-emerald-400 font-mono">{currencySymbol}{pendingReceivables.toFixed(2)}</strong> pending collection.
            {overdueCount > 0 && (
              <span className="text-rose-400 font-semibold ml-1">
                ({overdueCount} {overdueCount === 1 ? 'is' : 'are'} overdue and requiring a follow-up!)
              </span>
            )}
          </span>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5">
        <div className="bg-[#161821] p-2.5 sm:p-3.5 rounded-xl border border-white/5">
          <div className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Total Spent</div>
          <div className="text-sm sm:text-base font-bold text-rose-400 font-mono mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
            {currencySymbol}{totalSpent.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#161821] p-2.5 sm:p-3.5 rounded-xl border border-white/5">
          <div className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Total Received</div>
          <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            {currencySymbol}{totalReceived.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#161821] p-2.5 sm:p-3.5 rounded-xl border border-white/5">
          <div className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Pending Receivables</div>
          <div className="text-sm sm:text-base font-bold text-amber-400 font-mono mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            {currencySymbol}{pendingReceivables.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#161821] p-2.5 sm:p-3.5 rounded-xl border border-white/5">
          <div className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Highest Single Spend</div>
          <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
            {currencySymbol}{highestSpend.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#161821] p-2.5 sm:p-3.5 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Most Used Asset</div>
          <div className="text-sm sm:text-base font-bold text-orange-400 font-mono mt-1 uppercase">
            {mostUsedToken}
          </div>
        </div>
      </div>
    </div>
  );
};
