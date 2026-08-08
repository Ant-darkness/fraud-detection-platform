import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  FiPieChart, 
  FiShield, 
  FiBarChart2, 
  FiCpu, 
  FiActivity, 
  FiUsers, 
  FiExternalLink,
  FiTrendingUp,
  FiKey,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: t('fraudSummary') || 'Fraud Summary', icon: <FiPieChart className="w-5 h-5" /> },
    { id: 'reviews', label: t('fraudReviews') || 'Fraud Reviews', icon: <FiShield className="w-5 h-5" /> },
    { id: 'volume', label: t('volumeAnalysis') || 'Volume Analysis', icon: <FiTrendingUp className="w-5 h-5" /> },
    { id: 'businessAnalytics', label: t('businessAnalytics') || 'Business Analytics', icon: <FiBarChart2 className="w-5 h-5" /> },
    { id: 'models', label: t('models') || 'Models', icon: <FiCpu className="w-5 h-5" /> },
    { id: 'transactions', label: t('transactions') || 'Transactions', icon: <FiActivity className="w-5 h-5" /> },
  ];

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';

  return (
    <aside 
      className={`fixed top-20 left-0 h-[calc(100vh-5rem)] bg-[#9B71B2]/95 backdrop-blur-xl border-r-2 border-[#D4AF37] flex flex-col justify-between z-40 shadow-2xl font-sans transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* COLLAPSE / EXPAND TOGGLE BUTTON */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 bg-[#D4AF37] text-slate-950 p-1.5 rounded-full shadow-lg hover:scale-110 transition-all cursor-pointer z-50 border border-white/40"
        title={isCollapsed ? "Fungua Sidebar" : "Kunja Sidebar"}
      >
        {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
      </button>
      
      {/* NAVIGATION LINKS CONTAINER */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar overflow-x-hidden">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#7B5392] text-[#F3E5AB] border border-[#D4AF37]/80 shadow-lg translate-x-0.5'
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <span className={`shrink-0 ${isActive ? 'text-[#F3E5AB]' : 'text-white/80'}`}>{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* ADMIN ONLY LINK: OFFICERS DIRECTORY */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('officers')}
              title={isCollapsed ? (t('officers') || 'Officers Directory') : ''}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'officers'
                  ? 'bg-[#7B5392] text-[#F3E5AB] border border-[#D4AF37]/80 shadow-lg translate-x-0.5'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <FiUsers className={`w-5 h-5 shrink-0 ${activeTab === 'officers' ? 'text-[#F3E5AB]' : 'text-white/80'}`} />
              {!isCollapsed && <span className="truncate">{t('officers') || 'Officers Directory'}</span>}
            </button>
          )}

          {/* EXTERNAL AIRFLOW LINK */}
          <div className="pt-2">
            <hr className="border-[#D4AF37]/30 my-2" />
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? (t('airflow') || 'Apache Airflow') : ''}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-white/90 hover:bg-white/15 hover:text-white transition-all duration-200 ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                {!isCollapsed && <span className="truncate">{t('airflow') || 'Apache Airflow'}</span>}
              </div>
              {!isCollapsed && <FiExternalLink className="w-4 h-4 text-[#F3E5AB] shrink-0" />}
            </a>
          </div>

          {/* RESET PASSWORD ROUTE (FIXED ID: 'reset-password') */}
          <button
            onClick={() => setActiveTab('reset-password')}
            title={isCollapsed ? (t('resetPassword') || 'Reset Password') : ''}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'reset-password'
                ? 'bg-[#7B5392] text-[#F3E5AB] border border-[#D4AF37]/80 shadow-lg translate-x-0.5'
                : 'text-white/90 hover:bg-white/15 hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <FiKey className={`w-5 h-5 shrink-0 ${activeTab === 'reset-password' ? 'text-[#F3E5AB]' : 'text-white/80'}`} />
            {!isCollapsed && <span className="truncate">{t('resetPassword') || 'Reset Password'}</span>}
          </button>
        </nav>
      </div>

      {/* USER PROFILE CARD WITH LOGOUT AT THE BOTTOM */}
      <div className="p-3 border-t-2 border-[#D4AF37] bg-black/20 shrink-0 overflow-hidden">
        <div className={`flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[#7B5392] border border-[#D4AF37] flex items-center justify-center text-xs font-black text-[#F3E5AB] uppercase shadow-inner shrink-0">
              {user?.full_name ? user.full_name.substring(0, 2) : 'SA'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider block leading-tight truncate">
                  {user?.full_name || 'SYSTEM OFFICER'}
                </span>
                <span className="text-[9px] font-mono text-[#F3E5AB] bg-black/40 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-[#D4AF37]/30">
                  {user?.role || 'ANALYST'}
                </span>
              </div>
            )}
          </div>

          {/* LOGOUT BUTTON */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 border border-rose-400/40 text-rose-200 hover:text-white transition-all duration-200 cursor-pointer shrink-0"
              title={t('logout') || 'Logout'}
              aria-label={t('logout') || 'Logout'}
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
