import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/logo.png'; 
import { HiMenuAlt2 } from 'react-icons/hi';
import { FcGlobe } from 'react-icons/fc';

const Topbar = ({ isCollapsed, setIsCollapsed }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#e6ebf0] border-b border-white/60 z-50 flex items-center justify-between px-6 shadow-[0_8px_16px_#c2c9d6] select-none">
      
      {/* Brand Logo & Controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2.5 rounded-2xl neo-button text-slate-700 transition cursor-pointer"
          title="Badili Ukubwa wa Sidebar"
        >
          <HiMenuAlt2 className="w-5 h-5 text-indigo-600" />
        </button>

        <div className="w-12 h-12 rounded-2xl neo-button p-1.5 flex items-center justify-center shrink-0">
          <img 
            src={logoImg} 
            alt="Bank of Tanzania Logo" 
            className="h-full w-auto object-contain"
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
        </div>
        
        <div>
          <h1 className="text-xs sm:text-sm font-black text-slate-800 tracking-widest uppercase leading-tight">
            BENKI KUU YA TANZANIA
          </h1>
          <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 tracking-widest uppercase block mt-0.5">
            MFUMO WA UDHIBITI NA UCHUNGUZI WA UTAPELI
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neo-button text-xs font-bold text-slate-800 transition cursor-pointer"
          aria-label="Badili Lugha"
        >
          <FcGlobe className="text-base" />
          <span className="hidden sm:inline font-black">{language === 'SW' ? 'ENGLISH' : 'KISWAHILI'}</span>
          <span className="sm:hidden font-black">{language === 'SW' ? 'EN' : 'SW'}</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
