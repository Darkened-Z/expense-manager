import { PaymentReminder } from '@/types';

export const NotificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  async send(title: string, body: string, icon = '/icons/icon-192.png'): Promise<boolean> {
    if (!this.isSupported()) return false;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await this.requestPermission();
    }

    if (permission !== 'granted') return false;

    try {
      // Prefer Service Worker registration if available
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag: 'expense-reminder-' + Date.now(),
          });
          return true;
        }
      }

      // Fallback to standard window Notification
      new Notification(title, { body, icon });
      return true;
    } catch (e) {
      console.warn('Notification trigger error:', e);
      return false;
    }
  },

  async sendTestNotification(): Promise<boolean> {
    return this.send(
      'Notifications Active',
      'Expense Manager is configured to alert you on invoice due dates and payment reminders.'
    );
  },

  checkDueInvoicesAndNotify(reminders: PaymentReminder[]): void {
    if (this.getPermission() !== 'granted') return;

    const overdueList = reminders.filter((r) => r.status === 'overdue');
    const dueTodayList = reminders.filter((r) => r.status === 'due_today');

    if (overdueList.length > 0) {
      const first = overdueList[0];
      const count = overdueList.length;
      const title = count === 1 ? `Overdue Invoice: ${first.clientName}` : `${count} Overdue Invoices Requiring Follow-Up`;
      const body = count === 1 ? `${first.projectTitle} - ₹${first.amount.toFixed(2)} due on ${first.dueDate}` : `Review your client receivables to send reminder messages.`;
      this.send(title, body);
    } else if (dueTodayList.length > 0) {
      const first = dueTodayList[0];
      const count = dueTodayList.length;
      const title = count === 1 ? `Payment Due Today: ${first.clientName}` : `${count} Invoices Due Today`;
      const body = count === 1 ? `${first.projectTitle} - ₹${first.amount.toFixed(2)} expected today.` : `Check your accounts for incoming settlements.`;
      this.send(title, body);
    }
  },
};
