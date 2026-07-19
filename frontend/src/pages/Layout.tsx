import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  FolderOpen, Shield, MessageCircle, FileText,
  ChevronRight, X, Menu,
} from "lucide-react";
import { T } from "./tokens";
import { useAuthStore } from "../store/authStore";

// Navigation lists grouped by category
const GROUP_MAIN = [
  { label: "Workspace", path: "/workspace", icon: "▦" },
  { label: "CaseVault", path: "/casevault", icon: "📂" },
];

const GROUP_AI = [
  { label: "ContractGuard", path: "/contractguard", icon: "🛡️" },
  { label: "AI Vakil", path: "/ai-vakil", icon: "💬" },
  { label: "DocDraft", path: "/docdraft", icon: "📝" },
];

// Breadcrumbs builder
const getBreadcrumbs = (path: string) => {
  if (path === "/workspace") {
    return { parent: "Workspace", child: "Dashboard Overview" };
  } else if (path === "/casevault" || path.startsWith("/casevault/")) {
    return { parent: "Workspace", child: "CaseVault Repository" };
  } else if (path === "/contractguard") {
    return { parent: "AI Suite", child: "ContractGuard Audits" };
  } else if (path === "/ai-vakil") {
    return { parent: "AI Suite", child: "AI Vakil Legal Q&A" };
  } else if (path === "/docdraft") {
    return { parent: "AI Suite", child: "DocDraft Generator" };
  }
  return { parent: "Workspace", child: "Dashboard" };
};

