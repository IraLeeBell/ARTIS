import os
from flask import Flask, request, render_template, jsonify
from azure.storage.blob import BlobServiceClient
# If you're using a .env file:
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# 1. Get connection string (from environment or hard-coded).
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

# 2. Create a BlobServiceClient
blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

# 3. Reference the container (named "uploads" in your question).
#    Make sure this container already exists in your storage account.
container_name = "uploads"
container_client = blob_service_client.get_container_client(container_name)

@app.route('/', methods=['GET'])
def index():
    # List all blobs
    blob_list = container_client.list_blobs()
    files = [blob.name for blob in blob_list]
    files.sort()
    return render_template('index.html', files=files)

@app.route('/upload', methods=['POST'])
def upload():
    uploaded_files = request.files.getlist('files[]')
    for f in uploaded_files:
        blob_client = container_client.get_blob_client(f.filename)
        blob_client.upload_blob(f, overwrite=True)
    return 'Files uploaded successfully!', 200

@app.route('/files', methods=['GET'])
def list_files():
    blob_list = container_client.list_blobs()
    files = [blob.name for blob in blob_list]
    files.sort()
    return jsonify(files)

@app.route('/delete', methods=['POST'])
def delete_file():
    """Delete a file (blob) from Azure based on the filename."""
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({"message": "No filename provided"}), 400

    try:
        blob_client = container_client.get_blob_client(filename)
        blob_client.delete_blob()
        return jsonify({"message": f"{filename} deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)














