import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '📊' },
    { id: 'reviews', label: t('fraudReviews'), icon: '🛡️' },
    { id: 'volume', label: t('volumeAnalysis'), icon: '📈' },
    { id: 'models', label: t('models'), icon: '🤖' },
    { id: 'metrics', label: t('metricsTitle'), icon: '🏆' }, // Tab Mpya ya Metrics
    { id: 'transactions', label: t('transactions'), icon: '💸' },
  ];

  if (user?.role === 'ADMIN') {
    menuItems.push({ id: 'officers', label: t('officers'), icon: '👮' });
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white/5 border-r border-white/10 backdrop-blur-xl flex flex-col justify-between py-6 z-50">
      <div>
        {/* LOGO na Brand */}
        <div className="px-6 mb-4">
          <div className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase opacity-75">
            Security Division
          </div>
          <div className="text-white text-lg font-black tracking-tight mt-1">
            BOT FRAUD RADAR
          </div>
        </div>

        {/* PROFILE CARD YA AFISA ALIYELOGIN */}
        {user && (
          <div className="mx-4 mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D4AF37] to-pink-500 flex items-center justify-center font-bold text-black text-sm uppercase">
              {user.username ? user.username.substring(0, 2) : 'US'}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-xs font-bold truncate">{user.full_name || user.username}</div>
              <div className="text-[9px] text-gray-400 font-extrabold tracking-wider uppercase mt-0.5 truncate">
                {user.role}
              </div>
            </div>
          </div>
        )}

        {/* NAV MENUS */}
        <nav className="space-y-1.5 px-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-4 border-[#D4AF37] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Apache Airflow Link */}
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
          >
            <span className="text-base">🌬️</span>
            {t('airflow')}
          </a>
        </nav>
      </div>

      {/* FOOTER ACTIONS (Reset Password & Logout) */}
      <div className="px-4 space-y-2">
        {/* Badili Nenosiri (Reset/Change Password Route) */}
        <button
          onClick={() => setActiveTab('change-password')}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase border transition-all duration-200 cursor-pointer ${
            activeTab === 'change-password'
              ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
              : 'bg-white/5 border-white/5 text-gray-300 hover:border-[#D4AF37]/50 hover:bg-white/10'
          }`}
        >
          <span>🔑</span>
          {t('changePassword')}
        </button>

        {/* Toka Nje */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-xs font-extrabold uppercase tracking-widest transition-all duration-200 cursor-pointer"
        >
          <span>🚪</span>
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
