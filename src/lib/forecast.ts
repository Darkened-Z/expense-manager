import { Wallet, Transaction, PaymentReminder } from '@/types';

export interface RunwayProjectionPeriod {
  days: number;
  label: string;
  targetDate: string;
  projectedBalance: number;
  expectedReceivables: number;
  expectedPayables: number;
  estimatedBurn: number;
  netChange: number;
}

export interface RunwayForecast {
  currentCash: number;
  dailyBurnRate: number;
  monthlyBurnRate: number;
  runwayDays: number;
  adjustedRunwayDays: number;
  healthStatus: 'critical' | 'warning' | 'solid' | 'abundant';
  healthLabel: string;
  projections: {
    days30: RunwayProjectionPeriod;
    days60: RunwayProjectionPeriod;
    days90: RunwayProjectionPeriod;
  };
}

export function calculateRunwayForecast(
  wallets: Wallet[],
  transactions: Transaction[],
  reminders: PaymentReminder[]
): RunwayForecast {
  const currentCash = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calculate past 30 days expenses (excluding transfers)
  const past30Time = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const recentExpenses = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const tTime = new Date(t.date + 'T00:00:00').getTime();
    return !isNaN(tTime) && tTime >= past30Time;
  });

  const recentExpenseTotal = recentExpenses.reduce((sum, t) => sum + t.amount, 0);

  // If no expenses in last 30d, look at all-time expenses
  const allExpenses = transactions.filter((t) => t.type === 'expense');
  const allExpenseTotal = allExpenses.reduce((sum, t) => sum + t.amount, 0);

  const effective30DayExpense = recentExpenseTotal > 0 ? recentExpenseTotal : allExpenseTotal;
  const dailyBurnRate = effective30DayExpense > 0 ? effective30DayExpense / 30 : 0;
  const monthlyBurnRate = dailyBurnRate * 30;

  // Active uncollected reminders (excluding ended/cancelled contracts)
  const activeReminders = reminders.filter(
    (r) => r.status !== 'collected' && r.status !== 'ended'
  );

  const getRemindersWithinDays = (days: number) => {
    const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const inRange = activeReminders.filter((r) => r.dueDate <= cutoffStr);

    const receivables = inRange
      .filter((r) => r.type !== 'payable')
      .reduce((sum, r) => sum + r.amount, 0);

    const payables = inRange
      .filter((r) => r.type === 'payable')
      .reduce((sum, r) => sum + r.amount, 0);

    return { receivables, payables, cutoffStr };
  };

  const p30 = getRemindersWithinDays(30);
  const p60 = getRemindersWithinDays(60);
  const p90 = getRemindersWithinDays(90);

  const burn30 = dailyBurnRate * 30;
  const burn60 = dailyBurnRate * 60;
  const burn90 = dailyBurnRate * 90;

  const proj30Balance = currentCash + p30.receivables - p30.payables - burn30;
  const proj60Balance = currentCash + p60.receivables - p60.payables - burn60;
  const proj90Balance = currentCash + p90.receivables - p90.payables - burn90;

  // Runway days based on current cash
  let runwayDays = 999;
  if (dailyBurnRate > 0) {
    runwayDays = Math.max(0, Math.floor(currentCash / dailyBurnRate));
  } else if (currentCash <= 0) {
    runwayDays = 0;
  }

  // Adjusted runway taking net pending cash flow into account
  let adjustedRunwayDays = runwayDays;
  const netPending = p90.receivables - p90.payables;
  if (dailyBurnRate > 0) {
    adjustedRunwayDays = Math.max(0, Math.floor((currentCash + netPending) / dailyBurnRate));
  }

  let healthStatus: 'critical' | 'warning' | 'solid' | 'abundant' = 'abundant';
  let healthLabel = 'Abundant Runway (90+ Days)';

  if (runwayDays < 30) {
    healthStatus = 'critical';
    healthLabel = 'Critical Runway (< 30 Days)';
  } else if (runwayDays < 60) {
    healthStatus = 'warning';
    healthLabel = 'Tight Runway (30–60 Days)';
  } else if (runwayDays < 90) {
    healthStatus = 'solid';
    healthLabel = 'Solid Runway (60–90 Days)';
  }

  return {
    currentCash,
    dailyBurnRate,
    monthlyBurnRate,
    runwayDays,
    adjustedRunwayDays,
    healthStatus,
    healthLabel,
    projections: {
      days30: {
        days: 30,
        label: '30-Day Outlook',
        targetDate: p30.cutoffStr,
        projectedBalance: Math.round(proj30Balance),
        expectedReceivables: p30.receivables,
        expectedPayables: p30.payables,
        estimatedBurn: Math.round(burn30),
        netChange: Math.round(proj30Balance - currentCash),
      },
      days60: {
        days: 60,
        label: '60-Day Midterm',
        targetDate: p60.cutoffStr,
        projectedBalance: Math.round(proj60Balance),
        expectedReceivables: p60.receivables,
        expectedPayables: p60.payables,
        estimatedBurn: Math.round(burn60),
        netChange: Math.round(proj60Balance - currentCash),
      },
      days90: {
        days: 90,
        label: '90-Day Quarterly',
        targetDate: p90.cutoffStr,
        projectedBalance: Math.round(proj90Balance),
        expectedReceivables: p90.receivables,
        expectedPayables: p90.payables,
        estimatedBurn: Math.round(burn90),
        netChange: Math.round(proj90Balance - currentCash),
      },
    },
  };
}
