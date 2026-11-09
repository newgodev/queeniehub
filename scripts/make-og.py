from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
INK = (23, 35, 31)
ACID = (216, 243, 107)
PAPER = (245, 246, 241)
GREY = (185, 201, 191)
TEAL = (29, 102, 90)

HK = "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc"
HK_R = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"


def font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)


img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)

# subtle grid lines (architectural feel)
for x in range(0, W, 60):
    d.line([(x, 0), (x, H)], fill=(31, 45, 40), width=1)
for y in range(0, H, 60):
    d.line([(0, y), (W, y)], fill=(31, 45, 40), width=1)

# acid circle motif
d.ellipse([W - 300, -120, W + 60, 240], outline=(60, 82, 70), width=2)
d.ellipse([W - 220, -60, W + 20, 180], fill=ACID)

# brand mark
d.ellipse([64, 62, 112, 110], fill=ACID)
d.text((80, 70), "Q", font=font(HK, 30), fill=INK)
d.text((128, 66), "QUEENIE", font=font(HK, 26), fill=PAPER)
d.text((130, 96), "COMMERCIAL INDEX", font=font(HK_R, 13), fill=GREY)

# headline
d.text((64, 196), "香港工商大廈", font=font(HK, 82), fill=PAPER)
d.text((64, 292), "及盤源索引", font=font(HK, 82), fill=ACID)

# subtitle
d.text((66, 412), "由大廈開始：地址、用途、面積及價格範圍", font=font(HK_R, 27), fill=GREY)
d.text((66, 452), "再睇現有出售同放租公開盤源", font=font(HK_R, 27), fill=GREY)

# footer chips
chips = ["67 幢大廈", "126 個公開盤源", "queeniehub.estate"]
x = 66
for c in chips:
    f = font(HK_R, 18)
    w = d.textlength(c, font=f)
    d.rounded_rectangle([x, 526, x + w + 34, 570], radius=22, outline=(90, 110, 100), width=1)
    d.text((x + 17, 536), c, font=f, fill=PAPER)
    x += w + 46

# accent bar
d.rectangle([0, H - 12, W, H], fill=TEAL)

img.save("/home/ubuntu/queeniehub/public/og-cover.png", optimize=True)
print("saved", img.size)
