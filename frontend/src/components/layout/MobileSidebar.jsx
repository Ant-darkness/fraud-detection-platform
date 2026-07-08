import { X, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function MobileSidebar({ isOpen, onClose, navigation = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Sidebar Content */}
      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#0F2942] pt-5 pb-4 shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white" onClick={onClose}>
          <X className="h-6 w-6" />
        </div>

        <div className="flex items-center gap-3 px-6 mb-8 text-white">
          <div className="p-2.5 bg-slate-800 rounded-xl text-[#C5A059]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider">Bank of Tanzania</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fraud Guard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition duration-150
                ${isActive 
                  ? "bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/10" 
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}
              `}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
