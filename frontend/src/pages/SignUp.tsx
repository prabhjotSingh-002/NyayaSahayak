import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Eye, EyeOff, ArrowLeft, CheckCircle, Gavel } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

const T = {
  gold: "#E8B86D", goldDim: "#D4A853", goldFaint: "rgba(232,184,109,0.10)",
  glassBorder: "rgba(255,255,255,0.08)", glassBorderHover: "rgba(232,184,109,0.22)",
  text: "#F2EAD8", textDim: "#9C8B73",
  bg: "linear-gradient(155deg,#1A0808 0%,#140606 45%,#0D0403 100%)",
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

const PERKS = [
  "IPC → BNS section mapping, instant",
  "Unlimited case file storage",
  "Contract audits with Indian law references",
  "AI drafts in Hindi & English",
];

export default function SignUp() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user) {
      const pendingQuery = sessionStorage.getItem("pendingQuery");
      if (pendingQuery) {
        sessionStorage.removeItem("pendingQuery");
        navigate("/ai-vakil", { state: { query: pendingQuery } });
      } else {
        navigate("/workspace");
      }
    }
  }, [user, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
          },
        },
      });
      if (signUpError) throw signUpError;
      
      if (data?.session) {
        const pendingQuery = sessionStorage.getItem("pendingQuery");
        if (pendingQuery) {
          sessionStorage.removeItem("pendingQuery");
          navigate("/ai-vakil", { state: { query: pendingQuery } });
        } else {
          navigate("/workspace");
        }
      } else {
        setSuccessMsg(`Registration successful! A verification email was sent to ${form.email}. Please check your inbox and click the link to confirm before logging in.`);
        setForm({ name: "", email: "", password: "" });
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || "OAuth redirection failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: T.bg }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <GlowOrb color="rgba(139,28,28,0.28)" size={600} top="25%" left="72%" blur={140} />
      <GlowOrb color="rgba(180,100,20,0.10)" size={380} top="80%" left="18%" blur={100} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.05 }}>
        <svg viewBox="0 0 400 400" fill="none" style={{ width: "100%", height: "100%" }}>
          <defs>
            <pattern id="updots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#E8B86D" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#updots)" />
        </svg>
      </div>

      {/* Back */}
      <button onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
        style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}
        onMouseEnter={e => (e.currentTarget.style.color = T.text)}
        onMouseLeave={e => (e.currentTarget.style.color = T.textDim)}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
        style={{ animation: "fadeUp 0.4s ease forwards" }}>

        {/* Left — perks panel */}
        <div className="hidden md:flex flex-col justify-between rounded-2xl border p-8"
          style={{
            background: "rgba(139,28,28,0.08)", backdropFilter: "blur(20px)",
            borderColor: "rgba(139,28,28,0.25)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: T.goldFaint, border: `1px solid ${T.gold}28` }}>
                <Scale size={18} style={{ color: T.gold }} />
              </div>
              <span className="font-bold text-lg" style={{ color: T.gold, fontFamily: "'Playfair Display',serif" }}>
                NyayaSahayak
              </span>
            </div>

            <h2 className="text-3xl font-bold italic leading-tight mb-4"
              style={{ color: T.text, fontFamily: "'Playfair Display',serif" }}>
              Your AI Legal<br />Companion.
            </h2>
            <p className="text-sm leading-relaxed mb-8"
              style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>
              Built for India&apos;s legal transition from IPC to BNS, CrPC to BNSS, IEA to BSA.
              Everything in plain language.
            </p>

            <div className="flex flex-col gap-3">
              {PERKS.map(p => (
                <div key={p} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: T.goldFaint, border: `1px solid ${T.gold}30` }}>
                    <CheckCircle size={11} style={{ color: T.gold }} />
                  </div>
                  <span className="text-sm" style={{ color: `${T.text}80`, fontFamily: "'DM Sans',sans-serif" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code transition display */}
          <div className="mt-8 rounded-xl border p-4"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: T.glassBorder }}>
            <div className="text-[10px] mb-3 uppercase tracking-widest" style={{ color: `${T.gold}55`, fontFamily: "'JetBrains Mono',monospace" }}>
              Law Code Transition
            </div>
            {[
              ["IPC 1860", "BNS 2023"],
              ["CrPC 1973", "BNSS 2023"],
              ["IEA 1872", "BSA 2023"],
            ].map(([old, next]) => (
              <div key={old} className="flex items-center gap-3 mb-2 last:mb-0">
                <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "rgba(139,28,28,0.4)", color: "#F0A0A0", fontFamily: "'JetBrains Mono',monospace" }}>{old}</span>
                <span style={{ color: T.textDim, fontSize: "11px" }}>→</span>
                <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: `${T.gold}35`, color: T.gold, fontFamily: "'JetBrains Mono',monospace" }}>{next}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — signup form */}
        <div className="rounded-2xl border p-8"
          style={{
            background: T.cardBg, backdropFilter: "blur(28px)", borderColor: T.glassBorder,
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 md:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.goldFaint, border: `1px solid ${T.gold}28` }}>
              <Scale size={15} style={{ color: T.gold }} />
            </div>
            <span className="font-bold" style={{ color: T.gold, fontFamily: "'Playfair Display',serif" }}>NyayaSahayak</span>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-semibold" style={{ color: T.text, fontFamily: "'Playfair Display',serif" }}>
              Create your account
            </h3>
            <p className="text-sm mt-1" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>
              Free forever. No credit card required.
            </p>
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border mb-5 transition-all text-sm"
            style={{ borderColor: T.glassBorder, color: T.text, background: "rgba(255,255,255,0.03)", fontFamily: "'DM Sans',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.glassBorderHover; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.glassBorder; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 text-center font-medium" style={{ fontFamily: "'DM Sans',sans-serif" }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 text-center font-medium" style={{ fontFamily: "'DM Sans',sans-serif" }}>
              {successMsg}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: T.glassBorder }} />
            <span className="text-[11px]" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: T.glassBorder }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>Full name</label>
              <input type="text" value={form.name} onChange={set("name")}
                placeholder="Advocate Priya Sharma" required
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: T.glassBorder, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)}
                onBlur={e => (e.currentTarget.style.borderColor = T.glassBorder)} />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>Email address</label>
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="priya@chambers.in" required
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: T.glassBorder, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)}
                onBlur={e => (e.currentTarget.style.borderColor = T.glassBorder)} />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>Create password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")}
                  placeholder="Min. 8 characters" required minLength={8}
                  className="w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: T.glassBorder, color: T.text, fontFamily: "'DM Sans',sans-serif" }}
                  onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)}
                  onBlur={e => (e.currentTarget.style.borderColor = T.glassBorder)} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: T.textDim }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.textDim)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-1 transition-all"
              style={{
                background: loading ? T.goldDim : T.gold, color: "#0D0604",
                fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.85 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.goldDim; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.gold; }}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: "#0D060440", borderTopColor: "#0D0604" }} />
                  Creating account…
                </div>
              ) : (
                <>Create Account <Gavel size={14} /></>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm mt-6" style={{ color: T.textDim, fontFamily: "'DM Sans',sans-serif" }}>
            Already have an account?{" "}
            <button onClick={() => navigate("/signin")}
              className="transition-colors font-medium"
              style={{ color: T.gold }}
              onMouseEnter={e => (e.currentTarget.style.color = T.goldDim)}
              onMouseLeave={e => (e.currentTarget.style.color = T.gold)}>
              Sign In →
            </button>
          </p>

          <p className="text-center text-[10px] mt-4" style={{ color: `${T.textDim}40`, fontFamily: "'DM Sans',sans-serif" }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
