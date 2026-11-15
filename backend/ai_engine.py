import io
import os
import httpx
from fastapi import HTTPException
from PIL import Image, ImageEnhance, ImageFilter
import base64
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

STYLE_PREFIX = {
    "none": "Photorealistic high quality photo of",
    "watercolor": "Masterpiece watercolor painting on textured paper, soft washes of",
    "neon-cyberpunk": "Neon cyberpunk futuristic glowing night aesthetic art of",
    "anime": "Makoto Shinkai style anime illustration, highly detailed cel-shaded art of",
    "oil-painting": "Classical thick impasto oil painting on canvas of",
    "pencil": "Highly detailed black and white graphite pencil sketch of",
    "3d-render": "3D Pixar Octane render, smooth studio lighting, unreal engine 5 style of",
    "sacred-geometry": "Sacred geometry mandala pattern, glowing cosmic symmetry of",
    "surreal": "Surrealist dreamlike Salvador Dali style fantasy painting of",
}

# Google Imagen 3 supports specific aspect ratios
GOOGLE_ASPECT_RATIOS = {
    "1:1": "1:1",
    "4:3": "4:3",
    "3:4": "3:4",
    "16:9": "16:9",
    "9:16": "9:16",
    "3:2": "16:9", # Fallback to closest supported
    "2:3": "9:16", # Fallback to closest supported
}

async def generate_artwork_pipeline(
    prompt: str,
    style: str,
    negative_prompt: str,
    aspect_ratio: str,
    resolution: str,
    reference_bytes: bytes | None,
    sketch_influence: int,
) -> tuple[bytes, str]:
    
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google API Key is missing in .env file!")

    clean_style = (style or "none").strip().lower()
    prefix = STYLE_PREFIX.get(clean_style, STYLE_PREFIX["none"])
    
    # Constructing the prompt for Google Imagen 3
    final_prompt = f"{prefix} {prompt.strip()}."
    if negative_prompt:
        final_prompt += f" Do not include: {negative_prompt.strip()}."

    google_ratio = GOOGLE_ASPECT_RATIOS.get(aspect_ratio, "1:1")

    # Google AI Studio Imagen 3 Endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={GOOGLE_API_KEY}"
    
    payload = {
        "instances": [{"prompt": final_prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": google_ratio
        }
    }

    headers = {"Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if "predictions" in data and len(data["predictions"]) > 0:
                    b64_img = data["predictions"][0]["bytesBase64Encoded"]
                    img_bytes = base64.b64decode(b64_img)
                    
                    # Optional Post-Processing (Sharpening & Reference Blending)
                    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                    img = img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=110, threshold=3))
                    
                    if reference_bytes and sketch_influence > 0:
                        try:
                            ref = Image.open(io.BytesIO(reference_bytes)).convert("RGB").resize(img.size)
                            img = Image.blend(img, ref, min(0.3, (sketch_influence / 100.0) * 0.3))
                        except Exception:
                            pass

                    buf = io.BytesIO()
                    img.save(buf, format="PNG")
                    return buf.getvalue(), f"google-imagen3-{clean_style}"
                else:
                    raise HTTPException(status_code=500, detail="Google API returned empty predictions.")
            else:
                error_msg = resp.json().get("error", {}).get("message", "Unknown error")
                print(f"[Google API Error] {resp.status_code}: {error_msg}")
                raise HTTPException(status_code=503, detail=f"Google API Error: {error_msg}")
                
        except Exception as e:
            print(f"[YANTRA Error] {e}")
            raise HTTPException(status_code=503, detail="AI Server connection failed. Check terminal for details.")