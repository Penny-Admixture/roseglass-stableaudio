# Assets Directory

This directory contains the application assets including icons and installer resources.

## Required Files

### Icons
- `icon.ico` - Windows icon (256x256, 32-bit)
- `icon.icns` - macOS icon (multiple sizes)
- `icon.png` - Linux icon (512x512, PNG)

### Installer Resources
- `installer-header.bmp` - NSIS installer header image (150x57, 24-bit BMP)
- `dmg-background.png` - macOS DMG background image (540x380, PNG)

## Icon Specifications

### Windows (.ico)
- Size: 256x256 pixels
- Format: 32-bit with alpha channel
- Multiple sizes embedded: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### macOS (.icns)
- Multiple sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Format: PNG with alpha channel
- Generated from 1024x1024 source

### Linux (.png)
- Size: 512x512 pixels
- Format: PNG with alpha channel
- High resolution for various display densities

## Creating Icons

You can create these icons from a single high-resolution source image (1024x1024) using tools like:

- **Online**: favicon.io, iconifier.net
- **Desktop**: GIMP, Photoshop, Sketch
- **Command line**: ImageMagick, Inkscape

## Installer Header

The NSIS installer header should be:
- Size: 150x57 pixels
- Format: 24-bit BMP
- Style: Clean, professional design matching the app theme
- Content: App logo/name with subtle background

## DMG Background

The macOS DMG background should be:
- Size: 540x380 pixels
- Format: PNG
- Style: Clean, modern design
- Content: App icon, name, and drag-to-Applications instruction
