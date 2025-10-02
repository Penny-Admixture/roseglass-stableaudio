; RoseGlass StableAudio - Custom Installer Script
; This script handles the complete setup including Python environment

!macro customInstall
  ; Run the standalone setup script
  DetailPrint "Setting up Python environment and models..."
  
  ; Check if Python is installed
  nsExec::ExecToLog 'python --version'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Python not found, downloading and installing..."
    ; Download Python installer
    inetc::get "https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe" "$TEMP\python-installer.exe"
    Pop $0
    ${If} $0 == "OK"
      ; Install Python silently
      ExecWait '"$TEMP\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0'
      ; Refresh PATH
      EnVar::SetHKLM
      EnVar::AddValue "Path" "$PROGRAMFILES\Python311"
      EnVar::AddValue "Path" "$PROGRAMFILES\Python311\Scripts"
    ${EndIf}
  ${EndIf}
  
  ; Create Python virtual environment
  DetailPrint "Creating Python virtual environment..."
  nsExec::ExecToLog 'python -m venv "$INSTDIR\venv"'
  
  ; Activate virtual environment and install dependencies
  DetailPrint "Installing Python dependencies..."
  nsExec::ExecToLog '"$INSTDIR\venv\Scripts\python.exe" -m pip install --upgrade pip'
  nsExec::ExecToLog '"$INSTDIR\venv\Scripts\python.exe" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118'
  nsExec::ExecToLog '"$INSTDIR\venv\Scripts\python.exe" -m pip install -r "$INSTDIR\requirements.txt"'
  
  ; Create necessary directories
  CreateDirectory "$INSTDIR\models"
  CreateDirectory "$INSTDIR\temp"
  CreateDirectory "$INSTDIR\logs"
  
  ; Create launcher script
  FileOpen $0 "$INSTDIR\RoseGlass-StableAudio.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'cd /d "$INSTDIR"$\r$\n'
  FileWrite $0 'call venv\Scripts\activate.bat$\r$\n'
  FileWrite $0 'start "" "node_modules\.bin\electron.cmd" .$\r$\n'
  FileClose $0
  
  ; Create model download script
  FileOpen $0 "$INSTDIR\download_models.py" w
  FileWrite $0 '#!/usr/bin/env python3$\r$\n'
  FileWrite $0 '"""$\r$\n'
  FileWrite $0 'Model download script for RoseGlass StableAudio$\r$\n'
  FileWrite $0 'Downloads and caches models locally$\r$\n'
  FileWrite $0 '"""$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 'import os$\r$\n'
  FileWrite $0 'import sys$\r$\n'
  FileWrite $0 'import torch$\r$\n'
  FileWrite $0 'from pathlib import Path$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 'def download_models():$\r$\n'
  FileWrite $0 '    print("📥 Downloading models...")$\r$\n'
  FileWrite $0 '    $\r$\n'
  FileWrite $0 '    # Create models directory$\r$\n'
  FileWrite $0 '    models_dir = Path("models")$\r$\n'
  FileWrite $0 '    models_dir.mkdir(exist_ok=True)$\r$\n'
  FileWrite $0 '    $\r$\n'
  FileWrite $0 '    try:$\r$\n'
  FileWrite $0 '        # Download AudioCraft models$\r$\n'
  FileWrite $0 '        print("🎵 Downloading AudioCraft models...")$\r$\n'
  FileWrite $0 '        from audiocraft.models import MusicGen$\r$\n'
  FileWrite $0 '        MusicGen.get_model("small")  # This will download the model$\r$\n'
  FileWrite $0 '        print("✅ AudioCraft models downloaded")$\r$\n'
  FileWrite $0 '        $\r$\n'
  FileWrite $0 '        # Download AudioLDM models$\r$\n'
  FileWrite $0 '        print("🎼 Downloading AudioLDM models...")$\r$\n'
  FileWrite $0 '        from diffusers import AudioLDMPipeline$\r$\n'
  FileWrite $0 '        AudioLDMPipeline.from_pretrained("cvssp/audioldm-s-full-v2")$\r$\n'
  FileWrite $0 '        print("✅ AudioLDM models downloaded")$\r$\n'
  FileWrite $0 '        $\r$\n'
  FileWrite $0 '        # Download Stable Audio models$\r$\n'
  FileWrite $0 '        print("🎶 Downloading Stable Audio models...")$\r$\n'
  FileWrite $0 '        from diffusers import StableAudioDiffusionPipeline$\r$\n'
  FileWrite $0 '        StableAudioDiffusionPipeline.from_pretrained("stabilityai/stable-audio-open-1.0")$\r$\n'
  FileWrite $0 '        print("✅ Stable Audio models downloaded")$\r$\n'
  FileWrite $0 '        $\r$\n'
  FileWrite $0 '        print("🎉 All models downloaded successfully!")$\r$\n'
  FileWrite $0 '        $\r$\n'
  FileWrite $0 '    except Exception as e:$\r$\n'
  FileWrite $0 '        print(f"❌ Error downloading models: {e}")$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 'if __name__ == "__main__":$\r$\n'
  FileWrite $0 '    download_models()$\r$\n'
  FileClose $0
  
  DetailPrint "Setup completed successfully!"
!macroend

!macro customUnInstall
  ; Clean up Python virtual environment
  RMDir /r "$INSTDIR\venv"
  RMDir /r "$INSTDIR\models"
  RMDir /r "$INSTDIR\temp"
  RMDir /r "$INSTDIR\logs"
!macroend
