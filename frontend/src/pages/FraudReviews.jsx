import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const FraudReviews = ({ showToast }) => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState(null); 
  const [inspectedTx, setInspectedTx] = useState(null);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const data = await api.reviews.getPending();
      setReviews(Array.isArray(data) ? data : []);
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
    if (!reviewId) {
      showToast("ID ya review haipo!", "error");
      return;
    }
    setActiveDialog({ type, reviewId: Number(reviewId) });
  };

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
      
      setReviews(prevReviews => prevReviews.filter(r => r.review_id !== reviewId));
      if (inspectedTx && inspectedTx.review_id === reviewId) {
        setInspectedTx(null); 
      }
    } catch (error) {
      showToast(error.message || "Imeshindikana kukamilisha uamuzi wako kwenye mfumo.", "error");
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
        <div className="glassmorphism rounded-2xl p-8 space-y-6 relative">
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
          
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-xl font-black text-[#D4AF37] tracking-wide">
              🔍 TRANSACTION AUDITING DETAILED REPORT
            </h3>
            <button 
              onClick={() => setInspectedTx(null)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all cursor-pointer text-xs"
            >
              ⬅️ Rudisha Nyuma (Back)
            </button>
          </div>

          {/* TAARIFA ZOTE ZA MUAMALA KWA KINA (FULL DETAILS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            
            {/* Sehemu ya Kwanza: Core Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Misingi ya Muamala</h4>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">ID ya Muamala</span>
                <span className="text-lg font-mono font-bold text-white">#{inspectedTx.transaction_id || inspectedTx.id}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Aina ya Muamala (Type)</span>
                <span className="text-lg font-bold text-blue-400 uppercase">{inspectedTx.type || "N/A"}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Kiasi Kilichotumwa (Amount)</span>
                <span className="text-xl font-bold text-green-400">TZS {Number(inspectedTx.amount).toLocaleString()}</span>
              </div>
            </div>

            {/* Sehemu ya Pili: Origination (Mtumaji) Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Taarifa za Mtumaji (Origination)</h4>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Akaunti ya Mtumaji (Orig)</span>
                <span className="text-sm font-mono font-bold text-gray-300 truncate block">{inspectedTx.nameOrig || "HAIJAFAFANULIWA"}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Salio la Awali (Old Balance Orig)</span>
                <span className="text-sm font-bold text-gray-300">TZS {inspectedTx.oldbalanceOrg !== undefined ? Number(inspectedTx.oldbalanceOrg).toLocaleString() : "0"}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Salio Jipya (New Balance Orig)</span>
                <span className="text-sm font-bold text-gray-300">TZS {inspectedTx.newbalanceOrig !== undefined ? Number(inspectedTx.newbalanceOrig).toLocaleString() : "0"}</span>
              </div>
            </div>

            {/* Sehemu ya Tatu: Destination (Mpokeaji) & Risk Matrix */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Taarifa za Mpokeaji & AI Risk</h4>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Akaunti ya Mpokeaji (Dest)</span>
                <span className="text-sm font-mono font-bold text-gray-300 truncate block">{inspectedTx.nameDest || "HAIJAFAFANULIWA"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs">
                  <span className="text-gray-500 block">Old Bal Dest</span>
                  <span className="text-gray-300 font-bold">TZS {inspectedTx.oldbalanceDest !== undefined ? Number(inspectedTx.oldbalanceDest).toLocaleString() : "0"}</span>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs">
                  <span className="text-gray-500 block">New Bal Dest</span>
                  <span className="text-gray-300 font-bold">TZS {inspectedTx.newbalanceDest !== undefined ? Number(inspectedTx.newbalanceDest).toLocaleString() : "0"}</span>
                </div>
              </div>
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                <span className="text-xs text-[#D4AF37] font-bold block">Uwezekano wa Utapeli (Fraud Probability)</span>
                <span className="text-xl font-black text-red-500">{(Number(inspectedTx.fraud_probability || 0) * 100).toFixed(2)}% Risk Score</span>
              </div>
            </div>

          </div>

          {/* Maelezo ya Ziada ya Mfumo (Kama yapo) */}
          {inspectedTx.step !== undefined && (
            <div className="text-[11px] font-mono text-gray-500 text-right">
              Simulation Global Step Interval: {inspectedTx.step}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <button 
              onClick={() => handleAction('approve', inspectedTx.review_id)}
              className="px-6 py-3 rounded-xl bg-green-500/25 border border-green-500/40 text-green-400 font-bold hover:bg-green-600 hover:text-white transition cursor-pointer text-xs uppercase"
            >
              Confirm Legal (Clean)
            </button>
            <button 
              onClick={() => handleAction('reject', inspectedTx.review_id)}
              className="px-6 py-3 rounded-xl bg-red-500/25 border border-red-500/40 text-red-400 font-bold hover:bg-red-600 hover:text-white transition cursor-pointer text-xs uppercase"
            >
              Flag Fraud (Block)
            </button>
          </div>
        </div>
      ) : (
        <div className="glassmorphism rounded-2xl p-6 overflow-hidden">
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
                    <td className="py-4 px-6 font-mono font-bold text-white">#{r.transaction_id || r.id}</td>
                    <td className="py-4 px-6 uppercase text-xs font-semibold text-blue-400">{r.type || "TRANSFER"}</td>
                    <td className="py-4 px-6 text-green-400 font-bold">TZS {Number(r.amount).toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-1 rounded-lg text-xs font-black">
                        {(Number(r.fraud_probability || 0) * 100).toFixed(1)}% Risk
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
            : 'Una uhakika unataka kuuzuia muamala huu na kuuainisha kama wa utapeli (fraud) kwa usalama wa benki?'
        }
        onConfirm={confirmAction}
        onCancel={() => setActiveDialog(null)}
      />
    </div>
  );
};

export default FraudReviews;
