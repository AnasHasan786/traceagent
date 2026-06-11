import json
import os
import re

MAX_LOG_CHARS    = int(os.getenv("MAX_LOG_CHARS",    "6000"))
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", "2000"))

SYSTEM_PROMPT = """You are an expert site reliability engineer and software debugger with deep knowledge of distributed systems, cloud infrastructure, and application frameworks. Your job is to perform thorough, production-grade incident analysis.

When given a stack trace or error log, you MUST respond with a JSON object containing exactly two keys: "root_cause_analysis" and "actionable_fix".

The "root_cause_analysis" field MUST:
- Be at minimum 150 words, ideally 200-300 words
- Identify the EXACT exception or error type and the precise line/module where it originated
- Explain the chain of events that led to the failure (what called what, what state existed)
- Identify contributing factors: environmental (memory, network, config), code-level (null checks, race conditions, timeouts), or architectural (circuit breakers, retries, dependencies)
- Reference specific class names, method names, or log timestamps visible in the trace
- Distinguish between the immediate trigger and the underlying root cause if they differ
- Note any patterns (e.g. "this is a classic cascading failure from an overloaded downstream dependency")

The "actionable_fix" field MUST:
- Be at minimum 150 words, ideally 200-300 words
- Provide a numbered, step-by-step remediation plan (minimum 5 steps)
- IMPORTANT: Each numbered step MUST be on its own new line. Format EXACTLY like:
  1) First step text here
  2) Second step text here
  3) Third step text here
- Include both an IMMEDIATE fix (to restore service now) and a LONG-TERM fix (to prevent recurrence)
- Suggest specific config values, code patterns, or architectural changes where applicable
- Mention relevant monitoring/alerting improvements to catch this earlier next time
- If applicable, mention relevant framework-specific solutions (e.g. Spring retry config, Python asyncio timeout, AWS SDK retry policy)

Return ONLY valid JSON. No markdown fences, no preamble, no explanation outside the JSON object.

Example format:
{
  "root_cause_analysis": "The root cause is ... [detailed multi-sentence explanation referencing specific components]",
  "actionable_fix": "To resolve this issue immediately and prevent recurrence:\\n1) First specific action...\\n2) Second specific action...\\n3) Third specific action...\\n4) Long-term: architectural improvement...\\n5) Add alerting for..."
}"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _truncate_log(raw_log: str) -> str:
    if len(raw_log) <= MAX_LOG_CHARS:
        return raw_log
    return raw_log[:MAX_LOG_CHARS] + "\n...[log truncated for token limits]"


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"):
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif text.startswith("```"):
        text = text.split("```", 1)[1].split("```", 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[^{}]*\"root_cause_analysis\"[^{}]*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def _build_prompt(service_name: str, raw_log: str) -> str:
    return (
        f"Analyze this stack trace from the '{service_name}' service.\n\n"
        "Provide:\n"
        "1. root_cause_analysis: A detailed explanation of what went wrong, "
        "which component failed, why it failed, and what the likely upstream "
        "cause is. Be specific about the error type, affected code path, and "
        "any relevant context. Minimum 150 words.\n"
        "2. actionable_fix: Specific, numbered step-by-step remediation. "
        "CRITICAL: Put each numbered step on its own new line using \\n between steps. "
        "Minimum 5 steps, minimum 150 words total. Include immediate and long-term fixes.\n\n"
        "Respond ONLY with valid JSON. No markdown, no preamble.\n\n"
        f"Stack trace:\n{raw_log}"
    )


# ── Main Entry Point ──────────────────────────────────────────────────────────

def analyze_stack_trace(service_name: str, raw_log: str) -> dict:
    from groq import Groq

    raw_log = _truncate_log(raw_log)
    client  = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # llama-3.3-70b-versatile: much stronger reasoning than 8b-instant
    MODEL = "llama-3.3-70b-versatile"
    print(f"[Groq] model={MODEL}")

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": _build_prompt(service_name, raw_log)},
            ],
            max_tokens=MAX_OUTPUT_TOKENS,
            temperature=0.2,
        )
        generated = response.choices[0].message.content.strip()
        result    = _parse_json_response(generated)
        root      = result.get("root_cause_analysis", "")
        fix       = result.get("actionable_fix", "")

        return {
            "root_cause_analysis": (
                root if isinstance(root, str) else json.dumps(root, indent=2)
            ),
            "actionable_fix": (
                fix if isinstance(fix, str) else json.dumps(fix, indent=2)
            ),
        }

    except Exception as e:
        err = str(e)
        print(f"⚠️  [Groq API Error] Inference failed: {err}")

        # Detect quota exhaustion specifically so the worker can set the right status
        if "quota" in err.lower() or "rate limit" in err.lower() or "429" in err:
            raise  # let the worker catch and set status = "quota_exceeded"

        return {
            "root_cause_analysis": "Automated analysis failed due to an engine exception.",
            "actionable_fix": f"Review the log trace manually. Error: {err}",
        }