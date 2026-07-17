import React, { useState } from 'react';
import { api } from '../services/api';

const ChangePassword = ({ showToast }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Uthibitishaji wa awali wa Frontend
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmNewPassword) {
      showToast("Tafadhali jaza nafasi zote.", "error");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      showToast("Nenosiri jipya na lile la kuthibitisha hayajafanana!", "error");
      return;
    }

    if (formData.newPassword.length < 6) {
      showToast("Nenosiri jipya lazima liwe na herufi zisizopungua 6.", "error");
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      
      // Hapa tunaita API ya kubadili nenosiri. 
      // Hakikisha kwenye api.js una endpoint ya kubadili password mfano: api.auth.changePassword(...)
      await api.auth.changePassword({
        old_password: formData.oldPassword,
        new_password: formData.newPassword
      });

      showToast("Nenosiri lako limebadilishwa kikamilifu! 🎉", "success");
      
      // Safisha fomu baada ya kufanikiwa
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error) {
      showToast(error.message || "Imeshindikana kubadili nenosiri. Tafadhali thibitisha nenosiri la sasa.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 animate-fadeIn">
      {/* Glassmorphic Container yenye Golden Accent */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        {/* Golden line pambo la juu */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

        <div className="text-center mb-8">
          <span className="text-3xl block mb-2">🔐</span>
          <h2 className="text-xl font-black text-[#D4AF37] uppercase tracking-wider">
            Badili Nenosiri
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Hakikisha nenosiri lako jipya ni imara na gumu kukisia.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nenosiri la Sasa */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">
              Nenosiri la Sasa
            </label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
              required
            />
          </div>

          {/* Nenosiri Jipya */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">
              Nenosiri Jipya
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
              required
            />
          </div>

          {/* Thibitisha Nenosiri Jipya */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">
              Thibitisha Nenosiri Jipya
            </label>
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
              required
            />
          </div>

          {/* Kitufe cha Kutuma (Submit Button) */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-black bg-[#D4AF37] hover:bg-[#F3E5AB] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Inahifadhi...
              </>
            ) : (
              "Hifadhi Mabadiliko"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
