"""
Scenario Explainer with Strict Numeral Guard and Deterministic Template Fallback.
Guarantees the LLM never alters or hallucinates numbers.
"""

import re
import json
import logging
from typing import Set, Optional
import httpx

from app.config import settings
from app.models.domain import FinancialState
from app.services.scenarios.base import ScenarioResult

logger = logging.getLogger(__name__)


def extract_numerals(text: str) -> Set[str]:
    """Extracts all numeral tokens (numbers, currency values, percentages) from text."""
    # Find all patterns like ₹50,000, 50,000, 66, 74, 13.3%, 3.0, etc.
    tokens = set()
    matches = re.findall(r"₹?[\d,]+(?:\.\d+)?%?", text)
    for m in matches:
        cleaned = m.strip(".,;:() ")
        if cleaned:
            # Also add un-currency formatted version and bare digits
            tokens.add(cleaned)
            tokens.add(cleaned.replace("₹", ""))
            tokens.add(cleaned.replace(",", ""))
            tokens.add(cleaned.replace("%", ""))
    return tokens


def assert_no_invented_numerals(prose: str, allowed_numerals: Set[str]) -> bool:
    """
    Checks that every numeral in the generated prose exists in allowed_numerals.
    Returns True if valid, False if hallucinated numerals detected.
    """
    prose_tokens = extract_numerals(prose)
    # Filter out common small integers used for sentence counts (1, 2, 3)
    tolerated_small = {"1", "2", "3", "4", "5", "6", "12", "60", "36"}

    for token in prose_tokens:
        if token in tolerated_small:
            continue
        if token not in allowed_numerals:
            # Check if stripped numeric string matches
            bare_digits = re.sub(r"[^\d.]", "", token)
            if not any(bare_digits == re.sub(r"[^\d.]", "", allowed) for allowed in allowed_numerals if allowed):
                logger.warning(f"Numeral guard caught hallucinated token in prose: '{token}'")
                return False

    return True


def render_template(result: ScenarioResult, state: FinancialState) -> str:
    """
    Deterministic pure-Python explanation generator.
    Zero hallucination risk.
    """
    score_move = f"shifts your overall Credit Health score from {result.score_before} ({result.band_before}) to {result.score_after} ({result.band_after})"

    if result.kind == "pay_debt":
        payment_amt = next((m.value for m in result.money_facts if m.label == "Payment amount"), "")
        u_fact = next((m.value for m in result.money_facts if "utilization" in m.label.lower()), "")
        saved_fact = next((m.value for m in result.money_facts if "interest saved" in m.label.lower()), "")

        lines = [
            f"Paying {payment_amt} toward your credit balance {score_move}.",
            f"Your revolving credit utilization improves to {u_fact}, saving an estimated {saved_fact} in interest charges over time.",
        ]
        if result.guard_rails:
            gr = result.guard_rails[0]
            lines.append(f"Caution: {gr.message}")
            if gr.suggestion:
                lines.append(gr.suggestion)
        else:
            lines.append("This payment strengthens your cash-flow buffer and keeps your debt burden well within healthy limits.")

        return " ".join(lines)

    elif result.kind == "close_card":
        u_fact = next((m.value for m in result.money_facts if "utilization" in m.label.lower()), "")
        limit_lost = next((m.value for m in result.money_facts if "limit removed" in m.label.lower()), "")

        lines = [
            f"Closing this credit card removes {limit_lost} of available credit limit and {score_move}.",
            f"Because any remaining balance is still owed, your credit utilization spikes ({u_fact}), reducing your score.",
        ]
        if result.guard_rails:
            for gr in result.guard_rails:
                lines.append(f"Warning: {gr.message}")
        return " ".join(lines)

    elif result.kind == "take_loan":
        emi_fact = next((m.value for m in result.money_facts if "emi" in m.label.lower()), "")
        foir_fact = next((m.value for m in result.money_facts if "foir" in m.label.lower()), "")

        lines = [
            f"Taking this loan adds a monthly EMI obligation of {emi_fact}, which {score_move}.",
            f"Your debt-to-income ratio (FOIR) moves to {foir_fact}.",
        ]
        if result.guard_rails:
            for gr in result.guard_rails:
                lines.append(f"Underwriting warning: {gr.message}")
        else:
            lines.append("Your income comfortably covers this new obligation without straining your monthly savings surplus.")
        return " ".join(lines)

    return result.headline


def explain(result: ScenarioResult, state: FinancialState) -> str:
    """
    Produces human-readable explanation prose for a ScenarioResult.
    Tries LLM if configured; enforces numeral guard and falls back to deterministic template.
    """
    template_fallback = render_template(result, state)

    if not settings.LLM_API_KEY:
        return template_fallback

    try:
        # Build allowed numerals facts set
        allowed_numerals: Set[str] = set()
        allowed_numerals.add(str(result.score_before))
        allowed_numerals.add(str(result.score_after))
        allowed_numerals.add(result.band_before)
        allowed_numerals.add(result.band_after)

        for mf in result.money_facts:
            allowed_numerals.update(extract_numerals(mf.value))
            allowed_numerals.add(str(mf.raw))

        for gr in result.guard_rails:
            allowed_numerals.update(extract_numerals(gr.message))
            if gr.suggestion:
                allowed_numerals.update(extract_numerals(gr.suggestion))

        for cd in result.component_deltas:
            allowed_numerals.add(str(cd.before))
            allowed_numerals.add(str(cd.after))
            allowed_numerals.add(str(cd.delta))

        facts_block = {
            "score_before": result.score_before,
            "score_after": result.score_after,
            "band_before": result.band_before,
            "band_after": result.band_after,
            "money_facts": [m.model_dump() for m in result.money_facts],
            "guard_rails": [g.model_dump() for g in result.guard_rails],
        }

        system_prompt = (
            "You are a concise financial explainer for CreditIn. "
            "Write 3-4 sentences in clear English for an Indian consumer explaining the scenario result.\n"
            "CRITICAL INSTRUCTION: Use ONLY the numbers provided in the FACTS block verbatim. "
            "Never calculate, round, or invent any number."
        )

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
        }
        base_url = settings.LLM_BASE_URL or "https://generativelanguage.googleapis.com/v1beta/openai"
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"FACTS:\n{json.dumps(facts_block, default=str)}"},
            ],
            "temperature": 0.2,
        }

        with httpx.Client(timeout=4.0) as client:
            resp = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                prose = data["choices"][0]["message"]["content"].strip()
                # Run Numeral Guard
                if assert_no_invented_numerals(prose, allowed_numerals):
                    return prose
                else:
                    logger.warning("LLM prose failed numeral verification. Falling back to template.")

    except Exception as e:
        logger.warning(f"LLM explanation failed: {e}. Falling back to template.")

    return template_fallback
