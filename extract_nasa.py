import cantera as ct
import json

gas = ct.Solution('gri30.yaml')

species_of_interest = [
    'CO2', 'H2O', 'N2', 'O2', 'CO', 'H2', 'OH', 'O', 'H', 'NO', 'NO2', 'AR', 'CH4', 'C2H6', 'C3H8', 'C4H10'
]

# Map Cantera names to web names
name_map = {
    'CO2': 'CO₂', 'H2O': 'H₂O', 'N2': 'N₂', 'O2': 'O₂', 'CO': 'CO',
    'H2': 'H₂', 'OH': 'OH', 'O': 'O', 'H': 'H', 'NO': 'NO', 'NO2': 'NO₂',
    'AR': 'Ar', 'CH4': 'CH₄', 'C2H6': 'C₂H₆', 'C3H8': 'C₃H₈', 'C4H10': 'C₄H₁₀'
}

result = {}
for sp_name in species_of_interest:
    if sp_name not in gas.species_names:
        print(f"Warning: {sp_name} not in GRI-Mech 3.0")
        continue
    sp = gas.species(sp_name)
    thermo = sp.thermo
    # Check if it's NASA polynomial
    if hasattr(thermo, 'coeffs'):
        coeffs = thermo.coeffs
        # Cantera NASA polynomial format:
        # coeffs[0] = T_mid
        # coeffs[1:8] = high-T coefficients
        # coeffs[8:15] = low-T coefficients
        T_mid = coeffs[0]
        high = coeffs[1:8].tolist()
        low = coeffs[8:15].tolist()
        web_name = name_map.get(sp_name, sp_name)
        result[web_name] = {
            'low': {'a': low},
            'high': {'a': high}
        }
        print(f"{web_name}: T_mid={T_mid}")
        print(f"  low:  {low}")
        print(f"  high: {high}")
    else:
        print(f"{sp_name}: thermo type = {type(thermo)}")

with open('/workspace/cantera_nasa.json', 'w') as f:
    json.dump(result, f, indent=2)
print("\nSaved to /workspace/cantera_nasa.json")
