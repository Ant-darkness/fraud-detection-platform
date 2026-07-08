import { Shield, ShieldAlert, FileClock, Percent } from "lucide-react";

export default function StatCard({ title, value, color = "gold" }) {
  const textColors = {
    gold: "text-[#0F2942]",
    green: "text-emerald-600",
    red: "text-rose-600",
    orange: "text-amber-600"
  };

  const bgColors = {
    gold: "bg-blue-50 text-[#0F2942]",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    orange: "bg-amber-50 text-amber-600"
  };

  const icons = {
    gold: Shield,
    red: ShieldAlert,
    orange: FileClock,
    green: Percent
  };

  const Icon = icons[color] || Shield;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h2 className={`text-2xl font-bold mt-2 ${textColors[color]}`}>{value}</h2>
      </div>
      <div className={`p-3 rounded-xl ${bgColors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
