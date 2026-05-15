from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Dict
from app.services.emissions import (
    convert_emission,
    convert_all_units,
    check_compliance,
    calculate_annual_emissions,
    POLLUTANT_MOLECULAR_WEIGHTS,
    EPA_LIMITS,
    EU_LIMITS
)
from app.security.validator import InputValidator, ValidationError

router = APIRouter(prefix="/api/emissions", tags=["emissions"])

class ConvertRequest(BaseModel):
    pollutant: str
    value: float
    from_unit: str
    to_unit: str
    o2_measured: float
    o2_reference: float
    fuel_type: str
    
    @field_validator('value')
    @classmethod
    def validate_value(cls, v):
        if v < 0:
            raise ValueError('Value must be non-negative')
        if v > 1e9:
            raise ValueError('Value exceeds reasonable range')
        return v
    
    @field_validator('o2_measured', 'o2_reference')
    @classmethod
    def validate_o2(cls, v):
        if v < 0 or v > 21:
            raise ValueError('O2 percentage must be between 0 and 21')
        return v
    
    @field_validator('pollutant')
    @classmethod
    def validate_pollutant(cls, v):
        return InputValidator.validate_pollutant(v)
    
    @field_validator('fuel_type')
    @classmethod
    def validate_fuel_type(cls, v):
        return InputValidator.validate_fuel_type(v)

class ComplianceRequest(BaseModel):
    fuel_type: str
    nox_mg_m3: float
    co_mg_m3: float
    o2_reference: float
    standard: str
    
    @field_validator('nox_mg_m3', 'co_mg_m3')
    @classmethod
    def validate_concentration(cls, v):
        if v < 0:
            raise ValueError('Concentration must be non-negative')
        if v > 1e6:
            raise ValueError('Concentration exceeds reasonable range')
        return v
    
    @field_validator('o2_reference')
    @classmethod
    def validate_o2(cls, v):
        if v < 0 or v > 21:
            raise ValueError('O2 percentage must be between 0 and 21')
        return v
    
    @field_validator('fuel_type')
    @classmethod
    def validate_fuel_type(cls, v):
        return InputValidator.validate_fuel_type(v)
    
    @field_validator('standard')
    @classmethod
    def validate_standard(cls, v):
        if v not in ['EPA', 'EU']:
            raise ValueError('Standard must be EPA or EU')
        return v

class AnnualRequest(BaseModel):
    pollutant: str
    concentration_mg_m3: float
    flue_gas_flow_m3h: float
    annual_hours: float
    load_factor: float
    
    @field_validator('concentration_mg_m3')
    @classmethod
    def validate_concentration(cls, v):
        if v < 0:
            raise ValueError('Concentration must be non-negative')
        if v > 1e6:
            raise ValueError('Concentration exceeds reasonable range')
        return v
    
    @field_validator('flue_gas_flow_m3h')
    @classmethod
    def validate_flow(cls, v):
        if v < 0:
            raise ValueError('Flow rate must be non-negative')
        if v > 1e9:
            raise ValueError('Flow rate exceeds reasonable range')
        return v
    
    @field_validator('pollutant')
    @classmethod
    def validate_pollutant(cls, v):
        return InputValidator.validate_pollutant(v)
    
    @field_validator('annual_hours')
    @classmethod
    def validate_hours(cls, v):
        return InputValidator.validate_annual_hours(v)
    
    @field_validator('load_factor')
    @classmethod
    def validate_load_factor(cls, v):
        return InputValidator.validate_load_factor(v)

@router.post("/convert")
def convert_emission_value(request: ConvertRequest) -> Dict:
    try:
        converted_value = convert_emission(
            request.value,
            request.from_unit,
            request.to_unit,
            request.pollutant,
            request.o2_measured,
            request.o2_reference,
            request.fuel_type
        )
        
        all_units = convert_all_units(
            request.value,
            request.from_unit,
            request.pollutant,
            request.o2_measured,
            request.o2_reference,
            request.fuel_type
        )
        
        return {
            "converted_value": converted_value,
            "all_units": all_units,
            "pollutant": request.pollutant,
            "from_unit": request.from_unit,
            "to_unit": request.to_unit,
            "o2_measured": request.o2_measured,
            "o2_reference": request.o2_reference,
            "fuel_type": request.fuel_type,
            "molecular_weight": POLLUTANT_MOLECULAR_WEIGHTS.get(request.pollutant, 46.01)
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid emission conversion request")

@router.post("/compliance")
def check_emission_compliance(request: ComplianceRequest) -> Dict:
    try:
        epa_result = check_compliance(
            request.nox_mg_m3,
            request.co_mg_m3,
            request.o2_reference,
            request.fuel_type,
            "EPA"
        )
        
        eu_result = check_compliance(
            request.nox_mg_m3,
            request.co_mg_m3,
            request.o2_reference,
            request.fuel_type,
            "EU"
        )
        
        return {
            "epa": epa_result,
            "eu": eu_result,
            "input": {
                "fuel_type": request.fuel_type,
                "nox_mg_m3": request.nox_mg_m3,
                "co_mg_m3": request.co_mg_m3,
                "o2_reference": request.o2_reference
            }
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid compliance check request")

@router.post("/annual")
def calculate_annual(request: AnnualRequest) -> Dict:
    try:
        result = calculate_annual_emissions(
            request.concentration_mg_m3,
            request.flue_gas_flow_m3h,
            request.annual_hours,
            request.load_factor
        )
        
        return {
            "pollutant": request.pollutant,
            "concentration_mg_m3": request.concentration_mg_m3,
            "flue_gas_flow_m3h": request.flue_gas_flow_m3h,
            "annual_hours": request.annual_hours,
            "load_factor": request.load_factor,
            **result
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid annual emission calculation request")

@router.get("/limits")
def get_emission_limits() -> Dict:
    return {
        "epa_limits": EPA_LIMITS,
        "eu_limits": EU_LIMITS,
        "pollutants": list(POLLUTANT_MOLECULAR_WEIGHTS.keys())
    }
