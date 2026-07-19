import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FolderOpen, Plus, Search, Upload,
  ChevronRight, FileText, Send, X, Gavel,
  ArrowLeft, Calendar, Paperclip, Scale,
  MessageCircle, Bot, Sparkles,
} from "lucide-react";
import { T } from "./tokens";
import { apiFetch } from "../lib/api";

const getDisplayId = (id: string) => {
  if (!id) return "CV-000";
  if (id.startsWith("CV-")) return id;
  return `CV-${id.substring(0, 8).toUpperCase()}`;
};

/* ─── types ─── */
type Status = "Active" | "Closed";
interface TimelineItem { id: string; type: "hearing" | "document" | "evidence" | "note"; date: string; rawDate: string; title: string; desc: string; fullDesc?: string; }
interface CaseDoc { id: string; name: string; size: string; type: string; date: string; status?: string; }
interface Case {
  id: string; title: string; client: string; court: string;
  status: Status; strength: number; nextHearing: string;
  summary: string; tags: string[];
  timeline: TimelineItem[]; docs: CaseDoc[];
}

const mapStatus = (status: string): Status => {
  if (status && status.toLowerCase() === "closed") return "Closed";
  if (status && (status.toLowerCase() === "disposed" || status.toLowerCase() === "settled" || status.toLowerCase() === "archived")) return "Closed";
  return "Active";
};

