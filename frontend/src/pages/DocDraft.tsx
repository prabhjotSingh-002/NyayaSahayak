import { useState, useEffect } from "react";
import { FileText, Sparkles, Download, Copy, Check, Search, Eye, X, HelpCircle, Edit, Brain, ArrowLeft } from "lucide-react";
import { T } from "./tokens";
import { apiFetch } from "../lib/api";

type Tone = "Standard" | "Aggressive" | "Polite";

interface Template {
  id: string; icon: string; title: string; desc: string;
  whenToUse: string;
  sampleText: string;
  highlights: string[];
  placeholderPrompt: string;
  fields: string[]; // named placeholder fields shown to user
}

const backendTemplateMap: Record<string, string> = {
  "rent": "rent_agreement",
  "sale-deed": "sale_deed",
  "legal-notice": "legal_notice",
  "consumer": "consumer_complaint",
  "nda": "nda",
  "employment": "employment_contract",
  "bail": "bail_application"
};

const TEMPLATE_DEFAULTS: Record<string, Record<string, any>> = {
  "rent": {
    "landlord_name": "Ashok Kumar",
    "tenant_name": "Rahul Dev",
    "property_address": "Flat 405, Sector 15, Noida, Uttar Pradesh",
    "monthly_rent": 15000,
    "security_deposit": 45000,
    "lease_start": "2026-08-01",
    "lease_duration_months": 11,
    "state": "Uttar Pradesh"
  },
  "sale-deed": {
    "seller_name": "Ramesh Gupta",
    "buyer_name": "Sunita Sharma",
    "property_address": "House No. 12, Block C, Rohini, New Delhi",
    "sale_amount": 6500000,
    "sale_date": "2026-07-17"
  },
  "legal-notice": {
    "sender_name": "Rohit Mehta",
    "sender_address": "Flat 7B, Sector 62, Noida, Uttar Pradesh",
    "recipient_name": "Bharti Airtel Limited",
    "recipient_address": "Nelson Mandela Road, Vasant Kunj, New Delhi - 110070",
    "subject": "Legal Notice for Deficiency of Service and Unlawful Billing",
    "grievance": "Broadband service vide Account No. 892341 has remained suspended since June 2026, yet unlawful charges are being demanded.",
    "demand": "Refund of ₹4,000 and compensation of ₹10,000 within 15 days",
    "days_to_respond": 15,
    "date": "2026-07-17"
  },
  "consumer": {
    "complainant_name": "Amit Verma",
    "complainant_address": "Flat 7B, Green Valley Apartments, Sector 62, Noida",
    "respondent_name": "Samsung India Electronics Pvt. Ltd.",
    "product_service": "Smart LED Television Model UA55",
    "purchase_date": "2026-01-15",
    "amount": 45000,
    "complaint_details": "Television display panel failed completely within 3 months, and the service center refused warranty repair.",
    "relief_sought": "Refund of ₹45,000 + ₹20,000 compensation + ₹5,000 litigation costs"
  },
  "nda": {
    "party_a_name": "Nexus Tech Solutions",
    "party_a_address": "Sector 63, Noida, Uttar Pradesh",
    "party_b_name": "Aman Malik",
    "party_b_address": "Lajpat Nagar, New Delhi",
    "purpose": "Mobile application development services and source code sharing",
    "duration_years": 3,
    "governing_state": "Uttar Pradesh",
    "date": "2026-07-17"
  },
  "employment": {
    "company_name": "AppVenture Studio",
    "employee_name": "Karan Johar",
    "designation": "Senior Frontend Engineer",
    "start_date": "2026-08-01",
    "ctc": 1200000,
    "probation_months": 3,
    "notice_period": 2,
    "work_location": "Noida"
  }
};

