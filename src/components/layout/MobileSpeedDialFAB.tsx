'use client';

import React, { useState } from 'react';
import {
  Plus,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CalendarPlus,
  PlusCircle,
} from 'lucide-react';

interface MobileSpeedDialFABProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddDeposit?: () => void;
  onTransfer: () => void;
  onAddReminder: () => void;
}

export const MobileSpeedDialFAB: React.FC<MobileSpeedDialFABProps> = ({
  onAddExpense,
  onAddIncome,
  onAddDeposit,
  onTransfer,
  onAddReminder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Add Expense',
      icon: ArrowDownLeft,
      color: 'bg-[#181b23] hover:bg-[#20242f] text-rose-400 border border-white/10',
      badgeColor: 'bg-[#181b23] text-zinc-200 border border-white/10',
      onClick: () => {
        setIsOpen(false);
        onAddExpense();
      },
    },
    {
      label: 'Add Income',
      icon: ArrowUpRight,
      color: 'bg-[#181b23] hover:bg-[#20242f] text-emerald-400 border border-white/10',
      badgeColor: 'bg-[#181b23] text-zinc-200 border border-white/10',
      onClick: () => {
        setIsOpen(false);
        onAddIncome();
      },
    },
    ...(onAddDeposit ? [{
      label: 'Add Money (Personal / Family)',
      icon: PlusCircle,
      color: 'bg-[#181b23] hover:bg-[#20242f] text-purple-400 border border-white/10',
      badgeColor: 'bg-[#181b23] text-zinc-200 border border-white/10',
      onClick: () => {
        setIsOpen(false);
        onAddDeposit();
      },
    }] : []),
    {
      label: 'Transfer Funds',
      icon: ArrowLeftRight,
      color: 'bg-[#181b23] hover:bg-[#20242f] text-sky-400 border border-white/10',
      badgeColor: 'bg-[#181b23] text-zinc-200 border border-white/10',
      onClick: () => {
        setIsOpen(false);
        onTransfer();
      },
    },
    {
      label: 'Add Due Date / Invoice',
      icon: CalendarPlus,
      color: 'bg-[#181b23] hover:bg-[#20242f] text-amber-400 border border-white/10',
      badgeColor: 'bg-[#181b23] text-zinc-200 border border-white/10',
      onClick: () => {
        setIsOpen(false);
        onAddReminder();
      },
    },
  ];

  return (
    <>
      {/* Dimmed solid dark backdrop when speed dial is open (no blur bleed-through) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/85 z-40 md:hidden animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Speed Dial Container (Mobile Only) - Elevated safely above mobile bottom nav */}
      <div
        className={`fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 md:hidden flex flex-col items-end gap-3 select-none pointer-events-none transition-all duration-200 ${
          isOpen ? 'z-50' : 'z-30'
        }`}
      >
        {/* Speed Dial Menu Actions */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={act.onClick}
                  className="flex items-center gap-2.5 active:scale-95 transition-transform cursor-pointer"
                >
                  <span
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-md ${act.badgeColor}`}
                  >
                    {act.label}
                  </span>
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${act.color}`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary FAB Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer border pointer-events-auto ${
            isOpen
              ? 'bg-[#181b23] text-white border-white/20 rotate-45 scale-95 shadow-black/80'
              : 'bg-white text-zinc-950 border-white/30 hover:bg-zinc-100 shadow-xl'
          }`}
          title={isOpen ? 'Close menu' : 'Quick Actions'}
          aria-label="Quick Actions"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </>
  );
};
