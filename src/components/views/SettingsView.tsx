'use client';

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  KeyRound,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Volume2,
  User,
  DollarSign,
  Check,
  AlertTriangle,
  Cloud,
  CloudUpload,
  CloudDownload,
  Copy,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { AppSettings } from '@/types';
import { StorageService } from '@/lib/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onOpenSetPasscode: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
  onExportCSV: () => void;
  onResetAllData: () => void;
  onSyncComplete?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenSetPasscode,
  onExportBackup,
  onImportBackup,
  onExportCSV,
  onResetAllData,
  onSyncComplete,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [userEmail, setUserEmail] = useState(settings.userEmail);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cloud Sync state
  const [syncKey, setSyncKey] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSyncKey(StorageService.getSyncPasskey());
      setLastSyncTime(StorageService.getLastSyncTime());
    }
  }, []);

  const handleGenerateKey = () => {
    const randomKey = 'SYNC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setSyncKey(randomKey);
    StorageService.setSyncPasskey(randomKey);
    setSyncStatus('Generated new passkey. Tap "Push to Cloud" to initialize vault.');
  };

  const handlePushCloud = async () => {
    if (!syncKey.trim()) {
      setSyncStatus('Please enter or generate a Sync Passkey first.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Backing up data to cloud vault...');
    const res = await StorageService.pushToCloud(syncKey);
    setIsSyncing(false);
    setSyncStatus(res.message);
    if (res.success && res.lastSyncedAt) {
      setLastSyncTime(res.lastSyncedAt);
    }
  };

  const handlePullCloud = async () => {
    if (!syncKey.trim()) {
      setSyncStatus('Please enter your Sync Passkey to pull.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Fetching data from cloud vault...');
    const res = await StorageService.pullFromCloud(syncKey);
    setIsSyncing(false);
    setSyncStatus(res.message);
    if (res.success) {
      if (res.lastSyncedAt) setLastSyncTime(res.lastSyncedAt);
      if (onSyncComplete) onSyncComplete();
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      currencySymbol,
      currencyCode: currencyCode.toUpperCase(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Security & Passcode Section */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Security & App Passcode</h3>
              <p className="text-xs text-zinc-400">
                Protect your private finances and freelance clients from unauthorized viewing
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              settings.isLockEnabled && settings.passcodeHash
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {settings.isLockEnabled && settings.passcodeHash ? 'Passcode Protected' : 'Unlocked / No PIN'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="text-xs font-semibold text-white">4-Digit Master PIN</div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {settings.passcodeHash
                ? 'Your app is configured with a secure hashed passcode.'
                : 'No passcode is set. Anyone with access to this browser can see your numbers.'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSetPasscode}
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{settings.passcodeHash ? 'Change Passcode' : 'Set New Passcode'}</span>
            </button>

            {settings.passcodeHash && (
              <button
                onClick={() =>
                  onUpdateSettings({
                    isLockEnabled: !settings.isLockEnabled,
                  })
                }
                className={`text-xs px-3 py-2 rounded-xl border transition-colors ${
                  settings.isLockEnabled
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/20 hover:bg-rose-500/25'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/25'
                }`}
              >
                {settings.isLockEnabled ? 'Disable Lock' : 'Enable Lock'}
              </button>
            )}
          </div>
        </div>

        {/* Auto lock timeout */}
        {settings.isLockEnabled && (
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">Auto-lock Inactivity Timer</div>
              <div className="text-[11px] text-zinc-500">Lock session automatically after idle minutes</div>
            </div>
            <select
              value={settings.autoLockMinutes}
              onChange={(e) => onUpdateSettings({ autoLockMinutes: parseInt(e.target.value) })}
              className="bg-[#181b23] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300"
            >
              <option value={0}>Immediately on Tab Close</option>
              <option value={5}>After 5 Minutes</option>
              <option value={15}>After 15 Minutes</option>
              <option value={60}>After 1 Hour</option>
            </select>
          </div>
        )}
      </div>

      {/* User & Currency Profile */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Freelancer Profile & Display</h3>
            <p className="text-xs text-zinc-400">Personalize your name and primary currency representation</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Freelance Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency Code</label>
              <input
                type="text"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs font-mono uppercase px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Profile updated!
              </span>
            )}
            <button
              type="submit"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Notifications & Audio Alerts */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Reminders & Alerts</h3>
            <p className="text-xs text-zinc-400">Configure reminder triggers for client invoices</p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">System Desktop & Mobile Notifications</div>
              <div className="text-[11px] text-zinc-500">Alert on device when an invoice is due today or overdue</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (typeof Notification !== 'undefined') {
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                      new Notification('Notification Test', {
                        body: 'Desktop and mobile push notifications are working properly.',
                        icon: '/icons/icon-192.png',
                      });
                    } else {
                      alert('Notification permission is ' + perm + '. Please enable it in browser site settings.');
                    }
                  }
                }}
                className="text-[11px] bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
              >
                Send Test Alert
              </button>
              <input
                type="checkbox"
                checked={settings.enableBrowserNotifications}
                onChange={(e) => {
                  if (e.target.checked && typeof Notification !== 'undefined') {
                    Notification.requestPermission();
                  }
                  onUpdateSettings({ enableBrowserNotifications: e.target.checked });
                }}
                className="w-4 h-4 accent-zinc-200 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="text-xs font-semibold text-zinc-200">Audio Chimes</div>
              <div className="text-[11px] text-zinc-500">Play pleasant sound upon successfully collecting a client payment</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAudioChime}
              onChange={(e) => onUpdateSettings({ enableAudioChime: e.target.checked })}
              className="w-4 h-4 accent-zinc-200 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* PWA & Mobile Installation Section */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">App Installation (PC & Phone)</h3>
            <p className="text-xs text-zinc-400">Install as a standalone native app on Windows, macOS, Android, and iOS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-zinc-300">
          <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5 space-y-1">
            <div className="font-semibold text-white">Desktop (PC / Mac)</div>
            <p className="text-[11px] text-zinc-400">
              Click the Install icon in your browser URL bar (Chrome/Edge) to pin to your Windows taskbar or Mac Dock with standalone window mode.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5 space-y-1">
            <div className="font-semibold text-white">Mobile (Phone / Tablet)</div>
            <p className="text-[11px] text-zinc-400">
              On iOS Safari tap <strong>Share → Add to Home Screen</strong>. On Android Chrome tap <strong>Install App</strong> for full offline capability.
            </p>
          </div>
        </div>
      </div>

      {/* Cross-Device Cloud Sync Section */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Cross-Device Cloud Sync</h3>
              <p className="text-xs text-zinc-400">Sync all transactions, wallets, and invoices seamlessly between PC & Phone</p>
            </div>
          </div>
          {lastSyncTime && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Your Private Sync Passkey
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. SYNC-849201"
                value={syncKey}
                onChange={(e) => {
                  setSyncKey(e.target.value.toUpperCase());
                  StorageService.setSyncPasskey(e.target.value);
                }}
                className="flex-1 bg-[#161821] text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 uppercase tracking-wider"
              />
              <button
                type="button"
                onClick={handleGenerateKey}
                className="px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                Generate
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Enter this identical passkey on your PC and your phone to share the same vault.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handlePushCloud}
              disabled={isSyncing}
              className="p-3.5 rounded-xl bg-[#161821] hover:bg-[#1f222e] border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4 text-zinc-300" />
              <span>Push to Cloud (Backup)</span>
            </button>

            <button
              type="button"
              onClick={handlePullCloud}
              disabled={isSyncing}
              className="p-3.5 rounded-xl bg-zinc-100 hover:bg-white border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CloudDownload className="w-4 h-4 text-zinc-950" />
              <span>Pull from Cloud (Restore)</span>
            </button>
          </div>

          {syncStatus && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>{syncStatus}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#161821] border border-white/5 text-[11px] text-zinc-400 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">How to connect your phone:</span>
              <ol className="list-decimal list-inside space-y-0.5 mt-1 text-zinc-400">
                <li>Generate or enter your Sync Passkey above on PC and click <strong>Push to Cloud</strong>.</li>
                <li>Open the app on your Phone browser, go to Settings &rarr; Cloud Sync.</li>
                <li>Enter the exact same Passkey and tap <strong>Pull from Cloud</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Data Backup & Disaster Recovery */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Backup, Restore & Export</h3>
            <p className="text-xs text-zinc-400">You fully own your data. Export backups or CSV spreadsheets anytime.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={onExportBackup}
            className="p-4 rounded-xl bg-[#161821] hover:bg-[#1f222e] border border-white/5 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Download className="w-5 h-5 text-zinc-300" />
            <span>Export JSON Backup</span>
          </button>

          <label className="p-4 rounded-xl bg-[#161821] hover:bg-[#1f222e] border border-white/5 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 text-zinc-300" />
            <span>Restore from Backup</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={onExportCSV}
            className="p-4 rounded-xl bg-[#161821] hover:bg-[#1f222e] border border-white/5 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Download className="w-5 h-5 text-zinc-300" />
            <span>Export CSV Ledger</span>
          </button>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-400">Wipe All Data (Clean Slate)</div>
            <div className="text-[11px] text-zinc-500">Permanently delete all transactions, invoices, and savings goals</div>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to permanently wipe all stored data? This cannot be undone.')) {
                onResetAllData();
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
          >
            Wipe All Data
          </button>
        </div>
      </div>
    </div>
  );
};
