import { useState, useRef } from "react";
import { Shield, Upload, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, RotateCcw, Scale } from "lucide-react";
import { T } from "./tokens";
import { apiFetch } from "../lib/api";

/* ─── Types ─── */
type Risk = "high" | "medium" | "low";
interface Clause {
  id: string;
  title: string;
  text: string;
  risk: Risk;
  confidence: number;
  whyRisky: string;
  relevantLaw: string;
  negotiationQuestions: string[];
  standardAlternative: string;
}

/* ─── Mock Database of Specific Sample Clauses ─── */
const RENT_AGREEMENT_CLAUSES: Clause[] = [
  {
    id: "rent_arb",
    title: "Unilateral Arbitration",
    text: "All disputes arising out of or in connection with this Agreement shall be finally settled by a sole arbitrator appointed exclusively by the Landlord at their sole discretion.",
    risk: "high",
    confidence: 92,
    whyRisky: "Imagine you're having a fight with someone and they get to pick the judge — that's exactly what's happening here. The Landlord alone selects the arbitrator, meaning someone who likely favours them will decide your case. You lose a fair hearing before it even begins.",
    relevantLaw: "Under Section 11 of the Arbitration & Conciliation Act 1996, unilateral appointment of an arbitrator is invalid as it violates party autonomy and neutrality; thus, arbitration requires mutual selection.",
    negotiationQuestions: [
      "What to Ask: Why is the arbitrator appointed unilaterally by your side instead of mutual selection?",
      "What to Argue: Unilateral appointment violates party autonomy under Section 11 of the Arbitration Act and is treated as invalid by Indian courts.",
      "What to Do: Request to change the clause to state that the arbitrator will be appointed mutually in writing."
    ],
    standardAlternative: "In practice, fair contracts always require both parties to jointly appoint the arbitrator, or refer the appointment to a neutral institution. Standard wording: 'Disputes shall be resolved by a sole arbitrator mutually agreed upon in writing, or appointed by the competent court under Section 11 of the Arbitration & Conciliation Act, 19_96.'",
  },
  {
    id: "rent_term",
    title: "Termination at Will",
    text: "The Landlord may terminate this rent agreement at any time without cause by giving 7 days written notice to the Tenant.",
    risk: "high",
    confidence: 85,
    whyRisky: "One-sided exit rights are a major red flag. The Landlord can force you to vacate in just 7 days for literally no reason — leaving you stranded without housing, while you have to scramble to find a new place and arrange packers and movers.",
    relevantLaw: "Under Section 106 of the Transfer of Property Act 1882, leases usually require at least 15 days or 1 month notice for termination; unilateral 7-day exits are heavily biased.",
    negotiationQuestions: [
      "What to Ask: Why does only the Landlord have the right to terminate without cause?",
      "What to Argue: Notice periods must be mutual and reasonable (minimum 30 days) to prevent tenant displacement under Section 106 of the Transfer of Property Act.",
      "What to Do: Request that the termination notice period be made mutual and extended to 30 or 60 days."
    ],
    standardAlternative: "Standard agreements allow either party to terminate without cause with a mutual 30–60 days notice. Standard wording: 'Either party may terminate this agreement by giving 30 days written notice to the other party without assigning any reason.'"
  },
  {
    id: "rent_sec",
    title: "Security Deposit Deductions",
    text: "The security deposit shall be returned within 30 days after vacating, subject to deduction for damages beyond normal wear and tear.",
    risk: "medium",
    confidence: 55,
    whyRisky: "The contract says the Landlord can deduct for 'damages', but there is no move-out inspection checklist, no photos required, and no clear definition of wear and tear. The Landlord can claim old walls need repainting and cut your deposit in half without proof.",
    relevantLaw: "Under Section 74 of the Indian Contract Act 1872, security deposit deductions must represent actual, proven loss rather than arbitrary penalties; the landlord must provide receipts.",
    negotiationQuestions: [
      "What to Ask: Can we define 'damage' specifically and distinguish it from normal wear and tear in writing?",
      "What to Argue: Under Section 74 of the Contract Act, deductions must be backed by proof of actual loss rather than arbitrary estimates.",
      "What to Do: Request a joint move-out inspection checklist and receipt verification before any deposit cuts."
    ],
    standardAlternative: "Most professionally drafted rental agreements include a joint inspection checklist signed by both parties. Deductions are only allowed if documented. Return of deposit is within 7–15 days.",
  },
  {
    id: "rent_late",
    title: "Late Payment Penalty",
    text: "If the Tenant fails to pay rent by the 5th of any month, a late penalty of Rs. 1,000 per day shall accrue daily until the payment is cleared.",
    risk: "medium",
    confidence: 60,
    whyRisky: "A flat penalty of Rs. 1,000 per day is excessively high (amounting to 30,000 per month), which is disproportionate to a typical rent amount and acts as an illegal penalty clause rather than actual damages.",
    relevantLaw: "Under Section 73 and 74 of the Indian Contract Act 1872, courts strike down excessive late fees that do not represent genuine pre-estimated losses, classifying them as unenforceable penalties.",
    negotiationQuestions: [
      "What to Ask: Can we introduce a 5-day grace period before late penalties start accruing?",
      "What to Argue: A daily late penalty of Rs. 1,000 is disproportionately high and treated as an unenforceable penalty under Section 74 of the Contract Act.",
      "What to Do: Request to change the penalty to simple interest at 1.5% per month calculated on the delayed days."
    ],
    standardAlternative: "Standard contracts apply a reasonable interest rate on delayed payments. Standard wording: 'Delayed payments shall attract simple interest at the rate of 1.5% per month, calculated on a pro-rata basis for the number of delayed days.'"
  },
  {
    id: "rent_pay",
    title: "Payment Terms",
    text: "Payment shall be due on the 5th day of every calendar month by bank transfer to the Landlord's designated account.",
    risk: "low",
    confidence: 18,
    whyRisky: "This is a standard and fair clause. It outlines a clear deadline and a transparent electronic payment method, which is safe for both parties.",
    relevantLaw: "Under Section 50 of the Indian Contract Act 1872, performance of a contract must happen at the time and in the manner prescribed by the promisee.",
    negotiationQuestions: [
      "What to Ask: Can the payment window be extended to the 10th of each month to account for salary cycles?",
      "What to Argue: Extending to the 10th aligns with standard employee payroll cycles in India.",
      "What to Do: Keep the clause but request a small deadline extension if payroll falls late."
    ],
    standardAlternative: "This clause is at market standard. No replacement needed.",
  }
];

