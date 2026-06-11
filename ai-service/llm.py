"""
LLM helper. Uses OpenAI when OPENAI_API_KEY is configured, otherwise the
caller falls back to deterministic heuristics so the service always works.
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

_client = None


def _get_client():
    global _client
    if _client is None and OPENAI_API_KEY:
        from openai import OpenAI

        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


def is_enabled() -> bool:
    return bool(OPENAI_API_KEY)


def complete_json(system: str, user: str) -> Optional[dict[str, Any]]:
    """Ask the model to return a JSON object. Returns None on any failure."""
    client = _get_client()
    if client is None:
        return None
    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.4,
        )
        content = resp.choices[0].message.content
        return json.loads(content) if content else None
    except Exception as exc:  # noqa: BLE001
        print(f"[LLM_ERROR] {exc}")
        return None
