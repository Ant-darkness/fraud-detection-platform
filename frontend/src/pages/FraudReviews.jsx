import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import ConfirmDialog from '../components/ConfirmDialog';

const FraudReviews = ({ showToast }) => {
  const { t, language } = useLanguage();
  const wsContext = useWebSocket(); // Safe extraction
  const lastMessage = wsContext ? wsContext.lastMessage : null;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false); 
  const [activeDialog, setActiveDialog] = useState(null); 
  const [inspectedTx, setInspectedTx] = useState(null);

  // --- PAGINATION STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPendingReviews = async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    try {
      const response = await api.reviews.getPending(page, limit);
      if (response && response.items) {
        setReviews(response.items);
        setTotalCount(response.total || 0);
        setTotalPages(response.total_pages || 1);
      } else if (Array.isArray(response)) {
        setReviews(response);
        setTotalCount(response.length);
        setTotalPages(1);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Shida halisi ya kupakia reviews: ", error);
      if (showToast) showToast("Imeshindikana kupata miamala ya ukaguzi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews(currentPage, pageSize);
    return () => {
      setIsMaximized(false);
      setInspectedTx(null);
    };
  }, [currentPage, pageSize]);

  // LIVE WEBSOCKET EVENT FOR FRAUD REVIEWS
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

      if (showToast) {
        showToast(`🚨 HIGH RISK FRAUD ALERT! Tx: #${newReviewItem.transaction_id}`, "warning");
      }
    }
  }, [lastMessage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAction = (type, reviewId) => {
    if (!reviewId) {
      if (showToast) showToast("ID ya review haipo!", "error");
      return;
    }
    setActiveDialog({ type, reviewId: Number(reviewId) || reviewId });
  };

  const confirmAction = async () => {
    if (!activeDialog) return;
    const { type, reviewId } = activeDialog;
    try {
      if (type === 'approve') {
        await api.reviews.approve(reviewId);
        if (showToast) showToast("Muamala umeidhinishwa kama safi na salama.", "success");
      } else {
        await api.reviews.reject(reviewId);
        if (showToast) showToast("Muamala umetiwa alama ya utapeli na kuzuiliwa.", "success");
      }
      
      // OPTIMISTIC UPDATE: Ondoa hapo hapo kwenye UI live
      setReviews((prev) => prev.filter((r) => (r.review_id !== reviewId && r.transaction_id !== reviewId)));
      setTotalCount((prev) => Math.max(0, prev - 1));

      if (inspectedTx && (inspectedTx.review_id === reviewId || inspectedTx.transaction_id === reviewId)) {
        setInspectedTx(null); 
      }
    } catch (error) {
      if (showToast) showToast(error.message || "Imeshindikana kukamilisha uamuzi wako kwenye mfumo.", "error");
      fetchPendingReviews(currentPage, pageSize);
    } finally {
      setActiveDialog(null);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {inspectedTx ? (
        /* DETAILED REPORT VIEW */
        <div className={`transition-all duration-300 ease-in-out ${
          isMaximized 
            ? 'fixed inset-2 md:inset-4 z-50 bg-white border border-[#D4AF37] backdrop-blur-3xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto rounded-2xl shadow-2xl' 
            : 'bg-white border border-gray-200/80 shadow-sm rounded-2xl p-6 md:p-8 space-y-6 relative'
        }`}>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-wide">
                🔍 TRANSACTION AUDITING DETAILED REPORT
              </h3>
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isMaximized ? <>🗗 <span>{t('btnMinimize') || 'Minimize'}</span></> : <>🗖 <span>{t('btnMaximize') || 'Maximize'}</span></>}
              </button>
            </div>
            <button 
              type="button"
              onClick={() => setInspectedTx(null)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer text-xs self-end sm:self-center"
            >
              ⬅️ {language === 'SW' ? 'Rudisha Nyuma' : 'Back'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm grow mt-4">
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Misingi ya Muamala</h4>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-500 block">ID ya Muamala</span>
                <span className="text-lg font-mono font-bold text-gray-900">#{inspectedTx.transaction_id || inspectedTx.id}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-500 block">{t('txType')}</span>
                <span className="text-lg font-bold text-blue-700 uppercase">{inspectedTx.type || "N/A"}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-500 block">{t('txAmount')}</span>
                <span className="text-xl font-bold text-emerald-700">TZS {Number(inspectedTx.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Taarifa za Mtumaji (Origination)</h4>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-500 block">Akaunti ya Mtumaji (Orig)</span>
                <span className="text-sm font-mono font-bold text-gray-800 truncate block">
                  {inspectedTx.nameOrig || inspectedTx.nameorig || "HAIJAFAFANULIWA"}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-500 block">{t('txOldOrig')}</span>
                <span className="text-sm font-bold text-gray-800">
                  TZS {Number(inspectedTx.oldbalanceOrg ?? inspectedTx.oldbalanceorig ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-500 block">{t('txNewOrig')}</span>
                <span className="text-sm font-bold text-gray-800">
                  TZS {Number(inspectedTx.newbalanceOrig ?? inspectedTx.newbalanceorig ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Taarifa za Mpokeaji & AI Risk</h4>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-500 block">Akaunti ya Mpokeaji (Dest)</span>
                <span className="text-sm font-mono font-bold text-gray-800 truncate block">
                  {inspectedTx.nameDest || inspectedTx.namedest || "HAIJAFAFANULIWA"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs">
                  <span className="text-gray-500 block">Old Bal Dest</span>
                  <span className="text-gray-800 font-bold">
                    TZS {Number(inspectedTx.oldbalanceDest ?? inspectedTx.oldbalancedest ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs">
                  <span className="text-gray-500 block">New Bal Dest</span>
                  <span className="text-gray-800 font-bold">
                    TZS {Number(inspectedTx.newbalanceDest ?? inspectedTx.newbalancedest ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <span className="text-xs text-[#B8860B] font-bold block">{t('predictedFraud')}</span>
                <span className="text-xl font-black text-red-700">{(Number(inspectedTx.fraud_probability || 0) * 100).toFixed(2)}% Risk Score</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 mt-4 shrink-0">
            <button 
              type="button"
              onClick={() => handleAction('approve', inspectedTx.review_id || inspectedTx.transaction_id)}
              className="px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-600 hover:text-white transition cursor-pointer text-xs uppercase"
            >
              Confirm Legal (Clean)
            </button>
            <button 
              type="button"
              onClick={() => handleAction('reject', inspectedTx.review_id || inspectedTx.transaction_id)}
              className="px-6 py-3 rounded-xl bg-red-50 border border-red-300 text-red-700 font-bold hover:bg-red-600 hover:text-white transition cursor-pointer text-xs uppercase"
            >
              Flag Fraud (Block)
            </button>
          </div>
        </div>
      ) : (
        /* MAIN TABLE VIEW WITH LIVE PUSH ANIMATION */
        <div className={`transition-all duration-300 ease-in-out ${
          isMaximized 
            ? 'fixed inset-2 md:inset-4 z-50 bg-white border border-[#D4AF37] backdrop-blur-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden rounded-2xl shadow-2xl' 
            : 'bg-white border border-gray-200/80 shadow-sm rounded-2xl p-6 overflow-hidden'
        }`}>
          
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 tracking-wider">
                🛡️ {t('pendingReviews')}
              </h3>
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isMaximized ? <>🗗 <span>{t('btnMinimize') || 'Minimize'}</span></> : <>🗖 <span>{t('btnMaximize') || 'Maximize'}</span></>}
              </button>
            </div>
            <span className="text-xs text-gray-600 font-mono">
              Jumla: <strong className="text-[#B8860B]">{totalCount}</strong> miamala
            </span>
          </div>

          <div className="overflow-x-auto grow border border-gray-200 rounded-xl bg-gray-50/50 scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-600 uppercase tracking-widest bg-gray-100/70">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">{t('txType')}</th>
                  <th className="py-4 px-6">{t('txAmount')}</th>
                  <th className="py-4 px-6">Risk Status</th>
                  <th className="py-4 px-6 text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-gray-800 font-mono">
                {reviews.map((r) => (
                  <tr key={r.review_id || r.transaction_id} className="hover:bg-white transition-colors animate-fadeIn">
                    <td className="py-4 px-6 font-bold text-gray-900">#{r.transaction_id || r.id}</td>
                    <td className="py-4 px-6 uppercase text-xs font-semibold text-blue-700">{r.type || "TRANSFER"}</td>
                    <td className="py-4 px-6 text-emerald-700 font-bold text-sm">TZS {Number(r.amount || 0).toLocaleString()}</td>
                    <td className="py-4 px-6 font-sans">
                      <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded-lg text-xs font-black">
                        {(Number(r.fraud_probability || 0) * 100).toFixed(1)}% Risk
                      </span>
                    </td>
                    <td className="py-4 px-6 font-sans">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          type="button"
                          onClick={() => setInspectedTx(r)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                        >
                          👁️ Kagua (Inspect)
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAction('approve', r.review_id || r.transaction_id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                        >
                          Confirm Legal
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAction('reject', r.review_id || r.transaction_id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-600 hover:text-white transition cursor-pointer"
                        >
                          Flag Fraud
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500 text-sm font-sans">
                      Hakuna miamala inayosubiri kufanyiwa maamuzi kwa sasa. 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-gray-200 text-xs font-sans shrink-0">
              <div className="flex items-center gap-2 text-gray-600">
                <span>Onyesha:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-gray-900 focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>kwa kila ukurasa</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  ◀ Yaliyopita
                </button>

                <span className="text-gray-700 font-mono">
                  Ukurasa <strong className="text-[#B8860B]">{currentPage}</strong> kati ya <strong>{totalPages}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Yajayo ▶
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      <ConfirmDialog 
        isOpen={activeDialog !== null}
        title={activeDialog?.type === 'approve' ? 'Thibitisha kama Muamala Halali' : 'Thibitisha na Zuia Muamala'}
        message={
          activeDialog?.type === 'approve' 
            ? 'Una uhakika unataka kuidhinisha muamala huu kuwa safi? Hatua hii itaruhusu fedha kuendelea.' 
            : 'Una uhakika unataka kuuzuia muamala huu na kuuainisha kama wa utapeli (fraud) kwa usalama wa benki?'
        }
        onConfirm={confirmAction}
        onCancel={() => setActiveDialog(null)}
      />
    </div>
  );
};

export default FraudReviews;
