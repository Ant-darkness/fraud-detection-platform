import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FcApproval, FcDisclaimer, FcClock, FcComboChart, FcDataSheet, FcCalendar, FcDownload } from 'react-icons/fc';
import { FiFilter } from 'react-icons/fi';
import { HiChevronLeft, HiChevronRight, HiX, HiArrowsExpand, HiOutlineRefresh } from 'react-icons/hi';

const generateContinuousBuckets = (timeframe, rawData = []) => {
  const dataMap = new Map();
  
  rawData.forEach(item => {
    const rawKey = String(item.time_label || item.label || item.time || item.period || '').trim().toLowerCase();
    dataMap.set(rawKey, item);
  });

  const buckets = [];
  const normalizedTf = timeframe ? timeframe.toUpperCase() : '24HRS';

  switch (normalizedTf) {
    case '24HRS': {
      for (let i = 0; i < 24; i++) {
        const hourStr = `${String(i).padStart(2, '0')}:00`;
        const matched = dataMap.get(hourStr.toLowerCase()) || dataMap.get(String(i));
        buckets.push({
          time_label: hourStr,
          safe_volume: Number(matched?.safe_volume ?? matched?.safe ?? 0),
          fraud_volume: Number(matched?.fraud_volume ?? matched?.fraud ?? 0)
        });
      }
      break;
    }
    case '7DAYS': {
      const days = ['Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi', 'Jumapili'];
      const dayShorts = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      days.forEach((dayName, idx) => {
        const matched = dataMap.get(dayName.toLowerCase()) || dataMap.get(dayShorts[idx]);
        buckets.push({
          time_label: dayName,
          safe_volume: Number(matched?.safe_volume ?? matched?.safe ?? 0),
          fraud_volume: Number(matched?.fraud_volume ?? matched?.fraud ?? 0)
        });
      });
      break;
    }
    case '4WEEKS': {
      for (let w = 1; w <= 4; w++) {
        const weekLabel = `Wiki ${w}`;
        const matched = dataMap.get(weekLabel.toLowerCase()) || dataMap.get(`wk ${w}`);
        buckets.push({
          time_label: weekLabel,
          safe_volume: Number(matched?.safe_volume ?? matched?.safe ?? 0),
          fraud_volume: Number(matched?.fraud_volume ?? matched?.fraud ?? 0)
        });
      }
      break;
    }
    case '1YEAR': {
      const months = ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Yuni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'];
      const monthShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      months.forEach((monthName, idx) => {
        const matched = dataMap.get(monthName.toLowerCase()) || dataMap.get(monthShorts[idx]);
        buckets.push({
          time_label: monthName,
          safe_volume: Number(matched?.safe_volume ?? matched?.safe ?? 0),
          fraud_volume: Number(matched?.fraud_volume ?? matched?.fraud ?? 0)
        });
      });
      break;
    }
    default:
      return rawData;
  }

  return buckets;
};

