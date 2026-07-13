import cantera as ct

def web_enthalpy(species, T):
    """Replicate web enthalpy function with NASA coeffs."""
    R = 0.008314  # kJ/mol/K
    coeffs = {
        'CO2': {
            'low': [2.35677352E+00, 8.98459677E-03, -7.12356269E-06, 2.45919022E-09, -1.43699548E-13, -4.83719697E+04, 9.90105222E+00],
            'high': [3.85746029E+00, 4.41437026E-03, -2.21481404E-06, 5.23490188E-10, -4.72084164E-14, -4.87591660E+04, 2.27168103E+00]
        },
        'H2O': {
            'low': [4.19864056E+00, -2.03643410E-03, 6.52040211E-06, -5.48797062E-09, 1.77197817E-12, -3.02937267E+04, -8.49032208E-01],
            'high': [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00]
        },
        'N2': {
            'low': [3.29867700E+00, 1.40824040E-03, -3.96322200E-06, 5.64151500E-09, -2.44485400E-12, -1.02089990E+03, 3.95037200E+00],
            'high': [2.92664000E+00, 1.48797680E-03, -5.68476000E-07, 1.00970300E-10, -6.75335100E-15, -9.22797700E+02, 5.98052800E+00]
        },
        'O2': {
            'low': [3.78245636E+00, -2.99673416E-03, 9.84730201E-06, -9.68129509E-09, 3.24372837E-12, -1.06394356E+03, 3.65767573E+00],
            'high': [3.28253784E+00, 1.48308754E-03, -7.57966669E-07, 2.09470555E-10, -2.16717794E-14, -1.08845772E+03, 5.45323129E+00]
        },
        'CO': {
            'low': [3.57953347E+00, -6.10353680E-04, 1.01681433E-06, 9.07005884E-10, -9.04424499E-13, -1.43440860E+04, 3.50840928E+00],
            'high': [2.71518561E+00, 2.06252743E-03, -9.98825771E-07, 2.30053008E-10, -2.03647716E-14, -1.41518724E+04, 7.81868772E+00]
        },
        'H2': {
            'low': [2.34433112E+00, 7.98052075E-03, -1.94781510E-05, 2.01572094E-08, -7.37611761E-12, -9.17935173E+02, 6.83010238E-01],
            'high': [3.33727920E+00, -4.94024731E-05, 4.99456778E-07, -1.79566394E-10, 2.00255376E-14, -9.50158922E+02, -3.20502331E+00]
        },
        'CH4': {
            'low': [5.14987613E+00, -1.36709788E-02, 4.91800599E-05, -4.84743026E-08, 1.66693956E-11, -1.02466476E+04, -4.64130376E+00],
            'high': [7.48514950E-02, 1.33909467E-02, -5.73285809E-06, 1.22292535E-09, -1.01815230E-13, -9.46834459E+03, 1.84373180E+01]
        },
        'C3H8': {
            'low': [-6.69578170E-01, 6.66199664E-02, -3.44182634E-05, 8.87844759E-09, -8.86961885E-13, -1.39958323E+04, 2.96809492E+01],
            'high': [1.24658720E+01, 1.76798584E-02, -5.32752862E-06, 7.97787789E-10, -4.48860300E-14, -1.83658740E+04, -3.43183150E+01]
        },
        'Ar': {
            'low': [2.50000000E+00, 0, 0, 0, 0, -7.45375000E+02, 4.36600000E+00],
            'high': [2.50000000E+00, 0, 0, 0, 0, -7.45375000E+02, 4.36600000E+00]
        }
    }
    data = coeffs.get(species)
    if not data:
        return None
    a = data['low'] if T < 1000 else data['high']
    H_RT = a[0] + a[1]*T/2 + a[2]*T*T/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
    return R * T * H_RT  # kJ/mol

