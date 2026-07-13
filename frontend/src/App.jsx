import React, { useState } from 'react';
import { useLang } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

// Import ya Vipengele vya Ndani ya Mfumo
import DashboardOverview from './components/DashboardOverview';
import FraudReviewQueue from './components/FraudReviewQueue';
import OfficerRegistry from './components/OfficerRegistry';
import ModelRegistryView from './components/ModelRegistryView';
import MetricsReadOnly from './components/MetricsReadOnly';
import AdvancedGraphs from './components/AdvancedGraphs';
import TxVolumeAnalytics from './components/TxVolumeAnalytics';

export default function App() {
  const { lang, setLang, t } = useLang();
  const { user, login, logout, loading } = useAuth();
  
  const [mustChangePass, setMustChangePass] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [forgotMode, setForgotMode] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: Token, 3: New Pass
  
  // Login & Reset States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailForgot, setEmailForgot] = useState('');
  const [sixDigitToken, setSixDigitToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('bot_auth_token');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      if (result.user?.must_change_password || localStorage.getItem('is_new_user') === 'true') {
        setMustChangePass(true);
      }
    } else {
      setError(result.error || "Uthibitisho umefeli. Jina au nywila sio sahihi.");
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:8000/auth/forgot-password?email=${encodeURIComponent(emailForgot)}`, { method: 'POST' });
      setStep(2);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (!res.ok) throw new Error("Marekebisho yamegoma");
      setMustChangePass(false);
      alert("Nywila imebadilishwa kikamilifu.");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex justify-center items-center text-amber-500 font-bold text-sm tracking-widest uppercase animate-pulse">
        MFUMO WA BoT UNAWAKA...
      </div>
    );
  }

  // Muonekano wa Login / Forgot Password
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center font-sans px-4 relative">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800/80 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700"></div>
          
          <div className="text-center mb-6">
            <img src="/logo.png" alt="BoT Logo" className="h-14 mx-auto mb-3 object-contain" onError={(e) => e.target.style.display='none'} />
            <h1 className="text-xl font-black text-amber-400 tracking-tight">{t('title')}</h1>
            <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">{t('subtitle')}</p>
          </div>

          {!forgotMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1.5">{t('username')}</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1.5">{t('password')}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
              <button type="submit" className="w-full py-2.5 bg-amber-500 text-neutral-950 font-black rounded-xl uppercase tracking-wider text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer">{t('login')}</button>
              <div className="text-center mt-3">
                <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-amber-500/80 hover:underline">{t('forgotPass')}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider border-b border-neutral-800 pb-2">{t('resetTitle')}</h2>
              {step === 1 && (
                <form onSubmit={handleSendResetCode} className="space-y-3">
                  <input type="email" placeholder="Ingiza barua pepe ya afisa" value={emailForgot} onChange={e => setEmailForgot(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2" />
                  <button type="submit" className="w-full py-2 bg-neutral-800 text-white font-bold text-xs uppercase rounded-lg">{t('sendCode')}</button>
                </form>
              )}
              {step === 2 && (
                <form onSubmit={handleVerifyToken} className="space-y-3">
                  <input type="text" maxLength="6" placeholder="X X X X X X" value={sixDigitToken} onChange={e => setSixDigitToken(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-center text-lg font-mono text-amber-400 tracking-widest rounded-lg px-3 py-2" />
                  <button type="submit" className="w-full py-2 bg-amber-500 text-neutral-950 font-black text-xs uppercase rounded-lg">{t('verifyCode')}</button>
                </form>
              )}
              {step === 3 && (
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <input type="password" placeholder={t('newPass')} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2" />
                  <button type="submit" className="w-full py-2 bg-amber-500 text-neutral-950 font-black text-xs uppercase rounded-lg">{t('confirm')}</button>
                </form>
              )}
              <button onClick={() => { setForgotMode(false); setStep(1); }} className="text-xs text-neutral-500 hover:text-white mt-2 block mx-auto">{t('backToLogin')}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Muonekano wa Lazima Kubadili Password (New Login Enforcer)
  if (mustChangePass) {
    return (
      <div className="min-h-screen bg-neutral-950 flex justify-center items-center font-sans px-4">
        <div className="w-full max-w-md bg-neutral-900 border border-amber-500/30 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-amber-400 font-bold text-lg mb-2 text-center">{t('changePass')}</h2>
          <p className="text-xs text-neutral-400 mb-6 text-center">Huu ni mwanzo wa kikao chako cha kwanza. Ni lazima kusasisha nywila yako kwa mujibu wa itifaki za usalama za Benki Kuu.</p>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <input type="password" placeholder={t('newPass')} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500" />
            <button type="submit" className="w-full py-2.5 bg-amber-500 text-neutral-950 font-black rounded-xl uppercase tracking-wider text-xs hover:brightness-110 transition-all">{t('confirm')}</button>
          </form>
        </div>
      </div>
    );
  }

  // Muundo Mkuu wa Mfumo (Kurasa za Ndani)
  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden font-sans select-none">
      
      {/* TOPBAR FIXED */}
      <header className="h-14 bg-neutral-900 border-b border-neutral-800/80 px-6 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="BoT Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-xs font-black tracking-widest text-amber-400 uppercase">{t('title')}</h1>
            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Fraud Command Node</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <button onClick={() => setLang('sw')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${lang === 'sw' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'}`}>SW</button>
            <button onClick={() => setLang('en')} className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${lang === 'en' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'}`}>EN</button>
          </div>
        </div>
      </header>

      {/* BODY AREA */}
      <div className="flex-1 flex min-h-0 w-full relative">
        
        {/* SIDEBAR FIXED */}
        <aside className="w-64 bg-neutral-900/60 border-r border-neutral-800/60 flex flex-col justify-between shrink-0 h-full">
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {[
              { id: 'dashboard', label: t('dashboard'), icon: '📊' },
              { id: 'reviews', label: t('fraudReview'), icon: '🛡️' },
              { id: 'models', label: t('modelRegistry'), icon: '🧠' },
              { id: 'metrics', label: t('metrics'), icon: '📈' },
              { id: 'graphs', label: t('graphs'), icon: '📉' },
              { id: 'txvolume', label: t('txVolumeTab'), icon: '💸' },
              { id: 'officers', label: t('officerManagement'), icon: '👥', adminOnly: true },
            ].map((item) => {
              if (item.adminOnly && user?.role !== 'ADMIN') return null;
              const isSelected = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${isSelected ? 'bg-amber-500 text-neutral-950 font-black shadow-md' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'}`}>
                  <span>{item.icon}</span>
                  <span className="flex-1 uppercase">{item.label}</span>
                </button>
              );
            })}
            
            {/* Airflow External Redirect */}
            <a href="http://localhost:8080" target="_blank" rel="noreferrer" className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:bg-neutral-800/50 hover:text-white transition-all">
              <span>🌪️</span>
              <span className="flex-1 uppercase">{t('airflow')}</span>
            </a>
          </nav>
          
          {/* Bottom Controls / Sessions */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="truncate pr-2">
                <p className="font-bold text-neutral-200 truncate">{user?.username || user?.full_name}</p>
                <p className="text-[9px] text-amber-500 font-bold uppercase">{user?.role}</p>
              </div>
              <button onClick={logout} className="px-2 py-1 bg-neutral-800 hover:bg-red-950/60 hover:text-red-400 text-[10px] font-black rounded uppercase transition-colors">{t('logout')}</button>
            </div>
            
            {/* FOOTER COPYRIGHT */}
            <div className="text-[9px] text-neutral-600 text-center uppercase tracking-wider font-semibold border-t border-neutral-800/50 pt-2">
              © {new Date().getFullYear()} Bank of Tanzania
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA (ONLY THIS SECTIONS SCROLLS) */}
        <main className="flex-1 h-full overflow-y-auto bg-neutral-950 p-6 min-w-0">
          {activeTab === 'dashboard' && <DashboardOverview token={token} />}
          {activeTab === 'reviews' && <FraudReviewQueue token={token} user={user} />}
          {activeTab === 'models' && <ModelRegistryView token={token} user={user} />}
          {activeTab === 'metrics' && <MetricsReadOnly token={token} />}
          {activeTab === 'graphs' && <AdvancedGraphs token={token} />}
          {activeTab === 'txvolume' && <TxVolumeAnalytics token={token} />}
          {activeTab === 'officers' && <OfficerRegistry token={token} />}
        </main>
      </div>
    </div>
  );
}
