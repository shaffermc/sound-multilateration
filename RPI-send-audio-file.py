import paramiko

# Set the server, username, and password for the VPS
hostname = '209.46.124.94'
port = 22  # Default SFTP port
username = 'ftp'
password = 'x'

# Path to the .wav file on your Raspberry Pi
local_file_path = '/home/bob325/recordings/2025-01-10-02-05-00.wav'

# Path where you want to upload the file on the server
remote_file_path = '/home/mshaffer/2025-01-10-02-05-00.wav'

def upload_file_via_sftp():
    try:
        # Create a transport object
        transport = paramiko.Transport((hostname, port))

        # Connect to the server using the credentials
        transport.connect(username=username, password=password)

        # Create an SFTP client object
        sftp = paramiko.SFTPClient.from_transport(transport)

        # Upload the file
        sftp.put(local_file_path, remote_file_path)
        print(f"File {local_file_path} successfully uploaded to {remote_file_path}.")

        # Close the SFTP session
        sftp.close()

    except Exception as e:
        print(f"Error uploading file: {e}")

    finally:
        # Close the transport session
        transport.close()

if __name__ == "__main__":
    upload_file_via_sftp()
