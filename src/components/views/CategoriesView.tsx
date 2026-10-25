'use client';

import React, { useState } from 'react';
import { Tag, Plus, Coffee, Car, Laptop, Briefcase, Box, Zap, Globe, FileText, ShoppingBag, Repeat } from 'lucide-react';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Category['type']>('expense');
  const [color, setColor] = useState('#f97316');
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
      default: return Tag;
    }
  };

  // Spending per category this month
  const categorySpending: Record<string, number> = {};
  transactions.forEach((t) => {
    categorySpending[t.categoryId] = (categorySpending[t.categoryId] || 0) + t.amount;
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCategory({
      name: name.trim(),
      type,
      color,
      icon: 'Tag',
      budgetLimit: parseFloat(budgetLimit) || undefined,
    });

    setShowAddModal(false);
    setName('');
    setBudgetLimit('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Expense & Income Categories</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Organize transactions and set monthly budget caps for software, tech, and travel
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon);
          const spent = categorySpending[cat.id] || 0;
          const limit = cat.budgetLimit;
          const percent = limit ? Math.min((spent / limit) * 100, 100) : 0;
          const isOverBudget = limit && spent > limit;

          return (
            <div
              key={cat.id}
              className="bg-[#12141a] border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-2xl border"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      borderColor: `${cat.color}30`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {cat.type}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-white text-sm">
                    {currencySymbol}{spent.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Total volume</div>
                </div>
              </div>

              {/* Budget Limit Progress Bar */}
              {limit && (
                <div className="mt-5 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
                    <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
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
                          ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                          : percent > 75
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-orange-500 to-amber-400'
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

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base pb-3 border-b border-white/5">
              Add New Category
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hosting & Cloud, Coffee & Snacks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Classification</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Color Theme</label>
                  <div className="flex items-center gap-2 mt-1">
                    {['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'].map((c) => (
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
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Monthly Budget Cap (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500.00"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
                />
              </div>

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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-orange-500 to-amber-500"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
