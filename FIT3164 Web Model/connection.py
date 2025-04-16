import os
from flask import Flask, request, jsonify
import subprocess  # ✅ Run Python scripts
from flask_cors import CORS
from flask import send_from_directory

app = Flask(__name__)
# Custom safe upload folder
UPLOAD_TEMP_DIR = os.path.abspath("uploads_temp")
os.makedirs(UPLOAD_TEMP_DIR, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_TEMP_DIR
CORS(app, resources={r"/*": {"origins": "*"}})

# ✅ Create separate upload folders
PREDICTION_FOLDER = "uploads_prediction"
PREPROCESSING_FOLDER = "uploads_preprocessing"

os.makedirs(PREDICTION_FOLDER, exist_ok=True)
os.makedirs(PREPROCESSING_FOLDER, exist_ok=True)

app.config["PREDICTION_FOLDER"] = PREDICTION_FOLDER
app.config["PREPROCESSING_FOLDER"] = PREPROCESSING_FOLDER

@app.route('/upload_prediction', methods=['POST'])
def upload_prediction():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], uploaded_file.filename)
    uploaded_file.save(file_path)

    try:
        # Run prediction script with uploaded file
        result = subprocess.run(["python", "predict_chemoresistance.py", file_path], capture_output=True, text=True)
        print("✅ Prediction Output:", result.stdout)

        output_file = "predictions_output.csv"  # Default name in script
        output_path = os.path.abspath(output_file)

        if not os.path.exists(output_path):
            return jsonify({"error": "Prediction output file not found"}), 500

        return jsonify({
            "message": "Prediction completed successfully",
            "file_path": file_path,
            "output_file": os.path.basename(output_path),
            "download_url": f"http://127.0.0.1:5000/download_prediction/{os.path.basename(output_path)}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

print("📥 Preprocessing file upload received!")
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
            "download_url": f"http://127.0.0.1:5000/download_cleaned/{cleaned_filename}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@app.route('/download_cleaned/<filename>')
def download_cleaned_file(filename):
    cleaned_folder = "Cleaned_file"
    return send_from_directory(cleaned_folder, filename, as_attachment=True)


@app.route('/download_prediction/<filename>')
def download_prediction_file(filename):
    return send_from_directory('.', filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, port=5000)  # ✅ Same port (5000)
