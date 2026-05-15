import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GAS_OPTIONS = [
  { key: 'H2', name: 'Hydrogen', formula: 'H2' },
  { key: 'CO', name: 'Carbon monoxide', formula: 'CO' },
  { key: 'CH4', name: 'Methane', formula: 'CH4' },
  { key: 'C2H6', name: 'Ethane', formula: 'C2H6' },
  { key: 'C3H8', name: 'Propane', formula: 'C3H8' },
  { key: 'C4H10', name: 'Butane', formula: 'C4H10' },
  { key: 'C5H12', name: 'Pentane', formula: 'C5H12' },
  { key: 'C6H14', name: 'Hexane', formula: 'C6H14' },
  { key: 'C7H16', name: 'Heptane', formula: 'C7H16' },
  { key: 'C2H4', name: 'Ethene', formula: 'C2H4' },
  { key: 'C3H6', name: 'Propene', formula: 'C3H6' },
  { key: 'C2H2', name: 'Ethine', formula: 'C2H2' },
  { key: 'N2', name: 'Nitrogen', formula: 'N2' },
  { key: 'CO2', name: 'Carbon dioxide', formula: 'CO2' },
  { key: 'O2', name: 'Oxygen', formula: 'O2' },
]

interface GasProperties {
  molarMass: number
  lhv: number
  o2PerMol: number
  co2PerMol: number
  h2oPerMol: number
}

const GAS_REACTIONS: Record<string, GasProperties> = {
  H2: { molarMass: 2.016, lhv: 241800, o2PerMol: 0.5, co2PerMol: 0, h2oPerMol: 1.0 },
  CO: { molarMass: 28.01, lhv: 283000, o2PerMol: 0.5, co2PerMol: 1.0, h2oPerMol: 0 },
  CH4: { molarMass: 16.042, lhv: 802300, o2PerMol: 2.0, co2PerMol: 1.0, h2oPerMol: 2.0 },
  C2H6: { molarMass: 30.069, lhv: 1428000, o2PerMol: 3.5, co2PerMol: 2.0, h2oPerMol: 3.0 },
  C3H8: { molarMass: 44.096, lhv: 2044000, o2PerMol: 5.0, co2PerMol: 3.0, h2oPerMol: 4.0 },
  C4H10: { molarMass: 58.123, lhv: 2658000, o2PerMol: 6.5, co2PerMol: 4.0, h2oPerMol: 5.0 },
  C5H12: { molarMass: 72.15, lhv: 3272000, o2PerMol: 8.0, co2PerMol: 5.0, h2oPerMol: 6.0 },
  C6H14: { molarMass: 86.177, lhv: 3886000, o2PerMol: 9.5, co2PerMol: 6.0, h2oPerMol: 7.0 },
  C7H16: { molarMass: 100.204, lhv: 4500000, o2PerMol: 11.0, co2PerMol: 7.0, h2oPerMol: 8.0 },
  C2H4: { molarMass: 28.054, lhv: 1323000, o2PerMol: 3.0, co2PerMol: 2.0, h2oPerMol: 2.0 },
  C3H6: { molarMass: 42.08, lhv: 1927000, o2PerMol: 4.5, co2PerMol: 3.0, h2oPerMol: 3.0 },
  C2H2: { molarMass: 26.038, lhv: 1256000, o2PerMol: 2.5, co2PerMol: 2.0, h2oPerMol: 1.0 },
  N2: { molarMass: 28.014, lhv: 0, o2PerMol: 0, co2PerMol: 0, h2oPerMol: 0 },
  CO2: { molarMass: 44.01, lhv: 0, o2PerMol: 0, co2PerMol: 1.0, h2oPerMol: 0 },
  O2: { molarMass: 32.0, lhv: 0, o2PerMol: -1.0, co2PerMol: 0, h2oPerMol: 0 },
}

const AIR_DENSITY = 1.205
const AIR_O2_FRACTION = 0.21
const MOLAR_VOLUME = 22.414

