'use client';

import React, { useState } from 'react';
import { PiggyBank, Plus, TrendingUp, Target, Calendar, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle2, StickyNote, X } from 'lucide-react';
import { SavingsGoal, Wallet, SimpleSaving } from '@/types';
import { formatCash, formatDateDDMMYYYY } from '@/lib/formatters';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  simpleSavings?: SimpleSaving[];
  wallets: Wallet[];
  currencySymbol: string;
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteSavingsGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, amount: number, walletId: string) => void;
  onAddSimpleSaving?: (saving: Omit<SimpleSaving, 'id' | 'createdAt'>) => void;
  onDeleteSimpleSaving?: (id: string) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  savingsGoals,
  simpleSavings = [],
  wallets,
  currencySymbol,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
  onDepositToGoal,
  onAddSimpleSaving,
  onDeleteSimpleSaving,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSimpleSavingModal, setShowSimpleSavingModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');

  // Form states for Simple Saving
  const [simpleAmount, setSimpleAmount] = useState('');
  const [simpleNote, setSimpleNote] = useState('');
  const [simpleWalletId, setSimpleWalletId] = useState('');
  const [simpleDate, setSimpleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [simpleError, setSimpleError] = useState<string | null>(null);

  // Form states for new goal
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Safety Net');
  const [color, setColor] = useState('#f97316');

  // Compute metrics
  const totalGoalsSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalSimpleSaved = simpleSavings.reduce((s, item) => s + item.amount, 0);
  const totalOverallSaved = totalGoalsSaved + totalSimpleSaved;
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? (totalGoalsSaved / totalTarget) * 100 : 0;

  const handleCreateSimpleSaving = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.round(parseFloat(simpleAmount));
    if (isNaN(amt) || amt <= 0) {
      setSimpleError('Please enter a valid saving amount');
      return;
    }
    if (!simpleNote.trim()) {
      setSimpleError('Please enter a note for this saving');
      return;
    }

    if (onAddSimpleSaving) {
      onAddSimpleSaving({
        amount: amt,
        note: simpleNote.trim(),
        date: simpleDate || new Date().toISOString().split('T')[0],
        walletId: simpleWalletId || undefined,
      });
    }

    setShowSimpleSavingModal(false);
    setSimpleAmount('');
    setSimpleNote('');
    setSimpleWalletId('');
    setSimpleError(null);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Math.round(parseFloat(targetAmount));
    if (!title.trim() || isNaN(target) || target <= 0) return;

    onAddSavingsGoal({
      title: title.trim(),
      targetAmount: target,
      currentAmount: Math.round(parseFloat(currentAmount)) || 0,
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
    const amount = Math.round(parseFloat(depositAmount));
    if (isNaN(amount) || amount <= 0) return;

    onDepositToGoal(depositGoal.id, amount, selectedWalletId);
    setDepositGoal(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">Savings & Reserve Funds</h2>
          <p className="text-xs text-zinc-400">
            Record simple savings with notes or establish structured reserve goals
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setSimpleError(null);
              setSimpleAmount('');
              setSimpleNote('');
              setSimpleWalletId('');
              setSimpleDate(new Date().toISOString().split('T')[0]);
              setShowSimpleSavingModal(true);
            }}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <StickyNote className="w-4 h-4 text-amber-400" />
            <span>+ Add Simple Saving</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Saved Overall */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium uppercase tracking-wider">Total Saved</span>
            <PiggyBank className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {currencySymbol}{formatCash(totalOverallSaved)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Across {simpleSavings.length} note{simpleSavings.length === 1 ? '' : 's'} & {savingsGoals.length} goal fund{savingsGoals.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Card 2: Simple Savings (No Goals) */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium uppercase tracking-wider">Simple Savings</span>
            <StickyNote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {currencySymbol}{formatCash(totalSimpleSaved)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {simpleSavings.length} independent savings note{simpleSavings.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Card 3: Goals Target */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium uppercase tracking-wider">Goal Targets</span>
            <Target className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {currencySymbol}{formatCash(totalGoalsSaved)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {totalTarget > 0 ? `${overallPercentage.toFixed(0)}% of ${currencySymbol}${formatCash(totalTarget)} target` : 'No targets set'}
          </div>
        </div>
      </div>

      {/* Simple Savings Notes Section */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Simple Savings</h3>
              <p className="text-[11px] text-zinc-400">Quick savings entries with simple notes — unrelated to any goals</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSimpleError(null);
              setSimpleAmount('');
              setSimpleNote('');
              setSimpleWalletId('');
              setSimpleDate(new Date().toISOString().split('T')[0]);
              setShowSimpleSavingModal(true);
            }}
            className="self-start sm:self-auto text-xs text-zinc-200 hover:text-white flex items-center gap-1.5 font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Simple Saving</span>
          </button>
        </div>

        {simpleSavings.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No simple savings recorded yet. Click{' '}
            <button
              onClick={() => {
                setSimpleError(null);
                setSimpleAmount('');
                setSimpleNote('');
                setSimpleWalletId('');
                setSimpleDate(new Date().toISOString().split('T')[0]);
                setShowSimpleSavingModal(true);
              }}
              className="text-zinc-300 hover:text-white underline font-medium cursor-pointer"
            >
              + Add Simple Saving
            </button>{' '}
            to stash money away with a quick note.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {simpleSavings.map((item) => {
              const wal = wallets.find((w) => w.id === item.walletId);
              return (
                <div
                  key={item.id}
                  className="bg-[#171922] border border-white/5 hover:border-white/10 rounded-xl p-4 flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {formatDateDDMMYYYY(item.date)}
                      </span>
                      {onDeleteSimpleSaving && (
                        <button
                          onClick={() => onDeleteSimpleSaving(item.id)}
                          className="text-zinc-600 hover:text-rose-400 p-1 transition-colors rounded cursor-pointer"
                          title="Delete saving note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-200 font-medium mt-1.5 leading-relaxed break-words">
                      {item.note}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
                    <div className="text-base font-bold font-mono text-white">
                      {currencySymbol}{formatCash(item.amount)}
                    </div>
                    {wal ? (
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {wal.name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.02] px-2 py-0.5 rounded">
                        Cash Aside
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Target Savings Goals Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Target Savings Goals</h3>
              <p className="text-[11px] text-zinc-400">Structured financial safety nets with percentage tracking</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-zinc-200 hover:text-white flex items-center gap-1.5 font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Goal</span>
          </button>
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
                        {currencySymbol}{formatCash(goal.currentAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Target</div>
                      <div className="text-xs text-zinc-300 font-medium">
                        {currencySymbol}{formatCash(goal.targetAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-zinc-400">{pct.toFixed(0)}% funded</span>
                      <span className="text-zinc-500">{currencySymbol}{formatCash(remaining)} remaining</span>
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
      </div>

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
                    step="1"
                    placeholder="0"
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
                      {w.name} ({w.symbol}{formatCash(w.balance)})
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
                    step="1"
                    placeholder="0"
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
                    step="1"
                    placeholder="0"
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

      {/* Simple Saving Modal */}
      {showSimpleSavingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="font-bold text-white text-base">Record Simple Saving</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Quickly save an amount with a simple note — not tied to any goal.</p>
              </div>
              <button
                onClick={() => setShowSimpleSavingModal(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {simpleError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {simpleError}
              </div>
            )}

            <form onSubmit={handleCreateSimpleSaving} className="space-y-4 pt-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Saving Amount ({currencySymbol.trim()})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs font-semibold select-none">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={simpleAmount}
                    onChange={(e) => setSimpleAmount(e.target.value)}
                    className="w-full bg-[#171922] text-white text-base font-mono font-bold pl-12 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Simple Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stashed in locker, saved from project bonus, emergency cash"
                  value={simpleNote}
                  onChange={(e) => setSimpleNote(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Deduct from Account (Optional)
                  </label>
                  <select
                    value={simpleWalletId}
                    onChange={(e) => setSimpleWalletId(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  >
                    <option value="">None / Physical Cash Aside</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.symbol}{formatCash(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={simpleDate}
                    onChange={(e) => setSimpleDate(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowSimpleSavingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm cursor-pointer"
                >
                  Save Simple Saving
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
