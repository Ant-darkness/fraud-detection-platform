import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const OfficersAdmin = ({ showToast }) => {
  const { t } = useLanguage();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('OFFICER');

  const [activeDialog, setActiveDialog] = useState(null);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const fetchOfficers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.officers.list();
      setOfficers(data || []);
    } catch (error) {
      notify("Imeshindikana kupata orodha ya maafisa.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  const handleRegister = (e) => {
    e.preventDefault();
    setActiveDialog({ action: 'register' });
  };

  const executeAction = async () => {
    if (!activeDialog) return;
    setIsSubmitting(true);
    try {
      if (activeDialog.action === 'register') {
        await api.officers.register(
          formName,
          formUsername,
          formEmail,
          formPassword || "AdminPass123!",
          formRole
        );
        notify("Afisa mpya amesajiliwa kikamilifu kwenye mfumo!", "success");
        // Rejea kwenye majina ya default baada ya kuregister
        setFormName('');
        setFormUsername('');
        setFormEmail('');
        setFormPassword('');
      } else if (activeDialog.action === 'toggleAccess') {
        const officer = officers.find(o => o.officer_id === activeDialog.officerId);
        if (officer) {
          if (officer.is_active) {
            await api.officers.disable(officer.officer_id);
            notify("Akaunti ya afisa imezimwa.", "success");
          } else {
            await api.officers.enable(officer.officer_id);
            notify("Akaunti ya afisa imewashwa upya.", "success");
          }
        }
      }
      await fetchOfficers();
    } catch (error) {
      notify("Imeshindikana kukamilisha mabadiliko hayo.", "error");
    } finally {
      setIsSubmitting(false);
      setActiveDialog(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 font-sans max-w-7xl mx-auto select-none">
      
      {/* 1. REGISTER OFFICER CONTAINER */}
      <div className="neo-card p-5 sm:p-7 space-y-6 shadow-2xl rounded-3xl border border-slate-300">
        <div className="border-b border-slate-300/80 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>👤</span> <span>{t?.('registerOfficer') || 'SAJILI AFISA MPYA'}</span>
          </h3>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Jaza taarifa za afisa mpya kwa ajili ya kumpa fursa ya kutumia mfumo.
          </p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[11px] font-black text-slate-800 block mb-1.5 uppercase tracking-wider">
              Jina Kamili (Full Name)
            </label>
            <input 
              type="text" 
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-bold placeholder-slate-400 outline-none text-xs transition-all focus:ring-2 focus:ring-indigo-500"
              placeholder="mf. Abely Ntandu"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-800 block mb-1.5 uppercase tracking-wider">
              Jina la Kutumia (Username)
            </label>
            <input 
              type="text" 
              required
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-mono font-bold placeholder-slate-400 outline-none text-xs transition-all focus:ring-2 focus:ring-indigo-500"
              placeholder="mf. Ntandu"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-800 block mb-1.5 uppercase tracking-wider">
              Barua Pepe (Email Address)
            </label>
            <input 
              type="email" 
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-bold placeholder-slate-400 outline-none text-xs transition-all focus:ring-2 focus:ring-indigo-500"
              placeholder="ntandu@bot.go.tz"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-800 block mb-1.5 uppercase tracking-wider">
              Nenosiri la Muda (Temporary Password)
            </label>
            <input 
              type="password" 
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-bold placeholder-slate-400 outline-none text-xs transition-all focus:ring-2 focus:ring-indigo-500"
              placeholder="password"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-800 block mb-1.5 uppercase tracking-wider">
              Wadhifa (Role Type)
            </label>
            <select 
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="w-full p-3.5 rounded-2xl neo-inset text-slate-900 font-black outline-none text-xs transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500 [&>option]:bg-slate-100 [&>option]:text-slate-900"
            >
              <option value="OFFICER">OFFICER (Afisa Ukaguzi)</option>
              <option value="ADMIN">ADMIN (Msimamizi Mkuu)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all cursor-pointer shadow-lg mt-6 uppercase text-xs tracking-widest border border-indigo-700 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Inasajili...</span>
              </>
            ) : (
              '➕ Sajili Afisa (Submit)'
            )}
          </button>
        </form>
      </div>

      {/* 2. OFFICERS DIRECTORY LIST */}
      <div className="neo-card p-5 sm:p-7 space-y-6 flex flex-col shadow-2xl rounded-3xl border border-slate-300">
        <div className="border-b border-slate-300/80 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> <span>{t?.('officerList') || 'ORODHA YA MAAFISA'}</span>
            </h3>
            <p className="text-xs text-slate-600 font-bold mt-1">
              Simamia au ubadilishe uwezo wa maafisa wa kuingia kwenye mfumo.
            </p>
          </div>
          {loading && (
            <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
          )}
        </div>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin flex-1">
          {officers.map(off => (
            <div 
              key={off.officer_id} 
              className="p-4 rounded-2xl neo-inset border border-slate-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-inner"
            >
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm">{off.full_name}</h4>
                <p className="text-[11px] text-slate-600 font-mono font-bold break-all">
                  {off.email} <span className="text-indigo-600 font-black ml-1">({off.role})</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveDialog({ action: 'toggleAccess', officerId: off.officer_id })}
                className={`self-start sm:self-center px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-sm ${
                  off.is_active 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                }`}
              >
                {off.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}

          {!loading && officers.length === 0 && (
            <div className="h-full flex items-center justify-center py-16">
              <p className="text-slate-500 text-xs font-bold">Hakuna maafisa waliosajiliwa bado.</p>
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
