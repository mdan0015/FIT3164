# File: predict_chemoresistance.py

import pandas as pd
import joblib
import sys
from tensorflow.keras.models import load_model
from preprocessing_model import preprocess_user_dataset;

# Step 1: Load the trained model and scaler
def load_pipeline():
    model = load_model('chemoresistance_model.h5')
    scaler = joblib.load('scaler.pkl')
    return model, scaler

# Utility: Align input features to match training features
def align_features(X_new, expected_features):
    missing_features = list(set(expected_features) - set(X_new.columns))
    if missing_features:
        print(f"🧩 Adding missing features: {missing_features[:5]} ... (total: {len(missing_features)})")
        missing_df = pd.DataFrame(0.0, index=X_new.index, columns=missing_features)
        X_new = pd.concat([X_new, missing_df], axis=1)

    extra_features = list(set(X_new.columns) - set(expected_features))
    if extra_features:
        print(f"🚹 Dropping extra features: {extra_features[:5]} ... (total: {len(extra_features)})")
        X_new = X_new.drop(columns=extra_features)

    X_new = X_new.reindex(columns=expected_features)
    print(f"✅ Feature alignment complete. Total features: {X_new.shape[1]}")

    return X_new

# Step 2: Load and preprocess new data
def preprocess_new_data(file_path: str, scaler):
    try:
        data = pd.read_csv(file_path)
        data.columns = data.columns.str.replace(r'\s*\(.*\)', '', regex=True)
        data = data.loc[:, ~data.columns.duplicated()]

        X_new = data.drop(columns=['DRUG_ID', 'DRUG_NAME', 'COSMIC_ID', 'CCLE_Name'])

        if hasattr(scaler, 'feature_names_in_'):
            expected_features = list(scaler.feature_names_in_)
            X_new = align_features(X_new, expected_features)
        else:
            print("⚠️ Scaler does not have attribute 'feature_names_in_'. Feature alignment skipped.")

        X_new_scaled = scaler.transform(X_new)

        return data, X_new_scaled

    except FileNotFoundError:
        print(f"❌ Input file {file_path} not found. Please provide the dataset.")
        return None, None

    except KeyError as e:
        print(f"❌ Missing expected column in input data: {e}")
        return None, None

# Step 3: Make predictions
def make_predictions(model, X_scaled):
    predictions = model.predict(X_scaled)
    return predictions.flatten()

# Step 4: Save predictions to CSV
def save_predictions(original_data, predictions, output_file='predictions_output.csv'):
    results_df = original_data[['DRUG_ID', 'DRUG_NAME', 'COSMIC_ID', 'CCLE_Name']].copy()
    results_df['Predicted_LN_IC50'] = predictions

    # ✅ Label responsiveness
    def classify(ln_ic50):
        if ln_ic50 < 2.36:
            return "High"
        elif ln_ic50 <= 5.26:
            return "Intermediate"
        else:
            return "Low"

    results_df['Sensitivity'] = results_df['Predicted_LN_IC50'].apply(classify)

    
    # Optional: clean & sort
    before = results_df.shape[0]
    results_df = results_df.drop_duplicates(subset=['DRUG_ID', 'COSMIC_ID', 'CCLE_Name', 'DRUG_NAME'], keep='first')
    results_df = results_df.sort_values(by='Predicted_LN_IC50', ascending=True)
    after = results_df.shape[0]

    if before != after:
        print(f"⚠️ Dropped {before - after} duplicate rows from predictions.")

    results_df.to_csv(output_file, index=False)
    print(f"✅ Predictions saved to {output_file}")


# Step 5: Main function
def main(input_file):
    print("🚀 Starting full pipeline with user dataset...")

    # Step 1: Run preprocessing
    preprocessed_path = "user_preprocessed_output.csv"
    print("🧼 Preprocessing user dataset...")
    from preprocessing_model import preprocess_user_dataset  # Ensure it's in the same folder or adjust import
    preprocess_user_dataset(input_file, preprocessed_path)

    # Step 2: Load model and scaler
    print("🧠 Loading model and scaler...")
    model, scaler = load_pipeline()

    # Step 3: Preprocess data for prediction
    print("📊 Prepping input for model prediction...")
    original_data, X_new_scaled = preprocess_new_data(preprocessed_path, scaler)

    if original_data is None or X_new_scaled is None:
        print("❌ Exiting due to errors in data preprocessing.")
        return

    # Step 4: Predict
    print("🤖 Running predictions...")
    predictions = make_predictions(model, X_new_scaled)

    # Step 5: Save predictions
    print("💾 Saving predictions to CSV...")
    save_predictions(original_data, predictions)

    print("✅ Done! Predictions are available in 'predictions_output.csv'")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Error: No input file provided.")
        sys.exit(1)
    input_file = sys.argv[1]
    main(input_file)
