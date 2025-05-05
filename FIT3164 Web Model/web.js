document.addEventListener("DOMContentLoaded", function () {
    // ✅ File upload handler
    const predictionInput = document.getElementById("file_upload_prediction");
    if (predictionInput) {
        predictionInput.addEventListener("change", function (event) {
            uploadFile(event, "file_info_prediction", "http://127.0.0.1:5000/upload_prediction");
        });
    }

    // ✅ Search button handler
    const searchButton = document.getElementById("search_button");
    if (searchButton) {
        searchButton.addEventListener("click", filterTable);
    }
});

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
    const uploadSection = document.getElementById("upload-section");
    const searchControls = document.getElementById("search_controls");
    const csvPreview = document.getElementById("csv_preview");

    uploadSection.style.display = "none";
    searchControls.style.display = "none";
    csvPreview.innerHTML = "";
    loadingDiv.style.display = "block";

    fetch(uploadUrl, {
        method: "POST",
        mode: "cors",
        body: formData,
    })
    .then(res => res.json())
    .then(data => {
        loadingDiv.style.display = "none";
        console.log("✅ Response from server:", data);

        if (data.error) {
            infoDiv.innerText += "\n❌ Error: " + data.error;
            uploadSection.style.display = "block";
            return;
        }

        const link = document.createElement("a");
        link.href = data.download_url;
        link.target = "_blank";
        link.style = "display:inline-block;margin-top:15px;background-color:#2ecc71;color:white;padding:10px 20px;border-radius:8px;text-decoration:none";

        link.innerText = uploadUrl.includes("upload_prediction")
            ? "⬇️ Download Prediction File"
            : "⬇️ Download Cleaned File";

        infoDiv.appendChild(document.createElement("br"));
        infoDiv.appendChild(link);

        fetch(data.download_url)
            .then(res => res.text())
            .then(csvText => {
                displayCSV(csvText);
                document.getElementById("csv_preview").scrollIntoView({ behavior: "smooth" });
            });
    })
    .catch(error => {
        loadingDiv.style.display = "none";
        console.error("❌ Upload failed:", error);
        infoDiv.innerText = "❌ Upload failed.";
        uploadSection.style.display = "block";
    });
}

function displayCSV(csvText) {
    allRows = csvText.trim().split("\n").map(row => row.split(","));
    displayTable(allRows);
    document.getElementById("search_controls").style.display = "block";
}

function filterTable() {
    if (!allRows.length) return;

    const cancerInput = document.getElementById("cancer_search").value.toLowerCase();
    const header = allRows[0];
    const ccleIndex = header.indexOf("CCLE_Name");

    if (ccleIndex === -1) return;

    const filteredRows = allRows.slice(1).filter(row => {
        const ccle = row[ccleIndex]?.toLowerCase();
        const cancerType = ccle?.split("_")[1]; // move here ✅
        return !cancerInput || (cancerType && cancerType === cancerInput);
    });

    if (filteredRows.length === 0) {
        displayNoMatchMessage();
        return;
    }

    const filtered = [header, ...filteredRows];
    displayTable(filtered);
}

let currentSortColumn = null;
let sortAscending = true;

