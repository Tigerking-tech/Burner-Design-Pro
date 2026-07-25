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
        "mm H₂O": 9.80665,
        "mm Hg": 133.322368421,
        "kg/cm²": 98066.5,
        "bar": 100000.0,
        "mbar": 100.0,
        "atm": 101325.0,
        "g/cm²": 98.0665,
        "in. H₂O": 249.08891,
        "in. Hg": 3386.3881578934,
        "psi = lb/in.²": 6894.757293178,
        "oz/in.²": 430.922330823625
    },
    "Angle": {
        "Radian": 1.0,
        "Degree": 0.0174532925199433
    },
    "Area": {
        "mm²": 1.0,
        "cm²": 100.0,
        "m²": 1000000.0,
        "in²": 645.16,
        "ft²": 92903.04
    },
    "Density": {
        "g/cm³": 1.0,
        "kg/m³": 0.001,
        "lb/in³": 27.6799047102031,
        "lb/ft³": 0.0160184633739601,
        "kg/Litre": 1.0,
        "lb/Gal(US)": 0.119826427316897
    },
    "Energy": {
        "cal": 1.0,
        "Kcal": 1000.0,
        "Joule": 0.239005736137667,
        "GigaJoule": 2.390057361377e+08,
        "Btu": 252.164400721797,
        "Million Btu": 2.521644007218e+08,
        "W*h": 860.420650095602,
        "Horsepower*h": 641615.568642447,
        "kg*m": 2.34384560229445,
        "lb*ft": 0.324048266809608,
        "N*m": 0.239005736137667,
        "MJ": 239005.736137667
    },
    "Force": {
        "g force": 1.0,
        "kg force": 1000.0,
        "Poundal": 14.0980818502,
        "N": 101.971621297793,
        "lb force": 453.59237,
        "Dyne": 0.00101971621298
    },
    "Heat Content (Volume)": {
        "Cal/cm³": 1.0,
        "Kcal/m³": 0.001,
        "Btu/ft³": 0.00890510177051417,
        "J/m³": 2.390057361377e-07
    },
    "Heat Content (nm³, scf)": {
        "MJ/nm³": 1.0,
        "kcal/nm³": 0.239005736137667,
        "MJ/sm³": 0.947943779281624,
        "kcal/sm³": 0.226564000784327,
        "Btu/scf": 0.0393807968107789,
        "kW-hr/nm³": 3.6
    },
    "Heat Content (Mass)": {
        "Cal/g": 1.0,
        "Kcal/kg": 1.0,
        "Btu/lb": 1.00066921606119,
        "J/kg": 0.000239005736137667,
        "kW*h/kg": 860.420650095602
    },
    "Length": {
        "µm": 1.0,
        "mm": 1000.0,
        "cm": 10000.0,
        "m": 1000000.0,
        "inch": 25400.0,
        "ft": 304800.0,
        "mile": 1609344000.0,
        "km": 1000000000.0
    },
    "Power": {
        "N*m/sec": 1.0,
        "Kcal/hr": 1.16222222222222,
        "kW": 1000.0,
        "W": 1.0,
        "MegaWatt": 1000000.0,
        "Joules/sec": 1.0,
        "GigaJoule/hr": 277777.777777778,
        "Horsepower": 745.699872,
        "Btu/hr": 0.293071070172222,
        "Million Btu/hr": 293071.070172222,
        "MJ/hr": 277.777777777778,
        "ft*lb/sec": 1.3558179483314
    },
    "Heat Flux": {
        "cal/(cm²*sec)": 1.0,
        "Kcal/(m²*h)": 2.777777777780e-05,
        "W/m²": 2.390057361377e-05,
        "kW/m²": 0.0239005736137667,
        "Btu/(ft²*h)": 7.539652832369e-05,
        "Btu/(in²*h)": 0.0108571000786109
    },
    "Heat Transfer Coefficient": {
        "Kcal/(m²*h*°C)": 1.0,
        "W/(m²*K)": 0.860420650095602,
        "Btu/(ft²*h*°F)": 4.88569503537489,
        "Btu/(in²*h*°F)": 703.540085093985
    },
    "Mass": {
        "mg": 1.0,
        "g": 1000.0,
        "kg": 1000000.0,
        "ton (metric)": 1000000000.0,
        "lbs": 453592.37,
        "oz": 28349.523125,
        "ton (imperial)": 1.016046908800e+09,
        "ton (US)": 907184740.0
    },
    "Specific Heat": {
        "cal/(g*°C)": 1.0,
        "kcal/(kg*°C)": 1.0,
        "Joule/(kg*K)": 0.000239005736137667,
        "Btu/(lb*°F)": 1.00066921606119
    },
    "Standard/Normal Volume": {
        "nm³ (0°C, 1013 mbar)": 1.0,
        "sm³ (15 °C, 1013 mbar)": 0.947943779281624,
        "scf (60 °F, 14.696 psi)": 0.0267911250676172
    },
    "Thermal Conductivity": {
        "kcal/(m*h*°C)": 1.0,
        "W/(m*°C)": 0.860420650095602,
        "Btu*ft/(ft²*h*°F)": 1.48915984678227,
        "Btu*in/(ft²*h*°F)": 0.124096653898522
    },
    "Torque": {
        "N*m": 1.0,
        "N*cm": 0.01,
        "N*mm": 0.001,
        "dyn*m": 1.000000000000e-05,
        "dyn*cm": 1.000000000000e-07,
        "dyn*mm": 1.000000000000e-08,
        "kg-force*m": 9.80665,
        "kg-force*cm": 0.0980665,
        "lb-force*ft": 1.3558179483314,
        "lb-force*in.": 0.112984829027616
    },
    "Velocity": {
        "cm/s": 1.0,
        "m/s": 100.0,
        "km/s": 100000.0,
        "km/h": 27.7777777778,
        "in./s": 2.54,
        "ft/s": 30.48,
        "miles/h": 44.704
    },
    "Viscosity Absolute": {
        "Pa*s": 1.0,
        "Poise": 0.1,
        "kg/(m*h)": 0.000277777777777778,
        "centipoise": 0.001,
        "lb/(ft*h)": 0.000413378873213765
    },
    "Viscosity Kinematic": {
        "m²/sec": 1.0,
        "ft²/sec": 0.09290304,
        "ft²/h": 2.580640000000e-05,
        "centistoke": 1.000000000000e-06,
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
        "US gal/h": 1.05150327
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
