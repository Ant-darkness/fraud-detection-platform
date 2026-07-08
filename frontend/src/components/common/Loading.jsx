export default function Loading({ text = "Synchronizing node telemetry..." }) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-[#C5A059]" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          {text}
        </p>
      </div>
    );
  }
  