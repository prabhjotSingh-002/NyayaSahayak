from app.ai.router import ai_router
import json

class ContractAnalyzer:
    @staticmethod
    async def analyze_contract(text: str):
        """Analyzes contract clauses and checks them against Indian statutory rules."""
        system_prompt = """
        You are NyayaSahayak, an expert Indian Legal AI assistant. Analyze the given contract and identify all key clauses.
        
        For EACH clause, provide:
        1. **explanation** (whyRisky): Explain the risk in SIMPLE, EVERYDAY language as if explaining to a friend with NO legal knowledge. Use analogies ("imagine you're returning a rented car..."), concrete examples, and plain words. Minimum 2-3 sentences.
        2. **relevant_law**: State a clear legal conclusion explaining how to legally tackle or challenge this clause under Indian law, followed by the specific section number and Act (e.g., "Under Section 74 of the Indian Contract Act, unilateral security deductions without verified damage proof are treated as invalid penalties; thus, you can demand joint verification of costs under Section 74, Indian Contract Act 1872").
        3. **standard_practice**: What professional contracts in the real world actually do. Explain what is NORMAL practice, what fair contracts say, and what you should push for. Reference industry standards. Minimum 2-3 sentences.
        4. **talking_points**: 3 SPECIFIC, POINTED questions to ask the other party (landlord/employer/vendor/counterparty). Questions should be actionable and challenge the unfair wording directly.
        5. **risk**: MUST be one of exactly: "low", "medium", "high" — based on actual severity, NOT all the same value.
        6. **risk_score**: A float between 0.0 and 1.0 (e.g., 0.92 for extremely critical risk, 0.15 for minor standard risk) reflecting the specific severity of this clause.
        7. **overall_risk_score**: A float between 0.0 and 1.0 reflecting the aggregate risk of the ENTIRE contract.
        
        IMPORTANT RULES:
        - Do NOT assign "high" risk to clauses that are fair and standard (e.g. normal payment terms). Use "low" for standard clauses.
        - Vary the risk levels. A typical contract should have a MIX of high, medium, and low risk clauses.
        - explanation must be plain language — no legal jargon without explanation.
        - standard_practice must explain what a FAIR version of this clause looks like in real professional contracts.
        
        Respond ONLY with a valid JSON object in this exact format:
        {
            "overall_risk_score": 0.65,
            "clauses": [
                {
                    "type": "Clause Name (e.g., Security Deposit)",
                    "text": "Brief excerpt of the clause text...",
                    "risk": "high",
                    "risk_score": 0.88,
                    "explanation": "Plain language explanation of why this is risky for you...",
                    "relevant_law": "Under Section 74 of the Indian Contract Act, unilateral security deductions without verified damage proof are treated as invalid penalties; thus, you can demand joint verification of costs under Section 74, Indian Contract Act 1872",
                    "talking_points": [
                        "Specific pointed question 1 to ask the counterparty...",
                        "Specific pointed question 2...",
                        "Specific pointed question 3..."
                    ],
                    "standard_practice": "In professionally drafted contracts, this clause is typically written as... Real-world fair practice is..."
                }
            ]
        }
        """
        
        rag_context = ""
        try:
            from app.services.embedding import EmbeddingService
            from app.models.database import supabase
            
            # Generate optimized search query from contract text using LLM
            summary_prompt = (
                "You are an expert legal assistant. Read the following entire contract text and extract "
                "a detailed list of all key legal themes, specific clauses (like Indemnity, Non-Compete, Arbitration, "
                "Damages, Liability, Termination), and core obligations into a comprehensive search-optimized summary query "
                "of up to 1,000 words. "
                "Do not include any conversational intro or outro. Respond only with the search keywords, clauses, and topics.\n\n"
                f"Contract Text:\n{text[:50000]}"
            )
            search_query = await ai_router.generate_response(
                prompt=summary_prompt,
                system_prompt="You generate highly optimized search queries for legal database RAG search."
            )
            
            query_embedding = await EmbeddingService.embed_text(search_query)
            
            results = supabase.rpc("hybrid_search_knowledge", {
                "query_embedding": query_embedding,
                "query_text": search_query[:4000],
                "match_count": 4
            }).execute().data or []
            
            if results:
                rag_context = "\nRELEVANT INDIAN LAW REFERENCES:\n"
                for r in results:
                    rag_context += f"- {r.get('source_name')} {r.get('section')}: {r.get('content')}\n"
        except Exception as rag_err:
            print(f"Contract RAG failed (non-critical): {rag_err}")

        truncated_text = text[:15000] if len(text) > 15000 else text
        
        prompt = f"Analyze this contract:\n\n{truncated_text}"
        if rag_context:
            prompt = f"{rag_context}\n\n" + prompt
        
        try:
            response_text = await ai_router.generate_response(prompt=prompt, system_prompt=system_prompt)
            
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].strip()
                
            analysis = json.loads(response_text)
            return {
                "success": True,
                "data": analysis
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
