'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/formatters';

interface DateInputDDMMYYYYProps {
  value: string; // Canonical YYYY-MM-DD (or '')
  onChange: (isoDate: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Parses a DD/MM/YYYY string into canonical YYYY-MM-DD if it represents a valid calendar date.
 */
function parseDDMMYYYYToISO(text: string): string | null {
  const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return null;
  }
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Formats typed digits into DD/MM/YYYY progressive mask while editing.
 */
function maskDigitsAsDDMMYYYY(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export const DateInputDDMMYYYY: React.FC<DateInputDDMMYYYYProps> = ({
  value,
  onChange,
  required = false,
  placeholder = 'DD/MM/YYYY',
  className = '',
}) => {
  const [text, setText] = useState<string>(() => formatDateDDMMYYYY(value));
  const lastPropValueRef = useRef<string>(value);

  useEffect(() => {
    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;
      setText(formatDateDDMMYYYY(value));
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow clearing optional date inputs
    if (raw.trim() === '') {
      setText('');
      if (!required) {
        lastPropValueRef.current = '';
        onChange('');
      }
      return;
    }

    const masked = maskDigitsAsDDMMYYYY(raw);
    setText(masked);

    const parsed = parseDDMMYYYYToISO(masked);
    if (parsed) {
      lastPropValueRef.current = parsed;
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (!text.trim() && !required) {
      lastPropValueRef.current = '';
      onChange('');
      return;
    }
    const parsed = parseDDMMYYYYToISO(text);
    if (parsed) {
      setText(formatDateDDMMYYYY(parsed));
    } else {
      // Restore last valid prop value
      setText(formatDateDDMMYYYY(value));
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    lastPropValueRef.current = iso;
    setText(formatDateDDMMYYYY(iso));
    onChange(iso);
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        required={required}
        className={`${className || 'w-full bg-[#171922] text-white text-xs px-3 py-2.5 rounded-none border border-[#2c303d] focus:outline-none focus:border-[#52596e]'} pr-9 font-mono`}
      />
      <div
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-none hover:bg-[#16181f] text-zinc-400 hover:text-white transition-colors cursor-pointer"
        title="Open calendar picker"
      >
        <Calendar className="w-3.5 h-3.5 pointer-events-none" />
        <input
          type="date"
          value={value}
          onChange={handlePickerChange}
          aria-label="Pick date from calendar"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};
