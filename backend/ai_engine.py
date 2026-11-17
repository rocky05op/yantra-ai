import io
import os
import base64
import httpx
import random
import urllib.parse
import urllib.request

from pathlib import Path
from fastapi import HTTPException
from PIL import Image
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()

CLOUDFLARE_MODEL = "@cf/black-forest-labs/flux-2-klein-4b"

async def _generate_sketch_image(
    prompt: str,
    style: str,
    negative_prompt: str,
    aspect_ratio: str,
    resolution: str,
    reference_bytes: bytes,
    sketch_influence: int,
) -> tuple[bytes, str]:

    if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Cloudflare credentials are missing from backend/.env"
        )

    # Read and prepare sketch
    try:
        source = Image.open(io.BytesIO(reference_bytes))
        source.load()
        source = source.convert("RGB")

        # Cloudflare reference images must be smaller than 512x512
        source.thumbnail((511, 511))

        image_buffer = io.BytesIO()
        source.save(image_buffer, format="PNG")
        sketch_bytes = image_buffer.getvalue()

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read sketch image: {exc}"
        )

    style_instructions = {
        "none": "photorealistic, polished natural photography",
        "watercolor": "watercolor illustration with translucent pigment washes",
        "neon-cyberpunk": "futuristic cyberpunk art with neon cyan and magenta lighting",
        "anime": "high-quality anime illustration with expressive linework",
        "oil-painting": "traditional oil painting with rich brush texture",
        "pencil": "detailed graphite pencil illustration",
        "3d-render": "high-quality 3D render with realistic materials",
        "sacred-geometry": "ornate sacred geometry artwork with symmetry",
        "surreal": "surreal dreamlike fine-art illustration"
    }

    influence = max(0, min(100, int(sketch_influence)))

    if influence >= 70:
        structure = (
            "Follow the reference sketch very closely. Preserve its "
            "silhouette, proportions, pose, orientation and composition."
        )
    elif influence >= 35:
        structure = (
            "Use the sketch as a strong composition guide. Keep the "
            "main subject, pose and relative positions recognizable."
        )
    else:
        structure = (
            "Use the sketch as the core concept but allow creative "
            "details without changing what it fundamentally depicts."
        )

    instruction = (
        "Transform the attached sketch into one complete polished image. "
        "The attached image is a required visual reference. "
        f"{structure} "
        f"User prompt: {prompt.strip()}. "
        f"Art style: {style_instructions.get(style, style_instructions['none'])}. "
        "Replace rough strokes with finished forms. "
        "Create coherent perspective, professional composition, "
        "refined lighting and detailed rendering."
    )

    if negative_prompt:
        instruction += f" Avoid: {negative_prompt.strip()}."

    # Output dimensions
    ratio_dimensions = {
        "1:1": (1, 1),
        "4:3": (4, 3),
        "3:4": (3, 4),
        "16:9": (16, 9),
        "9:16": (9, 16),
        "3:2": (3, 2),
        "2:3": (2, 3)
    }

    rw, rh = ratio_dimensions.get(aspect_ratio, (1, 1))

    try:
        target = int(resolution)
    except (TypeError, ValueError):
        target = 1024

    target = max(512, min(1920, target))

    scale = target / max(rw, rh)
    width = max(256, int(rw * scale))
    height = max(256, int(rh * scale))

    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/{CLOUDFLARE_MODEL}"
    )

    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"
    }

    form_data = {
        "prompt": instruction,
        "width": str(width),
        "height": str(height),
        "guidance": "4"
    }

    files = {
        "input_image_0": (
            "sketch.png",
            sketch_bytes,
            "image/png"
        )
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(180.0, connect=20.0)
        ) as client:

            response = await client.post(
                url,
                headers=headers,
                data=form_data,
                files=files
            )

        if response.status_code != 200:
            print(
                f"[Sketch Cloudflare Error] "
                f"HTTP {response.status_code}: "
                f"{response.text[:1500]}"
            )

            raise HTTPException(
                status_code=502,
                detail=f"Cloudflare returned HTTP {response.status_code}."
            )

        data = response.json()

        image_b64 = (
            data.get("result", {}).get("image")
            if isinstance(data.get("result"), dict)
            else None
        )

        if not image_b64:
            raise HTTPException(
                status_code=502,
                detail="Cloudflare did not return an image."
            )

        image_bytes = base64.b64decode(image_b64)

        generated = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        output = io.BytesIO()
        generated.save(output, format="PNG")

        print(
            "[YANTRA Sketch] "
            "Cloudflare FLUX.2 Klein generation succeeded."
        )

        return (
            output.getvalue(),
            f"cloudflare-flux-2-klein-sketch-{style}"
        )

    except HTTPException:
        raise

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Cloudflare sketch generation timed out."
        )

    except Exception as exc:
        print(
            f"[Sketch Cloudflare Error] "
            f"{type(exc).__name__}: {exc}"
        )

        raise HTTPException(
            status_code=502,
            detail="Cloudflare sketch generation failed."
        )



