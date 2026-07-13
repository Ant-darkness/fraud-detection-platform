import React, { useState, useEffect } from 'react';

export default function OfficerRegistry({ token }) {
  const [officers, setOfficers] = useState([]);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fetchOfficers = async () => {
    try {
      const res = await fetch('http://localhost:8000/officers/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOfficers(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchOfficers(); }, [token]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/officers/register?full_name=${encodeURIComponent(fullName)}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&role=OFFICER`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Afisa mpya amesajiliwa!");
        setFullName(''); setUsername(''); setEmail(''); setPassword('');
        fetchOfficers();
      } else { alert("Usajili umefeli. Hakikisha barua pepe au username haijatumika."); }
    } catch (e) { console.error(e); }
  };

  const toggleOfficer = async (id, isActive) => {
    const action = isActive ? 'disable' : 'enable';
    try {
      const res = await fetch(`http://localhost:8000/officers/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { fetchOfficers(); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Orodha ya Maafisa wa Uchunguzi</h2>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-amber-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {officers.map(o => (
                <tr key={o.officer_id} className="hover:bg-neutral-800/10 text-neutral-300">
                  <td className="p-4 font-bold text-white">{o.full_name}</td>
                  <td className="p-4 font-mono">{o.username}</td>
                  <td className="p-4">{o.email}</td>
                  <td className="p-4"><span className="text-[10px] bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded font-bold text-amber-500">{o.role}</span></td>
                  <td className="p-4 text-right">
                    <button onClick={() => toggleOfficer(o.officer_id, o.is_active)} className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${o.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-neutral-950' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950'}`}>
                      {o.is_active ? "Block Officer" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Form */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl h-fit">
        <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-4">Sajili Afisa Mpya</h3>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white" />
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white" />
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white" />
          <input type="password" placeholder="Temporary Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white" />
          <button type="submit" className="w-full py-2.5 bg-amber-500 text-neutral-950 font-black rounded text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer">Kamilisha Usajili</button>
        </form>
      </div>
    </div>
  );
}
