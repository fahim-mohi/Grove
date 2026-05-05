#!/usr/bin/env python3
"""Generate Grove's app-icon assets from the canonical SVG.

Reads assets/icon.svg (the spec's branching-nodes design), rasterizes it
to a 1024×1024 PNG using Python + cairosvg if available, otherwise falls
back to macOS's `qlmanage` or `rsvg-convert`. Then builds the macOS
.iconset and .icns bundle.

Outputs:
    assets/icon.png    — 1024×1024 master (consumed by electron-builder)
    assets/icon.icns   — multi-resolution macOS bundle

Run: python3 scripts/build-icons.py
"""

from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / "assets" / "icon.svg"
OUT_PNG = ROOT / "assets" / "icon.png"
OUT_ICNS = ROOT / "assets" / "icon.icns"
ICONSET = ROOT / "assets" / "icon.iconset"


def rasterize_svg_to_png(svg_path: Path, png_path: Path, size: int) -> None:
    """Try cairosvg first (clean Python pipeline), fall back to native tools."""
    # Attempt 1: cairosvg
    try:
        import cairosvg  # type: ignore

        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(png_path),
            output_width=size,
            output_height=size,
        )
        return
    except ImportError:
        pass

    # Attempt 2: rsvg-convert (Homebrew librsvg)
    if shutil.which("rsvg-convert"):
        subprocess.run(
            [
                "rsvg-convert",
                "-w",
                str(size),
                "-h",
                str(size),
                "-o",
                str(png_path),
                str(svg_path),
            ],
            check=True,
        )
        return

    # Attempt 3: qlmanage (built-in macOS) — uses thumbnail pipeline
    if shutil.which("qlmanage"):
        tmp_dir = png_path.parent / "_qltmp"
        tmp_dir.mkdir(exist_ok=True)
        subprocess.run(
            ["qlmanage", "-t", "-s", str(size), "-o", str(tmp_dir), str(svg_path)],
            check=True,
            capture_output=True,
        )
        produced = next(tmp_dir.glob("*.png"), None)
        if produced is None:
            shutil.rmtree(tmp_dir, ignore_errors=True)
            raise RuntimeError("qlmanage produced no output")
        produced.replace(png_path)
        shutil.rmtree(tmp_dir, ignore_errors=True)
        return

    sys.exit(
        "No SVG rasterizer found. Install one:\n"
        "  pip install cairosvg          # cleanest\n"
        "  brew install librsvg          # rsvg-convert\n"
        "qlmanage is built-in but slowest.",
    )


def main() -> int:
    if not SVG.exists():
        sys.exit(f"icon source not found: {SVG}")

    print(f"rasterizing {SVG.relative_to(ROOT)} → 1024×1024 PNG")
    rasterize_svg_to_png(SVG, OUT_PNG, 1024)
    print(f"wrote {OUT_PNG.relative_to(ROOT)}")

    # Build macOS .iconset
    if ICONSET.exists():
        shutil.rmtree(ICONSET)
    ICONSET.mkdir(parents=True)

    sizes = [16, 32, 64, 128, 256, 512, 1024]
    for size in sizes:
        if size <= 512:
            label = ICONSET / f"icon_{size}x{size}.png"
            rasterize_svg_to_png(SVG, label, size)
        if 16 < size <= 1024:
            half = size // 2
            label2x = ICONSET / f"icon_{half}x{half}@2x.png"
            rasterize_svg_to_png(SVG, label2x, size)

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