interface CustomGasResult {
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

interface GasComposition {
  [key: string]: number | undefined
}

interface CapacityParams {
  excess_air_ratio?: number
  burner_capacity?: number
}

function calculateCustomGasLocally(
  gasComposition: GasComposition,
  capacityParams: CapacityParams,
  excessAirRatio: number
): CustomGasResult {
  let totalMolarMass = 0
  let totalLHV = 0
  let totalO2Required = 0
  let totalCO2 = 0
  let totalH2O = 0
  let totalN2FromFuel = 0
  let totalVolPercent = 0

  for (const [, volPercent] of Object.entries(gasComposition)) {
    if (!volPercent || volPercent <= 0) continue
    totalVolPercent += volPercent
  }

  if (totalVolPercent === 0) {
    totalVolPercent = 100
    gasComposition = { CH4: 100 }
  }

  const normalizationFactor = 100 / totalVolPercent

  for (const [gasKey, volPercent] of Object.entries(gasComposition)) {
    if (!volPercent || volPercent <= 0) continue
    const normalizedPercent = volPercent * normalizationFactor
    const moleFraction = normalizedPercent / 100
    const reaction = GAS_REACTIONS[gasKey]
    if (!reaction) continue

    totalMolarMass += moleFraction * reaction.molarMass
    totalLHV += moleFraction * reaction.lhv
    totalO2Required += moleFraction * reaction.o2PerMol
    totalCO2 += moleFraction * reaction.co2PerMol
    totalH2O += moleFraction * reaction.h2oPerMol

    if (gasKey === 'N2') {
      totalN2FromFuel += moleFraction
    }
  }

  const density = totalMolarMass / MOLAR_VOLUME
  const relativeDensity = density / AIR_DENSITY
  const lhvKjPerM3 = totalLHV / MOLAR_VOLUME
  const lowerHeatingValue = lhvKjPerM3 / 3600

  const minimumAirRequirement = totalO2Required / AIR_O2_FRACTION
  const actualAirRatio = minimumAirRequirement * excessAirRatio

  const burnerCapacity = capacityParams.burner_capacity || 100
  const gasFlowRate = lowerHeatingValue > 0 ? burnerCapacity / lowerHeatingValue : 0
  const airFlowRate = gasFlowRate * actualAirRatio

  const n2FromAir = (minimumAirRequirement * excessAirRatio) * (1 - AIR_O2_FRACTION)
  const excessO2 = (minimumAirRequirement * (excessAirRatio - 1)) * AIR_O2_FRACTION

  const dryFlueGasVolume = totalCO2 + totalN2FromFuel + n2FromAir + excessO2
  const wetFlueGasVolume = dryFlueGasVolume + totalH2O

  let flueGasO2 = 0
  let flueGasCO2 = 0
  let flueGasN2 = 0

  if (dryFlueGasVolume > 0) {
    flueGasO2 = (excessO2 / dryFlueGasVolume) * 100
    flueGasCO2 = (totalCO2 / dryFlueGasVolume) * 100
    flueGasN2 = ((totalN2FromFuel + n2FromAir) / dryFlueGasVolume) * 100
  }

  let h2oInFlueGas = 0
  if (wetFlueGasVolume > 0) {
    h2oInFlueGas = (totalH2O / wetFlueGasVolume) * 100
  }

  let densityWetFlue = 0
  if (wetFlueGasVolume > 0) {
    const flueGasMolarMass = (
      totalCO2 * 44.01 +
      excessO2 * 32.0 +
      (totalN2FromFuel + n2FromAir) * 28.014 +
      totalH2O * 18.02
    ) / wetFlueGasVolume
    densityWetFlue = flueGasMolarMass / MOLAR_VOLUME
  }

  return {
    density,
    relative_density: relativeDensity,
    lower_heating_value: lowerHeatingValue,
    minimum_air_requirement: minimumAirRequirement,
    burner_capacity: burnerCapacity,
    gas_flow_rate: gasFlowRate,
    air_fuel_ratio: actualAirRatio,
    air_flow_rate: airFlowRate,
    flue_gas_o2: flueGasO2,
    flue_gas_co2: flueGasCO2,
    flue_gas_n2: flueGasN2,
    dry_flue_gas_volume: dryFlueGasVolume,
    h2o_in_flue_gas: h2oInFlueGas,
    wet_flue_gas_volume: wetFlueGasVolume,
    density_of_wet_flue_gas: densityWetFlue,
  }
}

export default function CustomGasCalculator() {
  const [gasComposition, setGasComposition] = useState<GasComposition>({ CH4: 100.0 })
  const [capacityParams, setCapacityParams] = useState<CapacityParams>({
    excess_air_ratio: 1.2,
    burner_capacity: 100.0
  })
  const [excessAirRatio, setExcessAirRatio] = useState(1.2)
  const [result, setResult] = useState<CustomGasResult | null>(null)

  const totalPercentage = Object.values(gasComposition).reduce((sum: number, val: number | undefined) => sum + (val || 0), 0)
  const isTotalValid = Math.abs(totalPercentage - 100) < 0.1 || totalPercentage === 0

  const handleGasChange = (key: string, value: string) => {
    let numVal: number | undefined = parseFloat(value)
    if (isNaN(numVal)) {
      numVal = undefined
    }
    setGasComposition(prev => ({
      ...prev,
      [key]: numVal
    }))
  }

  const handleCapacityChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setCapacityParams(prev => ({
      ...prev,
      [key]: numValue
    }))
  }

