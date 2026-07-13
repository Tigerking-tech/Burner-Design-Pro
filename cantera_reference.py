import cantera as ct
import json

def calc_equilibrium(fuel_comp, oxidizer_type='air', excess_o2_pct=0, 
                     fuel_temp=25, oxidizer_temp=25, pressure=101325):
    """
    Calculate equilibrium flame temperature and products using Cantera.
    
    fuel_comp: dict of {species: mole_fraction} e.g. {'CH4': 1.0}
    oxidizer_type: 'air' or 'oxygen'
    excess_o2_pct: excess oxygen percentage (0 = stoichiometric)
    fuel_temp: fuel temperature in °C
    oxidizer_temp: oxidizer temperature in °C
    pressure: pressure in Pa
    """
    gas = ct.Solution('gri30.yaml')
    
    # Calculate stoichiometric O2 requirement
    # For each fuel species, compute O2 needed
    stoich_o2 = 0
    for sp, x in fuel_comp.items():
        if sp == 'H2':
            stoich_o2 += x * 0.5
        elif sp == 'CO':
            stoich_o2 += x * 0.5
        elif sp == 'CH4':
            stoich_o2 += x * 2.0
        elif sp == 'C2H6':
            stoich_o2 += x * 3.5
        elif sp == 'C3H8':
            stoich_o2 += x * 5.0
        elif sp == 'C4H10':
            stoich_o2 += x * 6.5
        elif sp == 'C2H4':
            stoich_o2 += x * 3.0
        elif sp == 'C2H2':
            stoich_o2 += x * 2.5
        elif sp == 'NH3':
            stoich_o2 += x * 0.75
        elif sp == 'H2S':
            stoich_o2 += x * 1.5
        elif sp == 'C6H6':
            stoich_o2 += x * 7.5
        elif sp == 'C5H12':
            stoich_o2 += x * 8.0
        elif sp == 'C6H14':
            stoich_o2 += x * 9.5
        elif sp == 'C7H16':
            stoich_o2 += x * 11.0
        elif sp == 'C3H6':
            stoich_o2 += x * 4.5
        elif sp == 'C4H8':
            stoich_o2 += x * 6.0
        # Non-fuel species: O2 contributes, N2 and CO2 are inert
        # Actually we need to handle O2 in fuel too
    
    # Subtract O2 already in fuel
    fuel_o2 = fuel_comp.get('O2', 0)
    stoich_o2 -= fuel_o2
    
    excess_factor = 1 + excess_o2_pct / 100.0
    actual_o2 = stoich_o2 * excess_factor
    
    if oxidizer_type == 'air':
        oxidizer_n2 = actual_o2 * (0.7809 / 0.2095)
        oxidizer_ar = actual_o2 * (0.0096 / 0.2095)
        oxidizer_comp = {'O2': actual_o2, 'N2': oxidizer_n2, 'AR': oxidizer_ar}
    else:  # oxygen
        oxidizer_comp = {'O2': actual_o2}
    
    # Set fuel state
    fuel_T = fuel_temp + 273.15
    oxidizer_T = oxidizer_temp + 273.15
    
    # Create reactants by mixing
    # Use Cantera's equilibrium calculator
    
    # Build full reactant composition
    reactants = {}
    for sp, x in fuel_comp.items():
        cantera_sp = sp
        if cantera_sp in gas.species_names:
            reactants[cantera_sp] = reactants.get(cantera_sp, 0) + x
    
    # Add fuel N2 from composition  
    fuel_n2 = fuel_comp.get('N2', 0)
    if fuel_n2 > 0:
        reactants['N2'] = reactants.get('N2', 0) + fuel_n2
    
    for sp, x in oxidizer_comp.items():
        reactants[sp] = reactants.get(sp, 0) + x
    
    # Set state with reactant composition
    gas.TPX = fuel_T, pressure, reactants
    
    # Equilibrate at constant pressure and enthalpy (HP)
    gas.equilibrate('HP')
    
    T_eq = gas.T
    T_eq_C = T_eq - 273.15
    
    # Get product composition in mole fractions
    products = {}
    for i, sp in enumerate(gas.species_names):
        x = gas.X[i]
        if x > 1e-6:
            products[sp] = x * 100  # convert to percentage
    
    # Sort by mole fraction descending
    products = dict(sorted(products.items(), key=lambda item: -item[1]))
    
    return {
        'T_equilibrium_K': round(T_eq, 1),
        'T_equilibrium_C': round(T_eq_C, 1),
        'products_mole_pct': products,
        'pressure_atm': pressure / 101325
    }

# Test cases
test_cases = [
    {
        'name': 'CH4 + Air (stoichiometric)',
        'fuel': {'CH4': 1.0},
        'oxidizer': 'air',
        'excess_o2': 0,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
    {
        'name': 'CH4 + Air (10% excess)',
        'fuel': {'CH4': 1.0},
        'oxidizer': 'air',
        'excess_o2': 10,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
    {
        'name': 'CH4 + O2 (stoichiometric)',
        'fuel': {'CH4': 1.0},
        'oxidizer': 'oxygen',
        'excess_o2': 0,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
    {
        'name': 'H2 + Air (stoichiometric)',
        'fuel': {'H2': 1.0},
        'oxidizer': 'air',
        'excess_o2': 0,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
    {
        'name': 'H2 + O2 (stoichiometric)',
        'fuel': {'H2': 1.0},
        'oxidizer': 'oxygen',
        'excess_o2': 0,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
    {
        'name': 'C3H8 + Air (stoichiometric)',
        'fuel': {'C3H8': 1.0},
        'oxidizer': 'air',
        'excess_o2': 0,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
    {
        'name': 'CO + Air (stoichiometric)',
        'fuel': {'CO': 1.0},
        'oxidizer': 'air',
        'excess_o2': 0,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
    {
        'name': 'CH4 + Air (stoichiometric, 200°C preheat)',
        'fuel': {'CH4': 1.0},
        'oxidizer': 'air',
        'excess_o2': 0,
        'fuel_temp': 25,
        'oxidizer_temp': 200,
    },
    {
        'name': 'North Sea Natural Gas H + Air',
        'fuel': {'CH4': 0.8879, 'C2H6': 0.0688, 'C3H8': 0.0123, 'C4H10': 0.0027, 'N2': 0.0082, 'CO2': 0.0193, 'O2': 0.0001},
        'oxidizer': 'air',
        'excess_o2': 10,
        'fuel_temp': 25,
        'oxidizer_temp': 25,
    },
]

results = {}
for tc in test_cases:
    result = calc_equilibrium(
        tc['fuel'], tc['oxidizer'], tc['excess_o2'],
        tc['fuel_temp'], tc['oxidizer_temp']
    )
    results[tc['name']] = result
    print(f"\n{'='*60}")
    print(f"Test: {tc['name']}")
    print(f"Equilibrium Temperature: {result['T_equilibrium_C']} °C ({result['T_equilibrium_K']} K)")
    print(f"Products (mole %):")
    for sp, pct in result['products_mole_pct'].items():
        print(f"  {sp:8s}: {pct:10.4f}%")

# Save to JSON for reference
with open('/workspace/cantera_reference.json', 'w') as f:
    json.dump(results, f, indent=2)
print("\n\nReference data saved to /workspace/cantera_reference.json")
