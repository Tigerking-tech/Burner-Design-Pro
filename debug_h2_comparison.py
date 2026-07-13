import cantera as ct

def calc_frozen_both_methods(fuel_comp, oxidizer_type, excess_pct, fuel_temp=25):
    gas = ct.Solution('gri30.yaml')
    pressure = 101325
    
    stoich_o2 = 0
    for sp, x in fuel_comp.items():
        if sp == 'H2': stoich_o2 += x * 0.5
        elif sp == 'CO': stoich_o2 += x * 0.5
        elif sp == 'CH4': stoich_o2 += x * 2.0
        elif sp == 'C2H6': stoich_o2 += x * 3.5
        elif sp == 'C3H8': stoich_o2 += x * 5.0
        elif sp == 'C4H10': stoich_o2 += x * 6.5
    stoich_o2 -= fuel_comp.get('O2', 0)
    actual_o2 = stoich_o2 * (1 + excess_pct/100)
    
    if oxidizer_type == 'air':
        oxidizer = {'O2': actual_o2, 'N2': actual_o2*(0.7809/0.2095), 'AR': actual_o2*(0.0096/0.2095)}
    else:
        oxidizer = {'O2': actual_o2}
    
    reactants = {**fuel_comp, **oxidizer}
    fuel_T = fuel_temp + 273.15
    
    n_c = sum(fuel_comp.get(sp,0) * ({'CO':1,'CH4':1,'C2H6':2,'C3H8':3,'C4H10':4,'CO2':1}.get(sp,0)) for sp in fuel_comp)
    n_h = sum(fuel_comp.get(sp,0) * ({'H2':2,'CH4':4,'C2H6':6,'C3H8':8,'C4H10':10}.get(sp,0)) for sp in fuel_comp)
    frozen = {'CO2': n_c, 'H2O': n_h/2, 'N2': oxidizer.get('N2',0), 'AR': oxidizer.get('AR',0)}
    frozen = {k:v for k,v in frozen.items() if v > 0}
    
    total_react = sum(reactants.values())
    total_frozen = sum(frozen.values())
    
    gas_frozen = ct.Solution('gri30.yaml')
    gas_frozen.TPX = fuel_T, pressure, reactants
    H_react_per_kmol = gas_frozen.enthalpy_mole
    H_react_total = H_react_per_kmol * total_react / 1e6  # kJ
    
    # Method 1: Compare enthalpy_mole (what cantera_verify.py does)
    T_low, T_high = 300, 8000
    for _ in range(100):
        T_mid = (T_low + T_high) / 2
        gas_frozen.TPX = T_mid, pressure, frozen
        if gas_frozen.enthalpy_mole > H_react_per_kmol:
            T_high = T_mid
        else:
            T_low = T_mid
    T_frozen_method1 = (T_low + T_high) / 2
    
    # Method 2: Compare total enthalpy (correct)
    T_low, T_high = 300, 8000
    for _ in range(100):
        T_mid = (T_low + T_high) / 2
        gas_frozen.TPX = T_mid, pressure, frozen
        H_frozen_total = gas_frozen.enthalpy_mole * total_frozen / 1e6
        if H_frozen_total > H_react_total:
            T_high = T_mid
        else:
            T_low = T_mid
    T_frozen_method2 = (T_low + T_high) / 2
    
    print(f"{fuel_comp} + {oxidizer_type}:")
    print(f"  Total reactants={total_react:.4f}, frozen={total_frozen:.4f}")
    print(f"  Method 1 (per kmol): T_frozen={T_frozen_method1-273.15:.1f}°C")
    print(f"  Method 2 (total):    T_frozen={T_frozen_method2-273.15:.1f}°C")
    print(f"  Diff: {T_frozen_method1 - T_frozen_method2:.1f}K")
    print()

calc_frozen_both_methods({'H2': 1.0}, 'air', 0)
calc_frozen_both_methods({'CO': 1.0}, 'air', 0)
calc_frozen_both_methods({'CH4': 1.0}, 'air', 0)
calc_frozen_both_methods({'CH4': 1.0}, 'oxygen', 6)
calc_frozen_both_methods({'C3H8': 1.0}, 'air', 0)
