import React, { useState, useEffect } from 'react';

export default function ModelRegistryView({ token, user }) {
  const [models, setModels] = useState([]);

  const fetchModels = async () => {
    try {
      const res = await fetch('http://localhost:8000/models/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setModels(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchModels(); }, [token]);

  const handleActivate = async (id) => {
    if (user?.role !== 'ADMIN') return alert("Maafisa wa ngazi ya Juu pekee (ADMIN) wanaweza kuwasha Model mpya.");
    try {
      const res = await fetch(`http://localhost:8000/models/${id}/activate`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { alert("Model mpya imewashwa kwenye Real-time Stream!"); fetchModels(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (user?.role !== 'ADMIN') return alert("Ruhusa imekataliwa.");
    if (!window.confirm("Una uhakika unataka kufuta kabisa hii model kutoka kwenye disk na registry?")) return;
    try {
      const res = await fetch(`http://localhost:8000/models/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { fetchModels(); } else { alert("Model ambayo ipo active haitakiwi kufutwa!"); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase">Sajili ya Mifumo ya Akili Artificial (AI Model Registry)</h1>
        <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Usimamizi na uhakiki wa vigezo vya ufanisi wa Model kabla ya kuruhusiwa sokoni</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950 text-amber-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Model Name</th>
              <th className="p-4">Version</th>
              <th className="p-4">Description</th>
              <th className="p-4">Dataset Size</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-medium text-neutral-300">
            {models.map(m => (
              <tr key={m[0]} className={`hover:bg-neutral-800/10 ${m[6] ? 'bg-amber-500/5' : ''}`}>
                <td className="p-4 font-bold text-white">#{m[0]}</td>
                <td className="p-4 font-bold text-white">{m[1]}</td>
                <td className="p-4 font-mono text-amber-500">v{m[2]}</td>
                <td className="p-4 max-w-xs truncate">{m[3]}</td>
                <td className="p-4 font-mono">{m[4]?.toLocaleString() || 'N/A'} rows</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${m[6] ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-950 text-neutral-500'}`}>
                    {m[5]}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {!m[6] && (
                    <>
                      <button onClick={() => handleActivate(m[0])} className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold rounded text-[11px] hover:brightness-110 cursor-pointer uppercase tracking-tight">Activate</button>
                      <button onClick={() => handleDelete(m[0])} className="px-2.5 py-1 bg-neutral-950 text-red-400 border border-neutral-800 font-bold rounded text-[11px] hover:bg-red-950 hover:text-red-300 cursor-pointer uppercase tracking-tight">Delete</button>
                    </>
                  )}
                  {m[6] && <span className="text-[11px] text-emerald-500 font-bold tracking-widest uppercase">● RUNNING IN PRODUCTION</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
