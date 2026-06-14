"""Shared LLM helper — single place for the Gemini model id and JSON-returning calls.

The whole project talks to Google Gemini through this module, so swapping models
(or providers) only ever touches this file.
"""

import os
import json

from google import genai
from google.genai import types

# Keep the model id in one place so every agent stays consistent.
# gemini-2.5-flash-lite has the most generous free-tier daily quota of the
# currently-available models (gemini-2.5-flash is capped at ~20 requests/day on
# the free tier, and the 2.0 models report a quota of 0). Override via env if you
# have a paid key and want gemini-2.5-flash / -pro.
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")

# 2.5 models "think" by default, which silently consumes the output-token budget
# and can leave nothing for the actual answer. We disable it for fast, complete
# JSON/text responses.
_THINKING_OFF = types.ThinkingConfig(thinking_budget=0)

_client_cache: genai.Client | None = None


def _client() -> genai.Client:
    global _client_cache
    if _client_cache is None:
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        _client_cache = genai.Client(api_key=api_key)
    return _client_cache


def call_text(system: str, user: str, max_tokens: int = 1024) -> str:
    """Plain text completion. Returns the stripped assistant text."""
    resp = _client().models.generate_content(
        model=MODEL,
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
            thinking_config=_THINKING_OFF,
        ),
    )
    return (resp.text or "").strip()


def call_json(system: str, user: str, max_tokens: int = 1500, default=None):
    """JSON completion. Returns the parsed object, or *default* on any failure.

    Uses Gemini's JSON response mode so the model returns parseable JSON without
    markdown fences. The caller's *default* is returned verbatim on failure
    (including ``None``), so a caller can pass ``default=None`` to detect failures.
    """
    try:
        resp = _client().models.generate_content(
            model=MODEL,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
                response_mime_type="application/json",
                thinking_config=_THINKING_OFF,
            ),
        )
        result = json.loads((resp.text or "").strip())
        # Guard against the model returning a different JSON shape than expected
        # (e.g. a bare array when the caller wants an object). When the caller
        # supplied a typed default, the parsed value must match that type.
        if default is not None and not isinstance(result, type(default)):
            print(
                f"[llm] call_json got {type(result).__name__}, "
                f"expected {type(default).__name__} — using default"
            )
            return default
        return result
    except Exception as e:  # noqa: BLE001 — surface any failure as the default
        print(f"[llm] call_json failed ({type(e).__name__}): {e}")
        return default