const transformCase = (c: any): Case => {
  return {
    id: c.id,
    title: c.case_title,
    client: c.petitioner && c.respondent ? `${c.petitioner} v. ${c.respondent}` : (c.petitioner || "Unknown Client"),
    court: c.court_name || "TBD",
    status: mapStatus(c.current_status),
    strength: c.case_strength_score ? Math.round(parseFloat(c.case_strength_score) * 100) : 0,
    nextHearing: c.next_hearing_date ? new Date(c.next_hearing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—",
    summary: c.ai_context_summary || c.notes || "No context summary generated yet.",
    tags: [c.case_type || "Civil"],
    timeline: (c.timeline || []).sort((a: any, b: any) => new Date(b.rawDate || b.date).getTime() - new Date(a.rawDate || a.date).getTime()),
    docs: (c.documents || []).map((d: any) => ({
      id: d.id,
      name: d.filename || d.file_name || "Document",
      size: d.file_size_bytes ? `${(d.file_size_bytes / 1024).toFixed(0)} KB` : (d.file_size || "0 KB"),
      type: (d.mime_type || "file").split('/').pop() || "file",
      date: d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Today",
      status: d.analysis_status || d.status || "completed"
    })),
  };
};

/* ─── data ─── */
const CASES: Case[] = [
  {
    id: "CV-001", title: "State v. Ramesh Kumar", client: "Ramesh Kumar", court: "Delhi High Court",
    status: "Active", strength: 78, nextHearing: "28 Jul 2026",
    summary: "Criminal appeal challenging conviction under BNS § 318 (cheating). Primary argument — lack of dishonest intent at time of transaction. AI analysis: strong appellate grounds; prosecution witness credibility questionable.",
    tags: ["BNS § 318", "Criminal Appeal", "Delhi HC"],
    timeline: [
      { id: "t1", type: "hearing", date: "15 Jul 2026", rawDate: "2026-07-15", title: "Pre-trial conference", desc: "Arguments on admissibility of digital evidence. Next date fixed for 28 Jul." },
      { id: "t2", type: "document", date: "10 Jul 2026", rawDate: "2026-07-10", title: "Counter-affidavit filed", desc: "Response to prosecution's supplementary chargesheet submitted to registrar." },
      { id: "t3", type: "evidence", date: "05 Jul 2026", rawDate: "2026-07-05", title: "Bank statements uploaded", desc: "3 years of transaction records — AI summary generated. No fraudulent pattern detected." },
      { id: "t4", type: "note", date: "01 Jul 2026", rawDate: "2026-07-01", title: "Case opened", desc: "Case registered by Advocate Priya Sharma. Client briefing completed." },
    ],
    docs: [
      { id: "d1", name: "Chargesheet.pdf", size: "2.4 MB", type: "pdf", date: "01 Jul" },
      { id: "d2", name: "Bank_Statements_2023-26.pdf", size: "5.1 MB", type: "pdf", date: "05 Jul" },
      { id: "d3", name: "Counter_Affidavit.docx", size: "180 KB", type: "docx", date: "10 Jul" },
    ],
  },
  {
    id: "CV-002", title: "Meera Nair v. TechCorp India", client: "Meera Nair", court: "NCLAT Mumbai",
    status: "Active", strength: 62, nextHearing: "03 Aug 2026",
    summary: "Wrongful termination dispute. Employee alleges termination without cause or notice pay violates Employment Agreement and Industrial Disputes Act.",
    tags: ["Employment", "ID Act", "NCLAT"],
    timeline: [
      { id: "t1", type: "hearing", date: "10 Jul 2026", rawDate: "2026-07-10", title: "First hearing", desc: "Respondent sought 30-day adjournment. Granted. Next date: 03 Aug." },
      { id: "t2", type: "document", date: "01 Jul 2026", rawDate: "2026-07-01", title: "Employment Agreement uploaded", desc: "AI analysis flagged ambiguous 'misconduct' definition in Clause 12.3." },
    ],
    docs: [
      { id: "d1", name: "Employment_Agreement.pdf", size: "440 KB", type: "pdf", date: "01 Jul" },
      { id: "d2", name: "Termination_Letter.pdf", size: "120 KB", type: "pdf", date: "01 Jul" },
    ],
  },
  {
    id: "CV-003", title: "Kapoor Estate Dispute", client: "Suresh Kapoor", court: "Civil Court Jaipur",
    status: "Active", strength: 45, nextHearing: "TBD",
    summary: "Partition suit for ancestral property. Title chain disputed — gap in 1987 mutation records. AI: weak documentation; recommend engaging local patwari records.",
    tags: ["Property", "Partition", "Civil"],
    timeline: [
      { id: "t1", type: "note", date: "20 Jun 2026", rawDate: "2026-06-20", title: "Preliminary review done", desc: "1987 mutation record missing. Follow-up with revenue records office pending." },
    ],
    docs: [{ id: "d1", name: "Property_Title_Docs.zip", size: "8.2 MB", type: "zip", date: "20 Jun" }],
  },
  {
    id: "CV-004", title: "Sharma v. HDFC Bank", client: "Anjali Sharma", court: "Consumer Forum Delhi",
    status: "Closed", strength: 95, nextHearing: "—",
    summary: "Consumer complaint for wrongful CIBIL score downgrade. Bank admitted error. Order: restore CIBIL + ₹50,000 compensation.",
    tags: ["Consumer", "Banking", "Closed"],
    timeline: [
      { id: "t1", type: "hearing", date: "15 Jun 2026", rawDate: "2026-06-15", title: "Final order passed", desc: "Forum ordered HDFC to restore CIBIL score and pay ₹50,000 compensation within 45 days." },
    ],
    docs: [
      { id: "d1", name: "Forum_Order.pdf", size: "320 KB", type: "pdf", date: "15 Jun" },
    ],
  },
];

const STATUS_STYLE: Record<Status, { bg: string; border: string; text: string; dot: string }> = {
  Active:  { bg: "rgba(30,41,59,0.90)",   border: "rgba(96,165,250,0.30)",   text: "#60A5FA", dot: "#60A5FA" },
  Closed:  { bg: "rgba(22,51,35,0.90)",   border: "rgba(74,222,128,0.30)",   text: "#4ADE80", dot: "#4ADE80" },
};

const TL_COLOR: Record<TimelineItem["type"], string> = {
  hearing: "#3B82F6", document: T.gold, evidence: "#A78BFA", note: "#6B7280",
};
const TL_ICON: Record<TimelineItem["type"], React.ReactNode> = {
  hearing: <Gavel size={11} />, document: <FileText size={11} />,
  evidence: <Paperclip size={11} />, note: <Scale size={11} />,
};

/* ─── Copilot Drawer ─── */
function parseMessageText(text: string, navigate: (path: string) => void) {
  const lines = text.split("\n");
  let inDisclaimer = false;
  const disclaimerLines: string[] = [];
  const mainContentElements: React.ReactNode[] = [];

  const parseInlineMarkdown = (lineStr: string, keyIdx: number) => {
    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;
    let pKey = 0;
    
    while ((match = regex.exec(lineStr)) !== null) {
      const matchStr = match[0];
      const matchStart = match.index;
      
      if (matchStart > currentIdx) {
        parts.push(lineStr.substring(currentIdx, matchStart));
      }
      
      if (matchStr.startsWith("**") && matchStr.endsWith("**")) {
        parts.push(
          <strong key={`${keyIdx}-b-${pKey++}`} className="font-bold text-white">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith("`") && matchStr.endsWith("`")) {
        parts.push(
          <span key={`${keyIdx}-c-${pKey++}`} className="font-mono-code text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8B86D]">
            {matchStr.slice(1, -1)}
          </span>
        );
      }
      
      currentIdx = regex.lastIndex;
    }
    
    if (currentIdx < lineStr.length) {
      parts.push(lineStr.substring(currentIdx));
    }
    
    return parts.length > 0 ? parts : lineStr;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === "") return;

    // Detect Disclaimer Section
    if (trimmed.startsWith("### 🛡️") || trimmed.toLowerCase().includes("disclaimer")) {
      inDisclaimer = true;
      return;
    }

    if (inDisclaimer) {
      disclaimerLines.push(trimmed);
      return;
    }

    // Detect Headings
    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace("### ", "").trim();
      mainContentElements.push(
        <h3 key={idx} className="font-serif-legal text-[#E8B86D] text-[14px] font-bold mt-5 mb-2 first:mt-0 flex items-center gap-2">
          {parseInlineMarkdown(headingText, idx)}
        </h3>
      );
      return;
    }

    // Detect Action Links
    if (trimmed.startsWith("- [") && trimmed.includes("](")) {
      const labelMatch = trimmed.match(/\[(.*?)\]/);
      const urlMatch = trimmed.match(/\((.*?)\)/);
      if (labelMatch && urlMatch) {
        const label = labelMatch[1];
        const url = urlMatch[1];
        mainContentElements.push(
          <button
            key={idx}
            onClick={() => navigate(url)}
            className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E8B86D]/20 hover:border-[#E8B86D]/40 text-[#E8B86D] hover:bg-[#E8B86D]/5 text-xs font-bold transition cursor-pointer"
          >
            {label}
          </button>
        );
        return;
      }
    }

    // Detect Standard List Items
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const itemText = trimmed.substring(1).trim();
      mainContentElements.push(
        <li key={idx} className="list-disc pl-1 ml-5 text-slate-300 mt-1 space-y-1">
          {parseInlineMarkdown(itemText, idx)}
        </li>
      );
      return;
    }

    // Detect Section Header / Numbered items (e.g. 1. Title or • Title)
    if (/^\d+\./.test(trimmed) || trimmed.startsWith("•")) {
      mainContentElements.push(
        <div key={idx} className="mt-3.5 mb-1 text-left">
          <h4 className="text-white font-bold text-[13px] flex items-center gap-1.5">
            <span className="text-[#E8B86D]">•</span> {parseInlineMarkdown(trimmed, idx)}
          </h4>
        </div>
      );
      return;
    }

    // Detect Recommendation Box
    if (trimmed.startsWith("💡")) {
      mainContentElements.push(
        <div key={idx} className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs text-left">
          {parseInlineMarkdown(trimmed, idx)}
        </div>
      );
      return;
    }

    // Default Paragraph
    mainContentElements.push(
      <p key={idx} className="text-slate-300 text-[13px] leading-relaxed mb-2.5 last:mb-0 text-left">
        {parseInlineMarkdown(trimmed, idx)}
      </p>
    );
  });

  return (
    <div className="space-y-2">
      {mainContentElements}
      {disclaimerLines.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-stone-900/80 border border-white/5 text-slate-400 text-[11px] italic text-left">
          <strong className="text-slate-300 font-bold block mb-1">🛡️ Disclaimer:</strong>
          {disclaimerLines.map((dl, idx) => (
            <p key={idx}>{parseInlineMarkdown(dl, idx)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function CopilotDrawer({ caseData, onClose }: { caseData: Case; onClose: () => void }) {
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>(() => {
    const isNew = caseData.docs.length === 0;
    const text = isNew 
      ? `NyayaSahayak Case Copilot initialized for case: **${caseData.title}** (${getDisplayId(caseData.id)}).\n\nNo case files or evidence have been uploaded to the vault yet. You can upload relevant pleadings, contracts, or evidence documents, or ask me general questions about the laws applicable to this matter.`
      : `NyayaSahayak Case Copilot active for case: **${caseData.title}** (${getDisplayId(caseData.id)}).\n\nI have reviewed ${caseData.docs.length} document(s) and ${caseData.timeline.length} case event(s). Ask me specific questions or request a document summary.`;
    return [{ role: "ai", text }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < window.innerWidth * 0.6) {
        setWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs(m => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const response = await apiFetch(`/cases/${caseData.id}/copilot`, {
        method: "POST",
        body: JSON.stringify({ query: text }),
      });
      setMsgs(m => [...m, { role: "ai", text: response.reply || "No response received from AI." }]);
    } catch (err: any) {
      setMsgs(m => [...m, { role: "ai", text: `Error: ${err.message || "Failed to contact AI Copilot."}` }]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = ["Justify the Favourability Score", "Assess overall case strength", "What key documents are missing?", `Key argument for ${caseData.tags[0] || "Civil claims"}`];

  return createPortal(
    <>
      <style>{`
        .copilot-drawer {
          background: rgba(10, 8, 7, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-left: 1px solid rgba(232, 184, 109, 0.2);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
        }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(232, 184, 109, 0.2); border-radius: 4px; }
      `}</style>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full z-40 flex flex-col copilot-drawer animate-fade-in-right"
        style={{ width }}>
        {/* Resize drag handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-[#E8B86D]/20 transition-all duration-200 z-50 flex items-center justify-center group"
          onMouseDown={e => { e.preventDefault(); setIsResizing(true); }}
        >
          {/* Visual drag indicator bar */}
          <div className="w-[1.5px] h-12 bg-white/10 group-hover:bg-[#E8B86D]/60 rounded transition-colors" />
        </div>
        
        {/* 1. DRAWER HEADER */}
        <header className="p-5 border-b border-[#E8B86D]/15 flex flex-col gap-3 relative shrink-0 text-left">
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer border-0 bg-transparent text-sm">✖</button>
          
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8B86D]/10 border border-[#E8B86D]/30 flex items-center justify-center text-[#E8B86D] shadow-inner text-lg">🤖</div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">Case Copilot</h2>
              <p className="text-[11px] font-mono-code text-slate-400 mt-0.5">
                <span className="text-[#E8B86D]">{getDisplayId(caseData.id)}</span> • {caseData.title}
              </p>
            </div>
          </div>
          
          {/* Status Metrics Bar */}
          <div className="flex items-center gap-4 text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-400 bg-[#14100c] p-2 rounded-lg border border-white/5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Strength: <span className="text-emerald-400">{caseData.strength}%</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>{caseData.docs ? caseData.docs.length : 0} Docs</span>
            <span className="text-slate-600">•</span>
            <span>{caseData.timeline ? caseData.timeline.length : 0} Events</span>
          </div>
        </header>

        {/* 2. CHAT HISTORY AREA (Highly Formatted AI Responses) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 chat-scroll">
          {msgs.map((m, i) => {
            const isAI = m.role === "ai";
            if (isAI) {
              return (
                <div key={i} className="flex items-start gap-3 text-left">
                  <div className="w-7 h-7 rounded-lg bg-[#E8B86D]/10 border border-[#E8B86D]/30 flex items-center justify-center text-[10px] flex-shrink-0 text-[#E8B86D]">🤖</div>
                  <div className="bg-[#14100c] border-l-2 border-l-[#E8B86D] border-y border-r border-white/5 rounded-2xl rounded-tl-sm p-4 text-[13px] text-slate-300 font-medium leading-relaxed w-[95%] shadow-md">
                    {parseMessageText(m.text, navigate)}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex items-start gap-3 flex-row-reverse text-right">
                <div className="w-7 h-7 rounded-lg bg-[#1a1511] border border-[#E8B86D]/20 flex items-center justify-center text-[10px] flex-shrink-0 text-[#E8B86D] font-bold">P</div>
                <div className="bg-[#1a1511] border border-[#E8B86D]/20 rounded-2xl rounded-tr-sm p-3.5 text-[13px] text-[#E7E5E4] font-medium leading-relaxed max-w-[85%] shadow-sm text-left">
                  {m.text}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex gap-2 text-left">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(232,184,109,0.1)", border: "1px solid rgba(232,184,109,0.2)" }}>
                <Bot size={11} style={{ color: T.gold }} />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm border flex gap-1.5 items-center bg-[#14100c]" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: T.textDim, animation: `pulse2 1.2s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          {/* Suggested Chips */}
          {msgs.length === 1 && !loading && (
            <div className="pl-10 space-y-2 text-left">
              <span className="text-[10px] font-mono-code uppercase text-slate-500 font-bold block mb-1">Suggested Questions</span>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="block w-fit text-left bg-[#14100c] border border-white/10 hover:border-[#E8B86D]/40 text-slate-300 text-xs px-3 py-2 rounded-xl transition cursor-pointer">
                  ✨ {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 3. INPUT AREA */}
        <div className="p-5 border-t border-[#E8B86D]/15 bg-[#0a0807] shrink-0">
          <div className="relative flex items-end gap-2 bg-[#14100c] border border-white/10 focus-within:border-[#E8B86D]/40 rounded-2xl p-2 transition shadow-inner">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(input); } }}
              placeholder="Ask about this case or request a summary..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none px-2 py-2 max-h-32 chat-scroll text-left"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-[#E8B86D]/10 hover:bg-[#E8B86D] text-[#E8B86D] hover:text-[#0a0807] flex items-center justify-center transition shrink-0 mb-0.5 mr-0.5 cursor-pointer border-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2.5">
            <span className="text-[10px] font-mono-code text-slate-500">AI can make mistakes. Verify critical legal references.</span>
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}

/* ─── Timeline item ─── */
function TLItem({ item }: { item: TimelineItem }) {
  const color = TL_COLOR[item.type];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1.5px solid ${color}55`, color }}>
          {TL_ICON[item.type]}
        </div>
        <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-semibold text-[13px]" style={{ color: T.text, fontFamily: T.sans }}>{item.title}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${color}14`, color: `${color}cc`, fontFamily: T.mono }}>{item.type}</span>
        </div>
        <div className="text-[10px] mb-1" style={{ color: T.textDim, fontFamily: T.mono }}>{item.date}</div>
        <p className="text-[12px] leading-relaxed" style={{ color: `${T.text}60`, fontFamily: T.sans }}>{item.desc}</p>
      </div>
    </div>
  );
}

/* ─── Case detail view ─── */
function CaseDetail({ c, onBack, onOpenCopilot, onRefresh, onDelete }: { c: Case; onBack: () => void; onOpenCopilot: () => void; onRefresh: () => void; onDelete: () => void }) {
  const [activeTab, setActiveTab] = useState<"timeline" | "documents">("timeline");
  const [docSearch, setDocSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showDeleteCaseModal, setShowDeleteCaseModal] = useState(false);
  const [deletingCase, setDeletingCase] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);
  const [processingToast, setProcessingToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [showHearingModal, setShowHearingModal] = useState(false);

  const handleAddHearing = async (hearingData: any) => {
    setProcessingToast("⏳ Processing timeline update. AI is analyzing new case details...");
    try {
      await apiFetch(`/cases/${c.id}/hearings`, {
        method: "POST",
        body: JSON.stringify(hearingData),
      });
      onRefresh();
      setProcessingToast("✨ Case timeline and Favourability score updated successfully!");
      setTimeout(() => setProcessingToast(null), 4000);
    } catch (err: any) {
      console.error("Failed to add hearing", err);
      setProcessingToast(null);
      alert(`Failed to add hearing: ${err.message || err}`);
    }
  };

  const uploadFiles = async (filesList: FileList) => {
    setUploading(true);
    const newPendingDocs: any[] = [];
    try {
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("case_id", c.id);
        formData.append("doc_type", "case_file");

        const response = await apiFetch("/documents/upload", {
          method: "POST",
          body: formData,
        });

        // Immediately inject doc with processing status to trigger polling
        newPendingDocs.push({
          id: response.id || `pending-${Date.now()}-${i}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          type: file.name.split(".").pop() || "pdf",
          date: "Just now",
          status: "processing",
        });
      }

      // Inject pending docs into case state (triggers polling)
      if (newPendingDocs.length > 0) {
        onRefresh();
        setProcessingToast(`⏳ ${newPendingDocs.length} document(s) uploaded. AI analysis running in background...`);
        setTimeout(() => setProcessingToast(null), 10000);
      }
    } catch (err: any) {
      console.error("Upload failed", err);
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = (docId: string, docName: string) => {
    setDocToDelete({ id: docId, name: docName });
  };

  const executeDocDelete = async () => {
    if (!docToDelete) return;
    try {
      await apiFetch(`/documents/${docToDelete.id}`, { method: "DELETE" });
      onRefresh();
    } catch (err: any) {
      console.error("Doc delete failed", err);
      alert(`Failed to delete document: ${err.message || err}`);
    } finally {
      setDocToDelete(null);
    }
  };

  const handleDeleteCase = async () => {
    setDeletingCase(true);
    try {
      await apiFetch(`/cases/${c.id}`, { method: "DELETE" });
      onDelete();
    } catch (err: any) {
      console.error("Case delete failed", err);
      alert(`Failed to delete case: ${err.message || err}`);
    } finally {
      setDeletingCase(false);
      setShowDeleteCaseModal(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };
  
  // Status style maps
  const isActive = c.status === "Active";
  const isClosed = c.status === "Closed";
  const isProcessing = c.docs && c.docs.some((d: any) => d.status === "processing" || d.status === "pending");

  let statusBadge = "bg-[#12251a] border-emerald-500/40 text-emerald-400"; // default Closed
  if (isActive) {
    statusBadge = "bg-[#141b2d] border-blue-500/40 text-blue-400";
  }

  // Filter docs
  const filteredDocs = c.docs.filter(d => d.name.toLowerCase().includes(docSearch.toLowerCase()));

  // Clipboard copy handler
  const handleCopyId = () => {
    navigator.clipboard.writeText(c.id);
    alert("Case Reference ID copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto relative z-10 space-y-6 text-left" style={{ animation: "fadeUp 0.35s ease forwards" }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Processing Toast */}
      {processingToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1511] border border-[#E8B86D]/40 text-[#E8B86D] px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-sm font-semibold flex items-center gap-3 animate-fade-in-right">
          <span className="text-lg">⚙️</span>
          <span>{processingToast}</span>
          <button onClick={() => setProcessingToast(null)} className="text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer ml-2 text-xs">✕</button>
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}>
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 p-7 flex flex-col gap-5 text-left" style={{ background: "#100705", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <h2 className="text-lg font-bold text-white">Delete Document?</h2>
                <p className="text-xs text-slate-400 mt-0.5">This will remove it from AI context.</p>
              </div>
            </div>
            <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-200 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-white">{docToDelete.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDocToDelete(null)} className="flex-1 py-3 rounded-xl border text-sm bg-transparent cursor-pointer transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>Cancel</button>
              <button onClick={executeDocDelete} className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer bg-red-600 hover:bg-red-500 text-white transition">
                Yes, Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Delete Confirmation Modal */}
      {showDeleteCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}>
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 p-7 flex flex-col gap-5 text-left" style={{ background: "#100705", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <h2 className="text-lg font-bold text-white">Delete Case?</h2>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-200 leading-relaxed">
                Permanently deleting <strong className="text-white">{c.title}</strong> will remove all associated documents, hearings, and AI analysis data.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteCaseModal(false)} className="flex-1 py-3 rounded-xl border text-sm bg-transparent cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>Cancel</button>
              <button onClick={handleDeleteCase} disabled={deletingCase} className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50">
                {deletingCase ? "Deleting..." : "Yes, Delete Case"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔝 BREADCRUMBS & ACTION HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-3 text-[13px] font-mono-code font-semibold flex-wrap">
          <button onClick={onBack} className="bg-transparent border-0 p-0 text-slate-400 hover:text-[#E8B86D] transition flex items-center gap-1.5 cursor-pointer">
            <span>←</span> Cases
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-[#FBFBFA] truncate max-w-[200px] md:max-w-xs">{c.title}</span>
          <span className={`border text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-inner ml-1 ${statusBadge}`}>
            {c.status}
          </span>
          {isProcessing && (
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse ml-2 flex items-center gap-1.5 font-bold shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Updating Context...
            </span>
          )}
        </div>

        {/* Header Action Buttons (Delete next to Copilot) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowDeleteCaseModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/35 hover:border-red-500/60 text-red-400 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Delete this case permanently"
          >
            <span>🗑️</span> Delete Case
          </button>

          <button onClick={onOpenCopilot} className="bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0a0807] font-bold px-5 py-2.5 rounded-xl text-xs shadow-[0_4px_15px_rgba(232,184,109,0.25)] hover:brightness-110 active:scale-95 transition flex items-center gap-2 cursor-pointer border-0 font-sans-ui">
            <span className="text-base">🤖</span> Open AI Copilot
          </button>
        </div>
      </header>

      {/* 🗂️ THE INTELLIGENCE DOSSIER CARD (Top Section) */}
      <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden group border border-[#E8B86D]/15 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        {/* Top Subtle Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/50 to-transparent"></div>
        
        {/* Scales of justice visual */}
        <div className="absolute top-1/4 right-5 text-[#E8B86D] opacity-[0.03] select-none pointer-events-none font-serif-legal z-0 transform -rotate-12">
          <svg width="350" height="350" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
            <path d="M7 21h10"/>
            <path d="M12 3v18"/>
            <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
          </svg>
        </div>

        <div className="relative z-10">
          {/* Case Meta & Analysis */}
          <div className="w-full space-y-4">
            <div>
              <h1 className="font-serif-legal text-2xl md:text-3xl font-bold text-[#FBFBFA] tracking-wide mb-1.5 drop-shadow-md break-words">
                {c.title}
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-4 flex-wrap">
                <span className="text-[#E8B86D]">{c.client}</span>
                <span className="text-slate-600 font-mono-code">v.</span>
                <span className="text-[#E8B86D]">Respondent</span>
                <span className="text-slate-600 mx-1">•</span>
                <span className="flex items-center gap-1">🏛️ {c.court}</span>
              </div>
            </div>

            {/* AI Context Summary Box (Left Accent Border) — full size in detail */}
            <div className="bg-[#0c0a09]/80 border-l-[3px] border-[#E8B86D] rounded-r-2xl border border-y-white/5 border-r-white/5 p-5 shadow-inner" style={{ boxShadow: "inset 0 0 20px rgba(0,0,0,0.3), 0 0 1px rgba(232,184,109,0.2)" }}>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold block mb-2">🧠 AI Case Analysis</span>
              {isProcessing && (!c.summary || c.summary.includes("No context summary") || c.summary.includes("No documents")) ? (
                <div className="space-y-1 animate-pulse">
                  <p className="text-[14px] text-amber-400 font-bold">
                    ⏳ Processing Uploaded Documents...
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    AI systems are currently parsing raw files and evaluating case strength. This summary box and favourability score will automatically refresh shortly.
                  </p>
                </div>
              ) : (
                <p className="text-[14px] text-slate-200 font-medium leading-loose">
                  {c.summary || "No context summary generated yet. Upload case pleadings or contracts to run AI analysis."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info Bar */}
        <div className="mt-6 pt-5 border-t border-[#E8B86D]/15 flex flex-wrap items-center justify-between gap-4 relative z-10">
          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {c.tags.map(tag => (
              <span key={tag} className="bg-[#1a1511] text-[#E8B86D] border border-[#E8B86D]/30 text-[11px] font-mono-code font-bold px-3 py-1 rounded-lg">
                #{tag}
              </span>
            ))}
          </div>

          {/* AI Strength Indicator — Premium Redesign */}
          <div className="flex items-center gap-4 bg-[#0c0a09] px-5 py-3.5 rounded-2xl border border-[#E8B86D]/20 shadow-[0_0_20px_rgba(232,184,109,0.05)]">
            <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold shrink-0">⚖️ Case Favourability Score</span>
            {c.strength === 0 && c.docs.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-pulse"></span>
                <span className="text-[12px] font-mono-code text-slate-400 font-medium">Upload documents to calculate</span>
              </div>
            ) : c.strength === 0 && c.docs.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[12px] font-mono-code text-amber-400 font-medium">Calculating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="flex-1 h-4 bg-white/8 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${c.strength}%`,
                      background: c.strength > 70
                        ? "linear-gradient(90deg, #10B981, #34D399)"
                        : c.strength > 50
                        ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
                        : "linear-gradient(90deg, #EF4444, #F87171)",
                      boxShadow: c.strength > 70
                        ? "0 0 12px rgba(16,185,129,0.6)"
                        : c.strength > 50
                        ? "0 0 12px rgba(245,158,11,0.6)"
                        : "0 0 12px rgba(239,68,68,0.6)",
                    }}
                  />
                </div>
                <span
                  className="text-xl font-mono-code font-black"
                  style={{ color: c.strength > 70 ? "#34D399" : c.strength > 50 ? "#FBBF24" : "#F87171" }}
                >
                  {c.strength}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* MAIN GRID: LEFT (TIMELINE/DOCUMENTS) vs RIGHT (ACTIONS) */}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ⏳ LEFT COLUMN (8 Cols): TABS & DYNAMIC PANEL */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Glass Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E8B86D]/15 pb-px">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl transition cursor-pointer border-0 bg-transparent text-sm ${
                activeTab === "timeline"
                  ? "bg-gradient-to-t from-[#E8B86D]/10 to-transparent border-b-2 border-[#E8B86D] text-[#E8B86D] font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5 font-semibold"
              }`}
            >
              <span className="text-base">📌</span> Timeline
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl transition cursor-pointer border-0 bg-transparent text-sm ${
                activeTab === "documents"
                  ? "bg-gradient-to-t from-[#E8B86D]/10 to-transparent border-b-2 border-[#E8B86D] text-[#E8B86D] font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5 font-semibold"
              }`}
            >
              <span className="text-base">📄</span> Documents ({c.docs.length})
            </button>
          </div>

          {/* Timeline Panel */}
          {activeTab === "timeline" && (
            <div className="glass-card rounded-3xl p-6 md:p-8 min-h-[400px] border border-[#E8B86D]/15 shadow-lg">
              <div className="space-y-8 relative">
                {/* The Luminous Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-8 w-px bg-gradient-to-b from-[#E8B86D]/50 via-white/10 to-transparent"></div>
                
                {c.timeline.length === 0 ? (
                  <div className="text-center py-16 text-xs text-stone-500 font-mono-code">
                    No timeline events recorded yet. Click "Add timeline event" to schedule hearings.
                  </div>
                ) : (
                  c.timeline.map((item) => {
                    const isHearing = item.type.toLowerCase().includes("hearing");
                    const isNote = item.type === "note";
                    const isDoc = item.type === "document";
                    const icon = isHearing ? "⚖️" : isDoc ? "📄" : isNote ? "📝" : "🗄️";
                    const colorClass = isHearing
                      ? "border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)] bg-[#14100c]"
                      : isDoc
                      ? "border-amber-500/40 text-amber-400 bg-[#14100c]"
                      : "border-slate-600 text-slate-400 bg-[#14100c]";
                    const isExpanded = expandedItemId === item.id;
                    
                    return (
                      <div key={item.id} className="relative pl-14 group text-left">
                        {/* Node */}
                        <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border flex items-center justify-center group-hover:scale-110 transition-transform z-10 ${colorClass}`}>
                          {icon}
                        </div>
                        
                        {/* Content Card — clickable to expand */}
                        <div
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className={`border rounded-2xl p-5 transition-all shadow-md cursor-pointer ${
                            isExpanded
                              ? "bg-[#1a1511] border-[#E8B86D]/40 shadow-[0_0_20px_rgba(232,184,109,0.08)]"
                              : "bg-[#14100c]/80 hover:bg-[#1a1511] border-white/5 hover:border-[#E8B86D]/30"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="text-base font-bold text-white group-hover:text-[#E8B86D] transition">{item.title}</h4>
                              <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded border capitalize ${
                                isHearing ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : isDoc ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-white/5 text-slate-400 border-white/10"
                              }`}>
                                {item.type}
                              </span>
                            </div>
                            <span className="text-slate-500 text-sm transition">{isExpanded ? "▲" : "▼"}</span>
                          </div>
                          
                          <p className="text-[11px] font-mono-code text-slate-500 font-semibold mb-3">📅 {item.date}</p>
                          
                          {/* Preview (always visible) */}
                          {!isExpanded && (
                            <p className="text-[13px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                              {item.desc}
                            </p>
                          )}
                          
                          {/* Full expand */}
                          {isExpanded && (
                            <div className="space-y-3 mt-1">
                              <p className="text-[13px] text-slate-200 font-medium leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                                {item.desc}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] font-mono-code text-slate-500">
                                <span>Recorded: {item.date}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Add Event Button (End of timeline) */}
                <div className="relative pl-14 pt-2">
                  <button
                    onClick={() => setShowHearingModal(true)}
                    className="bg-[#14100c] hover:bg-[#E8B86D]/10 text-slate-300 hover:text-[#E8B86D] border border-white/10 hover:border-[#E8B86D]/40 px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>➕</span> Add timeline event
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Documents Panel */}
          {activeTab === "documents" && (
            <div className="glass-card rounded-3xl p-6 md:p-8 min-h-[400px] flex flex-col gap-6 border border-[#E8B86D]/15 shadow-lg">
              
              {/* Tool Bar (Search & Filter) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><span className="text-slate-400">🔍</span></div>
                  <input
                    type="text"
                    value={docSearch}
                    onChange={e => setDocSearch(e.target.value)}
                    placeholder="Search files in this case..."
                    className="w-full bg-[#0c0a09]/80 border border-white/10 hover:border-[#E8B86D]/30 focus:border-[#E8B86D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#E8B86D]/50 transition"
                  />
                </div>
                <button
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#14100c] hover:bg-white/5 text-[#E8B86D] border border-[#E8B86D]/30 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <span>⏳ Uploading...</span> : <><span>➕</span> Upload New File</>}
                </button>
              </div>

              {/* Document List Rows */}
              {filteredDocs.length > 0 ? (
                <div className="space-y-3.5 flex-1 text-left">
                  {filteredDocs.map((doc) => {
                    const isPDF = doc.name.toLowerCase().endsWith(".pdf");
                    const iconColor = isPDF ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400";
                    const iconSymbol = isPDF ? "📄" : "📝";

                    return (
                      <div key={doc.id} className="bg-[#0c0a09]/60 hover:bg-[#14100c] border border-white/5 hover:border-[#E8B86D]/30 rounded-2xl p-4 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0 ${iconColor}`}>
                            {iconSymbol}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-bold text-white group-hover:text-[#E8B86D] transition">{doc.name}</h4>
                              {doc.status === "processing" ? (
                                <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[9px] font-mono-code px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-bold animate-pulse">
                                  ⏳ Processing...
                                </span>
                              ) : doc.status === "failed" ? (
                                <span className="flex items-center gap-1 bg-red-500/10 text-red-400 text-[9px] font-mono-code px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-bold">
                                  ❌ Failed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono-code px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold" title="Analyzed by Case Copilot">
                                  ✨ AI Processed
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5 text-[11px] font-mono-code text-slate-400 font-medium">
                              <span>{doc.date}</span>
                              <span className="text-slate-600">•</span>
                              <span>{doc.size}</span>
                              <span className="text-slate-600">•</span>
                              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-300 uppercase">{doc.type}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Row Actions */}
                        <div className="flex items-center gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition border border-transparent hover:border-white/10 cursor-pointer" title="View Document">👁️</button>
                          <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition border border-transparent hover:border-white/10 cursor-pointer" title="Download">⬇️</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id, doc.name); }}
                            className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition border border-transparent hover:border-red-500/30 cursor-pointer"
                            title="Delete Document"
                          >🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : docSearch ? (
                <div className="text-center py-6 text-xs text-stone-500 font-mono-code">
                  No documents match the search keywords.
                </div>
              ) : null}

              {/* Glass Dropzone for New Uploads */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!uploading && e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed border-[#E8B86D]/20 hover:border-[#E8B86D]/50 bg-[#0c0a09]/40 hover:bg-[#14100c]/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group ${
                  filteredDocs.length === 0 ? "mt-2" : "mt-4"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#1a1511] border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  {uploading ? "⏳" : "📤"}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {uploading ? "Uploading files to CaseVault..." : "Drag and drop case files here"}
                </h4>
                <p className="text-[11px] font-mono-code text-slate-500">
                  {uploading ? "Please wait while OCR processing runs." : "Supported: PDF, DOCX, TXT, JPG (OCR enabled)"}
                </p>
              </div>

            </div>
          )}
        </div>

        {/* ⚡ RIGHT COLUMN (4 Cols): QUICK ACTIONS & METADATA */}
        <div className="lg:col-span-4 space-y-6 text-left sticky top-6">
          
          {/* Quick Actions Command Palette */}
          <div className="glass-card rounded-3xl p-6 border border-[#E8B86D]/15 shadow-lg">
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold block mb-4">QUICK ACTIONS</span>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowHearingModal(true)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition group text-left shadow-sm cursor-pointer ${
                  activeTab === "timeline"
                    ? "bg-gradient-to-r from-[#E8B86D]/10 to-transparent border-[#E8B86D]/30"
                    : "bg-[#14100c]/80 hover:bg-[#1a1511] border-white/5 hover:border-[#E8B86D]/30"
                }`}
              >
                <span className="text-lg group-hover:scale-110 transition">📅</span>
                <span className={`text-sm group-hover:text-white ${activeTab === "timeline" ? "font-bold text-[#E8B86D]" : "font-semibold text-slate-200"}`}>
                  Add update / hearing
                </span>
              </button>

              <button
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition group text-left shadow-sm cursor-pointer disabled:opacity-50 ${
                  activeTab === "documents"
                    ? "bg-gradient-to-r from-[#E8B86D]/10 to-transparent border-[#E8B86D]/30"
                    : "bg-[#14100c]/80 hover:bg-[#1a1511] border-white/5 hover:border-[#E8B86D]/30"
                }`}
              >
                <span className="text-lg group-hover:scale-110 transition">{uploading ? "⏳" : "📤"}</span>
                <span className={`text-sm group-hover:text-white ${activeTab === "documents" ? "font-bold text-[#E8B86D]" : "font-semibold text-slate-200"}`}>
                  {uploading ? "Uploading..." : "Upload document"}
                </span>
              </button>

              <button className="w-full flex items-center gap-3 bg-[#14100c]/80 hover:bg-[#1a1511] p-3.5 rounded-xl border border-white/5 hover:border-[#E8B86D]/30 transition group text-left shadow-sm cursor-pointer">
                <span className="text-lg group-hover:scale-110 transition">📎</span>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white">Add evidence</span>
              </button>
            </div>
          </div>

          {/* Encrypted Case ID Widget */}
          <div className="glass-card rounded-3xl p-6 text-center relative overflow-hidden group border border-[#E8B86D]/15 shadow-lg">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 font-bold block mb-2">CASE ID REFERENCE</span>
            
            <div
              onClick={handleCopyId}
              className="bg-[#0c0a09] border border-[#E8B86D]/20 p-4 rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:border-[#E8B86D]/50 transition group-hover:shadow-[0_0_15px_rgba(232,184,109,0.15)]"
            >
              <span className="text-lg font-mono-code font-bold text-[#E8B86D] tracking-widest">{getDisplayId(c.id)}</span>
              <span className="text-slate-500 text-sm opacity-0 group-hover:opacity-100 transition">📋</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-mono-code">Click to copy reference key</p>
          </div>

        </div>

      </div>

      {showHearingModal && (
        <HearingModal
          onClose={() => setShowHearingModal(false)}
          onAdd={handleAddHearing}
        />
      )}
    </div>
  );
}

/* ─── New Case Modal ─── */
function NewCaseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [title, setTitle] = useState(""); const [client, setClient] = useState(""); const [court, setCourt] = useState(""); const [desc, setDesc] = useState(""); const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const create = () => {
    if (!title.trim()) return;
    onAdd({ title, client: client || "Unknown", court: court || "TBD", desc, files });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
      <div className="w-full max-w-lg rounded-3xl border p-7 flex flex-col gap-5" style={{ background: "#100705", borderColor: "rgba(255,255,255,0.1)", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: T.text, fontFamily: T.serif }}>Add New Case</h2>
          <button onClick={onClose} style={{ color: T.textDim }}><X size={18} /></button>
        </div>
        {[{ label: "Case title *", value: title, setter: setTitle, placeholder: "e.g. Property Dispute" }, { label: "Client name", value: client, setter: setClient, placeholder: "Full name" }, { label: "Court / Forum", value: court, setter: setCourt, placeholder: "e.g. Delhi High Court" }].map(f => (
          <div key={f.label}>
            <label className="text-[11px] mb-1.5 block" style={{ color: T.textDim, fontFamily: T.sans }}>{f.label}</label>
            <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-xl border text-[13px] outline-none transition-all placeholder-slate-500" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)", color: T.text, fontFamily: T.sans }} onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)} onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")} />
          </div>
        ))}
        <div>
          <label className="text-[11px] mb-1.5 block" style={{ color: T.textDim, fontFamily: T.sans }}>Your description / facts (AI will summarise)</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe the facts, key dates, parties…" className="w-full px-4 py-2.5 rounded-xl border text-[13px] outline-none resize-none placeholder-slate-500" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)", color: T.text, fontFamily: T.sans }} onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)} onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")} />
        </div>
        <div className="rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.1)" }} onClick={() => inputRef.current?.click()}>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files || []))} />
          <Upload size={16} style={{ color: T.textDim, margin: "0 auto 6px" }} />
          <div className="text-[12px]" style={{ color: T.textDim, fontFamily: T.sans }}>{files.length > 0 ? `${files.length} file(s) selected` : <>Drop documents or <span style={{ color: T.gold }}>browse</span></>}</div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: T.textDim, fontFamily: T.sans }}>Cancel</button>
          <button onClick={create} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: title.trim() ? T.gold : "rgba(255,255,255,0.05)", color: title.trim() ? "#0D0604" : T.textDim, fontFamily: T.sans }}>Create Case</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Case Update / Hearing Modal ─── */
function HearingModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!eventDate) {
      alert("Please select a date.");
      return;
    }
    if (!description.trim()) {
      alert("Please enter update details.");
      return;
    }
    onAdd({
      hearing_date: eventDate,
      next_date: null,
      court_order_summary: description,
      notes: null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
      <div className="w-full max-w-lg rounded-3xl border p-7 flex flex-col gap-5 text-left" style={{ background: "#100705", borderColor: "rgba(255,255,255,0.1)", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: T.serif }}>Add Update / Hearing Record</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer"><X size={18} /></button>
        </div>

        <div>
          <label className="text-[11px] mb-1.5 block text-slate-400" style={{ fontFamily: T.sans }}>Date *</label>
          <input
            type="date"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-[13px] outline-none transition-all text-white"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)", fontFamily: T.sans }}
            onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
          />
        </div>

        <div>
          <label className="text-[11px] mb-1.5 block text-slate-400" style={{ fontFamily: T.sans }}>Update Details / Notes *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Enter key details, hearing outcome, or general case update notes..."
            className="w-full px-4 py-2.5 rounded-xl border text-[13px] outline-none resize-none text-white"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.09)", fontFamily: T.sans }}
            onFocus={e => (e.currentTarget.style.borderColor = T.glassBorderHover)}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm bg-transparent cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.1)", color: T.textDim, fontFamily: T.sans }}>Cancel</button>
          <button onClick={submit} className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: eventDate && description.trim() ? T.gold : "rgba(255,255,255,0.05)", color: eventDate && description.trim() ? "#0D0604" : T.textDim, fontFamily: T.sans }}>Add Update</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Case list card ─── */
