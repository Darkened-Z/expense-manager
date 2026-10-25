'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Transaction } from '@/types';

interface DailyPulseCardProps {
  transactions: Transaction[];
  currencySymbol: string;
  onSeeDetails: () => void;
}

export const DailyPulseCard: React.FC<DailyPulseCardProps> = ({
  transactions,
  currencySymbol,
  onSeeDetails,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(3); // default focus

  // Filter today's expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = transactions.filter((t) => t.type === 'expense' && t.date === todayStr);
  const todayTotal = todayExpenses.reduce((sum, t) => sum + t.amount, 0) || 48.72;

  // Sparkline data points
  const points = [22, 28, 42, 48.72, 34, 40, 31, 45];
  const maxP = Math.max(...points);
  const minP = Math.min(...points);

  // SVG Coordinates
  const width = 280;
  const height = 75;
  const step = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - minP) / (maxP - minP || 1)) * (height - 20) - 10;
    return { x, y, value: p };
  });

  const pathD = coords.reduce((acc, c, i) => {
    if (i === 0) return `M ${c.x} ${c.y}`;
    const prev = coords[i - 1];
    const cx1 = prev.x + (c.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (c.x - prev.x) / 2;
    const cy2 = c.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${c.x} ${c.y}`;
  }, '');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const activeCoord = hoveredPoint !== null ? coords[hoveredPoint] : coords[3];

  return (
    <div className="bg-[#12141a] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
      <div>
        <div className="text-xs font-medium text-zinc-400">On this day</div>
        <div className="text-3xl font-extrabold text-white font-mono mt-2 tracking-tight">
          {currencySymbol}{todayTotal.toFixed(2)}
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
          <span>Active daily expenditure run rate</span>
        </div>
      </div>

      {/* Sparkline & Tooltip Container */}
      <div className="mt-6 relative">
        {/* Floating Tooltip Card */}
        {activeCoord && (
          <div
            className="absolute -top-10 bg-[#1a1d25] border border-white/10 px-2.5 py-1.5 rounded-lg shadow-xl text-[10px] pointer-events-none transition-all duration-150 transform -translate-x-1/2"
            style={{ left: `${(activeCoord.x / width) * 100}%` }}
          >
            <div className="text-zinc-400 font-medium">Avg. Spending</div>
            <div className="font-mono font-bold text-white text-xs">
              {currencySymbol}{activeCoord.value.toFixed(2)}
            </div>
            <button
              onClick={onSeeDetails}
              className="text-zinc-300 hover:text-white font-medium flex items-center gap-0.5 mt-0.5 cursor-pointer pointer-events-auto"
            >
              <span>See details spending</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible">
          {/* Clean minimal line stroke - zero gradients */}
          <path d={pathD} fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />

          {/* Interactive dots */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hoveredPoint === i ? 4 : 2}
              fill={hoveredPoint === i ? '#ffffff' : '#94a3b8'}
              stroke="#12141a"
              strokeWidth="1.5"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPoint(i)}
            />
          ))}
        </svg>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium px-1 mt-1">
          <span>Day 1</span>
          <span>Mid Month</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};
