import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# load the datasets
ccle_transcriptomics = pd.read_csv("/Users/tayqing/Desktop/FIT 3163/drive-download-20250312T160906Z-001/CCLE_expression.csv")
ccle_proteomics = pd.read_csv("/Users/tayqing/Desktop/FIT 3163/drive-download-20250312T160906Z-001/CCLE_RPPA_20181003.csv")
gdsc_ic50 = pd.read_excel("/Users/tayqing/Desktop/FIT 3163/drive-download-20250312T160906Z-001/GDSC1_fitted_dose_response_27Oct23.xlsx")

# add column name of CCLE_expression file
ccle_transcriptomics.columns = ["Cell_ID"] + [f"Gene_{i}" for i in range(1, ccle_transcriptomics.shape[1])]

# load a reference list of breast cancer cell lines 
breast_cancer_cells = ["ACH-000536", "ACH-000927","ACH-000248", "ACH-001259", "ACH-000148", "ACH-000583", "ACH-001881"]
cell_line_name = ["BT-20", "BT-474", "BT-549", "Evsa-T", "AU565"]

# filter datasets
ccle_transcriptomics_filtered = ccle_transcriptomics[ccle_transcriptomics["Cell_ID"].isin(breast_cancer_cells)]
# print(ccle_transcriptomics_filterd)

gdsc_ic50_filtered = gdsc_ic50[gdsc_ic50["CELL_LINE_NAME"].isin(cell_line_name)]
# print(gdsc_ic50_filtered)

# make ccle_transcriptomics file Cell_ID match with CELL_LINE_NAME
ach_to_cell_name = {
    "ACH-000536": "BT-20",
    "ACH-000927": "BT-474",
    "ACH-000248": "AU565",
    "ACH-001259": "BT-483",
    "ACH-000148": "BT-549",
    "ACH-000583": "Evsa-T",
    "ACH-001881": "MDA-MB-231"
}

ccle_transcriptomics_filtered = ccle_transcriptomics_filtered.copy()  # Ensure a new copy
ccle_transcriptomics_filtered["CELL_LINE_NAME"] = ccle_transcriptomics_filtered["Cell_ID"].map(ach_to_cell_name)
#print(ccle_transcriptomics_filterd)
#print(gdsc_ic50_filtered)

############## Merge two datasets ###############
merged_data = pd.merge(ccle_transcriptomics_filtered, gdsc_ic50_filtered, on="CELL_LINE_NAME", how = "inner")
merged_data.to_csv("merged_data.csv", index=False)

############## Baseline #################
# Define features (X) and target (y)
X = merged_data.drop(columns = ["LN_IC50", "Cell_ID", "CELL_LINE_NAME", "SANGER_MODEL_ID", "TCGA_DESC", "DRUG_NAME", "PUTATIVE_TARGET", "PATHWAY_NAME", "WEBRELEASE", "DATASET"], errors = "ignore")
y = merged_data["LN_IC50"]

# Ensure X only contains numeric values
#X = merged_data.drop(columns=["LN_IC50", "Cell_ID", "CELL_LINE_NAME", "DATASET"], errors="ignore")
#print(X)
#print(y)

# Split data into Training 80% and Testing 20%
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2, random_state= 42)

# Standardise gene expression features
sc = StandardScaler()
X_train_scaled = sc.fit_transform(X_train)
X_test_scaled = sc.transform(X_test)

# train baseline model - Linear Regression
lr = LinearRegression()
lr.fit(X_train_scaled, y_train)

# Predict IC50 values on test set
y_pred_lr = lr.predict(X_test_scaled)

# model performance
mse = mean_squared_error(y_test, y_pred_lr)
r2 = r2_score(y_test, y_pred_lr)


