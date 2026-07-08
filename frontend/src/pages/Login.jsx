import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(email, password);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("officer", JSON.stringify({
        ...data.officer,
        must_change_password: data.must_change_password
      }));

      if (data.must_change_password) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Invalid credential payload tokens verified by operational node.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9] px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-md shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-50 rounded-2xl mb-3 text-[#0F2942]">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-[#0F2942] tracking-wider uppercase text-center">Bank of Tanzania</h1>
          <p className="text-center text-xs text-slate-400 font-semibold tracking-widest uppercase mt-0.5">Fraud Operations Control</p>
        </div>

        {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg text-xs font-semibold mb-4">{error}</div>}
        
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-500 font-bold tracking-wider uppercase mb-1.5">Official Mail Address</label>
            <input type="email" placeholder="officer@bot.go.tz" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition" required />
          </div>

          <div>
            <label className="block text-slate-500 font-bold tracking-wider uppercase mb-1.5">Node Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition" required />
          </div>
        </div>

        <button disabled={loading} className="w-full mt-6 bg-[#0F2942] hover:bg-[#163B5F] text-white py-3.5 rounded-lg text-sm font-semibold transition tracking-wide shadow-sm disabled:opacity-50">
          {loading ? "Authorizing Session Token..." : "Authenticate Access"}
        </button>
      </form>
    </div>
  );
}
