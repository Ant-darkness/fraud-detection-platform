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

  // Custom Tooltip inayotambua kama tunaangazia Volume au Amount
  const CustomTooltip = ({ active, payload, label, unitType }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#020205]/95 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-2xl">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-sm font-black text-white">
            {payload[0].name}:{' '}
            <span className={unitType === 'money' ? 'text-cyan-400' : 'text-[#D4AF37]'}>
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
    <div className="space-y-8 animate-fadeIn relative">
      
      {/* 1. FILTRATION SYSTEM (Timeframe Selector) */}
      <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
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
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 bg-transparent border border-transparent'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Custom Range Picking */}
        <div className="flex items-center gap-3 text-xs">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-black/40 border border-white/10 text-white p-2 rounded-xl focus:border-[#D4AF37] outline-none transition-all"
          />
          <span className="text-gray-500 font-bold">ZIKIWA</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-black/40 border border-white/10 text-white p-2 rounded-xl focus:border-[#D4AF37] outline-none transition-all"
          />
        </div>
      </div>

      {/* 2. REAL AI POLICY AGENT BRIEFING BOX */}
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D4AF37]"></div>
        <div className="flex items-start gap-4">
          <span className="text-3xl shrink-0">🏛️</span>
          <div className="space-y-3">
            <h4 className="text-[#D4AF37] font-bold text-sm uppercase tracking-widest">
              Macroprudential Liquidity & Policy Oversight Brief
            </h4>
            <p className="text-gray-200 leading-relaxed text-sm font-medium">
              {volumeData.agent_explanation}
            </p>
            <div className="pt-3 border-t border-white/5 text-xs text-gray-400">
              <span className="text-emerald-400 font-bold uppercase tracking-wider block mb-1">Ushauri wa Kisera / Recommendations:</span> 
              {volumeData.agent_recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUMMARY STATS (KPI BLOCKS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider block">Jumla ya Miamala (Total Volume)</span>
          <div className="text-3xl font-black text-[#D4AF37] mt-2">
            {volumeData.total_volume.toLocaleString()} <span className="text-xs text-gray-500 font-normal">Txs</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider block">Thamani ya Mzunguko (Total Amount)</span>
          <div className="text-3xl font-black text-cyan-400 mt-2">
            TZS {volumeData.total_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        /* 4. DOUBLE GRAPH SYSTEM (TUMETENGANISHA VOLUME NA AMOUNT) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Grafu ya Kwanza: Volume Chart */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            <h3 className="text-xs font-black text-white tracking-widest uppercase mb-6">
              📊 Idadi ya Miamala (Volume Distribution)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="time_label" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unitType="volume" />} />
                  <Area type="monotone" dataKey="volume" name="Miamala" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafu ya Pili: Amount Chart */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
            <h3 className="text-xs font-black text-white tracking-widest uppercase mb-6">
              💰 Thamani ya Fedha (Financial Value Velocity)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="time_label" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(0)}M` : val.toLocaleString()} />
                  <Tooltip content={<CustomTooltip unitType="money" />} />
                  <Area type="monotone" dataKey="amount" name="Kiasi (TZS)" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorAmt)" />
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