const NDA_CLAUSES: Clause[] = [
  {
    id: "nda_indem",
    title: "Unilateral Indemnity for Breaches",
    text: "The Receiving Party shall indemnify, defend, and hold harmless the Disclosing Party from and against any and all claims, liabilities, losses, damages, or costs arising out of any breach of this Agreement.",
    risk: "high",
    confidence: 88,
    whyRisky: "You are signing a blank cheque. Under this clause, if a minor breach occurs, you are liable to pay for all of the disclosing party's legal fees, internal costs, and hypothetical losses without any cap or proof of direct causation.",
    relevantLaw: "Under Section 73 of the Indian Contract Act 1872, damages are limited to direct losses; unilateral, uncapped indemnity clauses attempt to bypass these legal limits and are heavily biased.",
    negotiationQuestions: [
      "What to Ask: Why is there no mutual indemnity clause in this agreement?",
      "What to Argue: Unilateral and uncapped indemnity violates Section 73 of the Contract Act which restricts claims to direct, proven damages.",
      "What to Do: Request mutual indemnity or add a reasonable financial cap to your total liability exposure."
    ],
    standardAlternative: "Responsible NDAs limit indemnity to direct losses and include a reasonable cap. Standard wording: 'The Receiving Party's total liability under this Agreement shall be limited to direct damages and shall not exceed INR 5,00,000.'",
  },
  {
    id: "nda_term",
    title: "Perpetual Confidentiality Lock-in",
    text: "The obligations of confidentiality set forth in this Agreement shall survive termination of this Agreement and remain in effect indefinitely.",
    risk: "high",
    confidence: 90,
    whyRisky: "An indefinite confidentiality requirement for commercial information is highly risky, as it forces you to track, monitor, and safeguard files forever. Typically, commercial secrets should have a time limit (e.g., 3-5 years).",
    relevantLaw: "Under Section 27 of the Indian Contract Act 1872, covenants that are overly broad or perpetual can be viewed as unreasonable restraints of trade and rendered void.",
    negotiationQuestions: [
      "What to Ask: Why should standard commercial information remain confidential indefinitely?",
      "What to Argue: Perpetual clauses are treated as unreasonable restraints under Section 27 of the Contract Act and are difficult to administer over time.",
      "What to Do: Request to limit the survival of confidentiality obligations to 2 to 3 years post-termination."
    ],
    standardAlternative: "Standard NDAs restrict the survival of confidentiality to a defined period. Standard wording: 'The obligations of confidentiality under this Agreement shall survive for a period of three (3) years from the date of termination.'"
  },
  {
    id: "nda_damages",
    title: "Unreasonable Liquidated Damages",
    text: "In the event of any breach of confidentiality, the Receiving Party shall immediately pay to the Disclosing Party a sum of INR 10,00,000 as liquidated damages.",
    risk: "medium",
    confidence: 58,
    whyRisky: "A pre-fixed heavy fine (liquidated damages) for any breach — regardless of whether the breach caused actual harm or was accidental — is unfair and acts as a penalty trap.",
    relevantLaw: "Under Section 74 of the Indian Contract Act 1872, courts do not enforce liquidated damages that act as a penalty; they only award reasonable compensation up to the named amount if actual loss is proven.",
    negotiationQuestions: [
      "What to Ask: Can we remove the pre-fixed liquidated damages and allow actual proven damages to be claimed instead?",
      "What to Argue: Fixed penalties without proof of actual loss are struck down by Indian courts as unenforceable penalties under Section 74 of the Contract Act.",
      "What to Do: Request to remove the fixed penalty sum and let the parties seek actual damages in court."
    ],
    standardAlternative: "Standard NDAs allow parties to claim actual damages in court. Standard wording: 'The Disclosing Party shall be entitled to seek actual, proven damages and injunctive relief in the event of a breach.'"
  },
  {
    id: "nda_juris",
    title: "Exclusive Jurisdiction",
    text: "This Agreement shall be governed by the laws of India and the courts of Mumbai shall have exclusive jurisdiction over any disputes.",
    risk: "medium",
    confidence: 45,
    whyRisky: "If you are based in a different city (e.g., Delhi or Bangalore), consenting to Mumbai as the exclusive forum means you will have to travel, hire local lawyers, and spend heavily to defend yourself in case of a dispute.",
    relevantLaw: "Under Section 20 of the Code of Civil Procedure 1908, suits are normally filed where the cause of action arises or where the defendant resides. Exclusive jurisdiction clauses override this by agreement.",
    negotiationQuestions: [
      "What to Ask: Can we make the jurisdiction neutral or local to where the cause of action arises?",
      "What to Argue: Forcing a single party to travel to a distant city for minor disputes is highly asymmetric and expensive.",
      "What to Do: Request to make the jurisdiction non-exclusive, or use mutual arbitration in a neutral city."
    ],
    standardAlternative: "Standard practice is to keep jurisdiction mutual or use a neutral city. Standard wording: 'Any dispute arising under this Agreement shall be subject to the non-exclusive jurisdiction of the courts of the city where the cause of action arises.'"
  },
  {
    id: "nda_return",
    title: "Return of Information",
    text: "Upon request of the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information and provide a written certification of compliance within 7 days.",
    risk: "low",
    confidence: 25,
    whyRisky: "This is a standard protective clause in NDAs. The only minor risk is the short timeline (7 days) and the absolute nature, which might conflict with automated backup storage systems.",
    relevantLaw: "Under Section 55 of the Indian Contract Act, contract performance timelines must be reasonable and adhere to business practices.",
    negotiationQuestions: [
      "What to Ask: Can we add a carve-out allowing us to retain secure copies in automated backup archives?",
      "What to Argue: Complete absolute deletion of digital backups is technically impossible in standard cloud database environments.",
      "What to Do: Request backup retention text to be added to the clause."
    ],
    standardAlternative: "Standard wording: 'Except for copies retained in automatic computer backup archives, the Receiving Party shall return or destroy all materials.'",
  }
];

