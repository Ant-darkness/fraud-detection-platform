import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const TransactionReview = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchQueue = () => {
    setLoading(true);
    // Vuta data kutoka endpoint inayorudisha pending reviews kulingana na mfumo wako
    fetch('http://localhost:8000/reviews/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setQueue(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback data inayofanana kabisa na dict kutoka kwenye service yako ya python
        setQueue([
          { review_id: 101, transaction_id: 55092, fraud_probability: 0.9842, status: 'PENDING' },
          { review_id: 102, transaction_id: 55095, fraud_probability: 0.8120, status: 'PENDING' }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => { fetchQueue(); }, [token]);

  const handleAction = async (id, type) => {
    try {
      // type inaweza kuwa ama 'approve' au 'reject' kuendana na backend functions zako
      await fetch(`http://localhost:8000/reviews/${id}/${type}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setQueue(prev => prev.filter(item => item.review_id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Fraud Escalation Review Queue</h2>
          <p className="text-xs text-slate-400 font-mono">Manual auditing overrides for AI high-risk prediction scores.</p>
        </div>
        <button onClick={fetchQueue} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors">
          <RefreshCw className="h-4 w-4 text-amber-500" />
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Review Node ID</th>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Risk Probability</th>
                <th className="p-4">Escalation Status</th>
                <th className="p-4 text-right">Execute Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">Syncing queues...</td></tr>
              ) : queue.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Review queue fully cleared. All systems nominal.</td></tr>
              ) : queue.map((item) => (
                <tr key={item.review_id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 text-amber-500 font-bold">#REV-{item.review_id}</td>
                  <td className="p-4 text-slate-300">#TX-{item.transaction_id}</td>
                  <td className="p-4">
                    <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {(item.fraud_probability * 100).toFixed(2)}% Risk
                    </span>
                  </td>
                  <td className="p-4"><span className="text-xs tracking-wider text-amber-400 animate-pulse font-bold">{item.status}</span></td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => handleAction(item.review_id, 'reject')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Overturn
                    </button>
                    <button 
                      onClick={() => handleAction(item.review_id, 'approve')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-600 transition-all"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Confirm Fraud
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionReview;
