from app.models.fuel import Fuel


AIR_COMPOSITION_O2 = 21.0
N2_O2_RATIO = 79.0 / 21.0
O2_MOLAR_MASS = 32.0
N2_MOLAR_MASS = 28.0
CO2_MOLAR_MASS = 44.0
H2O_MOLAR_MASS = 18.0
SO2_MOLAR_MASS = 64.0
C_MOLAR_MASS = 12.0
H2_MOLAR_MASS = 2.0
S_MOLAR_MASS = 32.0


class CombustionRequest:
    def __init__(
        self,
        fuel: Fuel,
        excess_air_ratio: float = 1.2,
        air_temperature: float = 25.0,
        air_humidity: float = 50.0,
    ):
        self.fuel = fuel
        self.excess_air_ratio = excess_air_ratio
        self.air_temperature = air_temperature
        self.air_humidity = air_humidity


class CombustionResult:
    def __init__(
        self,
        fuel: dict,
        theoretical_afr: float,
        actual_afr: float,
        excess_air_ratio: float,
        flue_gas_composition: dict,
        adiabatic_flame_temp: float,
    ):
        self.fuel = fuel
        self.theoretical_afr = theoretical_afr
        self.actual_afr = actual_afr
        self.excess_air_ratio = excess_air_ratio
        self.flue_gas_composition = flue_gas_composition
        self.adiabatic_flame_temp = adiabatic_flame_temp

    def to_dict(self) -> dict:
        return {
            "fuel": self.fuel,
            "theoretical_afr": round(self.theoretical_afr, 2),
            "actual_afr": round(self.actual_afr, 2),
            "excess_air_ratio": round(self.excess_air_ratio, 2),
            "flue_gas_composition": {
                "CO2": round(self.flue_gas_composition["CO2"], 2),
                "O2": round(self.flue_gas_composition["O2"], 2),
                "N2": round(self.flue_gas_composition["N2"], 2),
                "H2O": round(self.flue_gas_composition["H2O"], 2),
            },
            "adiabatic_flame_temp": round(self.adiabatic_flame_temp, 0),
        }


def calculate_theoretical_air(fuel: Fuel) -> float:
    C = fuel.composition.C / 100.0
    H = fuel.composition.H / 100.0
    O = fuel.composition.O / 100.0
    S = fuel.composition.S / 100.0

    O2_for_carbon = C * (O2_MOLAR_MASS / C_MOLAR_MASS)
    O2_for_hydrogen = H * (O2_MOLAR_MASS / (2 * H2_MOLAR_MASS))
    O2_for_sulfur = S * (O2_MOLAR_MASS / S_MOLAR_MASS)

    total_O2_needed = O2_for_carbon + O2_for_hydrogen + O2_for_sulfur - O

    O2_mass_needed = max(0, total_O2_needed) * (1000 / O2_MOLAR_MASS)

    theoretical_air_mass = O2_mass_needed * (100 / AIR_COMPOSITION_O2)

    return theoretical_air_mass


