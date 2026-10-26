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
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Wallet, Transaction } from '@/types';
import { formatCash } from '@/lib/formatters';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  currencySymbol: string;
  onUpdateWalletBalance: (walletId: string, delta: number) => void;
  onAddWallet: (wallet: Omit<Wallet, 'id'>) => void;
  onDeleteWallet?: (walletId: string) => { success: boolean; error?: string } | void;
  onOpenTransfer?: () => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  transactions,
  currencySymbol,
  onUpdateWalletBalance,
  onAddWallet,
  onDeleteWallet,
  onOpenTransfer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-400 font-medium">Total Liquidity & Balance</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {currencySymbol}{formatCash(totalAssets)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Combined balance across {wallets.length} active channels</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {onOpenTransfer && (
            <button
              onClick={onOpenTransfer}
              className="bg-[#181b23] hover:bg-[#20242f] text-zinc-200 border border-white/10 font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Transfer funds between accounts"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
              <span>Transfer Funds</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Account / Wallet</span>
          </button>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map((w) => {
          const Icon = getWalletIcon(w.type);
          const walletTxs = transactions.filter((t) => t.walletId === w.id);
          const spentThisMonth = walletTxs
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <div
              key={w.id}
              className="bg-[#12141a] border border-white/5 hover:border-white/10 rounded-2xl p-5 shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{w.name}</h4>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {w.type} • {w.accountNumber || 'Primary'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {Math.round(w.balance) === 0 && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Empty
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5">
                    {w.currency}
                  </span>
                  {onDeleteWallet && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setWalletToDelete(w);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors -mr-1"
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

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono my-2.5 font-medium">
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
    </div>
  );
};