// Sidebar Link Component (handles dynamic width, hover effect, active border/glow)
function SidebarLink({ label, path, icon, collapsed, onClick }: {
  label: string; path: string; icon: string; collapsed: boolean; onClick?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path || (path === "/casevault" && location.pathname.startsWith("/casevault/"));

  const handleClick = () => {
    navigate(path);
    if (onClick) onClick();
  };

  if (active) {
    return (
      <button
        onClick={handleClick}
        className={`w-full relative flex items-center py-2.5 rounded-xl bg-gradient-to-r from-[#E8B86D]/15 to-transparent border border-[#E8B86D]/20 text-[#E8B86D] font-bold text-sm transition overflow-hidden group cursor-pointer ${collapsed ? "px-2 justify-center" : "px-3 justify-between"
          }`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E8B86D] shadow-[0_0_10px_rgba(232,184,109,0.8)]"></div>
        <div className="flex items-center gap-3">
          <span className="text-base leading-none select-none">{icon}</span>
          {!collapsed && <span className="text-[13px] font-bold leading-relaxed">{label}</span>}
        </div>
        {!collapsed && (
          <span className="text-[10px] font-mono-code bg-[#E8B86D]/20 px-1.5 py-0.5 rounded border border-[#E8B86D]/30 leading-none animate-in fade-in duration-300">
            Active
          </span>
        )}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 bg-[#2C2927] border border-[#E8B86D]/20 text-[#E8B86D] font-bold">
            {label} (Active)
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all duration-200 group relative cursor-pointer border border-transparent hover:border-[#E8B86D]/10 ${collapsed ? "px-2 justify-center" : "px-3 gap-3"
        }`}
    >
      <span className="text-base leading-none select-none">{icon}</span>
      {!collapsed && <span className="text-[13px] font-medium leading-relaxed">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 bg-[#1C1611] border border-white/10 text-slate-200 font-medium">
          {label}
        </div>
      )}
    </button>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const userEmail = user?.email || "counselor@nyayasahayak.app";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="h-screen w-full bg-dot-grid text-[#E7E5E4] font-sans-ui flex overflow-hidden selection:bg-[#E8B86D] selection:text-[#0a0807] relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
        .font-serif-legal { font-family: 'Merriweather', serif; }
        .font-sans-ui { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono-code { font-family: 'JetBrains Mono', monospace; }

        /* Subtle Dot Grid */
        .bg-dot-grid {
          background-color: #0a0807; /* Deep Espresso Base */
          background-image: radial-gradient(rgba(232, 184, 109, 0.15) 1px, transparent 1px);
          background-size: 26px 26px;
        }

        /* Glassmorphism for Shell Elements */
        .glass-shell {
          background: rgba(16, 12, 10, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>

      {/* ✨ AMBIENT RADIAL GLOW WIDGETS */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E8B86D]/10 via-amber-900/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-64 w-[500px] h-[500px] bg-gradient-to-tr from-amber-600/5 via-blue-900/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* ⚖️ BACKGROUND SCALES OF JUSTICE WATERMARK */}
      <div className="absolute top-1/4 right-20 text-[#E8B86D] opacity-[0.02] select-none pointer-events-none font-serif-legal z-0 transform -rotate-12">
        <svg width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      </div>

      {/* 📑 LEFT SIDEBAR (REIMAGINED WITH HIERARCHY & GLASS) */}
      <aside
        className="hidden md:flex flex-col justify-between z-30 shadow-[4px_0_24px_rgba(0,0,0,0.4)] border-r border-[#E8B86D]/15 glass-shell transition-all duration-300 relative"
        style={{ width: collapsed ? "68px" : "240px" }}
      >
        {/* Brand Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl drop-shadow-[0_0_10px_rgba(232,184,109,0.6)] select-none">⚖️</span>
            {!collapsed && <h1 className="font-serif-legal text-lg font-bold text-[#FBFBFA] tracking-wide animate-in fade-in duration-300">NyayaSahayak</h1>}
          </div>
        </div>

        {/* Navigation Menu (Categorized) */}
        <div className={`flex-1 overflow-y-auto py-4 space-y-8 scrollbar-thin overflow-x-hidden ${collapsed ? "px-2" : "px-3"}`}>
          {/* Group 1: Main */}
          <div>
            {!collapsed && (
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold ml-3 mb-3 block animate-in fade-in duration-300">
                Main Menu
              </span>
            )}
            <nav className="space-y-1.5">
              {GROUP_MAIN.map(item => (
                <SidebarLink key={item.path} {...item} collapsed={collapsed} />
              ))}
            </nav>
          </div>

          {/* Group 2: AI Tools */}
          <div>
            {!collapsed && (
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold ml-3 mb-3 block animate-in fade-in duration-300">
                AI Legal Suite
              </span>
            )}
            <nav className="space-y-1.5">
              {GROUP_AI.map(item => (
                <SidebarLink key={item.path} {...item} collapsed={collapsed} />
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom User & System Status */}
        <div className={`border-t border-[#E8B86D]/10 bg-[#0c0a09]/40 space-y-3 ${collapsed ? "p-2" : "p-3"}`}>
          {/* AI Status Widget */}
          <div className={`bg-[#14100c]/80 border border-emerald-500/20 rounded-xl flex items-center transition-all duration-300 ${collapsed ? "p-1.5 justify-center" : "p-2.5 justify-between"}`}>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-2 h-2 ml-1">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              {!collapsed && <span className="text-[11px] font-mono-code text-emerald-400 font-bold tracking-wide animate-in fade-in duration-300">AI Systems Online</span>}
            </div>
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 bg-[#14100c] border border-emerald-500/30 text-emerald-400 font-bold">
                AI Systems Online
              </div>
            )}
          </div>

          {/* User Profile */}
          {collapsed ? (
            <button onClick={() => navigate("/workspace")} className="w-full flex items-center justify-center hover:bg-white/5 p-2 rounded-xl transition cursor-pointer relative group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8B86D] to-[#D4A853] text-[#0a0807] flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(232,184,109,0.3)] select-none">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 bg-[#1C1611] border border-white/10 text-white font-bold">
                {userName}
              </div>
            </button>
          ) : (
            <button onClick={() => navigate("/workspace")} className="w-full flex items-center justify-between hover:bg-white/5 p-2 rounded-xl transition cursor-pointer text-left">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8B86D] to-[#D4A853] text-[#0a0807] flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(232,184,109,0.3)] select-none shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{userName}</p>
                </div>
              </div>
              <span className="text-slate-500 text-xs">⋮</span>
            </button>
          )}

          {/* Sign Out Button */}
          {collapsed ? (
            <button onClick={handleSignOut} className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer relative group">
              <span className="text-base leading-none">🚪</span>
              <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 bg-red-950 border border-red-500/30 text-red-400 font-bold">
                Sign Out
              </div>
            </button>
          ) : (
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 font-semibold text-sm transition cursor-pointer">
              <span className="text-base leading-none">🚪</span> Sign Out
            </button>
          )}
        </div>

        {/* Collapse toggle arrow */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full border bg-[#0a0807] border-[#E8B86D]/30 flex items-center justify-center cursor-pointer z-50 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:border-[#E8B86D] hover:bg-[#E8B86D] hover:text-[#0a0807] text-[#E8B86D]"
        >
          <ChevronRight
            size={12}
            className="transition-transform duration-300"
            style={{ transform: collapsed ? "none" : "rotate(180deg)" }}
          />
        </button>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r md:hidden transition-transform duration-300 glass-shell border-[#E8B86D]/15 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E8B86D]/15">
          <div className="flex items-center gap-2">
            <span className="text-2xl drop-shadow-[0_0_10px_rgba(232,184,109,0.6)]">⚖️</span>
            <span className="font-serif-legal font-bold text-[15px] text-white">NyayaSahayak</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 cursor-pointer"><X size={18} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto space-y-4">
          <div>
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold ml-3 mb-2 block">
              Main Menu
            </span>
            <div className="space-y-1.5">
              {GROUP_MAIN.map(item => (
                <SidebarLink key={item.path} {...item} collapsed={false} onClick={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-500 font-bold ml-3 mb-2 block">
              AI Legal Suite
            </span>
            <div className="space-y-1.5">
              {GROUP_AI.map(item => (
                <SidebarLink key={item.path} {...item} collapsed={false} onClick={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-[#E8B86D]/15 bg-[#0c0a09]/40 space-y-3">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 font-semibold text-sm transition cursor-pointer">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main viewport area */}
      <main className="flex-1 flex flex-col h-screen relative z-20 min-w-0">
        {/* 🔝 TOP BAR (FIXED THE "EMPTY" LOOK) */}
        <header className="h-16 lg:h-20 glass-shell border-b border-[#E8B86D]/15 flex items-center justify-between px-4 md:px-6 lg:px-10 z-30 sticky top-0 relative">
          {/* Mobile hamburger menu toggle */}
          <button className="md:hidden text-slate-300 hover:text-white mr-3 shrink-0 cursor-pointer" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>

          {/* Left: Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono-code font-semibold shrink-0">
            <a href="/workspace" className="text-slate-400 hover:text-[#E8B86D] transition flex items-center gap-1.5">
              <span>🏠</span> {breadcrumbs.parent}
            </a>
            <span className="text-slate-600">/</span>
            <span className="text-[#E8B86D] bg-[#E8B86D]/10 px-2 py-1 rounded-md border border-[#E8B86D]/20 animate-in fade-in duration-300">
              {breadcrumbs.child}
            </span>
          </div>

          {/* Center: Engaging Sanskrit Legal Motto */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col items-center justify-center text-center z-10 pointer-events-none">
            <span className="font-serif-legal text-[#E8B86D] text-sm md:text-base font-bold tracking-wide uppercase italic">
              "धर्मो रक्षति रक्षितः"
            </span>
            <span className="text-[9px] font-mono-code text-slate-500 uppercase tracking-widest mt-1 font-semibold">
              Justice Protects Those Who Protect It
            </span>
          </div>

          {/* Right: Actions & Notifications */}
          <div className="flex items-center gap-2.5 md:gap-4 shrink-0 relative">
            <button className="w-9 h-9 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer">
              <span className="text-base select-none">🔔</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-9 h-9 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <span className="text-base select-none">⚙️</span>
              </button>

              {settingsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#1C1611] p-1.5 shadow-2xl z-50 animate-in fade-in-50 slide-in-from-top-3 duration-200">
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-400 bg-transparent border border-transparent hover:bg-red-500/10 transition-all text-left font-semibold cursor-pointer"
                    >
                      <span className="text-sm">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content canvas */}
        <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
