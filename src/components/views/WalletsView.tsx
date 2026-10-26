'use client';

import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  Shield,
  Coins,
  Pencil,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  History,
} from 'lucide-react';
import { Wallet, Transaction } from '@/types';
import { formatCash, formatDateDDMMYYYY } from '@/lib/formatters';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  currencySymbol: string;
  onUpdateWalletBalance: (walletId: string, delta: number) => void;
  onAddWallet: (wallet: Omit<Wallet, 'id'>) => void;
  onUpdateWallet?: (id: string, updates: Partial<Wallet>) => void;
  onDeleteWallet?: (walletId: string) => { success: boolean; error?: string } | void;
  onOpenTransfer?: () => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  transactions,
  currencySymbol,
  onUpdateWalletBalance,
  onAddWallet,
  onUpdateWallet,
  onDeleteWallet,
  onOpenTransfer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWalletDetails, setSelectedWalletDetails] = useState<Wallet | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Wallet['type']>('bank');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<Wallet['type']>('bank');
  const [currency, setCurrency] = useState('PKR');
  const [symbol, setSymbol] = useState('Rs. ');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const totalAssets = wallets.reduce((sum, w) => sum + w.balance, 0);

  const getWalletIcon = (type: Wallet['type']) => {
    switch (type) {
      case 'bank': return Landmark;
      case 'crypto': return Coins;
      case 'stripe': return CreditCard;
      case 'paypal': return Shield;
      default: return WalletIcon;
    }
  };

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;

    onAddWallet({
      name: walletName.trim(),
      type: walletType,
      currency: currency.toUpperCase(),
      symbol,
      balance: Math.round(parseFloat(initialBalance)) || 0,
      accountNumber: accountNumber.trim() || undefined,
    });

    setShowAddModal(false);
    setWalletName('');
    setInitialBalance('');
    setAccountNumber('');
  };

  const handleOpenEdit = (w: Wallet) => {
    setEditingWallet(w);
    setEditName(w.name);
    setEditType(w.type);
    setEditAccountNumber(w.accountNumber || '');
    setEditBalance(w.balance.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !editName.trim()) return;

    if (onUpdateWallet) {
      onUpdateWallet(editingWallet.id, {
        name: editName.trim(),
        type: editType,
        accountNumber: editAccountNumber.trim() || undefined,
        balance: editBalance !== '' && !isNaN(parseFloat(editBalance)) ? Math.round(parseFloat(editBalance)) : editingWallet.balance,
      });
    }

    setEditingWallet(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-full overflow-hidden">
        <div>
          <div className="text-xs text-zinc-400 font-medium">Total Liquidity & Balance</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {currencySymbol}{formatCash(totalAssets)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Combined balance across {wallets.length} active channels</p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start sm:self-center">
          {onOpenTransfer && (
            <button
              onClick={onOpenTransfer}
              className="bg-[#181b23] hover:bg-[#20242f] text-zinc-200 border border-white/10 font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
              title="Transfer funds between accounts"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
              <span>Transfer Funds</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Account / Wallet</span>
          </button>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        {wallets.map((w) => {
          const Icon = getWalletIcon(w.type);
          const walletTxs = transactions.filter((t) => t.walletId === w.id);
          const spentThisMonth = walletTxs
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <div
              key={w.id}
              onClick={() => setSelectedWalletDetails(w)}
              className="bg-[#12141a] border border-white/5 hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-w-0 overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-300 group-hover:border-white/15 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">{w.name}</h4>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {w.type} • {w.accountNumber || 'Primary'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {Math.round(w.balance) === 0 && (
                      <span className="text-[10px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Empty
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      {w.currency}
                    </span>
                    {onUpdateWallet && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(w);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
                        title={`Edit ${w.name} Info`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteWallet && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteError(null);
                          setWalletToDelete(w);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors -mr-1 cursor-pointer"
                        title={Math.round(w.balance) !== 0 ? `Cannot delete ${w.name}: balance is not Rs. 0` : `Remove ${w.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-baseline justify-between">
                  <div>
                    <div className="text-[11px] text-zinc-400">Current Balance</div>
                    <div className="text-2xl font-bold font-mono text-white mt-0.5">
                      {w.symbol}{formatCash(w.balance)}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-zinc-500 font-mono">
                    <div>Spent: {w.symbol}{formatCash(spentThisMonth)}</div>
                    <div>{walletTxs.length} transactions</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.03] flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                <span>View full transaction history</span>
                <span className="group-hover:translate-x-0.5 transition-transform font-mono text-sky-400">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Wallet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base pb-3 border-b border-white/5">
              Add New Account / Wallet
            </h3>

            <form onSubmit={handleCreateWallet} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Bank, HBL, SadaPay, Cash"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Type</label>
                  <select
                    value={walletType}
                    onChange={(e) => setWalletType(e.target.value as any)}
                    className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash / Physical</option>
                    <option value="stripe">Raast / Digital Payouts</option>
                    <option value="paypal">Microfinance / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency</label>
                  <input
                    type="text"
                    value="PKR (Rs.)"
                    disabled
                    readOnly
                    className="w-full bg-[#171922] text-zinc-400 text-xs font-mono uppercase px-3 py-2.5 rounded-xl border border-white/10 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs font-mono px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Identifier / Masked #</label>
                  <input
                    type="text"
                    placeholder="•••• 1234 or 0x..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs font-mono px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account / Wallet Modal */}
      {editingWallet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Account Info</h3>
                  <p className="text-[11px] text-zinc-400">Update bank name, type, identifier or balance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingWallet(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Bank, HBL, SadaPay, Cash"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Account Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash / Physical</option>
                    <option value="stripe">Raast / Digital Payouts</option>
                    <option value="paypal">Microfinance / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency</label>
                  <input
                    type="text"
                    value={editingWallet.currency}
                    disabled
                    readOnly
                    className="w-full bg-[#171922] text-zinc-400 text-xs font-mono uppercase px-3 py-2.5 rounded-xl border border-white/10 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Current Balance ({editingWallet.symbol.trim()})</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs font-mono px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Identifier / Masked #</label>
                  <input
                    type="text"
                    placeholder="•••• 1234 or Primary"
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    className="w-full bg-[#171922] text-white text-xs font-mono px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingWallet(null)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Account / Zero-Balance Guard Modal */}
      {walletToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {wallets.length <= 1 ? (
              // CASE 1: Cannot delete last remaining wallet
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">Cannot Remove Only Account</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  You must maintain at least one active bank or wallet in your portfolio. To remove &quot;{walletToDelete.name}&quot;, please create another account first.
                </p>
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => {
                      setWalletToDelete(null);
                      setDeleteError(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    Understood
                  </button>
                </div>
              </div>
            ) : Math.round(walletToDelete.balance) !== 0 ? (
              // CASE 2: Cannot delete non-empty wallet
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Account Cannot Be Removed</h3>
                      <p className="text-[11px] text-zinc-400">Bank must be emptied (Rs. 0) before deletion</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setWalletToDelete(null);
                      setDeleteError(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-4 space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                    <div className="text-[11px] font-medium text-amber-300/80 font-mono uppercase tracking-wider">
                      Current Active Balance
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                      {walletToDelete.symbol}{formatCash(walletToDelete.balance)}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Account: <span className="text-white font-semibold">{walletToDelete.name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-[#171922] p-3 rounded-xl border border-white/5">
                    To prevent accidental loss of funds and ledger discrepancies, you cannot delete a bank or wallet that contains money. Please transfer or withdraw the remaining balance to another account first.
                  </p>
                </div>

                {deleteError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {deleteError}
                  </div>
                )}

                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center gap-2">
                  {onOpenTransfer && (
                    <button
                      type="button"
                      onClick={() => {
                        setWalletToDelete(null);
                        setDeleteError(null);
                        onOpenTransfer();
                      }}
                      className="w-full sm:flex-1 py-2.5 px-3.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                      <span>Transfer Funds Now</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setWalletToDelete(null);
                      setDeleteError(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // CASE 3: Empty wallet (Rs. 0) -> Confirm deletion
              <div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base">Remove {walletToDelete.name}?</h3>

                  <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-mono my-2.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Balance Empty (Rs. 0)</span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    This account is emptied and will be safely removed from your active accounts. All previous transaction records linked to this account will remain safely preserved in your ledger.
                  </p>
                </div>

                {deleteError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {deleteError}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletToDelete(null);
                      setDeleteError(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteWallet) {
                        const res = onDeleteWallet(walletToDelete.id);
                        if (res && !res.success && res.error) {
                          setDeleteError(res.error);
                          return;
                        }
                      }
                      setWalletToDelete(null);
                      setDeleteError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/30 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Account Details & Full Transaction History Modal */}
      {selectedWalletDetails && (() => {
        const accountTxs = transactions
          .filter((t) => t.walletId === selectedWalletDetails.id || t.toWalletId === selectedWalletDetails.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalInflow = accountTxs
          .filter((t) => (
            t.type === 'income' ||
            t.type === 'deposit' ||
            (t.type === 'transfer' && t.toWalletId === selectedWalletDetails.id)
          ))
          .reduce((sum, t) => sum + t.amount, 0);

        const totalOutflow = accountTxs
          .filter((t) => (
            t.type === 'expense' ||
            (t.type === 'transfer' && t.walletId === selectedWalletDetails.id)
          ))
          .reduce((sum, t) => sum + t.amount, 0);

        const Icon = getWalletIcon(selectedWalletDetails.type);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg sm:text-xl">{selectedWalletDetails.name}</h3>
                      <span className="text-[10px] font-mono uppercase text-zinc-400">
                        {selectedWalletDetails.type}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      {selectedWalletDetails.accountNumber || 'Primary Account'} • {selectedWalletDetails.currency}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWalletDetails(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Account Financial Overview Grid */}
              <div className="p-5 sm:p-6 border-b border-white/10 grid grid-cols-3 gap-3 bg-[#0d0f14]/50">
                <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Current Balance</span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                    {selectedWalletDetails.symbol}{formatCash(selectedWalletDetails.balance)}
                  </div>
                </div>

                <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                    <ArrowDownLeft className="w-3 h-3" /> Total Inflow
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
                    +{selectedWalletDetails.symbol}{formatCash(totalInflow)}
                  </div>
                </div>

                <div className="bg-[#171922] p-3.5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-rose-400 uppercase tracking-wider">
                    <ArrowUpRight className="w-3 h-3" /> Total Outflow
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-rose-400 mt-1">
                    -{selectedWalletDetails.symbol}{formatCash(totalOutflow)}
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between gap-2 bg-[#12141a]">
                <div className="text-xs text-zinc-400 font-medium">
                  Transaction History <span className="font-mono text-zinc-500">({accountTxs.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenTransfer && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedWalletDetails;
                        setSelectedWalletDetails(null);
                        onOpenTransfer();
                      }}
                      className="px-3 py-1.5 text-xs rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Transfer</span>
                    </button>
                  )}
                  {onUpdateWallet && (
                    <button
                      type="button"
                      onClick={() => {
                        const w = selectedWalletDetails;
                        setSelectedWalletDetails(null);
                        handleOpenEdit(w);
                      }}
                      className="px-3 py-1.5 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Info</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions List */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[45vh] space-y-2">
                {accountTxs.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No transactions recorded for this account yet.</p>
                  </div>
                ) : (
                  accountTxs.map((tx) => {
                    const isCredit =
                      tx.type === 'income' ||
                      tx.type === 'deposit' ||
                      (tx.type === 'transfer' && tx.toWalletId === selectedWalletDetails.id);

                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-[#171922] hover:bg-[#1a1e29] border border-white/5 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl border flex-shrink-0 ${
                              isCredit
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {tx.title || (tx.type === 'transfer' ? 'Wallet Transfer' : 'Transaction')}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                              <span>{formatDateDDMMYYYY(tx.date)}</span>
                              <span>•</span>
                              <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                              {tx.clientOrPayer && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{tx.clientOrPayer}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-xs font-mono font-bold ${
                              isCredit ? 'text-emerald-400' : 'text-zinc-200'
                            }`}
                          >
                            {isCredit ? '+' : '-'}{selectedWalletDetails.symbol}{formatCash(tx.amount)}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase">
                            {tx.type}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/5 bg-[#0d0f14]/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedWalletDetails(null)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
