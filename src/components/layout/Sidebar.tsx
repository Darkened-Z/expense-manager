'use client';

import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Clock,
  Wallet,
  Tag,
  Sparkles,
  Settings,
  Lock,
  Search,
  X,
  PiggyBank,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingRemindersCount: number;
  overdueRemindersCount: number;
  isLockEnabled: boolean;
  onLockApp: () => void;
  userName: string;
  userEmail: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  pendingRemindersCount,
  overdueRemindersCount,
  isLockEnabled,
  onLockApp,
  userName,
  userEmail,
  searchQuery,
  setSearchQuery,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    {
      id: 'reminders',
      label: 'Client Receivables',
      icon: Clock,
      badge: overdueRemindersCount > 0 ? `${overdueRemindersCount} overdue` : pendingRemindersCount > 0 ? `${pendingRemindersCount} due` : null,
      badgeType: overdueRemindersCount > 0 ? 'danger' : 'warning',
    },
    { id: 'savings', label: 'Savings & Goals', icon: PiggyBank },
    { id: 'wallets', label: 'Wallets & Accounts', icon: Wallet },
    { id: 'categories', label: 'Categories & Sources', icon: Tag },
    { id: 'insights', label: 'Analytics', icon: Sparkles },
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 shadow-md shrink-0 bg-white/5">
              <img
                src="/logo.png"
                alt="Expense Manager Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-semibold tracking-wide text-sm text-white">Expense Manager</span>
              <span className="block text-[10px] text-zinc-500 font-mono tracking-tight">FREELANCE SUITE</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative px-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14161d] text-xs text-zinc-200 placeholder-zinc-500 pl-9 pr-8 py-2 rounded-lg border border-white/5 focus:outline-none focus:border-white/30 transition-colors"
            />
            <kbd className="hidden sm:inline-block absolute right-2.5 text-[10px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5 pointer-events-none">
              /
            </kbd>
          </div>
        </div>

        {/* Navigation List */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Main menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/10 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeType === 'danger'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                        : 'bg-white/10 text-zinc-300 border border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile and Settings Section */}
      <div className="pt-4 border-t border-white/5 space-y-2">
        <button
          onClick={() => handleSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            currentTab === 'settings'
              ? 'bg-[#1c1f28] text-white border border-white/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#13151b]'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Settings</span>
        </button>

        {isLockEnabled && (
          <button
            onClick={() => {
              onLockApp();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#13151b] transition-colors"
            title="Lock application session"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>Lock App</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">PIN Active</span>
          </button>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#13161c] border border-white/5 mt-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs text-zinc-200 uppercase">
            {userName.charAt(0) || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-200 truncate">{userName}</div>
            <div className="text-[10px] text-zinc-500 truncate">{userEmail}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-[#0d0e12] border-r border-white/5 flex-col shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#0d0e12] border-r border-white/10 h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - Dense, minimal, matte */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090a0d]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-around safe-area-bottom">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            currentTab === 'dashboard' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentTab('transactions')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            currentTab === 'transactions' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-[10px]">Ledger</span>
        </button>

        <button
          onClick={() => setCurrentTab('reminders')}
          className={`relative flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            currentTab === 'reminders' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Clock className="w-5 h-5" />
          {(overdueRemindersCount > 0 || pendingRemindersCount > 0) && (
            <span
              className={`absolute top-0 right-1 w-2 h-2 rounded-full ${
                overdueRemindersCount > 0 ? 'bg-rose-400' : 'bg-zinc-300'
              }`}
            />
          )}
          <span className="text-[10px]">Due Dates</span>
        </button>

        <button
          onClick={() => setCurrentTab('savings')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            currentTab === 'savings' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <PiggyBank className="w-5 h-5" />
          <span className="text-[10px]">Savings</span>
        </button>

        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center gap-1 p-1 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <div className="w-5 h-5 flex flex-col justify-center gap-1">
            <span className="w-4 h-0.5 bg-zinc-400 rounded-full" />
            <span className="w-4 h-0.5 bg-zinc-400 rounded-full" />
            <span className="w-4 h-0.5 bg-zinc-400 rounded-full" />
          </div>
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </>
  );
};
