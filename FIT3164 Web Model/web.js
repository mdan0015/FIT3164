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
            debugger;
            console.log("CSV File Content:\n", fileContent); // Log content to console
            alert(fileContent);

            
        };
        reader.readAsText(file); // 🔥 Missing call to read file


    }
});

