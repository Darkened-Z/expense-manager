'use client';

import React, { useState } from 'react';
import { PiggyBank, Plus, TrendingUp, Target, Calendar, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle2 } from 'lucide-react';
import { SavingsGoal, Wallet } from '@/types';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  wallets: Wallet[];
  currencySymbol: string;
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteSavingsGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, amount: number, walletId: string) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  savingsGoals,
  wallets,
  currencySymbol,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
  onDepositToGoal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');

  // Form states for new goal
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Safety Net');
  const [color, setColor] = useState('#f97316');

  // Compute metrics
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!title.trim() || isNaN(target) || target <= 0) return;

    onAddSavingsGoal({
      title: title.trim(),
      targetAmount: target,
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: targetDate || undefined,
      category,
      color,
      walletId: wallets[0]?.id,
    });

    setShowAddModal(false);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    onDepositToGoal(depositGoal.id, amount, selectedWalletId);
    setDepositGoal(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium uppercase tracking-wider">Total Saved</span>
            <PiggyBank className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {currencySymbol}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Allocated across {savingsGoals.length} savings funds
          </div>
        </div>

        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium uppercase tracking-wider">Total Target Goal</span>
            <Target className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {currencySymbol}{totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {overallPercentage.toFixed(1)}% of total targets reached
          </div>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs text-white font-semibold tracking-wide">Plan New Fund</div>
            <div className="text-xs text-zinc-400 mt-0.5">Establish emergency reserves, tax buffers, or assets</div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Savings Goal</span>
          </button>
        </div>
      </div>

      {/* Goals Grid or Empty State */}
      {savingsGoals.length === 0 ? (
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400 mb-4">
            <PiggyBank className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h3 className="text-base font-semibold text-white">No Savings Goals Yet</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Establish financial safety nets, tax buffers, or equipment reserve funds. Track progress as you deposit capital.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map((goal) => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

            return (
              <div
                key={goal.id}
                className="bg-[#12141a] border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                        {goal.category}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-2">{goal.title}</h4>
                    </div>
                    <button
                      onClick={() => onDeleteSavingsGoal(goal.id)}
                      className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between font-mono">
                    <div>
                      <div className="text-xs text-zinc-400">Current Balance</div>
                      <div className="text-xl font-bold text-white">
                        {currencySymbol}{goal.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Target</div>
                      <div className="text-xs text-zinc-300 font-medium">
                        {currencySymbol}{goal.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-zinc-400">{pct.toFixed(0)}% funded</span>
                      <span className="text-zinc-500">{currencySymbol}{remaining.toFixed(2)} remaining</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                  </div>

                  {goal.targetDate && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>Target Date: {goal.targetDate}</span>
                    </div>
                  )}
                </div>

                {/* Deposit Button */}
                <div className="mt-5 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setDepositGoal(goal)}
                    className="w-full bg-[#181b23] hover:bg-[#20242f] text-zinc-200 border border-white/10 hover:border-white/20 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Deposit Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deposit Modal */}
      {depositGoal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base pb-2 border-b border-white/5">
              Deposit to {depositGoal.title}
            </h3>

            <form onSubmit={handleConfirmDeposit} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Deposit Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-[#171922] text-white text-base font-mono font-bold pl-8 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Deduct from Account</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.symbol}{w.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base pb-3 border-b border-white/5">
              Create Savings Target
            </h3>

            <form onSubmit={handleCreateGoal} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Tax Reserve, Equipment Fund, Vacation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Initial Saved</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  >
                    <option value="Safety Net">Safety Net</option>
                    <option value="Taxes">Taxes</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Investment">Investment</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Color Theme</label>
                <div className="flex items-center gap-2 mt-1">
                  {['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'].map((c) => (
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
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
