#!/usr/bin/env python3
"""
Mix two audio files together using Web Audio API approach:
Create an HTML file that uses JavaScript to mix the audio tracks in the browser.
"""

import shutil
import os

def main():
    print("Setting up audio mixing...")
    
    # Source files
    jazz_file = r"C:\Users\Syliva\Downloads\輕鬆浪漫爵士音樂.mp3"
    asmr_file = r"C:\Users\Syliva\Downloads\咖啡廳環境音ASMR (專注音樂).mp3"
    
    # Target directory
    target_dir = r"d:\sabrina\Antigravity\focus-creature-main\assets\sounds"
    
    # Copy jazz as cafe.mp3
    print(f"Copying jazz music as cafe.mp3...")
    shutil.copy(jazz_file, os.path.join(target_dir, "cafe.mp3"))
    print("[OK] cafe.mp3 created")
    
    # Copy ASMR as cafe-ambience.mp3
    print(f"Copying ASMR as cafe-ambience.mp3...")
    shutil.copy(asmr_file, os.path.join(target_dir, "cafe-ambience.mp3"))
    print("[OK] cafe-ambience.mp3 created")
    
    print("\nBoth audio files are now in assets/sounds/")
    print("The HTML will be updated to play both tracks simultaneously.")

if __name__ == "__main__":
    main()
