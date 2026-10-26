'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Layers } from 'lucide-react';
import { Transaction, Category } from '@/types';
import { formatCash } from '@/lib/formatters';

interface FinancialGraphsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
}

export const FinancialGraphs: React.FC<FinancialGraphsProps> = ({
  transactions,
  categories,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'expenses' | 'sources'>('cashflow');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
    };
  });

  // Aggregate monthly data strictly from actual user transactions
  const monthlyData = months.map(({ label, year, monthIndex }) => {
    const txMatches = transactions.filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getMonth() === monthIndex && d.getFullYear() === year;
    });

    const incomeSum = txMatches.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const addedSum = txMatches.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const totalInflow = incomeSum + addedSum;
    const expenseSum = txMatches.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
      month: label,
      income: totalInflow,
      earnedIncome: incomeSum,
      added: addedSum,
      expense: expenseSum,
      net: totalInflow - expenseSum,
    };
  });

  const hasAnyCashflow = monthlyData.some((d) => d.income > 0 || d.expense > 0);
  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 100);

  // Expense breakdown
  const expenseCats = categories.filter(c => c.type === 'expense');
  const expenseSpending: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expenseSpending[t.categoryId] = (expenseSpending[t.categoryId] || 0) + t.amount;
  });
  const totalExp = Object.values(expenseSpending).reduce((s, v) => s + v, 0) || 1;

  const sortedExpenses = expenseCats
    .map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      amount: expenseSpending[c.id] || 0,
      pct: ((expenseSpending[c.id] || 0) / totalExp) * 100,
    }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Income sources breakdown
  const incomeSources = categories.filter(c => c.type === 'income');
  const incomeRevenue: Record<string, number> = {};
  transactions.filter(t => t.type === 'income').forEach(t => {
    incomeRevenue[t.categoryId] = (incomeRevenue[t.categoryId] || 0) + t.amount;
  });
  const totalInc = Object.values(incomeRevenue).reduce((s, v) => s + v, 0) || 1;

  const sortedIncomes = incomeSources
    .map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      amount: incomeRevenue[c.id] || 0,
      pct: ((incomeRevenue[c.id] || 0) / totalInc) * 100,
    }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl max-w-full overflow-hidden">
      {/* Top Header & Graph Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">Financial Cashflow & Analytics</h3>
          <p className="text-xs text-zinc-500">Comparative income, expenditures, and category allocation</p>
        </div>

        <div className="flex items-center gap-1 bg-[#181b23] p-1 rounded-xl border border-white/10 text-xs overflow-x-auto max-w-full scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'cashflow' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cashflow</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'expenses' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Expenses</span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'sources' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Income Sources</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Income vs Expense Cashflow Comparison */}
      {activeTab === 'cashflow' && (
        <div className="pt-6">
          <div className="flex items-center justify-end gap-4 text-xs font-mono mb-4">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Income</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Expenses</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>Net Surplus</span>
            </span>
          </div>

          {!hasAnyCashflow ? (
            <div className="h-44 flex flex-col items-center justify-center text-center py-8">
              <span className="text-xs text-zinc-400 font-medium">No cashflow recorded yet</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                Add income or expense transactions to view your comparative monthly cashflow bars.
              </span>
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 pt-2 pb-2 px-1">
              {monthlyData.map((d) => {
                const incHeight = d.income > 0 ? Math.max((d.income / maxVal) * 100, 6) : 0;
                const expHeight = d.expense > 0 ? Math.max((d.expense / maxVal) * 100, 6) : 0;

                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                      {/* Income Bar - Solid Emerald */}
                      <div className="w-full max-w-[16px] bg-white/5 rounded-t-lg relative flex items-end justify-center h-full">
                        <div
                          className="w-full rounded-t-lg bg-emerald-500 group-hover:bg-emerald-400 transition-all"
                          style={{ height: `${incHeight}%` }}
                          title={`${d.month} Inflow: ${currencySymbol}${formatCash(d.income)}${d.added > 0 ? ` (${currencySymbol}${formatCash(d.earnedIncome)} earned + ${currencySymbol}${formatCash(d.added)} added)` : ''}`}
                        />
                      </div>

                      {/* Expense Bar - Solid Rose */}
                      <div className="w-full max-w-[16px] bg-white/5 rounded-t-lg relative flex items-end justify-center h-full">
                        <div
                          className="w-full rounded-t-lg bg-rose-500 group-hover:bg-rose-400 transition-all"
                          style={{ height: `${expHeight}%` }}
                          title={`${d.month} Expenses: ${currencySymbol}${formatCash(d.expense)}`}
                        />
                      </div>
                    </div>

                    {/* Month Label */}
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Expense Allocation */}
      {activeTab === 'expenses' && (
        <div className="pt-6 space-y-3">
          {sortedExpenses.length === 0 ? (
            <div className="text-center py-10 text-xs text-zinc-500">No expenses recorded yet.</div>
          ) : (
            sortedExpenses.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-zinc-200">{c.name}</span>
                  </div>
                  <span className="font-mono text-zinc-300">
                    {currencySymbol}{formatCash(c.amount)}{' '}
                    <span className="text-zinc-500">({c.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${c.pct}%`,
                      backgroundColor: c.color || '#f97316',
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Income Sources Breakdown */}
      {activeTab === 'sources' && (
        <div className="pt-6 space-y-3">
          {sortedIncomes.length === 0 ? (
            <div className="text-center py-10 text-xs text-zinc-500">No income transactions recorded yet.</div>
          ) : (
            sortedIncomes.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-zinc-200">{c.name}</span>
                  </div>
                  <span className="font-mono text-white font-medium">
                    {currencySymbol}{formatCash(c.amount)}{' '}
                    <span className="text-zinc-500 font-normal">({c.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${c.pct}%`,
                      backgroundColor: c.color || '#10b981',
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
