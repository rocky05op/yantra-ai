import re
import time
import uuid
from collections import defaultdict
from fastapi import Request, HTTPException, UploadFile
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# 1. Sliding-Window IP Rate Limiter (Protects AI credits from automated scripts)
RATE_LIMIT_BUCKETS = defaultdict(list)
RATE_LIMIT_MAX_REQ = 12       # প্রতি মিনিটে ১২টা রিকোয়েস্ট
RATE_LIMIT_WINDOW_SEC = 60

# 2. Prompt Injection, SSRF & XSS Signatures
MALICIOUS_PROMPT_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"(?i)system\s*prompt",
    r"(?i)developer\s*mode",
    r"<\s*script\b",
    r"javascript\s*:",
    r"on(error|load|click|mouseover)\s*=",
    r"(\.\./|\.\.\\)",  # Path traversal guard
]

ALLOWED_STYLES = {
    "none", "watercolor", "neon-cyberpunk", "anime",
    "oil-painting", "pencil", "3d-render", "sacred-geometry", "surreal"
}

ALLOWED_ASPECT_RATIOS = {"1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"}
ALLOWED_RESOLUTIONS = {"512", "768", "1024", "2048"}


class YantraSecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Apply strict rate-limiting on generation endpoints
        if request.method == "POST" and "/generate" in request.url.path:
            RATE_LIMIT_BUCKETS[client_ip] = [
                ts for ts in RATE_LIMIT_BUCKETS[client_ip]
                if now - ts < RATE_LIMIT_WINDOW_SEC
            ]
            if len(RATE_LIMIT_BUCKETS[client_ip]) >= RATE_LIMIT_MAX_REQ:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded: Max 12 generations per minute."}
                )
            RATE_LIMIT_BUCKETS[client_ip].append(now)

        response = await call_next(request)

        # 3. Hardened CSP & OWASP Security Headers
        csp_directives = (
            "default-src 'self'; "
            "img-src 'self' data: blob: https:; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "script-src 'self'; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:*; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        response.headers["Content-Security-Policy"] = csp_directives
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-Request-ID"] = request_id
        response.headers["Access-Control-Expose-Headers"] = "X-Request-ID, X-Yantra-Engine"

        return response


def validate_and_sanitize_text(text: str, field_name: str, max_len: int) -> str:
    if text is None:
        return ""
    cleaned = text.strip()
    if len(cleaned) > max_len:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} exceeds maximum length of {max_len} characters."
        )
    for pattern in MALICIOUS_PROMPT_PATTERNS:
        if re.search(pattern, cleaned):
            raise HTTPException(
                status_code=400,
                detail=f"Security violation: Disallowed pattern detected in {field_name}."
            )
    return cleaned


async def verify_uploaded_reference(file: UploadFile | None) -> bytes | None:
    """Validates file size (<=15MB per contract) and verifies real Magic Bytes."""
    if file is None or not file.filename:
        return None

    raw_bytes = await file.read()
    if len(raw_bytes) == 0:
        return None

    # Contract allows up to 15 MB
    if len(raw_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Reference image exceeds 15MB limit.")

    # Verify cryptographic file signature (Magic Bytes) for PNG, JPEG, or WebP
    is_png = raw_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_jpeg = raw_bytes.startswith(b"\xff\xd8\xff")
    is_webp = len(raw_bytes) > 12 and raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP"

    if not (is_png or is_jpeg or is_webp):
        raise HTTPException(
            status_code=400,
            detail="Security Alert: Invalid image binary signature (only real PNG, JPEG, WebP allowed)."
        )

    return raw_bytes