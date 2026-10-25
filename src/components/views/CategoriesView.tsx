'use client';

import React, { useState } from 'react';
import { Tag, Plus, Coffee, Car, Laptop, Briefcase, Box, Zap, Globe, FileText, ShoppingBag, Repeat, TrendingUp, DollarSign } from 'lucide-react';
import { Category, Transaction } from '@/types';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  currencySymbol: string;
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  currencySymbol,
  onAddCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#64748b');
  const [budgetLimit, setBudgetLimit] = useState('');

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
      default: return Tag;
    }
  };

  // Spending / Revenue per category
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
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
      budgetLimit: activeTab === 'expense' && budgetLimit ? parseFloat(budgetLimit) : undefined,
    });

    setShowAddModal(false);
    setName('');
    setBudgetLimit('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Switcher */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            {activeTab === 'expense' ? 'Expense Categories' : 'Income Sources'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {activeTab === 'expense'
              ? 'Organize outgoing expenditures and configure monthly budget caps'
              : 'Classify incoming freelance contracts, retainers, salary, and dividends'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center bg-[#181b23] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === 'expense' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeTab === 'income' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Income Sources
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New {activeTab === 'expense' ? 'Category' : 'Source'}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedList.map((cat) => {
          const Icon = getCategoryIcon(cat.icon);
          const total = categoryTotals[cat.id] || 0;
          const limit = cat.budgetLimit;
          const percent = limit ? Math.min((total / limit) * 100, 100) : 0;
          const isOverBudget = limit && total > limit;

          return (
            <div
              key={cat.id}
              className="bg-[#12141a] border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-2xl border transition-colors"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      borderColor: `${cat.color}35`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {cat.type === 'expense' ? 'Expense' : 'Income'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-white">
                    {currencySymbol}{total.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {cat.type === 'income' ? 'Revenue' : 'Spent'}
                  </div>
                </div>
              </div>

              {/* Budget Limit Progress Bar for Expenses */}
              {cat.type === 'expense' && limit && (
                <div className="mt-5 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
                    <span className={isOverBudget ? 'text-rose-400 font-medium' : 'text-zinc-400'}>
                      {percent.toFixed(0)}% of limit
                    </span>
                    <span className="text-zinc-500">
                      Cap: {currencySymbol}{limit.toFixed(2)}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverBudget
                          ? 'bg-rose-400/90'
                          : 'bg-zinc-300'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
                  placeholder={activeTab === 'expense' ? 'e.g. Server Hosting, Equipment' : 'e.g. Retainer, Royalty, Salary'}
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
                    step="0.01"
                    placeholder="e.g. 500.00"
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
    </div>
  );
};
