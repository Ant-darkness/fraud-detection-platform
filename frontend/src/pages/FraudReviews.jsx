import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

const FraudReviews = ({ showToast }) => {
  const { t, language } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null); 
  const [inspectedTx, setInspectedTx] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') showToast(msg, type);
  }, [showToast]);

  const fetchPendingReviews = useCallback(async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const response = await api.reviews.getPending(page, limit);
      if (response && response.items) {
        setReviews(response.items);
        setTotalCount(response.total || response.items.length || 0);
      } else {
        const list = Array.isArray(response) ? response : [];
        setReviews(list);
        setTotalCount(list.length);
      }
    } catch (error) {
      notify("Imeshindikana kupata miamala ya ukaguzi.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, notify]);

  useEffect(() => {
    fetchPendingReviews(currentPage, pageSize);
  }, [fetchPendingReviews, currentPage, pageSize]);

  // WebSocket Live Streaming Update (No HTTP Requests Sent)
  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;
    const { transaction, fraud_probability, is_fraud } = lastMessage;

    if (is_fraud && transaction) {
      const txId = transaction.transaction_id || transaction.id;
      
      const newReviewItem = {
        review_id: txId,
        transaction_id: txId,
        type: transaction.type || 'TRANSFER',
        amount: transaction.amount || 0,
        fraud_probability: fraud_probability || 0,
        nameOrig: transaction.nameorig || transaction.nameOrig || "N/A",
        oldbalanceOrg: transaction.oldbalanceorg ?? transaction.oldbalanceOrg ?? 0,
        newbalanceOrig: transaction.newbalanceorig ?? transaction.newbalanceOrig ?? 0,
        nameDest: transaction.namedest || transaction.nameDest || "N/A",
        oldbalanceDest: transaction.oldbalancedest ?? transaction.oldbalanceDest ?? 0,
        newbalanceDest: transaction.newbalancedest ?? transaction.newbalanceDest ?? 0,
        step: transaction.step || 0
      };

      setReviews((prev) => {
        if (prev.some((r) => (r.review_id === txId || r.transaction_id === txId))) return prev;
        return [newReviewItem, ...prev].slice(0, pageSize);
      });
      
      setTotalCount((prev) => prev + 1);
      notify(`🚨 HIGH RISK FRAUD ALERT! Tx: #${txId}`, "warning");
    }
  }, [lastMessage, notify, pageSize]);

  const confirmAction = async () => {
    if (!activeDialog) return;
    const { isFraud, reviewId } = activeDialog;
    try {
      if (isFraud) {
        await api.reviews.reject(reviewId);
        notify("Muamala umewekwa lebo ya UTAPELI (TRUE).", "warning");
      } else {
        await api.reviews.approve(reviewId);
        notify("Muamala umewekwa lebo ya HALALI (FALSE).", "success");
      }
      fetchPendingReviews(currentPage, pageSize);
      if (inspectedTx && (inspectedTx.review_id === reviewId || inspectedTx.transaction_id === reviewId)) {
        setInspectedTx(null); 
      }
    } catch (error) {
      notify(error.message || "Imeshindikana kukamilisha kuweka lebo.", "error");
    } finally {
      setActiveDialog(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Neomorphism Toast / Dialog Styled Specially for FraudReviews */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F2C4CE] text-slate-950 border border-pink-300/90 max-w-md w-full p-6 space-y-4 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-150">
            <h4 className="font-black text-sm uppercase text-slate-950 flex items-center gap-2">
              🛡️ {activeDialog.isFraud ? 'THIBITISHA LEBO: TRUE (UTAPELI)' : 'THIBITISHA LEBO: FALSE (HALALI)'}
            </h4>
            <p className="text-xs text-slate-800 font-bold leading-relaxed">
              Je, unathibitisha kuweka lebo hii kwenye muamala huu wa Mfumo?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setActiveDialog(null)} 
                className="px-4 py-2 bg-slate-950 text-pink-200 text-xs font-bold rounded-xl shadow-md hover:bg-slate-900"
              >
                Ghairi
              </button>
              <button 
                type="button" 
                onClick={confirmAction} 
                className={`px-5 py-2 text-white text-xs font-black rounded-xl shadow-md ${
                  activeDialog.isFraud ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                Thibitisha
              </button>
            </div>
          </div>
        </div>
      )}

      {inspectedTx ? (
        <div className="bg-[#F2C4CE] text-slate-900 border border-pink-300/80 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-pink-300/80 pb-4">
            <h3 className="text-sm font-black text-slate-950 uppercase">🔍 RIPOTI YA UCHAMBUZI WA LEBO ZA MUAMALA</h3>
            <button type="button" onClick={() => setInspectedTx(null)} className="px-3 py-1.5 bg-slate-950 text-pink-200 text-xs rounded-xl font-bold">
              ⬅️ {language === 'SW' ? 'Rudi Nyuma' : 'Back'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950 text-white rounded-xl">
              <span>ID: #{inspectedTx.transaction_id || inspectedTx.id}</span>
            </div>
            <div className="p-3 bg-slate-950 text-white rounded-xl">
              <span>KIASI: TZS {Number(inspectedTx.amount || 0).toLocaleString()}</span>
            </div>
            <div className="p-3 bg-rose-950 text-rose-100 rounded-xl">
              <span>RISK SCORE: {(Number(inspectedTx.fraud_probability || 0) * 100).toFixed(2)}%</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-pink-300/80">
            <button type="button" onClick={() => setActiveDialog({ isFraud: false, reviewId: inspectedTx.review_id })} className="px-4 py-2 bg-emerald-700 text-white text-xs font-black rounded-xl shadow">
              ✓ FALSE (Halali)
            </button>
            <button type="button" onClick={() => setActiveDialog({ isFraud: true, reviewId: inspectedTx.review_id })} className="px-4 py-2 bg-rose-700 text-white text-xs font-black rounded-xl shadow">
              ✕ TRUE (Fraud)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#F2C4CE] text-slate-900 rounded-3xl p-6 shadow-2xl border border-pink-300/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-slate-950 uppercase">
              🛡️ {t?.('pendingReviews') || 'Kituo cha Ukaguzi na Utambulisho wa Miamala'}
            </h3>
            <span className="text-xs text-pink-950 font-mono font-bold">Jumla: {totalCount}</span>
          </div>

          <div className="overflow-x-auto bg-slate-950/5 rounded-2xl border border-pink-300/80 min-h-[250px] relative">
            {loading && (
              <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center z-10">
                <span className="w-8 h-8 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-pink-300/40 text-xs text-pink-950 uppercase font-black border-b border-pink-300/80">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Aina</th>
                  <th className="py-3 px-4">Kiasi</th>
                  <th className="py-3 px-4">Risk Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-300/50 text-xs font-mono">
                {reviews.map((r) => (
                  <tr key={r.review_id || r.transaction_id} className="hover:bg-pink-300/20">
                    <td className="py-3 px-4 font-bold">#{r.transaction_id || r.id}</td>
                    <td className="py-3 px-4 uppercase">{r.type || "TRANSFER"}</td>
                    <td className="py-3 px-4 font-black">TZS {Number(r.amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                        {(Number(r.fraud_probability || 0) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => setInspectedTx(r)} className="px-2.5 py-1 bg-slate-950 text-pink-200 text-[10px] rounded-lg font-black">🔍 Kagua</button>
                        <button type="button" onClick={() => setActiveDialog({ isFraud: false, reviewId: r.review_id || r.transaction_id })} className="px-2.5 py-1 bg-emerald-700 text-white text-[10px] rounded-lg font-black">FALSE</button>
                        <button type="button" onClick={() => setActiveDialog({ isFraud: true, reviewId: r.review_id || r.transaction_id })} className="px-2.5 py-1 bg-rose-700 text-white text-[10px] rounded-lg font-black">TRUE</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs font-bold text-pink-950 pt-2">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 bg-slate-950 text-pink-200 rounded-xl disabled:opacity-40">◀️ Prev</button>
              <span>Ukurasa {currentPage} kati ya {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1.5 bg-slate-950 text-pink-200 rounded-xl disabled:opacity-40">Next ▶️</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FraudReviews;
