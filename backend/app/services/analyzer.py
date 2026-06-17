"""
backend/app/services/analyzer.py
"""

import json
import os
import re

MAX_LOG_CHARS     = int(os.getenv("MAX_LOG_CHARS",     "6000"))
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", "2000"))

# ── Validation ────────────────────────────────────────────────────────────────

MIN_TRACE_CHARS = 50

# ── Tier 1: Strong signals — any ONE of these alone is enough ─────────────────
# These patterns are highly specific to real error output and almost never
# appear in config files, metric dumps, or prose descriptions.
STRONG_PATTERNS = [
    # Stack frame references  →  "at com.foo.Bar.method(File.java:42)"
    r'^\s+at\s+[\w\$\.]+\([\w\.]+:\d+\)',
    # Python traceback frame  →  'File "foo.py", line 42, in bar'
    r'File\s+"[^"]+",\s+line\s+\d+',
    # Go goroutine header     →  "goroutine 1 [running]:"
    r'goroutine\s+\d+\s+\[',
    # Rust/C panic location   →  "thread 'main' panicked at"
    r"thread\s+'[^']+'\s+panicked\s+at",
    # Python exception line   →  "SomeError: message" at line start
    r'^[\w\.]+(?:Error|Exception|Warning|Panic):\s+\S',
    # Java/JVM exception      →  "java.lang.NullPointerException"
    r'java\.\w+\.\w+(?:Exception|Error)',
    # "Caused by:" chain
    r'^caused\s+by\s*:',
    # OOM killer log line
    r'out\s+of\s+memory\s*:\s+kill',
    # Node.js network errors
    r'ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EPIPE',
    # Kernel/signal crash     →  "Segmentation fault (core dumped)"
    r'segmentation\s+fault',
    # Node.js / V8 crash
    r'^(?:uncaughtException|UnhandledPromiseRejection)',
    # Node.js stack frame  →  at foo.bar (/path/file.js:10:5)
    r'^\s+at\s+[\w\$\.<>\s]+\s*\(/[^)]+:\d+(?::\d+)?\)',
    # .NET exception
    r'System\.\w+(?:Exception|Error)',
    # Ruby exception
    r'^\s*\w+(?:Error|Exception)\s+\([^)]+\)',
]

STRONG_RE = re.compile(
    '|'.join(STRONG_PATTERNS),
    re.MULTILINE | re.IGNORECASE,
)

# ── Tier 2: Weak signals — need TWO or more to pass ──────────────────────────
# Each of these can appear in non-error text (config files, logs, docs),
# so we require multiple hits before accepting the submission.
WEAK_PATTERNS = [
    # Bare keyword "error" or "exception" as a whole word
    r'(?i)\berror\b',
    r'(?i)\bexception\b',
    r'(?i)\btraceback\b',
    r'(?i)\bpanic\b',
    r'(?i)\bfatal\b',
    r'(?i)\bfailed\b',
    r'(?i)\bstack\s+trace\b',
    r'(?i)\bsegfault\b',
    r'(?i)\bdeadlock\b',
    r'(?i)\bkilled\b',
    r'(?i)\bcrash(?:ed)?\b',
    r'(?i)\babort(?:ed)?\b',
    # "connection refused" as a phrase (not just the word "connection")
    r'(?i)connection\s+refused',
    # "timed out" / "timed-out" (not just "timeout" as a config key)
    r'(?i)timed[\s-]+out',
    # Exit/signal codes in context  →  "exit code 1", "signal 11"
    r'(?i)\bexit\s+(?:code\s+)?\d+\b',
    r'(?i)\bsignal\s+\d+\b',
    # OOM keywords in error context
    r'(?i)\bout[\s-]+of[\s-]+memory\b',
    r'(?i)\bheap\s+(?:space|dump|overflow)\b',
    # Generic "Xth exception" suffix patterns (Python/Ruby/JS style)
    r'(?i)\w+Error:',
    r'(?i)\w+Exception:',
]

WEAK_COMPILED = [re.compile(p) for p in WEAK_PATTERNS]

# ── Patterns that indicate the text is NOT a stack trace ─────────────────────
# If any of these dominate the content, reject even if weak signals are present.
CONFIG_LINE_RE = re.compile(
    r'^[\w\.\-]+=[\w\.\-:/]+$',   # key=value config lines
    re.MULTILINE,
)

