# AGENTS.md — CreditIn

**Put this file at the repo root before running any prompt.** Antigravity / Gemini reads it
automatically, so every prompt inherits this context and can stay short. If you ever get output that
contradicts this file, paste the relevant section back into the chat.

---

## What we're building

CreditIn is a financial **what-if simulator** for the Indian credit market. A user asks a plain
question — *"what if I pay ₹50,000 toward my card?"* — and we project the impact on their credit
health and cash flow **before** they act. Hackathon build: Code Build 1.0, Team Zero.

**Hard deadline: 48 hours. 2–3 developers. The judged demo is the deliverable.**

## Locked scope — exactly four features

1. **Financial Health Score** — composite 0–100 across six components
2. **What-If Engine** — three scenarios only: pay debt, take loan, close card
3. **Debt Payoff Optimizer** — avalanche / snowball / balanced
4. **Demo personas** — three seeded profiles, no login required

Anything not on that list is out of scope. If a prompt seems to call for auth, push notifications,
PDF parsing, dispute workflows, BNPL tracking, or a marketplace, **stop and ask** — those are
deliberately cut.

## The second rule: the UI is frozen

> **The landing page is already designed. Its design is final. Build behaviour on top of it and
> change nothing about how it looks.**

This is not a stylistic preference — it is a hard constraint, and it holds for every prompt in this
project unless the human explicitly lifts it.

- **Landing-page files are read-only.** Read them to learn the design. Never edit, reformat,
  refactor or "clean up" any of them. If a task appears to require changing one, **stop and say so**
  instead of doing it.
- **Introduce no new visual decisions.** No new colour, font, icon set, UI library, CSS framework,
  radius, shadow or spacing step. Everything new is assembled from what already exists.
- **Reuse before creating.** If a Button, Card, Input or Badge component exists, that is *the*
  component. Build a new one only when nothing covers the need, and match the nearest existing
  pattern when you do.
- **Do not change light/dark mode**, and do not add a theme toggle.
- **Behaviour, data, correctness and accessibility semantics are always in scope.** Wiring an input,
  adding a loading state, fixing a keyboard trap, adding an `aria-label` or an `sr-only` label —
  none of those change how it looks, so all of them are fine.
- **Accessibility contrast failures are reported, not recoloured.** Produce a table of failing
  pairs with measured ratios and stop. A human decides whether to accept the failure or change a
  token. Where the failing pair is one you introduced, fix it by picking a different *existing*
  token pair, never by inventing a colour.

Design tokens live wherever the landing page already keeps them; if it has none, they are lifted
verbatim into `web/lib/tokens.ts`. That file records the existing design — it does not define a new
one.

## The one architectural rule

> **The LLM parses and explains. The engine calculates. The LLM never performs arithmetic.**

Every number a user sees is produced by deterministic Python in `services/` and covered by a test.
The LLM's only jobs are turning free text into structured parameters and writing prose around
numbers it was handed. This is the project's main technical selling point — do not blur it.

## Stack (do not substitute)

| Layer | Choice | Notes |
|-------|--------|-------|
| Backend | **Python 3.11 + FastAPI** | All logic lives here. Single service. |
| DB | **PostgreSQL** + SQLAlchemy 2.x | Supabase-hosted, used purely as a connection string. No Supabase SDK, no Auth, no Edge Functions. |
| Frontend | **Next.js 16, App Router, TypeScript** | Thin client. Zero business logic. |
| Styling | **Tailwind** | Using the landing page's existing theme. Do not add another styling system. |
| Charts | **Recharts** | |
| Money | **`decimal.Decimal`** in Python, `NUMERIC(14,2)` in Postgres | **Never float.** |
| Tests | **pytest** | |
| PWA | `@serwist/next` | Not `next-pwa` — that package is unmaintained. |

**Next.js 16 gotcha:** `params` and `searchParams` are `Promise`s. You must `await` them. Code
written for Next 14 will break here.

## Repo layout

