from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.fuel import get_all_fuels, get_fuel_by_id, Fuel
from app.services.combustion import CombustionRequest, calculate_combustion
from app.models.custom_gas import CustomGasCalculationInput
from app.services.custom_gas_calculation import calculate_custom_gas

router = APIRouter()


class CombustionParams(BaseModel):
    fuel_id: str
    excess_air_ratio: float = 1.2
    air_temperature: float = 25.0
    air_humidity: float = 50.0


@router.get("/fuels")
async def list_fuels():
    fuels = get_all_fuels()
    return [
        {
            "id": f.id,
            "name": f.name,
            "category": f.category,
            "LHV": f.LHV,
            "HHV": f.HHV,
        }
        for f in fuels
    ]


@router.get("/fuels/{fuel_id}")
async def get_fuel(fuel_id: str):
    fuel = get_fuel_by_id(fuel_id)
    if fuel is None:
        raise HTTPException(status_code=404, detail="Fuel not found")
    return {
        "id": fuel.id,
        "name": fuel.name,
        "category": fuel.category,
        "LHV": fuel.LHV,
        "HHV": fuel.HHV,
        "composition": {
            "C": fuel.composition.C,
            "H": fuel.composition.H,
            "O": fuel.composition.O,
            "N": fuel.composition.N,
            "S": fuel.composition.S,
        },
        "CO2_max": fuel.CO2_max,
        "siegert_f1": fuel.siegert_f1,
        "siegert_f2": fuel.siegert_f2,
    }


@router.post("/calculate/combustion")
async def calculate(params: CombustionParams):
    fuel = get_fuel_by_id(params.fuel_id)
    if fuel is None:
        raise HTTPException(status_code=404, detail="Fuel not found")

    if params.excess_air_ratio < 1.0 or params.excess_air_ratio > 3.0:
        raise HTTPException(
            status_code=400, detail="Excess air ratio must be between 1.0 and 3.0"
        )

    request = CombustionRequest(
        fuel=fuel,
        excess_air_ratio=params.excess_air_ratio,
        air_temperature=params.air_temperature,
        air_humidity=params.air_humidity,
    )

    result = calculate_combustion(request)
    return result.to_dict()


@router.post("/calculate/custom-gas")
async def calculate_custom_gas_endpoint(params: CustomGasCalculationInput):
    result = calculate_custom_gas(params)
    return result.model_dump()
