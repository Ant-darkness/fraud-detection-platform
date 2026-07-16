import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const VolumeAnalysis = ({ showToast }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [volumeData, setVolumeData] = useState({
    today_volume: 0,
    today_amount: 0,
    yesterday_volume: 0,
    yesterday_amount: 0,
    agent_explanation: "Nafanya uchambuzi wa kiasi na thamani ya miamala iliyoingia..."
  });

  useEffect(() => {
    const fetchVolumeData = async () => {
      try {
        const data = await api.dashboard.getVolumeComparison();
        setVolumeData({
          today_volume: data.today_volume || 0,
          today_amount: data.today_amount || 0,
          yesterday_volume: data.yesterday_volume || 0,
          yesterday_amount: data.yesterday_amount || 0,
          agent_explanation: data.agent_explanation || "Hali ya kifedha ipo salama. Hakuna mienendo ya hatari iliyobainishwa."
        });
      } catch (error) {
        showToast("Imeshindikana kupata data ya Volume Analysis.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchVolumeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* High-Value Alert Box (Smart Agent Alert) */}
      <div className="bg-[#D4AF37]/10 border-2 border-[#D4AF37] rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h4 className="text-[#D4AF37] font-bold text-lg uppercase tracking-wide">
              Intelligence Warning Explanations
            </h4>
            <p className="mt-2 text-white leading-relaxed text-sm">
              {volumeData.agent_explanation}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Today's Stats */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-lg font-bold text-[#D4AF37] mb-4">📅 LEO (Today)</h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-400 block uppercase">Jumla ya Miamala (Volume)</span>
              <span className="text-3xl font-black text-white">{volumeData.today_volume}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase">Jumla ya Thamani (Amount)</span>
              <span className="text-3xl font-black text-green-400">
                TZS {volumeData.today_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Yesterday's Stats */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-lg font-bold text-gray-400 mb-4">🗓️ JANA (Yesterday)</h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-400 block uppercase">Jumla ya Miamala (Volume)</span>
              <span className="text-3xl font-black text-gray-300">{volumeData.yesterday_volume}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase">Jumla ya Thamani (Amount)</span>
              <span className="text-3xl font-black text-gray-300">
                TZS {volumeData.yesterday_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeAnalysis;
