import pandas as pd

filename = "Student-Union-2003-2024-cleaned"

# Load the data into a pandas DataFrame
df = pd.read_csv(filename + ".csv", header=1, names=['datetime', 'value'])

# Convert the 'datetime' column to datetime objects and 'value' to numeric
df['datetime'] = pd.to_datetime(df['datetime'], format='%Y-%m-%d %H:%M:%S')
df['value'] = pd.to_numeric(df['value'], errors='coerce')

# Calculate the difference between consecutive times and values
df['value_diff'] = df['value'].diff()

# Write the original data along with time_diff and value_diff to a new file
output_filename = filename + "-differences.csv"
df.to_csv(output_filename, index=False)

print(f"Data with differences has been written to {output_filename}")