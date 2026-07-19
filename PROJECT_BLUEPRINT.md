# ⚖️ NyayaSahayak (न्यायसहायक) — Product Blueprint & Design Guide

> **Tagline:** *"Har Haq, Har Pal, Har Case — AI ke Saath."*
>
> **NyayaSahayak** is a next-generation, AI-driven legal companion custom-built for the Indian Legal System. It serves as a bridge between complex legal codes and laypersons, business owners, and legal practitioners, turning scans and case files into actionable insights, automated drafts, and step-by-step guidance.
>
> This document serves as the **master product blueprint** and **design brief** for designers, frontend developers, and Figma AI agents to design a premium, cinematic, state-of-the-art SaaS experience.

---

## 🧭 1. What This Project Does (Core Mission)
Indian legal procedures are complex, heavily jargon-ridden, and slow. The transition from colonial-era laws (IPC, CrPC, IEA) to modern codes (BNS, BNSS, BSA) has created a steep learning curve for everyone.

NyayaSahayak solves this by providing:
1. **Plain Language Explanations:** Explaining Indian laws, procedures, and rights in clean English, Hindi, and Hinglish.
2. **Interactive Case Vaults:** Aggregating case timelines, previous hearing orders, pending evidence, and AI case strength analytics in one dashboard.
3. **Smart Legal Auditing:** Identifying risks, hidden liabilities, and unfair clauses in contracts (like rent agreements, NDAs, service pacts) and suggesting standard-practice clauses.
4. **Automated Document Drafting:** Generating court-ready document drafts based on natural language situations or guided form inputs.

---

## 🛠️ 2. Current Active Features & Backend Services
The backend is fully operational on FastAPI, integrated with Supabase, and runs on an intelligent multi-model LLM fallback router. The core feature modules are:

### A. CaseVault (Integrated RAG Copilot)
- **The Service:** Organizes court cases. For each case, users can upload document PDFs/scans (which are automatically processed by an OCR pipeline using PyMuPDF and Gemini Vision) and record historical hearing orders.
- **RAG Capability:** Users can chat with the Case Copilot. It searches across case-file chunks, past hearing orders, and pre-seeded Bare Acts (CPC, BNSS, BSA) to answer specific questions like *"What did the judge say about our property title in the last hearing?"* or *"What is our next step based on the pending evidence?"*
- **Database Tables:** `cases` (relational meta), `hearings` (order logs), and `documents` (evidence and drafts).

### B. ContractGuard (Legal Agreement Auditor)
- **The Service:** Audits agreements. Users upload a contract, and the system performs semantic clause segmentation.
- **Indian Contract Act Integration:** Cross-references contract terms with the *Indian Contract Act, 1872*.
- **Structured Audit Output:** Generates a structured JSON analysis containing:
  - **Clause Type & Risk Rating:** Categorizes clauses and tags them as *High*, *Medium*, or *Low* Risk.
  - **Explanation:** Breaking down what the clause means in lay terms.
  - **Negotiation Talking Points:** Suggestions on what the user should say to negotiate better terms.
  - **Standard Practice (Alternative Clauses):** Safe, standard alternative clauses to replace the risky ones.

### C. AI Vakil (Bilingual Legal Chatbot)
- **The Service:** A conversational assistant capable of chatting in English, Hindi, and Hinglish.
- **Statute Mapping (IPC ➔ BNS):** Maps colonial criminal codes (IPC) to their modern counterparts (BNS) instantly (e.g., explaining that *IPC Section 420* is now *BNS Section 318*).
- **Voice Loop:** Native speech-to-text input (via Web Audio API) and text-to-speech feedback (via Web Speech Synthesis).

### D. DocDraft (AI Document Generator)
- **The Service:** Generates formal legal drafts.
- **Two Generation Paths:**
  1. **Template-Driven:** Guided form fields (e.g., Landlord/Tenant names, rent amount, security deposit) to compile structured agreements.
  2. **Situation-Driven (Custom):** Users describe their problem (e.g., *"My landlord has blocked my security deposit for 3 months"*), and the AI compiles a complete legal notice or affidavit ready for submission.

