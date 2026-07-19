import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen, Shield, MessageCircle, FileText,
  ArrowRight, Gavel, Sparkles, Search, Calendar,
  ChevronRight, Scale, Plus,
} from "lucide-react";
import { T } from "./tokens";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";

// Background decorations
function GlowOrb({ x, y, color, size = 280 }: { x: string; y: string; color: string; size?: number }) {
  return <div className="pointer-events-none absolute" style={{ left: x, top: y, width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle,${color} 0%,transparent 70%)`, transform: "translate(-50%,-50%)", zIndex: 0 }} />;
}

function DotGrid() {
  return <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(232,184,109,0.055) 1px, transparent 1px)", backgroundSize: "30px 30px", zIndex: 0 }} />;
}

// CountUp utility
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let v = 0; const step = target / 38;
        const t = setInterval(() => { v += step; if (v >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(v)); }, 28);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// Smart search component
const SEARCH_ROUTES = [
  { label: "Open CaseVault", path: "/casevault", icon: <FolderOpen size={13} />, tag: "Cases" },
  { label: "Audit a contract", path: "/contractguard", icon: <Shield size={13} />, tag: "ContractGuard" },
  { label: "Ask AI Vakil", path: "/ai-vakil", icon: <MessageCircle size={13} />, tag: "Legal Q&A" },
  { label: "Draft a document", path: "/docdraft", icon: <FileText size={13} />, tag: "DocDraft" },
  { label: "State v. Ramesh Kumar", path: "/casevault", icon: <Scale size={13} />, tag: "CV-001" },
  { label: "IPC 302 kya hai?", path: "/ai-vakil", icon: <MessageCircle size={13} />, tag: "AI Vakil" },
  { label: "New case add", path: "/casevault", icon: <FolderOpen size={13} />, tag: "CaseVault" },
  { label: "Legal notice draft", path: "/docdraft", icon: <FileText size={13} />, tag: "DocDraft" },
];

function SmartSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const results = q.trim() ? SEARCH_ROUTES.filter(r => r.label.toLowerCase().includes(q.toLowerCase())) : SEARCH_ROUTES.slice(0, 5);

  return (
    <div className="relative w-full max-w-xl z-10">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
        style={{ background: T.bgCard, backdropFilter: "blur(20px)", borderColor: open ? "rgba(232,184,109,0.5)" : T.glassBorder, boxShadow: open ? "0 0 0 3px rgba(232,184,109,0.12)" : "none" }}>
        <Search size={15} style={{ color: open ? T.gold : T.textFaint, transition: "color 0.2s", flexShrink: 0 }} />
        <input value={q} onChange={e => setQ(e.target.value)}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search cases, ask a legal question, open a feature…"
          className="flex-1 bg-transparent text-[14px] font-semibold leading-relaxed outline-none"
          style={{ color: T.text, fontFamily: T.sans }} />
        <kbd className="text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0" style={{ color: T.textFaint, borderColor: T.glassBorder, fontFamily: T.mono }}>⌘K</kbd>
      </div>
      {open && (
        <div className="absolute top-full mt-2 w-full rounded-2xl border overflow-hidden shadow-2xl"
          style={{ background: T.bgCardLevel2, backdropFilter: "blur(30px)", borderColor: T.glassBorder, zIndex: 50 }}>
          {q === "" && <div className="px-4 py-2 border-b" style={{ borderColor: T.glassBorder }}><span style={{ color: T.textFaint, fontFamily: T.mono, fontSize: 9, fontWeight: 700 }}>QUICK ACCESS</span></div>}
          {results.map((r, i) => (
            <button key={i} onClick={() => { navigate(r.path); setQ(""); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer"
              style={{ borderBottom: i < results.length - 1 ? `1px solid ${T.glassBorder}` : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: T.goldFaint, borderColor: "rgba(232,184,109,0.15)", color: T.gold }}>{r.icon}</div>
              <span className="flex-1 text-[13px] font-semibold leading-relaxed" style={{ color: T.text, fontFamily: T.sans }}>{r.label}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: T.textFaint, fontFamily: T.mono }}>{r.tag}</span>
            </button>
          ))}
          {q && (
            <button onClick={() => { navigate("/ai-vakil"); setQ(""); }}
              className="w-full flex items-center gap-3 px-4 py-3 border-t transition-all cursor-pointer"
              style={{ borderColor: T.glassBorder, background: "rgba(232,184,109,0.04)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,184,109,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,184,109,0.04)")}>
              <Sparkles size={13} style={{ color: T.gold }} />
              <span className="text-[13px] font-bold leading-relaxed" style={{ color: T.gold, fontFamily: T.sans }}>Ask AI Vakil: "{q}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Main component
export default function Workspace() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  
  const [stats, setStats] = useState({
    activeCases: 0,
    totalCases: 0,
    contractsAudited: 0,
    docsGenerated: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [timelineNodes, setTimelineNodes] = useState<any[]>([]);

  const userEmail = user?.email || "counselor@nyayasahayak.app";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Check progress items for checklist
  const isCaseCreated = stats.totalCases > 0;
  const isVakilAsked = conversations.length > 0;
  const isContractAudited = stats.contractsAudited > 0;
  const isDocGenerated = stats.docsGenerated > 0;
  const isChecklistComplete = isCaseCreated && isVakilAsked && isContractAudited && isDocGenerated;
  const hasHistory = stats.totalCases > 0 || stats.contractsAudited > 0 || stats.docsGenerated > 0;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setIsSyncing(false);
      return;
    }

    const fetchDashboardStats = async () => {
      setIsSyncing(true);
      setSyncError(false);
      try {
        let hasError = false;
        const [cases, docs, convs] = await Promise.all([
          apiFetch("/cases").catch((err) => { console.error(err); hasError = true; return []; }),
          apiFetch("/documents").catch((err) => { console.error(err); hasError = true; return []; }),
          apiFetch("/chat/conversations").catch((err) => { console.error(err); hasError = true; return []; }),
        ]);

        if (hasError) {
          setSyncError(true);
        } else {
          setSyncError(false);
        }

        const totalCasesCount = Array.isArray(cases) ? cases.length : 0;
        const activeCasesCount = Array.isArray(cases) 
          ? cases.filter((c: any) => c.status === "Active" || c.status === "active").length 
          : 0;
        const auditedContractsCount = Array.isArray(docs)
          ? docs.filter((d: any) => d.doc_type === "contract" && d.analysis_status === "completed").length
          : 0;
        const generatedDocsCount = Array.isArray(docs)
          ? docs.filter((d: any) => d.doc_type !== "contract").length
          : 0;

        setStats({
          activeCases: activeCasesCount,
          totalCases: totalCasesCount,
          contractsAudited: auditedContractsCount,
          docsGenerated: generatedDocsCount,
        });
        setConversations(convs || []);

        // Time format helper
        const formatTimeAgo = (dateStr: string) => {
          try {
            const now = new Date();
            const past = new Date(dateStr);
            const diffMs = now.getTime() - past.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHrs / 24);

            if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
            if (diffHrs < 24) return `${diffHrs}h ago`;
            if (diffDays === 1) return "Yesterday";
            return `${diffDays}d ago`;
          } catch {
            return "Recent";
          }
        };

        // Combine to generate dynamic recent activity
        const caseActivities = Array.isArray(cases) ? cases.map((c: any) => ({
          icon: <FolderOpen size={12} />,
          label: c.case_title || "Unnamed Case",
          sub: `Case initialized`,
          time: c.created_at || new Date().toISOString(),
          color: "#60A5FA",
          path: "/casevault"
        })) : [];

        const contractActivities = Array.isArray(docs) ? docs.filter((d: any) => d.doc_type === "contract").map((d: any) => ({
          icon: <Shield size={12} />,
          label: d.filename || "Contract Guard",
          sub: "ContractGuard audit done",
          time: d.created_at || new Date().toISOString(),
          color: "#F87171",
          path: "/contractguard"
        })) : [];

        const docActivities = Array.isArray(docs) ? docs.filter((d: any) => d.doc_type !== "contract").map((d: any) => ({
          icon: <FileText size={12} />,
          label: d.filename || "Legal Notice",
          sub: "Downloaded PDF draft",
          time: d.created_at || new Date().toISOString(),
          color: "#A855F7",
          path: "/docdraft"
        })) : [];

        const chatActivities = Array.isArray(convs) ? convs.map((c: any) => ({
          icon: <MessageCircle size={12} />,
          label: c.title || "IPC vs BNS query",
          sub: "AI Vakil responded",
          time: c.updated_at || c.created_at || new Date().toISOString(),
          color: T.gold,
          path: "/ai-vakil"
        })) : [];

        const mergedAct = [
          ...caseActivities,
          ...contractActivities,
          ...docActivities,
          ...chatActivities
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        // Default mock items if there's no actual dynamic activity yet
        const mockRecent = [
          { icon: <FolderOpen size={12} />, label: "State v. Ramesh Kumar", sub: "Counter-affidavit filed", timeLabel: "2h ago", color: "#60A5FA", path: "/casevault" },
          { icon: <Shield size={12} />, label: "NDA — TechCorp India", sub: "ContractGuard audit done", timeLabel: "Yesterday", color: "#F87171", path: "/contractguard" },
          { icon: <MessageCircle size={12} />, label: "IPC 302 vs BNS query", sub: "AI Vakil responded", timeLabel: "Yesterday", color: T.gold, path: "/ai-vakil" },
          { icon: <FileText size={12} />, label: "Legal Notice — Sharma", sub: "Downloaded PDF", timeLabel: "2d ago", color: "#A855F7", path: "/docdraft" },
        ];

        const formattedActivities = mergedAct.slice(0, 4).map(a => ({
          ...a,
          timeLabel: formatTimeAgo(a.time)
        }));

        setRecentActivity(formattedActivities.length > 0 ? formattedActivities : mockRecent);

        // Combine to generate CaseVault Timeline
        const caseVaultTimeline: any[] = [];

        if (Array.isArray(cases)) {
          cases.forEach((c: any) => {
            caseVaultTimeline.push({
              timeLabel: formatTimeAgo(c.created_at),
              timeRaw: c.created_at,
              title: c.case_title || "New Case Added",
              sub: `Case folder initialized. Reference: CV-${(c.id || "").substring(0, 6).toUpperCase()}`,
              color: "#60A5FA"
            });
            
            // Add hearings timeline nodes to casevault timeline
            if (Array.isArray(c.hearings)) {
              c.hearings.forEach((h: any) => {
                caseVaultTimeline.push({
                  timeLabel: formatTimeAgo(h.created_at || h.hearing_date),
                  timeRaw: h.created_at || h.hearing_date,
                  title: `${c.case_title} — Hearing Update`,
                  sub: h.court_order_summary || "Hearing record updated.",
                  color: "#F87171"
                });
              });
            }
          });
        }

        if (Array.isArray(docs)) {
          docs.forEach((d: any) => {
            if (d.case_id && d.doc_type !== "contract") {
              caseVaultTimeline.push({
                timeLabel: formatTimeAgo(d.created_at),
                timeRaw: d.created_at,
                title: d.filename || "Evidence Uploaded",
                sub: `Uploaded ${d.filename} to case files.`,
                color: "#A855F7"
              });
            }
          });
        }

        const sortedCaseVault = caseVaultTimeline
          .sort((a, b) => new Date(b.timeRaw).getTime() - new Date(a.timeRaw).getTime())
          .slice(0, 3);

        setTimelineNodes(sortedCaseVault);

      } catch (err) {
        console.error("Failed to load workspace dashboard stats", err);
        setSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchDashboardStats();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-dot-grid text-[#E7E5E4] font-sans-ui p-4 md:p-8 relative overflow-hidden selection:bg-[#E8B86D] selection:text-[#0c0a09]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
        .font-serif-legal { font-family: 'Merriweather', serif; }
        .font-sans-ui { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono-code { font-family: 'JetBrains Mono', monospace; }

        /* ✨ 1. SUBTLE DOT-MATRIX GRID BACKGROUND */
        .bg-dot-grid {
          background-color: #0c0a09; /* Deepest Warm Espresso Base */
          background-image: radial-gradient(rgba(232, 184, 109, 0.15) 1px, transparent 1px);
          background-size: 26px 26px;
        }

        /* 🔮 2. GLASSMORPHISM CARD SURFACES */
        .glass-panel {
          background: rgba(20, 16, 13, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(232, 184, 109, 0.18);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
      `}</style>

      {/* ✨ AMBIENT GLOWS */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E8B86D]/10 via-amber-900/5 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-64 w-[500px] h-[500px] bg-gradient-to-tr from-amber-600/5 to-transparent rounded-full blur-[100px] pointer-events-none"></div>

      {/* Scales of justice visual */}
      <div className="absolute top-1/4 right-20 text-[#E8B86D] opacity-[0.03] select-none pointer-events-none z-0 transform -rotate-12">
        <svg width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER & SEARCH BAR */}
        <header className="border-b border-[#E8B86D]/15 pb-6">
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#E8B86D] block mb-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
          </span>
          <h1 className="font-serif-legal text-2xl md:text-3xl font-bold text-[#FBFBFA] tracking-wide mb-6 flex flex-wrap items-center gap-3">
            <span>{greeting}, {userName.split(" ")[0]}. ☕</span>
            {isSyncing && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#E8B86D]/15 border border-[#E8B86D]/35 text-xs font-mono-code font-bold text-[#E8B86D] animate-pulse shadow-[0_0_12px_rgba(232,184,109,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8B86D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8B86D]"></span>
                </span>
                Syncing Database (Waking Render)...
              </span>
            )}
            {syncError && !isSyncing && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-950/40 border border-red-500/35 text-xs font-mono-code font-bold text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                Offline (Server Connection Failed)
              </span>
            )}
          </h1>

          {/* Search bar below greeting */}
          <div className="mb-6">
            <SmartSearch />
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { icon: "+", label: "New Case", path: "/casevault", color: "#60A5FA", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.25)" },
              { icon: "🛡️", label: "Audit Contract", path: "/contractguard", color: "#F87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.25)" },
              { icon: "💬", label: "Ask AI Vakil", path: "/ai-vakil", color: "#E8B86D", bg: "rgba(232,184,109,0.06)", border: "rgba(232,184,109,0.25)" },
              { icon: "📝", label: "Draft Document", path: "/docdraft", color: "#A855F7", bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.25)" },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer border active:scale-[0.98] shadow-sm"
                style={{
                  color: a.color,
                  borderColor: a.border,
                  background: a.bg,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = a.color;
                  e.currentTarget.style.boxShadow = `0 0 12px ${a.color}35`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = a.border;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <span>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => navigate("/casevault")} className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition cursor-pointer">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 font-bold block mb-3 flex items-center gap-1.5"><span className="text-blue-400">📂</span> Active Cases</span>
            <div className="text-3xl font-bold text-white font-mono-code mb-1">
              <CountUp target={stats.activeCases} />
            </div>
            <span className="text-[11px] font-mono-code text-blue-400">
              {stats.activeCases === 0 ? "Setup CaseVault →" : `${stats.activeCases} case(s) open`}
            </span>
          </div>

          <div onClick={() => navigate("/casevault")} className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition cursor-pointer">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 font-bold block mb-3 flex items-center gap-1.5"><span className="text-amber-400">💼</span> Total Cases</span>
            <div className="text-3xl font-bold text-white font-mono-code mb-1">
              <CountUp target={stats.totalCases} />
            </div>
            <span className="text-[11px] font-mono-code text-amber-500">
              {stats.totalCases === 0 ? "No cases registered" : `${stats.totalCases} total case(s)`}
            </span>
          </div>

          <div onClick={() => navigate("/contractguard")} className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-[#F87171]/30 transition cursor-pointer">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 font-bold block mb-3 flex items-center gap-1.5"><span className="text-[#F87171]">🛡️</span> Contracts Audited</span>
            <div className="text-3xl font-bold text-white font-mono-code mb-1">
              <CountUp target={stats.contractsAudited} />
            </div>
            <span className="text-[11px] font-mono-code text-[#F87171]">
              {stats.contractsAudited === 0 ? "Run first audit →" : "Risk reports complete"}
            </span>
          </div>

          <div onClick={() => navigate("/docdraft")} className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition cursor-pointer">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"></div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 font-bold block mb-3 flex items-center gap-1.5"><span className="text-purple-400">📄</span> Docs Generated</span>
            <div className="text-3xl font-bold text-white font-mono-code mb-1">
              <CountUp target={stats.docsGenerated} />
            </div>
            <span className="text-[11px] font-mono-code text-purple-400">
              {stats.docsGenerated === 0 ? "Browse Templates →" : "Custom drafts saved"}
            </span>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2/3 COLUMN: RECENT ACTIVITY / READY STATUS */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {hasHistory ? (
              /* RECENT ACTIVITY LIST */
              <div className="glass-panel p-6 rounded-3xl flex flex-col shadow-xl">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#E8B86D]/15">
                  <span className="text-xs font-mono-code uppercase tracking-wider text-[#E8B86D] font-bold">Recent Activity</span>
                  <span onClick={() => navigate("/casevault")} className="text-[11px] font-mono-code text-[#E8B86D] cursor-pointer hover:text-white transition">View all →</span>
                </div>
                
                <div className="space-y-3">
                  {recentActivity.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(r.path)}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[#14100c]/80 border border-white/5 hover:border-[#E8B86D]/30 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: `${r.color}15`, borderColor: `${r.color}30`, color: r.color }}>
                          {r.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#E8B86D] transition">{r.label}</h4>
                          <p className="text-[11px] text-slate-400 font-mono-code mt-0.5">{r.sub}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono-code text-slate-500">{r.timeLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* NEW USER WELCOME CARD */
              <div className="glass-panel rounded-3xl p-8 flex flex-col justify-between items-start space-y-6 relative overflow-hidden shadow-xl"
                style={{ background: "linear-gradient(135deg, rgba(24, 20, 17, 0.85) 0%, rgba(35, 28, 24, 0.85) 100%)" }}>
                
                <div className="w-14 h-14 rounded-2xl bg-[#1d1611] border border-[#E8B86D]/20 flex items-center justify-center text-2xl text-[#E8B86D] shadow-inner">
                  ⚖️
                </div>
                
                <div className="space-y-2">
                  <h2 className="font-serif-legal text-2xl font-bold text-[#FBFBFA]">Your Legal Workspace is Ready</h2>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-lg">
                    You haven't run any contract audits or registered any cases yet. Start by exploring our AI tools designed to simplify Indian law.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowTour(true)}
                  className="bg-[#1e1712] hover:bg-[#2d2119] text-[#E8B86D] border border-[#E8B86D]/40 font-bold px-6 py-3 rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-lg"
                >
                  Take a Quick Tour
                </button>
              </div>
            )}

          </div>

          {/* RIGHT 1/3 COLUMN: GETTING STARTED & CASEVAULT TIMELINE */}
          <div className="flex flex-col gap-6">
            
            {/* Getting Started Checklist */}
            {stats.totalCases === 0 && (
              <div className="glass-panel p-6 rounded-3xl flex flex-col space-y-5 shadow-xl">
                <div>
                  <span className="text-xs font-mono-code uppercase tracking-wider text-[#E8B86D] font-bold block pb-3 border-b border-[#E8B86D]/15">GETTING STARTED</span>
                </div>

                <div className="space-y-4">
                  {/* Item 0: Register Case */}
                  <div
                    onClick={() => navigate("/casevault")}
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition duration-300 ${
                      isCaseCreated ? "bg-[#163323] border-[#4ADE80] text-[#4ADE80]" : "border-[#E8B86D]/30"
                    }`}>
                      {isCaseCreated && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold text-white transition ${isCaseCreated ? "line-through text-slate-500 font-medium" : "group-hover:text-[#E8B86D]"}`}>Register your first Case</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Use CaseVault to open a legal folder.</p>
                    </div>
                  </div>

                  {/* Item 1 */}
                  <div
                    onClick={() => navigate("/ai-vakil")}
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition duration-300 ${
                      isVakilAsked ? "bg-[#163323] border-[#4ADE80] text-[#4ADE80]" : "border-[#E8B86D]/30"
                    }`}>
                      {isVakilAsked && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold text-white transition ${isVakilAsked ? "line-through text-slate-500 font-medium" : "group-hover:text-[#E8B86D]"}`}>Ask AI Vakil a question</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Try asking "What is BNS 2023?"</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div
                    onClick={() => navigate("/contractguard")}
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition duration-300 ${
                      isContractAudited ? "bg-[#163323] border-[#4ADE80] text-[#4ADE80]" : "border-[#E8B86D]/30"
                    }`}>
                      {isContractAudited && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold text-white transition ${isContractAudited ? "line-through text-slate-500 font-medium" : "group-hover:text-[#E8B86D]"}`}>Upload a Rent Agreement</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Let ContractGuard find the risks.</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div
                    onClick={() => navigate("/docdraft")}
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition duration-300 ${
                      isDocGenerated ? "bg-[#163323] border-[#4ADE80] text-[#4ADE80]" : "border-[#E8B86D]/30"
                    }`}>
                      {isDocGenerated && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold text-white transition ${isDocGenerated ? "line-through text-slate-500 font-medium" : "group-hover:text-[#E8B86D]"}`}>Generate a Legal Notice</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Use DocDraft to compile a formal notice.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CaseVault Timeline */}
            {stats.totalCases > 0 && timelineNodes.length > 0 && (
              <div className="glass-panel p-6 rounded-3xl flex flex-col shadow-xl">
                <span className="text-xs font-mono-code uppercase tracking-wider text-[#E8B86D] font-bold block mb-5 pb-3 border-b border-[#E8B86D]/15">CaseVault Timeline</span>
                
                <div className="space-y-6 relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-2.5 top-2 bottom-4 w-px bg-white/10"></div>
                  
                  {timelineNodes.map((node, i) => (
                    <div key={i} onClick={() => navigate("/casevault")} className="relative pl-8 group cursor-pointer">
                      {/* Glowing node */}
                      <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-[#14100c] border flex items-center justify-center group-hover:bg-[#E8B86D]/10 transition"
                        style={{ borderColor: node.color, boxShadow: `0 0 8px ${node.color}50` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: node.color }} />
                      </div>
                      <p className="text-[10px] font-mono-code mb-1" style={{ color: node.color }}>{node.timeLabel}</p>
                      <h4 className="text-sm font-bold text-white leading-none mb-1.5 group-hover:text-[#E8B86D] transition">{node.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                        {node.sub}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-[#E8B86D]/15">
                  <button onClick={() => navigate("/casevault")} className="w-full bg-[#14100c] hover:bg-white/5 text-[#E8B86D] border border-[#E8B86D]/30 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                    <span>📂</span> Go to CaseVault
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
      {/* 🔮 TOUR MODAL */}
      {showTour && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-8 md:p-10 relative space-y-8 text-center border border-[#E8B86D]/20 shadow-2xl">
            <button
              onClick={() => setShowTour(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition text-lg cursor-pointer bg-transparent border-0"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-2xl bg-[#E8B86D]/10 text-2xl text-[#E8B86D] flex items-center justify-center mx-auto border border-[#E8B86D]/20 shadow-inner">
              ⚖️
            </div>
            <div className="space-y-2">
              <h3 className="font-serif-legal text-2xl font-bold text-white">Workspace Quick Tour</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                Welcome to NyayaSahayak. Here's a brief layout breakdown to get you started:
              </p>
            </div>
            <div className="space-y-4 text-left max-w-md mx-auto bg-black/20 p-5 rounded-2xl border border-white/5">
              <div className="flex gap-3 items-start">
                <span className="text-sm font-mono-code font-bold text-[#E8B86D] mt-0.5 shrink-0">1.</span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  <strong>Smart Search:</strong> Click the global bar at the top to query cases, BNS laws, or initiate chats with AI Vakil.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-sm font-mono-code font-bold text-[#F87171] mt-0.5 shrink-0">2.</span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  <strong>ContractGuard:</strong> Upload agreements to extract risk indices, read details, and locate relevant Indian statutes.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-sm font-mono-code font-bold text-[#60A5FA] mt-0.5 shrink-0">3.</span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  <strong>CaseVault & Checklist:</strong> Setup folders, manage hearings, and complete the checklist items to build your workspace history timeline.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTour(false)}
              className="w-full bg-[#E8B86D] hover:bg-[#D4A853] text-[#0c0a09] py-3.5 rounded-xl text-sm font-bold transition cursor-pointer shadow-[0_4px_20px_rgba(232,184,109,0.2)] hover:scale-[1.01]"
            >
              Got it, let's explore!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
