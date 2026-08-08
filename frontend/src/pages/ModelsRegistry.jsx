import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const ModelsRegistry = ({ showToast, onNavigateToMetrics }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.models.getAll();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      if (showToast) showToast(error.message || "Imeshindikana kupata AI Models kutoka kwenye Registry.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const triggerAction = (type, modelId) => {
    if (!modelId) {
      if (showToast) showToast(t('errId') || "Model ID haijapatikana", "error");
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
        if (showToast) showToast("Model imefunguliwa na kuwa active kwenye production!", "success");
      } else if (type === 'deactivate') {
        await api.models.reject(modelId);
        if (showToast) showToast("Model imeondolewa kwenye uzalishaji kwa ufanisi.", "success");
      } else if (type === 'delete') {
        await api.models.delete(modelId);
        if (showToast) showToast("Model na faili lake vimefutwa kabisa kwenye mfumo.", "success");
      }
      await fetchModels(); 
    } catch (error) {
      if (showToast) showToast(error.message || `Imeshindikana kutekeleza operesheni ya ${type}.`, "error");
    } finally {
      setActiveDialog(null);
    }
  };

  const handleReloadRAM = async () => {
    setReloading(true);
    try {
      await api.models.reload();
      if (showToast) showToast("Models zote zimepakiwa upya kwenye RAM!", "success");
      await fetchModels();
    } catch (err) {
      if (showToast) showToast(err.message || "Imeshindikana kureload model files kwenye RAM.", "error");
    } finally {
      setReloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`transition-all duration-300 shadow-2xl rounded-3xl p-6 relative overflow-hidden border border-pink-300/40 ${
        isMaximized 
          ? 'fixed inset-4 z-50 bg-[#F2C4CE] p-6 flex flex-col overflow-hidden rounded-3xl shadow-2xl border-2 border-pink-400' 
          : 'bg-[#F2C4CE] text-slate-900'
      }`}>
        
        {/* KICHWA CHA UKURASA */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-pink-300/60 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
              🛡️ {t('registryTitle') || 'MODELS & METRICS MANAGEMENT'}
            </h3>
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="px-3 py-1 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border border-slate-900/20"
            >
              {isMaximized ? '🗗 MINIMIZE' : '🗖 MAXIMIZE'}
            </button>
          </div>
          
          <button 
            type="button"
            disabled={reloading}
            onClick={handleReloadRAM}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-pink-200 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider border border-slate-800"
          >
            {reloading ? (
              <span className="w-3.5 h-3.5 border-2 border-pink-200 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              '🔄'
            )}
            {t('btnReloadRAM') || 'Reload Models in RAM'}
          </button>
        </div>

        {/* JEDWALI LA MODELS (BILA DESCRIPTION COLUMN) */}
        <div className="overflow-x-auto w-full rounded-2xl bg-slate-950/5 border border-pink-300/50 scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-pink-300/80 text-xs text-pink-950 uppercase tracking-wider font-extrabold bg-pink-300/30">
                <th className="py-4 px-5 w-[35%]">MODEL NAME</th>
                <th className="py-4 px-5 w-[20%]">VERSION</th>
                <th className="py-4 px-5 w-[20%]">STATUS</th>
                <th className="py-4 px-5 text-center w-[25%]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-pink-300/50 font-sans text-slate-900 font-medium">
              {models.map((m) => {
                const currentModelId = m.model_id;
                const isActive = m.is_active;

                return (
                  <tr key={currentModelId} className="transition-all hover:bg-pink-300/20">
                    <td className="py-4 px-5 font-black text-slate-950 text-sm">
                      {m.model_name}
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-pink-900 text-sm">
                      v{m.model_version}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border shadow-sm ${
                        isActive 
                          ? 'bg-emerald-600 text-white border-emerald-700' 
                          : 'bg-rose-600 text-white border-rose-700'
                      }`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap justify-center items-center gap-2">
                        {/* NAVIGATION TO METRICS WITH SAFE CHECK */}
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof onNavigateToMetrics === 'function') {
                              onNavigateToMetrics(m);
                            } else {
                              if (showToast) showToast("Metrics navigation handler missing.", "error");
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-pink-200 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 border border-slate-800"
                          title="Fungua Metrics na Description za Model hii"
                        >
                          📊 Metrics
                        </button>

                        {!isActive ? (
                          <button 
                            type="button"
                            onClick={() => triggerAction('activate', currentModelId)}
                            className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition cursor-pointer"
                          >
                            Activate
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => triggerAction('deactivate', currentModelId)}
                            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition cursor-pointer"
                          >
                            Deactivate
                          </button>
                        )}
                        
                        <button 
                          type="button"
                          onClick={() => triggerAction('delete', currentModelId)}
                          disabled={isActive}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                            isActive 
                              ? 'bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed opacity-60' 
                              : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow border-rose-700'
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {models.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-pink-950 text-xs font-bold">
                    Hakuna Model iliyopatikana kwenye Registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={activeDialog !== null}
        title={
          activeDialog?.type === 'activate' ? t('dialogActiveTitle') :
          activeDialog?.type === 'deactivate' ? t('dialogDeactiveTitle') : t('dialogDeleteTitle')
        }
        message={
          activeDialog?.type === 'activate' 
            ? t('dialogActiveMsg')
            : activeDialog?.type === 'deactivate'
            ? t('dialogDeactiveMsg')
            : t('dialogDeleteMsg')
        }
        onConfirm={executeAction}
        onCancel={() => setActiveDialog(null)}
      />
    </div>
  );
};

export default ModelsRegistry;
