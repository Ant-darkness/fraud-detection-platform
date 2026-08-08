import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import ConfirmDialog from '../components/ConfirmDialog';

const FraudReviews = ({ showToast }) => {
  const { t, language } = useLanguage();
  const wsContext = useWebSocket();
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState(null); 
  const [inspectedTx, setInspectedTx] = useState(null);

  const [currentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const notify = useCallback((msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  }, [showToast]);

  const fetchPendingReviews = useCallback(async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const response = await api.reviews.getPending(page, limit);
      if (response && response.items) {
        setReviews(response.items);
        setTotalCount(response.total || response.items.length || 0);
      } else if (Array.isArray(response)) {
        setReviews(response);
        setTotalCount(response.length);
      } else {
        setReviews([]);
        setTotalCount(0);
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

  useEffect(() => {
    if (!lastMessage || lastMessage.event_type !== 'NEW_TRANSACTION') return;
    const { transaction, fraud_probability, is_fraud } = lastMessage;

    if (is_fraud && transaction) {
      const newReviewItem = {
        review_id: transaction.transaction_id || transaction.id,
        transaction_id: transaction.transaction_id || transaction.id,
        type: transaction.type || 'TRANSFER',
        amount: transaction.amount || 0,
        fraud_probability: fraud_probability || 0,
        nameOrig: transaction.nameorig || transaction.nameOrig || "HAIJAFAFANULIWA",
        oldbalanceOrg: transaction.oldbalanceorg ?? transaction.oldbalanceOrg ?? 0,
        newbalanceOrig: transaction.newbalanceorig ?? transaction.newbalanceOrig ?? 0,
        nameDest: transaction.namedest || transaction.nameDest || "HAIJAFAFANULIWA",
        oldbalanceDest: transaction.oldbalancedest ?? transaction.oldbalanceDest ?? 0,
        newbalanceDest: transaction.newbalancedest ?? transaction.newbalanceDest ?? 0,
        step: transaction.step || 0
      };

      setReviews((prev) => [newReviewItem, ...prev]);
      setTotalCount((prev) => prev + 1);

      notify(`🚨 HIGH RISK FRAUD ALERT! Tx: #${newReviewItem.transaction_id}`, "warning");
    }
  }, [lastMessage, notify]);

  const handleAction = (type, reviewId) => {
    if (!reviewId) return;
    setActiveDialog({ type, reviewId: Number(reviewId) || reviewId });
  };

  const confirmAction = async () => {
    if (!activeDialog) return;
    const { type, reviewId } = activeDialog;
    try {
      if (type === 'approve') {
        await api.reviews.approve(reviewId);
        notify("Muamala umeidhinishwa kama safi na salama.", "success");
      } else {
        await api.reviews.reject(reviewId);
        notify("Muamala umetiwa alama ya utapeli na kuzuiliwa.", "success");
      }
      
      setReviews((prev) => prev.filter((r) => (r.review_id !== reviewId && r.transaction_id !== reviewId)));
      setTotalCount((prev) => Math.max(0, prev - 1));

      if (inspectedTx && (inspectedTx.review_id === reviewId || inspectedTx.transaction_id === reviewId)) {
        setInspectedTx(null); 
      }
    } catch (error) {
      notify(error.message || "Imeshindikana kukamilisha uamuzi wako.", "error");
      fetchPendingReviews(currentPage, pageSize);
    } finally {
      setActiveDialog(null);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none">
      <ConfirmDialog
        isOpen={!!activeDialog}
        title={activeDialog?.type === 'approve' ? 'Idhinisha Muamala' : 'Zuia Muamala'}
        message={activeDialog?.type === 'approve' ? 'Je, una uhakika unataka kuidhinisha muamala huu kuwa salama?' : 'Je, una uhakika unataka kuzuia muamala huu kama utapeli?'}
        onConfirm={confirmAction}
        onCancel={() => setActiveDialog(null)}
      />

      {inspectedTx ? (
        <div className="bg-[#F2C4CE] text-slate-900 border border-pink-300/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-pink-300/80 pb-4 flex-wrap gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-wider uppercase flex items-center gap-2">
              <span>🔍</span> RIPOTI YA UCHAMBUZI WA MUAMALA
            </h3>
            <button 
              type="button"
              onClick={() => setInspectedTx(null)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-pink-200 font-extrabold transition text-xs cursor-pointer border border-slate-800 shadow-md"
            >
              ⬅️ {language === 'SW' ? 'Rudi Nyuma' : 'Back'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-xs">
            <div className="space-y-3">
              <h4 className="font-black uppercase text-pink-950 tracking-wider text-[11px]">Taarifa Kuu</h4>
              <div className="p-3.5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-pink-300 block text-[10px] font-black uppercase">ID YA MUAMALA</span>
                <span className="text-sm font-mono font-bold text-white">#{inspectedTx.transaction_id || inspectedTx.id}</span>
              </div>
              <div className="p-3.5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-pink-300 block text-[10px] font-black uppercase">AINA</span>
                <span className="text-xs font-black text-white uppercase">{inspectedTx.type || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-pink-300 block text-[10px] font-black uppercase">KIASI</span>
                <span className="text-sm font-black text-white font-mono">TZS {Number(inspectedTx.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-black uppercase text-pink-950 tracking-wider text-[11px]">Akaunti ya Mtumaji</h4>
              <div className="p-3.5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-pink-300 block text-[10px] font-black uppercase">AKAUNTI</span>
                <span className="text-xs font-mono font-bold text-white truncate block">{inspectedTx.nameOrig || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-pink-300 block text-[10px] font-black uppercase">SALIO LA MWANZO</span>
                <span className="text-xs font-bold text-white font-mono">TZS {Number(inspectedTx.oldbalanceOrg ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-black uppercase text-pink-950 tracking-wider text-[11px]">Akaunti ya Mpokeaji & Risk</h4>
              <div className="p-3.5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-pink-300 block text-[10px] font-black uppercase">AKAUNTI</span>
                <span className="text-xs font-mono font-bold text-white truncate block">{inspectedTx.nameDest || "N/A"}</span>
              </div>
              <div className="p-3.5 bg-rose-950 text-rose-100 rounded-2xl border border-rose-800 shadow-md">
                <span className="text-rose-300 font-black block text-[10px] uppercase">KIWANGO CHA RISK</span>
                <span className="text-sm font-black text-white font-mono">{(Number(inspectedTx.fraud_probability || 0) * 100).toFixed(2)}% Risk Score</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-pink-300/80 flex-wrap">
            <button 
              type="button"
              onClick={() => handleAction('approve', inspectedTx.review_id || inspectedTx.transaction_id)}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black transition text-xs uppercase cursor-pointer shadow-md"
            >
              ✓ Idhinisha (Clean)
            </button>
            <button 
              type="button"
              onClick={() => handleAction('reject', inspectedTx.review_id || inspectedTx.transaction_id)}
              className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-black transition text-xs uppercase cursor-pointer shadow-md"
            >
              ✕ Zuia (Block Fraud)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#F2C4CE] text-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-pink-300/80">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xs sm:text-sm font-black text-slate-950 tracking-wider uppercase flex items-center gap-2">
              <span>🛡️</span> {t?.('pendingReviews') || 'Pending Fraud Reviews'}
            </h3>
            <span className="text-xs text-pink-950 font-mono font-bold">
              Jumla: <strong className="text-slate-950 font-black">{totalCount}</strong>
            </span>
          </div>

          <div className="overflow-x-auto bg-slate-950/5 rounded-2xl border border-pink-300/80 scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-pink-300/40 border-b border-pink-300/80 text-xs text-pink-950 uppercase tracking-wider font-black">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Aina</th>
                  <th className="py-3.5 px-4">Kiasi</th>
                  <th className="py-3.5 px-4">Risk Status</th>
                  <th className="py-3.5 px-4 text-center">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-300/50 text-xs font-mono text-slate-950">
                {reviews.map((r) => (
                  <tr key={r.review_id || r.transaction_id} className="hover:bg-pink-300/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-pink-950">#{r.transaction_id || r.id}</td>
                    <td className="py-3 px-4 text-slate-900 font-extrabold uppercase">{r.type || "TRANSFER"}</td>
                    <td className="py-3 px-4 text-slate-950 font-black">TZS {Number(r.amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="bg-rose-600 border border-rose-700 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        {(Number(r.fraud_probability || 0) * 100).toFixed(1)}% Risk
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setInspectedTx(r)}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-pink-200 rounded-lg text-[10px] font-black cursor-pointer transition shadow-sm"
                        >
                          🔍 Kagua
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction('approve', r.review_id || r.transaction_id)}
                          className="px-2.5 py-1 bg-emerald-700 text-white hover:bg-emerald-600 rounded-lg text-[10px] font-black cursor-pointer transition shadow-sm"
                        >
                          ✓ Ruhusu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction('reject', r.review_id || r.transaction_id)}
                          className="px-2.5 py-1 bg-rose-700 text-white hover:bg-rose-600 rounded-lg text-[10px] font-black cursor-pointer transition shadow-sm"
                        >
                          ✕ Zuia
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-pink-950 text-xs font-sans font-extrabold">
                      Hakuna miamala inayohitaji ukaguzi kwa sasa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudReviews;
