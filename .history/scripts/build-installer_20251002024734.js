#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎵 Building RoseGlass StableAudio Installer...\n');

// Check if we're on Windows
if (process.platform !== 'win32') {
    console.log('❌ MSI installer can only be built on Windows');
    process.exit(1);
}

// Check if electron-builder is installed
try {
    execSync('npx electron-builder --version', { stdio: 'pipe' });
} catch (error) {
    console.log('📦 Installing electron-builder...');
    execSync('npm install electron-builder --save-dev', { stdio: 'inherit' });
}

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Check for required assets
const requiredAssets = [
    'assets/icon.ico',
    'assets/icon.png',
    'assets/installer-header.bmp'
];

const missingAssets = requiredAssets.filter(asset => !fs.existsSync(path.join(__dirname, '..', asset)));

if (missingAssets.length > 0) {
    console.log('⚠️  Missing required assets:');
    missingAssets.forEach(asset => console.log(`   - ${asset}`));
    console.log('\n📝 Please create these assets before building the installer.');
    console.log('   See assets/README.md for specifications.\n');
    
    // Create placeholder assets
    console.log('🔧 Creating placeholder assets...');
    
    // Create a simple icon placeholder (this would normally be a real icon)
    const iconContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(path.join(assetsDir, 'icon.ico'), iconContent);
    fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconContent);
    
    // Create a simple installer header placeholder
    const headerContent = Buffer.alloc(150 * 57 * 3); // 150x57 RGB
    fs.writeFileSync(path.join(assetsDir, 'installer-header.bmp'), headerContent);
    
    console.log('✅ Placeholder assets created');
}

// Build the application
console.log('🔨 Building application...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Application built successfully\n');
} catch (error) {
    console.log('❌ Build failed:', error.message);
    process.exit(1);
}

// Build MSI installer
console.log('📦 Building MSI installer...');
try {
    execSync('npx electron-builder --win --x64 --publish=never', { stdio: 'inherit' });
    console.log('✅ MSI installer built successfully\n');
} catch (error) {
    console.log('❌ MSI build failed:', error.message);
    process.exit(1);
}

// Check for output files
const distDir = path.join(__dirname, '..', 'dist');
const msiFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.msi'));

if (msiFiles.length > 0) {
    console.log('🎉 Installer created successfully!');
    console.log('📁 Output files:');
    msiFiles.forEach(file => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   - ${file} (${sizeInMB} MB)`);
    });
    console.log(`\n📂 Installer location: ${distDir}`);
} else {
    console.log('❌ No MSI files found in dist directory');
    process.exit(1);
}

console.log('\n🚀 Ready to distribute!');
console.log('💡 To create a GitHub release, push a tag:');
console.log('   git tag v1.0.0');
console.log('   git push origin v1.0.0');
