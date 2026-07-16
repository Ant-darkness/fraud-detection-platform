import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const ModelsRegistry = ({ showToast }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState(null); // { type, modelId }

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await api.models.getAll();
      setModels(data);
    } catch (error) {
      showToast("Imeshindikana kupata AI Models", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const triggerAction = (type, modelId) => {
    if (!modelId) {
      showToast("Hitilafu: ID ya model haipatikani!", "error");
      return;
    }
    setActiveDialog({ type, modelId });
  };

  const executeAction = async () => {
    const { type, modelId } = activeDialog;
    try {
      if (type === 'activate') {
        await api.models.activate(modelId);
        showToast("Model imefunguliwa na kuwa active kwenye production!", "success");
      } else if (type === 'deactivate') {
        await api.models.reject(modelId); // deactivation inafanyika kwa kuikataa/disable
        showToast("Model imeondolewa kwenye uzalishaji.", "success");
      } else if (type === 'delete') {
        await api.models.delete(modelId);
        showToast("Model imefutwa kabisa kwenye Registry.", "success");
      }
      
      // Reload list kutoka server
      await fetchModels();
    } catch (error) {
      showToast(`Imeshindikana kutekeleza operesheni ya ${type}.`, "error");
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
      {/* Metrics Leaderboard Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider">
            🏆 AI Model Performance Leaderboard
          </h3>
          <button 
            onClick={async () => {
              try {
                await api.models.reload();
                showToast("Models zote zimepakiwa upya kwenye RAM!", "success");
                fetchModels();
              } catch {
                showToast("Imeshindikana kureload model files.", "error");
              }
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            🔄 Reload Models
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 bg-white/5">
                <th className="py-4 px-6">Model</th>
                <th className="py-4 px-6">Model Version</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-200 divide-y divide-white/5">
              {models.map((m) => {
                // Kubaini ID ya model bila kujali kama ni `model_id` au `id` kutoka API
                const currentModelId = m.model_id || m.id;
                const modelName = m.model_name || m.name;
                const modelVersion = m.model_version || m.version;
                const isActive = m.is_active !== undefined ? m.is_active : m.active;

                return (
                  <tr key={currentModelId} className="hover:bg-white/5 transition-all">
                    <td className="py-4 px-6 font-bold text-white">
                      {modelName}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-400">
                      v{modelVersion}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        isActive 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
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
                        <button 
                          onClick={() => triggerAction('delete', currentModelId)}
                          disabled={isActive}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            isActive 
                              ? 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'
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
                  <td colSpan="4" className="py-8 text-center text-gray-500 text-sm">
                    Hakuna AI models zozote zilizosajiliwa hivi sasa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={activeDialog !== null}
        title="Usimamizi wa Model za AI"
        message="Je, una uhakika unataka kutekeleza mabadiliko haya katika uzalishaji (Production)? Hatua hii itaathiri mfumo mzima wa maamuzi ya kuzuia miamala."
        onConfirm={executeAction}
        onCancel={() => setActiveDialog(null)}
      />
    </div>
  );
};

export default ModelsRegistry;
s
