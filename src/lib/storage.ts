import { Transaction, PaymentReminder, Category, Wallet, AppSettings, PaymentReminderStatus, SavingsGoal, SimpleSaving } from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS, DEFAULT_SETTINGS, INITIAL_REMINDERS, INITIAL_TRANSACTIONS, INITIAL_SAVINGS_GOALS } from './constants';
import { formatDateDDMMYYYY } from './formatters';

const KEYS = {
  TRANSACTIONS: 'expense_manager_txs_v5',
  REMINDERS: 'expense_manager_reminders_v5',
  CATEGORIES: 'expense_manager_cats_v5',
  WALLETS: 'expense_manager_wallets_v5',
  SAVINGS: 'expense_manager_savings_v5',
  SIMPLE_SAVINGS: 'expense_manager_simple_savings_v5',
  SETTINGS: 'expense_manager_settings_v5',
  IS_LOCKED: 'expense_manager_session_locked',
  UNLOCKED_HASH: 'expense_manager_unlocked_hash',
  SYNC_PASSKEY: 'expense_manager_sync_passkey',
  LAST_SYNC: 'expense_manager_last_sync_time',
  LAST_UPDATE: 'expense_manager_last_update_time',
};

// Automatic one-time wipe of old legacy sample data (v1..v4)
if (typeof window !== 'undefined') {
  try {
    const purgeDone = localStorage.getItem('expense_manager_v5_purged');
    if (!purgeDone) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.includes('_txs_v') ||
            k.includes('_reminders_v') ||
            k.includes('_savings_v') ||
            k.includes('_wallets_v') ||
            k.includes('_cats_v')) &&
          !k.includes('_v5')
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('expense_manager_v5_purged', 'true');
    }
  } catch {
    // Ignore storage errors
  }
}

