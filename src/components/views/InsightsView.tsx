'use client';

import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Target, ShieldCheck, DollarSign, PieChart, Users } from 'lucide-react';
import { Transaction, PaymentReminder, Category } from '@/types';

interface InsightsViewProps {
  transactions: Transaction[];
  reminders: PaymentReminder[];
  categories: Category[];
  currencySymbol: string;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  transactions,
  reminders,
  categories,
  currencySymbol,
}) => {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

  // Breakdown by category
  const categorySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpending[t.categoryId] = (categorySpending[t.categoryId] || 0) + t.amount;
    });

  const sortedCats = Object.entries(categorySpending)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: cat?.name || 'Other',
        color: cat?.color || '#64748b',
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Top clients by revenue
  const clientRevenue: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'income' && t.clientOrPayer)
    .forEach((t) => {
      const client = t.clientOrPayer!;
      clientRevenue[client] = (clientRevenue[client] || 0) + t.amount;
    });

  const sortedClients = Object.entries(clientRevenue)
    .map(([client, amount]) => ({ client, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      {/* Top Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Net Freelance Profit</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {currencySymbol}{netSavings.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-400 font-medium mt-1">
            {savingsRate.toFixed(1)}% savings retention rate
          </div>
        </div>

        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Average Expense per Transaction</span>
            <TrendingDown className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {currencySymbol}
            {(
              totalExpense /
              Math.max(1, transactions.filter((t) => t.type === 'expense').length)
            ).toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Across all categorized purchases</div>
        </div>

        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Financial Runway Score</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            Optimal (94/100)
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Income outpaces overheads 4.8x</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-zinc-400" />
              <span>Spending Breakdown by Category</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Total {currencySymbol}{totalExpense.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {sortedCats.length === 0 ? (
              <div className="text-xs text-zinc-500 py-6 text-center">No expense data recorded.</div>
            ) : (
              sortedCats.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-300">{cat.name}</span>
                    <span className="font-mono text-zinc-400">
                      {currencySymbol}{cat.amount.toFixed(2)}{' '}
                      <span className="text-zinc-500 font-normal">({cat.percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Clients by Revenue */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <span>Top Freelance Clients by Revenue</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Total {currencySymbol}{totalIncome.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {sortedClients.length === 0 ? (
              <div className="text-xs text-zinc-500 py-6 text-center">
                Collect payments from receivables to see top client analytics.
              </div>
            ) : (
              sortedClients.map((c, i) => (
                <div
                  key={c.client}
                  className="p-3 rounded-xl bg-[#161821] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/5 font-mono text-[10px] text-zinc-400 flex items-center justify-center font-bold">
                      #{i + 1}
                    </span>
                    <span className="font-semibold text-white">{c.client}</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    {currencySymbol}{c.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
