#!/usr/bin/env python3
"""
App Icon Generator for Trackr
Creates all required iOS app icon sizes from a base design
"""

import io
import base64
from pathlib import Path

def create_trackr_app_icon_svg(size):
    """Create Trackr app icon as SVG"""
    # Calculate responsive sizes
    font_size = size * 0.18  # 18% of icon size
    border_radius = size * 0.15  # 15% border radius for modern iOS look
    
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient background for modern iOS look -->
    <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#2a2a2a"/>
    </linearGradient>
    
    <!-- Text gradient -->
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0f0f0"/>
    </linearGradient>
    
    <!-- Subtle inner shadow -->
    <filter id="innerShadow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
      <feOffset dx="1" dy="1" result="offset"/>
    </filter>
  </defs>
  
  <!-- Background with border radius -->
  <rect width="{size}" height="{size}" fill="url(#backgroundGradient)" rx="{border_radius}" ry="{border_radius}"/>
  
  <!-- Subtle inner border for depth -->
  <rect x="2" y="2" width="{size-4}" height="{size-4}" fill="none" 
        stroke="rgba(255,255,255,0.1)" stroke-width="1" rx="{border_radius-2}" ry="{border_radius-2}"/>
  
  <!-- Main trackr text -->
  <text x="{size/2}" y="{size/2 + font_size*0.3}" 
        font-family="SF Pro Display, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif" 
        font-size="{font_size}" 
        font-weight="300" 
        fill="url(#textGradient)" 
        text-anchor="middle" 
        dominant-baseline="middle">trackr</text>
  
  <!-- Small chart icon accent -->
  <g transform="translate({size*0.7}, {size*0.2})">
    <path d="M 0 20 L 5 15 L 10 18 L 15 8 L 20 12" 
          stroke="#4CAF50" stroke-width="2" fill="none" opacity="0.8"/>
    <circle cx="20" cy="12" r="2" fill="#4CAF50" opacity="0.9"/>
  </g>
</svg>'''
    
    return svg_content

def create_icon_html_converter():
    """Create HTML file to convert SVG to PNG"""
    html_content = '''<!DOCTYPE html>
<html>
<head>
    <title>Trackr App Icon Generator</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .icon-container { 
            display: inline-block; 
            margin: 10px; 
            text-align: center; 
            background: white; 
            padding: 15px; 
            border-radius: 10px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
        }
        .icon { 
            border-radius: 15px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
        }
        .instructions {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 { color: #1a1a1a; margin-bottom: 20px; }
        h2 { color: #333; margin-bottom: 15px; }
        .size-label { 
            margin-top: 10px; 
            font-weight: 600; 
            color: #666; 
        }
        .usage { 
            font-size: 12px; 
            color: #888; 
        }
    </style>
</head>
<body>
    <h1>📱 Trackr App Icon Generator</h1>
    
    <div class="instructions">
        <h2>🎯 How to Save Icons:</h2>
        <ol>
            <li><strong>Right-click</strong> on each icon below</li>
            <li>Select <strong>"Save Image As..."</strong></li>
            <li>Save with the filename shown under each icon</li>
            <li>Replace the files in your <code>assets/</code> folder</li>
        </ol>
        
        <h2>📋 Required for App Store:</h2>
        <ul>
            <li><strong>icon.png</strong> - Main app icon (1024x1024)</li>
            <li><strong>adaptive-icon.png</strong> - Android adaptive icon</li>
            <li><strong>favicon.png</strong> - Web favicon</li>
        </ul>
    </div>'''
    
    # Icon sizes needed
    icon_configs = [
        {"size": 1024, "filename": "icon.png", "usage": "App Store & iOS App Icon"},
        {"size": 512, "filename": "adaptive-icon.png", "usage": "Android Adaptive Icon"},
        {"size": 180, "filename": "ios-180.png", "usage": "iPhone @3x (60pt)"},
        {"size": 120, "filename": "ios-120.png", "usage": "iPhone @2x (60pt)"},
        {"size": 32, "filename": "favicon.png", "usage": "Web Favicon"},
    ]
    
    for config in icon_configs:
        size = config["size"]
        filename = config["filename"]
        usage = config["usage"]
        
        svg_content = create_trackr_app_icon_svg(size)
        svg_data = base64.b64encode(svg_content.encode()).decode()
        
        html_content += f'''
    <div class="icon-container">
        <img src="data:image/svg+xml;base64,{svg_data}" 
             width="{min(size, 200)}" height="{min(size, 200)}" 
             class="icon" alt="Trackr Icon {size}x{size}">
        <div class="size-label">{filename}</div>
        <div class="usage">{size}×{size} - {usage}</div>
    </div>'''
    
    html_content += '''
    
    <div style="margin-top: 30px; padding: 20px; background: #e8f5e8; border-radius: 10px;">
        <h2>✅ Next Steps:</h2>
        <ol>
            <li>Save all icons using right-click → "Save Image As..."</li>
            <li>Replace existing files in <code>assets/</code> folder</li>
            <li>Commit changes to git</li>
            <li>Rebuild your app with <code>eas build --platform ios --profile production</code></li>
            <li>Upload to App Store Connect</li>
        </ol>
    </div>
    
</body>
</html>'''
    
    return html_content

# Generate the HTML file
if __name__ == "__main__":
    html_content = create_icon_html_converter()
    
    output_path = Path(__file__).parent / "trackr_app_icons.html"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"✅ App icon generator created: {output_path}")
    print(f"🌐 Open this file in your web browser to download all icon sizes")
    print(f"📱 Icons will be optimized for iOS App Store requirements")
    
    # Also create individual SVG files
    for size in [1024, 512, 180, 120, 32]:
        svg_content = create_trackr_app_icon_svg(size)
        svg_path = Path(__file__).parent / "assets" / f"trackr-icon-{size}.svg"
        svg_path.parent.mkdir(exist_ok=True)
        
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"📄 Created: {svg_path}")
