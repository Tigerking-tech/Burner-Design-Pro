#!/usr/bin/env python3
"""Generate reference flame temperatures using Cantera."""
import cantera as ct
import json

def compute_aft(gas, fuel_str, ox_str, excess_pct=0.0, T_fuel=298.15, T_ox=298.15, P=ct.one_atm):
    """Compute AFT with given excess oxygen percent."""
    # Get molecular weights
    gas.TPX = T_fuel, P, fuel_str
    mw_fuel = gas.mean_molecular_weight
    fuel_moles = gas.mole_fraction_dict()

    gas.TPX = T_ox, P, ox_str
    mw_ox = gas.mean_molecular_weight
    ox_moles = gas.mole_fraction_dict()

    # Elemental composition per mole of fuel
    gas.TPX = T_fuel, P, fuel_str
    el_names = gas.element_names
    fuel_el_moles = {el: gas.elemental_mass_fraction(gas.element_index(el)) * mw_fuel / gas.atomic_weights[gas.element_index(el)]
                     for el in el_names}

    # Elemental composition per mole of oxidizer
    gas.TPX = T_ox, P, ox_str
    ox_el_moles = {el: gas.elemental_mass_fraction(gas.element_index(el)) * mw_ox / gas.atomic_weights[gas.element_index(el)]
                   for el in el_names}

    # Stoichiometric oxidizer moles per mole fuel
    C = fuel_el_moles.get('C', 0)
    H = fuel_el_moles.get('H', 0)
    O_fuel = fuel_el_moles.get('O', 0)
    S = fuel_el_moles.get('S', 0)
    N_fuel = fuel_el_moles.get('N', 0)

    O_needed = 2*C + H/2 + 2*S - O_fuel
    O_per_ox = ox_el_moles.get('O', 0)
    n_ox_stoich = O_needed / O_per_ox if O_per_ox > 0 else 0

    n_ox_actual = n_ox_stoich * (1 + excess_pct / 100.0)

    # Mixture mole fractions
    total = 1.0 + n_ox_actual
    mix = {}
    for sp, x in fuel_moles.items():
        mix[sp] = x * 1.0 / total
    for sp, x in ox_moles.items():
        mix[sp] = mix.get(sp, 0) + x * n_ox_actual / total
    s = sum(mix.values())
    mix = {k: v/s for k, v in mix.items()}

    # Equilibrium AFT at constant pressure
    gas.TPX = T_ox, P, mix
    gas.equilibrate('HP')
    T_eq = gas.T

    # Frozen AFT: complete combustion products with same enthalpy as reactants
    gas.TPX = T_ox, P, mix
    H_react = gas.enthalpy_mole

    # Elemental moles per mole of mixture
    gas.TPX = T_ox, P, mix
    mix_el_moles = {el: gas.elemental_mass_fraction(gas.element_index(el)) * gas.mean_molecular_weight / gas.atomic_weights[gas.element_index(el)]
                    for el in el_names}
    Cm = mix_el_moles.get('C', 0)
    Hm = mix_el_moles.get('H', 0)
    Om = mix_el_moles.get('O', 0)
    Nm = mix_el_moles.get('N', 0)
    Sm = mix_el_moles.get('S', 0)

    n_co2 = Cm
    n_h2o = Hm / 2
    n_so2 = Sm
    n_n2 = Nm / 2
    o_used = 2*n_co2 + n_h2o + 2*n_so2
    n_o2_excess = max(0, (Om - o_used) / 2)
    frozen_mix = {'CO2': n_co2, 'H2O': n_h2o, 'O2': n_o2_excess, 'N2': n_n2}
    if Sm > 0:
        frozen_mix['SO2'] = n_so2
    total_frozen = sum(frozen_mix.values())
    frozen_mix = {k: v/total_frozen for k, v in frozen_mix.items()}

    def enthalpy_diff(T):
        gas.TPX = T, P, frozen_mix
        return gas.enthalpy_mole - H_react

    T_low, T_high = 300, 6000
    for _ in range(100):
        T_mid = (T_low + T_high) / 2
        d = enthalpy_diff(T_mid)
        if d > 0:
            T_high = T_mid
        else:
            T_low = T_mid
        if T_high - T_low < 0.1:
            break
    T_frozen = (T_low + T_high) / 2

    return {
        'T_eq_K': T_eq,
        'T_eq_C': T_eq - 273.15,
        'T_frozen_K': T_frozen,
        'T_frozen_C': T_frozen - 273.15,
        'composition': {sp: gas.mole_fraction_dict().get(sp, 0) for sp in gas.species_names if gas.mole_fraction_dict().get(sp, 0) > 1e-6}
    }

# Reference cases matching frontend capabilities
gas = ct.Solution('gri30.yaml')

cases = [
    ('H2/air stoich', 'H2:1', 'O2:0.21, N2:0.79', 0.0),
    ('CH4/air stoich', 'CH4:1', 'O2:0.21, N2:0.79', 0.0),
    ('CO/air stoich', 'CO:1', 'O2:0.21, N2:0.79', 0.0),
    ('C3H8/air stoich', 'C3H8:1', 'O2:0.21, N2:0.79', 0.0),
    ('H2/O2 stoich', 'H2:1', 'O2:1', 0.0),
    ('CH4/O2 stoich', 'CH4:1', 'O2:1', 0.0),
    ('CO/O2 stoich', 'CO:1', 'O2:1', 0.0),
    ('CH4/air 10% excess', 'CH4:1', 'O2:0.21, N2:0.79', 10.0),
    ('H2/air 10% excess', 'H2:1', 'O2:0.21, N2:0.79', 10.0),
]

results = {}
for name, fuel, ox, excess in cases:
    try:
        r = compute_aft(gas, fuel, ox, excess)
        results[name] = r
        print(f"{name}: T_eq={r['T_eq_C']:.1f}C, T_frozen={r['T_frozen_C']:.1f}C")
    except Exception as e:
        import traceback
        print(f"{name}: ERROR {e}")
        traceback.print_exc()

with open('cantera_reference.json', 'w') as f:
    json.dump(results, f, indent=2)
