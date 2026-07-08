import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, LogOut, Menu } from "lucide-react";

export default function Topbar({ onMenuClick }) {
  const { officer, logout } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 shadow-xs sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h2 className="font-bold text-slate-800 text-base md:text-lg tracking-wide">
            Fraud Detection Control Center
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-xs text-slate-500 font-medium">Real-time Core Banking Link Active</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block border-r border-slate-200 pr-6">
          <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 justify-end">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {officer?.full_name || "Authorized Officer"}
          </p>
          <span className="text-[11px] bg-slate-100 font-bold text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
            {officer?.role || "OFFICER"}
          </span>
        </div>
        <button 
          onClick={logout} 
          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150"
          title="Sign Out Session"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
