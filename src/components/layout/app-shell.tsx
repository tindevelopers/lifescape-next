'use client';

import { useState } from 'react';
import Navbar from './navbar';
import Sidebar from './sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </>
  );
}