```
creditin/
├── AGENTS.md
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── models/          # SQLAlchemy tables + Pydantic schemas
│   │   ├── routers/         # FastAPI endpoints, thin — no logic
│   │   ├── services/        # ALL business logic lives here
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
└── web/
    ├── app/                 # Next.js App Router — landing page here is READ-ONLY
    ├── components/          # landing-page components are READ-ONLY; new ones reuse their patterns
    ├── lib/                 # api.ts, types.ts, format.ts, tokens.ts
    └── public/
```

The `web/` tree already exists and the landing page in it is finished. Add to it; do not rewrite it.

Business logic goes in `services/`. Routers only validate input, call a service, return a response.
Never put a formula in a router or a React component.

## Threshold constants

These live in `backend/app/services/constants.py` and are imported everywhere. Never inline a magic
number in place of one of these.

```python
FOIR_HEALTHY           = Decimal("0.40")   # above this, decline new credit
FOIR_OVERLEVERAGED     = Decimal("0.50")
EMERGENCY_FLOOR_MONTHS = Decimal("3.0")    # below this, guard-rail fires
UTILIZATION_TARGET     = Decimal("0.30")
SINGLE_CARD_DANGER     = Decimal("0.90")
MIN_PAYMENT_RATE       = Decimal("0.05")   # card minimum = 5% of balance
FULL_AGE_MONTHS        = Decimal("84")     # 7 years = full marks on credit age
```

## Financial Health Score — the authoritative spec

Weights sum to 100: **Utilization 25 · Payment Reliability 25 · Debt Load (FOIR) 20 · Cash Flow 12 ·
Emergency Fund 10 · Credit Age & Mix 8**

`overall = Σ(component × weight) / 100`, rounded to nearest int.

**Bands:** 0–39 Critical · 40–54 At Risk · 55–69 Fair · 70–84 Healthy · 85–100 Strong

```
UTILIZATION   U = revolving_used / revolving_limit   (credit cards only, never term loans)
  U <= 0.10        -> 100
  0.10 < U <= 0.30 -> 100 - (U - 0.10) * 150
  0.30 < U <= 0.50 ->  70 - (U - 0.30) * 150
  0.50 < U <= 0.75 ->  40 - (U - 0.50) * 100
  U > 0.75         -> max(0, 15 - (U - 0.75) * 60)
  THEN: if any single card > 0.90 utilization, subtract 10 (floor 0)

PAYMENT RELIABILITY   trailing 12 months
  base = 100 * (on_time / total)
  -40 if any 30+ DPD in last 3 months
  -20 if any 30+ DPD in months 4-12
  -60 if any 90+ DPD in last 12 months
  floor 0.  No payment history at all -> 60 (thin file, not 100)

DEBT LOAD (FOIR)   F = (loan EMIs + card minimums + rent) / monthly_income
  F <= 0.30        -> 100
  0.30 < F <= 0.40 -> 100 - (F - 0.30) * 300
  0.40 < F <= 0.50 ->  70 - (F - 0.40) * 400
  0.50 < F <= 0.65 -> max(0, 30 - (F - 0.50) * 200)
  F > 0.65         -> 0

CASH FLOW   S = (income - other_expenses - obligations) / income
  S >= 0.30 -> 100 ;  0 <= S < 0.30 -> S * 333.33 ;  S < 0 -> 0

EMERGENCY FUND   M = emergency_fund / (other_expenses + obligations)
  M >= 6 -> 100 ;  else min(100, M * 16.67)

CREDIT AGE & MIX
  age = min(100, avg_account_age_months / 84 * 100)
  mix = 40 if 1 account type, 70 if 2, 100 if 3+
        types are: credit_card, secured_loan, unsecured_loan
  component = 0.7 * age + 0.3 * mix
```

## Scenario rules that are easy to get wrong

**Closing a card does not erase its balance.** The balance migrates to the user's total; only the
credit limit disappears. So `revolving_limit` shrinks while `revolving_used` stays constant, and
utilization **rises**. Getting this backwards destroys the best moment in our demo.

A closed card also **keeps counting toward credit age and toward minimum payments** — you still owe
it, and real bureaus keep closed accounts on file for years. So closing a card changes exactly one
component: utilization. If your `age_mix` moves when a card closes, you have excluded closed
accounts from the age average, and closing a *newer* card will wrongly look like an improvement.

