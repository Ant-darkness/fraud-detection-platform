import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  FcPieChart, 
  FcPrivacy, 
  FcLineChart, 
  FcBarChart, 
  FcElectronics, 
  FcFlowChart, 
  FcManager, 
  FcKey, 
  FcLeave 
} from 'react-icons/fc';
import { HiOutlineExternalLink, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: t('fraudSummary') || 'Muhtasari wa Utapeli', icon: <FcPieChart className="w-5 h-5" /> },
    { id: 'reviews', label: t('fraudReviews') || 'Uhakiki wa Utapeli', icon: <FcPrivacy className="w-5 h-5" /> },
    { id: 'volume', label: t('volumeAnalysis') || 'Uchambuzi wa Thamani', icon: <FcLineChart className="w-5 h-5" /> },
    { id: 'businessAnalytics', label: t('businessAnalytics') || 'Uchambuzi wa Kina (BI)', icon: <FcBarChart className="w-5 h-5" /> },
    { id: 'models', label: t('models') || 'Mifumo ya Uchambuzi', icon: <FcElectronics className="w-5 h-5" /> },
    { id: 'transactions', label: t('transactions') || 'Miamala Halisi', icon: <FcFlowChart className="w-5 h-5" /> },
  ];

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';

  return (
    <aside 
      className={`fixed top-20 left-0 h-[calc(100vh-5rem)] bg-[#e6ebf0] border-r border-white/60 flex flex-col justify-between z-40 font-sans transition-all duration-300 ease-in-out select-none shadow-[8px_0_16px_#c2c9d6] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Toggle Button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 neo-button p-1.5 rounded-full shadow-md hover:scale-110 transition-all cursor-pointer z-50"
        title={isCollapsed ? "Fungua Sidebar" : "Kunja Sidebar"}
      >
        {isCollapsed ? <HiChevronRight className="w-4 h-4 text-indigo-600" /> : <HiChevronLeft className="w-4 h-4 text-indigo-600" />}
      </button>
      
      {/* Navigation Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar overflow-x-hidden">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive ? 'neo-button-active text-indigo-600' : 'neo-button text-slate-700'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <span className="shrink-0 text-lg">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* Admin Directory Link */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('officers')}
              title={isCollapsed ? (t('officers') || 'Usimamizi wa Maafisa') : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'officers' ? 'neo-button-active text-indigo-600' : 'neo-button text-slate-700'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <FcManager className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{t('officers') || 'Usimamizi wa Maafisa'}</span>}
            </button>
          )}

          {/* External Airflow Link */}
          <div className="pt-2">
            <div className="h-px bg-slate-300/60 my-3 shadow-[0_1px_2px_#ffffff]" />
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? (t('airflow') || 'Apache Airflow') : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl neo-button text-xs font-bold text-slate-700 hover:text-indigo-600 transition-all ${
                isCollapsed ? 'justify-center px-0' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                {!isCollapsed && <span className="truncate">{t('airflow') || 'Apache Airflow'}</span>}
              </div>
              {!isCollapsed && <HiOutlineExternalLink className="w-4 h-4 text-indigo-500 shrink-0" />}
            </a>
          </div>

          {/* Reset Password Button */}
          <button
            onClick={() => setActiveTab('reset-password')}
            title={isCollapsed ? (t('resetPassword') || 'Badili Nenosiri') : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'reset-password' ? 'neo-button-active text-indigo-600' : 'neo-button text-slate-700'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <FcKey className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">{t('resetPassword') || 'Badili Nenosiri'}</span>}
          </button>
        </nav>
      </div>

      {/* User Profile Footer Card */}
      <div className="p-3 border-t border-white/60 bg-[#e6ebf0] shrink-0 overflow-hidden">
        <div className={`flex items-center gap-2 p-2 rounded-2xl neo-inset ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl neo-button flex items-center justify-center text-xs font-black text-indigo-600 uppercase shrink-0">
              {user?.full_name ? user.full_name.substring(0, 2) : 'SA'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-[10px] text-slate-800 font-black uppercase tracking-wider block leading-tight truncate">
                  {user?.full_name || 'AFISA USALAMA'}
                </span>
                <span className="text-[9px] font-mono text-indigo-600 font-bold block mt-0.5">
                  {user?.role || 'ANALYST'}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl neo-button text-rose-600 hover:text-rose-700 transition-all cursor-pointer shrink-0"
              title={t('logout') || 'Ondoka'}
            >
              <FcLeave className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
