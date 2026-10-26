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
  ArrowDownLeft,
  Filter,
  Repeat,
  Pencil,
  MessageSquare,
  ShieldCheck,
  CalendarX,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentReminder, Wallet, AppSettings, Transaction } from '@/types';
import { formatDateDDMMYYYY, formatCash } from '@/lib/formatters';
import { getWhatsAppReminderUrl } from '@/lib/whatsapp';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { formatForeignAmount } from '@/lib/currencies';

interface FreelanceRemindersViewProps {
  mode?: 'receivables' | 'payables';
  reminders: PaymentReminder[];
  wallets: Wallet[];
  currencySymbol: string;
  settings?: AppSettings;
  transactions?: Transaction[];
  onOpenAddModal: () => void;
  onEditReminder: (reminder: PaymentReminder) => void;
  onCollectReminder: (id: string, walletId: string) => void;
  onDeleteReminder: (id: string) => void;
  onUpdateReminder?: (id: string, updates: Partial<PaymentReminder>) => void;
}

export const FreelanceRemindersView: React.FC<FreelanceRemindersViewProps> = ({
  mode = 'receivables',
  reminders,
  wallets,
  currencySymbol,
  settings = DEFAULT_SETTINGS,
  transactions = [],
  onOpenAddModal,
  onEditReminder,
  onCollectReminder,
  onDeleteReminder,
  onUpdateReminder,
}) => {
  const isPayablesMode = mode === 'payables';
  const [filterTab, setFilterTab] = useState<'this_month' | 'urgent' | 'upcoming' | 'collected' | 'all'>('this_month');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collectingReminder, setCollectingReminder] = useState<PaymentReminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<PaymentReminder | null>(null);
  const [targetWalletId, setTargetWalletId] = useState<string>(wallets[0]?.id || 'wal-bank');

  // Month date boundaries
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const endOfCurrentMonthStr = endOfCurrentMonth.toISOString().split('T')[0];

  // Filter base reminders for this tab mode
  const baseReminders = reminders.filter((r) =>
    isPayablesMode ? r.type === 'payable' : r.type !== 'payable'
  );

  // Active reminders partitioned by current cycle (this month + overdue) vs future months
  const thisMonthActive = baseReminders.filter(
    (r) => r.status !== 'collected' && r.status !== 'ended' && r.dueDate <= endOfCurrentMonthStr
  );
  const futureActive = baseReminders.filter(
    (r) => r.status !== 'collected' && r.status !== 'ended' && r.dueDate > endOfCurrentMonthStr
  );

  // Compute metrics for this specific tab mode
  const totalPendingThisMonth = thisMonthActive.reduce((sum, r) => sum + r.amount, 0);
  const totalPendingFuture = futureActive.reduce((sum, r) => sum + r.amount, 0);

  const totalSettled = baseReminders
    .filter((r) => r.status === 'collected')
    .reduce((sum, r) => sum + r.amount, 0);

  const overdueList = baseReminders.filter((r) => r.status === 'overdue');
  const dueTodayList = baseReminders.filter((r) => r.status === 'due_today');
  const urgentCount = overdueList.length + dueTodayList.length;

  const settledCount = baseReminders.filter((r) => r.status === 'collected').length;

  // Filter list by selected tab
  const filteredList = baseReminders.filter((r) => {
    if (filterTab === 'this_month') return r.status !== 'collected' && r.status !== 'ended' && r.dueDate <= endOfCurrentMonthStr;
    if (filterTab === 'urgent') return r.status === 'overdue' || r.status === 'due_today';
    if (filterTab === 'upcoming') return r.status !== 'collected' && r.status !== 'ended' && r.dueDate > endOfCurrentMonthStr;
    if (filterTab === 'collected') return r.status === 'collected';
    return true;
  });

  // Calculate day difference for label
  const getDueLabel = (rem: PaymentReminder) => {
    if (rem.status === 'ended') {
      return {
        text: 'Contract Ended',
        color: 'zinc',
      };
    }
    if (rem.status === 'collected') {
      const settledDate = formatDateDDMMYYYY(rem.collectedAt || rem.dueDate);
      return {
        text: rem.type === 'payable' ? `Paid ${settledDate}` : `Collected ${settledDate}`,
        color: 'emerald',
      };
    }
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(rem.dueDate + 'T00:00:00');
    const cur = new Date(today + 'T00:00:00');
    const diffDays = Math.round((due.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, color: 'rose' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'neutral' };
    }
    return { text: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, color: 'neutral' };
  };

  // Copy reminder text
  const handleCopyReminderText = (rem: PaymentReminder) => {
    const isPayable = rem.type === 'payable';
    const formattedDue = formatDateDDMMYYYY(rem.dueDate);
    const text = isPayable
      ? `Payment Reminder: ${rem.projectTitle}\nPayee: ${rem.clientName}\nAmount: ${currencySymbol}${formatCash(rem.amount)}\nDue Date: ${formattedDue}${rem.notes ? `\nNotes: ${rem.notes}` : ''}`
      : `Hi ${rem.clientName},\n\nI hope you're having a great week! Friendly reminder that Invoice #${rem.invoiceNumber || 'INV'} for "${rem.projectTitle}" in the amount of ${currencySymbol}${formatCash(rem.amount)} was due on ${formattedDue}.\n\nPlease let me know once the payment has been initiated or if you need any additional invoice documentation.\n\nThank you!`;

    navigator.clipboard.writeText(text);
    setCopiedId(rem.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Download .ics Calendar event
  const handleDownloadICS = (rem: PaymentReminder) => {
    const isPayable = rem.type === 'payable';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Freelance Expense Manager//Payment Reminder//EN',
      'BEGIN:VEVENT',
      `UID:${rem.id}@expensemanager.dev`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${rem.dueDate.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${rem.dueDate.replace(/-/g, '')}`,
      `SUMMARY:${isPayable ? 'Pay Expense' : 'Collect Payment'}: ${rem.clientName} (${currencySymbol}${formatCash(rem.amount)})`,
      `DESCRIPTION:${isPayable ? 'Recurring / Constant Expense' : 'Freelance Invoice'}: ${rem.projectTitle}\\n${isPayable ? 'Payee' : 'Client'}: ${rem.clientName}\\nAmount: ${currencySymbol}${formatCash(rem.amount)}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT9H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${isPayable ? 'Reminder to pay' : 'Reminder to collect payment from'} ${rem.clientName}`,
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
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            {isPayablesMode ? 'Cash Payable' : 'Cash Receivable'}
          </h2>
          <p className="text-xs text-zinc-400">
            {isPayablesMode
              ? 'Track salaries, rent, vendor bills, and outgoing payables'
              : 'Track client invoices, milestones, and incoming retainers'}
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isPayablesMode ? 'Add Payable Due Date' : 'Add Receivable Due Date'}</span>
        </button>
      </div>

      {/* Top Banner Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Remaining */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium">
            {isPayablesMode ? 'Total Remaining (This Month)' : 'Total Remaining (This Month)'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
            {currencySymbol}{formatCash(totalPendingThisMonth)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Across {thisMonthActive.length} active this month {totalPendingFuture > 0 ? `(+ ${currencySymbol}${formatCash(totalPendingFuture)} upcoming)` : ''}
          </div>
        </div>

        {/* Card 2: Cash Collected / Cash Paid (Second in the row) */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium">
            {isPayablesMode ? 'Cash Paid' : 'Cash Collected'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
            {currencySymbol}{formatCash(totalSettled)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Across {settledCount} {isPayablesMode ? 'paid records' : 'collected records'}
          </div>
        </div>

        {/* Card 3: Action Required */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium">Action Required</div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1 flex items-center gap-2">
            <span>{urgentCount}</span>
            {urgentCount > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
                {overdueList.length} Overdue
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {dueTodayList.length} item{dueTodayList.length === 1 ? '' : 's'} due today
          </div>
        </div>

        {/* Card 4: Total Records */}
        <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium">
            {isPayablesMode ? 'This Month Due' : 'This Month Due'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
            {thisMonthActive.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {futureActive.length > 0 ? `${futureActive.length} scheduled in future months` : 'All current cycle records'}
          </div>
        </div>
      </div>

      {/* Main List Card */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl shadow-xl p-3.5 sm:p-5">
        {/* Navigation Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
          <div className="flex items-center gap-1.5 bg-[#181b23] p-1 rounded-xl border border-white/10 text-xs overflow-x-auto max-w-full pb-1 sm:pb-1">
            <button
              onClick={() => setFilterTab('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'this_month' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isPayablesMode ? `To Pay (This Month) (${thisMonthActive.length})` : `To Collect (This Month) (${thisMonthActive.length})`}
            </button>
            <button
              onClick={() => setFilterTab('urgent')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterTab === 'urgent' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Needs Attention</span>
              {urgentCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500/30 text-rose-300 font-bold text-[10px] flex items-center justify-center border border-rose-500/40">
                  {urgentCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterTab === 'upcoming' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Upcoming Months</span>
              {futureActive.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-[10px] border border-blue-500/30">
                  {futureActive.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('collected')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'collected' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isPayablesMode ? `Paid (${settledCount})` : `Collected (${settledCount})`}
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'all' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({baseReminders.length})
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAddModal}
              className="sm:hidden bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isPayablesMode ? 'Add Payable' : 'Add Receivable'}</span>
            </button>
            <span className="text-xs text-zinc-400 hidden lg:inline">
              Due dates calculate alerts automatically
            </span>
          </div>
        </div>

        {/* Receivables Grid / Cards */}
        <div className="pt-4 space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-2" />
              {isPayablesMode
                ? "No payable records in this view. You're completely up to date!"
                : "No receivable records in this view. You're completely up to date!"}
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
                      ? 'bg-[#181a24] border-white/20 hover:border-white/30'
                      : isCollected
                      ? 'bg-emerald-950/10 border-white/5 opacity-75'
                      : 'bg-[#161821] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Client & Project Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {rem.type === 'payable' ? (
                          <span className="text-[11px] font-medium text-rose-400 flex items-center gap-0.5">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>To Pay</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>To Collect</span>
                          </span>
                        )}
                        <span className="font-bold text-white text-sm">{rem.clientName}</span>
                        {rem.invoiceNumber && (
                          <span className="text-[10px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded font-mono border border-white/5">
                            #{rem.invoiceNumber}
                          </span>
                        )}
                        {rem.status === 'ended' ? (
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-white/10 px-2 py-0.5 rounded-md font-semibold">
                            Contract Ended
                          </span>
                        ) : rem.frequency === 'monthly' ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                            <Repeat className="w-3 h-3 text-emerald-400" />
                            <span>{rem.autoRenew !== false ? 'Auto-Renewing Retainer' : 'Monthly'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500">
                            Once
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                            dueInfo.color === 'rose'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                              : dueInfo.color === 'emerald'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                              : 'bg-white/10 text-zinc-200 border border-white/20'
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
                          <span>Due: <strong className="text-zinc-200">{formatDateDDMMYYYY(rem.dueDate)}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Reminder: <strong className="text-zinc-200">{formatDateDDMMYYYY(rem.reminderDate)}</strong></span>
                        </span>
                        {rem.clientEmail && (
                          <span className="text-zinc-500">Contact: {rem.clientEmail}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 self-end lg:self-center">
                      <div className="text-right">
                        <div className="text-lg font-bold text-white font-mono">
                          {currencySymbol}{formatCash(rem.amount)}
                        </div>
                        {rem.originalCurrency && rem.originalCurrency !== 'PKR' && rem.originalAmount ? (
                          <div className="text-[11px] text-zinc-400 font-mono font-medium">
                            {formatForeignAmount(rem.originalAmount, rem.originalCurrency)} (@ {rem.exchangeRate})
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">
                            {rem.token || rem.currency || 'PKR'}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {!isCollected ? (
                          <>
                            {/* Action Button */}
                            <button
                              onClick={() => setCollectingReminder(rem)}
                              className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{rem.type === 'payable' ? 'Mark as Paid' : 'Collect Payment'}</span>
                            </button>

                            {/* 1-Click WhatsApp Payment Reminder */}
                            {rem.type !== 'payable' && (
                              <a
                                href={getWhatsAppReminderUrl(rem, settings)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Send WhatsApp payment reminder"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline font-medium">WhatsApp</span>
                              </a>
                            )}

                            {/* Copy Reminder Message */}
                            <button
                              onClick={() => handleCopyReminderText(rem)}
                              className="bg-[#202430] hover:bg-[#282d3c] text-zinc-200 text-xs px-2.5 py-2 rounded-xl flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                              title={rem.type === 'payable' ? "Copy expense reminder details" : "Copy professional reminder message to clipboard"}
                            >
                              {copiedId === rem.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>{rem.type === 'payable' ? 'Copy Info' : 'Follow-Up'}</span>
                                </>
                              )}
                            </button>

                            {/* Download ICS */}
                            <button
                              onClick={() => handleDownloadICS(rem)}
                              className="p-2 text-zinc-400 hover:text-white bg-[#202430] hover:bg-[#282d3c] border border-white/10 rounded-xl transition-colors cursor-pointer"
                              title="Add reminder to Google / Apple Calendar (.ics)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{rem.type === 'payable' ? 'Paid & Deducted' : 'Paid & Deposited'}</span>
                          </div>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditReminder(rem)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          title={rem.type === 'payable' ? "Edit payable obligation & schedule" : "Edit invoice & schedule"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete / End Contract Button */}
                        <button
                          onClick={() => setReminderToDelete(rem)}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title={rem.frequency === 'monthly' ? "End contract or delete obligation" : "Delete obligation"}
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

      {/* Collect / Pay Settlement Modal */}
      {collectingReminder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14161d] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">
                  {collectingReminder.type === 'payable' ? 'Settle Outgoing Expense' : 'Collect Client Payment'}
                </h3>
              </div>
              <button
                onClick={() => setCollectingReminder(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-[#1c1f28] p-3 rounded-xl border border-white/5">
                <div className="text-xs text-zinc-400">
                  {collectingReminder.type === 'payable' ? 'Payee & Expense' : 'Client & Invoice'}
                </div>
                <div className="font-semibold text-white mt-0.5">{collectingReminder.clientName}</div>
                <div className="text-xs text-zinc-400">{collectingReminder.projectTitle}</div>
                <div className="text-lg font-mono font-bold text-white mt-2">
                  {currencySymbol}{formatCash(collectingReminder.amount)} {collectingReminder.token}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {collectingReminder.type === 'payable' ? 'Select Account / Wallet to Pay From:' : 'Select Deposit Account / Wallet:'}
                </label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full bg-[#181b23] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white/30"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency} - Current Balance: {w.symbol}{formatCash(w.balance)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  {collectingReminder.type === 'payable'
                    ? `This will mark the expense as Paid, deduct ${currencySymbol}${formatCash(collectingReminder.amount)} from the selected wallet, and log an Expense transaction.${collectingReminder.frequency === 'monthly' ? ' Next month’s recurring expense reminder will automatically be scheduled.' : ''}`
                    : `This will mark the invoice as Collected, immediately deposit ${currencySymbol}${formatCash(collectingReminder.amount)} into the selected wallet, and log an Income transaction.${collectingReminder.frequency === 'monthly' ? ' Next month’s recurring retainer will automatically be scheduled.' : ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
              <button
                onClick={() => setCollectingReminder(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCollect}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors shadow-sm cursor-pointer"
              >
                {collectingReminder.type === 'payable' ? 'Confirm Payment' : 'Confirm Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Contract / Delete Safe Confirmation Modal */}
      {reminderToDelete && (() => {
        const linkedHistory = (transactions || []).filter(
          (t) =>
            t.reminderId === reminderToDelete.id ||
            (t.clientOrPayer &&
              t.clientOrPayer.trim().toLowerCase() === reminderToDelete.clientName.trim().toLowerCase())
        );
        const historyTotal = linkedHistory.reduce((sum, t) => sum + t.amount, 0);

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#12141a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {reminderToDelete.frequency === 'monthly' ? 'End Contract / Remove' : 'Remove Obligation'}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      {reminderToDelete.clientName} • {reminderToDelete.projectTitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderToDelete(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 space-y-3">
                {/* Green Ledger Protection Guarantee */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ledger History Is 100% Protected</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed">
                    Ending or removing this contract will <strong>never delete your past transaction history</strong>. All historical income and expense transactions stay permanently recorded in your ledger and wallet balances.
                  </p>
                  {linkedHistory.length > 0 ? (
                    <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">Safely preserved history:</span>
                      <span className="text-emerald-300 font-bold">{linkedHistory.length} record(s) ({currencySymbol}{formatCash(historyTotal)})</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] text-zinc-400">
                      Previous reports, category expenses, and balances remain completely intact.
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed bg-[#171922] p-3 rounded-xl border border-white/5">
                  {reminderToDelete.frequency === 'monthly'
                    ? 'If your contract with this party has ended, click "End Contract" to cancel upcoming reminders and stop monthly auto-renewals.'
                    : 'Remove this obligation from your active schedule. Historical transaction entries stay safe in your ledger.'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                {reminderToDelete.frequency === 'monthly' && onUpdateReminder && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateReminder(reminderToDelete.id, {
                        status: 'ended',
                        autoRenew: false,
                      });
                      setReminderToDelete(null);
                    }}
                    className="w-full py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <CalendarX className="w-3.5 h-3.5 text-amber-400" />
                    <span>End Contract (Stop Future Renewals)</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderToDelete(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteReminder(reminderToDelete.id);
                      setReminderToDelete(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-600 border border-rose-500/25 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete from List</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
