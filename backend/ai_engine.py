import io
import os
import random
import urllib.parse
import urllib.request
import httpx
import base64
from fastapi import HTTPException
from PIL import Image, ImageEnhance, ImageFilter
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

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

GOOGLE_ASPECT_RATIOS = {"1:1":"1:1", "4:3":"4:3", "3:4":"3:4", "16:9":"16:9", "9:16":"9:16", "3:2":"16:9", "2:3":"9:16"}
FALLBACK_RATIOS = {"1:1":(1024,1024), "4:3":(1024,768), "3:4":(768,1024), "16:9":(1280,720), "9:16":(720,1280), "3:2":(1152,768), "2:3":(768,1152)}

async def generate_artwork_pipeline(
    prompt: str, style: str, negative_prompt: str, aspect_ratio: str, resolution: str, reference_bytes: bytes | None, sketch_influence: int
) -> tuple[bytes, str]:
    
    clean_style = (style or "none").strip().lower()
    prefix = STYLE_PREFIX.get(clean_style, STYLE_PREFIX["none"])
    
    final_prompt = f"{prefix} {prompt.strip()}."
    if negative_prompt:
        final_prompt += f" Do not include: {negative_prompt.strip()}."

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    # 1. Primary Engine: Google Imagen 3 (SSL verification disabled for local testing)
    if GOOGLE_API_KEY and GOOGLE_API_KEY.startswith("AIzaSy"):
        google_ratio = GOOGLE_ASPECT_RATIOS.get(aspect_ratio, "1:1")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={GOOGLE_API_KEY}"
        payload = {
            "instances": [{"prompt": final_prompt}],
            "parameters": {"sampleCount": 1, "aspectRatio": google_ratio}
        }
        try:
            # verify=False prevents Windows SSL block
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code == 200:
                    data = resp.json()
                    if "predictions" in data and len(data["predictions"]) > 0:
                        img_bytes = base64.b64decode(data["predictions"][0]["bytesBase64Encoded"])
                        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                        if reference_bytes and sketch_influence > 0:
                            try:
                                ref = Image.open(io.BytesIO(reference_bytes)).convert("RGB").resize(img.size)
                                img = Image.blend(img, ref, min(0.3, (sketch_influence / 100.0) * 0.3))
                            except Exception: pass
                        buf = io.BytesIO()
                        img.save(buf, format="PNG")
                        print("[SUCCESS] Google API দিয়ে ছবি জেনারেট হয়েছে!")
                        return buf.getvalue(), f"google-imagen3-{clean_style}"
        except Exception as e:
            print(f"[Google API Error] {e}")

    # 2. Backup Engine: Flux Model (Bypassing SSL)
    w, h = FALLBACK_RATIOS.get(aspect_ratio, (1024,1024))
    seed = random.randint(10000, 9999999)
    flux_prompt = f"{prefix} {prompt.strip()}, style:{clean_style} [v{seed%999}]"
    encoded = urllib.parse.quote(flux_prompt)
    flux_url = f"https://image.pollinations.ai/prompt/{encoded}?width={w}&height={h}&seed={seed}&nologo=true&model=flux"
    
    try:
        async with httpx.AsyncClient(timeout=25.0, verify=False, follow_redirects=True, headers=headers) as client:
            resp = await client.get(flux_url)
            if resp.status_code == 200 and len(resp.content) > 1000:
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
                if reference_bytes and sketch_influence > 0:
                    try:
                        ref = Image.open(io.BytesIO(reference_bytes)).convert("RGB").resize(img.size)
                        img = Image.blend(img, ref, min(0.3, (sketch_influence / 100.0) * 0.3))
                    except Exception: pass
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                print("[SUCCESS] Flux API দিয়ে ছবি জেনারেট হয়েছে!")
                return buf.getvalue(), f"flux-fallback-{clean_style}"
    except Exception as e:
        print(f"[Flux Error] {e}")

    # 3. Ultimate Fallback (Using Python's built-in urllib if httpx is totally blocked)
    try:
        req = urllib.request.Request(flux_url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read()
            if len(content) > 1000:
                img = Image.open(io.BytesIO(content)).convert("RGB")
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                print("[SUCCESS] Urllib ফলব্যাক দিয়ে ছবি জেনারেট হয়েছে!")
                return buf.getvalue(), f"urllib-fallback-{clean_style}"
    except Exception as e:
        print(f"[Urllib Error] {e}")

    # 4. Emergency Offline Canvas (যদি ইন্টারনেট পুরোপুরি না থাকে)
    print("[ERROR] সব ইন্টারনেট রিকোয়েস্ট ফেইল করেছে। অফলাইন ক্যানভাস রেন্ডার করা হচ্ছে।")
    img = Image.new("RGB", (w, h), (20, 20, 20)) # Dark Gray instead of Purple
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue(), "offline-fallback"