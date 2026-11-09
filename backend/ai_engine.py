import os
import re
import json
import time
import logging
from threading import Lock
from typing import List, Dict, Any, Optional, Tuple
import httpx
from .extractors import verify_excerpt_in_text

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are KNOWLEDGE BRIDGE AI - an elite enterprise knowledge handover engine.
Your purpose is to thoroughly examine project documents and extract structured, high-value knowledge items to ensure seamless project continuity.

Categories to extract:
1. 'decision': Architectural, design, budget, tooling, or organizational decisions made with context.
2. 'pending_task': Incomplete work items, open PRs, ongoing migrations, or backlog features.
3. 'responsibility': System ownership, lead roles, primary and secondary maintainers.
4. 'risk_blocker': Technical debt, single points of failure, security concerns, blockers, or downtime risks.
5. 'dependency': External APIs, third-party libraries, legacy databases, cross-team approvals.
6. 'unresolved_question': Open debates, undecided requirements, unconfirmed deadlines.
7. 'next_action': Critical next steps for the incoming engineer/team over the next 1-4 weeks.

CRITICAL RULES FOR EVIDENCE:
- Extract EXACT quotes/excerpts from the text for 'source_excerpt'.
- NEVER invent facts or hallucinate citations.
- Include the page number or section if available in the text.
- Set priority to 'critical', 'high', 'medium', or 'low'.

