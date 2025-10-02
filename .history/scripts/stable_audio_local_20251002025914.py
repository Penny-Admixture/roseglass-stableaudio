#!/usr/bin/env python3
"""
Stable Audio Local GPU Implementation
Runs Stable Audio models locally on GPU using diffusers
"""

import argparse
import os
import sys
import torch
import torchaudio
import numpy as np
from pathlib import Path

try:
    from diffusers import StableAudioDiffusionPipeline
    STABLE_AUDIO_AVAILABLE = True
except ImportError:
    STABLE_AUDIO_AVAILABLE = False
    print("Stable Audio not available. Install with: pip install diffusers[audio]")

def load_model():
    """Load the Stable Audio model"""
    if not STABLE_AUDIO_AVAILABLE:
        raise ImportError("Stable Audio not available")
    
    model_id = "stabilityai/stable-audio-open-1.0"
    pipe = StableAudioDiffusionPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.float16,
        variant="fp16"
    )
    
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
        print(f"✅ Using GPU: {torch.cuda.get_device_name()}")
    else:
        print("⚠️ Using CPU (GPU not available)")
    
    return pipe

def generate_audio(pipe, prompt, duration=10, input_strength=0.5, prompt_strength=0.5, input_audio=None):
    """Generate audio using Stable Audio"""
    try:
        # Calculate number of inference steps based on duration
        num_inference_steps = min(50, int(duration * 2))
        
        # Generate audio
        if input_audio and os.path.exists(input_audio):
            print(f"Using input audio for conditioning: {input_audio}")
            # Load input audio
            input_wav, sr = torchaudio.load(input_audio)
            input_wav = input_wav.numpy()
            
            # Generate with audio conditioning
            audio = pipe(
                prompt,
                audio_length_in_s=duration,
                num_inference_steps=num_inference_steps,
                input_audio=input_wav,
                input_audio_sample_rate=sr,
                input_strength=input_strength,
                prompt_strength=prompt_strength
            ).audios[0]
        else:
            # Generate without input audio
            audio = pipe(
                prompt,
                audio_length_in_s=duration,
                num_inference_steps=num_inference_steps
            ).audios[0]
        
        return audio
    except Exception as e:
        print(f"Error during generation: {e}")
        raise

def save_audio(audio, output_path, sample_rate=44100):
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
    parser = argparse.ArgumentParser(description='Stable Audio Local GPU Generation')
    parser.add_argument('--prompt', required=True, help='Text prompt for generation')
    parser.add_argument('--duration', type=int, default=10, help='Duration in seconds')
    parser.add_argument('--input_strength', type=float, default=0.5, help='Input audio strength')
    parser.add_argument('--prompt_strength', type=float, default=0.5, help='Prompt strength')
    parser.add_argument('--input_audio', help='Path to input audio file')
    parser.add_argument('--output', required=True, help='Output audio file path')
    
    args = parser.parse_args()
    
    try:
        print("🎵 Loading Stable Audio model...")
        pipe = load_model()
        
        print(f"🎼 Generating audio: '{args.prompt}'")
        print(f"⏱️ Duration: {args.duration}s")
        print(f"🎛️ Input strength: {args.input_strength}")
        print(f"📝 Prompt strength: {args.prompt_strength}")
        
        # Generate audio
        audio = generate_audio(
            pipe,
            args.prompt,
            args.duration,
            args.input_strength,
            args.prompt_strength,
            args.input_audio
        )
        
        # Save audio
        save_audio(audio, args.output)
        
        print(f"✅ Audio saved to: {args.output}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
