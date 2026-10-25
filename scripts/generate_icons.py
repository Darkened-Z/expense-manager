import os
from PIL import Image

os.makedirs("public/icons", exist_ok=True)

logo_path = "public/logo.png"
if os.path.exists(logo_path):
    square = Image.open(logo_path).convert("RGBA")
    
    sizes = {
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }
    for filename, s in sizes.items():
        resized = square.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(f"public/icons/{filename}", "PNG")
        print(f"Generated public/icons/{filename} ({s}x{s})")

    # Maskable icon with safe zone
    maskable = Image.new("RGBA", (512, 512), (200, 200, 202, 255))
    inner = square.resize((384, 384), Image.Resampling.LANCZOS)
    maskable.paste(inner, (64, 64))
    maskable.save("public/icons/icon-maskable-512.png", "PNG")
    print("Generated public/icons/icon-maskable-512.png (512x512)")

