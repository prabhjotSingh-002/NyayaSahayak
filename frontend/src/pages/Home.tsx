import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (user) {
      navigate("/ai-vakil", { state: { query } });
    } else {
      sessionStorage.setItem("pendingQuery", query);
      navigate("/login");
    }
  };

  const handleFeatureClick = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="font-sans-ui relative min-h-screen overflow-hidden selection:bg-[#E8B86D] selection:text-[#0a0807] dot-matrix-body text-[#E7E5E4]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
        
        .font-serif-legal { font-family: 'Merriweather', serif; }
        .font-sans-ui { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono-code { font-family: 'JetBrains Mono', monospace; }

        /* ✨ Dot Matrix Base */
        .dot-matrix-body {
          background-color: #080605; /* Deepest Espresso/Obsidian */
          background-image: radial-gradient(rgba(232, 184, 109, 0.12) 1px, transparent 1px);
          background-size: 28px 28px;
          color: #E7E5E4;
        }

        /* 🔮 Floating Glass Components */
        .glass-nav {
          background: rgba(10, 8, 7, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(232, 184, 109, 0.1);
        }

        .glass-card {
          background: rgba(20, 16, 13, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232, 184, 109, 0.15);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          border-color: rgba(232, 184, 109, 0.4);
          background: rgba(30, 24, 20, 0.6);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(232, 184, 109, 0.1);
        }

        /* 🏃‍♂️ Infinite Ticker Animation */
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover { animation-play-state: paused; }

        /* 🔍 Custom AI Scanner Animation for ContractGuard */
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #E8B86D;
          box-shadow: 0 0 15px 5px rgba(232, 184, 109, 0.5);
          animation: scanline 3s linear infinite;
          z-index: 50;
        }
      `}</style>

      {/* ========================================== */}
      {/* 🌟 CINEMATIC BACKGROUND LIGHTING */}
      {/* ========================================== */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#E8B86D]/15 via-amber-700/5 to-transparent rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      <div className="absolute top-[20%] right-[-10%] text-[#E8B86D] opacity-[0.03] select-none pointer-events-none z-0 transform -rotate-12">
        <svg width="800" height="800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.3">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
          <path d="M7 21h10"/>
          <path d="M12 3v18"/>
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
        </svg>
      </div>

      {/* ========================================== */}
      {/* 📢 1. THE THICK INFINITE TICKER */}
      {/* ========================================== */}
      <div className="w-full bg-gradient-to-r from-[#1a120b] via-[#2a1a0f] to-[#1a120b] border-y border-[#E8B86D]/20 py-4 overflow-hidden relative z-50">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080605] to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080605] to-transparent z-10"></div>
        
        <div className="animate-ticker text-[13px] font-mono-code font-bold tracking-widest text-[#E8B86D] flex items-center gap-16">
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            IPC Sec. 420 → BNS Sec. 318
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            IPC Sec. 498A → BNS Sec. 85
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            NI Act Sec. 138 → Unchanged
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            BNSS replaces CrPC → July 1, 2024
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            IPC Sec. 302 → BNS Sec. 101
          </span>
          
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            IPC Sec. 420 → BNS Sec. 318
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            IPC Sec. 498A → BNS Sec. 85
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            NI Act Sec. 138 → Unchanged
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            BNSS replaces CrPC → July 1, 2024
          </span>
          <span className="flex items-center gap-3">
            <span className="text-[#E8B86D] text-xs">✦</span>
            IPC Sec. 302 → BNS Sec. 101
          </span>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🛸 2. FLOATING GLASS NAVBAR */}
      {/* ========================================== */}
      <nav className="fixed top-12 left-1/2 -translate-x-1/2 w-full max-w-6xl z-50 px-4 transition-all duration-300">
        <div className="glass-nav rounded-2xl px-6 py-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-[#E8B86D]/20">
          
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 group text-left bg-transparent border-0 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8B86D] to-[#C68A2C] text-[#0a0807] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(232,184,109,0.3)] group-hover:scale-105 transition-transform">⚖️</div>
            <span className="font-serif-legal text-xl font-bold text-white tracking-wide">NyayaSahayak</span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            <button type="button" onClick={() => scrollTo("casevault")} className="text-sm font-medium text-slate-300 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">CaseVault</button>
            <button type="button" onClick={() => scrollTo("contractguard")} className="text-sm font-medium text-slate-300 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">ContractGuard</button>
            <button type="button" onClick={() => scrollTo("ai-vakil")} className="text-sm font-medium text-slate-300 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">AI Vakil</button>
            <button type="button" onClick={() => scrollTo("docdraft")} className="text-sm font-medium text-slate-300 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">DocDraft</button>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate("/signin")} className="hidden sm:block text-sm font-bold text-slate-300 hover:text-white transition bg-transparent border-0 cursor-pointer">Sign In</button>
            <button type="button" onClick={() => navigate("/signup")} className="bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0a0807] font-bold px-5 py-2.5 rounded-xl text-sm shadow-[0_4px_15px_rgba(232,184,109,0.25)] hover:brightness-110 active:scale-95 transition flex items-center gap-2 border-0 cursor-pointer">
              Get Started <span>→</span>
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white bg-transparent border-0 cursor-pointer text-xl">
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu drop down */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 glass-nav rounded-2xl p-4 flex flex-col gap-3 border border-[#E8B86D]/20 shadow-2xl">
            <button type="button" onClick={() => scrollTo("casevault")} className="text-left py-2 text-slate-300 hover:text-[#E8B86D] bg-transparent border-0 cursor-pointer">CaseVault</button>
            <button type="button" onClick={() => scrollTo("contractguard")} className="text-left py-2 text-slate-300 hover:text-[#E8B86D] bg-transparent border-0 cursor-pointer">ContractGuard</button>
            <button type="button" onClick={() => scrollTo("ai-vakil")} className="text-left py-2 text-slate-300 hover:text-[#E8B86D] bg-transparent border-0 cursor-pointer">AI Vakil</button>
            <button type="button" onClick={() => scrollTo("docdraft")} className="text-left py-2 text-slate-300 hover:text-[#E8B86D] bg-transparent border-0 cursor-pointer">DocDraft</button>
            <hr className="border-white/5 my-1" />
            <button type="button" onClick={() => navigate("/signin")} className="text-left py-2 text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer">Sign In</button>
          </div>
        )}
      </nav>

      {/* ========================================== */}
      {/* 🦸‍♂️ 3. HERO CONTENT */}
      {/* ========================================== */}
      <main className="relative z-10 pt-48 pb-20 px-4 flex flex-col items-center justify-center min-h-[90vh] text-center">
        
        <div className="inline-flex items-center gap-2 bg-[#14100c]/80 border border-[#E8B86D]/20 px-4 py-1.5 rounded-full mb-8 shadow-sm backdrop-blur-md hover:border-[#E8B86D]/50 transition cursor-default">
          <span className="text-[10px] font-mono-code font-bold text-slate-400 tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8B86D] animate-pulse"></span>
            IPC <span className="text-slate-600">•</span> CrPC <span className="text-slate-600">•</span> IEA <span className="text-slate-500">→</span> <span className="text-[#E8B86D]">Now BNS, BNSS, BSA</span>
          </span>
        </div>

        <h1 className="font-serif-legal font-black text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.1] tracking-tight mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FBFBFA] to-slate-400 drop-shadow-lg">Apna Haq.</span><br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] drop-shadow-[0_0_30px_rgba(232,184,109,0.3)]">Apna Kanoon.</span>
        </h1>

        <p className="text-base md:text-lg text-slate-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
          India's legal system has changed. NyayaSahayak bridges every transition — cases, contracts, and drafts in plain language.
        </p>

        {/* Search / Prompt Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl relative mb-16 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#E8B86D]/20 via-transparent to-[#E8B86D]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <div className="relative glass-card rounded-2xl p-2 flex items-center gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.6)] focus-within:border-[#E8B86D]/60 transition-colors">
            <div className="pl-4 text-slate-400">🔍</div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Is IPC 302 same as BNS 101? or 'Draft a rent agreement'..." 
              className="w-full bg-transparent text-sm md:text-base text-white placeholder-slate-500 focus:outline-none px-2 py-3 font-medium border-0"
            />
            <button type="submit" className="bg-gradient-to-r from-[#E8B86D] to-[#C68A2C] text-[#0a0807] font-bold px-6 py-3 rounded-xl text-sm hover:brightness-110 active:scale-95 transition shrink-0 shadow-md border-0 cursor-pointer">
              Ask AI →
            </button>
          </div>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button type="button" onClick={() => scrollTo("contractguard")} className="flex items-center gap-2 bg-[#14100c]/60 border border-white/10 hover:border-[#E8B86D]/40 px-4 py-2 rounded-full text-[11px] font-mono-code text-slate-300 hover:text-white transition backdrop-blur-sm cursor-pointer">
              <span>🛡️</span> ContractGuard
            </button>
            <button type="button" onClick={() => scrollTo("casevault")} className="flex items-center gap-2 bg-[#14100c]/60 border border-white/10 hover:border-[#E8B86D]/40 px-4 py-2 rounded-full text-[11px] font-mono-code text-slate-300 hover:text-white transition backdrop-blur-sm cursor-pointer">
              <span>📂</span> CaseVault
            </button>
            <button type="button" onClick={() => scrollTo("ai-vakil")} className="flex items-center gap-2 bg-[#14100c]/60 border border-white/10 hover:border-[#E8B86D]/40 px-4 py-2 rounded-full text-[11px] font-mono-code text-slate-300 hover:text-white transition backdrop-blur-sm cursor-pointer">
              <span>💬</span> AI Vakil
            </button>
            <button type="button" onClick={() => scrollTo("docdraft")} className="flex items-center gap-2 bg-[#14100c]/60 border border-white/10 hover:border-[#E8B86D]/40 px-4 py-2 rounded-full text-[11px] font-mono-code text-slate-300 hover:text-white transition backdrop-blur-sm cursor-pointer">
              <span>📝</span> DocDraft
            </button>
          </div>
        </form>

        {/* 📊 4. GLASS KPI WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full px-4">
          
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl font-serif-legal font-bold text-[#FBFBFA] mb-1">3</div>
            <h4 className="text-sm font-bold text-[#E8B86D] mb-1">New Legal Codes</h4>
            <p className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">BNS • BNSS • BSA</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center border-[#E8B86D]/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#E8B86D]/5 to-transparent pointer-events-none"></div>
            <div className="text-3xl font-serif-legal font-bold text-[#E8B86D] mb-1 drop-shadow-[0_0_10px_rgba(232,184,109,0.4)]">511+</div>
            <h4 className="text-sm font-bold text-white mb-1">Sections Mapped</h4>
            <p className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">IPC → BNS Engine</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl font-serif-legal font-bold text-[#FBFBFA] mb-1">24/7</div>
            <h4 className="text-sm font-bold text-[#E8B86D] mb-1">AI Assistance</h4>
            <p className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">Hindi & English</p>
          </div>

        </div>

      </main>

      {/* ========================================== */}
      {/* 🎛️ PLATFORM MODULES GRID */}
      {/* ========================================== */}
      <section className="font-sans-ui relative min-h-screen py-24 px-4 overflow-hidden">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#E8B86D]/5 via-transparent to-blue-900/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-[#E8B86D]/80 mb-4 block">Platform Modules</span>
            <h2 className="font-serif-legal text-4xl md:text-5xl lg:text-6xl font-bold text-[#FBFBFA] mb-6 tracking-wide drop-shadow-md">
              Four Tools. One Platform.
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
              Built for India's legal transition — every feature understands both old colonial acts and new modern codes seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

            {/* 🛡️ CARD 1: ContractGuard */}
            <div onClick={() => handleFeatureClick("/contractguard")} className="glass-card rounded-3xl p-8 flex flex-col justify-between group h-full cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8B86D]/10 border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">🛡️</div>
                    <div>
                      <h3 className="font-serif-legal text-xl font-bold text-white group-hover:text-[#E8B86D] transition-colors">ContractGuard</h3>
                      <span className="text-[10px] font-mono-code text-slate-500 uppercase tracking-wider font-semibold">Legal Auditor</span>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-[#E8B86D] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">↗</span>
                </div>
                
                <p className="text-[13px] text-slate-300 font-medium leading-relaxed mb-8">
                  Upload any agreement — rent deed, NDA, service contract. AI risk-rates every clause against the Indian Contract Act, 1872.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-auto">
                <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono-code font-bold px-3 py-1.5 rounded-lg shadow-sm">Arbitration Clause</span>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono-code font-bold px-3 py-1.5 rounded-lg shadow-sm">Indemnity</span>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono-code font-bold px-3 py-1.5 rounded-lg shadow-sm">Payment Terms</span>
              </div>
            </div>

            {/* 📂 CARD 2: CaseVault */}
            <div onClick={() => handleFeatureClick("/casevault")} className="glass-card rounded-3xl p-8 flex flex-col justify-between group h-full cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8B86D]/10 border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">📂</div>
                    <div>
                      <h3 className="font-serif-legal text-xl font-bold text-white group-hover:text-[#E8B86D] transition-colors">CaseVault</h3>
                      <span className="text-[10px] font-mono-code text-slate-500 uppercase tracking-wider font-semibold">RAG Copilot</span>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-[#E8B86D] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">↗</span>
                </div>
                
                <p className="text-[13px] text-slate-300 font-medium leading-relaxed mb-8">
                  Upload hearing orders, OCR scans, evidence PDFs. Ask the AI anything about your case — searches across your entire archive.
                </p>
              </div>

              <div className="mt-auto bg-[#0a0807]/80 border border-white/10 group-hover:border-[#E8B86D]/30 rounded-xl p-4 transition-colors">
                <span className="text-[9px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold block mb-1.5">Copilot — CASE-2024-0041</span>
                <p className="text-xs text-slate-300 font-medium italic">
                  "Based on Aug 12 order, court directed submission of property title deed by Sep 3, 2024."
                </p>
              </div>
            </div>

            {/* 💬 CARD 3: AI Vakil */}
            <div onClick={() => handleFeatureClick("/ai-vakil")} className="glass-card rounded-3xl p-8 flex flex-col justify-between group h-full cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8B86D]/10 border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">💬</div>
                    <div>
                      <h3 className="font-serif-legal text-xl font-bold text-white group-hover:text-[#E8B86D] transition-colors">AI Vakil</h3>
                      <span className="text-[10px] font-mono-code text-slate-500 uppercase tracking-wider font-semibold">Bilingual Chatbot</span>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-[#E8B86D] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">↗</span>
                </div>
                
                <p className="text-[13px] text-slate-300 font-medium leading-relaxed mb-6">
                  Chat in English, Hindi, or Hinglish. Maps IPC to BNS, CrPC to BNSS instantly. Voice input and audio responses built in.
                </p>
              </div>

              <div className="mt-auto space-y-2">
                <p className="text-[11px] font-mono-code text-slate-400">IPC 420 ka BNS equivalent kya hai?</p>
                <div className="bg-[#1a1511]/80 border border-[#E8B86D]/20 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-[10px] text-slate-300 font-medium">Now mapped to</span>
                  <span className="bg-[#E8B86D]/15 text-[#E8B86D] border border-[#E8B86D]/30 text-[10px] font-mono-code font-bold px-2 py-0.5 rounded">BNS § 318</span>
                  <span className="text-[10px] text-slate-400 truncate">— cheating & dishonest inducement.</span>
                </div>
              </div>
            </div>

            {/* 📝 CARD 4: DocDraft */}
            <div onClick={() => handleFeatureClick("/docdraft")} className="glass-card rounded-3xl p-8 flex flex-col justify-between group h-full cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8B86D]/10 border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">📝</div>
                    <div>
                      <h3 className="font-serif-legal text-xl font-bold text-white group-hover:text-[#E8B86D] transition-colors">DocDraft</h3>
                      <span className="text-[10px] font-mono-code text-slate-500 uppercase tracking-wider font-semibold">AI Generator</span>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-[#E8B86D] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">↗</span>
                </div>
                
                <p className="text-[13px] text-slate-300 font-medium leading-relaxed mb-8">
                  Describe your situation in plain language. Get a court-ready legal notice, affidavit, or agreement — formatted for Indian courts.
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#E8B86D] text-[#0a0807] flex items-center justify-center font-mono-code text-[10px] font-bold shadow-[0_0_10px_rgba(232,184,109,0.5)]">1</div>
                  <span className="text-[9px] font-mono-code uppercase text-slate-400">Describe</span>
                </div>
                <div className="h-px bg-white/10 flex-1 mx-2"></div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#1a1511] border border-[#E8B86D]/40 text-[#E8B86D] flex items-center justify-center font-mono-code text-[10px] font-bold">2</div>
                  <span className="text-[9px] font-mono-code uppercase text-slate-500">Review</span>
                </div>
                <div className="h-px bg-white/10 flex-1 mx-2"></div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#1a1511] border border-white/10 text-slate-500 flex items-center justify-center font-mono-code text-[10px] font-bold">3</div>
                  <span className="text-[9px] font-mono-code uppercase text-slate-600">Download</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* 🗂️ DEEP DIVES */}
      {/* ========================================== */}
      <div className="font-sans-ui relative min-h-screen overflow-hidden">

        {/* 🗂️ DEEP DIVE 1: CASEVAULT */}
        <section id="casevault" className="py-24 px-4 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-600/5 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div>
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">Workspace</span>
              <h2 className="font-serif-legal text-4xl md:text-5xl font-bold text-[#FBFBFA] mb-6 tracking-wide leading-tight">
                Your Legal Workspace, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B86D] to-[#C68A2C]">Reimagined.</span>
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">
                Stop digging through scattered emails and WhatsApp chats. CaseVault organizes your hearings, OCR evidence files, and case timelines automatically.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border-l-2 border-[#E8B86D] pl-4">
                  <h4 className="text-2xl font-serif-legal font-bold text-white mb-1">12</h4>
                  <p className="text-[10px] font-mono-code uppercase text-slate-500">Active Cases</p>
                </div>
                <div className="border-l-2 border-amber-600 pl-4">
                  <h4 className="text-2xl font-serif-legal font-bold text-white mb-1">3</h4>
                  <p className="text-[10px] font-mono-code uppercase text-slate-500">Pending Hearings</p>
                </div>
              </div>

              <button type="button" onClick={() => handleFeatureClick("/casevault")} className="bg-transparent border border-[#E8B86D]/30 text-[#E8B86D] font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#E8B86D]/10 hover:border-[#E8B86D]/60 transition cursor-pointer">
                Explore CaseVault →
              </button>
            </div>

            <div className="glass-card rounded-3xl p-6 md:p-8 relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold">Case Timeline</span>
                <span className="bg-[#14100c] text-[#E8B86D] border border-[#E8B86D]/30 text-[9px] font-mono-code px-2 py-0.5 rounded-full">CASE-2024-0041</span>
              </div>
              
              <div className="space-y-6 relative">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-white/10 group-hover:bg-[#E8B86D]/20 transition-colors"></div>
                
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#14100c] border border-emerald-500/50 flex items-center justify-center z-10"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div></div>
                  <p className="text-[10px] font-mono-code text-slate-500 mb-1">12 Aug 2024</p>
                  <h4 className="text-sm font-bold text-white mb-1">Property Title Submission</h4>
                  <p className="text-xs text-slate-400 font-medium">Completed</p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#14100c] border border-[#E8B86D]/80 flex items-center justify-center z-10"><div className="w-1.5 h-1.5 bg-[#E8B86D] rounded-full animate-pulse shadow-[0_0_8px_rgba(232,184,109,0.8)]"></div></div>
                  <p className="text-[10px] font-mono-code text-[#E8B86D] mb-1">18 Sep 2024 (Upcoming)</p>
                  <h4 className="text-sm font-bold text-white mb-1">Next Hearing — Evidence Review</h4>
                </div>
                <div className="relative pl-8 opacity-50">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#14100c] border border-slate-600 flex items-center justify-center z-10"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div></div>
                  <p className="text-[10px] font-mono-code text-slate-500 mb-1">03 Oct 2024</p>
                  <h4 className="text-sm font-bold text-white mb-1">Cross-Examination Scheduled</h4>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 🛡️ DEEP DIVE 2: CONTRACTGUARD */}
        <section id="contractguard" className="py-24 px-4 relative bg-[#0c0a09]/50 border-y border-white/5">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-900/10 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto flex flex-col items-center mb-16 text-center">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">ContractGuard</span>
            <h2 className="font-serif-legal text-4xl md:text-5xl font-bold text-[#FBFBFA] tracking-wide leading-tight">
              Audit Any Contract <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B86D] to-[#C68A2C]">in Seconds.</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden h-full">
              <div className="animate-scanline"></div>

              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold block mb-6">Service Agreement — Draft V2.1</span>
              
              <div className="space-y-4 font-serif-legal text-xs md:text-sm text-slate-400 leading-relaxed text-justify relative z-10">
                <p>1. SCOPE OF SERVICES — The Service Provider agrees to deliver software development services as outlined in Schedule A.</p>
                <p className="bg-red-500/10 border border-red-500/20 p-2 rounded text-red-200 transition-colors duration-500">
                  All disputes shall be finally settled under the Rules of Arbitration by a sole arbitrator appointed exclusively by the Service Provider.
                </p>
                <p className="bg-amber-500/10 border border-amber-500/20 p-2 rounded text-amber-200 transition-colors duration-500">
                  The Client shall indemnify and hold harmless the Service Provider from any and all claims arising from the Client's use of the services.
                </p>
                <p>Payment shall be due within 30 days of invoice date. Late payments accrue interest at 1.5% per month.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#1a110e] border border-red-500/40 rounded-2xl p-5 shadow-lg group hover:border-red-500/60 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono-code uppercase text-red-400 font-bold">High Risk</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Unilateral Arbitration</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mb-3">
                  Service provider unilaterally appoints the arbitrator — violates natural justice under the Arbitration and Conciliation Act, 1996.
                </p>
                <button type="button" onClick={() => handleFeatureClick("/contractguard")} className="text-[10px] font-mono-code text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition bg-transparent cursor-pointer">Replace Clause →</button>
              </div>

              <div onClick={() => handleFeatureClick("/contractguard")} className="bg-[#14100c] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-amber-500/30 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <div>
                    <span className="text-[9px] font-mono-code uppercase text-amber-500/80 font-bold block mb-0.5">Medium Risk</span>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition">Broad Indemnity Clause</h4>
                  </div>
                </div>
                <span className="text-slate-500 group-hover:text-white transition">↓</span>
              </div>
            </div>

          </div>
        </section>

        {/* 💬 DEEP DIVE 3: AI VAKIL */}
        <section id="ai-vakil" className="py-24 px-4 relative">
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-[#E8B86D]/5 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-16">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">AI Vakil</span>
            <h2 className="font-serif-legal text-4xl md:text-5xl font-bold text-[#FBFBFA] tracking-wide leading-tight mb-4">
              Chat in English, Hindi,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B86D] to-[#C68A2C] italic">ya Hinglish.</span>
            </h2>
            <p className="text-slate-400 font-medium">Understands both colonial codes (IPC/CrPC/IEA) and modern replacements (BNS/BNSS/BSA).</p>
          </div>

          <div className="max-w-3xl mx-auto glass-card rounded-3xl p-6 relative overflow-hidden group border border-[#E8B86D]/20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E8B86D]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6 relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#14100c] border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center text-xs">⚖️</div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">AI Vakil</h4>
                <p className="text-[9px] font-mono-code text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online • BNS/BNSS/BSA Ready</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex justify-end group-hover:translate-x-[-4px] transition-transform duration-500 delay-75">
                <div className="bg-[#1a1511] border border-[#E8B86D]/20 rounded-2xl rounded-tr-sm p-3 text-[13px] text-slate-200 shadow-sm max-w-[80%]">
                  IPC Section 302 ka aaj kya status hai?
                </div>
              </div>
              <div className="flex justify-start group-hover:translate-x-[4px] transition-transform duration-500 delay-150">
                <div className="bg-[#14100c] border border-white/10 border-l-2 border-l-[#E8B86D] rounded-2xl rounded-tl-sm p-4 text-[13px] text-slate-300 shadow-md max-w-[85%]">
                  IPC § 302 (Murder) is now <span className="bg-white/10 px-1.5 py-0.5 rounded text-[#E8B86D] font-mono-code font-bold">BNS § 101</span> under the Bharatiya Nyaya Sanhita, 2023. Punishment — death or life imprisonment — remains unchanged. Effective July 1, 2024.
                </div>
              </div>
              <div onClick={() => handleFeatureClick("/ai-vakil")} className="mt-8 bg-[#0a0807] border border-white/10 rounded-xl p-2 flex items-center justify-between group-hover:border-[#E8B86D]/30 transition-colors duration-500 cursor-pointer">
                <div className="flex items-center gap-3 pl-2">
                  <span className="text-[#E8B86D] animate-pulse">🎙️</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-[#E8B86D] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-1 h-5 bg-[#E8B86D] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-1 h-2 bg-[#E8B86D] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                    <div className="w-1 h-4 bg-[#E8B86D] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
                <span className="text-[9px] font-mono-code text-red-400 px-3">0:06 • Recording</span>
              </div>
            </div>
          </div>
        </section>

        {/* 📝 DEEP DIVE 4: DOCDRAFT */}
        <section id="docdraft" className="py-24 px-4 relative bg-[#0c0a09]/50 border-t border-white/5">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-900/10 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 block">DocDraft</span>
              <h2 className="font-serif-legal text-4xl md:text-5xl font-bold text-[#FBFBFA] mb-6 tracking-wide leading-tight">
                Court-Ready Drafts,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B86D] to-[#C68A2C]">Generated in Seconds.</span>
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">
                Describe your situation in plain language. AI generates a complete legal notice, affidavit, or agreement — formatted for Indian courts, in plain language.
              </p>
              <button type="button" onClick={() => handleFeatureClick("/docdraft")} className="bg-[#E8B86D] text-[#0a0807] font-bold px-6 py-3 rounded-xl text-sm hover:brightness-110 transition cursor-pointer border-0">
                Draft a Document →
              </button>
            </div>

            <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold block mb-4">AI DRAFT GENERATOR</span>
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <span className="text-xs font-mono-code text-[#E8B86D] font-bold">LEGAL NOTICE DRAFT</span>
                <span className="text-[9px] font-mono-code text-slate-400">Step 3 of 3</span>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0a0807] p-4 text-[11px] leading-relaxed text-slate-300 font-serif-legal max-h-48 overflow-y-auto">
                <p className="mb-2 font-bold text-white">To,</p>
                <p className="mb-2">Mr. Ramesh Kumar,<br/>123, Civil Lines, Delhi — 110054</p>
                <p className="mb-4 font-bold text-white">Sub: Non-payment of security deposit amounting to ₹85,000...</p>
                <p className="text-slate-400">...Take notice that you are hereby called upon to refund the above amount within 15 days of receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings...</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================== */}
      {/* 🚀 FINAL CTA & FOOTER */}
      {/* ========================================== */}
      <section className="py-32 px-4 relative bg-gradient-to-t from-[#0c0a09] to-transparent border-t border-[#E8B86D]/10">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-t from-[#E8B86D]/15 to-transparent blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#14100c] border border-white/10 px-4 py-1.5 rounded-full mb-8 shadow-sm">
            <span className="text-[10px] font-mono-code font-bold text-slate-400 tracking-widest uppercase">
              Free to start • No Credit Card • BNS/BNSS Ready
            </span>
          </div>
          
          <h2 className="font-serif-legal text-5xl md:text-7xl font-bold text-[#FBFBFA] tracking-tight leading-tight mb-8">
            India's Legal System,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] italic">Now in Your Hands.</span>
          </h2>
          
          <p className="text-base text-slate-300 font-medium mb-12 max-w-xl mx-auto">
            From IPC to BNS. From paper files to AI intelligence. Join advocates, businesses, and citizens already on NyayaSahayak.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button type="button" onClick={() => navigate("/signup")} className="w-full sm:w-auto bg-gradient-to-r from-[#E8B86D] to-[#C68A2C] text-[#0a0807] font-bold px-8 py-4 rounded-xl text-sm shadow-[0_10px_30px_rgba(232,184,109,0.3)] hover:brightness-110 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 border-0 cursor-pointer">
              Start Free <span>→</span>
            </button>
            <button type="button" onClick={() => navigate("/signin")} className="w-full sm:w-auto bg-transparent border border-white/20 text-white font-bold px-8 py-4 rounded-xl text-sm hover:bg-white/5 hover:border-white/40 transition-all cursor-pointer">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* 🏛️ THE FOOTER */}
      <footer className="border-t border-white/10 bg-[#060504] relative z-10 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚖️</span>
              <h3 className="font-serif-legal text-xl font-bold text-[#FBFBFA] tracking-wide">NyayaSahayak</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mb-6">
              Bridging India's legal transition — IPC to BNS, CrPC to BNSS, IEA to BSA — with AI-powered intelligence for everyone.
            </p>
            <span className="text-[10px] font-mono-code text-[#E8B86D] bg-[#E8B86D]/10 px-2 py-1 rounded border border-[#E8B86D]/20">v1.0.0-Beta • BNS Ready</span>
          </div>

          <div>
            <h4 className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold mb-6">Platform</h4>
            <ul className="space-y-4 list-none p-0">
              <li><button type="button" onClick={() => scrollTo("casevault")} className="text-sm font-medium text-slate-400 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">CaseVault</button></li>
              <li><button type="button" onClick={() => scrollTo("contractguard")} className="text-sm font-medium text-slate-400 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">ContractGuard</button></li>
              <li><button type="button" onClick={() => scrollTo("ai-vakil")} className="text-sm font-medium text-slate-400 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">AI Vakil</button></li>
              <li><button type="button" onClick={() => scrollTo("docdraft")} className="text-sm font-medium text-slate-400 hover:text-[#E8B86D] transition bg-transparent border-0 cursor-pointer">DocDraft</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold mb-6">Account</h4>
            <ul className="space-y-4 list-none p-0">
              <li><button type="button" onClick={() => navigate("/signin")} className="text-sm font-medium text-slate-400 hover:text-white transition bg-transparent border-0 cursor-pointer">Sign In</button></li>
              <li><button type="button" onClick={() => navigate("/signup")} className="text-sm font-medium text-slate-400 hover:text-white transition bg-transparent border-0 cursor-pointer">Get Started</button></li>
            </ul>
            <p className="text-[9px] text-slate-600 mt-6 leading-relaxed">NyayaSahayak provides legal information, not legal advice.</p>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-mono-code text-slate-600">© 2026 NyayaSahayak. All rights reserved.</p>
          <p className="text-[10px] font-mono-code text-slate-600 tracking-widest uppercase">Haq. Kanoon. Insaaf.</p>
        </div>
      </footer>

    </div>
  );
}
