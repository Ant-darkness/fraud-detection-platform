import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShieldAlert, Cpu, Users, LogOut, ShieldCheck 
} from 'lucide-react';

const Sidebar = () => {
  const { officer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OFFICER'] },
    { path: '/review', label: 'Fraud Reviews', icon: ShieldAlert, roles: ['ADMIN', 'OFFICER'] },
    { path: '/models', label: 'ML Models', icon: Cpu, roles: ['ADMIN', 'OFFICER'] },
    { path: '/officers', label: 'Officer Management', icon: Users, roles: ['ADMIN'] },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-full shrink-0">
      <div>
        {/* BoT Branding Logo Section */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider text-amber-500">BANK OF TANZANIA</h1>
            <p className="text-[10px] text-slate-400 font-mono">ANT-DARKNESS AI v1.0</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            if (officer && !item.roles.includes(officer.role)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="mb-3 px-2">
          <p className="text-xs text-slate-400">Logged in as:</p>
          <p className="text-sm font-semibold truncate text-slate-200">{officer?.full_name}</p>
          <span className="inline-block mt-1 text-[10px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">
            {officer?.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <LogOut className="h-5 w-5" />
          Disconnect Session
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
