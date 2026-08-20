import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FcLineChart, FcDataSheet, FcMoneyTransfer, FcDownload, FcCalendar } from 'react-icons/fc';
import { FiFilter } from 'react-icons/fi';
import { HiChevronLeft, HiChevronRight, HiX, HiArrowsExpand, HiOutlineRefresh } from 'react-icons/hi';

// Continuous Time Generator kwa ajili ya Mzunguko na Ukwasi
const generateContinuousVolumeBuckets = (timeframe, rawData = []) => {
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
        const matched = dataMap.get(hourStr.toLowerCase()) || 
                        dataMap.get(String(i)) || 
                        dataMap.get(`${i}:00`);
        buckets.push({
          time_label: hourStr,
          volume: Number(matched?.volume ?? matched?.count ?? 0),
          amount: Number(matched?.amount ?? matched?.total_amount ?? 0)
        });
      }
      break;
    }
    case '7DAYS': {
      const days = ['Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi', 'Jumapili'];
      const dayShorts = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      days.forEach((dayName, idx) => {
        const shortName = dayShorts[idx];
        const matched = dataMap.get(dayName.toLowerCase()) || 
                        dataMap.get(shortName) || 
                        dataMap.get(String(idx + 1));
        buckets.push({
          time_label: dayName,
          volume: Number(matched?.volume ?? matched?.count ?? 0),
          amount: Number(matched?.amount ?? matched?.total_amount ?? 0)
        });
      });
      break;
    }
    case '4WEEKS': {
      for (let w = 1; w <= 4; w++) {
        const weekLabel = `Wiki ${w}`;
        const matched = dataMap.get(weekLabel.toLowerCase()) || 
                        dataMap.get(`wk ${w}`) || 
                        dataMap.get(String(w));
        buckets.push({
          time_label: weekLabel,
          volume: Number(matched?.volume ?? matched?.count ?? 0),
          amount: Number(matched?.amount ?? matched?.total_amount ?? 0)
        });
      }
      break;
    }
    case '1YEAR': {
      const months = ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Yuni', 'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'];
      const monthShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      months.forEach((monthName, idx) => {
        const shortName = monthShorts[idx];
        const matched = dataMap.get(monthName.toLowerCase()) || 
                        dataMap.get(shortName) || 
                        dataMap.get(String(idx + 1));
        buckets.push({
          time_label: monthName,
          volume: Number(matched?.volume ?? matched?.count ?? 0),
          amount: Number(matched?.amount ?? matched?.total_amount ?? 0)
        });
      });
      break;
    }
    default:
      return rawData;
  }

  return buckets;
};