Return a JSON array of objects with fields:
category, title, content, priority, assignee, source_excerpt, source_page, confidence_score (between 0.70 and 1.0)
"""

class GeminiFreeQuotaExhaustedError(Exception):
    """Raised when Google Gemini Free Tier rate limit (HTTP 429) or quota response is received."""
    pass

class DynamicFreeQuotaManager:
    """
    Dynamic Zero-Budget Quota Guardian for Google Gemini Free Tier (Model: gemini-3.8-flash).
    Dynamically inspects API quota responses from Google without hardcoded RPM or RPD ceilings.
    - Strictly Free Tier only (gemini-3.8-flash).
    - Never enables billing or paid endpoints.
    - If HTTP 429 (RESOURCE_EXHAUSTED) is received, dynamically activates cooldown and falls back to Demo Mode.
    """
    def __init__(self):
        self._lock = Lock()
        self.rate_limited_until: float = 0.0
        self.last_error: Optional[str] = None
        self.last_quota_response: str = "No API calls made yet"
        self.total_requests: int = 0
        self.successful_requests: int = 0
        self.rate_limit_events: int = 0

    def can_request(self) -> Tuple[bool, str]:
        with self._lock:
            now = time.time()
            if now < self.rate_limited_until:
                remaining = int(self.rate_limited_until - now)
                return False, f"Upstream Gemini API rate limit cooldown active for {remaining}s (HTTP 429 response)."
            return True, "OK"

    def record_request_attempt(self):
        with self._lock:
            self.total_requests += 1

    def record_success(self, response_message: str = "HTTP 200 OK - Free Tier Active"):
        with self._lock:
            self.successful_requests += 1
            self.last_quota_response = response_message

    def handle_rate_limit(self, error_details: str, retry_after_seconds: Optional[int] = None):
        with self._lock:
            now = time.time()
            cooldown = retry_after_seconds if retry_after_seconds and retry_after_seconds > 0 else 60
            self.rate_limited_until = now + cooldown
            self.rate_limit_events += 1
            self.last_error = error_details
            self.last_quota_response = f"HTTP 429 Quota Exhausted: {error_details}"
            logger.warning(f"Google Gemini Free Tier Quota Exhausted (HTTP 429). Cooldown: {cooldown}s. Details: {error_details}")

    def reset_cooldown(self):
        with self._lock:
            self.rate_limited_until = 0.0
            self.last_error = None
            self.last_quota_response = "Cooldown reset"

    def reset_rate_limit(self):
        """Alias for reset_cooldown."""
        self.reset_cooldown()

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            now = time.time()
            is_rate_limited = now < self.rate_limited_until
            remaining = max(0, int(self.rate_limited_until - now))
            
            gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
            if not gemini_key:
                status = "STANDALONE_DEMO_MODE"
            elif is_rate_limited:
                status = "RATE_LIMITED_429"
            elif self.successful_requests > 0:
                status = "ACTIVE_FREE_TIER"
            else:
                status = "READY_FREE_TIER"

            return {
                "model_id": "gemini-3.8-flash",
                "quota_mode": "Dynamic API Quota Handling (No hardcoded limits)",
                "quota_status": status,
                "is_rate_limited": is_rate_limited,
                "rate_limit_cooldown_remaining": remaining,
                "last_quota_response": self.last_quota_response,
                "total_requests": self.total_requests,
                "successful_requests": self.successful_requests,
                "rate_limit_events": self.rate_limit_events,
                "estimated_monthly_cost": "₹0.00 / Zero Budget",
                "billing_enabled": False,
                "is_free_tier": True
            }

quota_manager = DynamicFreeQuotaManager()

def get_configured_ai_provider() -> Dict[str, Any]:
    # GEMINI_API_KEY is read strictly from server-side environment variables
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    stats = quota_manager.get_stats()

    if gemini_key:
        is_exhausted = stats["is_rate_limited"]
        return {
            "has_key": True,
            "model_id": "gemini-3.8-flash",
            "provider": "Google Gemini 3.8 Flash (Official AI Studio Free Tier)" if not is_exhausted else "Zero-Cost Rule-Based Fallback (Free Quota Exhausted)",
            "key_masked": f"{gemini_key[:4]}...{gemini_key[-4:]}" if len(gemini_key) > 8 else "***",
            "is_demo_mode": is_exhausted,
            "is_free_tier": True,
            "billing_enabled": False,
            "estimated_monthly_cost": "₹0.00 / Free Tier",
            "quota_status": stats["quota_status"],
            "last_quota_response": stats["last_quota_response"],
            "fallback_reason": quota_manager.last_error if is_exhausted else None,
            "zero_budget_guarantee": "Strictly limited to Google AI Studio Free Tier. Zero paid services.",
            "live_ai_status": "CONFIGURED_AWAITING_REQUEST" if stats["successful_requests"] == 0 else "TESTED_ACTIVE",
            "live_ai_message": "Gemini API key detected in server environment. Free tier dynamic quota handling active."
        }
    else:
        return {
            "has_key": False,
            "model_id": "gemini-3.8-flash",
            "provider": "Zero-Cost Rule-Based Extractor (No API Key - Demo Mode)",
            "key_masked": "None",
            "is_demo_mode": True,
            "is_free_tier": True,
            "billing_enabled": False,
            "estimated_monthly_cost": "₹0.00 / Zero Cost",
            "quota_status": "STANDALONE_DEMO_MODE",
            "last_quota_response": "Running in zero-cost offline rule-based mode",
            "fallback_reason": "No commercial API key configured in server environment. Operating in zero-cost standalone offline mode.",
            "zero_budget_guarantee": "100% Free Forever. Zero paid services.",
            "live_ai_status": "NOT_TESTED",
            "live_ai_message": "Live AI has not yet been tested (No GEMINI_API_KEY configured in environment. Running in Demo / Rule-Based Mode with zero cost)."
        }

async def call_gemini_api(text: str, doc_name: str, api_key: str) -> List[Dict[str, Any]]:
    # 1. Enforce dynamic rate limit check
    can_proceed, reason = quota_manager.can_request()
    if not can_proceed:
        raise GeminiFreeQuotaExhaustedError(reason)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": SYSTEM_PROMPT},
                {"text": f"DOCUMENT NAME: {doc_name}\n\nDOCUMENT CONTENT:\n{text[:25000]}"}
            ]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    quota_manager.record_request_attempt()
    
    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            response = await client.post(url, json=payload)
            
            # Dynamic HTTP 429 quota handling
            if response.status_code == 429:
                retry_header = response.headers.get("retry-after")
                retry_seconds = int(retry_header) if retry_header and retry_header.isdigit() else 60
                try:
                    err_json = response.json()
                    err_msg = err_json.get("error", {}).get("message", "RESOURCE_EXHAUSTED")
                except Exception:
                    err_msg = response.text[:200] or "HTTP 429 Too Many Requests"

                quota_manager.handle_rate_limit(err_msg, retry_after_seconds=retry_seconds)
                raise GeminiFreeQuotaExhaustedError(f"Google Gemini Free Tier Quota Response: {err_msg} (Cooldown: {retry_seconds}s)")

            response.raise_for_status()
            data = response.json()
            quota_manager.record_success("HTTP 200 OK — Live Gemini 3.8 Flash Response Received")

            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            if isinstance(parsed, dict) and "items" in parsed:
                return parsed["items"]
            if isinstance(parsed, list):
                return parsed
            return []
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            retry_header = e.response.headers.get("retry-after")
            retry_seconds = int(retry_header) if retry_header and retry_header.isdigit() else 60
            quota_manager.handle_rate_limit(e.response.text[:200], retry_after_seconds=retry_seconds)
            raise GeminiFreeQuotaExhaustedError("Google Gemini Free Tier Quota Exhausted (HTTP 429). Switching to Zero-Cost Rule-Based Mode.")
        raise

async def test_live_gemini_connection() -> Dict[str, Any]:
    """
    Tests an actual Google Gemini API request with model gemini-3.8-flash if an API key is configured.
    If no API key is configured, clearly reports that Live AI has not yet been tested.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "live_ai_tested": False,
            "status": "NOT_TESTED",
            "model": "gemini-3.8-flash",
            "message": "Live AI has not yet been tested (No GEMINI_API_KEY configured in server environment. Running in Demo / Rule-Based Mode with zero cost).",
            "is_demo_mode": True
        }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": "Ping test: Return JSON: {\"status\": \"ok\", \"model\": \"gemini-3.8-flash\"}"}
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 429:
                quota_manager.handle_rate_limit("Free Tier Quota Limit Reached on live test")
                return {
                    "live_ai_tested": True,
                    "status": "RATE_LIMITED_429",
                    "model": "gemini-3.8-flash",
                    "message": "Google Gemini Free Tier Quota Limit reached (HTTP 429). Fallback mode active.",
                    "is_demo_mode": True
                }
            response.raise_for_status()
            data = response.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            quota_manager.record_success("Live test ping succeeded")
            return {
                "live_ai_tested": True,
                "status": "SUCCESS",
                "model": "gemini-3.8-flash",
                "message": "Actual Google Gemini 3.8 Flash API request verified successfully!",
                "response_raw": raw_text[:200],
                "is_demo_mode": False
            }
    except Exception as e:
        return {
            "live_ai_tested": True,
            "status": "FAILED",
            "model": "gemini-3.8-flash",
            "message": f"Gemini API test request failed: {str(e)[:100]}",
            "is_demo_mode": True
        }

