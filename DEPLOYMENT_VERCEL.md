# KNOWLEDGE BRIDGE AI — Vercel Serverless Deployment Guide (₹0.00 / Free Tiers Only)

> **TAGLINE:** *"Never Lose Critical Knowledge. Keep Every Project Moving."*  
> **BUDGET:** **STRICT ZERO-BUDGET ARCHITECTURE — ₹0.00 / $0.00 TOTAL COST**  
> **TIER:** **Vercel Hobby (Free) + Neon Serverless PostgreSQL (Free) + Google Gemini AI Studio (Free)**

---

## 1. Architecture Overview

Knowledge Bridge AI deploys to **Vercel** as a unified full-stack serverless application:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE NETWORK                             │
│                                                                        │
│   ┌──────────────────────────────────┐  ┌───────────────────────────┐  │
│   │     STATIC REACT FRONTEND        │  │  PYTHON SERVERLESS ENGINE │  │
│   │  (Vite + TypeScript + Tailwind)  │  │    (FastAPI /api/index.py)│  │
│   │   Output: frontend/dist/         │  │   Runtime: Python 3.11    │  │
│   │   Cached on Vercel Global Edge   │  │   Timeout: up to 60s      │  │
│   └──────────────────────────────────┘  └─────────────┬─────────────┘  │
└───────────────────────────────────────────────────────┼────────────────┘
                                                        │
                      ┌─────────────────────────────────┴──────────────────┐
                      │                                                    │
                      ▼                                                    ▼
       ┌──────────────────────────────┐                    ┌──────────────────────────────┐
       │   NEON SERVERLESS POSTGRES   │                    │     GOOGLE GEMINI 3.8 FLASH  │
       │    (Permanent Free Tier)     │                    │    (AI Studio Free Quota)    │
       │   0.5 GB Permanent Storage   │                    │    Dynamic Free Tier Quota   │
       │    Scale-to-zero when idle   │                    │    Auto-fallback to ₹0 Mode  │
       └──────────────────────────────┘                    └──────────────────────────────┘
```

* **Frontend:** Built via Vite into `frontend/dist` and served from Vercel's global CDN edge.
* **Backend:** Runs in Vercel's Python Serverless Functions via the standard entrypoint [`api/index.py`](./api/index.py).
* **Database:** Connects via serverless connection pooling (`pool_pre_ping=True`) to **Neon PostgreSQL Free Tier**.
* **AI:** Google Gemini 3.8 Flash via free quota with dynamic API quota handling and automatic fallback to **Zero-Cost Heuristic Mode** if rate limits occur.

---

## 2. Zero-Cost Free Tier Breakdown

| Component | Free-Tier Service | Cost | Quota / Limits | Credit Card Needed? |
| :--- | :--- | :---: | :--- | :---: |
| **Frontend & Functions** | **Vercel Hobby Plan** | **₹0.00** | 100 GB bandwidth/mo, 100 serverless execution hrs/mo, 4.5 MB request limit | **NO** |
| **Source Control** | **GitHub Free** | **₹0.00** | Unlimited repositories, 2,000 CI/CD mins/mo | **NO** |
| **Cloud Database** | **Neon PostgreSQL** | **₹0.00** | 0.5 GB permanent storage, 1 project, scale-to-zero | **NO** |
| **Primary AI** | **Google Gemini 3.8 Flash** | **₹0.00** | Dynamic Free Quota (Google AI Studio) | **NO** |
| **Fallback AI** | **Deterministic Extractor** | **₹0.00** | Unlimited local execution, ₹0.00 cost | **NO** |
| **TOTAL MONTHLY COST** | **All Free Tiers** | **₹0.00** | **Strict Zero-Budget Guarantee** | **NO** |

---

## 3. Step-by-Step Vercel Deployment Instructions

### Step 1: Push Source Code to GitHub
Ensure all code and configuration files are committed to your GitHub repository:
```bash
git add .
git commit -m "feat: configure Vercel serverless functions, Neon Postgres, and zero-budget AI"
git push origin main
```

### Step 2: Set Up Free Neon PostgreSQL Database
1. Go to [https://neon.tech](https://neon.tech) and sign up with GitHub or Google (No credit card required).
2. Click **Create Project**, name it `knowledge-bridge`, and select your preferred region.
3. On the project dashboard, copy the **Connection details** (Pooled connection string):
   ```
   postgresql://user:password@ep-cool-dawn-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Set Up Free Google Gemini API Key (Optional)
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key** (No billing or credit card required).
3. Copy the generated key (`AIzaSy...`).
*(Note: If you omit this key, the system automatically runs in 100% Free Zero-Cost Rule-Based Mode).*

