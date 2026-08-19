import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { FcElectronics, FcOk, FcHighPriority, FcDeleteDatabase, FcBarChart } from 'react-icons/fc';
import { HiOutlineRefresh, HiOutlineArrowsExpand } from 'react-icons/hi';

const ModelsRegistry = ({ showToast, onNavigateToMetrics }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [reloading, setReloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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

  const triggerAction = (type, model) => {
    if (!model || !model.model_id) {
      notify(t?.('errId') || "Model ID haijapatikana", "error");
      return;
    }
    setActiveDialog({ type, model });
  };

  const executeAction = async () => {
    if (!activeDialog || !activeDialog.model) return;
    const { type, model } = activeDialog;
    const modelId = Number(model.model_id);
    
    setActionLoading(true);
    try {
      if (type === 'activate') {
        await api.models.activate(modelId);
        notify(`Model '${model.model_name}' imefunguliwa na kuwa ACTIVE!`, "success");
      } else if (type === 'deactivate') {
        await api.models.reject(modelId);
        notify(`Model '${model.model_name}' imeondolewa kwenye uzalishaji.`, "success");
      } else if (type === 'delete') {
        await api.models.delete(modelId);
        notify(`Model '${model.model_name}' imefutwa kabisa kwenye mfumo.`, "success");
      }
      await fetchModels(); 
    } catch (error) {
      notify(error.message || `Imeshindikana kutekeleza operesheni ya ${type}.`, "error");
    } finally {
      setActionLoading(false);
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
    <div className="space-y-6 font-sans select-none max-w-7xl mx-auto px-2 sm:px-4 pb-10">
      
      {/* Neumorphic Confirmation Dialog with Target Model Details */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neo-card max-w-md w-full p-6 space-y-4 bg-slate-100 rounded-3xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 border-b border-slate-300/60 pb-3">
              {activeDialog.type === 'activate' && <FcOk className="text-3xl" />}
              {activeDialog.type === 'deactivate' && <FcHighPriority className="text-3xl" />}
              {activeDialog.type === 'delete' && <FcDeleteDatabase className="text-3xl" />}
              <div>
                <h4 className="font-black text-xs sm:text-sm uppercase text-slate-800">
                  {activeDialog.type === 'activate' ? 'Washa Model (Activate)' : activeDialog.type === 'deactivate' ? 'Ondoa Model (Deactivate)' : 'Futa Model (Delete)'}
                </h4>
                <span className="text-[10px] text-slate-500 font-mono font-bold">Registry Action Confirmation</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {activeDialog.type === 'activate' && 'Je, unathibitisha kuiwasha Model hii na kuifanya ianze kuhudumia maombi ya live prediction?'}
              {activeDialog.type === 'deactivate' && 'Je, unathibitisha kuiondoa Model hii kwenye uzalishaji (Production)?'}
              {activeDialog.type === 'delete' && 'Je, una uhakika unataka kuifuta kabisa Model hii pamoja na binary files zake? Hatua hii hairejeleki.'}
            </p>

            {/* Target Model Context Box */}
            <div className="neo-inset p-4 rounded-2xl space-y-2 text-xs font-mono bg-slate-50">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold">Model Name:</span>
                <span className="font-black text-slate-900">{activeDialog.model.model_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold">Version:</span>
                <span className="font-bold text-indigo-600">v{activeDialog.model.model_version}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold">Model ID:</span>
                <span className="font-bold text-slate-700">#{activeDialog.model.model_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Status ya Sasa:</span>
                <span className={`font-black ${activeDialog.model.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {activeDialog.model.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button" 
                disabled={actionLoading}
                onClick={() => setActiveDialog(null)} 
                className="neo-button px-4 py-2 text-xs font-bold rounded-xl text-slate-600 disabled:opacity-50"
              >
                Ghairi
              </button>
              <button 
                type="button" 
                disabled={actionLoading}
                onClick={executeAction} 
                className={`neo-button px-5 py-2 text-xs font-black rounded-xl flex items-center gap-2 ${
                  activeDialog.type === 'delete' ? 'text-rose-600' : activeDialog.type === 'activate' ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {actionLoading && <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>}
                Thibitisha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Registry Container */}
      <div className={`transition-all duration-300 neo-card p-5 sm:p-6 relative overflow-hidden ${
        isMaximized ? 'fixed inset-4 z-50 bg-slate-100 p-6 flex flex-col overflow-hidden rounded-3xl shadow-2xl border border-slate-300' : ''
      }`}>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5 pb-4 border-b border-slate-300/80">
          <div className="flex items-center gap-3 flex-wrap">
            <FcElectronics className="text-3xl" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                {t?.('registryTitle') || 'MODELS & METRICS MANAGEMENT'}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-bold">Centralized AI Model Registry & Lifecycle Controller</span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="neo-button px-3 py-1.5 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ml-2"
            >
              {isMaximized ? <><HiOutlineArrowsExpand /> MINIMIZE</> : <><HiOutlineArrowsExpand /> MAXIMIZE</>}
            </button>
          </div>
          
          <button 
            type="button"
            disabled={reloading}
            onClick={handleReloadRAM}
            className="neo-button text-indigo-600 font-black px-4 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider"
          >
            {reloading ? <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> : <HiOutlineRefresh className="text-base" />}
            {t?.('btnReloadRAM') || 'Reload Models in RAM'}
          </button>
        </div>

        {/* Models Table */}
        <div className="overflow-x-auto w-full neo-inset rounded-2xl border border-slate-300/70 shadow-inner">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-300 text-[11px] text-slate-700 uppercase tracking-wider font-black bg-slate-200/60 font-mono">
                <th className="py-3.5 px-4 w-[5%] text-center border-r border-slate-300">#</th>
                <th className="py-3.5 px-4 w-[35%] border-r border-slate-300">Model Name</th>
                <th className="py-3.5 px-4 w-[15%] border-r border-slate-300 text-center">Version</th>
                <th className="py-3.5 px-4 w-[15%] border-r border-slate-300 text-center">Status</th>
                <th className="py-3.5 px-4 w-[30%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-300/60 font-mono text-slate-800">
              {models.length > 0 ? (
                models.map((m, index) => {
                  const currentModelId = m.model_id;
                  const isActive = m.is_active;

                  return (
                    <tr key={currentModelId || index} className="transition-all hover:bg-slate-200/50">
                      <td className="py-3 px-4 text-center font-bold text-slate-500 border-r border-slate-300/60">{index + 1}</td>
                      <td className="py-3 px-4 font-black text-slate-900 border-r border-slate-300/60">{m.model_name}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600 text-center border-r border-slate-300/60">v{m.model_version}</td>
                      <td className="py-3 px-4 text-center border-r border-slate-300/60">
                        <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase ${
                          isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap justify-center items-center gap-2 font-sans">
                          <button
                            type="button"
                            onClick={() => onNavigateToMetrics && onNavigateToMetrics(m)}
                            className="neo-button px-3 py-1.5 text-indigo-600 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <FcBarChart className="text-base" /> Metrics
                          </button>

                          {!isActive ? (
                            <button 
                              type="button" 
                              onClick={() => triggerAction('activate', m)} 
                              className="neo-button px-3 py-1.5 text-emerald-600 text-[11px] font-black rounded-xl cursor-pointer"
                            >
                              Activate
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => triggerAction('deactivate', m)} 
                              className="neo-button px-3 py-1.5 text-amber-600 text-[11px] font-black rounded-xl cursor-pointer"
                            >
                              Deactivate
                            </button>
                          )}

                          <button 
                            type="button" 
                            onClick={() => triggerAction('delete', m)} 
                            disabled={isActive} 
                            className={`neo-button px-3 py-1.5 text-[11px] font-black rounded-xl ${
                              isActive ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-rose-600 cursor-pointer'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-bold font-sans">
                    Hakuna AI Models zozote zilizopatikana kwenye Registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelsRegistry;
