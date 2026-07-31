import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const Dashboard = ({ showToast }) => {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState('7days');
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const summary = await api.dashboard.getSummary();
        if (summary) setStats(summary);

        const analytics = await api.dashboard.getAnalytics(timeframe, customStart || null, customEnd || null);
        
        // 1. Kutayarisha data za mienendo ya Grafu ya kwanza (Trend) kwa usahihi wa kalenda
        if (analytics?.trend && analytics.trend.length > 0) {
          const formattedTrend = analytics.trend.map((val) => ({
            time_label: val.time_label,
            'Miamala ya Shaka': Number(val.count) || 0
          }));
          setTrendData(formattedTrend);
        } else {
          setTrendData([]);
        }
        
        // 2. Kutayarisha data mpya ya Dynamic Time Distribution
        if (analytics?.distribution && analytics.distribution.length > 0) {
          setDistribution(analytics.distribution);
        } else {
          setDistribution([]);
        }
      } catch (error) {
        if (showToast) {
          showToast("Imeshindikana kupakia takwimu za Dashboard.", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe, customStart, customEnd]);

  const getDistributionTitle = () => {
    switch (timeframe) {
      case '24hrs': return 'Hourly Fraud Distribution (Saa kwa Saa)';
      case '7days': return 'Daily Fraud Distribution (Siku kwa Siku)';
      case '4weeks': return 'Weekly Fraud Distribution (Wiki kwa Wiki)';
      case '1year': return 'Monthly Fraud Distribution (Miezi 12)';
      default: return 'Time-Series Fraud Distribution';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-xl backdrop-blur-md shadow-lg">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label || payload[0].name}</p>
          <p className="text-sm font-black text-gray-900">
            {payload[0].name}: <span className="text-[#B8860B] font-bold">{payload[0].value.toLocaleString()}</span>
          </p>
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
    <div className="space-y-8 animate-fadeIn">
      {/* Timeframe Filter Buttons */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
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
                  ? 'bg-gray-100 text-gray-900 border border-gray-300 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-transparent border border-transparent'
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
            className="bg-gray-50 border border-gray-300 text-gray-900 p-2 rounded-xl focus:border-[#D4AF37] outline-none transition-all font-medium"
          />
          <span className="text-gray-600 font-bold">ZIKIWA</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 p-2 rounded-xl focus:border-[#D4AF37] outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { key: 'totalTransactions', val: Number(stats.total_transactions)?.toLocaleString() || 0, col: 'text-blue-700', border: 'via-blue-500/40' },
          { key: 'predictedFraud', val: Number(stats.predicted_frauds)?.toLocaleString() || 0, col: 'text-amber-700', border: 'via-[#D4AF37]/50' },
          { key: 'pendingReviews', val: Number(stats.pending_reviews)?.toLocaleString() || 0, col: 'text-purple-700', border: 'via-purple-500/40' },
          { key: 'confirmedFraud', val: Number(stats.confirmed_frauds)?.toLocaleString() || 0, col: 'text-red-700', border: 'via-red-500/40' },
          { key: 'fraudRate', val: `${stats.fraud_rate || 0}%`, col: 'text-rose-700', border: 'via-rose-500/40' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${item.border} to-transparent`}></div>
            <div className="text-gray-500 text-[10px] font-black uppercase tracking-wider">{t(item.key)}</div>
            <div className={`text-2xl font-black mt-3 tracking-tight ${item.col}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Graph 1: Mienendo ya Udanganyifu (Trend Chart) */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#dc2626]/40 to-transparent"></div>
          <h3 className="text-sm font-black text-gray-900 tracking-widest uppercase mb-6 flex items-center gap-2">
            <span>📊</span> {t('trend')} ({timeframe.toUpperCase()})
          </h3>
          
          {trendData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time_label" stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar 
                    dataKey="Miamala ya Shaka" 
                    fill="#dc2626" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500 text-sm font-medium">
              Hakuna data ya mwenendo iliyopatikana kwa kipindi hiki.
            </div>
          )}
        </div>

        {/* Graph 2: Advanced Histogram/Area Time Distribution */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#0284c7]/40 to-transparent"></div>
          <h3 className="text-sm font-black text-gray-900 tracking-widest uppercase mb-6 flex items-center gap-2">
            <span>📈</span> {getDistributionTitle()}
          </h3>
          
          {distribution.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fraudColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="time_label" 
                    stroke="#475569" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis stroke="#475569" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Idadi ya Utapeli"
                    stroke="#0284c7" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#fraudColor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500 text-sm font-medium">
              Hakuna mgawanyo wa kihistoria (Time Distribution) uliopatikana kwa sasa.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
