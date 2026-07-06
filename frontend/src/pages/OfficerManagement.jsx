import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ShieldAlert, ShieldCheck } from 'lucide-react';

const OfficerManagement = () => {
  const [officers, setOfficers] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('OFFICER');
  const { token } = useAuth();

  const fetchOfficers = () => {
    fetch('http://localhost:8000/officers/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOfficers(Array.isArray(data) ? data : []))
      .catch(() => {
        setOfficers([
          { officer_id: 1, full_name: 'Director of Security', username: 'director.bot', email: 'director@bot.go.tz', role: 'ADMIN', is_active: true },
          { officer_id: 2, full_name: 'Auditor Alpha', username: 'auditor.alpha', email: 'alpha@bot.go.tz', role: 'OFFICER', is_active: true }
        ]);
      });
  };

  useEffect(() => { fetchOfficers(); }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const url = `http://localhost:8000/officers/register?full_name=${encodeURIComponent(fullName)}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&role=${role}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setFullName(''); setEmail(''); setUsername('');
      fetchOfficers();
    }
  };

  const toggleStatus = async (id, active) => {
    const act = active ? 'disable' : 'enable';
    await fetch(`http://localhost:8000/officers/${id}/${act}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchOfficers();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <h3 className="text-base font-bold text-white tracking-wide mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-amber-500" /> Provision Access
        </h3>
        <form onSubmit={handleCreate} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Full Legal Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">System Username</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Institutional Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-slate-400 uppercase tracking-wider mb-1.5">Security Clear Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-amber-500/50">
              <option value="OFFICER">OFFICER (Read & Review)</option>
              <option value="ADMIN">ADMIN (Full Cluster Control)</option>
            </select>
          </div>
          <button type="submit" className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2.5 rounded-lg text-sm">
            Generate Temp Credentials
          </button>
        </form>
      </div>

      <div className="xl:col-span-2 bg-slate-950/20 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-sm font-bold tracking-wide uppercase font-mono text-slate-300">Active Officer Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Identity</th>
                <th className="p-4">Privilege</th>
                <th className="p-4">Gate Status</th>
                <th className="p-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {officers.map(off => (
                <tr key={off.officer_id} className="hover:bg-slate-900/20">
                  <td className="p-4">
                    <p className="font-semibold text-slate-200 text-xs">{off.full_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{off.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${off.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {off.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {off.is_active ? (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Authorized</span>
                    ) : (
                      <span className="text-rose-400 text-xs font-semibold flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Revoked</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleStatus(off.officer_id, off.is_active)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${off.is_active ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'}`}
                    >
                      {off.is_active ? 'Revoke Token' : 'Grant Token'}
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

export default OfficerManagement;
