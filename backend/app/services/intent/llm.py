"""
LLM Intent Parser with validation, numeral guard, and immediate keyword fallback.
The LLM converts natural language into structured parameters. It never performs arithmetic.
"""

import json
import logging
from decimal import Decimal
from typing import Optional
import httpx

from app.config import settings
from app.models.domain import FinancialState
from app.services.intent.keyword import parse_keyword, ParsedIntent, extract_amount_inr

logger = logging.getLogger(__name__)


def parse_intent(text: str, state: FinancialState) -> Optional[ParsedIntent]:
    """
    Parses user query into structured intent.
    Attempts LLM if configured; on any failure, falls back cleanly to parse_keyword.
    """
    if not text or not text.strip():
        return None

    # Fall back directly if no LLM API key configured
    if not settings.LLM_API_KEY:
        return parse_keyword(text, state)

    try:
        # Construct account list for context (id and name only — NO balances or personal financial data)
        accounts_context = [
            {"id": a.id, "name": a.display_name, "issuer": a.issuer, "kind": a.kind}
            for a in state.accounts
            if a.closed_date is None
        ]

        system_prompt = (
            "You are a structured intent parser for a financial simulator. "
            "Convert the user's plain question into JSON with the following schema:\n"
            "{\n"
            '  "kind": "pay_debt" | "close_card" | "take_loan",\n'
            '  "account_id": string or null,\n'
            '  "amount": number or null (e.g. 50000),\n'
            '  "principal": number or null,\n'
            '  "annual_rate_pct": number or null,\n'
            '  "months": integer or null,\n'
            '  "kind_of_loan": "secured_loan" | "unsecured_loan" | null\n'
            "}\n"
            f"Available Accounts: {json.dumps(accounts_context)}\n"
            "Return JSON ONLY. Do not invent amounts not mentioned in the query."
        )

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
        }

        # Handle Gemini / OpenAI endpoints via generic OpenAI-compatible format
        base_url = settings.LLM_BASE_URL or "https://generativelanguage.googleapis.com/v1beta/openai"
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"},
        }

        with httpx.Client(timeout=4.0) as client:
            resp = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code != 200:
                logger.warning(f"LLM request returned status {resp.status_code}")
                return parse_keyword(text, state)

            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(content)

            # Numeral check: verify numbers in parsed_json were in user's query
            user_amt = extract_amount_inr(text)
            if parsed_json.get("amount") and user_amt:
                parsed_amt = Decimal(str(parsed_json["amount"]))
                if parsed_amt != user_amt:
                    logger.warning(f"LLM hallucinated amount {parsed_amt} vs user {user_amt}")
                    return parse_keyword(text, state)

            kind = parsed_json.get("kind")
            if kind not in ("pay_debt", "close_card", "take_loan"):
                return parse_keyword(text, state)

            return ParsedIntent(
                kind=kind,
                account_id=parsed_json.get("account_id"),
                amount=Decimal(str(parsed_json["amount"])) if parsed_json.get("amount") is not None else None,
                principal=Decimal(str(parsed_json["principal"])) if parsed_json.get("principal") is not None else None,
                annual_rate_pct=Decimal(str(parsed_json["annual_rate_pct"])) if parsed_json.get("annual_rate_pct") is not None else None,
                months=parsed_json.get("months"),
                kind_of_loan=parsed_json.get("kind_of_loan"),
                confidence=0.95,
                source="llm",
            )

    except Exception as e:
        logger.warning(f"LLM parsing failed: {e}. Falling back to keyword parser.")
        return parse_keyword(text, state)
