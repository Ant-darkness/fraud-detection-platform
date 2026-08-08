import React, { useState } from 'react';
import { api } from '../services/api';

const Reset = ({ setView, showToast }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordConfirm = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      showToast("Tafadhali weka Token ya usalama uliyoipokea kwenye Email!", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Nenosiri jipya na lile la kuhakikisha hayafanani!", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.resetPasswordConfirm(token.trim(), newPassword);
      showToast(response.message || "Nenosiri lako jipya limesajiliwa kikamilifu!", "success");
      if (typeof setView === 'function') setView('login');
    } catch (err) {
      showToast(err.message || "Imeshindikana kubadilisha nenosiri.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 font-sans px-4 select-none">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-5">
        <form onSubmit={handlePasswordConfirm} className="space-y-4">
          <p className="text-xs text-amber-400 text-center mb-2 font-bold">
            🛡️ USALAMA WA KIWANGO CHA JUU
          </p>
          <p className="text-xs text-cyan-100/80 text-center mb-4">
            Ingiza Token uliyoipokea kwenye barua pepe pamoja na nenosiri jipya.
          </p>

          <div>
            <label className="text-[11px] font-black text-cyan-200 uppercase tracking-wider block mb-1">
              Token Ya Usalama (OTP)
            </label>
            <input 
              type="text" 
              placeholder="Weka Namba za Token (Mfano: 482910)"
              required
              disabled={loading}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/50 border border-white/20 text-white tracking-widest font-mono text-center placeholder-gray-500 focus:border-cyan-400 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-cyan-200 uppercase tracking-wider block mb-1">
              Nenosiri Jipya
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              disabled={loading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/50 border border-white/20 text-white placeholder-gray-500 focus:border-cyan-400 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-cyan-200 uppercase tracking-wider block mb-1">
              Thibitisha Nenosiri Jipya
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/50 border border-white/20 text-white placeholder-gray-500 focus:border-cyan-400 outline-none text-sm transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Inasajili...
              </>
            ) : (
              "Hifadhi Nenosiri Jipya"
            )}
          </button>

          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => setView && setView('login')}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-white cursor-pointer transition"
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
