import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';

export default function MetricsReadOnly({ token }) {
  const { t } = useLang();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch('http://localhost:8000/metrics/leaderboard', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error(`Server Error: ${res.status}`);

        const data = await res.json();
        setLeaderboard(Array.isArray(data) ? data : []);
      } catch (e) { 
        console.error("Leaderboard Error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchLeaderboard();
  }, [token]);

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div>
        <h1 className="text-xl font-black text-white uppercase">{t('metrics')}</h1>
        <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Ubao wa ufanisi wa mifumo ya AI kulingana na vigezo vya Data Science</p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono">
          ⚠️ Hitilafu: {error}
        </div>
      )}

      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-xs relative border-collapse">
            <thead className="bg-neutral-950 text-amber-500 uppercase tracking-widest font-black sticky top-0 z-10 border-b border-neutral-800">
              <tr>
                <th className="p-4 bg-neutral-950">Rank</th>
                <th className="p-4 bg-neutral-950">Model Meta</th>
                <th className="p-4 font-mono bg-neutral-950">F1-Score</th>
                <th className="p-4 font-mono bg-neutral-950">Precision</th>
                <th className="p-4 font-mono bg-neutral-950">Recall</th>
                <th className="p-4 font-mono bg-neutral-950">ROC-AUC</th>
                <th className="p-4 font-mono text-right bg-neutral-950">Fraud Recall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-amber-500/60 font-bold uppercase tracking-widest animate-pulse">Inapakia Matrix...</td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-neutral-500 font-bold uppercase tracking-wider">Hakuna data zilizopatikana.</td>
                </tr>
              ) : (
                leaderboard.map((m, idx) => (
                  <tr key={m.model_id || idx} className={`hover:bg-neutral-800/10 transition-colors ${idx === 0 ? 'border-l-2 border-amber-500 bg-amber-500/5' : ''}`}>
                    <td className="p-4 font-black text-white text-sm">#{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-white text-xs">{m.model_name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">version {m.model_version}</div>
                    </td>
                    <td className="p-4 font-mono text-amber-400 font-bold">{(Number(m.f1_score || 0) * 100).toFixed(2)}%</td>
                    <td className="p-4 font-mono">{(Number(m.precision_score || 0) * 100).toFixed(2)}%</td>
                    <td className="p-4 font-mono">{(Number(m.recall_score || 0) * 100).toFixed(2)}%</td>
                    <td className="p-4 font-mono text-neutral-400">{(Number(m.roc_auc || 0) * 100).toFixed(2)}%</td>
                    <td className="p-4 font-mono text-red-500 font-semibold text-right">{(Number(m.fraud_recall || 0) * 100).toFixed(2)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
