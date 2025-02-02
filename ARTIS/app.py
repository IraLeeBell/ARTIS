import os
from flask import Flask, request, render_template, jsonify
from azure.storage.blob import BlobServiceClient
# If you're using a .env file:
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# 1. Get connection string (from environment or hard-coded).
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or "YOUR_CONNECTION_STRING_HERE"

# 2. Create a BlobServiceClient
blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

# 3. Reference the container (named "uploads" in your question).
#    Make sure this container already exists in your storage account.
container_name = "uploads"
container_client = blob_service_client.get_container_client(container_name)

@app.route('/', methods=['GET'])
def index():
    """
    Render the main page. For demonstration, we'll also list the files
    currently in the uploads container.
    """
    # List all blob names in the container
    blob_list = container_client.list_blobs()
    files = [blob.name for blob in blob_list]
    files.sort()

    return render_template('index.html', files=files)

@app.route('/upload', methods=['POST'])
def upload():
    """
    Endpoint for handling file uploads via AJAX.
    """
    uploaded_files = request.files.getlist('files[]')
    for f in uploaded_files:
        # Upload the file directly to Azure Blob Storage
        # We'll call blob name the same as the filename for simplicity
        blob_client = container_client.get_blob_client(f.filename)

        # You can pass the FileStorage object directly to 'upload_blob'
        blob_client.upload_blob(f, overwrite=True)

    return 'Files uploaded successfully!', 200

@app.route('/files', methods=['GET'])
def list_files():
    """
    Returns a JSON list of the current files in the Azure 'uploads' container.
    Called by frontend JS to refresh the file list dynamically.
    """
    blob_list = container_client.list_blobs()
    files = [blob.name for blob in blob_list]
    files.sort()
    return jsonify(files)

if __name__ == '__main__':
    app.run(debug=True)
