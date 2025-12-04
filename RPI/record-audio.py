import os
import time
import subprocess
from datetime import datetime, timedelta

dir = "/home/bob325/recordings/"

def rec(start_time):
    try:
        # Create a timestamp for the filename
        timestamp = start_time.strftime("%Y-%m-%d-%H-%M-%S")
        filename = os.path.join(dir, f"{timestamp}.wav")

        # Provide feedback about when the next recording is scheduled
        print(f"[INFO] Starting recording at {start_time.strftime('%H:%M:%S')}")

        # Record the audio using arecord for 295 seconds (just under 5 minutes)
        arecord_command = f'arecord -D plughw:1,0 -r 48000 -c 1 -f U8 -t wav -d 295 {filename}'
        subprocess.run(arecord_command, shell=True, check=True)

        # Provide feedback after recording completes
        print(f"[INFO] Recording completed and saved as: {filename}")
        
    except Exception as e:
        print(f"[ERROR] Error during recording: {e}")

def get_next_available_time():
    """Get the next available 5-minute interval from the current time."""
    current_time = datetime.now()
    # Round up the current time to the next 5-minute mark
    minutes = current_time.minute
    remainder = minutes % 5
    
    if remainder == 0:
        # If the current minute is already a multiple of 5, use the current time
        next_time = current_time
    else:
        # Round up to the next 5-minute mark
        next_time = current_time + timedelta(minutes=(5 - remainder), seconds=-current_time.second)

    return next_time

def wait_until_next_interval(start_time):
    """Wait until the next interval (HH:MM:00) provided."""
    current_time = datetime.now()
    
    # Calculate how much time to wait until the next interval
    wait_time = (start_time - current_time).total_seconds()
    if wait_time > 0:
        print(f"[INFO] Waiting for {wait_time} seconds until {start_time.strftime('%H:%M:%S')}")
        time.sleep(wait_time)

def main():
    # Infinite loop to keep the program running and recording
    while True:
        # Get the next available 5-minute interval from the current time
        next_time = get_next_available_time()
        
        # Wait until that exact time
        wait_until_next_interval(next_time)

        # Start recording at that time
        rec(next_time)

# Run the main function
main()
