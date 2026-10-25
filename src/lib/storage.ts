import { Transaction, PaymentReminder, Category, Wallet, AppSettings, PaymentReminderStatus, SavingsGoal } from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS, DEFAULT_SETTINGS, INITIAL_REMINDERS, INITIAL_TRANSACTIONS, INITIAL_SAVINGS_GOALS } from './constants';

const KEYS = {
  TRANSACTIONS: 'expense_manager_txs_v2',
  REMINDERS: 'expense_manager_reminders_v2',
  CATEGORIES: 'expense_manager_cats_v2',
  WALLETS: 'expense_manager_wallets_v2',
  SAVINGS: 'expense_manager_savings_v2',
  SETTINGS: 'expense_manager_settings_v2',
  IS_LOCKED: 'expense_manager_session_locked',
};

export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode + '_expense_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function computeReminderStatus(dueDateStr: string, currentStatus: PaymentReminderStatus): PaymentReminderStatus {
  if (currentStatus === 'collected') return 'collected';

  const todayStr = new Date().toISOString().split('T')[0];
  const due = new Date(dueDateStr + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'due_today';
  return 'pending';
}

export const StorageService = {
  // --- Transactions ---
  getTransactions(): Transaction[] {
    if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(txs: Transaction[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  },

  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const txs = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...txs];
    this.saveTransactions(updated);
    this.updateWalletBalance(tx.walletId, tx.type === 'income' ? tx.amount : -tx.amount);
    return newTx;
  },

  deleteTransaction(id: string): void {
    const txs = this.getTransactions();
    const target = txs.find(t => t.id === id);
    if (target) {
      this.updateWalletBalance(target.walletId, target.type === 'income' ? -target.amount : target.amount);
    }
    const filtered = txs.filter(t => t.id !== id);
    this.saveTransactions(filtered);
  },

  // --- Payment Reminders ---
  getReminders(): PaymentReminder[] {
    if (typeof window === 'undefined') return INITIAL_REMINDERS;
    const raw = localStorage.getItem(KEYS.REMINDERS);
    let list: PaymentReminder[] = [];
    if (!raw) {
      list = INITIAL_REMINDERS;
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = INITIAL_REMINDERS;
      }
    }

    return list.map(rem => ({
      ...rem,
      status: computeReminderStatus(rem.dueDate, rem.status),
    }));
  },

  saveReminders(reminders: PaymentReminder[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  },

  addReminder(rem: Omit<PaymentReminder, 'id' | 'status'>): PaymentReminder {
    const reminders = this.getReminders();
    const status = computeReminderStatus(rem.dueDate, 'pending');
    const newRem: PaymentReminder = {
      ...rem,
      id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      status,
    };
    const updated = [newRem, ...reminders];
    this.saveReminders(updated);
    return newRem;
  },

  updateReminder(id: string, updates: Partial<PaymentReminder>): void {
    const reminders = this.getReminders();
    const updated = reminders.map(r => (r.id === id ? { ...r, ...updates } : r));
    this.saveReminders(updated);
  },

  collectPayment(reminderId: string, walletId: string): void {
    const reminders = this.getReminders();
    const rem = reminders.find(r => r.id === reminderId);
    if (!rem) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const tx = this.addTransaction({
      amount: rem.amount,
      type: 'income',
      title: `Client Payment: ${rem.clientName} - ${rem.projectTitle}`,
      clientOrPayer: rem.clientName,
      categoryId: 'inc-freelance',
      walletId: walletId,
      date: todayStr,
      time: nowTime,
      token: rem.token || 'USD',
      notes: `Settled Invoice #${rem.invoiceNumber || 'N/A'}. ${rem.notes || ''}`,
      reminderId: rem.id,
    });

    this.updateReminder(reminderId, {
      status: 'collected',
      collectedAt: todayStr,
      collectedWalletId: walletId,
      collectedTransactionId: tx.id,
    });
  },

  deleteReminder(id: string): void {
    const reminders = this.getReminders();
    this.saveReminders(reminders.filter(r => r.id !== id));
  },

  // --- Categories & Income Sources ---
  getCategories(): Category[] {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    const raw = localStorage.getItem(KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(cats: Category[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));
  },

  addCategory(cat: Omit<Category, 'id'>): Category {
    const cats = this.getCategories();
    const newCat: Category = {
      ...cat,
      id: (cat.type === 'income' ? 'inc-' : 'cat-') + Date.now(),
    };
    this.saveCategories([...cats, newCat]);
    return newCat;
  },

  // --- Wallets ---
  getWallets(): Wallet[] {
    if (typeof window === 'undefined') return DEFAULT_WALLETS;
    const raw = localStorage.getItem(KEYS.WALLETS);
    if (!raw) {
      localStorage.setItem(KEYS.WALLETS, JSON.stringify(DEFAULT_WALLETS));
      return DEFAULT_WALLETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_WALLETS;
    }
  },

  saveWallets(wallets: Wallet[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));
  },

  updateWalletBalance(walletId: string, delta: number): void {
    const wallets = this.getWallets();
    const updated = wallets.map(w => (w.id === walletId ? { ...w, balance: Number((w.balance + delta).toFixed(2)) } : w));
    this.saveWallets(updated);
  },

  // --- Savings Goals ---
  getSavingsGoals(): SavingsGoal[] {
    if (typeof window === 'undefined') return INITIAL_SAVINGS_GOALS;
    const raw = localStorage.getItem(KEYS.SAVINGS);
    if (!raw) {
      localStorage.setItem(KEYS.SAVINGS, JSON.stringify(INITIAL_SAVINGS_GOALS));
      return INITIAL_SAVINGS_GOALS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  },

  saveSavingsGoals(goals: SavingsGoal[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SAVINGS, JSON.stringify(goals));
  },

  addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): SavingsGoal {
    const goals = this.getSavingsGoals();
    const newGoal: SavingsGoal = {
      ...goal,
      id: 'save-' + Date.now(),
    };
    this.saveSavingsGoals([...goals, newGoal]);
    return newGoal;
  },

  updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): void {
    const goals = this.getSavingsGoals();
    const updated = goals.map(g => (g.id === id ? { ...g, ...updates } : g));
    this.saveSavingsGoals(updated);
  },

  deleteSavingsGoal(id: string): void {
    const goals = this.getSavingsGoals();
    this.saveSavingsGoals(goals.filter(g => g.id !== id));
  },

  depositToGoal(goalId: string, amount: number, walletId: string): void {
    const goals = this.getSavingsGoals();
    const target = goals.find(g => g.id === goalId);
    if (!target) return;

    this.updateSavingsGoal(goalId, {
      currentAmount: target.currentAmount + amount,
    });

    // Optionally deduct from wallet if specified
    if (walletId) {
      this.updateWalletBalance(walletId, -amount);
    }
  },

  // --- Settings & Passcode ---
  getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  isSessionLocked(): boolean {
    if (typeof window === 'undefined') return false;
    const settings = this.getSettings();
    if (!settings.isLockEnabled || !settings.passcodeHash) return false;
    return sessionStorage.getItem(KEYS.IS_LOCKED) !== 'false';
  },

  setSessionLocked(locked: boolean): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(KEYS.IS_LOCKED, locked ? 'true' : 'false');
  },

  exportBackup(): string {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      transactions: this.getTransactions(),
      reminders: this.getReminders(),
      categories: this.getCategories(),
      wallets: this.getWallets(),
      savingsGoals: this.getSavingsGoals(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  exportTransactionsCSV(): string {
    const txs = this.getTransactions();
    const cats = this.getCategories();
    const wallets = this.getWallets();

    const headers = ['ID', 'Date', 'Time', 'Type', 'Title', 'Client/Payer', 'Category/Source', 'Wallet', 'Amount', 'Currency', 'Notes'];
    const rows = txs.map(t => {
      const cat = cats.find(c => c.id === t.categoryId)?.name || 'Unknown';
      const wal = wallets.find(w => w.id === t.walletId)?.name || 'Unknown';
      return [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.time}"`,
        `"${t.type}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.clientOrPayer || '').replace(/"/g, '""')}"`,
        `"${cat}"`,
        `"${wal}"`,
        t.amount.toFixed(2),
        `"${t.token || 'USD'}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDERS));
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(DEFAULT_WALLETS));
    localStorage.setItem(KEYS.SAVINGS, JSON.stringify(INITIAL_SAVINGS_GOALS));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    sessionStorage.removeItem(KEYS.IS_LOCKED);
  },
};
