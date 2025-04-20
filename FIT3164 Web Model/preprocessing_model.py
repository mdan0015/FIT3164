import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.DataStructs import ConvertToNumpyArray

def preprocess_user_dataset(user_csv_path: str, output_csv_path: str = "user_preprocessed_output.csv"):
    # Step 1: Load user file
    user_df = pd.read_csv(user_csv_path)
    print("📥 Loaded user dataset.")

    # Step 2: Load pre-cleaned drug info and PubChem data
    print("🔄 Loading preprocessed drug and pubchem info...")
    drug_info = pd.read_csv("Preprocess_files/cleaned_drug_info.csv")
    pubchem_data = pd.read_csv("Preprocess_files/cleaned_pubchem.csv")

    # Step 3: Merge user data with drug info on DRUG_ID
    print("🔗 Merging with drug info...")
    merged = pd.merge(user_df, drug_info, on="DRUG_ID")
    merged = merged.dropna().drop_duplicates()

    # Step 4: Merge with PubChem SMILES on PubCHEM
    print("🔬 Merging with PubChem isosmiles...")
    final_merged = pd.merge(merged, pubchem_data, on="PubCHEM")
    final_merged.reset_index(drop=True, inplace=True)



    # Step 5: Generate Morgan fingerprints
    print("🧬 Generating Morgan fingerprints...")
    arr = []
    morgan_generator = AllChem.GetMorganGenerator(radius=2, fpSize=256)

    for smiles in final_merged['isosmiles']:
        mol = Chem.MolFromSmiles(smiles)
        if mol is not None:
            fp = morgan_generator.GetFingerprint(mol)
            fp_array = np.zeros((256,), dtype=np.int64)
            ConvertToNumpyArray(fp, fp_array)
            arr.append(fp_array)
        else:
            print(f"⚠️ Invalid SMILES: {smiles}")
            arr.append(np.zeros((256,), dtype=np.int64))

    # Step 6: Add fingerprints to data
    fingerprints_df = pd.DataFrame(arr)
    df_with_fps = final_merged.join(fingerprints_df)

    # Optional cleanup: remove original SMILES and PubCHEM
    df_with_fps = df_with_fps.drop(columns="PubCHEM")
    df_with_fps = df_with_fps.drop(columns="isosmiles")

    # Step 7: Save final output
    df_with_fps.to_csv(output_csv_path, index=False)
    print(f"✅ Final preprocessed file saved to: {output_csv_path}")

    return df_with_fps
