import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const MetricsReadOnly = ({ showToast }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // MAREKEBISHO: Sasa tunavuta moja kwa moja kutoka kwenye endpoint sahihi ya Leaderboard
      const data = await api.metrics.getLeaderboard();
      // Data inakuja tayari ikiwa sorted toka backend kwa f1_score, lakini tunaweka uhakiki wa ziada hapa
      const sortedModels = Array.isArray(data) ? data.sort((a, b) => b.f1_score - a.f1_score) : [];
      setModels(sortedModels);
    } catch (err) {
      showToast(err.message || "Imeshindikana kupata metrics kutoka kwenye Leaderboard.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Filter inafanya kazi kwa herufi kubwa au ndogo kwenye jina au toleo la model
  const filteredModels = (models || []).filter(model => {
    const modelName = model?.model_name ? model.model_name.toLowerCase() : '';
    const modelVersion = model?.model_version ? model.model_version.toString().toLowerCase() : '';
    const search = searchQuery ? searchQuery.toLowerCase() : '';
  
    return modelName.includes(search) || modelVersion.includes(search);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Kichwa cha Ukurasa & Sehemu ya Kutafuta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            📊 AI Performance Leaderboard
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
            Uchambuzi wa takwimu na ufanisi wa mifano yote ya ugunduzi wa miamala ya kitapeli.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tafuta model au toleo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2.5 pl-10 w-64 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-xs transition-all"
          />
          <span className="absolute left-3 top-3 text-gray-500 text-xs">🔍</span>
        </div>
      </div>

      {/* Sehemu ya Juu: Top 3 Model Performer Cards */}
      {!loading && filteredModels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredModels.slice(0, 3).map((model, index) => (
            <div 
              key={model.model_id} 
              className={`p-6 rounded-3xl border backdrop-blur-xl relative overflow-hidden transition duration-300 hover:scale-[1.02] ${
                index === 0 
                  ? 'bg-yellow-500/5 border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.05)]' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="absolute top-4 right-4 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-white">
                #{index + 1} {t('bestBadge') || 'BEST'}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white truncate">{model.model_name}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Toleo: v{model.model_version}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase">F1-Score (Uthabiti)</p>
                  <p className="text-3xl font-black text-[#D4AF37]">{(model.f1_score * 100).toFixed(1)}%</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">Precision</p>
                    <p className="text-xs font-bold text-white">{(model.precision_score * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">Recall</p>
                    <p className="text-xs font-bold text-white">{(model.recall_score * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">Status</p>
                    <span className={`text-[10px] font-black tracking-wider uppercase block ${model.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                      {model.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Jedwali Kuu (Main Adaptive Glass Table) */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-2xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
          {/* min-w-[1100px] inazuia kubanana kwa namba kwenye screen ndogo */}
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] text-gray-400 uppercase tracking-widest">
                <th className="p-5 font-semibold w-[8%]">Rank</th>
                <th className="p-5 font-semibold w-[22%]">Model Info</th>
                <th className="p-5 font-semibold text-center w-[12%]">F1-Score</th>
                <th className="p-5 font-semibold text-center w-[12%]">Precision</th>
                <th className="p-5 font-semibold text-center w-[12%]">Recall</th>
                <th className="p-5 font-semibold text-center w-[12%]">ROC-AUC</th>
                <th className="p-5 font-semibold text-center w-[12%]">Fraud Recall</th>
                <th className="p-5 font-semibold text-center w-[10%]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
                      Inapakia takwimu kutoka kwenye database...
                    </div>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-gray-500">
                    Hakuna takwimu zozote zilizopatikana kwenye metrics registry.
                  </td>
                </tr>
              ) : (
                filteredModels.map((model, index) => (
                  <tr key={model.model_id} className={`hover:bg-white/5 transition duration-150 group ${model.is_active ? 'bg-green-500/5' : ''}`}>
                    <td className="p-5 font-black text-gray-500 group-hover:text-[#D4AF37] transition">
                      #{index + 1}
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-white tracking-wide">{model.model_name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Toleo la Mfumo: v{model.model_version}</div>
                    </td>
                    <td className="p-5 text-center font-extrabold text-[#D4AF37] text-sm">
                      {(model.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center font-semibold text-gray-200">
                      {(model.precision_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center font-semibold text-pink-400">
                      {(model.recall_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center text-blue-400 font-mono">
                      {(model.roc_auc * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center text-amber-400 font-medium">
                      {(model.fraud_recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${
                        model.is_active 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                          : 'bg-white/5 text-gray-500 border border-white/5'
                      }`}>
                        {model.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MetricsReadOnly;
