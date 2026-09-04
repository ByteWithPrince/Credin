"""
Base models and envelope for What-If scenarios.
All scenarios return this standard envelope.
"""

from decimal import Decimal
from typing import Literal, List, Optional
from pydantic import BaseModel


def format_inr(val: Decimal) -> str:
    """
    Formats a Decimal number in Indian numbering format (lakhs/crores).
    1000 -> ₹1,000.00
    100000 -> ₹1,00,000.00
    12345678 -> ₹1,23,45,678.00
    """
    s = f"{val:,.2f}" # standard format: 1,234,567.89
    # Convert standard comma grouping to Indian 2-2-3 grouping
    parts = s.split(".")
    integer_part = parts[0].replace(",", "")
    decimal_part = parts[1] if len(parts) > 1 else "00"

    is_negative = integer_part.startswith("-")
    if is_negative:
        integer_part = integer_part[1:]

    if len(integer_part) <= 3:
        formatted_int = integer_part
    else:
        last3 = integer_part[-3:]
        remaining = integer_part[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        formatted_int = ",".join(groups) + "," + last3

    prefix = "-₹" if is_negative else "₹"
    return f"{prefix}{formatted_int}.{decimal_part}"


class GuardRail(BaseModel):
    code: str
    severity: Literal["info", "warning", "block"]
    message: str
    suggestion: Optional[str] = None


class MoneyFact(BaseModel):
    label: str
    value: str
    raw: Decimal


class ComponentDelta(BaseModel):
    component: str
    before: Decimal
    after: Decimal
    delta: Decimal


class ScenarioResult(BaseModel):
    kind: str
    score_before: int
    score_after: int
    band_before: str
    band_after: str
    component_deltas: List[ComponentDelta]
    money_facts: List[MoneyFact]
    guard_rails: List[GuardRail]
    verdict: Literal["good", "caution", "bad"]
    headline: str
    explanation: Optional[str] = None
