import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Forgot from './Forgot';
import Reset from './Reset';

const Login = ({ showToast }) => {
  const { login, changeForcePassword, setMustChangePassword } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [view, setView] = useState('login'); 

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setView('reset');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email.trim(), password.trim());
      
      if (result && result.success) {
        if (result.mustChangePassword === true) {
          if (showToast) showToast("Tafadhali weka nenosiri jipya ili kuendelea.", "info");
          setView('change_pass');
        } else {
          if (showToast) showToast("Umeingia kikamilifu!", "success");
          // Hapa hatuweki useNavigate! 
          // login() imeshaweka user kwenye AuthContext, 
          // App.jsx ita-render Dashboard kiutomatiki!
        }
      } else {
        setError(result?.error || "Imeshindikana kuingia kwenye mfumo. Tafadhali angalia taarifa zako.");
      }
    } catch (err) {
      setError("Mawasiliano na server yamefeli. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const cleanPassword = newPassword.trim();
    if (cleanPassword.length < 6) {
      setError("Nenosiri jipya lazima liwe na herufi zisizopungua 6.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      const success = await changeForcePassword(cleanPassword);
      if (success) {
        if (showToast) showToast("Nenosiri lako jipya limesajiliwa kikamilifu! Sasa unaweza kuingia.", "success");
        setPassword(''); 
        setNewPassword('');
        setView('login'); 
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
    <div className="min-h-screen bg-[#020205] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow Effects za Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[150px]"></div>

      {/* CARD YA KATIKATI */}
      <div className="w-full max-w-md bg-[#4a0429] border border-[#D4AF37]/30 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_35px_rgba(74,4,41,0.8)] relative z-10">
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
        
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="BOT Logo" 
            className="h-16 w-16 mx-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
            onError={(e) => { e.target.src = "https://placehold.co/150?text=BOT"; }}
          />
          <h2 className="text-xl font-black text-[#F5E0A3] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] tracking-widest uppercase">
            BOT FRAUD DETECTION PORTAL
          </h2>
          <p className="text-[10px] text-[#D4AF37] mt-2 uppercase tracking-widest font-black drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">
            {view === 'reset' ? 'WEKA UPYA NENOSIRI' : view === 'forgot' ? 'REJESHA NENOSIRI' : view === 'change_pass' ? 'BADILI NENOSIRI LA LAZIMA' : t('loginTitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold rounded-xl text-center shadow-lg">
            {error}
          </div>
        )}

        {/* FORM YA LOGIN */}
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
                className="w-full p-4 rounded-xl bg-black/50 border border-[#D4AF37]/30 text-[#F5E0A3] placeholder-pink-200/50 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder={t('password') || 'Nenosiri'}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-black/50 border border-[#D4AF37]/30 text-[#F5E0A3] placeholder-pink-200/50 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#F5E0A3] to-[#D4AF37] hover:brightness-110 text-black font-extrabold rounded-xl transition duration-200 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Inathibitisha...
                </>
              ) : (
                "LOGIN"
              )}
            </button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setView('forgot')}
                disabled={loading}
                className="text-xs text-[#D4AF37] hover:text-[#F5E0A3] transition cursor-pointer disabled:opacity-50 font-bold drop-shadow-[0_0_3px_rgba(212,175,55,0.5)]"
              >
                {t('forgotPassword') || 'Umesahau Nenosiri?'}
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

        {/* FORM YA FORCE CHANGE PASSWORD */}
        {view === 'change_pass' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-300 text-center leading-relaxed font-bold">
                ⚠️ USALAMA MKUBWA: Unatakiwa kubadili nenosiri la muda lililotolewa na admin kabla ya kuendelea kuingia kwenye mfumo.
              </p>
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Weka Nenosiri Jipya"
                required
                disabled={loading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-black/50 border border-[#D4AF37]/50 text-[#F5E0A3] placeholder-pink-200/50 focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Inasajili...
                </>
              ) : (
                "Sajili Nenosiri Jipya"
              )}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => {
                  setMustChangePassword(false);
                  setView('login');
                  setNewPassword('');
                }}
                className="text-xs text-pink-200/70 hover:text-[#F5E0A3] transition cursor-pointer"
              >
                Ghairi na Rudi Nyuma
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
