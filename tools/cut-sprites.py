#!/usr/bin/env python3
"""
Cuts Gemini pictures painted on a flat magenta background into map sprites.

    python3 tools/cut-sprites.py <folder with .jpg/.png> [--width 320] [--feather 0.12] [--out src/web/sprites]

Every picture becomes <name>.webp with a transparent background: the magenta is keyed out
with a soft edge, magenta spill on the subject's rim is removed, the picture is trimmed to
the subject and scaled to the given width. --feather fades the bottom part of the picture,
so terrain sprites melt into the ground instead of ending on a hard edge.
"""
import argparse
import pathlib

import numpy as np
from PIL import Image


def cut(src: pathlib.Path, width: int, feather: float) -> Image.Image:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # How magenta a pixel is: red and blue high, green low.
    magenta = np.clip((np.minimum(r, b) - g) / 255.0, 0, 1)
    # Fully magenta above 0.45, fully subject below 0.2, soft in between (JPEG edges).
    alpha = np.clip((0.45 - magenta) / 0.25, 0, 1)
    # Remove the pink cast on the rim: pull red and blue down towards green where magenta remains.
    spill = np.clip(magenta * 2.5, 0, 1)[..., None]
    fixed = rgb.copy()
    fixed[..., 0:1] = rgb[..., 0:1] - spill * np.maximum(0, rgb[..., 0:1] - g[..., None])
    fixed[..., 2:3] = rgb[..., 2:3] - spill * np.maximum(0, rgb[..., 2:3] - g[..., None])
    out = np.dstack([np.clip(fixed, 0, 255), alpha * 255]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    # Small specks of leftover background are not part of the subject.
    a = np.asarray(img)[..., 3]
    rows = np.where(a.max(axis=1) > 40)[0]
    cols = np.where(a.max(axis=0) > 40)[0]
    if len(rows) == 0 or len(cols) == 0:
        raise SystemExit(f"{src.name}: no subject found, is the background magenta?")
    img = img.crop((int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1))
    height = round(img.height * width / img.width)
    img = img.resize((width, height), Image.LANCZOS)
    if feather > 0:
        px = np.asarray(img).astype(np.float32)
        n = max(1, int(height * feather))
        ramp = np.ones(height, dtype=np.float32)
        ramp[height - n :] = np.linspace(1, 0.15, n)
        px[..., 3] *= ramp[:, None]
        img = Image.fromarray(px.astype(np.uint8), "RGBA")
    return img


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("folder")
    p.add_argument("--width", type=int, default=320)
    p.add_argument("--feather", type=float, default=0.12)
    p.add_argument("--out", default="src/web/sprites")
    args = p.parse_args()
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    files = sorted(f for f in pathlib.Path(args.folder).iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png"))
    for f in files:
        img = cut(f, args.width, args.feather)
        target = out / f"{f.stem}.webp"
        img.save(target, "WEBP", quality=86, method=6)
        print(f"{target}  {img.width}x{img.height}")


if __name__ == "__main__":
    main()
