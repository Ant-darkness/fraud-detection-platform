import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const ModelsRegistry = ({ showToast, onNavigateToMetrics }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [reloading, setReloading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const fetchModels = useCallback(async () => {
    try {
      const data = await api.models.getAll();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      notify(error.message || "Imeshindikana kupata AI Models kutoka kwenye Registry.", "error");
    }
  }, [notify]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const triggerAction = (type, modelId) => {
    if (!modelId) {
      notify(t?.('errId') || "Model ID haijapatikana", "error");
      return;
    }
    setActiveDialog({ type, modelId: Number(modelId) });
  };

  const executeAction = async () => {
    if (!activeDialog) return;
    const { type, modelId } = activeDialog;
    
    try {
      if (type === 'activate') {
        await api.models.activate(modelId);
        notify("Model imefunguliwa na kuwa active kwenye production!", "success");
      } else if (type === 'deactivate') {
        await api.models.reject(modelId);
        notify("Model imeondolewa kwenye uzalishaji kwa ufanisi.", "success");
      } else if (type === 'delete') {
        await api.models.delete(modelId);
        notify("Model na faili lake vimefutwa kabisa kwenye mfumo.", "success");
      }
      await fetchModels(); 
    } catch (error) {
      notify(error.message || `Imeshindikana kutekeleza operesheni ya ${type}.`, "error");
    } finally {
      setActiveDialog(null);
    }
  };

  const handleReloadRAM = async () => {
    setReloading(true);
    try {
      await api.models.reload();
      notify("Models zote zimepakiwa upya kwenye RAM!", "success");
      await fetchModels();
    } catch (err) {
      notify(err.message || "Imeshindikana kureload model files kwenye RAM.", "error");
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none max-w-7xl mx-auto px-2 sm:px-4">
      {/* Neo-morphism Confirmation Dialog */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neo-card max-w-md w-full p-6 space-y-4 bg-white rounded-3xl">
            <h4 className="font-black text-sm uppercase text-slate-800">
              {activeDialog.type === 'activate' ? 'Washa Model (Activate)' : activeDialog.type === 'deactivate' ? 'Ondoa Model (Deactivate)' : 'Futa Model (Delete)'}
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {activeDialog.type === 'activate' ? 'Je, una uhakika unataka kuiwasha model hii na kuifanya iwe active kwenye production?' : activeDialog.type === 'deactivate' ? 'Je, una uhakika unataka kuiondoa model hii kwenye uzalishaji?' : 'Je, una uhakika unataka kuifuta kabisa model hii?'}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setActiveDialog(null)} className="neo-button px-4 py-2 text-xs font-bold rounded-xl">Ghairi</button>
              <button type="button" onClick={executeAction} className="neo-button px-5 py-2 text-indigo-600 font-black text-xs rounded-xl">Thibitisha</button>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-300 neo-card p-5 sm:p-6 relative overflow-hidden ${
        isMaximized ? 'fixed inset-4 z-50 bg-slate-100 p-6 flex flex-col overflow-hidden rounded-3xl shadow-2xl border border-slate-300' : ''
      }`}>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5 pb-4 border-b border-slate-300/80">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              🛡️ {t?.('registryTitle') || 'MODELS & METRICS MANAGEMENT'}
            </h3>
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="neo-button px-3 py-1.5 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
            >
              {isMaximized ? '🗗 MINIMIZE' : '🗖 MAXIMIZE'}
            </button>
          </div>
          
          <button 
            type="button"
            disabled={reloading}
            onClick={handleReloadRAM}
            className="neo-button text-indigo-600 font-black px-4 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider"
          >
            {reloading ? <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> : '🔄'}
            {t?.('btnReloadRAM') || 'Reload Models in RAM'}
          </button>
        </div>

        <div className="overflow-x-auto w-full neo-inset rounded-2xl border border-slate-300/70 shadow-inner">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-300 text-[11px] text-slate-700 uppercase tracking-wider font-black bg-slate-200/60">
                <th className="py-3.5 px-4 w-[5%] text-center border-r border-slate-300">#</th>
                <th className="py-3.5 px-4 w-[35%] border-r border-slate-300">MODEL NAME</th>
                <th className="py-3.5 px-4 w-[15%] border-r border-slate-300 text-center">VERSION</th>
                <th className="py-3.5 px-4 w-[15%] border-r border-slate-300 text-center">STATUS</th>
                <th className="py-3.5 px-4 w-[30%] text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-300/60 font-sans text-slate-800">
              {models.map((m, index) => {
                const currentModelId = m.model_id;
                const isActive = m.is_active;

                return (
                  <tr key={currentModelId} className="transition-all hover:bg-slate-200/50">
                    <td className="py-3 px-4 text-center font-bold text-slate-500 border-r border-slate-300/60">{index + 1}</td>
                    <td className="py-3 px-4 font-black text-slate-900 border-r border-slate-300/60">{m.model_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-center border-r border-slate-300/60">v{m.model_version}</td>
                    <td className="py-3 px-4 text-center border-r border-slate-300/60">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm border ${
                        isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap justify-center items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigateToMetrics && onNavigateToMetrics(m)}
                          className="neo-button px-3 py-1.5 text-indigo-600 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          📊 Metrics
                        </button>
                        {!isActive ? (
                          <button type="button" onClick={() => triggerAction('activate', currentModelId)} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black shadow cursor-pointer">Activate</button>
                        ) : (
                          <button type="button" onClick={() => triggerAction('deactivate', currentModelId)} className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-900 text-[11px] font-black shadow cursor-pointer">Deactivate</button>
                        )}
                        <button type="button" onClick={() => triggerAction('delete', currentModelId)} disabled={isActive} className={`px-3 py-1.5 rounded-xl text-[11px] font-black ${isActive ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-600 text-white cursor-pointer shadow'}`}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelsRegistry;
