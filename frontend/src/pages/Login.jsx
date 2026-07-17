import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Forgot from './Forgot';
import Reset from './Reset';

const Login = ({ showToast }) => {
  // MAREKEBISHO YA RANGI NA ERROR: 
  // Tunavuta mustChangePassword na setMustChangePassword kwa usahihi ili zitumike hapa chini na zipate rangi zake safi.
  const { login, changeForcePassword, mustChangePassword, setMustChangePassword } = useAuth();
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
      const result = await login(email.trim(), password.trim());
      
      if (result && result.success) {
        // Tunatumia mustChangePassword yetu tuliyoivuta kwenye destructuring ya useAuth
        if (result.mustChangePassword === true || mustChangePassword) {
          setView('change_pass');
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

  // Kulazimishwa kubadili password baada ya kufanya login mara ya kwanza
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
      // Tunatuma password mpya pekee kwenye context
      const success = await changeForcePassword(cleanPassword);
      if (success) {
        showToast("Nenosiri lako jipya limesajiliwa kikamilifu! Sasa unaweza kuingia.", "success");
        
        // Safisha input zote ili kuzuia browser auto-fill ya sifa za zamani
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
      {/* Background Neon Cyberpunk Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[150px]"></div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10">
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
        
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="BOT Logo" 
            className="h-16 w-16 mx-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            onError={(e) => { e.target.src = "https://placehold.co/150?text=BOT"; }}
          />
          <h2 className="text-xl font-black text-white tracking-widest uppercase">BOT PORTAL</h2>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-black">
            {view === 'reset' ? 'WEKA UPYA NENOSIRI' : view === 'forgot' ? 'REJESHA NENOSIRI' : view === 'change_pass' ? 'BADILI NENOSIRI LA LAZIMA' : t('loginTitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl text-center">
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
                placeholder={t('password') || 'Nenosiri'}
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
                className="text-xs text-gray-400 hover:text-[#D4AF37] transition cursor-pointer disabled:opacity-50 font-bold"
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

        {view === 'change_pass' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-400 text-center leading-relaxed font-bold">
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
                className="w-full p-4 rounded-xl bg-black/40 border border-[#D4AF37]/50 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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
                  setMustChangePassword(false); // Reset state ya context kwa usalama
                  setView('login');
                  setNewPassword('');
                }}
                className="text-xs text-gray-500 hover:text-white transition cursor-pointer"
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
