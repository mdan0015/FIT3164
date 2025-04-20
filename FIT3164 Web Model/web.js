document.addEventListener("DOMContentLoaded", function () {
    // ✅ Attach event listeners for file uploads

    let predictionInput = document.getElementById("file_upload_prediction");


    if (predictionInput) {
        predictionInput.addEventListener("change", function (event) {
            uploadFile(event, "file_info_prediction", "http://127.0.0.1:5000/upload_prediction");
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

        const loadingDiv = document.getElementById("loading_indicator");
        loadingDiv.style.display = "block"; // Show loading
        fetch(uploadUrl, {
            method: "POST",
            mode: "cors",
            body: formData,
        })
        .then(res => res.json())
        .then(data => {
            loadingDiv.style.display = "none"; // ✅ Hide loading
            console.log("✅ Response from server:", data);
            if (data.error) {
                infoDiv.innerText += "\n❌ Error: " + data.error;
                return;
            }
    
            const link = document.createElement("a");
            link.href = data.download_url;
            link.target = "_blank";
            link.style = "display:inline-block;margin-top:15px;background-color:#2ecc71;color:white;padding:10px 20px;border-radius:8px;text-decoration:none";
    
            // ✅ Correct link label based on endpoint
            if (uploadUrl.includes("upload_prediction")) {
                link.innerText = "⬇️ Download Prediction File";
            } else {
                link.innerText = "⬇️ Download Cleaned File";
            }
    
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
            loadingDiv.style.display = "none"; // ✅ Hide on error
            console.error("❌ Upload failed:", error);
            infoDiv.innerText = "❌ Upload failed.";
        });
    }

    const searchInput = document.getElementById("drug_id_search");
    const searchButton = document.getElementById("search_button");

    searchButton.addEventListener("click", function () {
        if (!allRows.length) return;
    
        const value = searchInput.value.toLowerCase();
        const header = allRows[0];
        const drugIdIndex = header.indexOf("DRUG_ID");
        if (drugIdIndex === -1) return;
    
        const filteredRows = allRows.slice(1).filter(row =>
            row[drugIdIndex]?.toLowerCase().includes(value)
        );
    
        if (filteredRows.length === 0) {
            displayNoMatchMessage();
            return;
        }
    
        const filtered = [header, ...filteredRows];
        displayTable(filtered);
    });
    
    
    
});


const datasetLink = document.getElementById("cancer-dataset-link");
if (datasetLink) {
    datasetLink.addEventListener("click", function () {
        showRequirements();
    });
}

function showRequirements() {
    alert("Ensure that all columns are named exactly as shown.\nThe dataset should only contain:\n- COSMIC_ID\n- GDSC_DRUG_ID\n- GENE_EXPRESSION\n- DRUG_ISOSMILES\n\n⚠️ If your dataset does not have 'DRUG_ISOSMILES' process with Morgan Finger, please use our preprocessing tool to generate it.");
}



function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
}

function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}



function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
}

function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}


function displayCSV(csvText) {
    allRows = csvText.trim().split("\n").map(row => row.split(","));
    displayTable(allRows);

    // ✅ Show the search box after table is displayed
    document.getElementById("search_controls").style.display = "block";
}

function createSearchInput(rows) {
    const container = document.getElementById("csv_preview");
    const input = document.createElement("input");
    input.placeholder = "🔍 Search by DRUG_ID...";
    input.style = "margin:20px auto; display:block; padding:10px; width:50%; font-size:16px; border-radius:5px; border:none; outline:none;";
    
    const header = rows[0];
    const drugIdIndex = header.indexOf("DRUG_ID");

    input.addEventListener("input", function () {
        const value = input.value.toLowerCase();
        const filtered = [header, ...rows.slice(1).filter(row =>
            row[drugIdIndex]?.toString().toLowerCase().includes(value)
        )];
        displayTable(filtered);
    });

    container.prepend(input);
}

function displayTable(rows) {
    const preview = document.getElementById("csv_preview");
    preview.innerHTML = ""; // Clear previous

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.margin = "0 auto";
    table.style.backgroundColor = "#ffffff";
    table.style.color = "#000";
    table.style.fontSize = "14px";

    rows.forEach((row, i) => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
            const tag = i === 0 ? "th" : "td";
            const td = document.createElement(tag);
            td.innerText = cell;
            td.style.border = "1px solid #ccc";
            td.style.padding = "8px 12px";
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    preview.appendChild(table);
}

let allRows = []; // Global CSV storage


function displayNoMatchMessage() {
    const preview = document.getElementById("csv_preview");
    preview.innerHTML = ""; // Clear table

    const msg = document.createElement("p");
    msg.innerText = "⚠️ No matching DRUG_ID found.";
    msg.style = "color: #ff7675; font-size: 18px; margin-top: 20px;";
    preview.appendChild(msg);
}
