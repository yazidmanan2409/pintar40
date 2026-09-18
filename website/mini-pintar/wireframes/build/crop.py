from PIL import Image
for name in ["d1", "d2", "m1", "m2", "detail"]:
    p = f"{name}.png"
    im = Image.open(p).convert("RGB")
    w, h = im.size
    px = im.load()
    last = 0
    for y in range(h - 1, -1, -1):
        for x in range(0, w, 3):
            r, g, b = px[x, y]
            if r < 245 or g < 245 or b < 245:
                last = y
                break
        if last:
            break
    im.crop((0, 0, w, min(h, last + 80))).save(p)
    print(f"{name}: {w}x{min(h, last + 80)}")
