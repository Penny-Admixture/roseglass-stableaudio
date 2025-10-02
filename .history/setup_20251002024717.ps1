# RoseGlass StableAudio Setup Script
# This script sets up the development environment and builds the MSI installer

Write-Host "🎵 RoseGlass StableAudio Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18 or later from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is available
Write-Host "🔍 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create assets directory and placeholder files
Write-Host ""
Write-Host "🎨 Setting up assets..." -ForegroundColor Yellow
if (!(Test-Path "assets")) {
    New-Item -ItemType Directory -Path "assets" | Out-Null
}

# Create placeholder icon (simple base64 encoded 1x1 pixel)
$iconData = [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
[System.IO.File]::WriteAllBytes("assets\icon.ico", $iconData)
[System.IO.File]::WriteAllBytes("assets\icon.png", $iconData)

# Create placeholder installer header
$headerData = New-Object byte[] (150 * 57 * 3)
[System.IO.File]::WriteAllBytes("assets\installer-header.bmp", $headerData)

Write-Host "✅ Placeholder assets created" -ForegroundColor Green

# Test the application
Write-Host ""
Write-Host "🧪 Testing application..." -ForegroundColor Yellow
try {
    Write-Host "Starting development server (will run for 5 seconds)..." -ForegroundColor Gray
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Application test completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Application test failed, but continuing..." -ForegroundColor Yellow
}

# Build the MSI installer
Write-Host ""
Write-Host "🔨 Building MSI installer..." -ForegroundColor Yellow
try {
    npm run build:msi
    Write-Host "✅ MSI installer built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build MSI installer" -ForegroundColor Red
    Write-Host "You can try running: npm run build:installer" -ForegroundColor Yellow
}

# Check for output files
Write-Host ""
Write-Host "📁 Checking output files..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $msiFiles = Get-ChildItem -Path "dist" -Filter "*.msi"
    if ($msiFiles.Count -gt 0) {
        Write-Host "✅ MSI installer found:" -ForegroundColor Green
        foreach ($file in $msiFiles) {
            $sizeMB = [math]::Round($file.Length / 1MB, 2)
            Write-Host "   - $($file.Name) ($sizeMB MB)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  No MSI files found in dist directory" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  dist directory not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm start' to launch the application" -ForegroundColor White
Write-Host "2. Run 'npm run dev' for development mode" -ForegroundColor White
Write-Host "3. Run 'npm run build:msi' to create MSI installer" -ForegroundColor White
Write-Host "4. Check the dist/ folder for the installer" -ForegroundColor White
Write-Host ""
Write-Host "For real API integration, update src/model-apis.js with your API keys" -ForegroundColor Yellow
Write-Host "For custom icons, replace the files in assets/ directory" -ForegroundColor Yellow
