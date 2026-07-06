import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, AlertTriangle, Users, Layers } from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetch('http://localhost:8000/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [token]);

  if (loading) return <div className="text-slate-400 font-mono text-sm animate-pulse">Querying core telemetry aggregates...</div>;

  const metricCards = [
    { title: 'Total Volume Tracked', value: summary?.total_transactions?.toLocaleString(), icon: Layers, color: 'text-blue-400' },
    { title: 'AI Flagged Anomalies', value: summary?.predicted_frauds?.toLocaleString(), icon: AlertTriangle, color: 'text-amber-400' },
    { title: 'Awaiting Clear/Review', value: summary?.pending_reviews?.toLocaleString(), icon: Users, color: 'text-violet-400' },
    { title: 'Confirmed Financial Fraud', value: summary?.confirmed_frauds?.toLocaleString(), icon: TrendingUp, color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Financial Telemetry System</h2>
        <p className="text-sm text-slate-400 font-mono">Real-time macro-transaction visibility engine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">{card.title}</p>
                  <h3 className="text-3xl font-bold font-mono tracking-tight text-slate-100">{card.value}</h3>
                </div>
                <div className={`p-2.5 rounded-lg bg-slate-900 border border-slate-800 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-950/30 border border-slate-800 rounded-xl p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300">BoT True Macro-Fraud Ratio</h4>
              <span className="text-xs px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">LIVE EVALUATION</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">Calculated strictly off finalized audit-trail validation queue vectors against macro ecosystem traffic.</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-bold font-mono text-amber-500 tracking-tighter">{summary?.fraud_rate}%</span>
            <span className="text-xs text-slate-500 font-mono mb-2">of ecosystem total traffic</span>
          </div>
        </div>

        <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300 mb-2">Automated Orchestration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Ant-Darkness ML Engine is directly hooked via container pipelines with real-time FastAPI ingestion layers processing stream bursts safely.</p>
          </div>
          <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between"><span className="text-slate-500">Node Ingestion:</span><span className="text-emerald-400">Stable</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pipeline Sync:</span><span className="text-emerald-400">Kafka-Driven</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
