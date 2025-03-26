import os
from flask import Flask, request, jsonify
import subprocess  # ✅ Run Python scripts
from flask_cors import CORS
from flask import send_from_directory

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5500"}})  # Allow all endpoints

# ✅ Create separate upload folders
PREDICTION_FOLDER = "uploads_prediction"
PREPROCESSING_FOLDER = "uploads_preprocessing"

os.makedirs(PREDICTION_FOLDER, exist_ok=True)
os.makedirs(PREPROCESSING_FOLDER, exist_ok=True)

app.config["PREDICTION_FOLDER"] = PREDICTION_FOLDER
app.config["PREPROCESSING_FOLDER"] = PREPROCESSING_FOLDER

# ✅ Prediction file upload
@app.route('/upload_prediction', methods=['POST'])
def upload_prediction():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    file_path = os.path.join(app.config["PREDICTION_FOLDER"], uploaded_file.filename)
    uploaded_file.save(file_path)  # ✅ Save file

    print(f"✅ Prediction file saved: {file_path}")

    return jsonify({"message": "Prediction file uploaded successfully", "file_path": file_path})


@app.route('/upload_preprocessing', methods=['POST'])
def upload_preprocessing():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    file_path = os.path.join(app.config["PREPROCESSING_FOLDER"], uploaded_file.filename)
    uploaded_file.save(file_path)

    try:
        # ✅ Run the preprocessing script
        result = subprocess.run(["python", "preprocessing_model.py", file_path], capture_output=True, text=True)
        print("✅ Preprocessing Output:", result.stdout)

        # ✅ Extract cleaned file path from script output
        cleaned_filename = None
        for line in result.stdout.strip().splitlines():
            if "Cleaned file saved at:" in line:
                cleaned_path = line.split("Cleaned file saved at:")[-1].strip()
                cleaned_filename = os.path.basename(cleaned_path)
                break

        if not cleaned_filename:
            return jsonify({"error": "Cleaned file path not found in script output"}), 500

        return jsonify({
            "message": "Preprocessing completed successfully",
            "file_path": file_path,
            "cleaned_file": cleaned_filename,
            "download_url": f"http://127.0.0.1:5001/download_cleaned/{cleaned_filename}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@app.route('/download_cleaned/<filename>')
def download_cleaned_file(filename):
    cleaned_folder = "Cleaned_file"
    return send_from_directory(cleaned_folder, filename, as_attachment=True)



if __name__ == '__main__':
    app.run(debug=True, port=5001)  # ✅ Same port (5001)
