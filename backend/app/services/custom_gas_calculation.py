from app.models.custom_gas import (
    GasCompositionInput,
    CustomGasCalculationInput,
    CustomGasCalculationResult,
    GAS_PROPERTIES,
    AIR_MOLAR_MASS,
    AIR_DENSITY,
    AIR_O2_FRACTION,
)


def calculate_custom_gas_composition(gas_comp: GasCompositionInput) -> dict:
    """
    Calculate properties of custom gas mixture.
    Normalizes percentages to 100% if not already.
    """
    gas_dict = gas_comp.model_dump()

    # Calculate total volume percentage
    total = sum(gas_dict.values())

    # Normalize if total is not 100%
    if total == 0:
        # Default to 100% CH4
        gas_dict = {key: 0.0 for key in gas_dict}
        gas_dict["CH4"] = 100.0
    elif abs(total - 100) > 0.1:
        gas_dict = {key: (value / total) * 100 for key, value in gas_dict.items()}

    return gas_dict


class GasReactionData:
    """Data class for gas reaction parameters"""
    def __init__(self, o2_per_mol: float, co2_per_mol: float, h2o_per_mol: float,
                 lhv_kJ_per_kmol: float, molar_mass: float):
        self.o2_per_mol = o2_per_mol
        self.co2_per_mol = co2_per_mol
        self.h2o_per_mol = h2o_per_mol
        self.lhv_kJ_per_kmol = lhv_kJ_per_kmol
        self.molar_mass = molar_mass


# Reaction data for each gas (kmol basis)
GAS_REACTIONS = {
    "H2": GasReactionData(o2_per_mol=0.5, co2_per_mol=0.0, h2o_per_mol=1.0,
                          lhv_kJ_per_kmol=241800, molar_mass=2.016),
    "CO": GasReactionData(o2_per_mol=0.5, co2_per_mol=1.0, h2o_per_mol=0.0,
                          lhv_kJ_per_kmol=283000, molar_mass=28.010),
    "CH4": GasReactionData(o2_per_mol=2.0, co2_per_mol=1.0, h2o_per_mol=2.0,
                          lhv_kJ_per_kmol=802300, molar_mass=16.042),
    "C2H6": GasReactionData(o2_per_mol=3.5, co2_per_mol=2.0, h2o_per_mol=3.0,
                          lhv_kJ_per_kmol=1428000, molar_mass=30.069),
    "C3H8": GasReactionData(o2_per_mol=5.0, co2_per_mol=3.0, h2o_per_mol=4.0,
                          lhv_kJ_per_kmol=2044000, molar_mass=44.096),
    "C4H10": GasReactionData(o2_per_mol=6.5, co2_per_mol=4.0, h2o_per_mol=5.0,
                          lhv_kJ_per_kmol=2658000, molar_mass=58.123),
    "C5H12": GasReactionData(o2_per_mol=8.0, co2_per_mol=5.0, h2o_per_mol=6.0,
                          lhv_kJ_per_kmol=3272000, molar_mass=72.150),
    "C6H14": GasReactionData(o2_per_mol=9.5, co2_per_mol=6.0, h2o_per_mol=7.0,
                          lhv_kJ_per_kmol=3886000, molar_mass=86.177),
    "C7H16": GasReactionData(o2_per_mol=11.0, co2_per_mol=7.0, h2o_per_mol=8.0,
                          lhv_kJ_per_kmol=4500000, molar_mass=100.204),
    "C2H4": GasReactionData(o2_per_mol=3.0, co2_per_mol=2.0, h2o_per_mol=2.0,
                          lhv_kJ_per_kmol=1323000, molar_mass=28.054),
    "C3H6": GasReactionData(o2_per_mol=4.5, co2_per_mol=3.0, h2o_per_mol=3.0,
                          lhv_kJ_per_kmol=1927000, molar_mass=42.080),
    "C2H2": GasReactionData(o2_per_mol=2.5, co2_per_mol=2.0, h2o_per_mol=1.0,
                          lhv_kJ_per_kmol=1256000, molar_mass=26.038),
    "N2": GasReactionData(o2_per_mol=0.0, co2_per_mol=0.0, h2o_per_mol=0.0,
                          lhv_kJ_per_kmol=0.0, molar_mass=28.014),
    "CO2": GasReactionData(o2_per_mol=0.0, co2_per_mol=1.0, h2o_per_mol=0.0,
                          lhv_kJ_per_kmol=0.0, molar_mass=44.010),
    "O2": GasReactionData(o2_per_mol=-1.0, co2_per_mol=0.0, h2o_per_mol=0.0,
                          lhv_kJ_per_kmol=0.0, molar_mass=32.000),
}


