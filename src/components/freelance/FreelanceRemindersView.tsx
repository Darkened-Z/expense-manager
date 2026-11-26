'use client';

import React, { useState, useEffect } from 'react';
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
  History,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentReminder, Wallet, AppSettings, Transaction } from '@/types';
import { formatDateDDMMYYYY, formatCash } from '@/lib/formatters';
import { getWhatsAppReminderUrl } from '@/lib/whatsapp';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { formatForeignAmount, getCurrencySymbol } from '@/lib/currencies';

interface CollectOverrideAmounts {
  amountPKR: number;
  variableAmountPKR?: number;
  originalAmount?: number;
  originalVariableAmount?: number;
}

interface FreelanceRemindersViewProps {
  mode?: 'receivables' | 'payables';
  reminders: PaymentReminder[];
  wallets: Wallet[];
  currencySymbol: string;
  settings?: AppSettings;
  transactions?: Transaction[];
  initialCollectId?: string | null;
  onClearInitialCollectId?: () => void;
  onOpenAddModal: () => void;
  onEditReminder: (reminder: PaymentReminder) => void;
  onCollectReminder: (id: string, walletId: string, overrideAmounts?: CollectOverrideAmounts) => void;
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
  initialCollectId = null,
  onClearInitialCollectId,
  onOpenAddModal,
  onEditReminder,
  onCollectReminder,
  onDeleteReminder,
  onUpdateReminder,
}) => {
  const isPayablesMode = mode === 'payables';
  const [filterTab, setFilterTab] = useState<'this_month' | 'urgent' | 'upcoming' | 'collected' | 'all'>('this_month');
  const [progressScope, setProgressScope] = useState<'overall' | 'this_month'>('overall');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReminderDetails, setSelectedReminderDetails] = useState<PaymentReminder | null>(null);
  const [collectingReminder, setCollectingReminder] = useState<PaymentReminder | null>(null);
  const [settleVariableInput, setSettleVariableInput] = useState<string>('');
  const [settleError, setSettleError] = useState<string | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<PaymentReminder | null>(null);
  const [targetWalletId, setTargetWalletId] = useState<string>(wallets[0]?.id || 'wal-bank');

  const openCollectModal = (rem: PaymentReminder) => {
    setCollectingReminder(rem);
    const isForeign = Boolean(rem.originalCurrency && rem.originalCurrency !== 'PKR');
    if (rem.amountType === 'hybrid') {
      const varInit = isForeign ? (rem.originalVariableAmount ?? 0) : (rem.variableAmount ?? 0);
      setSettleVariableInput(varInit > 0 ? varInit.toString() : '');
    } else if (rem.amountType === 'variable') {
      const initAmt = isForeign ? (rem.originalAmount ?? 0) : (rem.amount ?? 0);
      setSettleVariableInput(initAmt > 0 ? initAmt.toString() : '');
    } else {
      setSettleVariableInput('');
    }
    setSettleError(null);
  };

  useEffect(() => {
    if (!initialCollectId) return;
    const match = reminders.find((r) => r.id === initialCollectId && r.status !== 'collected');
    if (match) {
      openCollectModal(match);
    }
    if (onClearInitialCollectId) onClearInitialCollectId();
  }, [initialCollectId, reminders, onClearInitialCollectId]);

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

  const settledList = baseReminders.filter((r) => r.status === 'collected');
  const settledCount = settledList.length;

  // Progress bar stats (Total vs Given/Taken vs Left, with amounts and percentages)
  const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSettledList = settledList.filter(
    (r) => r.dueDate.startsWith(currentMonthPrefix) || (r.collectedAt && r.collectedAt.startsWith(currentMonthPrefix))
  );
  const settledThisMonth = thisMonthSettledList.reduce((sum, r) => sum + r.amount, 0);

  const progressGivenOrTaken = progressScope === 'this_month' ? settledThisMonth : totalSettled;
  const progressLeft =
    progressScope === 'this_month' ? totalPendingThisMonth : totalPendingThisMonth + totalPendingFuture;
  const progressTotal = progressGivenOrTaken + progressLeft;

  const progressSettledPct = progressTotal > 0 ? (progressGivenOrTaken / progressTotal) * 100 : 0;
  const progressLeftPct = progressTotal > 0 ? Math.max(0, 100 - progressSettledPct) : 0;

  const activeScopeItems =
    progressScope === 'this_month' ? thisMonthActive : [...thisMonthActive, ...futureActive];
  const hasVariableInScope = activeScopeItems.some(
    (r) => r.amountType === 'variable' || (r.amountType === 'hybrid' && (r.variableAmount || 0) === 0)
  );
  const progressSettledCount = progressScope === 'this_month' ? thisMonthSettledList.length : settledCount;
  const progressLeftCount = activeScopeItems.length;

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
    let amountLabel =
      rem.amountType === 'variable' && rem.amount === 0
        ? 'Variable (To be finalized)'
        : `${currencySymbol}${formatCash(rem.amount)}`;
    if (rem.amountType === 'hybrid' && rem.amount > 0 && (rem.variableAmount || 0) > 0) {
      amountLabel = `${amountLabel} (Fixed ${currencySymbol}${formatCash(rem.fixedAmount || 0)} + Variable ${currencySymbol}${formatCash(rem.variableAmount || 0)})`;
    }

    const text = isPayable
      ? `Payment Reminder: ${rem.projectTitle}\nPayee: ${rem.clientName}\nAmount: ${amountLabel}\nDue Date: ${formattedDue}${rem.notes ? `\nNotes: ${rem.notes}` : ''}`
      : `Hi ${rem.clientName},\n\nI hope you're having a great week! Friendly reminder that Invoice #${rem.invoiceNumber || 'INV'} for "${rem.projectTitle}" in the amount of ${amountLabel} was due on ${formattedDue}.\n\nPlease let me know once the payment has been initiated or if you need any additional invoice documentation.\n\nThank you!`;

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

  const computeSettlementBreakdown = (rem: PaymentReminder, varInputStr: string) => {
    const planType = rem.amountType || 'fixed';
    const isForeign = Boolean(rem.originalCurrency && rem.originalCurrency !== 'PKR');
    const rate = rem.exchangeRate || 1;

    if (planType === 'fixed') {
      return {
        planType,
        isForeign,
        displayCurr: rem.originalCurrency || 'PKR',
        fixedDisplay: 0,
        varDisplay: 0,
        totalDisplay: isForeign ? (rem.originalAmount || 0) : rem.amount,
        fixedPKR: rem.amount,
        varPKR: 0,
        totalPKR: rem.amount,
      };
    }

    const parsedVar = Math.max(0, parseFloat(varInputStr) || 0);
    const varPKR = isForeign ? Math.round(parsedVar * rate) : Math.round(parsedVar);

    if (planType === 'hybrid') {
      const fixedPKR = rem.fixedAmount || 0;
      const fixedDisplay = isForeign
        ? (rem.originalFixedAmount ?? Math.round(fixedPKR / rate))
        : fixedPKR;
      return {
        planType,
        isForeign,
        displayCurr: rem.originalCurrency || 'PKR',
        fixedDisplay,
        varDisplay: parsedVar,
        totalDisplay: fixedDisplay + parsedVar,
        fixedPKR,
        varPKR,
        totalPKR: fixedPKR + varPKR,
      };
    }

    return {
      planType,
      isForeign,
      displayCurr: rem.originalCurrency || 'PKR',
      fixedDisplay: 0,
      varDisplay: parsedVar,
      totalDisplay: parsedVar,
      fixedPKR: 0,
      varPKR,
      totalPKR: varPKR,
    };
  };

  // Finalize payment collection
  const handleConfirmCollect = () => {
    if (!collectingReminder) return;

    const breakdown = computeSettlementBreakdown(collectingReminder, settleVariableInput);
    if (breakdown.totalPKR <= 0) {
      setSettleError('Please enter a valid amount greater than 0 before settling.');
      return;
    }

    // Trigger celebration confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f97316', '#38bdf8', '#fbbf24'],
    });

    if (breakdown.planType === 'variable' || breakdown.planType === 'hybrid') {
      onCollectReminder(collectingReminder.id, targetWalletId, {
        amountPKR: breakdown.totalPKR,
        variableAmountPKR: breakdown.varPKR,
        originalAmount: breakdown.isForeign ? breakdown.totalDisplay : undefined,
        originalVariableAmount: breakdown.isForeign ? breakdown.varDisplay : undefined,
      });
    } else {
      onCollectReminder(collectingReminder.id, targetWalletId);
    }
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
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2 px-3.5 rounded-none text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isPayablesMode ? 'Add Payable Due Date' : 'Add Receivable Due Date'}</span>
        </button>
      </div>

      {/* Top Banner Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-full">
        {/* Card 1: Total Remaining */}
        <div className="bg-[#12141a] border border-[#22252f] rounded-none p-4 sm:p-5 relative overflow-hidden min-w-0">
          <div className="text-xs text-zinc-400 font-medium truncate">
            {isPayablesMode ? 'Total Remaining (This Month)' : 'Total Remaining (This Month)'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1 truncate">
            {currencySymbol}{formatCash(totalPendingThisMonth)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 truncate">
            Across {thisMonthActive.length} active this month {totalPendingFuture > 0 ? `(+ ${currencySymbol}${formatCash(totalPendingFuture)} upcoming)` : ''}
          </div>
        </div>

        {/* Card 2: Cash Collected / Cash Paid (Second in the row) */}
        <div className="bg-[#12141a] border border-[#22252f] rounded-none p-4 sm:p-5 relative overflow-hidden min-w-0">
          <div className="text-xs text-zinc-400 font-medium truncate">
            {isPayablesMode ? 'Cash Paid' : 'Cash Collected'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1 truncate">
            {currencySymbol}{formatCash(totalSettled)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 truncate">
            Across {settledCount} {isPayablesMode ? 'paid records' : 'collected records'}
          </div>
        </div>

        {/* Card 3: Action Required */}
        <div className="bg-[#12141a] border border-[#22252f] rounded-none p-4 sm:p-5 relative overflow-hidden min-w-0">
          <div className="text-xs text-zinc-400 font-medium truncate">Action Required</div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1 flex items-center gap-2 truncate">
            <span>{urgentCount}</span>
            {urgentCount > 0 && (
              <span className="text-xs font-medium text-rose-400 shrink-0 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-rose-400 animate-pulse" />
                {overdueList.length} Overdue
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 truncate">
            {dueTodayList.length} item{dueTodayList.length === 1 ? '' : 's'} due today
          </div>
        </div>

        {/* Card 4: Total Records */}
        <div className="bg-[#12141a] border border-[#22252f] rounded-none p-4 sm:p-5 relative overflow-hidden min-w-0">
          <div className="text-xs text-zinc-400 font-medium truncate">
            {isPayablesMode ? 'This Month Due' : 'This Month Due'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1 truncate">
            {thisMonthActive.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 truncate">
            {futureActive.length > 0 ? `${futureActive.length} scheduled in future months` : 'All current cycle records'}
          </div>
        </div>
      </div>

      {/* Settlement Breakdown Bar (Total vs Given/Taken vs Left with Amount & Percentage) */}
      <div className="bg-[#12141a] border border-[#22252f] rounded-none p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>{isPayablesMode ? 'Payables Progress (Given vs Left)' : 'Receivables Progress (Taken vs Left)'}</span>
              {hasVariableInScope && (
                <span className="text-[10px] font-mono font-normal text-amber-400">
                  + Variable TBD
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Total {isPayablesMode ? 'obligations' : 'invoices'}:{' '}
              <span className="font-mono font-semibold text-white">
                {currencySymbol}{formatCash(progressTotal)}
              </span>{' '}
              <span className="text-zinc-500">
                ({progressSettledCount} settled • {progressLeftCount} remaining)
              </span>
            </p>
          </div>

          {/* Scope Toggle: Overall vs This Month */}
          <div className="inline-flex items-center gap-1 bg-[#181b23] p-1 rounded-none border border-[#2c303d] text-[11px] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setProgressScope('overall')}
              className={`px-2.5 py-1 rounded-none transition-colors cursor-pointer ${
                progressScope === 'overall' ? 'bg-[#20232e] text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overall
            </button>
            <button
              type="button"
              onClick={() => setProgressScope('this_month')}
              className={`px-2.5 py-1 rounded-none transition-colors cursor-pointer ${
                progressScope === 'this_month' ? 'bg-[#20232e] text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Summary Figures Row */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <div className="bg-[#161821] border border-[#22252f] rounded-none p-3 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
              <span className="w-2 h-2 rounded-none bg-emerald-400 shrink-0" />
              <span className="truncate">{isPayablesMode ? 'Given (Paid)' : 'Taken (Collected)'}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 truncate">
                {currencySymbol}{formatCash(progressGivenOrTaken)}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {progressSettledPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-[#161821] border border-[#22252f] rounded-none p-3 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
              <span className={`w-2 h-2 rounded-none shrink-0 ${isPayablesMode ? 'bg-rose-400' : 'bg-amber-400'}`} />
              <span className="truncate">Left (Remaining)</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
              <span className={`text-sm sm:text-base font-bold font-mono truncate ${isPayablesMode ? 'text-rose-400' : 'text-amber-300'}`}>
                {currencySymbol}{formatCash(progressLeft)}
              </span>
              <span className={`text-xs font-mono font-bold ${isPayablesMode ? 'text-rose-300' : 'text-amber-300'}`}>
                {progressLeftPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-[#161821] border border-[#22252f] rounded-none p-3 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
              <span className="w-2 h-2 rounded-none bg-zinc-300 shrink-0" />
              <span className="truncate">Total</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-sm sm:text-base font-bold font-mono text-white truncate">
                {currencySymbol}{formatCash(progressTotal)}
              </span>
              <span className="text-xs font-mono font-semibold text-zinc-400">
                {progressTotal > 0 ? '100%' : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Split Bar Showing Amount & Percentage */}
        <div className="space-y-1.5">
          <div className="w-full h-8 rounded-none bg-[#181b23] border border-[#2c303d] overflow-hidden flex font-mono text-[11px] font-semibold">
            {progressTotal === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                No amounts recorded yet (0%)
              </div>
            ) : (
              <>
                {progressSettledPct > 0 && (
                  <div
                    className="h-full bg-emerald-600 text-zinc-950 flex items-center justify-center px-2 transition-all duration-500 overflow-hidden whitespace-nowrap"
                    style={{ width: `${progressSettledPct}%` }}
                    title={`${isPayablesMode ? 'Given' : 'Taken'}: ${currencySymbol}${formatCash(progressGivenOrTaken)} (${progressSettledPct.toFixed(1)}%)`}
                  >
                    {progressSettledPct >= 18 && (
                      <span className="truncate font-bold">
                        {isPayablesMode ? 'Given' : 'Taken'} {currencySymbol}{formatCash(progressGivenOrTaken)} ({progressSettledPct.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                )}
                {progressLeftPct > 0 && (
                  <div
                    className={`h-full flex items-center justify-center px-2 transition-all duration-500 overflow-hidden whitespace-nowrap ${
                      isPayablesMode ? 'bg-[#421a24] text-rose-200' : 'bg-[#423215] text-amber-200'
                    }`}
                    style={{ width: `${progressLeftPct}%` }}
                    title={`Left: ${currencySymbol}${formatCash(progressLeft)} (${progressLeftPct.toFixed(1)}%)`}
                  >
                    {progressLeftPct >= 18 && (
                      <span className="truncate">
                        Left {currencySymbol}{formatCash(progressLeft)} ({progressLeftPct.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main List Card */}
      <div className="bg-[#12141a] border border-[#22252f] rounded-none p-3.5 sm:p-5 max-w-full overflow-hidden">
        {/* Navigation Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#22252f] gap-3 max-w-full">
          <div className="flex items-center gap-1.5 bg-[#181b23] p-1 rounded-none border border-[#2c303d] text-xs overflow-x-auto max-w-full pb-1 sm:pb-1 scrollbar-none min-w-0">
            <button
              onClick={() => setFilterTab('this_month')}
              className={`px-3 py-1.5 rounded-none transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'this_month' ? 'bg-[#20232e] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isPayablesMode ? `To Pay (This Month) (${thisMonthActive.length})` : `To Collect (This Month) (${thisMonthActive.length})`}
            </button>
            <button
              onClick={() => setFilterTab('urgent')}
              className={`px-3 py-1.5 rounded-none transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterTab === 'urgent' ? 'bg-[#38161e] text-rose-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Needs Attention</span>
              {urgentCount > 0 && (
                <span className="font-mono text-[11px] font-bold text-rose-400">
                  ({urgentCount})
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('upcoming')}
              className={`px-3 py-1.5 rounded-none transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterTab === 'upcoming' ? 'bg-[#20232e] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Upcoming Months</span>
              {futureActive.length > 0 && (
                <span className="font-mono text-[11px] font-semibold text-sky-400">
                  ({futureActive.length})
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('collected')}
              className={`px-3 py-1.5 rounded-none transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'collected' ? 'bg-[#20232e] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isPayablesMode ? `Paid (${settledCount})` : `Collected (${settledCount})`}
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-none transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'all' ? 'bg-[#20232e] text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({baseReminders.length})
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAddModal}
              className="sm:hidden bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-1.5 px-3 rounded-none text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
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
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
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
                  onClick={() => setSelectedReminderDetails(rem)}
                  className={`p-4 rounded-none border transition-all cursor-pointer group ${
                    rem.status === 'overdue'
                      ? 'bg-[#210f13] border-rose-700 hover:border-rose-600'
                      : rem.status === 'due_today'
                      ? 'bg-[#181a24] border-[#3f4557] hover:border-[#52596e]'
                      : isCollected
                      ? 'bg-[#0b1f17] border-[#22252f] opacity-75 hover:border-[#3f4557]'
                      : 'bg-[#161821] border-[#22252f] hover:border-[#3f4557]'
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
                        <span className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">{rem.clientName}</span>
                        {rem.invoiceNumber && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            #{rem.invoiceNumber}
                          </span>
                        )}
                        {rem.status === 'ended' ? (
                          <span className="text-[10px] font-mono text-zinc-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-none bg-zinc-500" />
                            Contract Ended
                          </span>
                        ) : rem.frequency === 'monthly' ? (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                            <Repeat className="w-3 h-3 text-emerald-400" />
                            <span>{rem.autoRenew !== false ? 'Auto-Renewing Retainer' : 'Monthly'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500">
                            Once
                          </span>
                        )}
                        {rem.amountType === 'hybrid' && (
                          <span className="text-[10px] font-mono text-sky-400 font-semibold">
                            • Fixed + Variable
                          </span>
                        )}
                        {rem.amountType === 'variable' && (
                          <span className="text-[10px] font-mono text-amber-400 font-semibold">
                            • Variable
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                            dueInfo.color === 'rose'
                              ? 'text-rose-400'
                              : dueInfo.color === 'emerald'
                              ? 'text-emerald-400'
                              : 'text-zinc-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-none ${
                            dueInfo.color === 'rose'
                              ? 'bg-rose-400'
                              : dueInfo.color === 'emerald'
                              ? 'bg-emerald-400'
                              : 'bg-zinc-400'
                          }`} />
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 self-end lg:self-center" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white font-mono">
                          {rem.amountType === 'variable' && rem.amount === 0
                            ? 'Variable'
                            : rem.amountType === 'hybrid' && (rem.variableAmount || 0) === 0
                            ? `${currencySymbol}${formatCash(rem.fixedAmount || rem.amount)} + Var`
                            : `${currencySymbol}${formatCash(rem.amount)}`}
                        </div>
                        {rem.amountType === 'hybrid' ? (
                          <div className="text-[10px] text-sky-300 font-mono">
                            {(rem.variableAmount || 0) > 0
                              ? `Fixed ${currencySymbol}${formatCash(rem.fixedAmount || 0)} + Var ${currencySymbol}${formatCash(rem.variableAmount || 0)}`
                              : 'Fixed base + Variable asked when settling'}
                          </div>
                        ) : rem.amountType === 'variable' ? (
                          <div className="text-[10px] text-amber-300 font-mono">
                            {rem.amount > 0
                              ? `Variable • ${rem.token || rem.currency || 'PKR'}`
                              : 'Amount asked when settling'}
                          </div>
                        ) : rem.originalCurrency && rem.originalCurrency !== 'PKR' && rem.originalAmount ? (
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
                              onClick={(e) => {
                                e.stopPropagation();
                                openCollectModal(rem);
                              }}
                              className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-3 py-2 rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
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
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#0f2b20] hover:bg-[#163d2e] border border-emerald-700 text-emerald-400 text-xs px-2.5 py-2 rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Send WhatsApp payment reminder"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline font-medium">WhatsApp</span>
                              </a>
                            )}

                            {/* Copy Reminder Message */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyReminderText(rem);
                              }}
                              className="bg-[#202430] hover:bg-[#282d3c] text-zinc-200 text-xs px-2.5 py-2 rounded-none flex items-center gap-1 border border-[#2c303d] transition-colors cursor-pointer"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadICS(rem);
                              }}
                              className="p-2 text-zinc-400 hover:text-white bg-[#202430] hover:bg-[#282d3c] border border-[#2c303d] rounded-none transition-colors cursor-pointer"
                              title="Add reminder to Google / Apple Calendar (.ics)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{rem.type === 'payable' ? 'Paid & Deducted' : 'Paid & Deposited'}</span>
                          </div>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditReminder(rem);
                          }}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-[#20232e] rounded-none transition-colors cursor-pointer"
                          title={rem.type === 'payable' ? "Edit payable obligation & schedule" : "Edit invoice & schedule"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete / End Contract Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReminderToDelete(rem);
                          }}
                          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-[#261116] rounded-none transition-colors cursor-pointer"
                          title={rem.frequency === 'monthly' ? "End contract or delete obligation" : "Delete obligation"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1d2029] flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <span>View contract & settlement history</span>
                    <span className="group-hover:translate-x-0.5 transition-transform font-mono text-sky-400">→</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Collect / Pay Settlement Modal */}
      {collectingReminder && (() => {
        const settleBreakdown = computeSettlementBreakdown(collectingReminder, settleVariableInput);
        const isVariableOrHybrid = settleBreakdown.planType === 'variable' || settleBreakdown.planType === 'hybrid';
        const displaySym = settleBreakdown.isForeign ? getCurrencySymbol(settleBreakdown.displayCurr) : currencySymbol;

        return (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#14161d] border border-[#2c303d] rounded-none w-full max-w-md p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#22252f]">
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
                {settleError && (
                  <div className="p-2.5 rounded-none bg-[#261116] border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{settleError}</span>
                  </div>
                )}

                <div className="bg-[#1c1f28] p-3.5 rounded-none border border-[#22252f] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-zinc-400">
                        {collectingReminder.type === 'payable' ? 'Payee & Expense' : 'Client & Invoice'}
                      </div>
                      <div className="font-semibold text-white mt-0.5">{collectingReminder.clientName}</div>
                      <div className="text-xs text-zinc-400">{collectingReminder.projectTitle}</div>
                    </div>
                    {settleBreakdown.planType !== 'fixed' && (
                      <span className="text-[10px] font-mono uppercase font-semibold text-sky-400">
                        {settleBreakdown.planType === 'hybrid' ? 'Hybrid Plan' : 'Variable Plan'}
                      </span>
                    )}
                  </div>

                  {isVariableOrHybrid ? (
                    <div className="pt-2.5 border-t border-[#22252f] space-y-2.5">
                      {settleBreakdown.planType === 'hybrid' && (
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-400">Fixed Base Amount:</span>
                          <span className="text-zinc-200 font-semibold">
                            {displaySym}{formatCash(settleBreakdown.fixedDisplay)}
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                          {settleBreakdown.planType === 'hybrid'
                            ? `+ Variable Amount This Month (${settleBreakdown.displayCurr})`
                            : `Actual Variable Amount This Month (${settleBreakdown.displayCurr})`}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs font-semibold select-none">
                            {displaySym}
                          </span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0"
                            value={settleVariableInput}
                            onChange={(e) => {
                              setSettleVariableInput(e.target.value);
                              setSettleError(null);
                            }}
                            className="w-full bg-[#12141a] text-white text-sm font-mono font-bold pl-11 pr-3 py-2 rounded-none border border-[#353a4a] focus:outline-none focus:border-[#67708a]"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#22252f]">
                        <span className="text-xs text-zinc-300 font-medium">Total to Settle:</span>
                        <div className="text-right font-mono">
                          <div className="text-base font-bold text-white">
                            {currencySymbol}{formatCash(settleBreakdown.totalPKR)}
                          </div>
                          {settleBreakdown.isForeign && (
                            <div className="text-[10px] text-zinc-400">
                              ({displaySym}{settleBreakdown.totalDisplay.toLocaleString()} {settleBreakdown.displayCurr})
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-mono font-bold text-white mt-2">
                      {currencySymbol}{formatCash(collectingReminder.amount)} {collectingReminder.token}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    {collectingReminder.type === 'payable' ? 'Select Account / Wallet to Pay From:' : 'Select Deposit Account / Wallet:'}
                  </label>
                  <select
                    value={targetWalletId}
                    onChange={(e) => setTargetWalletId(e.target.value)}
                    className="w-full bg-[#181b23] border border-[#2c303d] rounded-none px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#52596e]"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currency} - Current Balance: {w.symbol}{formatCash(w.balance)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    {collectingReminder.type === 'payable'
                      ? `This will mark the expense as Paid, deduct ${currencySymbol}${formatCash(settleBreakdown.totalPKR)} from the selected wallet, and log an Expense transaction.${collectingReminder.frequency === 'monthly' ? (settleBreakdown.planType === 'hybrid' ? ` Next month will renew with Fixed ${currencySymbol}${formatCash(settleBreakdown.fixedPKR)} + Variable.` : settleBreakdown.planType === 'variable' ? ' Next month will renew as Variable for your next bill.' : ' Next month’s recurring expense reminder will automatically be scheduled.') : ''}`
                      : `This will mark the invoice as Collected, immediately deposit ${currencySymbol}${formatCash(settleBreakdown.totalPKR)} into the selected wallet, and log an Income transaction.${collectingReminder.frequency === 'monthly' ? (settleBreakdown.planType === 'hybrid' ? ` Next month will renew with Fixed ${currencySymbol}${formatCash(settleBreakdown.fixedPKR)} + Variable.` : settleBreakdown.planType === 'variable' ? ' Next month will renew as Variable for your next cycle.' : ' Next month’s recurring retainer will automatically be scheduled.') : ''}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#22252f]">
                <button
                  onClick={() => setCollectingReminder(null)}
                  className="px-4 py-2 rounded-none text-xs font-medium text-zinc-400 hover:text-white bg-[#16181f] hover:bg-[#20232e] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCollect}
                  className="px-5 py-2.5 rounded-none text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer"
                >
                  {collectingReminder.type === 'payable' ? 'Confirm Payment' : 'Confirm Collection'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#12141a] border border-[#2c303d] rounded-none w-full max-w-md p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-[#22252f]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-none bg-[#0d241b] border border-emerald-800 text-emerald-400">
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
                <div className="bg-[#0d241b] border border-emerald-800 rounded-none p-4">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ledger History Is 100% Protected</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed">
                    Ending or removing this contract will <strong>never delete your past transaction history</strong>. All historical income and expense transactions stay permanently recorded in your ledger and wallet balances.
                  </p>
                  {linkedHistory.length > 0 ? (
                    <div className="mt-2.5 pt-2.5 border-t border-emerald-800 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">Safely preserved history:</span>
                      <span className="text-emerald-300 font-bold">{linkedHistory.length} record(s) ({currencySymbol}{formatCash(historyTotal)})</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] text-zinc-400">
                      Previous reports, category expenses, and balances remain completely intact.
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed bg-[#171922] p-3 rounded-none border border-[#22252f]">
                  {reminderToDelete.frequency === 'monthly'
                    ? 'If your contract with this party has ended, click "End Contract" to cancel upcoming reminders and stop monthly auto-renewals.'
                    : 'Remove this obligation from your active schedule. Historical transaction entries stay safe in your ledger.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#22252f] flex flex-col gap-2">
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
                    className="w-full py-2.5 px-4 bg-[#2b2210] hover:bg-[#423215] text-amber-300 border border-amber-700 font-semibold text-xs rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <CalendarX className="w-3.5 h-3.5 text-amber-400" />
                    <span>End Contract (Stop Future Renewals)</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderToDelete(null)}
                    className="flex-1 py-2.5 px-4 rounded-none text-xs font-semibold text-zinc-400 hover:text-white bg-[#16181f] hover:bg-[#20232e] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteReminder(reminderToDelete.id);
                      setReminderToDelete(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-none text-xs font-semibold text-rose-300 hover:text-white bg-[#2e141a] hover:bg-rose-600 border border-rose-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
      {/* Contract & Payment History Modal */}
      {selectedReminderDetails && (() => {
        const dueInfo = getDueLabel(selectedReminderDetails);
        const settledHistory = transactions
          .filter((t) => (
            t.reminderId === selectedReminderDetails.id ||
            (t.clientOrPayer && t.clientOrPayer.toLowerCase() === selectedReminderDetails.clientName.toLowerCase())
          ))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalSettledAmount = settledHistory.reduce((sum, t) => sum + t.amount, 0);

        return (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[#12141a] border border-[#2c303d] rounded-none w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-[#2c303d] flex items-start justify-between bg-[#14161c]">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3.5 rounded-none border ${
                    selectedReminderDetails.type === 'payable'
                      ? 'bg-[#261116] border-rose-800 text-rose-400'
                      : 'bg-[#0d241b] border-emerald-800 text-emerald-400'
                  }`}>
                    {selectedReminderDetails.type === 'payable' ? (
                      <ArrowDownLeft className="w-6 h-6" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg sm:text-xl">{selectedReminderDetails.clientName}</h3>
                      <span className={`text-[10px] font-mono uppercase font-semibold ${
                        selectedReminderDetails.type === 'payable'
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}>
                        {selectedReminderDetails.type === 'payable' ? 'Payable Contract' : 'Receivable Contract'}
                      </span>
                      {selectedReminderDetails.status === 'ended' ? (
                        <span className="text-[10px] font-mono text-zinc-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-none bg-zinc-500" />
                          Contract Ended
                        </span>
                      ) : selectedReminderDetails.frequency === 'monthly' ? (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                          <Repeat className="w-3 h-3 text-emerald-400" />
                          <span>Monthly Retainer</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400">
                          One-Time
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5 font-medium">
                      {selectedReminderDetails.projectTitle}
                      {selectedReminderDetails.invoiceNumber && ` • Invoice #${selectedReminderDetails.invoiceNumber}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReminderDetails(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-none bg-[#16181f] hover:bg-[#20232e] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Obligation & Status Highlights */}
              <div className="p-5 sm:p-6 border-b border-[#2c303d] grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0d0f14]/50">
                <div className="bg-[#171922] p-3.5 rounded-none border border-[#22252f]">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Current Obligation</span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                    {selectedReminderDetails.amountType === 'variable' && selectedReminderDetails.amount === 0
                      ? 'Variable (TBD)'
                      : `${currencySymbol}${formatCash(selectedReminderDetails.amount)}`}
                  </div>
                  {selectedReminderDetails.amountType === 'hybrid' ? (
                    <div className="text-[10px] text-sky-400 font-mono mt-0.5">
                      Fixed {currencySymbol}{formatCash(selectedReminderDetails.fixedAmount || 0)} + Var{' '}
                      {selectedReminderDetails.variableAmount && selectedReminderDetails.variableAmount > 0
                        ? `${currencySymbol}${formatCash(selectedReminderDetails.variableAmount)}`
                        : 'TBD'}
                    </div>
                  ) : selectedReminderDetails.originalCurrency && selectedReminderDetails.originalCurrency !== 'PKR' && selectedReminderDetails.originalAmount ? (
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {formatForeignAmount(selectedReminderDetails.originalAmount, selectedReminderDetails.originalCurrency)}
                    </div>
                  ) : null}
                </div>

                <div className="bg-[#171922] p-3.5 rounded-none border border-[#22252f]">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">Status / Due Date</span>
                  <div className="text-sm sm:text-base font-bold font-mono text-white mt-1">
                    {formatDateDDMMYYYY(selectedReminderDetails.dueDate)}
                  </div>
                  <span className={`text-[10px] font-mono font-semibold uppercase block mt-0.5 ${
                    dueInfo.color === 'rose' ? 'text-rose-400' : dueInfo.color === 'emerald' ? 'text-emerald-400' : 'text-zinc-300'
                  }`}>
                    {dueInfo.text}
                  </span>
                </div>

                <div className="bg-[#171922] p-3.5 rounded-none border border-[#22252f] col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">All-Time Settled</span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
                    {currencySymbol}{formatCash(totalSettledAmount)}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {settledHistory.length} ledger payment{settledHistory.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              {/* Client Contact & Notes (if available) */}
              {(selectedReminderDetails.clientEmail || selectedReminderDetails.clientPhone || selectedReminderDetails.notes) && (
                <div className="px-5 py-3 border-b border-[#22252f] bg-[#14161f] text-xs text-zinc-400 flex flex-wrap gap-4 items-center">
                  {selectedReminderDetails.clientEmail && (
                    <span><strong>Email:</strong> {selectedReminderDetails.clientEmail}</span>
                  )}
                  {selectedReminderDetails.clientPhone && (
                    <span><strong>Phone:</strong> {selectedReminderDetails.clientPhone}</span>
                  )}
                  {selectedReminderDetails.notes && (
                    <span className="italic text-zinc-300">&ldquo;{selectedReminderDetails.notes}&rdquo;</span>
                  )}
                </div>
              )}

              {/* Quick Actions Bar */}
              <div className="px-5 py-3 border-b border-[#22252f] flex items-center justify-between gap-2 bg-[#12141a]">
                <div className="text-xs text-zinc-400 font-medium">
                  Past Settled Transactions <span className="font-mono text-zinc-500">({settledHistory.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedReminderDetails.status !== 'collected' && selectedReminderDetails.status !== 'ended' && (
                    <button
                      type="button"
                      onClick={() => {
                        const r = selectedReminderDetails;
                        setSelectedReminderDetails(null);
                        openCollectModal(r);
                      }}
                      className="px-3 py-1.5 text-xs rounded-none bg-[#0f2b20] hover:bg-[#163d2e] text-emerald-300 border border-emerald-700 flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedReminderDetails.type === 'payable' ? 'Mark as Paid' : 'Collect Payment'}</span>
                    </button>
                  )}
                  {selectedReminderDetails.type !== 'payable' && (
                    <a
                      href={getWhatsAppReminderUrl(selectedReminderDetails, settings)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs rounded-none bg-[#0f2b20] hover:bg-[#163d2e] text-emerald-400 border border-emerald-700 flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedReminderDetails;
                      setSelectedReminderDetails(null);
                      onEditReminder(r);
                    }}
                    className="px-3 py-1.5 text-xs rounded-none bg-[#16181f] hover:bg-[#20232e] text-zinc-300 border border-[#2c303d] flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[45vh] space-y-2">
                {settledHistory.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No historical settlements recorded for this contract yet.</p>
                  </div>
                ) : (
                  settledHistory.map((tx) => {
                    const isCredit = tx.type === 'income' || tx.type === 'deposit';
                    const walletName = wallets.find((w) => w.id === tx.walletId)?.name || 'Account';

                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-[#171922] hover:bg-[#1a1e29] border border-[#22252f] rounded-none flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-none border flex-shrink-0 ${
                              isCredit
                                ? 'bg-[#0d241b] border-emerald-800 text-emerald-400'
                                : 'bg-[#261116] border-rose-800 text-rose-400'
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
                              {tx.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 font-mono">
                              <span>{formatDateDDMMYYYY(tx.date)}</span>
                              <span>•</span>
                              <span>{walletName}</span>
                              {tx.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate text-zinc-400 font-sans italic">&ldquo;{tx.notes}&rdquo;</span>
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
                            {isCredit ? '+' : '-'}{currencySymbol}{formatCash(tx.amount)}
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
              <div className="p-4 border-t border-[#22252f] bg-[#0d0f14]/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedReminderDetails(null)}
                  className="px-5 py-2 rounded-none text-xs font-semibold text-white bg-[#20232e] hover:bg-[#262a37] transition-colors cursor-pointer"
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