INFO_LOG_RE = re.compile(
    r'^\S+\s+(?:INFO|DEBUG|TRACE)\s+',   # "timestamp INFO ..."
    re.MULTILINE,
)

# ── Used to detect "orphan frames" — frames with no exception header ──────────
# Matches Java-style AND Node.js/Python path-style "at ..." frame lines.
FRAME_LINE_RE = re.compile(
    r'^\s+at\s+'
    r'(?:'
    r'[\w\$\.]+\([\w\.]+:\d+\)'           # Java:    at com.foo.Bar(File.java:42)
    r'|[\w\$\.<>\s]+\s*\([^)]*:\d+:\d+\)' # Node.js: at foo (/path/file.js:10:5)
    r'|[\w\$\.<>\s]+\s*\([^)]*:\d+\)'     # Node.js: at foo (/path/file.js:10)
    r')',
    re.MULTILINE,
)

# An exception header must precede the frames for the trace to be complete.
# Covers Java, Node.js (Error: at line start), Python, .NET, etc.
EXCEPTION_HEADER_RE = re.compile(
    r'(?:'
    r'[\w\.]+(?:Exception|Error|Fault|Panic)[\s:\(]'                          # FooException: / FooError(
    r'|^(?:Error|TypeError|RangeError|ReferenceError|SyntaxError)\s*:'           # Node.js bare Error:
    r'|caused\s+by\s*:'                                                          # Caused by:
    r'|exception\s+in\s+thread'                                                  # Exception in thread
    r'|^Traceback\s+\(most\s+recent\s+call\s+last\)'                        # Python traceback
    r')',
    re.MULTILINE | re.IGNORECASE,
)


def _validate_stack_trace(service_name: str, raw_log: str) -> None:
    """
    Raise ValueError with a human-readable reason if the input is not a
    genuine stack trace or error log.

    Strategy (four-tier):
      1. Hard reject: too short, or dominated by config/info-log lines.
      2. Orphan-frames reject: "at ..." lines present but no exception header.
      3. Strong pass: any single unambiguous structural pattern = valid.
      4. Weak pass: requires 2+ distinct weak signals = valid.
      5. Otherwise: reject with guidance.
    """
    stripped = raw_log.strip()

    # ── 1a. Too short ─────────────────────────────────────────────────────────
    if len(stripped) < MIN_TRACE_CHARS:
        raise ValueError(
            f"Stack trace is too short ({len(stripped)} chars). "
            f"Please provide a complete stack trace with at least {MIN_TRACE_CHARS} characters."
        )

    lines = stripped.splitlines()
    non_empty_lines = [l for l in lines if l.strip()]
    total = max(len(non_empty_lines), 1)

    # ── 1b. Dominated by key=value config lines ───────────────────────────────
    config_hits = len(CONFIG_LINE_RE.findall(stripped))
    if config_hits / total > 0.55:
        raise ValueError(
            "The submitted text looks like a configuration file (key=value pairs), "
            "not a stack trace. Please paste the actual error output from your "
            "service logs, not the application config."
        )

    # ── 1c. Dominated by INFO/DEBUG log lines (no errors) ────────────────────
    info_hits = len(INFO_LOG_RE.findall(stripped))
    if info_hits / total > 0.55:
        raise ValueError(
            "The submitted text appears to be an info/debug log with no errors. "
            "Please paste the section of your logs that contains the actual error, "
            "exception, or crash output."
        )

    # ── 2. Orphan-frames check ────────────────────────────────────────────────
    # If the text is made up mostly of "at ..." frame lines but has NO exception
    # header, the user pasted only the bottom half of a trace (no error cause).
    frame_hits = len(FRAME_LINE_RE.findall(stripped))
    if frame_hits >= 2 and not EXCEPTION_HEADER_RE.search(stripped):
        raise ValueError(
            "The submitted text contains Java stack frame lines (\"at ...\") but "
            "no exception or error header was found above them. It looks like only "
            "the bottom portion of the trace was pasted. Please include the full "
            "output starting from the exception line, e.g.: "
            "\"java.lang.NullPointerException: Cannot invoke method ...\" "
            "followed by the frame lines."
        )

    # ── 3. Strong structural signal → accept immediately ─────────────────────
    if STRONG_RE.search(stripped):
        return

    # ── 4. Weak signals — need at least 2 distinct matches ───────────────────
    matched_weak = [p for p in WEAK_COMPILED if p.search(stripped)]
    if len(matched_weak) >= 2:
        return

    # ── 4. Nothing convincing found → reject ─────────────────────────────────
    raise ValueError(
        "The submitted text does not appear to be a valid stack trace or error log. "
        "No recognizable error structures were found — expected things like exception "
        "class names, stack frame references (e.g. 'at com.foo.Bar.method(File.java:42)'), "
        "Python Tracebacks, Go panics, or crash signals. "
        "Please paste the raw error output directly from your service logs."
    )