---

## 📈 3. Strategic Expectations & Future Scope
To stand out as a premium SaaS application, the frontend must match the high-performance intelligence of the backend. Our expectations are:
1. **Interactive Timelines:** A visual, chronological case timeline that displays past hearings, next steps, and evidence milestones on an interactive horizontal/vertical path.
2. **Visual Contract Markup:** An editor/viewer interface showing the uploaded contract on one side, and highlighted risk panels (Red/Amber/Green cards) on the other, complete with click-to-replace suggestions.
3. **Conversational Law Pills:** Converting complex legal citations into hoverable, clickable "Law Pills" that expand to show the full bare-act definition instantly.
4. **Speech-Native Interface:** A clean, glowing audio dashboard for voice interactions with the AI Vakil, simulating a real-time call or consultation.

---

## ⚡ 4. Current Implementation Status
- **Backend Stack:** FastAPI, Python 3.12, Supabase Python client, PyMuPDF, Gemini API, Groq, and OpenRouter API keys.
- **Frontend Stack:** React 19 SPA powered by Vite, Tailwind CSS v4, Lucide React icons, and Zustand for auth and session state management.
- **Auth Layer:** Unified Supabase Auth. It supports normal Sign-up/Sign-in and Google OAuth with an automatic `/auth/callback` state resolver.
- **Development URLs:**
  - **Frontend Dev URL:** `http://localhost:5174/` (or `5173`)
  - **Backend API URL:** `http://127.0.0.1:8000/api/v1`

---

## 🎨 5. UI/UX Design Brief for Figma AI & Designers

### A. Theme and Aesthetics (Premium Dark Mode)
- **Primary Background:** Solid Cinematic Dark `#050505` to `#0A0A0A` with deep slate gradients.
- **Brand Accent Colors:** Warm legal gold/bronze (`#E8B86D` to `#D4A853`) and royal deep blue.
- **Status Colors:**
  - **High Risk / Alert:** Crimson `#EF4444` / `#DC2626`
  - **Warning / Medium Risk:** Amber `#F59E0B` / `#D97706`
  - **Success / Low Risk:** Emerald `#10B981` / `#059669`
- **Glassmorphism:** Use thin border strokes (`border-white/8`), semi-transparent backdrops (`bg-white/3` or `bg-[#0A0A0A]/80`), and extensive backdrop filters (`backdrop-blur-xl`).

### B. High-Fidelity UI Screens & Component Mockups

#### 1. Landing Page (The Cinematic Gateway)
- **Hero Section:** Bold, serif typography ("NyayaSahayak") in legal gold. Minimalist search bar mimicking a search for law codes or rights.
- **Interactive Feature Carousel:** Highlight *ContractGuard*, *CaseVault*, *AI Vakil*, and *DocDraft* with high-contrast card hover animations.

#### 2. The Workspace (Dashboard Grid)
- **Case Status Widgets:** Quick KPI counters (Active Cases, Pending Hearings, Risky Contracts).
- **Recent Timelines:** A visual vertical feed of upcoming case hearings.

#### 3. ContractGuard Reviewer (Split-Screen Workspace)
- **Left Panel (The Document):** The contract text with highlighted spans matching the risk categories.
- **Right Panel (The Audit Cards):** Accordion-based cards corresponding to the highlighted clauses. Clicking a card should display the explanation, negotiation points, and a "Replace Clause" CTA.

#### 4. AI Vakil Consultation Room (Chat Interface)
- **Floating Law Pills:** Automatically format references like `[Section 138, NI Act]` into interactive badges. On hover, show the description. On click, expand to split-screen legal dictionary.
- **Voice Waveform:** A visual audio waveform that animates dynamically when recording speech or when the AI speaks.

#### 5. DocDraft Generator (Interactive Wizard)
- **Step-by-step progress tracker** with cinematic fade transitions.
- **Live Preview panel** showing the legal document text dynamically compiling on the right side as form fields are filled on the left.
