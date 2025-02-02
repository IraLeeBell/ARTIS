import os
import uuid
from flask import Flask, request, render_template, jsonify, send_file, abort
from azure.storage.blob import BlobServiceClient, BlobBlock

# Computer Vision imports
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import VisualFeatureTypes
from io import BytesIO
import mimetypes
from msrest.authentication import CognitiveServicesCredentials
from azure.cognitiveservices.vision.computervision.models import (
    VisualFeatureTypes,
    OperationStatusCodes
)

from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)

# ---------------------------
# Azure Blob Setup
# ---------------------------
# 2. Create a BlobServiceClient
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
container_name = "uploads"
container_client = blob_service_client.get_container_client(container_name)
CHUNK_SIZE = 8 * 1024 * 1024  # 4MB chunk (tweak as needed)

# ---------------------------
# Computer Vision Setup
# ---------------------------
COMPUTER_VISION_ENDPOINT = os.getenv("COMPUTER_VISION_ENDPOINT")
COMPUTER_VISION_KEY = os.getenv("COMPUTER_VISION_KEY")

cv_client = ComputerVisionClient(
    COMPUTER_VISION_ENDPOINT,
    CognitiveServicesCredentials(COMPUTER_VISION_KEY)
)

@app.route('/', methods=['GET'])
def index():
    # List all blobs
    blob_list = container_client.list_blobs()
    files = [blob.name for blob in blob_list]
    files.sort()
    return render_template('index.html', files=files)

@app.route("/upload", methods=["POST"])
def upload():
    # For each file in the request:
    for f in request.files.getlist("files[]"):
        blob_client = container_client.get_blob_client(f.filename)
        
        # We'll build a list of blocks to commit
        block_list = []
        
        # Read data from 'f.stream' in chunks
        while True:
            chunk = f.stream.read(CHUNK_SIZE)
            if not chunk:
                break

            # Generate a unique block ID each time
            block_id = str(uuid.uuid4())
            
            # Stage this chunk (block) to Azure
            blob_client.stage_block(block_id=block_id, data=chunk)
            block_list.append(BlobBlock(block_id=block_id))

        # Once all chunks are staged, commit them
        blob_client.commit_block_list(block_list)

    return "Files uploaded successfully!", 200

@app.route('/files', methods=['GET'])
def list_files():
    """
    Return a JSON payload containing:
      - files: a list of file names for the requested page
      - total_files: total number of files in the container
      - page_size: number of files per page (20)
      - current_page: the current page from the query param
    """
    page = request.args.get('page', 1, type=int)  # Default page = 1
    page_size = 20

    # Get all blobs, sort them, then slice for pagination
    all_blobs = sorted(list(container_client.list_blobs()), key=lambda x: x.name)
    total_files = len(all_blobs)

    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    page_blobs = all_blobs[start_index:end_index]

    files = [blob.name for blob in page_blobs]

    return jsonify({
        'files': files,
        'total_files': total_files,
        'page_size': page_size,
        'current_page': page
    })

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
    
# ---------------------------
# Computer Vision Page
# ---------------------------
@app.route('/computervision', methods=['GET'])
def computervision_page():
    """
    Render the Computer Vision page with the file list
    (the JS will fetch the list via /files).
    """
    return render_template('computervision.html')


