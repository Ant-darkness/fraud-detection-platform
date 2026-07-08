export default function Card({ title, children, className = "" }) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-6 ${className}`}>
        {title && (
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100">
            {title}
          </h3>
        )}
        {children}
      </div>
    );
  }
  