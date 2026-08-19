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
  const [loadingData, setLoadingData] = useState(true);

  // Agent Modal States
  const [agentQuery, setAgentQuery] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') showToast(msg, type);
  }, [showToast]);

  // Load initial data ONCE on mount / timeframe change
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        const [summary, analytics] = await Promise.all([
          api.dashboard.getSummary(),
          api.dashboard.getAnalytics(timeframe)
        ]);
        
        if (isMounted && summary) {
          setStats({
            total_transactions: Number(summary.total_transactions || 0),
            predicted_frauds: Number(summary.predicted_frauds || 0),
            pending_reviews: Number(summary.pending_reviews || 0),
            confirmed_frauds: Number(summary.confirmed_frauds || 0),
            fraud_rate: summary.fraud_rate ?? 0
          });
        }
        if (isMounted && analytics?.trend) {
          setTrendData(analytics.trend);
        }
      } catch (err) {
        if (isMounted) notify("Imeshindikana kupakia takwimu za mwanzo.", "error");
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [timeframe, notify]);

  // LIVE STREAMING VIA WEBSOCKET (NO REQUEST SENT)
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.event_type === 'LIVE_PULSE_UPDATE') {
      if (lastMessage.summary) {
        setStats((prev) => ({
          ...prev,
          total_transactions: Number(lastMessage.summary.total_transactions || prev.total_transactions),
          predicted_frauds: Number(lastMessage.summary.predicted_frauds || prev.predicted_frauds),
          pending_reviews: Number(lastMessage.summary.pending_reviews || prev.pending_reviews),
          confirmed_frauds: Number(lastMessage.summary.confirmed_frauds || prev.confirmed_frauds),
          fraud_rate: lastMessage.summary.fraud_rate ?? prev.fraud_rate
        }));
      }
      return;
    }

    if (lastMessage.event_type === 'NEW_TRANSACTION') {
      const { is_fraud } = lastMessage;
      setStats((prev) => {
        const newTotal = prev.total_transactions + 1;
        const newPredicted = is_fraud ? prev.predicted_frauds + 1 : prev.predicted_frauds;
        const newPending = is_fraud ? prev.pending_reviews + 1 : prev.pending_reviews;
        const calcRate = newTotal > 0 ? (newPredicted / newTotal) * 100 : 0;

        return {
          ...prev,
          total_transactions: newTotal,
          predicted_frauds: newPredicted,
          pending_reviews: newPending,
          fraud_rate: Number(calcRate.toFixed(2))
        };
      });
    }
  }, [lastMessage]);

  // AGENT QUERY (SINGLE REQUEST EXCEPTION)
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
      notify(err.message || "Imeshindikana kupata majibu kutoka kwa Agent.", "error");
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

  return (
    <div className="space-y-6 font-sans select-none pb-10">
      {/* Timeframe Filter Bar */}
      <div className="neo-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['24hrs', '7days', '4weeks', '1year'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                timeframe === tf ? 'neo-button-active text-indigo-600' : 'neo-button text-slate-700'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
        {loadingData && (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
            <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            <span>Inasawazisha Stream...</span>
          </div>
        )}
      </div>

      {/* Query Agent Section */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FcBinoculars className="text-3xl" />
          <div>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800">
              Kituo cha Uchambuzi wa Kiuchunguzi (Forensic Agent)
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              Uliza swali la moja kwa moja kutafuta kumbukumbu kwenye database
            </p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (agentQuery.trim()) setShowConfirmModal(true); }} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
            placeholder="K.m: Nionyeshe orodha ya miamala iliyoashiriwa kama utapeli..."
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
              <><HiOutlineSearch className="text-base" /> Submit Agent</>
            )}
          </button>
        </form>
      </div>

      {/* KPI Display Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { key: 'totalTransactions', val: stats.total_transactions.toLocaleString(), label: 'JUMLA YA MIAMALA', icon: <FcList className="text-2xl" /> },
          { key: 'predictedFraud', val: stats.predicted_frauds.toLocaleString(), label: 'MIAMALA YENYE SHAKA', icon: <FcMediumPriority className="text-2xl" /> },
          { key: 'pendingReviews', val: stats.pending_reviews.toLocaleString(), label: 'INAYOSUBIRI UHAKIKI', icon: <FcTimeline className="text-2xl" /> },
          { key: 'confirmedFraud', val: stats.confirmed_frauds.toLocaleString(), label: 'UTAPELI ULIOTHIBITISHWA', icon: <FcCheckmark className="text-2xl" /> },
          { key: 'fraudRate', val: `${stats.fraud_rate.toFixed(2)}%`, label: 'KIWANGO CHA HATARI', icon: <FcComboChart className="text-2xl" /> }
        ].map((item, idx) => (
          <div key={idx} className="neo-card-hover p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                {t(item.key) || item.label}
              </span>
              {item.icon}
            </div>
            <div className="text-2xl font-black mt-3 font-mono text-slate-800">{item.val}</div>
            <div className="mt-4 pt-2 border-t border-slate-300/40 flex items-center justify-between text-[9px] font-black text-slate-400">
              <span>STREAM STATUS</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> LIVE STREAMING
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Bar Chart */}
      <div className="neo-card p-6 space-y-4">
        <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-wider uppercase flex items-center gap-2">
          <FcComboChart className="text-xl" /> Mwenendo wa Miamala Salama vs Utapeli ({timeframe.toUpperCase()})
        </h3>
        {trendData.length > 0 ? (
          <div className="h-96 w-full pt-2 neo-inset p-4 rounded-2xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="time_label" stroke="#475569" fontSize={10} tickLine={false} fontWeight={800} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} fontWeight={800} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Miamala Salama" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Miamala ya Utapeli" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-500 text-xs font-bold">
            Hakuna data ya mwenendo.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neo-card max-w-md w-full p-6 space-y-4 bg-white rounded-3xl">
            <h4 className="font-black text-sm uppercase text-slate-800">Thibitisha Swali la Agent</h4>
            <p className="text-xs text-slate-600 font-medium">Je, unathibitisha kutekeleza query ifuatayo?</p>
            <div className="neo-inset p-3 rounded-xl text-xs font-bold text-indigo-900 bg-indigo-50/50 font-mono">
              "{agentQuery}"
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowConfirmModal(false)} className="neo-button px-4 py-2 text-xs font-bold rounded-xl">Ghairi</button>
              <button type="button" onClick={executeAgentQuery} className="neo-button px-5 py-2 text-indigo-600 font-black text-xs rounded-xl">Thibitisha</button>
            </div>
          </div>
        </div>
      )}

      {/* Child Page Terminal View Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`neo-card overflow-hidden flex flex-col bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl transition-all ${
            isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[90vh] rounded-3xl'
          }`}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h4 className="font-black text-xs text-indigo-400 uppercase">{agentResponse?.title || "Forensic Child Page Window"}</h4>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsMaximized(!isMaximized)} className="px-3 py-1 bg-slate-800 text-xs rounded-xl text-slate-300 font-bold">
                  {isMaximized ? 'Restore' : 'Maximize'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1 bg-rose-950 text-rose-300 text-xs rounded-xl font-bold">Funga</button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-900">
              {agentLoading ? (
                <div className="min-h-[300px] flex items-center justify-center text-xs font-bold text-indigo-400">
                  Agent anatekeleza Query na kuandaa Child Page...
                </div>
              ) : (
                <div className="overflow-x-auto bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-indigo-300">
                        {childPageItems.length > 0 && Object.keys(childPageItems[0]).map((k) => (
                          <th key={k} className="p-2 uppercase">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedChildItems.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/50">
                          {Object.values(row).map((val, idx) => (
                            <td key={idx} className="p-2">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
