import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border-2 border-[#D4AF37]/50 bg-black/85 p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] text-center">
        {/* Golden Warning Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]">
          <span className="text-2xl text-[#D4AF37]">⚠️</span>
        </div>
        
        <h3 className="text-xl font-bold text-[#D4AF37] uppercase tracking-wider">{title}</h3>
        <p className="mt-3 text-sm text-gray-300 leading-relaxed">{message}</p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white transition-all duration-200 cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg border border-blue-500/30 bg-blue-950/30 text-blue-400 text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
