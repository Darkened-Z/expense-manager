'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, DollarSign, User, FileText, Bell, ArrowUpRight, ArrowDownLeft, AlertTriangle, Pencil, Repeat } from 'lucide-react';
import { Category, ReminderType, PaymentReminder } from '@/types';
import { formatDateDDMMYYYY } from '@/lib/formatters';
import { SUPPORTED_CURRENCIES, getDefaultRate, getCurrencySymbol } from '@/lib/currencies';

interface AddReminderModalProps {
  isOpen: boolean;
  initialType?: ReminderType;
  reminderToEdit?: PaymentReminder | null;
  currencySymbol: string;
  categories?: Category[];
  onClose: () => void;
  onSubmit: (reminder: {
    type?: ReminderType;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    projectTitle: string;
    invoiceNumber?: string;
    amount: number;
    currency: string;
    token?: string;
    categoryId?: string;
    frequency?: 'once' | 'monthly';
    invoiceDate: string;
    dueDate: string;
    reminderDate: string;
    notes?: string;
    originalAmount?: number;
    originalCurrency?: string;
    exchangeRate?: number;
    autoRenew?: boolean;
  }) => void;
  onUpdate?: (id: string, updates: Partial<PaymentReminder>) => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  initialType = 'receivable',
  reminderToEdit = null,
  currencySymbol,
  categories = [],
  onClose,
  onSubmit,
  onUpdate,
}) => {
  const [type, setType] = useState<ReminderType>(initialType);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    const def = getDefaultRate(newCurr);
    setExchangeRate(def.toString());
  };

  useEffect(() => {
    if (isOpen) {
      if (reminderToEdit) {
        setType(reminderToEdit.type || 'receivable');
        setClientName(reminderToEdit.clientName || '');
        setClientEmail(reminderToEdit.clientEmail || '');
        setClientPhone(reminderToEdit.clientPhone || '');
        setProjectTitle(reminderToEdit.projectTitle || '');
        setInvoiceNumber(reminderToEdit.invoiceNumber || '');
        const origCurr = reminderToEdit.originalCurrency || reminderToEdit.currency || 'PKR';
        setCurrency(origCurr);
        setExchangeRate(reminderToEdit.exchangeRate ? reminderToEdit.exchangeRate.toString() : getDefaultRate(origCurr).toString());
        setAmount(
          reminderToEdit.originalAmount
            ? reminderToEdit.originalAmount.toString()
            : reminderToEdit.amount
            ? reminderToEdit.amount.toString()
            : ''
        );
        setFrequency(reminderToEdit.frequency || 'once');
        setAutoRenew(reminderToEdit.autoRenew !== false);
        setInvoiceDate(reminderToEdit.invoiceDate || new Date().toISOString().split('T')[0]);
        setDueDate(reminderToEdit.dueDate || '');
        setReminderDate(reminderToEdit.reminderDate || reminderToEdit.dueDate || '');
        setNotes(reminderToEdit.notes || '');
        setError(null);
      } else {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Default due date: 14 days from now (Net-14)
        const due = new Date(now);
        due.setDate(due.getDate() + 14);
        const dueStr = due.toISOString().split('T')[0];

        // Default reminder date: 2 days before due date
        const rem = new Date(due);
        rem.setDate(rem.getDate() - 2);
        const remStr = rem.toISOString().split('T')[0];

        setType(initialType);
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setProjectTitle('');
        setInvoiceNumber(initialType === 'payable' ? `PAY-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}` : `INV-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
        setAmount('');
        setCurrency('PKR');
        setExchangeRate('1');
        setFrequency(initialType === 'payable' ? 'monthly' : 'once');
        setAutoRenew(true);
        setInvoiceDate(todayStr);
        setDueDate(dueStr);
        setReminderDate(remStr);
        setNotes('');
        setError(null);
      }
    }
  }, [isOpen, initialType, reminderToEdit, categories]);

  // When due date changes, automatically propose reminder date 2 days before
  const handleDueDateChange = (newDue: string) => {
    setDueDate(newDue);
    try {
      const d = new Date(newDue + 'T00:00:00');
      d.setDate(d.getDate() - 2);
      setReminderDate(d.toISOString().split('T')[0]);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const parsedInputAmount = parseFloat(amount) || 0;
  const parsedRate = parseFloat(exchangeRate) || 1;
  const computedPKR = currency === 'PKR' ? Math.round(parsedInputAmount) : Math.round(parsedInputAmount * parsedRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError(type === 'payable' ? 'Please enter the payee or person name' : 'Please enter the client or company name');
      return;
    }
    if (!projectTitle.trim()) {
      setError(type === 'payable' ? 'Please enter the salary or expense purpose' : 'Please enter the project or milestone title');
      return;
    }
    if (isNaN(parsedInputAmount) || parsedInputAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (currency !== 'PKR' && (isNaN(parsedRate) || parsedRate <= 0)) {
      setError('Please enter a valid exchange rate');
      return;
    }
    if (!dueDate) {
      setError('Please set an invoice or payment due date');
      return;
    }

    if (reminderToEdit && onUpdate) {
      onUpdate(reminderToEdit.id, {
        type,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        projectTitle: projectTitle.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        amount: computedPKR,
        currency: 'PKR',
        token: currency,
        frequency,
        autoRenew: frequency === 'monthly' ? autoRenew : false,
        invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
        dueDate,
        reminderDate: reminderDate || dueDate,
        notes: notes.trim() || undefined,
        originalAmount: currency !== 'PKR' ? parsedInputAmount : undefined,
        originalCurrency: currency !== 'PKR' ? currency : undefined,
        exchangeRate: currency !== 'PKR' ? parsedRate : undefined,
      });
    } else {
      onSubmit({
        type,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        projectTitle: projectTitle.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        amount: computedPKR,
        currency: 'PKR',
        token: currency,
        frequency,
        autoRenew: frequency === 'monthly' ? autoRenew : false,
        invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
        dueDate,
        reminderDate: reminderDate || dueDate,
        notes: notes.trim() || undefined,
        originalAmount: currency !== 'PKR' ? parsedInputAmount : undefined,
        originalCurrency: currency !== 'PKR' ? currency : undefined,
        exchangeRate: currency !== 'PKR' ? parsedRate : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#12141a] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5 text-zinc-300 border border-white/5">
              {reminderToEdit ? (
                <Pencil className="w-4 h-4 text-emerald-400" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {reminderToEdit
                ? (type === 'payable' ? 'Edit Payable Due Date' : 'Edit Invoice Due Date')
                : (type === 'payable' ? 'New Payable Due Date' : 'New Client Invoice Due Date')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reminder Direction: To Collect vs To Pay */}
          <div className="grid grid-cols-2 gap-2 bg-[#171922] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setType('receivable');
                setFrequency('once');
              }}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'receivable'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>To Collect (Client)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('payable');
                setFrequency('monthly');
              }}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'payable'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
              <span>To Pay (Salary / Expense)</span>
            </button>
          </div>

          {/* Client / Payee Name & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                {type === 'payable' ? 'Payee / Person / Vendor' : 'Client Name / Org'}
              </label>
              <input
                type="text"
                placeholder={type === 'payable' ? 'e.g. Asim (Junior Dev), Landlord' : 'e.g. Acme Labs'}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                {type === 'payable' ? 'Reference / Voucher' : 'Invoice Number'}
              </label>
              <input
                type="text"
                placeholder={type === 'payable' ? 'PAY-2026-01' : 'INV-2026-01'}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              {type === 'payable' ? 'Expense / Salary Purpose' : 'Project / Deliverable Title'}
            </label>
            <input
              type="text"
              placeholder={type === 'payable' ? 'e.g. Monthly Salary, Office Rent, Hosting' : 'e.g. Mobile App Redesign, API integration'}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              required
            />
          </div>


          {/* Amount & Multi-Currency Converter */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  {type === 'payable' ? 'Payment Amount' : 'Receivable Amount'} ({currency})
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
                    className="w-full bg-[#171922] text-white text-base font-mono font-bold pl-12 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
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
                    Converted PKR Total
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
                onClick={() => setFrequency('once')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  frequency === 'once'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Once (One-off)
              </button>
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  frequency === 'monthly'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly (Recurring)
              </button>
            </div>
            {frequency === 'monthly' && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#161821] border border-white/5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Auto-Renew Monthly Cycle</div>
                      <div className="text-[10px] text-zinc-400">
                        Automatically schedule next month&apos;s invoice cycle when this is collected
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Due Date & Reminder Trigger Date */}
          <div className="grid grid-cols-2 gap-3 bg-[#171922] p-3 rounded-2xl border border-white/5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>Due Date</span>
                </label>
                {dueDate && (
                  <span className="text-[10px] font-mono text-zinc-400 font-medium">
                    ({formatDateDDMMYYYY(dueDate)})
                  </span>
                )}
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full bg-[#12141a] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                {type === 'payable' ? 'When payment is scheduled to be paid' : 'When payment is expected'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-zinc-400" />
                  <span>Alert Date</span>
                </label>
                {reminderDate && (
                  <span className="text-[10px] font-mono text-zinc-400 font-medium">
                    ({formatDateDDMMYYYY(reminderDate)})
                  </span>
                )}
              </div>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-[#12141a] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">When app warns you to follow up</span>
            </div>
          </div>

          {/* Client Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                {type === 'payable' ? 'Payee Email (Optional)' : 'Client Email (Optional)'}
              </label>
              <input
                type="email"
                placeholder={type === 'payable' ? 'payee@team.com' : 'billing@client.com'}
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                {type === 'payable' ? 'Payee Phone (Optional)' : 'Client WhatsApp / Phone (Optional)'}
              </label>
              <input
                type="text"
                placeholder="+92 300 1234567"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Notes / Terms (Optional)</label>
            <input
              type="text"
              placeholder={type === 'payable' ? 'e.g. Monthly salary for Asim, Office maintenance' : 'e.g. Net-14 payment terms, 50% deposit remaining'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>

          {error && <div className="text-rose-400 text-xs font-medium">{error}</div>}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm cursor-pointer"
            >
              {reminderToEdit
                ? 'Save Changes'
                : (type === 'payable' ? 'Add Payable Due Date' : 'Add Client Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
