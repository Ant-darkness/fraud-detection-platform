import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { FcDebt, FcSynchronize } from "react-icons/fc";
import { HiArrowsPointingOut, HiArrowsPointingIn, HiRadio } from "react-icons/hi2";



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
    if (typeof showToast === 'function') showToast(msg, type);
  }, [showToast]);

  // Initial Fetch on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.transactions.getAll({ page: currentPage, limit });
        if (isMounted) {
          if (response && response.data) {
            setTransactions(response.data);
            setTotalCount(response.total || 0);
          } else {
            const list = Array.isArray(response) ? response : [];
            setTransactions(list);
            setTotalCount(list.length);
          }
        }
      } catch (error) {
        if (isMounted) notify("Imeshindikana kupakia orodha ya miamala ya benki.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTransactions();
    return () => { isMounted = false; };
  }, [currentPage, limit, notify]);

  // LIVE STREAMING INGESTION (WEBSOCKET FEED)
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;
    const { transaction } = lastMessage;
    if (!transaction) return;

    setTransactions((prevTx) => {
      if (prevTx.length >= MAX_LIVE_BUFFER) {
        notify("⚡ Live Stream Buffer imejaa. Inafanya auto-reset...", "info");
        return [transaction];
      }
      return [transaction, ...prevTx];
    });

    setTotalCount((prev) => prev + 1);
  }, [lastMessage, notify]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const formatTimeOrStep = (tx) => {
    if (tx.created_at || tx.timestamp) {
      try {
        return new Date(tx.created_at || tx.timestamp).toLocaleString('sw-TZ', { 
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch {
        return tx.created_at || tx.timestamp;
      }
    }
    if (tx.step !== undefined && tx.step !== null) return `Step ${tx.step}`;
    return "N/A";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 2
    }).format(Number(amount) || 0);
  };

  return (
    <div className={`transition-all duration-300 font-sans select-none neo-card p-5 sm:p-6 text-slate-800 ${
      isMaximized 
        ? 'fixed inset-2 md:inset-4 z-50 bg-slate-100 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-300' 
        : 'rounded-3xl relative overflow-hidden border border-slate-300/80'
    }`}>
      
      {/* Professional Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-300/80 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <FcDebt className="text-3xl" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                REAL-TIME TRANSACTION STREAMING FEED
              </h3>
              {/* WebSocket Live Pulsing Indicator */}
              <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE WS
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              Automated Bank Transaction Ingestion & Fraud Pre-Screening
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="neo-button px-3 py-1.5 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ml-2"
          >
            {isMaximized ? <><HiArrowsPointingOut /> MINIMIZE</> : <><HiArrowsPointingIn /> MAXIMIZE</>}
          </button>
        </div>
        
        {/* Real-time Telemetry Stats */}
        <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
          <div className="neo-inset px-3 py-1.5 rounded-xl border border-slate-300/60 font-bold text-slate-600">
            Buffer: <span className="text-indigo-600 font-black">{transactions.length}/{MAX_LIVE_BUFFER}</span>
          </div>
          <div className="neo-inset px-3 py-1.5 rounded-xl border border-slate-300/60 font-bold text-slate-600">
            Total Records: <span className="text-slate-900 font-black">{totalCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Streaming Table View */}
      {loading && transactions.length === 0 ? (
        <div className="grow flex flex-col items-center justify-center min-h-[40vh] space-y-3">
          <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-xs font-mono text-slate-500 font-bold">Inapakia miamala kutoka benki...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto grow neo-inset rounded-2xl border border-slate-300/70 shadow-inner scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] text-slate-700 uppercase tracking-wider font-black bg-slate-200/70 font-mono">
                  <th className="py-3.5 px-4 border-r border-slate-300">Timestamp / Step</th>
                  <th className="py-3.5 px-4 border-r border-slate-300 text-center">Type</th>
                  <th className="py-3.5 px-4 border-r border-slate-300">Amount</th>
                  <th className="py-3.5 px-4 border-r border-slate-300 bg-slate-200/30">Sender (Orig)</th>
                  <th className="py-3.5 px-4 border-r border-slate-300 bg-slate-200/30">New Bal (Orig)</th>
                  <th className="py-3.5 px-4 border-r border-slate-300 bg-slate-200/50">Receiver (Dest)</th>
                  <th className="py-3.5 px-4 bg-slate-200/50">New Bal (Dest)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-slate-800 divide-y divide-slate-300/60">
                {transactions.map((tx, index) => (
                  <tr key={tx.transaction_id || tx.id || index} className="transition-all hover:bg-indigo-50/50">
                    <td className="py-3 px-4 font-bold text-slate-600 border-r border-slate-300/60 whitespace-nowrap">
                      {formatTimeOrStep(tx)}
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-300/60">
                      <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase">
                        {tx.type || tx.action || "PAYMENT"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 border-r border-slate-300/60 whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-bold border-r border-slate-300/60">
                      {tx.nameorig || tx.nameOrig || "N/A"}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-300/60 whitespace-nowrap">
                      {formatCurrency(tx.newbalanceorig ?? tx.newbalanceOrig)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-bold border-r border-slate-300/60">
                      {tx.namedest || tx.nameDest || "N/A"}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(tx.newbalancedest ?? tx.newbalanceDest)}
                    </td>
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 font-sans font-bold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FcSynchronize className="text-4xl animate-spin" />
                        <p>Hakuna miamala inayoingia kwa sasa. Subiri miamala ya live stream...</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 pt-4 shrink-0 font-mono">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="neo-button px-4 py-2 rounded-xl text-slate-800 disabled:opacity-40 cursor-pointer font-black"
              >
                ◀ Inayotangulia
              </button>
              <span>Ukurasa <strong className="text-indigo-600 font-black">{currentPage}</strong> kati ya <strong>{totalPages}</strong></span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="neo-button px-4 py-2 rounded-xl text-slate-800 disabled:opacity-40 cursor-pointer font-black"
              >
                Inayofuata ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Transactions;
