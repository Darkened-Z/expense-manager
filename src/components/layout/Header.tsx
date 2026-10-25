'use client';

import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Plus,
  Calendar,
  Wallet as WalletIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from 'lucide-react';
import { Wallet, PaymentReminder } from '@/types';

interface HeaderProps {
  currentTab: string;
  wallets: Wallet[];
  selectedWalletId: string;
  setSelectedWalletId: (id: string) => void;
  dateRange: string;
  setDateRange: (range: any) => void;
  reminders: PaymentReminder[];
  onOpenAddTx: (type: 'expense' | 'income') => void;
  onOpenAddReminder: () => void;
  onCollectReminder: (id: string) => void;
  onNavigateToReminders: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  wallets,
  selectedWalletId,
  setSelectedWalletId,
  dateRange,
  setDateRange,
  reminders,
  onOpenAddTx,
  onOpenAddReminder,
  onCollectReminder,
  onNavigateToReminders,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Active reminders needing attention
  const urgentReminders = reminders.filter(
    (r) => r.status === 'overdue' || r.status === 'due_today' || r.status === 'pending'
  );
  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;
  const dueTodayCount = reminders.filter((r) => r.status === 'due_today').length;
  const totalAlerts = overdueCount + dueTodayCount;

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Dashboard', sub: "Here's your performance summary" };
      case 'transactions':
        return { title: 'Transactions', sub: "Here's your transactions summary" };
      case 'reminders':
        return { title: 'Client Receivables', sub: 'Manage pending freelance invoices and payment due dates' };
      case 'wallets':
        return { title: 'Wallets & Accounts', sub: 'Monitor multiple currency balances and payout channels' };
      case 'categories':
        return { title: 'Categories & Budgets', sub: 'Organize expenses and set monthly expenditure limits' };
      case 'insights':
        return { title: 'Financial Insights', sub: 'In-depth cashflow analytics, burn rate and trends' };
      case 'settings':
        return { title: 'Settings & Security', sub: 'Passcode lock, currency, audio alerts and data backup' };
      default:
        return { title: 'Expense Manager', sub: 'Overview' };
    }
  };

  const { title, sub } = getPageTitle();

  return (
    <header className="px-8 py-5 border-b border-white/5 bg-[#090a0d]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
      </div>

      {/* Controls & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Wallet Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowWalletDropdown(!showWalletDropdown)}
            className="flex items-center gap-2 bg-[#14161d] hover:bg-[#1a1d26] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 transition-colors"
          >
            <WalletIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono text-zinc-200">
              {selectedWallet ? (selectedWallet.accountNumber || selectedWallet.name) : 'All Wallets'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {showWalletDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-[#14161d] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setSelectedWalletId('all');
                  setShowWalletDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 ${
                  selectedWalletId === 'all' ? 'text-orange-400 font-semibold bg-white/5' : 'text-zinc-300'
                }`}
              >
                <span>All Wallets & Accounts</span>
                <span className="text-[10px] text-zinc-500">Combined</span>
              </button>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedWalletId(w.id);
                    setShowWalletDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 ${
                    selectedWalletId === w.id ? 'text-orange-400 font-semibold bg-white/5' : 'text-zinc-300'
                  }`}
                >
                  <div>
                    <div>{w.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{w.accountNumber || w.type.toUpperCase()}</div>
                  </div>
                  <div className="font-mono font-medium text-zinc-200">
                    {w.symbol}{w.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-2 bg-[#14161d] hover:bg-[#1a1d26] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {dateRange === '30d'
                ? 'Last 30 days'
                : dateRange === 'this_month'
                ? 'This Month'
                : dateRange === '90d'
                ? 'Last 90 days'
                : 'All Time'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {showDateDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-[#14161d] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
              {[
                { id: '30d', label: 'Last 30 days' },
                { id: 'this_month', label: 'This Month' },
                { id: '90d', label: 'Last 90 days' },
                { id: 'all', label: 'All Time' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setDateRange(opt.id);
                    setShowDateDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 ${
                    dateRange === opt.id ? 'text-orange-400 font-semibold bg-white/5' : 'text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-[#14161d] hover:bg-[#1a1d26] border border-white/10 text-zinc-300 transition-colors"
            title="Freelance Payment Reminders"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-[10px] font-bold text-black rounded-full flex items-center justify-center animate-bounce">
                {totalAlerts}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#14161d] border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-white">Payment Reminders</span>
                </div>
                <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {urgentReminders.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1 opacity-80" />
                    All client receivables are settled!
                  </div>
                ) : (
                  urgentReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        rem.status === 'overdue'
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : rem.status === 'due_today'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-zinc-900/60 border-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-zinc-200">{rem.clientName}</div>
                          <div className="text-[11px] text-zinc-400 truncate max-w-[150px]">{rem.projectTitle}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-white">${rem.amount.toFixed(2)}</div>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                              rem.status === 'overdue'
                                ? 'bg-rose-500 text-black'
                                : rem.status === 'due_today'
                                ? 'bg-amber-500 text-black'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {rem.status === 'overdue' ? 'Overdue' : rem.status === 'due_today' ? 'Due Today' : `Due ${rem.dueDate}`}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-[10px] text-zinc-500">Due: {rem.dueDate}</span>
                        <button
                          onClick={() => {
                            onCollectReminder(rem.id);
                            setShowNotifications(false);
                          }}
                          className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-2 py-0.5 rounded transition-colors"
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  onNavigateToReminders();
                  setShowNotifications(false);
                }}
                className="w-full text-center py-1.5 text-[11px] text-orange-400 hover:text-orange-300 font-medium transition-colors border-t border-white/5 mt-1 block"
              >
                View all client receivables & reminders →
              </button>
            </div>
          )}
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
          <button
            onClick={() => onOpenAddTx('expense')}
            className="flex items-center gap-1.5 bg-[#171a22] hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            title="Add Expense"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>

          <button
            onClick={() => onOpenAddTx('income')}
            className="flex items-center gap-1.5 bg-[#171a22] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            title="Add Income"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>

          <button
            onClick={onOpenAddReminder}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold px-3 py-1.5 rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all"
            title="New Receivable / Invoice"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Invoice Due</span>
          </button>
        </div>
      </div>
    </header>
  );
};
