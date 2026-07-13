import cantera as ct

R = 8.314  # J/mol/K

gas = ct.Solution('gri30.yaml')

species = ['CH4', 'O2', 'CO2', 'H2O', 'N2']
T = 5000  # K

print(f"Enthalpy comparison at T = {T} K")
print("="*60)

for sp in species:
    gas.TPX = T, 101325, {sp: 1.0}
    h_cantera = gas.enthalpy_mole / 1000  # kJ/mol
    
    # Our NASA coefficients (high temp)
    nasa = {
        'CH4': [7.48514950E-02, 1.33909467E-02, -5.73285809E-06, 1.22292535E-09, -1.01815230E-13, -9.46834459E+03, 1.84373180E+01],
        'O2': [3.28253784E+00, 1.48308754E-03, -7.57966669E-07, 2.09470555E-10, -2.16717794E-14, -1.08845772E+03, 5.45323129E+00],
        'CO2': [3.85746029E+00, 4.41437026E-03, -2.21481404E-06, 5.23490188E-10, -4.72084164E-14, -4.87591660E+04, 2.27168103E+00],
        'H2O': [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00],
        'N2': [2.92664000E+00, 1.48797680E-03, -5.68476000E-07, 1.00970300E-10, -6.75335100E-15, -9.22797700E+02, 5.98052800E+00],
    }
    a = nasa[sp]
    H_RT = a[0] + a[1]*T/2 + a[2]*T**2/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
    h_ours = (R/1000) * T * H_RT  # kJ/mol
    
    print(f"{sp:6s}: Our={h_ours:10.2f}  Cantera={h_cantera:10.2f}  Diff={h_ours-h_cantera:8.2f}")

# Now verify frozen temperature calculation directly
print(f"\n\nFrozen T verification for CH4 + Pure O2 (6% excess, 0°C)")
print("="*60)

fuel_T = 273.15

# Reactants enthalpy
gas.TPX = fuel_T, 101325, {'CH4': 1, 'O2': 2.12}
H_react = gas.enthalpy_mole / 1000  # kJ/mol of mixture
print(f"Reactant H at {fuel_T}K = {H_react:.4f} kJ/mol")

# Frozen products
frozen_comp = {'CO2': 1, 'H2O': 2, 'O2': 0.12}

# Binary search
def frozen_h(T):
    gas.TPX = T, 101325, frozen_comp
    return gas.enthalpy_mole / 1000

T_low, T_high = 300, 8000
for _ in range(100):
    T_mid = (T_low + T_high) / 2
    if frozen_h(T_mid) > H_react:
        T_high = T_mid
    else:
        T_low = T_mid

T_frozen = (T_low + T_high) / 2
print(f"Cantera Frozen T = {T_frozen:.1f} K = {T_frozen-273.15:.1f} °C")

# Our calculation
R_code = 0.008314

def enthalpy(sp, T):
    a = nasa[sp]
    H_RT = a[0] + a[1]*T/2 + a[2]*T**2/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
    return R_code * T * H_RT

H_react_ours = enthalpy('CH4', fuel_T) + 2.12 * enthalpy('O2', fuel_T)
print(f"\nOur Reactant H at {fuel_T}K = {H_react_ours:.4f} kJ")

def frozen_h_ours(T):
    return enthalpy('CO2', T) + 2 * enthalpy('H2O', T) + 0.12 * enthalpy('O2', T)

T_low, T_high = 300, 8000
for _ in range(100):
    T_mid = (T_low + T_high) / 2
    if frozen_h_ours(T_mid) > H_react_ours:
        T_high = T_mid
    else:
        T_low = T_mid

T_frozen_ours = (T_low + T_high) / 2
print(f"Our Frozen T = {T_frozen_ours:.1f} K = {T_frozen_ours-273.15:.1f} °C")

# Difference at T_frozen_ours
print(f"\nAt T = {T_frozen_ours:.1f} K:")
print(f"  Cantera products H = {frozen_h(T_frozen_ours):.4f} kJ/mol")
print(f"  Our products H = {frozen_h_ours(T_frozen_ours):.4f} kJ")
print(f"  Cantera reactant H = {H_react:.4f} kJ/mol")
print(f"  Our reactant H = {H_react_ours:.4f} kJ")
