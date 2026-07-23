import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFuels, getFuel, calculateCombustion, Fuel, FuelDetail, CombustionParams, CombustionResult } from '../services/api'
import { Navbar } from '../components/Navbar'

export default function Calculator() {
  const [currentStep, setCurrentStep] = useState(1)
  const [fuels, setFuels] = useState<Fuel[]>([])
  const [selectedFuel, setSelectedFuel] = useState<FuelDetail | null>(null)
  const [excessAirRatio, setExcessAirRatio] = useState(1.2)
  const [airTemperature, setAirTemperature] = useState(25)
  const [airHumidity, setAirHumidity] = useState(50)
  const [result, setResult] = useState<CombustionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFuels()
  }, [])

  const loadFuels = async () => {
    try {
      const data = await getFuels()
      setFuels(data)
    } catch (err) {
      setError('Failed to load fuels')
    }
  }

  const handleFuelSelect = async (fuelId: string) => {
    try {
      const fuel = await getFuel(fuelId)
      setSelectedFuel(fuel)
      setError(null)
    } catch (err) {
      setError('Failed to load fuel details')
    }
  }

  const calculate = async () => {
    if (!selectedFuel) return

    setLoading(true)
    setError(null)
    try {
      const params: CombustionParams = {
        fuel_id: selectedFuel.id,
        excess_air_ratio: excessAirRatio,
        air_temperature: airTemperature,
        air_humidity: airHumidity,
      }
      const data = await calculateCombustion(params)
      setResult(data)
    } catch (err) {
      setError('Failed to calculate combustion')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && selectedFuel) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      calculate()
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      gas: 'Gas',
      liquid: 'Liquid',
      solid: 'Solid',
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      gas: 'bg-blue-100 text-blue-800',
      liquid: 'bg-amber-100 text-amber-800',
      solid: 'bg-green-100 text-green-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {step}
                </div>
                <div
                  className={`ml-2 mr-4 text-sm font-medium ${
                    currentStep >= step ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step === 1 && 'Select Fuel'}
                  {step === 2 && 'Parameters'}
                  {step === 3 && 'Results'}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6 transition-colors duration-200">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Select Fuel</h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Choose a fuel type
                </label>
                <select
                  className="w-full p-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200"
                  value={selectedFuel?.id || ''}
                  onChange={(e) => handleFuelSelect(e.target.value)}
                >
                  <option value="">Select a fuel...</option>
                  {fuels.map((fuel) => (
                    <option key={fuel.id} value={fuel.id}>
                      {fuel.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFuel && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {selectedFuel.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Category</span>
                      <p className="mt-1">
                        <span className={`px-2 py-1 rounded text-sm ${getCategoryColor(selectedFuel.category)}`}>
                          {getCategoryLabel(selectedFuel.category)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">LHV</span>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedFuel.LHV.toLocaleString()} kJ/kg
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">HHV</span>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedFuel.HHV.toLocaleString()} kJ/kg
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Max CO2</span>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedFuel.CO2_max}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Composition</h4>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <div className="text-center">
                        <span className="text-slate-500 dark:text-slate-400">C</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedFuel.composition.C}%</p>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-500 dark:text-slate-400">H</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedFuel.composition.H}%</p>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-500 dark:text-slate-400">O</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedFuel.composition.O}%</p>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-500 dark:text-slate-400">N</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedFuel.composition.N}%</p>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-500 dark:text-slate-400">S</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedFuel.composition.S}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Combustion Parameters</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Excess Air Ratio (λ): {excessAirRatio.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={excessAirRatio}
                    onChange={(e) => setExcessAirRatio(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>1.0 (Stoichiometric)</span>
                    <span>3.0</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Air Temperature: {airTemperature}°C
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="200"
                    step="5"
                    value={airTemperature}
                    onChange={(e) => setAirTemperature(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>-10°C</span>
                    <span>200°C</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Air Humidity: {airHumidity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={airHumidity}
                    onChange={(e) => setAirHumidity(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>0% (Dry)</span>
                    <span>100% (Saturated)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">Selected Fuel</h4>
                <p className="text-blue-900 dark:text-blue-300">{selectedFuel?.name}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  LHV: {selectedFuel?.LHV.toLocaleString()} kJ/kg
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Combustion Results</h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {result.fuel.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">LHV:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">{result.fuel.LHV.toLocaleString()} kJ/kg</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">HHV:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">{result.fuel.HHV.toLocaleString()} kJ/kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-100 dark:border-blue-800/30">
                      <span className="text-sm text-blue-600 dark:text-blue-400">Theoretical AFR</span>
                      <p className="text-lg md:text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                        {result.theoretical_afr}
                      </p>
                      <span className="text-xs text-blue-600 dark:text-blue-400">kg air / kg fuel</span>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center border border-green-100 dark:border-green-800/30">
                      <span className="text-sm text-green-600 dark:text-green-400">Actual AFR</span>
                      <p className="text-lg md:text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
                        {result.actual_afr}
                      </p>
                      <span className="text-xs text-green-600 dark:text-green-400">kg air / kg fuel</span>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center border border-amber-100 dark:border-amber-800/30">
                      <span className="text-sm text-amber-600 dark:text-amber-400">Excess Air</span>
                      <p className="text-lg md:text-2xl font-bold text-amber-900 dark:text-amber-300 mt-1">
                        {(result.excess_air_ratio - 1) * 100}%
                      </p>
                      <span className="text-xs text-amber-600 dark:text-amber-400">λ = {result.excess_air_ratio}</span>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center border border-red-100 dark:border-red-800/30">
                      <span className="text-sm text-red-600 dark:text-red-400">Flame Temp</span>
                      <p className="text-lg md:text-2xl font-bold text-red-900 dark:text-red-300 mt-1">
                        {result.adiabatic_flame_temp.toFixed(0)}°
                      </p>
                      <span className="text-xs text-red-600 dark:text-red-400">Celsius</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">Flue Gas Composition (Wet Basis)</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 mb-2">
                          <div
                            className="bg-slate-600 dark:bg-slate-400 h-2 rounded-full"
                            style={{ width: `${result.flue_gas_composition.N2}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">N2</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{result.flue_gas_composition.N2}%</p>
                      </div>
                      <div className="text-center">
                        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 mb-2">
                          <div
                            className="bg-slate-400 dark:bg-slate-300 h-2 rounded-full"
                            style={{ width: `${result.flue_gas_composition.CO2}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">CO2</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{result.flue_gas_composition.CO2}%</p>
                      </div>
                      <div className="text-center">
                        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-400 dark:bg-blue-500 h-2 rounded-full"
                            style={{ width: `${result.flue_gas_composition.H2O}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">H2O</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{result.flue_gas_composition.H2O}%</p>
                      </div>
                      <div className="text-center">
                        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-300 dark:bg-blue-400 h-2 rounded-full"
                            style={{ width: `${result.flue_gas_composition.O2}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">O2</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{result.flue_gas_composition.O2}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-2">Combustion Parameters Used</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-amber-600 dark:text-amber-400">Excess Air Ratio:</span>
                        <span className="ml-2 font-medium text-amber-900 dark:text-amber-300">{excessAirRatio}</span>
                      </div>
                      <div>
                        <span className="text-amber-600 dark:text-amber-400">Air Temperature:</span>
                        <span className="ml-2 font-medium text-amber-900 dark:text-amber-300">{airTemperature}°C</span>
                      </div>
                      <div>
                        <span className="text-amber-600 dark:text-amber-400">Air Humidity:</span>
                        <span className="ml-2 font-medium text-amber-900 dark:text-amber-300">{airHumidity}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-xl font-medium transition-colors duration-200 ${
                currentStep === 1
                  ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20'
              }`}
            >
              Back
            </button>
            {currentStep < 3 && (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedFuel}
                className={`px-6 py-2 rounded-xl font-medium transition-colors duration-200 ${
                  currentStep === 1 && !selectedFuel
                    ? 'bg-blue-300 dark:bg-blue-800 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            )}
            {currentStep === 3 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
