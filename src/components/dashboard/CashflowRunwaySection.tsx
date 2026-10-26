'use client';

import React from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Flame,
  Wallet as WalletIcon,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Wallet, Transaction, PaymentReminder } from '@/types';
import { calculateRunwayForecast } from '@/lib/forecast';
import { formatCash, formatCurrency } from '@/lib/formatters';

interface CashflowRunwaySectionProps {
  wallets: Wallet[];
  transactions: Transaction[];
  reminders: PaymentReminder[];
  currencySymbol: string;
}

export const CashflowRunwaySection: React.FC<CashflowRunwaySectionProps> = ({
  wallets,
  transactions,
  reminders,
  currencySymbol,
}) => {
  const forecast = calculateRunwayForecast(wallets, transactions, reminders);

  const getStatusBadge = () => {
    switch (forecast.healthStatus) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical Runway (&lt; 30 Days)</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <Clock className="w-3.5 h-3.5" />
            <span>Moderate Runway (30–60 Days)</span>
          </span>
        );
      case 'solid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Solid Runway (60–90 Days)</span>
          </span>
        );
      case 'abundant':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abundant Runway (90+ Days)</span>
          </span>
        );
    }
  };

  const projectionCards = [
    forecast.projections.days30,
    forecast.projections.days60,
    forecast.projections.days90,
  ];

  return (
    <div className="bg-[#12141a] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Cashflow Forecast & Runway</h3>
              <span className="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full font-mono font-medium">
                Predictive
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Projected balance over next 30, 60, and 90 days combining live burn rate & pending client receivables
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Burn Rate & Cash Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>Current Liquidity</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white mt-1">
            {formatCurrency(forecast.currentCash, currencySymbol)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Burn Rate</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-amber-400 mt-1">
            {currencySymbol}{formatCash(forecast.dailyBurnRate)}
            <span className="text-[11px] text-zinc-500 font-normal ml-1">/ day</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Estimated Cash Runway</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-zinc-100 mt-1">
            {forecast.runwayDays >= 999 ? '90+ Days' : `${forecast.runwayDays} Days`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#161821] border border-white/5">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Adjusted (with Inflows)</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-1">
            {forecast.adjustedRunwayDays >= 999 ? '90+ Days' : `${forecast.adjustedRunwayDays} Days`}
          </div>
        </div>
      </div>

      {/* 30, 60, 90 Day Milestone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {projectionCards.map((p) => {
          const isPositive = p.projectedBalance >= 0;
          return (
            <div
              key={p.days}
              className="p-4 rounded-2xl bg-[#161821] border border-white/5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {p.label}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Target: {p.targetDate}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-[11px] text-zinc-400">Projected Balance</div>
                  <div
                    className={`text-xl font-bold font-mono mt-0.5 ${
                      isPositive ? 'text-white' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(p.projectedBalance, currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Waterfall items */}
              <div className="space-y-1.5 pt-3 border-t border-white/5 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>Expected Inflows</span>
                  </span>
                  <span className="font-mono text-emerald-400">
                    +{currencySymbol}{formatCash(p.expectedReceivables)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span>Payables & Bills</span>
                  </span>
                  <span className="font-mono text-rose-400">
                    -{currencySymbol}{formatCash(p.expectedPayables)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Est. Living & Op Burn</span>
                  </span>
                  <span className="font-mono text-amber-400">
                    -{currencySymbol}{formatCash(p.estimatedBurn)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 font-semibold text-xs">
                  <span className="text-zinc-300">Net Delta vs Today</span>
                  <span
                    className={`font-mono ${
                      p.netChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {p.netChange >= 0 ? '+' : ''}
                    {currencySymbol}{formatCash(p.netChange)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
