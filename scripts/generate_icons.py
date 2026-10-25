import os
from PIL import Image, ImageDraw

os.makedirs("public/icons", exist_ok=True)

def create_icon(size, filename, maskable=False):
    # Obsidian dark background #0d0e12
    img = Image.new("RGBA", (size, size), (13, 14, 18, 255))
    draw = ImageDraw.Draw(img)

    margin = size * (0.2 if maskable else 0.12)
    radius = size * 0.22

    # Draw rounded rect / circle for badge
    center_x, center_y = size / 2, size / 2
    r_outer = (size - 2 * margin) / 2

    # Outer amber circle
    draw.ellipse(
        [center_x - r_outer, center_y - r_outer, center_x + r_outer, center_y + r_outer],
        fill=(249, 115, 22, 255) # orange-500
    )

    # Inner dark cut-out
    r_mid = r_outer * 0.65
    draw.ellipse(
        [center_x - r_mid, center_y - r_mid, center_x + r_mid, center_y + r_mid],
        fill=(18, 20, 26, 255)
    )

    # Center amber core dot
    r_inner = r_mid * 0.4
    draw.ellipse(
        [center_x - r_inner, center_y - r_inner, center_x + r_inner, center_y + r_inner],
        fill=(251, 146, 60, 255) # amber-400
    )

    img.save(f"public/icons/{filename}", "PNG")
    print(f"Generated public/icons/{filename} ({size}x{size})")

create_icon(180, "apple-touch-icon.png")
create_icon(192, "icon-192.png")
create_icon(512, "icon-512.png")
create_icon(512, "icon-maskable-512.png", maskable=True)