def extract_fallback_rule_based(text: str, doc_name: str) -> List[Dict[str, Any]]:
    """
    Intelligent heuristic rule-based extractor that analyzes actual document text
    when no commercial LLM API key is configured or when free quota is reached.
    Labels all output with is_demo_mode = True and is_ai_generated = False.
    """
    items: List[Dict[str, Any]] = []
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    patterns = {
        "decision": [
            r"(?:decided|decision|agreed to|chose to|standardized on|selected|migrated to|approved)\s+(.+)",
            r"(?:architectural decision|adr|design decision)[:\-]\s*(.+)",
            r"(?:we will use|we have chosen|opted for)\s+(.+)"
        ],
        "risk_blocker": [
            r"(?:risk|blocker|blocked by|vulnerability|bottleneck|hazard|single point of failure)[:\-]\s*(.+)",
            r"(?:high risk|critical concern|failure mode|downtime risk|data loss)[:\-]?\s*(.+)",
            r"(?:alert|warning)[:\-]\s*(.+)"
        ],
        "pending_task": [
            r"(?:pending|todo|to-do|in-progress|remaining task|backlog item)[:\-]\s*(.+)",
            r"(?:wip|needs to be completed|open pr|ticket|jira)[:\-]\s*(.+)",
            r"(?:task)[:\-]\s*(.+)"
        ],
        "responsibility": [
            r"(?:responsible|owner|lead|maintained by|contact|poc|assigned to)[:\-]\s*(.+)",
            r"(?:primary on-call|team lead|code owner)[:\-]\s*(.+)"
        ],
        "dependency": [
            r"(?:depends on|dependency|requires|prerequisite|third-party|external service)[:\-]\s*(.+)",
            r"(?:integrated with|database dependency|api dependency)[:\-]\s*(.+)"
        ],
        "unresolved_question": [
            r"(?:unresolved|open question|tbd|to be determined|needs clarification|question)[:\-]\s*(.+)",
            r"(.+\?)$"
        ],
        "next_action": [
            r"(?:next action|next step|action item|immediate priority|first week|handover action)[:\-]\s*(.+)",
            r"(?:milestone|target deadline|step \d+)[:\-]\s*(.+)"
        ]
    }

    seen_excerpts = set()
    current_page = "Page 1"
    for line in lines:
        if line.startswith("--- [Page ") and line.endswith("] ---"):
            current_page = line.replace("---", "").strip()
            continue

        for category, regex_list in patterns.items():
            for pat in regex_list:
                match = re.search(pat, line, re.IGNORECASE)
                if match:
                    body = match.group(1).strip() if match.groups() else line
                    if len(body) < 10 or line in seen_excerpts:
                        continue

                    seen_excerpts.add(line)
                    
                    title = body[:80].capitalize()
                    priority = "medium"
                    if category == "risk_blocker":
                        priority = "critical" if any(w in line.lower() for w in ["critical", "severe", "loss", "security", "downtime"]) else "high"
                    elif category == "next_action":
                        priority = "high"
                    elif category == "decision":
                        priority = "high" if "architecture" in line.lower() or "core" in line.lower() else "medium"

                    assignee = None
                    assignee_match = re.search(r"@?([A-Z][a-z]+ [A-Z][a-z]+)", line)
                    if assignee_match:
                        assignee = assignee_match.group(1)

                    items.append({
                        "category": category,
                        "title": title,
                        "content": body,
                        "priority": priority,
                        "assignee": assignee or "Engineering Team",
                        "source_excerpt": line,
                        "source_page": current_page,
                        "confidence_score": 0.88
                    })
                    break

    if len(items) < 3:
        for idx, line in enumerate(lines[:30]):
            if len(line) > 35 and not line.startswith("---"):
                items.append({
                    "category": "pending_task" if idx % 2 == 0 else "next_action",
                    "title": line[:70] + "...",
                    "content": line,
                    "priority": "medium",
                    "assignee": "Incoming Owner",
                    "source_excerpt": line,
                    "source_page": "Page 1",
                    "confidence_score": 0.82
                })
                if len(items) >= 6:
                    break

    return items

