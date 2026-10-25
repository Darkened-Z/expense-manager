'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
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
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Transaction, Category, Wallet } from '@/types';

interface TransactionsLedgerProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  currencySymbol: string;
  onDeleteTransaction: (id: string) => void;
  onExportCSV: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TransactionsLedger: React.FC<TransactionsLedgerProps> = ({
  transactions,
  categories,
  wallets,
  currencySymbol,
  onDeleteTransaction,
  onExportCSV,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  // Icon mapping helper
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

  // Format relative or formatted time
  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      if (dateStr === today) {
        return `Today, ${timeStr}`;
      }
      return `${dateStr} • ${timeStr}`;
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  };

  // Filtering
  const filteredTransactions = transactions.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(query);
      const matchClient = t.clientOrPayer?.toLowerCase().includes(query);
      const matchNotes = t.notes?.toLowerCase().includes(query);
      const catName = categories.find((c) => c.id === t.categoryId)?.name.toLowerCase() || '';
      if (!matchTitle && !matchClient && !matchNotes && !catName.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="bg-[#12141a] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white tracking-wide">Transaction</h3>
          <span className="text-[11px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
            {filteredTransactions.length} entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#181b23] text-xs text-zinc-200 placeholder-zinc-500 pl-8 pr-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500/50 w-44 sm:w-56"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center bg-[#181b23] p-0.5 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedType === 'all' ? 'bg-[#232733] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedType === 'expense' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Spent
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedType === 'income' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Received
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#181b23] text-xs text-zinc-300 border border-white/10 px-3 py-1.5 rounded-xl focus:outline-none focus:border-orange-500/50 cursor-pointer appearance-none pr-7"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export CSV */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-[#181b23] hover:bg-[#20242f] text-zinc-300 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-[11px] font-medium text-zinc-400 bg-white/[0.01]">
              <th className="py-3 px-5">Amount (USD)</th>
              <th className="py-3 px-4">Token / Method</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Transactions Name</th>
              <th className="py-3 px-4">Transactions Type</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500">
                  No transactions match your search or filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const wallet = wallets.find((w) => w.id === tx.walletId);
                const IconComponent = cat ? getCategoryIcon(cat.icon) : Tag;
                const isExpense = tx.type === 'expense';

                return (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Amount */}
                    <td className="py-3.5 px-5 font-mono font-bold text-white text-sm">
                      {currencySymbol}{tx.amount.toFixed(2)}
                    </td>

                    {/* Token */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5 font-semibold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {tx.token || wallet?.currency || 'USD'}
                      </span>
                    </td>

                    {/* Type indicator */}
                    <td className="py-3.5 px-4">
                      {isExpense ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Spent</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Received</span>
                        </span>
                      )}
                    </td>

                    {/* Transaction Name / Client */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{tx.title}</div>
                      {tx.clientOrPayer && (
                        <div className="text-[10px] text-zinc-500">Client: {tx.clientOrPayer}</div>
                      )}
                    </td>

                    {/* Transactions Type */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isExpense ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {isExpense ? '↓ Expenses' : '↑ Income'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                        style={{
                          backgroundColor: `${cat?.color || '#3b82f6'}15`,
                          borderColor: `${cat?.color || '#3b82f6'}30`,
                          color: cat?.color || '#93c5fd',
                        }}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span>{cat?.name || 'Uncategorized'}</span>
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {formatDateTime(tx.date, tx.time)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
