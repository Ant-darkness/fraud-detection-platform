import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Safe Toast Trigger (Crash Protection)
  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const rawItems = useMemo(() => {
    if (!queryResults) return [];
    if (Array.isArray(queryResults.items)) return queryResults.items;
    if (Array.isArray(queryResults.data)) return queryResults.data;
    if (Array.isArray(queryResults)) return queryResults;
    return [];
  }, [queryResults]);

  const isSummaryMode = useMemo(() => {
    if (!queryResults) return false;
    if (queryResults.display_mode === 'cards' || queryResults.summary_metrics) return true;
    if (rawItems.length === 1 && Object.keys(rawItems[0] || {}).length <= 6) return true;
    if (rawItems.length === 0 && !queryResults.generated_sql) return true;
    return false;
  }, [queryResults, rawItems]);

  const handleExecuteAgent = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const finalPrompt = (customPrompt || agentPrompt || '').trim();

    if (!finalPrompt) {
      notify('Tafadhali andika swali au uchague prompt ya mfano.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.businessAnalytics.askAgent(finalPrompt);
      if (response && (response.success || response.data || response.items)) {
        setQueryResults({
          ...(response.data || response),
          category: response.category || 'Forensic Query Agent',
          title: response.title || `Swali: "${finalPrompt}"`,
        });
        setCurrentPage(1);
        notify('Uchambuzi umekamilika kikamilifu!', 'success');
      } else {
        throw new Error(response?.message || 'Aina ya data iliyorejeshwa si sahihi.');
      }
    } catch (error) {
      notify(error.message || 'Agent ameshindwa kutekeleza swali hili.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalFound = queryResults?.total_found ?? rawItems.length;
  const totalPages = Math.max(1, Math.ceil(rawItems.length / pageSize));

  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return rawItems.slice(startIdx, startIdx + pageSize);
  }, [rawItems, currentPage, pageSize]);

  const renderTableHead = () => {
    if (!rawItems.length) return null;
    const keys = Object.keys(rawItems[0] || {});
    return (
      <tr className="bg-pink-300/40 border-b border-pink-300/80 text-pink-950 uppercase font-black text-[10px] tracking-wider sticky top-0 z-20 select-none">
        <th className="py-3.5 px-4 text-center w-12 border-r border-pink-300/50">#</th>
        {keys.map((key) => (
          <th key={key} className="py-3.5 px-4 text-left whitespace-nowrap min-w-[140px] border-r border-pink-300/50">
            {key.replace(/_/g, ' ')}
          </th>
        ))}
      </tr>
    );
  };

  const renderTableBody = () => {
    if (!paginatedItems.length) return null;
    return paginatedItems.map((row, idx) => {
      const absoluteIdx = (currentPage - 1) * pageSize + idx + 1;
      return (
        <tr key={idx} className="hover:bg-pink-300/20 transition-colors border-b border-pink-300/50 text-xs font-mono text-slate-900">
          <td className="py-3 px-4 text-center text-pink-950 font-bold select-none">{absoluteIdx}</td>
          {Object.entries(row || {}).map(([key, val], cellIdx) => {
            const isAmount = key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance');
            const isRisk = key.toLowerCase().includes('prob') || key.toLowerCase().includes('risk');
            const numVal = typeof val === 'number' ? val : (!isNaN(Number(val)) && val !== '' && val !== null) ? Number(val) : null;

            return (
              <td key={cellIdx} className="py-3 px-4 text-slate-950 font-medium whitespace-nowrap select-none border-r border-pink-300/30">
                {isAmount && numVal !== null ? (
                  <span className="font-bold text-slate-950">TZS {numVal.toLocaleString()}</span>
                ) : isRisk && numVal !== null ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    numVal >= 0.8 ? 'bg-rose-600 text-white border-rose-700' : 'bg-emerald-600 text-white border-emerald-700'
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

  const renderMetricCards = () => {
    const dataToDisplay = queryResults?.summary_metrics || (rawItems.length > 0 ? rawItems[0] : null);
    if (!dataToDisplay) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-2">
        {Object.entries(dataToDisplay).map(([key, val], idx) => {
          const numVal = typeof val === 'number' ? val : (!isNaN(Number(val)) && val !== '' && val !== null) ? Number(val) : null;

          return (
            <div 
              key={idx} 
              className="p-5 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-pink-400 select-none"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider block truncate text-pink-300">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-base p-1.5 bg-slate-900 rounded-lg">📊</span>
              </div>

              <div className="text-2xl sm:text-3xl font-mono font-black text-white my-1 tracking-tight">
                {numVal !== null ? numVal.toLocaleString() : String(val ?? '0')}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-black text-pink-200/80">
                <span>VERIFIED METRIC</span>
                <span className="bg-pink-400/20 px-2 py-0.5 rounded-md border border-pink-400/30 text-pink-300">PROTECTED</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`transition-all duration-300 font-sans select-none ${
      isMaximized 
        ? 'fixed inset-2 md:inset-4 z-50 bg-[#F2C4CE] border-2 border-pink-400 rounded-3xl p-4 md:p-6 flex flex-col shadow-2xl overflow-hidden' 
        : 'space-y-6 relative'
    }`}>

      {/* RESULTS DISPLAY PORTAL */}
      {queryResults ? (
        <div className="bg-[#F2C4CE] text-slate-900 border border-pink-300/80 shadow-2xl rounded-3xl p-4 md:p-6 space-y-5 relative overflow-hidden flex-1 flex flex-col min-h-0">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-pink-300/80 pb-4 shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest bg-pink-300/60 border border-pink-400/60 px-3 py-1 rounded-full shadow-sm">
                  {queryResults.category || 'Analytics Engine'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="px-2.5 py-1 bg-slate-950/10 hover:bg-slate-950/20 border border-slate-950/20 text-slate-950 rounded-xl text-[11px] font-bold tracking-wider uppercase transition flex items-center gap-1 cursor-pointer"
                >
                  {isMaximized ? `🗗 ${t?.('btnMinimize') || 'Minimize'}` : `🗖 ${t?.('btnMaximize') || 'Maximize'}`}
                </button>
              </div>
              
              <h3 className="text-base md:text-lg font-black text-slate-950 mt-2">{queryResults.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => setQueryResults(null)}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-pink-200 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md flex items-center gap-2 shrink-0 border border-slate-800"
            >
              ⬅️ Uliza Swali Jingine
            </button>
          </div>

          {queryResults.explanation && (
            <div className="p-4 bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl space-y-1 shrink-0 shadow-md">
              <span className="text-xs font-black text-pink-300 uppercase tracking-wider block flex items-center gap-1">
                🤖 Uchambuzi wa Agent:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{queryResults.explanation}</p>
            </div>
          )}

          {queryResults.generated_sql && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 shrink-0 shadow-md">
              <div className="flex items-center justify-between text-[11px] font-bold text-pink-300">
                <span className="uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚙️</span> Executed SQL Statement:
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-md font-mono">
                  READ ONLY (SAFE)
                </span>
              </div>
              <pre className="p-3 bg-slate-900 text-pink-200 rounded-xl overflow-x-auto font-mono text-xs border border-slate-800 leading-relaxed scrollbar-thin">
                {queryResults.generated_sql}
              </pre>
            </div>
          )}

          {!isSummaryMode && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
              <div className="flex justify-between items-center text-xs font-black text-slate-950 px-1 shrink-0">
                <span>📋 Orodha ya Miamala ({totalFound.toLocaleString()})</span>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-pink-950 uppercase">Onyesha:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-pink-200 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="w-full border border-pink-300/80 rounded-2xl bg-slate-950/5 overflow-auto flex-1 relative shadow-inner scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>{renderTableHead()}</thead>
                  <tbody className="divide-y divide-pink-300/50">{renderTableBody()}</tbody>
                </table>

                {rawItems.length === 0 && (
                  <div className="py-12 text-center text-pink-950 text-sm font-extrabold">
                    Hakuna data iliyokidhi vigezo vya swali hili.
                  </div>
                )}
              </div>

              {rawItems.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 text-xs font-bold text-slate-900 shrink-0">
                  <div>
                    Inaonyesha <span className="text-slate-950 font-mono font-black">{(currentPage - 1) * pageSize + 1}</span> - {' '}
                    <span className="text-slate-950 font-mono font-black">{Math.min(currentPage * pageSize, rawItems.length)}</span> kati ya{' '}
                    <span className="text-pink-950 font-mono font-black">{rawItems.length}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-pink-200 disabled:opacity-40 rounded-xl border border-slate-800 transition cursor-pointer font-extrabold text-xs"
                    >
                      ◀️ Prev
                    </button>
                    <span className="px-2 font-mono font-black text-slate-950">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-pink-200 disabled:opacity-40 rounded-xl border border-slate-800 transition cursor-pointer font-extrabold text-xs"
                    >
                      Next ▶️
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isSummaryMode && (
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 scrollbar-thin">
              <span className="text-xs font-black text-pink-950 uppercase tracking-wider block px-1">
                📑 Muhtasari wa Takwimu (Executive Metrics):
              </span>
              {renderMetricCards()}
            </div>
          )}

        </div>
      ) : (

        <div className="bg-[#F2C4CE] text-slate-900 border border-pink-300/80 shadow-2xl rounded-3xl p-5 md:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-pink-300/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-950 uppercase tracking-wider">
                  Forensic Query Agent Console (Read-Only Engine)
                </h3>
                <p className="text-xs text-pink-950 font-semibold">
                  Muulize Agent maswali ya kiuchunguzi kwa kutumia lugha ya kawaida (Kiswahili au Kiingereza).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="px-2.5 py-1 bg-slate-950/10 hover:bg-slate-950/20 border border-slate-950/20 text-slate-950 rounded-xl text-[11px] font-extrabold tracking-wider uppercase transition flex items-center gap-1 cursor-pointer"
            >
              {isMaximized ? `🗗 ${t?.('btnMinimize') || 'Minimize'}` : `🗖 ${t?.('btnMaximize') || 'Maximize'}`}
            </button>
          </div>

          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-pink-950 uppercase tracking-wider block">
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
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl text-left transition cursor-pointer group shadow-md flex flex-col justify-between"
                >
                  <span className="text-[10px] font-black uppercase text-pink-300 tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-pink-200 transition">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => handleExecuteAgent(e)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-pink-950 uppercase tracking-wider block">
                Andika Swali/Uchambuzi Unaohitaji
              </label>
              <textarea
                rows={4}
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="Mfano: Nionyeshe miamala 50 ya mwisho iliyo na kiasi kikubwa zaidi ya TZS 20,000,000..."
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-pink-200 placeholder-slate-400 focus:border-pink-400 outline-none shadow-inner transition font-sans scrollbar-thin"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-pink-200 font-black text-xs uppercase tracking-widest rounded-2xl transition cursor-pointer shadow-xl border border-slate-800 flex items-center justify-center gap-2 ${
                loading ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-pink-200 border-t-transparent rounded-full animate-spin"></span>
                  Agent Anachanganua Database...
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
