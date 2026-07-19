import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Send, Mic, MicOff, Sparkles, Scale, ChevronRight, BookOpen, Brain, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { T } from "./tokens";
import { apiFetch } from "../lib/api";

// Law definitions database
const LAW_TOOLTIPS: Record<string, { full: string; old: string; desc: string; explanation: string; draftType?: string; caseTitle?: string }> = {
  "BNS § 101":  { 
    full: "Bharatiya Nyaya Sanhita, 2023", 
    old: "IPC § 302", 
    desc: "Murder — death or life imprisonment. Effective July 1, 2024.",
    explanation: "Under the BNS 2023, Section 101 defines murder. The standard penalty remains capital punishment or life imprisonment. However, the BNS introduces organized crime and mob lynching provisions under separate subsections which carry similar severe penalties.",
    draftType: "Criminal Bail Application"
  },
  "BNS § 318":  { 
    full: "Bharatiya Nyaya Sanhita, 2023", 
    old: "IPC § 420", 
    desc: "Cheating with dishonest inducement — up to 7 years.",
    explanation: "Cheating is defined under Section 318 of the BNS. Ingredients require establishing dishonest intention at the inception of the transaction. Simple breach of contract does not attract Section 318 unless cheating elements are met.",
    draftType: "Written Statement / Reply"
  },
  "BNS § 85":   { 
    full: "Bharatiya Nyaya Sanhita, 2023", 
    old: "IPC § 498A", 
    desc: "Cruelty by husband/relatives. Includes mental cruelty.",
    explanation: "Section 85 covers cruelty against women by husbands or relatives. Key reform in BNS 2023 explicitly codifies 'mental cruelty' as a distinct category, broadening the evidence scope. Offences remain cognizable and non-bailable.",
    draftType: "Anticipatory Bail Petition"
  },
  "BNSS § 173": { 
    full: "Bharatiya Nagarik Suraksha Sanhita, 2023", 
    old: "CrPC § 154", 
    desc: "FIR & investigation. Includes mandatory video recording.",
    explanation: "Section 173 of BNSS replaces CrPC 154 for lodging FIRs. New changes: Zero FIR can be lodged anywhere in India. Digital complaints are permitted but must be signed physically within 3 days. Video recording of search/seizure is mandatory.",
    draftType: "Complaint under Section 173 BNSS"
  },
  "BSA § 57":   { 
    full: "Bharatiya Sakshya Adhiniyam, 2023", 
    old: "IEA § 65B", 
    desc: "Electronic records admissibility.",
    explanation: "Replaces Section 65B of IEA. Electronic data, cloud server logs, call logs, metadata, and WhatsApp chats are direct primary evidence if accompanied by a certificate signed by a competent examiner at the time of evidence preservation.",
    draftType: "Certificate of Electronic Evidence"
  },
  "NI Act § 138": { 
    full: "Negotiable Instruments Act, 1881", 
    old: "Unchanged", 
    desc: "Cheque dishonour — 138 criminal complaint.",
    explanation: "Section 138 deals with cheque bounce cases. A statutory legal notice must be sent to the drawer within 30 days of the cheque return memo date. If payment is not made within 15 days of notice receipt, a complaint must be filed in Magistrate court within 30 days.",
    draftType: "Section 138 Legal Notice",
    caseTitle: "Damodar S. Prabhu v. Sayed Babalal H. (2010)"
  },
  "IT Act § 4": {
    full: "Information Technology Act, 2000",
    old: "Unchanged",
    desc: "Legal recognition of electronic records.",
    explanation: "Section 4 of the IT Act states that if any law requires information to be in written or printed form, then such requirement is satisfied if it is rendered or made available in electronic form, including DigiLocker, digital licenses, etc.",
    draftType: "Legal Notice for Harassment"
  },
  "MV Act § 139": {
    full: "Motor Vehicles (Amendment) Act, 2019",
    old: "Unchanged",
    desc: "Production of documents in digital format.",
    explanation: "Rule 139 of Central Motor Vehicles Rules (amended) mandates that citizens can produce vehicle registration, driving license, pollution certificates, and insurance in digital formats on government portals (DigiLocker/mParivahan). Officers cannot compel physical copies.",
    draftType: "Harassment Complaint to DCP"
  }
};

