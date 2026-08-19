import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FcLineChart, FcDataSheet, FcMoneyTransfer } from 'react-icons/fc';
import { HiOutlineSearch } from 'react-icons/hi';

const VolumeAnalysis = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [timeframe, setTimeframe] = useState('24HRS');
  const [loadingData, setLoadingData] = useState(false);
  const [analyzingAgent, setAnalyzingAgent] = useState(false);
  
  const [volumeData, setVolumeData] = useState({
    total_volume: 0,
    total_amount: 0,
    chart_data: [],
    agent_explanation: "Uchambuzi wa mzunguko wa ukwasi unachakatwa...",
    agent_recommendation: "Ushauri wa kisera utatolewa kulingana na mabadiliko.",
    risk_level: "NORMAL"
  });

  // Query Agent States
  const [agentPrompt, setAgentPrompt] = useState('');
  const [customAgentLoading, setCustomAgentLoading] = useState(false);
  const [customAgentResponse, setCustomAgentResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('table'); 

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const fetchVolumeAndAgentData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setAnalyzingAgent(true);
    else setLoadingData(true);

    try {
      const queryParams = { timeframe };

      const [volumeRes, agentRes] = await Promise.all([
        api.dashboard.getVolumeComparison(queryParams).catch(() => null),
        api.dashboard.getVolumeAnalyticsAgent(timeframe, "sw").catch(() => null)
      ]);

      const baseData = volumeRes || {};
      const agentData = agentRes || {};

      setVolumeData({
        total_volume: Number(baseData.total_volume) || Number(agentData.total_volume) || 0,
        total_amount: Number(baseData.total_amount) || Number(agentData.total_amount) || 0,
        chart_data: baseData.chart_data || agentData.chart_data || [],
        agent_explanation: agentData.agent_explanation || baseData.agent_explanation || "Uchambuzi wa mzunguko wa ukwasi unachakatwa.",
        agent_recommendation: agentData.agent_recommendation || baseData.agent_recommendation || "Ufuatiliaji wa vigezo unaendelea.",
        risk_level: agentData.risk_level || baseData.risk_level || "NORMAL"
      });

      if (isManualRefresh) {
        notify("Mchanganuo mpya wa ukwasi umekamilika!", "success");
      }
    } catch (error) {
      notify(error.message || "Imeshindikana kupata data ya Mzunguko.", "error");
    } finally {
      setLoadingData(false);
      setAnalyzingAgent(false);
    }
  }, [timeframe, notify]);

  useEffect(() => {
    fetchVolumeAndAgentData();
  }, [fetchVolumeAndAgentData]);

  // LIVE STREAMING VIA WEBSOCKET (NO REQUEST SENT)
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;
    const { transaction } = lastMessage;
    if (!transaction) return;

    setVolumeData((prev) => ({
      ...prev,
      total_volume: prev.total_volume + 1,
      total_amount: prev.total_amount + (Number(transaction.amount) || 0)
    }));
  }, [lastMessage]);

  const handlePreSubmit = (e) => {
    if (e) e.preventDefault();
    if (!agentPrompt.trim()) {
      notify("Tafadhali andika swali kabla ya kutuma.", "warning");
      return;
    }
    setShowConfirmModal(true);
  };

  // QUERY AGENT EXECUTION (SINGLE REQUEST EXCEPTION)
  const executeVolumeAgent = async () => {
    setShowConfirmModal(false);
    setCustomAgentLoading(true);
    setIsModalOpen(true);
    setCurrentPage(1);

    try {
      const res = await api.agents.askScopedAgent(agentPrompt, "volume");
      setCustomAgentResponse(res);
      notify("Uchambuzi wa Volume Query umekamilika kikamilifu!", "success");
    } catch (error) {
      notify(error.message || "Imeshindikana kuchakata query ya Volume Agent.", "error");
    } finally {
      setCustomAgentLoading(false);
    }
  };

  const childPageItems = useMemo(() => {
    if (!customAgentResponse) return [];
    if (Array.isArray(customAgentResponse.items)) return customAgentResponse.items;
    if (Array.isArray(customAgentResponse.data)) return customAgentResponse.data;
    if (Array.isArray(customAgentResponse)) return customAgentResponse;
    return [];
  }, [customAgentResponse]);

  const childGraphConfig = useMemo(() => {
    if (!childPageItems || childPageItems.length === 0) return null;

    const sample = childPageItems[0];
    const keys = Object.keys(sample);

    const xAxisKey = keys.find(k => 
      ['time_label', 'date', 'month', 'year', 'category', 'time', 'created_at', 'day'].includes(k.toLowerCase())
    ) || keys.find(k => typeof sample[k] === 'string') || keys[0];

    const numericKeys = keys.filter(k => {
      const val = sample[k];
      return k !== xAxisKey && (typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null));
    });

    const volumeKey = numericKeys.find(k => k.toLowerCase().includes('volume') || k.toLowerCase().includes('count') || k.toLowerCase().includes('tx')) || numericKeys[0];
    const amountKey = numericKeys.find(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('total') || k.toLowerCase().includes('val') || k.toLowerCase().includes('balance')) || numericKeys[1];

    return {
      xAxisKey,
      volumeKey,
      amountKey,
      data: childPageItems
    };
  }, [childPageItems]);

  const totalPages = Math.max(1, Math.ceil(childPageItems.length / pageSize));
  const paginatedChildItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return childPageItems.slice(startIdx, startIdx + pageSize);
  }, [childPageItems, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* 1. Filtration Bar */}
      <div className="neo-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {['24HRS', '7DAYS', '4WEEKS', '1YEAR'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                timeframe === tf ? 'neo-button-active text-indigo-600' : 'neo-button text-slate-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {loadingData && (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
            <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            <span>Inasawazisha Takwimu...</span>
          </div>
        )}
      </div>

      {/* 2. Macroprudential Liquidity Brief */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <FcLineChart className="text-3xl" />
            <div>
              <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800">
                Macroprudential Liquidity & Volume Agent
              </h4>
              <span className="text-[10px] text-slate-500 font-mono font-bold">Real-Time Financial Velocity Analytics</span>
            </div>
          </div>

          <button
            type="button"
            disabled={analyzingAgent}
            onClick={() => fetchVolumeAndAgentData(true)}
            className="neo-button text-indigo-600 font-black text-xs px-4 py-2 rounded-2xl flex items-center gap-2 cursor-pointer uppercase"
          >
            {analyzingAgent ? 'Inachanganua...' : '⚡ Refresh Insights'}
          </button>
        </div>

        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm font-semibold">
          {volumeData.agent_explanation}
        </p>

        <div className="pt-3 border-t border-slate-300/40 text-xs space-y-1">
          <span className="text-indigo-600 font-black uppercase text-[10px]">
            💡 Mapendekezo ya Kisera (Macroprudential Recommendations):
          </span>
          <p className="text-slate-800 font-semibold">{volumeData.agent_recommendation}</p>
        </div>
      </div>

      {/* 3. Query Agent Portal */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FcDataSheet className="text-3xl" />
          <div>
            <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800">
              Volume Forensic Query Agent
            </h4>
            <p className="text-xs text-slate-500 font-bold">
              Uliza swali ili Agent aitafute data na kukufungulia Child Page Terminal Window
            </p>
          </div>
        </div>

        <form onSubmit={handlePreSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder="Mfano: Nionyeshe miamala iliyovuka TZS 50,000,000 wiki hii..."
            className="flex-1 neo-inset text-slate-800 placeholder-slate-400 text-xs rounded-2xl px-5 py-3.5 outline-none font-sans"
          />
          <button
            type="submit"
            disabled={customAgentLoading}
            className="neo-button text-indigo-600 font-black text-xs px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shrink-0 uppercase tracking-wider"
          >
            {customAgentLoading ? (
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <><HiOutlineSearch className="text-base" /> Submit</>
            )}
          </button>
        </form>
      </div>

      {/* 4. Live Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="neo-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Jumla ya Miamala (Total Volume)</span>
            <FcDataSheet className="text-2xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 font-mono">
            {volumeData.total_volume.toLocaleString()} <span className="text-xs text-slate-500">Txs</span>
          </div>
        </div>

        <div className="neo-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Thamani ya Mzunguko (Total Amount)</span>
            <FcMoneyTransfer className="text-2xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 font-mono">
            TZS {volumeData.total_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 5. Main Chart */}
      <div className="neo-card p-6 space-y-4">
        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <FcLineChart className="text-xl" /> Transaction Volume vs Total Amount ({timeframe})
        </h3>
        <div className="h-80 w-full pt-2 neo-inset p-4 rounded-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="time_label" stroke="#475569" fontSize={11} tickLine={false} fontWeight={800} />
              <YAxis yAxisId="left" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontWeight={800} />
              <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} fontWeight={800} />
              <Tooltip />
              <Legend wrapperStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
              <Bar yAxisId="left" dataKey="volume" name="Transaction Volume" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar yAxisId="right" dataKey="amount" name="Total Amount (TZS)" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neo-card max-w-md w-full p-6 space-y-4 bg-white rounded-3xl">
            <div className="flex items-center gap-3">
              <FcDataSheet className="text-3xl" />
              <h4 className="font-black text-sm uppercase text-slate-800">Thibitisha Swali la Volume Analysis</h4>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Unakaribia kumtuma Volume Agent kutafuta data kwa ajili ya swali:
            </p>
            <div className="neo-inset p-3 rounded-xl text-xs font-bold text-indigo-900 bg-indigo-50/50 font-mono">
              "{agentPrompt}"
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowConfirmModal(false)} className="neo-button px-4 py-2 text-xs font-bold rounded-xl">Ghairi</button>
              <button type="button" onClick={executeVolumeAgent} className="neo-button px-5 py-2 text-indigo-600 font-black text-xs rounded-xl">Thibitisha</button>
            </div>
          </div>
        </div>
      )}

      {/* Child Page Terminal Window */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className={`neo-card transition-all duration-300 overflow-hidden flex flex-col ${
            isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh] rounded-3xl'
          }`}>
            <div className="p-4 sm:p-5 border-b border-slate-300/60 flex items-center justify-between shrink-0 bg-slate-100/50">
              <div className="flex items-center gap-3">
                <FcDataSheet className="text-2xl" />
                <div>
                  <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800">
                    {customAgentResponse?.title || `Result Terminal: "${agentPrompt}"`}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Child Page Forensic View | Total Items Found: {childPageItems.length.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsMaximized(!isMaximized)} className="neo-button px-3 py-1.5 text-slate-700 rounded-xl text-xs font-black uppercase">
                  {isMaximized ? 'Punguza' : 'Enua Window'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="neo-button px-3 py-1.5 text-rose-600 rounded-xl text-xs font-black">
                  ✕ Funga
                </button>
              </div>
            </div>

            <div className="flex border-b border-slate-300/60 px-6 bg-slate-900 text-slate-200 text-xs font-black shrink-0">
              <button type="button" onClick={() => setActiveTab('table')} className={`py-3 px-4 border-b-2 transition-all ${activeTab === 'table' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-400'}`}>
                📋 Data Table View ({childPageItems.length})
              </button>
              <button type="button" onClick={() => setActiveTab('graph')} className={`py-3 px-4 border-b-2 transition-all ${activeTab === 'graph' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-400'}`}>
                📊 Custom Query Graph
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 flex flex-col min-h-0">
              {customAgentLoading ? (
                <div className="min-h-[350px] flex flex-col items-center justify-center gap-3 my-auto">
                  <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs font-bold text-slate-700">Inatekeleza Read-Only Query kwenye Database na kuleta Table Data...</p>
                </div>
              ) : customAgentResponse ? (
                <>
                  {activeTab === 'table' && (
                    <div className="flex-1 flex flex-col min-h-0 space-y-3">
                      <div className="w-full bg-slate-950 text-slate-100 rounded-2xl overflow-auto flex-1 relative shadow-inner">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="bg-slate-900 text-indigo-300 uppercase font-black text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                              <th className="py-3 px-4 text-center w-12 border-r border-slate-800">#</th>
                              {childPageItems.length > 0 && Object.keys(childPageItems[0]).map((key) => (
                                <th key={key} className="py-3 px-4 border-r border-slate-800 whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-xs font-mono">
                            {paginatedChildItems.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/60 transition-colors text-slate-200">
                                <td className="py-2.5 px-4 text-center font-bold text-indigo-400">{(currentPage - 1) * pageSize + idx + 1}</td>
                                {Object.entries(row).map(([k, v], cellIdx) => (
                                  <td key={cellIdx} className="py-2.5 px-4 border-r border-slate-800/60 whitespace-nowrap">{String(v ?? 'N/A')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'graph' && (
                    <div className="neo-inset p-4 rounded-2xl flex-1 flex flex-col min-h-[350px]">
                      <h5 className="text-xs font-black text-slate-800 uppercase mb-4">📊 Dynamic Query Generated Graph</h5>
                      <div className="h-80 w-full flex-1">
                        {childGraphConfig ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={childGraphConfig.data} barGap={6}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                              <XAxis dataKey={childGraphConfig.xAxisKey} stroke="#475569" fontSize={11} fontWeight={800} />
                              <YAxis stroke="#475569" fontSize={10} fontWeight={800} />
                              <Tooltip />
                              <Legend />
                              {childGraphConfig.volumeKey && <Bar dataKey={childGraphConfig.volumeKey} fill="#0284c7" radius={[6, 6, 0, 0]} />}
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs font-extrabold text-slate-400">Hakuna data ya kutosha kutengeneza graph.</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolumeAnalysis;
