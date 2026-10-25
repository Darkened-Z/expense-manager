export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  budgetLimit?: number;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'bank' | 'paypal' | 'stripe' | 'wise' | 'crypto' | 'cash';
  currency: string;
  symbol: string;
  balance: number;
  accountNumber?: string;
}

export type PaymentFrequency = 'once' | 'monthly';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  title: string;
  categoryId: string; // References Category (if expense) or Income Source (if income)
  walletId: string;
  clientOrPayer?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  token?: string;
  reminderId?: string;
  frequency?: PaymentFrequency;
  createdAt: string;
}

export type PaymentReminderStatus = 'pending' | 'due_today' | 'overdue' | 'collected';

export interface PaymentReminder {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  projectTitle: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  token?: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  reminderDate: string; // YYYY-MM-DD
  status: PaymentReminderStatus;
  frequency?: PaymentFrequency;
  notes?: string;
  collectedAt?: string;
  collectedWalletId?: string;
  collectedTransactionId?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category: string;
  color: string;
  walletId?: string;
}

export interface AppSettings {
  passcodeHash: string | null;
  isLockEnabled: boolean;
  autoLockMinutes: number;
  userName: string;
  userEmail: string;
  currencySymbol: string;
  currencyCode: string;
  enableAudioChime: boolean;
  enableBrowserNotifications: boolean;
}
