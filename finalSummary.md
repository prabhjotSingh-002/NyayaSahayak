# NyayaSahayak Backend — Working Architecture Summary

This document provides a clear, student-level explanation of the working architecture of the NyayaSahayak backend codebase. It details how data flows through various services, routers, and models to power the legal AI application.

---

## 🏗️ System Overview

NyayaSahayak is a FastAPI-based backend designed to assist lawyers and legal practitioners with document auditing, case management, and legal query reasoning.

It uses:
* **Supabase** for database storage, user authentication, and vector search.
* **Google Gemini API** for OCR fallback, legal document embeddings, and chat reasoning fallback.
* **Groq API / OpenRouter** for high-speed fallback text processing and backup logic.

---

## 📂 Core Configurations & Setup

### ⚙️ [config.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/config.py)
* **Purpose:** Single source of truth for all application parameters, API keys, and model choices.
* **Mechanism:** Uses Pydantic's `BaseSettings` to bind environmental variable keys directly to type-safe class attributes.

### 🚀 [main.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/main.py)
* **Purpose:** Entrypoint that boots the FastAPI application.
* **Mechanism:** Initializes routes, configures CORS middleware, registers exception handlers for rate-limiting, and mounts feature sub-routers.

### 🛡️ [dependencies.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/dependencies.py)
* **Purpose:** Implements auth validation dependencies for route endpoints.
* **Mechanism:** Extracts and verifies JWT bearer tokens using Supabase Auth. Resolves External Auth IDs to unique public database User UUIDs.

### ⏱️ [rate_limiter.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/rate_limiter.py)
* **Purpose:** Guards the backend from denial-of-service attempts.
* **Mechanism:** Tracks incoming client IP address frequencies through a Limiter instance.

## 🧠 AI Central Router

### 🔌 [router.py (AIRouter)](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/ai/router.py)
* **Purpose:** Acts as the central reasoning gateway connecting FastAPI controllers to Large Language Model endpoints.
* **Mechanism:** Implements a cascading fallback sequence: Gemini (primary) ➔ Groq (secondary fallback) ➔ OpenRouter (resort backup) to handle rate-limits and outages. Cleans response streams by stripping intermediate reasoning `<think>` tags.

## 🗄️ Database & Schemas Layer

### 💾 [database.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/models/database.py)
* **Purpose:** Initializes connection interface with the Supabase database.
* **Mechanism:** Exposes a singleton Supabase client wrapper configured with the service role key to bypass row-level permissions for background tasks.

### 📋 [schemas.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/models/schemas.py)
* **Purpose:** Declares structured Pydantic models for request bodies and response payloads.
* **Mechanism:** Ensures type-safety, default fields configuration, and serialization boundaries.

## 🛠️ Core Services Layer (Helper Utilities)

### 📈 [embedding.py (EmbeddingService)](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/services/embedding.py)
* **Purpose:** Converts legal documents and queries into vector spaces.
* **Mechanism:** Queries Google Gemini's `gemini-embedding-2` to generate 768-dimensional floating-point arrays. Implements RPM and TPM trackers. Fallback to zero-vector fillers if API limits are exhausted. (Note: Previously utilized HuggingFace Inference API with `multilingual-e5-small` model as fallback, which has been removed to keep the architecture clean and focused on Gemini APIs).

### ✂️ [chunker.py (ChunkerService)](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/services/chunker.py)
* **Purpose:** Parses and splits legal JSON files for database seeding.
* **Mechanism:** Extracts matching section numbers between old and new laws. Splices content at paragraph splits to fit maximum character constraints with a 200-character overlap window.

### 📄 [document_parser.py (DocumentParser)](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/services/document_parser.py)
* **Purpose:** Extracts text from uploaded files (both digital and scanned PDFs).
* **Mechanism:** Attempts digital extraction first. If the file is a scanned document, it preprocesses page renders via OpenCV, runs Tesseract OCR first, and falls back to a 4-model Gemini Vision API chain under rate limits.

### ⚖️ [case_analyzer.py (CaseAnalyzer)](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/services/case_analyzer.py)
* **Purpose:** Calculates case favourability indexes and drafts context summaries.
* **Mechanism:** Aggregates all uploaded case facts, timelines, and court orders into a structured context template. Passes this to the AI Router to update case metrics in the database.

### 🔒 [contract_analyzer.py (ContractAnalyzer)](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/services/contract_analyzer.py)
* **Purpose:** Audits contracts to highlight risky clauses.
* **Mechanism:** Generates a compressed search query from contract text to fetch legal RAG context. Feeds context to the AI Router to extract clause lists, risk ratings, and negotiation talking points.

## 🌐 API Routers Layer (Endpoints)

### 📂 [documents.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/routers/documents.py)
* **Purpose:** Manages document file uploads, storage, and asynchronous background parsing.
* **Mechanism:** Uploads file contents directly to Supabase Storage. Registers an asynchronous task in FastAPI background worker to extract text, run vector embedding chunking, seed chunks for RAG search, and update parent case summaries.

