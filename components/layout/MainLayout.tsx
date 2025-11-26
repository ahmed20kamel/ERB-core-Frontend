'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ToastContainer from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRealtimeUpdates } from '@/lib/hooks/use-realtime';

export default function MainLayout({ children }: { children: ReactNode }) {
  // Enable real-time updates for all pages
  useRealtimeUpdates();

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto pt-14" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="w-full mx-auto px-6 lg:px-12 py-4 lg:py-6" style={{ maxWidth: '1650px' }}>
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
}
