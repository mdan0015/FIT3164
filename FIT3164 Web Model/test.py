import pandas as pd



user_df = pd.read_csv("user_test_data.csv")
user_df = user_df.drop(columns="Unnamed: 0")

user_df.to_csv("user_test_dataset.csv", index=False)

print("🧪 Columns in `merged`:", user_df.columns.tolist())


required_columns = ['Unnamed: 0']

if all(col in user_df.columns for col in required_columns):
    print("✅ All required columns are present.")
else:
    missing = [col for col in required_columns if col not in user_df.columns]
    print(f"❌ Missing required columns: {missing}")







