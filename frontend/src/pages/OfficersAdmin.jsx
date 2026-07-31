import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const OfficersAdmin = ({ showToast }) => {
  const { t } = useLanguage();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState(''); // Added to match backend
  const [formRole, setFormRole] = useState('OFFICER');

  const [activeDialog, setActiveDialog] = useState(null); // { action, officerId }

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const data = await api.officers.list();
      setOfficers(data);
    } catch (error) {
      showToast("Imeshindikana kupata orodha ya maafisa.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    setActiveDialog({ action: 'register' });
  };

  const executeAction = async () => {
    try {
      if (activeDialog.action === 'register') {
        await api.officers.register(formName, formUsername, formEmail, formPassword || "AdminPass123!", formRole);
        showToast("Afisa mpya amesajiliwa kikamilifu kwenye mfumo!", "success");
        setFormName('');
        setFormUsername('');
        setFormEmail('');
        setFormPassword('');
      } else if (activeDialog.action === 'toggleAccess') {
        const officer = officers.find(o => o.officer_id === activeDialog.officerId);
        if (officer.is_active) {
          await api.officers.disable(officer.officer_id);
          showToast("Akaunti ya afisa imezimwa.", "success");
        } else {
          await api.officers.enable(officer.officer_id);
          showToast("Akaunti ya afisa imewashwa upya.", "success");
        }
      }
      await fetchOfficers(); // refresh list
    } catch (error) {
      showToast("Imeshindikana kukamilisha mabadiliko hayo.", "error");
    } finally {
      setActiveDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
      {/* 1. Register Officer Container (Light Mode) */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider flex items-center gap-2">
          👤 <span>{t('registerOfficer')}</span>
        </h3>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:border-[#B8860B] focus:bg-white outline-none text-sm transition-all shadow-sm"
              placeholder="mf. John Doe"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Username</label>
            <input 
              type="text" 
              required
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:border-[#B8860B] focus:bg-white outline-none text-sm transition-all shadow-sm"
              placeholder="mf. jdoe"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:border-[#B8860B] focus:bg-white outline-none text-sm transition-all shadow-sm"
              placeholder="afisa@bot.go.tz"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Temporary Password</label>
            <input 
              type="password" 
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:border-[#B8860B] focus:bg-white outline-none text-sm transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Role Type</label>
            <select 
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:border-[#B8860B] focus:bg-white outline-none text-sm transition-all cursor-pointer shadow-sm"
            >
              <option value="OFFICER">OFFICER</option>
              <option value="ADMIN">ADMIN (U-Admini)</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-[#D4AF37] hover:bg-[#B8860B] text-white font-extrabold rounded-xl transition cursor-pointer shadow-sm mt-4 uppercase text-xs tracking-wider"
          >
            Sajili Afisa (Submit)
          </button>
        </form>
      </div>

      {/* 2. Officers Directory List (Light Mode) */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider flex items-center gap-2">
          📋 <span>{t('officerList')}</span>
        </h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
          {officers.map(off => (
            <div key={off.officer_id} className="p-4 bg-gray-50/80 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-gray-100/60 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{off.full_name}</h4>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{off.email} <span className="text-gray-400">({off.role})</span></p>
              </div>
              <button
                onClick={() => setActiveDialog({ action: 'toggleAccess', officerId: off.officer_id })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  off.is_active 
                    ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                {off.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
          {officers.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8 font-sans">Hakuna maafisa waliosajiliwa bado.</p>
          )}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={activeDialog !== null}
        title={activeDialog?.action === 'register' ? 'Thibitisha Usajili wa Afisa' : 'Badili Hali ya Upataji wa Mfumo'}
        message="Je, unataka kukamilisha mabadiliko haya ya kiutawala kwenye akaunti za usalama?"
        onConfirm={executeAction}
        onCancel={() => setActiveDialog(null)}
      />
    </div>
  );
};

export default OfficersAdmin;
