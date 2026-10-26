'use client';

import React, { useState } from 'react';
import {
  Plus,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CalendarPlus,
} from 'lucide-react';

interface MobileSpeedDialFABProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onTransfer: () => void;
  onAddReminder: () => void;
}

export const MobileSpeedDialFAB: React.FC<MobileSpeedDialFABProps> = ({
  onAddExpense,
  onAddIncome,
  onTransfer,
  onAddReminder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Add Expense',
      icon: ArrowDownLeft,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30',
      badgeColor: 'bg-rose-950 text-rose-200 border-rose-500/30',
      onClick: () => {
        setIsOpen(false);
        onAddExpense();
      },
    },
    {
      label: 'Add Income',
      icon: ArrowUpRight,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
      badgeColor: 'bg-emerald-950 text-emerald-200 border-emerald-500/30',
      onClick: () => {
        setIsOpen(false);
        onAddIncome();
      },
    },
    {
      label: 'Transfer Funds',
      icon: ArrowLeftRight,
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/30 hover:bg-sky-500/30',
      badgeColor: 'bg-sky-950 text-sky-200 border-sky-500/30',
      onClick: () => {
        setIsOpen(false);
        onTransfer();
      },
    },
    {
      label: 'Add Due Date / Invoice',
      icon: CalendarPlus,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
      badgeColor: 'bg-amber-950 text-amber-200 border-amber-500/30',
      onClick: () => {
        setIsOpen(false);
        onAddReminder();
      },
    },
  ];

  return (
    <>
      {/* Dimmed backdrop when speed dial is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Speed Dial Container (Mobile Only) */}
      <div className="fixed bottom-6 right-5 z-40 md:hidden flex flex-col items-end gap-3 select-none">
        {/* Speed Dial Menu Actions */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-4 duration-200">
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
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl shadow-lg border ${act.badgeColor}`}
                  >
                    {act.label}
                  </span>
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur-md ${act.color}`}
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
          className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer border ${
            isOpen
              ? 'bg-zinc-800 text-white border-white/20 rotate-45 scale-95 shadow-white/5'
              : 'bg-white text-zinc-950 border-white shadow-xl shadow-white/10 hover:bg-zinc-100'
          }`}
          title={isOpen ? 'Close menu' : 'Quick Actions'}
          aria-label="Quick Actions"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </>
  );
};