export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode + '_expense_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function computeReminderStatus(dueDateStr: string, currentStatus: PaymentReminderStatus): PaymentReminderStatus {
  if (currentStatus === 'collected') return 'collected';
  if (currentStatus === 'ended') return 'ended';

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
  markLocalUpdate(): string {
    if (typeof window === 'undefined') return new Date().toISOString();
    const now = new Date().toISOString();
    localStorage.setItem(KEYS.LAST_UPDATE, now);
    return now;
  },

  getLastUpdateTime(): string {
    if (typeof window === 'undefined') return '1970-01-01T00:00:00.000Z';
    return localStorage.getItem(KEYS.LAST_UPDATE) || '1970-01-01T00:00:00.000Z';
  },

  setLastUpdateTime(timeStr: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.LAST_UPDATE, timeStr);
  },

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
    this.markLocalUpdate();
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
    if (tx.type === 'transfer' && tx.toWalletId) {
      this.updateWalletBalance(tx.walletId, -tx.amount);
      this.updateWalletBalance(tx.toWalletId, tx.amount);
    } else {
      this.updateWalletBalance(tx.walletId, (tx.type === 'income' || tx.type === 'deposit') ? tx.amount : -tx.amount);
    }
    return newTx;
  },

  addTransfer(data: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    time?: string;
    notes?: string;
  }): Transaction {
    const fromWallet = this.getWallets().find(w => w.id === data.fromWalletId);
    const toWallet = this.getWallets().find(w => w.id === data.toWalletId);
    const fromName = fromWallet?.name || 'Account';
    const toName = toWallet?.name || 'Account';

    return this.addTransaction({
      amount: data.amount,
      type: 'transfer',
      title: `Transfer: ${fromName} → ${toName}`,
      categoryId: 'cat-transfer',
      walletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      date: data.date,
      time: data.time || new Date().toTimeString().slice(0, 5),
      notes: data.notes || `Transferred from ${fromName} to ${toName}`,
      token: fromWallet?.currency || 'PKR',
    });
  },

  deleteTransaction(id: string): void {
    const txs = this.getTransactions();
    const target = txs.find(t => t.id === id);
    if (target) {
      if (target.type === 'transfer' && target.toWalletId) {
        this.updateWalletBalance(target.walletId, target.amount);
        this.updateWalletBalance(target.toWalletId, -target.amount);
      } else {
        this.updateWalletBalance(target.walletId, (target.type === 'income' || target.type === 'deposit') ? -target.amount : target.amount);
      }
    }
    const filtered = txs.filter(t => t.id !== id);
    this.saveTransactions(filtered);
  },

  updateTransaction(id: string, updates: Partial<Transaction>): void {
    const txs = this.getTransactions();
    const existing = txs.find(t => t.id === id);
    if (!existing) return;

    // Revert existing balance impact
    if (existing.type === 'transfer' && existing.toWalletId) {
      this.updateWalletBalance(existing.walletId, existing.amount);
      this.updateWalletBalance(existing.toWalletId, -existing.amount);
    } else {
      this.updateWalletBalance(existing.walletId, (existing.type === 'income' || existing.type === 'deposit') ? -existing.amount : existing.amount);
    }

    // Prepare updated object
    const updatedTx: Transaction = { ...existing, ...updates };

    // Apply new balance impact
    if (updatedTx.type === 'transfer' && updatedTx.toWalletId) {
      this.updateWalletBalance(updatedTx.walletId, -updatedTx.amount);
      this.updateWalletBalance(updatedTx.toWalletId, updatedTx.amount);
    } else {
      this.updateWalletBalance(updatedTx.walletId, (updatedTx.type === 'income' || updatedTx.type === 'deposit') ? updatedTx.amount : -updatedTx.amount);
    }

    const updated = txs.map(t => (t.id === id ? updatedTx : t));
    this.saveTransactions(updated);
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
    this.markLocalUpdate();
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
    const existing = reminders.find(r => r.id === id);
    if (!existing) return;

    const newDueDate = updates.dueDate || existing.dueDate;
    const newStatus = existing.status === 'collected'
      ? 'collected'
      : computeReminderStatus(newDueDate, updates.status || existing.status);

    const updatedReminder: PaymentReminder = {
      ...existing,
      ...updates,
      status: newStatus,
    };

    // If already collected and has a linked transaction, sync linked transaction details
    if (existing.status === 'collected' && existing.collectedTransactionId) {
      const txUpdates: Partial<Transaction> = {};
      if (updates.amount !== undefined && updates.amount !== existing.amount) {
        txUpdates.amount = updates.amount;
      }
      if (updates.projectTitle !== undefined || updates.clientName !== undefined) {
        const isPayable = (updates.type || existing.type) === 'payable';
        const client = updates.clientName || existing.clientName;
        const project = updates.projectTitle || existing.projectTitle;
        txUpdates.title = isPayable
          ? `Payment Paid: ${client} (${project})`
          : `Client Payment: ${client} - ${project}`;
        txUpdates.clientOrPayer = client;
      }
      if (updates.frequency !== undefined) {
        txUpdates.frequency = updates.frequency;
      }
      if (Object.keys(txUpdates).length > 0) {
        this.updateTransaction(existing.collectedTransactionId, txUpdates);
      }
    }

    const updated = reminders.map(r => (r.id === id ? updatedReminder : r));
    this.saveReminders(updated);
  },

  collectPayment(reminderId: string, walletId: string): void {
    const reminders = this.getReminders();
    const rem = reminders.find(r => r.id === reminderId);
    if (!rem) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    // Cash transactions always record on the actual day collected/paid
    // so income, expenses, and cash surplus match your live wallet balance
    const isPayable = rem.type === 'payable';
    const resolvedCatId = isPayable
      ? (rem.categoryId || 'cat-utilities')
      : (rem.categoryId || 'inc-freelance');

    const tx = this.addTransaction({
      amount: rem.amount,
      type: isPayable ? 'expense' : 'income',
      title: isPayable
        ? `Payment Paid: ${rem.clientName} (${rem.projectTitle})`
        : `Client Payment: ${rem.clientName} - ${rem.projectTitle}`,
      clientOrPayer: rem.clientName,
      categoryId: resolvedCatId,
      walletId: walletId,
      date: todayStr,
      time: nowTime,
      token: rem.token || 'PKR',
      notes: isPayable
        ? `Settled expense for ${rem.clientName}. ${rem.notes || ''}`
        : `Settled Invoice #${rem.invoiceNumber || 'N/A'}. ${rem.notes || ''}`,
      reminderId: rem.id,
      frequency: rem.frequency,
      originalAmount: rem.originalAmount,
      originalCurrency: rem.originalCurrency,
      exchangeRate: rem.exchangeRate,
    });

    this.updateReminder(reminderId, {
      status: 'collected',
      collectedAt: todayStr,
      collectedWalletId: walletId,
      collectedTransactionId: tx.id,
    });

    // Auto-Renew Monthly Retainers & Subscriptions
    // Automatically schedules the next month's payment cycle so recurring income/expenses never get missed
    if (rem.frequency === 'monthly' && rem.autoRenew !== false) {
      const [year, month, day] = rem.dueDate.split('-').map(Number);
      let nextYear = year;
      let nextMonth = month + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
      const targetDay = Math.min(day, daysInNextMonth);
      const mm = nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
      const dd = targetDay < 10 ? `0${targetDay}` : `${targetDay}`;
      const nextDueDate = `${nextYear}-${mm}-${dd}`;

      const nextDueObj = new Date(nextDueDate + 'T00:00:00');
      nextDueObj.setDate(nextDueObj.getDate() - 2);
      const nextReminderDate = nextDueObj.toISOString().split('T')[0];

      this.addReminder({
        type: rem.type,
        clientName: rem.clientName,
        clientEmail: rem.clientEmail,
        clientPhone: rem.clientPhone,
        projectTitle: rem.projectTitle,
        invoiceNumber: rem.invoiceNumber,
        amount: rem.amount,
        currency: rem.currency || 'PKR',
        token: rem.token || rem.currency || 'PKR',
        categoryId: rem.categoryId,
        invoiceDate: todayStr,
        dueDate: nextDueDate,
        reminderDate: nextReminderDate,
        frequency: 'monthly',
        autoRenew: true,
        originalAmount: rem.originalAmount,
        originalCurrency: rem.originalCurrency,
        exchangeRate: rem.exchangeRate,
        notes: rem.notes,
      });
    }
  },

  deleteReminder(id: string): void {
    const reminders = this.getReminders();
    this.saveReminders(reminders.filter(r => r.id !== id));
  },

  // Migrate existing collected reminders whose due date is in the future
  syncFutureCollectedDates(): void {
    if (typeof window === 'undefined') return;
    try {
      const reminders = this.getReminders();
      const txs = this.getTransactions();
      const todayStr = new Date().toISOString().split('T')[0];
      let modifiedReminders = false;
      let modifiedTxs = false;

      // Clean up any previously auto-spawned '-R' reminders that are not collected
      const initialCount = reminders.length;
      let updatedReminders = reminders.filter(
        r => !(r.status !== 'collected' && r.invoiceNumber && r.invoiceNumber.endsWith('-R'))
      );
      if (updatedReminders.length !== initialCount) {
        modifiedReminders = true;
      }

      // If any collected reminder had its collectedAt pushed into the future, bring it to today
      updatedReminders = updatedReminders.map(r => {
        if (r.status === 'collected' && r.collectedAt && r.collectedAt > todayStr) {
          modifiedReminders = true;
          return { ...r, collectedAt: todayStr };
        }
        return r;
      });

      // Migrate linked transactions that were pushed to future dates back to today
      // so early collected income / paid expenses appear in current month calculations
      const updatedTxs = txs.map(t => {
        if (t.reminderId && t.date > todayStr) {
          modifiedTxs = true;
          return { ...t, date: todayStr };
        }
        return t;
      });

      if (modifiedReminders) {
        this.saveReminders(updatedReminders);
      }
      if (modifiedTxs) {
        this.saveTransactions(updatedTxs);
      }
    } catch {
      // ignore
    }
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
      const parsed: Category[] = JSON.parse(raw);
      let modified = false;
      const defaultMap = new Map(DEFAULT_CATEGORIES.map(d => [d.id, d.color]));
      let updated = parsed.map(c => {
        // If it was forced to monochrome gray in the previous step, restore its basic clean color
        if ((c.color === '#71717a' || c.color === '#a1a1aa') && defaultMap.has(c.id)) {
          modified = true;
          return { ...c, color: defaultMap.get(c.id)! };
        }
        return c;
      });
      if (!updated.some(c => c.id === 'cat-transfer')) {
        const transferDef = DEFAULT_CATEGORIES.find(d => d.id === 'cat-transfer');
        if (transferDef) {
          updated.push(transferDef);
          modified = true;
        }
      }
      if (!updated.some(c => c.id === 'cat-deposit')) {
        const depositDef = DEFAULT_CATEGORIES.find(d => d.id === 'cat-deposit');
        if (depositDef) {
          updated.push(depositDef);
          modified = true;
        }
      }

      // Clean up any legacy auto-synced payable categories so daily expense categories remain pure
      if (updated.some(c => c.id.startsWith('cat-payable-'))) {
        updated = updated.filter(c => !c.id.startsWith('cat-payable-'));
        modified = true;
      }

      if (modified) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(updated));
      }
      return updated;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(cats: Category[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));
    this.markLocalUpdate();
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

  deleteCategory(id: string): void {
    const cats = this.getCategories();
    this.saveCategories(cats.filter((c) => c.id !== id));
  },

  updateCategory(id: string, updates: Partial<Category>): void {
    const cats = this.getCategories();
    const updated = cats.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveCategories(updated);
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
      const parsed: Wallet[] = JSON.parse(raw);
      let modified = false;
      const updated = parsed.map((w) => {
        if (w.currency === 'INR' || w.symbol === '₹') {
          modified = true;
          return {
            ...w,
            currency: 'PKR',
            symbol: 'Rs. ',
            name: w.name.replace('UPI', 'Raast / Digital'),
          };
        }
        return w;
      });
      if (modified) {
        localStorage.setItem(KEYS.WALLETS, JSON.stringify(updated));
      }
      return updated;
    } catch {
      return DEFAULT_WALLETS;
    }
  },

  saveWallets(wallets: Wallet[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));
    this.markLocalUpdate();
  },

  updateWalletBalance(walletId: string, delta: number): void {
    const wallets = this.getWallets();
    const updated = wallets.map(w => (w.id === walletId ? { ...w, balance: Math.round(w.balance + delta) } : w));
    this.saveWallets(updated);
  },

  updateWallet(walletId: string, updates: Partial<Wallet>): void {
    const wallets = this.getWallets();
    const updated = wallets.map(w => (w.id === walletId ? { ...w, ...updates } : w));
    this.saveWallets(updated);
  },

  deleteWallet(walletId: string): { success: boolean; error?: string } {
    const wallets = this.getWallets();
    const target = wallets.find(w => w.id === walletId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }
    if (wallets.length <= 1) {
      return { success: false, error: 'You must maintain at least one active bank or wallet.' };
    }
    if (Math.round(target.balance) !== 0) {
      return {
        success: false,
        error: `Cannot delete "${target.name}". Account currently has a balance of Rs. ${Math.round(target.balance)}. Please transfer or withdraw all funds to empty the account (Rs. 0) before removing it.`,
      };
    }
    const updated = wallets.filter(w => w.id !== walletId);
    this.saveWallets(updated);
    return { success: true };
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
    this.markLocalUpdate();
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

  // --- Simple Savings (Unrelated to Goals) ---
  getSimpleSavings(): SimpleSaving[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.SIMPLE_SAVINGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSimpleSavings(savings: SimpleSaving[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SIMPLE_SAVINGS, JSON.stringify(savings));
    this.markLocalUpdate();
  },

  addSimpleSaving(saving: Omit<SimpleSaving, 'id' | 'createdAt'>): SimpleSaving {
    const savings = this.getSimpleSavings();
    const newSaving: SimpleSaving = {
      ...saving,
      id: 'simple-save-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.saveSimpleSavings([newSaving, ...savings]);

    if (saving.walletId) {
      this.updateWalletBalance(saving.walletId, -saving.amount);
    }

    return newSaving;
  },

  deleteSimpleSaving(id: string): void {
    const savings = this.getSimpleSavings();
    this.saveSimpleSavings(savings.filter(s => s.id !== id));
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
      const parsed: AppSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      if (parsed.currencyCode === 'INR' || parsed.currencySymbol === '₹') {
        parsed.currencyCode = 'PKR';
        parsed.currencySymbol = 'Rs. ';
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    this.markLocalUpdate();
  },

  isSessionLocked(): boolean {
    if (typeof window === 'undefined') return false;
    const settings = this.getSettings();
    if (!settings.isLockEnabled || !settings.passcodeHash) return false;
    const unlockedHash = sessionStorage.getItem(KEYS.UNLOCKED_HASH);
    const isExplicitlyUnlocked = sessionStorage.getItem(KEYS.IS_LOCKED) === 'false';
    if (isExplicitlyUnlocked && unlockedHash === settings.passcodeHash) {
      return false;
    }
    return true;
  },

  setSessionLocked(locked: boolean, hash?: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(KEYS.IS_LOCKED, locked ? 'true' : 'false');
    if (locked) {
      sessionStorage.removeItem(KEYS.UNLOCKED_HASH);
    } else {
      const activeHash = hash || this.getSettings().passcodeHash || '';
      sessionStorage.setItem(KEYS.UNLOCKED_HASH, activeHash);
    }
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
      simpleSavings: this.getSimpleSavings(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  exportTransactionsCSV(): string {
    const txs = this.getTransactions();
    const cats = this.getCategories();
    const wallets = this.getWallets();

    const headers = ['ID', 'Date (DD/MM/YYYY)', 'Time', 'Type', 'Title', 'Client/Payer', 'Category/Source', 'Wallet', 'Amount', 'Currency', 'Notes'];
    const rows = txs.map(t => {
      const cat = cats.find(c => c.id === t.categoryId)?.name || 'Unknown';
      const wal = wallets.find(w => w.id === t.walletId)?.name || 'Unknown';
      return [
        `"${t.id}"`,
        `"${formatDateDDMMYYYY(t.date)}"`,
        `"${t.time}"`,
        `"${t.type}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.clientOrPayer || '').replace(/"/g, '""')}"`,
        `"${cat}"`,
        `"${wal}"`,
        Math.round(t.amount),
        `"${t.token || 'PKR'}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // --- Cross-Device Cloud Sync ---
  getSyncPasskey(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(KEYS.SYNC_PASSKEY) || '';
  },

  setSyncPasskey(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SYNC_PASSKEY, key.trim().toUpperCase());
  },

  getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEYS.LAST_SYNC);
  },

  getFullSnapshot() {
    return {
      transactions: this.getTransactions(),
      reminders: this.getReminders(),
      categories: this.getCategories(),
      wallets: this.getWallets(),
      savingsGoals: this.getSavingsGoals(),
      simpleSavings: this.getSimpleSavings(),
      settings: this.getSettings(),
      updatedAt: this.getLastUpdateTime(),
    };
  },

  importFullSnapshot(cloud: any): void {
    if (!cloud || typeof cloud !== 'object') return;
    if (Array.isArray(cloud.transactions)) localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(cloud.transactions));
    if (Array.isArray(cloud.reminders)) localStorage.setItem(KEYS.REMINDERS, JSON.stringify(cloud.reminders));
    if (Array.isArray(cloud.categories)) localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cloud.categories));
    if (Array.isArray(cloud.wallets)) localStorage.setItem(KEYS.WALLETS, JSON.stringify(cloud.wallets));
    if (Array.isArray(cloud.savingsGoals)) localStorage.setItem(KEYS.SAVINGS, JSON.stringify(cloud.savingsGoals));
    if (Array.isArray(cloud.simpleSavings)) localStorage.setItem(KEYS.SIMPLE_SAVINGS, JSON.stringify(cloud.simpleSavings));
    if (cloud.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cloud.settings));
    if (cloud.updatedAt) {
      this.setLastUpdateTime(cloud.updatedAt);
    }
  },

  async pushToCloud(passkey?: string): Promise<{ success: boolean; message: string; lastSyncedAt?: string }> {
    const key = passkey || this.getSyncPasskey();
    if (!key || key.trim().length < 4) {
      return { success: false, message: 'Please enter a valid Sync Passkey (min 4 characters).' };
    }
    try {
      const payload = {
        passkey: key.trim().toUpperCase(),
        data: this.getFullSnapshot(),
      };
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem(KEYS.LAST_SYNC, data.lastSyncedAt || new Date().toISOString());
        this.setSyncPasskey(key);
        return { success: true, message: 'Backed up to cloud vault.', lastSyncedAt: data.lastSyncedAt };
      }
      return { success: false, message: data.error || 'Failed to upload to cloud.' };
    } catch {
      return { success: false, message: 'Network error connecting to sync server.' };
    }
  },

  async pullFromCloud(passkey?: string): Promise<{ success: boolean; message: string; lastSyncedAt?: string }> {
    const key = passkey || this.getSyncPasskey();
    if (!key || key.trim().length < 4) {
      return { success: false, message: 'Please enter a valid Sync Passkey (min 4 characters).' };
    }
    try {
      const res = await fetch(`/api/sync?passkey=${encodeURIComponent(key.trim().toUpperCase())}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        this.importFullSnapshot(data.data);
        localStorage.setItem(KEYS.LAST_SYNC, data.lastSyncedAt || new Date().toISOString());
        this.setSyncPasskey(key);
        return { success: true, message: 'Successfully synced from cloud!', lastSyncedAt: data.lastSyncedAt };
      }
      if (data.notFound) {
        return { success: false, message: 'No backup found on cloud for this passkey yet.' };
      }
      return { success: false, message: data.error || 'Failed to pull from cloud.' };
    } catch {
      return { success: false, message: 'Network error connecting to sync server.' };
    }
  },

  resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDERS));
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(DEFAULT_WALLETS));
    localStorage.setItem(KEYS.SAVINGS, JSON.stringify(INITIAL_SAVINGS_GOALS));
    localStorage.removeItem(KEYS.SIMPLE_SAVINGS);
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    sessionStorage.removeItem(KEYS.IS_LOCKED);
    sessionStorage.removeItem(KEYS.UNLOCKED_HASH);
    this.markLocalUpdate();
  },

  clearAllData(): void {
    if (typeof window === 'undefined') return;
    this.resetAllData();
    localStorage.removeItem(KEYS.SYNC_PASSKEY);
    localStorage.removeItem(KEYS.LAST_SYNC);
  },

  getStorageStats(): { usedBytes: number; usedKB: string; quotaMB: number; percentUsed: string; approximateCapacity: string } {
    if (typeof window === 'undefined') {
      return { usedBytes: 0, usedKB: '0', quotaMB: 5, percentUsed: '0.00', approximateCapacity: '~30,000 to 50,000 records' };
    }
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const v = localStorage.getItem(k) || '';
          totalBytes += k.length + v.length;
        }
      }
    } catch {
      // ignore
    }
    const quotaBytes = 5 * 1024 * 1024; // 5 MB standard browser quota
    const usedKB = (totalBytes / 1024).toFixed(1);
    const percentUsed = Math.max(0.01, (totalBytes / quotaBytes) * 100).toFixed(2);
    return {
      usedBytes: totalBytes,
      usedKB,
      quotaMB: 5,
      percentUsed,
      approximateCapacity: '~30,000 to 50,000 transactions',
    };
  },
};
