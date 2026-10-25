import { Category, Wallet, Transaction, PaymentReminder, AppSettings, SavingsGoal } from '@/types';

// Uniform, minimal category definitions (Monochrome zinc palette - zero random rainbow colors)
export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat-software', name: 'Software & Tools', icon: 'Box', color: '#71717a', type: 'expense', budgetLimit: 0 },
  { id: 'cat-hardware', name: 'Tech & Hardware', icon: 'Laptop', color: '#71717a', type: 'expense', budgetLimit: 0 },
  { id: 'cat-food', name: 'Groceries & Dining', icon: 'Coffee', color: '#71717a', type: 'expense', budgetLimit: 0 },
  { id: 'cat-travel', name: 'Transport & Travel', icon: 'Car', color: '#71717a', type: 'expense', budgetLimit: 0 },
  { id: 'cat-utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#71717a', type: 'expense', budgetLimit: 0 },
  { id: 'cat-marketing', name: 'Marketing & Domains', icon: 'Globe', color: '#71717a', type: 'expense', budgetLimit: 0 },
  { id: 'cat-taxes', name: 'Taxes & Accounting', icon: 'FileText', color: '#71717a', type: 'expense', budgetLimit: 0 },
  { id: 'cat-misc', name: 'Miscellaneous', icon: 'ShoppingBag', color: '#71717a', type: 'expense', budgetLimit: 0 },

  // Income Sources
  { id: 'inc-freelance', name: 'Client Project Work', icon: 'Briefcase', color: '#a1a1aa', type: 'income' },
  { id: 'inc-retainer', name: 'Monthly Client Retainer', icon: 'Repeat', color: '#a1a1aa', type: 'income' },
  { id: 'inc-consulting', name: 'Consulting & Advisory', icon: 'Sparkles', color: '#a1a1aa', type: 'income' },
  { id: 'inc-salary', name: 'Salary & Direct Deposit', icon: 'DollarSign', color: '#a1a1aa', type: 'income' },
  { id: 'inc-investments', name: 'Investments & Dividends', icon: 'TrendingUp', color: '#a1a1aa', type: 'income' },
  { id: 'inc-sidehustle', name: 'Digital Products & Sales', icon: 'Box', color: '#a1a1aa', type: 'income' },
];

export const DEFAULT_WALLETS: Wallet[] = [
  { id: 'wal-bank', name: 'Primary Bank Account', type: 'bank', currency: 'INR', symbol: '₹', balance: 0.00, accountNumber: '4321' },
  { id: 'wal-cash', name: 'Cash / Physical Wallet', type: 'bank', currency: 'INR', symbol: '₹', balance: 0.00 },
  { id: 'wal-upi', name: 'UPI / Digital Payouts', type: 'stripe', currency: 'INR', symbol: '₹', balance: 0.00 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  passcodeHash: null,
  isLockEnabled: false,
  autoLockMinutes: 0,
  userName: 'User',
  userEmail: 'user@work.dev',
  currencySymbol: '₹',
  currencyCode: 'INR',
  enableAudioChime: true,
  enableBrowserNotifications: true,
};

// Clean slate: completely empty initial goals, reminders, and transactions
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_REMINDERS: PaymentReminder[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
