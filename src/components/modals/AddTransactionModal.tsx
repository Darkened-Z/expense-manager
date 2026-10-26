'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, Clock, Tag, Wallet as WalletIcon, Pencil, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Category, Wallet, TransactionType, Transaction } from '@/types';
import { formatDateDDMMYYYY, formatCash } from '@/lib/formatters';
import { SUPPORTED_CURRENCIES, getDefaultRate, getCurrencySymbol } from '@/lib/currencies';
import { compressImageToDataUrl } from '@/lib/images';
import { StorageService } from '@/lib/storage';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  wallets: Wallet[];
  currencySymbol: string;
  onClose: () => void;
  onSubmit: (tx: {
    amount: number;
    type: TransactionType;
    title: string;
    categoryId: string;
    walletId: string;
    clientOrPayer?: string;
    date: string;
    time: string;
    notes?: string;
    token?: string;
    frequency?: 'once' | 'monthly';
    createReminder?: boolean;
    originalAmount?: number;
    originalCurrency?: string;
    exchangeRate?: number;
    attachmentUrl?: string;
  }) => void;
  onUpdate?: (id: string, updates: Partial<Transaction>) => void;
  onAddCategory?: (cat: Omit<Category, 'id'>) => Category;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  initialType = 'expense',
  transactionToEdit = null,
  categories,
  wallets,
  currencySymbol,
  onClose,
  onSubmit,
  onUpdate,
  onAddCategory,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('PKR');
  const [exchangeRate, setExchangeRate] = useState<string>('1');
  const [title, setTitle] = useState<string>('');
  const [clientOrPayer, setClientOrPayer] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [walletId, setWalletId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [token, setToken] = useState<string>('PKR');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [createReminder, setCreateReminder] = useState<boolean>(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    const def = getDefaultRate(newCurr);
    setExchangeRate(def.toString());
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      setAttachmentUrl(compressed);
    } catch (err) {
      console.error('Failed to process image attachment:', err);
      alert('Could not process this image. Please try a different photo.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        const origCurr = transactionToEdit.originalCurrency || 'PKR';
        setCurrency(origCurr);
        setExchangeRate(transactionToEdit.exchangeRate ? transactionToEdit.exchangeRate.toString() : getDefaultRate(origCurr).toString());
        setAmount(
          transactionToEdit.originalAmount
            ? transactionToEdit.originalAmount.toString()
            : transactionToEdit.amount
            ? transactionToEdit.amount.toString()
            : ''
        );
        setTitle(transactionToEdit.title || '');
        setClientOrPayer(transactionToEdit.clientOrPayer || '');
        setCategoryId(transactionToEdit.categoryId || '');
        setWalletId(transactionToEdit.walletId || wallets[0]?.id || '');
        setDate(transactionToEdit.date || new Date().toISOString().split('T')[0]);
        setTime(transactionToEdit.time || new Date().toTimeString().slice(0, 5));
        setToken(transactionToEdit.token || 'PKR');
        setFrequency(transactionToEdit.frequency || 'once');
        setCreateReminder(false);
        setAttachmentUrl(transactionToEdit.attachmentUrl || null);
        setNotes(transactionToEdit.notes || '');
        setError(null);
      } else {
        setType(initialType);
        setCurrency('PKR');
        setExchangeRate('1');
        setAmount('');
        setTitle('');
        setClientOrPayer('');
        setNotes('');
        setAttachmentUrl(null);
        setError(null);
        setFrequency('once');
        setCreateReminder(false);

        // Default date & time to right now
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime(now.toTimeString().slice(0, 5));

        // Filter available categories for type
        const suitableCats = initialType === 'deposit'
          ? categories.filter((c) => c.id === 'cat-deposit' || c.type === 'income')
          : categories.filter((c) => c.type === initialType && c.id !== 'cat-deposit');
        setCategoryId(suitableCats[0]?.id || categories[0]?.id || '');
        setWalletId(wallets[0]?.id || '');
        setToken(wallets[0]?.currency || 'PKR');
      }
    }
  }, [isOpen, initialType, transactionToEdit, categories, wallets]);

  if (!isOpen) return null;

  const parsedInputAmount = parseFloat(amount) || 0;
  const parsedRate = parseFloat(exchangeRate) || 1;
  const computedPKR = currency === 'PKR' ? Math.round(parsedInputAmount) : Math.round(parsedInputAmount * parsedRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedInputAmount) || parsedInputAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (currency !== 'PKR' && (isNaN(parsedRate) || parsedRate <= 0)) {
      setError('Please enter a valid exchange rate');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title or description');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!walletId) {
      setError('Please select a wallet / payment account');
      return;
    }

    if (transactionToEdit && onUpdate) {
      onUpdate(transactionToEdit.id, {
        amount: computedPKR,
        type,
        title: title.trim(),
        clientOrPayer: clientOrPayer.trim() || undefined,
        categoryId,
        walletId,
        date,
        time,
        token,
        frequency,
        notes: notes.trim() || undefined,
        originalAmount: currency !== 'PKR' ? parsedInputAmount : undefined,
        originalCurrency: currency !== 'PKR' ? currency : undefined,
        exchangeRate: currency !== 'PKR' ? parsedRate : undefined,
        attachmentUrl: attachmentUrl || undefined,
      });
    } else {
      onSubmit({
        amount: computedPKR,
        type,
        title: title.trim(),
        clientOrPayer: clientOrPayer.trim() || undefined,
        categoryId,
        walletId,
        date,
        time,
        token,
        frequency,
        createReminder: frequency === 'monthly' ? createReminder : false,
        notes: notes.trim() || undefined,
        originalAmount: currency !== 'PKR' ? parsedInputAmount : undefined,
        originalCurrency: currency !== 'PKR' ? currency : undefined,
        exchangeRate: currency !== 'PKR' ? parsedRate : undefined,
        attachmentUrl: attachmentUrl || undefined,
      });
    }

    onClose();
  };

  const filteredCategories = type === 'deposit'
    ? categories.filter((c) => c.id === 'cat-deposit' || c.type === 'income')
    : type === 'expense'
    ? categories.filter((c) => c.type === 'expense' && c.id !== 'cat-transfer')
    : categories.filter((c) => c.type === 'income' && c.id !== 'cat-deposit');

  const handleQuickAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const catType: 'expense' | 'income' = type === 'income' ? 'income' : 'expense';
    let createdCat: Category;
    if (onAddCategory) {
      createdCat = onAddCategory({
        name: newCategoryName.trim(),
        type: catType,
        icon: 'Tag',
        color: catType === 'income' ? '#10b981' : '#f97316',
        budgetLimit: 0,
      });
    } else {
      createdCat = StorageService.addCategory({
        name: newCategoryName.trim(),
        type: catType,
        icon: 'Tag',
        color: catType === 'income' ? '#10b981' : '#f97316',
        budgetLimit: 0,
      });
    }
    if (createdCat && createdCat.id) {
      setCategoryId(createdCat.id);
    }
    setNewCategoryName('');
    setShowAddCategoryInline(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#12141a] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5 text-zinc-300 border border-white/5">
              {transactionToEdit ? (
                <Pencil className="w-4 h-4 text-emerald-400" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {transactionToEdit
                ? 'Edit Transaction'
                : type === 'expense'
                ? 'Add Expense'
                : type === 'income'
                ? 'Add Income'
                : 'Add Money (Deposit / Family)'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Type Toggle: Expense, Income, Money Added */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#171922] p-1 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cats = categories.filter((c) => c.type === 'expense' && c.id !== 'cat-transfer');
                if (cats.length > 0) setCategoryId(cats[0].id);
              }}
              className={`py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                const cats = categories.filter((c) => c.type === 'income' && c.id !== 'cat-deposit');
                if (cats.length > 0) setCategoryId(cats[0].id);
              }}
              className={`py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              <span>Income</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('deposit');
                const depCat = categories.find((c) => c.id === 'cat-deposit') || categories[0];
                if (depCat) setCategoryId(depCat.id);
              }}
              className={`py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'deposit'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Add Money</span>
            </button>
          </div>

          {/* Amount and Multi-Currency Converter */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs font-semibold select-none">
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#171922] text-white text-base font-mono font-bold pl-12 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full bg-[#171922] text-white text-xs font-mono font-semibold px-2.5 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol.trim()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Foreign Exchange Rate & Live Conversion Banner */}
            {currency !== 'PKR' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#161821] border border-white/10 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Exchange Rate (1 {currency} &rarr; PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full bg-[#1b1e29] text-white text-xs font-mono font-bold px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-white/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Converted Live Total
                  </label>
                  <div className="text-sm font-mono font-bold text-emerald-400 py-1.5 flex items-center gap-1.5">
                    <span>{currencySymbol}{computedPKR.toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      ({parsedInputAmount} {currency})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Schedule: Once vs Monthly */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Payment Schedule
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#171922] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setFrequency('once');
                  setCreateReminder(false);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  frequency === 'once'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Once (One-off)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFrequency('monthly');
                  setCreateReminder(true);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly (Recurring)
              </button>
            </div>

            {frequency === 'monthly' && (
              <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none text-zinc-300">
                <input
                  type="checkbox"
                  checked={createReminder}
                  onChange={(e) => setCreateReminder(e.target.checked)}
                  className="rounded border-white/20 bg-[#171922] text-zinc-200 focus:ring-0 w-3.5 h-3.5 accent-white cursor-pointer"
                />
                <span className="text-[11px] text-zinc-300">
                  {type === 'expense'
                    ? 'Schedule monthly reminder for this expense (salaries, rent, bills)'
                    : 'Schedule monthly reminder for this income (client retainer)'}
                </span>
              </label>
            )}
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Title / Description
            </label>
            <input
              type="text"
              placeholder={
                type === 'expense'
                  ? 'e.g. Figma Subscription, Coffee, Uber'
                  : type === 'income'
                  ? 'e.g. Website Milestone 1, Retainer'
                  : 'e.g. Money from Amma, Family gift, Personal deposit'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              required
            />
          </div>

          {/* Client or Payer (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              {type === 'deposit' ? 'From Person / Source (Optional)' : 'Client / Vendor (Optional)'}
            </label>
            <input
              type="text"
              placeholder={type === 'deposit' ? 'e.g. Amma, Friend, Personal Account' : 'e.g. Apex Studio, Apple, Starbucks'}
              value={clientOrPayer}
              onChange={(e) => setClientOrPayer(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Category & Wallet Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-zinc-400">
                  {type === 'expense' ? 'Expense Category' : type === 'deposit' ? 'Deposit Category' : 'Income Source'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>+ Add</span>
                </button>
              </div>

              {!showAddCategoryInline ? (
                <select
                  value={categoryId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddCategoryInline(true);
                    } else {
                      setCategoryId(e.target.value);
                    }
                  }}
                  className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Category...</option>
                </select>
              ) : (
                <div className="bg-[#12141a] p-2.5 rounded-xl border border-sky-500/30 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">Create New {type === 'income' ? 'Income Source' : 'Category'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategoryInline(false);
                        setNewCategoryName('');
                      }}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Fuel, Amma, Gym..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddCategory();
                        } else if (e.key === 'Escape') {
                          setShowAddCategoryInline(false);
                        }
                      }}
                      className="flex-1 bg-[#171922] text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-100 disabled:opacity-40 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Wallet / Channel</label>
              <select
                value={walletId}
                onChange={(e) => {
                  setWalletId(e.target.value);
                  const wal = wallets.find((w) => w.id === e.target.value);
                  if (wal) setToken(wal.currency);
                }}
                className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.symbol}{formatCash(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-zinc-400">Date</label>
                {date && (
                  <span className="text-[10px] font-mono text-zinc-400 font-medium">
                    ({formatDateDDMMYYYY(date)})
                  </span>
                )}
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Notes / Tags (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Tax deductible, invoice #42"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Receipt / Bill Photo Attachment */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Receipt / Bill Photo (Optional)
            </label>
            {attachmentUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#161821] p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={attachmentUrl}
                    alt="Receipt preview"
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Receipt Attached</div>
                    <div className="text-[10px] text-emerald-400">Compressed & ready to save</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentUrl(null)}
                  className="p-2 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                  title="Remove receipt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-[#161821]/50 hover:bg-[#161821] transition-all cursor-pointer">
                <Camera className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-300">
                  {isUploadingImage ? 'Compressing photo...' : 'Snap or Upload Receipt / Bill Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {error && <div className="text-rose-400 text-xs font-medium">{error}</div>}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm cursor-pointer"
            >
              {transactionToEdit
                ? 'Save Changes'
                : type === 'expense'
                ? 'Save Expense'
                : type === 'income'
                ? 'Save Income'
                : 'Save Added Money'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
