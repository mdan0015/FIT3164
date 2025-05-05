import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.DataStructs import ConvertToNumpyArray

def preprocess_user_dataset(user_csv_path: str, output_csv_path: str = "user_preprocessed_output.csv"):
    # Load user dataset
    user_df = pd.read_csv(user_csv_path)
    print("📥 Loaded user dataset.")

    # Load cleaned files
    print("🔄 Loading reference files...")
    drug_info = pd.read_csv("Preprocess_files/cleaned_drug_info.csv")
    pubchem_data = pd.read_csv("Preprocess_files/cleaned_pubchem.csv")

    # Determine path based on available columns
    if 'ISOSMILES' in user_df.columns:
        print("✅ User dataset contains ISOSMILES. No merging needed.")
        final_merged = user_df.copy()

    elif 'PubCHEM' in user_df.columns:
        print("🔬 User dataset has PubCHEM but no ISOSMILES. Merging with pubchem data...")
        final_merged = pd.merge(user_df, pubchem_data, on="PubCHEM", how="left")
        final_merged = final_merged.dropna(subset=["ISOSMILES"])

    else:
        print("🔗 Merging with drug_info to get PubCHEM...")
        merged = pd.merge(user_df, drug_info, on="DRUG_ID", how="left").dropna(subset=["PubCHEM"])
        print("🔬 Now merging with pubchem_data to get ISOSMILES...")
        final_merged = pd.merge(merged, pubchem_data, on="PubCHEM", how="left").dropna(subset=["ISOSMILES"])

    final_merged = final_merged.drop_duplicates().reset_index(drop=True)

    # Generate Morgan fingerprints
    print("🧬 Generating Morgan fingerprints...")
    arr = []
    morgan_generator = AllChem.GetMorganGenerator(radius=2, fpSize=256)

    for smiles in final_merged['ISOSMILES']:
        mol = Chem.MolFromSmiles(smiles)
        if mol is not None:
            fp = morgan_generator.GetFingerprint(mol)
            fp_array = np.zeros((256,), dtype=np.int64)
            ConvertToNumpyArray(fp, fp_array)
            arr.append(fp_array)
        else:
            print(f"⚠️ Invalid SMILES: {smiles}")
            arr.append(np.zeros((256,), dtype=np.int64))

    # Attach fingerprint data
    fingerprints_df = pd.DataFrame(arr)
    df_with_fps = final_merged.join(fingerprints_df)

    # Clean-up optional fields
    df_with_fps = df_with_fps.drop(columns=[col for col in ['PubCHEM', 'ISOSMILES'] if col in df_with_fps.columns])

    # Save output
    df_with_fps.to_csv(output_csv_path, index=False)
    print(f"✅ Final preprocessed file saved to: {output_csv_path}")

    return df_with_fps
