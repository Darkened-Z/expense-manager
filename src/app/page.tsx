'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { FinancialGraphs } from '@/components/dashboard/FinancialGraphs';
import { TransactionOverviewChart } from '@/components/dashboard/TransactionOverviewChart';
import { DailyPulseCard } from '@/components/dashboard/DailyPulseCard';
import { BudgetAlertsBanner } from '@/components/dashboard/BudgetAlertsBanner';
import { TransactionsLedger } from '@/components/transactions/TransactionsLedger';
import { FreelanceRemindersView } from '@/components/freelance/FreelanceRemindersView';
import { SavingsView } from '@/components/views/SavingsView';
import { WalletsView } from '@/components/views/WalletsView';
import { CategoriesView } from '@/components/views/CategoriesView';
import { InsightsView } from '@/components/views/InsightsView';
import { SettingsView } from '@/components/views/SettingsView';
import { PasscodeLockModal } from '@/components/auth/PasscodeLockModal';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddReminderModal } from '@/components/modals/AddReminderModal';
import { TransferModal } from '@/components/modals/TransferModal';
import { MobileSpeedDialFAB } from '@/components/layout/MobileSpeedDialFAB';
import { StorageService } from '@/lib/storage';
import { NotificationService } from '@/lib/notifications';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';
import { Transaction, PaymentReminder, Category, Wallet, AppSettings, TransactionType, SavingsGoal, ReminderType, SimpleSaving } from '@/types';
import {
  isSupabaseConfigured,
  pushToSupabase,
  pullFromSupabase,
  subscribeToSupabaseUpdates,
  saveSupabaseConfig,
} from '@/lib/supabase';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [simpleSavings, setSimpleSavings] = useState<SimpleSaving[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // App UI state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('as_of_today');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Cloud Sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'unconfigured' | 'error'>('unconfigured');
  const isInitialMount = useRef(true);
  const isImportingRef = useRef(false);

  // Lock & Security
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showPasscodeSetup, setShowPasscodeSetup] = useState<boolean>(false);

  // Modals
  const [addTxModalType, setAddTxModalType] = useState<TransactionType | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showAddReminderModal, setShowAddReminderModal] = useState<boolean>(false);
  const [addReminderType, setAddReminderType] = useState<ReminderType>('receivable');
  const [editingReminder, setEditingReminder] = useState<PaymentReminder | null>(null);

  // Helper function to push local data to both server /api/sync and Supabase
  const pushAllSync = async (snapshot: any) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: snapshot }),
      });
    } catch {}
    if (isSupabaseConfigured()) {
      try {
        await pushToSupabase(snapshot);
      } catch {}
    }
  };

  const reloadAllFromStorage = () => {
    setTransactions(StorageService.getTransactions());
    setReminders(StorageService.getReminders());
    setCategories(StorageService.getCategories());
    setWallets(StorageService.getWallets());
    setSavingsGoals(StorageService.getSavingsGoals());
    setSimpleSavings(StorageService.getSimpleSavings());
    const freshSettings = StorageService.getSettings();
    setSettings(freshSettings);
    if (freshSettings.isLockEnabled && freshSettings.passcodeHash) {
      if (StorageService.isSessionLocked()) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } else {
      setIsLocked(false);
    }
  };

  // Load state on mount & initialize Supabase Auto-Sync
  useEffect(() => {
    // Check if mobile setup URL parameters exist (?supabase_url=...&supabase_key=...&vault=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlParam = urlParams.get('supabase_url');
      const keyParam = urlParams.get('supabase_key');
      const vaultParam = urlParams.get('vault');
      if (urlParam && keyParam) {
        saveSupabaseConfig({
          url: decodeURIComponent(urlParam),
          anonKey: decodeURIComponent(keyParam),
          vaultId: vaultParam ? decodeURIComponent(vaultParam) : 'main',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    StorageService.syncFutureCollectedDates();
    reloadAllFromStorage();
    const locked = StorageService.isSessionLocked();
    setIsLocked(locked);
    setMounted(true);

    const currentSets = StorageService.getSettings();
    if (currentSets.enableBrowserNotifications) {
      NotificationService.checkDueInvoicesAndNotify(StorageService.getReminders());
    }

    // Auto-fetch server config so mobile & all client devices connect instantly with 0 manual steps
    if (!isSupabaseConfigured()) {
      fetch('/api/sync/config')
        .then((res) => res.json())
        .then((cfg) => {
          if (cfg.url && cfg.anonKey) {
            saveSupabaseConfig(cfg);
          }
        })
        .catch(() => {});
    }

    // Two-way synchronization engine
    const syncWithCloudAndServer = async () => {
      const localSnapshot = StorageService.getFullSnapshot();
      const hasLocalData =
        (localSnapshot.transactions?.length || 0) > 0 ||
        (localSnapshot.reminders?.length || 0) > 0 ||
        (localSnapshot.simpleSavings?.length || 0) > 0 ||
        (localSnapshot.wallets || []).some((w: any) => (w.balance || 0) !== 0) ||
        Boolean(localSnapshot.settings?.passcodeHash);

      setCloudSyncStatus('syncing');

      // 1. Check local server API first (instant on LAN / mobile)
      let remotePayload: any = null;
      let remoteLastSyncedAt: string | null = null;

      try {
        const sRes = await fetch('/api/sync').then((r) => r.json());
        if (sRes?.success && sRes.data) {
          remotePayload = sRes.data;
          remoteLastSyncedAt = sRes.lastSyncedAt;
        }
      } catch {}

      // 2. Fall back to Supabase if server API had no data
      if (!remotePayload && isSupabaseConfigured()) {
        try {
          const supRes = await pullFromSupabase();
          if (supRes?.success && supRes.data) {
            remotePayload = supRes.data;
            remoteLastSyncedAt = supRes.lastSyncedAt || null;
          }
        } catch {}
      }

      const remoteHasData = remotePayload && (
        (remotePayload.transactions?.length || 0) > 0 ||
        (remotePayload.reminders?.length || 0) > 0 ||
        (remotePayload.simpleSavings?.length || 0) > 0 ||
        (remotePayload.wallets || []).some((w: any) => (w.balance || 0) !== 0) ||
        Boolean(remotePayload.settings?.passcodeHash)
      );

      if (!hasLocalData && remoteHasData) {
        // Fresh device (e.g. Phone!): import remote snapshot immediately!
        isImportingRef.current = true;
        StorageService.importFullSnapshot(remotePayload);
        reloadAllFromStorage();
        setCloudSyncStatus('synced');
      } else if (hasLocalData && !remoteHasData) {
        // Source device (e.g. PC!): seed remote cloud & server with full snapshot!
        await pushAllSync(localSnapshot);
        setCloudSyncStatus('synced');
      } else if (hasLocalData && remoteHasData) {
        // Both have data: adopt the newer snapshot or sync
        const remoteTime = new Date(remoteLastSyncedAt || remotePayload.updatedAt || 0).getTime();
        const localTime = new Date(localSnapshot.updatedAt || 0).getTime();
        if (remoteTime > localTime) {
          isImportingRef.current = true;
          StorageService.importFullSnapshot(remotePayload);
          reloadAllFromStorage();
        } else if (localTime > remoteTime) {
          await pushAllSync(localSnapshot);
        }
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('synced');
      }
    };

    // Run sync on mount
    syncWithCloudAndServer();

    // Supabase Realtime subscription
    let unsubscribeSync: (() => void) | null = null;
    if (isSupabaseConfigured()) {
      unsubscribeSync = subscribeToSupabaseUpdates((cloudPayload) => {
        isImportingRef.current = true;
        StorageService.importFullSnapshot(cloudPayload);
        reloadAllFromStorage();
        setCloudSyncStatus('synced');
      });
    }

    // Refresh on tab focus or mobile app visibility change
    const handleRefresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      syncWithCloudAndServer();
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    // Periodic pull every 15 seconds so mobile devices on LAN stay 100% updated automatically
    const intervalTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      syncWithCloudAndServer();
    }, 15000);

    return () => {
      if (unsubscribeSync) unsubscribeSync();
      clearInterval(intervalTimer);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, []);

  // Automated background push on any modification (debounced 1000ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isImportingRef.current) {
      isImportingRef.current = false;
      return;
    }

    setCloudSyncStatus('syncing');
    const timer = setTimeout(async () => {
      const snap = StorageService.getFullSnapshot();
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: snap }),
        });
      } catch {}

      if (isSupabaseConfigured()) {
        const res = await pushToSupabase(snap);
        setCloudSyncStatus(res.success ? 'synced' : 'error');
      } else {
        setCloudSyncStatus('synced');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [transactions, reminders, categories, wallets, savingsGoals, simpleSavings, settings]);

  const playChime = () => {
    if (!settings?.enableAudioChime || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // AudioContext fallback
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Quick search..."]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!mounted || !settings) {
    return (
      <div className="min-h-screen bg-[#090a0d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Loading Expense Manager...</span>
        </div>
      </div>
    );
  }

  const handleUnlockSuccess = () => {
    setIsLocked(false);
    StorageService.setSessionLocked(false, settings?.passcodeHash || undefined);
  };

  const handleSetPasscodeSuccess = async (newHash?: string) => {
    if (newHash) {
      const updated = {
        ...settings,
        passcodeHash: newHash,
        isLockEnabled: true,
      };
      StorageService.saveSettings(updated);
      setSettings(updated);
      StorageService.setSessionLocked(false, newHash);
      setIsLocked(false);
      const snap = StorageService.getFullSnapshot();
      await pushAllSync(snap);
    }
    setShowPasscodeSetup(false);
  };

  const handleAddTransaction = (txData: any) => {
    StorageService.addTransaction(txData);

    if (txData.createReminder) {
      // Calculate next due date (1 month ahead on the same day)
      const parts = (txData.date || new Date().toISOString().split('T')[0]).split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);

      const nextDate = new Date(y, m + 1, d);
      const nextYear = nextDate.getFullYear();
      const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nextDay = String(nextDate.getDate()).padStart(2, '0');
      const nextDueStr = `${nextYear}-${nextMonth}-${nextDay}`;

      StorageService.addReminder({
        type: txData.type === 'expense' ? 'payable' : 'receivable',
        clientName: txData.clientOrPayer || txData.title,
        projectTitle: txData.title,
        amount: txData.amount,
        currency: 'PKR',
        token: txData.token || 'PKR',
        categoryId: txData.categoryId,
        frequency: 'monthly',
        invoiceDate: txData.date,
        dueDate: nextDueStr,
        reminderDate: nextDueStr,
        notes: txData.notes,
      });
      setReminders(StorageService.getReminders());
    }

    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
  };

  const handleDeleteTransaction = (id: string) => {
    StorageService.deleteTransaction(id);
    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
  };

  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    StorageService.updateTransaction(id, updates);
    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
  };

  const handleTransfer = (data: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    time?: string;
    notes?: string;
  }) => {
    StorageService.addTransfer(data);
    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
    playChime();
  };

  const handleAddReminder = (remData: any) => {
    StorageService.addReminder(remData);
    setReminders(StorageService.getReminders());
  };

  const handleUpdateReminder = (id: string, updates: Partial<PaymentReminder>) => {
    StorageService.updateReminder(id, updates);
    setReminders(StorageService.getReminders());
    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
  };

  const handleCollectReminder = (reminderId: string, walletId?: string) => {
    const targetWallet = walletId || wallets[0]?.id || 'wal-bank';
    StorageService.collectPayment(reminderId, targetWallet);
    setReminders(StorageService.getReminders());
    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
    playChime();
  };

  const handleDeleteReminder = (id: string) => {
    StorageService.deleteReminder(id);
    setReminders(StorageService.getReminders());
  };

  const handleAddCategory = (catData: any) => {
    StorageService.addCategory(catData);
    setCategories(StorageService.getCategories());
  };

  const handleUpdateCategory = (id: string, updates: Partial<Category>) => {
    StorageService.updateCategory(id, updates);
    setCategories(StorageService.getCategories());
  };

  const handleDeleteCategory = (id: string) => {
    StorageService.deleteCategory(id);
    setCategories(StorageService.getCategories());
  };

  const handleAddWallet = (walletData: any) => {
    const newWallet: Wallet = {
      ...walletData,
      id: 'wal-' + Date.now(),
    };
    const updated = [...wallets, newWallet];
    StorageService.saveWallets(updated);
    setWallets(updated);
  };

  const handleAddSavingsGoal = (goalData: any) => {
    StorageService.addSavingsGoal(goalData);
    setSavingsGoals(StorageService.getSavingsGoals());
  };

  const handleUpdateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    StorageService.updateSavingsGoal(id, updates);
    setSavingsGoals(StorageService.getSavingsGoals());
  };

  const handleDeleteSavingsGoal = (id: string) => {
    StorageService.deleteSavingsGoal(id);
    setSavingsGoals(StorageService.getSavingsGoals());
  };

  const handleDepositToGoal = (goalId: string, amount: number, walletId: string) => {
    StorageService.depositToGoal(goalId, amount, walletId);
    setSavingsGoals(StorageService.getSavingsGoals());
    setWallets(StorageService.getWallets());
  };

  const handleAddSimpleSaving = (savingData: any) => {
    StorageService.addSimpleSaving(savingData);
    setSimpleSavings(StorageService.getSimpleSavings());
    setWallets(StorageService.getWallets());
  };

  const handleDeleteSimpleSaving = (id: string) => {
    StorageService.deleteSimpleSaving(id);
    setSimpleSavings(StorageService.getSimpleSavings());
  };

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    StorageService.saveSettings(updated);
    setSettings(updated);
    if (updates.isLockEnabled === false) {
      setIsLocked(false);
      StorageService.setSessionLocked(false);
    } else if (updates.isLockEnabled === true) {
      StorageService.setSessionLocked(false, updated.passcodeHash || undefined);
    }
    const snap = StorageService.getFullSnapshot();
    await pushAllSync(snap);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expense_Manager_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.transactions) StorageService.saveTransactions(data.transactions);
      if (data.reminders) StorageService.saveReminders(data.reminders);
      if (data.categories) StorageService.saveCategories(data.categories);
      if (data.wallets) StorageService.saveWallets(data.wallets);
      if (data.savingsGoals) StorageService.saveSavingsGoals(data.savingsGoals);
      if (data.simpleSavings) StorageService.saveSimpleSavings(data.simpleSavings);
      if (data.settings) StorageService.saveSettings(data.settings);

      setTransactions(StorageService.getTransactions());
      setReminders(StorageService.getReminders());
      setCategories(StorageService.getCategories());
      setWallets(StorageService.getWallets());
      setSavingsGoals(StorageService.getSavingsGoals());
      setSimpleSavings(StorageService.getSimpleSavings());
      setSettings(StorageService.getSettings());
      alert('Backup restored successfully!');
    } catch {
      alert('Invalid backup JSON file.');
    }
  };

  const handleExportCSV = () => {
    const csvStr = StorageService.exportTransactionsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expense_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAllData = () => {
    StorageService.resetAllData();
    setTransactions(StorageService.getTransactions());
    setReminders(StorageService.getReminders());
    setCategories(StorageService.getCategories());
    setWallets(StorageService.getWallets());
    setSavingsGoals(StorageService.getSavingsGoals());
    setSimpleSavings(StorageService.getSimpleSavings());
    setSettings(StorageService.getSettings());
  };

  const filteredTxs = transactions.filter((t) => {
    if (selectedWalletId !== 'all' && t.walletId !== selectedWalletId) return false;

    if (dateRange === 'all') return true;

    const todayStr = new Date().toISOString().split('T')[0];

    // As of Today: all transactions that have occurred up to and including today
    if (dateRange === 'as_of_today') {
      return t.date <= todayStr;
    }

    // Today Only: transactions that occurred strictly today
    if (dateRange === 'today') {
      return t.date === todayStr;
    }

    const txDate = new Date(t.date + 'T00:00:00');
    if (isNaN(txDate.getTime())) return true;

    const now = new Date();

    if (dateRange === 'this_month') {
      return (
        txDate.getFullYear() === now.getFullYear() &&
        txDate.getMonth() === now.getMonth() &&
        t.date <= todayStr
      );
    }

    if (dateRange === '30d') {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      past30.setHours(0, 0, 0, 0);
      return txDate >= past30 && t.date <= todayStr;
    }

    if (dateRange === '90d') {
      const past90 = new Date(now);
      past90.setDate(past90.getDate() - 90);
      past90.setHours(0, 0, 0, 0);
      return txDate >= past90 && t.date <= todayStr;
    }

    return true;
  });

  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;
  const pendingCount = reminders.filter((r) => r.status === 'due_today').length;

  const overdueReceivablesCount = reminders.filter((r) => r.type !== 'payable' && r.status === 'overdue').length;
  const pendingReceivablesCount = reminders.filter((r) => r.type !== 'payable' && r.status === 'due_today').length;

  const overduePayablesCount = reminders.filter((r) => r.type === 'payable' && r.status === 'overdue').length;
  const pendingPayablesCount = reminders.filter((r) => r.type === 'payable' && r.status === 'due_today').length;

  return (
    <div className="flex min-h-screen bg-[#090a0d] text-zinc-100 font-sans">
      {/* Passcode Lock Screen Overlay */}
      {isLocked && settings.isLockEnabled && settings.passcodeHash && (
        <PasscodeLockModal
          isOpen={true}
          savedHash={settings.passcodeHash}
          enableBiometrics={settings.enableBiometrics}
          biometricCredentialId={settings.biometricCredentialId}
          onSuccess={handleUnlockSuccess}
        />
      )}

      {/* Set Passcode Modal */}
      {showPasscodeSetup && (
        <PasscodeLockModal
          isOpen={true}
          isSetupMode={true}
          savedHash={null}
          onSuccess={handleSetPasscodeSuccess}
          onCancel={() => setShowPasscodeSetup(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingReceivablesCount={pendingReceivablesCount}
        overdueReceivablesCount={overdueReceivablesCount}
        pendingPayablesCount={pendingPayablesCount}
        overduePayablesCount={overduePayablesCount}
        pendingRemindersCount={pendingReceivablesCount}
        overdueRemindersCount={overdueReceivablesCount}
        isLockEnabled={settings.isLockEnabled}
        onLockApp={() => {
          setIsLocked(true);
          StorageService.setSessionLocked(true);
        }}
        userName={settings.userName}
        userEmail={settings.userEmail}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          setSelectedWalletId={setSelectedWalletId}
          dateRange={dateRange}
          setDateRange={setDateRange}
          reminders={reminders}
          currencySymbol={settings.currencySymbol}
          settings={settings}
          cloudSyncStatus={cloudSyncStatus}
          onOpenSyncSettings={() => setCurrentTab('settings')}
          onOpenAddTx={(type) => setAddTxModalType(type)}
          onOpenTransfer={() => setShowTransferModal(true)}
          onOpenAddReminder={() => {
            setAddReminderType(currentTab === 'payables' ? 'payable' : 'receivable');
            setShowAddReminderModal(true);
          }}
          onCollectReminder={(id) => handleCollectReminder(id)}
          onNavigateToReminders={() => setCurrentTab('receivables')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 flex-1 space-y-6 max-w-7xl w-full mx-auto overflow-x-hidden">
          {/* PWA Install Banner (PC & Mobile) */}
          <PwaInstallPrompt />

          {/* TAB: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Monthly Budget Overspend Alerts Banner */}
              <BudgetAlertsBanner
                categories={categories}
                transactions={transactions}
                currencySymbol={settings.currencySymbol}
                onNavigateToCategories={() => setCurrentTab('categories')}
              />

              {/* Executive Metrics Bar (No fluff, no stories) */}
              <MetricsBar
                transactions={filteredTxs}
                reminders={reminders}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
              />

              {/* Financial Cashflow Graphs */}
              <FinancialGraphs
                transactions={filteredTxs}
                categories={categories}
                currencySymbol={settings.currencySymbol}
              />

              {/* Mid Section: Overview Bar Chart & Daily Pulse */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TransactionOverviewChart
                    transactions={filteredTxs}
                    currencySymbol={settings.currencySymbol}
                  />
                </div>
                <div className="lg:col-span-1">
                  <DailyPulseCard
                    transactions={filteredTxs}
                    currencySymbol={settings.currencySymbol}
                    onSeeDetails={() => setCurrentTab('transactions')}
                  />
                </div>
              </div>

              {/* Recent Transactions Ledger */}
              <TransactionsLedger
                transactions={filteredTxs}
                categories={categories}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
                onEditTransaction={(tx) => {
                  setEditingTransaction(tx);
                  setAddTxModalType(tx.type);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onExportCSV={handleExportCSV}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          )}

          {/* TAB: TRANSACTIONS */}
          {currentTab === 'transactions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <TransactionsLedger
                transactions={filteredTxs}
                categories={categories}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
                onEditTransaction={(tx) => {
                  setEditingTransaction(tx);
                  setAddTxModalType(tx.type);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onExportCSV={handleExportCSV}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          )}

          {/* TAB: CASH RECEIVABLE */}
          {(currentTab === 'receivables' || currentTab === 'reminders') && (
            <div className="animate-in fade-in duration-200">
              <FreelanceRemindersView
                mode="receivables"
                reminders={reminders}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
                settings={settings}
                onOpenAddModal={() => {
                  setEditingReminder(null);
                  setAddReminderType('receivable');
                  setShowAddReminderModal(true);
                }}
                onEditReminder={(rem) => {
                  setEditingReminder(rem);
                  setAddReminderType(rem.type || 'receivable');
                  setShowAddReminderModal(true);
                }}
                onCollectReminder={handleCollectReminder}
                onDeleteReminder={handleDeleteReminder}
              />
            </div>
          )}

          {/* TAB: CASH PAYABLE */}
          {currentTab === 'payables' && (
            <div className="animate-in fade-in duration-200">
              <FreelanceRemindersView
                mode="payables"
                reminders={reminders}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
                settings={settings}
                onOpenAddModal={() => {
                  setEditingReminder(null);
                  setAddReminderType('payable');
                  setShowAddReminderModal(true);
                }}
                onEditReminder={(rem) => {
                  setEditingReminder(rem);
                  setAddReminderType('payable');
                  setShowAddReminderModal(true);
                }}
                onCollectReminder={handleCollectReminder}
                onDeleteReminder={handleDeleteReminder}
              />
            </div>
          )}

          {/* TAB: SAVINGS & GOALS */}
          {currentTab === 'savings' && (
            <div className="animate-in fade-in duration-200">
              <SavingsView
                savingsGoals={savingsGoals}
                simpleSavings={simpleSavings}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
                onAddSavingsGoal={handleAddSavingsGoal}
                onUpdateSavingsGoal={handleUpdateSavingsGoal}
                onDeleteSavingsGoal={handleDeleteSavingsGoal}
                onDepositToGoal={handleDepositToGoal}
                onAddSimpleSaving={handleAddSimpleSaving}
                onDeleteSimpleSaving={handleDeleteSimpleSaving}
              />
            </div>
          )}

          {/* TAB: WALLETS */}
          {currentTab === 'wallets' && (
            <div className="animate-in fade-in duration-200">
              <WalletsView
                wallets={wallets}
                transactions={transactions}
                currencySymbol={settings.currencySymbol}
                onUpdateWalletBalance={StorageService.updateWalletBalance}
                onAddWallet={handleAddWallet}
                onOpenTransfer={() => setShowTransferModal(true)}
              />
            </div>
          )}

          {/* TAB: CATEGORIES & SOURCES */}
          {currentTab === 'categories' && (
            <div className="animate-in fade-in duration-200">
              <CategoriesView
                categories={categories}
                transactions={transactions}
                currencySymbol={settings.currencySymbol}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onUpdateCategory={handleUpdateCategory}
              />
            </div>
          )}

          {/* TAB: INSIGHTS / ANALYTICS */}
          {currentTab === 'insights' && (
            <div className="animate-in fade-in duration-200">
              <InsightsView
                transactions={transactions}
                reminders={reminders}
                categories={categories}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
              />
            </div>
          )}

          {/* TAB: SETTINGS */}
          {currentTab === 'settings' && (
            <div className="animate-in fade-in duration-200">
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onOpenSetPasscode={() => setShowPasscodeSetup(true)}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onExportCSV={handleExportCSV}
                onResetAllData={handleResetAllData}
                onSyncComplete={reloadAllFromStorage}
              />
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      {addTxModalType && (
        <AddTransactionModal
          isOpen={true}
          initialType={addTxModalType}
          transactionToEdit={editingTransaction}
          categories={categories}
          wallets={wallets}
          currencySymbol={settings.currencySymbol}
          onClose={() => {
            setAddTxModalType(null);
            setEditingTransaction(null);
          }}
          onSubmit={handleAddTransaction}
          onUpdate={handleUpdateTransaction}
        />
      )}

      {/* Add / Edit Receivable / Reminder Modal */}
      {showAddReminderModal && (
        <AddReminderModal
          isOpen={true}
          initialType={addReminderType}
          reminderToEdit={editingReminder}
          currencySymbol={settings.currencySymbol}
          categories={categories}
          onClose={() => {
            setShowAddReminderModal(false);
            setEditingReminder(null);
          }}
          onSubmit={handleAddReminder}
          onUpdate={handleUpdateReminder}
        />
      )}

      {/* Wallet-to-Wallet Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          isOpen={true}
          wallets={wallets}
          currencySymbol={settings.currencySymbol}
          onClose={() => setShowTransferModal(false)}
          onSubmit={handleTransfer}
        />
      )}

      {/* Mobile Floating Action Button (FAB) Speed Dial */}
      <MobileSpeedDialFAB
        onAddExpense={() => {
          setEditingTransaction(null);
          setAddTxModalType('expense');
        }}
        onAddIncome={() => {
          setEditingTransaction(null);
          setAddTxModalType('income');
        }}
        onTransfer={() => setShowTransferModal(true)}
        onAddReminder={() => {
          setEditingReminder(null);
          setAddReminderType(currentTab === 'payables' ? 'payable' : 'receivable');
          setShowAddReminderModal(true);
        }}
      />
    </div>
  );
}
