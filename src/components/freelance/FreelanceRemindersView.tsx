'use client';

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  Send,
  Copy,
  Download,
  Trash2,
  ExternalLink,
  Check,
  User,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentReminder, Wallet } from '@/types';

interface FreelanceRemindersViewProps {
  reminders: PaymentReminder[];
  wallets: Wallet[];
  currencySymbol: string;
  onOpenAddModal: () => void;
  onCollectReminder: (id: string, walletId: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const FreelanceRemindersView: React.FC<FreelanceRemindersViewProps> = ({
  reminders,
  wallets,
  currencySymbol,
  onOpenAddModal,
  onCollectReminder,
  onDeleteReminder,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'urgent' | 'pending' | 'collected'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collectingReminder, setCollectingReminder] = useState<PaymentReminder | null>(null);
  const [targetWalletId, setTargetWalletId] = useState<string>(wallets[0]?.id || 'wal-bank');

  // Compute metrics
  const totalPending = reminders
    .filter((r) => r.status !== 'collected')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalCollected = reminders
    .filter((r) => r.status === 'collected')
    .reduce((sum, r) => sum + r.amount, 0);

  const overdueList = reminders.filter((r) => r.status === 'overdue');
  const dueTodayList = reminders.filter((r) => r.status === 'due_today');
  const urgentCount = overdueList.length + dueTodayList.length;

  // Filter list
  const filteredList = reminders.filter((r) => {
    if (filterTab === 'urgent') return r.status === 'overdue' || r.status === 'due_today';
    if (filterTab === 'pending') return r.status === 'pending';
    if (filterTab === 'collected') return r.status === 'collected';
    return true;
  });

  // Calculate day difference for label
  const getDueLabel = (rem: PaymentReminder) => {
    if (rem.status === 'collected') {
      return { text: `Collected ${rem.collectedAt || ''}`, color: 'emerald' };
    }
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(rem.dueDate + 'T00:00:00');
    const cur = new Date(today + 'T00:00:00');
    const diffDays = Math.round((due.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, color: 'rose' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'amber' };
    }
    return { text: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, color: 'blue' };
  };

  // Copy professional reminder text
  const handleCopyReminderText = (rem: PaymentReminder) => {
    const text = `Hi ${rem.clientName},\n\nI hope you're having a great week! Friendly reminder that Invoice #${rem.invoiceNumber || 'INV'} for "${rem.projectTitle}" in the amount of $${rem.amount.toFixed(2)} was due on ${rem.dueDate}.\n\nPlease let me know once the payment has been initiated or if you need any additional invoice documentation.\n\nThank you!`;

    navigator.clipboard.writeText(text);
    setCopiedId(rem.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Download .ics Calendar event
  const handleDownloadICS = (rem: PaymentReminder) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Freelance Expense Manager//Payment Reminder//EN',
      'BEGIN:VEVENT',
      `UID:${rem.id}@expensemanager.dev`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${rem.dueDate.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${rem.dueDate.replace(/-/g, '')}`,
      `SUMMARY:Collect Payment: ${rem.clientName} ($${rem.amount.toFixed(2)})`,
      `DESCRIPTION:Freelance Invoice #${rem.invoiceNumber || 'N/A'}\\nProject: ${rem.projectTitle}\\nClient: ${rem.clientName}\\nAmount: $${rem.amount.toFixed(2)}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT9H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder to collect payment from ${rem.clientName}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payment_Due_${rem.clientName.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Finalize payment collection
  const handleConfirmCollect = () => {
    if (!collectingReminder) return;

    // Trigger celebration confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f97316', '#38bdf8', '#fbbf24'],
    });

    onCollectReminder(collectingReminder.id, targetWalletId);
    setCollectingReminder(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium">Pending to Collect</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {currencySymbol}{totalPending.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Across {reminders.filter((r) => r.status !== 'collected').length} active receivables
          </div>
        </div>

        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium">Action Required</div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono mt-1 flex items-center gap-2">
            <span>{urgentCount}</span>
            {urgentCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {overdueList.length} Overdue
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {dueTodayList.length} invoice{dueTodayList.length === 1 ? '' : 's'} due today
          </div>
        </div>

        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium">Collected Revenue</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {currencySymbol}{totalCollected.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Settled & credited to wallets</div>
        </div>

        <div className="bg-gradient-to-br from-[#1c1a1f] to-[#16131c] border border-orange-500/20 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between sm:col-span-2 md:col-span-1">
          <div>
            <div className="text-xs text-orange-400 font-semibold tracking-wide">New Invoice Due?</div>
            <div className="text-xs text-zinc-400 mt-0.5">Schedule dates to get automated reminder alerts</div>
          </div>
          <button
            onClick={onOpenAddModal}
            className="mt-3 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Receivable Due Date</span>
          </button>
        </div>
      </div>

      {/* Main List Card */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl shadow-xl p-3.5 sm:p-5">
        {/* Navigation Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
          <div className="flex items-center gap-1.5 bg-[#181b23] p-1 rounded-xl border border-white/10 text-xs overflow-x-auto max-w-full pb-1 sm:pb-1">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                filterTab === 'all' ? 'bg-[#232733] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Invoices ({reminders.length})
            </button>
            <button
              onClick={() => setFilterTab('urgent')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'urgent' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Needs Attention</span>
              {urgentCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-black font-bold text-[10px] flex items-center justify-center">
                  {urgentCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                filterTab === 'pending' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upcoming ({reminders.filter((r) => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterTab('collected')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                filterTab === 'collected' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Collected ({reminders.filter((r) => r.status === 'collected').length})
            </button>
          </div>

          <div className="text-xs text-zinc-400">
            Reminders auto-calculate daily based on invoice due dates
          </div>
        </div>

        {/* Receivables Grid / Cards */}
        <div className="pt-4 space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-2" />
              No invoices in this category. You&apos;re completely up to date!
            </div>
          ) : (
            filteredList.map((rem) => {
              const dueInfo = getDueLabel(rem);
              const isCollected = rem.status === 'collected';

              return (
                <div
                  key={rem.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rem.status === 'overdue'
                      ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50'
                      : rem.status === 'due_today'
                      ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                      : isCollected
                      ? 'bg-emerald-950/10 border-white/5 opacity-75'
                      : 'bg-[#161821] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Client & Project Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{rem.clientName}</span>
                        {rem.invoiceNumber && (
                          <span className="text-[10px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded font-mono border border-white/5">
                            #{rem.invoiceNumber}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            dueInfo.color === 'rose'
                              ? 'bg-rose-500 text-black shadow-sm shadow-rose-500/20'
                              : dueInfo.color === 'amber'
                              ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/20'
                              : dueInfo.color === 'emerald'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {dueInfo.text}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-300 font-medium">{rem.projectTitle}</div>

                      {rem.notes && (
                        <div className="text-[11px] text-zinc-500 italic max-w-xl">
                          &quot;{rem.notes}&quot;
                        </div>
                      )}

                      {/* Dates row */}
                      <div className="flex items-center gap-4 text-[11px] text-zinc-400 pt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>Due: <strong className="text-zinc-200">{rem.dueDate}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Reminder: <strong className="text-zinc-200">{rem.reminderDate}</strong></span>
                        </span>
                        {rem.clientEmail && (
                          <span className="text-zinc-500">Contact: {rem.clientEmail}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 self-end lg:self-center">
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-white font-mono">
                          {currencySymbol}{rem.amount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase">
                          {rem.token || rem.currency || 'USD'}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {!isCollected ? (
                          <>
                            {/* Collect Button */}
                            <button
                              onClick={() => setCollectingReminder(rem)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Collect Payment</span>
                            </button>

                            {/* Copy Reminder Message */}
                            <button
                              onClick={() => handleCopyReminderText(rem)}
                              className="bg-[#202430] hover:bg-[#282d3c] text-zinc-200 text-xs px-2.5 py-2 rounded-xl flex items-center gap-1 border border-white/10 transition-colors"
                              title="Copy professional reminder message to clipboard"
                            >
                              {copiedId === rem.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Follow-Up</span>
                                </>
                              )}
                            </button>

                            {/* Download ICS */}
                            <button
                              onClick={() => handleDownloadICS(rem)}
                              className="p-2 text-zinc-400 hover:text-white bg-[#202430] hover:bg-[#282d3c] border border-white/10 rounded-xl transition-colors"
                              title="Add reminder to Google / Apple Calendar (.ics)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid & Deposited</span>
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteReminder(rem.id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Collect Settlement Modal */}
      {collectingReminder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14161d] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Collect Client Payment</h3>
              </div>
              <button
                onClick={() => setCollectingReminder(null)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-[#1c1f28] p-3 rounded-xl border border-white/5">
                <div className="text-xs text-zinc-400">Client & Invoice</div>
                <div className="font-semibold text-white mt-0.5">{collectingReminder.clientName}</div>
                <div className="text-xs text-zinc-400">{collectingReminder.projectTitle}</div>
                <div className="text-lg font-mono font-extrabold text-emerald-400 mt-2">
                  {currencySymbol}{collectingReminder.amount.toFixed(2)} {collectingReminder.token}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Select Deposit Account / Wallet:
                </label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full bg-[#181b23] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency} - Current Balance: {w.symbol}{w.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  This will mark the invoice as Collected, immediately deposit {currencySymbol}{collectingReminder.amount.toFixed(2)} into the selected wallet, and log an Income transaction.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
              <button
                onClick={() => setCollectingReminder(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCollect}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                Confirm Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
