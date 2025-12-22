#!/usr/bin/env python3
"""
Generate jazz music for cafe environment - Fixed version
Creates audible jazz music with ambient cafe sounds
"""

import numpy as np
from scipy.io import wavfile
import os

# Configuration
SAMPLE_RATE = 44100  # CD quality
DURATION = 90  # 90 seconds
BPM = 100  # Tempo

def generate_jazz_chords(duration, sample_rate):
    """Generate jazz chord progression"""
    samples = int(duration * sample_rate)
    t = np.arange(samples) / sample_rate
    
    beat_duration = 60 / BPM
    chord_duration = beat_duration * 4  # 4 beats per chord
    
    # Jazz chord frequencies
    chords = [
        [293.66, 349.23, 440.00, 523.25],  # Dm7
        [392.00, 493.88, 587.33, 698.46],  # G7
        [261.63, 329.63, 392.00, 493.88],  # Cmaj7
        [220.00, 277.18, 329.63, 392.00],  # A7
    ]
    
    audio = np.zeros(samples)
    
    for i in range(samples):
        time = t[i]
        chord_idx = int(time / chord_duration) % len(chords)
        chord = chords[chord_idx]
        
        # Simple additive synthesis for chord
        for freq in chord:
            audio[i] += 0.08 * np.sin(2 * np.pi * freq * time)
        
        # Add soft envelope
        phase = (time % chord_duration) / chord_duration
        envelope = 0.8 + 0.2 * np.cos(2 * np.pi * phase)
        audio[i] *= envelope
    
    return audio

def generate_bass(duration, sample_rate):
    """Generate walking bass line"""
    samples = int(duration * sample_rate)
    t = np.arange(samples) / sample_rate
    
    beat_duration = 60 / BPM
    
    # Bass notes (root notes for each chord)
    bass_notes = [146.83, 196.00, 130.81, 110.00]  # D, G, C, A
    
    audio = np.zeros(samples)
    
    for i in range(samples):
        time = t[i]
        beat = int(time / beat_duration) % 16  # 16 beats = 4 chords
        chord_idx = beat // 4
        note_in_chord = beat % 4
        
        freq = bass_notes[chord_idx]
        # Simple walking pattern
        multipliers = [1.0, 1.25, 1.5, 1.25]  # root, 3rd, 5th, 3rd
        freq *= multipliers[note_in_chord]
        
        # Note envelope (quick decay)
        note_phase = (time % beat_duration) / beat_duration
        envelope = np.exp(-note_phase * 5)
        
        audio[i] = 0.2 * np.sin(2 * np.pi * freq * time) * envelope
    
    return audio

def generate_melody(duration, sample_rate):
    """Generate jazz melody"""
    samples = int(duration * sample_rate)
    t = np.arange(samples) / sample_rate
    
    note_duration = 60 / BPM / 2  # Eighth notes
    
    # C jazz scale
    scale = [261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25]
    
    audio = np.zeros(samples)
    np.random.seed(12345)
    
    for i in range(samples):
        time = t[i]
        note_idx = int(time / note_duration)
        
        # Pick a note from scale (with some musical logic)
        freq = scale[note_idx % len(scale)]
        
        # Swing rhythm
        note_phase = (time % note_duration) / note_duration
        
        # Only play 60% of the time (rests)
        if np.random.random() > 0.3:
            envelope = np.exp(-note_phase * 6) * (1 - note_phase * 0.5)
            audio[i] = 0.1 * np.sin(2 * np.pi * freq * time) * envelope
    
    return audio

def generate_drums(duration, sample_rate):
    """Generate subtle swing drums"""
    samples = int(duration * sample_rate)
    t = np.arange(samples) / sample_rate
    
    beat_duration = 60 / BPM
    
    audio = np.zeros(samples)
    np.random.seed(54321)
    
    for i in range(samples):
        time = t[i]
        beat_phase = (time % beat_duration) / beat_duration
        
        # Hi-hat on downbeat
        if beat_phase < 0.08:
            audio[i] += 0.08 * np.random.randn() * np.exp(-beat_phase * 40)
        
        # Soft brush on 2 and 4
        beat_num = int(time / beat_duration) % 4
        if beat_num in [1, 3] and beat_phase < 0.1:
            audio[i] += 0.05 * np.random.randn() * np.exp(-beat_phase * 30)
    
    return audio

def generate_ambience(duration, sample_rate):
    """Generate silent track (no background noise)"""
    samples = int(duration * sample_rate)
    # Return silence - no background noise, just pure jazz music
    return np.zeros(samples)

def main():
    print("Generating jazz cafe music (fixed version)...")
    
    print("Creating chords...")
    chords = generate_jazz_chords(DURATION, SAMPLE_RATE)
    print(f"  Chords max amplitude: {np.max(np.abs(chords)):.4f}")
    
    print("Creating bass...")
    bass = generate_bass(DURATION, SAMPLE_RATE)
    print(f"  Bass max amplitude: {np.max(np.abs(bass)):.4f}")
    
    print("Creating melody...")
    melody = generate_melody(DURATION, SAMPLE_RATE)
    print(f"  Melody max amplitude: {np.max(np.abs(melody)):.4f}")
    
    print("Creating drums...")
    drums = generate_drums(DURATION, SAMPLE_RATE)
    print(f"  Drums max amplitude: {np.max(np.abs(drums)):.4f}")
    
    print("Creating ambience...")
    ambience = generate_ambience(DURATION, SAMPLE_RATE)
    print(f"  Ambience max amplitude: {np.max(np.abs(ambience)):.4f}")
    
    # Mix all
    print("Mixing...")
    mix = chords + bass + melody + drums + ambience
    
    max_amp = np.max(np.abs(mix))
    print(f"  Mix max amplitude before normalize: {max_amp:.4f}")
    
    # Normalize to 80% to prevent clipping
    if max_amp > 0:
        mix = mix / max_amp * 0.8
    
    # Fade in/out
    fade_samples = int(0.5 * SAMPLE_RATE)
    mix[:fade_samples] *= np.linspace(0, 1, fade_samples)
    mix[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    
    # Convert to 16-bit
    audio_int16 = np.clip(mix * 32767, -32768, 32767).astype(np.int16)
    
    print(f"  Final int16 max: {np.max(np.abs(audio_int16))}")
    
    # Save
    output_path = "assets/sounds/cafe.wav"
    wavfile.write(output_path, SAMPLE_RATE, audio_int16)
    
    file_size = os.path.getsize(output_path)
    print(f"[OK] Saved: {output_path}")
    print(f"     Size: {file_size / 1024 / 1024:.2f} MB")
    print(f"     Duration: {DURATION}s")
    print("Jazz cafe music generated successfully!")

if __name__ == "__main__":
    main()
