import { FolderOpen } from "lucide-react";

export default function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="p-4 bg-slate-100 text-slate-400 rounded-2xl mb-4">
        <FolderOpen className="h-8 w-8" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 tracking-wide uppercase">{title}</h4>
      <p className="text-xs text-slate-400 font-medium max-w-xs mt-1.5 leading-relaxed">{description}</p>
    </div>
  );
}
