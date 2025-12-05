from pydub import AudioSegment
from pydub.playback import play

# Load the 3 audio files
audio_file_1 = "audio1.wav"  # Path to the first audio file
audio_file_2 = "audio2.wav"  # Path to the second audio file
audio_file_3 = "audio3.wav"  # Path to the third audio file
audio_file_4 = "audio4.wav"  # Path to the fourth audio file

# Load audio files into AudioSegment objects
audio1 = AudioSegment.from_file(audio_file_1)
audio2 = AudioSegment.from_file(audio_file_2)
audio3 = AudioSegment.from_file(audio_file_3)
audio4 = AudioSegment.from_file(audio_file_4)

# Make sure the audio files are the same length and sample rate
if audio1.frame_rate != audio2.frame_rate or audio1.frame_rate != audio3.frame_rate or audio1.frame_rate != audio4.frame_rate:
    print("The audio files must have the same sample rate.")
    exit(1)

if len(audio1) != len(audio2) or len(audio1) != len(audio3) or len(audio1) != len(audio4):
    print("The audio files must be the same length.")
    exit(1)

# Set the tracks to be stacked on top of each other (same length)
combined_audio = AudioSegment.from_mono_audiosegments(audio1, audio2, audio3, audio4)

# Export the combined audio to a new file
combined_audio.export("combined_audio.wav", format="wav")

# Optionally, play the combined audio (if needed)
# play(combined_audio)

print("Audio files have been merged successfully into combined_audio.wav")
