import React from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, type = 'warning', lang = 'sw' }) {
  if (!isOpen) return null;

  const styles = {
    danger: { border: 'border-red-500/30', icon: '⚠️', btn: 'from-red-600 to-red-500 text-white shadow-red-500/20' },
    warning: { border: 'border-amber-500/30', icon: '🔔', btn: 'from-amber-600 to-amber-500 text-neutral-950 shadow-amber-500/20' },
    info: { border: 'border-blue-500/30', icon: 'ℹ️', btn: 'from-blue-600 to-blue-500 text-white shadow-blue-500/20' }
  }[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm" onClick={onCancel}></div>
      <div className={`relative w-full max-w-md rounded-2xl bg-neutral-900 border ${styles.border} p-6 shadow-2xl transform transition-all scale-100`}>
        <div className="flex items-start space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-lg border border-neutral-800">{styles.icon}</div>
          <div className="flex-1">
            <h3 className="text-base font-black text-neutral-100 tracking-tight">{title}</h3>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onCancel} className="rounded-lg bg-neutral-800 border border-neutral-700/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-neutral-700/60 transition-colors cursor-pointer">
            {lang === 'sw' ? 'Ghairi' : 'Cancel'}
          </button>
          <button onClick={onConfirm} className={`rounded-lg bg-gradient-to-r ${styles.btn} px-5 py-2 text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer`}>
            {lang === 'sw' ? 'Thibitisha' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
