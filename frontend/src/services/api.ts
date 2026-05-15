const API_BASE_URL = (import.meta as any).env?.VITE_API_URL 
  ? `${(import.meta as any).env.VITE_API_URL}/api` 
  : 'http://localhost:8000/api'

export async function getHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) {
      throw new Error('Health check failed')
    }
    return response.json()
  } catch (error) {
    console.error('getHealth error:', error)
    throw error
  }
}

export interface Fuel {
  id: string
  name: string
  category: string
  LHV: number
  HHV: number
}

export interface FuelDetail extends Fuel {
  composition: {
    C: number
    H: number
    O: number
    N: number
    S: number
  }
  CO2_max: number
  siegert_f1: number
  siegert_f2: number
}

export interface CombustionParams {
  fuel_id: string
  excess_air_ratio: number
  air_temperature: number
  air_humidity: number
}

export interface FlueGasComposition {
  CO2: number
  O2: number
  N2: number
  H2O: number
}

export interface CombustionResult {
  fuel: {
    name: string
    LHV: number
    HHV: number
    composition: {
      C: number
      H: number
      O: number
      N: number
      S: number
    }
  }
  theoretical_afr: number
  actual_afr: number
  excess_air_ratio: number
  flue_gas_composition: FlueGasComposition
  adiabatic_flame_temp: number
}

export async function getFuels(): Promise<Fuel[]> {
  const response = await fetch(`${API_BASE_URL}/fuels`)
  if (!response.ok) {
    throw new Error('Failed to fetch fuels')
  }
  return response.json()
}

export async function getFuel(fuelId: string): Promise<FuelDetail> {
  const response = await fetch(`${API_BASE_URL}/fuels/${fuelId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch fuel')
  }
  return response.json()
}

export async function calculateCombustion(params: CombustionParams): Promise<CombustionResult> {
  const response = await fetch(`${API_BASE_URL}/calculate/combustion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error('Failed to calculate combustion')
  }
  return response.json()
}

export interface GasComposition {
  H2?: number
  CO?: number
  CH4?: number
  C2H6?: number
  C3H8?: number
  C4H10?: number
  C5H12?: number
  C6H14?: number
  C7H16?: number
  C2H4?: number
  C3H6?: number
  C2H2?: number
  N2?: number
  CO2?: number
  O2?: number
}

export interface CapacityParams {
  excess_air_ratio?: number
  burner_capacity?: number
  gas_flow_rate?: number
  air_flow_rate?: number
}

export interface CustomGasInput {
  gas_composition: GasComposition
  capacity_params: CapacityParams
  excess_air_ratio?: number
  desired_o2_in_flue_gas?: number
}

export interface CustomGasResult {
  density: number
  relative_density: number
  lower_heating_value: number
  minimum_air_requirement: number
  burner_capacity: number
  gas_flow_rate: number
  air_fuel_ratio: number
  air_flow_rate: number
  flue_gas_o2: number
  flue_gas_co2: number
  flue_gas_n2: number
  dry_flue_gas_volume: number
  h2o_in_flue_gas: number
  wet_flue_gas_volume: number
  density_of_wet_flue_gas: number
}

export async function calculateCustomGas(params: CustomGasInput): Promise<CustomGasResult> {
  console.log('Calling API with:', params)
  try {
    const response = await fetch(`${API_BASE_URL}/calculate/custom-gas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    console.log('Response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      throw new Error(`Failed to calculate custom gas: ${errorText}`)
    }
    const result = await response.json()
    console.log('API returned:', result)
    return result
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}
