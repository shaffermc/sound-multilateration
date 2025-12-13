import os
import time
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from pydub import AudioSegment

# -------- CONFIG --------
MONGO_URI = "mongodb://admin:adminpassword@127.0.0.1:27018/soundlocator?authSource=admin"
DB_NAME = "soundlocator"
COLLECTION_NAME = "instructions"
AUDIO_FOLDER = "/home/mshaffer/www/sound-multilateration/vps/backend/services/audio_files"
MERGED_FOLDER = "/home/mshaffer/www/sound-multilateration/vps/backend/services/merged_audio"
CHECK_INTERVAL = 60  # seconds
# ------------------------

# ------------------------
# Connect to MongoDB with check
# ------------------------
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Trigger a server selection to verify connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful")
except ConnectionFailure as e:
    print("❌ MongoDB connection failed:", e)
    exit(1)

db = client[DB_NAME]
instructions_collection = db[COLLECTION_NAME]

os.makedirs(MERGED_FOLDER, exist_ok=True)

def merge_audio_files(file_prefix):
    """
    Merge audio1..audio4 into a 4-channel file.
    """
    files = []
    for i in range(1, 5):
        filename = f"{file_prefix}_audio{i}.wav"
        filepath = os.path.join(AUDIO_FOLDER, filename)
        if not os.path.exists(filepath):
            print(f"⚠️ Missing file: {filepath}")
            return False
        files.append(AudioSegment.from_file(filepath))

    # Trim all files to the length of the shortest one
    min_len = min(len(a) for a in files)
    files = [a[:min_len] for a in files]

    # Merge into 4-channel audio
    combined = AudioSegment.from_mono_audiosegments(*files)
    output_file = os.path.join(MERGED_FOLDER, f"{file_prefix}_combined.wav")
    combined.export(output_file, format="wav")
    print(f"✅ Merged audio saved to {output_file}")
    return True

def check_and_merge():
    print("\n🔍 Checking for 'sound_request' instructions not yet merged...")
    instructions = list(instructions_collection.find({
        "instruction_type": "sound_request",
        "all_complete": False
    }))

    print(f"Found {len(instructions)} instructions to process.")
    for instr in instructions:
        print(f"Instruction ID: {instr['_id']}, value: {instr.get('instruction_value')}")
        if all([
            instr.get("station1_complete", False),
            instr.get("station2_complete", False),
            instr.get("station3_complete", False),
            instr.get("station4_complete", False)
        ]):
            print("✅ All stations complete, attempting merge.")
            success = merge_audio_files(instr["instruction_value"])
            if success:
                instructions_collection.update_one(
                    {"_id": instr["_id"]},
                    {"$set": {"all_complete": True}}
                )
                print(f"Instruction {instr['_id']} marked as merged.")
        else:
            print("⚠️ Not all files present to merge.")

if __name__ == "__main__":
    while True:
        try:
            check_and_merge()
        except Exception as e:
            print("❌ Error during merge check:", e)
        time.sleep(CHECK_INTERVAL)
