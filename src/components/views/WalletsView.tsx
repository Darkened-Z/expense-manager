'use client';

import React, { useState } from 'react';
import { Wallet as WalletIcon, Plus, ArrowLeftRight, Landmark, CreditCard, Shield, Coins } from 'lucide-react';
import { Wallet, Transaction } from '@/types';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  currencySymbol: string;
  onUpdateWalletBalance: (walletId: string, delta: number) => void;
  onAddWallet: (wallet: Omit<Wallet, 'id'>) => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  transactions,
  currencySymbol,
  onUpdateWalletBalance,
  onAddWallet,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<Wallet['type']>('bank');
  const [currency, setCurrency] = useState('INR');
  const [symbol, setSymbol] = useState('₹');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const totalAssetsUSD = wallets.reduce((sum, w) => sum + w.balance, 0);

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
      balance: parseFloat(initialBalance) || 0,
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
            {currencySymbol}{totalAssetsUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Combined balance across {wallets.length} active channels</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Account / Wallet</span>
        </button>
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

                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5">
                  {w.currency}
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-zinc-400">Current Balance</div>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {w.symbol}{w.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="text-right text-[11px] text-zinc-500 font-mono">
                  <div>Spent: {w.symbol}{spentThisMonth.toFixed(2)}</div>
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
                  placeholder="e.g. Mercury Business, Wise USD, MetaMask"
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
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Crypto Wallet</option>
                    <option value="wise">Wise</option>
                    <option value="cash">Cash / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => {
                      const c = e.target.value.toUpperCase();
                      setCurrency(c);
                      if (c === 'INR') setSymbol('₹');
                      else if (c === 'USD') setSymbol('$');
                      else if (c === 'EUR') setSymbol('€');
                      else if (c === 'GBP') setSymbol('£');
                      else if (c === 'USDT') setSymbol('₮');
                      else setSymbol('₹');
                    }}
                    className="w-full bg-[#171922] text-white text-xs font-mono uppercase px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
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
    </div>
  );
};
