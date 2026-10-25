export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
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

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  title: string;
  categoryId: string;
  walletId: string;
  clientOrPayer?: string;
  date: string; // ISO date YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  token?: string; // e.g. "ETH", "USDT", "USD"
  reminderId?: string; // Linked receivable
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
  token?: string; // e.g. "USDT", "USD", "ETH"
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  reminderDate: string; // Date when reminder badge / alert triggers (YYYY-MM-DD)
  status: PaymentReminderStatus;
  notes?: string;
  collectedAt?: string;
  collectedWalletId?: string;
  collectedTransactionId?: string;
}

export interface AppSettings {
  passcodeHash: string | null;
  isLockEnabled: boolean;
  autoLockMinutes: number; // 0 = never, 1 = 1m, 5 = 5m, etc.
  userName: string;
  userEmail: string;
  currencySymbol: string;
  currencyCode: string;
  enableAudioChime: boolean;
  enableBrowserNotifications: boolean;
}

export interface FilterState {
  searchQuery: string;
  dateRange: 'all' | '30d' | 'this_month' | '90d' | 'year';
  type: 'all' | 'expense' | 'income';
  categoryId: string;
  walletId: string;
}