### Step 4: Import Project into Vercel
1. Sign in to [Vercel](https://vercel.com) using your GitHub account (Hobby Free Plan).
2. Click **Add New...** ➔ **Project**.
3. Import your `Knowledge Bridge AI` repository.
4. In the **Configure Project** screen:
   * **Framework Preset:** Leave as `Other` or `Vite` (Vercel reads `vercel.json` automatically).
   * **Root Directory:** `./` (Leave as root).
   * **Build Command:** `cd frontend && npm install && npm run build` (Pre-configured in `vercel.json`).
   * **Output Directory:** `frontend/dist` (Pre-configured in `vercel.json`).

### Step 5: Configure Environment Variables in Vercel
Under **Environment Variables**, configure the mandatory secrets (generate high-entropy random values):

| Variable Name | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Permanent Neon PostgreSQL connection string |
| `ADMIN_TOKEN` | *(Generate via: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)* | High-entropy secret for Administrative operations |
| `TEAM_TOKEN` | *(Generate via: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)* | High-entropy secret for Team Member operations |
| `SECRET_KEY` | *(Generate via: `python -c "import secrets; print(secrets.token_hex(32))"`)* | Cryptographic signing key |
| `GEMINI_API_KEY` | *(Optional)* Google AI Studio Free Tier Key | Free-tier key from Google AI Studio |
| `AI_PROVIDER` | `auto` | Auto-selects Gemini Free Tier, degrades to Heuristic Fallback |

### Step 6: Deploy
1. Click **Deploy**.
2. Vercel will install dependencies from root `requirements.txt` and `frontend/package.json`, build the frontend bundle, and configure the Serverless Function.
3. Your live application will be instantly accessible at `https://<your-project>.vercel.app`.

---

## 4. Vercel Serverless File Storage Transparency Notice

> [!IMPORTANT]
> **Ephemeral Filesystem vs. Database Persistence:**  
> Vercel Serverless Functions execute in temporary sandbox environments with a read-only root directory and an ephemeral `/tmp` buffer.  
> 
> * **Original Binary Uploads:** Uploaded `.pdf`, `.docx`, and `.txt` files are parsed in `/tmp/uploads` upon ingestion. When the serverless instance terminates, the temporary binary files in `/tmp` are discarded.  
> * **Permanent Data Persistence:** The extracted text content, page count, character count, extracted knowledge items, human review decisions, certified handovers, and audit logs are **permanently saved in your Neon PostgreSQL database**.  
> * **Payload Limit:** Vercel enforces a **4.5 MB request body limit** on Serverless Functions. Documents uploaded through the UI or API must be under 4.0 MB.

---

## 5. Production Health & Diagnostics Verification

Once deployed to Vercel, verify your live deployment by sending an HTTP request:

```bash
curl -f https://<your-project>.vercel.app/api/health
```

Expected JSON response:
```json
{
  "status": "healthy",
  "app": "KNOWLEDGE BRIDGE AI",
  "tagline": "Never Lose Critical Knowledge. Keep Every Project Moving.",
  "ai_engine": {
    "model_id": "gemini-3.8-flash",
    "provider": "Google Gemini 3.8 Flash (Official AI Studio Free Tier)",
    "is_demo_mode": false,
    "billing_enabled": false,
    "estimated_monthly_cost": "₹0.00 / Free Tier",
    "quota_status": "ACTIVE_FREE_TIER"
  }
}
```

---

## 6. Local Testing Before Deployment

You can test the exact Vercel entrypoint locally before deploying:

```bash
# 1. Run full Vercel serverless readiness test suite
.\backend\python_env\python.exe test_vercel_readiness.py

# 2. Run API security & anti-tampering verification
.\backend\python_env\python.exe test_security_header_tampering.py

# 3. Run zero-budget quota & fallback verification
.\backend\python_env\python.exe test_free_tier_and_zero_budget.py
```

