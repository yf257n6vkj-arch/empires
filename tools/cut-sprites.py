#!/usr/bin/env python3
"""
Cuts Gemini pictures painted on a flat magenta background into map sprites.

    python3 tools/cut-sprites.py <folder with .jpg/.png> [--width 320] [--feather 0.12] [--out src/web/sprites]

Every picture becomes <name>.webp with a transparent background: the magenta is keyed out
with a soft edge, magenta spill on the subject's rim is removed, the picture is trimmed to
the subject and scaled to the given width. --feather fades the bottom part of the picture,
so terrain sprites melt into the ground instead of ending on a hard edge, and --strip-soil
removes the block of earth Gemini tends to paint under grassy hills.
"""
import argparse
import pathlib

import numpy as np
from PIL import Image


def cut(src: pathlib.Path, width: int, feather: float, strip_soil: bool) -> Image.Image:
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
    px = np.asarray(img).astype(np.float32)
    if strip_soil:
        # Gemini likes to paint hills as a block of earth cut out of the ground. In every column
        # everything below the lowest grass is that block, so it goes.
        r, g, b, a = px[..., 0], px[..., 1], px[..., 2], px[..., 3]
        grass = (a > 128) & (g > r * 0.92) & (g > b * 1.15) & (g > 70)
        lowest = np.array([(np.where(grass[:, x])[0][-1] if grass[:, x].any() else -1) for x in range(width)])
        # The block has about the same thickness everywhere, so the grass ends that far above the
        # bottom of the picture. Shadowed earth that looks green cannot pull the edge down then.
        bottom = np.array([(np.where(a[:, x] > 128)[0][-1] if (a[:, x] > 128).any() else -1) for x in range(width)])
        valid = (lowest >= 0) & (bottom >= 0)
        thickness = int(np.median((bottom - lowest)[valid])) if valid.any() else 0
        # The cut follows the smooth outline of the block's bottom, shifted up by its thickness.
        edge = np.where(bottom >= 0, bottom - thickness + 2, -1)
        # Grass tufts hanging over the earth make the edge ragged column by column; smooth it.
        smooth = edge.copy()
        for x in range(width):
            near = edge[max(0, x - 8) : x + 9]
            near = near[near >= 0]
            if len(near) and edge[x] >= 0:
                smooth[x] = int(np.median(near))
        edge = smooth
        for x in range(width):
            px[edge[x] + 1 :, x, 3] = 0
    if feather > 0:
        # Fade the foot of every column, so a diamond-shaped base melts into the ground as well.
        n = max(1, int(height * feather))
        a = px[..., 3]
        for x in range(width):
            ys = np.where(a[:, x] > 40)[0]
            if len(ys) == 0:
                continue
            bottom = ys[-1]
            top = max(0, bottom - n)
            a[top : bottom + 1, x] *= np.linspace(1, 0.1, bottom + 1 - top)
    img = Image.fromarray(np.clip(px, 0, 255).astype(np.uint8), "RGBA")
    # Trim again: stripping can leave empty rows at the bottom.
    al = np.asarray(img)[..., 3]
    rows = np.where(al.max(axis=1) > 20)[0]
    cols = np.where(al.max(axis=0) > 20)[0]
    return img.crop((int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("folder")
    p.add_argument("--width", type=int, default=320)
    p.add_argument("--feather", type=float, default=0.12)
    p.add_argument("--out", default="src/web/sprites")
    p.add_argument("--strip-soil", action="store_true", help="remove a block of earth painted under grassy hills")
    p.add_argument("--only", help="comma-separated name prefixes to process, e.g. kopec")
    args = p.parse_args()
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    files = sorted(f for f in pathlib.Path(args.folder).iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png"))
    if args.only:
        files = [f for f in files if any(f.stem.startswith(o) for o in args.only.split(","))]
    for f in files:
        img = cut(f, args.width, args.feather, args.strip_soil)
        target = out / f"{f.stem}.webp"
        img.save(target, "WEBP", quality=86, method=6)
        print(f"{target}  {img.width}x{img.height}")


if __name__ == "__main__":
    main()
