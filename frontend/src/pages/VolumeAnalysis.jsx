import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const VolumeAnalysis = ({ showToast }) => {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [volumeData, setVolumeData] = useState({
    total_volume: 0,
    total_amount: 0,
    chart_data: [],
    agent_explanation: "Nafanya uchambuzi wa kiuchumi na mzunguko wa ukwasi...",
    agent_recommendation: "Inapakia mapendekezo ya kisera..."
  });

  useEffect(() => {
    const fetchVolumeData = async () => {
      setLoading(true);
      try {
        // Tunasafiri na query params kwenda FastAPI backend
        const data = await api.dashboard.getVolumeComparison({ 
          timeframe, 
          custom_start: customStart || null, 
          custom_end: customEnd || null 
        });
        
        if (data) {
          setVolumeData({
            total_volume: Number(data.total_volume) || 0,
            total_amount: Number(data.total_amount) || 0,
            chart_data: data.chart_data || [],
            agent_explanation: data.agent_explanation || "Taarifa haikupatikana.",
            agent_recommendation: data.agent_recommendation || "Hakuna ushauri uliotolewa."
          });
        }
      } catch (error) {
        showToast("Imeshindikana kupata data ya Volume Analysis.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchVolumeData();
  }, [timeframe, customStart, customEnd]);

  // Custom Tooltip inayotambua kama tunaangazia Volume au Amount (Light Mode)
  const CustomTooltip = ({ active, payload, label, unitType }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg font-sans">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-sm font-black text-gray-900">
            {payload[0].name}:{' '}
            <span className={unitType === 'money' ? 'text-cyan-700' : 'text-[#B8860B]'}>
              {unitType === 'money' 
                ? `TZS ${Number(payload[0].value).toLocaleString()}` 
                : `${Number(payload[0].value).toLocaleString()} txs`}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn relative font-sans">
      
      {/* 1. FILTRATION SYSTEM (Light Corporate Timeframe Selector) */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {['24hrs', '7days', '4weeks', '1year'].map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setCustomStart('');
                setCustomEnd('');
                setTimeframe(tf);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                timeframe === tf && !customStart
                  ? 'bg-amber-50 text-[#B8860B] border border-amber-300 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent border border-transparent'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Custom Range Picking */}
        <div className="flex items-center gap-3 text-xs font-medium text-gray-700">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 p-2 rounded-xl focus:border-[#B8860B] focus:bg-white outline-none transition-all shadow-sm"
          />
          <span className="text-gray-400 font-bold uppercase text-[10px]">ZIKIWA</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 p-2 rounded-xl focus:border-[#B8860B] focus:bg-white outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* 2. REAL AI POLICY AGENT BRIEFING BOX (Light Gold Policy Box) */}
      <div className="bg-amber-50/70 border border-amber-300 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#B8860B]"></div>
        <div className="flex items-start gap-4">
          <span className="text-3xl shrink-0">🏛️</span>
          <div className="space-y-3">
            <h4 className="text-[#B8860B] font-bold text-sm uppercase tracking-widest">
              Macroprudential Liquidity & Policy Oversight Brief
            </h4>
            <p className="text-gray-800 leading-relaxed text-sm font-medium">
              {volumeData.agent_explanation}
            </p>
            <div className="pt-3 border-t border-amber-200/60 text-xs text-gray-600">
              <span className="text-emerald-700 font-bold uppercase tracking-wider block mb-1">Ushauri wa Kisera / Recommendations:</span> 
              {volumeData.agent_recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUMMARY STATS (Light Corporate KPI Blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-wider block">Jumla ya Miamala (Total Volume)</span>
          <div className="text-3xl font-black text-[#B8860B] mt-2">
            {volumeData.total_volume.toLocaleString()} <span className="text-xs text-gray-400 font-normal">Txs</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-wider block">Thamani ya Mzunguko (Total Amount)</span>
          <div className="text-3xl font-black text-cyan-700 mt-2">
            TZS {volumeData.total_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        /* 4. DOUBLE GRAPH SYSTEM (Light Mode Recharts) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Grafu ya Kwanza: Volume Chart */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase mb-6">
              📊 Idadi ya Miamala (Volume Distribution)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B8860B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#B8860B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="time_label" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unitType="volume" />} />
                  <Area type="monotone" dataKey="volume" name="Miamala" stroke="#B8860B" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafu ya Pili: Amount Chart */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase mb-6">
              💰 Thamani ya Fedha (Financial Value Velocity)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="time_label" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(0)}M` : val.toLocaleString()} />
                  <Tooltip content={<CustomTooltip unitType="money" />} />
                  <Area type="monotone" dataKey="amount" name="Kiasi (TZS)" stroke="#0891b2" strokeWidth={2} fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default VolumeAnalysis;
