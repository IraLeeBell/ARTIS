import os
from flask import Flask, request, render_template, jsonify

# Initialize Flask application
app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/', methods=['GET'])
def index():
    """
    Renders the main page, including the file list (if any).
    """
    # Get a list of currently uploaded files
    files = sorted(os.listdir(UPLOAD_FOLDER))
    return render_template('index.html', files=files)

@app.route('/upload', methods=['POST'])
def upload():
    """
    Endpoint for handling file uploads via AJAX.
    """
    uploaded_files = request.files.getlist('files[]')
    for f in uploaded_files:
        # Save the file to the designated upload folder
        file_path = os.path.join(UPLOAD_FOLDER, f.filename)
        f.save(file_path)
    return 'Files uploaded successfully!', 200

@app.route('/files', methods=['GET'])
def list_files():
    """
    Returns a JSON list of the current files in the upload folder.
    Can be called by frontend JS to refresh the file list dynamically.
    """
    files = sorted(os.listdir(UPLOAD_FOLDER))
    return jsonify(files)

if __name__ == '__main__':
    # Run the Flask app in debug mode for development
    app.run(debug=True)
