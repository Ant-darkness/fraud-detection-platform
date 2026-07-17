import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-20 bg-[#020205]/40 border-b border-white/10 backdrop-blur-md z-40 flex items-center justify-between px-8">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 text-xs font-bold text-gray-300 hover:text-white transition duration-200 cursor-pointer"
        >
          🌐 {language === 'SW' ? 'ENGLISH' : 'KISWAHILI'}
        </button>

        {/* SW ENG Isiyobofya (Un-clickable indicator) */}
        <div className="text-xs font-black text-gray-500 tracking-wider select-none">
          SW_ENG
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right">
            <span className="text-xs font-bold text-white block">
              {user?.full_name || 'User'}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">
              {user?.role || 'OFFICER'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs transition duration-200 cursor-pointer"
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
