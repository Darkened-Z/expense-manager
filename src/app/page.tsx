'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StorySummaryCard } from '@/components/dashboard/StorySummaryCard';
import { TransactionOverviewChart } from '@/components/dashboard/TransactionOverviewChart';
import { DailyPulseCard } from '@/components/dashboard/DailyPulseCard';
import { TransactionsLedger } from '@/components/transactions/TransactionsLedger';
import { FreelanceRemindersView } from '@/components/freelance/FreelanceRemindersView';
import { WalletsView } from '@/components/views/WalletsView';
import { CategoriesView } from '@/components/views/CategoriesView';
import { InsightsView } from '@/components/views/InsightsView';
import { SettingsView } from '@/components/views/SettingsView';
import { PasscodeLockModal } from '@/components/auth/PasscodeLockModal';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddReminderModal } from '@/components/modals/AddReminderModal';
import { StorageService } from '@/lib/storage';
import { Transaction, PaymentReminder, Category, Wallet, AppSettings, TransactionType } from '@/types';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // App UI state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Lock & Security
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showPasscodeSetup, setShowPasscodeSetup] = useState<boolean>(false);

  // Modals
  const [addTxModalType, setAddTxModalType] = useState<TransactionType | null>(null);
  const [showAddReminderModal, setShowAddReminderModal] = useState<boolean>(false);

  // Load state on mount
  useEffect(() => {
    const txs = StorageService.getTransactions();
    const rems = StorageService.getReminders();
    const cats = StorageService.getCategories();
    const wals = StorageService.getWallets();
    const sets = StorageService.getSettings();
    const locked = StorageService.isSessionLocked();

    setTransactions(txs);
    setReminders(rems);
    setCategories(cats);
    setWallets(wals);
    setSettings(sets);
    setIsLocked(locked);
    setMounted(true);

    if (sets.enableBrowserNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      const urgentCount = rems.filter((r) => r.status === 'overdue' || r.status === 'due_today').length;
      if (urgentCount > 0 && Notification.permission === 'granted') {
        new Notification('Freelance Payment Reminder', {
          body: `You have ${urgentCount} invoice${urgentCount === 1 ? '' : 's'} requiring payment follow-up today.`,
          icon: '/favicon.ico',
        });
      }
    }
  }, []);

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
          <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Loading Expense Manager...</span>
        </div>
      </div>
    );
  }

  const handleUnlockSuccess = () => {
    setIsLocked(false);
    StorageService.setSessionLocked(false);
  };

  const handleSetPasscodeSuccess = (newHash?: string) => {
    if (newHash) {
      const updated = {
        ...settings,
        passcodeHash: newHash,
        isLockEnabled: true,
      };
      setSettings(updated);
      StorageService.saveSettings(updated);
    }
    setShowPasscodeSetup(false);
  };

  const handleAddTransaction = (txData: any) => {
    StorageService.addTransaction(txData);
    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
  };

  const handleDeleteTransaction = (id: string) => {
    StorageService.deleteTransaction(id);
    setTransactions(StorageService.getTransactions());
    setWallets(StorageService.getWallets());
  };

  const handleAddReminder = (remData: any) => {
    StorageService.addReminder(remData);
    setReminders(StorageService.getReminders());
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

  const handleAddWallet = (walletData: any) => {
    const newWallet: Wallet = {
      ...walletData,
      id: 'wal-' + Date.now(),
    };
    const updated = [...wallets, newWallet];
    StorageService.saveWallets(updated);
    setWallets(updated);
  };

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    StorageService.saveSettings(updated);
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
      if (data.settings) StorageService.saveSettings(data.settings);

      setTransactions(StorageService.getTransactions());
      setReminders(StorageService.getReminders());
      setCategories(StorageService.getCategories());
      setWallets(StorageService.getWallets());
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
    setSettings(StorageService.getSettings());
  };

  const filteredTxs = transactions.filter((t) => {
    if (selectedWalletId !== 'all' && t.walletId !== selectedWalletId) return false;
    return true;
  });

  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;
  const pendingCount = reminders.filter((r) => r.status === 'pending' || r.status === 'due_today').length;

  return (
    <div className="flex min-h-screen bg-[#090a0d] text-zinc-100 font-sans">
      {/* Passcode Lock Screen Overlay */}
      {isLocked && settings.isLockEnabled && settings.passcodeHash && (
        <PasscodeLockModal
          isOpen={true}
          savedHash={settings.passcodeHash}
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

      {/* Responsive Sidebar (Desktop Fixed + Mobile Drawer + Bottom Bar) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingRemindersCount={pendingCount}
        overdueRemindersCount={overdueCount}
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
          onOpenAddTx={(type) => setAddTxModalType(type)}
          onOpenAddReminder={() => setShowAddReminderModal(true)}
          onCollectReminder={(id) => handleCollectReminder(id)}
          onNavigateToReminders={() => setCurrentTab('reminders')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 flex-1 space-y-6 max-w-7xl w-full mx-auto overflow-x-hidden">
          {/* TAB: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <StorySummaryCard
                transactions={filteredTxs}
                reminders={reminders}
                categories={categories}
                currencySymbol={settings.currencySymbol}
              />

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

              <TransactionsLedger
                transactions={filteredTxs}
                categories={categories}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
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
                onDeleteTransaction={handleDeleteTransaction}
                onExportCSV={handleExportCSV}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          )}

          {/* TAB: REMINDERS / RECEIVABLES */}
          {currentTab === 'reminders' && (
            <div className="animate-in fade-in duration-200">
              <FreelanceRemindersView
                reminders={reminders}
                wallets={wallets}
                currencySymbol={settings.currencySymbol}
                onOpenAddModal={() => setShowAddReminderModal(true)}
                onCollectReminder={handleCollectReminder}
                onDeleteReminder={handleDeleteReminder}
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
              />
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {currentTab === 'categories' && (
            <div className="animate-in fade-in duration-200">
              <CategoriesView
                categories={categories}
                transactions={transactions}
                currencySymbol={settings.currencySymbol}
                onAddCategory={handleAddCategory}
              />
            </div>
          )}

          {/* TAB: INSIGHTS */}
          {currentTab === 'insights' && (
            <div className="animate-in fade-in duration-200">
              <InsightsView
                transactions={transactions}
                reminders={reminders}
                categories={categories}
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
              />
            </div>
          )}
        </main>
      </div>

      {/* Add Transaction Modal */}
      {addTxModalType && (
        <AddTransactionModal
          isOpen={true}
          initialType={addTxModalType}
          categories={categories}
          wallets={wallets}
          currencySymbol={settings.currencySymbol}
          onClose={() => setAddTxModalType(null)}
          onSubmit={handleAddTransaction}
        />
      )}

      {/* Add Receivable / Reminder Modal */}
      {showAddReminderModal && (
        <AddReminderModal
          isOpen={true}
          currencySymbol={settings.currencySymbol}
          onClose={() => setShowAddReminderModal(false)}
          onSubmit={handleAddReminder}
        />
      )}
    </div>
  );
}
