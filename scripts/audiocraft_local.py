#!/usr/bin/env python3
"""
AudioCraft/MusicGen Local GPU Implementation
Runs Meta's AudioCraft models locally on GPU
"""

import argparse
import os
import sys
import torch
import torchaudio
from pathlib import Path

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from audiocraft.models import MusicGen
    from audiocraft.data.audio import audio_write
    AUDIOCRAFT_AVAILABLE = True
except ImportError:
    AUDIOCRAFT_AVAILABLE = False
    print("AudioCraft not available. Install with: pip install audiocraft")

def load_model(model_size='small'):
    """Load the MusicGen model"""
    if not AUDIOCRAFT_AVAILABLE:
        raise ImportError("AudioCraft not available")
    
    model = MusicGen.get_model(model_size)
    if torch.cuda.is_available():
        model = model.cuda()
        print(f"✅ Using GPU: {torch.cuda.get_device_name()}")
    else:
        print("⚠️ Using CPU (GPU not available)")
    
    return model

def generate_audio(model, prompt, duration=10, guidance_scale=3.0, conditioning_audio=None):
    """Generate audio using MusicGen"""
    try:
        # Set generation parameters
        model.set_generation_params(duration=duration)
        
        # Prepare conditioning audio if provided
        if conditioning_audio and os.path.exists(conditioning_audio):
            print(f"Using conditioning audio: {conditioning_audio}")
            # Load conditioning audio
            conditioning_wav, sr = torchaudio.load(conditioning_audio)
            if sr != model.sample_rate:
                conditioning_wav = torchaudio.functional.resample(
                    conditioning_wav, sr, model.sample_rate
                )
            conditioning_wav = conditioning_wav.unsqueeze(0)  # Add batch dimension
            
            # Generate with conditioning
            wav = model.generate_with_chroma([prompt], conditioning_wav, progress=True)
        else:
            # Generate without conditioning
            wav = model.generate([prompt], progress=True)
        
        return wav[0].cpu()
    except Exception as e:
        print(f"Error during generation: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description='AudioCraft Local GPU Generation')
    parser.add_argument('--prompt', required=True, help='Text prompt for generation')
    parser.add_argument('--duration', type=int, default=10, help='Duration in seconds')
    parser.add_argument('--model_size', default='small', choices=['small', 'medium', 'large'], 
                       help='Model size')
    parser.add_argument('--guidance_scale', type=float, default=3.0, help='Guidance scale')
    parser.add_argument('--conditioning_audio', help='Path to conditioning audio file')
    parser.add_argument('--output', required=True, help='Output audio file path')
    
    args = parser.parse_args()
    
    try:
        print("🎵 Loading AudioCraft model...")
        model = load_model(args.model_size)
        
        print(f"🎼 Generating audio: '{args.prompt}'")
        print(f"⏱️ Duration: {args.duration}s")
        print(f"🎛️ Model: {args.model_size}")
        print(f"📊 Guidance: {args.guidance_scale}")
        
        # Generate audio
        wav = generate_audio(
            model, 
            args.prompt, 
            args.duration, 
            args.guidance_scale,
            args.conditioning_audio
        )
        
        # Save audio
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        audio_write(
            args.output, 
            wav, 
            model.sample_rate, 
            strategy="loudness", 
            loudness_compressor_attack=0.003,
            loudness_compressor_release=0.01
        )
        
        print(f"✅ Audio saved to: {args.output}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
