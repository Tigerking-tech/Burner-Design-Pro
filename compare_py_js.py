import math

R = 0.008314  # kJ/mol/K

# H2O high temperature NASA coefficients
a = [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00]

T = 5000

# Python calculation
H_RT_py = a[0] + a[1]*T/2 + a[2]*T**2/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
H_py = R * T * H_RT_py

print(f"Python: T={T}")
print(f"  a[0] = {a[0]}")
print(f"  a[1]*T/2 = {a[1]*T/2}")
print(f"  a[2]*T**2/3 = {a[2]*T**2/3}")
print(f"  a[3]*T**3/4 = {a[3]*T**3/4}")
print(f"  a[4]*T**4/5 = {a[4]*T**4/5}")
print(f"  a[5]/T = {a[5]/T}")
print(f"  H_RT = {H_RT_py}")
print(f"  H = {H_py}")

# JS equivalent
T_js = 5000
H_RT_js = a[0] + a[1]*T_js/2 + a[2]*T_js*T_js/3 + a[3]*T_js*T_js*T_js/4 + a[4]*T_js*T_js*T_js*T_js/5 + a[5]/T_js
H_js = R * T_js * H_RT_js

print(f"\nJS equivalent:")
print(f"  H_RT = {H_RT_js}")
print(f"  H = {H_js}")

# Now with Cantera
import cantera as ct
gas = ct.Solution('gri30.yaml')
gas.TPX = T, 101325, {'H2O': 1.0}
H_cantera_J_per_kmol = gas.enthalpy_mole
H_cantera_kJ_per_mol = H_cantera_J_per_kmol / 1_000_000

print(f"\nCantera:")
print(f"  enthalpy_mole = {H_cantera_J_per_kmol} J/kmol")
print(f"  H = {H_cantera_kJ_per_mol} kJ/mol")

# Check what Cantera thinks H/RT is
H_RT_cantera = H_cantera_J_per_kmol / (8.314 * T * 1000)  # H/(R*T) dimensionless
print(f"  H/RT = {H_RT_cantera}")
