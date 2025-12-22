#!/usr/bin/env python3
"""
Generate simple audio files for Focus Creature sound test
Creates white noise for library and ambient cafe sounds
"""

import numpy as np
from scipy.io import wavfile
import os

# Configuration
SAMPLE_RATE = 44100  # CD quality
DURATION = 90  # 90 seconds, long enough to loop smoothly

def generate_white_noise(duration, sample_rate, amplitude=0.3):
    """Generate white noise audio"""
    samples = int(duration * sample_rate)
    # Generate random values between -1 and 1
    noise = np.random.uniform(-amplitude, amplitude, samples)
    # Convert to 16-bit PCM
    audio = (noise * 32767).astype(np.int16)
    return audio

def generate_pink_noise(duration, sample_rate, amplitude=0.25):
    """Generate pink noise (more pleasant than white noise)"""
    samples = int(duration * sample_rate)
    # Generate white noise
    white = np.random.randn(samples)
    
    # Apply simple pink noise filter (1/f characteristic)
    # This is a simplified version
    pink = np.cumsum(white)
    pink = pink - np.mean(pink)
    pink = pink / np.max(np.abs(pink))
    pink = pink * amplitude
    
    # Convert to 16-bit PCM
    audio = (pink * 32767).astype(np.int16)
    return audio

def generate_cafe_ambience(duration, sample_rate):
    """Generate cafe ambience with multiple sound layers"""
    samples = int(duration * sample_rate)
    t = np.linspace(0, duration, samples)
    
    # Layer 1: Low frequency rumble (general ambience)
    rumble = 0.08 * np.sin(2 * np.pi * 40 * t + np.random.randn(samples) * 0.5)
    
    # Layer 2: Mid frequency chatter simulation (pink noise with modulation)
    chatter_base = np.random.randn(samples) * 0.12
    # Modulate to simulate people talking (varying amplitude)
    modulation = np.abs(np.sin(2 * np.pi * 0.3 * t)) * 0.5 + 0.5
    chatter = chatter_base * modulation
    
    # Layer 3: Occasional high frequency sounds (cups, dishes)
    # Random impulses
    impulses = np.zeros(samples)
    num_impulses = int(duration * 2)  # ~2 per second
    impulse_positions = np.random.randint(0, samples, num_impulses)
    for pos in impulse_positions:
        if pos < samples - 1000:
            # Short decay envelope
            decay = np.exp(-np.linspace(0, 8, 1000))
            impulses[pos:pos+1000] += np.random.randn(1000) * 0.15 * decay
    
    # Layer 4: Subtle background music (very soft sine waves)
    music = 0.05 * (np.sin(2 * np.pi * 220 * t) + 
                    np.sin(2 * np.pi * 330 * t) +
                    np.sin(2 * np.pi * 440 * t))
    
    # Combine all layers
    cafe_sound = rumble + chatter + impulses + music
    
    # Normalize to prevent clipping
    cafe_sound = cafe_sound / np.max(np.abs(cafe_sound)) * 0.6
    
    # Convert to 16-bit PCM
    audio = (cafe_sound * 32767).astype(np.int16)
    return audio

def fade_audio(audio, fade_duration_ms=500):
    """Apply fade in/out to make looping seamless"""
    sample_rate = 44100
    fade_samples = int(fade_duration_ms * sample_rate / 1000)
    
    # Fade in
    fade_in = np.linspace(0, 1, fade_samples)
    audio[:fade_samples] = (audio[:fade_samples] * fade_in).astype(np.int16)
    
    # Fade out
    fade_out = np.linspace(1, 0, fade_samples)
    audio[-fade_samples:] = (audio[-fade_samples:] * fade_out).astype(np.int16)
    
    return audio

def main():
    output_dir = "assets/sounds"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Generating audio files for Focus Creature...")
    
    # Generate library white noise (pink noise is more pleasant)
    print("Creating library.wav (pink noise)...")
    library_audio = generate_pink_noise(DURATION, SAMPLE_RATE)
    library_audio = fade_audio(library_audio)
    
    # Save as WAV then convert to MP3 (or just use WAV if no conversion tool)
    library_path = os.path.join(output_dir, "library.wav")
    wavfile.write(library_path, SAMPLE_RATE, library_audio)
    print(f"[OK] Generated: {library_path}")
    
    # Generate cafe ambience
    print("Creating cafe.wav (ambient cafe sounds)...")
    cafe_audio = generate_cafe_ambience(DURATION, SAMPLE_RATE)
    cafe_audio = fade_audio(cafe_audio)
    
    cafe_path = os.path.join(output_dir, "cafe.wav")
    wavfile.write(cafe_path, SAMPLE_RATE, cafe_audio)
    print(f"[OK] Generated: {cafe_path}")
    
    print("\nAudio files generated successfully!")
    print("Note: Files are in WAV format. Update HTML to use .wav or convert to .mp3")

if __name__ == "__main__":
    main()
