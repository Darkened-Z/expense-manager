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
  ChevronDown,
} from 'lucide-react';
import { Transaction, Category, Wallet } from '@/types';
import { formatDateTimeDDMMYYYY, formatCash } from '@/lib/formatters';

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

  const formatDateTime = (dateStr: string, timeStr: string) => {
    return formatDateTimeDDMMYYYY(dateStr, timeStr);
  };

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
      <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-wide">Transaction Ledger</h3>
            <span className="text-[10px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
              {filteredTransactions.length}
            </span>
          </div>

          {/* Export CSV button */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-[#181b23] hover:bg-[#20242f] text-zinc-300 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px]">CSV</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, client, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181b23] text-xs text-zinc-200 placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Type Filter Buttons */}
            <div className="flex-1 sm:flex-initial flex items-center bg-[#181b23] p-0.5 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setSelectedType('all')}
                className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg transition-colors text-center ${
                  selectedType === 'all' ? 'bg-[#232733] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('expense')}
                className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg transition-colors text-center ${
                  selectedType === 'expense' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Spent
              </button>
              <button
                onClick={() => setSelectedType('income')}
                className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg transition-colors text-center ${
                  selectedType === 'income' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
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
                className="bg-[#181b23] text-xs text-zinc-300 border border-white/10 px-3 py-2 rounded-xl focus:outline-none focus:border-white/30 cursor-pointer appearance-none pr-7 max-w-[130px] sm:max-w-none truncate"
              >
                <option value="all">Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW (< md): Card List */}
      <div className="block md:hidden divide-y divide-white/[0.04]">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No transactions found.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const wallet = wallets.find((w) => w.id === tx.walletId);
            const IconComponent = cat ? getCategoryIcon(cat.icon) : Tag;
            const isExpense = tx.type === 'expense';

            return (
              <div key={tx.id} className="p-3.5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category / Icon Badge */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${cat?.color || '#71717a'}18`,
                      borderColor: `${cat?.color || '#71717a'}35`,
                      color: cat?.color || '#a1a1aa',
                    }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-200 text-xs truncate">{tx.title}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                      <span className="text-zinc-400 font-medium">{cat?.name || 'Uncategorized'}</span>
                      <span>•</span>
                      <span>{formatDateTime(tx.date, tx.time)}</span>
                      {tx.frequency === 'monthly' && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-400 font-mono">Monthly</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount and delete action */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className={`font-mono font-bold text-xs ${isExpense ? 'text-zinc-200' : 'text-emerald-400'}`}>
                      {isExpense ? '-' : '+'}{currencySymbol}{formatCash(tx.amount)}
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {tx.token || wallet?.currency || 'PKR'}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 text-zinc-600 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW (>= md): Full Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-[11px] font-medium text-zinc-400 bg-white/[0.01]">
              <th className="py-3 px-5">Amount ({currencySymbol.trim()})</th>
              <th className="py-3 px-4">Token / Wallet</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
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
                    <td className="py-3.5 px-5 font-mono font-bold text-white text-sm">
                      {currencySymbol}{formatCash(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5 font-semibold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        {tx.token || wallet?.currency || 'PKR'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {isExpense ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
                            <span>Spent</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Received</span>
                          </span>
                        )}
                        {tx.frequency === 'monthly' && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            (Monthly)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{tx.title}</div>
                      {tx.clientOrPayer && (
                        <div className="text-[10px] text-zinc-500">Client: {tx.clientOrPayer}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#71717a' }} />
                        <IconComponent className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{cat?.name || 'Uncategorized'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {formatDateTime(tx.date, tx.time)}
                    </td>
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
