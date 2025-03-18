document.getElementById("file-upload").addEventListener("change", function (event) {
    let file = event.target.files[0];

    if (file) {
        // Check if the file is a CSV
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            alert("⚠️ Please upload a CSV file and try again.");
            event.target.value = ""; // Reset input
            return;
        }

        document.getElementById("file-info").innerText = "File Selected: " + file.name;

        // Read the CSV file
        let reader = new FileReader();
        reader.onload = function (e) {
            let fileContent = e.target.result; // Get CSV content as text
            console.log("CSV File Content:\n", fileContent); // Debugging

            // 🔥 Send file content to Flask server
            fetch("http://127.0.0.1:5000/upload", {
                method: "POST",
                mode: "cors",  // ✅ Ensure CORS mode is enabled
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, content: fileContent })
            })
                
            .then(response => response.json())
            .then(data => console.log("✅ Server Response:", data))
            .catch(error => console.error("❌ Error sending file:", error));
        };

        reader.readAsText(file); // Convert file to text
    }
});

