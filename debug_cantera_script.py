import cantera as ct

def calc_flame_temp(fuel_comp, oxidizer_type, excess_pct, fuel_temp=25, ox_temp=25):
    gas = ct.Solution('gri30.yaml')
    pressure = 101325
    
    # Stoichiometric O2
    stoich_o2 = 0
    for sp in fuel_comp:
        if sp == 'H2':
            stoich_o2 += fuel_comp[sp] * 0.5
        elif sp == 'CO':
            stoich_o2 += fuel_comp[sp] * 0.5
        elif sp == 'CH4':
            stoich_o2 += fuel_comp[sp] * 2.0
        elif sp == 'C2H6':
            stoich_o2 += fuel_comp[sp] * 3.5
        elif sp == 'C3H8':
            stoich_o2 += fuel_comp[sp] * 5.0
        elif sp == 'C4H10':
            stoich_o2 += fuel_comp[sp] * 6.5
    
    # Account for O2 already in fuel
    fuel_o2 = fuel_comp.get('O2', 0)
    stoich_o2 -= fuel_o2
    
    excess_factor = 1 + excess_pct / 100.0
    actual_o2 = stoich_o2 * excess_factor
    
    if oxidizer_type == 'air':
        oxidizer_comp = {'O2': actual_o2, 'N2': actual_o2 * (0.7809/0.2095), 'AR': actual_o2 * (0.0096/0.2095)}
    elif oxidizer_type == 'oxygen':
        oxidizer_comp = {'O2': actual_o2}
    else:
        oxidizer_comp = {}
    
    # Build reactants composition
    reactants = {}
    for sp, x in fuel_comp.items():
        if sp in gas.species_names:
            reactants[sp] = reactants.get(sp, 0) + x
    for sp, x in oxidizer_comp.items():
        reactants[sp] = reactants.get(sp, 0) + x
    
    fuel_T = fuel_temp + 273.15
    ox_T = ox_temp + 273.15
    
    # Find equilibrium T
    gas.TPX = fuel_T, pressure, reactants
    H_react = gas.enthalpy_mole
    
    T_low, T_high = 300, 8000
    for _ in range(100):
        T_mid = (T_low + T_high) / 2
        gas.TPX = T_mid, pressure, reactants
        gas.equilibrate('TP')
        if gas.enthalpy_mole > H_react:
            T_high = T_mid
        else:
            T_low = T_mid
    T_equilibrium = (T_low + T_high) / 2
    
    gas.TPX = T_equilibrium, pressure, reactants
    gas.equilibrate('TP')
    
    # Frozen products
    n_c = sum(fuel_comp.get(sp,0) * (1 if sp in ['CO','CH4','C2H6','C3H8','C4H10','CO2'] else 0) for sp in fuel_comp)
    n_h = sum(fuel_comp.get(sp,0) * ({'H2':2,'CH4':4,'C2H6':6,'C3H8':8,'C4H10':10}.get(sp,0)) for sp in fuel_comp)
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
    
    print(f"C3H8 debug:")
    print(f"  fuel_comp={fuel_comp}")
    print(f"  oxidizer_comp={oxidizer_comp}")
    print(f"  reactants={reactants}")
    print(f"  stoich_o2={stoich_o2}, actual_o2={actual_o2}")
    print(f"  n_c={n_c}, n_h={n_h}, n_co2={n_co2}, n_h2o={n_h2o}")
    print(f"  n_n2={n_n2}, n_ar={n_ar}")
    print(f"  frozen_comp={frozen_comp}")
    
    # Find T where frozen products have same enthalpy as reactants
    gas_frozen = ct.Solution('gri30.yaml')
    gas_frozen.TPX = fuel_T, pressure, reactants
    H_react_frozen = gas_frozen.enthalpy_mole  # J/kmol of mixture
    
    print(f"  H_react={H_react_frozen} J/kmol")
    
    T_low, T_high = 300, 8000
    for _ in range(100):
        T_mid = (T_low + T_high) / 2
        gas_frozen.TPX = T_mid, pressure, frozen_comp
        H_frozen = gas_frozen.enthalpy_mole
        if H_frozen > H_react_frozen:
            T_high = T_mid
        else:
            T_low = T_mid
    T_frozen = (T_low + T_high) / 2
    
    print(f"  T_frozen={T_frozen-273.15:.1f}°C")
    
    return T_equilibrium - 273.15, T_frozen - 273.15

# Run for C3H8
calc_flame_temp({'C3H8': 1.0}, 'air', 0, 25, 25)
