import pandas as pd
import os
import sys

def preprocess(file_path):
    try:
        # ✅ Read the uploaded CSV
        df = pd.read_csv(file_path)  
        
        # ✅ Perform preprocessing (modify as needed)
        df = df.head()  # Example: Remove missing values
        
        # ✅ Define the output folder and filename
        cleaned_folder = "Cleaned_file"
        os.makedirs(cleaned_folder, exist_ok=True)  # Ensure folder exists

        cleaned_filename = "cleaned_" + os.path.basename(file_path)
        cleaned_filepath = os.path.join(cleaned_folder, cleaned_filename)

        # ✅ Save cleaned data to CSV
        df.to_csv(cleaned_filepath, index=False)
        
        print(f"✅ Cleaned file saved at: {cleaned_filepath}")
        return cleaned_filepath
    except Exception as e:
        print(f"❌ Error processing file: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]  # Get file path from Flask
        preprocess(file_path)
    else:
        print("❌ No file path provided.")