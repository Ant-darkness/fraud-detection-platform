import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Forgot from './Forgot';
import Reset from './Reset';

const Login = ({ showToast }) => {
  const { login, mustChangePassword, changeForcePassword } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [view, setView] = useState('login'); // login, forgot, reset, change_pass

  // Angalia kama kuna token kwenye URL ili kufungua moja kwa moja ukurasa wa reset
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setView('reset');
    }
  }, []);

  // Kuingia kwenye Mfumo (Login)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        if (result.mustChangePassword) {
          setView('change_pass');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Mawasiliano na server yamefeli. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  // Kulazimishwa kubadili password baada ya kufanya login mara ya kwanza (must_change_password)
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await changeForcePassword(newPassword);
      if (success) {
        showToast("Nenosiri lako jipya limesajiliwa kikamilifu! Karibu kwenye mfumo.", "success");
      } else {
        setError("Imeshindikana kubadili nenosiri la lazima.");
      }
    } catch (err) {
      setError(err.message || "Hitilafu imetokea wakati wa kubadili nenosiri.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Neon Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-700/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="BOT Logo" 
            className="h-16 w-16 mx-auto object-contain mb-4"
            onError={(e) => { e.target.src = "https://placehold.co/150?text=BOT"; }}
          />
          <h2 className="text-2xl font-black text-white tracking-tight">BOT PORTAL</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
            {view === 'reset' ? 'WEKA UPYA NENOSIRI' : view === 'forgot' ? 'REJESHA NENOSIRI' : t('loginTitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="email@bot.go.tz"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder={t('password')}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#D4AF37] hover:bg-[#bfa032] text-black font-extrabold rounded-xl transition duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Inathibitisha...
                </>
              ) : (
                "Ingia Mfumo (Login)"
              )}
            </button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setView('forgot')}
                disabled={loading}
                className="text-xs text-gray-400 hover:text-[#D4AF37] transition cursor-pointer disabled:opacity-50"
              >
                {t('forgotPassword')}
              </button>
            </div>
          </form>
        )}

        {view === 'forgot' && (
          <Forgot setView={setView} showToast={showToast} />
        )}

        {view === 'reset' && (
          <Reset setView={setView} showToast={showToast} />
        )}

        {view === 'change_pass' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <p className="text-xs text-amber-400 text-center mb-4">
              ⚠️ USALAMA MKUBWA: Unatakiwa kubadili nenosiri la muda kabla ya kuendelea.
            </p>
            <div>
              <input 
                type="password" 
                placeholder={t('newPassword')}
                required
                disabled={loading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-black/40 border border-[#D4AF37]/50 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Inasajili...
                </>
              ) : (
                t('changePassword')
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
