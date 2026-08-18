import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FcBinoculars, FcComboChart, FcCheckmark, FcList, FcMediumPriority, FcTimeline } from 'react-icons/fc';
import { HiOutlineSearch } from 'react-icons/hi';

const Dashboard = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [timeframe, setTimeframe] = useState('24hrs');

  const [stats, setStats] = useState({
    total_transactions: 0,
    predicted_frauds: 0,
    pending_reviews: 0,
    confirmed_frauds: 0,
    fraud_rate: 0
  });

  const [trendData, setTrendData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [agentQuery, setAgentQuery] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState(null);
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

  const fillMissingTimeframes = useCallback((rawTrend, type) => {
    const rawMap = new Map();
    if (Array.isArray(rawTrend)) {
      rawTrend.forEach((item) => {
        if (item.time_label) {
          rawMap.set(String(item.time_label).trim(), item);
        }
      });
    }

    const filled = [];
    const now = new Date();

    if (type === '24hrs') {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const label = `${String(d.getHours()).padStart(2, '0')}:00`;
        const existing = rawMap.get(label) || {};
        filled.push({
          time_label: label,
          'Miamala Salama': Number(existing.non_fraud_count || existing.legit_count || existing['Miamala Salama'] || 0),
          'Miamala ya Utapeli': Number(existing.fraud_count || existing.count || existing['Miamala ya Utapeli'] || 0)
        });
      }
    } else if (type === '7days') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = days[d.getDay()];
        const existing = rawMap.get(label) || {};
        filled.push({
          time_label: label,
          'Miamala Salama': Number(existing.non_fraud_count || existing.legit_count || existing['Miamala Salama'] || 0),
          'Miamala ya Utapeli': Number(existing.fraud_count || existing.count || existing['Miamala ya Utapeli'] || 0)
        });
      }
    } else if (type === '4weeks') {
      for (let i = 4; i >= 1; i--) {
        const label = `W${i}`;
        const existing = rawMap.get(label) || {};
        filled.push({
          time_label: label,
          'Miamala Salama': Number(existing.non_fraud_count || existing.legit_count || existing['Miamala Salama'] || 0),
          'Miamala ya Utapeli': Number(existing.fraud_count || existing.count || existing['Miamala ya Utapeli'] || 0)
        });
      }
    } else if (type === '1year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthIndex = now.getMonth();
      for (let i = 11; i >= 0; i--) {
        const monthIdx = (currentMonthIndex - i + 12) % 12;
        const label = months[monthIdx];
        const existing = rawMap.get(label) || {};
        filled.push({
          time_label: label,
          'Miamala Salama': Number(existing.non_fraud_count || existing.legit_count || existing['Miamala Salama'] || 0),
          'Miamala ya Utapeli': Number(existing.fraud_count || existing.count || existing['Miamala ya Utapeli'] || 0)
        });
      }
    } else {
      return rawTrend || [];
    }

    return filled;
  }, []);

  // 1. Fetch Main Summary & Trend Analytics
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingData(true);
    try {
      const summary = await api.dashboard.getSummary();
      if (summary) {
        setStats({
          total_transactions: Number(summary.total_transactions || 0),
          predicted_frauds: Number(summary.predicted_frauds || 0),
          pending_reviews: Number(summary.pending_reviews || 0),
          confirmed_frauds: Number(summary.confirmed_frauds || 0),
          fraud_rate: summary.fraud_rate ?? 0
        });
      }

      const analytics = await api.dashboard.getAnalytics(timeframe);
      const rawTrend = analytics?.trend || [];
      const structuredTrend = fillMissingTimeframes(rawTrend, timeframe);
      setTrendData(structuredTrend);
    } catch (error) {
      if (!isSilent) {
        notify("Imeshindikana kupakia takwimu za Dashboard. Tafadhali jaribu tena.", "error");
      }
    } finally {
      if (!isSilent) setLoadingData(false);
    }
  }, [timeframe, fillMissingTimeframes, notify]);

  useEffect(() => {
    fetchDashboardData(false);

    // Dynamic Sync Interval: Reconcile na DB kila baada ya sekunde 30 kurekebisha pending_reviews zilizotolewa/zilizopunguzwa
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  // 2. High Throughput Real-time WebSocket Stream
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;

    const frameId = requestAnimationFrame(() => {
      const { is_fraud } = lastMessage;

      setStats((prev) => {
        const newTotal = Number(prev.total_transactions || 0) + 1;
        const newPredicted = is_fraud ? Number(prev.predicted_frauds || 0) + 1 : Number(prev.predicted_frauds || 0);
        const newPending = is_fraud ? Number(prev.pending_reviews || 0) + 1 : Number(prev.pending_reviews || 0);
        const calcRate = newTotal > 0 ? (newPredicted / newTotal) * 100 : 0;

        return {
          ...prev,
          total_transactions: newTotal,
          predicted_frauds: newPredicted,
          pending_reviews: newPending,
          fraud_rate: Number(calcRate.toFixed(2))
        };
      });

      setTrendData((prevTrend) => {
        if (!prevTrend || prevTrend.length === 0) return prevTrend;
        const updatedTrend = [...prevTrend];
        const lastIdx = updatedTrend.length - 1;

        if (is_fraud) {
          updatedTrend[lastIdx] = {
            ...updatedTrend[lastIdx],
            'Miamala ya Utapeli': Number(updatedTrend[lastIdx]['Miamala ya Utapeli'] || 0) + 1
          };
        } else {
          updatedTrend[lastIdx] = {
            ...updatedTrend[lastIdx],
            'Miamala Salama': Number(updatedTrend[lastIdx]['Miamala Salama'] || 0) + 1
          };
        }
        return updatedTrend;
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [lastMessage]);

  const handlePreSubmit = (e) => {
    if (e) e.preventDefault();
    if (!agentQuery.trim()) {
      notify("Tafadhali andika swali kabla ya kutuma.", "warning");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeAgentQuery = async () => {
    setShowConfirmModal(false);
    setAgentLoading(true);
    setIsModalOpen(true);
    setCurrentPage(1);

    try {
      const res = await api.agents.askScopedAgent(agentQuery, "fraud");
      setAgentResponse(res);
      notify("Uchambuzi wa Kiuchunguzi umekamilika kikamilifu!", "success");
    } catch (err) {
      notify(err.message || "Imeshindikana kupata majibu ya uchambuzi kutoka kwa Agent.", "error");
    } finally {
      setAgentLoading(false);
    }
  };

  const childPageItems = useMemo(() => {
    if (!agentResponse) return [];
    if (Array.isArray(agentResponse.items)) return agentResponse.items;
    if (Array.isArray(agentResponse.data)) return agentResponse.data;
    if (Array.isArray(agentResponse)) return agentResponse;
    return [];
  }, [agentResponse]);

  const totalPages = Math.max(1, Math.ceil(childPageItems.length / pageSize));
  const paginatedChildItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return childPageItems.slice(startIdx, startIdx + pageSize);
  }, [childPageItems, currentPage, pageSize]);

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="neo-card p-3 text-xs font-sans shadow-xl bg-slate-900 text-white border border-slate-700 rounded-xl">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-bold my-0.5 flex items-center justify-between gap-4">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-mono text-slate-100 font-extrabold">{Number(entry.value || 0).toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  return (
    <div className="space-y-6 font-sans select-none pb-10">
      
      {/* 1. Timeframe Filter Bar */}
      <div className="neo-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['24hrs', '7days', '4weeks', '1year'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                timeframe === tf
                  ? 'neo-button-active text-indigo-600'
                  : 'neo-button text-slate-700'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {loadingData && (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
            <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            <span>Inasawazisha Takwimu...</span>
          </div>
        )}
      </div>

      {/* 2. Forensic Query Assistant Bar */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FcBinoculars className="text-3xl" />
          <div>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800">
              Kituo cha Uchambuzi wa Kiuchunguzi - BoT (Forensic Assistant Agent)
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              Uliza swali ili Agent aitafute data kutoka database na kukufungulia Child Page Terminal Window
            </p>
          </div>
        </div>

        <form onSubmit={handlePreSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
            placeholder="K.m: Nionyeshe orodha ya miamala iliyoashiriwa kama utapeli masaa 24 yaliyopita..."
            className="flex-1 neo-inset text-slate-800 placeholder-slate-400 text-xs rounded-2xl px-5 py-3.5 outline-none font-sans"
          />
          <button
            type="submit"
            disabled={agentLoading}
            className="neo-button text-indigo-600 font-black text-xs px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shrink-0 uppercase tracking-wider"
          >
            {agentLoading ? (
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <HiOutlineSearch className="text-base" /> Submit
              </>
            )}
          </button>
        </form>
      </div>

      {/* 3. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { key: 'totalTransactions', val: Number(stats.total_transactions)?.toLocaleString() || '0', label: 'JUMLA YA MIAMALA', icon: <FcList className="text-2xl" /> },
          { key: 'predictedFraud', val: Number(stats.predicted_frauds)?.toLocaleString() || '0', label: 'MIAMALA YENYE SHAKA', icon: <FcMediumPriority className="text-2xl" /> },
          { key: 'pendingReviews', val: Number(stats.pending_reviews)?.toLocaleString() || '0', label: 'INAYOSUBIRI UHAKIKI', icon: <FcTimeline className="text-2xl" /> },
          { key: 'confirmedFraud', val: Number(stats.confirmed_frauds)?.toLocaleString() || '0', label: 'UTAPELI ULIOTHIBITISHWA', icon: <FcCheckmark className="text-2xl" /> },
          { key: 'fraudRate', val: `${Number(stats.fraud_rate || 0).toFixed(2)}%`, label: 'KIWANGO CHA HATARI', icon: <FcComboChart className="text-2xl" /> }
        ].map((item, idx) => (
          <div key={idx} className="neo-card-hover p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                {t(item.key) || item.label}
              </span>
              {item.icon}
            </div>
            <div className="text-2xl font-black mt-3 font-mono text-slate-800">
              {item.val}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-300/40 flex items-center justify-between text-[9px] font-black text-slate-400">
              <span>HALI YA SASA</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> LIVE
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Main Trends Chart */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-wider uppercase flex items-center gap-2">
            <FcComboChart className="text-xl" /> Mwenendo wa Miamala Salama vs Utapeli ({timeframe.toUpperCase()})
          </h3>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-200/60 px-3 py-1 rounded-lg">
            X-Axis: Timeline Sahihi ({trendData.length} Intervals)
          </span>
        </div>
        
        {trendData.length > 0 ? (
          <div className="h-96 w-full pt-2 neo-inset p-4 rounded-2xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis 
                  dataKey="time_label" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  fontWeight={800} 
                  interval={timeframe === '24hrs' ? 1 : 0}
                />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} fontWeight={800} />
                <Tooltip content={CustomTooltip} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#1e293b', fontWeight: 'bold' }} />
                <Bar dataKey="Miamala Salama" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Miamala ya Utapeli" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-500 text-xs font-bold">
            Hakuna data ya mwenendo iliyopatikana kwa kipindi hiki.
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL DIALOG */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neo-card max-w-md w-full p-6 space-y-4 bg-white animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <FcBinoculars className="text-3xl" />
              <h4 className="font-black text-sm uppercase text-slate-800">Thibitisha Swali la Uchambuzi</h4>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Unakaribia kumtuma Forensic Agent kutafuta data kutoka database kwa ajili ya swali:
            </p>
            <div className="neo-inset p-3 rounded-xl text-xs font-bold text-indigo-900 bg-indigo-50/50">
              "{agentQuery}"
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="neo-button px-4 py-2 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Ghairi (Cancel)
              </button>
              <button
                type="button"
                onClick={executeAgentQuery}
                className="neo-button px-5 py-2 text-indigo-600 font-black text-xs rounded-xl cursor-pointer"
              >
                Thibitisha (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHILD PAGE MODAL TERMINAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className={`neo-card transition-all duration-300 overflow-hidden flex flex-col bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl ${
            isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[92vh] rounded-3xl'
          }`}>
            
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
              <div className="flex items-center gap-3">
                <FcBinoculars className="text-3xl" />
                <div>
                  <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-indigo-400">
                    {agentResponse?.title || `Forensic Terminal Window`}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Child Page Forensic View | Total Records Found: <span className="text-emerald-400 font-mono">{childPageItems.length.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="neo-button px-3.5 py-1.5 text-slate-200 bg-slate-800 rounded-xl text-xs font-black uppercase transition hover:bg-slate-700 cursor-pointer"
                >
                  {isMaximized ? '🗗 Restore Window' : '🗖 Maximize'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="neo-button px-3.5 py-1.5 text-rose-400 bg-slate-800 rounded-xl text-xs font-black transition hover:bg-rose-950/50 cursor-pointer"
                >
                  ✕ Funga
                </button>
              </div>
            </div>

            <div className="flex border-b border-slate-800 px-6 bg-slate-950 text-xs font-black shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`py-3 px-5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'table' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📋 Data Table View ({childPageItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('graph')}
                className={`py-3 px-5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'graph' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 Custom Forensic Graph
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 flex flex-col min-h-0 bg-slate-900">
              {agentLoading ? (
                <div className="min-h-[350px] flex flex-col items-center justify-center gap-3 my-auto">
                  <span className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs font-bold text-slate-300">Agent anatekeleza SQL Query kwenye Database...</p>
                </div>
              ) : agentResponse ? (
                <>
                  {agentResponse.generated_sql && (
                    <div className="bg-slate-950 text-indigo-300 p-3.5 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto shrink-0 shadow-inner">
                      <span className="text-indigo-400 font-extrabold uppercase text-[10px] block mb-1">🔍 EXECUTED FORENSIC SQL QUERY:</span>
                      <code>{agentResponse.generated_sql}</code>
                    </div>
                  )}

                  {agentResponse.explanation && (
                    <div className="bg-slate-800/80 p-3.5 rounded-2xl text-xs font-semibold text-slate-200 border border-slate-700/60 shrink-0">
                      <span className="font-black text-indigo-400 uppercase block mb-1">💡 Maoni ya Kiuchunguzi:</span>
                      {agentResponse.explanation}
                    </div>
                  )}

                  {activeTab === 'table' && (
                    <div className="flex-1 flex flex-col min-h-0 space-y-3">
                      <div className="w-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 overflow-auto flex-1 relative shadow-inner">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                          <thead>
                            <tr className="bg-slate-900 text-indigo-300 uppercase font-black text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                              <th className="py-3 px-4 text-center w-12 border-r border-slate-800">#</th>
                              {childPageItems.length > 0 && Object.keys(childPageItems[0]).map((key) => (
                                <th key={key} className="py-3 px-4 border-r border-slate-800 whitespace-nowrap">
                                  {key.replace(/_/g, ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/70 text-xs font-mono">
                            {paginatedChildItems.map((row, idx) => {
                              const absoluteIdx = (currentPage - 1) * pageSize + idx + 1;
                              return (
                                <tr key={idx} className="hover:bg-slate-800/50 transition-colors text-slate-200">
                                  <td className="py-2.5 px-4 text-center font-bold text-indigo-400 border-r border-slate-800/60">{absoluteIdx}</td>
                                  {Object.entries(row).map(([k, v], cellIdx) => {
                                    const isAmount = k.toLowerCase().includes('amount') || k.toLowerCase().includes('balance');
                                    const isFraud = k.toLowerCase().includes('fraud') || k.toLowerCase().includes('risk') || k.toLowerCase().includes('status');
                                    const numVal = typeof v === 'number' ? v : (!isNaN(Number(v)) && v !== '' && v !== null) ? Number(v) : null;
                                    
                                    return (
                                      <td key={cellIdx} className="py-2.5 px-4 border-r border-slate-800/60 whitespace-nowrap">
                                        {isAmount && numVal !== null ? (
                                          <span className="font-black text-emerald-400">TZS {numVal.toLocaleString()}</span>
                                        ) : isFraud ? (
                                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                            v === true || String(v).toLowerCase() === 'high' || String(v) === '1' || String(v).toUpperCase() === 'PENDING'
                                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                          }`}>
                                            {String(v)}
                                          </span>
                                        ) : numVal !== null ? (
                                          numVal.toLocaleString()
                                        ) : (
                                          String(v ?? 'N/A')
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {childPageItems.length === 0 && (
                          <div className="py-16 text-center text-slate-400 text-xs font-extrabold">
                            Hakuna kumbukumbu zilizopatana na query hii kwenye database.
                          </div>
                        )}
                      </div>

                      {childPageItems.length > 0 && (
                        <div className="flex justify-between items-center text-xs font-bold text-slate-300 shrink-0 pt-2 bg-slate-900 px-2 rounded-xl">
                          <div>
                            Ukurasa <span className="font-mono text-indigo-400">{currentPage}</span> kati ya <span className="font-mono text-indigo-400">{totalPages}</span> (Jumla {childPageItems.length})
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                              className="neo-button px-3.5 py-1.5 text-slate-200 bg-slate-800 disabled:opacity-40 rounded-xl"
                            >
                              ◀️ Prev
                            </button>
                            <button
                              type="button"
                              disabled={currentPage >= totalPages}
                              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                              className="neo-button px-3.5 py-1.5 text-slate-200 bg-slate-800 disabled:opacity-40 rounded-xl"
                            >
                              Next ▶️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'graph' && (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex-1 flex flex-col min-h-[350px]">
                      <h5 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-4">
                        📊 Custom Forensic Analytics Graph
                      </h5>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={agentResponse.chart_data || trendData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="time_label" stroke="#94a3b8" fontSize={11} fontWeight={800} />
                            <YAxis stroke="#94a3b8" fontSize={11} fontWeight={800} />
                            <Tooltip content={CustomTooltip} />
                            <Legend wrapperStyle={{ color: '#f8fafc', fontWeight: 'bold' }} />
                            <Bar dataKey="Miamala Salama" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="Miamala ya Utapeli" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-bold shrink-0 bg-slate-950">
              <span className="truncate max-w-[70%] font-mono text-indigo-300">Swali: "{agentQuery}"</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="neo-button px-5 py-2 text-indigo-400 bg-slate-800 font-black rounded-xl cursor-pointer hover:bg-slate-700"
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

export default Dashboard;
