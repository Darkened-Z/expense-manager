import { PaymentReminder, AppSettings } from '@/types';
import { formatDateDDMMYYYY, formatCash } from './formatters';
import { formatForeignAmount } from './currencies';

export function normalizeWhatsAppPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  // Remove all non-numeric characters except +
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('03') && cleaned.length === 11) {
    // Pakistani mobile number format: 03001234567 -> 923001234567
    cleaned = '92' + cleaned.substring(1);
  }
  return cleaned;
}

export function buildWhatsAppReminderMessage(
  reminder: PaymentReminder,
  settings: AppSettings
): string {
  const clientName = reminder.clientName || 'Client';
  const projectTitle = reminder.projectTitle || 'Project Services';
  const invoiceNum = reminder.invoiceNumber ? `#${reminder.invoiceNumber}` : 'Pending Settlement';

  let formattedAmount = `${settings.currencySymbol || 'Rs. '}${formatCash(reminder.amount)}`;
  if (reminder.originalCurrency && reminder.originalCurrency !== 'PKR' && reminder.originalAmount) {
    formattedAmount = `${formatForeignAmount(reminder.originalAmount, reminder.originalCurrency)} (${formattedAmount})`;
  }
  const formattedDueDate = formatDateDDMMYYYY(reminder.dueDate);
  const senderName = settings.userName && settings.userName !== 'User' ? settings.userName : 'Expense Manager';
  const payoutInfo = (settings.bankPayoutDetails || '').trim();

  if (settings.whatsappReminderTemplate && settings.whatsappReminderTemplate.trim().length > 0) {
    return settings.whatsappReminderTemplate
      .replace(/{client}/g, clientName)
      .replace(/{project}/g, projectTitle)
      .replace(/{invoice}/g, invoiceNum)
      .replace(/{amount}/g, formattedAmount)
      .replace(/{dueDate}/g, formattedDueDate)
      .replace(/{bankDetails}/g, payoutInfo)
      .replace(/{sender}/g, senderName);
  }

  let msg = `Assalam o Alaikum ${clientName},\n\n`;
  msg += `Gentle reminder regarding Invoice ${invoiceNum} for ${projectTitle}:\n`;
  msg += `• Amount Due: ${formattedAmount}\n`;
  msg += `• Due Date: ${formattedDueDate}\n`;

  if (payoutInfo) {
    msg += `\nPayment / Bank Details:\n${payoutInfo}\n`;
  }

  msg += `\nPlease let me know once processed. Thank you!\n— ${senderName}`;
  return msg;
}

export function getWhatsAppReminderUrl(
  reminder: PaymentReminder,
  settings: AppSettings
): string {
  const message = buildWhatsAppReminderMessage(reminder, settings);
  const encodedText = encodeURIComponent(message);
  const phone = normalizeWhatsAppPhone(reminder.clientPhone);

  if (phone) {
    return `https://wa.me/${phone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