function CaseCard({
  c,
  onClick,
  onCopilot,
  onToggleStatus,
  onDelete
}: {
  c: Case;
  onClick: () => void;
  onCopilot: () => void;
  onToggleStatus: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const isActive = c.status === "Active";
  const isClosed = c.status === "Closed";

  let statusBg = "bg-blue-500/10 border-blue-500/30 text-blue-400";
  let badgeBg = "bg-[#141b2d] border-blue-500/40 text-blue-400";
  let pulseDot = "bg-blue-400";
  let copilotBtn = "hover:bg-blue-500/10 border-blue-500/30 text-blue-400";
  let icon = "⚖️";

  if (isClosed) {
    statusBg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    badgeBg = "bg-[#12251a] border-emerald-500/40 text-emerald-400";
    pulseDot = "bg-emerald-400";
    copilotBtn = "hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    icon = "🔒";
  }

  const hasSummary = c.summary && 
    c.summary !== "No context summary generated yet." && 
    c.summary !== "No documents uploaded yet to generate context summary." &&
    !c.summary.includes("No context summary") && 
    !c.summary.includes("No documents uploaded");

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-2xl p-6 group cursor-pointer text-left relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        {/* Case meta info */}
        <div className="flex gap-4 min-w-0 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0 mt-1 ${statusBg}`}>
            {icon}
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-serif-legal text-lg font-bold text-white group-hover:text-[#E8B86D] transition truncate">
                {c.title}
              </h3>
              <span className={`flex items-center gap-1.5 text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${badgeBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseDot}`}></span> {c.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono-code text-slate-400 font-semibold">
              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{getDisplayId(c.id)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate">🏛️ {c.court}</span>
            </div>
          </div>
        </div>

        {/* Actions Buttons Group */}
        <div className="flex items-center gap-3 self-start shrink-0">
          {/* Case status toggle */}
          <div className="flex items-center bg-[#0a0807]/80 p-0.5 rounded-xl border border-white/5 text-[11px] font-mono-code font-bold">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isActive) onToggleStatus(e);
              }}
              className={`px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer text-[10px] uppercase tracking-wider font-bold border ${
                isActive 
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
                  : "text-slate-500 hover:text-slate-300 bg-transparent border-transparent"
              }`}
            >
              Active
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) onToggleStatus(e);
              }}
              className={`px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer text-[10px] uppercase tracking-wider font-bold border ${
                isClosed 
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                  : "text-slate-500 hover:text-slate-300 bg-transparent border-transparent"
              }`}
            >
              Closed
            </button>
          </div>

          {/* AI Copilot Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopilot();
            }}
            className={`bg-[#14100c] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm border ${copilotBtn} cursor-pointer`}
          >
            <span>✨</span> Open Copilot
          </button>

          {/* Delete Button directly visible on Card */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="w-9 h-9 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 text-red-400 flex items-center justify-center transition cursor-pointer"
            title="Delete Case permanently"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* AI case insight box */}
      {hasSummary ? (
        <div className={`mt-5 ml-0 md:ml-16 bg-[#14100c]/60 border-l-[3px] p-4 rounded-r-xl border border-y-white/5 border-r-white/5 ${
          isActive ? "border-l-blue-500/60" : "border-l-emerald-500/60"
        }`}>
          <span className={`text-[10px] font-mono-code uppercase tracking-widest font-bold block mb-1.5 ${
            isActive ? "text-blue-400" : "text-emerald-400"
          }`}>🧠 AI Context Snippet:</span>
          <p className="text-[13px] text-slate-200 font-medium leading-relaxed line-clamp-2">
            {c.summary}
          </p>
        </div>
      ) : (c.docs && c.docs.some((d: any) => d.status === "processing" || d.status === "pending")) ? (
        <div className="mt-5 ml-0 md:ml-16 bg-[#14100c]/60 border-l-[3px] p-4 rounded-r-xl border border-y-white/5 border-r-white/5 border-l-amber-500/60 animate-pulse">
          <span className="text-[10px] font-mono-code uppercase tracking-widest font-bold block mb-1.5 text-amber-400">
            🧠 AI Context Snippet: Processing Files...
          </span>
          <p className="text-[13px] text-amber-100 font-medium leading-relaxed">
            Uploaded case documents are currently being parsed and analyzed. AI summary and favourability statistics will update shortly.
          </p>
        </div>
      ) : (
        <div className="mt-5 ml-0 md:ml-16 bg-[#14100c]/40 border border-dashed border-white/10 p-4 rounded-xl flex items-center gap-3">
          <span className="text-slate-500 text-lg">💡</span>
          <p className="text-[12px] text-slate-400 font-medium">
            No context summary generated yet. <span className="text-[#E8B86D] underline">Upload case documents</span> to activate AI analysis.
          </p>
        </div>
      )}

      {/* Footer Stats — with improved highly visible AI Favourability Score bar */}
      <div className="mt-6 ml-0 md:ml-16 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono-code font-bold">
        {c.strength === 0 ? (
          <span className="flex items-center gap-1.5 text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
            <span>📄</span> Pending Documents
          </span>
        ) : (
          <div className="flex items-center gap-3 bg-[#0c0a09] px-4 py-2 rounded-xl border border-white/5 shadow-inner">
            <span className="text-[#E8B86D] uppercase tracking-widest text-[9px] font-black">⚖️ Case Favourability Score</span>
            <div className="w-44 h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${c.strength}%`,
                  background: c.strength > 70
                    ? "linear-gradient(90deg, #10B981, #34D399)"
                    : c.strength > 50
                    ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
                    : "linear-gradient(90deg, #EF4444, #F87171)",
                  boxShadow: c.strength > 70
                    ? "0 0 10px rgba(16,185,129,0.7)"
                    : c.strength > 50
                    ? "0 0 10px rgba(245,158,11,0.7)"
                    : "0 0 10px rgba(239,68,68,0.7)",
                }}
              />
            </div>
            <span
              className="text-sm font-black tracking-tighter"
              style={{ color: c.strength > 70 ? "#34D399" : c.strength > 50 ? "#FBBF24" : "#F87171" }}
            >{c.strength}%</span>
          </div>
        )}
        <span className="text-slate-500 flex items-center gap-1.5">
          <span>📎</span> {c.docs ? c.docs.length : 0} docs attached
        </span>
      </div>
    </div>
  );
}


