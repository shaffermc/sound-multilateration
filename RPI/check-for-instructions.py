import os
import json
import requests
import time
import paramiko
import glob

# Load config file
config_path = '/home/bob325/config.json'   
with open(config_path, 'r') as f:
    config = json.load(f)

# Load values from config
stationID = str(config.get('stationID'))
base_directory = config.get('base_directory')
hostname = config.get('hostname')
port = config.get('port', 22)
username = config.get('username')
password = config.get('password')
instructions_url = config.get('instructions_url')
audio_upload_directory = config.get('audio_upload_directory')

def upload_file_via_sftp(local_file_path, remote_file_path):
    try:
        transport = paramiko.Transport((hostname, port))
        transport.connect(username=username, password=password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        sftp.put(local_file_path, remote_file_path)
        print(f"Uploaded {local_file_path} to {remote_file_path}")
        sftp.close()
    except Exception as e:
        print(f"SFTP upload failed: {e}")
    finally:
        transport.close()

def delete_files_in_directory(directory):
    try:
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                print(f"Deleted {file_path}")
    except Exception as e:
        print(f"Error deleting files in {directory}: {e}")


def mark_station_complete(instruction_id):
    """Update the server with this station's completion flag."""
    update_url = f"{instructions_url.replace('/get_instructions','/update_instructions')}/{instruction_id}"
    data = {f'station{stationID}_complete': True}
    try:
        response = requests.put(update_url, json=data)
        response.raise_for_status()
        print(f"Marked station {stationID} complete for instruction {instruction_id}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to update instruction {instruction_id}: {e}")


def process_instructions():
    try:
        response = requests.get(instructions_url)
        response.raise_for_status()
        instructions = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch instructions: {e}")
        return

    for instr in instructions:
        all_complete = instr.get('all_complete', False)
        station_complete_field = f'station{stationID}_complete'
        station_complete = instr.get(station_complete_field, False)

        instruction_type = instr.get('instruction_type')
        instruction_value = instr.get('instruction_value')
        instruction_target = instr.get('instruction_target')
        instruction_id = instr.get('_id')

        print(f"Processing instruction {instruction_id}: type={instruction_type}, target={instruction_target}")

        # Skip if already completed
        if all_complete or station_complete:
            print(f"Instruction {instruction_id} already complete for this station")
            continue

        if instruction_target not in [stationID, 'ALL']:
            print(f"Instruction {instruction_id} not for this station")
            continue

        # Execute instruction
        if instruction_type == 'sound_request':
            # instruction_value looks like "2025-12-12-15-55-00"
            prefix = instruction_value.rsplit('-', 1)[0]  # drops last "-SS"
            pattern = os.path.join(base_directory, f"{prefix}-*.wav")

            # Find matching files
            matches = sorted(glob.glob(pattern))

            if not matches:
                print("No matching audio file found (ignoring seconds).")
            else:
                # Pick the closest by timestamp or just take the first match
                local_file = matches[0]

                # Build remote filename based on original instruction value
                remote_file = f"{audio_upload_directory}{instruction_value}_audio{stationID}.wav"

                upload_file_via_sftp(local_file, remote_file)
                mark_station_complete(instruction_id)


        elif instruction_type == 'erase_recordings':
            delete_files_in_directory(base_directory)
            mark_station_complete(instruction_id)

        elif instruction_type == 'reboot':
            mark_station_complete(instruction_id)
            print("Rebooting Raspberry Pi in 1 second...")
            time.sleep(1)
            os.system('sudo reboot')

        else:
            print(f"Unknown instruction type: {instruction_type}")

# Main loop
while True:
    process_instructions()
    time.sleep(60)
