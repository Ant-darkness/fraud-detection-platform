import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ShieldAlert, ShieldCheck } from 'lucide-react';
import Card from "../components/common/Card";

export default function OfficerManagement() {
  const [officers, setOfficers] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('OFFICER');
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    const url = `http://localhost:8000/officers/register?full_name=${encodeURIComponent(fullName)}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&role=${role}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFullName(''); setEmail(''); setUsername('');
        fetchOfficers();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, active) => {
    const backup = [...officers];
    const act = active ? 'disable' : 'enable';
    
    // Optimistic UI state toggle
    setOfficers(prev => prev.map(o => o.officer_id === id ? { ...o, is_active: !active } : o));

    try {
      await fetch(`http://localhost:8000/officers/${id}/${act}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {
      setOfficers(backup);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 tracking-wide mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="h-5 w-5 text-[#C5A059]" /> Provision Institutional Access
        </h3>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold tracking-wider mb-1.5 uppercase">Full Legal Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-[#C5A059] focus:bg-white transition text-sm" />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold tracking-wider mb-1.5 uppercase">System Username</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-[#C5A059] focus:bg-white transition text-sm" />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold tracking-wider mb-1.5 uppercase">Institutional Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-[#C5A059] focus:bg-white transition text-sm" />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold tracking-wider mb-1.5 uppercase">Security Clear Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-[#C5A059] focus:bg-white transition text-sm font-medium">
              <option value="OFFICER">OFFICER (Read & Review Access)</option>
              <option value="ADMIN">ADMIN (Full Cluster Authorization)</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="w-full mt-2 bg-[#C5A059] hover:bg-[#A4813D] disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition shadow-sm">
            {submitting ? "Processing Node..." : "Generate Temp Credentials"}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold tracking-wider text-slate-700 uppercase">Active Officer Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4 pl-6">Identity</th>
                <th className="p-4">Privilege Gate</th>
                <th className="p-4">Authorization</th>
                <th className="p-4 pr-6 text-right">Access Token Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {officers.map(off => (
                <tr key={off.officer_id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 pl-6">
                    <p className="font-semibold text-slate-800">{off.full_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{off.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold tracking-wide border ${off.role === 'ADMIN' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                      {off.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {off.is_active ? (
                      <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Authorized</span>
                    ) : (
                      <span className="text-rose-600 text-xs font-semibold flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-rose-500" /> Revoked</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => toggleStatus(off.officer_id, off.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${off.is_active ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {off.is_active ? 'Revoke Access' : 'Grant Access'}
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
}