def calculate_gas_properties(gas_comp_normalized: dict) -> tuple:
    """
    Calculate density, relative density, LHV, and minimum air requirement.
    Uses accurate stoichiometric calculations.
    """
    total_molar_mass = 0.0
    total_lhv_kJ_per_kmol = 0.0
    total_o2_required = 0.0

    for gas_name, vol_percent in gas_comp_normalized.items():
        if vol_percent == 0:
            continue

        mole_fraction = vol_percent / 100.0
        rxn_data = GAS_REACTIONS[gas_name]

        total_molar_mass += mole_fraction * rxn_data.molar_mass
        total_lhv_kJ_per_kmol += mole_fraction * rxn_data.lhv_kJ_per_kmol
        total_o2_required += mole_fraction * rxn_data.o2_per_mol

    # Calculate density (kg/m³ at 0°C, 1 bar)
    # Using molar volume: 22.414 m³/kmol at STP
    density = total_molar_mass / 22.414

    # Relative density (air density = 1.205 kg/m³)
    relative_density = density / AIR_DENSITY

    # Lower heating value (convert from kJ/kmol to kWh/m³)
    # 1 kWh = 3600 kJ, so 1 kJ/kmol = (1/3600) kWh/kmol
    # And 1 kmol = 22.414 m³, so 1 kJ/kmol = (1/(3600*22.414)) kWh/m³
    lower_heating_value_kJ_per_m3 = total_lhv_kJ_per_kmol / 22.414
    lower_heating_value = lower_heating_value_kJ_per_m3 / 3600.0

    # Calculate minimum air requirement (stoichiometric)
    # Air is 21% O2, so air = O2 / 0.21
    minimum_air_requirement = total_o2_required / AIR_O2_FRACTION if AIR_O2_FRACTION > 0 else 0.0

    return density, relative_density, lower_heating_value, minimum_air_requirement


def calculate_flue_gas_properties(
    gas_comp_normalized: dict,
    excess_air_ratio: float,
    min_air_requirement: float,
) -> dict:
    """
    Calculate flue gas composition and properties with accurate stoichiometry.
    """
    total_co2 = 0.0
    total_h2o = 0.0
    total_n2_from_fuel = 0.0

    for gas_name, vol_percent in gas_comp_normalized.items():
        if vol_percent == 0:
            continue

        mole_fraction = vol_percent / 100.0
        rxn_data = GAS_REACTIONS[gas_name]

        total_co2 += mole_fraction * rxn_data.co2_per_mol
        total_h2o += mole_fraction * rxn_data.h2o_per_mol

        if gas_name == "N2":
            total_n2_from_fuel += mole_fraction

    # N2 from air: air contains ~79% N2, ~21% O2
    # Min air is stoichiometric air, excess air ratio multiplies that
    # N2 from air = (min_air * excess_air_ratio) * (0.79)
    n2_from_air = (min_air_requirement * excess_air_ratio) * (1 - AIR_O2_FRACTION)

    # Excess O2: excess air * 0.21
    excess_o2 = (min_air_requirement * (excess_air_ratio - 1)) * AIR_O2_FRACTION

    # Dry flue gas volume (m³/m³ fuel, dry basis)
    dry_flue_gas_volume = total_co2 + total_n2_from_fuel + n2_from_air + excess_o2

    # Wet flue gas volume (includes water vapor)
    wet_flue_gas_volume = dry_flue_gas_volume + total_h2o

    # Calculate percentages on dry basis
    flue_gas_o2 = 0.0
    flue_gas_co2 = 0.0
    flue_gas_n2 = 0.0

    if dry_flue_gas_volume > 0:
        flue_gas_o2 = (excess_o2 / dry_flue_gas_volume) * 100.0
        flue_gas_co2 = (total_co2 / dry_flue_gas_volume) * 100.0
        flue_gas_n2 = ((total_n2_from_fuel + n2_from_air) / dry_flue_gas_volume) * 100.0

    # H2O percentage on wet basis
    h2o_in_flue_gas = 0.0
    if wet_flue_gas_volume > 0:
        h2o_in_flue_gas = (total_h2o / wet_flue_gas_volume) * 100.0

    # Calculate density of wet flue gas
    # Use average molar mass of flue gas components
    co2_molar_mass = 44.01
    o2_molar_mass = 32.00
    n2_molar_mass = 28.01
    h2o_molar_mass = 18.02

    if wet_flue_gas_volume > 0:
        flue_gas_molar_mass = (
            (total_co2 * co2_molar_mass) +
            (excess_o2 * o2_molar_mass) +
            ((total_n2_from_fuel + n2_from_air) * n2_molar_mass) +
            (total_h2o * h2o_molar_mass)
        ) / wet_flue_gas_volume
        density_of_wet_flue_gas = flue_gas_molar_mass / 22.414
    else:
        density_of_wet_flue_gas = 0.0

    return {
        "flue_gas_o2": flue_gas_o2,
        "flue_gas_co2": flue_gas_co2,
        "flue_gas_n2": flue_gas_n2,
        "dry_flue_gas_volume": dry_flue_gas_volume,
        "h2o_in_flue_gas": h2o_in_flue_gas,
        "wet_flue_gas_volume": wet_flue_gas_volume,
        "density_of_wet_flue_gas": density_of_wet_flue_gas,
    }


