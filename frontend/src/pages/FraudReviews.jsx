import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

const FraudReviews = ({ showToast }) => {
  const { t, language } = useLanguage(); // Nimeongeza 'language' hapa kwa ajili ya ukaguzi wa masharti ya lugha ya haraka
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false); 
  const [activeDialog, setActiveDialog] = useState(null); 
  const [inspectedTx, setInspectedTx] = useState(null);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const data = await api.reviews.getPending();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      if (showToast) {
        showToast("Imeshindikana kupata miamala ya ukaguzi.", "error");
      }
    } finally {
      setLoading(false); // Hii sasa itafikiwa 100% bila kukwama njiani
    }
  };

  useEffect(() => {
    fetchPendingReviews();
    
    // Cleanup function: Hakikisha tunapoondoka kwenye route hii state zote zinasafishwa vizuri
    return () => {
      setIsMaximized(false);
      setInspectedTx(null);
    };
  }, []);

  const handleAction = (type, reviewId) => {
    if (!reviewId) {
      if (showToast) showToast("ID ya review haipo!", "error");
      return;
    }
    setActiveDialog({ type, reviewId: Number(reviewId) });
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
      
      setReviews(prevReviews => prevReviews.filter(r => r.review_id !== reviewId));
      if (inspectedTx && inspectedTx.review_id === reviewId) {
        setInspectedTx(null); 
      }
    } catch (error) {
      if (showToast) showToast(error.message || "Imeshindikana kukamilisha uamuzi wako kwenye mfumo.", "error");
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
        /* ================= SEHEMU YA KWANZA: RIPOTI YA NDANI YA MUAMALA (DETAILED REPORT) ================= */
        <div className={`transition-all duration-300 ${
          isMaximized 
            ? 'fixed inset-0 z-50 bg-[#020205]/98 border border-[#D4AF37]/40 backdrop-blur-3xl p-8 flex flex-col justify-between overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.9)]' 
            : 'bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 space-y-6 relative'
        }`}>
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-[#D4AF37] tracking-wide">
                🔍 TRANSACTION AUDITING DETAILED REPORT
              </h3>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-[#D4AF37] text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {isMaximized ? `🗗 ${t('btnMinimize')}` : t('btnMaximize')}
              </button>
            </div>
            <button 
              onClick={() => setInspectedTx(null)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all cursor-pointer text-xs self-end sm:self-center"
            >
              {/* FIXED: Hapa sasa syntax ipo sawa na haitaleta crash yoyote */}
              ⬅️ {language === 'SW' ? 'Rudisha Nyuma' : 'Back'}
            </button>
          </div>

          {/* TAARIFA ZOTE ZA MUAMALA KWA KINA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm grow mt-4">
            
            {/* Core Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Misingi ya Muamala</h4>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">ID ya Muamala</span>
                <span className="text-lg font-mono font-bold text-white">#{inspectedTx.transaction_id || inspectedTx.id}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">{t('txType')}</span>
                <span className="text-lg font-bold text-blue-400 uppercase">{inspectedTx.type || "N/A"}</span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">{t('txAmount')}</span>
                <span className="text-xl font-bold text-green-400">TZS {Number(inspectedTx.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Origination Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Taarifa za Mtumaji (Origination)</h4>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Akaunti ya Mtumaji (Orig)</span>
                <span className="text-sm font-mono font-bold text-gray-300 truncate block">
                  {inspectedTx.nameOrig || inspectedTx.nameorig || "HAIJAFAFANULIWA"}
                </span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">{t('txOldOrig')}</span>
                <span className="text-sm font-bold text-gray-300">
                  TZS {Number(inspectedTx.oldbalanceOrg ?? inspectedTx.oldbalanceorig ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">{t('txNewOrig')}</span>
                <span className="text-sm font-bold text-gray-300">
                  TZS {Number(inspectedTx.newbalanceOrig ?? inspectedTx.newbalanceorig ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Destination & Risk Matrix */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Taarifa za Mpokeaji & AI Risk</h4>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 block">Akaunti ya Mpokeaji (Dest)</span>
                <span className="text-sm font-mono font-bold text-gray-300 truncate block">
                  {inspectedTx.nameDest || inspectedTx.namedest || "HAIJAFAFANULIWA"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs">
                  <span className="text-gray-500 block">Old Bal Dest</span>
                  <span className="text-gray-300 font-bold">
                    TZS {Number(inspectedTx.oldbalanceDest ?? inspectedTx.oldbalancedest ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs">
                  <span className="text-gray-500 block">New Bal Dest</span>
                  <span className="text-gray-300 font-bold">
                    TZS {Number(inspectedTx.newbalanceDest ?? inspectedTx.newbalancedest ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                <span className="text-xs text-[#D4AF37] font-bold block">{t('predictedFraud')}</span>
                <span className="text-xl font-black text-red-500">{(Number(inspectedTx.fraud_probability || 0) * 100).toFixed(2)}% Risk Score</span>
              </div>
            </div>

          </div>

          {/* System Metadata Step */}
          {(inspectedTx.step !== undefined && inspectedTx.step !== null) && (
            <div className="text-[11px] font-mono text-gray-500 text-right mt-4 shrink-0">
              Simulation Global Step Interval: {inspectedTx.step}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-white/10 mt-4 shrink-0">
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
        /* ================= SEHEMU YA PILI: ORODHA YA JEDWALI KUU (MAIN TABLE VIEW) ================= */
        <div className={`transition-all duration-300 ${
          isMaximized 
            ? 'fixed inset-0 z-50 bg-[#020205]/98 border border-[#D4AF37]/40 backdrop-blur-3xl p-8 flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.9)]' 
            : 'bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 overflow-hidden'
        }`}>
          
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <h3 className="text-lg font-bold text-white tracking-wider">
              🛡️ {t('pendingReviews')}
            </h3>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-[#D4AF37] text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
            >
              {isMaximized ? `🗗 ${t('btnMinimize')}` : t('btnMaximize')}
            </button>
          </div>

          <div className="overflow-x-auto grow border border-white/5 rounded-xl bg-black/20 scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-widest bg-white/5">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">{t('txType')}</th>
                  <th className="py-4 px-6">{t('txAmount')}</th>
                  <th className="py-4 px-6">Risk Status</th>
                  <th className="py-4 px-6 text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-200 font-mono">
                {reviews.map((r) => (
                  <tr key={r.review_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">#{r.transaction_id || r.id}</td>
                    <td className="py-4 px-6 uppercase text-xs font-semibold text-blue-400">{r.type || "TRANSFER"}</td>
                    <td className="py-4 px-6 text-green-400 font-bold text-sm">TZS {Number(r.amount || 0).toLocaleString()}</td>
                    <td className="py-4 px-6 font-sans">
                      <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-1 rounded-lg text-xs font-black">
                        {(Number(r.fraud_probability || 0) * 100).toFixed(1)}% Risk
                      </span>
                    </td>
                    <td className="py-4 px-6 font-sans">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setInspectedTx(r)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-gray-300 hover:bg-white/20 transition cursor-pointer"
                        >
                          👁️ Kagua (Inspect)
                        </button>
                        <button 
                          onClick={() => handleAction('approve', r.review_id)}
                          className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500 hover:text-white transition cursor-pointer"
                        >
                          Confirm Legal
                        </button>
                        <button 
                          onClick={() => handleAction('reject', r.review_id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-600 hover:text-white transition cursor-pointer"
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
