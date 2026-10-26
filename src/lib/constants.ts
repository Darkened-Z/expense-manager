import { Category, Wallet, Transaction, PaymentReminder, AppSettings, SavingsGoal } from '@/types';

// Distinct, solid category definitions (Clean basic colors, zero gradients)
export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat-software', name: 'Software & Tools', icon: 'Box', color: '#f97316', type: 'expense', budgetLimit: 0 },
  { id: 'cat-hardware', name: 'Tech & Hardware', icon: 'Laptop', color: '#3b82f6', type: 'expense', budgetLimit: 0 },
  { id: 'cat-food', name: 'Groceries & Dining', icon: 'Coffee', color: '#f59e0b', type: 'expense', budgetLimit: 0 },
  { id: 'cat-travel', name: 'Transport & Travel', icon: 'Car', color: '#06b6d4', type: 'expense', budgetLimit: 0 },
  { id: 'cat-utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#6366f1', type: 'expense', budgetLimit: 0 },
  { id: 'cat-marketing', name: 'Marketing & Domains', icon: 'Globe', color: '#ec4899', type: 'expense', budgetLimit: 0 },
  { id: 'cat-taxes', name: 'Taxes & Accounting', icon: 'FileText', color: '#ef4444', type: 'expense', budgetLimit: 0 },
  { id: 'cat-misc', name: 'Miscellaneous', icon: 'ShoppingBag', color: '#64748b', type: 'expense', budgetLimit: 0 },
  { id: 'cat-transfer', name: 'Internal Transfer', icon: 'ArrowLeftRight', color: '#0ea5e9', type: 'expense', budgetLimit: 0 },

  // Income Sources
  { id: 'inc-freelance', name: 'Client Project Work', icon: 'Briefcase', color: '#10b981', type: 'income' },
  { id: 'inc-retainer', name: 'Monthly Client Retainer', icon: 'Repeat', color: '#14b8a6', type: 'income' },
  { id: 'inc-consulting', name: 'Consulting & Advisory', icon: 'Sparkles', color: '#8b5cf6', type: 'income' },
  { id: 'inc-salary', name: 'Salary & Direct Deposit', icon: 'DollarSign', color: '#22c55e', type: 'income' },
  { id: 'inc-investments', name: 'Investments & Dividends', icon: 'TrendingUp', color: '#0ea5e9', type: 'income' },
  { id: 'inc-sidehustle', name: 'Digital Products & Sales', icon: 'Box', color: '#ea580c', type: 'income' },
];

export const DEFAULT_WALLETS: Wallet[] = [
  { id: 'wal-bank', name: 'Primary Bank Account', type: 'bank', currency: 'PKR', symbol: 'Rs. ', balance: 0.00, accountNumber: '4321' },
  { id: 'wal-cash', name: 'Cash / Physical Wallet', type: 'bank', currency: 'PKR', symbol: 'Rs. ', balance: 0.00 },
  { id: 'wal-digital', name: 'Raast / Digital Payouts', type: 'stripe', currency: 'PKR', symbol: 'Rs. ', balance: 0.00 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  passcodeHash: null,
  isLockEnabled: false,
  autoLockMinutes: 0,
  userName: 'User',
  userEmail: 'user@work.dev',
  currencySymbol: 'Rs. ',
  currencyCode: 'PKR',
  enableAudioChime: true,
  enableBrowserNotifications: true,
  bankPayoutDetails: '',
  whatsappReminderTemplate: '',
  enableBiometrics: false,
  biometricCredentialId: '',
};

// Clean slate: completely empty initial goals, reminders, and transactions
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_REMINDERS: PaymentReminder[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