def calculate_custom_gas(input_data: CustomGasCalculationInput) -> CustomGasCalculationResult:
    """
    Main calculation function for custom gas composition.
    """
    gas_comp = input_data.gas_composition
    excess_air_ratio = input_data.excess_air_ratio
    capacity_params = input_data.capacity_params

    # Step 1: Normalize gas composition
    gas_comp_normalized = calculate_custom_gas_composition(gas_comp)

    # Step 2: Calculate gas properties
    density, relative_density, lower_heating_value, minimum_air_requirement = calculate_gas_properties(
        gas_comp_normalized
    )

    # Step 3: Calculate capacity/flow rate
    burner_capacity = capacity_params.burner_capacity or 100.0  # kW

    # Gas flow rate (m³/h) = Power (kW) / LHV (kWh/m³)
    if lower_heating_value > 0:
        gas_flow_rate = burner_capacity / lower_heating_value
    else:
        gas_flow_rate = 0.0

    # Air/fuel ratio (actual) = stoichiometric ratio * excess air
    air_fuel_ratio = minimum_air_requirement * excess_air_ratio

    # Air flow rate (m³/h) = gas flow * air/fuel ratio
    air_flow_rate = gas_flow_rate * air_fuel_ratio

    # Step 4: Calculate flue gas properties
    flue_gas_result = calculate_flue_gas_properties(
        gas_comp_normalized,
        excess_air_ratio,
        minimum_air_requirement,
    )

    return CustomGasCalculationResult(
        density=density,
        relative_density=relative_density,
        lower_heating_value=lower_heating_value,
        minimum_air_requirement=minimum_air_requirement,
        burner_capacity=burner_capacity,
        gas_flow_rate=gas_flow_rate,
        air_fuel_ratio=air_fuel_ratio,
        air_flow_rate=air_flow_rate,
        flue_gas_o2=flue_gas_result["flue_gas_o2"],
        flue_gas_co2=flue_gas_result["flue_gas_co2"],
        flue_gas_n2=flue_gas_result["flue_gas_n2"],
        dry_flue_gas_volume=flue_gas_result["dry_flue_gas_volume"],
        h2o_in_flue_gas=flue_gas_result["h2o_in_flue_gas"],
        wet_flue_gas_volume=flue_gas_result["wet_flue_gas_volume"],
        density_of_wet_flue_gas=flue_gas_result["density_of_wet_flue_gas"],
    )