const SERVICE_AGREEMENT_CLAUSES: Clause[] = [
  {
    id: "srv_arb",
    title: "Unilateral Arbitration",
    text: "All disputes arising out of or in connection with this Agreement shall be finally settled by a sole arbitrator appointed exclusively by the Service Provider at their sole discretion.",
    risk: "high",
    confidence: 92,
    whyRisky: "Imagine you're having a fight with someone and they get to pick the judge — that's exactly what's happening here. The Service Provider alone selects the arbitrator, meaning someone who likely favours them will decide your case. You lose a fair hearing before it even begins.",
    relevantLaw: "Under Section 11 of the Arbitration & Conciliation Act 1996, unilateral appointment of an arbitrator is invalid as it violates party autonomy and neutrality; thus, arbitration requires mutual selection under Section 11, Arbitration Act 1996.",
    negotiationQuestions: [
      "What to Ask: Why is the arbitrator appointed unilaterally by your side instead of mutual selection?",
      "What to Argue: Unilateral appointment violates party autonomy under Section 11 of the Arbitration Act and is treated as invalid by Indian courts.",
      "What to Do: Request to change the clause to state that the arbitrator will be appointed mutually in writing."
    ],
    standardAlternative: "In practice, fair contracts always require both parties to jointly appoint the arbitrator, or refer the appointment to a neutral institution (like ICADR or the High Court). Standard wording: 'Disputes shall be resolved by a sole arbitrator mutually agreed upon in writing, or appointed by the competent court under Section 11 of the Arbitration & Conciliation Act, 19_96.'",
  },
  {
    id: "srv_indem",
    title: "Unlimited Indemnity",
    text: "The Client shall indemnify and hold harmless the Service Provider from any and all claims, losses, damages, liabilities, costs and expenses arising from the Client's use of the services.",
    risk: "high",
    confidence: 88,
    whyRisky: "You're signing a blank cheque here. This clause means: if ANYTHING goes wrong — even if it was the provider's mistake — you pay for all of it. If their employee does something wrong at your site, you could still be liable for their legal fees, their losses, and all connected expenses.",
    relevantLaw: "Under Section 23 of the Indian Contract Act, contracts that indemnify against one's own gross negligence or illegal acts are void as against public policy; thus, you can demand indemnity exclusion under Section 23, Indian Contract Act 1872.",
    negotiationQuestions: [
      "What to Ask: Why is there no carve-out for losses caused by your own negligence or wilful acts?",
      "What to Argue: Indemnifying a party against their own gross negligence or errors violates public policy under Section 23 of the Contract Act.",
      "What to Do: Request to exclude liability for provider's gross negligence and cap total indemnity to fees paid."
    ],
    standardAlternative: "Responsible contracts limit indemnity to direct losses caused solely by the indemnifying party's own acts, and always include a financial cap (usually 3–12 months of contract value). The provider should carry their own liability insurance for their negligence.",
  },
  {
    id: "srv_term",
    title: "Termination at Will",
    text: "The Service Provider may terminate this agreement at any time without cause by giving 7 days written notice to the Client.",
    risk: "high",
    confidence: 85,
    whyRisky: "One-sided exit rights are a red flag. The provider can walk out in 7 days for literally no reason — mid-project, just before a delivery, or during a critical business period — and face zero consequences. But what happens to your work, your payments, and your data?",
    relevantLaw: "Under Section 73 of the Indian Contract Act, termination must not cause uncompensated loss; thus, exit notice periods must be mutual and carry transition clauses under Section 73, Indian Contract Act 1872.",
    negotiationQuestions: [
      "What to Ask: Why does only one party have the right to terminate without cause?",
      "What to Argue: Unilateral short notice periods cause massive operational risk and uncompensated losses, violating Section 73 principles.",
      "What to Do: Request equal notice periods (30 days minimum) and a transition clause for work hand-off."
    ],
    standardAlternative: "Standard agreements allow either party to terminate without cause with 30–60 days notice, and require the terminating party to complete or hand over all work-in-progress. Advance payments are refunded pro-rata for work not delivered.",
  },
  {
    id: "srv_delay",
    title: "Delayed Payment Penalty",
    text: "Payments not received within 15 days of invoice date shall accrue interest at 2.5% per month, compounded weekly.",
    risk: "medium",
    confidence: 55,
    whyRisky: "A weekly compounding rate of 2.5% per month is equivalent to over 34% annually. Compounding weekly is extremely aggressive and can result in exponential debt accumulation over a minor administrative delay.",
    relevantLaw: "Under Section 3 of the Interest Act 1978, courts only permit reasonable interest rates, striking down extortionate, compounding rates as penalties under Section 74 of the Contract Act.",
    negotiationQuestions: [
      "What to Ask: Can we change the compounding frequency from weekly to simple interest or monthly?",
      "What to Argue: Extortionate weekly compounded rates act as penal elements struck down under Section 74 of the Contract Act.",
      "What to Do: Request to use simple interest at 12% per annum, and extend grace period to 30 days."
    ],
    standardAlternative: "Most agreements apply simple interest on delayed payments. Standard wording: 'Any payments delayed beyond 30 days shall accrue simple interest at the rate of 1% per month calculated daily.'"
  }
];

const EMPLOYMENT_CONTRACT_CLAUSES: Clause[] = [
  {
    id: "emp_noncomp",
    title: "Post-Employment Non-Compete",
    text: "The Employee agrees not to engage in any business activity competing with the Employer's business for a period of 2 years after termination of employment.",
    risk: "high",
    confidence: 82,
    whyRisky: "This clause restricts your ability to work in your own field for 2 years after leaving. While such clauses are common, Indian courts routinely strike them down as unenforceable because they restrict your right to earn a livelihood — a fundamental right. However, having it signed exposes you to litigation risk.",
    relevantLaw: "Under Section 27 of the Indian Contract Act 1872, post-employment non-compete agreements are void as restraint of trade; thus, post-term employment bans are legally void under Section 27.",
    negotiationQuestions: [
      "What to Ask: Can we remove the post-employment non-compete restriction since it is legally void under Indian law?",
      "What to Argue: Under Section 27 of the Contract Act, any agreement restraining trade or employment post-term is completely void.",
      "What to Do: Request to delete the post-employment restriction or limit it strictly to non-solicitation of clients."
    ],
    standardAlternative: "Most enforceable non-competes in India are narrowly scoped: 3–6 months, limited to the employer's specific customer list, with compensation paid to the employee during the restriction period. The Supreme Court has repeatedly ruled that blanket industry-wide restrictions are void.",
  },
  {
    id: "emp_bond",
    title: "Training Bond Lock-in",
    text: "The Employee agrees to serve the Company for a minimum period of 3 years. If the Employee resigns before the 3-year term, they shall pay the Company INR 5,00,000 as liquidated damages.",
    risk: "high",
    confidence: 80,
    whyRisky: "A 3-year absolute lock-in bond with a heavy financial penalty restricts your freedom of employment. If you get a better opportunity or need to leave due to health issues, you could be forced to pay a massive sum, regardless of whether the company actually spent that amount on your training.",
    relevantLaw: "Under Section 27 of the Contract Act, direct forced labor bonds are void. Under Section 74, the employer can only recover actual expenses incurred for specialized training, not arbitrary penalty sums.",
    negotiationQuestions: [
      "What to Ask: Can the bond period be reduced to 1 year and penalty equal to actual training costs?",
      "What to Argue: Under Section 74 of the Contract Act, employers can only recover actual, proven training expenses, not fixed penalty sums.",
      "What to Do: Request training reimbursement on an amortized pro-rata basis instead of a flat bond penalty."
    ],
    standardAlternative: "Fair employment contracts require a pro-rata training recovery clause. Standard wording: 'If the employee leaves within 12 months of undergoing specialized training, they shall reimburse the actual training cost, amortized monthly.'"
  },
  {
    id: "emp_notice",
    title: "Arbitrary Notice Period Deductions",
    text: "The Company reserves the right to terminate the Employee immediately without notice or payment in lieu of notice, while the Employee must give 3 months notice prior to resignation.",
    risk: "medium",
    confidence: 50,
    whyRisky: "This is a highly asymmetric exit clause. The company can fire you instantly without paying you anything, but you must give 90 days notice or risk losing your salary, relieving letter, and experience certificate.",
    relevantLaw: "Under Indian State Shops & Establishments Acts, employers are legally required to give 30 days notice or equivalent salary for termination, making immediate terminations without notice invalid except for gross misconduct.",
    negotiationQuestions: [
      "What to Ask: Can we make the notice period reciprocal so that both parties must give equal notice?",
      "What to Argue: State Shops & Establishments Acts mandate at least 30 days notice or payment in lieu of notice for termination by employer.",
      "What to Do: Request notice periods be made mutual (e.g. 30 or 60 days for both sides)."
    ],
    standardAlternative: "Standard practice is mutual exit notice. Standard wording: 'Either party may terminate the employment by giving 30 days written notice, or salary in lieu of notice, to the other party.'"
  },
  {
    id: "emp_ip",
    title: "Intellectual Property Assignment",
    text: "All intellectual property conceived, developed, or written by the Employee during the period of employment, whether during business hours or otherwise, shall vest solely with the Company.",
    risk: "medium",
    confidence: 48,
    whyRisky: "The term 'whether during business hours or otherwise' is overly broad. It means if you write a book, build a personal app, or paint a picture on the weekend using your own laptop, the company can claim ownership of your private creations.",
    relevantLaw: "Under Section 17 of the Copyright Act 1957, work made 'in the course of employment' belongs to the employer; however, personal projects created outside duty hours are owned by the creator.",
    negotiationQuestions: [
      "What to Ask: Can we restrict the IP assignment to only projects created in the course of employment?",
      "What to Argue: Under Section 17 of the Copyright Act, personal weekend projects created without company resources belong to the creator.",
      "What to Do: Request to change the text to 'in the course of employment and using company resources' with a personal project carve-out."
    ],
    standardAlternative: "Proper IP clauses are restricted to course of duty. Standard wording: 'All intellectual property created by the Employee in the course of their duties and using Company resources shall belong exclusively to the Company.'"
  },
  {
    id: "emp_pay",
    title: "Payment Terms",
    text: "Salary shall be credited to the Employee's bank account on or before the 7th day of the following calendar month.",
    risk: "low",
    confidence: 15,
    whyRisky: "This is a standard and compliant payment clause in employment contracts.",
    relevantLaw: "Under the Payment of Wages Act 1936, salaries must be paid before the 7th or 10th of the following month depending on company size.",
    negotiationQuestions: [
      "What to Ask: None, the payment terms are standard.",
      "What to Argue: None, payment terms align with Indian employment laws.",
      "What to Do: Keep the clause as is."
    ],
    standardAlternative: "This clause is at market standard. No replacement needed.",
  }
];

