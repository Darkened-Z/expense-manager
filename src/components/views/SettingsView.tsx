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
} from 'lucide-react';
import { AppSettings } from '@/types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onOpenSetPasscode: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
  onExportCSV: () => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenSetPasscode,
  onExportBackup,
  onImportBackup,
  onExportCSV,
  onResetAllData,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [userEmail, setUserEmail] = useState(settings.userEmail);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
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
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
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
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
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
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Freelance Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
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
                className="w-full bg-[#171922] text-white text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Currency Code</label>
              <input
                type="text"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full bg-[#171922] text-white text-xs font-mono uppercase px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500"
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
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Reminders & Alerts</h3>
            <p className="text-xs text-zinc-400">Configure reminder triggers for client invoices</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">Browser Push Notifications</div>
              <div className="text-[11px] text-zinc-500">Alert me when a payment is due today or overdue</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableBrowserNotifications}
              onChange={(e) => {
                if (e.target.checked && typeof Notification !== 'undefined') {
                  Notification.requestPermission();
                }
                onUpdateSettings({ enableBrowserNotifications: e.target.checked });
              }}
              className="w-4 h-4 accent-orange-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="text-xs font-semibold text-zinc-200">Audio Celebration Chimes</div>
              <div className="text-[11px] text-zinc-500">Play pleasant sound upon successfully collecting a client payment</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAudioChime}
              onChange={(e) => onUpdateSettings({ enableAudioChime: e.target.checked })}
              className="w-4 h-4 accent-orange-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Data Backup & Disaster Recovery */}
      <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
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
            <Download className="w-5 h-5 text-orange-400" />
            <span>Export JSON Backup</span>
          </button>

          <label className="p-4 rounded-xl bg-[#161821] hover:bg-[#1f222e] border border-white/5 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 text-cyan-400" />
            <span>Restore from Backup</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={onExportCSV}
            className="p-4 rounded-xl bg-[#161821] hover:bg-[#1f222e] border border-white/5 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Download className="w-5 h-5 text-emerald-400" />
            <span>Export CSV Ledger</span>
          </button>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-400">Reset to Defaults</div>
            <div className="text-[11px] text-zinc-500">Restore factory sample transactions and reminders</div>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to restore default sample transactions and reminders?')) {
                onResetAllData();
              }
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
};
