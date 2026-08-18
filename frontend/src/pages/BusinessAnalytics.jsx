import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { FcSearch, FcFolder, FcGraduationCap, FcApproval, FcOrgUnit, FcLeft } from 'react-icons/fc';

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
    category: 'Risk Analysis',
    title: 'High Risk Unreviewed',
    prompt: 'Tafuta miamala yote iliyopewa risk score ya zaidi ya 0.85 lakini bado haijakaguliwa.'
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
      notify('Tafadhali andika swali au uchague mfano wa utafiti.', 'warning');
      return;
    }

    setLoading(true);
    try {
      // FIX: Njia sahihi ya kuita askScopedAgent kulingana na API object
      const response = await api.agents.askScopedAgent(finalPrompt, "business");
      
      if (response && (response.success || response.data || response.items || Array.isArray(response))) {
        const responseData = response.data || response;
        setQueryResults({
          ...(typeof responseData === 'object' && !Array.isArray(responseData) ? responseData : { items: responseData }),
          category: response.category || 'Injini ya Uchambuzi wa Kiuchunguzi',
          title: response.title || `Swali: "${finalPrompt}"`,
        });
        setCurrentPage(1);
        notify('Uchambuzi umekamilika kikamilifu!', 'success');
      } else {
        throw new Error(response?.message || 'Data iliyorejeshwa si sahihi.');
      }
    } catch (error) {
      notify(error.message || 'Uchambuzi umeshindwa kutekelezwa.', 'error');
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
      <tr className="neo-inset text-indigo-900 uppercase font-black text-[10px] tracking-wider sticky top-0 z-20 select-none">
        <th className="py-3.5 px-4 text-center w-12 border-r border-slate-300 bg-slate-200">#</th>
        {keys.map((key) => (
          <th key={key} className="py-3.5 px-4 text-left whitespace-nowrap min-w-[140px] border-r border-slate-300 bg-slate-200">
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
        <tr key={idx} className="hover:bg-slate-200/50 transition-colors border-b border-slate-300 text-xs font-mono text-slate-800">
          <td className="py-3 px-4 text-center font-bold text-indigo-700 select-none">{absoluteIdx}</td>
          {Object.entries(row || {}).map(([key, val], cellIdx) => {
            const isAmount = key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance');
            const isRisk = key.toLowerCase().includes('prob') || key.toLowerCase().includes('risk');
            const numVal = typeof val === 'number' ? val : (!isNaN(Number(val)) && val !== '' && val !== null) ? Number(val) : null;

            return (
              <td key={cellIdx} className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap select-none border-r border-slate-200">
                {isAmount && numVal !== null ? (
                  <span className="font-black text-slate-900">TZS {numVal.toLocaleString()}</span>
                ) : isRisk && numVal !== null ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    numVal >= 0.8 ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-2">
        {Object.entries(dataToDisplay).map(([key, val], idx) => {
          const numVal = typeof val === 'number' ? val : (!isNaN(Number(val)) && val !== '' && val !== null) ? Number(val) : null;

          return (
            <div key={idx} className="neo-card-hover p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider block truncate text-indigo-600">
                  {key.replace(/_/g, ' ')}
                </span>
                <FcGraduationCap className="text-xl" />
              </div>

              <div className="text-2xl sm:text-3xl font-mono font-black text-slate-800 my-1 tracking-tight">
                {numVal !== null ? numVal.toLocaleString() : String(val ?? '0')}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-300/40 flex items-center justify-between text-[10px] font-black text-slate-400">
                <span>TAARIFA ILIYOTHIBITISHWA</span>
                <span className="text-emerald-600 font-bold">VERIFIED</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    /* FIX: Maximized state sasa ina overflow-y-auto na overflow-x-auto ili kuruhusu scrolling pande zote */
    <div className={`transition-all duration-300 font-sans select-none ${
      isMaximized 
        ? 'fixed inset-2 md:inset-4 z-50 neo-card p-4 md:p-6 flex flex-col overflow-y-auto overflow-x-auto scrollbar-thin' 
        : 'space-y-6 relative'
    }`}>

      {queryResults ? (
        <div className="neo-card p-4 md:p-6 space-y-5 relative flex-1 flex flex-col min-h-0 min-w-0">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-300/60 pb-4 shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest neo-inset px-3 py-1 rounded-full">
                  {queryResults.category || 'Injini ya Uchambuzi'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="neo-button px-3 py-1 text-slate-700 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                >
                  {isMaximized ? `🗗 ${t?.('btnMinimize') || 'Punguza'}` : `🗖 ${t?.('btnMaximize') || 'Enua'}`}
                </button>
              </div>
              
              <h3 className="text-base md:text-lg font-black text-slate-800 mt-2">{queryResults.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => setQueryResults(null)}
              className="neo-button px-4 py-2 text-indigo-600 font-black text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <FcLeft className="text-base" /> Uliza Swali Jingine
            </button>
          </div>

          {queryResults.explanation && (
            <div className="neo-inset p-4 rounded-2xl text-xs text-slate-800 font-bold space-y-1 shrink-0">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block flex items-center gap-1">
                <FcApproval /> Uchambuzi wa Kiuchunguzi:
              </span>
              <p className="text-xs leading-relaxed font-medium">{queryResults.explanation}</p>
            </div>
          )}

          {queryResults.generated_sql && (
            <div className="neo-card p-4 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="uppercase tracking-wider flex items-center gap-1.5 font-black">
                  <FcOrgUnit /> Executed Query Statement:
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">
                  READ ONLY (SAFE)
                </span>
              </div>
              <pre className="p-3 neo-inset text-indigo-900 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed scrollbar-thin">
                {queryResults.generated_sql}
              </pre>
            </div>
          )}

          {!isSummaryMode && (
            <div className="flex-1 flex flex-col min-h-[350px] space-y-3 overflow-hidden">
              <div className="flex justify-between items-center text-xs font-black text-slate-800 px-1 shrink-0">
                <span>📋 Orodha ya Miamala ({totalFound.toLocaleString()})</span>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-slate-500 uppercase">Onyesha:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="neo-inset px-2 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Table Container na Scrollbar Hururu za Kushoto/Kulia na Juu/Chini */}
              <div className="w-full neo-inset rounded-2xl overflow-auto flex-1 relative scrollbar-thin max-h-[60vh]">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>{renderTableHead()}</thead>
                  <tbody className="divide-y divide-slate-300">{renderTableBody()}</tbody>
                </table>

                {rawItems.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-sm font-extrabold">
                    Hakuna data iliyokidhi vigezo vya swali hili.
                  </div>
                )}
              </div>

              {rawItems.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 text-xs font-bold text-slate-700 shrink-0">
                  <div>
                    Inaonyesha <span className="text-slate-900 font-mono font-black">{(currentPage - 1) * pageSize + 1}</span> - {' '}
                    <span className="text-slate-900 font-mono font-black">{Math.min(currentPage * pageSize, rawItems.length)}</span> kati ya{' '}
                    <span className="text-indigo-600 font-mono font-black">{rawItems.length}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="neo-button px-3.5 py-1.5 text-slate-800 disabled:opacity-40 text-xs font-black cursor-pointer"
                    >
                      ◀️ Prev
                    </button>
                    <span className="px-2 font-mono font-black text-slate-800">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="neo-button px-3.5 py-1.5 text-slate-800 disabled:opacity-40 text-xs font-black cursor-pointer"
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
              <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block px-1">
                📑 Muhtasari wa Takwimu (Executive Metrics):
              </span>
              {renderMetricCards()}
            </div>
          )}

        </div>
      ) : (

        <div className="neo-card p-6 md:p-8 space-y-6 relative overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-300/60 pb-4">
            <div className="flex items-center gap-3">
              <FcSearch className="text-3xl" />
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">
                  Kituo cha Uchambuzi wa Miamala Na Kiuchunguzi (Forensic Console)
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  Andika maswali ya kiuchunguzi kwa kutumia lugha rasmi ya Kiswahili au Kiingereza.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="neo-button px-3 py-1 text-slate-700 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              {isMaximized ? `🗗 ${t?.('btnMinimize') || 'Punguza'}` : `🗖 ${t?.('btnMaximize') || 'Enua'}`}
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-indigo-600 uppercase tracking-wider block">
              💡 Maswali ya Mfano (Quick Forensic Queries)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAgentPrompt(item.prompt);
                    handleExecuteAgent(null, item.prompt);
                  }}
                  className="neo-card-hover p-4 text-left transition cursor-pointer flex flex-col justify-between"
                >
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => handleExecuteAgent(e)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Andika Swali au Maelekezo ya Uchambuzi
              </label>
              <textarea
                rows={4}
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="Mfano: Nionyeshe miamala 50 ya mwisho iliyo na kiasi kikubwa zaidi ya TZS 20,000,000..."
                className="w-full neo-inset p-4 text-xs text-slate-800 placeholder-slate-400 outline-none font-sans scrollbar-thin"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 neo-button text-indigo-600 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-pointer ${
                loading ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  Uchambuzi Unafanyika Kwenye Database...
                </>
              ) : (
                <>⚡ Tekeleza Uchambuzi (Execute Forensic Query)</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalytics;
