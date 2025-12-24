import os
import time
import json
import socket
import psutil
import requests
import subprocess

CONFIG_PATH = "/home/bob325/config.json"

# ---- helpers ----
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        s.connect(("10.254.254.254", 1))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()

def get_public_ip(get_ip_url):
    try:
        r = requests.get(get_ip_url, timeout=5)
        # your server returns { ip: "x.x.x.x" } in some versions
        if "application/json" in r.headers.get("content-type", ""):
            data = r.json()
            return data.get("ip") or data.get("public_ip") or None
        return r.text.strip()
    except Exception as e:
        print(f"Error getting public IP: {e}")
        return None

def get_uptime_seconds():
    # more accurate than psutil.boot_time if time changes
    return int(time.time() - psutil.boot_time())

def get_free_space_bytes(path="/"):
    return int(psutil.disk_usage(path).free)

def get_file_count(directory):
    try:
        return sum(
            1 for f in os.listdir(directory)
            if os.path.isfile(os.path.join(directory, f))
        )
    except Exception as e:
        print(f"Error counting files in {directory}: {e}")
        return 0

def get_rssi_dbm(interface="wlan0"):
    # Optional: works on most Raspberry Pi OS images
    try:
        out = subprocess.check_output(["iwconfig", interface], stderr=subprocess.DEVNULL).decode()
        # look for "Signal level=-60 dBm"
        for token in out.replace("=", " ").split():
            if token.lower() == "level":
                # next token might be like "-60"
                pass
        # simpler parse:
        idx = out.lower().find("signal level=")
        if idx != -1:
            tail = out[idx + len("signal level="):]
            val = tail.split()[0]  # "-60" or "-60dBm"
            val = val.replace("dBm", "").replace("dbm", "")
            return int(val)
    except Exception:
        return None
    return None

def post_json(url, payload):
    try:
        r = requests.post(url, json=payload, timeout=10)
        if not r.ok:
            print(f"POST failed {r.status_code}: {r.text[:200]}")
        else:
            print(f"OK {r.status_code}")
        return r.ok
    except requests.exceptions.RequestException as e:
        print(f"Error posting: {e}")
        return False

# ---- main ----
def main():
    with open(CONFIG_PATH, "r") as f:
        config = json.load(f)

    station_id = str(config.get("stationID", "unknown"))        # "1", "2", etc
    base_directory = config.get("base_directory", "/tmp")
    get_ip_url = config.get("get_ip_url")                       # e.g. http://www.litenby.com/sound-locator/api/get-ip

    # NEW: unified node update endpoint (set this in config.json going forward)
    node_update_url = config.get(
        "node_update_url",
        "http://www.litenby.com/sound-locator/api/node/update"
    )

    # identify this device
    node_id = config.get("node_id", f"S{station_id}R1")         # e.g. "S1R1"
    node_name = config.get("node_name", "Raspberry Pi")

    interval_s = int(config.get("interval_seconds", 600))

    while True:
        uptime_s = get_uptime_seconds()
        free_space_bytes = get_free_space_bytes("/")
        file_count = get_file_count(base_directory)
        local_ip = get_local_ip()
        public_ip = get_public_ip(get_ip_url) if get_ip_url else None
        rssi = get_rssi_dbm("wlan0")

        payload = {
            "station": station_id,
            "kind": "rpi",
            "id": node_id,
            "name": node_name,
            "meta": {
                "uptime_s": uptime_s,
                "local_ip": local_ip,
                "public_ip": public_ip,
                "free_space_bytes": free_space_bytes,
                "file_count": file_count,
                "rssi": rssi,
                # If you want: path tracked
                "record_dir": base_directory
            }
        }

        print("Sending:", payload)
        post_json(node_update_url, payload)

        time.sleep(interval_s)

if __name__ == "__main__":
    main()
