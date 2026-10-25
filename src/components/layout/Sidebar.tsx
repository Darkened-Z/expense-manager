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
  CheckCircle2,
  AlertTriangle,
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
    { id: 'wallets', label: 'Wallets & Accounts', icon: Wallet },
    { id: 'categories', label: 'Categories & Budgets', icon: Tag },
    { id: 'insights', label: 'Insights', icon: Sparkles },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#0d0e12] border-r border-white/5 flex flex-col justify-between p-4 select-none shrink-0">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <div className="w-3.5 h-3.5 rounded-full bg-[#0d0e12] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              </div>
            </div>
            <div>
              <span className="font-semibold tracking-wide text-sm text-white">Expense Manager</span>
              <span className="block text-[10px] text-zinc-500 font-mono tracking-tight">FREELANCE SUITE</span>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online & Synced" />
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
              className="w-full bg-[#14161d] text-xs text-zinc-200 placeholder-zinc-500 pl-9 pr-8 py-2 rounded-lg border border-white/5 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
            <kbd className="absolute right-2.5 text-[10px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5 pointer-events-none">
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
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1c1f28] text-white shadow-sm border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#13151b]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeType === 'danger'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
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
          onClick={() => setCurrentTab('settings')}
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
            onClick={onLockApp}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-amber-400 hover:bg-[#13151b] transition-colors"
            title="Lock application session"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-amber-500/80" />
              <span>Lock App</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">PIN Active</span>
          </button>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#13161c] border border-white/5 mt-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-500 flex items-center justify-center font-bold text-xs text-white uppercase shadow-inner">
            {userName.charAt(0) || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-200 truncate">{userName}</div>
            <div className="text-[10px] text-zinc-500 truncate">{userEmail}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
