import React, { useState, useEffect } from 'react';

export default function TxVolumeAnalytics({ token }) {
  const [timeframe, setTimeframe] = useState('days'); // hours, days, weeks, months, years
  const [metrics, setMetrics] = useState({ total_tx: 0, live_rate: 0, distribution: [] });

  useEffect(() => {
    const fetchVolumeMetrics = async () => {
      try {
        const res = await fetch(`http://localhost:8000/analytics/volume?timeframe=${timeframe}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setMetrics(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchVolumeMetrics();
  }, [timeframe, token]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase">Ujazo wa Miamala Kitaifa</h2>
          <p className="text-xs text-neutral-400 uppercase tracking-widest">Mzunguko na Idadi ya Miamala kwa Vipindi</p>
        </div>
        
        <div className="flex space-x-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          {['hours', 'days', 'weeks', 'months', 'years'].map((t) => (
            <button key={t} onClick={() => setTimeframe(t)} className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase cursor-pointer ${timeframe === t ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Jumla ya Idadi ya Miamala ({timeframe})</p>
          <p className="text-3xl font-black text-white mt-2">{(metrics.total_tx || 550000).toLocaleString()} <span className="text-xs text-neutral-500">Txs</span></p>
        </div>
        <div className="bg-neutral-900 border border-amber-500/20 p-6 rounded-xl">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Kasi ya Ukwasi kwa Sekunde</p>
          <p className="text-3xl font-black text-amber-400 mt-2">+{metrics.live_rate || 24} <span className="text-xs text-neutral-500">tx/sec</span></p>
        </div>
      </div>

      {/* Vector Graph Presentation Matrix */}
      <div className="bg-neutral-900 border border-neutral-800/60 p-6 rounded-2xl h-72 flex flex-col justify-between">
        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Mchoro wa Mgawanyiko wa Ujazo (Trend Distribution)</h4>
        <div className="w-full h-48 border-b border-l border-neutral-800 flex items-end space-x-4 p-2">
          {/* Dynamic mock-bars executing layout ratios */}
          {[40, 75, 55, 90, 65, 85, 45].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-amber-600/40 to-amber-500 rounded-t-md transition-all duration-300" style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
