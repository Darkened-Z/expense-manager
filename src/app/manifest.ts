import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Expense Manager — Freelance Suite',
    short_name: 'ExpenseManager',
    description: 'High-performance expense tracker, freelance payment due-date reminders, and savings manager',
    start_url: '/',
    display: 'standalone',
    background_color: '#090a0d',
    theme_color: '#090a0d',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
