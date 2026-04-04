
import pandas as pd
import math

file_path = "/Users/jaehong/My Drive (jhlim725@gmail.com)/GOODMAN/원팀로지스틱스-굿맨지엘에스 2025 UPS - RATE.XLS"
output_path = "../src/config/ups_tariff.ts"
sheet_name = '수출 EXPRESS SAVER'

def clean_rate(val):
    if pd.isna(val):
        return 0
    try:
        return int(val)
    except:
        return 0

try:
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
    
    # Map DataFrame Column Index to Keys
    # Based on inspection:
    # Col 3: China
    # Col 4: JP/VN...
    col_map = {
        3: 'C3',
        4: 'C4',
        5: 'C5',
        6: 'C6',
        7: 'C7',
        8: 'C8',
        9: 'C9',
        10: 'C10',
        11: 'C11'
    }

    exact_rates = {k: {} for k in col_map.values()}
    
    # 1. Exact Rates: Rows 25 to 67 (Index 25 to 67? No, DataFrame is 0-indexed)
    # Excel Row 25 is Index 24.
    # Excel Row 67 is Index 66.
    # Let's double check with values.
    # Row 25 (Index 24): 0.5kg
    # Row 67 (Index 66): 20.0kg?
    
    # From Step 170 output: Row 72 (Index 72) is "Ltr".
    # Row 67 was empty/NaN in truncated output? No, Row 67 was shown as NaN in Step 170.
    # Wait, Step 170 output:
    # 60: 17kg
    # ...
    # 66: ?
    # 67: NaN
    # 68: per KG 21~1000
    
    # So Exact Rates end at Row Index 66 (Row 67).
    # Or Row Index 63? 
    # Row 60 (Excel 61) is 17kg.
    # 18kg, 19kg, 20kg.
    # 60 + 3 * 2 (0.5 steps) = 17 + 1.5 = 18.5?
    # No, step is 0.5 up to ?
    # step is 1.0 from 20? 
    # Usually steps are 0.5.
    # To cover 17 to 20 (3kg gap) at 0.5 steps -> 6 rows.
    # 60 (17.0), 61 (17.5), 62 (18.0), 63 (18.5), 64 (19.0), 65 (19.5), 66 (20.0).
    # So Index 66 should be 20.0kg.
    # Index 67 seems empty.
    # Index 68 is "per KG".
    
    start_row = 25 # Index 25 (Excel 26). Wait, Step 142 says Row 25 is "Sample".
    # df.iloc[25] -> 'Sample' 0.5.
    # So start index is 25.
    
    for i in range(25, 67):
        row = df.iloc[i]
        weight_val = row[1] # Col 1 has weight (0.5, 1.0...)
        
        # Check if valid number
        try:
            weight = float(weight_val)
        except (ValueError, TypeError):
            continue
            
        for col_idx, key in col_map.items():
            rate = clean_rate(row[col_idx])
            exact_rates[key][weight] = rate

    full_ts_content = "export const UPS_EXACT_RATES: Record<string, Record<number, number>> = {\n"
    
    for key in sorted(col_map.values(), key=lambda x: int(x[1:])):
        full_ts_content += f"  '{key}': {{\n"
        sorted_weights = sorted(exact_rates[key].keys())
        for w in sorted_weights:
            full_ts_content += f"    {w}: {exact_rates[key][w]},\n"
        full_ts_content += "  },\n"
    
    full_ts_content += "};\n\n"
    
    # 2. Range Rates (>20kg)
    # Row Index 68 (Excel 69)
    # Range 21 to 9999
    
    full_ts_content += "export const UPS_RANGE_RATES = [\n"
    
    row_68 = df.iloc[68] # Index 68
    
    # Defensive check
    if 'per KG' in str(row_68[0]):
        full_ts_content += f"  {{ min: 21, max: 9999, rates: {{ "
        for col_idx, key in col_map.items():
            rate = clean_rate(row_68[col_idx])
            full_ts_content += f"'{key}': {rate}, "
        full_ts_content += "} },\n"
        
    full_ts_content += "];\n"
    
    with open(output_path, "w") as f:
        f.write(full_ts_content)
        
    print(f"Successfully generated {output_path}")

except Exception as e:
    print(f"Error: {e}")
