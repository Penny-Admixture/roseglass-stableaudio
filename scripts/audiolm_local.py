#!/usr/bin/env python3
"""
AudioLDM Local GPU Implementation
Runs AudioLDM models locally on GPU using diffusers
"""

import argparse
import os
import sys
import torch
import torchaudio
import numpy as np
from pathlib import Path

try:
    from diffusers import AudioLDMPipeline
    from diffusers.utils import export_to_video
    AUDIOLM_AVAILABLE = True
except ImportError:
    AUDIOLM_AVAILABLE = False
    print("AudioLDM not available. Install with: pip install diffusers[audio]")

def load_model():
    """Load the AudioLDM model"""
    if not AUDIOLM_AVAILABLE:
        raise ImportError("AudioLDM not available")
    
    model_id = "cvssp/audioldm-s-full-v2"
    pipe = AudioLDMPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
    
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
        print(f"✅ Using GPU: {torch.cuda.get_device_name()}")
    else:
        print("⚠️ Using CPU (GPU not available)")
    
    return pipe

def generate_audio(pipe, prompt, duration=10, guidance_scale=2.5, num_steps=50, source_audio=None):
    """Generate audio using AudioLDM"""
    try:
        # Calculate number of inference steps based on duration
        num_inference_steps = min(num_steps, 100)
        
        # Generate audio
        if source_audio and os.path.exists(source_audio):
            print(f"Using source audio for style transfer: {source_audio}")
            # Load source audio
            source_wav, sr = torchaudio.load(source_audio)
            source_wav = source_wav.numpy()
            
            # Generate with style transfer
            audio = pipe(
                prompt,
                audio_length_in_s=duration,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                source_audio=source_wav,
                source_audio_sample_rate=sr
            ).audios[0]
        else:
            # Generate without source audio
            audio = pipe(
                prompt,
                audio_length_in_s=duration,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale
            ).audios[0]
        
        return audio
    except Exception as e:
        print(f"Error during generation: {e}")
        raise

def save_audio(audio, output_path, sample_rate=16000):
    """Save audio to file"""
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Convert to numpy array if needed
        if torch.is_tensor(audio):
            audio = audio.cpu().numpy()
        
        # Ensure audio is in the right format
        if audio.ndim == 1:
            audio = audio.reshape(1, -1)
        
        # Save as WAV
        torchaudio.save(output_path, torch.from_numpy(audio), sample_rate)
        
    except Exception as e:
        print(f"Error saving audio: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description='AudioLDM Local GPU Generation')
    parser.add_argument('--prompt', required=True, help='Text prompt for generation')
    parser.add_argument('--duration', type=int, default=10, help='Duration in seconds')
    parser.add_argument('--guidance_scale', type=float, default=2.5, help='Guidance scale')
    parser.add_argument('--num_steps', type=int, default=50, help='Number of inference steps')
    parser.add_argument('--source_audio', help='Path to source audio for style transfer')
    parser.add_argument('--output', required=True, help='Output audio file path')
    
    args = parser.parse_args()
    
    try:
        print("🎵 Loading AudioLDM model...")
        pipe = load_model()
        
        print(f"🎼 Generating audio: '{args.prompt}'")
        print(f"⏱️ Duration: {args.duration}s")
        print(f"📊 Guidance: {args.guidance_scale}")
        print(f"🔄 Steps: {args.num_steps}")
        
        # Generate audio
        audio = generate_audio(
            pipe,
            args.prompt,
            args.duration,
            args.guidance_scale,
            args.num_steps,
            args.source_audio
        )
        
        # Save audio
        save_audio(audio, args.output)
        
        print(f"✅ Audio saved to: {args.output}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
