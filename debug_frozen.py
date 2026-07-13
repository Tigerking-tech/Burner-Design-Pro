import cantera as ct
import math

R = 0.008314

def web_enthalpy(species, T):
    coeffs = {
        'CO2': {
            'low': [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222],
            'high': [3.85746029, 0.00441437026, -2.21481404e-06, 5.23490188e-10, -4.72084164e-14, -48759.166, 2.27163806]
        },
        'H2O': {
            'low': [4.19864056, -0.00203643410, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -30293.7267, -0.849032208],
            'high': [3.03399249, 0.00217691804, -1.64072518e-07, -9.70419870e-12, 1.68200992e-15, -30004.2971, 4.96677010]
        },
        'N2': {
            'low': [3.29867700, 0.00140824040, -3.96322200e-06, 5.64151500e-09, -2.44485400e-12, -1020.89990, 3.95037200],
            'high': [2.92664000, 0.00148797680, -5.68476000e-07, 1.00970300e-10, -6.75335100e-15, -922.79770, 5.98052800]
        },
        'O2': {
            'low': [3.78245636, -0.00299673416, 9.84730201e-06, -9.68129509e-09, 3.24372837e-12, -1063.94356, 3.65767573],
            'high': [3.28253784, 0.00148308754, -7.57966669e-07, 2.09470555e-10, -2.16717794e-14, -1088.45772, 5.45323129]
        },
        'Ar': {
            'low': [2.5, 0, 0, 0, 0, -745.375, 4.366],
            'high': [2.5, 0, 0, 0, 0, -745.375, 4.366]
        },
        'C3H8': {
            'low': [0.93355381, 0.026424579, 6.1059727e-06, -2.1977499e-08, 9.5149253e-12, -13958.52, 19.201691],
            'high': [7.53409, 0.01887222, -6.4698740e-06, 9.30286e-10, -4.9490770e-14, -16457.105, -17.17237]
        }
    }
    data = coeffs[species]
    a = data['low'] if T < 1000 else data['high']
    H_RT = a[0] + a[1]*T/2 + a[2]*T*T/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
    return R * T * H_RT

# C3H8 + Air, stoichiometric
fuel_comp = {'C3H8': 1.0}
stoich_o2 = 5.0
actual_o2 = 5.0
oxidizer = {'O2': 5, 'N2': 5 * (0.7809/0.2095), 'AR': 5 * (0.0096/0.2095)}
reactants = {**fuel_comp, **oxidizer}

frozen_comp = {'CO2': 3, 'H2O': 4, 'N2': oxidizer['N2'], 'AR': oxidizer['AR']}

gas = ct.Solution('gri30.yaml')

# H_react comparison
fuel_T = 298.15
gas.TPX = fuel_T, 101325, reactants
H_react_cantera = gas.enthalpy_mole  # J/kmol
total_moles = sum(reactants.values())
H_react_cantera_total = H_react_cantera * total_moles / 1e6  # kJ total

H_react_web = (web_enthalpy('C3H8', fuel_T) +
               oxidizer['O2'] * web_enthalpy('O2', fuel_T) +
               oxidizer['N2'] * web_enthalpy('N2', fuel_T) +
               oxidizer['AR'] * web_enthalpy('Ar', fuel_T))

print(f"H_react: Cantera={H_react_cantera_total:.3f} kJ  Web={H_react_web:.3f} kJ  Diff={H_react_web - H_react_cantera_total:.3f}")

# Frozen enthalpy comparison at various temperatures
for T in [1000, 1500, 1811, 2000, 2500, 3000]:
    gas.TPX = T, 101325, frozen_comp
    H_frozen_cantera = gas.enthalpy_mole
    total_frozen = sum(frozen_comp.values())
    H_frozen_cantera_total = H_frozen_cantera * total_frozen / 1e6

    H_frozen_web = (3 * web_enthalpy('CO2', T) +
                    4 * web_enthalpy('H2O', T) +
                    oxidizer['N2'] * web_enthalpy('N2', T) +
                    oxidizer['AR'] * web_enthalpy('Ar', T))

    diff = H_frozen_web - H_frozen_cantera_total
    print(f"T={T}K: Cantera_frozen={H_frozen_cantera_total:.3f} kJ  Web_frozen={H_frozen_web:.3f} kJ  Diff={diff:.3f}")

# Cantera frozen T search
gas_frozen = ct.Solution('gri30.yaml')
gas_frozen.TPX = fuel_T, 101325, reactants
H_react = gas_frozen.enthalpy_mole

T_low, T_high = 300, 8000
for _ in range(100):
    T_mid = (T_low + T_high) / 2
    gas_frozen.TPX = T_mid, 101325, frozen_comp
    if gas_frozen.enthalpy_mole > H_react:
        T_high = T_mid
    else:
        T_low = T_mid
T_frozen = (T_low + T_high) / 2
print(f"\nCantera Frozen T = {T_frozen - 273.15:.1f}°C")

# Web frozen T search (binary search on total enthalpy)
def web_frozen_total(T):
    return (3 * web_enthalpy('CO2', T) +
            4 * web_enthalpy('H2O', T) +
            oxidizer['N2'] * web_enthalpy('N2', T) +
            oxidizer['AR'] * web_enthalpy('Ar', T))

T_low, T_high = 300, 4000
for _ in range(200):
    T_mid = (T_low + T_high) / 2
    H_mid = web_frozen_total(T_mid)
    if H_mid > H_react_web:
        T_high = T_mid
    else:
        T_low = T_mid
T_frozen_web = (T_low + T_high) / 2
print(f"Web Frozen T = {T_frozen_web - 273.15:.1f}°C")
