'use client';

import React from 'react';

interface PageSectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageSectionHeader: React.FC<PageSectionHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="bg-[#12141a] border border-[#22252f] rounded-none p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full overflow-hidden">
      <div className="min-w-0">
        <h2 className="text-sm sm:text-base font-bold text-white tracking-wide leading-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-zinc-400 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
