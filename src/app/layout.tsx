import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'Lifescape',
  description: 'Your life, your moments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
