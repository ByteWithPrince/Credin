"""
Shared scenario models and Indian currency formatting utilities.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict


def format_inr(val: Decimal) -> str:
    """
    Formats a Decimal into Indian Rupee format with 2-2-3 grouping.
    e.g. 1000 -> "₹1,000.00", 100000 -> "₹1,00,000.00", 1234567.5 -> "₹12,34,567.50".
    """
    d = val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    is_negative = d < Decimal("0")
    d_abs = abs(d)

    parts = f"{d_abs:.2f}".split(".")
    integer_part = parts[0]
    decimal_part = parts[1]

    if len(integer_part) <= 3:
        grouped = integer_part
    else:
        last3 = integer_part[-3:]
        rest = integer_part[:-3]
        # Group rest in pairs of 2 from right to left
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        grouped = ",".join(groups) + "," + last3

    sign = "-" if is_negative else ""
    return f"{sign}₹{grouped}.{decimal_part}"


class GuardRail(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    code: str
    severity: Literal["info", "warning", "block"]
    message: str
    suggestion: Optional[str] = None


class MoneyFact(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    label: str
    value: str
    raw: Decimal


class ComponentDelta(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    component: str
    before: Decimal
    after: Decimal
    delta: Decimal


class ScenarioResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

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
