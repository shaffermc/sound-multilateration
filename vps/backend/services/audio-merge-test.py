import os
from pydub import AudioSegment
import sys

# -------- CONFIG --------
AUDIO_FOLDER = "/home/mshaffer/www/sound-multilateration/vps/backend/services/audio_files"  
MERGED_FOLDER = "/home/mshaffer/www/sound-multilateration/vps/backend/services/merged_audio" 
# ------------------------

os.makedirs(MERGED_FOLDER, exist_ok=True)

def merge_audio_files(file_prefix):
    """
    Merge audio1..audio4 into a single file.
    """
    files = []
    for i in range(1, 5):
        filename = f"{file_prefix}_audio{i}.wav"
        filepath = os.path.join(AUDIO_FOLDER, filename)
        if not os.path.exists(filepath):
            print(f"Missing file: {filepath}")
            return False
        files.append(AudioSegment.from_file(filepath))

    # Trim all files to the length of the shortest one
    min_len = min(len(a) for a in files)
    files = [a[:min_len] for a in files]

    # Merge into a single stereo or multi-channel audio (combined)
    combined = AudioSegment.from_mono_audiosegments(*files)
    
    # Output file path
    output_file = os.path.join(MERGED_FOLDER, f"{file_prefix}_combined.wav")
    combined.export(output_file, format="wav")
    print(f"Merged audio saved to {output_file}")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python merge_audio.py <file_prefix>")
        sys.exit(1)

    file_prefix = sys.argv[1]  # Get the filename prefix from the command-line argument
    success = merge_audio_files(file_prefix)
    
    if not success:
        print("Failed to merge the files.")