def debug_case(name, fuel_comp, ox_type, excess_pct, fuel_temp, ox_temp):
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
    excess_factor = 1 + excess_pct / 100.0
    actual_o2 = stoich_o2 * excess_factor

    if ox_type == 'air':
        oxidizer = {'O2': actual_o2, 'N2': actual_o2 * (0.7809/0.2095), 'AR': actual_o2 * (0.0096/0.2095)}
    else:
        oxidizer = {'O2': actual_o2}

    reactants = {}
    for sp, x in fuel_comp.items():
        if sp in gas.species_names:
            reactants[sp] = reactants.get(sp, 0) + x
    for sp, x in oxidizer.items():
        reactants[sp] = reactants.get(sp, 0) + x

    fuel_T = fuel_temp + 273.15
    ox_T = ox_temp + 273.15

    # Cantera H_react (J/kmol of mixture)
    gas.TPX = fuel_T, 101325, reactants
    H_react_cantera = gas.enthalpy_mole  # J/kmol

    # Web Hreact (kJ total for 1 mol fuel basis)
    H_react_web = 0
    for sp, x in fuel_comp.items():
        H_react_web += x * web_enthalpy(sp, fuel_T)
    H_react_web += actual_o2 * web_enthalpy('O2', ox_T)
    if ox_type == 'air':
        n2_moles = actual_o2 * (0.7809/0.2095)
        ar_moles = actual_o2 * (0.0096/0.2095)
        H_react_web += n2_moles * web_enthalpy('N2', ox_T) + ar_moles * web_enthalpy('Ar', ox_T)

    # Convert Cantera to kJ total
    total_moles = sum(reactants.values())
    H_react_cantera_total_kJ = H_react_cantera * total_moles / 1e6  # J/kmol * kmol = J, /1e6 = kJ... wait
    # H_react_cantera is J/kmol = J/1000mol = 0.001 J/mol
    # total_moles is in mol
    # total_H_J = H_react_cantera * (total_moles / 1000)
    H_react_cantera_total_kJ = H_react_cantera * total_moles / 1e6

    print(f"\n=== {name} ===")
    print(f"Reactants: {reactants}")
    print(f"Total moles: {total_moles:.4f}")
    print(f"Cantera H_react (J/kmol): {H_react_cantera:.2f}")
    print(f"Cantera H_react total (kJ): {H_react_cantera_total_kJ:.2f}")
    print(f"Web H_react total (kJ): {H_react_web:.2f}")
    print(f"Diff: {H_react_web - H_react_cantera_total_kJ:.2f} kJ ({(H_react_web/H_react_cantera_total_kJ - 1)*100:.2f}%)")

    # Now check frozen enthalpy at a few temperatures
    n_c = sum(fuel_comp.get(sp,0) * (1 if sp in ['CO','CH4','C2H6','C3H8','C4H10','CO2'] else 0) for sp in fuel_comp)
    n_h = sum(fuel_comp.get(sp,0) * ({'H2':2,'CH4':4,'C2H6':6,'C3H8':8,'C4H10':10}.get(sp,0)) for sp in fuel_comp)
    n_o2_excess = actual_o2 - stoich_o2
    n_n2 = oxidizer.get('N2', 0) + fuel_comp.get('N2', 0)
    n_ar = oxidizer.get('AR', 0)

    frozen = {}
    if n_c > 0: frozen['CO2'] = n_c
    if n_h > 0: frozen['H2O'] = n_h / 2
    if n_o2_excess > 0: frozen['O2'] = n_o2_excess
    if n_n2 > 0: frozen['N2'] = n_n2
    if n_ar > 0: frozen['AR'] = n_ar

    for T_test in [1000, 2000, 3000, 4000]:
        gas.TPX = T_test, 101325, frozen
        H_frozen_cantera = gas.enthalpy_mole
        total_frozen_moles = sum(frozen.values())
        H_frozen_cantera_total_kJ = H_frozen_cantera * total_frozen_moles / 1e6

        H_frozen_web = 0
        if n_c > 0: H_frozen_web += n_c * web_enthalpy('CO2', T_test)
        if n_h > 0: H_frozen_web += (n_h/2) * web_enthalpy('H2O', T_test)
        if n_o2_excess > 0: H_frozen_web += n_o2_excess * web_enthalpy('O2', T_test)
        if n_n2 > 0: H_frozen_web += n_n2 * web_enthalpy('N2', T_test)
        if n_ar > 0: H_frozen_web += n_ar * web_enthalpy('Ar', T_test)

        print(f"  T={T_test}K: Cantera_frozen={H_frozen_cantera_total_kJ:.2f} kJ  Web_frozen={H_frozen_web:.2f} kJ  Diff={H_frozen_web - H_frozen_cantera_total_kJ:.2f}")

# Debug key cases
debug_case('C3H8_Air_0pct_25C', {'C3H8': 1.0}, 'air', 0, 25, 25)
debug_case('CH4_PureO2_6pct_0C', {'CH4': 1.0}, 'oxygen', 6, 0, 0)
debug_case('H2_PureO2_0pct_25C', {'H2': 1.0}, 'oxygen', 0, 25, 25)
debug_case('CH4_Air_0pct_25C', {'CH4': 1.0}, 'air', 0, 25, 25)
