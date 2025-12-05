import requests
import time
from pydub import AudioSegment
from pydub.playback import play
import os

# Function to fetch instructions from the database
def fetch_instructions():
    url = 'http://209.46.124.94:3000/instructions/get_instructions'
    try:
        response = requests.get(url)
        response.raise_for_status()  # Will raise an exception for HTTP error codes (4xx/5xx)
        instructions = response.json()  # Parse the JSON response
        return instructions
    except requests.exceptions.RequestException as e:
        print(f"Error fetching instructions: {e}")
        return []

# Function to load and combine audio files
def combine_audio(instruction_value):
    # Paths to the audio files (based on the instruction_value)
    audio_file_1 = f"{instruction_value}_audio1.wav"
    audio_file_2 = f"{instruction_value}_audio2.wav"
    audio_file_3 = f"{instruction_value}_audio3.wav"
    audio_file_4 = f"{instruction_value}_audio4.wav"

    # Check if all audio files exist
    if not os.path.exists(audio_file_1) or not os.path.exists(audio_file_2) or not os.path.exists(audio_file_3):
        print("One or more audio files are missing.")
        return None

    # Load the audio files
    audio1 = AudioSegment.from_file(audio_file_1)
    audio2 = AudioSegment.from_file(audio_file_2)
    audio3 = AudioSegment.from_file(audio_file_3)
    audio4 = AudioSegment.from_file(audio_file_4)

    # Make sure the audio files are the same length and sample rate
    if audio1.frame_rate != audio2.frame_rate or audio1.frame_rate != audio3.frame_rate or audio1.frame_rate != audio4.frame_rate:
        print("The audio files must have the same sample rate.")
        return None

    if len(audio1) != len(audio2) or len(audio1) != len(audio3) or len(audio1) != len(audio4):
        print("The audio files must be the same length.")
        return None

    # Stack the tracks on top of each other (same length)
    combined_audio = AudioSegment.from_mono_audiosegments(audio1, audio2, audio3, audio4)

    # Export the combined audio to a new file
    output_file = f"combined_{instruction_value}.wav"
    combined_audio.export(output_file, format="wav")
    print(f"Audio files have been merged successfully into {output_file}")

    # Optionally, play the combined audio
    # play(combined_audio)
    
    return output_file

# Function to update the all_complete field for a specific instruction
def update_all_complete(instruction_id):
    url = f'http://209.46.124.94:3000/instructions/update_instructions/{instruction_id}'
    data = {'all_complete': True}
    
    try:
        response = requests.put(url, json=data)
        response.raise_for_status()  # Will raise an exception for HTTP error codes (4xx/5xx)
        print(f"Instruction {instruction_id} updated to all_complete = True.")
    except requests.exceptions.RequestException as e:
        print(f"Error updating instruction {instruction_id}: {e}")

# Function to process instructions
def process_instructions():
    instructions = fetch_instructions()
    
    # Get the current time in timestamp format (in milliseconds)
    current_time = int(time.time() * 1000)

    for instruction in instructions:
        # Get the relevant fields from the instruction
        station1_complete = instruction['station1_complete']
        station2_complete = instruction['station2_complete']
        station3_complete = instruction['station3_complete']
        station4_complete = instruction['station4_complete']
        instruction_value = instruction['instruction_value']
        timestamp = instruction['timestamp']
        all_complete = instruction['all_complete']
        instruction_id = instruction['_id']

        # Skip if all_complete is already True
        if all_complete:
            print(f"Instruction {instruction_id} is already completed. Skipping.")
            continue

        # Check if the conditions for station completion are met and the instruction is recent
        if station1_complete and station2_complete and station3_complete and station4_complete:
            # Check if the instruction was created within the last couple of minutes (e.g., 2 minutes)
            time_diff = current_time - timestamp
            if time_diff <= 1200000:  # 2 minutes = 120000 milliseconds
                print(f"Found valid instruction with instruction_value {instruction_value}")

                # Combine the audio files for this instruction
                output_file = combine_audio(instruction_value)

                # Update the all_complete field to True
                update_all_complete(instruction_id)

# Main loop to check every minute
while True:
    process_instructions()
    print("Waiting for the next minute...")
    time.sleep(60)  # Wait for 60 seconds (1 minute) before running the process again
