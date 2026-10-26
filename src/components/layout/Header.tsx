'use client';

import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Plus,
  Calendar,
  Wallet as WalletIcon,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  MessageSquare,
  X,
  Menu,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { Wallet, PaymentReminder, AppSettings } from '@/types';
import { formatDateDDMMYYYY, formatCash } from '@/lib/formatters';
import { getWhatsAppReminderUrl } from '@/lib/whatsapp';
import { DEFAULT_SETTINGS } from '@/lib/constants';

interface HeaderProps {
  currentTab: string;
  wallets: Wallet[];
  selectedWalletId: string;
  setSelectedWalletId: (id: string) => void;
  dateRange: string;
  setDateRange: (range: any) => void;
  reminders: PaymentReminder[];
  currencySymbol?: string;
  settings?: AppSettings;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'unconfigured' | 'error';
  onOpenSyncSettings?: () => void;
  onOpenAddTx: (type: 'expense' | 'income' | 'deposit') => void;
  onOpenTransfer?: () => void;
  onOpenAddReminder: () => void;
  onCollectReminder: (id: string) => void;
  onNavigateToReminders: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  wallets,
  selectedWalletId,
  setSelectedWalletId,
  dateRange,
  setDateRange,
  reminders,
  currencySymbol = 'Rs. ',
  settings = DEFAULT_SETTINGS,
  cloudSyncStatus = 'unconfigured',
  onOpenSyncSettings,
  onOpenAddTx,
  onOpenTransfer,
  onOpenAddReminder,
  onCollectReminder,
  onNavigateToReminders,
  onToggleMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

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
        return { title: 'Dashboard', sub: "Performance summary" };
      case 'transactions':
        return { title: 'Transactions', sub: "Ledger overview" };
      case 'receivables':
      case 'reminders':
        return { title: 'Cash Receivable', sub: 'Client invoices, milestones & incoming retainers' };
      case 'payables':
        return { title: 'Cash Payable', sub: 'Salaries, rent, utilities & vendor bills' };
      case 'savings':
        return { title: 'Savings & Goals', sub: 'Dedicated reserve targets & fund allocation' };
      case 'wallets':
        return { title: 'Wallets & Accounts', sub: 'Multi-currency balances' };
      case 'categories':
        return { title: 'Categories & Sources', sub: 'Expense categories and income sources' };
      case 'insights':
        return { title: 'Financial Insights', sub: 'Cashflow analytics' };
      case 'settings':
        return { title: 'Settings & Security', sub: 'Passcode & preferences' };
      default:
        return { title: 'Expense Manager', sub: 'Overview' };
    }
  };

  const { title, sub } = getPageTitle();

  return (
    <header className="px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-5 border-b border-white/5 bg-[#090a0d]/90 backdrop-blur-md sticky top-0 z-30 flex flex-col gap-3 max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 max-w-full">
        {/* Left: Mobile Menu Trigger + Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-zinc-400 hover:text-white rounded-xl bg-white/5 border border-white/5"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="md:hidden w-8 h-8 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 hidden xs:block">{sub}</p>
          </div>
        </div>

        {/* Right: Quick Controls & Notification Bell */}
        <div className="flex items-center gap-2">
          {/* Wallet Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowWalletDropdown(!showWalletDropdown);
                setShowDateDropdown(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 bg-[#14161d] hover:bg-[#1a1d26] border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 transition-colors"
            >
              <WalletIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-mono text-zinc-200 max-w-[85px] sm:max-w-none truncate">
                {selectedWallet ? (selectedWallet.accountNumber || selectedWallet.name) : 'All Wallets'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
            </button>

            {showWalletDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-[#14161d] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setSelectedWalletId('all');
                    setShowWalletDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 ${
                    selectedWalletId === 'all' ? 'text-white font-semibold bg-white/5' : 'text-zinc-300'
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
                      selectedWalletId === w.id ? 'text-white font-semibold bg-white/5' : 'text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="truncate max-w-[120px]">{w.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{w.accountNumber || w.type.toUpperCase()}</div>
                    </div>
                    <div className="font-mono font-medium text-zinc-200">
                      {w.symbol}{formatCash(w.balance)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Selector - hidden on very small phones, shown on sm+ */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowWalletDropdown(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 bg-[#14161d] hover:bg-[#1a1d26] border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                {dateRange === 'as_of_today'
                  ? 'As of Today'
                  : dateRange === 'today'
                  ? 'Today'
                  : dateRange === 'this_month'
                  ? 'This Month'
                  : dateRange === '30d'
                  ? 'Last 30d'
                  : dateRange === '90d'
                  ? 'Last 90d'
                  : 'All Time'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-[#14161d] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                {[
                  { id: 'as_of_today', label: 'As of Today' },
                  { id: 'today', label: 'Today Only' },
                  { id: 'this_month', label: 'This Month' },
                  { id: '30d', label: 'Last 30 days' },
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
                      dateRange === opt.id ? 'text-white font-semibold bg-white/5' : 'text-zinc-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cloud Auto-Sync Indicator */}
          {onOpenSyncSettings && (
            <button
              onClick={onOpenSyncSettings}
              className="flex items-center gap-1.5 bg-[#14161d] hover:bg-[#1a1d26] border border-white/10 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              title={
                cloudSyncStatus === 'synced'
                  ? 'Cloud Auto-Sync Active (Live with Supabase)'
                  : cloudSyncStatus === 'syncing'
                  ? 'Syncing changes to Supabase in background...'
                  : cloudSyncStatus === 'error'
                  ? 'Cloud sync issue. Click to check Supabase settings.'
                  : 'Cloud sync not configured. Click to connect Supabase.'
              }
            >
              {cloudSyncStatus === 'synced' && <Cloud className="w-3.5 h-3.5 text-emerald-400" />}
              {cloudSyncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
              {cloudSyncStatus === 'error' && <CloudOff className="w-3.5 h-3.5 text-rose-400" />}
              {(!cloudSyncStatus || cloudSyncStatus === 'unconfigured') && <CloudOff className="w-3.5 h-3.5 text-zinc-500" />}
              <span className="hidden md:inline text-[11px] font-medium text-zinc-300">
                {cloudSyncStatus === 'synced'
                  ? 'Live Sync'
                  : cloudSyncStatus === 'syncing'
                  ? 'Syncing'
                  : cloudSyncStatus === 'error'
                  ? 'Sync Issue'
                  : 'Sync Off'}
              </span>
            </button>
          )}

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowWalletDropdown(false);
                setShowDateDropdown(false);
              }}
              className="relative p-2 rounded-xl bg-[#14161d] hover:bg-[#1a1d26] border border-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Freelance Payment Reminders"
            >
              <Bell className="w-4 h-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-[10px] font-bold text-black rounded-full flex items-center justify-center shadow-sm">
                  {totalAlerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-auto mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-[#14161d] border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-semibold text-white">Payment Reminders</span>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                  {urgentReminders.length === 0 ? (
                    <div className="text-center py-6 text-xs text-zinc-500">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-zinc-400 mb-1 opacity-80" />
                      All client receivables are settled!
                    </div>
                  ) : (
                    urgentReminders.map((rem) => (
                      <div
                        key={rem.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          rem.status === 'overdue'
                            ? 'bg-rose-500/10 border-rose-500/20'
                            : rem.status === 'due_today'
                            ? 'bg-white/5 border-white/10'
                            : 'bg-zinc-900/60 border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-zinc-200">{rem.clientName}</div>
                            <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">{rem.projectTitle}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-white">{currencySymbol}{formatCash(rem.amount)}</div>
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                rem.status === 'overdue'
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                                  : rem.status === 'due_today'
                                  ? 'bg-white/10 text-zinc-200 border border-white/10'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {rem.status === 'overdue' ? 'Overdue' : rem.status === 'due_today' ? 'Due Today' : `Due ${formatDateDDMMYYYY(rem.dueDate)}`}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5">
                          <span className="text-[10px] text-zinc-500">Due: {formatDateDDMMYYYY(rem.dueDate)}</span>
                          <div className="flex items-center gap-1.5">
                            {rem.type !== 'payable' && (
                              <a
                                href={getWhatsAppReminderUrl(rem, settings)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                                title="Send WhatsApp payment reminder"
                              >
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              onClick={() => {
                                onCollectReminder(rem.id);
                                setShowNotifications(false);
                              }}
                              className="text-[10px] bg-zinc-200 hover:bg-white text-zinc-950 font-semibold px-2 py-0.5 rounded transition-colors"
                            >
                              Mark Paid
                            </button>
                          </div>
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
                  className="w-full text-center py-1.5 text-[11px] text-zinc-400 hover:text-white font-medium transition-colors border-t border-white/5 mt-1 block"
                >
                  View all client receivables & reminders →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Row - Dense minimal cohesive suite */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none max-w-full">
        <button
          onClick={() => onOpenAddTx('expense')}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#14151b] hover:bg-[#1b1d26] text-zinc-300 hover:text-white border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shadow-sm"
          title="Add Expense"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
          <span>+ Expense</span>
        </button>

        <button
          onClick={() => onOpenAddTx('income')}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#14151b] hover:bg-[#1b1d26] text-zinc-300 hover:text-white border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shadow-sm"
          title="Add Income"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
          <span>+ Income</span>
        </button>

        <button
          onClick={() => onOpenAddTx('deposit')}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#14151b] hover:bg-[#1b1d26] text-zinc-300 hover:text-white border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shadow-sm"
          title="Add Personal Money / Family Inflow (Non-Income)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>+ Add Money</span>
        </button>

        {onOpenTransfer && (
          <button
            onClick={onOpenTransfer}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#14151b] hover:bg-[#1b1d26] text-zinc-300 hover:text-white border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shadow-sm"
            title="Transfer Money Between Accounts"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
            <span>Transfer</span>
          </button>
        )}

        <button
          onClick={onOpenAddReminder}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold px-3.5 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap shadow-sm"
          title="New Receivable / Invoice"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Invoice Due</span>
        </button>
      </div>
    </header>
  );
};
