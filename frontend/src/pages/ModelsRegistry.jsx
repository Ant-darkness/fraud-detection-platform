import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const ModelsRegistry = ({ showToast }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await api.models.getAll();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("Imeshindikana kupata AI Models kutoka kwenye Registry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const triggerAction = (type, modelId) => {
    if (!modelId) {
      showToast(t('errId'), "error");
      return;
    }
    setActiveDialog({ type, modelId: Number(modelId) });
  };

  const executeAction = async () => {
    const { type, modelId } = activeDialog;
    try {
      if (type === 'activate') {
        await api.models.activate(modelId);
        showToast("Model imefunguliwa na kuwa active kwenye production!", "success");
      } else if (type === 'deactivate') {
        await api.models.reject(modelId);
        showToast("Model imeondolewa kwenye uzalishaji kwa ufanisi.", "success");
      } else if (type === 'delete') {
        await api.models.delete(modelId);
        showToast("Model na faili lake vimefutwa kabisa kwenye mfumo.", "success");
      }
      await fetchModels(); 
    } catch (error) {
      showToast(error.message || `Imeshindikana kutekeleza operesheni ya ${type}. Hakikisha wewe ni Admin.`, "error");
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
    <div className="space-y-8 animate-fadeIn">
      {/* FIXED MAREKEBISHO YA INSET NA Z-INDEX KUZUIA SIDEBAR KUKATA DIRISHA */}
      <div className={`transition-all duration-300 ${
        isMaximized 
          ? 'fixed inset-0 z-50 bg-[#020205]/98 border border-[#D4AF37]/40 backdrop-blur-3xl p-8 flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.9)]' 
          : 'bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden'
      }`}>
        
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>
        
        {/* KICHWA CHA UKURASA - BUTTON IPO MBELE YA JINA RASMI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider">
              {t('registryTitle')}
            </h3>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-[#D4AF37] text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
            >
              {isMaximized ? `🗗 ${t('btnMinimize')}` : t('btnMaximize')}
            </button>
          </div>
          
          <button 
            onClick={async () => {
              try {
                await api.models.reload();
                showToast("Models zote zimepakiwa upya kwenye RAM!", "success");
                fetchModels();
              } catch (err) {
                showToast("Imeshindikana kureload model files kwenye RAM.", "error");
              }
            }}
            className="px-4 py-2 bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold rounded-xl text-xs transition-all self-end sm:self-center cursor-pointer"
          >
            {t('btnReloadRAM')}
          </button>
        </div>

        {/* JEDWALI LA KISASA - SCROLLABLE BEHAVIOR */}
        <div className="overflow-x-auto grow border border-white/5 rounded-xl bg-black/20 scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 bg-white/5 uppercase tracking-wider font-semibold">
                <th className="py-4 px-6 w-[20%]">{t('modelName')}</th>
                <th className="py-4 px-6 w-[10%]">{t('thVersion')}</th>
                <th className="py-4 px-6 w-[32%]">{t('thDescription')}</th>
                <th className="py-4 px-6 w-[13%]">{t('thDataset')}</th>
                <th className="py-4 px-6 w-[12%]">{t('status')}</th>
                <th className="py-4 px-6 text-center w-[13%]">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-200 divide-y divide-white/5">
              {models.map((m) => {
                const currentModelId = m.model_id;
                const isActive = m.is_active;

                return (
                  <tr key={currentModelId} className={`transition-all hover:bg-white/5 ${isActive ? 'bg-green-500/5' : ''}`}>
                    <td className="py-4 px-6 font-bold text-white tracking-wide">
                      {m.model_name}
                    </td>
                    <td className="py-4 px-6 font-mono text-[#D4AF37] text-xs">
                      v{m.model_version}
                    </td>
                    <td className="py-4 px-6 text-gray-400 max-w-[280px]" title={m.model_description}>
                      <p className="truncate hover:text-white transition-colors duration-200 cursor-help">
                        {m.model_description || t('noDescription')}
                      </p>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-300">
                      {m.dataset_size ? Number(m.dataset_size).toLocaleString() : "N/A"} rows
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wider uppercase ${
                          isActive 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {isActive ? t('active') : t('inactive')}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono tracking-tight">
                          ({m.activation_status || "UNKNOWN"})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center gap-2">
                        {!isActive ? (
                          <button 
                            onClick={() => triggerAction('activate', currentModelId)}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold hover:bg-green-500 hover:text-white transition cursor-pointer"
                          >
                            Activate
                          </button>
                        ) : (
                          <button 
                            onClick={() => triggerAction('deactivate', currentModelId)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500 hover:text-white transition cursor-pointer"
                          >
                            Deactivate
                          </button>
                        )}
                        
                        {/* DELETE BUTTON - RANGI IMERESHESHWA VYEMA */}
                        <button 
                          onClick={() => triggerAction('delete', currentModelId)}
                          disabled={isActive}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isActive 
                              ? 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-not-allowed opacity-40' 
                              : 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white cursor-pointer'
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
                  <td colSpan="6" className="py-8 text-center text-gray-500 text-sm">
                    {t('registryEmpty')}
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