const SAMPLE_DOCS = [
  { name: "normalRentAgreement.pdf", type: "Rent Agreement", desc: "Residential rental deed with deposit, maintenance & termination terms.", high: 2, medium: 2, low: 1, score: 62 },
  { name: "NDA — TechCorp India Ltd", type: "Non-Disclosure Agreement", desc: "Mutual NDA with unilateral confidentiality obligations and 3-year lock-in.", high: 2, medium: 2, low: 1, score: 55 },
  { name: "FreelanceServiceAgreement.pdf", type: "Service Agreement", desc: "Freelance contract with broad IP assignment and unilateral exit rights.", high: 3, medium: 1, low: 0, score: 80 },
  { name: "EmploymentLetter — Startup.pdf", type: "Employment Contract", desc: "Offer letter with non-compete, at-will termination and unlimited liability clause.", high: 2, medium: 2, low: 1, score: 70 },
];

const RISK_LABEL: Record<Risk, string> = { high: "High Risk", medium: "Medium Risk", low: "Low Risk" };

const RISK_COLORS = {
  high: {
    border: "border-[#F87171]/50",
    glow: "from-red-500 via-[#F87171] to-transparent",
    badgeBg: "bg-[#3B1816]",
    badgeText: "text-[#F87171]",
    badgeBorder: "border-[#F87171]/30",
    dot: "bg-[#F87171]",
    dotShadow: "shadow-[0_0_10px_rgba(248,113,113,0.8)]",
    severityFill: "from-amber-500 to-[#F87171]",
    whyRiskyBg: "bg-[#2c1614]/80",
    whyRiskyBorder: "border-l-[#F87171] border-[#F87171]/20",
    whyRiskyText: "text-[#F87171]",
  },
  medium: {
    border: "border-[#FBA919]/50",
    glow: "from-amber-500 via-[#FBA919] to-transparent",
    badgeBg: "bg-[#382613]",
    badgeText: "text-[#FBA919]",
    badgeBorder: "border-[#FBA919]/30",
    dot: "bg-[#FBA919]",
    dotShadow: "shadow-[0_0_10px_rgba(251,169,25,0.8)]",
    severityFill: "from-yellow-500 to-[#FBA919]",
    whyRiskyBg: "bg-[#2b2118]/80",
    whyRiskyBorder: "border-l-[#FBA919] border-[#FBA919]/20",
    whyRiskyText: "text-[#FBA919]",
  },
  low: {
    border: "border-[#4ADE80]/50",
    glow: "from-green-500 via-[#4ADE80] to-transparent",
    badgeBg: "bg-[#163323]",
    badgeText: "text-[#4ADE80]",
    badgeBorder: "border-[#4ADE80]/30",
    dot: "bg-[#4ADE80]",
    dotShadow: "shadow-[0_0_10px_rgba(74,222,128,0.8)]",
    severityFill: "from-[#4ADE80] to-[#22C55E]",
    whyRiskyBg: "bg-[#13281e]/80",
    whyRiskyBorder: "border-l-[#4ADE80] border-[#4ADE80]/20",
    whyRiskyText: "text-[#4ADE80]",
  }
};

/* ─── Risk Calculation and Category Logic ─── */
const getOverallScoreAndLabel = (clauses: Clause[], backendScore?: number | null) => {
  const highCount = clauses.filter(c => c.risk === "high").length;
  const medCount = clauses.filter(c => c.risk === "medium").length;
  const lowCount = clauses.filter(c => c.risk === "low").length;

  let score = 0;
  let label: "High Risk" | "Medium Risk" | "Low Risk" = "Low Risk";

  if (highCount > 0) {
    label = "High Risk";
    // Enforce overall score inside high range [70% - 99%]
    const base = 70;
    const additional = Math.min(29, highCount * 10 + medCount * 2);
    score = base + additional;
  } else if (medCount > 0) {
    label = "Medium Risk";
    // Enforce overall score inside medium range [40% - 69%]
    const base = 40;
    const additional = Math.min(29, medCount * 12 + lowCount * 3);
    score = base + additional;
  } else {
    label = "Low Risk";
    // Enforce overall score inside low range [10% - 39%]
    const base = 15;
    const additional = Math.min(24, lowCount * 8);
    score = base + additional;
  }

  // If backend score is returned and naturally aligns with the logical category, prioritize it
  if (backendScore !== undefined && backendScore !== null) {
    const bScore = Math.round(backendScore);
    if (label === "High Risk" && bScore >= 70) score = bScore;
    else if (label === "Medium Risk" && bScore >= 40 && bScore < 70) score = bScore;
    else if (label === "Low Risk" && bScore < 40) score = bScore;
  }

  return { score, label };
};

