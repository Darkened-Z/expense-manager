'use client';

import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Clock,
  Wallet,
  Tag,
  BarChart3,
  Settings,
  Lock,
  Search,
  X,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingReceivablesCount?: number;
  overdueReceivablesCount?: number;
  pendingPayablesCount?: number;
  overduePayablesCount?: number;
  pendingRemindersCount?: number;
  overdueRemindersCount?: number;
  isLockEnabled: boolean;
  onLockApp: () => void;
  accountUsername?: string;
  onLogout?: () => void;
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
  pendingReceivablesCount = 0,
  overdueReceivablesCount = 0,
  pendingPayablesCount = 0,
  overduePayablesCount = 0,
  pendingRemindersCount = 0,
  overdueRemindersCount = 0,
  isLockEnabled,
  onLockApp,
  accountUsername,
  onLogout,
  userName,
  userEmail,
  searchQuery,
  setSearchQuery,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const effectiveOverdueRec = overdueReceivablesCount || overdueRemindersCount;
  const effectivePendingRec = pendingReceivablesCount || pendingRemindersCount;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    {
      id: 'receivables',
      label: 'Cash Receivable',
      icon: ArrowUpRight,
      badge: effectiveOverdueRec > 0 ? `${effectiveOverdueRec} overdue` : effectivePendingRec > 0 ? `${effectivePendingRec} due` : null,
      badgeType: effectiveOverdueRec > 0 ? 'danger' : 'warning',
    },
    {
      id: 'payables',
      label: 'Cash Payable',
      icon: ArrowDownLeft,
      badge: overduePayablesCount > 0 ? `${overduePayablesCount} overdue` : pendingPayablesCount > 0 ? `${pendingPayablesCount} due` : null,
      badgeType: overduePayablesCount > 0 ? 'danger' : 'warning',
    },
    { id: 'savings', label: 'Savings & Goals', icon: PiggyBank },
    { id: 'wallets', label: 'Wallets & Accounts', icon: Wallet },
    { id: 'categories', label: 'Categories & Sources', icon: Tag },
    { id: 'insights', label: 'Analytics', icon: BarChart3 },
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 select-none overflow-y-auto no-scrollbar">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-none overflow-hidden border border-[#353a4a] shrink-0 bg-[#16181f]">
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
            className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-none"
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
              className="w-full bg-[#14161d] text-xs text-zinc-200 placeholder-zinc-500 pl-9 pr-8 py-2 rounded-none border border-[#22252f] focus:outline-none focus:border-[#52596e] transition-colors"
            />
            <kbd className="hidden sm:inline-block absolute right-2.5 text-[10px] bg-[#1f222c] text-zinc-400 px-1.5 py-0.5 rounded-none border border-[#22252f] pointer-events-none">
              /
            </kbd>
          </div>
        </div>

        {/* Navigation List */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Main menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'receivables' && currentTab === 'reminders');
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full h-9 flex items-center justify-between px-3 rounded-none text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1e212b] text-white border border-[#2c303d] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#15171e] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-mono font-semibold ${
                      item.badgeType === 'danger'
                        ? 'text-rose-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    ({item.badge})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile and Settings Section */}
      <div className="pt-4 border-t border-[#22252f] space-y-1.5">
        <button
          onClick={() => handleSelectTab('settings')}
          className={`w-full h-9 flex items-center gap-3 px-3 rounded-none text-xs font-medium transition-colors ${
            currentTab === 'settings'
              ? 'bg-[#1c1f28] text-white border border-[#2c303d]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#13151b] border border-transparent'
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
            className="w-full h-9 flex items-center justify-between px-3 rounded-none text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#13151b] border border-transparent transition-colors"
            title="Lock application session"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>Lock App</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">PIN Active</span>
          </button>
        )}

        {onLogout && (
          <button
            onClick={() => {
              onLogout();
              setIsMobileOpen(false);
            }}
            className="w-full h-9 flex items-center justify-between px-3 rounded-none text-xs font-medium text-zinc-400 hover:text-rose-300 hover:bg-[#13151b] border border-transparent transition-colors cursor-pointer"
            title="Sign out or switch user account"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-zinc-400" />
              <span>Sign Out</span>
            </div>
            {accountUsername && (
              <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[90px]">@{accountUsername}</span>
            )}
          </button>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-none bg-[#13161c] border border-[#22252f] mt-2">
          <div className="w-8 h-8 rounded-none bg-zinc-800 border border-[#2c303d] flex items-center justify-center font-bold text-xs text-zinc-200 uppercase">
            {(accountUsername || userName).charAt(0) || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-200 truncate">
              {accountUsername ? `@${accountUsername}` : userName}
            </div>
            <div className="text-[10px] text-zinc-500 truncate">{userEmail}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-[#0d0e12] border-r border-[#22252f] flex-col shrink-0 select-none overflow-hidden sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#0d0e12] border-r border-[#2c303d] h-full z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - Equal grid width & fixed height */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#090a0c] border-t border-[#22252f] grid grid-cols-5 items-stretch safe-area-bottom">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 rounded-none transition-colors ${
            currentTab === 'dashboard' ? 'text-white font-medium bg-[#14161d]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] leading-none">Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentTab('transactions')}
          className={`flex flex-col items-center justify-center gap-1 rounded-none transition-colors ${
            currentTab === 'transactions' ? 'text-white font-medium bg-[#14161d]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span className="text-[10px] leading-none">Ledger</span>
        </button>

        <button
          onClick={() => setCurrentTab('receivables')}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-none transition-colors cursor-pointer ${
            currentTab === 'receivables' || currentTab === 'reminders' ? 'text-white font-medium bg-[#14161d]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          {(effectiveOverdueRec > 0 || effectivePendingRec > 0) && (
            <span
              className={`absolute top-1.5 right-3 w-2 h-2 rounded-none ${
                effectiveOverdueRec > 0 ? 'bg-rose-400' : 'bg-zinc-300'
              }`}
            />
          )}
          <span className="text-[10px] leading-none">Receivable</span>
        </button>

        <button
          onClick={() => setCurrentTab('payables')}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-none transition-colors cursor-pointer ${
            currentTab === 'payables' ? 'text-white font-medium bg-[#14161d]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          {(overduePayablesCount > 0 || pendingPayablesCount > 0) && (
            <span
              className={`absolute top-1.5 right-3 w-2 h-2 rounded-none ${
                overduePayablesCount > 0 ? 'bg-rose-400' : 'bg-zinc-300'
              }`}
            />
          )}
          <span className="text-[10px] leading-none">Payable</span>
        </button>

        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-none text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <div className="w-4 h-4 flex flex-col items-center justify-center gap-1">
            <span className="w-3.5 h-0.5 bg-zinc-400 rounded-none" />
            <span className="w-3.5 h-0.5 bg-zinc-400 rounded-none" />
            <span className="w-3.5 h-0.5 bg-zinc-400 rounded-none" />
          </div>
          <span className="text-[10px] leading-none">More</span>
        </button>
      </nav>
    </>
  );
};
