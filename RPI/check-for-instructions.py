import os
import json
import time
import glob
import requests
import paramiko

from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# =========================
# Load config
# =========================

config_path = '/home/bob325/config.json'

with open(config_path, 'r') as f:
    config = json.load(f)

stationID = str(config.get('stationID'))
base_directory = config.get('base_directory')
hostname = config.get('hostname')
port = config.get('port', 22)
username = config.get('username')
password = config.get('password')
instructions_url = config.get('instructions_url')
audio_upload_directory = config.get('audio_upload_directory')


# =========================
# Requests session (infinite retry)
# =========================

def create_requests_session():
    session = requests.Session()

    retry = Retry(
        total=None,                 # infinite retries
        connect=None,
        read=None,
        status=None,
        backoff_factor=5,            # exponential backoff
        status_forcelist=[500, 502, 503, 504],
        allowed_methods=["GET", "PUT"]
    )

    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    return session


session = create_requests_session()


# =========================
# SFTP Upload
# =========================

def upload_file_via_sftp(local_file_path, remote_file_path):
    """
    Upload file via SFTP with infinite retries and overwrite support.
    """
    attempt = 0

    while True:
        transport = None
        try:
            attempt += 1
            print(f"SFTP upload attempt {attempt}")

            transport = paramiko.Transport((hostname, port))
            transport.connect(username=username, password=password)

            sftp = paramiko.SFTPClient.from_transport(transport)

            # Explicit overwrite: remove remote file if it exists
            try:
                sftp.stat(remote_file_path)
                sftp.remove(remote_file_path)
                print(f"Existing remote file removed: {remote_file_path}")
            except FileNotFoundError:
                pass  # File does not exist → normal case

            sftp.put(local_file_path, remote_file_path)

            print(f"Uploaded {local_file_path} → {remote_file_path}")

            sftp.close()
            transport.close()
            return True

        except Exception as e:
            print(f"SFTP upload failed (attempt {attempt}): {e}")

            if transport:
                try:
                    transport.close()
                except Exception:
                    pass

            # Exponential backoff (max 5 minutes)
            sleep_time = min(5 * (2 ** (attempt - 1)), 300)
            print(f"Retrying SFTP in {sleep_time} seconds...")
            time.sleep(sleep_time)



# =========================
# Delete local files
# =========================

def delete_files_in_directory(directory):
    try:
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                print(f"Deleted {file_path}")
    except Exception as e:
        print(f"Error deleting files in {directory}: {e}")


# =========================
# Mark instruction complete
# =========================

def mark_station_complete(instruction_id):
    update_url = (
        f"{instructions_url.replace('/get_instructions', '/update_instructions')}"
        f"/{instruction_id}"
    )

    data = {f'station{stationID}_complete': True}

    try:
        response = session.put(update_url, json=data, timeout=10)
        response.raise_for_status()
        print(f"Marked station {stationID} complete for instruction {instruction_id}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to update instruction {instruction_id}, will retry later: {e}")


# =========================
# Process instructions
# =========================

def process_instructions():
    try:
        response = session.get(instructions_url, timeout=10)
        response.raise_for_status()
        instructions = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Server unavailable, retrying later: {e}")
        return

    for instr in instructions:
        instruction_id = instr.get('_id')
        instruction_type = instr.get('instruction_type')
        instruction_value = instr.get('instruction_value')
        instruction_target = instr.get('instruction_target')

        all_complete = instr.get('all_complete', False)
        station_complete = instr.get(f'station{stationID}_complete', False)

        print(f"Processing instruction {instruction_id}")

        if all_complete or station_complete:
            continue

        if instruction_target not in [stationID, 'ALL']:
            continue

        # =========================
        # SOUND REQUEST
        # =========================
        if instruction_type == 'sound_request':
            prefix = instruction_value.rsplit('-', 1)[0]
            pattern = os.path.join(base_directory, f"{prefix}-*.wav")
            matches = sorted(glob.glob(pattern))

            if not matches:
                print("No matching audio file found.")
                continue

            local_file = matches[0]
            real_filename = os.path.basename(local_file)
            name, ext = os.path.splitext(real_filename)

            remote_filename = f"{name}_audio{stationID}{ext}"
            remote_file = os.path.join(audio_upload_directory, remote_filename)

            print(f"Uploading {local_file} → {remote_file}")

            if upload_file_via_sftp(local_file, remote_file):
                mark_station_complete(instruction_id)

        # =========================
        # ERASE RECORDINGS
        # =========================
        elif instruction_type == 'erase_recordings':
            delete_files_in_directory(base_directory)
            mark_station_complete(instruction_id)

        # =========================
        # REBOOT
        # =========================
        elif instruction_type == 'reboot':
            mark_station_complete(instruction_id)
            print("Rebooting Raspberry Pi in 1 second...")
            time.sleep(1)
            os.system('sudo reboot')

        # =========================
        # SHUTDOWN
        # =========================
        elif instruction_type == 'shutdown':
            mark_station_complete(instruction_id)
            print("Shutting down Raspberry Pi in 1 second...")
            time.sleep(1)
            os.system('sudo shutdown -h now')
        else:
            print(f"Unknown instruction type: {instruction_type}")


# =========================
# Main loop (never exits)
# =========================

while True:
    try:
        process_instructions()
    except Exception as e:
        # Absolute safety net — script never dies
        print(f"Unexpected error: {e}")

    time.sleep(60)
