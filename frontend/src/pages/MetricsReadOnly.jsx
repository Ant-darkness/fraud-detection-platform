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
      const data = await api.models.getAll();
      const sortedModels = data.sort((a, b) => b.f1_score - a.f1_score);
      setModels(sortedModels);
    } catch (err) {
      showToast(err.message || "Imeshindikana kupata metrics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.version.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Kichwa cha Ukurasa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            {t('metricsTitle')}
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
            {t('metricsSub')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchModelPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2.5 pl-10 w-64 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[#D4AF37] outline-none text-xs transition-all"
          />
          <span className="absolute left-3 top-3 text-gray-500 text-xs">🔍</span>
        </div>
      </div>

      {/* Muonekano wa Juu (Top Performing Cards) */}
      {!loading && filteredModels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredModels.slice(0, 3).map((model, index) => (
            <div 
              key={model.id || model.model_id} 
              className={`p-6 rounded-3xl border backdrop-blur-xl relative overflow-hidden transition duration-300 hover:scale-[1.02] ${
                index === 0 
                  ? 'bg-yellow-500/5 border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.05)]' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="absolute top-4 right-4 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-white">
                #{index + 1} {t('bestBadge')}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white truncate">{model.name || model.model_name}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Toleo: v{model.version || model.model_version}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase">{t('f1ScoreText')}</p>
                  <p className="text-3xl font-black text-[#D4AF37]">{(model.f1_score * 100).toFixed(1)}%</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">{t('precisionText')}</p>
                    <p className="text-xs font-bold text-white">{(model.precision * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">{t('recallText')}</p>
                    <p className="text-xs font-bold text-white">{(model.recall * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">{t('status')}</p>
                    <span className={`text-[9px] font-bold ${model.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                      {model.is_active ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Jedwali Kuu (Main Glass Table) */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] text-gray-400 uppercase tracking-widest">
                <th className="p-5 font-semibold">{t('rank')}</th>
                <th className="p-5 font-semibold">{t('modelName')}</th>
                <th className="p-5 font-semibold text-center">{t('f1ScoreText')}</th>
                <th className="p-5 font-semibold text-center">{t('precisionText')}</th>
                <th className="p-5 font-semibold text-center">{t('recallText')}</th>
                <th className="p-5 font-semibold text-center">{t('accuracyText')}</th>
                <th className="p-5 font-semibold text-center">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
                      {t('loadingMetrics')}
                    </div>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500">
                    {t('noModelsFound')}
                  </td>
                </tr>
              ) : (
                filteredModels.map((model, index) => (
                  <tr key={model.id || model.model_id} className="hover:bg-white/5 transition duration-150 group">
                    <td className="p-5 font-black text-gray-500 group-hover:text-[#D4AF37] transition">
                      #{index + 1}
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-white">{model.name || model.model_name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Toleo: v{model.version || model.model_version}</div>
                    </td>
                    <td className="p-5 text-center font-extrabold text-[#D4AF37] text-sm">
                      {(model.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center font-semibold">
                      {(model.precision * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center font-semibold text-pink-400">
                      {(model.recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center text-gray-400">
                      {(model.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                        model.is_active 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                          : 'bg-white/5 text-gray-400 border border-white/5'
                      }`}>
                        {model.is_active ? t('active') : t('inactive')}
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
