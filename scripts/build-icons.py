#!/usr/bin/env python3
"""Generate Grove's app-icon assets from the concept PNG.

Tightly crops the main icon (top portion of the concept artboard) and
removes the dark concept backdrop from the corners (flood-fill from each
corner of the orange rounded square's bounding box, knocking out matching
dark pixels with transparency). Then resizes to a 1024×1024 master at
assets/icon.png and builds the macOS .icns bundle.

Run: python3 scripts/build-icons.py
"""

from collections import deque
from pathlib import Path
import shutil
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CONCEPT = ROOT / "assets" / "concepts" / "grove-icon-concept-01.png"
OUT_PNG = ROOT / "assets" / "icon.png"
OUT_ICNS = ROOT / "assets" / "icon.icns"
ICONSET = ROOT / "assets" / "icon.iconset"

# Tight bounds on the rounded orange square in the 1254×1254 concept.
CROP_LEFT = 360
CROP_TOP = 70
CROP_RIGHT = 900
CROP_BOTTOM = 610

# A pixel is considered "concept backdrop" when its R/G/B are all
# below this threshold AND the differences between channels are small
# (close to neutral dark, not a saturated dark hue from the icon body).
DARK_THRESHOLD = 60


def is_concept_dark(rgba: tuple[int, int, int, int]) -> bool:
    r, g, b, _a = rgba
    if r > DARK_THRESHOLD or g > DARK_THRESHOLD or b > DARK_THRESHOLD:
        return False
    if abs(r - g) > 15 or abs(g - b) > 15 or abs(r - b) > 15:
        return False
    return True


def knockout_dark_corners(img: Image.Image) -> Image.Image:
    """Flood-fill from each corner — knocks out the rounded-square's
    dark exterior without touching pixels inside the icon body."""
    w, h = img.size
    px = img.load()
    visited = [[False] * h for _ in range(w)]

    def flood(start_x: int, start_y: int) -> None:
        if px is None:
            return
        if not is_concept_dark(px[start_x, start_y]):
            return
        q: deque[tuple[int, int]] = deque()
        q.append((start_x, start_y))
        while q:
            x, y = q.popleft()
            if x < 0 or y < 0 or x >= w or y >= h:
                continue
            if visited[x][y]:
                continue
            if not is_concept_dark(px[x, y]):
                continue
            visited[x][y] = True
            px[x, y] = (0, 0, 0, 0)
            q.append((x + 1, y))
            q.append((x - 1, y))
            q.append((x, y + 1))
            q.append((x, y - 1))

    for cx, cy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        flood(cx, cy)

    return img


def main() -> int:
    if not CONCEPT.exists():
        sys.exit(f"concept not found at {CONCEPT}")

    src = Image.open(CONCEPT).convert("RGBA")
    cropped = src.crop((CROP_LEFT, CROP_TOP, CROP_RIGHT, CROP_BOTTOM))
    cropped = knockout_dark_corners(cropped)

    # Square pad (should be near-square already).
    w, h = cropped.size
    side = max(w, h)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - w) // 2, (side - h) // 2), cropped)

    master = square.resize((1024, 1024), Image.LANCZOS)
    master.save(OUT_PNG, optimize=True)
    print(f"wrote {OUT_PNG.relative_to(ROOT)} ({master.size[0]}×{master.size[1]})")

    # macOS iconset structure.
    if ICONSET.exists():
        shutil.rmtree(ICONSET)
    ICONSET.mkdir(parents=True)

    sizes = [16, 32, 64, 128, 256, 512, 1024]
    for size in sizes:
        if size <= 512:
            master.resize((size, size), Image.LANCZOS).save(ICONSET / f"icon_{size}x{size}.png")
        if 16 < size <= 1024:
            half = size // 2
            master.resize((size, size), Image.LANCZOS).save(ICONSET / f"icon_{half}x{half}@2x.png")

    if OUT_ICNS.exists():
        OUT_ICNS.unlink()
    result = subprocess.run(
        ["iconutil", "-c", "icns", str(ICONSET), "-o", str(OUT_ICNS)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        return result.returncode
    print(f"wrote {OUT_ICNS.relative_to(ROOT)}")

    shutil.rmtree(ICONSET)
    return 0


if __name__ == "__main__":
    sys.exit(main())
