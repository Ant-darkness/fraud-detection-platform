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

  // Load Initial REST Data
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
  }, [timeframe, customStart, customEnd]);

  // Live Counter Updates
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

  // Handle AI Prompt Submission
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
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg font-sans">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-bold" style={{ color: entry.color }}>
              {entry.name}: <span className="font-mono">{Number(entry.value || 0).toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* 1. Timeframe Filter */}
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeframe === tf && !customStart
                  ? 'bg-amber-50 text-[#B8860B] border border-amber-300 shadow-sm font-black'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
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

      {/* 2. AI Fraud Agent Prompt Portal */}
      <div className="bg-gradient-to-r from-red-900 via-stone-900 to-black text-white p-6 rounded-3xl shadow-md border border-red-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-red-400">Fraud Intelligence Agent</h3>
            <p className="text-xs text-gray-300">Uliza swali au omba uchambuzi maalum wa utapeli (mfano: "Nionyeshe masaa yenye utapeli mkubwa leo")</p>
          </div>
        </div>

        <form onSubmit={handleAskAgent} className="flex gap-3">
          <input
            type="text"
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
            placeholder="K.m: Nionyeshe uwiano wa utapeli kwa masaa 24 yaliyopita..."
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs rounded-xl px-4 py-3 outline-none focus:border-red-400 transition-all"
          />
          <button
            type="submit"
            disabled={agentLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            {agentLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : '🔍 Uchambua'}
          </button>
        </form>
      </div>

      {/* 3. KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { key: 'totalTransactions', val: Number(stats.total_transactions)?.toLocaleString() || 0, col: 'text-blue-700', border: 'via-blue-500/40' },
          { key: 'predictedFraud', val: Number(stats.predicted_frauds)?.toLocaleString() || 0, col: 'text-amber-700', border: 'via-[#D4AF37]/50' },
          { key: 'pendingReviews', val: Number(stats.pending_reviews)?.toLocaleString() || 0, col: 'text-purple-700', border: 'via-purple-500/40' },
          { key: 'confirmedFraud', val: Number(stats.confirmed_frauds)?.toLocaleString() || 0, col: 'text-red-700', border: 'via-red-500/40' },
          { key: 'fraudRate', val: `${stats.fraud_rate || 0}%`, col: 'text-rose-700', border: 'via-rose-500/40' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${item.border} to-transparent`}></div>
            <div className="text-gray-500 text-[10px] font-black uppercase tracking-wider">{t(item.key) || item.key}</div>
            <div className={`text-2xl font-black mt-3 tracking-tight font-mono ${item.col}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* 4. Fraud Trends Graph (Green: Safe, Red: Fraud) */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <h3 className="text-sm font-black text-gray-900 tracking-widest uppercase mb-6 flex items-center gap-2">
          <span>🛡️</span> Fraud vs Non-Fraud Trends ({timeframe.toUpperCase()})
        </h3>
        
        {trendData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time_label" stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Miamala Salama" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Miamala ya Utapeli" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-500 text-sm font-medium">
            Hakuna data ya mwenendo iliyopatikana kwa kipindi hiki.
          </div>
        )}
      </div>

      {/* 5. AI AGENT DYNAMIC DISPLAY MODAL PORTAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
            isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[90vh]'
          }`}>
            
            {/* Modal Header */}
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <h4 className="font-bold text-sm uppercase tracking-wider">Fraud AI Agent Analytics View</h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all text-xs"
                  title={isMaximized ? "Restore View" : "Maximize View"}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {agentLoading ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
                  <span className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-sm font-bold text-gray-600">AI Agent inachanganua miamala kulingana na ombi lako...</p>
                </div>
              ) : agentResponse ? (
                <>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs text-red-900 leading-relaxed font-medium">
                    <span className="font-bold uppercase block mb-1">💡 Maoni ya AI Agent:</span>
                    {agentResponse.explanation}
                  </div>

                  <div className="h-80 w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={agentResponse.chart_data || trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time_label" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Miamala Salama" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Miamala ya Utapeli" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>Query: "{agentQuery}"</span>
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

export default Dashboard;
