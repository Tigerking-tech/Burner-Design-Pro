from typing import Dict, List, Tuple

# Define all units and their conversion factors to base units
# Base units: Pa (pressure), °C (temperature), m³/s (flow), J (energy), W (power), 
#             kJ/Nm³ (heat content), m (length), kg (mass), m³ (volume), kg/m³ (density),
#             m/s (velocity), kW (burner capacity)

UNITS = {
    "Pressure": {
        "Pa": 1.0,
        "kPa": 1000.0,
        "MPa": 1000000.0,
        "bar": 100000.0,
        "mbar": 100.0,
        "atm": 101325.0,
        "psi": 6894.76,
        "mmHg": 133.322,
        "inHg": 3386.39,
        "mmH2O": 9.80665,
        "inH2O": 249.089,
        "kg/cm2": 98066.5
    },
    "Temperature": {
        "Celsius": 0.0,  # Special handling
        "Fahrenheit": 0.0,  # Special handling
        "Kelvin": 0.0  # Special handling
    },
    "Flow Rate": {
        "m3/s": 1.0,
        "m3/h": 1.0 / 3600.0,
        "L/s": 0.001,
        "L/h": 0.001 / 3600.0,
        "Nm3/h": 1.0 / 3600.0,
        "Sm3/h": 1.0 / 3600.0,
        "cfm": 0.000471947,
        "gpm": 0.0000630902,
        "kg/h": 1.0 / 3600.0
    },
    "Energy": {
        "J": 1.0,
        "kJ": 1000.0,
        "MJ": 1000000.0,
        "kWh": 3600000.0,
        "BTU": 1055.06,
        "kcal": 4184.0
    },
    "Power": {
        "W": 1.0,
        "kW": 1000.0,
        "MW": 1000000.0,
        "BTU/h": 0.293071,
        "kcal/h": 1.163
    },
    "Heat Content": {
        "kJ/Nm3": 1.0,
        "MJ/Nm3": 1000.0,
        "BTU/scf": 37.2589,
        "kJ/kg": 1.0,
        "BTU/lb": 2.326,
        "kcal/kg": 4.184
    },
    "Length": {
        "m": 1.0,
        "cm": 0.01,
        "mm": 0.001,
        "km": 1000.0,
        "in": 0.0254,
        "ft": 0.3048,
        "yd": 0.9144,
        "mi": 1609.34
    },
    "Mass": {
        "kg": 1.0,
        "g": 0.001,
        "mg": 0.000001,
        "lb": 0.453592,
        "oz": 0.0283495,
        "ton": 1000.0
    },
    "Volume": {
        "m3": 1.0,
        "L": 0.001,
        "mL": 0.000001,
        "ft3": 0.0283168,
        "gal": 0.00378541,
        "in3": 0.0000163871
    },
    "Density": {
        "kg/m3": 1.0,
        "g/cm3": 1000.0,
        "lb/ft3": 16.0185
    },
    "Velocity": {
        "m/s": 1.0,
        "km/h": 1.0 / 3.6,
        "ft/s": 0.3048,
        "mph": 0.44704
    },
    "Burner Capacity": {
        "kW": 1.0,
        "MW": 1000.0,
        "kcal/h": 1.0 / 1.163,
        "BTU/h": 1.0 / 3.41214,
        "Nm3/h (gas)": 1.0 / 10.0  # Approximate based on natural gas (~10 kW/Nm3/h)
    }
}

def get_categories() -> List[str]:
    return list(UNITS.keys())

def get_units(category: str) -> List[str]:
    if category not in UNITS:
        return []
    return list(UNITS[category].keys())

def convert_temperature(value: float, from_unit: str, to_unit: str) -> float:
    # Convert to Celsius first
    if from_unit == "Celsius":
        celsius = value
    elif from_unit == "Fahrenheit":
        celsius = (value - 32) * 5 / 9
    elif from_unit == "Kelvin":
        celsius = value - 273.15
    else:
        raise ValueError(f"Unknown temperature unit: {from_unit}")
    
    # Convert from Celsius to target unit
    if to_unit == "Celsius":
        return celsius
    elif to_unit == "Fahrenheit":
        return celsius * 9 / 5 + 32
    elif to_unit == "Kelvin":
        return celsius + 273.15
    else:
        raise ValueError(f"Unknown temperature unit: {to_unit}")

def convert(value: float, from_unit: str, to_unit: str, category: str) -> float:
    if category == "Temperature":
        return convert_temperature(value, from_unit, to_unit)
    
    if category not in UNITS:
        raise ValueError(f"Unknown category: {category}")
    
    units = UNITS[category]
    if from_unit not in units or to_unit not in units:
        raise ValueError(f"Unknown unit: {from_unit} or {to_unit}")
    
    # Convert to base unit first, then to target unit
    base_value = value * units[from_unit]
    return base_value / units[to_unit]

def convert_all(value: float, from_unit: str, category: str) -> Dict[str, float]:
    results = {}
    units = get_units(category)
    for unit in units:
        results[unit] = convert(value, from_unit, unit, category)
    return results
