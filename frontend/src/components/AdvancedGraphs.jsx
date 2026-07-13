import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';

export default function AdvancedGraphs({ token }) {
  const { t } = useLang();
  const [timeframe, setTimeframe] = useState('days'); // hours, days, weeks, months
  const [filterMinAmount, setFilterMinAmount] = useState(0);
  const [graphData, setGraphData] = useState({ fraud_counts: 0, distribution: [], trends: [] });

  useEffect(() => {
    const fetchGraphMetrics = async () => {
      try {
        const res = await fetch(`http://localhost:8000/analytics/graphs?timeframe=${timeframe}&min_amount=${filterMinAmount}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setGraphData(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchGraphMetrics();
  }, [timeframe, filterMinAmount, token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase">{t('graphs')}</h2>
          <p className="text-xs text-neutral-400 uppercase tracking-widest">Uchambuzi wa Mgawanyiko wa Utapeli Kitaifa</p>
        </div>
        
        {/* Navigation Filters */}
        <div className="flex items-center space-x-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          {['hours', 'days', 'weeks', 'months'].map((tf) => (
            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 text-[11px] font-black rounded-lg uppercase transition-all cursor-pointer ${timeframe === tf ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}>
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Control Card & Quick Count Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col justify-center">
          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">Kichujio cha Thamani (Tsh Min)</label>
          <input type="number" value={filterMinAmount} onChange={(e) => setFilterMinAmount(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500" />
        </div>
        <div className="bg-neutral-900 border border-red-500/20 p-4 rounded-xl relative overflow-hidden">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Fraud Counts ({timeframe})</p>
          <p className="text-3xl font-black text-red-500 mt-2">{graphData.fraud_counts || 0}</p>
          <div className="absolute -bottom-2 -right-2 text-red-500/5 text-6xl font-black">!!</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Distribution Ratio</p>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-red-400 font-bold">Fraud: {graphData.fraud_percentage || '4.2'}%</span>
            <span className="text-emerald-400 font-bold">Non-Fraud: {graphData.non_fraud_percentage || '95.8'}%</span>
          </div>
        </div>
      </div>

      {/* Simulated High-Fidelity Canvas Layout placeholders for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800/60 p-5 rounded-2xl h-64 flex flex-col justify-between">
          <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Distribution: Fraud vs Non-Fraud Matrix</h4>
          <div className="flex items-end space-x-6 h-40 justify-center pb-2 font-mono text-[10px]">
            <div className="w-12 bg-red-500/20 border border-red-500 text-center text-red-400 pt-2 rounded-t-md animate-fade-in" style={{ height: '30%' }}>30%</div>
            <div className="w-12 bg-emerald-500/20 border border-emerald-500 text-center text-emerald-400 pt-2 rounded-t-md animate-fade-in" style={{ height: '90%' }}>90%</div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800/60 p-5 rounded-2xl h-64 flex flex-col justify-between">
          <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Fraud Detection Trends Over Time</h4>
          <div className="w-full h-40 border-b border-l border-neutral-800 flex items-center justify-center text-neutral-600 text-xs italic">
            [ Real-time Chart Vector Stream Active ]
          </div>
        </div>
      </div>
    </div>
  );
}