async def analyze_document_text(text: str, doc_name: str) -> List[Dict[str, Any]]:
    """
    Main analysis pipeline:
    1. Checks for Google Gemini Free Tier API key (server-side environment variable)
    2. Dynamically handles API quota responses without hardcoded limits
    3. If quota is exhausted (HTTP 429), gracefully switches to clearly labeled Demo / Rule-Based Mode
    4. Transparently sets is_ai_generated: False and is_demo_mode: True when using fallback
    5. Verifies extracted evidence against source text (flags missing/hallucinated quotes)
    6. Attaches zero-budget cost metadata (₹0.00)
    """
    config = get_configured_ai_provider()
    raw_items = []
    is_demo = config["is_demo_mode"]
    provider_name = config["provider"]
    fallback_reason = config.get("fallback_reason")

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    if gemini_key:
        try:
            raw_items = await call_gemini_api(text, doc_name, gemini_key)
            is_demo = False
            provider_name = "Google Gemini 3.8 Flash (Official AI Studio Free Tier)"
            fallback_reason = None
        except GeminiFreeQuotaExhaustedError as e:
            logger.warning(f"Google Gemini Free Tier quota response: {e}. Gracefully activating Zero-Cost Rule-Based Extractor.")
            raw_items = extract_fallback_rule_based(text, doc_name)
            is_demo = True
            provider_name = "Zero-Cost Rule-Based Fallback (Gemini Free Quota Limit Reached - HTTP 429)"
            fallback_reason = str(e)
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Switching to Zero-Cost Rule-Based Extractor.")
            raw_items = extract_fallback_rule_based(text, doc_name)
            is_demo = True
            provider_name = f"Zero-Cost Rule-Based Fallback (API Issue: {str(e)[:40]})"
            fallback_reason = f"Free tier API call failed: {str(e)[:60]}"
    else:
        # 100% Free Transparent Fallback Mode
        raw_items = extract_fallback_rule_based(text, doc_name)
        is_demo = True
        provider_name = "Zero-Cost Rule-Based Extractor (No API Key - Demo Mode)"
        fallback_reason = "No commercial API key configured in server environment. Operating in 100% free offline deterministic mode."

    # Evidence Verification Pass
    verified_items = []
    for item in raw_items:
        excerpt = item.get("source_excerpt", "")
        is_verified, match_score = verify_excerpt_in_text(excerpt, text)
        
        verified_items.append({
            "category": item.get("category", "pending_task"),
            "title": item.get("title", "Untitled Knowledge Item"),
            "content": item.get("content", ""),
            "priority": item.get("priority", "medium").lower(),
            "assignee": item.get("assignee"),
            "source_document_name": doc_name,
            "source_page": item.get("source_page", "Page 1"),
            "source_excerpt": excerpt,
            "evidence_verified": is_verified,
            "missing_evidence_flag": not is_verified,
            "confidence_score": round(match_score if is_verified else 0.40, 2),
            "is_ai_generated": not is_demo, # Never pretend fallback is AI-generated
            "is_demo_mode": is_demo,
            "ai_provider": provider_name,
            "fallback_reason": fallback_reason,
            "estimated_cost": "₹0.00 (Zero Budget Guaranteed)"
        })

    return verified_items
