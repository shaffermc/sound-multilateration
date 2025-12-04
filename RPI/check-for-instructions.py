import os
import json
import requests
import time
import paramiko
import logging  

# Load config file
config_path = '/home/station/config.json'   

with open(config_path, 'r') as f:
    config = json.load(f)

# Load values from config
stationID = config.get('stationID', 'DEFAULT')  # DEFAULT used if not found
base_directory = config.get('base_directory', '/home/station/recordings/')
hostname = config.get('hostname')
port = config.get('port', 22)
username = config.get('username')
password = config.get('password')

# Set up logging
logging.basicConfig(filename='/home/station/process_instructions.log', level=logging.INFO, format='%(asctime)s - %(message)s')


def upload_file_via_sftp(local_file_path, remote_file_path):
    try:
        # Create a transport object
        transport = paramiko.Transport((hostname, port))

        # Connect to the server using the credentials
        transport.connect(username=username, password=password)

        # Create an SFTP client object
        sftp = paramiko.SFTPClient.from_transport(transport)

        # Upload the file
        sftp.put(local_file_path, remote_file_path)
        logging.info(f"File {local_file_path} successfully uploaded to {remote_file_path}.")

        # Close the SFTP session
        sftp.close()

    except Exception as e:
        logging.error(f"Error uploading file: {e}")

    finally:
        # Close the transport session
        transport.close()


# Function to delete all files in a directory
def delete_files_in_directory(directory):
    try:
        # List all files in the directory
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)  # Delete the file
                    logging.info(f"Deleted file: {file_path}")
                else:
                    logging.info(f"Skipped non-file: {file_path}")
            except Exception as e:
                logging.error(f"Error deleting file {file_path}: {e}")
    except Exception as e:
        logging.error(f"Error accessing directory {directory}: {e}")


# Function to fetch instructions and process them
def process_instructions():
    # Fetch instructions from the API
    url = 'http://209.46.124.94:3000/instructions/get_instructions'
    try:
        response = requests.get(url)
        response.raise_for_status()  # Will raise an exception for HTTP error codes (4xx/5xx)
        instructions = response.json()  # Parse the JSON response
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching instructions: {e}")
        instructions = []

    # Process each instruction
    for instruction in instructions:
        all_complete = instruction['all_complete']
        station2_complete = instruction['station2_complete']
        instruction_type = instruction['instruction_type']
        instruction_value = instruction['instruction_value']  # Date/Time stamp (filename)
        instruction_target = instruction['instruction_target']
        
        # Debugging: log instruction details
        logging.info("-------------")
        logging.info(f"Instruction Target: {instruction_target}")
        logging.info(f"Station ID: {stationID}")
        logging.info(f"All Complete: {all_complete} (Type: {type(all_complete)})")
        logging.info(f"Station2 Complete: {station2_complete} (Type: {type(station2_complete)})")
        logging.info(f"Instruction Type: {instruction_type}")
        logging.info(f"Instruction Value: {instruction_value}")
        logging.info("===============")

        # Check if this instruction is for the current station or for 'ALL'
        if instruction_target == stationID or instruction_target == 'ALL':
            if all_complete or station2_complete:
                logging.info(f"Skipping completed instruction: {instruction_type}")
                continue  # Skip this instruction as it is marked as complete

            # Process the instruction based on its type
            logging.info(f"Processing instruction: {instruction_type}")

            if instruction_type == 'sound_request':
                logging.info("Executing sound request")

                # Build the local file path based on instruction_value
                local_file_path = os.path.join(base_directory, f"{instruction_value}.wav")
                # Build the remote file path
                remote_file_path = f"/home/mshaffer/{instruction_value}_audio2.wav"

                # Upload the file via SFTP
                upload_file_via_sftp(local_file_path, remote_file_path)

                instruction_id = instruction['_id']
                update_url = f'http://209.46.124.94:3000/instructions/update_instructions/{instruction_id}'
                data = {'station2_complete': True}
                try:
                    update_response = requests.put(update_url, json=data)
                    update_response.raise_for_status()
                    logging.info(f"Updated station2_complete to True for instruction: {instruction_id}")
                except requests.exceptions.RequestException as e:
                    logging.error(f"Error updating instruction {instruction_id}: {e}")

            elif instruction_type == 'erase_recordings':
                logging.info(f"Deleting all files in directory: {base_directory}")
                delete_files_in_directory(base_directory)
                # Update the server to mark station2_complete as True
                instruction_id = instruction['_id']
                update_url = f'http://209.46.124.94:3000/instructions/update_instructions/{instruction_id}'
                data = {'station2_complete': True}
                try:
                    update_response = requests.put(update_url, json=data)
                    update_response.raise_for_status()
                    logging.info(f"Updated station2_complete to True for instruction: {instruction_id}")
                except requests.exceptions.RequestException as e:
                    logging.error(f"Error updating instruction {instruction_id}: {e}")

            elif instruction_type == 'reboot':
                logging.info("Rebooting the Raspberry Pi...")
                # Update the server to mark station2_complete as True
                instruction_id = instruction['_id']
                update_url = f'http://209.46.124.94:3000/instructions/update_instructions/{instruction_id}'
                data = {'station2_complete': True}
                try:
                    update_response = requests.put(update_url, json=data)
                    update_response.raise_for_status()
                    logging.info(f"Updated station2_complete to True for instruction: {instruction_id}")
                except requests.exceptions.RequestException as e:
                    logging.error(f"Error updating instruction {instruction_id}: {e}")

                # Short delay before rebooting
                time.sleep(1)
                os.system('sudo reboot')  # Reboot the Raspberry Pi

            else:
                logging.warning(f"Unknown instruction type: {instruction_type}")

        else:
            logging.info(f"Skipping instruction with target {instruction_target}, as it doesn't match {stationID} or 'ALL'")

# Main loop to re-run everything every minute
while True:
    process_instructions()  # Process the instructions
    logging.info("Waiting for the next minute...")
    time.sleep(300)  # Wait for 5 minutes before running the process again
