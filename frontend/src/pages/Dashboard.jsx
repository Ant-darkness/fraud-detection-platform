import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const Dashboard = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [timeframe, setTimeframe] = useState('24hrs');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [stats, setStats] = useState({
    total_transactions: 0,
    predicted_frauds: 0,
    pending_reviews: 0,
    confirmed_frauds: 0,
    fraud_rate: 0
  });
  
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Agent Query & Modal States
  const [agentQuery, setAgentQuery] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const summary = await api.dashboard.getSummary();
        if (summary) setStats(summary);

        const analytics = await api.dashboard.getAnalytics(timeframe, customStart || null, customEnd || null);
        
        if (analytics?.trend && analytics.trend.length > 0) {
          const formattedTrend = analytics.trend.map((val) => ({
            time_label: val.time_label,
            'Miamala Salama': Number(val.non_fraud_count || val.legit_count || 0),
            'Miamala ya Utapeli': Number(val.fraud_count || val.count || 0)
          }));
          setTrendData(formattedTrend);
        } else {
          setTrendData([]);
        }
      } catch (error) {
        if (showToast) showToast("Imeshindikana kupakia takwimu za Dashboard.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe, customStart, customEnd, showToast]);

  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;

    const { is_fraud } = lastMessage;

    setStats((prevStats) => {
      const newTotal = Number(prevStats.total_transactions || 0) + 1;
      const newPredicted = is_fraud ? Number(prevStats.predicted_frauds || 0) + 1 : Number(prevStats.predicted_frauds || 0);
      const newPending = is_fraud ? Number(prevStats.pending_reviews || 0) + 1 : Number(prevStats.pending_reviews || 0);
      const newRate = newTotal > 0 ? ((newPredicted / newTotal) * 100).toFixed(2) : 0;

      return {
        ...prevStats,
        total_transactions: newTotal,
        predicted_frauds: newPredicted,
        pending_reviews: newPending,
        fraud_rate: newRate
      };
    });
  }, [lastMessage]);

  const handleAskAgent = async (e) => {
    e.preventDefault();
    if (!agentQuery.trim()) return;

    setAgentLoading(true);
    setIsModalOpen(true);

    try {
      const res = await api.dashboard.askFraudAgent({
        prompt: agentQuery,
        timeframe,
        custom_start: customStart || null,
        custom_end: customEnd || null
      });

      setAgentResponse(res || {
        explanation: "Uchambuzi umekamilika kulingana na maelezo yako.",
        chart_data: trendData,
        summary: "Mienendo inaonyesha utulivu wa mfumo kwa sasa."
      });
    } catch (err) {
      if (showToast) showToast("Imeshindikana kupata majibu kutoka kwa AI Agent.", "error");
      setIsModalOpen(false);
    } finally {
      setAgentLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 p-3 rounded-xl shadow-2xl text-xs border border-slate-800">
          <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-bold" style={{ color: entry.color }}>
              {entry.name}: <span className="font-mono text-white">{Number(entry.value || 0).toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* 1. TIMEFRAME FILTER CONTAINER */}
      <div className="bg-[#F2C4CE] p-4 rounded-3xl border border-pink-300/80 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['24hrs', '7days', '4weeks', '1year'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                setCustomStart('');
                setCustomEnd('');
                setTimeframe(tf);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                timeframe === tf && !customStart
                  ? 'bg-slate-950 text-pink-200 font-black shadow-md border border-slate-800'
                  : 'text-slate-900 hover:bg-pink-300/60'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-900">
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

      {/* 2. AI FRAUD AGENT PROMPT PORTAL */}
      <div className="bg-[#F2C4CE] p-6 rounded-3xl space-y-4 border border-pink-300/80 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-950">Fraud Intelligence Agent</h3>
            <p className="text-xs text-pink-950 font-semibold">Uliza swali au omba uchambuzi maalum wa utapeli</p>
          </div>
        </div>

        <form onSubmit={handleAskAgent} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
            placeholder="K.m: Nionyeshe uwiano wa utapeli kwa masaa 24 yaliyopita..."
            className="flex-1 bg-slate-950 text-pink-200 placeholder-slate-400 text-xs rounded-2xl px-4 py-3.5 outline-none border border-slate-800 focus:border-pink-400 transition-all font-sans shadow-inner"
          />
          <button
            type="submit"
            disabled={agentLoading}
            className="bg-slate-950 hover:bg-slate-900 text-pink-200 font-black text-xs px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xl border border-slate-800 uppercase tracking-wider"
          >
            {agentLoading ? (
              <span className="w-4 h-4 border-2 border-pink-200 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              '🔍 Uchambua'
            )}
          </button>
        </form>
      </div>

      {/* 3. KPI STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { key: 'totalTransactions', val: Number(stats.total_transactions)?.toLocaleString() || 0, label: 'TOTAL TRANSACTIONS' },
          { key: 'predictedFraud', val: Number(stats.predicted_frauds)?.toLocaleString() || 0, label: 'PREDICTED FRAUD' },
          { key: 'pendingReviews', val: Number(stats.pending_reviews)?.toLocaleString() || 0, label: 'PENDING REVIEWS' },
          { key: 'confirmedFraud', val: Number(stats.confirmed_frauds)?.toLocaleString() || 0, label: 'CONFIRMED FRAUD' },
          { key: 'fraudRate', val: `${stats.fraud_rate || 0}%`, label: 'FRAUD RATE' }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-950 text-slate-100 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 border border-slate-800 hover:border-pink-400 shadow-xl flex flex-col justify-between">
            <div className="text-pink-300 text-[10px] font-black uppercase tracking-wider">
              {t(item.key) || item.label}
            </div>
            <div className="text-2xl font-black mt-2 tracking-tight font-mono text-white">
              {item.val}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[9px] font-black text-slate-400">
              <span>METRIC</span>
              <span className="bg-pink-400/10 text-pink-300 px-1.5 py-0.5 rounded border border-pink-400/20">LIVE</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. FRAUD TRENDS GRAPH */}
      <div className="bg-[#F2C4CE] text-slate-900 rounded-3xl p-6 space-y-4 border border-pink-300/80 shadow-2xl">
        <h3 className="text-xs sm:text-sm font-black text-slate-950 tracking-wider uppercase flex items-center gap-2">
          <span>🛡️</span> Fraud vs Non-Fraud Trends ({timeframe.toUpperCase()})
        </h3>
        
        {trendData.length > 0 ? (
          <div className="h-72 w-full min-w-0 pt-2 bg-slate-950/5 rounded-2xl p-2 border border-pink-300/40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.15)" vertical={false} />
                <XAxis dataKey="time_label" stroke="#0f172a" fontSize={11} tickLine={false} fontWeight={800} />
                <YAxis stroke="#0f172a" fontSize={11} tickLine={false} axisLine={false} fontWeight={800} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#0f172a', fontWeight: 'bold' }} />
                <Bar dataKey="Miamala Salama" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Miamala ya Utapeli" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-pink-950 text-xs font-extrabold">
            Hakuna data ya mwenendo iliyopatikana kwa kipindi hiki.
          </div>
        )}
      </div>

      {/* 5. AI AGENT DYNAMIC DISPLAY MODAL PORTAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`bg-[#F2C4CE] text-slate-900 border-2 border-pink-400 rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
            isMaximized ? 'w-full h-full rounded-none border-none' : 'w-full max-w-4xl max-h-[90vh]'
          }`}>
            <div className="border-b border-pink-300/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-950">
                  Fraud AI Agent Analytics View
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="px-2.5 py-1 bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border border-slate-950/20"
                >
                  {isMaximized ? '🗗 Restore' : '🗖 Maximize'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
                >
                  ✕ Funga
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {agentLoading ? (
                <div className="min-h-[280px] flex flex-col items-center justify-center gap-3">
                  <span className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs font-extrabold text-slate-950">AI Agent inachanganua miamala...</p>
                </div>
              ) : agentResponse ? (
                <>
                  <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl border border-slate-800 text-xs leading-relaxed font-medium shadow-md">
                    <span className="font-black text-pink-300 uppercase block mb-1">💡 Maoni ya AI Agent:</span>
                    {agentResponse.explanation}
                  </div>

                  <div className="h-72 w-full bg-slate-950/5 border border-pink-300/60 p-4 rounded-2xl min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={agentResponse.chart_data || trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.15)" vertical={false} />
                        <XAxis dataKey="time_label" stroke="#0f172a" fontSize={11} fontWeight={800} />
                        <YAxis stroke="#0f172a" fontSize={11} fontWeight={800} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: '#0f172a', fontWeight: 'bold' }} />
                        <Bar dataKey="Miamala Salama" fill="#059669" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Miamala ya Utapeli" fill="#e11d48" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : null}
            </div>

            <div className="border-t border-pink-300/80 px-6 py-3 flex justify-between items-center text-xs text-pink-950 font-bold">
              <span className="truncate max-w-xs">Query: "{agentQuery}"</span>
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

export default Dashboard;
