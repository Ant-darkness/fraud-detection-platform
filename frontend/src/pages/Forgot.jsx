import React, { useState, useCallback } from 'react';
import { api } from '../services/api';

const Forgot = ({ setView, showToast }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email.trim());
      notify("Token ya usalama imetumwa kwenye barua pepe yako!", "success");
      if (typeof setView === 'function') setView('reset');
    } catch (err) {
      notify(err.message || "Imeshindikana kuunganisha na server.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 font-sans px-4 select-none">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-5">
        <div className="text-center space-y-2">
          <span className="text-3xl block">🔑</span>
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            Rejesha Nenosiri
          </h2>
          <p className="text-xs text-cyan-100/80 leading-relaxed font-medium">
            Weka barua pepe yako ili tukutumie Token ya usalama ya kuweka upya nenosiri lako.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-black text-cyan-200 uppercase tracking-wider block mb-2">
              Barua Pepe (Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="afisa@bot.go.tz"
              className="w-full bg-slate-950/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-xs focus:border-cyan-400 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Inatuma Token...
              </>
            ) : (
              'TUMA TOKEN YA RESET'
            )}
          </button>

          <button
            type="button"
            onClick={() => setView && setView('login')}
            className="w-full text-center text-xs text-cyan-300 hover:text-cyan-200 font-bold block pt-2 cursor-pointer transition"
          >
            ← Rudi Kwenye Kuingia (Login)
          </button>
        </form>
      </div>
    </div>
  );
};

export default Forgot;
