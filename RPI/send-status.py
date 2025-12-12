import psutil
import socket
import json
import requests
import time
import os

# Load config file
config_path = '/home/bob325/config.json'   

with open(config_path, 'r') as f:
    config = json.load(f)

# Load values from config
stationID = config.get('stationID')  # DEFAULT used if not found
base_directory = config.get('base_directory')
station_status_url = config.get('station_status_url')
get_ip_url = config.get('get_ip_url')

# Function to get the uptime in a human-readable format (in minutes, rounded)
def get_uptime():
    boot_time = psutil.boot_time()
    uptime_seconds = time.time() - boot_time
    uptime_minutes = round(uptime_seconds / 60)  # Convert seconds to minutes and round to the nearest minute
    return uptime_minutes

# Function to get disk space free in MB (rounded to the nearest whole number)
def get_free_disk_space():
    disk_usage = psutil.disk_usage('/')
    free_space_gb = disk_usage.free / (1024 ** 3)  # Convert from bytes to GB
    free_space_mb = round(free_space_gb * 1024)  # Convert GB to MB and round to the nearest whole number
    return free_space_mb

# Function to get the local IP address of the machine
def get_ip_address():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        s.connect(('10.254.254.254', 1))
        ip_address = s.getsockname()[0]
    except Exception:
        ip_address = '127.0.0.1'  # fallback to localhost
    finally:
        s.close()
    return ip_address

# Function to get the public IP address
def get_public_ip():
    try:
        response = requests.get("get_ip_url", timeout=20)
        data = response.json()
        return data.get("ip")
    except Exception as e:
        print(f"Error getting public IP: {e}")
        return None

# Function to upload data to a server
def upload_data(url, data):
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, data=json.dumps(data), headers=headers)
        if response.status_code == 201:
            print("Data uploaded successfully.")
        else:
            print(f"Failed to upload data. Status Code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error uploading data: {e}")

def get_file_count():
    try:
        # List all files in the directory and count them
        files = [f for f in os.listdir(base_directory) if os.path.isfile(os.path.join(base_directory, f))]
        return len(files)
    except Exception as e:
        print(f"Error counting files in directory {base_directory}: {e}")
        return 0  # Return 0 in case of error

def main():

    while True:
        # Gather system information
        uptime = get_uptime()  # Get uptime in minutes
        free_disk_space = get_free_disk_space()  # Get free space in MB
        file_count = get_file_count()
        local_ip = get_ip_address()
        public_ip = get_public_ip()

        # Prepare the data to send (convert all values to strings)
        data = {
            'station_location': str(stationID),  # Ensure location is a string
            'station_uptime': str(uptime),  # Convert uptime to string
            'station_free_space': str(free_disk_space),  # Convert free_disk_space to string (MB)
            'station_file_count': str(file_count), # How many files in record dir
            'station_local_ip': str(local_ip),  # Convert local_ip to string
            'station_public_ip': str(public_ip)  # Convert public_ip to string
        }

        # Print the data to the console
        print(f"Data being sent: {data}")
        
        # Upload the data
        upload_data(station_status_url, data)

        # Wait for 10 minutes (600 seconds) before running again
        time.sleep(600)


if __name__ == "__main__":
    main()
