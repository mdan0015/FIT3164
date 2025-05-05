let allRows = [];
let currentSortColumn = null;
let sortAscending = true;

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("file_upload_prediction").addEventListener("change", function (event) {
    uploadFile(event, "file_info_prediction", "http://127.0.0.1:5000/upload_prediction");
  });

  document.getElementById("search_button").addEventListener("click", filterTable);
  document.getElementById("download_cancer").addEventListener("click", downloadCancerData);
});

function uploadFile(event, fileInfoId, uploadUrl) {
  const file = event.target.files[0];
  if (!file || (!file.name.endsWith(".csv") && file.type !== "text/csv")) {
    alert("⚠️ Please upload a valid CSV file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  const infoDiv = document.getElementById(fileInfoId);
  const loadingDiv = document.getElementById("loading_indicator");
  const uploadSection = document.getElementById("upload-section");
  const tooltipBox = document.getElementById("tooltip-box");
  const preview = document.getElementById("csv_preview");

  // Show loading, hide upload and tooltip
  infoDiv.textContent = "File Selected: " + file.name;
  uploadSection.style.display = "none";
  tooltipBox.style.display = "none";
  preview.innerHTML = "";
  loadingDiv.style.display = "block";

  fetch(uploadUrl, { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      loadingDiv.style.display = "none";

      if (data.error) {
        infoDiv.innerText += "\n❌ Error: " + data.error;
        uploadSection.style.display = "block";
        return;
      }

      const link = document.createElement("a");
      link.href = data.download_url;
      link.textContent = "⬇️ Download Prediction File";
      link.target = "_blank";
      link.style.cssText = "display:inline-block;margin-top:15px;background-color:#2ecc71;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;";
      infoDiv.appendChild(document.createElement("br"));
      infoDiv.appendChild(link);

      fetch(data.download_url)
        .then(res => res.text())
        .then(csvText => {
          displayCSV(csvText);
          document.getElementById("csv_preview").scrollIntoView({ behavior: "smooth" });
        });
    })
    .catch(err => {
      loadingDiv.style.display = "none";
      infoDiv.innerText = "❌ Upload failed.";
      uploadSection.style.display = "block";
    });
}

function displayCSV(csvText) {
  allRows = csvText.trim().split("\n").map(row => row.split(","));
  displayTable(allRows);
  document.getElementById("search_controls").style.display = "block";
}

function displayTable(rows) {
// Always hide the format guidelines when table is displayed
    const tooltip = document.getElementById("tooltip-box");
    if (tooltip) tooltip.style.display = "none";
  

  const preview = document.getElementById("csv_preview");
  preview.innerHTML = "";

  const table = document.createElement("table");
  table.className = "styled-table";

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const columnNameMap = {
    "DRUG_ID": "Drug ID",
    "DRUG_NAME": "Drug Name",
    "COSMIC_ID": "Cosmic ID",
    "CCLE_Name": "Cell Line",
    "Predicted_LN_IC50": "Predicted_LN_IC50",
    "Sensitivity": "Sensitivity"
  };

  rows.forEach((row, i) => {
    const tr = document.createElement("tr");
    row.forEach((cell, colIndex) => {
      const tag = i === 0 ? "th" : "td";
      const td = document.createElement(tag);
      const header = rows[0][colIndex];

      if (i === 0) {
        td.innerHTML = (columnNameMap[cell] || cell) + " ⬍";
        td.style.cursor = "pointer";
        td.addEventListener("click", () => sortTableByColumn(colIndex));
      } else if (header === "DRUG_NAME") {
        const link = document.createElement("a");
        link.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(cell)}`;
        link.textContent = cell;
        link.target = "_blank";
        link.style.textDecoration = "underline";
        td.appendChild(link);
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    i === 0 ? thead.appendChild(tr) : tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  preview.appendChild(table);
}

function sortTableByColumn(index) {
  if (!allRows.length) return;

  const isNumeric = !isNaN(allRows[1][index]);
  sortAscending = currentSortColumn === index ? !sortAscending : true;
  currentSortColumn = index;

  const sorted = [...allRows.slice(1)].sort((a, b) => {
    const aVal = a[index], bVal = b[index];
    return isNumeric
      ? (sortAscending ? aVal - bVal : bVal - aVal)
      : (sortAscending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal));
  });

  displayTable([allRows[0], ...sorted]);
}

function filterTable() {
  const input = document.getElementById("cancer_search").value.trim().toLowerCase();
  const index = allRows[0].indexOf("CCLE_Name");
  const filtered = allRows.filter((row, i) => i === 0 || row[index]?.toLowerCase().includes(input));
  displayTable(filtered);

  const valid = ["breast", "lung", "neck"];
  const cancer = input.toLowerCase();
  const btn = document.getElementById("download_cancer");

  if (valid.includes(cancer)) {
    btn.style.display = "inline-block";
    btn.dataset.cancer = cancer;
    btn.textContent = `⬇️ Download ${cancer.charAt(0).toUpperCase() + cancer.slice(1)} Prediction File`;
  } else {
    btn.style.display = "none";
  }
}

function downloadCancerData() {
  const cancer = this.dataset.cancer || "cancer";
  const table = document.querySelector(".styled-table");
  const rows = table.querySelectorAll("tr");

  const csv = Array.from(rows)
    .map(row => Array.from(row.cells).map(cell => `"${cell.textContent}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${cancer}_cancer_data.csv`;
  link.click();
}

function showRequirements() {
  const tooltip = document.getElementById("tooltip-box");
  tooltip.style.display = tooltip.style.display === "block" ? "none" : "block";
}
