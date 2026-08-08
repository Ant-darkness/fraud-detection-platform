import React, { useState, useEffect, useCallback } from 'react';
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
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('OFFICER');

  const [activeDialog, setActiveDialog] = useState(null);

  const fetchOfficers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.officers.list();
      setOfficers(data || []);
    } catch (error) {
      if (showToast) showToast("Imeshindikana kupata orodha ya maafisa.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  const handleRegister = (e) => {
    e.preventDefault();
    setActiveDialog({ action: 'register' });
  };

  const executeAction = async () => {
    try {
      if (activeDialog.action === 'register') {
        await api.officers.register(formName, formUsername, formEmail, formPassword || "AdminPass123!", formRole);
        if (showToast) showToast("Afisa mpya amesajiliwa kikamilifu kwenye mfumo!", "success");
        setFormName('');
        setFormUsername('');
        setFormEmail('');
        setFormPassword('');
      } else if (activeDialog.action === 'toggleAccess') {
        const officer = officers.find(o => o.officer_id === activeDialog.officerId);
        if (officer.is_active) {
          await api.officers.disable(officer.officer_id);
          if (showToast) showToast("Akaunti ya afisa imezimwa.", "success");
        } else {
          await api.officers.enable(officer.officer_id);
          if (showToast) showToast("Akaunti ya afisa imewashwa upya.", "success");
        }
      }
      await fetchOfficers();
    } catch (error) {
      if (showToast) showToast("Imeshindikana kukamilisha mabadiliko hayo.", "error");
    } finally {
      setActiveDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-amber-300 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 font-sans">
      {/* 1. REGISTER OFFICER CONTAINER */}
      <div className="moss-card border-2 border-white/20 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        <h3 className="text-sm font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
          <span>👤</span> <span>{t('registerOfficer') || 'Sajili Afisa Mpya'}</span>
        </h3>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[11px] font-extrabold text-amber-100/90 block mb-1.5 uppercase tracking-wider">
              Jina Bufe (Full Name)
            </label>
            <input 
              type="text" 
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full p-3 rounded-xl moss-card-inner border border-white/20 text-white placeholder-white/40 focus:border-amber-300 outline-none text-xs transition-all shadow-inner"
              placeholder="mf. John Doe"
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-amber-100/90 block mb-1.5 uppercase tracking-wider">
              Jina la Kutumia (Username)
            </label>
            <input 
              type="text" 
              required
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              className="w-full p-3 rounded-xl moss-card-inner border border-white/20 text-white placeholder-white/40 focus:border-amber-300 outline-none text-xs transition-all shadow-inner font-mono"
              placeholder="mf. jdoe"
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-amber-100/90 block mb-1.5 uppercase tracking-wider">
              Barua Pepe (Email Address)
            </label>
            <input 
              type="email" 
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full p-3 rounded-xl moss-card-inner border border-white/20 text-white placeholder-white/40 focus:border-amber-300 outline-none text-xs transition-all shadow-inner"
              placeholder="afisa@bot.go.tz"
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-amber-100/90 block mb-1.5 uppercase tracking-wider">
              Nenosiri la Muda (Temporary Password)
            </label>
            <input 
              type="password" 
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full p-3 rounded-xl moss-card-inner border border-white/20 text-white placeholder-white/40 focus:border-amber-300 outline-none text-xs transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-amber-100/90 block mb-1.5 uppercase tracking-wider">
              Wadhifa (Role Type)
            </label>
            <select 
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="w-full p-3 rounded-xl moss-card-inner border border-white/20 text-white focus:border-amber-300 outline-none text-xs transition-all cursor-pointer shadow-inner font-bold [&>option]:bg-[#4a5837] [&>option]:text-white"
            >
              <option value="OFFICER">OFFICER (Afisa Ukaguzi)</option>
              <option value="ADMIN">ADMIN (Msimamizi Mkuu)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-black rounded-xl transition-all cursor-pointer shadow-lg mt-6 uppercase text-xs tracking-widest"
          >
            Sajili Afisa (Submit)
          </button>
        </form>
      </div>

      {/* 2. OFFICERS DIRECTORY LIST */}
      <div className="moss-card border-2 border-white/20 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 flex flex-col">
        <h3 className="text-sm font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
          <span>📋</span> <span>{t('officerList') || 'Orodha ya Maafisa'}</span>
        </h3>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin flex-1">
          {officers.map(off => (
            <div 
              key={off.officer_id} 
              className="p-4 moss-card-inner border border-white/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300/40 transition-all shadow-sm"
            >
              <div className="space-y-1">
                <h4 className="font-bold text-white text-xs sm:text-sm">{off.full_name}</h4>
                <p className="text-[11px] text-amber-100/80 font-mono break-all">
                  {off.email} <span className="text-amber-300 font-black ml-1">({off.role})</span>
                </p>
              </div>

              <button
                onClick={() => setActiveDialog({ action: 'toggleAccess', officerId: off.officer_id })}
                className={`self-start sm:self-center px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-sm ${
                  off.is_active 
                    ? 'bg-rose-500/20 text-rose-200 border-rose-400 hover:bg-rose-600 hover:text-white' 
                    : 'bg-emerald-500/20 text-emerald-200 border-emerald-400 hover:bg-emerald-500 hover:text-slate-950'
                }`}
              >
                {off.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}

          {officers.length === 0 && (
            <div className="h-full flex items-center justify-center py-16">
              <p className="text-amber-100/70 text-xs font-medium">Hakuna maafisa waliosajiliwa bado.</p>
            </div>
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
