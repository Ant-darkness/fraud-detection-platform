import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-20 bg-[#0A192F]/90 border-b border-blue-900/50 backdrop-blur-md z-40 flex items-center justify-between px-8 shadow-sm">
      {/* Kushoto ya Topbar (Kichwa cha ukurasa kinachotafsiriwa) */}
      <div>
        <h1 className="text-sm font-black text-white tracking-widest uppercase">
          {t('dashboard')}
        </h1>
      </div>

      {/* Kulia ya Topbar (Language Changer & User Profile) */}
      <div className="flex items-center gap-6">
        {/* Language Changer Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900/40 border border-blue-700/50 hover:border-blue-400 text-xs font-bold text-blue-100 hover:text-white transition duration-200 cursor-pointer shadow-sm"
        >
          🌐 {language === 'SW' ? 'ENGLISH' : 'KISWAHILI'}
        </button>

        {/* SW ENG Isiyobofya (Un-clickable indicator) */}
        <div className="text-xs font-black text-blue-300/60 tracking-wider select-none">
          SW_ENG
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-blue-900/50">
          <div className="text-right">
            <span className="text-xs font-bold text-white block">
              {user?.full_name || 'User'}
            </span>
            <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest block">
              {user?.role || 'OFFICER'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 hover:bg-red-600 hover:text-white text-xs transition duration-200 cursor-pointer shadow-sm"
            title={t('logout')}
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
