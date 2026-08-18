import React, { useState, useCallback } from 'react';
import { api } from '../services/api';

const Reset = ({ setView, showToast }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const handlePasswordConfirm = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      notify("Tafadhali weka Token ya usalama uliyoipokea kwenye Email!", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("Nenosiri jipya na lile la kuhakikisha hayafanani!", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.resetPasswordConfirm(token.trim(), newPassword);
      notify(response.message || "Nenosiri lako jipya limesajiliwa kikamilifu!", "success");
      if (typeof setView === 'function') setView('login');
    } catch (err) {
      notify(err.message || "Imeshindikana kubadilisha nenosiri.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 font-sans px-4 select-none">
      {/* Container Kuu yenye Neumorphic / Corporate Theme */}
      <div className="neo-card p-6 sm:p-8 relative overflow-hidden space-y-6 shadow-2xl rounded-3xl border border-slate-300">
        
        {/* Header Section */}
        <div className="text-center space-y-2 border-b border-slate-300/80 pb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
            🛡️ USALAMA WA KIWANGO CHA JUU
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
            WEKA NENOSIRI JIPYA
          </h3>
          <p className="text-xs text-slate-600 font-bold">
            Ingiza Token uliyoipokea kwenye barua pepe yako pamoja na nenosiri jipya.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handlePasswordConfirm} className="space-y-4">
          
          {/* Token Input */}
          <div>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-1.5">
              Token Ya Usalama (OTP)
            </label>
            <input 
              type="text" 
              placeholder="Weka Namba za Token (Mfano: 482910)"
              required
              disabled={loading}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-mono text-center tracking-widest font-black placeholder-slate-400 outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* New Password Input */}
          <div>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-1.5">
              Nenosiri Jipya
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              disabled={loading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-bold placeholder-slate-400 outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-1.5">
              Thibitisha Nenosiri Jipya
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-bold placeholder-slate-400 outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 border border-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Inasajili...
              </>
            ) : (
              "💾 Hifadhi Nenosiri Jipya"
            )}
          </button>

          {/* Cancel/Back Button */}
          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => typeof setView === 'function' && setView('login')}
              disabled={loading}
              className="text-xs font-black text-slate-600 hover:text-slate-900 cursor-pointer transition disabled:opacity-50 underline decoration-slate-400 underline-offset-4"
            >
              ← Ghairi na Rudi Login
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Reset;
