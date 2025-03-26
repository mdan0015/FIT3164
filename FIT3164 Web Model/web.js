document.addEventListener("DOMContentLoaded", function () {
    // ✅ Attach event listeners for file uploads

    let predictionInput = document.getElementById("file_upload_prediction");
    let preprocessingInput = document.getElementById("file_upload_preprocessing");

    if (predictionInput) {
        predictionInput.addEventListener("change", function (event) {
            uploadFile(event, "file_info_prediction", "http://127.0.0.1:5001/upload_prediction");
        });
    }

    if (preprocessingInput) {
        preprocessingInput.addEventListener("change", function (event) {
            uploadFile(event, "file_info_preprocessing", "http://127.0.0.1:5001/upload_preprocessing");
        });
    }

    function uploadFile(event, fileInfoId, uploadUrl) {
        const file = event.target.files[0];
        if (!file) return;
    
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            alert("⚠️ Please upload a CSV file.");
            event.target.value = "";
            return;
        }
    
        const infoDiv = document.getElementById(fileInfoId);
        infoDiv.innerText = "File Selected: " + file.name;
    
        const formData = new FormData();
        formData.append("file", file);
    
        fetch(uploadUrl, {
            method: "POST",
            mode: "cors",
            body: formData,
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                infoDiv.innerText += "\n❌ Error: " + data.error;
                return;
            }
    
            const link = document.createElement("a");
            link.href = data.download_url;
            link.innerText = "⬇️ Download Cleaned File";
            link.target = "_blank";
            link.style = "display:inline-block;margin-top:15px;background-color:#2ecc71;color:white;padding:10px 20px;border-radius:8px;text-decoration:none";
    
            infoDiv.appendChild(document.createElement("br"));
            infoDiv.appendChild(link);
    
            // ✅ Show file preview
            fetch(data.download_url)
                .then(res => res.text())
                .then(csvText => {
                    displayCSV(csvText);
                    document.getElementById("csv_preview").scrollIntoView({ behavior: "smooth" });
                });
        })
        .catch(error => {
            console.error("❌ Upload failed:", error);
            infoDiv.innerText = "❌ Upload failed.";
        });
    }
    
    
});




const datasetLink = document.getElementById("cancer-dataset-link");
if (datasetLink) {
    datasetLink.addEventListener("click", function () {
        showRequirements();
    });
}

function showRequirements() {
    alert("Ensure that all columns are named exactly as shown.\nThe dataset should only contain:\n- COSMIC_ID\n- GDSC_DRUG_ID\n- GENE_EXPRESSION\n- DRUG_ISOSMILES\n\n⚠️ If your dataset does not have 'DRUG_ISOSMILES'(With Morgan Finger), please use our preprocessing tool to generate it.");
}



function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
}

function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}

function displayCSV(csvText) {
    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const preview = document.getElementById("csv_preview");
    preview.innerHTML = "";

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.margin = "0 auto";
    table.style.backgroundColor = "#fff";
    table.style.color = "#000";
    table.style.fontSize = "14px";

    rows.forEach((row, i) => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
            const tag = i === 0 ? "th" : "td";
            const td = document.createElement(tag);
            td.innerText = cell;
            td.style.border = "1px solid #ccc";
            td.style.padding = "6px 10px";
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    preview.appendChild(table);
}
