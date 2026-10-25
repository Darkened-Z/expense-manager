'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, DollarSign, User, FileText, Bell } from 'lucide-react';

interface AddReminderModalProps {
  isOpen: boolean;
  currencySymbol: string;
  onClose: () => void;
  onSubmit: (reminder: {
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    projectTitle: string;
    invoiceNumber?: string;
    amount: number;
    currency: string;
    token?: string;
    invoiceDate: string;
    dueDate: string;
    reminderDate: string;
    notes?: string;
  }) => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  currencySymbol,
  onClose,
  onSubmit,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
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

      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setProjectTitle('');
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
      setAmount('');
      setCurrency('INR');
      setInvoiceDate(todayStr);
      setDueDate(dueStr);
      setReminderDate(remStr);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

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
      setError('Please enter the client or company name');
      return;
    }
    if (!projectTitle.trim()) {
      setError('Please enter the project or milestone title');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!dueDate) {
      setError('Please set an invoice due date');
      return;
    }

    onSubmit({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      projectTitle: projectTitle.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      amount: parsedAmount,
      currency,
      token: currency,
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
              New Client Invoice & Payment Reminder
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Client Name & Project */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Client Name / Org</label>
              <input
                type="text"
                placeholder="e.g. Acme Labs"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Invoice Number</label>
              <input
                type="text"
                placeholder="INV-2026-01"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Project / Deliverable Title</label>
            <input
              type="text"
              placeholder="e.g. Mobile App Redesign, Fullstack API integration"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              required
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Receivable Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#171922] text-white text-base font-mono font-bold pl-8 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency / Asset</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs font-mono px-3 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="USDT">USDT (₮)</option>
                <option value="USDC">USDC</option>
                <option value="ETH">ETH (Ξ)</option>
              </select>
            </div>
          </div>

          {/* Due Date & Reminder Trigger Date */}
          <div className="grid grid-cols-2 gap-3 bg-[#171922] p-3 rounded-2xl border border-white/5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <span>Payment Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full bg-[#12141a] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">When payment is expected</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1 flex items-center gap-1">
                <Bell className="w-3 h-3 text-zinc-400" />
                <span>Reminder Alert Date</span>
              </label>
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
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Client Email (Optional)</label>
              <input
                type="email"
                placeholder="billing@client.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Client Phone (Optional)</label>
              <input
                type="text"
                placeholder="+1 555-0199"
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
              placeholder="e.g. Net-14 payment terms, 50% deposit remaining"
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
              Save Payment Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
