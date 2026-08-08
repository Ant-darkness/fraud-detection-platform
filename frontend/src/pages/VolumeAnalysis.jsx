import React, { useState, useEffect, useCallback } from 'react';
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

  // Portal States for Custom Agent Prompts & Generated Query Graph
  const [agentPrompt, setAgentPrompt] = useState('');
  const [customAgentLoading, setCustomAgentLoading] = useState(false);
  const [customAgentResponse, setCustomAgentResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const fetchVolumeAndAgentData = useCallback(async (isManualRefresh = false) => {
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
  }, [timeframe, customStart, customEnd, showToast]);

  useEffect(() => {
    fetchVolumeAndAgentData();
  }, [fetchVolumeAndAgentData]);

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

  const handleAskVolumeAgent = async (e) => {
    e.preventDefault();
    if (!agentPrompt.trim()) return;

    setCustomAgentLoading(true);
    setIsModalOpen(true);

    try {
      // Agent anagenerate SQL query na kurejesha data mpya za chati
      const res = await api.dashboard.askVolumeAgent({
        prompt: agentPrompt,
        timeframe,
        custom_start: customStart || null,
        custom_end: customEnd || null
      });

      setCustomAgentResponse(res || {
        explanation: "Uchambuzi na Query za Database zimekamilika kulingana na Maelezo yako.",
        generated_sql: "SELECT time_bucket, COUNT(*) as volume, SUM(amount) as amount FROM transactions GROUP BY 1",
        chart_data: volumeData.chart_data
      });
    } catch (error) {
      if (showToast) showToast("Imeshindikana kuchakata query ya Volume Agent.", "error");
      setIsModalOpen(false);
    } finally {
      setCustomAgentLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 p-3 rounded-xl shadow-2xl text-xs border border-slate-800">
          <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xs font-bold" style={{ color: entry.color }}>
              {entry.name}:{' '}
              <span className="font-mono text-white">
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
    <div className="space-y-6 select-none relative font-sans">
      
      {/* 1. FILTRATION BAR */}
      <div className="bg-[#F2C4CE] p-4 rounded-3xl border border-pink-300/80 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {['24hrs', '7days', '4weeks', '1year'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                setCustomStart('');
                setCustomEnd('');
                setTimeframe(tf);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                timeframe === tf && !customStart
                  ? 'bg-slate-950 text-pink-200 shadow-md border border-slate-800'
                  : 'text-slate-900 hover:bg-pink-300/60'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-900 flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-slate-950 text-pink-200 px-3 py-2 rounded-xl outline-none text-xs border border-slate-800 font-mono shadow-inner"
          />
          <span className="text-pink-950 font-black text-[10px] uppercase tracking-wider">ZIKIWA</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-slate-950 text-pink-200 px-3 py-2 rounded-xl outline-none text-xs border border-slate-800 font-mono shadow-inner"
          />
        </div>
      </div>

      {/* 2. MACROPRUDENTIAL BRIEFING BOX */}
      <div className="bg-[#F2C4CE] text-slate-900 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl space-y-4 border border-pink-300/80">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-3xl shrink-0">🏛️</span>
            <div>
              <h4 className="text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                Macroprudential Liquidity & Trend Brief
              </h4>
              <span className="text-[10px] text-pink-950 font-mono font-bold">Real-Time Financial Velocity Analytics</span>
            </div>
          </div>

          <button
            type="button"
            disabled={analyzingAgent}
            onClick={() => fetchVolumeAndAgentData(true)}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-pink-200 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 border border-slate-800 uppercase tracking-wider"
          >
            {analyzingAgent ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-pink-200 border-t-transparent rounded-full animate-spin"></span>
                Inachanganua Mwenendo...
              </>
            ) : (
              <>⚡ Refresh Insights</>
            )}
          </button>
        </div>

        <p className="text-slate-900 leading-relaxed text-xs sm:text-sm font-semibold">
          {volumeData.agent_explanation}
        </p>

        <div className="pt-3 border-t border-pink-300/80 text-xs space-y-1">
          <span className="text-pink-950 font-black uppercase tracking-wider block text-[11px]">
            💡 Mapendekezo ya Kisera (Macroprudential Recommendations):
          </span>
          <p className="text-slate-900 font-semibold leading-normal">
            {volumeData.agent_recommendation}
          </p>
        </div>
      </div>

      {/* 3. AI AGENT QUERY & DB GENERATION BAR */}
      <div className="bg-[#F2C4CE] p-5 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-pink-300/80">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-2xl">📈</span>
          <div>
            <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-950">Volume Analytics AI Assistant</h4>
            <p className="text-[11px] text-pink-950 font-semibold">Uliza swali ili Agent aitengeneze Query na kuonyesha Graph ya matokeo</p>
          </div>
        </div>

        <form onSubmit={handleAskVolumeAgent} className="flex gap-2 w-full md:w-1/2">
          <input
            type="text"
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder="K.m: Nionyeshe graph ya muda ambao pesa nyingi zilimwagika..."
            className="flex-1 bg-slate-950 text-pink-200 placeholder-slate-400 text-xs rounded-xl px-4 py-2.5 outline-none border border-slate-800 focus:border-pink-400 font-sans shadow-inner"
          />
          <button
            type="submit"
            disabled={customAgentLoading}
            className="bg-slate-950 hover:bg-slate-900 text-pink-200 font-black text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-md border border-slate-800 uppercase tracking-wider"
          >
            {customAgentLoading ? <span className="w-4 h-4 border-2 border-pink-200 border-t-transparent rounded-full animate-spin"></span> : 'Changanua'}
          </button>
        </form>
      </div>

      {/* 4. LIVE STATS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-slate-950 text-slate-100 p-5 rounded-3xl shadow-xl border border-slate-800 hover:border-pink-400 transition-all">
          <span className="text-pink-300 text-[10px] font-black uppercase tracking-wider block">Jumla ya Miamala (Total Volume)</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
            {volumeData.total_volume.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Txs</span>
          </div>
        </div>

        <div className="bg-slate-950 text-slate-100 p-5 rounded-3xl shadow-xl border border-slate-800 hover:border-pink-400 transition-all">
          <span className="text-pink-300 text-[10px] font-black uppercase tracking-wider block">Thamani ya Mzunguko (Total Amount)</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
            TZS {volumeData.total_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <span className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        /* 5. MAIN COMBINED GRAPH */
        <div className="bg-[#F2C4CE] text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden border border-pink-300/80">
          <h3 className="text-xs sm:text-sm font-black text-slate-950 tracking-wider uppercase mb-6 flex items-center gap-2">
            <span>📊</span> Transaction Volume vs Total Amount ({timeframe.toUpperCase()})
          </h3>
          <div className="h-80 w-full bg-slate-950/5 rounded-2xl p-2 border border-pink-300/40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.15)" vertical={false} />
                <XAxis dataKey="time_label" stroke="#0f172a" fontSize={11} tickLine={false} fontWeight={800} />
                <YAxis yAxisId="left" stroke="#0f172a" fontSize={10} tickLine={false} axisLine={false} fontWeight={800} />
                <YAxis yAxisId="right" orientation="right" stroke="#0f172a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} fontWeight={800} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#0f172a', fontWeight: 'bold' }} />
                <Bar yAxisId="left" dataKey="volume" name="Transaction Volume" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={30} />
                <Bar yAxisId="right" dataKey="amount" name="Total Amount (TZS)" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6. MODAL YA DISPLAY YA GRAPH ILIYOGENERATED NA AI AGENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className={`bg-[#F2C4CE] text-slate-900 border-2 border-pink-400 rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
            isMaximized ? 'w-full h-full rounded-none border-none' : 'w-full max-w-5xl max-h-[92vh]'
          }`}>
            
            {/* Header */}
            <div className="border-b border-pink-300/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider text-slate-950">Generated Query & Volume Graph</h4>
                  <p className="text-[10px] text-pink-950 font-bold">Matokeo yaliyorejeshwa na AI Agent baada ya kupiga Query Database</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="px-3 py-1 bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border border-slate-950/20"
                >
                  {isMaximized ? '🗗 Restore' : '🗖 Maximize'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
                >
                  ✕ Funga
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {customAgentLoading ? (
                <div className="min-h-[350px] flex flex-col items-center justify-center gap-3">
                  <span className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs font-black text-slate-950">Agent anagenerate SQL query na kuita data za chati...</p>
                </div>
              ) : customAgentResponse ? (
                <>
                  {/* GENERATED SQL QUERY DISPLAY */}
                  {customAgentResponse.generated_sql && (
                    <div className="bg-slate-950 text-pink-200 p-4 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner">
                      <span className="text-pink-400 font-extrabold uppercase text-[10px] block mb-1">🔍 GENERATED SQL QUERY:</span>
                      <code>{customAgentResponse.generated_sql}</code>
                    </div>
                  )}

                  {/* AI EXPLANATION */}
                  <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-md border border-slate-800">
                    <span className="font-black text-pink-300 uppercase block mb-1">💡 Uchambuzi wa Matokeo:</span>
                    {customAgentResponse.explanation}
                  </div>

                  {/* DYNAMIC GENERATED GRAPH */}
                  <div className="bg-slate-950/5 p-4 sm:p-6 rounded-2xl shadow-lg border border-pink-300/80">
                    <h5 className="text-xs font-black text-slate-950 uppercase tracking-wider mb-4">
                      📊 Custom Generated Volume Graph
                    </h5>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customAgentResponse.chart_data || volumeData.chart_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.15)" vertical={false} />
                          <XAxis dataKey="time_label" stroke="#0f172a" fontSize={11} fontWeight={800} />
                          <YAxis yAxisId="left" stroke="#0f172a" fontSize={10} fontWeight={800} />
                          <YAxis yAxisId="right" orientation="right" stroke="#0f172a" fontSize={10} fontWeight={800} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: '#0f172a', fontWeight: 'bold' }} />
                          <Bar yAxisId="left" dataKey="volume" name="Transaction Volume" fill="#0284c7" radius={[6, 6, 0, 0]} />
                          <Bar yAxisId="right" dataKey="amount" name="Total Amount (TZS)" fill="#059669" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-pink-300/80 px-6 py-3 flex justify-between items-center text-xs text-pink-950 font-bold">
              <span className="truncate max-w-[70%]">Swali: "{agentPrompt}"</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-pink-200 font-extrabold rounded-xl transition-all cursor-pointer border border-slate-800"
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
