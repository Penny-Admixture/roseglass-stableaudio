# RoseGlass StableAudio - Standalone Setup Script
# This script sets up a completely self-contained installation
# Can be run from anywhere with fully qualified paths

param(
    [string]$InstallPath = "C:\Program Files\RoseGlass\StableAudio",
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🎵 RoseGlass StableAudio - Standalone Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (where this script is located)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host "📁 Install Path: $InstallPath" -ForegroundColor Gray
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️ This script should be run as Administrator for proper installation" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
}

# Create installation directory
Write-Host "📁 Creating installation directory..." -ForegroundColor Yellow
if (Test-Path $InstallPath) {
    if ($Force) {
        Write-Host "🗑️ Removing existing installation..." -ForegroundColor Yellow
        Remove-Item -Path $InstallPath -Recurse -Force
    } else {
        Write-Host "❌ Installation directory already exists. Use -Force to overwrite." -ForegroundColor Red
        exit 1
    }
}

New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
Write-Host "✅ Installation directory created" -ForegroundColor Green

# Copy application files
Write-Host "📋 Copying application files..." -ForegroundColor Yellow
$filesToCopy = @(
    "src",
    "package.json",
    "package-lock.json",
    "electron-builder.yml",
    "README.md",
    "requirements.txt"
)

foreach ($item in $filesToCopy) {
    $sourcePath = Join-Path $ProjectRoot $item
    $destPath = Join-Path $InstallPath $item
    
    if (Test-Path $sourcePath) {
        if (Test-Path $sourcePath -PathType Container) {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        } else {
            Copy-Item -Path $sourcePath -Destination $destPath -Force
        }
        Write-Host "  ✅ Copied $item" -ForegroundColor Gray
    }
}

# Create Python environment
Write-Host ""
Write-Host "🐍 Setting up Python environment..." -ForegroundColor Yellow
$PythonPath = Join-Path $InstallPath "python"
$VenvPath = Join-Path $InstallPath "venv"

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Installing Python..." -ForegroundColor Red
    
    # Download and install Python
    $pythonInstaller = Join-Path $InstallPath "python-installer.exe"
    $pythonUrl = "https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe"
    
    Write-Host "📥 Downloading Python installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller
    
    Write-Host "🔧 Installing Python..." -ForegroundColor Yellow
    Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet", "InstallAllUsers=1", "PrependPath=1", "Include_test=0" -Wait
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verify installation
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python installation failed" -ForegroundColor Red
        exit 1
    }
}

# Create virtual environment
Write-Host "🔄 Creating virtual environment..." -ForegroundColor Yellow
Set-Location $InstallPath
python -m venv venv

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "📦 Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install PyTorch with CUDA support
Write-Host ""
Write-Host "🔥 Installing PyTorch..." -ForegroundColor Yellow
try {
    $nvidiaSmi = nvidia-smi 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Installing PyTorch with CUDA support..." -ForegroundColor Gray
        pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
    } else {
        Write-Host "Installing PyTorch CPU version..." -ForegroundColor Gray
        pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
    }
} catch {
    Write-Host "Installing PyTorch CPU version (fallback)..." -ForegroundColor Gray
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
}

# Install other requirements
Write-Host ""
Write-Host "📦 Installing audio generation models..." -ForegroundColor Yellow
pip install -r requirements.txt

# Create necessary directories
Write-Host ""
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "models" | Out-Null
New-Item -ItemType Directory -Force -Path "temp" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Create model download script
Write-Host ""
Write-Host "📝 Creating model download script..." -ForegroundColor Yellow
$downloadScript = @"
#!/usr/bin/env python3
\"\"\"
Model download script for RoseGlass StableAudio
Downloads and caches models locally
\"\"\"

import os
import sys
import torch
from pathlib import Path

def download_models():
    print(\"📥 Downloading models...\")
    
    # Create models directory
    models_dir = Path(\"models\")
    models_dir.mkdir(exist_ok=True)
    
    try:
        # Download AudioCraft models
        print(\"🎵 Downloading AudioCraft models...\")
        from audiocraft.models import MusicGen
        MusicGen.get_model('small')  # This will download the model
        print(\"✅ AudioCraft models downloaded\")
        
        # Download AudioLDM models
        print(\"🎼 Downloading AudioLDM models...\")
        from diffusers import AudioLDMPipeline
        AudioLDMPipeline.from_pretrained(\"cvssp/audioldm-s-full-v2\")
        print(\"✅ AudioLDM models downloaded\")
        
        # Download Stable Audio models
        print(\"🎶 Downloading Stable Audio models...\")
        from diffusers import StableAudioDiffusionPipeline
        StableAudioDiffusionPipeline.from_pretrained(\"stabilityai/stable-audio-open-1.0\")
        print(\"✅ Stable Audio models downloaded\")
        
        print(\"🎉 All models downloaded successfully!\")
        
    except Exception as e:
        print(f\"❌ Error downloading models: {e}\")

if __name__ == \"__main__\":
    download_models()
"@

$downloadScript | Out-File -FilePath (Join-Path $InstallPath "download_models.py") -Encoding UTF8

# Create launcher script
Write-Host ""
Write-Host "📝 Creating launcher script..." -ForegroundColor Yellow
$launcherScript = @"
@echo off
cd /d "$InstallPath"
call venv\Scripts\activate.bat
start "" "node_modules\.bin\electron.cmd" .
"@

$launcherScript | Out-File -FilePath (Join-Path $InstallPath "RoseGlass-StableAudio.bat") -Encoding ASCII

# Create desktop shortcut
Write-Host ""
Write-Host "🔗 Creating desktop shortcut..." -ForegroundColor Yellow
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\RoseGlass StableAudio.lnk")
$Shortcut.TargetPath = Join-Path $InstallPath "RoseGlass-StableAudio.bat"
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.Description = "RoseGlass StableAudio - AI Music Generation"
$Shortcut.Save()

# Create start menu shortcut
Write-Host ""
Write-Host "🔗 Creating start menu shortcut..." -ForegroundColor Yellow
$StartMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\RoseGlass"
New-Item -ItemType Directory -Path $StartMenuPath -Force | Out-Null

$StartMenuShortcut = $WshShell.CreateShortcut("$StartMenuPath\RoseGlass StableAudio.lnk")
$StartMenuShortcut.TargetPath = Join-Path $InstallPath "RoseGlass-StableAudio.bat"
$StartMenuShortcut.WorkingDirectory = $InstallPath
$StartMenuShortcut.Description = "RoseGlass StableAudio - AI Music Generation"
$StartMenuShortcut.Save()

# Install Node.js dependencies
Write-Host ""
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location $InstallPath
npm install --production

# Test installation
Write-Host ""
Write-Host "🧪 Testing installation..." -ForegroundColor Yellow
try {
    python -c "import torch; import torchaudio; print('✅ PyTorch and torchaudio installed successfully')"
    Write-Host "✅ Installation test passed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Some dependencies may not be fully installed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Standalone installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Installation Details:" -ForegroundColor Cyan
Write-Host "  📁 Install Path: $InstallPath" -ForegroundColor White
Write-Host "  🖥️ Desktop Shortcut: Created" -ForegroundColor White
Write-Host "  📋 Start Menu: RoseGlass > RoseGlass StableAudio" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Double-click the desktop shortcut to start the app" -ForegroundColor White
Write-Host "2. The app will download models on first run" -ForegroundColor White
Write-Host "3. Enjoy local GPU-powered audio generation!" -ForegroundColor White
Write-Host ""
Write-Host "The app is completely self-contained and doesn't require any command line setup!" -ForegroundColor Green
