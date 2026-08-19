import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { FcInspection, FcCheckmark, FcCancel } from 'react-icons/fc';
import { HiMagnifyingGlass, HiOutlineShieldCheck, HiChevronLeft, HiChevronRight, HiArrowLeft } from 'react-icons/hi2';

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

  // WebSocket Live Streaming Update
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
    const { isFraud, tx } = activeDialog;
    const reviewId = tx.review_id || tx.transaction_id;

    try {
      if (isFraud) {
        await api.reviews.reject(reviewId);
        notify(`Muamala #${reviewId} umewekwa lebo ya UTAPELI (TRUE).`, "warning");
      } else {
        await api.reviews.approve(reviewId);
        notify(`Muamala #${reviewId} umewekwa lebo ya HALALI (FALSE).`, "success");
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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6 font-sans select-none pb-10">
      
      {/* Neumorphic Confirmation Dialog */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neo-card max-w-md w-full p-6 space-y-4 bg-slate-100 rounded-3xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 border-b border-slate-300/60 pb-3">
              <HiOutlineShieldCheck className="text-3xl" />
              <h4 className="font-black text-xs sm:text-sm uppercase text-slate-800">
                {activeDialog.isFraud ? 'Thibitisha Lebo: UTAPELI (TRUE)' : 'Thibitisha Lebo: HALALI (FALSE)'}
              </h4>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Unakaribia kubadilisha na kuthibitisha status ya muamala huu kwenye Mfumo:
            </p>

            {/* Target Transaction Context Box */}
            <div className="neo-inset p-4 rounded-2xl space-y-2 text-xs font-mono bg-slate-50">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold">Transaction ID:</span>
                <span className="font-black text-indigo-600">#{activeDialog.tx.transaction_id || activeDialog.tx.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold">Aina ya Muamala:</span>
                <span className="font-bold text-slate-800 uppercase">{activeDialog.tx.type || 'TRANSFER'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold">Kiasi:</span>
                <span className="font-black text-slate-800">TZS {Number(activeDialog.tx.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Risk Level:</span>
                <span className="font-black text-rose-600">
                  {(Number(activeDialog.tx.fraud_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setActiveDialog(null)} 
                className="neo-button px-4 py-2 text-xs font-bold rounded-xl text-slate-600"
              >
                Ghairi
              </button>
              <button 
                type="button" 
                onClick={confirmAction} 
                className={`neo-button px-5 py-2 text-xs font-black rounded-xl ${
                  activeDialog.isFraud ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                Thibitisha Lebo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspected Transaction Detailed View */}
      {inspectedTx ? (
        <div className="neo-card p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-300/60 pb-4">
            <div className="flex items-center gap-3">
              <FcInspection className="text-3xl" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                  Uchambuzi wa Kiuchunguzi wa Muamala #{inspectedTx.transaction_id || inspectedTx.id}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono font-bold">Fraud Forensic Deep Inspection Terminal</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setInspectedTx(null)} 
              className="neo-button px-4 py-2 text-slate-700 text-xs rounded-xl font-bold flex items-center gap-2"
            >
              <HiArrowLeft /> {language === 'SW' ? 'Rudi Kwenye Orodha' : 'Back'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="neo-inset p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Transaction ID & Type</span>
              <p className="font-black text-indigo-600">#{inspectedTx.transaction_id || inspectedTx.id}</p>
              <p className="font-bold text-slate-700 uppercase">{inspectedTx.type || 'TRANSFER'}</p>
            </div>

            <div className="neo-inset p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Kiasi cha Muamala</span>
              <p className="text-base font-black text-slate-800">TZS {Number(inspectedTx.amount || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Step: {inspectedTx.step || 'N/A'}</p>
            </div>

            <div className="neo-inset p-4 rounded-2xl space-y-1 bg-rose-50/30">
              <span className="text-[10px] text-rose-500 uppercase font-sans font-bold">Kiwango cha Hatari (Risk Score)</span>
              <p className="text-base font-black text-rose-600">
                {(Number(inspectedTx.fraud_probability || 0) * 100).toFixed(2)}%
              </p>
              <p className="text-[10px] text-rose-700 font-sans font-bold">Mfumo wa AI umeubaini kama High Risk</p>
            </div>
          </div>

          {/* Forensic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
            <div className="neo-card p-4 space-y-2">
              <span className="text-xs font-black text-slate-800 uppercase font-sans border-b border-slate-200 pb-1 block">
                👤 Taarifa za Mtumaji (Origin)
              </span>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Akaunti:</span>
                <span className="font-bold text-slate-800">{inspectedTx.nameOrig}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Salio la Zamani:</span>
                <span className="font-bold text-slate-800">TZS {Number(inspectedTx.oldbalanceOrg).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Salio Jipya:</span>
                <span className="font-bold text-slate-800">TZS {Number(inspectedTx.newbalanceOrig).toLocaleString()}</span>
              </div>
            </div>

            <div className="neo-card p-4 space-y-2">
              <span className="text-xs font-black text-slate-800 uppercase font-sans border-b border-slate-200 pb-1 block">
                🏦 Taarifa za Mpokeaji (Destination)
              </span>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Akaunti:</span>
                <span className="font-bold text-slate-800">{inspectedTx.nameDest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Salio la Zamani:</span>
                <span className="font-bold text-slate-800">TZS {Number(inspectedTx.oldbalanceDest).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Salio Jipya:</span>
                <span className="font-bold text-slate-800">TZS {Number(inspectedTx.newbalanceDest).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-300/60">
            <button 
              type="button" 
              onClick={() => setActiveDialog({ isFraud: false, tx: inspectedTx })} 
              className="neo-button px-5 py-2.5 text-emerald-600 text-xs font-black rounded-2xl flex items-center gap-2"
            >
              <FcCheckmark className="text-base" /> HALALI (FALSE POSITIVE)
            </button>
            <button 
              type="button" 
              onClick={() => setActiveDialog({ isFraud: true, tx: inspectedTx })} 
              className="neo-button px-5 py-2.5 text-rose-600 text-xs font-black rounded-2xl flex items-center gap-2"
            >
              <FcCancel className="text-base" /> UTAPELI (TRUE FRAUD)
            </button>
          </div>
        </div>
      ) : (
        /* Main Pending Reviews Table View */
        <div className="neo-card p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <HiOutlineShieldCheck className="text-3xl" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                  {t?.('pendingReviews') || 'Kituo cha Ukaguzi na Utambulisho wa Miamala'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono font-bold">Real-Time Suspicious Transaction Queue</span>
              </div>
            </div>
            <span className="neo-inset px-4 py-2 rounded-2xl text-xs font-mono font-black text-indigo-600">
              Jumla ya Miamala: {totalCount}
            </span>
          </div>

          <div className="neo-inset p-4 rounded-2xl overflow-x-auto relative min-h-[300px]">
            {loading && (
              <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
            )}

            <table className="w-full text-left font-mono text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-300/60 text-indigo-900 uppercase font-black">
                  <th className="p-3">ID</th>
                  <th className="p-3">Aina</th>
                  <th className="p-3">Kiasi</th>
                  <th className="p-3">Risk Status</th>
                  <th className="p-3 text-center">Hatua (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <tr key={r.review_id || r.transaction_id} className="hover:bg-slate-200/40 transition-colors">
                      <td className="p-3 font-bold text-slate-800">#{r.transaction_id || r.id}</td>
                      <td className="p-3 uppercase font-bold text-slate-600">{r.type || "TRANSFER"}</td>
                      <td className="p-3 font-black text-slate-800">TZS {Number(r.amount || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 border border-rose-300/60 rounded-xl text-[10px] font-black inline-block">
                          {(Number(r.fraud_probability || 0) * 100).toFixed(1)}% Risk
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => setInspectedTx(r)} 
                            className="neo-button px-3 py-1.5 text-indigo-600 text-[10px] rounded-xl font-black flex items-center gap-1"
                          >
                            <HiMagnifyingGlass/> Kagua
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setActiveDialog({ isFraud: false, tx: r })} 
                            className="neo-button px-3 py-1.5 text-emerald-600 text-[10px] rounded-xl font-black"
                          >
                            FALSE
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setActiveDialog({ isFraud: true, tx: r })} 
                            className="neo-button px-3 py-1.5 text-rose-600 text-[10px] rounded-xl font-black"
                          >
                            TRUE
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                      Hakuna miamala inayohitaji ukaguzi kwa sasa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 pt-2">
              <span className="text-slate-500">
                Ukurasa {currentPage} kati ya {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                  className="neo-button p-2 rounded-xl disabled:opacity-40"
                >
                  <HiChevronLeft className="text-base" />
                </button>
                <button 
                  disabled={currentPage >= totalPages} 
                  onClick={() => setCurrentPage((p) => p + 1)} 
                  className="neo-button p-2 rounded-xl disabled:opacity-40"
                >
                  <HiChevronRight className="text-base" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FraudReviews;
