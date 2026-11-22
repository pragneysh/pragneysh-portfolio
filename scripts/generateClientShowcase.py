from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

def create_browser_mockup(img_path, width, height, domain=""):
    im = Image.open(img_path).convert("RGBA")
    
    # Scale image to fit interior
    bar_height = 36
    interior_h = height - bar_height
    im_resized = im.resize((width, interior_h), Image.Resampling.LANCZOS)
    
    # Create window container
    win = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(win)
    
    # Window Header Bar (dark slate #1E293B)
    draw.rounded_rectangle([0, 0, width, height], radius=12, fill=(15, 23, 42, 255), outline=(51, 65, 85, 255), width=2)
    draw.rectangle([0, bar_height, width, height], fill=(15, 23, 42, 255))
    
    # Window Buttons
    draw.ellipse([16, 12, 26, 22], fill=(239, 68, 68, 255))
    draw.ellipse([34, 12, 44, 22], fill=(245, 158, 11, 255))
    draw.ellipse([52, 12, 62, 22], fill=(16, 185, 129, 255))
    
    # URL Pill
    pill_w = int(width * 0.45)
    pill_x = int((width - pill_w) / 2)
    draw.rounded_rectangle([pill_x, 7, pill_x + pill_w, 29], radius=6, fill=(10, 15, 26, 255), outline=(51, 65, 85, 255))
    
    # Paste image
    win.paste(im_resized, (0, bar_height))
    # Outline again
    draw.rounded_rectangle([0, 0, width, height], radius=12, outline=(71, 85, 105, 255), width=2)
    
    return win

def generate():
    canvas_w = 1600
    canvas_h = 900
    
    # Base dark background
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (11, 15, 25, 255))
    draw = ImageDraw.Draw(canvas)
    
    # Subtle background radial glow
    for r in range(500, 0, -50):
        alpha = int((1 - r / 500) * 35)
        draw.ellipse([800 - r, 450 - r, 800 + r, 450 + r], fill=(37, 99, 235, alpha))
        
    src_dir = os.path.abspath("src/assets/deployments")
    aurexon_path = os.path.join(src_dir, "aurexon.jpg")
    forti_path = os.path.join(src_dir, "fortinexus.jpg")
    yoga_path = os.path.join(src_dir, "theyogahub.jpg")
    
    # 1. Left Window: FortiNexus (width 720, height 460)
    left_win = create_browser_mockup(forti_path, 720, 460, "fortinexus.in")
    # 2. Right Window: The Yoga Hub (width 720, height 460)
    right_win = create_browser_mockup(yoga_path, 720, 460, "theyogahub.in")
    # 3. Center Window: Aurexon International (width 940, height 590)
    center_win = create_browser_mockup(aurexon_path, 940, 590, "aurexoninternational.com")
    
    # Shadow helper
    def add_shadow(base, overlay, x, y):
        shadow = Image.new("RGBA", (overlay.width + 40, overlay.height + 40), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow)
        sdraw.rounded_rectangle([20, 20, overlay.width + 20, overlay.height + 20], radius=14, fill=(0, 0, 0, 180))
        shadow = shadow.filter(ImageFilter.GaussianBlur(14))
        base.paste(shadow, (x - 20, y - 10), shadow)
        base.paste(overlay, (x, y), overlay)

    # Paste Left
    add_shadow(canvas, left_win, 40, 180)
    # Paste Right
    add_shadow(canvas, right_win, 840, 180)
    # Paste Center Foreground
    add_shadow(canvas, center_win, 330, 220)
    
    # Output file
    out_path = os.path.join(src_dir, "client_platforms_showcase.jpg")
    final_rgb = canvas.convert("RGB")
    final_rgb.save(out_path, quality=94)
    print("Generated client showcase image:", out_path, os.path.getsize(out_path), "bytes")

generate()