const Dashboard = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [timeframe, setTimeframe] = useState('24HRS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loadingData, setLoadingData] = useState(false);
  const [exportingChart, setExportingChart] = useState(false);

  // Stats KPI State
  const [stats, setStats] = useState({
    total_transactions: 0,
    predicted_frauds: 0,
    pending_reviews: 0,
    confirmed_frauds: 0,
    fraud_rate: 0
  });

  const [trendData, setTrendData] = useState([]);

  // Child Page Modal States
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [childTableData, setChildTableData] = useState([]);
  const [childChartData, setChildChartData] = useState([]);
  const [loadingChildData, setLoadingChildData] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') showToast(msg, type);
  }, [showToast]);

  const getInputProps = () => {
    switch (timeframe.toUpperCase()) {
      case '24HRS':
        return { type: 'datetime-local', step: '3600' };
      case '7DAYS':
      case '4WEEKS':
        return { type: 'date' };
      case '1YEAR':
        return { type: 'month' };
      default:
        return { type: 'date' };
    }
  };

  const formatBackendDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.includes('T') ? dateStr.replace('T', ' ') : dateStr;
  };

  // Load Main Dashboard Data with Optimized Limits
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    setLoadingData(true);

    try {
      const queryParams = {
        timeframe,
        startDate: formatBackendDate(startDate),
        endDate: formatBackendDate(endDate),
        limit: 100
      };

      const results = await Promise.allSettled([
        api.dashboard.getSummary(),
        api.forensics.getFraudAnalytics(queryParams)
      ]);

      const summary = results[0].status === 'fulfilled' ? results[0].value : null;
      const analytics = results[1].status === 'fulfilled' ? results[1].value : null;

      if (summary) {
        setStats({
          total_transactions: Number(summary.total_transactions || 0),
          predicted_frauds: Number(summary.predicted_frauds || 0),
          pending_reviews: Number(summary.pending_reviews || 0),
          confirmed_frauds: Number(summary.confirmed_frauds || 0),
          fraud_rate: summary.fraud_rate ?? 0
        });
      }

      if (analytics) {
        const rawTrend = analytics.chart_data || [];
        const continuousTrend = generateContinuousBuckets(timeframe, rawTrend);
        
        setTrendData(continuousTrend);

        if (analytics.table_data) {
          setChildTableData(analytics.table_data);
          setChildChartData(continuousTrend);
        }
      }

      if (isManualRefresh) {
        notify("Dashboard na Mwenendo wa Fraud vimesawazishwa kikamilifu!", "success");
      }
    } catch (err) {
      notify("Hitilafu wakati wa kupakia data za mwanzo.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [timeframe, startDate, endDate, notify]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Timeframe Change
  const handleTimeframeChange = (newTf) => {
    setTimeframe(newTf);
    setStartDate('');
    setEndDate('');
  };

  // Real-time WebSocket listener for fraud updates
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;
    const { transaction } = lastMessage;
    const isFraud = transaction?.is_fraud || false;

    setStats(prev => ({
      ...prev,
      total_transactions: prev.total_transactions + 1,
      predicted_frauds: isFraud ? prev.predicted_frauds + 1 : prev.predicted_frauds,
      pending_reviews: isFraud ? prev.pending_reviews + 1 : prev.pending_reviews
    }));
  }, [lastMessage]);

  const handleOpenChildPage = async () => {
    setIsChildDialogOpen(true);
    setLoadingChildData(true);
    setCurrentPage(1);

    try {
      const queryParams = {
        timeframe,
        startDate: formatBackendDate(startDate),
        endDate: formatBackendDate(endDate),
        limit: 500
      };

      const res = await api.forensics.getFraudAnalytics(queryParams);
      if (res) {
        setChildTableData(res.table_data || []);
        setChildChartData(generateContinuousBuckets(timeframe, res.chart_data || []));
      }
    } catch (err) {
      notify("Hitilafu ya mtandao wakati wa kupakua taarifa za kina.", "error");
    } finally {
      setLoadingChildData(false);
    }
  };

  const handleExportChart = async () => {
    if (!trendData || trendData.length === 0) {
      notify("Hakuna data ya chati ya kupakua.", "warning");
      return;
    }

    setExportingChart(true);
    try {
      const payload = {
        title: `Fraud_Analytics_${timeframe}`,
        x_col: "time_label",
        y_cols: ["safe_volume", "fraud_volume"],
        data: trendData
      };
      await api.agents.downloadChartPng(payload);
      notify("Chati ya Utapeli imepakuliwa kwa mafanikio!", "success");
    } catch (err) {
      notify(err.message || "Imeshindikana kupakua chati.", "error");
    } finally {
      setExportingChart(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(childTableData.length / pageSize));
  const paginatedChildItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return childTableData.slice(startIdx, startIdx + pageSize);
  }, [childTableData, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans select-none pb-10">
      {/* 1. Filter Control Panel */}
      <div className="neo-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mr-2">
              <FiFilter className="text-lg" /> Kipindi:
            </span>
            {['24HRS', '7DAYS', '4WEEKS', '1YEAR'].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleTimeframeChange(tf)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  timeframe === tf ? 'neo-button-active text-indigo-600' : 'neo-button text-slate-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {loadingData && (
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
              <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Inasawazisha Dashboard...</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-300/50 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-5 flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <FcCalendar className="text-base" /> Anzia Tarehe
            </label>
            <input
              {...getInputProps()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="neo-inset text-slate-800 text-xs font-bold rounded-2xl px-4 py-3 outline-none w-full"
            />
          </div>

          <div className="sm:col-span-5 flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <FcCalendar className="text-base" /> Ishia Tarehe
            </label>
            <input
              {...getInputProps()}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="neo-inset text-slate-800 text-xs font-bold rounded-2xl px-4 py-3 outline-none w-full"
            />
          </div>

          <div className="sm:col-span-2 flex items-end h-full pt-4 sm:pt-0">
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              className="neo-button text-indigo-600 font-black text-xs px-4 py-3.5 rounded-2xl w-full flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <HiOutlineRefresh className="text-base" /> Sawsazisha
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Jumla ya Miamala</span>
            <FcComboChart className="text-2xl" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
            {stats.total_transactions.toLocaleString()}
          </div>
        </div>

        <div className="neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Tishio la Utapeli (Predicted)</span>
            <FcDisclaimer className="text-2xl" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
            {stats.predicted_frauds.toLocaleString()}
          </div>
        </div>

        <div className="neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Miamala Inayokaguliwa</span>
            <FcClock className="text-2xl" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2 font-mono">
            {stats.pending_reviews.toLocaleString()}
          </div>
        </div>

        <div className="neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Utapeli Uliothibitishwa</span>
            <FcApproval className="text-2xl" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2 font-mono">
            {stats.confirmed_frauds.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3. Main Trend Chart Panel */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FcComboChart className="text-xl" /> Mwenendo wa Miamala: Miamala Salama vs Utapeli ({timeframe})
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenChildPage}
              className="neo-button text-slate-700 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <HiArrowsExpand className="text-base text-indigo-600" /> Fungua Detail Page
            </button>
            <button
              type="button"
              onClick={handleExportChart}
              disabled={exportingChart}
              className="neo-button text-indigo-600 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {exportingChart ? (
                <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <FcDownload className="text-base" />
              )}
              <span>Export Chart (PNG)</span>
            </button>
          </div>
        </div>

        <div className="h-80 w-full pt-2 neo-inset p-4 rounded-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="time_label" stroke="#475569" fontSize={11} fontWeight={800} />
              <YAxis stroke="#475569" fontSize={10} fontWeight={800} tickFormatter={(val) => val.toLocaleString()} />
              <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="safe_volume" name="Miamala Salama" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="fraud_volume" name="Miamala ya Utapeli" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Child Detail Modal Dialog */}
      {isChildDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className={`neo-card overflow-hidden flex flex-col bg-slate-100 text-slate-800 transition-all border border-slate-300/80 shadow-2xl ${
            isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[90vh] rounded-3xl'
          }`}>
            
            <div className="p-5 border-b border-slate-300/60 flex items-center justify-between bg-slate-100">
              <div className="flex items-center gap-3">
                <FcDataSheet className="text-2xl" />
                <div>
                  <h4 className="font-black text-sm text-indigo-700 uppercase tracking-wider">
                    Uchambuzi wa Kiuchunguzi wa Fraud - Kipindi cha {timeframe}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-500">
                    Orodha ya Miamala yenye Viashiria vya Utapeli
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsMaximized(!isMaximized)} 
                  className="neo-button px-3 py-2 text-xs rounded-xl text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <HiArrowsExpand /> {isMaximized ? 'Restore' : 'Maximize'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsChildDialogOpen(false)} 
                  className="neo-button p-2 text-rose-600 text-xs rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                >
                  <HiX className="text-base" /> Funga
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingChildData ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-xs font-bold text-indigo-600">
                  <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Inapakua kumbukumbu za Kiuchunguzi...</span>
                </div>
              ) : (
                <>
                  <div className="neo-card p-5 space-y-3">
                    <h5 className="text-xs font-black text-slate-800 tracking-wider uppercase flex items-center gap-2">
                      <FcComboChart className="text-lg" /> Mwenendo wa Utapeli kwa Kipindi
                    </h5>
                    <div className="h-72 w-full neo-inset p-3 rounded-2xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={childChartData} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                          <XAxis dataKey="time_label" stroke="#475569" fontSize={10} fontWeight={800} />
                          <YAxis stroke="#475569" fontSize={10} fontWeight={800} />
                          <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                          <Legend verticalAlign="top" height={30} />
                          <Bar dataKey="safe_volume" name="Miamala Salama" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                          <Bar dataKey="fraud_volume" name="Utapeli" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="neo-card p-5 space-y-3">
                    <h5 className="text-xs font-black text-slate-800 tracking-wider uppercase">
                      Kumbukumbu za Miamala ya Utapeli (Flagged Fraud Records)
                    </h5>
                    <div className="overflow-x-auto neo-inset p-3 rounded-2xl">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-slate-300 text-indigo-900">
                            <th className="p-3 uppercase font-black">ID ya Muamala</th>
                            <th className="p-3 uppercase font-black">Aina</th>
                            <th className="p-3 uppercase font-black">Kiasi (TZS)</th>
                            <th className="p-3 uppercase font-black">Risk Score</th>
                            <th className="p-3 uppercase font-black">Hali</th>
                            <th className="p-3 uppercase font-black">Muda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedChildItems.length > 0 ? (
                            paginatedChildItems.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-200/60 hover:bg-slate-200/40 transition-colors">
                                <td className="p-3 text-slate-800 font-bold">{row.transaction_id || row.id || `TXN-${idx+1}`}</td>
                                <td className="p-3 text-slate-700 font-bold">{row.type || 'N/A'}</td>
                                <td className="p-3 text-slate-900 font-bold">{Number(row.amount || 0).toLocaleString()}</td>
                                <td className="p-3 text-rose-600 font-black">{row.risk_score ? `${(row.risk_score * 100).toFixed(1)}%` : 'HIGH'}</td>
                                <td className="p-3">
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-300">
                                    {row.status || 'SUSPICIOUS'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 font-medium">{row.created_at || row.time_label || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-500 font-bold">
                                Hakuna kumbukumbu za utapeli zilizopatikana.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {childTableData.length > 0 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-bold text-slate-500">
                          Ukurasa {currentPage} kati ya {totalPages} (Jumla: {childTableData.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="neo-button p-2 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                          >
                            <HiChevronLeft className="text-base" />
                          </button>
                          <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="neo-button p-2 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                          >
                            <HiChevronRight className="text-base" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
