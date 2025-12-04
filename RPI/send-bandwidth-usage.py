import os
import json
import psutil
import requests
import time
from datetime import datetime

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
bandwidth_api_url = config.get('bandwidth_api_url')

# Function to get the current network usage in bytes (for both upload and download)
def get_bandwidth_usage():
    # Get network stats using psutil
    net_io = psutil.net_io_counters()
    return net_io.bytes_sent, net_io.bytes_recv

# Function to calculate daily bandwidth usage and update it to the server
def update_bandwidth_usage():
    # Track bandwidth usage for 10 minutes
    last_sent, last_received = get_bandwidth_usage()
    print(f"Initial usage - Sent: {last_sent} bytes, Received: {last_received} bytes")

    while True:
        time.sleep(600)  # Wait for 10 minutes (600 seconds)

        # Get the new bandwidth usage stats
        sent, received = get_bandwidth_usage()

        # Calculate the difference (new usage) since the last check
        upload_usage = (sent - last_sent) / (1024 * 1024)  # Convert to MB
        download_usage = (received - last_received) / (1024 * 1024)  # Convert to MB

        # Update the last_sent and last_received for the next check
        last_sent, last_received = sent, received

        # Prepare the payload for the API
        data = {
            'station_id': stationID,
            'daily_upload': upload_usage,  # Upload usage in MB
            'daily_download': download_usage,  # Download usage in MB
            'total_daily_bandwidth': upload_usage + download_usage,  # Total daily bandwidth (upload + download)
            'date': datetime.now().strftime('%Y-%m-%d')  # Get today's date in 'YYYY-MM-DD' format
        }

        # Add debug print to display the data being sent
        print(f"Sending data to server: {data}")

        try:
            # Send the data to the server to update the database
            response = requests.post(bandwidth_api_url, json=data)

            # Debugging: Show response details
            print(f"Response Status Code: {response.status_code}")
            print(f"Response Body: {response.text}")

            if response.status_code == 200:
                print(f"Bandwidth updated successfully. Sent: {upload_usage:.2f} MB, Received: {download_usage:.2f} MB")
            else:
                print(f"Failed to update bandwidth: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Error occurred while updating bandwidth: {e}")

# Start the bandwidth tracking
if __name__ == '__main__':
    print("Starting bandwidth tracking on Raspberry Pi...")
    update_bandwidth_usage()