/* ─── Main ─── */
export default function CaseVault() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [copilotCase, setCopilotCase] = useState<Case | null>(null);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

  const loadCases = async (silent = false) => {
    if (!silent) setLoading(true);
    setConnectionError(false);
    try {
      const data = await apiFetch("/cases");
      const list = Array.isArray(data) ? data.map(transformCase) : [];
      setCases(list);
    } catch (err) {
      console.error("Failed to load cases", err);
      setConnectionError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Poll case details automatically if any document is in 'processing' status
  useEffect(() => {
    if (!selectedCase) return;

    const hasProcessingDocs = selectedCase.docs?.some(d => d.status === "processing");
    if (!hasProcessingDocs) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(`/cases/${selectedCase.id}`);

        const docItems: CaseDoc[] = Array.isArray(data.documents) ? data.documents.map((d: any) => ({
          id: d.id,
          name: d.filename,
          size: d.file_size_bytes ? `${(d.file_size_bytes / 1024).toFixed(0)} KB` : "—",
          type: d.mime_type ? d.mime_type.split("/").pop() || "pdf" : "pdf",
          date: d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today",
          status: d.analysis_status,
        })) : [];

        const timelineItems: TimelineItem[] = [];
        if (Array.isArray(data.hearings)) {
          data.hearings.forEach((h: any) => {
            const rawDate = h.hearing_date || data.created_at || new Date().toISOString();
            timelineItems.push({
              id: h.id,
              type: "hearing",
              rawDate,
              date: h.hearing_date ? new Date(h.hearing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBD",
              title: "Update / Hearing",
              desc: h.court_order_summary && h.notes
                ? `${h.court_order_summary}\n\nNotes: ${h.notes}`
                : (h.court_order_summary || h.notes || "Update recorded."),
            });
          });
        }

        if (Array.isArray(data.documents)) {
          data.documents.forEach((d: any) => {
            const rawDate = d.created_at || new Date().toISOString();
            timelineItems.push({
              id: d.id,
              type: "document",
              rawDate,
              date: d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today",
              title: d.filename,
              desc: d.ai_summary || `Document type: ${d.doc_type}`,
            });
          });
        }

        // Sort by rawDate ISO string (safe, no NaN)
        timelineItems.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

        const createdRaw = data.created_at || new Date().toISOString();
        timelineItems.push({
          id: "case-creation",
          type: "note",
          rawDate: createdRaw,
          date: data.created_at ? new Date(data.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today",
          title: "CaseVault Initialized",
          desc: data.ai_context_summary || "Case folder initialized.",
          fullDesc: data.notes 
            ? `${data.notes}\n\nReference Key: ${getDisplayId(data.id)}`
            : `Case folder registered. Reference Key: ${getDisplayId(data.id)}.`,
        });

        const updated = {
          ...transformCase(data),
          timeline: timelineItems,
          docs: docItems,
        };

        setSelectedCase(updated);
        setCases(prev => prev.map(item => item.id === updated.id ? updated : item));

        // Sync Copilot drawer case data if it is open for the same case
        if (copilotCase && copilotCase.id === selectedCase.id) {
          setCopilotCase(updated);
        }
      } catch (err) {
        console.error("Polling case details failed", err);
      }
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [selectedCase, copilotCase]);

  const loadCaseDetails = async (c: Case) => {
    try {
      const data = await apiFetch(`/cases/${c.id}`);
      
      const timelineItems: TimelineItem[] = [];
      if (Array.isArray(data.hearings)) {
        data.hearings.forEach((h: any) => {
          const rawDate = h.hearing_date || data.created_at || new Date().toISOString();
          timelineItems.push({
            id: h.id,
            type: "hearing",
            rawDate,
            date: h.hearing_date ? new Date(h.hearing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBD",
            title: "Update / Hearing",
            desc: h.court_order_summary && h.notes
              ? `${h.court_order_summary}\n\nNotes: ${h.notes}`
              : (h.court_order_summary || h.notes || "Update recorded."),
          });
        });
      }

      if (Array.isArray(data.documents)) {
        data.documents.forEach((d: any) => {
          const rawDate = d.created_at || new Date().toISOString();
          timelineItems.push({
            id: d.id,
            type: "document",
            rawDate,
            date: d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today",
            title: d.filename,
            desc: d.ai_summary || `Document type: ${d.doc_type}`,
          });
        });
      }

      // Sort by rawDate ISO string (safe, no NaN)
      timelineItems.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

      const createdRaw = data.created_at || new Date().toISOString();
      timelineItems.push({
        id: "case-creation",
        type: "note",
        rawDate: createdRaw,
        date: data.created_at ? new Date(data.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today",
        title: "CaseVault Initialized",
        desc: data.ai_context_summary || "Case folder initialized.",
        fullDesc: data.notes 
          ? `${data.notes}\n\nReference Key: ${getDisplayId(data.id)}`
          : `Case folder registered. Reference Key: ${getDisplayId(data.id)}.`,
      });

      const docItems: CaseDoc[] = Array.isArray(data.documents) ? data.documents.map((d: any) => ({
        id: d.id,
        name: d.filename,
        size: d.file_size_bytes ? `${(d.file_size_bytes / 1024).toFixed(0)} KB` : "—",
        type: d.mime_type ? d.mime_type.split("/").pop() || "pdf" : "pdf",
        date: d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today",
        status: d.analysis_status,
      })) : [];

      const updated = {
        ...c,
        ...transformCase(data),
        timeline: timelineItems,
        docs: docItems,
      };

      setSelectedCase(updated);
      // Silently sync the case list so strength/summary stays current (BUG-04)
      loadCases(true);
    } catch (err) {
      console.error("Failed to load case details", err);
      // Fallback to basic case card properties if detail load fails
      setSelectedCase(c);
    }
  };

  const handleCreateCase = async (newCaseData: any) => {
    try {
      const payload = {
        case_title: newCaseData.title,
        case_type: "civil", // Default type
        court_name: newCaseData.court,
        petitioner: newCaseData.client,
        respondent: "Opposing Party",
        notes: newCaseData.desc
      };

      const res = await apiFetch("/cases", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdCaseId = res?.id;
      if (createdCaseId && newCaseData.files && newCaseData.files.length > 0) {
        for (let i = 0; i < newCaseData.files.length; i++) {
          const file = newCaseData.files[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("case_id", createdCaseId);
          formData.append("doc_type", "case_file");

          try {
            await apiFetch("/documents/upload", {
              method: "POST",
              body: formData,
            });
          } catch (uploadErr) {
            console.error("Failed to upload file during case creation", file.name, uploadErr);
          }
        }
      }

      await loadCases();
    } catch (err) {
      console.error("Failed to create case via backend", err);
    }
  };

  const handleToggleStatus = async (c: Case) => {
    const nextStatusStr = c.status === "Active" ? "Closed" : "Active";
    const apiStatus = c.status === "Active" ? "closed" : "active";
    
    // Optimistic state updates for instant visual feedback (no full-page flash/reload)
    setCases(prevCases => 
      prevCases.map(item => 
        item.id === c.id ? { ...item, status: nextStatusStr } : item
      )
    );
    if (selectedCase && selectedCase.id === c.id) {
      setSelectedCase(prev => prev ? { ...prev, status: nextStatusStr } : null);
    }

    try {
      await apiFetch(`/cases/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ current_status: apiStatus }),
      });
      // Silent sync with backend in background
      await loadCases(true);
    } catch (err) {
      console.error("Failed to toggle case status", err);
      // Revert to server state on failure
      await loadCases();
    }
  };

  const handleCardDeleteCase = (c: Case) => {
    setCaseToDelete(c);
  };

  const executeCardDelete = async (c: Case) => {
    setDeletingCaseId(c.id);

    // Optimistic UI updates - instantly remove case from UI list
    setCases(prev => prev.filter(item => item.id !== c.id));
    if (selectedCase && selectedCase.id === c.id) {
      setSelectedCase(null);
    }
    if (copilotCase && copilotCase.id === c.id) {
      setCopilotCase(null);
    }
    setCaseToDelete(null);

    try {
      await apiFetch(`/cases/${c.id}`, { method: "DELETE" });
      // Silent reload to sync counts and backend state
      await loadCases(true);
    } catch (err: any) {
      console.error("Failed to delete case", err);
      alert(`Failed to delete case: ${err.message || err}`);
      // Revert state on failure
      await loadCases();
    } finally {
      setDeletingCaseId(null);
    }
  };

  const filtered = cases.filter(c =>
    (filter === "All" || c.status === filter) &&
    (search === "" || c.title.toLowerCase().includes(search.toLowerCase()) || c.client.toLowerCase().includes(search.toLowerCase()))
  );
  const counts = { 
    All: cases.length, 
    Active: cases.filter(c => c.status === "Active").length, 
    Closed: cases.filter(c => c.status === "Closed").length
  };

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto" style={{ animation: "fadeUp 0.35s ease forwards" }}>
      {showNew && <NewCaseModal onClose={() => setShowNew(false)} onAdd={handleCreateCase} />}
      {copilotCase && <CopilotDrawer caseData={copilotCase} onClose={() => setCopilotCase(null)} />}

      {/* Dashboard Premium Custom Delete Modal */}
      {caseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}>
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 p-7 flex flex-col gap-5 text-left" style={{ background: "#100705", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <h2 className="text-lg font-bold text-white">Delete Case Dossier?</h2>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-200 leading-relaxed">
                Permanently deleting <strong className="text-white">{caseToDelete.title}</strong> will destroy its repository, hearings timeline, and AI insights.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCaseToDelete(null)} className="flex-1 py-3 rounded-xl border text-sm bg-transparent cursor-pointer transition hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>Cancel</button>
              <button onClick={() => executeCardDelete(caseToDelete)} disabled={deletingCaseId !== null} className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50">
                {deletingCaseId !== null ? "Deleting..." : "Yes, Delete Case"}
              </button>
            </div>
          </div>
        </div>
      )}

      {connectionError && (
        <div className="bg-red-950/40 border border-red-500/30 p-5 rounded-2xl flex items-center justify-between gap-4 mb-6 relative z-30 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-left">
              <h4 className="text-sm font-bold text-white">Server Connection Failed</h4>
              <p className="text-xs text-red-200/80 font-medium">NyayaSahayak formal services are currently offline. Please wait or try again another time.</p>
            </div>
          </div>
          <button onClick={() => loadCases()} className="bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
            <span>🔄</span> Retry
          </button>
        </div>
      )}

      {selectedCase ? (
        <CaseDetail
          c={selectedCase}
          onBack={() => { setSelectedCase(null); setCopilotCase(null); loadCases(true); }}
          onOpenCopilot={() => setCopilotCase(selectedCase)}
          onRefresh={() => loadCaseDetails(selectedCase)}
          onDelete={() => {
            setSelectedCase(null);
            setCopilotCase(null);
            loadCases();
          }}
        />
      ) : loading ? (
        <div className="min-h-[450px] flex flex-col items-center justify-center text-[#E8B86D] relative overflow-hidden">
          <div className="flex flex-col items-center gap-5 relative z-10">
            <div className="relative">
              {/* Core spinner ring */}
              <div className="h-11 w-11 rounded-full border-[3.5px] border-t-transparent border-[#E8B86D] animate-spin" />
              {/* Center glowing core */}
              <div className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full bg-[#E8B86D] shadow-[0_0_12px_#E8B86D]" />
            </div>
            <div className="space-y-1 text-center">
              <p className="font-mono-code text-[10px] tracking-[0.25em] font-black uppercase text-[#E8B86D]">Accessing CaseVault</p>
              <p className="text-xs text-slate-400 font-medium max-w-[280px] leading-relaxed">Securing legal archives and loading counselor dossiers...</p>
            </div>
          </div>
        </div>
      ) : cases.length === 0 ? (
        /* Appealing Empty State with Quick-Start Guide */
        <div className="max-w-4xl mx-auto w-full space-y-8 mt-4 animate-in fade-in duration-300">
          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="font-serif-legal text-3xl font-bold text-white tracking-wide mb-2">CaseVault Repository</h1>
            <p className="text-sm text-slate-400">Your secure digital ecosystem for case files, evidence, and AI litigation strategy.</p>
          </div>

          {/* THE APPEALING EMPTY STATE WIDGET */}
          <div className="glass-card rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group border-dashed border-2 border-[#E8B86D]/30">
            {/* Center Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E8B86D]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-[#14100c] border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                🗄️
              </div>
              
              <h2 className="font-serif-legal text-2xl font-bold text-white mb-3">Your CaseVault is Empty</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto mb-8 leading-relaxed font-medium">
                You haven't registered any cases yet. Start building your digital repository to unlock AI-powered case summaries and litigation insights.
              </p>

              <button onClick={() => setShowNew(true)} className="bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0a0807] font-bold px-8 py-3.5 rounded-xl text-sm shadow-[0_4px_20px_rgba(232,184,109,0.3)] hover:brightness-110 active:scale-95 transition flex items-center gap-2 mx-auto cursor-pointer border-0">
                <span>+</span> Register Your First Case
              </button>
            </div>
          </div>

          {/* QUICK START GUIDE (Fills the space beautifully) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
            <div className="bg-[#14100c]/60 p-5 rounded-2xl border border-white/5 relative">
              <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#1a1511] border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center font-mono-code font-bold text-xs">1</span>
              <h4 className="text-sm font-bold text-white mb-2 ml-2">Create a Case Profile</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium ml-2">Enter basic details like party names, court jurisdiction, and reference IDs to initialize a secure folder.</p>
            </div>
            <div className="bg-[#14100c]/60 p-5 rounded-2xl border border-white/5 relative">
              <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#1a1511] border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center font-mono-code font-bold text-xs">2</span>
              <h4 className="text-sm font-bold text-white mb-2 ml-2">Upload Evidence</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium ml-2">Drop PDFs, FIRs, contracts, or hearing orders. Our OCR engine digitizes everything instantly.</p>
            </div>
            <div className="bg-[#14100c]/60 p-5 rounded-2xl border border-white/5 relative">
              <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#1a1511] border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center font-mono-code font-bold text-xs">3</span>
              <h4 className="text-sm font-bold text-white mb-2 ml-2">Chat with Copilot</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium ml-2">Ask the AI to find contradictions, summarize facts, or assess case strength based on uploaded files.</p>
            </div>
          </div>
        </div>
      ) : (
        // Active view
        <>
          {/* CaseVault Premium Intro Banner (Glass Reimagined) */}
          <div className="glass-card rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden group">
            {/* Subtle graphic background */}
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 transition duration-700 group-hover:scale-110 select-none pointer-events-none">
              <span className="text-[150px]">💼</span>
            </div>

            <div className="relative z-10 text-left">
              <h2 className="font-serif-legal text-xl md:text-2xl font-bold text-[#FBFBFA] flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8B86D] to-[#C68A2C] text-[#0a0807] flex items-center justify-center text-lg shadow-[0_0_15px_rgba(232,184,109,0.3)]">📂</span>
                NyayaSahayak CaseVault
              </h2>
              <p className="text-[13px] text-slate-300 font-medium leading-relaxed max-w-2xl mb-6">
                CaseVault is your secure legal repository. Upload case files, track hearings, and interact with a dedicated <strong className="text-white">Case Copilot</strong>. Our AI reviews all evidence to summarize details and assess your case's legal strength score dynamically.
              </p>
              
              {/* Sleek AI Command Steps */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono-code font-bold text-[#E8B86D]">
                <span className="bg-[#1a1511]/80 px-3 py-1.5 rounded border border-[#E8B86D]/20 shadow-inner flex items-center gap-2">
                  <span className="text-white bg-[#E8B86D]/20 px-1.5 rounded">1</span> Click "New Case"
                </span>
                <span className="text-slate-600">→</span>
                <span className="bg-[#1a1511]/80 px-3 py-1.5 rounded border border-[#E8B86D]/20 shadow-inner flex items-center gap-2">
                  <span className="text-white bg-[#E8B86D]/20 px-1.5 rounded">2</span> Upload Plaints/Evidence
                </span>
                <span className="text-slate-600">→</span>
                <span className="bg-[#1a1511]/80 px-3 py-1.5 rounded border border-[#E8B86D]/20 shadow-inner flex items-center gap-2">
                  <span className="text-white bg-[#E8B86D]/20 px-1.5 rounded">3</span> Chat with Copilot
                </span>
              </div>
            </div>
          </div>

          {/* Unified Control Center & Header */}
          <div className="space-y-4 mb-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="text-left">
                <h1 className="font-serif-legal text-3xl font-bold text-white tracking-wide mb-1.5">CaseVault</h1>
                <p className="text-xs text-slate-400 font-mono-code font-semibold"><strong className="text-[#E8B86D]">{cases.length}</strong> total cases • <strong className="text-blue-400">{counts.Active}</strong> active</p>
              </div>
              <button onClick={() => setShowNew(true)} className="bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0a0807] font-bold px-5 py-2.5 rounded-xl text-xs shadow-[0_4px_15px_rgba(232,184,109,0.3)] hover:brightness-110 active:scale-95 transition flex items-center gap-2 cursor-pointer border-0 font-sans-ui">
                <span>+</span> Register New Case
              </button>
            </div>

            {/* Unified Search & Filter Glass Bar */}
            <div className="glass-shell p-2 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-2 shadow-lg text-left">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><span className="text-slate-400">🔍</span></div>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases by name, client, or reference ID..." className="w-full bg-[#0a0807]/60 border border-white/5 hover:border-[#E8B86D]/30 focus:border-[#E8B86D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#E8B86D]/50 transition" />
              </div>
              <div className="flex items-center gap-1 bg-[#0a0807]/40 p-1.5 rounded-xl border border-white/5 font-mono-code text-[11px] font-bold shrink-0">
                {(["All", "Active", "Closed"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg transition cursor-pointer border-0 font-bold text-[11px] ${
                    filter === f ? "bg-[#E8B86D] text-[#0a0807] shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5 bg-transparent"
                  }`}>
                    {f} ({counts[f]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dossiers Grid */}
          <div className="flex flex-col gap-4">
            {filtered.map(c => (
              <CaseCard 
                key={c.id} 
                c={c} 
                onClick={() => { setCopilotCase(null); loadCaseDetails(c); }} 
                onCopilot={() => setCopilotCase(c)} 
                onToggleStatus={(e) => handleToggleStatus(c)} 
                onDelete={(e) => handleCardDeleteCase(c)}
              />
            ))}
            {filtered.length === 0 && <div className="text-center py-16 text-sm glass-card rounded-2xl border border-dashed border-white/10" style={{ color: T.textDim, fontFamily: T.sans }}>No cases match search filters.</div>}
          </div>
        </>
      )}
    </div>
  );
}
