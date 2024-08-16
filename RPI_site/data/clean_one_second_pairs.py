import pandas as pd

## FUNCTION:
## whenever 2 points are 1 second apart, check if they make sense against surrounding points

filename = "Barton-2007-2024"

# Load the data into a pandas DataFrame
df = pd.read_csv(filename + ".csv", header=1, names=['datetime', 'value'])

# Convert the 'datetime' column to datetime objects and 'value' to numeric
df['datetime'] = pd.to_datetime(df['datetime'], format='%Y-%m-%d %H:%M:%S')
df['value'] = pd.to_numeric(df['value'], errors='coerce')

# Calculate the difference between consecutive times and values
df['time_diff'] = df['datetime'].diff()
df['value_diff'] = df['value'].diff()

# Identify rows where the time difference is exactly 1 second
one_second_diff_indices = df[df['time_diff'] == pd.Timedelta(seconds=1)].index

offset = 0 # to make sure correct index is still grabbed after rows removed
n = 0
# Open a file to write the results
with open(filename + '-pair-value-diff.txt', 'w') as file:
  for i in one_second_diff_indices:
    index = i - offset

    value_before_pair = df.loc[index - 2, 'value']
    # Get the values in the pair
    first_value = df.loc[index - 1, 'value']
    second_value = df.loc[index, 'value']

    # Calculate the differences
    previous_value_diff = value_before_pair - df.loc[index - 3, 'value']
    first_value_diff = first_value - value_before_pair
    second_value_diff = second_value - value_before_pair

    # Write the results to the file
    
    file.write(f"Testing against: {df.loc[index - 2, 'datetime']}, {df.loc[index - 2, 'value']}\n")
    file.write(f"  {df.loc[index - 1, 'datetime']}, {df.loc[index - 1, 'value']}\n")
    file.write(f"  {df.loc[index, 'datetime']}, {df.loc[index, 'value']}\n")
    file.write(f"Previous Differences: {previous_value_diff}\n")
    file.write(f"First value in pair:  {first_value} (Difference: {first_value_diff})\n")
    file.write(f"Second value in pair: {second_value} (Difference: {second_value_diff})\n")

    # calculate distance from last difference
    first_distance = abs(first_value_diff - previous_value_diff)
    second_distance = abs(second_value_diff - previous_value_diff)

    # remove first of pair
    if first_value_diff < 0 or first_distance > second_distance:
      file.write(f"    REMOVE FIRST line \"{df.loc[index - 1, 'datetime']}, {df.loc[index - 1, 'value']}\" AT INDEX {index - 1}\n")
      df = df.drop(index-1)
      df = df.reset_index(drop=True)
      one_second_diff_indices = df[df['time_diff'] == pd.Timedelta(seconds=1)].index
      offset += 1
    
    # remove second of pair
    if second_value_diff < 0 or first_distance < second_distance:
      file.write(f"    REMOVE SECOND line \"{df.loc[index, 'datetime']}, {df.loc[index, 'value']}\" AT INDEX {index}\n")
      df = df.drop(index)
      df = df.reset_index(drop=True)
      one_second_diff_indices = df[df['time_diff'] == pd.Timedelta(seconds=1)].index
      offset += 1
    
    n += 1
    file.write(f"---------------[{n}]---------------\n")

# Write the modified data to a new file
df[['datetime', 'value']].to_csv(f"{filename}-cleaned.csv", index=False)

print(f"Output has been written to {filename}-pair-value-diff.txt. New data has been written to {filename}-cleaned.csv.")

# Open a file to write the results
# i = 0
# with open(filename + '-second-pairs-1.txt', 'w') as file:
#   for index in one_second_diff_indices:
#     surrounding_indices = [idx for idx in range(index-2, index+3) if idx != index + 1]
        
#     # Filter out indices that are part of 1-second pairs
#     valid_indices = [idx for idx in surrounding_indices if idx not in one_second_diff_indices and idx >= 0 and idx < len(df)]
    
#     # Get the surrounding differences from valid indices
#     surrounding_diffs = df.loc[valid_indices, 'value_diff']

#     # Compare the current value difference to the surrounding differences
#     if len(surrounding_diffs) > 0:
#       current_diff = df.loc[index, 'value_diff']
#       mean_surrounding_diff = surrounding_diffs.mean()
#       std_surrounding_diff = surrounding_diffs.std()

#       # If the current difference is much larger or smaller than the surrounding ones, print it
#       if abs(current_diff - mean_surrounding_diff) > 2 * std_surrounding_diff:
#         file.write(f"Datetime: {df.loc[index - 1, 'datetime']}\n")
#         file.write(f"Datetime: {df.loc[index, 'datetime']}\n")
#         file.write(f"Value Diff: {current_diff}\n")
#         file.write(f"Surrounding differences: {surrounding_diffs.tolist()}\n")
#         file.write(f"---------------[{i}]---------------\n")
#         i += 1