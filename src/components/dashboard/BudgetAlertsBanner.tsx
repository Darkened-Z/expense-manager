'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { Category, Transaction } from '@/types';
import { formatCash } from '@/lib/formatters';

interface BudgetAlertsBannerProps {
  categories: Category[];
  transactions: Transaction[];
  currencySymbol: string;
  onNavigateToCategories: () => void;
}

export const BudgetAlertsBanner: React.FC<BudgetAlertsBannerProps> = ({
  categories,
  transactions,
  currencySymbol,
  onNavigateToCategories,
}) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const txDate = new Date(t.date + 'T00:00:00');
    return !isNaN(txDate.getTime()) && txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
  });

  const categoryMonthlySpent: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    categoryMonthlySpent[t.categoryId] = (categoryMonthlySpent[t.categoryId] || 0) + t.amount;
  });

  const budgetedCategories = categories.filter((c) => c.type === 'expense' && (c.budgetLimit || 0) > 0);

  const overbudgetCategories = budgetedCategories.filter((c) => {
    const spent = categoryMonthlySpent[c.id] || 0;
    return spent > (c.budgetLimit || 0);
  });

  const nearBudgetCategories = budgetedCategories.filter((c) => {
    const spent = categoryMonthlySpent[c.id] || 0;
    const limit = c.budgetLimit || 0;
    return spent >= limit * 0.8 && spent <= limit;
  });

  if (overbudgetCategories.length === 0 && nearBudgetCategories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {overbudgetCategories.map((cat) => {
        const spent = categoryMonthlySpent[cat.id] || 0;
        const limit = cat.budgetLimit || 0;
        const overAmount = spent - limit;

        return (
          <div
            key={cat.id}
            onClick={onNavigateToCategories}
            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-rose-200 truncate">
                  Monthly Budget Exceeded: <span className="text-white">{cat.name}</span>
                </div>
                <div className="text-[11px] text-rose-300/80 font-mono mt-0.5">
                  Spent {currencySymbol}{formatCash(spent)} of {currencySymbol}{formatCash(limit)} (Over by {currencySymbol}{formatCash(overAmount)})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 group-hover:text-white shrink-0">
              <span className="hidden sm:inline">Manage Cap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        );
      })}

      {nearBudgetCategories.map((cat) => {
        const spent = categoryMonthlySpent[cat.id] || 0;
        const limit = cat.budgetLimit || 0;
        const remaining = limit - spent;
        const percent = Math.round((spent / limit) * 100);

        return (
          <div
            key={cat.id}
            onClick={onNavigateToCategories}
            className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-200 truncate">
                  Budget Warning: <span className="text-white">{cat.name}</span> ({percent}% used)
                </div>
                <div className="text-[11px] text-amber-300/80 font-mono mt-0.5">
                  {currencySymbol}{formatCash(remaining)} remaining before reaching monthly limit
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 group-hover:text-white shrink-0">
              <span className="hidden sm:inline">View</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
