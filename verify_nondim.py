import cantera as ct
import math

gas = ct.Solution('gri30.yaml')

# Compare dimensionless thermodynamic properties at T=2225K
# Using R_specific = 8.314 J/(mol·K), our code uses R = 0.008314 kJ/(mol·K)
# So our code's H = R*T * H_RT = 0.008314 * T * H_RT [kJ/mol]
# Cantera's H = R_cantera * T * H_RT = 8.314 * T * H_RT [J/mol]
# The H_RT should be the same (dimensionless)

species_to_check = ['NO', 'OH', 'O2', 'H2', 'CO', 'CO2', 'H2O', 'N2', 'H', 'O']

T = 2225.0  # K

print("Comparing dimensionless H/RT and S/R at T=2225K")
print("="*80)

# Our NASA coefficients
our_nasa = {
  'CO2': { 'high': [3.85746029E+00, 4.41437026E-03, -2.21481404E-06, 5.23490188E-10, -4.72084164E-14, -4.87591660E+04, 2.27168103E+00] },
  'H2O': { 'high': [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00] },
  'N2':  { 'high': [2.92664000E+00, 1.48797680E-03, -5.68476000E-07, 1.00970300E-10, -6.75335100E-15, -9.22797700E+02, 5.98052800E+00] },
  'O2':  { 'high': [3.28253784E+00, 1.48308754E-03, -7.57966669E-07, 2.09470555E-10, -2.16717794E-14, -1.08845772E+03, 5.45323129E+00] },
  'CO':  { 'high': [2.71518561E+00, 2.06252743E-03, -9.98825771E-07, 2.30053008E-10, -2.03647716E-14, -1.41518724E+04, 7.81868772E+00] },
  'H2':  { 'high': [3.33727920E+00, -4.94024731E-05, 4.99456778E-07, -1.79566394E-10, 2.00255376E-14, -9.50158922E+02, -3.20502331E+00] },
  'OH':  { 'high': [3.09288767E+00, 5.48429716E-04, 1.26505228E-07, -8.79461556E-11, 1.17481976E-14, 3.85865704E+03, 4.47669610E+00] },
  'O':   { 'high': [2.56942078E+00, -8.59741137E-05, 4.19484586E-08, -1.00177799E-11, 1.22833691E-15, 2.92175791E+04, 4.78433864E+00] },
  'H':   { 'high': [2.50000000E+00, 7.05332819E-13, -1.99592064E-15, 2.30081632E-18, -9.27732332E-22, 2.54736599E+04, -4.46682914E-01] },
  'NO':  { 'high': [3.26060534E+00, 1.19110431E-03, -4.29170487E-07, 6.94588191E-11, -3.89803100E-15, 9.92143120E+03, 6.57240900E+00] },
}

for sp_name in species_to_check:
    gas.TPX = T, 101325, {sp_name: 1.0}
    
    # Cantera dimensionless values
    H_RT_cantera = gas.enthalpy_mole / (8.314 * T)
    S_R_cantera = gas.entropy_mole / 8.314
    mu_RT_cantera = H_RT_cantera - S_R_cantera
    
    # Our values
    a = our_nasa[sp_name]['high']
    H_RT_our = a[0] + a[1]*T/2 + a[2]*T**2/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
    S_R_our = a[0]*math.log(T) + a[1]*T + a[2]*T**2/2 + a[3]*T**3/3 + a[4]*T**4/4 + a[6]
    mu_RT_our = H_RT_our - S_R_our
    
    print(f"\n{sp_name}:")
    print(f"  Our:     H/RT={H_RT_our:12.6f}  S/R={S_R_our:12.6f}  μ/RT={mu_RT_our:12.6f}")
    print(f"  Cantera: H/RT={H_RT_cantera:12.6f}  S/R={S_R_cantera:12.6f}  μ/RT={mu_RT_cantera:12.6f}")
    print(f"  Diff:    ΔH/RT={H_RT_our-H_RT_cantera:12.6f}  ΔS/R={S_R_our-S_R_cantera:12.6f}  Δμ/RT={mu_RT_our-mu_RT_cantera:12.6f}")

# The key test: can we reproduce Cantera's equilibrium with our 10 species only?
print("\n\n" + "="*80)
print("KEY TEST: Cantera equilibrium with restricted 10-species set")
print("="*80)

# Use Cantera with only our 10 species
gas2 = ct.Solution('gri30.yaml')
# We need to restrict to 10 species - Cantera doesn't easily do this
# But we can verify by checking: at the same T, what mole fractions does 
# the element potential method give for 10 species?

# At T=2224.6K (Cantera's equilibrium temperature for CH4+Air),
# with element potentials from Cantera's full equilibrium,
# what does our simplified model predict?

gas.TPX = 298.15, 101325, {'CH4': 1, 'O2': 2, 'N2': 7.52}
gas.equilibrate('HP')
T_eq = gas.T

# Get element potentials from Cantera
mu_species = {}
for sp_name in species_to_check:
    gas.TPX = T_eq, 101325, {sp_name: 1.0}
    mu_species[sp_name] = gas.gibbs_mole  # J/mol

# Element potentials from Cantera
# For N2: μ_N2 = 2*λ_N (per mole of N2)
# For O2: μ_O2 = 2*λ_O
# etc.
print(f"\nAt T = {T_eq:.1f} K:")
print(f"\nChemical potentials (J/mol):")
for sp, mu in mu_species.items():
    print(f"  {sp}: {mu:.2f}")

# Now: if we use our code's thermodynamic data but solve at T_eq,
# what products do we get?
print(f"\n\nChecking our equilibrium at T_eq = {T_eq:.1f} K:")

# Element balance for CH4 + Air stoichiometric
# 1 mol CH4 + 2 mol O2 + 7.52 mol N2
b = {'c': 1.0, 'h': 4.0, 'o': 4.0, 'n': 15.04}

# Run our algorithm at T_eq
R_code = 0.008314  # kJ/(mol·K)

def our_chem_potential(sp, T):
    a = our_nasa[sp]['high']
    H_RT = a[0] + a[1]*T/2 + a[2]*T**2/3 + a[3]*T**3/4 + a[4]*T**4/5 + a[5]/T
    S_R = a[0]*math.log(T) + a[1]*T + a[2]*T**2/2 + a[3]*T**3/3 + a[4]*T**4/4 + a[6]
    return R_code * T * (H_RT - S_R)  # kJ/mol

print(f"\nChemical potential comparison (kJ/mol) at T = {T_eq:.1f} K:")
for sp in species_to_check:
    our_mu = our_chem_potential(sp, T_eq)
    cantera_mu = mu_species[sp] / 1000  # J/mol -> kJ/mol
    diff = our_mu - cantera_mu
    print(f"  {sp}: Our={our_mu:12.4f}  Cantera={cantera_mu:12.4f}  Diff={diff:12.4f}")