# ── System Prompt ─────────────────────────────────────────────────────────────

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
CRITICAL: Use \\n escape sequences for newlines inside JSON string values. Never embed raw newline characters inside JSON strings.

Example format:
{
  "root_cause_analysis": "The root cause is ... [detailed explanation]",
  "actionable_fix": "To resolve this issue:\\n1) First specific action...\\n2) Second specific action...\\n3) Third specific action...\\n4) Long-term: architectural improvement...\\n5) Add alerting for..."
}"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _truncate_log(raw_log: str) -> str:
    if len(raw_log) <= MAX_LOG_CHARS:
        return raw_log
    return raw_log[:MAX_LOG_CHARS] + "\n...[log truncated for token limits]"


def _escape_controls_in_strings(s: str) -> str:
    result      = []
    in_string   = False
    escape_next = False

    for ch in s:
        if escape_next:
            result.append(ch)
            escape_next = False
            continue
        if ch == '\\' and in_string:
            result.append(ch)
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            result.append(ch)
            continue
        if in_string:
            if   ch == '\n': result.append('\\n')
            elif ch == '\r': result.append('\\r')
            elif ch == '\t': result.append('\\t')
            elif ord(ch) < 0x20:
                result.append(f'\\u{ord(ch):04x}')
            else:
                result.append(ch)
        else:
            result.append(ch)

    return ''.join(result)


def _parse_json_response(text: str) -> dict:
    text = text.strip()

    if text.startswith("```json"):
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif text.startswith("```"):
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    try:
        return json.loads(_escape_controls_in_strings(text))
    except json.JSONDecodeError:
        pass

    try:
        stripped = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        return json.loads(_escape_controls_in_strings(stripped))
    except json.JSONDecodeError:
        pass

    match = re.search(
        r'\{.*?"root_cause_analysis".*?"actionable_fix".*?\}',
        text, re.DOTALL,
    )
    if match:
        try:
            return json.loads(_escape_controls_in_strings(match.group(0)))
        except json.JSONDecodeError:
            pass

    raise ValueError(
        f"Could not parse LLM response as JSON. "
        f"Raw (first 300 chars): {text[:300]}"
    )


def _build_prompt(service_name: str, raw_log: str) -> str:
    return (
        f"Analyze this stack trace from the '{service_name}' service.\n\n"
        "Provide root_cause_analysis (min 150 words) and actionable_fix "
        "(min 5 numbered steps, each on its own line using \\n).\n\n"
        "CRITICAL: Return ONLY valid JSON. "
        "Use \\\\n escape sequences for newlines inside JSON strings — "
        "never raw newline characters inside string values.\n\n"
        f"Stack trace:\n{raw_log}"
    )


# ── Main Entry Point ──────────────────────────────────────────────────────────

def analyze_stack_trace(service_name: str, raw_log: str) -> dict:
    from groq import Groq

    # ── Step 1: Validate before touching Groq ────────────────────────────────
    # Raises ValueError with a clear human-readable message if invalid.
    # The worker catches this and marks the incident as 'failed' with
    # the error message stored as failure_reason in MongoDB.
    _validate_stack_trace(service_name, raw_log)

    # ── Step 2: Truncate and send to Groq ────────────────────────────────────
    raw_log = _truncate_log(raw_log)
    client  = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
        import traceback

        print("\n===== FULL TRACEBACK =====")
        traceback.print_exc()
        print("==========================\n")

        raise