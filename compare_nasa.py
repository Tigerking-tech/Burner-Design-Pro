import cantera as ct
import math

gas = ct.Solution('gri30.yaml')

# Compare NASA coefficients for key species
species_to_check = ['NO', 'OH', 'O2', 'H2', 'CO', 'CO2', 'H2O', 'N2']

print("Comparing thermodynamic properties at T=2225K (CH4+Air flame temp)")
print("="*80)

T = 2225.0  # K

for sp_name in species_to_check:
    sp = gas.species(sp_name)
    if sp is None:
        print(f"{sp_name}: NOT FOUND")
        continue
    
    # Get Cantera's Cp/R, H/RT, S/R at temperature T
    gas.TPX = T, 101325, {sp_name: 1.0}
    
    # Cantera's values
    cp_R = gas.cp_mole / (8.314)  # Cp/R
    h_RT = gas.enthalpy_mole / (8.314 * T)  # H/(RT)
    s_R = gas.entropy_mole / 8.314  # S/R
    mu_RT = h_RT - s_R  # μ/(RT) = H/(RT) - S/R
    
    print(f"\n{sp_name} at T={T}K:")
    print(f"  Cantera: Cp/R={cp_R:.6f}, H/RT={h_RT:.6f}, S/R={s_R:.6f}, μ/RT={mu_RT:.6f}")

# Now let's check: does our simplified equilibrium (10 species only) miss important species?
print("\n\n" + "="*80)
print("Checking what species Cantera includes in equilibrium that we don't")
print("="*80)

# CH4 + Air stoichiometric equilibrium
gas.TPX = 298.15, 101325, {'CH4': 1, 'O2': 2, 'N2': 7.52}
gas.equilibrate('HP')

print(f"\nEquilibrium T = {gas.T:.1f} K")
print(f"\nAll species with X > 1e-6:")
for i, sp in enumerate(gas.species_names):
    if gas.X[i] > 1e-6:
        in_our = sp in ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO']
        marker = "✓" if in_our else "✗ MISSING"
        print(f"  {sp:8s}: X={gas.X[i]*100:10.6f}%  {marker}")

# Check NO specifically - look at the NASA polynomial source
print("\n\n" + "="*80)
print("NO thermodynamic data comparison")
print("="*80)

# Our NASA coefficients for NO
our_nasa_low = [4.21859896E+00, -4.63988124E-03, 1.10443049E-05, -9.34055507E-09, 2.77256731E-12, 9.83572000E+03, 2.28061000E+00]
our_nasa_high = [3.26060534E+00, 1.19110431E-03, -4.29170487E-07, 6.94588191E-11, -3.89803100E-15, 9.92143120E+03, 6.57240900E+00]

# Compute H/RT and S/R using our coefficients at T=2225K
a = our_nasa_high  # T > 1000
T_val = 2225.0
H_RT_our = a[0] + a[1]*T_val/2 + a[2]*T_val**2/3 + a[3]*T_val**3/4 + a[4]*T_val**4/5 + a[5]/T_val
S_R_our = a[0]*math.log(T_val) + a[1]*T_val + a[2]*T_val**2/2 + a[3]*T_val**3/3 + a[4]*T_val**4/4 + a[6]

gas.TPX = T_val, 101325, {'NO': 1.0}
H_RT_cantera = gas.enthalpy_mole / (8.314 * T_val)
S_R_cantera = gas.entropy_mole / 8.314

print(f"\nAt T = {T_val} K:")
print(f"  Our code:    H/RT = {H_RT_our:.6f},  S/R = {S_R_our:.6f},  μ/RT = {H_RT_our - S_R_our:.6f}")
print(f"  Cantera:     H/RT = {H_RT_cantera:.6f},  S/R = {S_R_cantera:.6f},  μ/RT = {H_RT_cantera - S_R_cantera:.6f}")
print(f"  Diff:        H/RT = {abs(H_RT_our - H_RT_cantera):.6f},  S/R = {abs(S_R_our - S_R_cantera):.6f}")

# Let's also check NO2
print("\n\nNO2 check:")
gas.TPX = T_val, 101325, {'NO2': 1.0}
print(f"  Cantera NO2 at {T_val}K: H/RT = {gas.enthalpy_mole/(8.314*T_val):.6f}, S/R = {gas.entropy_mole/8.314:.6f}")

# Now compute what our equilibrium gives with the CORRECT thermodynamic data
# The key issue: we only have 10 species but Cantera considers ALL GRI-Mech species
# Missing species like NO2, H2O2, HO2, N2O, N, NH, NH2, NH3 at equilibrium
# could affect the NO balance

# Let's check how much these missing species matter
gas.TPX = 298.15, 101325, {'CH4': 1, 'O2': 2, 'N2': 7.52}
gas.equilibrate('HP')

print(f"\n\nNitrogen-containing species at CH4+Air equilibrium ({gas.T:.1f} K):")
for i, sp in enumerate(gas.species_names):
    if gas.X[i] > 1e-10 and ('N' in gas.species(sp).composition):
        print(f"  {sp:8s}: X={gas.X[i]*100:12.8f}%  (N atoms: {gas.species(sp).composition.get('N', 0)})")

# Total nitrogen atom balance
total_N = sum(gas.X[i] * gas.species(sp).composition.get('N', 0) for i, sp in enumerate(gas.species_names))
print(f"\n  Total N atoms: {total_N:.6f}")

# N in our 10 species only
our_species = ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO']
N_in_ours = sum(gas.X[gas.species_index(sp)] * gas.species(sp).composition.get('N', 0) for sp in our_species)
N_in_missing = total_N - N_in_ours
print(f"  N in our 10 species: {N_in_ours:.6f}")
print(f"  N in missing species: {N_in_missing:.6f}")
print(f"  Missing N fraction: {N_in_missing/total_N*100:.4f}%")