const TEMPLATES: Template[] = [
  {
    id: "rent", icon: "🏠", title: "Rental Agreement",
    desc: "Define terms between landlord & tenant. Covers rent, deposit, maintenance, and lock-in periods.",
    whenToUse: "When renting out or renting a property.",
    highlights: ["ASHOK KUMAR", "RAHUL DEV", "₹15,000", "₹45,000", "Flat 405, Sector 15, Noida, Uttar Pradesh", "1st August 2026", "11 months"],
    fields: ["Landlord Full Name", "Tenant Full Name", "Property Address", "Monthly Rent Amount", "Security Deposit Amount", "Agreement Start Date"],
    placeholderPrompt: "e.g. Landlord is Ramesh Sharma, Tenant is Priya Verma, flat address is C-12 Vasant Kunj Delhi, rent is ₹22,000, deposit ₹66,000, from 1st September 2026 for 11 months.",
    sampleText: `RENTAL AGREEMENT

This Rental Agreement is entered into on 17th July 2026 between:

LANDLORD: ASHOK KUMAR, hereinafter referred to as the "Landlord", and
TENANT: RAHUL DEV, hereinafter referred to as the "Tenant".

1. PREMISES
The Landlord agrees to let out the premises situated at Flat 405, Sector 15, Noida, Uttar Pradesh to the Tenant for residential purposes only.

2. RENT
The monthly rent shall be ₹15,000 (Rupees Fifteen Thousand Only), payable on or before the 5th of each month.

3. SECURITY DEPOSIT
The Tenant has paid a refundable security deposit of ₹45,000 (Rupees Forty-Five Thousand), which shall be returned upon vacating the premises after deductions, if any.

4. TERM
This Agreement shall commence on 1st August 2026 and shall continue for a period of 11 months, subject to renewal.

5. LOCK-IN PERIOD
Neither party shall terminate this Agreement within the first 6 months of commencement.

6. APPLICABLE LAW
This Agreement is governed by the Transfer of Property Act, 1882 and the Indian Contract Act, 1872.

Signature of Landlord: _________________
Signature of Tenant:   _________________
Date: _________________`,
  },
  {
    id: "sale-deed", icon: "📋", title: "Property Sale Deed",
    desc: "Transfer property ownership legally with all required clauses.",
    whenToUse: "When buying or selling immovable property.",
    highlights: ["RAMESH GUPTA", "SUNITA SHARMA", "House No. 12, Block C, Rohini, New Delhi", "₹65,00,000", "17th July 2026"],
    fields: ["Seller Full Name", "Buyer Full Name", "Property Address", "Sale Amount", "Sale Date"],
    placeholderPrompt: "e.g. Seller is Mahesh Patel, buyer is Kavita Jain, property at B-45 Dwarka Sector 6 Delhi, sale price ₹85 Lakhs, sale date 1st August 2026.",
    sampleText: `SALE DEED

This Sale Deed is executed on 17th July 2026 between:

VENDOR: RAMESH GUPTA, S/o Late Shri Mohan Gupta, and
PURCHASER: SUNITA SHARMA, W/o Shri Anil Sharma.

1. PROPERTY
The Vendor hereby sells and transfers to the Purchaser the immovable property described as House No. 12, Block C, Rohini, New Delhi ("the Property").

2. CONSIDERATION
The Purchaser has agreed to purchase the said property for a total consideration of ₹65,00,000 (Rupees Sixty-Five Lakhs Only).

3. TITLE WARRANTY
The Vendor warrants that they hold clear and marketable title to the Property, free from all encumbrances.

4. POSSESSION
Peaceful possession of the Property shall be handed over to the Purchaser on the date of registration.

5. APPLICABLE LAW
This deed is subject to the Transfer of Property Act, 1882 and Registration Act, 1908.

Signature of Vendor:    _________________
Signature of Purchaser: _________________`,
  },
  {
    id: "legal-notice", icon: "📜", title: "Legal Notice",
    desc: "Formal notice for breach, non-payment, or rights violation.",
    whenToUse: "First step before filing a civil or consumer case.",
    highlights: ["ROHIT MEHTA", "BHARTI AIRTEL LIMITED", "₹4,000", "₹10,000", "15 days", "Account No. 892341"],
    fields: ["Your Full Name", "Opposite Party Name & Address", "Nature of Grievance", "Amount Demanded", "Response Deadline"],
    placeholderPrompt: "e.g. My name is Amit Singh. I want to send a legal notice to Jio Broadband for charging ₹6,000 extra on my bill and not restoring service for 2 months. I want ₹15,000 compensation within 30 days.",
    sampleText: `LEGAL NOTICE

To,
BHARTI AIRTEL LIMITED,
Regd. Office: Nelson Mandela Road, Vasant Kunj, New Delhi - 110070.

Date: 17th July 2026

Subject: Legal Notice for Deficiency of Service and Unlawful Billing.

Sir/Ma'am,

Under instructions from and on behalf of my client, ROHIT MEHTA, I hereby serve the following legal notice upon you:

1. FACTS OF THE CASE
My client availed broadband services vide Account No. 892341. Since June 2026, the internet service remained completely suspended, yet unlawful charges of ₹4,000 were raised and demanded.

2. LEGAL BASIS
The aforesaid acts constitute a grave deficiency of service under Sections 2(11) and 35 of the Consumer Protection Act, 2019.

3. DEMAND
You are hereby called upon to refund ₹4,000 and pay compensation of ₹10,000 within 15 days of receipt of this notice, failing which my client shall initiate legal proceedings at your risk, cost, and consequences.

Advocate for the Noticee
(Sign here)`,
  },
  {
    id: "consumer", icon: "🏛️", title: "Consumer Complaint",
    desc: "Complaint to Consumer Disputes Redressal Commission under Consumer Protection Act 2019.",
    whenToUse: "When a product/service caused deficiency or unfair trade practice.",
    highlights: ["AMIT VERMA", "SAMSUNG INDIA ELECTRONICS PVT. LTD.", "₹45,000", "Sector 62, Noida", "15th January 2026"],
    fields: ["Complainant Name & Address", "Respondent Company Name", "Product/Service Details", "Amount Paid", "Relief Sought"],
    placeholderPrompt: "e.g. My name is Rakesh Kumar, Noida Sector 18. I bought a washing machine from LG for ₹38,000 on 10 March 2026. It stopped working within 1 month and the service centre refused warranty repair. I want full refund.",
    sampleText: `BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION
GAUTAM BUDDH NAGAR, UTTAR PRADESH

Complaint Case No.: ___/2026

IN THE MATTER OF:

AMIT VERMA,
Residing at: Flat 7B, Green Valley Apartments, Sector 62, Noida
...COMPLAINANT

VERSUS

SAMSUNG INDIA ELECTRONICS PVT. LTD.,
Regd. Office: 6th Floor, DLF Centre, Sansad Marg, New Delhi
...RESPONDENT

COMPLAINT UNDER CONSUMER PROTECTION ACT, 2019

1. The Complainant purchased a Smart LED Television Model UA55 from the Respondent on 15th January 2026 for a total consideration of ₹45,000.

2. Within 3 months of purchase, the television display panel failed completely. Despite a valid manufacturer warranty, the Respondent's service centre refused to repair or replace the product.

3. The aforesaid acts constitute deficiency of service under Section 2(11) of the Consumer Protection Act, 2019.

PRAYER: Refund of ₹45,000 + ₹20,000 compensation + ₹5,000 litigation costs.

Complainant's Signature: _________________`,
  },
  {
    id: "nda", icon: "🤫", title: "Non-Disclosure Agreement",
    desc: "Mutual or one-sided NDA for business or employment contexts.",
    whenToUse: "Before sharing sensitive business information.",
    highlights: ["NEXUS TECH SOLUTIONS", "AMAN MALIK", "3 years", "17th July 2026"],
    fields: ["Disclosing Party Name", "Receiving Party Name & Role", "Purpose of Disclosure", "Confidentiality Duration"],
    placeholderPrompt: "e.g. My startup AppVenture is sharing source code with a freelancer Ravi Khanna. Duration 2 years. Purpose: mobile app development project.",
    sampleText: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of 17th July 2026 between:

DISCLOSING PARTY: NEXUS TECH SOLUTIONS, and
RECEIVING PARTY: AMAN MALIK ("Consultant").

1. CONFIDENTIAL INFORMATION
"Confidential Information" means all technical, financial, business, and strategic information disclosed by the Disclosing Party.

2. OBLIGATIONS
The Receiving Party shall: (a) hold all Confidential Information in strict confidence; (b) not disclose it to third parties; (c) use it solely for the agreed project purpose.

3. TERM
This Agreement shall remain in force for a period of 3 years from the date of execution.

4. GOVERNING LAW
This Agreement shall be governed by the Indian Contract Act, 1872.

Signature of Disclosing Party: _________________
Signature of Receiving Party:  _________________`,
  },
  {
    id: "employment", icon: "💼", title: "Employment Agreement",
    desc: "Full employment contract covering designation, salary, leave, IP assignment, and termination.",
    whenToUse: "When hiring a full-time employee.",
    highlights: ["APPVENTURE STUDIO", "KARAN JOHAR", "₹12,00,000", "Noida", "Senior Frontend Engineer", "2 months"],
    fields: ["Company Name & Address", "Employee Full Name", "Designation", "Annual CTC", "Notice Period", "Joining Date"],
    placeholderPrompt: "e.g. Company is TechBridge Solutions Pvt Ltd, Bangalore. Employee is Neha Bahl joining as Backend Developer at 18 LPA. Notice period 3 months. Joining 1 August 2026.",
    sampleText: `EMPLOYMENT AGREEMENT

This Employment Agreement is made on 17th July 2026 between:

EMPLOYER: APPVENTURE STUDIO, having its registered office at Sector 63, Noida, Uttar Pradesh, and
EMPLOYEE: KARAN JOHAR, hereinafter referred to as "Employee".

1. DESIGNATION & ROLE
The Employee is appointed as Senior Frontend Engineer at the Employer's Noida office.

2. COMPENSATION
The Employee shall receive a fixed CTC of ₹12,00,000 per annum, payable monthly.

3. PROBATION PERIOD
The Employee shall be on probation for 3 months, during which either party may terminate without notice.

4. NOTICE PERIOD
After confirmation, either party may terminate this Agreement by giving 2 months written notice.

5. INTELLECTUAL PROPERTY
All work products created during employment shall vest exclusively with the Employer.

Signature of Employer:  _________________
Signature of Employee:  _________________`,
  }
];

/* ── Highlighted text renderer ── */
function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return <>{text}</>;
  const escaped = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        highlights.includes(part) ? (
          <mark key={i} style={{
            background: "rgba(232,184,109,0.22)",
            color: T.gold,
            padding: "1px 4px",
            borderRadius: "4px",
            fontWeight: 700,
            border: "1px solid rgba(232,184,109,0.4)",
          }}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ── Template Card ── */
function TemplateCard({ t, onSelect }: { t: Template; onSelect: () => void }) {
  const iconBg: Record<string, string> = {
    "🏠": "bg-blue-500/10 border-blue-500/20",
    "📋": "bg-amber-500/10 border-amber-500/20",
    "📜": "bg-red-500/10 border-red-500/20",
    "🏛️": "bg-emerald-500/10 border-emerald-500/20",
    "🤫": "bg-purple-500/10 border-purple-500/20",
    "💼": "bg-orange-500/10 border-orange-500/20",
  };
  return (
    <div
      onClick={onSelect}
      className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between group transition cursor-pointer text-left border"
    >
      <div>
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shadow-inner mb-4 ${iconBg[t.icon] || "bg-[#14100c]/60 border-[#E8B86D]/20"}`}>
          {t.icon}
        </div>
        <h3 className="font-serif-legal text-lg font-bold text-white group-hover:text-[#E8B86D] transition mb-2">{t.title}</h3>
        <p className="text-[12px] text-slate-300 font-medium leading-relaxed mb-4">{t.desc}</p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-[10px] font-mono-code text-slate-500 italic">Best for: {t.whenToUse}</span>
        <span className="text-[11px] font-bold text-[#E8B86D] group-hover:underline">Draft →</span>
      </div>
    </div>
  );
}

