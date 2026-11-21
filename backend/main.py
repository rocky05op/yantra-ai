from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .security import (
    ALLOWED_ASPECT_RATIOS,
    ALLOWED_RESOLUTIONS,
    ALLOWED_STYLES,
    YantraSecurityMiddleware,
    validate_and_sanitize_text,
    verify_uploaded_reference,
)

from .ai_engine import generate_artwork_pipeline

app = FastAPI(
    title="YANTRA — Hardened GenAI Studio Backend",
    version="1.0.0-mvp",
    description="Secure Multipart GenAI Pipeline for Prompt-to-Image & Sketch-to-Image",
)

# 1. Strict CORS Configuration (Allows Vite Localhost & Vercel Previews)
app.add_middleware(YantraSecurityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Attach Custom Security & CSP Middleware
app.add_middleware(YantraSecurityMiddleware)


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "operational",
        "service": "YANTRA GenAI Backend",
        "security": "CSP + SlidingWindowRateLimit + MagicByteGuard Active",
        "capabilities": {
            "prompt": True,
            "style": True,
            "reference": True,
            "referenceInfluence": True,
            "negativePrompt": True,
            "aspectRatio": True,
            "resolution": True,
        },
    }


@app.post("/api/v1/generate")
async def generate_image_endpoint(
    prompt: str = Form(..., description="Required text prompt (<= 500 chars)"),
    style: str = Form("none", description="Visual style preset"),
    sketch_influence: str | None = Form(None, description="0-100 influence when reference is sent"),
    negative_prompt: str | None = Form(None, description="Optional negative prompt (<= 300 chars)"),
    aspect_ratio: str | None = Form("1:1", description="Target aspect ratio"),
    resolution: str | None = Form("1024", description="Target long-side resolution"),
    generation_mode: str = Form("prompt"),
    reference: UploadFile | None = File(None, description="Optional reference or flattened sketch image"),
    sketch: UploadFile | None = File(None, description="Legacy fallback field if sent"),
):
    # Validate generation mode
    generation_mode = (
        generation_mode or "prompt"
    ).strip().lower()

    if generation_mode not in {"prompt", "sketch"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid generation mode."
        )

    # Step 1: Sanitize & validate text inputs against Prompt Injection / XSS
    clean_prompt = validate_and_sanitize_text(prompt, "prompt", max_len=500)
    if not clean_prompt:
        raise HTTPException(status_code=400, detail="Prompt is required and cannot be empty.")

    clean_neg = validate_and_sanitize_text(negative_prompt or "", "negative_prompt", max_len=300)

    clean_style = (style or "none").strip().lower()
    if clean_style not in ALLOWED_STYLES:
        raise HTTPException(status_code=400, detail=f"Unsupported style '{clean_style}'.")

    clean_ratio = (aspect_ratio or "1:1").strip()
    if clean_ratio not in ALLOWED_ASPECT_RATIOS:
        clean_ratio = "1:1"

    clean_res = (resolution or "1024").strip()
    if clean_res not in ALLOWED_RESOLUTIONS:
        clean_res = "1024"

    # Parse sketch_influence safely (0 to 100)
    influence_val = 50
    if sketch_influence is not None and str(sketch_influence).strip() != "":
        try:
            influence_val = max(0, min(100, int(float(sketch_influence))))
        except ValueError:
            raise HTTPException(status_code=400, detail="sketch_influence must be a number between 0 and 100.")

    # Step 2: Cryptographically verify uploaded reference/sketch image (Magic Bytes + 15MB cap)
    upload_target = reference or sketch

    ref_bytes = await verify_uploaded_reference(upload_target)
    if generation_mode == "sketch" and not ref_bytes:
        raise HTTPException(
            status_code=400,
            detail="Sketch image is required."
        )

    # Step 3: Execute AI Generation Pipeline
    image_bytes, engine_used = await generate_artwork_pipeline(
        prompt=clean_prompt,
        style=clean_style,
        negative_prompt=clean_neg,
        aspect_ratio=clean_ratio,
        resolution=clean_res,
        reference_bytes=ref_bytes,
        sketch_influence=influence_val,
        generation_mode=generation_mode,
    )

    # Step 4: Stream binary PNG directly (Matches aiClient.js `type.startsWith('image/')` contract!)
    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={
            "X-Yantra-Engine": engine_used,
            "Cache-Control": "no-store",
        },
    )