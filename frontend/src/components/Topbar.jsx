import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/logo.png'; 
import { FiMenu } from 'react-icons/fi';

const Topbar = ({ isCollapsed, setIsCollapsed }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#9B71B2]/95 backdrop-blur-md border-b-2 border-[#D4AF37] z-50 flex items-center justify-between px-4 sm:px-6 shadow-xl select-none">
      
      {/* BRAND & LOGO SECTION WITH SIDEBAR TOGGLE */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile/Quick Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-[#D4AF37]/40 transition duration-150 cursor-pointer"
          title="Badili Sidebar Size"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-[#D4AF37]/50 shadow-inner shrink-0">
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
          <h1 className="text-xs sm:text-sm font-black text-white tracking-widest uppercase leading-tight">
            BANK OF TANZANIA
          </h1>
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#F3E5AB] tracking-widest uppercase block mt-0.5">
            FRAUD DETECTION PLATFORM
          </span>
        </div>
      </div>

      {/* ACTIONS SECTION */}
      <div className="flex items-center gap-4">
        {/* Language Changer Button */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 border border-[#D4AF37]/50 hover:bg-white/25 text-xs font-bold text-white transition duration-150 cursor-pointer shadow-sm"
          aria-label="Toggle language"
        >
          <span role="img" aria-label="Globe" className="text-sm">🌐</span>
          <span className="hidden sm:inline">{language === 'SW' ? 'ENGLISH' : 'KISWAHILI'}</span>
          <span className="sm:hidden">{language === 'SW' ? 'EN' : 'SW'}</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
