/**
 * Date formatting utilities for standard DD/MM/YYYY representation
 */

/**
 * Converts ISO/Standard date strings (e.g. "YYYY-MM-DD" or ISO timestamp) to "DD/MM/YYYY".
 * Returns an empty string if dateStr is falsy.
 */
export function formatDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return '';

  // Handle YYYY-MM-DD or strings starting with YYYY-MM-DD
  const cleanStr = dateStr.trim();
  const datePart = cleanStr.includes('T') ? cleanStr.split('T')[0] : cleanStr;
  const parts = datePart.split('-');

  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // Fallback for Date parseable strings
  try {
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // ignore
  }

  return cleanStr;
}

/**
 * Formats a transaction or activity date with time into "DD/MM/YYYY • HH:MM"
 * or "Today, HH:MM" if the date is today.
 */
export function formatDateTimeDDMMYYYY(dateStr: string, timeStr?: string): string {
  try {
    const today = new Date().toISOString().split('T')[0];
    const formattedDate = formatDateDDMMYYYY(dateStr);
    if (dateStr === today) {
      return timeStr ? `Today, ${timeStr}` : 'Today';
    }
    return timeStr ? `${formattedDate} • ${timeStr}` : formattedDate;
  } catch {
    return timeStr ? `${dateStr} ${timeStr}` : dateStr;
  }
}