@app.route('/vision/ocr', methods=['GET'])
def vision_ocr():
    import os
    from io import BytesIO
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "No filename provided"}), 400

    ext = os.path.splitext(filename)[1].lower()
    supported_exts = [".jpg", ".jpeg", ".png", ".bmp", ".pdf", ".tiff"]
    if ext not in supported_exts:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 400

    try:
        blob_client = container_client.get_blob_client(filename)
        file_data = blob_client.download_blob().readall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Wrap the raw bytes in a BytesIO
    from io import BytesIO
    stream_data = BytesIO(file_data)

    try:
        read_response = cv_client.read_in_stream(stream_data, raw=True)
        operation_location = read_response.headers["Operation-Location"]
        operation_id = operation_location.split("/")[-1]

        # Poll for the result
        while True:
            result = cv_client.get_read_result(operation_id)
            if result.status.lower() not in ["notstarted", "running"]:
                break

        if result.status.lower() == "succeeded":
            text_output = []
            for page in result.analyze_result.read_results:
                for line in page.lines:
                    text_output.append(line.text)
            full_text = "\n".join(text_output)
            return jsonify({"ocr_text": full_text})
        else:
            return jsonify({"error": "Read operation failed or timed out"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/vision/analyze', methods=['GET'])
def vision_analyze():
    import os
    from io import BytesIO
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "No filename provided"}), 400

    ext = os.path.splitext(filename)[1].lower()
    supported_exts = [".jpg", ".jpeg", ".png", ".bmp"]  # Typically not PDF/TIFF for image analysis
    if ext not in supported_exts:
        return jsonify({"error": f"Unsupported file type for image analysis: {ext}"}), 400

    try:
        blob_client = container_client.get_blob_client(filename)
        file_data = blob_client.download_blob().readall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Wrap the bytes in a BytesIO
    stream_data = BytesIO(file_data)

    try:
        from azure.cognitiveservices.vision.computervision.models import VisualFeatureTypes
        analysis = cv_client.analyze_image_in_stream(
            image=stream_data,
            visual_features=[
                VisualFeatureTypes.tags,
                VisualFeatureTypes.description,
                VisualFeatureTypes.color
            ]
        )

        results = {
            "description": analysis.description.captions[0].text if analysis.description.captions else "",
            "tags": [tag.name for tag in analysis.tags],
            "dominant_color_foreground": analysis.color.dominant_color_foreground if analysis.color else "",
            "dominant_color_background": analysis.color.dominant_color_background if analysis.color else ""
        }
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/vision/contentcheck', methods=['GET'])
def vision_contentcheck():
    """
    Detect adult, racy, or gory content in an image.
    """
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "No filename provided"}), 400

    ext = os.path.splitext(filename)[1].lower()
    # Typically these features are for standard image formats. 
    supported_exts = [".jpg", ".jpeg", ".png", ".bmp"]
    if ext not in supported_exts:
        return jsonify({"error": f"Unsupported file type for adult/racy/gory check: {ext}"}), 400

    try:
        blob_client = container_client.get_blob_client(filename)
        file_data = blob_client.download_blob().readall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Wrap the bytes in a BytesIO stream
    stream_data = BytesIO(file_data)

    try:
        analysis = cv_client.analyze_image_in_stream(
            image=stream_data,
            visual_features=[VisualFeatureTypes.adult]
        )
        # Build a results dict
        adult_info = analysis.adult  # Contains is_adult_content, adult_score, etc.

        results = {
            "isAdultContent": adult_info.is_adult_content,
            "adultScore": adult_info.adult_score,
            "isRacyContent": adult_info.is_racy_content,
            "racyScore": adult_info.racy_score,
            "isGoryContent": adult_info.is_gory_content,
            "goreScore": adult_info.gore_score
        }
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/thumbnail', methods=['GET'])
def thumbnail():
    """
    Return the raw image bytes for an image in the 'uploads' container,
    so it can be displayed in an <img> tag on the client side.
    Only for common image extensions (jpg, png, bmp, etc.).
    """
    filename = request.args.get('filename')
    if not filename:
        abort(400, "No filename provided")

    # Restrict to typical image extensions
    ext = os.path.splitext(filename)[1].lower()
    supported_exts = [".jpg", ".jpeg", ".png", ".bmp"]
    if ext not in supported_exts:
        # Could return a 404 or some placeholder image instead
        abort(400, "Unsupported image extension for thumbnail")

    # Download from Azure
    try:
        blob_client = container_client.get_blob_client(filename)
        file_data = blob_client.download_blob().readall()
    except Exception as e:
        abort(404, f"Error retrieving blob: {str(e)}")

    # Guess MIME type (fall back to octet-stream if unknown)
    mimetype, _ = mimetypes.guess_type(filename)
    if not mimetype:
        mimetype = "application/octet-stream"

    return send_file(
        BytesIO(file_data), 
        mimetype=mimetype,
        as_attachment=False
    )

if __name__ == '__main__':
    app.run(debug=True)