async def generate_artwork_pipeline(
    prompt: str,
    style: str,
    negative_prompt: str,
    aspect_ratio: str,
    resolution: str,
    reference_bytes: bytes | None,
    sketch_influence: int,
    generation_mode: str = "prompt",
) -> tuple[bytes, str]:

    print(f"[YANTRA DEBUG] Generation mode: {generation_mode}")

    # ==========================================
    # 1. SKETCH-TO-IMAGE → CLOUDFLARE
    # ==========================================
    if generation_mode == "sketch":

        if not reference_bytes:
            raise HTTPException(
                status_code=400,
                detail="Sketch image is missing."
            )

        clean_style = (style or "none").strip().lower()

        return await _generate_sketch_image(
            prompt=prompt,
            style=clean_style,
            negative_prompt=negative_prompt,
            aspect_ratio=aspect_ratio,
            resolution=resolution,
            reference_bytes=reference_bytes,
            sketch_influence=sketch_influence,
        )

    # ==========================================
    # 2. PROMPT-TO-IMAGE → GOOGLE GEMINI
    # ==========================================

    if generation_mode != "prompt":
        raise HTTPException(
            status_code=400,
            detail="Invalid generation mode."
        )

    clean_style = (style or "none").strip().lower()

    STYLE_PREFIX = {
        "none": "Photorealistic high quality photography of",
        "watercolor": "Masterpiece watercolor painting, soft washes of",
        "neon-cyberpunk": "Neon cyberpunk futuristic glowing night art of",
        "anime": "Makoto Shinkai style anime illustration of",
        "oil-painting": "Classical thick impasto oil painting of",
        "pencil": "Highly detailed black and white graphite pencil sketch of",
        "3d-render": "3D Pixar Octane render, smooth studio lighting of",
        "sacred-geometry": "Sacred geometry mandala pattern, glowing of",
        "surreal": "Surrealist dreamlike Salvador Dali style fantasy painting of",
    }

    prefix = STYLE_PREFIX.get(clean_style, STYLE_PREFIX["none"])

    final_prompt = f"{prefix} {prompt.strip()}."

    if negative_prompt:
        final_prompt += f" Do not include: {negative_prompt.strip()}."

    # Google image settings
    ratio = aspect_ratio if aspect_ratio in {
        "1:1", "4:3", "3:4", "16:9",
        "9:16", "3:2", "2:3"
    } else "1:1"

    image_size = {
        "512": "512",
        "768": "1K",
        "1024": "1K",
        "2048": "2K",
        "4096": "4K",
    }.get(str(resolution), "1K")

    # ==========================================
    # PRIMARY ENGINE: GOOGLE GEMINI IMAGE
    # ==========================================

    if GOOGLE_API_KEY and GOOGLE_API_KEY.startswith("AIzaSy"):

        url = (
            "https://generativelanguage.googleapis.com/"
            "v1beta/models/gemini-3.1-flash-image:generateContent"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": final_prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
                "imageConfig": {
                    "aspectRatio": ratio,
                    "imageSize": image_size
                }
            }
        }

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(180.0, connect=20.0)
            ) as client:

                resp = await client.post(
                    url,
                    headers={
                        "x-goog-api-key": GOOGLE_API_KEY,
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

            if resp.status_code == 200:

                data = resp.json()

                candidates = data.get("candidates") or []

                for candidate in candidates:

                    parts = (
                        candidate.get("content") or {}
                    ).get("parts") or []

                    for part in parts:

                        inline = (
                            part.get("inline_data")
                            or part.get("inlineData")
                        )

                        if inline and inline.get("data"):

                            img_bytes = base64.b64decode(
                                inline["data"]
                            )

                            img = Image.open(
                                io.BytesIO(img_bytes)
                            ).convert("RGB")

                            buf = io.BytesIO()
                            img.save(buf, format="PNG")

                            print(
                                "[SUCCESS] Google Gemini Image generation succeeded!"
                            )

                            return (
                                buf.getvalue(),
                                f"google-gemini-image-{clean_style}"
                            )

                print("[Google API Error] No image returned.")

            else:
                print(
                    f"[Google API Error] HTTP {resp.status_code}: "
                    f"{resp.text[:1200]}"
                )

        except Exception as e:
            print(f"[Google API Error] {type(e).__name__}: {e}")

    else:
        print("[Google API] API key missing or invalid.")

    # ==========================================
    # 3. BACKUP ENGINE: POLLINATIONS FLUX
    # ==========================================

    print("[YANTRA] Trying Flux fallback...")

    FALLBACK_RATIOS = {
        "1:1": (1024, 1024),
        "4:3": (1024, 768),
        "3:4": (768, 1024),
        "16:9": (1280, 720),
        "9:16": (720, 1280),
        "3:2": (1152, 768),
        "2:3": (768, 1152),
    }

    w, h = FALLBACK_RATIOS.get(
        aspect_ratio,
        (1024, 1024)
    )

    seed = random.randint(10000, 9999999)

    flux_prompt = (
        f"{prefix} {prompt.strip()}, "
        f"style:{clean_style} [v{seed % 999}]"
    )

    encoded = urllib.parse.quote(flux_prompt)

    flux_url = (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={w}&height={h}&seed={seed}"
        "&nologo=true&model=flux"
    )

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:
        async with httpx.AsyncClient(
            timeout=60.0,
            verify=False,
            follow_redirects=True,
            headers=headers
        ) as client:

            resp = await client.get(flux_url)

            if resp.status_code == 200 and len(resp.content) > 1000:

                img = Image.open(
                    io.BytesIO(resp.content)
                ).convert("RGB")

                buf = io.BytesIO()
                img.save(buf, format="PNG")

                print("[SUCCESS] Flux fallback generation succeeded!")

                return (
                    buf.getvalue(),
                    f"flux-fallback-{clean_style}"
                )

    except Exception as e:
        print(f"[Flux Error] {type(e).__name__}: {e}")

    # ==========================================
    # 4. OFFLINE FALLBACK
    # ==========================================

    print("[ERROR] All image providers failed.")

    img = Image.new(
        "RGB",
        (w, h),
        (20, 20, 20)
    )

    buf = io.BytesIO()
    img.save(buf, format="PNG")

    return buf.getvalue(), "offline-fallback"
