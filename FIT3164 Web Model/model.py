from flask import Flask, request, jsonify
from flask_cors import CORS  # 🔥 Import CORS

app = Flask(__name__)
CORS(app)  # 🔥 Enable CORS

@app.route('/upload', methods=['POST'])
def upload():
    data = request.json  # Receive JSON data
    file_content = data.get("content", "")  # Extract CSV content

    if not file_content:
        return jsonify({"error": "No file content received"}), 400

    print("Received CSV Data:\n", file_content)  # Print to console (for debugging)

    return jsonify({"message": "File received successfully", "lines": file_content.split("\n")})

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Run Flask on port 5000
