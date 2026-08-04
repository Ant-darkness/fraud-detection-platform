import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

const Transactions = ({ showToast }) => {
  const { t } = useLanguage();
  const wsContext = useWebSocket(); // Safe extraction kuzuia destructuring crash
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15); 
  const [totalCount, setTotalCount] = useState(0);

  const MAX_LIVE_BUFFER = 1000; // Ukomo wa miamala 1,000 kwenye memory

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
        if (showToast) showToast("Imeshindikana kupakia orodha ya miamala ya kweli.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, limit]);

  // 2. LIVE WEBSOCKET ENGINE (WITH 1,000 LIMIT RESET)
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;

    const { transaction } = lastMessage;
    if (!transaction) return;

    setTransactions((prevTx) => {
      // Kama miamala imefika au kuvuka 1,000, inasafishwa na kuanza upya na muamala huu mpya
      if (prevTx.length >= MAX_LIVE_BUFFER) {
        if (showToast) showToast("⚡ Live feed status: Miamala imefika 1,000. Buffer imesafishwa!", "info");
        return [transaction];
      }
      // Ingiza muamala mpya juu kabisa
      return [transaction, ...prevTx];
    });

    setTotalCount((prev) => prev + 1);
  }, [lastMessage]);

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
      return `${t('txStepLabel') || 'Step'} ${tx.step}`;
    }
    return "N/A";
  };

  return (
    <div className={`transition-all duration-300 font-sans ${
      isMaximized 
        ? 'fixed inset-2 md:inset-4 z-50 bg-white/98 border border-[#D4AF37] backdrop-blur-3xl rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl overflow-hidden' 
        : 'bg-white border border-gray-200/80 shadow-sm rounded-2xl p-6 relative overflow-hidden'
    }`}>
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"></div>

      {/* KICHWA CHA UKURASA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> LIVE TRANSACTIONS FEED
          </h3>
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl text-[11px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            title={isMaximized ? t('btnMinimize') : t('btnMaximize')}
          >
            {isMaximized ? `🗗 ${t('btnMinimize') || 'Minimize'}` : `🗖 ${t('btnMaximize') || 'Maximize'}`}
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 font-mono bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
            Live Buffer: <strong className="text-amber-800">{transactions.length}/{MAX_LIVE_BUFFER}</strong>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-xl font-sans">
            {t('txTotal') || 'Jumla'}: <span className="text-[#B8860B] font-bold">{totalCount.toLocaleString()}</span> {t('txItems') || 'miamala'}
          </div>
        </div>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="grow flex items-center justify-center min-h-[40vh]">
          <span className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto grow border border-gray-200 rounded-xl bg-gray-50/50 scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-600 bg-gray-100/80 uppercase tracking-wider font-bold">
                  <th className="py-4 px-5">Muda / Step</th>
                  <th className="py-4 px-5">Aina (Type)</th>
                  <th className="py-4 px-5">Kiasi (Amount)</th>
                  <th className="py-4 px-5 bg-blue-50/60 text-blue-900">Mtumaji (Orig Account)</th>
                  <th className="py-4 px-5 bg-blue-50/60 text-blue-900">Salio Jipya (Orig)</th>
                  <th className="py-4 px-5 bg-purple-50/60 text-purple-900">Mpokeaji (Dest Account)</th>
                  <th className="py-4 px-5 bg-purple-50/60 text-purple-900">Salio Jipya (Dest)</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-800 divide-y divide-gray-200 font-mono">
                {transactions.map((tx, index) => (
                  <tr key={tx.transaction_id || tx.id || index} className="hover:bg-amber-50/30 transition-colors animate-fadeIn">
                    <td className="py-4 px-5 text-gray-500 font-bold">{formatTimeOrStep(tx)}</td>
                    <td className="py-4 px-5">
                      <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold text-blue-700 uppercase">
                        {tx.type || "TRANSFER"}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-emerald-700 text-sm">
                      TZS {Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 bg-blue-50/30 text-gray-700">
                      {tx.nameorig || tx.nameOrig || "N/A"}
                    </td>
                    <td className="py-4 px-5 bg-blue-50/30 text-gray-900 font-bold">
                      TZS {Number(tx.newbalanceorig ?? tx.newbalanceOrig ?? 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 bg-purple-50/30 text-gray-700">
                      {tx.namedest || tx.nameDest || "N/A"}
                    </td>
                    <td className="py-4 px-5 bg-purple-50/30 text-gray-900 font-bold">
                      TZS {Number(tx.newbalancedest ?? tx.newbalanceDest ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500 text-sm font-sans">
                      Hakuna miamala inayoingia kwa sasa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 shrink-0">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-800 hover:bg-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ◀ Ukurasa Uliopita
              </button>
              
              <span className="text-xs text-gray-600 font-sans">
                Ukurasa <span className="text-gray-900 font-bold">{currentPage}</span> kati ya <span className="text-gray-900 font-bold">{totalPages}</span>
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-800 hover:bg-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
