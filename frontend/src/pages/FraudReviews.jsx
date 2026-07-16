import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const FraudReviews = ({ showToast }) => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState(null); // { type, reviewId }
  const [inspectedTx, setInspectedTx] = useState(null);

  // Vuta miamala ya Fraud Reviews inayohitaji kufanyiwa kazi
  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const data = await api.reviews.getPending();
      setReviews(data);
    } catch (error) {
      showToast("Imeshindikana kupata miamala ya ukaguzi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleAction = (type, reviewId) => {
    setActiveDialog({ type, reviewId });
  };

  // Kufanya mabadiliko ya maamuzi na kuitatua kwenye backend
  const confirmAction = async () => {
    const { type, reviewId } = activeDialog;
    try {
      if (type === 'approve') {
        await api.reviews.approve(reviewId);
        showToast("Muamala umeidhinishwa kama safi na salama.", "success");
      } else {
        await api.reviews.reject(reviewId);
        showToast("Muamala umetiwa alama ya utapeli na kuzuiliwa.", "success");
      }
      // Reload or filter out the processed review locally
      setReviews(reviews.filter(r => r.review_id !== reviewId));
      if (inspectedTx && inspectedTx.review_id === reviewId) {
        setInspectedTx(null); // Exit detail screen if they made action inside detail view
      }
    } catch (error) {
      showToast("Imeshindikana kukamilisha uamuzi wako kwenye mfumo.", "error");
    } finally {
      setActiveDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {inspectedTx ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-xl font-black text-[#D4AF37]">
              🔍 TRANSACTION AUDITING DETAILED REPORT
            </h3>
            <button 
              onClick={() => setInspectedTx(null)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all cursor-pointer text-xs"
            >
              ⬅️ Rudisha Nyuma (Back)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">ID ya Muamala (Transaction ID)</span>
                <span className="text-lg font-bold text-white">#{inspectedTx.transaction_id}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Aina ya Muamala (Type)</span>
                <span className="text-lg font-bold text-blue-400">{inspectedTx.type}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Kiasi (Amount)</span>
                <span className="text-xl font-bold text-green-400">TZS {inspectedTx.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Mtumaji (Origination Acc)</span>
                <span className="text-lg font-bold text-gray-300">{inspectedTx.nameOrig || "HAIJAFAFANULIWA"}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Mpokeaji (Destination Acc)</span>
                <span className="text-lg font-bold text-gray-300">{inspectedTx.nameDest || "HAIJAFAFANULIWA"}</span>
              </div>
              <div className="p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30">
                <span className="text-xs text-[#D4AF37] block">Uwezekano wa Utapeli (Fraud Probability)</span>
                <span className="text-xl font-black text-red-500">{(inspectedTx.fraud_probability * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <button 
              onClick={() => handleAction('approve', inspectedTx.review_id)}
              className="px-6 py-3 rounded-xl bg-green-500/25 border border-green-500/40 text-green-400 font-bold hover:bg-green-600 hover:text-white transition cursor-pointer"
            >
              Confirm Legal (Clean)
            </button>
            <button 
              onClick={() => handleAction('reject', inspectedTx.review_id)}
              className="px-6 py-3 rounded-xl bg-red-500/25 border border-red-500/40 text-red-400 font-bold hover:bg-red-600 hover:text-white transition cursor-pointer"
            >
              Flag Fraud (Block)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-6">🛡️ {t('pendingReviews')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-widest bg-white/5">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Risk</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-200">
                {reviews.map((r) => (
                  <tr key={r.review_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-white">#{r.transaction_id}</td>
                    <td className="py-4 px-6">{r.type}</td>
                    <td className="py-4 px-6 text-green-400 font-bold">TZS {r.amount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-1 rounded-lg text-xs font-black">
                        {(r.fraud_probability * 100).toFixed(1)}% Risk
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setInspectedTx(r)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-gray-300 hover:bg-white/20 transition cursor-pointer"
                        >
                          👁️ Kagua (Inspect)
                        </button>
                        <button 
                          onClick={() => handleAction('approve', r.review_id)}
                          className="px-3 py-1.5 rounded-lg bg-green-500/25 border border-green-500/40 text-green-400 text-xs font-semibold hover:bg-green-600 hover:text-white transition cursor-pointer"
                        >
                          Confirm Legal
                        </button>
                        <button 
                          onClick={() => handleAction('reject', r.review_id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-semibold hover:bg-red-600 hover:text-white transition cursor-pointer"
                        >
                          Flag Fraud
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">
                      Hakuna miamala inayosubiri kufanyiwa maamuzi kwa sasa. 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={activeDialog !== null}
        title={activeDialog?.type === 'approve' ? 'Thibitisha kama Muamala Halali' : 'Thibitisha na Zuia Muamala'}
        message={
          activeDialog?.type === 'approve' 
            ? 'Una uhakika unataka kuidhinisha muamala huu kuwa safi? Hatua hii itaruhusu fedha kuendelea.' 
            : 'Una uhakika unataka kukamilisha hatua hii na kuuhifadhi muamala huu kama wa kitapeli (fraud) kwa usalama wa benki?'
        }
        onConfirm={confirmAction}
        onCancel={() => setActiveDialog(null)}
      />
    </div>
  );
};

export default FraudReviews;
