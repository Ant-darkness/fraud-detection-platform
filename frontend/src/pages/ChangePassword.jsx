import React, { useState, useCallback } from 'react';
import { api } from '../services/api';
import { FcPrivacy } from 'react-icons/fc';

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

      notify("Nenosiri yako imebadilishwa kikamilifu!", "success");
      setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      notify(error.message || "Imeshindikana kubadili nenosiri.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 font-sans px-4 select-none">
      <div className="neo-card p-8 relative overflow-hidden">
        <div className="text-center mb-6">
          <FcPrivacy className="text-5xl mx-auto mb-2" />
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">
            Badilisha Nenosiri
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-bold">
            Weka nenosiri thabiti kulinda akaunti yako.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
              Nenosiri la Sasa
            </label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full neo-inset rounded-2xl px-4 py-3 text-slate-800 text-xs outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
              Nenosiri Jipya
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full neo-inset rounded-2xl px-4 py-3 text-slate-800 text-xs outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
              Thibitisha Nenosiri Jipya
            </label>
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full neo-inset rounded-2xl px-4 py-3 text-slate-800 text-xs outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl neo-button text-indigo-600 font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 mt-4 ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
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
