# CreditIn — Financial What-If Simulator for Indian Credit

> **"Your credit score tells you what happened. CreditIn tells you what happens next."**

CreditIn is a deterministic financial what-if simulator tailored for the Indian credit market. When a user asks a plain question — *"what if I pay ₹50,000 toward my card?"* or *"should I close my Axis card?"* — CreditIn computes the exact mathematical impact on their credit health and cash flow **before** they take action.

Built for **Code Build 1.0 (Team Zero)**.

---

## The Architectural Rule

> **The LLM parses and explains. The engine calculates. The LLM never performs arithmetic.**

Every score, EMI, FOIR percentage, and rupee figure is computed by deterministic, pure Python functions in `backend/app/services/` using `decimal.Decimal` with 100% test coverage. The LLM only parses natural language into structured parameters and generates narrative prose around numbers it was explicitly handed. A strict numeral guard rejects any prose containing hallucinated numbers and falls back to deterministic template generation.

---

## The Five Golden Demo Beats

These five numbers are mathematically verified ground truth:

| Persona | Scenario | Health Score Move | Key Financial Insight |
|---|---|:---:|---|
| **Rohit Sharma** | Base Profile | **66** (Fair) | FOIR 49.0% (34.2/100), Utilization 30.0% |
| **Rohit Sharma** | Close Axis Ace Card | **66 → 60** (Fair) | Counterintuitive: balance stays owed, credit limit shrinks, utilization spikes 30% → 45% |
| **Rohit Sharma** | Pay ₹50,000 from Savings | **66 → 74** (Healthy) | Emergency floor breached (2.65 mo < 3.0 mo). Counter-proposal: **₹29,700** keeps 3.0 mo runway |
| **Priya Nair** | Take ₹8L Car Loan @ 9.2% × 60mo | **66 → 39** (Critical) | **DECLINE**: Obligations push FOIR to 65.7% (exceeds 40% healthy / 50% max threshold) |
| **Arjun Mehta** | Take ₹3L Loan @ 11.0% × 36mo | **97 → 96** (Strong) | **APPROVE**: FOIR remains safe at 28.0%, monthly surplus remains ₹84k+ |

---

## Technology Stack

- **Backend**: Python 3.11+ with FastAPI, SQLAlchemy 2.x, Pydantic v2
- **Financial Math**: `decimal.Decimal` throughout (never `float` for currency)
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts
- **Safety**: Pure-Python deterministic engine, Numeral Guard regex verification, Pre-seeded demo result cache

---

## Local Setup & Quickstart

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install pinned dependencies
pip install -r requirements.txt

# Run the FastAPI test suite
pytest -v

# Start the backend server (runs at http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to web frontend
cd apps/web

# Install dependencies
npm install

# Run the Next.js development server (runs at http://localhost:3000)
npm run dev
```

---

## Running Verification Tests

Run the complete test suite containing all 38 test vectors:

```bash
cd backend
python -m pytest tests/ -v
```

All tests pass without external network or database requirements:
- `test_financial_math.py`: Standard reducing-balance EMI and amortization schedules to the paisa.
- `test_health_score.py`: 6-component piecewise score curves and monotonicity tests.
- `test_personas.py`: Verification of the 3 seeded personas (Rohit 66, Priya 66, Arjun 97).
- `test_pay_debt.py`: Pay-debt scenario and closed-form emergency floor counter-proposal.
- `test_close_card.py`: Invariant verification that closing a card leaves balance owed and credit age intact.
- `test_take_loan.py`: Three-way gate underwriting rules (FOIR, surplus, runway).
- `test_optimizer.py`: Avalanche vs Snowball vs Credit-Optimized rollover debt payoffs.
- `test_explainer.py`: Strict numeral guard detecting and rejecting hallucinated numbers.
- `test_api.py`: FastAPI endpoints and Decimal string serialization.
