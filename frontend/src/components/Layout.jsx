import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Sidebar />

      {/* Dynamic Content Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              BoT Core Node Operational
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {new Date().toLocaleDateString('en-GB')} | EAT Zone
          </div>
        </header>

        {/* Kurasa zote za ndani zitafungukia hapa na hazitapita kimo cha screen */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-slate-950/20 to-slate-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
