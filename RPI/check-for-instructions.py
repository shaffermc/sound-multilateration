import os
import json
import requests
import time
import paramiko
import logging  

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

# Set up logging
logging.basicConfig(filename='/home/bob325/process_instructions.log', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')


def upload_file_via_sftp(local_file_path, remote_file_path):
    try:
        transport = paramiko.Transport((hostname, port))
        transport.connect(username=username, password=password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        sftp.put(local_file_path, remote_file_path)
        logging.info(f"Uploaded {local_file_path} to {remote_file_path}")
        sftp.close()
    except Exception as e:
        logging.error(f"SFTP upload failed: {e}")
    finally:
        transport.close()


def delete_files_in_directory(directory):
    try:
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                logging.info(f"Deleted {file_path}")
    except Exception as e:
        logging.error(f"Error deleting files in {directory}: {e}")


def mark_station_complete(instruction_id):
    """Update the server with this station's completion flag."""
    update_url = f"{instructions_url.replace('/get_instructions','/update_instructions')}/{instruction_id}"
    data = {f'station{stationID}_complete': True}
    try:
        response = requests.put(update_url, json=data)
        response.raise_for_status()
        logging.info(f"Marked station {stationID} complete for instruction {instruction_id}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to update instruction {instruction_id}: {e}")


def process_instructions():
    try:
        response = requests.get(instructions_url)
        response.raise_for_status()
        instructions = response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch instructions: {e}")
        return

    for instr in instructions:
        all_complete = instr.get('all_complete', False)
        station_complete_field = f'station{stationID}_complete'
        station_complete = instr.get(station_complete_field, False)

        instruction_type = instr.get('instruction_type')
        instruction_value = instr.get('instruction_value')
        instruction_target = instr.get('instruction_target')
        instruction_id = instr.get('_id')

        logging.info(f"Processing instruction {instruction_id}: type={instruction_type}, target={instruction_target}")

        # Skip if already completed
        if all_complete or station_complete:
            logging.info(f"Instruction {instruction_id} already complete for this station")
            continue

        if instruction_target not in [stationID, 'ALL']:
            logging.info(f"Instruction {instruction_id} not for this station")
            continue

        # Execute instruction
        if instruction_type == 'sound_request':
            local_file = os.path.join(base_directory, f"{instruction_value}.wav")
            remote_file = f"{audio_upload_directory}{instruction_value}_audio{stationID}.wav"
            upload_file_via_sftp(local_file, remote_file)
            mark_station_complete(instruction_id)

        elif instruction_type == 'erase_recordings':
            delete_files_in_directory(base_directory)
            mark_station_complete(instruction_id)

        elif instruction_type == 'reboot':
            mark_station_complete(instruction_id)
            logging.info("Rebooting Raspberry Pi in 1 second...")
            time.sleep(1)
            os.system('sudo reboot')

        else:
            logging.warning(f"Unknown instruction type: {instruction_type}")


# Main loop
while True:
    process_instructions()
    logging.info("Sleeping 5 minutes...")
    time.sleep(300)