def calculate_flue_gas_dry(
    fuel: Fuel, excess_air_ratio: float, theoretical_afr: float
) -> dict:
    C = fuel.composition.C / 100.0
    H = fuel.composition.H / 100.0
    O = fuel.composition.O / 100.0
    S = fuel.composition.S / 100.0
    N = fuel.composition.N / 100.0

    CO2_mass = C * (CO2_MOLAR_MASS / C_MOLAR_MASS)
    H2O_mass_from_fuel = H * (H2O_MOLAR_MASS / (2 * H2_MOLAR_MASS))
    SO2_mass = S * (SO2_MOLAR_MASS / S_MOLAR_MASS)

    dry_products_mass = CO2_mass + SO2_mass

    actual_air = theoretical_afr * excess_air_ratio

    O2_in_air = actual_air * (AIR_COMPOSITION_O2 / 100.0)

    O2_for_combustion = (
        C * (O2_MOLAR_MASS / C_MOLAR_MASS)
        + H * (O2_MOLAR_MASS / (2 * H2_MOLAR_MASS))
        + S * (O2_MOLAR_MASS / S_MOLAR_MASS)
    )

    excess_O2_mass = O2_in_air - O2_for_combustion + O

    N2_from_air = actual_air * (N2_O2_RATIO)
    N2_from_fuel = N * (N2_MOLAR_MASS / (2 * 14.0)) if N > 0 else 0

    total_dry_mass = dry_products_mass + excess_O2_mass + N2_from_air + N2_from_fuel

    CO2_dry_percent = (CO2_mass / total_dry_mass) * 100 if total_dry_mass > 0 else 0
    O2_dry_percent = (excess_O2_mass / total_dry_mass) * 100 if total_dry_mass > 0 else 0
    N2_dry_percent = ((N2_from_air + N2_from_fuel) / total_dry_mass) * 100 if total_dry_mass > 0 else 0

    return {
        "CO2": CO2_dry_percent,
        "O2": O2_dry_percent,
        "N2": N2_dry_percent,
    }


def calculate_flue_gas_wet(dry_composition: dict) -> dict:
    CO2_dry = dry_composition["CO2"]
    O2_dry = dry_composition["O2"]
    N2_dry = dry_composition["N2"]

    total_dry = CO2_dry + O2_dry + N2_dry

    if total_dry > 0:
        CO2_wet = (CO2_dry / (100 + total_dry)) * 100
        O2_wet = (O2_dry / (100 + total_dry)) * 100
        N2_wet = (N2_dry / (100 + total_dry)) * 100
        H2O_wet = (100 / (100 + total_dry)) * 100
    else:
        CO2_wet = O2_wet = N2_wet = 0
        H2O_wet = 100

    return {
        "CO2": CO2_wet,
        "O2": O2_wet,
        "N2": N2_wet,
        "H2O": H2O_wet,
    }


def calculate_adiabatic_flame_temperature(
    fuel: Fuel,
    excess_air_ratio: float,
    air_temperature: float,
    air_humidity: float,
) -> float:
    T_air = air_temperature + 273.15

    cp_air = 1.005
    cp_flue_gas = 1.10

    theoretical_air = calculate_theoretical_air(fuel)

    actual_air = theoretical_air * excess_air_ratio

    C = fuel.composition.C / 100.0
    H = fuel.composition.H / 100.0

    Q_combustion = fuel.LHV

    m_air = actual_air
    m_flue_gas = 1 + actual_air

    delta_T = Q_combustion / ((m_air * cp_air) + (m_flue_gas * cp_flue_gas))

    T_flame = T_air + delta_T - 273.15

    T_flame = min(T_flame, 2200)

    return T_flame


def calculate_combustion(request: CombustionRequest) -> CombustionResult:
    fuel = request.fuel

    theoretical_afr = calculate_theoretical_air(fuel)
    actual_afr = theoretical_afr * request.excess_air_ratio

    dry_composition = calculate_flue_gas_dry(fuel, request.excess_air_ratio, theoretical_afr)
    wet_composition = calculate_flue_gas_wet(dry_composition)

    adiabatic_temp = calculate_adiabatic_flame_temperature(
        fuel,
        request.excess_air_ratio,
        request.air_temperature,
        request.air_humidity,
    )

    fuel_dict = {
        "name": fuel.name,
        "LHV": fuel.LHV,
        "HHV": fuel.HHV,
        "composition": {
            "C": fuel.composition.C,
            "H": fuel.composition.H,
            "O": fuel.composition.O,
            "N": fuel.composition.N,
            "S": fuel.composition.S,
        },
    }

    return CombustionResult(
        fuel=fuel_dict,
        theoretical_afr=theoretical_afr,
        actual_afr=actual_afr,
        excess_air_ratio=request.excess_air_ratio,
        flue_gas_composition=wet_composition,
        adiabatic_flame_temp=adiabatic_temp,
    )
