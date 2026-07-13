import cantera as ct

def test_case(name, fuel_comp, oxidizer_type, excess_pct):
    gas = ct.Solution('gri30.yaml')
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
    actual_o2 = stoich_o2 * (1 + excess_pct/100)
    
    if oxidizer_type == 'air':
        oxidizer = {'O2': actual_o2, 'N2': actual_o2*(0.7809/0.2095), 'AR': actual_o2*(0.0096/0.2095)}
    else:
        oxidizer = {'O2': actual_o2}
    
    reactants = {**fuel_comp, **oxidizer}
    
    # Frozen comp (with correct n_c)
    n_c = sum(fuel_comp.get(sp,0) * ({'CO':1,'CH4':1,'C2H6':2,'C3H8':3,'C4H10':4,'CO2':1}.get(sp,0)) for sp in fuel_comp)
    n_h = sum(fuel_comp.get(sp,0) * ({'H2':2,'CH4':4,'C2H6':6,'C3H8':8,'C4H10':10}.get(sp,0)) for sp in fuel_comp)
    frozen = {'CO2': n_c, 'H2O': n_h/2, 'N2': oxidizer.get('N2',0), 'AR': oxidizer.get('AR',0)}
    frozen = {k:v for k,v in frozen.items() if v > 0}
    
    total_react = sum(reactants.values())
    total_frozen = sum(frozen.values())
    
    print(f"{name}:")
    print(f"  Reactants: {reactants} -> total={total_react:.4f} mol")
    print(f"  Frozen:    {frozen} -> total={total_frozen:.4f} mol")
    print(f"  Ratio (react/frozen): {total_react/total_frozen:.4f}")
    
    # Compare enthalpy_mole vs total enthalpy at a test T
    T_test = 2000
    gas.TPX = T_test, 101325, reactants
    H_react_per_kmol = gas.enthalpy_mole
    H_react_total = H_react_per_kmol * total_react / 1e6
    
    gas.TPX = T_test, 101325, frozen
    H_frozen_per_kmol = gas.enthalpy_mole
    H_frozen_total = H_frozen_per_kmol * total_frozen / 1e6
    
    print(f"  At T={T_test}K:")
    print(f"    H_react per kmol = {H_react_per_kmol:.2f} J/kmol")
    print(f"    H_frozen per kmol = {H_frozen_per_kmol:.2f} J/kmol")
    print(f"    H_react total = {H_react_total:.3f} kJ")
    print(f"    H_frozen total = {H_frozen_total:.3f} kJ")
    print(f"    Diff per kmol = {H_frozen_per_kmol - H_react_per_kmol:.2f}")
    print(f"    Diff total = {H_frozen_total - H_react_total:.3f}")
    print()

test_case('CH4_Air', {'CH4':1}, 'air', 0)
test_case('H2_Air', {'H2':1}, 'air', 0)
test_case('CO_Air', {'CO':1}, 'air', 0)
test_case('C3H8_Air', {'C3H8':1}, 'air', 0)
test_case('CH4_PureO2', {'CH4':1}, 'oxygen', 6)
