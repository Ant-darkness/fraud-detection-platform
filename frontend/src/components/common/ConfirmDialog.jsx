import Button from "./Button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onCancel} disabled={loading} className="px-4 py-2">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} className="px-4 py-2">
            Confirm Action
          </Button>
        </div>
      </div>
    </div>
  );
}
