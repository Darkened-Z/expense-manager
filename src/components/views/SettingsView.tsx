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
  HardDrive,
  Database,
  ExternalLink,
  Code,
  Sparkles,
  CheckCircle2,
  Fingerprint,
  ScanFace,
} from 'lucide-react';
import { AppSettings } from '@/types';
import { StorageService } from '@/lib/storage';
import { BiometricService } from '@/lib/biometrics';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  testSupabaseConnection,
  pushToSupabase,
  pullFromSupabase,
} from '@/lib/supabase';

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
  const [bankPayoutDetails, setBankPayoutDetails] = useState(settings.bankPayoutDetails || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase Cloud Sync state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseVaultId, setSupabaseVaultId] = useState('main');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Storage quota state
  const [storageStats, setStorageStats] = useState({
    usedBytes: 0,
    usedKB: '0',
    quotaMB: 5,
    percentUsed: '0.00',
    approximateCapacity: '~30,000 to 50,000 transactions',
  });

  // Biometrics (WebAuthn / Touch ID / Face ID / Windows Hello) state
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      setSupabaseAnonKey(config.anonKey);
      setSupabaseVaultId(config.vaultId);
      setIsConfigured(isSupabaseConfigured());
      setLastSyncTime(StorageService.getLastSyncTime());
      setStorageStats(StorageService.getStorageStats());
      BiometricService.isAvailable().then(setBiometricsAvailable);
    }
  }, []);

  const handleToggleBiometrics = async (enable: boolean) => {
    setBiometricMsg(null);
    if (!enable) {
      onUpdateSettings({ enableBiometrics: false, biometricCredentialId: '' });
      return;
    }

    if (!settings.passcodeHash) {
      setBiometricMsg({
        type: 'error',
        text: 'Please set a 4-digit master passcode first so you have a fallback if biometrics are unavailable.',
      });
      onOpenSetPasscode();
      return;
    }

    setIsRegisteringBiometric(true);
    try {
      const cred = await BiometricService.register();
      if (cred) {
        onUpdateSettings({
          enableBiometrics: true,
          biometricCredentialId: cred.credentialId,
          isLockEnabled: true,
        });
        setBiometricMsg({
          type: 'success',
          text: 'Biometric unlock registered and enabled successfully!',
        });
      }
    } catch (err: any) {
      setBiometricMsg({
        type: 'error',
        text: err.message || 'Failed to register biometrics.',
      });
    } finally {
      setIsRegisteringBiometric(false);
    }
  };

  const handleSaveSupabase = async () => {
    saveSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      vaultId: supabaseVaultId.trim() || 'main',
    });
    setIsConfigured(isSupabaseConfigured());
    await handleTestConnection();
    if (onSyncComplete) onSyncComplete();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      vaultId: supabaseVaultId.trim() || 'main',
    });
    setIsTesting(false);
    setTestResult(res);
  };

  const handlePushSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus('Pushing snapshot to Cloud & Local Server...');
    const snap = StorageService.getFullSnapshot();
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: snap }),
      });
    } catch {}

    const res = await pushToSupabase(snap);
    setIsSyncing(false);
    setSyncStatus(res.message);
    if (res.lastSyncedAt) setLastSyncTime(res.lastSyncedAt);
  };

  const handlePullSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus('Pulling latest snapshot...');
    let payload = null;
    let syncedAt = null;

    try {
      const sRes = await fetch('/api/sync').then((r) => r.json());
      if (sRes?.success && sRes.data) {
        payload = sRes.data;
        syncedAt = sRes.lastSyncedAt;
      }
    } catch {}

    if (!payload && isSupabaseConfigured()) {
      const res = await pullFromSupabase();
      if (res.success && res.data) {
        payload = res.data;
        syncedAt = res.lastSyncedAt;
      }
    }

    setIsSyncing(false);
    if (payload) {
      StorageService.importFullSnapshot(payload);
      if (syncedAt) setLastSyncTime(syncedAt);
      if (onSyncComplete) onSyncComplete();
      setSyncStatus('Successfully synchronized latest snapshot!');
    } else {
      setSyncStatus('No sync data found on cloud or local server yet.');
    }
  };

  const handleCopySql = () => {
    const sql = `-- Run this in Supabase SQL Editor:
create table if not exists expense_sync (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table expense_sync enable row level security;

create policy "Allow anon access" on expense_sync
  for all
  using (true)
  with check (true);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyMobileLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/?supabase_url=${encodeURIComponent(supabaseUrl)}&supabase_key=${encodeURIComponent(supabaseAnonKey)}&vault=${encodeURIComponent(supabaseVaultId)}`;
    navigator.clipboard.writeText(url);
    setCopiedMobileLink(true);
    setTimeout(() => setCopiedMobileLink(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      currencySymbol,
      currencyCode: currencyCode.toUpperCase(),
      bankPayoutDetails: bankPayoutDetails.trim(),
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

        {/* Biometrics (Fingerprint / Face ID / Windows Hello) Section */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Biometric Unlock (Touch ID / Face ID / Windows Hello)</span>
                  {biometricsAvailable ? (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Sensor Ready
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Browser Not Supported
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  1-tap biometric unlock for iOS Face ID, Android Fingerprint, and Windows Hello
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!biometricsAvailable || isRegisteringBiometric}
                checked={!!settings.enableBiometrics}
                onChange={(e) => handleToggleBiometrics(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 disabled:opacity-40"></div>
            </label>
          </div>

          {biometricMsg && (
            <div
              className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-center gap-2 ${
                biometricMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <span>{biometricMsg.text}</span>
            </div>
          )}
        </div>
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

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Bank / Raast Payout Details (Included in 1-Click WhatsApp Reminders)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Meezan Bank • IBAN: PK36MEZN00... • Raast ID: 03001234567 • Title: Muhammad Z"
              value={bankPayoutDetails}
              onChange={(e) => setBankPayoutDetails(e.target.value)}
              className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              These details are automatically attached when you click &quot;WhatsApp&quot; on any pending client invoice.
            </span>
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

      {/* Cross-Device Cloud Sync Section (Supabase) */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Cross-Device Cloud Sync (Supabase)</h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Real-time
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatic, real-time background sync. Any changes on PC or phone sync seamlessly without manual pushes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto-Sync Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>Local Mode (Offline)</span>
              </span>
            )}
            {lastSyncTime && (
              <span className="text-[11px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#161821] text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-[#161821] text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Vault ID (Multi-Profile / Workspace)
            </label>
            <input
              type="text"
              placeholder="main"
              value={supabaseVaultId}
              onChange={(e) => setSupabaseVaultId(e.target.value)}
              className="w-full sm:w-1/2 bg-[#161821] text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Default is &quot;main&quot;. Use the exact same Vault ID on your phone to access the same financial workspace.
            </p>
          </div>

          {/* Test & Save buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveSupabase}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 bg-[#181b23] hover:bg-[#20242f] border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            {isConfigured && (
              <>
                <button
                  type="button"
                  onClick={handlePullSupabase}
                  disabled={isSyncing}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Force pull latest data from Supabase immediately"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Pull Now</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushSupabase}
                  disabled={isSyncing}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Force push current data to Supabase immediately"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Push Now</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMobileLink}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Copy direct sync link for mobile device setup"
                >
                  {copiedMobileLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Smartphone className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{copiedMobileLink ? 'Copied Mobile Setup Link!' : 'Copy Mobile Setup Link'}</span>
                </button>
              </>
            )}
          </div>

          {/* Test connection feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {syncStatus && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Collapsible Supabase SQL Setup Helper */}
          <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="text-xs font-semibold text-white flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>1-Minute Supabase Database Setup Guide {showSqlGuide ? '▲' : '▼'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-[11px] font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            {showSqlGuide && (
              <div className="pt-2 text-xs text-zinc-400 space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create a free account or project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">supabase.com</a>.</li>
                  <li>In your Supabase dashboard, click <strong>SQL Editor</strong> on the left.</li>
                  <li>Click <strong>New Query</strong>, paste the script below, and click <strong>Run</strong>:</li>
                </ol>
                <pre className="p-3 rounded-xl bg-[#0b0c0f] border border-white/5 text-[11px] text-zinc-300 font-mono overflow-x-auto select-all">
{`-- Run once in Supabase SQL Editor:
create table if not exists expense_sync (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table expense_sync enable row level security;

create policy "Allow anon access" on expense_sync
  for all
  using (true)
  with check (true);`}
                </pre>
                <p className="text-[11px] text-zinc-500">
                  4. Go to <strong>Project Settings &rarr; API</strong>, copy your <strong>Project URL</strong> and <strong>anon public key</strong>, and paste them into the fields above.
                </p>
              </div>
            )}
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

        {/* Device Storage Capacity Gauge */}
        <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              <span>Local Device Storage</span>
            </span>
            <span className="font-mono text-zinc-400 text-[11px]">
              {storageStats.usedKB} KB / ~5,000 KB ({storageStats.percentUsed}% used)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-zinc-300 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(1, parseFloat(storageStats.percentUsed))}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>Capacity: {storageStats.approximateCapacity} (~10+ years of daily use)</span>
            <span className="text-zinc-400">Cloud Sync & file backups: Unlimited</span>
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