function LawPill({ label, onClick }: { label: string; onClick?: () => void }) {
  const [show, setShow] = useState(false);
  const data = LAW_TOOLTIPS[label];
  const isNew = label.includes("BNS") || label.includes("BNSS") || label.includes("BSA");
  return (
    <span className="relative inline-block mx-1 my-0.5">
      <button 
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all hover:scale-102 hover:brightness-110 active:scale-95 shadow-md border"
        style={{ 
          background: isNew ? "rgba(16,185,129,0.12)" : "rgba(232,184,109,0.08)", 
          borderColor: isNew ? "rgba(16,185,129,0.4)" : "rgba(232,184,109,0.32)", 
          color: isNew ? "#34D399" : T.gold, 
          fontFamily: T.sans 
        }}
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        <Scale size={11} style={{ color: isNew ? "#34D399" : T.gold }} />
        {label}
        {isNew && (
          <span className="text-[7px] px-1 py-0.5 rounded font-mono uppercase bg-emerald-400/20 text-emerald-300 font-black tracking-wider ml-1">
            NEW CODE
          </span>
        )}
      </button>
      {show && data && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3.5 rounded-2xl border z-50 shadow-2xl"
          style={{ background: "rgba(12,4,2,0.98)", backdropFilter: "blur(24px)", borderColor: "rgba(232,184,109,0.2)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold" style={{ color: T.gold, fontFamily: T.mono }}>{label}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: T.textDim, fontFamily: T.mono }}>{data.old}</span>
          </div>
          <div className="text-[10px] mb-1.5" style={{ color: `${T.gold}60`, fontFamily: T.mono }}>{data.full}</div>
          <p className="text-[11px] leading-relaxed" style={{ color: `${T.text}75`, fontFamily: T.sans }}>{data.desc}</p>
        </div>
      )}
    </span>
  );
}

function SectionChip({ text, onClick }: { text: string; onClick?: () => void }) {
  const isNew = text.includes("BNS") || text.includes("BNSS") || text.includes("BSA");
  return (
    <span className="relative inline-block mx-1 my-0.5">
      <button 
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all hover:scale-102 hover:brightness-110 active:scale-95 shadow-md border"
        style={{ 
          background: isNew ? "rgba(16,185,129,0.12)" : "rgba(232,184,109,0.08)", 
          borderColor: isNew ? "rgba(16,185,129,0.4)" : "rgba(232,184,109,0.32)", 
          color: isNew ? "#34D399" : T.gold, 
          fontFamily: T.sans 
        }}>
        <Scale size={11} style={{ color: isNew ? "#34D399" : T.gold }} />
        {text}
        {isNew && (
          <span className="text-[7px] px-1 py-0.5 rounded font-mono uppercase bg-emerald-400/20 text-emerald-300 font-black tracking-wider ml-1">
            NEW CODE
          </span>
        )}
      </button>
    </span>
  );
}