/* ── Preview + Details Entry Screen (Templates) ── */
function PreviewPromptView({
  template,
  backendTemplate,
  loadingSchema,
  fields,
  setFields,
  extraInfo,
  setExtraInfo,
  tone,
  setTone,
  onGenerate,
  onBack,
}: {
  template: Template;
  backendTemplate: any;
  loadingSchema: boolean;
  fields: Record<string, any>;
  setFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  extraInfo: string;
  setExtraInfo: (s: string) => void;
  tone: Tone;
  setTone: (t: Tone) => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* 🔝 BREADCRUMBS */}
      <header className="flex items-center justify-between pb-2 border-b border-[#E8B86D]/15 mb-6">
        <div className="flex items-center gap-3 text-[13px] font-mono-code font-semibold">
          <button onClick={onBack} className="bg-transparent border-0 text-slate-400 hover:text-[#E8B86D] transition flex items-center gap-1.5 cursor-pointer">
            <span>←</span> Back to Templates
          </button>
        </div>
        <span className="bg-[#14100c] border border-[#E8B86D]/30 text-[#E8B86D] text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold shadow-sm">
          {template.title}
        </span>
      </header>

      {/* 📝 FORM WIZARD */}
      <div className="max-w-3xl mx-auto">
        <div className="glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden group text-left">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/40 to-transparent"></div>
          
          <div className="mb-8">
            <span className="text-xs font-mono-code uppercase tracking-wider text-[#E8B86D] font-bold flex items-center gap-2 mb-2">
              <span>📝</span> PERSONALIZE DOCUMENT DETAILS
            </span>
            <p className="text-[13px] text-slate-300 font-medium">Fill in the core parameters. AI will automatically format them into legally binding clauses.</p>
          </div>

          {loadingSchema ? (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: T.gold }} />
              <span className="text-xs text-stone-400 font-mono-code tracking-wide animate-pulse">Loading form fields...</span>
            </div>
          ) : backendTemplate ? (
            <div className="space-y-6">
              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {backendTemplate.fields.map((f: any) => {
                  const isTextArea = f.type === "textarea";
                  return (
                    <div key={f.key} className={`space-y-2 ${isTextArea ? "md:col-span-2" : ""}`}>
                      <label className="text-xs font-bold text-slate-200 ml-1">
                        {f.label} {f.required && <span className="text-red-400">*</span>}
                      </label>
                      {isTextArea ? (
                        <textarea
                          value={fields[f.key] || ""}
                          onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                          rows={3}
                          placeholder={`e.g. ${f.description || "details"}`}
                          className="w-full bg-[#0c0a09]/80 border border-white/10 hover:border-white/20 focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:outline-none resize-none leading-relaxed"
                        />
                      ) : (
                        <input
                          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                          value={fields[f.key] || ""}
                          onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={`e.g. ${f.description || ""}`}
                          className="w-full bg-[#0c0a09]/80 border border-white/10 hover:border-white/20 focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:outline-none [color-scheme:dark]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Additional Custom Instructions */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-xs font-bold text-[#E8B86D] ml-1 flex items-center gap-2">
                  <span>✨</span> Additional Custom Instructions (Optional)
                </label>
                <textarea
                  value={extraInfo}
                  onChange={e => setExtraInfo(e.target.value)}
                  rows={3}
                  placeholder="e.g. Mention that landlord has a pet dog. Add a clause that rent must be paid on the 10th of every month..."
                  className="w-full bg-[#0c0a09]/80 border border-dashed border-[#E8B86D]/40 focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:outline-none resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 font-mono-code ml-1 mt-1">Provide any specific scenarios you want the AI to weave into the document.</p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-red-400 font-mono-code text-xs">Failed to load form fields. Please try again.</div>
          )}

          {/* Tone & Actions */}
          <div className="pt-6 mt-6 border-t border-[#E8B86D]/15 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex bg-[#0c0a09] border border-white/10 rounded-xl p-1 w-full md:w-auto">
              {(["Standard", "Aggressive", "Polite"] as Tone[]).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTone(t)}
                  className="flex-1 md:flex-none px-5 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer border-0"
                  style={{
                    background: tone === t ? (t === "Aggressive" ? "rgba(239,68,68,0.12)" : t === "Polite" ? "rgba(16,185,129,0.10)" : "rgba(232,184,109,0.15)") : "transparent",
                    color: tone === t ? (t === "Aggressive" ? "#FCA5A5" : t === "Polite" ? "#6EE7B7" : T.gold) : T.textDim,
                    fontFamily: T.sans,
                    border: tone === t ? `1px solid ${t === "Aggressive" ? "rgba(248,113,113,0.3)" : t === "Polite" ? "rgba(52,211,153,0.3)" : "rgba(232,184,109,0.3)"}` : "1px solid transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <button
                type="button"
                onClick={() => {
                  const defaults = TEMPLATE_DEFAULTS[template.id] || {};
                  setFields(defaults);
                }}
                className="flex-1 md:flex-none bg-transparent hover:bg-white/5 text-slate-300 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Skip & Use Defaults
              </button>
              <button
                type="button"
                onClick={onGenerate}
                className="flex-1 md:flex-none bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0a0807] font-bold px-6 py-2.5 rounded-xl text-xs shadow-[0_4px_15px_rgba(232,184,109,0.25)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <span>⚡</span> Generate Document
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function CustomPersonalizeView({
  situation,
  setSituation,
  analysisResult,
  fields,
  setFields,
  tone,
  setTone,
  onGenerate,
  onBack,
}: {
  situation: string;
  setSituation: (s: string) => void;
  analysisResult: { document_type: string; explanation: string; fields: any[] };
  fields: Record<string, any>;
  setFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  tone: Tone;
  setTone: (t: Tone) => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* 🔝 BREADCRUMBS */}
      <header className="flex items-center justify-between pb-2 border-b border-[#E8B86D]/15 mb-6">
        <div className="flex items-center gap-3 text-[13px] font-mono-code font-semibold">
          <button onClick={onBack} className="bg-transparent border-0 text-slate-400 hover:text-[#E8B86D] transition flex items-center gap-1.5 cursor-pointer">
            <span>←</span> Back to Editor
          </button>
        </div>
        <span className="bg-[#14100c] border border-[#E8B86D]/30 text-[#E8B86D] text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold shadow-sm">
          Custom Document
        </span>
      </header>

      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* TOP: AI Document Detection Banner */}
        <div className="glass-panel rounded-3xl p-6 border-t-2 border-t-[#E8B86D]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div className="flex-1">
            <div className="text-[10px] font-bold tracking-widest mb-1.5 text-slate-400 font-mono-code">AI DOCUMENT DETECTION</div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
              <FileText size={18} style={{ color: T.gold }} />
              {analysisResult.document_type}
            </h2>
            <p className="text-[12.5px] leading-relaxed text-stone-300 font-medium">
              {analysisResult.explanation}
            </p>
          </div>
          <div className="shrink-0 self-start md:self-center">
            <span className="text-[9px] px-3 py-1 rounded-full bg-[#E8B86D]/10 border border-[#E8B86D]/30 text-[#E8B86D] font-mono-code font-bold">STAGE 2</span>
          </div>
        </div>

        {/* BOTTOM: Form Card */}
        <div className="glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden group text-left">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/40 to-transparent"></div>
          
          {/* Situation Box (Review & Edit) */}
          <div className="space-y-2 pb-6 border-b border-white/5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono-code">
              Your Situation
            </label>
            <textarea
              value={situation}
              onChange={e => setSituation(e.target.value)}
              rows={3}
              placeholder="Describe your situation here..."
              className="w-full bg-[#0c0a09]/80 border border-white/10 hover:border-white/20 focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:outline-none resize-none leading-relaxed"
            />
            <span className="text-[9.5px] text-slate-500 leading-normal font-mono-code block mt-1">Feel free to refine the situation description; the fields below can be dynamically regenerated if you go back and re-analyze.</span>
          </div>

          {/* Identified Fields */}
          <div className="pt-6">
            <span className="text-xs font-mono-code uppercase tracking-wider text-[#E8B86D] font-bold flex items-center gap-2 mb-4">
              <span>⚡</span> PERSONALIZE IDENTIFIED DETAILS (OPTIONAL)
            </span>

            {analysisResult.fields && analysisResult.fields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysisResult.fields.map((f: any) => {
                  const isTextArea = f.type === "textarea" || 
                                      f.key.toLowerCase().includes("address") || 
                                      f.key.toLowerCase().includes("detail") || 
                                      f.key.toLowerCase().includes("circumstance") || 
                                      f.key.toLowerCase().includes("ground") ||
                                      f.key.toLowerCase().includes("reason");
                  return (
                    <div key={f.key} className={`space-y-2 ${isTextArea ? "md:col-span-2" : ""}`}>
                      <label className="text-xs font-bold text-slate-200 ml-1">
                        {f.label} {f.required && <span className="text-red-400">*</span>}
                      </label>
                      {isTextArea ? (
                        <textarea
                          value={fields[f.key] || ""}
                          onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                          rows={3}
                          placeholder={`Enter ${f.label.toLowerCase()}...`}
                          className="w-full bg-[#0c0a09]/80 border border-white/10 hover:border-white/20 focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:outline-none resize-none leading-relaxed"
                        />
                      ) : (
                        <input
                          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                          value={fields[f.key] || ""}
                          onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={`Enter ${f.label.toLowerCase()}...`}
                          className="w-full bg-[#0c0a09]/80 border border-white/10 hover:border-white/20 focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:outline-none [color-scheme:dark]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl bg-[#0c0a09]/40 font-mono-code">
                No extra fields identified. AI will draft using the situation details directly.
              </div>
            )}
          </div>

          {/* Tone & Actions */}
          <div className="pt-6 mt-6 border-t border-[#E8B86D]/15 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex bg-[#0c0a09] border border-white/10 rounded-xl p-1 w-full md:w-auto">
              {(["Standard", "Aggressive", "Polite"] as Tone[]).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTone(t)}
                  className="flex-1 md:flex-none px-5 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer border-0"
                  style={{
                    background: tone === t ? (t === "Aggressive" ? "rgba(239,68,68,0.12)" : t === "Polite" ? "rgba(16,185,129,0.10)" : "rgba(232,184,109,0.15)") : "transparent",
                    color: tone === t ? (t === "Aggressive" ? "#FCA5A5" : t === "Polite" ? "#6EE7B7" : T.gold) : T.textDim,
                    fontFamily: T.sans,
                    border: tone === t ? `1px solid ${t === "Aggressive" ? "rgba(248,113,113,0.3)" : t === "Polite" ? "rgba(52,211,153,0.3)" : "rgba(232,184,109,0.3)"}` : "1px solid transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <button
                type="button"
                onClick={() => {
                  const defaults: Record<string, any> = {};
                  if (analysisResult && analysisResult.fields) {
                    analysisResult.fields.forEach((f: any) => {
                      defaults[f.key] = f.default_value || "";
                    });
                  }
                  setFields(defaults);
                }}
                className="flex-1 md:flex-none bg-transparent hover:bg-white/5 text-slate-300 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Skip & Use Defaults
              </button>
              <button
                type="button"
                onClick={onGenerate}
                className="flex-1 md:flex-none bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0a0807] font-bold px-6 py-2.5 rounded-xl text-xs shadow-[0_4px_15px_rgba(232,184,109,0.25)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <span>⚡</span> Generate Document
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Generate View ── */
function GenerateView({
  template,
  tone,
  situation,
  fields,
  extraInfo,
  onBack
}: {
  template: Template | null;
  tone: Tone;
  situation: string;
  fields?: Record<string, any>;
  extraInfo?: string;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [docText, setDocText] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [refinement, setRefinement] = useState("");
  const [currentSituation, setCurrentSituation] = useState(situation);

  const title = template ? template.title : "Custom Legal Document";

  const generate = async (promptText: string, latestFields?: Record<string, any>, refinementText?: string) => {
    setLoading(true);
    try {
      const toneMap = { "Standard": "assertive", "Aggressive": "aggressive", "Polite": "polite" };
      let response;
      if (template) {
        // Template flow
        const bId = backendTemplateMap[template.id] || template.id;
        // Build extra_info: combine the original extraInfo + refinement + current doc context
        let combinedExtra = extraInfo || "";
        if (refinementText) {
          combinedExtra += `\n\nUSER REVISION REQUEST: ${refinementText}`;
        }
        if (refinementText && docText) {
          combinedExtra += `\n\nEXISTING DOCUMENT TO REVISE (keep all original details, only apply the revision request above):\n${docText}`;
        }
        response = await apiFetch("/drafting/generate", {
          method: "POST",
          body: JSON.stringify({
            template_id: bId,
            fields: latestFields || fields || {},
            extra_info: combinedExtra,
            tone: toneMap[tone] || "assertive",
            language: "en"
          }),
        });
      } else {
        // Custom flow
        let combinedSituation = promptText;
        if (refinementText && docText) {
          combinedSituation = `EXISTING DOCUMENT TO REVISE:\n${docText}\n\nORIGINAL SITUATION:\n${promptText}\n\nUSER REVISION REQUEST (apply only these changes, keep all other details from the existing document):\n${refinementText}`;
        }
        response = await apiFetch("/drafting/custom", {
          method: "POST",
          body: JSON.stringify({
            situation: combinedSituation,
            user_inputs: latestFields || fields || {},
            tone: toneMap[tone] || "assertive",
            language: "en"
          }),
        });
      }
      setDocText(response.document_text || "Failed to generate document.");
      setAiNotes(response.ai_notes || "");
    } catch (e) {
      console.error(e);
      setDocText("Connection to server failed. NyayaSahayak formal services are currently offline. Please wait or try again another time.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { generate(currentSituation); }, []);

  const handleRefine = () => {
    if (!refinement.trim() || loading) return;
    const ref = refinement.trim();
    setRefinement("");
    generate(currentSituation, undefined, ref);
  };

  return (
    <div style={{ animation: "fadeUp 0.3s ease forwards" }}>
      {/* 🔝 BREADCRUMBS */}
      <header className="flex items-center justify-between pb-2 border-b border-[#E8B86D]/15 mb-6">
        <div className="flex items-center gap-3 text-[13px] font-mono-code font-semibold">
          <button onClick={onBack} className="bg-transparent border-0 text-slate-400 hover:text-[#E8B86D] transition flex items-center gap-1.5 cursor-pointer">
            <span>←</span> Back
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-white">{title}</span>
          <span className="bg-[#14100c] border border-[#E8B86D]/30 text-[#E8B86D] text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ml-1">{tone}</span>
        </div>
      </header>

      {/* 📄 SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Document editor panel */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-2 flex flex-col h-[80vh] shadow-2xl relative overflow-hidden border-[#E8B86D]/30 text-left">
          
          {/* Editor Action Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#14100c]/60 rounded-t-2xl">
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold">Document Preview</span>
            {!loading && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(docText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : "📋"}
                  {copied ? "Copied!" : "Copy Text"}
                </button>
                <button
                  onClick={() => {
                    const escaped = docText
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;');

                    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.75;
      color: #000;
      background: #fff;
      padding: 22mm 18mm 22mm 18mm;
      margin: 0;
      box-sizing: border-box;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.75;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body><pre>${escaped}</pre></body>
</html>`;

                    const iframe = document.createElement('iframe');
                    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;border:none;opacity:0;';
                    document.body.appendChild(iframe);

                    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!iDoc) return;
                    iDoc.open();
                    iDoc.write(html);
                    iDoc.close();

                    setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => {
                        if (document.body.contains(iframe)) document.body.removeChild(iframe);
                      }, 3000);
                    }, 300);
                  }}
                  className="bg-gradient-to-r from-[#E8B86D] to-[#C68A2C] text-[#0a0807] font-bold px-4 py-1.5 rounded-lg text-xs shadow-md hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer border-0"
                >
                  📄 Download PDF
                </button>
              </div>
            )}
          </div>

          {/* The "Paper" Container */}
          <div className="flex-1 overflow-y-auto doc-scroll bg-[#0e0c0b] p-8 md:p-12 text-[#E7E5E4] selection:bg-[#E8B86D] selection:text-[#0a0807]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-36 gap-4">
                <Brain size={36} className="animate-spin text-[#E8B86D]" />
                <div className="text-center text-xs text-slate-400 font-mono-code tracking-wide animate-pulse">
                  Compiling your personalized legal document…
                </div>
              </div>
            ) : (
              <pre className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-stone-100 font-serif-legal"
                style={{ wordBreak: "break-word" }}>{docText}</pre>
            )}
          </div>
        </div>

        {/* ⚙️ RIGHT: AI REFINEMENT & STATUTES (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 text-left">
          
          {/* AI Refine Box */}
          <div className="glass-panel rounded-2xl p-5 border-t-2 border-t-[#E8B86D]">
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold block mb-3 flex items-center gap-2">
              <span>✨</span> ADD DETAILS & REFINE
            </span>
            <p className="text-[11px] text-slate-300 font-medium mb-3">Type any corrections or extra details to update the draft.</p>
            
            <div className="bg-[#0c0a09]/80 border border-dashed border-[#E8B86D]/40 focus-within:border-[#E8B86D]/80 rounded-xl p-1 mb-3 transition">
              <textarea
                value={refinement}
                onChange={e => setRefinement(e.target.value)}
                rows={3}
                placeholder="e.g. Change rent to ₹18,000. Add pet-friendly clause..."
                className="w-full bg-transparent text-[13px] text-white placeholder-slate-500 focus:outline-none resize-none px-3 py-2 custom-scroll font-medium leading-relaxed"
              />
            </div>
            
            <button
              onClick={handleRefine}
              disabled={!refinement.trim() || loading}
              className="w-full bg-[#14100c] hover:bg-[#1a1511] text-white border border-white/10 hover:border-[#E8B86D]/30 py-2.5 rounded-xl text-[11px] font-mono-code font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⚡ REGENERATE WITH DETAILS
            </button>
          </div>

          {/* Legal Notes & Statutes */}
          {aiNotes && (
            <div className="glass-panel rounded-2xl p-5">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 font-bold block mb-4 flex items-center gap-2">
                <span>⚖️</span> STATUTES & LEGAL NOTES
              </span>
              
              <div className="space-y-4 relative">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-[#E8B86D]/15"></div>
                
                {(() => {
                  const raw = aiNotes
                    .replace(/(\. )(\d+\.\s+[A-Z])/g, '.\n$2')
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0);

                  return raw.map((line, idx) => {
                    const match = /^\d+\.\s*(.*?):\s*(.+)/.exec(line);
                    if (match) {
                      return (
                        <div key={idx} className="relative pl-8">
                          <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-[#1a1511] border border-[#E8B86D]/40 text-[#E8B86D] flex items-center justify-center font-mono-code text-[9px] font-bold z-10">
                            {idx + 1}
                          </div>
                          <h4 className="text-[11px] font-mono-code font-bold text-white mb-1 uppercase">{match[1]}</h4>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{match[2]}</p>
                        </div>
                      );
                    }
                    const matchSimple = /^\d+\.\s*(.+)/.exec(line);
                    if (matchSimple) {
                      return (
                        <div key={idx} className="relative pl-8">
                          <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-[#1a1511] border border-[#E8B86D]/40 text-[#E8B86D] flex items-center justify-center font-mono-code text-[9px] font-bold z-10">
                            {idx + 1}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{matchSimple[1]}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.gold }} />
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{line}</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

/* ── Main Component ── */
export default function DocDraft() {
  const [tone, setTone] = useState<Tone>("Standard");
  const [situation, setSituation] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generateTemplate, setGenerateTemplate] = useState<Template | null>(null);
  const [generateFromSituation, setGenerateFromSituation] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Custom Generator analysis and states
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  // Template Form States
  const [templateFields, setTemplateFields] = useState<Record<string, any>>({});
  const [templateExtraInfo, setTemplateExtraInfo] = useState("");
  const [backendTemplate, setBackendTemplate] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  const filtered = TEMPLATES.filter(t =>
    search === "" || t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
  );

  // Fetch backend template schema on template select
  useEffect(() => {
    if (selectedTemplate) {
      const fetchSchema = async () => {
        setLoadingSchema(true);
        setConnectionError(false);
        try {
          const bId = backendTemplateMap[selectedTemplate.id] || selectedTemplate.id;
          const data = await apiFetch(`/drafting/templates/${bId}`);
          setBackendTemplate(data);
          // Initialize template fields
          const initialFields: Record<string, any> = {};
          if (data && data.fields) {
            data.fields.forEach((f: any) => {
              initialFields[f.key] = "";
            });
          }
          setTemplateFields(initialFields);
          setTemplateExtraInfo("");
        } catch (e) {
          console.error("Failed to fetch template schema", e);
          setConnectionError(true);
        } finally {
          setLoadingSchema(false);
        }
      };
      fetchSchema();
    } else {
      setBackendTemplate(null);
      setTemplateFields({});
      setTemplateExtraInfo("");
    }
  }, [selectedTemplate]);

  // Handle situation analysis for Custom flow
  const handleAnalyzeSituation = async () => {
    if (!situation.trim()) return;
    setLoadingAnalysis(true);
    setConnectionError(false);
    try {
      const response = await apiFetch("/drafting/analyze-situation", {
        method: "POST",
        body: JSON.stringify({ situation }),
      });
      setAnalysisResult(response);
      // Initialize fields detected
      const initialFields: Record<string, any> = {};
      if (response && response.fields) {
        response.fields.forEach((f: any) => {
          initialFields[f.key] = "";
        });
      }
      setCustomFields(initialFields);
    } catch (e) {
      console.error("Analysis failed, using fallback custom view", e);
      setConnectionError(true);
      setAnalysisResult({
        document_type: "Custom Legal Document",
        explanation: "To personalize your document, please verify details below.",
        fields: [
          {"key": "party_a", "label": "Your Full Name", "type": "text", "description": "Your full name", "required": false},
          {"key": "party_b", "label": "Opposite Party Name", "type": "text", "description": "Opposite party name", "required": false},
          {"key": "date", "label": "Relevant Date", "type": "date", "description": "Relevant date", "required": false}
        ]
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Determine active view content
  let content;
  if (loadingAnalysis) {
    content = (
      <div className="py-20 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl bg-[#E8B86D]/10 border border-[#E8B86D]/30 flex items-center justify-center shadow-lg">
            <Brain size={32} className="animate-spin text-[#E8B86D]" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 animate-ping opacity-75"></div>
        </div>
        <h2 className="text-xl font-serif-legal font-bold text-[#E8B86D] tracking-wider mb-3">ANALYZING YOUR SITUATION...</h2>
        <p className="text-xs text-slate-400 leading-relaxed font-sans-ui">
          AI is identifying the appropriate legal document type and determining the critical personalization details required for drafting.
        </p>
      </div>
    );
  } else if (generateTemplate || generateFromSituation) {
    content = (
      <GenerateView
        template={generateTemplate}
        tone={tone}
        situation={situation}
        fields={generateTemplate ? templateFields : customFields}
        extraInfo={generateTemplate ? templateExtraInfo : undefined}
        onBack={() => {
          setGenerateTemplate(null);
          setGenerateFromSituation(false);
          setSituation("");
          setSelectedTemplate(null);
          setAnalysisResult(null);
        }}
      />
    );
  } else if (analysisResult) {
    content = (
      <CustomPersonalizeView
        situation={situation}
        setSituation={setSituation}
        analysisResult={analysisResult}
        fields={customFields}
        setFields={setCustomFields}
        tone={tone}
        setTone={setTone}
        onBack={() => setAnalysisResult(null)}
        onGenerate={() => setGenerateFromSituation(true)}
      />
    );
  } else if (selectedTemplate) {
    content = (
      <PreviewPromptView
        template={selectedTemplate}
        backendTemplate={backendTemplate}
        loadingSchema={loadingSchema}
        fields={templateFields}
        setFields={setTemplateFields}
        extraInfo={templateExtraInfo}
        setExtraInfo={setTemplateExtraInfo}
        tone={tone}
        setTone={setTone}
        onBack={() => setSelectedTemplate(null)}
        onGenerate={() => setGenerateTemplate(selectedTemplate)}
      />
    );
  } else {
    /* Main Gallery */
    content = (
      <div style={{ animation: "fadeUp 0.35s ease forwards" }} className="space-y-8">
        
        {/* 🔝 PAGE HEADER */}
        <header className="border-b border-[#E8B86D]/15 pb-6 text-left">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl drop-shadow-[0_0_10px_rgba(232,184,109,0.5)]">📝</span>
            <h1 className="font-serif-legal text-3xl md:text-4xl font-bold text-[#FBFBFA] tracking-wide">DocDraft</h1>
          </div>
          <p className="text-[13px] text-slate-300 font-medium">Generate legally sound, highly-formatted Indian documents in minutes with AI.</p>
        </header>

        {/* 🤖 AI CUSTOM DOCUMENT GENERATOR CONSOLE */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden group text-left">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8B86D]/40 to-transparent"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1 font-sans-ui">
                <span>✨</span> Custom Document Generator
                <span className="bg-[#E8B86D]/10 border border-[#E8B86D]/30 text-[#E8B86D] text-[9px] font-mono-code px-2 py-0.5 rounded-full uppercase tracking-wider">AI-Powered</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Describe your situation in Hindi, Hinglish, or English. AI will draft the matching legal document.</p>
            </div>
          </div>

          {/* Textarea Console */}
          <div className="bg-[#0c0a09]/80 border border-white/10 focus-within:border-[#E8B86D]/50 rounded-2xl p-2 transition shadow-inner mb-5">
            <textarea
              value={situation}
              onChange={e => setSituation(e.target.value)}
              rows={3}
              placeholder="e.g. My employer has not paid salary for 3 months. Write a legal notice demanding payment of ₹1.5 Lakh..."
              className="w-full bg-transparent text-[13px] text-white placeholder-slate-500 focus:outline-none resize-none px-3 py-3 custom-scroll font-medium leading-relaxed"
            />
          </div>

          {/* Controls & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E8B86D]/10">
            
            {/* Tone Selectors (Segmented Control) */}
            <div className="flex bg-[#0c0a09] border border-white/10 rounded-xl p-1 w-full sm:w-auto">
              {(["Standard", "Aggressive", "Polite"] as Tone[]).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTone(t)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer border-0"
                  style={{
                    background: tone === t ? (t === "Aggressive" ? "rgba(239,68,68,0.12)" : t === "Polite" ? "rgba(16,185,129,0.10)" : "rgba(232,184,109,0.15)") : "transparent",
                    color: tone === t ? (t === "Aggressive" ? "#FCA5A5" : t === "Polite" ? "#6EE7B7" : T.gold) : T.textDim,
                    fontFamily: T.sans,
                    border: tone === t ? `1px solid ${t === "Aggressive" ? "rgba(248,113,113,0.3)" : t === "Polite" ? "rgba(52,211,153,0.3)" : "rgba(232,184,109,0.3)"}` : "1px solid transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyzeSituation}
              disabled={!situation.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0a0807] font-bold px-6 py-2.5 rounded-xl text-xs shadow-[0_4px_15px_rgba(232,184,109,0.25)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>⚡</span> Generate Custom Draft
            </button>
          </div>
        </div>

        {/* 🔍 SEARCH & TEMPLATES SECTION */}
        <div className="space-y-5 pt-4 text-left">
          
          {/* Glass Search Bar */}
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><span className="text-slate-400">🔍</span></div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search standard templates..."
              className="w-full glass-panel focus:border-[#E8B86D] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
            />
          </div>

          {/* 📂 TEMPLATE GRID (6 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(t => (
              <TemplateCard key={t.id} t={t} onSelect={() => setSelectedTemplate(t)} />
            ))}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dot-grid text-[#E7E5E4] font-sans-ui p-4 md:p-8 relative overflow-hidden selection:bg-[#E8B86D] selection:text-[#0a0807]">
      <style>{`
        .bg-dot-grid {
          background-color: #0c0a09;
          background-image: radial-gradient(rgba(232, 184, 109, 0.15) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        .glass-panel {
          background: rgba(20, 16, 13, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(232, 184, 109, 0.18);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
        }
        .glass-panel-hover {
          transition: all 0.3s;
        }
        .glass-panel-hover:hover {
          border-color: rgba(232, 184, 109, 0.45);
          background: rgba(28, 22, 18, 0.85);
        }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(232, 184, 109, 0.3); border-radius: 4px; }
        .doc-scroll::-webkit-scrollbar { width: 8px; }
        .doc-scroll::-webkit-scrollbar-track { background: transparent; }
        .doc-scroll::-webkit-scrollbar-thumb { background: rgba(232, 184, 109, 0.2); border-radius: 10px; }
      `}</style>
      
      {/* ✨ AMBIENT GLOWS & WATERMARK */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E8B86D]/12 via-amber-900/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-amber-600/10 via-blue-900/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Scales of justice visual */}
      <div className="absolute top-1/4 right-5 text-[#E8B86D] opacity-[0.03] select-none pointer-events-none font-serif-legal z-0 transform -rotate-12">
        <svg width="700" height="700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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
        {content}
      </div>
    </div>
  );
}
