export default function Badge({ children, color = "gray" }) {
    const styles = {
      gray: "bg-slate-100 text-slate-700 border-slate-200",
      green: "bg-emerald-50 text-emerald-700 border-emerald-200",
      red: "bg-rose-50 text-rose-700 border-rose-200",
      orange: "bg-amber-50 text-amber-700 border-amber-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      gold: "bg-amber-50 text-amber-800 border-amber-200"
    };
  
    return (
      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border ${styles[color]}`}>
        {children}
      </span>
    );
  }
  