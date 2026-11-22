# BenefitBridge India
### Bridging Citizens to Government Benefits • AI-Powered Multilingual Guide

**BenefitBridge India** is a full-stack, AI-driven government welfare scheme discovery and eligibility assistance platform. Built specifically for citizens across all **28 Indian States and 8 Union Territories**, it bridges the critical information gap preventing farmers, women, students, senior citizens, and low-income families from unlocking legitimate financial benefits and subsidies.

---

## 🌟 Key Features

1. **Deterministic Eligibility Evaluation Engine:**
   - Evaluates citizen demographic and financial attributes against structured, official government eligibility criteria (using `eq`, `gte`, `lte`, `between`, `in` operators).
   - Classifies criteria into **`PASSED`**, **`FAILED`**, and **`UNKNOWN`** (missing data), eliminating LLM hallucination in official benefit determination.

2. **Mitra AI Multilingual Chatbot & RAG:**
   - Supports **7 Indian languages**: English, ಕನ್ನಡ (Kannada), हिन्दी (Hindi), தமிழ் (Tamil), తెలుగు (Telugu), മലയാളಂ (Malayalam), and मराठी (Marathi).
   - Multilingual intent extraction and semantic retrieval of central and state government gazettes.
   - Grounded explanations with direct official application portal links.

3. **Voice Assistant (Speech-to-Text & Text-to-Speech):**
   - Native browser Web Speech API integration with fallbacks for Indian English (`en-IN`), Kannada (`kn-IN`), Hindi (`hi-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Malayalam (`ml-IN`), and Marathi (`mr-IN`).
   - Listen to response summaries aloud with a single click.

4. **Action Plans & Document Readiness Manager:**
   - Step-by-step sequential application pathways for eligible schemes.
   - Interactive document checklist with readiness indicators (`Ready`, `In Progress`, `Not Ready`) and demo upload simulator.

5. **Citizen Dashboard & Admin Console:**
   - Real-time profile completion tracking, qualified benefits tally, and saved schemes.
   - Comprehensive admin dashboard for scheme catalog CRUD, citizen analytics, and in-app feedback review.

---

## 🏛️ Seeded Government Schemes

| Scheme Code | Scheme Name | Level | Nodal Authority | Key Benefit |
|-------------|-------------|-------|-----------------|-------------|
| **PM-KISAN** | Pradhan Mantri Kisan Samman Nidhi | Central | Ministry of Agriculture & Farmers Welfare | ₹6,000 / year (3 installments of ₹2,000) |
| **PM-JAY** | Ayushman Bharat - PM Jan Arogya Yojana | Central | National Health Authority (NHA) | ₹5,00,000 free secondary/tertiary hospital cover |
| **KA-GRUHA-LAKSHMI** | Gruha Lakshmi Scheme | State (KA) | Dept. of Women and Child Development, Karnataka | ₹2,000 / month direct transfer to woman head of family |
| **KA-RAITHA-VIDYA-NIDHI** | CM Raitha Vidya Nidhi Scholarship | State (KA) | Dept. of Agriculture, Karnataka | ₹2,000 - ₹11,000 / year education scholarship |
| **PMAY-G** | Pradhan Mantri Awas Yojana - Gramin | Central | Ministry of Rural Development | ₹1,20,000 to ₹1,30,000 housing assistance |
| **PMMY** | Pradhan Mantri Mudra Yojana | Central | Dept. of Financial Services | Collateral-free business loans up to ₹10,00,000 |
| **APY** | Atal Pension Yojana | Central | PFRDA | Guaranteed monthly pension ₹1,000 - ₹5,000 after 60 |
| **MGNREGA** | Mahatma Gandhi NREGA | Central | Ministry of Rural Development | 100 days guaranteed wage employment per household |
| **PM-KUSUM** | PM-KUSUM Component B (Solar Pumps) | Central | Ministry of New and Renewable Energy (MNRE) | Up to 60% capital subsidy for solar irrigation pump |
| **KA-YUVA-NIDHI** | Karnataka Yuva Nidhi | State (KA) | Dept. of Skill Development, Karnataka | ₹3,000/mo (graduates) / ₹1,500/mo (diploma holders) |

---

## 🚀 Live Demo Scenario: Karnataka Farmer

BenefitBridge India comes pre-configured with a 1-click demonstration scenario:
- **Citizen:** Basavaraj Patil, Mandya, Karnataka
- **Attributes:** Age 42, Farmer, 2.5 Acres cultivable land, Rural, BPL ration card, ₹1,20,000 annual income
- **Preferred Language:** Kannada (ಕನ್ನಡ)
- **Demo Trigger:** Click the **"Try Demo Scenario: Karnataka Farmer (ಕನ್ನಡ)"** badge on the homepage to instantly preload the farmer profile, switch the UI to Kannada, and prompt Mitra AI.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend:** Python 3.14 / FastAPI, SQLAlchemy, Pydantic v2
- **Database:** SQLite with WAL mode (`benefitbridge.db`)
- **Speech & Voice:** Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Deterministic Rules Engine:** Native Python engine evaluating official rule criteria
- **Security & Privacy:** Passwords hashed via SHA-256 + Salt, stateless JWT bearer tokens, zero retention of sensitive biometrics or Aadhaar OTPs.

---

## 🏃 Running the Application

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### 2. Backend Setup
```powershell
cd backend
# Set PYTHONPATH to the backend directory
$env:PYTHONPATH = (Get-Location).Path

# Install dependencies (if not already installed)
py -3 -m pip install -r requirements.txt

# Start FastAPI server on port 8000
py -3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will automatically create tables and seed the 36 States/UTs, 10 government schemes, admin account, and demo citizen.
- Interactive API Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

### 3. Frontend Setup
```powershell
cd frontend

# Build frontend to verify types
npm.cmd run build

# Start Vite development server
npm.cmd run dev
```
- Open browser at `http://localhost:5173`
- The Vite dev server automatically proxies `/api` requests to `http://127.0.0.1:8000`.

---


## 🛡️ Privacy & Compliance Disclaimer

> **Informational Use Notice:** BenefitBridge India is a demonstration GovTech prototype. All scheme parameters, eligibility criteria, and benefit values are indexed from publicly available official gazettes. BenefitBridge India **never** requests or stores Aadhaar OTPs, biometric credentials, bank PINs, or confidential security credentials. All official applications are routed directly to official government portals (e.g. `pmkisan.gov.in`, `sevasindhu.karnataka.gov.in`).
