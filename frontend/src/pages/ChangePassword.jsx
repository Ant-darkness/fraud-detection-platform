import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/authApi";
import { KeyRound } from "lucide-react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError("New cryptographic keys do not match the validation node.");
    }
    
    setLoading(true);
    setError("");

    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
      
      // Kusafisha local storage na kumrudisha akajilogin upya kwa usalama
      setTimeout(() => {
        localStorage.clear();
        navigate("/");
      }, 2500);
    } catch (err) {
      setError("Failed to verify credentials update against central domain registry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9] px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl mb-3">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-[#0F2942] uppercase tracking-wider">Mandatory Security Update</h2>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">Change temporary node password</p>
          </div>

          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-lg text-xs font-semibold mb-4">{error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-lg text-xs font-semibold mb-4">Password committed. Re-authenticating session tokens...</div>}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 font-bold tracking-wider uppercase mb-1.5">Current Password</label>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition" required />
            </div>

            <div>
              <label className="block text-slate-500 font-bold tracking-wider uppercase mb-1.5">New Secure Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition" required />
            </div>

            <div>
              <label className="block text-slate-500 font-bold tracking-wider uppercase mb-1.5">Confirm Secure Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition" required />
            </div>

            <Button type="submit" loading={loading} className="w-full py-3.5 text-sm bg-[#0F2942] text-white hover:bg-[#163B5F]">
              Commit Security Credentials
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
