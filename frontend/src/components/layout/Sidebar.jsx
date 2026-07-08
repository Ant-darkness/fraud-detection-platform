import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  ShieldAlert, 
  Cpu, 
  BarChart3, 
  Users 
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { name: "Fraud Reviews", path: "/reviews", icon: ShieldAlert },
  { name: "Models Registry", path: "/models", icon: Cpu },
  { name: "Performance Metrics", path: "/metrics", icon: BarChart3 },
  { name: "Officer Control", path: "/officers", icon: Users }
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-72 bg-[#0F2942] flex-col justify-between text-white border-r border-slate-800 shadow-xl z-20">
      <div>
        <div className="h-24 flex items-center px-8 border-b border-slate-800 bg-[#0A1D30]">
          <div>
            <h1 className="font-bold text-lg tracking-wider text-[#C5A059] uppercase">
              Bank of Tanzania
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-widest mt-0.5">
              FRAUD MONITORING HUB
            </p>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-4">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-150 group ${
                    isActive
                      ? "bg-[#C5A059] text-[#0F2942] font-semibold shadow-md"
                      : "text-slate-300 hover:bg-[#163B5F] hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#0F2942]" : "text-slate-400 group-hover:text-white"}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800 bg-[#0A1D30]/60 text-center text-[11px] text-slate-400 tracking-wider">
        <p className="font-semibold text-slate-300">SECURE NODE CLUSTER v4.0</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Official Processing Environment</p>
      </div>
    </aside>
  );
}
