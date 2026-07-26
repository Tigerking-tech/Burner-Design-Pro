from typing import Dict, List, Tuple
from enum import Enum

class Pollutant(Enum):
    NOx = "NOx"
    CO = "CO"
    CO2 = "CO2"
    SOx = "SOx"

class FuelType(Enum):
    NATURAL_GAS_LOW = "natural_gas_low"
    NATURAL_GAS_HIGH = "natural_gas_high"
    DIESEL_LOW = "diesel_low"
    HEAVY_OIL_LOW = "heavy_oil_low"
    COAL = "coal"
    NATURAL_GAS = "natural_gas"
    HEAVY_OIL = "heavy_oil"
    SOLID = "solid"

POLLUTANT_MOLECULAR_WEIGHTS = {
    "NOx": 46.01,
    "CO": 28.01,
    "CO2": 44.01,
    "SOx": 64.06,
    "NO": 30.01,
    "NO2": 46.01,
}

FD_FACTORS = {
    "natural_gas": 8710,
    "natural_gas_low": 8710,
    "natural_gas_high": 8710,
    "diesel": 9190,
    "diesel_low": 9190,
    "heavy_oil": 9190,
    "heavy_oil_low": 9190,
    "coal": 9780,
    "solid": 9780,
}

K_FACTORS = {
    "NOx": 1.194e-7,
    "SOx": 1.660e-7,
}

EPA_LIMITS = {
    "natural_gas_low": {"NOx": 130, "CO": 100, "O2": 3.0},
    "natural_gas_high": {"NOx": 260, "CO": 100, "O2": 3.0},
    "diesel_low": {"NOx": 130, "CO": 100, "O2": 3.0},
    "heavy_oil_low": {"NOx": 390, "CO": 150, "O2": 3.0},
    "coal": {"NOx": 910, "CO": 200, "O2": 3.0},
}

EU_LIMITS = {
    "natural_gas": {"NOx": 200, "CO": 150, "O2": 3.0},
    "heavy_oil": {"NOx": 450, "CO": 150, "O2": 3.0},
    "solid": {"NOx": 650, "CO": 200, "O2": 6.0},
}

CO2_MAX_VALUES = {
    "natural_gas": 12.0,
    "natural_gas_low": 12.0,
    "natural_gas_high": 12.0,
    "diesel": 15.0,
    "diesel_low": 15.0,
    "heavy_oil": 15.0,
    "heavy_oil_low": 15.0,
    "coal": 20.0,
    "solid": 20.0,
}

def ppm_to_mg_m3(ppm: float, molecular_weight: float) -> float:
    return ppm * molecular_weight / 22.4

def mg_m3_to_ppm(mg_m3: float, molecular_weight: float) -> float:
    return mg_m3 * 22.4 / molecular_weight

def o2_correction(measured_value: float, o2_measured: float, o2_reference: float) -> float:
    if o2_measured >= 20.9:
        return measured_value
    return measured_value * (20.9 - o2_reference) / (20.9 - o2_measured)

def mg_m3_to_lb_MMBtu(mg_m3: float, o2_reference: float, fuel_type: str, molecular_weight: float, pollutant: str) -> float:
    fd = FD_FACTORS.get(fuel_type, 8710)
    ppm = mg_m3_to_ppm(mg_m3, molecular_weight)
    k = K_FACTORS.get(pollutant, molecular_weight / (385.3 * 1e6))
    return ppm * k * fd * (20.9 / (20.9 - o2_reference))

def lb_MMBtu_to_mg_m3(lb_mmbtu: float, o2_reference: float, fuel_type: str, molecular_weight: float, pollutant: str) -> float:
    fd = FD_FACTORS.get(fuel_type, 8710)
    k = K_FACTORS.get(pollutant, molecular_weight / (385.3 * 1e6))
    ppm = lb_mmbtu / (k * fd * (20.9 / (20.9 - o2_reference)))
    return ppm_to_mg_m3(ppm, molecular_weight)

def convert_emission(
    value: float,
    from_unit: str,
    to_unit: str,
    pollutant: str,
    o2_measured: float,
    o2_reference: float,
    fuel_type: str
) -> float:
    mw = POLLUTANT_MOLECULAR_WEIGHTS.get(pollutant, 46.01)
    
    if from_unit == to_unit:
        return o2_correction(value, o2_measured, o2_reference) if o2_measured != o2_reference else value
    
    if from_unit == "ppm" and to_unit == "mg_m3":
        corrected_ppm = o2_correction(value, o2_measured, o2_reference)
        return ppm_to_mg_m3(corrected_ppm, mw)
    
    elif from_unit == "mg_m3" and to_unit == "ppm":
        corrected_mg = o2_correction(value, o2_measured, o2_reference)
        return mg_m3_to_ppm(corrected_mg, mw)
    
    elif from_unit == "ppm" and to_unit == "lb_MMBtu":
        corrected_ppm = o2_correction(value, o2_measured, o2_reference)
        mg_m3 = ppm_to_mg_m3(corrected_ppm, mw)
        return mg_m3_to_lb_MMBtu(mg_m3, o2_reference, fuel_type, mw, pollutant)
    
    elif from_unit == "mg_m3" and to_unit == "lb_MMBtu":
        corrected_mg = o2_correction(value, o2_measured, o2_reference)
        return mg_m3_to_lb_MMBtu(corrected_mg, o2_reference, fuel_type, mw, pollutant)
    
    elif from_unit == "lb_MMBtu" and to_unit == "ppm":
        mg_m3 = lb_MMBtu_to_mg_m3(value, o2_reference, fuel_type, mw, pollutant)
        return mg_m3_to_ppm(mg_m3, mw)
    
    elif from_unit == "lb_MMBtu" and to_unit == "mg_m3":
        return lb_MMBtu_to_mg_m3(value, o2_reference, fuel_type, mw, pollutant)
    
    return value

