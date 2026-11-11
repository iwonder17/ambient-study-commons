import os
from PIL import Image, ImageDraw

def create_mascot_icon(size):
    # Create RGBA image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale helper
    s = size / 128.0
    
    # Background circle (deep dark indigo/slate with glowing cyan border)
    bg_box = [4 * s, 4 * s, 124 * s, 124 * s]
    draw.ellipse(bg_box, fill=(15, 23, 42, 255), outline=(16, 185, 129, 255), width=max(1, int(4 * s)))
    
    # Inner glow accent
    inner_glow = [10 * s, 10 * s, 118 * s, 118 * s]
    draw.ellipse(inner_glow, outline=(6, 182, 212, 100), width=max(1, int(2 * s)))

    # Owl Body (dark teal/slate)
    body_box = [28 * s, 36 * s, 100 * s, 108 * s]
    draw.ellipse(body_box, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=max(1, int(2 * s)))
    
    # Owl Eyes outer (glowing teal)
    left_eye_outer = [36 * s, 50 * s, 62 * s, 76 * s]
    right_eye_outer = [66 * s, 50 * s, 92 * s, 76 * s]
    draw.ellipse(left_eye_outer, fill=(6, 182, 212, 220))
    draw.ellipse(right_eye_outer, fill=(6, 182, 212, 220))
    
    # Eye pupils (dark slate)
    left_pupil = [44 * s, 58 * s, 56 * s, 70 * s]
    right_pupil = [72 * s, 58 * s, 84 * s, 70 * s]
    draw.ellipse(left_pupil, fill=(15, 23, 42, 255))
    draw.ellipse(right_pupil, fill=(15, 23, 42, 255))
    
    # Pupil shine (white spark)
    draw.ellipse([46 * s, 60 * s, 50 * s, 64 * s], fill=(255, 255, 255, 255))
    draw.ellipse([74 * s, 60 * s, 78 * s, 64 * s], fill=(255, 255, 255, 255))
    
    # Beak (golden orange)
    draw.polygon([
        (64 * s, 68 * s),
        (58 * s, 78 * s),
        (70 * s, 78 * s)
    ], fill=(245, 158, 11, 255))
    
    # Graduation Cap / Study Cap (emerald green)
    cap_poly = [
        (64 * s, 22 * s),
        (96 * s, 32 * s),
        (64 * s, 42 * s),
        (32 * s, 32 * s)
    ]
    draw.polygon(cap_poly, fill=(16, 185, 129, 255), outline=(5, 150, 105, 255), width=max(1, int(1.5 * s)))
    
    # Cap tassel
    draw.line([(64 * s, 32 * s), (90 * s, 44 * s)], fill=(251, 191, 36, 255), width=max(1, int(2 * s)))
    draw.ellipse([88 * s, 43 * s, 93 * s, 48 * s], fill=(251, 191, 36, 255))
    
    return img

def main():
    os.makedirs('extension/icons', exist_ok=True)
    for sz in [16, 48, 128]:
        icon = create_mascot_icon(sz)
        out_path = f'extension/icons/icon{sz}.png'
        icon.save(out_path, format='PNG')
        print(f"Created {out_path} ({sz}x{sz})")

if __name__ == '__main__':
    main()

