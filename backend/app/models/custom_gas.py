from pydantic import BaseModel
from typing import Optional, Dict


class GasCompositionInput(BaseModel):
    H2: Optional[float] = 0.0  # Hydrogen
    CO: Optional[float] = 0.0  # Carbon monoxide
    CH4: Optional[float] = 0.0  # Methane
    C2H6: Optional[float] = 0.0  # Ethane
    C3H8: Optional[float] = 0.0  # Propane
    C4H10: Optional[float] = 0.0  # Butane
    C5H12: Optional[float] = 0.0  # Pentane
    C6H14: Optional[float] = 0.0  # Hexane
    C7H16: Optional[float] = 0.0  # Heptane
    C2H4: Optional[float] = 0.0  # Ethene
    C3H6: Optional[float] = 0.0  # Propene
    C2H2: Optional[float] = 0.0  # Ethine (Acetylene)
    N2: Optional[float] = 0.0  # Nitrogen
    CO2: Optional[float] = 0.0  # Carbon dioxide
    O2: Optional[float] = 0.0  # Oxygen


class CapacityParams(BaseModel):
    excess_air_ratio: float = 1.2
    burner_capacity: Optional[float] = None  # kW
    gas_flow_rate: Optional[float] = None  # m³/h
    air_flow_rate: Optional[float] = None  # m³/h


class CustomGasCalculationInput(BaseModel):
    gas_composition: GasCompositionInput
    capacity_params: CapacityParams
    excess_air_ratio: float = 1.2
    desired_o2_in_flue_gas: Optional[float] = 0.0  # %


class CustomGasCalculationResult(BaseModel):
    # Customer-specific gas
    density: float  # kg/m³
    relative_density: float  # -
    lower_heating_value: float  # kWh/m³
    minimum_air_requirement: float  # m³/m³ (λ=1)
    
    # Capacity/Flow rate
    burner_capacity: float  # kW
    gas_flow_rate: float  # m³/h
    air_fuel_ratio: float  # -
    air_flow_rate: float  # m³/h
    
    # Flue gas
    flue_gas_o2: float  # %
    flue_gas_co2: float  # %
    flue_gas_n2: float  # %
    dry_flue_gas_volume: float  # m³/m³
    h2o_in_flue_gas: float  # %
    wet_flue_gas_volume: float  # m³/m³
    density_of_wet_flue_gas: float  # kg/m³


# Gas properties: [molar mass (kg/kmol), LHV (kJ/kg)]
GAS_PROPERTIES = {
    "H2": (2.016, 120000),
    "CO": (28.010, 10100),
    "CH4": (16.042, 50000),
    "C2H6": (30.069, 47500),
    "C3H8": (44.096, 46400),
    "C4H10": (58.123, 45700),
    "C5H12": (72.150, 45300),
    "C6H14": (86.177, 44900),
    "C7H16": (100.204, 44600),
    "C2H4": (28.054, 47200),
    "C3H6": (42.080, 45800),
    "C2H2": (26.038, 48300),
    "N2": (28.014, 0),
    "CO2": (44.010, 0),
    "O2": (32.000, 0)
}

# Air properties
AIR_MOLAR_MASS = 28.96  # kg/kmol
AIR_DENSITY = 1.205  # kg/m³ at 0°C, 1 bar
AIR_O2_FRACTION = 0.21  # -
