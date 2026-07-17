import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Orodha ya Tabs za Sidebar
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '📊' },
    { id: 'reviews', label: t('fraudReviews'), icon: '🛡️' },
    { id: 'volume', label: t('volumeAnalysis'), icon: '📈' },
    { id: 'models', label: t('models'), icon: '🏆' },
    { id: 'metrics', label: t('metricsTitle'), icon: '🥇' },
    { id: 'transactions', label: t('transactions'), icon: '💸' },
  ];

  // Onyesha "Officers Admin" tu kwa watumiaji wenye jukumu la ADMIN
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col justify-between z-50 shadow-sm">
      {/* TOP PART OF SIDEBAR */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo and BOT FRAUD RADAR - Size sawa na Topbar (h-20) */}
        <div className="h-20 min-h-[5rem] px-6 border-b border-gray-100 flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="BOT Logo" 
            className="h-10 w-10 object-contain drop-shadow-sm"
            onError={(e) => { e.target.src = "https://placehold.co/150?text=BOT"; }}
          />
          <div>
            <h2 className="text-xs font-black text-gray-900 tracking-wider uppercase leading-none">
              BOT FRAUD
            </h2>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              RADAR
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {/* Officers Admin Link ikiwa ni Admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('officers')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'officers'
                  ? 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">👤</span>
              <span className="truncate">{t('officers')}</span>
            </button>
          )}
        </nav>
      </div>

      {/* BOTTOM PART OF SIDEBAR (System Administrator - Chini kabisa) */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
            SA
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">
              Logged in as
            </span>
            <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight block truncate">
              SYSTEMADMINISTRATOR
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
