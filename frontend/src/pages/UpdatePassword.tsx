import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const T = {
  gold: "#E8B86D", goldDim: "#D4A853", goldFaint: "rgba(232,184,109,0.10)",
  glassBorder: "rgba(255,255,255,0.08)", glassBorderHover: "rgba(232,184,109,0.22)",
  text: "#F2EAD8", textDim: "#9C8B73",
  bg: "linear-gradient(155deg,#1C0A08 0%,#160806 45%,#0F0503 100%)",
  cardBg: "rgba(255,255,255,0.03)",
};

function GlowOrb({ color, size, top, left, blur }: { color: string; size: number; top: string; left: string; blur: number }) {
  return (
    <div style={{
      position: "absolute", top, left, width: size, height: size,
      background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
      filter: `blur(${blur}px)`, transform: "translate(-50%,-50%)", pointerEvents: "none",
    }} />
  );
}

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      
      // Redirect to workspace after a brief delay so they see the success message
      setTimeout(() => {
        navigate("/workspace", { replace: true });
      }, 2500);
      
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: T.bg }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background */}
      <GlowOrb color="rgba(139,28,28,0.30)" size={600} top="30%" left="70%" blur={140} />
      <GlowOrb color="rgba(180,100,20,0.10)" size={350} top="75%" left="20%" blur={100} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.05 }}>
        <svg viewBox="0 0 400 400" fill="none" style={{ width: "100%", height: "100%" }}>
          <defs>
            <pattern id="sdots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#E8B86D" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#sdots)" />
        </svg>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border p-8 relative z-10"
        style={{
          background: T.cardBg, backdropFilter: "blur(28px)", borderColor: T.glassBorder,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation: "fadeUp 0.4s ease forwards",
        }}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: T.goldFaint, border: `1px solid ${T.gold}28` }}>
            <Scale size={22} style={{ color: T.gold }} />
          </div>
          <div className="text-center">
            <div className="font-bold text-xl" style={{ color: T.gold, fontFamily: "'Playfair Display',serif" }}>
              Update Password
            </div>
            <div className="text-sm mt-0.5" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>
              Please enter your new password below
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 text-center font-medium" style={{ fontFamily: "'DM Sans',sans-serif" }}>
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center text-center p-6 border rounded-xl" style={{ borderColor: "rgba(16, 185, 129, 0.2)", background: "rgba(16, 185, 129, 0.05)" }}>
            <CheckCircle className="text-emerald-500 mb-3" size={32} />
            <div className="text-emerald-400 font-medium mb-1" style={{ fontFamily: "'DM Sans',sans-serif" }}>Password Updated Successfully!</div>
            <div className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans',sans-serif" }}>Redirecting you to the workspace...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>New Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8}
                  className="w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)", borderColor: T.glassBorder,
                    color: T.text, fontFamily: "'DM Sans',sans-serif",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.glassBorder)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: T.textDim }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.textDim)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password" required minLength={8}
                  className="w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)", borderColor: T.glassBorder,
                    color: T.text, fontFamily: "'DM Sans',sans-serif",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.glassBorder)}
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-4 transition-all"
              style={{
                background: loading ? T.goldDim : T.gold, color: "#0D0604",
                fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.8 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.goldDim; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.gold; }}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 rounded-full border-t-transparent animate-spin" style={{ borderColor: `#0D060440 #0D060440 #0D060440 #0D0604` }} />
                  Updating…
                </div>
              ) : (
                "Save New Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