// Structured chat response renderer
function RenderMessage({ text, onLawClick, onQuestionClick }: { text: string; onLawClick: (label: string) => void; onQuestionClick: (q: string) => void }) {
  const lawPillRegex = /(BNS § \d+|BNSS § \d+|BSA § \d+|NI Act § \d+|IT Act § \d+|MV Act § \d+)/g;

  const renderInline = (line: string, keyPrefix: string): React.ReactNode[] => {
    const pillParts = line.split(lawPillRegex);
    const nodes: React.ReactNode[] = [];
    pillParts.forEach((part, pi) => {
      if (lawPillRegex.test(part)) {
        nodes.push(<LawPill key={`${keyPrefix}-pill-${pi}`} label={part} onClick={() => onLawClick(part)} />);
      } else {
        const segments = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|Section \d+[A-Z]?(?:\(\d+\))?(?:,\s*[A-Za-z &,.]+(?:\d{4})?)?)/g);
        segments.forEach((seg, si) => {
          const k = `${keyPrefix}-${pi}-${si}`;
          if (seg.startsWith("**") && seg.endsWith("**")) {
            nodes.push(<strong key={k} style={{ color: "#FFF", fontWeight: 700 }}>{seg.slice(2, -2)}</strong>);
          } else if (seg.startsWith("*") && seg.endsWith("*") && seg.length > 2) {
            nodes.push(<em key={k} style={{ color: "#FFF" }}>{seg.slice(1, -1)}</em>);
          } else if (seg.startsWith("`") && seg.endsWith("`")) {
            nodes.push(<SectionChip key={k} text={seg.slice(1, -1)} onClick={() => onLawClick(seg.slice(1, -1))} />);
          } else if (/^Section \d+/i.test(seg)) {
            nodes.push(<SectionChip key={k} text={seg} onClick={() => onLawClick(seg)} />);
          } else if (seg) {
            nodes.push(<span key={k}>{seg}</span>);
          }
        });
      }
    });
    return nodes;
  };

  const blocks = text.split(/(?=### )/);
  const elements: React.ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const lines = block.trim().split("\n");
    const headingLine = lines[0].trim();
    const contentText = lines.slice(1).join("\n").trim();

    if (headingLine.startsWith("### 🎯 Seedha Jawab")) {
      elements.push(
        <div key={bi} className="glass-panel rounded-2xl p-5 mb-4 shadow-xl border-l-3 border-l-[#E8B86D] text-left">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-[#E8B86D]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8B86D] font-mono-code">✓ Seedha Jawab</span>
          </div>
          <div className="text-[14px] leading-relaxed font-semibold text-stone-100 font-sans-ui">
            {renderInline(contentText, `jawab-${bi}`)}
          </div>
        </div>
      );
    } 
    else if (headingLine.startsWith("### 🚨 Illegal Action Alert") || headingLine.startsWith("### ⚠️")) {
      elements.push(
        <div key={bi} className="bg-red-950/20 border border-red-500/30 border-l-3 border-l-red-500 rounded-2xl p-5 mb-4 shadow-xl text-left">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 font-mono-code">Illegal Action Alert</span>
          </div>
          <div className="text-[13px] leading-relaxed text-stone-100 font-sans-ui">
            {renderInline(contentText, `alert-${bi}`)}
          </div>
        </div>
      );
    } 
    else if (headingLine.startsWith("### 📋 Agle Steps")) {
      const tableLines = contentText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const rows: string[][] = [];
      tableLines.forEach(l => {
        if (l.startsWith("|") && !l.includes("---")) {
          const cells = l.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          rows.push(cells);
        }
      });

      if (rows.length > 1) {
        const headers = rows[0];
        const bodyRows = rows.slice(1);
        elements.push(
          <div key={bi} className="rounded-2xl border border-white/5 bg-[#14100c]/60 p-4 mb-4 text-left">
            <div className="text-[10px] uppercase tracking-widest mb-3.5 text-slate-300 font-mono-code font-bold">Priority Action Steps</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    {headers.map((h, hi) => (
                      <th key={hi} className="pb-2.5 font-bold text-slate-200 font-mono-code">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((r, ri) => (
                    <tr key={ri} className="border-b border-white/5 last:border-0">
                      {r.map((cell, ci) => {
                        if (ci === 0) {
                          const isNow = cell.includes("NOW") || cell.includes("🔴");
                          const isToday = cell.includes("TODAY") || cell.includes("🟡");
                          const badgeBg = isNow ? "rgba(239,68,68,0.15)" : isToday ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)";
                          const badgeColor = isNow ? "#FCA5A5" : isToday ? "#FDE68A" : "#6EE7B7";
                          return (
                            <td key={ci} style={{ padding: "8px 0" }}>
                              <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase font-mono-code" style={{ background: badgeBg, color: badgeColor }}>
                                {cell}
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td key={ci} style={{ padding: "10px 0" }}>
                            <span className="text-slate-100 font-sans-ui">
                              {renderInline(cell, `tbl-${bi}-${ri}-${ci}`)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
    } 
    else if (headingLine.startsWith("### 🔗 Agle Actions")) {
      const links = contentText.split("\n").map(l => l.trim()).filter(l => l.startsWith("-"));
      elements.push(
        <div key={bi} className="my-4 text-left">
          <div className="text-[9px] uppercase tracking-widest mb-2.5 text-slate-300 font-mono-code font-bold">RECOMMENDED ACTIONS</div>
          <div className="flex flex-wrap gap-2.5">
            {links.map((link, li) => {
              const match = link.match(/-\s*\[(.*?)\]\((.*?)\)/);
              if (match) {
                const label = match[1];
                const href = match[2];
                return (
                  <a key={li} href={href} 
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8B86D]/30 hover:border-[#E8B86D]/60 bg-[#E8B86D]/5 hover:bg-[#E8B86D]/10 text-[#E8B86D] text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg font-sans-ui">
                    {label}
                    <ArrowRight size={12} className="text-[#E8B86D]" />
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      );
    } 
    else if (headingLine.startsWith("### 🛡️ Disclaimer")) {
      elements.push(
        <div key={bi} className="rounded-2xl border border-white/5 bg-[#14100c]/40 p-4.5 mt-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={14} className="text-slate-300" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 font-mono-code">AI-Generated Guidance</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-300 font-sans-ui">
            {renderInline(contentText, `disc-${bi}`)}
          </p>
        </div>
      );
    }
    else if (headingLine.startsWith("### ❓ Suggested Questions")) {
      const qs = contentText.split("\n").map(l => l.trim()).filter(l => l.startsWith("-") || l.startsWith("*"));
      elements.push(
        <div key={bi} className="mt-4 border-t border-white/5 pt-3 text-left">
          <div className="text-[9px] uppercase tracking-widest mb-2.5 text-slate-400 font-bold font-mono-code">Follow-up Questions (Click to Ask)</div>
          <div className="flex flex-col gap-2">
            {qs.map((q, qi) => {
              const qText = q.replace(/^[-*]\s*/, "").trim();
              return (
                <button key={qi} onClick={() => onQuestionClick(qText)}
                  className="flex items-center gap-2 text-left text-[12.5px] px-4 py-3 rounded-2xl border border-white/10 hover:border-[#E8B86D]/30 transition-all bg-[#0a0807] hover:bg-[#E8B86D]/5 text-[#E8B86D] font-sans-ui cursor-pointer w-full">
                  <ChevronRight size={12} className="text-[#E8B86D] shrink-0" />
                  <span className="leading-snug">{qText}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    else {
      const blockElements: React.ReactNode[] = [];
      lines.forEach((l, idx) => {
        const rawLine = l.trim();
        if (!rawLine) return;
        
        const numMatch = /^\d+\.\s*(.*)/.exec(rawLine);
        if (numMatch) {
          const numberPart = rawLine.match(/^\d+/)?.[0] || "1";
          const restText = numMatch[1];
          const boldTitleMatch = /^\*\*([^*]+)\*\*[\s-:]*(.*)/.exec(restText);
          if (boldTitleMatch) {
            const titleText = boldTitleMatch[1];
            const bodyText = boldTitleMatch[2];
            blockElements.push(
              <div key={idx} className="flex gap-3 my-4 items-start text-left">
                <span className="text-[#E8B86D] font-bold text-sm mt-0.5">{numberPart}.</span>
                <div>
                  <h4 className="text-white font-bold text-[13.5px] mb-1 font-sans-ui">{titleText}</h4>
                  <p className="text-[13px] text-slate-100 leading-relaxed font-medium font-sans-ui">
                    {renderInline(bodyText, `gen-num-body-${bi}-${idx}`)}
                  </p>
                </div>
              </div>
            );
          } else {
            blockElements.push(
              <div key={idx} className="flex gap-3 my-3 items-start text-left">
                <span className="text-[#E8B86D] font-bold text-sm mt-0.5">{numberPart}.</span>
                <p className="text-[13px] text-slate-100 leading-relaxed font-medium font-sans-ui">
                  {renderInline(restText, `gen-num-body-${bi}-${idx}`)}
                </p>
              </div>
            );
          }
        }
        else if (rawLine.startsWith("### ")) {
          blockElements.push(<div key={idx} className="text-[13px] font-bold mt-4 mb-1 text-white font-sans-ui text-left">{renderInline(rawLine.slice(4), `gen-h3-${bi}-${idx}`)}</div>);
        } else if (rawLine.startsWith("## ")) {
          blockElements.push(<div key={idx} className="text-[14px] font-bold mt-4 mb-2 pb-1 border-b border-white/10 text-white font-sans-ui text-left">{renderInline(rawLine.slice(3), `gen-h2-${bi}-${idx}`)}</div>);
        } else if (rawLine.startsWith("- ") || rawLine.startsWith("• ") || rawLine.startsWith("* ")) {
          blockElements.push(
            <div key={idx} className="flex gap-2.5 items-start my-1.5 ml-1 text-left">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px] bg-[#E8B86D] opacity-60" />
              <span className="text-[13px] leading-relaxed flex-1 flex flex-wrap items-baseline gap-0.5 text-slate-100 font-sans-ui">
                {renderInline(rawLine.slice(2), `gen-ul-${bi}-${idx}`)}
              </span>
            </div>
          );
        } else {
          blockElements.push(
            <p key={idx} className="text-[13px] leading-relaxed my-1.5 flex flex-wrap items-baseline gap-0.5 text-slate-100 font-sans-ui text-left">
              {renderInline(rawLine, `gen-p-${bi}-${idx}`)}
            </p>
          );
        }
      });
      elements.push(<div key={bi} className="flex flex-col gap-0.5">{blockElements}</div>);
    }
  });

  return <div className="flex flex-col gap-1">{elements}</div>;
}

type Msg = { role: "user" | "ai"; text: string; ts: string };
function getTime() { return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }

const THINKING_STEPS = [
  "🔍 Analyzing your situation...",
  "✓ Traffic stop powers — BNSS 2023",
  "✓ Digital document validity — IT Act 2000, MV Act 2019",
  "⏳ Precedent cases — similar seizures",
  "⏳ Local jurisdiction rules & SOPs",
];

function ThinkingIndicator() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % THINKING_STEPS.length), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex gap-3 items-start animate-pulse text-left" style={{ animation: "fadeUp 0.25s ease" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(232,184,109,0.1)", border: "1px solid rgba(232,184,109,0.28)" }}>
        <Brain size={13} className="text-[#E8B86D]" style={{ animation: "spin 3s linear infinite" }} />
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-4 rounded-2xl rounded-bl-sm border glass-panel shadow-lg"
        style={{ minWidth: 280 }}>
        <div className="text-[10px] uppercase tracking-widest text-[#E8B86D] font-mono-code font-bold">Deep Legal Researching...</div>
        <div className="flex flex-col gap-1.5">
          {THINKING_STEPS.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2.5 transition-all" style={{ opacity: idx <= step ? 1 : 0.2 }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: idx < step ? "#10B981" : idx === step ? "#E8B86D" : "rgba(255,255,255,0.15)", transition: "background 0.4s" }} />
              <span className="text-[11.5px] font-mono-code" style={{ color: idx === step ? "#E8B86D" : idx < step ? "#34D399" : "rgba(255,255,255,0.5)" }}>{s}</span>
              {idx < step && <span className="ml-auto text-[9px] text-[#34D399] font-mono-code">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SUGGESTED = [
  { text: "What is the difference between IPC 302 and BNS 2023?", tag: "BNS", color: "#EF4444" },
  { text: "Explain Section 138 of Negotiable Instruments Act", tag: "NI Act", color: "#E8B86D" },
  { text: "What is the BNSS replacement for CrPC?", tag: "BNSS", color: "#3B82F6" },
  { text: "What is BSA 2023 — explain simply", tag: "BSA", color: "#8B5CF6" },
  { text: "What is the procedure after a 498A complaint?", tag: "BNS", color: "#EF4444" },
  { text: "How to file an FIR under BNSS?", tag: "BNSS", color: "#3B82F6" },
];

function Waveform({ active }: { active: boolean }) {
  const bars = [3,7,11,5,13,8,4,10,6,3,9,5,7,4,6];
  return (
    <div className="flex items-end gap-[2.5px] h-6">
      {bars.map((h,i) => <div key={i} className="w-[3px] rounded-full"
        style={{ height: active ? `${h*1.8}px` : "4px", background: "#E8B86D", opacity: active ? 0.75 : 0.3, animation: active ? `waveBar 1.1s ease-in-out ${i*0.07}s infinite alternate` : "none", transition: "height 0.25s ease" }} />)}
    </div>
  );
}

export default function AIVakil() {
  const location = useLocation();
  const initialQueryTriggered = useRef(false);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [bareActSection, setBareActSection] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set initial welcome prompt
  useEffect(() => {
    const greetingText = `### 🎯 Seedha Jawab\nNamaste! Main **AI Vakil** hoon — NyayaSahayak ka bilingual legal companion.\n\nMain aapko simple bhasha mein Indian laws samjhata hoon (Hindi, English ya Hinglish). Koi bhi legal ya property-related sawal poochein, main details fetch karke guide karunga.\n\n### 🔗 Agle Actions\n-[📝 Learn about BNS 2023](/docdraft)\n-[📂 Browse Case Vault](/casevault)`;

    setMsgs([
      { role: "ai", text: greetingText, ts: getTime() }
    ]);
  }, []);

  // Auto-scroll removed as per user preference to stay at current reading position

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    setInput(ta.value);
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message to display
    setMsgs(m => [...m, { role: "user", text, ts: getTime() }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    
    try {
      const response = await apiFetch("/chat/send", {
        method: "POST",
        body: JSON.stringify({ message: text, context_type: "general" }),
      });
      const rawText = response.reply || response.content || "Main is vishay par abhi charcha nahi kar sakta.";
      setMsgs(m => [...m, { role: "ai", text: rawText, ts: getTime() }]);
      setConnectionError(false);
    } catch (err: any) {
      setConnectionError(true);
      setMsgs(m => [...m, { role: "ai", text: `### 🚨 Connection Failed\nNyayaSahayak formal services are currently offline. Please wait or try again another time.`, ts: getTime() }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.state?.query && !initialQueryTriggered.current) {
      initialQueryTriggered.current = true;
      send(location.state.query);
    }
  }, [location.state, send]);

  const toggleRecording = () => {
    if (recording) { if (recognitionRef.current) recognitionRef.current.stop(); setRecording(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported."); return; }
    const rec = new SpeechRecognition();
    rec.continuous = false; rec.interimResults = false; rec.lang = "hi-IN";
    rec.onstart = () => setRecording(true);
    rec.onresult = (e: any) => { const r = e.results[0][0].transcript; if (r) setInput(p => p ? p + " " + r : r); };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec; rec.start();
  };

  const handleLawClick = (label: string) => {
    const key = label.replace(/[\[\]]/g, "").trim();
    setBareActSection(key);
  };

  const bareActData = bareActSection ? (LAW_TOOLTIPS[bareActSection] || {
    full: bareActSection,
    old: "Not mapped / General citation",
    desc: `Details for ${bareActSection}`,
    explanation: `This represents Section details dynamically matched from RAG index. In Indian Courts, this statutory provision establishes standard duties and limits liability for matching complaints. Please consult an advocate for filing procedurals.`
  }) : null;

  const isFirst = msgs.length <= 1;

  return (
    <div className="flex w-full bg-dot-grid text-[#E7E5E4] font-sans-ui overflow-hidden relative ai-vakil-container" style={{ animation: "fadeUp 0.35s ease forwards" }}>
      <style>{`
        .ai-vakil-container {
          height: calc(100vh - 4rem);
        }
        @media (min-width: 1024px) {
          .ai-vakil-container {
            height: calc(100vh - 5rem);
          }
        }
        .bg-dot-grid {
          background-color: #0c0a09;
          background-image: radial-gradient(rgba(232, 184, 109, 0.15) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        .glass-panel {
          background: rgba(20, 16, 13, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(232, 184, 109, 0.15);
        }
        .glass-bubble-ai {
          background: rgba(20, 16, 13, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 3px solid #E8B86D;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .glass-bubble-user {
          background: rgba(232, 184, 109, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(232, 184, 109, 0.2);
        }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(232, 184, 109, 0.2); border-radius: 4px; }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes waveBar {
          from { height: 4px; }
          to { height: 24px; }
        }
        @keyframes pulse2 {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* ✨ AMBIENT GLOWS & WATERMARK */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#E8B86D]/10 to-transparent rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/4 right-1/3 text-[#E8B86D] opacity-[0.02] select-none pointer-events-none font-serif-legal z-0 transform -rotate-12">
        <svg width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
      </div>



      {/* 💬 MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative z-20 min-w-0">
        {/* CHAT HISTORY (Scrollable) */}
        <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 chat-scroll pb-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {connectionError && (
              <div className="bg-red-950/40 border border-red-500/30 p-5 rounded-2xl flex items-center justify-between gap-4 mb-6 relative z-30 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Server Connection Failed</h4>
                    <p className="text-xs text-red-200/80 font-medium">NyayaSahayak formal services are currently offline. Please wait or try again another time.</p>
                  </div>
                </div>
                <button onClick={() => setConnectionError(false)} className="text-xs text-stone-400 hover:text-white bg-transparent border-0 cursor-pointer">✕</button>
              </div>
            )}
            
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`} style={{ animation: "fadeUp 0.28s ease" }}>
                <div className="shrink-0 mt-1">
                  {m.role === "ai" ? (
                    <div className="w-8 h-8 rounded-full bg-[#14100c] border border-[#E8B86D]/40 text-[#E8B86D] flex items-center justify-center shadow-sm text-sm">🤖</div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1a1511] border border-[#E8B86D]/20 text-[#E8B86D] flex items-center justify-center font-bold text-sm">U</div>
                  )}
                </div>
                <div className={`w-full ${m.role === "ai" ? "max-w-[85%]" : "max-w-[80%]"}`}>
                  <div className={m.role === "ai" ? "glass-bubble-ai rounded-2xl rounded-tl-none p-5 md:p-6" : "glass-bubble-user rounded-2xl rounded-tr-none p-4 md:p-5 text-right ml-auto"}>
                    {m.role === "ai" ? (
                      <div>
                        {i === 0 && <span className="text-[10px] font-mono-code text-[#E8B86D] uppercase tracking-widest font-bold block mb-3 text-left">✓ Seedha Jawab</span>}
                        <RenderMessage text={m.text} onLawClick={handleLawClick} onQuestionClick={send} />
                      </div>
                    ) : (
                      <p className="text-[13px] md:text-sm text-[#FBFBFA] font-medium leading-relaxed text-left">{m.text}</p>
                    )}
                  </div>
                  <div className={`text-[9px] px-1 mt-1 font-mono-code text-slate-500 ${m.role === "user" ? "text-right" : "text-left"}`}>{m.ts}</div>
                </div>
              </div>
            ))}

            {isFirst && !loading && (
              <div style={{ animation: "fadeUp 0.4s ease 0.1s both" }} className="pl-12 text-left">
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 font-bold block mb-3">Suggested Questions</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTED.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => send(s.text)}
                      className="bg-[#14100c]/80 hover:bg-[#1a1511] border border-white/10 hover:border-[#E8B86D]/40 p-3.5 rounded-xl text-left transition group shadow-sm flex items-center gap-3 cursor-pointer"
                    >
                      <span className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded border shrink-0"
                        style={{ background: `${s.color}15`, color: s.color, borderColor: `${s.color}30` }}>{s.tag}</span>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition leading-snug">{s.text}</span>
                      <ChevronRight size={11} className="text-slate-500 group-hover:text-[#E8B86D] transition shrink-0 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <div className="pl-12"><ThinkingIndicator /></div>}
          </div>
        </div>

        {/* ⌨️ INPUT BAR (Normal Flow - No overlap) */}
        <div className="px-4 md:px-8 py-5 border-t border-white/5 bg-[#0c0a09]/80 shrink-0 z-40">
          <div className="max-w-6xl mx-auto">
            <div className="glass-panel rounded-2xl p-2 flex items-end gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.8)] border border-[#E8B86D]/20 focus-within:border-[#E8B86D]/50 transition-colors">
              
              <button className="w-10 h-10 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0 mb-0.5 ml-1 bg-transparent border-0 cursor-pointer">
                <span className="text-lg">📎</span>
              </button>

              {recording ? (
                <div className="flex-1 flex items-center gap-3 py-2 px-2">
                  <Waveform active />
                  <span className="text-[10px] font-semibold leading-relaxed ml-auto shrink-0 text-[#F87171] font-mono-code">Recording…</span>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Apna sawal Hindi, English ya Hinglish mein poochein..."
                  rows={1}
                  className="w-full bg-transparent text-[14px] text-white placeholder-slate-500 focus:outline-none resize-none px-2 py-3 custom-scroll font-medium max-h-32 leading-relaxed"
                />
              )}

              <button
                onClick={toggleRecording}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-0.5 bg-transparent border-0 cursor-pointer active:scale-95 transition"
                style={{ background: recording ? "rgba(248,113,113,0.15)" : "transparent" }}
              >
                {recording ? <MicOff size={16} className="text-red-400" /> : <Mic size={16} className="text-slate-400 hover:text-white" />}
              </button>

              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading || recording}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#E8B86D] to-[#D4A853] text-[#0a0807] hover:brightness-110 flex items-center justify-center transition shrink-0 mb-0.5 mr-1 shadow-md border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Brain size={14} className="animate-spin text-[#0a0807]" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
                )}
              </button>
            </div>
            <div className="text-center mt-3">
              <span className="text-[10px] font-mono-code text-slate-500">AI Vakil can make mistakes. Consult a qualified advocate for official representation.</span>
            </div>
          </div>
        </div>

      </main>

      {/* Slide-out Bare Act Details Drawer */}
      {bareActSection && bareActData && (
        <div className="fixed inset-y-0 right-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBareActSection(null)} />
          
          {/* Drawer container */}
          <div className="relative h-full flex flex-col text-left" 
            style={{ 
              width: 390, 
              background: "rgba(10,4,2,0.98)", 
              backdropFilter: "blur(32px)", 
              borderLeft: "1px solid rgba(255,255,255,0.09)", 
              boxShadow: "-15px 0 35px rgba(0,0,0,0.85)",
              animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
            
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <Scale size={15} className="text-[#E8B86D]" />
                <span className="text-[12px] font-bold uppercase tracking-widest text-[#E8B86D] font-mono-code">Bare Act Database</span>
              </div>
              <button 
                onClick={() => setBareActSection(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-transparent border-0 cursor-pointer hover:bg-white/5 text-stone-400 hover:text-white">
                <X size={15} />
              </button>
            </div>
            
            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              {/* Section Header */}
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono-code font-bold bg-[#E8B86D]/15 text-[#E8B86D]">
                  {bareActSection}
                </span>
                <h2 className="text-lg font-bold mt-2 text-white font-sans-ui">{bareActData.full}</h2>
                <div className="text-[11px] text-stone-500 mt-1 font-mono-code">
                  Old Law Code equivalent: <span className="text-stone-300 font-semibold">{bareActData.old}</span>
                </div>
              </div>
 
              {/* Quick Summary Description */}
              <div className="rounded-xl border border-white/6 bg-white/5 p-4.5">
                <span className="text-[9px] uppercase tracking-widest mb-1.5 block text-stone-500 font-mono-code">Statutory Summary</span>
                <p className="text-[12.5px] leading-relaxed text-stone-300 font-sans-ui">
                  {bareActData.desc}
                </p>
              </div>
 
              {/* Complete Bare Act Details */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-widest text-stone-500 font-mono-code">Bare Act Text & Analysis</span>
                <div className="text-[13px] leading-relaxed text-stone-400 whitespace-pre-line bg-stone-950/40 p-4 rounded-xl border border-white/5 font-sans-ui">
                  {bareActData.explanation}
                </div>
              </div>
 
              {/* Case Law Precedent if available */}
              {bareActData.caseTitle && (
                <div className="rounded-xl border border-[#E8B86D]/10 bg-[#E8B86D]/2 p-4">
                  <span className="text-[9px] uppercase tracking-widest mb-1.5 block text-[#E8B86D]/80 font-mono-code">Landmark Case Reference</span>
                  <div className="text-[13px] font-bold text-stone-200 font-sans-ui">{bareActData.caseTitle}</div>
                  <p className="text-[11.5px] text-stone-500 mt-1 leading-relaxed font-sans-ui">
                    Established the definitive guidelines and procedural safeguards required for compliance under this provision.
                  </p>
                </div>
              )}
            </div>
 
            {/* Action Footer */}
            {bareActData.draftType && (
              <div className="p-5 border-t border-white/5">
                <a href="/docdraft" 
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[12px] font-bold uppercase transition-all hover:scale-[1.01] active:scale-95 shadow-xl font-sans-ui bg-[#E8B86D] text-[#0D0604]">
                  📝 Draft {bareActData.draftType}
                  <ArrowRight size={13} className="text-[#0D0604]" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
