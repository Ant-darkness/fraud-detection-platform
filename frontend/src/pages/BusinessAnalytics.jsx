import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

// Mfano wa maswali ya haraka (Quick Prompts) kumpa muongozo Afisa
const QUICK_PROMPTS = [
  {
    category: 'AML & Forensics',
    title: 'Akaunti Zilizofagia Salio (Draining)',
    prompt: 'Nionyeshe akaunti zilizofagia salio lote kuwa TZS 0 zikiwa na kiasi kinachozidi TZS 10,000,000.'
  },
  {
    category: 'AML & Forensics',
    title: 'Miamala Mikubwa ya CASH_OUT',
    prompt: 'Orodhesha miamala 20 ya mwisho ya aina ya CASH_OUT yenye thamani kubwa zaidi ya TZS 50,000,000.'
  },
  {
    category: 'AI & Fraud Risk',
    title: 'High Risk Unreviewed',
    prompt: 'Tafuta miamala yote iliyopewa risk score ya zaidi ya 0.85 na AI lakini bado haijakaguliwa.'
  },
  {
    category: 'Operations',
    title: 'Miamala ya Smurfing Pattern',
    prompt: 'Nionyeshe akaunti zinazopokea miamala mingi midogo midogo chini ya TZS 5,000,000 kutoka kwa watumaji tofauti.'
  }
];