def convert_all_units(
    value: float,
    from_unit: str,
    pollutant: str,
    o2_measured: float,
    o2_reference: float,
    fuel_type: str
) -> Dict[str, float]:
    mw = POLLUTANT_MOLECULAR_WEIGHTS.get(pollutant, 46.01)
    
    corrected_value = o2_correction(value, o2_measured, o2_reference)
    
    if from_unit == "ppm":
        ppm_val = corrected_value
        mg_m3_val = ppm_to_mg_m3(corrected_value, mw)
        lb_MMBtu_val = mg_m3_to_lb_MMBtu(mg_m3_val, o2_reference, fuel_type, mw, pollutant)
    elif from_unit == "mg_m3":
        mg_m3_val = corrected_value
        ppm_val = mg_m3_to_ppm(corrected_value, mw)
        lb_MMBtu_val = mg_m3_to_lb_MMBtu(corrected_value, o2_reference, fuel_type, mw, pollutant)
    else:
        lb_MMBtu_val = value
        mg_m3_val = lb_MMBtu_to_mg_m3(value, o2_reference, fuel_type, mw, pollutant)
        ppm_val = mg_m3_to_ppm(mg_m3_val, mw)
    
    return {
        "ppm": ppm_val,
        "mg_m3": mg_m3_val,
        "lb_MMBtu": lb_MMBtu_val
    }

def check_compliance(
    nox_mg_m3: float,
    co_mg_m3: float,
    o2_reference: float,
    fuel_type: str,
    standard: str
) -> Dict:
    if standard == "EPA":
        if fuel_type not in EPA_LIMITS:
            fuel_type = "natural_gas_low"
        limits = EPA_LIMITS[fuel_type]
        
        nox_compliant = nox_mg_m3 <= limits["NOx"]
        co_compliant = co_mg_m3 <= limits["CO"]
        
        return {
            "standard": "EPA",
            "nox_limit": limits["NOx"],
            "co_limit": limits["CO"],
            "nox_measured": nox_mg_m3,
            "co_measured": co_mg_m3,
            "nox_compliant": nox_compliant,
            "co_compliant": co_compliant,
            "overall_compliant": nox_compliant and co_compliant
        }
    
    elif standard == "EU":
        if fuel_type not in EU_LIMITS:
            fuel_type = "natural_gas"
        limits = EU_LIMITS[fuel_type]
        
        nox_compliant = nox_mg_m3 <= limits["NOx"]
        co_compliant = co_mg_m3 <= limits["CO"]
        
        return {
            "standard": "EU",
            "nox_limit": limits["NOx"],
            "co_limit": limits["CO"],
            "nox_measured": nox_mg_m3,
            "co_measured": co_mg_m3,
            "nox_compliant": nox_compliant,
            "co_compliant": co_compliant,
            "overall_compliant": nox_compliant and co_compliant
        }
    
    return {}

def calculate_annual_emissions(
    concentration_mg_m3: float,
    flue_gas_flow_m3h: float,
    annual_hours: float,
    load_factor: float
) -> Dict:
    hourly_kg = concentration_mg_m3 * flue_gas_flow_m3h * 1e-6
    annual_tons = hourly_kg * annual_hours * load_factor * 1e-3
    monthly_tons = annual_tons / 12
    
    return {
        "hourly_kg": hourly_kg,
        "annual_tons": annual_tons,
        "monthly_tons": monthly_tons
    }

POLLUTANT_LABELS = {
    "NOx": "NOx",
    "CO": "CO",
    "CO2": "CO₂",
    "SOx": "SO₂",
}

def calculate_all_annual_emissions(
    nox_mg_m3: float,
    co_mg_m3: float,
    co2_mg_m3: float,
    so2_mg_m3: float,
    flue_gas_flow_m3h: float,
    annual_hours: float,
    load_factor: float
) -> Dict:
    pollutants = [
        ("NOx", nox_mg_m3),
        ("CO", co_mg_m3),
        ("CO2", co2_mg_m3),
        ("SOx", so2_mg_m3),
    ]
    
    results = {}
    for key, conc in pollutants:
        results[key] = calculate_annual_emissions(
            conc, flue_gas_flow_m3h, annual_hours, load_factor
        )
    
    total_annual_tons = sum(r["annual_tons"] for r in results.values())
    
    return {
        "pollutants": {
            key: {
                "label": POLLUTANT_LABELS[key],
                "concentration_mg_m3": conc,
                **results[key]
            }
            for key, conc in pollutants
        },
        "total_annual_tons": total_annual_tons,
        "method": "EPA Method 19 / IPCC Guidelines — each pollutant calculated independently",
        "formula": "Emission (kg/h) = Concentration (mg/m³) × Flow (m³/h) × 10⁻⁶"
    }
