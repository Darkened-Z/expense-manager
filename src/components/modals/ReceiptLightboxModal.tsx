'use client';

import React from 'react';
import { X, Download, Receipt } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCash } from '@/lib/formatters';

interface ReceiptLightboxModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  currencySymbol: string;
  onClose: () => void;
}

export const ReceiptLightboxModal: React.FC<ReceiptLightboxModalProps> = ({
  isOpen,
  transaction,
  currencySymbol,
  onClose,
}) => {
  if (!isOpen || !transaction || !transaction.attachmentUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = transaction.attachmentUrl!;
    a.download = `Receipt_${transaction.date}_${transaction.title.replace(/\s+/g, '_')}.jpg`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#12141a] border border-white/10 rounded-2xl sm:rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 text-zinc-300 border border-white/5">
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{transaction.title}</h3>
              <p className="text-[11px] font-mono text-zinc-400">
                {transaction.date} • {currencySymbol}{formatCash(transaction.amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
              title="Download Receipt"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
          <img
            src={transaction.attachmentUrl}
            alt={`Receipt for ${transaction.title}`}
            className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-lg border border-white/5"
          />
        </div>
      </div>
    </div>
  );
};
