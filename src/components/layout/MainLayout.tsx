
import React from 'react';
import Navbar from './Navbar';

export default function MainLayout({ children, hideNavbar, bgClassName = 'bg-[#111216]', mainPadding = 'p-6' }: { children: React.ReactNode; hideNavbar?: boolean; bgClassName?: string; mainPadding?: string }) {
  return (
    <div className={`min-h-screen ${bgClassName} flex flex-col`}>
      {!hideNavbar && <Navbar />}
      <main className={`flex-1 overflow-auto ${mainPadding}`}>
        {children}
      </main>
    </div>
  );
}
