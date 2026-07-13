import cantera as ct
import json

def calc_flame_temp(fuel_comp, oxidizer_type='air', excess_o2_pct=0,
                     fuel_temp=0, oxidizer_temp=0, pressure=101325):
    """Calculate equilibrium flame temperature using Cantera."""
    gas = ct.Solution('gri30.yaml')

    # Calculate stoichiometric O2
    stoich_o2 = 0
    for sp, x in fuel_comp.items():
        if sp == 'H2': stoich_o2 += x * 0.5
        elif sp == 'CO': stoich_o2 += x * 0.5
        elif sp == 'CH4': stoich_o2 += x * 2.0
        elif sp == 'C2H6': stoich_o2 += x * 3.5
        elif sp == 'C3H8': stoich_o2 += x * 5.0
        elif sp == 'C4H10': stoich_o2 += x * 6.5

    fuel_o2 = fuel_comp.get('O2', 0)
    stoich_o2 -= fuel_o2

    excess_factor = 1 + excess_o2_pct / 100.0
    actual_o2 = stoich_o2 * excess_factor

    if oxidizer_type == 'air':
        oxidizer_comp = {'O2': actual_o2, 'N2': actual_o2 * (0.7809/0.2095), 'AR': actual_o2 * (0.0096/0.2095)}
    else:
        oxidizer_comp = {'O2': actual_o2}

    # Build reactants
    reactants = {}
    for sp, x in fuel_comp.items():
        if sp in gas.species_names:
            reactants[sp] = reactants.get(sp, 0) + x
    for sp, x in oxidizer_comp.items():
        reactants[sp] = reactants.get(sp, 0) + x

    fuel_T = fuel_temp + 273.15
    ox_T = oxidizer_temp + 273.15

    # Equilibrate at constant enthalpy and pressure
    gas.TPX = fuel_T, pressure, reactants
    gas.equilibrate('HP')

    T_eq = gas.T
    T_eq_C = T_eq - 273.15

    products = {}
    for i, sp in enumerate(gas.species_names):
        x = gas.X[i]
        if x > 1e-6:
            products[sp] = x * 100

    # Also calculate frozen (theoretical) temperature
    gas_frozen = ct.Solution('gri30.yaml')
    gas_frozen.TPX = fuel_T, pressure, reactants
    # Set to frozen composition - just do a temperature search with fixed composition
    # Frozen means complete combustion: all C->CO2, all H->H2O, excess O2 remains
    n_c = sum(fuel_comp.get(sp,0) * ({'CO':1,'CH4':1,'C2H6':2,'C3H8':3,'C4H10':4,'CO2':1}.get(sp,0)) for sp in fuel_comp)
    n_h = sum(fuel_comp.get(sp,0) * ({'H2':2,'CH4':4,'C2H6':6,'C3H8':8,'C4H10':10}.get(sp,0)) for sp in fuel_comp)
    n_o_fuel = fuel_comp.get('O2',0) * 2 + fuel_comp.get('CO',0) + fuel_comp.get('CO2',0) * 2

    n_co2 = n_c
    n_h2o = n_h / 2
    n_o2_excess = actual_o2 - stoich_o2
    n_n2 = oxidizer_comp.get('N2', 0) + fuel_comp.get('N2', 0)
    n_ar = oxidizer_comp.get('AR', 0)

    frozen_comp = {}
    if n_co2 > 0: frozen_comp['CO2'] = n_co2
    if n_h2o > 0: frozen_comp['H2O'] = n_h2o
    if n_o2_excess > 0: frozen_comp['O2'] = n_o2_excess
    if n_n2 > 0: frozen_comp['N2'] = n_n2
    if n_ar > 0: frozen_comp['AR'] = n_ar

    # Find T where frozen products have same total enthalpy as reactants
    gas_frozen.TPX = fuel_T, pressure, reactants
    H_react = gas_frozen.enthalpy_mole  # J/kmol of mixture
    total_react_moles = sum(reactants.values())
    total_frozen_moles = sum(frozen_comp.values())

    # Binary search for frozen T (compare total enthalpy)
    T_low, T_high = 300, 8000
    for _ in range(100):
        T_mid = (T_low + T_high) / 2
        gas_frozen.TPX = T_mid, pressure, frozen_comp
        H_frozen = gas_frozen.enthalpy_mole
        # Compare total enthalpy: H_frozen * total_frozen vs H_react * total_react
        if H_frozen * total_frozen_moles > H_react * total_react_moles:
            T_high = T_mid
        else:
            T_low = T_mid
    T_frozen = (T_low + T_high) / 2

    return {
        'T_equilibrium_C': round(T_eq_C, 1),
        'T_frozen_C': round(T_frozen - 273.15, 1),
        'products_mole_pct': dict(sorted(products.items(), key=lambda x: -x[1])),
        'frozen_products': {k: v/sum(frozen_comp.values())*100 for k,v in frozen_comp.items()}
    }

# Test cases matching the browser scenarios
test_cases = [
    {'name': 'CH4_PureO2_6pct_0C', 'fuel': {'CH4': 1.0}, 'ox': 'oxygen', 'excess': 6, 'fT': 0, 'oT': 0},
    {'name': 'CH4_Air_0pct_25C', 'fuel': {'CH4': 1.0}, 'ox': 'air', 'excess': 0, 'fT': 25, 'oT': 25},
    {'name': 'CH4_Air_10pct_25C', 'fuel': {'CH4': 1.0}, 'ox': 'air', 'excess': 10, 'fT': 25, 'oT': 25},
    {'name': 'H2_Air_0pct_25C', 'fuel': {'H2': 1.0}, 'ox': 'air', 'excess': 0, 'fT': 25, 'oT': 25},
    {'name': 'H2_PureO2_0pct_25C', 'fuel': {'H2': 1.0}, 'ox': 'oxygen', 'excess': 0, 'fT': 25, 'oT': 25},
    {'name': 'C3H8_Air_0pct_25C', 'fuel': {'C3H8': 1.0}, 'ox': 'air', 'excess': 0, 'fT': 25, 'oT': 25},
    {'name': 'CO_Air_0pct_25C', 'fuel': {'CO': 1.0}, 'ox': 'air', 'excess': 0, 'fT': 25, 'oT': 25},
]

results = {}
for tc in test_cases:
    r = calc_flame_temp(tc['fuel'], tc['ox'], tc['excess'], tc['fT'], tc['oT'])
    results[tc['name']] = r
    print(f"\n{'='*60}")
    print(f"Test: {tc['name']}")
    print(f"  Frozen T:     {r['T_frozen_C']:.1f} °C")
    print(f"  Equilibrium T:{r['T_equilibrium_C']:.1f} °C")
    print(f"  Products (mol%):")
    for sp, pct in r['products_mole_pct'].items():
        print(f"    {sp:8s}: {pct:10.4f}%")

with open('/workspace/cantera_ref.json', 'w') as f:
    json.dump(results, f, indent=2)
print("\nSaved to /workspace/cantera_ref.json")
