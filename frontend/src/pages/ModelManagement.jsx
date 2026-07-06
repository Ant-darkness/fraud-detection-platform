import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

const ModelManagement = () => {
  const [models, setModels] = useState([]);
  const { token, officer } = useAuth();
  const isAdmin = officer?.role === 'ADMIN';

  const fetchModels = () => {
    fetch('http://localhost:8000/models/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setModels(Array.isArray(data) ? data : []))
      .catch(() => {
        setModels([
          { model_id: 1, model_name: 'AntDarkness-Ensemble', model_version: 'v2.1.0', model_description: 'LightGBM & Ridge Pipeline optimized for transaction bursts.', dataset_size: 550000, activation_status: 'ACTIVE', is_active: true },
          { model_id: 2, model_name: 'AntDarkness-LinearFallback', model_version: 'v1.4.2', model_description: 'Baseline Ridge Regression structural architecture.', dataset_size: 200000, activation_status: 'ARCHIVED', is_active: false }
        ]);
      });
  };

  useEffect(() => { fetchModels(); }, [token]);

  const handleReload = async () => {
    const res = await fetch('http://localhost:8000/models/reload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) alert("Active Engine reloaded across cluster safely.");
  };

  const handleActivate = async (id) => {
    if (!isAdmin) return;
    const res = await fetch(`http://localhost:8000/models/${id}/activate`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchModels();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Statistical Model Registry</h2>
          <p className="text-xs text-slate-400 font-mono">Orchestrate active model deployments dynamically onto the prediction engine pipelines.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleReload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 transition-all font-mono"
          >
            <RefreshCw className="h-4 w-4" /> Reload Hot Inference Engine
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {models.map(model => (
          <div 
            key={model.model_id} 
            className={`p-5 rounded-xl border transition-all ${
              model.is_active 
                ? 'bg-gradient-to-r from-slate-950 to-slate-900/60 border-amber-500/40 shadow-xl shadow-amber-500/5' 
                : 'bg-slate-950/30 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold font-mono text-slate-200 text-base">{model.model_name}</h3>
                  <span className="text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">
                    {model.model_version}
                  </span>
                  {model.is_active && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> ACTIVE PRODUCTION
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">{model.model_description}</p>
                <p className="text-[11px] text-slate-500 font-mono">Dataset Ingestion Matrix: <span className="text-slate-400">{model.dataset_size?.toLocaleString()} records</span></p>
              </div>

              {isAdmin && !model.is_active && (
                <button
                  onClick={() => handleActivate(model.model_id)}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-all"
                >
                  Promote to Active
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelManagement;
