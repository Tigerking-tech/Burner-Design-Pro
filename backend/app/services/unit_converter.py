from typing import Dict, List, Tuple

# Define all units and their conversion factors to base units
# Base units: Pa (pressure), Radian (angle), mm² (area), g/cm³ (density), cal (energy),
#             g force (force), Cal/cm³ (heat content volume), MJ/nm³ (heat content nm³),
#             Cal/g (heat content mass), µm (length), N*m/sec (power), cal/(cm²*sec) (heat flux),
#             Kcal/(m²*h*°C) (heat transfer coefficient), mg (mass), cal/(g*°C) (specific heat),
#             nm³ (standard volume), kcal/(m*h*°C) (thermal conductivity), N*m (torque),
#             cm/s (velocity), Pa*s (viscosity absolute), m²/sec (viscosity kinematic),
#             cm³ (volume), cm³/s (flow rate), kW (Hu) (burner capacity)

UNITS = {
    "Pressure": {
        "Pa": 1.0,
        "kPa": 1000.0,
        "mm H₂O": 9.800003265,
        "mm Hg": 133.300137438,
        "kg/cm²": 98066.528098,
        "bar": 100000.0,
        "mbar": 100.0,
        "atm": 101300.032011,
        "g/cm²": 98.066528098,
        "in. H₂O": 248.799157947,
        "in. Hg": 3385.945719598,
        "psi = lb/in.²": 6894.744825385,
        "oz/in.²": 430.918339727
    },
    "Angle": {
        "Radian": 1.0,
        "Degree": 0.017454545
    },
    "Area": {
        "mm²": 1.0,
        "cm²": 100.0,
        "m²": 1000000.0,
        "in²": 645.159930393,
        "ft²": 92903.10762158
    },
    "Density": {
        "g/cm³": 1.0,
        "kg/m³": 0.001,
        "lb/in³": 27.6782442035,
        "lb/ft³": 0.016018422,
        "kg/Litre": 1.0,
        "lb/Gal(US)": 0.119826427
    },
    "Energy": {
        "cal": 1.0,
        "Kcal": 1000.0,
        "Joule": 0.238845856,
        "GigaJoule": 238845856.447,
        "Btu": 251.2089959,
        "Million Btu": 251208995.9,
        "W*h": 860.275150473,
        "Horsepower*h": 639999.628,
        "kg*m": 2.34233315604,
        "lb*ft": 0.323844594,
        "N*m": 0.238845856,
        "MJ": 238845.856447
    },
    "Force": {
        "g force": 1.0,
        "kg force": 1000.0,
        "Poundal": 14.097770788,
        "N": 101.96767411,
        "lb force": 453.58767097,
        "Dyne": 0.001019716
    },
    "Heat Content (Volume)": {
        "Cal/cm³": 1.0,
        "Kcal/m³": 0.001,
        "Btu/ft³": 0.00889644,
        "J/m³": 2.388387878e-7
    },
    "Heat Content (nm³, scf)": {
        "MJ/nm³": 1.0,
        "kcal/nm³": 0.004186743,
        "MJ/sm³": 1.057000834,
        "kcal/sm³": 0.004425993,
        "Btu/scf": 0.039382708,
        "kW-hr/nm³": 3.59999712
    },
    "Heat Content (Mass)": {
        "Cal/g": 1.0,
        "Kcal/kg": 1.0,
        "Btu/lb": 0.555555556,
        "J/kg": 0.000238845952,
        "kW*h/kg": 854.855967906
    },
    "Length": {
        "µm": 1.0,
        "mm": 1000.0,
        "cm": 10000.0,
        "m": 1000000.0,
        "inch": 25400.0508001,
        "ft": 304799.918464,
        "mile": 1609343245.415,
        "km": 1000000000.0
    },
    "Power": {
        "N*m/sec": 1.0,
        "Kcal/hr": 1.163000385,
        "kW": 1000.0,
        "W": 1.0,
        "MegaWatt": 1000000.0,
        "Joules/sec": 1.0,
        "GigaJoule/hr": 277777.777778,
        "Horsepower": 745.712155108,
        "Btu/hr": 0.29307107,
        "Million Btu/hr": 293071.070117,
        "MJ/hr": 277.777777778,
        "ft*lb/sec": 1.355817948
    },
    "Heat Flux": {
        "cal/(cm²*sec)": 1.0,
        "Kcal/(m²*h)": 0.0000277778,
        "W/m²": 0.00002388458565,
        "kW/m²": 0.02388458565,
        "Btu/(ft²*h)": 0.0000754167,
        "Btu/(in²*h)": 0.010852
    },
    "Heat Transfer Coefficient": {
        "Kcal/(m²*h*°C)": 1.0,
        "W/(m²*K)": 0.85984522786,
        "Btu/(ft²*h*°F)": 4.88242762713,
        "Btu/(in²*h*°F)": 703.0744201
    },
    "Mass": {
        "mg": 1.0,
        "g": 1000.0,
        "kg": 1000000.0,
        "ton (metric)": 1000000000.0,
        "lbs": 453592.370755,
        "oz": 28349.5231722,
        "ton (imperial)": 1016046908.8,
        "ton (US)": 907184740.0
    },
    "Specific Heat": {
        "cal/(g*°C)": 1.0,
        "kcal/(kg*°C)": 1.0,
        "Joule/(kg*K)": 0.000238845856,
        "Btu/(lb*°F)": 1.0
    },
    "Standard/Normal Volume": {
        "nm³ (0°C, 1013 mbar)": 1.0,
        "sm³ (15 °C, 1013 mbar)": 0.943396226,
        "scf (60 °F, 14.696 psi)": 0.0267911603
    },
    "Thermal Conductivity": {
        "kcal/(m*h*°C)": 1.0,
        "W/(m*°C)": 0.85984522786,
        "Btu*ft/(ft²*h*°F)": 1.4880952381,
        "Btu*in/(ft²*h*°F)": 0.124004934
    },
    "Torque": {
        "N*m": 1.0,
        "N*cm": 0.01,
        "N*mm": 0.001,
        "dyn*m": 0.00001,
        "dyn*cm": 0.0000001,
        "dyn*mm": 0.00000001,
        "kg-force*m": 9.80673059191188,
        "kg-force*cm": 0.09806730592,
        "lb-force*ft": 1.35581794833,
        "lb-force*in.": 0.112984829027
    },
    "Velocity": {
        "cm/s": 1.0,
        "m/s": 100.0,
        "km/s": 100000.0,
        "km/h": 27.7777777778,
        "in./s": 2.54,
        "ft/s": 30.48,
        "miles/h": 44.703988827
    },
    "Viscosity Absolute": {
        "Pa*s": 1.0,
        "Poise": 0.1,
        "kg/(m*h)": 0.0002777778,
        "centipoise": 0.001,
        "lb/(ft*h)": 0.00041333781
    },
    "Viscosity Kinematic": {
        "m²/sec": 1.0,
        "ft²/sec": 0.09290304,
        "ft²/h": 0.0000258064,
        "centistoke": 0.000001,
        "stoke": 0.0001
    },
    "Fuel oil kinematic viscosity": {
        "Centistokes": 1.0,
        "SSU (Saybolt Univers.)": 1.0,
        "SSF (Saybolt Furol)": 1.0,
        "SR1 (Redwood Standard)": 1.0,
        "Degrees Engler": 1.0,
        "ft²/sec": 1.0
    },
    "Volume": {
        "cm³": 1.0,
        "m³": 1000000.0,
        "dm³": 1000.0,
        "Liter": 1000.0,
        "US gal": 3785.411784,
        "in.³": 16.387064,
        "ft³": 28316.846592,
        "quart": 946.352946,
        "pint": 473.176473
    },
    "Flow rate": {
        "cm³/s": 1.0,
        "m³/s": 1000000.0,
        "m³/h": 277.777777778,
        "Liter/h": 0.2777777778,
        "ft³/s": 28316.846592,
        "ft³/min": 471.9474432,
        "ft³/h": 7.86579072,
        "m³/min": 16666.6666667,
        "US gal/s": 3785.411784,
        "US gal/min": 63.0901964,
        "US gal/h": 1.051503273
    },
    "Burner capacity": {
        "kW (Hu)": 1.0,
        "10³ BTU/h (Ho), Natural gas NG (Ho/Hu = 1.108)": 0.2644104,
        "10³ BTU/h (Ho), Propane/Butane LPG (Ho/Hu = 1.084)": 0.2700513,
        "10³ BTU/h (Ho), Coke oven gas COG (Ho/Hu = 1.13)": 0.2592689
    },
    "Temperature": {
        "Fahrenheit": 0.0,
        "Celsius": 0.0,
        "Kelvin": 0.0
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
