from pydantic import BaseModel
from typing import Optional


class FuelComposition(BaseModel):
    C: float
    H: float
    O: float
    N: float
    S: float


class Fuel(BaseModel):
    id: str
    name: str
    category: str
    LHV: float
    HHV: float
    composition: FuelComposition
    CO2_max: float
    siegert_f1: float
    siegert_f2: float


FUELS_DATABASE = [
    Fuel(
        id="natural_gas",
        name="Natural Gas",
        category="gas",
        LHV=35800,
        HHV=39700,
        composition=FuelComposition(C=75.0, H=24.0, O=0.0, N=0.5, S=0.0),
        CO2_max=12.0,
        siegert_f1=0.68,
        siegert_f2=0.66,
    ),
    Fuel(
        id="lpg_propane",
        name="LPG/Propane",
        category="gas",
        LHV=46400,
        HHV=50400,
        composition=FuelComposition(C=81.8, H=18.2, O=0.0, N=0.0, S=0.0),
        CO2_max=14.2,
        siegert_f1=0.66,
        siegert_f2=0.64,
    ),
    Fuel(
        id="butane",
        name="Butane",
        category="gas",
        LHV=45700,
        HHV=50000,
        composition=FuelComposition(C=82.7, H=17.3, O=0.0, N=0.0, S=0.0),
        CO2_max=14.5,
        siegert_f1=0.65,
        siegert_f2=0.63,
    ),
    Fuel(
        id="diesel",
        name="Diesel/No.2 Fuel Oil",
        category="liquid",
        LHV=42600,
        HHV=45400,
        composition=FuelComposition(C=86.0, H=13.5, O=0.5, N=0.0, S=0.0),
        CO2_max=15.5,
        siegert_f1=0.63,
        siegert_f2=0.61,
    ),
    Fuel(
        id="hfo",
        name="Heavy Fuel Oil/No.6",
        category="liquid",
        LHV=40500,
        HHV=43500,
        composition=FuelComposition(C=88.0, H=9.5, O=1.0, N=0.5, S=1.0),
        CO2_max=16.0,
        siegert_f1=0.61,
        siegert_f2=0.59,
    ),
    Fuel(
        id="coal_bituminous",
        name="Coal - Bituminous",
        category="solid",
        LHV=25800,
        HHV=28500,
        composition=FuelComposition(C=70.0, H=4.5, O=8.0, N=1.5, S=1.0),
        CO2_max=18.5,
        siegert_f1=0.58,
        siegert_f2=0.56,
    ),
    Fuel(
        id="coal_subbituminous",
        name="Coal - Sub-bituminous",
        category="solid",
        LHV=20500,
        HHV=23000,
        composition=FuelComposition(C=55.0, H=4.0, O=18.0, N=1.0, S=0.5),
        CO2_max=20.0,
        siegert_f1=0.55,
        siegert_f2=0.53,
    ),
    Fuel(
        id="biomass",
        name="Biomass/Wood",
        category="solid",
        LHV=15000,
        HHV=18000,
        composition=FuelComposition(C=50.0, H=6.0, O=43.0, N=0.5, S=0.0),
        CO2_max=20.5,
        siegert_f1=0.52,
        siegert_f2=0.50,
    ),
    Fuel(
        id="hydrogen",
        name="Hydrogen",
        category="gas",
        LHV=120000,
        HHV=142000,
        composition=FuelComposition(C=0.0, H=100.0, O=0.0, N=0.0, S=0.0),
        CO2_max=0.0,
        siegert_f1=0.76,
        siegert_f2=0.74,
    ),
    Fuel(
        id="coke_oven_gas",
        name="Coke Oven Gas",
        category="gas",
        LHV=17500,
        HHV=19500,
        composition=FuelComposition(C=28.0, H=52.0, O=0.5, N=8.0, S=0.3),
        CO2_max=9.5,
        siegert_f1=0.70,
        siegert_f2=0.68,
    ),
]


def get_fuel_by_id(fuel_id: str) -> Optional[Fuel]:
    for fuel in FUELS_DATABASE:
        if fuel.id == fuel_id:
            return fuel
    return None


def get_all_fuels() -> list[Fuel]:
    return FUELS_DATABASE
