import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const formatPercent = (val) => {
  if (typeof val !== 'number' || isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(1)}%`;
};

const MetricsReadOnly = ({ showToast, selectedModel, onBackToRegistry }) => {
  const [modelMetrics, setModelMetrics] = useState(null);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const fetchModelSpecificMetrics = useCallback(async () => {
    if (!selectedModel || !selectedModel.model_id) {
      return;
    }

    try {
      const data = await api.models.getMetrics(selectedModel.model_id);
      setModelMetrics(data || null);
    } catch (err) {
      notify(err.message || "Imeshindikana kupata metrics za model hii.", "error");
    }
  }, [selectedModel, notify]);

  useEffect(() => {
    fetchModelSpecificMetrics();
  }, [fetchModelSpecificMetrics]);

  return (
    <div className="space-y-6 font-sans select-none text-slate-800 max-w-7xl mx-auto px-2 sm:px-4">
      
      {/* BUTTON YA KURUDI KWENYE MODELS REGISTRY (NEO BUTTON STYLE) */}
      {onBackToRegistry && (
        <button
          type="button"
          onClick={onBackToRegistry}
          className="neo-button px-5 py-2.5 text-slate-800 text-xs font-black rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer border border-slate-300"
        >
          ⬅️ Rudi Kwenye Models Registry
        </button>
      )}

      {/* HEADER CARD YENYE NEOMORPHIC STYLE NA DESCRIPTION YA MODEL */}
      {selectedModel ? (
        <div className="neo-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-300 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300/80 pb-4 mb-5">
            <div>
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                MODEL OPERATIONAL ANALYSIS & INSIGHTS
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {selectedModel.model_name} <span className="text-indigo-600 text-base font-mono">(v{selectedModel.model_version})</span>
              </h2>
            </div>
            
            <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${
              selectedModel.is_active 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              {selectedModel.is_active ? 'ACTIVE PRODUCTION' : 'INACTIVE'}
            </span>
          </div>

          {/* MODEL DESCRIPTION BOX (NEO INSET STYLE) */}
          <div className="neo-inset p-5 rounded-2xl border border-slate-300/80">
            <h4 className="text-xs font-extrabold text-indigo-600 mb-2 tracking-wider uppercase flex items-center gap-2">
              📝 AI Agent Detailed Description & Operational Notes:
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-700">
              {selectedModel.model_description || selectedModel.operational_notes || "Hakuna maelezo ya ziada yaliyotolewa kwa model hii."}
            </p>
          </div>
        </div>
      ) : (
        <div className="neo-card p-6 rounded-3xl border border-slate-300 text-center font-bold text-slate-600">
          Tafadhali chagua Model kutoka kwenye Registry ili kuona Metrics na Description yake.
        </div>
      )}

      {/* METRICS DISPLAY SECTION */}
      {selectedModel && (
        <div className="neo-card p-6 sm:p-8 rounded-3xl border border-slate-300 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-300/80 pb-3">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              📊 Model Evaluation Metrics Summary
            </h3>
            <span className="text-xs font-bold text-slate-500 font-mono">
              Model ID: #{selectedModel.model_id}
            </span>
          </div>

          {/* MAIN METRICS SCORE CARDS (NEO-BUTTON / NEO-CARD STYLE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* F1-SCORE */}
            <div className="neo-button p-5 rounded-2xl border border-slate-300/80 text-center">
              <p className="text-[11px] uppercase font-bold text-indigo-600 tracking-wider">F1-Score</p>
              <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                {formatPercent(modelMetrics?.f1_score ?? selectedModel?.f1_score)}
              </p>
            </div>

            {/* PRECISION */}
            <div className="neo-button p-5 rounded-2xl border border-slate-300/80 text-center">
              <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Precision</p>
              <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                {formatPercent(modelMetrics?.precision_score ?? selectedModel?.precision_score)}
              </p>
            </div>

            {/* RECALL */}
            <div className="neo-button p-5 rounded-2xl border border-slate-300/80 text-center">
              <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Recall</p>
              <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                {formatPercent(modelMetrics?.recall_score ?? selectedModel?.recall_score)}
              </p>
            </div>

            {/* ROC-AUC */}
            <div className="neo-button p-5 rounded-2xl border border-slate-300/80 text-center">
              <p className="text-[11px] uppercase font-bold text-indigo-600 tracking-wider">ROC-AUC</p>
              <p className="text-3xl font-black text-indigo-700 font-mono mt-1">
                {formatPercent(modelMetrics?.roc_auc ?? selectedModel?.roc_auc)}
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsReadOnly;
