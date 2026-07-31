import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const MetricsReadOnly = ({ showToast }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State ya ku-maximize/minimize Ukurasa
  const [isMaximized, setIsMaximized] = useState(false);

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
    <div 
      className={`space-y-6 transition-all duration-300 font-sans ${
        isMaximized 
          ? 'fixed inset-2 md:inset-4 z-50 bg-[#0A192F] p-6 rounded-3xl overflow-y-auto shadow-2xl border border-blue-900/60 text-white' 
          : 'animate-fadeIn'
      }`}
    >
      {/* KICHWA CHA UKURASA - BUTTON IPO MBELE YA TITLE */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border shadow-sm ${
        isMaximized 
          ? 'bg-[#0B1E3A] border-blue-900/50' 
          : 'bg-white border-gray-200/80'
      }`}>
        <div>
          {/* DIV YA TITLE NA BUTTON PEMBENI YAKE */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={`text-xl font-black tracking-wider uppercase flex items-center gap-2 ${
              isMaximized ? 'text-white' : 'text-gray-900'
            }`}>
              📊 <span>AI Performance Leaderboard</span>
            </h1>

            {/* BUTTON IPO MBELE YA TITLE */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-sm border ${
                isMaximized 
                  ? 'bg-blue-600/30 border-blue-500/50 text-blue-200 hover:bg-blue-600 hover:text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
              }`}
              title={isMaximized ? "Restore Normal View" : "Maximize to Full Screen"}
            >
              {isMaximized ? '🗗 Minimize' : '⛶ Maximize'}
            </button>
          </div>

          <p className={`text-xs mt-1 font-medium ${
            isMaximized ? 'text-blue-300/70' : 'text-gray-500'
          }`}>
            Uchambuzi wa takwimu na ufanisi wa mifano yote ya ugunduzi wa miamala ya kitapeli.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Tafuta model au toleo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-2.5 pl-10 w-full rounded-xl border outline-none text-xs transition-all shadow-sm font-medium ${
              isMaximized 
                ? 'bg-[#0A192F] border-blue-800/60 text-white placeholder-blue-300/40 focus:border-blue-400' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#B8860B] focus:bg-white'
            }`}
          />
          <span className="absolute left-3.5 top-3 text-gray-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Sehemu ya Juu: Top 3 Model Performer Cards */}
      {!loading && filteredModels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredModels.slice(0, 3).map((model, index) => {
            const isGold = index === 0;
            const isSilver = index === 1;
            const isBronze = index === 2;

            return (
              <div 
                key={model.model_id} 
                className={`p-6 rounded-3xl border relative overflow-hidden transition-all duration-300 hover:shadow-md ${
                  isMaximized
                    ? isGold 
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-sm' 
                      : isSilver 
                      ? 'bg-slate-800/40 border-slate-600/50 shadow-sm'
                      : 'bg-orange-950/20 border-orange-500/40 shadow-sm'
                    : isGold 
                      ? 'bg-amber-50/80 border-amber-300 shadow-sm' 
                      : isSilver 
                      ? 'bg-slate-50/80 border-slate-300 shadow-sm'
                      : 'bg-orange-50/50 border-orange-200/80 shadow-sm'
                }`}
              >
                {/* Accent Top Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isGold ? 'bg-[#B8860B]' : isSilver ? 'bg-slate-400' : 'bg-amber-600'
                }`}></div>

                <div className="flex justify-between items-start mb-4 pt-1">
                  <div>
                    <h3 className={`text-base font-extrabold truncate max-w-[180px] ${
                      isMaximized ? 'text-white' : 'text-gray-900'
                    }`}>
                      {model.model_name}
                    </h3>
                    <p className={`text-[10px] font-mono font-bold mt-0.5 ${
                      isMaximized ? 'text-blue-300/70' : 'text-gray-500'
                    }`}>
                      v{model.model_version}
                    </p>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                    isGold 
                      ? 'bg-amber-100 border-amber-400 text-amber-900' 
                      : isSilver 
                      ? 'bg-slate-200 border-slate-400 text-slate-800'
                      : 'bg-orange-100 border-orange-300 text-orange-900'
                  }`}>
                    {isGold ? '🥇 GOLD' : isSilver ? '🥈 SILVER' : '🥉 BRONZE'}
                  </span>
                </div>

                <div className={`my-4 p-3 rounded-2xl border flex items-center justify-between ${
                  isMaximized ? 'bg-[#0B1E3A] border-blue-900/50' : 'bg-white/80 border-gray-200/60'
                }`}>
                  <div>
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${
                      isMaximized ? 'text-blue-300/70' : 'text-gray-500'
                    }`}>F1-Score (Uthabiti)</p>
                    <p className="text-3xl font-black text-[#B8860B]">{(model.f1_score * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      model.is_active 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {model.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/40 text-center">
                  <div className={`p-2 rounded-xl border ${
                    isMaximized ? 'bg-[#0A192F] border-blue-900/40' : 'bg-white/60 border-gray-200/40'
                  }`}>
                    <p className={`text-[9px] uppercase font-bold ${isMaximized ? 'text-blue-300/70' : 'text-gray-500'}`}>Precision</p>
                    <p className={`text-xs font-black font-mono ${isMaximized ? 'text-white' : 'text-gray-900'}`}>{(model.precision_score * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    isMaximized ? 'bg-[#0A192F] border-blue-900/40' : 'bg-white/60 border-gray-200/40'
                  }`}>
                    <p className={`text-[9px] uppercase font-bold ${isMaximized ? 'text-blue-300/70' : 'text-gray-500'}`}>Recall</p>
                    <p className={`text-xs font-black font-mono ${isMaximized ? 'text-white' : 'text-gray-900'}`}>{(model.recall_score * 100).toFixed(1)}%</p>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    isMaximized ? 'bg-[#0A192F] border-blue-900/40' : 'bg-white/60 border-gray-200/40'
                  }`}>
                    <p className={`text-[9px] uppercase font-bold ${isMaximized ? 'text-blue-300/70' : 'text-gray-500'}`}>ROC-AUC</p>
                    <p className="text-xs font-black text-blue-400 font-mono">{(model.roc_auc * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Jedwali Kuu (Main Table) */}
      <div className={`border rounded-3xl overflow-hidden shadow-sm ${
        isMaximized 
          ? 'bg-[#0B1E3A] border-blue-900/50' 
          : 'bg-white border-gray-200/80'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isMaximized ? 'bg-[#0A192F] border-blue-900/50' : 'bg-gray-50/50 border-gray-200/80'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            isMaximized ? 'text-blue-200' : 'text-gray-800'
          }`}>
            📋 Full Ranking Matrix
          </h3>
          <span className={`text-[11px] font-bold ${
            isMaximized ? 'text-blue-300/70' : 'text-gray-500'
          }`}>
            Jumla: <span className={isMaximized ? 'text-white' : 'text-gray-900'}>{filteredModels.length}</span> Models
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className={`border-b text-[10px] uppercase tracking-widest font-bold ${
                isMaximized 
                  ? 'border-blue-900/50 bg-[#0A192F]/60 text-blue-300' 
                  : 'border-gray-200 bg-gray-100/80 text-gray-600'
              }`}>
                <th className="p-4 px-6 w-[8%] text-center">Rank</th>
                <th className="p-4 px-6 w-[22%]">Model Info</th>
                <th className="p-4 px-6 text-center w-[12%]">F1-Score</th>
                <th className="p-4 px-6 text-center w-[12%]">Precision</th>
                <th className="p-4 px-6 text-center w-[12%]">Recall</th>
                <th className="p-4 px-6 text-center w-[12%]">ROC-AUC</th>
                <th className="p-4 px-6 text-center w-[12%]">Fraud Recall</th>
                <th className="p-4 px-6 text-center w-[10%]">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs font-sans ${
              isMaximized ? 'divide-blue-900/40 text-blue-100' : 'divide-gray-200 text-gray-800'
            }`}>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-3">
                      <span className="w-5 h-5 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin"></span>
                      Inapakia takwimu kutoka kwenye database...
                    </div>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-500 font-medium">
                    Hakuna takwimu zozote zilizopatikana kwenye metrics registry.
                  </td>
                </tr>
              ) : (
                filteredModels.map((model, index) => (
                  <tr 
                    key={model.model_id} 
                    className={`transition duration-150 ${
                      isMaximized
                        ? model.is_active ? 'bg-emerald-950/20 hover:bg-blue-900/30' : 'hover:bg-blue-900/20'
                        : model.is_active ? 'bg-emerald-50/30 hover:bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className={`p-4 px-6 text-center font-black font-mono ${
                      isMaximized ? 'text-blue-300/60' : 'text-gray-500'
                    }`}>
                      #{index + 1}
                    </td>
                    <td className="p-4 px-6">
                      <div className={`font-bold tracking-wide text-sm ${
                        isMaximized ? 'text-white' : 'text-gray-900'
                      }`}>{model.model_name}</div>
                      <div className="text-[10px] text-[#B8860B] font-mono font-bold mt-0.5">v{model.model_version}</div>
                    </td>
                    <td className="p-4 px-6 text-center font-extrabold text-[#B8860B] text-sm font-mono">
                      {(model.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className={`p-4 px-6 text-center font-bold font-mono ${
                      isMaximized ? 'text-blue-100' : 'text-gray-800'
                    }`}>
                      {(model.precision_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-4 px-6 text-center font-bold text-purple-400 font-mono">
                      {(model.recall_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-4 px-6 text-center text-blue-400 font-bold font-mono">
                      {(model.roc_auc * 100).toFixed(1)}%
                    </td>
                    <td className="p-4 px-6 text-center text-amber-500 font-bold font-mono">
                      {(model.fraud_recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border ${
                        model.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
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
