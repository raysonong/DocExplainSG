"""Generate the DocExplainSG icon set (document + speech mark) with Pillow.

Run (Pillow lives in the api venv):
    uv --directory ../api run python scripts/gen_icon.py
Outputs into app/assets/.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parents[1] / "assets"

DARK = (9, 9, 11, 255)       # #09090B background
PAGE = (96, 165, 250, 255)   # #60A5FA brand blue page
LINE = (11, 18, 32, 255)     # dark text lines on the page
BUBBLE = (250, 250, 250, 255)  # #FAFAFA speech bubble
CHECK = (37, 99, 235, 255)   # #2563EB check mark
TRANSPARENT = (0, 0, 0, 0)


def draw_glyph(img: Image.Image, scale: float = 1.0, mono: bool = False) -> None:
    """Draw the page + speech-bubble glyph centred on a square RGBA image."""
    d = ImageDraw.Draw(img)
    s = img.size[0]
    g = s * scale  # glyph box size
    ox = (s - g) / 2
    oy = (s - g) / 2

    page_fill = (255, 255, 255, 255) if mono else PAGE
    # Page (rounded rectangle), inset with margins so nothing clips on rounded
    # icon corners; sits up-left to leave room for the speech bubble.
    pw, ph = g * 0.40, g * 0.48
    px = ox + g * 0.20
    py = oy + g * 0.14
    rad = g * 0.05
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=rad, fill=page_fill)

    if not mono:
        # Text lines on the page.
        lx0 = px + pw * 0.16
        lx1 = px + pw * 0.84
        lh = ph * 0.07
        for i in range(4):
            ly = py + ph * (0.18 + i * 0.18)
            width = (lx1 - lx0) * (0.65 if i == 3 else 1.0)
            d.rounded_rectangle([lx0, ly, lx0 + width, ly + lh], radius=lh / 2, fill=LINE)

    # Speech/check bubble, bottom-right, overlapping the page corner.
    br = g * 0.15
    bx = px + pw - g * 0.05
    by = py + ph - g * 0.05
    bubble_fill = (255, 255, 255, 255) if mono else BUBBLE
    d.ellipse([bx, by, bx + br * 2, by + br * 2], fill=bubble_fill)
    if not mono:
        # Check mark inside the bubble.
        cx, cy = bx + br, by + br
        lw = max(2, int(br * 0.18))
        d.line(
            [
                (cx - br * 0.45, cy + br * 0.02),
                (cx - br * 0.10, cy + br * 0.38),
                (cx + br * 0.5, cy - br * 0.40),
            ],
            fill=CHECK,
            width=lw,
            joint="curve",
        )


def make(size: int, *, bg, scale: float, mono: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), bg)
    draw_glyph(img, scale=scale, mono=mono)
    return img


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    # Main app icon (full-bleed dark tile).
    make(1024, bg=DARK, scale=1.0).save(ASSETS / "icon.png")
    # Android adaptive: foreground glyph on transparent (safe-area scaled), dark bg.
    make(1024, bg=TRANSPARENT, scale=0.66).save(ASSETS / "android-icon-foreground.png")
    Image.new("RGBA", (1024, 1024), DARK).save(ASSETS / "android-icon-background.png")
    make(1024, bg=TRANSPARENT, scale=0.66, mono=True).save(
        ASSETS / "android-icon-monochrome.png"
    )
    # Splash glyph (transparent; expo composes it on the splash background).
    make(1024, bg=TRANSPARENT, scale=0.6).save(ASSETS / "splash-icon.png")
    # Favicon.
    make(196, bg=DARK, scale=1.0).save(ASSETS / "favicon.png")
    print("wrote icon.png, android-icon-*, splash-icon.png, favicon.png")


if __name__ == "__main__":
    main()
