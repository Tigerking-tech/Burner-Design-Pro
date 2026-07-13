import cantera as ct

gas = ct.Solution('gri30.yaml')

# Get NASA coefficients from Cantera
sp = gas.species('H2O')
thermo = sp.thermo

# For NasaPoly2, coefficients are stored differently
# coeffs[0] = T_mid
# coeffs[1:8] = high temp coefficients a1-a7
# coeffs[8:15] = low temp coefficients a1-a7

c = thermo.coeffs
print(f"H2O Cantera coefficients ({len(c)} total):")
print(f"T_mid = {c[0]} K")
print(f"High temp (>{c[0]}K): a1-a7 = {c[1:8]}")
print(f"Low temp (<{c[0]}K): a1-a7 = {c[8:15]}")

print("\nOur coefficients:")
our_low = [4.19864056E+00, -2.03643410E-03, 6.52040211E-06, -5.48797062E-09, 1.77197817E-12, -3.02937267E+04, -8.49032208E-01]
our_high = [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00]
print(f"High temp: {our_high}")
print(f"Low temp: {our_low}")

# Compare
print("\nDifference (Cantera - Ours):")
for i in range(7):
    diff = c[1+i] - our_high[i]
    print(f"  a{i+1}: {diff:+.6e}")

# Check other species too
for sp_name in ['CO2', 'O2', 'N2', 'CH4', 'CO']:
    sp = gas.species(sp_name)
    c = sp.thermo.coeffs
    print(f"\n{sp_name} T_mid = {c[0]} K")
