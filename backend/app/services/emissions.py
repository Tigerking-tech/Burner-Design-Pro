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

def mg_m3_to_lb_MMBtu(mg_m3: float, o2_reference: float, co2_max: float, fuel_type: str) -> float:
    return mg_m3 * 1.80e-7 / (co2_max / 100) * (20.9 - o2_reference) / 20.9

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
    co2_max = CO2_MAX_VALUES.get(fuel_type, 12.0)
    
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
        return mg_m3_to_lb_MMBtu(mg_m3, o2_reference, co2_max, fuel_type)
    
    elif from_unit == "mg_m3" and to_unit == "lb_MMBtu":
        corrected_mg = o2_correction(value, o2_measured, o2_reference)
        return mg_m3_to_lb_MMBtu(corrected_mg, o2_reference, co2_max, fuel_type)
    
    elif from_unit == "lb_MMBtu" and to_unit == "ppm":
        lb_m3 = value / 1.80e-7 * (co2_max / 100) * 20.9 / (20.9 - o2_reference)
        mg_m3 = lb_m3
        return mg_m3_to_ppm(mg_m3, mw)
    
    elif from_unit == "lb_MMBtu" and to_unit == "mg_m3":
        return value / 1.80e-7 * (co2_max / 100) * 20.9 / (20.9 - o2_reference)
    
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
    co2_max = CO2_MAX_VALUES.get(fuel_type, 12.0)
    
    corrected_value = o2_correction(value, o2_measured, o2_reference)
    
    ppm = mg_m3_to_ppm(ppm_to_mg_m3(corrected_value, mw), mw) if from_unit == "ppm" else (
        corrected_value if from_unit != "ppm" else corrected_value
    )
    
    if from_unit == "ppm":
        ppm_val = corrected_value
    elif from_unit == "mg_m3":
        ppm_val = mg_m3_to_ppm(corrected_value, mw)
    else:
        lb_m3 = value / 1.80e-7 * (co2_max / 100) * 20.9 / (20.9 - o2_reference)
        ppm_val = mg_m3_to_ppm(lb_m3, mw)
    
    if from_unit == "ppm":
        mg_m3_val = ppm_to_mg_m3(corrected_value, mw)
    elif from_unit == "mg_m3":
        mg_m3_val = corrected_value
    else:
        mg_m3_val = value / 1.80e-7 * (co2_max / 100) * 20.9 / (20.9 - o2_reference)
    
    if from_unit == "lb_MMBtu":
        lb_MMBtu_val = value
    elif from_unit == "mg_m3":
        lb_MMBtu_val = mg_m3_to_lb_MMBtu(corrected_value, o2_reference, co2_max, fuel_type)
    else:
        mg_m3_temp = ppm_to_mg_m3(corrected_value, mw)
        lb_MMBtu_val = mg_m3_to_lb_MMBtu(mg_m3_temp, o2_reference, co2_max, fuel_type)
    
    if from_unit == "ppm":
        ppm_val = corrected_value
    if from_unit == "mg_m3":
        mg_m3_val = corrected_value
    
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
    hourly_kg = concentration_mg_m3 * flue_gas_flow_m3h * 1e-3
    annual_tons = hourly_kg * annual_hours * load_factor * 1e-3
    monthly_tons = annual_tons / 12
    
    return {
        "hourly_kg": hourly_kg,
        "annual_tons": annual_tons,
        "monthly_tons": monthly_tons
    }
