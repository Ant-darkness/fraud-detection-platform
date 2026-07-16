import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const Dashboard = ({ showToast }) => {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState('7days'); // Default kwa API yetu
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
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kila timeframe au tarehe ikibadilika, vuta data mpya kutoka API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Vuta Summary ya KPI
        const summary = await api.dashboard.getSummary();
        setStats(summary);

        // 2. Vuta Analytics za chati kulingana na timeframe/date
        const analytics = await api.dashboard.getAnalytics(timeframe, customStart || null, customEnd || null);
        setTrendData(analytics.trend || [45, 60, 80, 50, 90, 70, 110, 85, 120, 100]); // Fallback kama hakuna data
        setDistribution(analytics.distribution || [
          { type: 'TRANSFER', count: '8,421', percentage: 70, color: 'bg-[#D4AF37]' },
          { type: 'CASH_OUT', count: '2,310', percentage: 20, color: 'bg-red-500' },
          { type: 'PAYMENT', count: '1,700', percentage: 10, color: 'bg-blue-400' }
        ]);
      } catch (error) {
        showToast("Imeshindikana kupakia takwimu za Dashboard.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe, customStart, customEnd]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Timeframe Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex gap-2">
          {['24hrs', '7days', '4weeks', '1year'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-white/15 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'text-gray-400 hover:text-white bg-transparent'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Custom Range Filter */}
        <div className="flex items-center gap-3 text-xs">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-black/40 border border-white/10 text-white p-2 rounded-xl focus:border-[#D4AF37] outline-none"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-black/40 border border-white/10 text-white p-2 rounded-xl focus:border-[#D4AF37] outline-none"
          />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { key: 'totalTransactions', val: stats.total_transactions.toLocaleString(), col: 'text-blue-400' },
          { key: 'predictedFraud', val: stats.predicted_frauds.toLocaleString(), col: 'text-amber-400' },
          { key: 'pendingReviews', val: stats.pending_reviews, col: 'text-purple-400' },
          { key: 'confirmedFraud', val: stats.confirmed_frauds.toLocaleString(), col: 'text-red-500' },
          { key: 'fraudRate', val: `${stats.fraud_rate}%`, col: 'text-rose-400' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent"></div>
            <div className="text-gray-400 text-xs font-semibold uppercase">{t(item.key)}</div>
            <div className={`text-2xl font-black mt-3 ${item.col}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Bar Graph */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2">
            📊 {t('trend')} ({timeframe.toUpperCase()})
          </h3>
          <div className="h-64 flex items-end gap-3 justify-between pt-6 border-b border-white/10">
            {trendData.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  style={{ height: `${Math.min(val * 1.5, 200)}px` }} 
                  className="w-full bg-gradient-to-t from-red-600/30 to-red-500 rounded-t-lg transition-all duration-300 group-hover:from-red-500 group-hover:to-[#D4AF37] relative"
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-white/20 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500">Day {idx+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud distribution visual list */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-md font-bold text-white mb-6">🔄 Distribution status</h3>
          <div className="space-y-4">
            {distribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="font-bold">{item.type}</span>
                  <span>{item.count} miamala ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color || 'bg-[#D4AF37]'}`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
