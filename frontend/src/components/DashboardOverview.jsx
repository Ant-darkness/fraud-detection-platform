import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';

export default function DashboardOverview({ token }) {
  const { t } = useLang();
  const [summary, setSummary] = useState(null);
  const [comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resSum, resComp] = await Promise.all([
        fetch('http://localhost:8000/dashboard/summary', { headers }),
        fetch('http://localhost:8000/dashboard/volume-comparison', { headers })
      ]);
      if (resSum.ok) setSummary(await resSum.json());
      if (resComp.ok) setComp(await resComp.json());
    } catch (e) {
      console.error("Dashboard engine error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Sasisha kila baada ya sekunde 5
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return <div className="text-amber-500 font-bold text-xs tracking-widest uppercase animate-pulse">Inapakia Data za Benki Kuu...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">{t('dashboard')}</h1>
        <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-widest">Muonekano wa Usimamizi wa Ukwasi na Vihatarishi vya Kitaifa</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Miamala Yote", val: summary?.total_transactions?.toLocaleString(), color: "border-neutral-800" },
          { label: "Miamala Inayohakikiwa", val: summary?.pending_reviews?.toLocaleString(), color: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
          { label: "Utapeli uliothibitishwa", val: summary?.confirmed_frauds?.toLocaleString(), color: "border-red-500/30 text-red-500 bg-red-500/5" },
          { label: "Kiwango cha Utapeli (%)", val: `${summary?.fraud_rate || 0}%`, color: "border-emerald-500/30 text-emerald-400" }
        ].map((c, idx) => (
          <div key={idx} className={`bg-neutral-900 border ${c.color} p-5 rounded-xl shadow-lg flex flex-col justify-between`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{c.label}</p>
            <p className="text-2xl font-black tracking-tight mt-2">{c.val ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Volume Comparison & AI Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">Ulinganifu wa Thamani na Idadi (Leo vs Jana)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/50">
                <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Miamala ya Leo</p>
                <p className="text-lg font-bold text-white mt-1">{comp?.today_volume?.toLocaleString()} txs</p>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">Tsh {comp?.today_amount?.toLocaleString()}</p>
              </div>
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/50">
                <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Miamala ya Jana</p>
                <p className="text-lg font-bold text-neutral-400 mt-1">{comp?.yesterday_volume?.toLocaleString()} txs</p>
                <p className="text-xs text-neutral-500 font-bold mt-0.5">Tsh {comp?.yesterday_amount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI INSIGHT PANEL FROM BACKEND */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-amber-500/20 rounded-xl p-5 relative">
          <div className="absolute top-2 right-2 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">LIVE</div>
          <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
            <span>🤖</span> <span>{t('agentInsight')}</span>
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/60 min-h-[110px]">
            {comp?.agent_explanation || "Mifumo yote ipo dhabiti. Uchambuzi wa kisayansi unaonyesha utulivu mkubwa wa mzunguko wa ukwasi wa masaa ya karibuni kitaifa."}
          </p>
        </div>
      </div>
    </div>
  );
}
