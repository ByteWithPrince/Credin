"""
Deterministic keyword intent parser with Indian numeric unit parsing.
Zero LLM dependencies.
"""

import re
from decimal import Decimal
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

from app.models.domain import FinancialState, AccountKind


class ParsedIntent(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    kind: Literal["pay_debt", "close_card", "take_loan"]
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    amount: Optional[Decimal] = None
    principal: Optional[Decimal] = None
    annual_rate_pct: Optional[Decimal] = None
    months: Optional[int] = None
    kind_of_loan: Optional[AccountKind] = None
    confidence: float
    source: Literal["keyword", "llm"] = "keyword"


def extract_amount_inr(text: str) -> Optional[Decimal]:
    """
    Extracts Indian monetary amounts handling 'k', 'lakh/lac/L', 'crore/cr', and standard numbers.
    e.g. '50,000', '50k', '1.5 lakh', '15L', '1 crore'.
    """
    clean = text.lower().replace("₹", "").replace("rs.", "").replace("rs", "").strip()

    # Pattern: number + unit (e.g. "1.5 lakh", "15l", "50k", "1 crore", "1cr")
    unit_pattern = r"(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lakhs|lac|lacs|l|cr|crore|crores)\b"
    unit_match = re.search(unit_pattern, clean)
    if unit_match:
        val_str, unit = unit_match.groups()
        val = Decimal(val_str)
        if unit in ("k", "thousand"):
            return (val * Decimal("1000")).quantize(Decimal("0.01"))
        elif unit in ("lakh", "lakhs", "lac", "lacs", "l"):
            return (val * Decimal("100000")).quantize(Decimal("0.01"))
        elif unit in ("cr", "crore", "crores"):
            return (val * Decimal("10000000")).quantize(Decimal("0.01"))

    # Standard numeric pattern: e.g. "50,000", "50000", "1500000"
    num_pattern = r"\b(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+)\b"
    matches = list(re.finditer(num_pattern, clean))
    for m in matches:
        raw_num = m.group(1).replace(",", "")
        try:
            d = Decimal(raw_num)
            if d >= Decimal("100"):  # Ignore single/double digit numbers (like months or ages)
                return d.quantize(Decimal("0.01"))
        except Exception:
            continue

    return None


def match_account(text: str, state: FinancialState) -> Optional[tuple[str, str]]:
    """
    Fuzzy matches an account from state using issuer or display_name keywords.
    Returns (account_id, display_name) or None.
    """
    text_lower = text.lower()
    debt_accounts = [a for a in state.accounts if a.closed_date is None]
    if not debt_accounts:
        return None

    matches = []
    for a in debt_accounts:
        issuer_word = a.issuer.lower()
        name_words = a.display_name.lower().split()
        if issuer_word in text_lower or any(w in text_lower for w in name_words if len(w) > 2):
            matches.append((a.id, a.display_name))

    if len(matches) == 1:
        return matches[0]
    elif len(matches) == 0 and len(debt_accounts) == 1:
        # If exactly one account exists in state, infer it
        return (debt_accounts[0].id, debt_accounts[0].display_name)

    return None


def parse_keyword(text: str, state: FinancialState) -> Optional[ParsedIntent]:
    """
    Deterministic rule-based intent parser.
    """
    if not text or not text.strip():
        return None

    text_lower = text.lower().strip()

    # Intent detection
    pay_keywords = ["pay", "repay", "clear", "pay off", "prepay", "settle", "reduce"]
    close_keywords = ["close", "cancel", "shut", "get rid of", "surrender"]
    loan_keywords = ["loan", "borrow", "buy", "afford", "finance", "emi", "car", "house", "home", "flat", "vehicle"]

    is_pay = any(k in text_lower for k in pay_keywords)
    is_close = any(k in text_lower for k in close_keywords)
    is_loan = any(k in text_lower for k in loan_keywords)

    if is_pay:
        amt = extract_amount_inr(text)
        acc_match = match_account(text, state)
        if not acc_match and not amt:
            return None
        confidence = 0.9 if (amt and acc_match) else (0.6 if amt or acc_match else 0.4)
        acc_id = acc_match[0] if acc_match else (state.accounts[0].id if state.accounts else None)
        acc_name = acc_match[1] if acc_match else None
        return ParsedIntent(
            kind="pay_debt",
            account_id=acc_id,
            account_name=acc_name,
            amount=amt or Decimal("50000.00"),
            confidence=confidence,
            source="keyword",
        )

    elif is_close:
        acc_match = match_account(text, state)
        confidence = 0.9 if acc_match else 0.5
        acc_id = acc_match[0] if acc_match else (state.accounts[0].id if state.accounts else None)
        acc_name = acc_match[1] if acc_match else None
        return ParsedIntent(
            kind="close_card",
            account_id=acc_id,
            account_name=acc_name,
            confidence=confidence,
            source="keyword",
        )

    elif is_loan:
        amt = extract_amount_inr(text)
        is_secured = any(w in text_lower for w in ["car", "auto", "vehicle", "home", "house", "property", "flat"])
        rate = Decimal("9.2") if is_secured else Decimal("11.0")
        kind: AccountKind = "secured_loan" if is_secured else "unsecured_loan"
        months = 60 if is_secured else 36

        # Check for explicit interest rate or months in text
        rate_match = re.search(r"(\d+(?:\.\d+)?)\s*%", text_lower)
        if rate_match:
            rate = Decimal(rate_match.group(1))

        months_match = re.search(r"(\d+)\s*(?:months|mo|m|years|yrs|yr)", text_lower)
        if months_match:
            m_val = int(months_match.group(1))
            if "year" in text_lower or "yr" in text_lower:
                m_val *= 12
            months = m_val

        confidence = 0.9 if amt else 0.5
        return ParsedIntent(
            kind="take_loan",
            principal=amt or Decimal("500000.00"),
            annual_rate_pct=rate,
            months=months,
            kind_of_loan=kind,
            confidence=confidence,
            source="keyword",
        )

    return None
