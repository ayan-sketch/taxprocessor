from openpyxl import load_workbook
import json

# Load the template file
wb = load_workbook('templete/client_import_template_validated (1).xlsx')

# Get the CONFIG_MASTER sheet
ws = wb['CONFIG_MASTER']
print('CONFIG_MASTER sheet content:\n')

# Read all data
for row_idx, row in enumerate(ws.iter_rows(min_row=1, max_row=50, values_only=True), 1):
    if any(cell for cell in row):  # Only print non-empty rows
        print(f"Row {row_idx}: {row}")
