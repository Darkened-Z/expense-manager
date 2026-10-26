'use client';

import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install on iOS: Tap the Share button in Safari, then select "Add to Home Screen". On Chrome/Edge: Click the install icon in the URL address bar.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="bg-[#12141a] border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 shadow-md">
          <img src="/logo.png" alt="App Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <span>Install App on PC / Phone</span>
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Offline Ready
            </span>
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5 hidden xs:block">
            Launch from your desktop taskbar or home screen with full offline access
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Install</span>
        </button>

        <button
          onClick={() => setShowBanner(false)}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
