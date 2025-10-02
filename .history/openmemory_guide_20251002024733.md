# OpenMemory Guide - RoseGlass StableAudio

## Project Overview
Multi-model audio generation Electron app with audio prompting capabilities. Features four different AI music generation models (Stable Audio, AudioCraft/MusicGen, AudioLDM, NVIDIA Fugatto) in a unified desktop application with proper MSI installer support.

## Architecture
Electron-based desktop application with tabbed interface for different AI music models. Each model is isolated in its own tab with model-specific controls and parameters. The app uses a modular design with separate classes for audio processing, model APIs, and UI management.

## Components
- **Stable Audio Tab**: Audio prompting with input/prompt strength controls, duration up to 30s
- **AudioCraft/MusicGen Tab**: Meta's open-source models with size selection (small/medium/large) and guidance scale
- **AudioLDM Tab**: Style transfer capabilities with inference steps and guidance scale controls
- **NVIDIA Fugatto Tab**: Flexible audio prompting with separate timbre/arrangement/notes weight controls
- **Audio Processor**: Web Audio API integration for file loading, preprocessing, and format conversion
- **Model APIs**: Centralized API management with mock implementations for demonstration
- **MSI Installer**: Full Windows installer with electron-builder configuration
- **GitHub Actions**: Automated CI/CD pipeline for building installers across platforms

## Implementation Patterns
- **Tab-based Model Isolation**: Each model has its own tab with dedicated UI and parameters
- **Audio Preprocessing Pipeline**: Unified audio processing with timbre extraction and format conversion
- **Model-specific API Wrappers**: Centralized API management with consistent interface
- **Mock Implementation Strategy**: Demonstrates functionality without requiring real API keys
- **Cross-platform Build System**: Electron-builder with platform-specific configurations

## Debugging History
- [2024-12-19 15:45]: Resolved file path issues with build directory creation
- [2024-12-19 15:50]: Fixed package.json script configuration for MSI building

## User Preferences
- Modern UI with gradient backgrounds and glassmorphism effects
- Intuitive tab-based navigation
- Real-time audio controls with progress tracking
- Comprehensive parameter controls for each model
- Professional installer with proper branding

## Recent Changes
- [2024-12-19 15:30]: Created initial project structure and openmemory guide
- [2024-12-19 15:45]: Completed full Electron app implementation with all four model tabs
- [2024-12-19 15:50]: Implemented MSI installer configuration and GitHub Actions workflow
- [2024-12-19 15:55]: Added comprehensive documentation and build scripts
