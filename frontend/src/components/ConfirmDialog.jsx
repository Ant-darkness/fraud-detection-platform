import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center space-y-4">
        {/* Warning Icon Badge */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-xs">
          <span className="text-xl">⚠️</span>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">{message}</p>
        </div>

        <div className="pt-2 flex justify-center gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            {t('cancel') || 'Ghairi'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            {t('confirm') || 'Thibitisha'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