/* ─── Clause Accordion Card Component ─── */
function ClauseAccordionCard({ clause }: { clause: Clause }) {
  const [open, setOpen] = useState(clause.risk === "high");
  const [showNeg, setShowNeg] = useState(false);
  const rc = RISK_COLORS[clause.risk];

  return (
    <div
      className={`glass-panel rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
        open ? `border-2 ${rc.border}` : "border border-transparent hover:border-[#E8B86D]/20"
      }`}
    >
      {/* Subtle Risk Glow Bar */}
      {open && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rc.glow}`} />
      )}

      {/* Clause Header */}
      <div
        className={`flex items-start justify-between gap-4 cursor-pointer select-none ${
          open ? "mb-6 pb-5 border-b border-[#E8B86D]/15" : ""
        }`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${rc.dot} ${rc.dotShadow} ${clause.risk === "high" ? "animate-pulse" : ""}`} />
          <div className="min-w-0">
            <h3 className="font-serif-legal text-base md:text-lg font-bold text-white transition">
              {clause.title}
            </h3>
            {!open && (
              <p className="text-xs text-slate-300 mt-1 line-clamp-1 font-medium leading-relaxed">
                {clause.text}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`text-[11px] font-mono-code font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-inner border ${rc.badgeBg} ${rc.badgeText} ${rc.badgeBorder}`}>
            {RISK_LABEL[clause.risk]}
          </span>
          <span className="text-slate-400 text-sm font-mono-code font-bold">
            {open ? "︿" : "﹀"}
          </span>
        </div>
      </div>

      {open && (
        <div className="space-y-6">
          {/* Clause Text Quote */}
          <div className="bg-[#0c0a09]/80 rounded-2xl p-4.5 border border-[#E8B86D]/15 shadow-inner">
            <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold block mb-2">📄 CLAUSE TEXT</span>
            <p className="text-xs md:text-[13px] text-slate-200 font-medium leading-relaxed italic">
              "{clause.text}"
            </p>
          </div>

          {/* Severity Progress Bar */}
          <div className="flex items-center gap-4 bg-[#0c0a09]/60 p-3.5 rounded-xl border border-[#E8B86D]/10">
            <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-300 font-bold shrink-0">SEVERITY</span>
            <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${rc.severityFill} rounded-full`} style={{ width: `${clause.confidence}%` }}></div>
            </div>
            <span className={`text-xs font-mono-code font-bold ${rc.badgeText}`}>{clause.confidence}%</span>
          </div>

          {/* Why Risky */}
          <div className={`rounded-2xl p-5 border-l-4 border-y border-r shadow-md ${rc.whyRiskyBg} ${rc.whyRiskyBorder}`}>
            <div className="flex items-start gap-3.5">
              <span className="text-lg mt-0.5">⚠️</span>
              <div>
                <span className={`text-xs font-mono-code font-bold uppercase tracking-wider block mb-1 ${rc.whyRiskyText}`}>WHY THIS IS RISKY</span>
                <p className="text-xs md:text-[13px] text-slate-200 font-medium leading-relaxed">
                  {clause.whyRisky}
                </p>
              </div>
            </div>
          </div>

          {/* Relevant Law */}
          <div className="bg-[#161e2e]/80 rounded-2xl p-5 border-l-4 border-l-[#60A5FA] border-y border-r border-[#60A5FA]/20 shadow-md">
            <div className="flex items-start gap-3.5">
              <span className="text-lg mt-0.5">⚖️</span>
              <div>
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#60A5FA] block mb-1">RELEVANT LAW</span>
                <p className="text-xs md:text-[13px] text-slate-200 font-medium leading-relaxed">
                  {clause.relevantLaw}
                </p>
              </div>
            </div>
          </div>

          {/* Standard Alternative */}
          <div className="bg-[#13281e]/80 rounded-2xl p-5 border-l-4 border-l-[#4ADE80] border-y border-r border-[#4ADE80]/20 shadow-md">
            <div className="flex items-start gap-3.5">
              <span className="text-lg mt-0.5">✓</span>
              <div>
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#4ADE80] block mb-1">STANDARD ALTERNATIVE</span>
                <p className="text-xs md:text-[13px] text-slate-200 font-medium leading-relaxed">
                  {clause.standardAlternative.includes("Standard wording:") ? (
                    <>
                      {clause.standardAlternative.split("Standard wording:")[0]}
                      <span className="font-mono-code text-[11px] bg-[#0c0a09] px-3 py-2 rounded-xl text-emerald-300 block mt-2.5 border border-emerald-500/30 shadow-inner leading-relaxed">
                        {clause.standardAlternative.split("Standard wording:")[1].replace(/'/g, "").trim()}
                      </span>
                    </>
                  ) : (
                    clause.standardAlternative
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Hide/Show Negotiation Helper Button */}
          <button
            onClick={() => setShowNeg(n => !n)}
            className="bg-[#1f1812] hover:bg-[#2b2118] text-[#E8B86D] border border-[#E8B86D]/40 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>⚖️</span> {showNeg ? "Hide Negotiation Helper" : "Show Negotiation Helper"}
          </button>

          {/* Ask the Counterparty Box */}
          {showNeg && (
            <div className="bg-[#0c0a09] border-2 border-[#E8B86D]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8B86D]/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8B86D]/15">
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-[#E8B86D] flex items-center gap-2">
                  <span>💬</span> ASK THE COUNTERPARTY (NEGOTIATION TALKING POINTS)
                </span>
                <span className="text-[11px] font-mono-code text-slate-400 font-semibold">AI Recommended</span>
              </div>

              <div className="space-y-3.5 font-medium text-xs md:text-[13px] text-slate-200">
                {clause.negotiationQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-[#14100c] p-3.5 rounded-xl border border-white/5">
                    <span className="font-mono-code text-[#E8B86D] font-bold bg-[#E8B86D]/10 px-2 py-0.5 rounded">{idx + 1}.</span>
                    <p className="mt-0.5">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Upload zone ─── */
function UploadZone({ onUpload, uploading, polling }: { onUpload: (file: File) => void; uploading: boolean; polling: boolean }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file) onUpload(file);
  };

  if (uploading || polling) {
    return (
      <div className="flex-1 min-h-[380px] flex flex-col items-center justify-center gap-6 py-14 px-8 rounded-3xl border glass-card"
        style={{ borderColor: "rgba(232, 184, 109, 0.2)", boxShadow: "0 0 40px rgba(232, 184, 109, 0.03)" }}>
        {/* Glowing Loader */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed animate-spin" style={{ borderColor: `#E8B86D50` }} />
          <div className="absolute inset-3 rounded-full border border-dotted animate-pulse" style={{ borderColor: "#E8B86D" }} />
          <Shield size={24} style={{ color: "#E8B86D" }} />
        </div>
        
        <div className="text-center">
          <h3 className="text-base font-bold text-[#FBFBFA] font-serif-legal">{polling ? "Analyzing Clauses..." : "Uploading Contract..."}</h3>
          <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed font-medium">
            NyayaSahayak is performing semantic clause segmentation and checking compliance under the Indian Contract Act, 1872.
          </p>
        </div>
        
        {/* Progress Status Indicators */}
        <div className="flex flex-col gap-2 w-full max-w-xs mt-3 border-t border-[#E8B86D]/15 pt-4 font-mono-code text-[11px] font-medium text-left">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>File upload completed</span>
          </div>
          <div className={`flex items-center gap-2 ${polling ? "text-[#E8B86D]" : "text-slate-500"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${polling ? "bg-[#E8B86D] animate-pulse" : "bg-transparent"}`} />
            <span>{polling ? "AI is reviewing clauses (takes ~10s)..." : "Waiting for parser..."}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!uploading) setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); if (!uploading) { const f = e.dataTransfer.files[0]; if (f) handleFile(f); } }}
      onClick={() => { if (!uploading) inputRef.current?.click(); }}
      className={`flex-1 min-h-[380px] glass-card glass-card-hover border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 relative overflow-hidden ${
        drag ? "border-[#E8B86D] bg-rgba(30,25,21,0.95)" : "border-[#E8B86D]/40"
      }`}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} accept=".pdf,.docx,.txt" />
      
      {/* Subtle golden shine on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E8B86D]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      {/* Upload Icon Circle */}
      <div className="w-16 h-16 rounded-2xl bg-[#14100c] border border-[#E8B86D]/30 text-[#E8B86D] flex items-center justify-center text-3xl mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
        📤
      </div>

      <h3 className="font-serif-legal text-lg md:text-xl font-bold text-[#FBFBFA] group-hover:text-[#E8B86D] transition mb-2">
        Drop your contract here to audit
      </h3>
      <p className="text-xs text-slate-300 max-w-sm mb-6 font-medium leading-relaxed">
        Supports <strong className="text-white font-semibold">PDF, DOCX, TXT</strong> • Maximum file size up to 15 MB. Scanned docs are processed via OCR.
      </p>

      {/* Browse Files CTA Button */}
      <button
        onClick={(e) => { e.stopPropagation(); if (!uploading) inputRef.current?.click(); }}
        className="bg-gradient-to-r from-[#E8B86D] via-[#D4A853] to-[#C68A2C] text-[#0c0a09] font-bold px-6 py-3 rounded-xl text-xs shadow-[0_4px_20px_rgba(232,184,109,0.3)] group-hover:brightness-110 active:scale-95 transition flex items-center gap-2"
      >
        <span>✨</span> Browse Contract Files
      </button>

      {/* Supported Contract Tags at bottom of box */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 pt-6 border-t border-[#E8B86D]/15 w-full max-w-md text-[11px] font-mono-code text-slate-400 font-medium">
        <span className="bg-[#14100c]/80 px-3 py-1 rounded-lg border border-[#E8B86D]/20">Rent Deed</span>
        <span className="bg-[#14100c]/80 px-3 py-1 rounded-lg border border-[#E8B86D]/20">NDA</span>
        <span className="bg-[#14100c]/80 px-3 py-1 rounded-lg border border-[#E8B86D]/20">Service Agreement</span>
        <span className="bg-[#14100c]/80 px-3 py-1 rounded-lg border border-[#E8B86D]/20">Employment Contract</span>
      </div>
    </div>
  );
}

