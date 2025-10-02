# RoseGlass StableAudio - Standalone Installer Build Script
# Creates a complete MSI installer with Python backend bundled

param(
    [string]$OutputDir = "dist-standalone",
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🎵 RoseGlass StableAudio - Standalone Installer Build" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host "📁 Output Directory: $OutputDir" -ForegroundColor Gray
Write-Host ""

# Clean output directory if requested
if ($Clean -and (Test-Path $OutputDir)) {
    Write-Host "🗑️ Cleaning output directory..." -ForegroundColor Yellow
    Remove-Item -Path $OutputDir -Recurse -Force
}

# Create output directory
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Set-Location $ProjectRoot
npm install

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Copy files for standalone installer
Write-Host "📋 Preparing files for standalone installer..." -ForegroundColor Yellow
$standaloneDir = Join-Path $OutputDir "standalone"
New-Item -ItemType Directory -Path $standaloneDir -Force | Out-Null

# Copy application files
$filesToCopy = @(
    "src",
    "package.json",
    "package-lock.json",
    "requirements.txt",
    "scripts",
    "assets"
)

foreach ($item in $filesToCopy) {
    $sourcePath = Join-Path $ProjectRoot $item
    $destPath = Join-Path $standaloneDir $item
    
    if (Test-Path $sourcePath) {
        if (Test-Path $sourcePath -PathType Container) {
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        } else {
            Copy-Item -Path $sourcePath -Destination $destPath -Force
        }
        Write-Host "  ✅ Copied $item" -ForegroundColor Gray
    }
}

# Create standalone package.json
Write-Host "📝 Creating standalone package.json..." -ForegroundColor Yellow
$standalonePackageJson = @{
    name = "roseglass-stableaudio-standalone"
    version = "1.0.0"
    description = "RoseGlass StableAudio - Standalone Installation"
    main = "src/main.js"
    homepage = "./"
    scripts = @{
        start = "electron ."
        postinstall = "electron-builder install-app-deps"
    }
    build = @{
        appId = "com.roseglass.stableaudio"
        productName = "RoseGlass StableAudio"
        directories = @{
            output = "../dist"
        }
        files = @(
            "src/**/*"
            "package.json"
            "requirements.txt"
            "scripts/**/*"
            "assets/**/*"
        )
        win = @{
            target = @(
                @{
                    target = "nsis"
                    arch = @("x64")
                }
            )
            icon = "assets/icon.ico"
        }
        nsis = @{
            oneClick = $false
            perMachine = $true
            allowElevation = $true
            allowToChangeInstallationDirectory = $true
            createDesktopShortcut = $true
            createStartMenuShortcut = $true
            shortcutName = "RoseGlass StableAudio"
            uninstallDisplayName = "RoseGlass StableAudio"
            installerIcon = "assets/icon.ico"
            uninstallerIcon = "assets/icon.ico"
            installerHeader = "assets/installer-header.bmp"
            installerHeaderIcon = "assets/icon.ico"
            deleteAppDataOnUninstall = $false
            runAfterFinish = $true
            menuCategory = "Audio & Video"
            displayLanguageSelector = $false
            language = 1033
            artifactName = "${productName} Setup ${version}.${ext}"
            include = "installer.nsh"
        }
    }
    devDependencies = @{
        electron = "^28.0.0"
        electron-builder = "^24.9.1"
    }
    dependencies = @{
        axios = "^1.6.0"
        file-saver = "^2.0.5"
        web-audio-api = "^0.2.2"
        tone = "^14.7.77"
        wavesurfer.js = "^7.4.0"
    }
    author = "RoseGlass"
    license = "MIT"
}

$standalonePackageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $standaloneDir "package.json") -Encoding UTF8

# Copy installer script
Copy-Item -Path (Join-Path $ProjectRoot "installer.nsh") -Destination (Join-Path $standaloneDir "installer.nsh") -Force

# Install dependencies in standalone directory
Write-Host "📦 Installing dependencies in standalone directory..." -ForegroundColor Yellow
Set-Location $standaloneDir
npm install

# Build the standalone installer
Write-Host "🔨 Building standalone installer..." -ForegroundColor Yellow
npx electron-builder --config electron-builder-standalone.yml --win --x64 --publish=never

# Check for output
Write-Host ""
Write-Host "📁 Checking output files..." -ForegroundColor Yellow
$distDir = Join-Path $ProjectRoot "dist"
if (Test-Path $distDir) {
    $installerFiles = Get-ChildItem -Path $distDir -Filter "*.exe"
    if ($installerFiles.Count -gt 0) {
        Write-Host "✅ Standalone installer created successfully!" -ForegroundColor Green
        Write-Host "📁 Output files:" -ForegroundColor Cyan
        foreach ($file in $installerFiles) {
            $sizeMB = [math]::Round($file.Length / 1MB, 2)
            Write-Host "  - $($file.Name) ($sizeMB MB)" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "🎉 The installer is completely self-contained and includes:" -ForegroundColor Green
        Write-Host "  ✅ Python runtime (if not already installed)" -ForegroundColor White
        Write-Host "  ✅ Python virtual environment" -ForegroundColor White
        Write-Host "  ✅ All required Python packages" -ForegroundColor White
        Write-Host "  ✅ AI model download scripts" -ForegroundColor White
        Write-Host "  ✅ Desktop and Start Menu shortcuts" -ForegroundColor White
        Write-Host "  ✅ No command line setup required!" -ForegroundColor White
    } else {
        Write-Host "❌ No installer files found" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Dist directory not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Standalone installer build completed!" -ForegroundColor Green
Write-Host "Users can now install the app with a simple double-click!" -ForegroundColor Green
