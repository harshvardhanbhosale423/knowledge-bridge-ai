# KNOWLEDGE BRIDGE AI

> **"Never Lose Critical Knowledge. Keep Every Project Moving."**

---

## 🎯 Executive Overview & Problem Solved
When key engineers or project leads leave a team, undocumented architectural decisions, unfinished tasks, unassigned responsibilities, subtle risks, and cross-service dependencies disappear with them. 

**KNOWLEDGE BRIDGE AI** converts authorized project documents (**PDF**, **DOCX**, and **TXT**) into an auditable, evidence-linked knowledge handover package backed by human-in-the-loop governance.

---

## ⚡ The Core Workflow (Priority Pipeline)

```
[ 1. UPLOAD ] ➔ [ 2. ANALYZE ] ➔ [ 3. VERIFY ] ➔ [ 4. REVIEW ] ➔ [ 5. APPROVE ] ➔ [ 6. HANDOVER ]
```

1. **UPLOAD**: Ingest PDF, Word DOCX, and TXT files with format validation and page tokenization.
2. **ANALYZE**: Extract 7 core knowledge dimensions using configurable LLMs or transparent deterministic fallback.
3. **VERIFY**: Every item is matched against exact source text; flags missing or fuzzy quotations (Zero Hallucination).
4. **REVIEW**: Engineering lead edits, clarifies, or rejects extracted knowledge items with audit trail.
5. **APPROVE**: Mandatory human signature gate before handovers can be certified or shared.
6. **HANDOVER**: Exports structured, exportable continuity report tailored for incoming engineers.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic, SQLAlchemy 2.0
- **Database**: SQLite (structured for zero-friction PostgreSQL migration)
- **Document Processing**: `pypdf` (PDF), `python-docx` (DOCX), UTF-8 text parser
- **AI Integration**: Configurable for Google Gemini (`GEMINI_API_KEY`), OpenAI (`OPENAI_API_KEY`), or built-in deterministic heuristic rule-based engine (labeled transparently as Demo Mode).

---

## 🚀 Quick Start (Running the Application)

### Option A: One-Click Launcher (Windows)
Double-click `start_all.bat` or run:
```cmd
start_all.bat
```
This automatically launches both the FastAPI backend (`http://127.0.0.1:8000`) and the Vite React frontend (`http://localhost:5173`).

---

### Option B: Manual Execution

#### 1. Start the Backend API
```cmd
cd "c:\Users\Work\OneDrive\Desktop\Knowledge Bridge Ai"
.\backend\python_env\python.exe run_backend.py
```
*Backend runs on `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).*

#### 2. Start the Frontend
```cmd
cd "c:\Users\Work\OneDrive\Desktop\Knowledge Bridge Ai\frontend"
npm.cmd run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📂 Project Structure

```
Knowledge Bridge Ai/
├── backend/
│   ├── python_env/             # Portable standalone Python 3.11 runtime
│   ├── database.py             # SQLAlchemy 2.0 database engine & session
│   ├── models.py               # ORM Models (Project, Document, KnowledgeItem, HandoverReport)
│   ├── schemas.py              # Pydantic validation schemas
│   ├── extractors.py           # PDF, DOCX, TXT parsers & quote verification
│   ├── ai_engine.py            # Gemini, OpenAI & fallback heuristic extractor
│   ├── seed_data.py            # Synthetic enterprise demo dataset
│   ├── main.py                 # FastAPI application routes
│   └── uploads/                # Ingested documents storage
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                # Role switcher & AI status badge
│   │   │   ├── LandingPage.tsx           # Premium hero, workflow & feature showcase
│   │   │   ├── AdminDashboard.tsx        # High-level metrics & project repository
│   │   │   ├── ProjectWorkspace.tsx      # Main tabbed workspace
│   │   │   ├── DocumentUploadCenter.tsx  # Drag & drop upload & raw text viewer
│   │   │   ├── KnowledgeAnalysisView.tsx # 7-dimension categorized items
│   │   │   ├── EvidenceCenter.tsx        # Side-by-side evidence quote inspector
│   │   │   ├── HumanReviewCenter.tsx     # Batch approval & inline editor drawer
│   │   │   ├── HandoverGenerator.tsx     # Structured report & certification gate
│   │   │   ├── TeamMemberDashboard.tsx   # Read-only certified portal for engineers
│   │   │   ├── CreateProjectModal.tsx    # New project modal
│   │   │   ├── DocumentViewerModal.tsx   # Full extracted text viewer
│   │   │   └── SettingsModal.tsx         # AI engine configuration & diagnostics
│   │   ├── App.tsx                       # Main application state & routing
│   │   ├── api.ts                        # Typed backend API client
│   │   └── types.ts                      # Shared TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── sample_documents/                     # Synthetic test documents
│   ├── Titan_Infra_Service_Mesh_Handover.docx
│   └── Helios_Kafka_Streaming_Handover.txt
├── run_backend.py                        # Backend runner script
├── start_backend.bat                     # Start backend shortcut
├── start_frontend.bat                    # Start frontend shortcut
├── start_all.bat                         # Simultaneous launcher
└── test_full_workflow.ps1                # Automated 8-phase verification suite
```

---

## 🔒 Confidentiality & Zero-Hallucination Guarantee

1. **Evidence Grounding**: No knowledge item is verified unless its source quote exists in the source text.
2. **Transparent Fallback Mode**: When running without an API key, the system transparently identifies as *"Fallback Demo Mode"* and never falsifies findings as verified neural inferences.
3. **Synthetic Demonstration Data**: All pre-seeded projects (*Project Apollo*, *Project FinPay*, *Project Titan*) utilize synthetic architectural scenarios.

---

## 🧪 Automated Verification Test Suite

Run the full end-to-end integration test anytime with:
```powershell
powershell.exe -ExecutionPolicy Bypass -NoProfile -File test_full_workflow.ps1
```
This tests project creation, document upload, text extraction, evidence checking, batch human review, handover draft generation, human approval sign-off, and team member visibility.

