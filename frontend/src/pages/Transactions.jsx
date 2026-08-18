import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

const Transactions = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15); 
  const [totalCount, setTotalCount] = useState(0);

  const MAX_LIVE_BUFFER = 1000;

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  // 1. Initial Load kutoka Database
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.transactions.getAll({ page: currentPage, limit });
        if (response && response.data) {
          setTransactions(response.data);
          setTotalCount(response.total || 0);
        } else {
          const list = Array.isArray(response) ? response : [];
          setTransactions(list);
          setTotalCount(list.length);
        }
      } catch (error) {
        notify("Imeshindikana kupakia orodha ya miamala ya kweli.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, limit, notify]);

  // 2. LIVE WEBSOCKET ENGINE
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;

    const { transaction } = lastMessage;
    if (!transaction) return;

    setTransactions((prevTx) => {
      if (prevTx.length >= MAX_LIVE_BUFFER) {
        notify("⚡ Live feed status: Miamala imefika 1,000. Buffer imesafishwa!", "info");
        return [transaction];
      }
      return [transaction, ...prevTx];
    });

    setTotalCount((prev) => prev + 1);
  }, [lastMessage, notify]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const formatTimeOrStep = (tx) => {
    if (tx.created_at) {
      try {
        return new Date(tx.created_at).toLocaleString('sw-TZ', { hour12: false });
      } catch {
        return tx.created_at;
      }
    }
    if (tx.step !== undefined && tx.step !== null) {
      return `${t?.('txStepLabel') || 'Step'} ${tx.step}`;
    }
    return "N/A";
  };

  return (
    <div className={`transition-all duration-300 font-sans select-none bg-[#F2C4CE] text-slate-900 border border-pink-300/80 shadow-2xl ${
      isMaximized 
        ? 'fixed inset-2 md:inset-4 z-50 rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden' 
        : 'rounded-3xl p-4 sm:p-6 relative overflow-hidden'
    }`}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> LIVE TRANSACTIONS FEED
          </h3>
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-pink-200 border border-slate-800 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-md"
          >
            {isMaximized ? `🗗 ${t?.('btnMinimize') || 'Minimize'}` : `🗖 ${t?.('btnMaximize') || 'Maximize'}`}
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="text-xs font-bold text-slate-100 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm font-mono">
            Live Buffer: <span className="text-pink-300 font-black">{transactions.length}/{MAX_LIVE_BUFFER}</span>
          </div>
          <div className="text-xs font-bold text-slate-100 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
            {t?.('txTotal') || 'Jumla'}: <span className="text-pink-300 font-mono font-black">{totalCount.toLocaleString()}</span> {t?.('txItems') || 'miamala'}
          </div>
        </div>
      </div>

      {/* CONTENT & TABLE SECTION */}
      {loading && transactions.length === 0 ? (
        <div className="grow flex items-center justify-center min-h-[40vh]">
          <span className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto grow bg-slate-950/5 rounded-2xl border border-pink-300/80 scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[950px] sm:min-w-[1100px]">
              <thead>
                <tr className="bg-pink-300/40 border-b border-pink-300/80 text-xs text-pink-950 uppercase tracking-wider font-black">
                  <th className="py-3.5 px-4">Muda / Step</th>
                  <th className="py-3.5 px-4">Aina (Type)</th>
                  <th className="py-3.5 px-4">Kiasi (Amount)</th>
                  <th className="py-3.5 px-4 bg-pink-300/20">Mtumaji (Orig Account)</th>
                  <th className="py-3.5 px-4 bg-pink-300/20">Salio Jipya (Orig)</th>
                  <th className="py-3.5 px-4 bg-pink-300/30">Mpokeaji (Dest Account)</th>
                  <th className="py-3.5 px-4 bg-pink-300/30">Salio Jipya (Dest)</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm text-slate-950 divide-y divide-pink-300/50 font-mono">
                {transactions.map((tx, index) => (
                  <tr key={tx.transaction_id || tx.id || index} className="hover:bg-pink-300/20 transition-colors">
                    <td className="py-3 px-4 text-pink-950 font-bold whitespace-nowrap">
                      {formatTimeOrStep(tx)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-950 text-pink-300 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm">
                        {tx.type || "TRANSFER"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-950 whitespace-nowrap">
                      TZS {Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-sans font-semibold">
                      {tx.nameorig || tx.nameOrig || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-950 font-black whitespace-nowrap">
                      TZS {Number(tx.newbalanceorig ?? tx.newbalanceOrig ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-sans font-semibold">
                      {tx.namedest || tx.nameDest || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-950 font-black whitespace-nowrap">
                      TZS {Number(tx.newbalancedest ?? tx.newbalanceDest ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-pink-950 text-xs font-sans font-extrabold">
                      Hakuna miamala inayoingia kwa sasa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-pink-300/80 shrink-0">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-pink-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                ◀ Ukurasa Uliopita
              </button>
              
              <span className="text-xs text-pink-950 font-bold">
                Ukurasa <span className="text-slate-950 font-black">{currentPage}</span> kati ya <span className="text-slate-950 font-black">{totalPages}</span>
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-pink-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                Ukurasa Unaofuata ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Transactions;
