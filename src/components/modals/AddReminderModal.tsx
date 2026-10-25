'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, DollarSign, User, FileText, Bell, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { Category, ReminderType } from '@/types';
import { formatDateDDMMYYYY } from '@/lib/formatters';

interface AddReminderModalProps {
  isOpen: boolean;
  initialType?: ReminderType;
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
  }) => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  initialType = 'receivable',
  currencySymbol,
  categories = [],
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<ReminderType>(initialType);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
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
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
      setAmount('');
      setCurrency('PKR');
      setFrequency(initialType === 'payable' ? 'monthly' : 'once');
      const expCat = categories.find((c) => c.type === 'expense');
      setCategoryId(expCat?.id || '');
      setInvoiceDate(todayStr);
      setDueDate(dueStr);
      setReminderDate(remStr);
      setNotes('');
      setError(null);
    }
  }, [isOpen, initialType, categories]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!clientName.trim()) {
      setError(type === 'payable' ? 'Please enter the payee or person name' : 'Please enter the client or company name');
      return;
    }
    if (!projectTitle.trim()) {
      setError(type === 'payable' ? 'Please enter the salary or expense purpose' : 'Please enter the project or milestone title');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!dueDate) {
      setError('Please set an invoice or payment due date');
      return;
    }

    onSubmit({
      type,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      projectTitle: projectTitle.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      amount: parsedAmount,
      currency,
      token: currency,
      categoryId: type === 'payable' ? categoryId : undefined,
      frequency,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      dueDate,
      reminderDate: reminderDate || dueDate,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#12141a] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5 text-zinc-300 border border-white/5">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {type === 'payable' ? 'New Constant Expense / Salary Reminder' : 'New Client Invoice & Payment Reminder'}
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

          {/* Expense Category (if payable) */}
          {type === 'payable' && categories.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Expense Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              >
                {categories.filter((c) => c.type === 'expense').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                {type === 'payable' ? 'Payment Amount' : 'Receivable Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs font-semibold select-none">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
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
                value="PKR"
                disabled
                className="w-full bg-[#171922] text-zinc-300 text-xs font-mono px-3 py-3 rounded-xl border border-white/10 cursor-not-allowed"
              >
                <option value="PKR">PKR (Rs.)</option>
              </select>
            </div>
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
              <p className="text-[10px] text-zinc-400 mt-1 pl-1">
                {type === 'payable'
                  ? 'Upon settling this payment, the next month’s expense reminder will automatically be scheduled.'
                  : 'Upon collection, the next month’s reminder will automatically be scheduled.'}
              </p>
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
                {type === 'payable' ? 'When payment must be disbursed' : 'When payment is expected'}
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
                {type === 'payable' ? 'Payee Phone (Optional)' : 'Client Phone (Optional)'}
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
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm"
            >
              Save {type === 'payable' ? 'Expense' : 'Invoice'} Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
