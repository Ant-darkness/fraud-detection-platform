import React, { useState, useCallback } from 'react';
import { api } from '../services/api';

const ChangePassword = ({ showToast }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmNewPassword) {
      notify("Tafadhali jaza nafasi zote.", "error");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      notify("Nenosiri jipya na lile la kuthibitisha hayajafanana!", "error");
      return;
    }

    if (formData.newPassword.length < 6) {
      notify("Nenosiri jipya lazima liwe na herufi zisizopungua 6.", "error");
      return;
    }

    try {
      setLoading(true);
      await api.auth.changePassword({
        old_password: formData.oldPassword,
        new_password: formData.newPassword
      });

      notify("Nenosiri lako limebadilishwa kikamilifu!", "success");
      setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      notify(error.message || "Imeshindikana kubadili nenosiri. Tafadhali thibitisha nenosiri la sasa.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 font-sans px-4 select-none">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center mb-6 relative z-10">
          <span className="text-3xl block mb-2" role="img" aria-label="Lock">🔐</span>
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            Badili Nenosiri
          </h2>
          <p className="text-xs text-cyan-100/80 mt-1 font-medium">
            Hakikisha nenosiri lako jipya ni imara na lina usalama wa kutosha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-cyan-200 block uppercase tracking-wider">
              Nenosiri la Sasa
            </label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-slate-950/50 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-xs focus:border-cyan-400 outline-none transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-cyan-200 block uppercase tracking-wider">
              Nenosiri Jipya
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-slate-950/50 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-xs focus:border-cyan-400 outline-none transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-cyan-200 block uppercase tracking-wider">
              Thibitisha Nenosiri Jipya
            </label>
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-slate-950/50 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-xs focus:border-cyan-400 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2 ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
