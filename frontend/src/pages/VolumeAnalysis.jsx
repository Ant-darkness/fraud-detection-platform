import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const VolumeAnalysis = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [timeframe, setTimeframe] = useState('24hrs');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzingAgent, setAnalyzingAgent] = useState(false);
  
  const [volumeData, setVolumeData] = useState({
    total_volume: 0,
    total_amount: 0,
    chart_data: [],
    agent_explanation: "Uchambuzi wa kijiografia na mzunguko wa ukwasi unachakatwa na mfumo wa ufuatiliaji...",
    agent_recommendation: "Ushauri wa kisera na kisheria utatolewa kulingana na mabadiliko ya mzunguko wa fedha.",
    risk_level: "NORMAL"
  });

  // Portal States for Custom Agent Prompts
  const [agentPrompt, setAgentPrompt] = useState('');
  const [customAgentLoading, setCustomAgentLoading] = useState(false);
  const [customAgentResponse, setCustomAgentResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Load REST Data & Existing Liquidity Agent
  const fetchVolumeAndAgentData = async (isManualRefresh = false) => {
    if (isManualRefresh) setAnalyzingAgent(true);
    else setLoading(true);

    try {
      const queryParams = { 
        timeframe, 
        custom_start: customStart || null, 
        custom_end: customEnd || null 
      };

      const [volumeRes, agentRes] = await Promise.all([
        api.dashboard.getVolumeComparison(queryParams).catch(() => null),
        api.dashboard.getTrendAnalysisAgent(queryParams).catch(() => null)
      ]);

      const baseData = volumeRes || {};
      const agentData = agentRes || {};

      setVolumeData({
        total_volume: Number(baseData.total_volume) || Number(agentData.total_volume) || 0,
        total_amount: Number(baseData.total_amount) || Number(agentData.total_amount) || 0,
        chart_data: baseData.chart_data || agentData.chart_data || [],
        agent_explanation: agentData.agent_explanation || baseData.agent_explanation || "Uchambuzi wa mzunguko wa ukwasi unachakatwa na mfumo.",
        agent_recommendation: agentData.agent_recommendation || baseData.agent_recommendation || "Mfumo unaendelea kufanya ufuatiliaji wa vigezo vya kisera.",
        risk_level: agentData.risk_level || baseData.risk_level || "NORMAL"
      });

      if (isManualRefresh && showToast) {
        showToast("Mchanganuo mpya wa ukwasi na mwenendo wa miamala umekamilika!", "success");
      }
    } catch (error) {
      if (showToast) showToast(error.message || "Imeshindikana kupata data ya Mzunguko wa Miamala.", "error");
    } finally {
      setLoading(false);
      setAnalyzingAgent(false);
    }
  };

  useEffect(() => {
    fetchVolumeAndAgentData();
  }, [timeframe, customStart, customEnd]);

  // WebSocket Counter Live Updates
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;

    const { transaction } = lastMessage;
    if (!transaction) return;

    const addedAmount = Number(transaction.amount) || 0;

    setVolumeData((prev) => ({
      ...prev,
      total_volume: prev.total_volume + 1,
      total_amount: prev.total_amount + addedAmount
    }));
  }, [lastMessage]);

  // Handle Custom Agent Prompt Submission
  const handleAskVolumeAgent = async (e) => {
    e.preventDefault();
    if (!agentPrompt.trim()) return;

    setCustomAgentLoading(true);
    setIsModalOpen(true);

    try {
      const res = await api.dashboard.askVolumeAgent({
        prompt: agentPrompt,
        timeframe,
        custom_start: customStart || null,
        custom_end: customEnd || null
      });

      setCustomAgentResponse(res || {
        explanation: "Uchambuzi wa mzunguko wa fedha umekamilika kulingana na Maelezo yako.",
        chart_data: volumeData.chart_data
      });
    } catch (error) {
      if (showToast) showToast("Imeshindikana kupata maelezo ya Volume Agent.", "error");
      setIsModalOpen(false);
    } finally {
      setCustomAgentLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg font-sans">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xs font-bold" style={{ color: entry.color }}>
              {entry.name}:{' '}
              <span className="font-mono">
                {entry.name.includes('Amount') || entry.name.includes('Thamani')
                  ? `TZS ${Number(entry.value || 0).toLocaleString()}`
                  : `${Number(entry.value || 0).toLocaleString()} txs`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn relative font-sans">
      
      {/* 1. Filtration */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {['24hrs', '7days', '4weeks', '1year'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                setCustomStart('');
                setCustomEnd('');
                setTimeframe(tf);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf && !customStart
                  ? 'bg-amber-50 text-[#B8860B] border border-amber-300 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 border border-transparent'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-gray-700">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-gray-50 border border-gray-300 p-2 rounded-xl outline-none"
          />
          <span className="text-gray-400 font-bold uppercase text-[10px]">ZIKIWA</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-gray-50 border border-gray-300 p-2 rounded-xl outline-none"
          />
        </div>
      </div>

      {/* 2. Original Policy & Trend Briefing Box */}
      <div className="bg-amber-50/70 border border-amber-300 rounded-3xl p-6 relative overflow-hidden shadow-sm space-y-4">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#B8860B]"></div>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl shrink-0">🏛️</span>
            <div>
              <h4 className="text-[#B8860B] font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                Macroprudential Liquidity & Trend Brief
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">Real-Time Financial Velocity Analytics</span>
            </div>
          </div>

          <button
            type="button"
            disabled={analyzingAgent}
            onClick={() => fetchVolumeAndAgentData(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-[#B8860B] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
          >
            {analyzingAgent ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin"></span>
                Inachanganua Mwenendo...
              </>
            ) : (
              <>⚡ Refresh Insights</>
            )}
          </button>
        </div>

        <p className="text-gray-800 leading-relaxed text-sm font-medium pl-1">
          {volumeData.agent_explanation}
        </p>

        <div className="pt-3 border-t border-amber-200/60 text-xs text-gray-700 space-y-1 pl-1">
          <span className="text-emerald-700 font-bold uppercase tracking-wider block">
            💡 Mapendekezo ya Kisera (Macroprudential Recommendations):
          </span>
          <p className="text-gray-800 font-medium leading-normal">
            {volumeData.agent_recommendation}
          </p>
        </div>
      </div>

      {/* 3. AI Agent Query Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-2xl">📈</span>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-400">Volume Analytics AI Assistant</h4>
            <p className="text-[11px] text-gray-300">Uliza swali lolote kuhusu mzunguko wa fedha na idadi ya miamala</p>
          </div>
        </div>

        <form onSubmit={handleAskVolumeAgent} className="flex gap-2 w-full md:w-1/2">
          <input
            type="text"
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder="K.m: Nionyeshe muda ambao pesa nyingi zilimwagika leo..."
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={customAgentLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
          >
            {customAgentLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Changanua'}
          </button>
        </form>
      </div>

      {/* 4. Live Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-wider block">Jumla ya Miamala (Total Volume)</span>
          <div className="text-3xl font-black text-[#B8860B] mt-2 font-mono">
            {volumeData.total_volume.toLocaleString()} <span className="text-xs text-gray-400 font-normal">Txs</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-wider block">Thamani ya Mzunguko (Total Amount)</span>
          <div className="text-3xl font-black text-cyan-700 mt-2 font-mono">
            TZS {volumeData.total_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        /* 5. Combined Volume vs Amount Graph (Blue & Red/Cyan) */
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase mb-6 flex items-center gap-2">
            <span>📊</span> Transaction Volume vs Total Amount ({timeframe.toUpperCase()})
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="time_label" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#1d4ed8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="Transaction Volume" fill="#1d4ed8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar yAxisId="right" dataKey="amount" name="Total Amount (TZS)" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6. AI Agent Query Display Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
            isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[90vh]'
          }`}>
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📈</span>
                <h4 className="font-bold text-sm uppercase tracking-wider">Volume & Liquidity AI Insights</h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all text-xs"
                >
                  {isMaximized ? '🗗 Restore' : '🗖 Maximize'}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all text-xs font-bold"
                >
                  ✕ Funga
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {customAgentLoading ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
                  <span className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-sm font-bold text-gray-600">AI Agent inachanganua mzunguko wa fedha...</p>
                </div>
              ) : customAgentResponse ? (
                <>
                  <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl text-xs text-cyan-900 font-medium leading-relaxed">
                    <span className="font-bold uppercase block mb-1">💡 Uchambuzi wa AI Agent:</span>
                    {customAgentResponse.explanation}
                  </div>

                  <div className="h-80 w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={customAgentResponse.chart_data || volumeData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time_label" fontSize={11} />
                        <YAxis yAxisId="left" fontSize={10} />
                        <YAxis yAxisId="right" orientation="right" fontSize={10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="volume" name="Transaction Volume" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="amount" name="Total Amount (TZS)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>Maelezo: "{agentPrompt}"</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all"
              >
                ⬅️ Rudi Nyuma
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VolumeAnalysis;
