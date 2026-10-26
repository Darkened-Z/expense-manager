'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Coffee,
  Car,
  Laptop,
  Briefcase,
  Box,
  Zap,
  Globe,
  FileText,
  ShoppingBag,
  Repeat,
  TrendingUp,
  DollarSign,
  Trash2,
  Pencil,
  AlertTriangle,
  X,
  ArrowLeftRight,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { Category, Transaction } from '@/types';
import { formatCash, formatDateDDMMYYYY } from '@/lib/formatters';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  currencySymbol: string;
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory?: (id: string, updates: Partial<Category>) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  currencySymbol,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#64748b');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Editing Budget Modal state
  const [editingBudgetCat, setEditingBudgetCat] = useState<Category | null>(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState<string>('');

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee': return Coffee;
      case 'Car': return Car;
      case 'Laptop': return Laptop;
      case 'Briefcase': return Briefcase;
      case 'Box': return Box;
      case 'Zap': return Zap;
      case 'Globe': return Globe;
      case 'FileText': return FileText;
      case 'ShoppingBag': return ShoppingBag;
      case 'Repeat': return Repeat;
      case 'TrendingUp': return TrendingUp;
      case 'DollarSign': return DollarSign;
      case 'ArrowLeftRight': return ArrowLeftRight;
      default: return Tag;
    }
  };

  // Compute monthly spending strictly in the current calendar month
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

  // All-time totals for reference
  const categoryAllTimeTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type !== 'transfer') {
      categoryAllTimeTotals[t.categoryId] = (categoryAllTimeTotals[t.categoryId] || 0) + t.amount;
    }
  });

  const displayedList = categories.filter((c) => c.type === activeTab);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCategory({
      name: name.trim(),
      type: activeTab,
      color,
      icon: activeTab === 'income' ? 'TrendingUp' : 'Tag',
      budgetLimit: activeTab === 'expense' && budgetLimit ? Math.round(parseFloat(budgetLimit)) : undefined,
    });

    setShowAddModal(false);
    setName('');
    setBudgetLimit('');
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudgetCat || !onUpdateCategory) return;

    const parsed = Math.round(parseFloat(editBudgetAmount));
    onUpdateCategory(editingBudgetCat.id, {
      budgetLimit: !isNaN(parsed) && parsed > 0 ? parsed : 0,
    });

    setEditingBudgetCat(null);
    setEditBudgetAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Switcher */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-full overflow-hidden">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            {activeTab === 'expense' ? 'Expense Categories & Budgets' : 'Income Sources'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {activeTab === 'expense'
              ? 'Organize outgoing expenditures and configure monthly spending caps'
              : 'Classify incoming freelance contracts, retainers, salary, and dividends'}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-full">
          {/* Tabs */}
          <div className="flex items-center bg-[#181b23] p-1 rounded-xl border border-white/10 text-xs overflow-x-auto max-w-full scrollbar-none shrink-0">
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium shrink-0 whitespace-nowrap ${
                activeTab === 'expense' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium shrink-0 whitespace-nowrap ${
                activeTab === 'income' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Income Sources
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New {activeTab === 'expense' ? 'Category' : 'Source'}</span>
          </button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {displayedList.length === 0 ? (
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <Tag className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h4 className="text-sm font-semibold text-white">
            No {activeTab === 'expense' ? 'Expense Categories' : 'Income Sources'} Yet
          </h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Create custom tags to track your {activeTab === 'expense' ? 'expenditures' : 'revenue channels'}.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New {activeTab === 'expense' ? 'Category' : 'Source'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
          {displayedList.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const allTimeTotal = categoryAllTimeTotals[cat.id] || 0;
            const monthlySpent = categoryMonthlySpent[cat.id] || 0;
            const limit = cat.budgetLimit || 0;
            const percent = limit > 0 ? Math.min((monthlySpent / limit) * 100, 100) : 0;
            const isOverBudget = limit > 0 && monthlySpent > limit;
            const isNearBudget = limit > 0 && monthlySpent >= limit * 0.8 && monthlySpent <= limit;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryDetails(cat)}
                className="bg-[#12141a] border border-white/5 hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between cursor-pointer group min-w-0 overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="p-3 rounded-2xl border transition-colors shrink-0 group-hover:scale-105"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}35`,
                          color: cat.color,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-sky-300 transition-colors">{cat.name}</h4>
                          {cat.id.startsWith('cat-payable-') && (
                            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 shrink-0">
                              Monthly Payable
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          {cat.type === 'expense' ? 'Expense' : 'Income'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-white">
                          {currencySymbol}{formatCash(cat.type === 'expense' ? monthlySpent : allTimeTotal)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {cat.type === 'income' ? 'Total Revenue' : 'Spent This Month'}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${cat.name}"?`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors -mr-1 cursor-pointer"
                        title={`Delete ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Monthly Budget Cap Section for Expenses */}
                {cat.type === 'expense' && (
                  <div className="mt-5 pt-3 border-t border-white/5">
                    {limit > 0 ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
                          <div className="flex items-center gap-1.5">
                            {isOverBudget ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>{((monthlySpent / limit) * 100).toFixed(0)}% Overbudget!</span>
                              </span>
                            ) : isNearBudget ? (
                              <span className="text-amber-400 font-semibold">
                                {percent.toFixed(0)}% near limit
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-medium">
                                {percent.toFixed(0)}% used
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400 font-mono">
                              Limit: {currencySymbol}{formatCash(limit)}
                            </span>
                            {onUpdateCategory && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBudgetCat(cat);
                                  setEditBudgetAmount(limit.toString());
                                }}
                                className="p-1 text-zinc-500 hover:text-white rounded transition-colors cursor-pointer"
                                title="Edit monthly budget cap"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverBudget
                                ? 'bg-rose-500'
                                : isNearBudget
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500 font-mono">No budget cap set</span>
                        {onUpdateCategory && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBudgetCat(cat);
                              setEditBudgetAmount('');
                            }}
                            className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors cursor-pointer"
                          >
                            + Set Monthly Cap
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-white/[0.03] flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  <span>View category transactions</span>
                  <span className="group-hover:translate-x-0.5 transition-transform font-mono text-sky-400">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Budget Cap Modal */}
      {editingBudgetCat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-sm">
                Monthly Budget Cap: {editingBudgetCat.name}
              </h3>
              <button onClick={() => setEditingBudgetCat(null)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Monthly Limit ({currencySymbol.trim()})
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 20000 (0 to remove limit)"
                  value={editBudgetAmount}
                  onChange={(e) => setEditBudgetAmount(e.target.value)}
                  className="w-full bg-[#171922] text-white text-sm font-mono font-bold px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  autoFocus
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Set to 0 to remove budget alerts for this category.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBudgetCat(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition-colors shadow-sm"
                >
                  Save Budget Cap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base pb-3 border-b border-white/5">
              Add New {activeTab === 'expense' ? 'Expense Category' : 'Income Source'}
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  {activeTab === 'expense' ? 'Category Name' : 'Income Source Name'}
                </label>
                <input
                  type="text"
                  placeholder={activeTab === 'expense' ? 'e.g. Groceries & Dining, Fuel, Utilities' : 'e.g. Retainer, Royalty, Salary'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Color Accent</label>
                <div className="flex items-center gap-2 mt-1">
                  {['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        color === c ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {activeTab === 'expense' && (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Monthly Budget Cap (Optional)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 25000"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm"
                >
                  Save {activeTab === 'expense' ? 'Category' : 'Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Category Breakdown & Full Transaction History Modal */}
      {selectedCategoryDetails && (() => {
        const catTxs = transactions
          .filter((t) => t.categoryId === selectedCategoryDetails.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const monthlySpent = categoryMonthlySpent[selectedCategoryDetails.id] || 0;
        const allTimeTotal = categoryAllTimeTotals[selectedCategoryDetails.id] || 0;
        const limit = selectedCategoryDetails.budgetLimit || 0;
        const percent = limit > 0 ? Math.min((monthlySpent / limit) * 100, 100) : 0;
        const Icon = getCategoryIcon(selectedCategoryDetails.icon);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div
                    className="p-3.5 rounded-2xl border"
                    style={{
                      backgroundColor: `${selectedCategoryDetails.color}15`,
                      borderColor: `${selectedCategoryDetails.color}35`,
                      color: selectedCategoryDetails.color,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg sm:text-xl">{selectedCategoryDetails.name}</h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/5">
                        {selectedCategoryDetails.type === 'expense' ? 'Expense Category' : 'Income Source'}
                      </span>
                      {selectedCategoryDetails.id.startsWith('cat-payable-') && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          Auto-Linked Monthly Payable
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {catTxs.length} total recorded transaction{catTxs.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCategoryDetails(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Financial Metrics */}
              <div className="p-5 sm:p-6 border-b border-white/10 grid grid-cols-3 gap-3 bg-[#0d0f14]/50">
                {selectedCategoryDetails.type === 'expense' ? (
                  <>
                    <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Spent This Month</span>
                      <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                        {currencySymbol}{formatCash(monthlySpent)}
                      </div>
                    </div>

                    <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Monthly Budget Cap</span>
                      <div className="text-lg sm:text-xl font-bold font-mono text-zinc-200 mt-1">
                        {limit > 0 ? `${currencySymbol}${formatCash(limit)}` : 'None'}
                      </div>
                      {limit > 0 && (
                        <span className={`text-[10px] font-mono font-semibold block mt-0.5 ${
                          monthlySpent > limit ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {percent.toFixed(0)}% used
                        </span>
                      )}
                    </div>

                    <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">All-Time Outflow</span>
                      <div className="text-lg sm:text-xl font-bold font-mono text-rose-400 mt-1">
                        {currencySymbol}{formatCash(allTimeTotal)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Total Revenue</span>
                      <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
                        +{currencySymbol}{formatCash(allTimeTotal)}
                      </div>
                    </div>

                    <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Total Records</span>
                      <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                        {catTxs.length}
                      </div>
                    </div>

                    <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Average Payout</span>
                      <div className="text-lg sm:text-xl font-bold font-mono text-sky-400 mt-1">
                        {catTxs.length > 0
                          ? `${currencySymbol}${formatCash(Math.round(allTimeTotal / catTxs.length))}`
                          : `${currencySymbol}0`}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Bar */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between gap-2 bg-[#12141a]">
                <div className="text-xs text-zinc-400 font-medium">
                  Associated Transactions <span className="font-mono text-zinc-500">({catTxs.length})</span>
                </div>
                {selectedCategoryDetails.type === 'expense' && onUpdateCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      const c = selectedCategoryDetails;
                      setSelectedCategoryDetails(null);
                      setEditingBudgetCat(c);
                      setEditBudgetAmount((c.budgetLimit || 0) > 0 ? (c.budgetLimit || 0).toString() : '');
                    }}
                    className="px-3 py-1.5 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{limit > 0 ? 'Edit Budget Cap' : 'Set Budget Cap'}</span>
                  </button>
                )}
              </div>

              {/* Transactions List */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[45vh] space-y-2">
                {catTxs.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No transactions recorded under this category yet.</p>
                  </div>
                ) : (
                  catTxs.map((tx) => {
                    const isCredit = tx.type === 'income' || tx.type === 'deposit';

                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-[#171922] hover:bg-[#1a1e29] border border-white/5 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl border flex-shrink-0 ${
                              isCredit
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {tx.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                              <span>{formatDateDDMMYYYY(tx.date)}</span>
                              {tx.clientOrPayer && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{tx.clientOrPayer}</span>
                                </>
                              )}
                              {tx.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate text-zinc-400 italic">&ldquo;{tx.notes}&rdquo;</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-xs font-mono font-bold ${
                              isCredit ? 'text-emerald-400' : 'text-zinc-200'
                            }`}
                          >
                            {isCredit ? '+' : '-'}{currencySymbol}{formatCash(tx.amount)}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase">
                            {tx.type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/5 bg-[#0d0f14]/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryDetails(null)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
