# NOTE: must install pandas before running
import pandas as pd

# finds all points that are 1 second apart

filename = "Barton-2007-2024" # CHANGE

df = pd.read_csv(filename + ".csv", header=1, names=['datetime', 'value'])
df['datetime'] = pd.to_datetime(df['datetime'], format='%Y-%m-%d %H:%M:%S')
df['value'] = pd.to_numeric(df['value'], errors='coerce')

# Calculate the difference between consecutive times
df['time_diff'] = df['datetime'].diff()
df['value_diff'] = df['value'].diff()

# Identify rows where the time difference is exactly 1 second
one_second_diff_indices = df[df['time_diff'] == pd.Timedelta(seconds=1)].index

# Open a file to write the pairs with a 1-second difference
i = 0
with open(filename + '-one-second_entries.txt', 'w') as file:
    for index in one_second_diff_indices:
        file.write(f"{df.loc[index - 1, 'datetime']} {df.loc[index - 1, 'value']}\n")
        file.write(f"{df.loc[index, 'datetime']} {df.loc[index, 'value']}\n")
        # Since 'time_diff' and 'value_diff' are calculated for each row, we only need to print them for the current row.
        file.write(f"Previous Value Diff: {df.loc[index - 1, 'value_diff']}\n")
        file.write(f"Value Diff: {df.loc[index, 'value_diff']}\n")
        file.write(f"Next Value Diff: {df.loc[index + 1, 'value_diff']}\n")
        file.write("---------------[" + str(i) + "]---------------\n")
        i += 1

print(f"Output has been written to {filename}-one-second_entries.txt.")


