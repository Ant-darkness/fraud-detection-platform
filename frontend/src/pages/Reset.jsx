import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const Reset = ({ setView, showToast }) => {
  const { t } = useLanguage();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Soma token kutoka kwenye URL pindi component inapofunguka
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      showToast("Token ya usalama haijapatikana kwenye link!", "error");
    }
  }, []);

  const handlePasswordConfirm = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Nenosiri jipya na lile la kuhakikisha hayafanani!", "error");
      return;
    }

    if (!token) {
      showToast("Token haipo. Tafadhali omba upya kiungo cha reset.", "error");
      return;
    }

    setLoading(true);

    try {
      // Piga API yetu mpya ya reset confirmation
      const response = await api.auth.resetPasswordConfirm(token, newPassword);
      
      showToast(response.message || "Nenosiri lako jipya limesajiliwa kikamilifu!", "success");
      
      // Kusafisha URL ili kuondoa token kwa usalama
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setView('login'); // Mrudishe mtumiaji kwenye login page
    } catch (err) {
      showToast(err.message || "Imeshindikana kubadilisha nenosiri.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordConfirm} className="space-y-4">
      <p className="text-xs text-amber-400 text-center mb-4">
        🛡️ USALAMA WA KIWANGO CHA JUU: Weka nenosiri jipya salama unalotaka kulitumia sasa.
      </p>
      <div>
        <input 
          type="password" 
          placeholder="Nenosiri Jipya"
          required
          disabled={loading || !token}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
        />
      </div>
      <div>
        <input 
          type="password" 
          placeholder="Thibitisha Nenosiri Jipya"
          required
          disabled={loading || !token}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50"
        />
      </div>
      <button 
        type="submit" 
        disabled={loading || !token}
        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Inasajili...
          </>
        ) : (
          "Hifadhi Nenosiri Jipya"
        )}
      </button>
      <div className="text-center mt-4">
        <button 
          type="button" 
          onClick={() => {
            // Kusafisha URL kabla ya kurudi login
            window.history.replaceState({}, document.title, window.location.pathname);
            setView('login');
          }}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-white cursor-pointer disabled:opacity-50"
        >
          Ghairi na Rudi Login
        </button>
      </div>
    </form>
  );
};

export default Reset;