  const performCalculation = () => {
    const calcResult = calculateCustomGasLocally(gasComposition, capacityParams, excessAirRatio)
    setResult(calcResult)
  }

  useEffect(() => {
    performCalculation()
  }, [])

  if (!result) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            to="/"
            className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors mr-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
        </div>
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Burner Design Pro - Custom Gas Calculator</h1>
          <button
            onClick={performCalculation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Calculate
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">Gas type</span>
                <div className="flex items-center gap-1 px-2 py-1 border border-slate-400 rounded-sm bg-slate-50">
                  <span className="text-sm">Enter %-by vol.</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white text-sm">
                    <th className="px-3 py-2 text-left">Gas</th>
                    <th className="px-3 py-2 text-center">Vol.-%</th>
                  </tr>
                </thead>
                <tbody>
                  {GAS_OPTIONS.map((gas, index) => (
                    <tr key={gas.key} className={index % 2 === 0 ? 'bg-slate-200' : 'bg-slate-300'}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{gas.name}</span>
                          <span className="text-sm text-slate-600">{gas.formula}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={gasComposition[gas.key] ?? ''}
                          onChange={(e) => handleGasChange(gas.key, e.target.value)}
                          placeholder="0"
                          className="w-24 px-2 py-1 border border-slate-400 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-400">
                    <td className="px-3 py-2 font-medium">Total</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={totalPercentage.toFixed(1)}
                        readOnly
                        className={`w-24 px-2 py-1 border rounded text-center font-semibold ${isTotalValid ? 'border-slate-400 text-slate-800' : 'border-red-500 text-red-600'}`}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Customer-specific gas:</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Density</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.density.toFixed(4)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">kg/m³</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Relative density</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.relative_density.toFixed(4)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Lower heating value<br />Hi (Hu)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.lower_heating_value.toFixed(4)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">kWh/m³</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Minimum air require-<br />ment Lmin</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.minimum_air_requirement.toFixed(4)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">m³/m³ (λ=1)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Capacity/Flow rate</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Burner capacity</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={capacityParams.burner_capacity || 0}
                      onChange={(e) => handleCapacityChange('burner_capacity', e.target.value)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">kW</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Gas flow rate</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.gas_flow_rate.toFixed(2)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">m³/h</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Gas/Air ratio λ</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="1.0"
                      max="3.0"
                      value={excessAirRatio}
                      onChange={(e) => setExcessAirRatio(parseFloat(e.target.value) || 1.0)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Air flow rate</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.air_flow_rate.toFixed(2)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">m³/h</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-200 rounded-lg shadow p-4">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Flue gas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">O2</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.flue_gas_o2.toFixed(2)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-white text-right"
                    />
                    <span className="text-sm text-slate-600">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">CO2</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.flue_gas_co2.toFixed(2)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">N2</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.flue_gas_n2.toFixed(2)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Dry flue gas volume</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.dry_flue_gas_volume.toFixed(4)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">m³/m³</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">H2O</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.h2o_in_flue_gas.toFixed(2)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">m³/m³ ≈</span>
                    <input
                      type="text"
                      readOnly
                      value={result.h2o_in_flue_gas.toFixed(2)}
                      className="w-20 px-2 py-1 border border-slate-400 rounded bg-slate-200 text-right"
                    />
                    <span className="text-sm text-slate-600">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Wet flue gas volume</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.wet_flue_gas_volume.toFixed(4)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">m³/m³</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-right w-48 pr-4">Density of wet flue gas</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={result.density_of_wet_flue_gas.toFixed(4)}
                      className="w-32 px-2 py-1 border border-slate-400 rounded bg-slate-100 text-right"
                    />
                    <span className="text-sm text-slate-600">kg/m³</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
