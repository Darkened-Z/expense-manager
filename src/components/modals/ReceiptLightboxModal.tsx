'use client';

import React from 'react';
import { X, Download, Receipt } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCash, formatDateDDMMYYYY } from '@/lib/formatters';

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

  const formattedDate = formatDateDDMMYYYY(transaction.date);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = transaction.attachmentUrl!;
    a.download = `Receipt_${formattedDate.replace(/\//g, '-')}_${transaction.title.replace(/\s+/g, '_')}.jpg`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#12141a] border border-[#2c303d] rounded-none sm:rounded-none max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#22252f]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-none bg-[#16181f] text-zinc-300 border border-[#22252f]">
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{transaction.title}</h3>
              <p className="text-[11px] font-mono text-zinc-400">
                {formattedDate} • {currencySymbol}{formatCash(transaction.amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-zinc-400 hover:text-white rounded-none bg-[#16181f] hover:bg-[#20232e] border border-[#22252f] transition-colors cursor-pointer"
              title="Download Receipt"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-none bg-[#16181f] hover:bg-[#20232e] border border-[#22252f] transition-colors cursor-pointer"
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
            className="max-h-[70vh] w-auto max-w-full rounded-none object-contain border border-[#22252f]"
          />
        </div>
      </div>
    </div>
  );
};
