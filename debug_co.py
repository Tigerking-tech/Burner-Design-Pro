import cantera as ct

R = 0.008314

def web_enthalpy(species, T):
    coeffs = {
        'CO2': {
            'low': [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222],
            'high': [3.85746029, 0.00441437026, -2.21481404e-06, 5.23490188e-10, -4.72084164e-14, -48759.166, 2.27163806]
        },
        'N2': {
            'low': [3.29867700, 0.00140824040, -3.96322200e-06, 5.64151500e-09, -2.44485400e-12, -1020.89990, 3.95037200],
            'high': [2.92664000, 0.00148797680, -5.68476000e-07, 1.00970300e-10, -6.75335100e-15, -922.79770, 5.98052800]
        },
        'O2': {
            'low': [3.78245636, -0.00299673416, 9.84730201e-06, -9.68129509e-09, 3.24372837e-12, -1063.94356, 3.65767573],
            'high': [3.28253784, 0.00148308754, -7.57966669e-07, 2.09470555e-10, -2.16717794e-14, -1088.45772, 5.45323129]
        },
        'CO': {
            'low': [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.0860, 3.50840928],
            'high': [2.71518561, 0.00206252743, -9.98825771e-07, 2.30053008e-10, -2.03647716e-14, -14151.8724, 7.81868772]
        },
        'Ar': {
            'low': [2.5, 0, 0, 0, 0, -745.375, 4.366],
            'high': [2.5, 0, 0, 0, 0, -745.375, 4.366]
        }
    }
    data = coeffs[species]
    a = data['low'] if T < 1000 else data['high']
    H_RT = a[0] + a[1]*T/2 + a[2]*T*T/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
    return R * T * H_RT

fuel_comp = {'CO': 1.0}
stoich_o2 = 0.5
actual_o2 = 0.5
oxidizer = {'O2': 0.5, 'N2': 0.5 * (0.7809/0.2095), 'AR': 0.5 * (0.0096/0.2095)}
reactants = {**fuel_comp, **oxidizer}

frozen_comp = {'CO2': 1, 'N2': oxidizer['N2'], 'AR': oxidizer['AR']}

gas = ct.Solution('gri30.yaml')

fuel_T = 298.15
gas.TPX = fuel_T, 101325, reactants
H_react_cantera = gas.enthalpy_mole
total_moles = sum(reactants.values())
H_react_cantera_total = H_react_cantera * total_moles / 1e6

H_react_web = (web_enthalpy('CO', fuel_T) +
               oxidizer['O2'] * web_enthalpy('O2', fuel_T) +
               oxidizer['N2'] * web_enthalpy('N2', fuel_T) +
               oxidizer['AR'] * web_enthalpy('Ar', fuel_T))

print(f"H_react: Cantera={H_react_cantera_total:.3f} kJ  Web={H_react_web:.3f} kJ  Diff={H_react_web - H_react_cantera_total:.3f}")

for T in [1000, 1500, 2000, 2500, 3000]:
    gas.TPX = T, 101325, frozen_comp
    H_frozen_cantera = gas.enthalpy_mole
    total_frozen = sum(frozen_comp.values())
    H_frozen_cantera_total = H_frozen_cantera * total_frozen / 1e6

    H_frozen_web = (1 * web_enthalpy('CO2', T) +
                    oxidizer['N2'] * web_enthalpy('N2', T) +
                    oxidizer['AR'] * web_enthalpy('Ar', T))

    diff = H_frozen_web - H_frozen_cantera_total
    print(f"T={T}K: Cantera_frozen={H_frozen_cantera_total:.3f} kJ  Web_frozen={H_frozen_web:.3f} kJ  Diff={diff:.3f}")

# Cantera frozen T
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

# Web frozen T
def web_frozen_total(T):
    return (1 * web_enthalpy('CO2', T) +
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