const BusinessAnalytics = ({ showToast }) => {
  const { t } = useLanguage();
  const [agentPrompt, setAgentPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // PAGINATION & VIEW STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [displayStyle, setDisplayStyle] = useState('table'); // 'table' | 'summary' | 'json'

  const rawItems = queryResults?.items || [];

  // Bainisha kama data inayorudi ni fupi/metrics ya kuonyeshwa kama Pink Cards
  const isSummaryData = useMemo(() => {
    if (!queryResults) return false;
    if (queryResults.display_mode === 'cards') return true;
    if (rawItems.length === 1 && Object.keys(rawItems[0]).length <= 6) return true;
    return false;
  }, [queryResults, rawItems]);

  useEffect(() => {
    if (queryResults) {
      setCurrentPage(1);
      setDisplayStyle(isSummaryData ? 'summary' : 'table');
    }
  }, [queryResults, isSummaryData]);

  // Execute Agent Autonomous SELECT Query
  const handleExecuteAgent = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    
    const finalPrompt = customPrompt || agentPrompt;

    if (!finalPrompt.trim()) {
      if (showToast) showToast("Tafadhali andika swali au uchague prompt ya mfano.", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await api.businessAnalytics.askAgent(finalPrompt);
      if (response && response.success) {
        setQueryResults({
          ...response,
          category: 'Forensic Query Agent',
          title: `Swali: "${finalPrompt}"`,
          source: 'AI_AGENT'
        });
        if (showToast) {
          showToast(
            `Agent amekamilisha uchambuzi! Miamala ${response.total_found ?? response.items?.length ?? 0} imepatikana.`, 
            "success"
          );
        }
      }
    } catch (error) {
      if (showToast) showToast(error.message || "Agent ameshindwa kutekeleza swali hili.", "error");
    } finally {
      setLoading(false);
    }
  };

  // PAGINATION COMPUTATIONS
  const totalFound = queryResults?.total_found ?? rawItems.length;
  const totalPages = Math.ceil(rawItems.length / pageSize) || 1;

  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return rawItems.slice(startIdx, startIdx + pageSize);
  }, [rawItems, currentPage, pageSize]);

  // Render Table Head
  const renderTableHead = () => {
    if (!rawItems.length) return null;
    const keys = Object.keys(rawItems[0]);
    return (
      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 uppercase font-bold text-[11px] tracking-wider sticky top-0 z-20">
        <th className="py-3 px-4 text-center w-12 bg-gray-100">#</th>
        {keys.map((key) => (
          <th key={key} className="py-3 px-4 text-left whitespace-nowrap min-w-[140px] bg-gray-100">
            {key.replace(/_/g, ' ')}
          </th>
        ))}
      </tr>
    );
  };

  // Render Table Body Rows
  const renderTableBody = () => {
    if (!paginatedItems.length) return null;
    return paginatedItems.map((row, idx) => {
      const absoluteIdx = (currentPage - 1) * pageSize + idx + 1;
      return (
        <tr key={idx} className="hover:bg-pink-50/30 transition-colors border-b border-gray-100 text-xs">
          <td className="py-3 px-4 text-center font-mono text-gray-400 font-bold">{absoluteIdx}</td>
          {Object.entries(row).map(([key, val], cellIdx) => {
            const isAmount = key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance');
            const isRisk = key.toLowerCase().includes('prob') || key.toLowerCase().includes('risk');
            const numVal = typeof val === 'number' ? val : (!isNaN(Number(val)) && val !== '' && val !== null) ? Number(val) : null;

            return (
              <td key={cellIdx} className="py-3 px-4 font-mono text-gray-800 whitespace-nowrap">
                {isAmount && numVal !== null ? (
                  <span className="font-bold text-emerald-700">TZS {numVal.toLocaleString()}</span>
                ) : isRisk && numVal !== null ? (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    numVal >= 0.8 ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {(numVal * 100).toFixed(1)}%
                  </span>
                ) : numVal !== null ? (
                  numVal.toLocaleString()
                ) : (
                  String(val ?? 'N/A')
                )}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  // PINK SUMMARY CARDS VIEW
  const renderPinkSummaryCards = () => {
    const dataToDisplay = queryResults?.summary_metrics || (rawItems.length > 0 ? rawItems[0] : null);
    if (!dataToDisplay) return null;

    return (
      <div className="py-4 overflow-y-auto max-h-[500px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(dataToDisplay).map(([key, val], idx) => {
            const isFraudRelated = key.toLowerCase().includes('fraud') || key.toLowerCase().includes('risk') || key.toLowerCase().includes('bad');
            const numVal = typeof val === 'number' ? val : (!isNaN(Number(val)) && val !== '' && val !== null) ? Number(val) : null;

            return (
              <div 
                key={idx} 
                className={`p-5 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                  isFraudRelated 
                    ? 'bg-pink-100/80 border-pink-300 text-pink-950 shadow-pink-100' 
                    : 'bg-pink-50/60 border-pink-200 text-pink-900 shadow-pink-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-pink-700/80 block">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs">📊</span>
                </div>

                <div className="text-2xl font-mono font-black text-pink-950 mt-1">
                  {numVal !== null ? numVal.toLocaleString() : String(val ?? '0')}
                </div>

                <div className="mt-3 pt-2 border-t border-pink-200/60 flex items-center justify-between text-[10px] text-pink-600 font-bold">
                  <span>Metric / Count</span>
                  <span className="bg-pink-200/70 px-2 py-0.5 rounded-full text-pink-800">Verified</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`transition-all duration-300 font-sans ${
      isMaximized 
        ? 'fixed inset-2 md:inset-4 z-50 bg-white border border-[#D4AF37] backdrop-blur-3xl rounded-3xl p-4 md:p-6 flex flex-col shadow-2xl overflow-hidden' 
        : 'space-y-6 relative'
    }`}>

      {/* RESULTS PORTAL VIEW */}
      {queryResults ? (
        <div className="bg-white border border-gray-200/80 shadow-sm rounded-2xl p-4 md:p-6 space-y-4 relative overflow-hidden animate-fadeIn flex-1 flex flex-col min-h-0">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4 shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {queryResults.category}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl text-[11px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {isMaximized ? `🗗 ${t('btnMinimize') || 'Minimize'}` : `🗖 ${t('btnMaximize') || 'Maximize'}`}
                </button>
              </div>
              
              <h3 className="text-base md:text-lg font-bold text-gray-900 mt-1">{queryResults.title}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Jumla ya matokeo: <strong className="text-[#B8860B] font-bold">{totalFound.toLocaleString()}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setQueryResults(null)}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0"
            >
              ⬅️ Uliza Swali Jingine
            </button>
          </div>

          {/* AI Explanation preview */}
          {queryResults.explanation && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 shrink-0">
              <div className="text-xs font-bold text-[#B8860B] uppercase tracking-wider flex items-center gap-2">
                <span>🤖 Uchambuzi wa Agent:</span>
              </div>
              <p className="text-xs text-gray-800 leading-relaxed font-medium">{queryResults.explanation}</p>
              
              {queryResults.generated_sql && (
                <details className="mt-1 text-[11px] text-gray-600 font-mono bg-white p-2 rounded-lg border border-amber-200/60">
                  <summary className="cursor-pointer font-bold text-[#B8860B]">Onyesha SQL Query Iliyotumiwa na Agent (SELECT Only)</summary>
                  <pre className="mt-2 p-2.5 bg-gray-900 text-amber-300 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-xs max-h-32">
                    {queryResults.generated_sql}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* DISPLAY MODE & PAGINATION CONTROLS BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 shrink-0">
            {/* View Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Muonekano:</span>
              <button
                type="button"
                onClick={() => setDisplayStyle('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayStyle === 'table' ? 'bg-[#B8860B] text-white shadow-sm' : 'bg-white border text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Meza (Table List)
              </button>
              <button
                type="button"
                onClick={() => setDisplayStyle('summary')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayStyle === 'summary' ? 'bg-pink-600 text-white shadow-sm' : 'bg-white border text-gray-700 hover:bg-gray-100'
                }`}
              >
                🌸 Pink Cards (Metrics)
              </button>
              <button
                type="button"
                onClick={() => setDisplayStyle('json')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayStyle === 'json' ? 'bg-[#B8860B] text-white shadow-sm' : 'bg-white border text-gray-700 hover:bg-gray-100'
                }`}
              >
                {`{ }`} Raw JSON
              </button>
            </div>

            {/* Page Size Selector */}
            {displayStyle === 'table' && rawItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Onyesha kwa Ukurasa:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="p-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>

          {/* DYNAMIC TABLE LIST VIEW */}
          {displayStyle === 'table' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
              <div className="w-full border border-gray-200 rounded-xl bg-white shadow-inner overflow-auto flex-1 relative">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>{renderTableHead()}</thead>
                  <tbody className="divide-y divide-gray-100">{renderTableBody()}</tbody>
                </table>

                {rawItems.length === 0 && (
                  <div className="py-12 text-center text-gray-500 text-sm font-medium">
                    Hakuna data iliyokidhi vigezo vya swali hili.
                  </div>
                )}
              </div>

              {/* PAGINATION FOOTER */}
              {rawItems.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 text-xs font-bold text-gray-600 shrink-0">
                  <div>
                    Inaonyesha <span className="text-gray-900">{(currentPage - 1) * pageSize + 1}</span> mpaka{' '}
                    <span className="text-gray-900">{Math.min(currentPage * pageSize, rawItems.length)}</span> kati ya{' '}
                    <span className="text-[#B8860B]">{rawItems.length}</span> miamala
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-lg border border-gray-300 transition-all cursor-pointer font-bold"
                    >
                      ◀️ Prev
                    </button>
                    <span className="px-2 font-mono">
                      Ukurasa {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-lg border border-gray-300 transition-all cursor-pointer font-bold"
                    >
                      Next ▶️
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PINK SUMMARY CARDS VIEW */}
          {displayStyle === 'summary' && renderPinkSummaryCards()}

          {/* RAW JSON VIEW */}
          {displayStyle === 'json' && (
            <div className="bg-gray-900 p-4 rounded-xl text-amber-300 font-mono text-xs overflow-auto flex-1">
              <pre>{JSON.stringify(queryResults, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (

        /* MAIN AGENT INPUT CONSOLE */
        <div className="bg-white border border-gray-200/80 shadow-sm rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"></div>
          
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">
                  Forensic Query Agent Console (Read-Only Engine)
                </h3>
                <p className="text-xs text-gray-500">
                  Muulize Agent maswali ya kiuchunguzi kwa kutumia lugha ya kawaida (Kiswahili au Kiingereza).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl text-[11px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              {isMaximized ? `🗗 ${t('btnMinimize') || 'Minimize'}` : `🗖 ${t('btnMaximize') || 'Maximize'}`}
            </button>
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              💡 Maswali ya Mfano (Quick Forensic Queries)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAgentPrompt(item.prompt);
                    handleExecuteAgent(null, item.prompt);
                  }}
                  className="p-3 bg-gray-50 hover:bg-amber-50/70 border border-gray-200 hover:border-amber-300 rounded-xl text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                >
                  <span className="text-[10px] font-black uppercase text-[#B8860B] tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-gray-800 group-hover:text-[#B8860B] transition-colors block">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AGENT INPUT FORM */}
          <form onSubmit={(e) => handleExecuteAgent(e)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Andika Swali/Uchambuzi Unaohitaji
              </label>
              <textarea
                rows={4}
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="Mfano: Nionyeshe miamala 50 ya mwisho iliyo na kiasi kikubwa zaidi ya TZS 20,000,000 kutoka kwa akaunti zisizojulikana..."
                className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:border-[#D4AF37] focus:bg-white outline-none shadow-sm transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-amber-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                  Agent Anachanganua Database & Anatekeleza Query...
                </>
              ) : (
                <>⚡ Tekeleza Uchambuzi (Execute SELECT Query)</>
              )}
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default BusinessAnalytics;