// Main component
export default function ContractGuard() {
  const [auditData, setAuditData] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | Risk>("all");
  const [uploading, setUploading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", "contract");
      
      const response = await apiFetch("/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response && response.id) {
        pollAnalysis(response.id, file.name);
      } else {
        setErrorMessage("Upload succeeded but no document ID was returned from server.");
        setUploading(false);
      }
    } catch (err: any) {
      console.error("Upload failed", err);
      setErrorMessage("Connection to server failed. NyayaSahayak formal services are currently offline. Please wait or try again another time.");
      setUploading(false);
    }
  };

  const pollAnalysis = (docId: string, filename: string) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 30; // Max 60 seconds (2s interval)

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setPolling(false);
        setUploading(false);
        setErrorMessage("Analysis request timed out. Please check backend logs or try again.");
        return;
      }

      try {
        const data = await apiFetch(`/documents/${docId}/analysis`);
        if (data.analysis_status === "completed") {
          clearInterval(interval);
          
          const riskScoreMap: Record<string, number> = { high: 85, medium: 50, low: 20 };
          const clausesList: Clause[] = Array.isArray(data.clauses) ? data.clauses.map((c: any) => {
            const riskLevel = (c.risk_level || c.risk || "medium").toLowerCase() as Risk;
            const rawScore = c.risk_score !== null && c.risk_score !== undefined
              ? Math.round(parseFloat(String(c.risk_score)) * 100)
              : riskScoreMap[riskLevel] ?? 50;
            return {
              id: c.id || String(Math.random()),
              title: c.clause_type || c.type || "Unnamed Clause",
              text: c.clause_text || c.text || "",
              risk: riskLevel,
              confidence: rawScore,
              whyRisky: c.explanation || "Risk elements identified in the wording of this clause.",
              relevantLaw: c.relevant_law || "Indian Contract Act, 1872",
              negotiationQuestions: Array.isArray(c.talking_points) && c.talking_points.length > 0
                ? c.talking_points
                : (Array.isArray(c.negotiationQuestions) && c.negotiationQuestions.length > 0
                    ? c.negotiationQuestions
                    : [`What is the justification for the current wording of this clause?`, `Can this be made more balanced for both parties?`]),
              standardAlternative: c.standard_practice || c.standard_alternative || c.standardAlternative || "Standard practice requires balanced, mutual obligations.",
            };
          }) : [];

          setAuditData({
            filename: filename,
            status: "Completed",
            overallScore: data.overall_risk_score ? Math.round(parseFloat(data.overall_risk_score) * 100) : 40,
            clauses: clausesList,
          });
          setPolling(false);
          setUploading(false);
        } else if (data.analysis_status === "failed") {
          clearInterval(interval);
          setPolling(false);
          setUploading(false);
          setErrorMessage("AI Contract Analysis failed. Please verify your document text and backend server logs.");
        }
      } catch (err: any) {
        clearInterval(interval);
        setPolling(false);
        setUploading(false);
        setErrorMessage("Connection to server failed. NyayaSahayak formal services are currently offline. Please wait or try again another time.");
        console.error("Polling error", err);
      }
    }, 2000);
  };

  const displayed = auditData
    ? (filter === "all" ? auditData.clauses : auditData.clauses.filter((c: any) => c.risk === filter))
        .slice()
        .sort((a: any, b: any) => {
          const riskPriority: Record<Risk, number> = { high: 3, medium: 2, low: 1 };
          if (riskPriority[a.risk] !== riskPriority[b.risk]) {
            return riskPriority[b.risk] - riskPriority[a.risk];
          }
          return b.confidence - a.confidence;
        })
    : [];

  const counts = auditData ? {
    all: auditData.clauses.length,
    high: auditData.clauses.filter((c: any) => c.risk === "high").length,
    medium: auditData.clauses.filter((c: any) => c.risk === "medium").length,
    low: auditData.clauses.filter((c: any) => c.risk === "low").length,
  } : null;

  const overallRiskInfo = auditData
    ? getOverallScoreAndLabel(auditData.clauses, auditData.overallScore)
    : { score: 0, label: "Low Risk" };

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
          background-image: radial-gradient(rgba(232, 184, 109, 0.18) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* 🔮 2. GLASSMORPHISM CARD SURFACES */
        .glass-card, .glass-panel {
          background: rgba(24, 20, 17, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(232, 184, 109, 0.18);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .glass-card-hover:hover, .glass-panel-hover:hover {
          border-color: rgba(232, 184, 109, 0.45);
          background: rgba(30, 25, 21, 0.85);
        }
      `}</style>

      {/* ✨ 3. AMBIENT RADIAL GLOW WIDGETS (Warm Golden Light from behind) */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#E8B86D]/10 via-amber-700/5 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-amber-600/10 to-transparent rounded-full blur-[100px] pointer-events-none"></div>

      {/* ⚖️ 4. THE "SCALES OF JUSTICE" BACKGROUND WATERMARK */}
      <div className="absolute top-1/4 -right-10 text-[#E8B86D] opacity-[0.03] select-none pointer-events-none font-serif-legal leading-none z-0 transform -rotate-12">
        <svg width="550" height="550" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* PAGE HEADER */}
        <header className="border-b border-[#E8B86D]/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl drop-shadow-[0_0_10px_rgba(232,184,109,0.5)]">🛡️</span>
              <h1 className="font-serif-legal text-2xl md:text-3xl font-bold text-[#FBFBFA] tracking-wide">ContractGuard</h1>
              <span className="text-[11px] font-mono-code bg-[#E8B86D]/15 text-[#E8B86D] border border-[#E8B86D]/40 px-3 py-0.5 rounded-full font-bold shadow-sm">
                {auditData ? "AUDIT COMPLETE" : "AI CLAUSE AUDITOR"}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">Upload any legal agreement to audit key clauses, identify risks, and get custom negotiation recommendations.</p>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl text-xs font-mono-code text-[#E8B86D] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            <span>Mapped to Indian Contract Act, 1872</span>
          </div>
        </header>

        {/* MAIN BODY SWITCH */}
        {!auditData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* 📤 LEFT COLUMN: TALL UPLOAD DROPZONE + AI CHECKLIST (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              
              {errorMessage ? (
                <div className="flex-1 min-h-[380px] flex flex-col items-center justify-center gap-6 py-14 px-8 rounded-3xl border glass-card border-[#F87171]/40"
                  style={{ boxShadow: "0 0 40px rgba(248,113,113,0.05)" }}>
                  <div className="w-16 h-16 rounded-2xl bg-[#3B1816] border border-[#F87171]/30 flex items-center justify-center text-2xl text-[#F87171] animate-pulse">
                    ⚠️
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-base font-bold text-white font-serif-legal">Analysis Failed</h3>
                    <p className="text-xs text-slate-300 max-w-sm leading-relaxed font-medium">
                      {errorMessage}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="bg-[#3B1816] hover:bg-[#4c201e] text-[#F87171] border border-[#F87171]/40 px-6 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>🔄</span> Try Again / Re-upload
                  </button>
                </div>
              ) : (
                /* UPLOAD ZONE */
                <UploadZone onUpload={handleUpload} uploading={uploading} polling={polling} />
              )}

              {/* WHAT CONTRACTGUARD SCANS FOR */}
              {!uploading && !polling && !errorMessage && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#E8B86D]/15">
                    <span className="text-xs font-mono-code uppercase tracking-wider text-[#E8B86D] font-bold flex items-center gap-1.5">
                      <span>⚡</span> What Our AI Auditor Scans For:
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono-code font-medium">Instant Detection</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-slate-200">
                    <div className="flex items-center gap-2 bg-[#14100c]/90 p-2.5 rounded-xl border border-[#F87171]/30">
                      <span className="text-[#F87171] font-bold">⚠️</span>
                      <span>One-Sided Termination Rules</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#14100c]/90 p-2.5 rounded-xl border border-[#FBA919]/30">
                      <span className="text-[#FBA919] font-bold">💸</span>
                      <span>Deposit Forfeiture Traps</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#14100c]/90 p-2.5 rounded-xl border border-blue-400/30">
                      <span className="text-blue-400 font-bold">⚖️</span>
                      <span>Biased Arbitration Clauses</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#14100c]/90 p-2.5 rounded-xl border border-purple-400/30">
                      <span className="text-purple-400 font-bold">🔒</span>
                      <span>Unfair Lock-in & Non-competes</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* 📑 RIGHT COLUMN: SAMPLE DOCUMENTS (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col">
              
              <div className="glass-card rounded-3xl p-6 flex-1 flex flex-col justify-between space-y-6">
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono-code uppercase tracking-wider text-[#E8B86D] font-bold">SAMPLE DOCUMENTS</span>
                    <span className="text-[11px] font-mono-code text-slate-400 font-semibold">Pre-analyzed</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Not sure where to start? Explore a pre-analyzed audit report to see how ContractGuard reads clauses, assesses risk, and recommends alternatives — click any sample below.
                  </p>
                </div>

                {/* Stacked Sample Cards */}
                <div className="space-y-3.5">
                  {SAMPLE_DOCS.map(a => (
                    <div
                      key={a.name}
                      onClick={() => {
                        if (uploading || polling) return;
                        
                        let clausesList: Clause[] = [];
                        if (a.type === "Rent Agreement") {
                          clausesList = RENT_AGREEMENT_CLAUSES;
                        } else if (a.type === "Non-Disclosure Agreement") {
                          clausesList = NDA_CLAUSES;
                        } else if (a.type === "Service Agreement") {
                          clausesList = SERVICE_AGREEMENT_CLAUSES;
                        } else if (a.type === "Employment Contract") {
                          clausesList = EMPLOYMENT_CONTRACT_CLAUSES;
                        } else {
                          clausesList = RENT_AGREEMENT_CLAUSES;
                        }

                        setAuditData({
                          filename: a.name,
                          status: "Completed",
                          overallScore: a.score,
                          clauses: clausesList,
                        });
                      }}
                      className={`bg-[#14100c]/90 hover:bg-[#1c1611] p-4 rounded-2xl border border-[#E8B86D]/20 hover:border-[#E8B86D]/60 transition cursor-pointer group shadow-md ${
                        uploading || polling ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[11px] font-mono-code px-2 py-0.5 rounded border font-bold ${
                          a.type === "Rent Agreement" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                          a.type === "Non-Disclosure Agreement" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                          a.type === "Service Agreement" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" :
                          "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        }`}>
                          {a.type}
                        </span>
                        <div className="flex gap-1 font-mono-code text-[10px] font-bold">
                          {a.high > 0 && <span className="bg-[#3B1816] text-[#F87171] border border-[#F87171]/30 px-1.5 py-0.5 rounded">{a.high}H</span>}
                          {a.medium > 0 && <span className="bg-[#382613] text-[#FBA919] border border-[#FBA919]/30 px-1.5 py-0.5 rounded">{a.medium}M</span>}
                          {a.low > 0 && <span className="bg-[#163323] text-[#4ADE80] border border-[#4ADE80]/30 px-1.5 py-0.5 rounded">{a.low}L</span>}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#E8B86D] transition truncate">{a.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">{a.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Bottom micro-hint */}
                <div className="pt-3 border-t border-[#E8B86D]/15 text-center">
                  <span className="text-[11px] font-mono-code text-slate-400 font-semibold">💡 Tip: Clicking a sample loads its live audit cards instantly</span>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 🥧 LEFT PANEL: BIOMETRIC RISK CONSOLE (4 Columns) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
              
              {/* File Info Scanner Card */}
              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#E8B86D] font-bold">ANALYZING FILE</span>
                  <span className="text-[10px] font-mono-code bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> Completed
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-[#0c0a09]/80 p-3.5 rounded-xl border border-[#E8B86D]/15">
                  <div className="w-10 h-10 rounded-lg bg-[#E8B86D]/10 border border-[#E8B86D]/30 flex items-center justify-center text-lg flex-shrink-0 text-[#E8B86D] shadow-inner">
                    📄
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white truncate">{auditData.filename}</h4>
                    <p className="text-[11px] font-mono-code text-slate-400 mt-0.5">Scanned • {auditData.clauses?.length || 0} Clauses • OCR Verified</p>
                  </div>
                </div>
              </div>

              {/* Overall Risk Donut Console */}
              <div className="glass-panel rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <span className="text-xs font-mono-code uppercase tracking-wider text-slate-300 font-bold block mb-6">OVERALL CONTRACT RISK</span>

                {/* Conic gradient risk donut simulation */}
                <div
                  className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${
                      overallRiskInfo.score < 40 ? "#4ADE80" : overallRiskInfo.score < 70 ? "#FBA919" : "#F87171"
                    } 0% ${overallRiskInfo.score}%, #1e1814 ${overallRiskInfo.score}% 100%)`,
                    boxShadow: `0 0 30px rgba(${
                      overallRiskInfo.score < 40 ? "74,222,128" : overallRiskInfo.score < 70 ? "251,169,25" : "248,113,113"
                    }, 0.15)`
                  }}
                >
                  <div className="w-32 h-32 bg-[#14100c] rounded-full flex flex-col items-center justify-center shadow-2xl border border-[#E8B86D]/15">
                    <span className="text-3xl font-bold text-white font-mono-code tracking-tight">{overallRiskInfo.score}%</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 px-2 py-0.5 rounded border ${
                      overallRiskInfo.score < 40 ? "text-[#4ADE80] bg-[#4ADE80]/10 border-[#4ADE80]/30" :
                      overallRiskInfo.score < 70 ? "text-[#FBA919] bg-[#FBA919]/10 border-[#FBA919]/30" :
                      "text-[#F87171] bg-[#F87171]/10 border-[#F87171]/30"
                    }`}>
                      {overallRiskInfo.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium mb-6 bg-[#0c0a09]/60 py-2.5 px-3 rounded-xl border border-[#E8B86D]/15">
                  Risk score: <strong className="text-white">{overallRiskInfo.score}%</strong>. <strong className="text-[#E8B86D]">{auditData.clauses?.length || 0} clauses</strong> identified.
                </p>

                {/* 3D Glass Risk Counter Boxes */}
                <div className="grid grid-cols-3 gap-2.5 font-mono-code text-center">
                  <div className="bg-[#3B1816]/90 border border-[#F87171]/40 p-3 rounded-xl shadow-inner">
                    <span className="text-xl font-bold text-[#F87171] block">{counts!.high}</span>
                    <span className="text-[10px] uppercase text-[#F87171]/90 font-bold">High</span>
                  </div>
                  <div className="bg-[#382613]/90 border border-[#FBA919]/40 p-3 rounded-xl shadow-inner">
                    <span className="text-xl font-bold text-[#FBA919] block">{counts!.medium}</span>
                    <span className="text-[10px] uppercase text-[#FBA919]/90 font-bold">Medium</span>
                  </div>
                  <div className="bg-[#163323]/90 border border-[#4ADE80]/40 p-3 rounded-xl shadow-inner">
                    <span className="text-xl font-bold text-[#4ADE80] block">{counts!.low}</span>
                    <span className="text-[10px] uppercase text-[#4ADE80]/90 font-bold">Low</span>
                  </div>
                </div>
              </div>

              {/* Upload Another Document CTA */}
              <button
                onClick={() => { setAuditData(null); setFilter("all"); }}
                className="w-full glass-panel glass-panel-hover text-white py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] border border-[#E8B86D]/30 cursor-pointer"
              >
                <span>🔄</span> Upload Another Document
              </button>

            </div>

            {/* 📜 RIGHT PANEL: GLASS ACCORDION CLAUSES (8 Columns) */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8B86D] shadow-[0_0_8px_rgba(232,184,109,0.8)]"></span>
                    Identified Clauses ({displayed.length})
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-1.5 bg-[#0c0a09]/80 p-1 rounded-xl border border-[#E8B86D]/15 font-mono-code text-xs">
                  <button
                    onClick={() => setFilter("all")}
                    className={`font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                      filter === "all" ? "bg-gradient-to-r from-[#E8B86D] to-[#D4A853] text-[#0c0a09] shadow" : "text-slate-400 hover:bg-white/5 font-semibold"
                    }`}
                  >
                    All ({counts!.all})
                  </button>
                  <button
                    onClick={() => setFilter("high")}
                    className={`font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                      filter === "high" ? "bg-[#3B1816] text-[#F87171] border border-[#F87171]/30 shadow" : "text-[#F87171] hover:bg-white/5 font-semibold"
                    }`}
                  >
                    High ({counts!.high})
                  </button>
                  <button
                    onClick={() => setFilter("medium")}
                    className={`font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                      filter === "medium" ? "bg-[#382613] text-[#FBA919] border border-[#FBA919]/30 shadow" : "text-[#FBA919] hover:bg-white/5 font-semibold"
                    }`}
                  >
                    Med ({counts!.medium})
                  </button>
                  <button
                    onClick={() => setFilter("low")}
                    className={`font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                      filter === "low" ? "bg-[#163323] text-[#4ADE80] border border-[#4ADE80]/30 shadow" : "text-[#4ADE80] hover:bg-white/5 font-semibold"
                    }`}
                  >
                    Low ({counts!.low})
                  </button>
                </div>
              </div>

              {/* Accordion List */}
              <div className="space-y-5">
                {displayed.map(c => (
                  <ClauseAccordionCard key={c.id} clause={c} />
                ))}
                {displayed.length === 0 && (
                  <div className="text-center py-12 text-sm text-slate-400 glass-panel rounded-2xl">
                    No {filter} risk clauses found in this document.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