function displayTable(rows) {
    const preview = document.getElementById("csv_preview");
    preview.innerHTML = "";

    const table = document.createElement("table");
    table.className = "styled-table";

    const columnNameMap = {
        "DRUG_ID": "Drug ID",
        "DRUG_NAME": "Drug Name",
        "COSMIC_ID": "Cosmic ID",
        "CCLE_Name": "Cell Line",
        "Predicted_LN_IC50": "Predicted_LN_IC50",
        "Sensitivity": "Sensitivity"
    };

    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    rows.forEach((row, i) => {
        const tr = document.createElement("tr");
        row.forEach((cell, colIndex) => {
            const tag = i === 0 ? "th" : "td";
            const td = document.createElement(tag);

            if (i === 0) {
                td.style.cursor = "pointer";

                const colName = columnNameMap[cell] || cell;

                const isCurrent = colIndex === currentSortColumn;
                const icon = isCurrent
                    ? (sortAscending ? " ▲ " : " ▼ ")
                    : " ⬍"; // default neutral icon

                td.innerHTML = colName + icon;

                td.addEventListener("click", () => sortTableByColumn(colIndex));
            } else {
                // Make Drug Name a clickable Wikipedia link
                const header = rows[0][colIndex];
                if (header === "DRUG_NAME") {
                    const drugName = cell.trim();
                    const link = document.createElement("a");
                    link.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(drugName)}`;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.style.color = "#2c3e50";
                    link.style.textDecoration = "underline";
                    link.innerText = drugName;
                    td.appendChild(link);
                } else {
                    td.innerText = cell;
                }
            }

            tr.appendChild(td);
        });

        i === 0 ? thead.appendChild(tr) : tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    preview.appendChild(table);
}


function sortTableByColumn(columnIndex) {
    if (!allRows.length || columnIndex === undefined) return;

    const header = allRows[0];
    const rows = allRows.slice(1);

    if (currentSortColumn === columnIndex) {
        sortAscending = !sortAscending;
    } else {
        currentSortColumn = columnIndex;
        sortAscending = true;
    }

    const isNumeric = !isNaN(rows[0][columnIndex]);

    const sortedRows = [...rows].sort((a, b) => {
        const valA = a[columnIndex]?.toLowerCase();
        const valB = b[columnIndex]?.toLowerCase();

        if (isNumeric) {
            return sortAscending
                ? parseFloat(valA) - parseFloat(valB)
                : parseFloat(valB) - parseFloat(valA);
        } else {
            return sortAscending
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }
    });

    allRows = [header, ...sortedRows];
    displayTable(allRows); // refresh UI with updated icon
}



function displayNoMatchMessage() {
    const preview = document.getElementById("csv_preview");
    preview.innerHTML = "";

    const msg = document.createElement("p");
    msg.innerText = "⚠️ No matching cancer type found.";
    msg.style = "color: #ff7675; font-size: 18px; margin-top: 20px;";
    preview.appendChild(msg);
}

// Show tooltip modal
function showRequirements() {
    const tooltip = document.getElementById("tooltip-box");
    tooltip.style.display = tooltip.style.display === "block" ? "none" : "block";
}


let allRows = []; // CSV data stored globally


document.getElementById("search_button").addEventListener("click", function () {
    if (!allRows.length) return;

    const cancerInput = document.getElementById("cancer_search").value.trim().toLowerCase();
    const header = allRows[0];
    const ccleIndex = header.indexOf("CCLE_Name");

    if (ccleIndex === -1) return;

    const validCancers = ["breast", "lung", "neck"];
    const downloadBtn = document.getElementById("download_cancer");

    // ✅ Show download button only if input is EXACT match
    if (validCancers.includes(cancerInput)) {
        downloadBtn.style.display = "inline-block";
        downloadBtn.dataset.cancer = cancerInput;
        downloadBtn.innerText = `⬇️ Download ${cancerInput.charAt(0).toUpperCase() + cancerInput.slice(1)} Prediction File`;
    } else {
        downloadBtn.style.display = "none";
    }

    const filteredRows = allRows.slice(1).filter(row => {
        const ccle = row[ccleIndex]?.toLowerCase();
        const cancerType = ccle?.split("_")[1];
        return !cancerInput || (cancerType && cancerType === cancerInput);
    });

    if (filteredRows.length === 0) {
        displayNoMatchMessage();
        return;
    }

    const filtered = [header, ...filteredRows];
    displayTable(filtered);
});



document.getElementById("download_cancer").addEventListener("click", function () {
    const table = document.querySelector(".styled-table");
    if (!table) return;

    const rows = Array.from(table.querySelectorAll("tr"));
    let csvContent = "";

    rows.forEach(tr => {
        const cells = tr.querySelectorAll("th, td");
        const row = Array.from(cells).map(cell => `"${cell.innerText.trim()}"`).join(",");
        csvContent += row + "\n";
    });

    const cancer = this.dataset.cancer || "cancer";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${cancer}_cancer_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

