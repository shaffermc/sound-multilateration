from pymongo import MongoClient
from datetime import datetime

# MongoDB connection string for port 27018 (local MongoDB instance)
mongo_uri = "mongodb://user:password@localhost:27018"

# Connect to MongoDB
client = MongoClient(mongo_uri)

# Access the database (replace 'yourDatabaseName' with the actual database name)
db = client['soundlocator']

# Access the collection (replace 'instructions' with the actual collection name)
collection = db['instructions']

# Sample instruction document to insert
sample_instruction = {
    "timestamp": int(datetime.timestamp(datetime.now()) * 1000),  # Unix timestamp in milliseconds
    "instruction_type": "sound_request",
    "instruction_target": "Station 1",
    "instruction_value": "2023-12-05-10-30-00",  # Use formatted date or any value for testing
    "station1_complete": False,
    "station2_complete": False,
    "station3_complete": False,
    "station4_complete": False,
    "all_complete": False
}

# Insert the sample instruction document
try:
    result = collection.insert_one(sample_instruction)
    print(f"Sample instruction inserted with _id: {result.inserted_id}")
except Exception as e:
    print(f"Error inserting document: {e}")