const VolumeAnalysis = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  // Timeframe and Date Filtering States
  const [timeframe, setTimeframe] = useState('24HRS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loadingData, setLoadingData] = useState(false);
  const [analyzingAgent, setAnalyzingAgent] = useState(false);
  const [exportingMainChart, setExportingMainChart] = useState(false);

  // Volume Summary & Chart Data
  const [volumeData, setVolumeData] = useState({
    total_volume: 0,
    total_amount: 0,
    chart_data: [],
    agent_explanation: "Uchambuzi wa mzunguko wa ukwasi unachakatwa...",
    agent_recommendation: "Ushauri wa kisera utatolewa kulingana na mabadiliko.",
    risk_level: "NORMAL"
  });

  // ChildPage Dialog States
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [childTableData, setChildTableData] = useState([]);
  const [childChartData, setChildChartData] = useState([]);
  const [loadingChildData, setLoadingChildData] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const getInputProps = () => {
    switch (timeframe.toUpperCase()) {
      case '24HRS':
        return { type: 'datetime-local', step: '3600', placeholder: 'Chagua Saa na Tarehe' };
      case '7DAYS':
      case '4WEEKS':
        return { type: 'date', placeholder: 'Chagua Tarehe' };
      case '1YEAR':
        return { type: 'month', placeholder: 'Chagua Mwezi na Mwaka' };
      default:
        return { type: 'date', placeholder: 'Chagua Tarehe' };
    }
  };

  const formatBackendDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.includes('T') ? dateStr.replace('T', ' ') : dateStr;
  };

  // Optimized Fetch directly from Forensics Service
  const fetchVolumeAndAgentData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setAnalyzingAgent(true);
    else setLoadingData(true);

    try {
      const queryParams = {
        timeframe,
        startDate: formatBackendDate(startDate),
        endDate: formatBackendDate(endDate),
        limit: 100 // Optimized payload
      };

      const results = await Promise.allSettled([
        api.forensics.getVolumeAnalytics(queryParams),
        api.agents.getVolumeAnalyticsAgent(timeframe, "sw")
      ]);

      const volumeRes = results[0].status === 'fulfilled' ? results[0].value : {};
      const agentData = results[1].status === 'fulfilled' ? results[1].value : {};

      const rawChart = volumeRes?.chart_data || agentData?.chart_data || [];
      const continuousChart = generateContinuousVolumeBuckets(timeframe, rawChart);

      setVolumeData({
        total_volume: Number(volumeRes?.total_volume) || Number(agentData?.total_volume) || 0,
        total_amount: Number(volumeRes?.total_amount) || Number(agentData?.total_amount) || 0,
        chart_data: continuousChart,
        agent_explanation: agentData?.agent_explanation || volumeRes?.agent_explanation || "Uchambuzi wa mzunguko wa ukwasi unaendelea.",
        agent_recommendation: agentData?.agent_recommendation || volumeRes?.agent_recommendation || "Ufuatiliaji wa vigezo unaendelea.",
        risk_level: agentData?.risk_level || volumeRes?.risk_level || "NORMAL"
      });

      // Update child page if open
      if (volumeRes?.table_data) {
        setChildTableData(volumeRes.table_data);
        setChildChartData(continuousChart);
      }

      if (isManualRefresh) {
        notify("Takwimu za ukwasi zimesawazishwa kutoka Mfumo wa Ukaguzi!", "success");
      }
    } catch (error) {
      notify(error.message || "Imeshindikana kupata data ya Mzunguko wa Ukwasi.", "error");
    } finally {
      setLoadingData(false);
      setAnalyzingAgent(false);
    }
  }, [timeframe, startDate, endDate, notify]);

  useEffect(() => {
    fetchVolumeAndAgentData();
  }, [fetchVolumeAndAgentData]);

  const handleTimeframeChange = (newTf) => {
    setTimeframe(newTf);
    setStartDate('');
    setEndDate('');
  };

  // WebSocket Live Stream Update
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;
    const { transaction } = lastMessage;
    const txAmount = Number(transaction?.amount) || 0;

    setVolumeData((prev) => {
      const updatedChart = [...prev.chart_data];
      if (updatedChart.length > 0) {
        const lastIdx = updatedChart.length - 1;
        const lastPoint = { ...updatedChart[lastIdx] };
        lastPoint.volume = (Number(lastPoint.volume) || 0) + 1;
        lastPoint.amount = (Number(lastPoint.amount) || 0) + txAmount;
        updatedChart[lastIdx] = lastPoint;
      }

      return {
        ...prev,
        total_volume: prev.total_volume + 1,
        total_amount: prev.total_amount + txAmount,
        chart_data: updatedChart
      };
    });
  }, [lastMessage]);

  const handleExportMainChart = async () => {
    if (!volumeData.chart_data || volumeData.chart_data.length === 0) {
      notify("Hakuna data ya chati inayoweza kupakuliwa.", "warning");
      return;
    }

    setExportingMainChart(true);
    try {
      const payload = {
        title: `Mzunguko_wa_Ukwasi_${timeframe}`,
        x_col: "time_label",
        y_cols: ["volume", "amount"],
        data: volumeData.chart_data
      };
      await api.agents.downloadChartPng(payload);
      notify("Chati ya Ukwasi imepakuliwa kwa mafanikio!", "success");
    } catch (err) {
      notify(err.message || "Hitilafu imetokea wakati wa kupakua chati.", "error");
    } finally {
      setExportingMainChart(false);
    }
  };

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

      const res = await api.forensics.getVolumeAnalytics(queryParams);
      if (res) {
        setChildTableData(res.table_data || []);
        setChildChartData(generateContinuousVolumeBuckets(timeframe, res.chart_data || []));
      }
    } catch (err) {
      notify("Hitilafu wakati wa kupakua kumbukumbu za kina za mzunguko.", "error");
    } finally {
      setLoadingChildData(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(childTableData.length / pageSize));
  const paginatedChildItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return childTableData.slice(startIdx, startIdx + pageSize);
  }, [childTableData, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans select-none pb-10">
      {/* 1. Filter Bar */}
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
              <span>Inasawazisha Takwimu za Ukwasi...</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-300/50 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-5 flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
              <FcCalendar className="text-base" /> Start Date / Time
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
              <FcCalendar className="text-base" /> End Date / Time
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
              onClick={() => fetchVolumeAndAgentData(true)}
              className="neo-button text-indigo-600 font-black text-xs px-4 py-3.5 rounded-2xl w-full flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <HiOutlineRefresh className="text-base" /> Sawsazisha
            </button>
          </div>
        </div>
      </div>

      {/* 2. Agent Insights */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <FcLineChart className="text-3xl" />
            <div>
              <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800">
                Macroprudential Liquidity Agent (Forensics Stream)
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

      {/* 3. Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Jumla ya Miamala (Total Volume)</span>
            <FcDataSheet className="text-2xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 font-mono">
            {volumeData.total_volume.toLocaleString()} <span className="text-xs text-slate-500">Txs</span>
          </div>
        </div>

        <div className="neo-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Thamani ya Mzunguko (Total Amount)</span>
            <FcMoneyTransfer className="text-2xl" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 font-mono">
            TZS {volumeData.total_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 4. Chart */}
      <div className="neo-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FcLineChart className="text-xl" /> Transaction Volume vs Total Amount ({timeframe})
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
              onClick={handleExportMainChart}
              disabled={exportingMainChart}
              className="neo-button text-indigo-600 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {exportingMainChart ? (
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
            <BarChart data={volumeData.chart_data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis 
                dataKey="time_label" 
                stroke="#475569" 
                fontSize={11} 
                tickLine={true} 
                fontWeight={800} 
                label={{ value: `Kipindi / Masaa (${timeframe})`, position: 'insideBottom', offset: -12, fill: '#334155', fontSize: 11, fontWeight: 900 }}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={true} 
                fontWeight={800}
                tickFormatter={(val) => val.toLocaleString()}
                label={{ value: 'Idadi ya Miamala (Volume)', angle: -90, position: 'insideLeft', offset: -5, fill: '#0284c7', fontSize: 10, fontWeight: 900 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={true} 
                tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v.toLocaleString()} 
                fontWeight={800}
                label={{ value: 'Thamani (TZS)', angle: 90, position: 'insideRight', offset: 5, fill: '#059669', fontSize: 10, fontWeight: 900 }}
              />
              <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
              <Bar yAxisId="left" dataKey="volume" name="Transaction Volume" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar yAxisId="right" dataKey="amount" name="Total Amount (TZS)" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Child Dialog Modal */}
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
                    Uchambuzi wa Detali wa Ukwasi - Kipindi cha {timeframe}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-500">
                    Orodha ya Miamala na Mwenendo kutoka Forensics Engine
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
                  <span>Inapakua kumbukumbu za Forensics...</span>
                </div>
              ) : (
                <>
                  <div className="neo-card p-5 space-y-3">
                    <h5 className="text-xs font-black text-slate-800 tracking-wider uppercase flex items-center gap-2">
                      <FcLineChart className="text-lg" /> Mwenendo wa Miamala vs Thamani ya Ukwasi
                    </h5>
                    <div className="h-72 w-full neo-inset p-3 rounded-2xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={childChartData} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                          <XAxis dataKey="time_label" stroke="#475569" fontSize={10} fontWeight={800} />
                          <YAxis yAxisId="left" stroke="#475569" fontSize={10} fontWeight={800} tickFormatter={(val) => val.toLocaleString()} />
                          <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} fontWeight={800} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v.toLocaleString()} />
                          <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                          <Legend verticalAlign="top" height={30} />
                          <Bar yAxisId="left" dataKey="volume" name="Transaction Volume" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={20} />
                          <Bar yAxisId="right" dataKey="amount" name="Total Amount (TZS)" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="neo-card p-5 space-y-3">
                    <h5 className="text-xs font-black text-slate-800 tracking-wider uppercase">
                      Kumbukumbu za Miamala ya Ukwasi (Forensic Volume Records)
                    </h5>
                    <div className="overflow-x-auto neo-inset p-3 rounded-2xl">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-slate-300 text-indigo-900">
                            <th className="p-3 uppercase font-black">ID ya Muamala</th>
                            <th className="p-3 uppercase font-black">Aina</th>
                            <th className="p-3 uppercase font-black">Kiasi (TZS)</th>
                            <th className="p-3 uppercase font-black">Sender</th>
                            <th className="p-3 uppercase font-black">Receiver</th>
                            <th className="p-3 uppercase font-black">Muda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedChildItems.length > 0 ? (
                            paginatedChildItems.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-200/60 hover:bg-slate-200/40 transition-colors">
                                <td className="p-3 text-slate-800 font-bold">{row.transaction_id || row.id || `TXN-${idx+1}`}</td>
                                <td className="p-3 text-slate-700 font-bold">{row.type || 'N/A'}</td>
                                <td className="p-3 text-slate-900 font-bold">{Number(row.amount || row.total_amount || 0).toLocaleString()}</td>
                                <td className="p-3 text-slate-700 font-bold">{row.sender_id || row.sender || 'N/A'}</td>
                                <td className="p-3 text-slate-700 font-bold">{row.receiver_id || row.receiver || 'N/A'}</td>
                                <td className="p-3 text-slate-600 font-medium">{row.created_at || row.time_label || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-500 font-bold">
                                Hakuna kumbukumbu za miamala zilizopatikana.
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

export default VolumeAnalysis;
