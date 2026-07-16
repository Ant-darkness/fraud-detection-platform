import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const Forgot = ({ setView, showToast }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Piga API yetu mpya ya FastAPI
      const response = await api.auth.forgotPassword(email);
      
      showToast(response.message || "Kama barua pepe ipo, tumetuma kiungo cha usalama!", "success");
      setEmail('');
      setView('login'); // Rudisha kwenye login baada ya mafanikio
    } catch (err) {
      showToast(err.message || "Imeshindikana kutuma ombi la reset.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      <p className="text-xs text-gray-400 leading-relaxed text-center mb-4">
        Weka email yako iliyosajiliwa ya BoT, mfumo utakutumia kiungo cha usalama cha kuweka nenosiri jipya.
      </p>
      <div>
        <input 
          type="email" 
          placeholder="Weka Email yako ya BOT"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            Inatuma...
          </>
        ) : (
          "Tuma Maelekezo (Reset)"
        )}
      </button>
      <div className="text-center mt-4">
        <button 
          type="button" 
          onClick={() => setView('login')}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-white cursor-pointer disabled:opacity-50"
        >
          Ghairi na Rudi Nyuma
        </button>
      </div>
    </form>
  );
};

export default Forgot;
