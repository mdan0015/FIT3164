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


os.makedirs(PREDICTION_FOLDER, exist_ok=True)


app.config["PREDICTION_FOLDER"] = PREDICTION_FOLDER


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
        python_executable = "/opt/anaconda3/envs/chem_rdkit_env/bin/python"  
        result = subprocess.run([python_executable, "predict_chemoresistance.py", file_path], capture_output=True, text=True)

        print("✅ Prediction Output:", result.stdout)
        print("⚠️ Prediction Error (if any):", result.stderr)

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




@app.route('/download_prediction/<filename>')
def download_prediction_file(filename):
    return send_from_directory('.', filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, port=5000)  
