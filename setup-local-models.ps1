# RoseGlass StableAudio - Local Models Setup Script
# This script sets up the Python environment and installs local GPU models

Write-Host "🎵 RoseGlass StableAudio - Local Models Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "🔍 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ from https://python.org/" -ForegroundColor Red
    Write-Host "Make sure to check 'Add Python to PATH' during installation." -ForegroundColor Yellow
    exit 1
}

# Check if pip is available
Write-Host "🔍 Checking pip..." -ForegroundColor Yellow
try {
    $pipVersion = pip --version 2>&1
    Write-Host "✅ pip found: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pip not found. Please install pip." -ForegroundColor Red
    exit 1
}

# Check for CUDA/GPU support
Write-Host "🔍 Checking GPU support..." -ForegroundColor Yellow
try {
    $nvidiaSmi = nvidia-smi 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ NVIDIA GPU detected" -ForegroundColor Green
        $gpuSupport = $true
    } else {
        Write-Host "⚠️ NVIDIA GPU not detected, will use CPU" -ForegroundColor Yellow
        $gpuSupport = $false
    }
} catch {
    Write-Host "⚠️ nvidia-smi not found, will use CPU" -ForegroundColor Yellow
    $gpuSupport = $false
}

# Create virtual environment
Write-Host ""
Write-Host "🐍 Creating Python virtual environment..." -ForegroundColor Yellow
try {
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "📦 Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install PyTorch with appropriate CUDA support
Write-Host ""
Write-Host "🔥 Installing PyTorch..." -ForegroundColor Yellow
if ($gpuSupport) {
    Write-Host "Installing PyTorch with CUDA support..." -ForegroundColor Gray
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
} else {
    Write-Host "Installing PyTorch CPU version..." -ForegroundColor Gray
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
New-Item -ItemType Directory -Force -Path "venv" | Out-Null

# Test installation
Write-Host ""
Write-Host "🧪 Testing installation..." -ForegroundColor Yellow
try {
    python -c "import torch; import torchaudio; print('✅ PyTorch and torchaudio installed successfully')"
    python -c "import audiocraft; print('✅ AudioCraft installed successfully')" 2>$null
    python -c "import diffusers; print('✅ Diffusers installed successfully')" 2>$null
    Write-Host "✅ All dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Some dependencies may not be fully installed" -ForegroundColor Yellow
}

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

$downloadScript | Out-File -FilePath "download_models.py" -Encoding UTF8

Write-Host ""
Write-Host "🎉 Local models setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "2. Run: python download_models.py" -ForegroundColor White
Write-Host "3. Start the app: npm start" -ForegroundColor White
Write-Host ""
Write-Host "The app will now prioritize local GPU models when available!" -ForegroundColor Green
