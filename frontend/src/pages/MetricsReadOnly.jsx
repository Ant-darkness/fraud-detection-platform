import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const formatPercent = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(1)}%`;
};

const MetricsReadOnly = ({ showToast, selectedModel, onBackToRegistry }) => {
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const fetchModelSpecificMetrics = useCallback(async () => {
    if (!selectedModel || !selectedModel.model_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Vuta metrics za model mahususi kutoka endpoint ya api.models.getMetrics
      const data = await api.models.getMetrics(selectedModel.model_id);
      setModelMetrics(data || null);
    } catch (err) {
      notify(err.message || "Imeshindikana kupata metrics za model hii.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedModel, notify]);

  useEffect(() => {
    fetchModelSpecificMetrics();
  }, [fetchModelSpecificMetrics]);

  return (
    <div className="space-y-6 font-sans select-none text-slate-900">
      
      {/* BUTTON YA KURUDI KWENYE MODELS REGISTRY */}
      {onBackToRegistry && (
        <button
          onClick={onBackToRegistry}
          className="px-5 py-2.5 bg-[#F2C4CE] hover:bg-pink-300 text-slate-950 text-xs font-black rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer border border-pink-400"
        >
          ⬅️ Rudi Kwenye Models Registry
        </button>
      )}

      {/* HEADER CARD YA BLUSH `#F2C4CE` YENYE DESCRIPTION YA MODEL */}
      {selectedModel ? (
        <div className="bg-[#F2C4CE] p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-pink-300 text-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pink-300/80 pb-4 mb-5">
            <div>
              <span className="text-[10px] font-black tracking-widest text-pink-950 uppercase">
                MODEL OPERATIONAL ANALYSIS & INSIGHTS
              </span>
              <h2 className="text-2xl font-black text-slate-950 mt-1">
                {selectedModel.model_name} <span className="text-pink-900 text-base font-mono">(v{selectedModel.model_version})</span>
              </h2>
            </div>
            
            <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${
              selectedModel.is_active 
                ? 'bg-emerald-600 text-white border-emerald-700' 
                : 'bg-rose-600 text-white border-rose-700'
            }`}>
              {selectedModel.is_active ? 'ACTIVE PRODUCTION' : 'INACTIVE'}
            </span>
          </div>

          {/* MODEL DESCRIPTION BOX */}
          <div className="bg-slate-950 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-inner">
            <h4 className="text-xs font-extrabold text-pink-300 mb-2 tracking-wider uppercase flex items-center gap-2">
              📝 AI Agent Detailed Description & Operational Notes:
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-200">
              {selectedModel.model_description || selectedModel.operational_notes || "Hakuna maelezo ya ziada yaliyotolewa kwa model hii."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#F2C4CE] p-6 rounded-3xl border border-pink-300 text-center font-bold text-pink-950">
          Tafadhali chagua Model kutoka kwenye Registry ili kuona Metrics na Description yake.
        </div>
      )}

      {/* METRICS DISPLAY SECTION */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <span className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        selectedModel && (
          <div className="bg-[#F2C4CE] p-6 sm:p-8 rounded-3xl border border-pink-300 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-pink-300/80 pb-3">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 flex items-center gap-2">
                📊 Model Evaluation Metrics Summary
              </h3>
              <span className="text-xs font-bold text-pink-950 font-mono">
                Model ID: #{selectedModel.model_id}
              </span>
            </div>

            {/* MAIN SCORE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center shadow-lg">
                <p className="text-[11px] uppercase font-bold text-pink-300 tracking-wider">F1-Score</p>
                <p className="text-3xl font-black text-pink-200 font-mono mt-1">
                  {formatPercent(modelMetrics?.f1_score ?? selectedModel?.f1_score)}
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center shadow-lg">
                <p className="text-[11px] uppercase font-bold text-pink-300 tracking-wider">Precision</p>
                <p className="text-3xl font-black text-white font-mono mt-1">
                  {formatPercent(modelMetrics?.precision_score ?? selectedModel?.precision_score)}
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center shadow-lg">
                <p className="text-[11px] uppercase font-bold text-pink-300 tracking-wider">Recall</p>
                <p className="text-3xl font-black text-white font-mono mt-1">
                  {formatPercent(modelMetrics?.recall_score ?? selectedModel?.recall_score)}
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center shadow-lg">
                <p className="text-[11px] uppercase font-bold text-pink-300 tracking-wider">ROC-AUC</p>
                <p className="text-3xl font-black text-pink-300 font-mono mt-1">
                  {formatPercent(modelMetrics?.roc_auc ?? selectedModel?.roc_auc)}
                </p>
              </div>
            </div>

            {/* EXTRA METRICS DETAILS TABLE IF AVAILABLE */}
            {modelMetrics && (
              <div className="bg-slate-950/10 p-4 rounded-2xl border border-pink-300/60 font-mono text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-pink-300/40">
                  <span className="font-bold text-slate-800">Evaluated Accuracy:</span>
                  <span className="font-black text-slate-950">{formatPercent(modelMetrics?.accuracy)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-pink-300/40">
                  <span className="font-bold text-slate-800">Log Loss:</span>
                  <span className="font-black text-slate-950">{modelMetrics?.log_loss ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-bold text-slate-800">Last Evaluated Timestamp:</span>
                  <span className="font-black text-slate-950">{modelMetrics?.updated_at || 'Recently Updated'}</span>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default MetricsReadOnly;
