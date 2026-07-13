import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import ConfirmDialog from './ConfirmDialog';

export default function FraudReviewQueue({ token }) {
  const { lang, t } = useLang();
  const [reviews, setReviews] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: () => {} });

  const fetchQueue = async () => {
    try {
      const res = await fetch('http://localhost:8000/reviews/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setReviews(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchQueue(); }, [token]);

  const triggerAction = (id, action) => {
    const isApprove = action === 'approve';
    setDialog({
      isOpen: true,
      title: isApprove ? (lang === 'sw' ? 'Hukumu: SI UTAPELI (False)' : 'Judgment: FALSE FRAUD') : (lang === 'sw' ? 'Hukumu: NI UTAPELI (True)' : 'Judgment: TRUE FRAUD'),
      message: isApprove 
        ? `Je, una uhakika kuwa muamala #${id} hauna viashiria vya utapeli (False Positive) na unapaswa kuruhusiwa kwenye Ledger?` 
        : `Muamala #${id} utathibitishwa rasmi kama utapeli (True Positive) na utafungiwa kabisa katika mifumo yote ya makazi.`,
      type: isApprove ? 'info' : 'danger',
      onConfirm: () => executeAction(id, action)
    });
  };

  const executeAction = async (id, action) => {
    setDialog(p => ({ ...p, isOpen: false })); // Funga dialog hapo hapo kwa kasi ya juu
    try {
      const res = await fetch(`http://localhost:8000/reviews/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchQueue(); // Refresh data kimyakimya bila kulag browser
    } catch (e) { 
      console.error(e); 
    }
  };

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-full">
      <div>
        <h1 className="text-xl font-black text-white uppercase">{t('fraudReview')}</h1>
        <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-widest">Miamala yote iliyosimamishwa na mifumo ya AI inasubiri maamuzi ya kisheria hapa</p>
      </div>

      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-xs relative border-collapse">
            <thead className="bg-neutral-950 text-amber-500 uppercase tracking-wider font-bold sticky top-0 z-10 border-b border-neutral-800">
              <tr>
                <th className="p-3 bg-neutral-950">TX ID</th>
                <th className="p-3 bg-neutral-950">Type</th>
                <th className="p-3 bg-neutral-950">Amount</th>
                <th className="p-3 bg-neutral-950">Sender</th>
                <th className="p-3 bg-neutral-950">Receiver</th>
                <th className="p-3 bg-neutral-950">Risk Level</th>
                <th className="p-3 text-right bg-neutral-950">Maamuzi (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40 font-medium">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-neutral-500 font-bold uppercase tracking-wider">Salama: Hakuna miamala inayosubiri mapitio kwa sasa.</td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.review_id} className="hover:bg-neutral-800/10 transition-colors">
                    <td className="p-3 font-bold text-white">TX-{r.transaction_id}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-neutral-950 rounded text-neutral-400 font-mono text-[10px] font-bold">{r.type}</span></td>
                    <td className="p-3 text-amber-400 font-bold">Tsh {r.amount?.toLocaleString()}</td>
                    <td className="p-3 text-neutral-400 font-mono">{r.nameorig || 'N/A'}</td>
                    <td className="p-3 text-neutral-400 font-mono">{r.namedest || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`font-black ${r.fraud_probability > 0.8 ? 'text-red-500' : 'text-amber-500'}`}>
                        {(r.fraud_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button 
                        onClick={() => triggerAction(r.review_id, 'approve')} 
                        className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-black cursor-pointer uppercase hover:bg-emerald-500 hover:text-neutral-950 transition-all"
                      >
                        False (Safe)
                      </button>
                      <button 
                        onClick={() => triggerAction(r.review_id, 'reject')} 
                        className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-black cursor-pointer uppercase hover:bg-red-500 hover:text-neutral-950 transition-all"
                      >
                        True (Fraud)
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Component ya Uthibitisho wa Haraka */}
      <ConfirmDialog 
        isOpen={dialog.isOpen} 
        title={dialog.title} 
        message={dialog.message} 
        type={dialog.type} 
        onConfirm={dialog.onConfirm} 
        onCancel={() => setDialog(p => ({ ...p, isOpen: false }))} 
        lang={lang} 
      />
    </div>
  );
}
