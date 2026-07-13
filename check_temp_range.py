import cantera as ct

R = 8.314  # J/mol/K

# Our NASA high temp coefficients for H2O
a = [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00]

def our_H_RT(T):
    return a[0] + a[1]*T/2 + a[2]*T**2/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T

def our_H(T):
    return (R/1000) * T * our_H_RT(T)

gas = ct.Solution('gri30.yaml')

print("Temperature comparison for H2O:")
print("T(K)    Our H/RT   Cantera H/RT   Our H(kJ/mol)  Cantera H(kJ/mol)  Diff(%)")
print("-" * 90)

for T in [298, 500, 1000, 1500, 2000, 2225, 2500, 3000, 4000, 5000, 6000]:
    gas.TPX = T, 101325, {'H2O': 1.0}
    H_cantera_J_per_kmol = gas.enthalpy_mole
    H_cantera_kJ_per_mol = H_cantera_J_per_kmol / 1_000_000
    H_RT_cantera = H_cantera_J_per_kmol / (R * T * 1000)

    H_ours = our_H(T)
    H_RT_ours = our_H_RT(T)

    diff_pct = abs(H_ours - H_cantera_kJ_per_mol) / abs(H_cantera_kJ_per_mol) * 100 if H_cantera_kJ_per_mol != 0 else 0

    marker = "✓" if diff_pct < 1 else "✗"
    print(f"{T:4d}    {H_RT_ours:10.6f}   {H_RT_cantera:10.6f}      {H_ours:10.2f}      {H_cantera_kJ_per_mol:10.2f}         {diff_pct:6.2f}% {marker}")

# Also check Cantera's polynomial coefficients directly
print("\n\nCantera NASA coefficients for H2O:")
sp = gas.species('H2O')
thermo = sp.thermo
print(f"Type: {thermo.type}")
print(f"Temperature ranges: {thermo.min_temp} - {thermo.max_temp} K")
print(f"Mid temperature: {thermo._t_mid} K")

# Get coefficients
coeffs = thermo.coeffs
print(f"Number of coefficients: {len(coeffs)}")
print(f"Coefficients: {coeffs}")
