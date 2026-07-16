import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-pink-700/90 border-b border-[#D4AF37]/30 flex items-center justify-between px-8 z-40 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="BOT Logo" 
          className="h-10 w-10 object-contain drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
          onError={(e) => { e.target.src = "https://placehold.co/100?text=BOT"; }} 
        />
        <span className="font-extrabold text-[#D4AF37] tracking-wider text-lg drop-shadow">
          BANK OF TANZANIA
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Language Switcher */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-[#D4AF37]/30">
          <button 
            onClick={() => setLang('SW')} 
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'SW' ? 'bg-[#D4AF37] text-black shadow' : 'text-gray-300 hover:text-white'}`}
          >
            SW
          </button>
          <button 
            onClick={() => setLang('ENG')} 
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'ENG' ? 'bg-[#D4AF37] text-black shadow' : 'text-gray-300 hover:text-white'}`}
          >
            ENG
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-4 text-sm font-semibold text-[#D4AF37]">
            <span className="bg-black/25 px-3 py-1.5 rounded-full border border-[#D4AF37]/20 text-xs">
              {user.role}: {user.full_name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
