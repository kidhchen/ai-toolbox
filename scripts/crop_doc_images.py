from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "assets" / "doc-images"
RAW_DIR = IMAGE_DIR / "_raw-screens"
RAW_JSON = RAW_DIR / "raw-screens.json"


def clamp(value: int, lower: int, upper: int) -> int:
    return max(lower, min(value, upper))


def main() -> None:
    raw = json.loads(RAW_JSON.read_text(encoding="utf-8"))
    seen_src: set[str] = set()
    seen_hash: set[str] = set()
    manifest_images = []
    counter = 1

    for shot in raw["rawShots"]:
        screen_path = ROOT / shot["file"]
        screen = Image.open(screen_path).convert("RGB")
        width, height = screen.size

        for rect in shot["rects"]:
            src = rect.get("src") or ""
            src_key = src if not src.startswith("blob:") else ""
            if src_key and src_key in seen_src:
                continue

            x1 = clamp(int(rect["x"]), 0, width)
            y1 = clamp(int(rect["y"]), 0, height)
            x2 = clamp(int(rect["x"] + rect["w"]), 0, width)
            y2 = clamp(int(rect["y"] + rect["h"]), 0, height)
            if x2 - x1 < 40 or y2 - y1 < 40:
                continue

            crop = screen.crop((x1, y1, x2, y2))
            digest = hashlib.sha256(crop.tobytes()).hexdigest()
            if digest in seen_hash:
                continue

            seen_hash.add(digest)
            if src_key:
                seen_src.add(src_key)

            file_name = f"doc-image-{counter:02d}.png"
            out_path = IMAGE_DIR / file_name
            crop.save(out_path)

            manifest_images.append(
                {
                    "id": f"doc-image-{counter:02d}",
                    "file": f"assets/doc-images/{file_name}",
                    "sourceScreenshot": shot["file"],
                    "sourceScrollY": rect.get("scrollY"),
                    "renderedWidth": x2 - x1,
                    "renderedHeight": y2 - y1,
                    "naturalWidth": rect.get("naturalWidth"),
                    "naturalHeight": rect.get("naturalHeight"),
                    "alt": rect.get("alt"),
                    "originalSrc": "blob-url-from-source-session"
                    if src.startswith("blob:")
                    else src,
                    "context": rect.get("context", ""),
                }
            )
            counter += 1

    (IMAGE_DIR / "manifest.json").write_text(
        json.dumps(
            {
                "source": "source-rendered-crops",
                "sourceUrl": "https://example.com/source-doc",
                "images": manifest_images,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"saved {len(manifest_images)} cropped images")


if __name__ == "__main__":
    main()