**Paying debt from savings reduces the emergency fund.** Always recompute the emergency-fund
component after a payment, and fire the guard-rail if coverage drops below
`EMERGENCY_FLOOR_MONTHS`. When it fires, also compute the largest payment that would *keep*
coverage at three months and offer it as a counter-proposal. Solve it in closed form rather than
searching — paying `X` also cuts the card minimum by `MIN_PAYMENT_RATE * X`, so:

```
X_max = (fund - FLOOR * (other_expenses + obligations)) / (1 - FLOOR * MIN_PAYMENT_RATE)
```

Floor `X_max` down to the nearest ₹100 so rounding can never breach the guard-rail.

**A new loan lowers average account age** and adds a hard enquiry, even though it may improve mix.

## Verified golden values — treat as ground truth

```
EMI(P=500000, r=10.5%, n=60)  = 10746.95   total interest 144817.01
EMI(P=1500000, r=9.2%, n=84)  = 24286.14   total interest 540036.14
EMI(P=800000,  r=9.2%, n=60)  = 16684.44
EMI(P=300000,  r=11.0%, n=36) =  9821.62
EMI with r=0 -> P / n exactly

utilization score at U = 0.10 / 0.30 / 0.50 / 0.75 / 1.00  ->  100 / 70 / 40 / 15 / 0
utilization score at U = 0.20 / 0.40 / 0.60 / 0.90         ->   85 / 55 / 30 /  6
FOIR score at F = 0.30 / 0.40 / 0.45 / 0.50 / 0.65         ->  100 / 70 / 50 / 30 / 0
cash-flow score at S = 0.00 / 0.15 / 0.30 / 0.40           ->    0 / 50 / 100 / 100
emergency score at M = 0 / 1 / 3 / 6 months                ->    0 / 16.7 / 50 / 100
```

## The five demo numbers

Computed, not estimated. If a change moves any of these, it is a regression, not an improvement.

| Case | Overall | Band |
|---|---:|---|
| Rohit, base | **66** | Fair |
| Rohit, close Axis Ace | **60** | Fair |
| Rohit, pay ₹50,000 from savings | **74** | Healthy · guard-rail fires, counter-proposal **₹29,700** |
| Priya, after ₹8L car loan @9.2%×60 | **39** | Critical · FOIR 65.7%, decline |
| Arjun, after ₹3L loan @11%×36 | **96** | Strong · FOIR 28.0%, approve (base 97) |

Rohit's components at base: utilization 70.0 · payment 80.0 · FOIR 34.2 · cash flow 96.1 ·
emergency 58.2 · age & mix 49.9. Obligations ₹35,246.95.

## Conventions

- Every service function is **pure where possible**: takes a state object, returns a new result. No
  hidden mutation of inputs.
- Every scenario returns the same envelope:
  `{score_before, score_after, component_deltas, money_facts, guard_rails, verdict, explanation}`
- Money crossing the API is a **string** (`"10746.95"`), not a float, so precision survives JSON.
- Tests live in `backend/tests/` mirroring the `services/` layout, named `test_<module>.py`.
- Secrets only in `backend/.env`, gitignored from the first commit. **No key ever reaches the
  browser** — the frontend calls our API, never an LLM provider directly.
- Every DB query filters by `user_id`. There is no row-level security here, so scoping is manual and
  mandatory. Route everything through one `scoped_query(user_id)` helper.

## Do not

- Do not use `float` for money, anywhere.
- Do not let the LLM compute, adjust, or restate a number it was not explicitly handed.
- **Do not change the UI.** No restyling, no redesign, no new colours or fonts, no editing a
  landing-page file. Behaviour only, until the human says otherwise.
- Do not add features outside the four in scope.
- Do not add auth, Supabase SDK, push notifications, or PDF parsing.
- Do not install dependencies beyond what a prompt names. Ask first.
- Do not add a UI, component, or icon library. Recharts is the only frontend addition.
- Do not modify files a prompt did not list. If existing tests break, stop and report.
- Do not skip tests to save time. The engine's correctness is the demo.