### ⚖️ [cases.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/routers/cases.py)
* **Purpose:** Exposes CRUD operations for legal cases, court timeline hearings, and case query copilot.
* **Mechanism:** Integrates with Supabase Database. Features a context-rich conversational endpoint (`/copilot`) that gathers case files, timelines, and statutory laws using vector embeddings similarity search, outputting answers tailored to the client's query language.

### 💬 [chat.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/routers/chat.py)
* **Purpose:** Core AI companion chat system.
* **Mechanism:** Supports conversation threads. Uses hybrid semantic search on Indian laws corpus to populate custom-structured response segments (bold summaries, legal articles citations, immediate action items, and context-dependent suggested follow-ups).

### 📝 [drafting.py](file:///c:/DRIVE EXP 2/Project/legal_AI/backend/app/routers/drafting.py)
* **Purpose:** Generates custom contracts, notices, and pleadings.
* **Mechanism:** Provides templates metadata. Runs Gemini prompts to extract missing document details based on situation summaries and outputs legal-grade agreements conforming to Indian legal structures without empty placeholders.

## 🗄️ Supabase Database Layer (Migrations)

### 📄 [001_initial_schema.sql](file:///c:/DRIVE EXP 2/Project/legal_AI/supabase/migrations/001_initial_schema.sql)
* **Purpose:** Sets up initial core tables, extensions, indexes, and Pl/pgSQL helper functions.
* **Mechanism:** Declares schemas for `users`, `cases`, `documents`, `clauses`, `hearings`, `conversations`, and `messages`. Spawns `pgvector` index (384 dimensions) for similarity searches. Includes PL/pgSQL routines for vector and full-text search.

### 📄 [002_embedding_upgrade.sql](file:///c:/DRIVE EXP 2/Project/legal_AI/supabase/migrations/002_embedding_upgrade.sql)
* **Purpose:** Upgrades database schemas for 768-dimensional vector embeddings and integrates Supabase Auth triggers.
* **Mechanism:** Drops old 384-dimensional columns, indexes, and functions. Rebuilds `vector_search` and `vector_search_knowledge` routines using `vector(768)` type mapping to support Gemini embeddings. Removes Clerk Auth fields, sets up triggers to auto-create user database profiles on signup, and adds a `seeding_log` table tracking background task resumes.

### 📄 [003_talking_points.sql](file:///c:/DRIVE EXP 2/Project/legal_AI/supabase/migrations/003_talking_points.sql)
* **Purpose:** Introduces UI-enhancing columns to the contract clause tables.
* **Mechanism:** Adds `talking_points` and `standard_practice` columns to the `clauses` schema to support negotiation features on the client application.

---

## 🎨 Frontend Application Architecture

The client side is structured as a premium SPA built with **React**, **TypeScript**, and **Vite**, prioritizing a warm glassmorphic aesthetic ("warm espresso") and highly responsive micro-animations.

### ⚙️ Main Application Core
* **[App.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/App.tsx):** Configures application routing using `react-router-dom`'s `createBrowserRouter`. Manages global Supabase session listener and synchronizes it with client store state.
* **[main.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/main.tsx):** Core entry point, initializing PDF.js workers and mounting the root App.
* **[index.css](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/index.css):** Global styling sheet setting up font tokens, custom keyframe animations, scrollbar overrides, and Tailwind directive utilities.

### 🛡️ State & Query Layer
* **[authStore.ts](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/store/authStore.ts) (Zustand):** Lightweight client-side global store managing user credentials, session payloads, loading statuses, and sign-out side effects.
* **[queryClient.ts](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/lib/queryClient.ts) (React Query):** Configures default caching parameters (5-minute stale threshold) and query hydration handlers.
* **[api.ts](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/lib/api.ts):** Wrapper around browser native Fetch. Resolves active user session tokens, appends authorization bearer headers, and handles HTTP response boundaries.

### 📂 Feature Views (Pages)
* **[Home.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/pages/Home.tsx):** Interactive landing presentation utilizing custom radial gradients and continuous marquee animations.
* **[Workspace.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/pages/Workspace.tsx):** Central user dashboard featuring count-up metrics, a global smart search, quick action paths, and a chronological workspace history log.
* **[CaseVault.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/pages/CaseVault.tsx):** Comprehensive dossier registry. Features tabs for case files and timeline logs. Houses the AI Copilot chat drawer providing interactive context queries over selected cases.
* **[ContractGuard.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/pages/ContractGuard.tsx):** Audit terminal that displays risk donuts, severity counts, and risk checklists. Includes a negotiation drawer that outlines alternative covenants.
* **[AIVakil.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/pages/AIVakil.tsx):** Conversational bilingual assistant featuring deep legal reasoning step indicators, Suggested follow-up questions, and a slider drawer detailing Indian statutory Acts.
* **[DocDraft.tsx](file:///c:/DRIVE EXP 2/Project/legal_AI/frontend/src/pages/DocDraft.tsx):** Dynamic template form wizard and situational document generator. Displays generated forms in a digital A4-paper preview panel with interactive revision prompts.





