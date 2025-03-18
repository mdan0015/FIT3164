import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/upload": {"origins": "http://127.0.0.1:5500"}})

# ✅ Set upload folder
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure the folder exists
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route('/upload', methods=['POST'])
def upload():
    data = request.get_json()
    if not data or "content" not in data or "filename" not in data:
        return jsonify({"error": "No file content received"}), 400

    filename = data["filename"]
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    # ✅ Save the received file
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(data["content"])

    print(f"✅ File saved: {file_path}")  # Debugging

    return jsonify({
        "message": "File received successfully",
        "file_path": file_path
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)




