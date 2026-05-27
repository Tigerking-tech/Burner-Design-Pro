import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GAS_COMPONENTS = [
  { name: 'Methane', formula: 'CH₄', key: 'ch4' },
  { name: 'Ethane', formula: 'C₂H₆', key: 'c2h6' },
  { name: 'Propane', formula: 'C₃H₈', key: 'c3h8' },
  { name: 'Butane', formula: 'C₄H₁₀', key: 'c4h10' },
  { name: 'Nitrogen', formula: 'N₂', key: 'n2' },
  { name: 'Carbon Dioxide', formula: 'CO₂', key: 'co2' },
]

const MOLAR_MASSES: Record<string, number> = {
  ch4: 16.04, c2h6: 30.07, c3h8: 44.10, c4h10: 58.12, n2: 28.01, co2: 44.01
}

const NET_HEATING_VALUES: Record<string, number> = {
  ch4: 35.8, c2h6: 64.3, c3h8: 91.3, c4h10: 117.5, n2: 0, co2: 0
}

const AIR_STOICHIOMETRIC: Record<string, number> = {
  ch4: 9.52, c2h6: 16.66, c3h8: 23.80, c4h10: 30.94, n2: 0, co2: 0
}

export default function CustomGasCalculator() {
  const [composition, setComposition] = useState<Record<string, number>>({
    ch4: 90, c2h6: 5, c3h8: 2, c4h10: 1, n2: 2, co2: 0
  })
  const [results, setResults] = useState<{
    density: number
    lhv: number
    minAir: number
    co2: number
    h2o: number
  } | null>(null)

  useEffect(() => {
    calculateResults()
  }, [composition])

  const handleInputChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0
    const newComposition = { ...composition, [key]: Math.min(100, Math.max(0, numValue)) }
    
    const total = Object.values(newComposition).reduce((sum, val) => sum + val, 0)
    if (total > 100) {
      const scale = 100 / total
      Object.keys(newComposition).forEach(k => {
        newComposition[k] = Math.round(newComposition[k] * scale * 10) / 10
      })
    }
    
    setComposition(newComposition)
  }

  const calculateResults = () => {
    const totalPercent = Object.values(composition).reduce((sum, val) => sum + val, 0)
    if (totalPercent < 99 || totalPercent > 101) {
      setResults(null)
      return
    }

    let weightedMolarMass = 0
    let weightedLHV = 0
    let weightedMinAir = 0

    Object.keys(composition).forEach(key => {
      const percent = composition[key] / 100
      weightedMolarMass += MOLAR_MASSES[key] * percent
      weightedLHV += NET_HEATING_VALUES[key] * percent
      weightedMinAir += AIR_STOICHIOMETRIC[key] * percent
    })

    const density = weightedMolarMass / 22.4
    const co2Production = composition.ch4 / 100 * 1 + 
                          composition.c2h6 / 100 * 2 + 
                          composition.c3h8 / 100 * 3 + 
                          composition.c4h10 / 100 * 4
    const h2oProduction = composition.ch4 / 100 * 2 + 
                          composition.c2h6 / 100 * 3 + 
                          composition.c3h8 / 100 * 4 + 
                          composition.c4h10 / 100 * 5

    setResults({
      density: Math.round(density * 1000) / 1000,
      lhv: Math.round(weightedLHV * 10) / 10,
      minAir: Math.round(weightedMinAir * 100) / 100,
      co2: Math.round(co2Production * 100) / 100,
      h2o: Math.round(h2oProduction * 100) / 100
    })
  }

  const loadPreset = (preset: string) => {
    const presets: Record<string, Record<string, number>> = {
      naturalGas: { ch4: 90, c2h6: 5, c3h8: 2, c4h10: 1, n2: 2, co2: 0 },
      methane: { ch4: 100, c2h6: 0, c3h8: 0, c4h10: 0, n2: 0, co2: 0 },
      propane: { ch4: 0, c2h6: 0, c3h8: 100, c4h10: 0, n2: 0, co2: 0 },
      butane: { ch4: 0, c2h6: 0, c3h8: 0, c4h10: 100, n2: 0, co2: 0 }
    }
    if (presets[preset]) {
      setComposition(presets[preset])
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-2xl font-semibold tracking-tight hover:text-white transition-colors">
            <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
          </Link>
        </div>
        <div className="flex gap-8 items-center">
          <Link to="/" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Home</Link>
          <Link to="/unit-converter" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Unit Converter</Link>
          <Link to="/emission" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Emission Calculator</Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-semibold mb-3">Gas Combustion Calculator</h1>
          <p className="text-[#bdc3c7] text-lg">Configure custom gas compositions and calculate combustion parameters</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg p-8 border border-gray-300 shadow-lg">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-[#2c3e50]">Gas Composition</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => loadPreset('naturalGas')}
                  className="px-3 py-1.5 bg-[#f39c12] text-white rounded text-xs font-medium hover:bg-[#e67e22] transition-colors"
                >
                  Natural Gas
                </button>
                <button 
                  onClick={() => loadPreset('methane')}
                  className="px-3 py-1.5 bg-gray-200 text-[#2c3e50] rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                >
                  Pure CH₄
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {GAS_COMPONENTS.map((gas) => (
                <div key={gas.key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-medium text-[#2c3e50]">{gas.name}</div>
                      <div className="text-sm text-[#7f8c8d]">{gas.formula}</div>
                    </div>
                    <div className="text-2xl font-semibold text-[#f39c12]">{composition[gas.key]}%</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={composition[gas.key]}
                    onChange={(e) => handleInputChange(gas.key, e.target.value)}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#f39c12]"
                  />
                  <div className="flex justify-between text-xs text-[#7f8c8d] mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800 font-medium">Total Composition:</span>
                <span className={`text-lg font-semibold ${Math.abs(Object.values(composition).reduce((a, b) => a + b, 0) - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                  {Object.values(composition).reduce((a, b) => a + b, 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-8 border border-gray-300 shadow-lg">
              <h2 className="text-xl font-semibold text-[#2c3e50] mb-6 pb-4 border-b border-gray-200">
                Calculation Results
              </h2>

              {results ? (
                <div className="space-y-4">
                  <div className="bg-[#2c3e50] rounded-lg p-5">
                    <div className="text-sm text-[#bdc3c7] mb-1">Gas Density</div>
                    <div className="text-3xl font-bold text-white">{results.density} <span className="text-lg font-normal text-[#bdc3c7]">kg/m³</span></div>
                  </div>

                  <div className="bg-[#2c3e50] rounded-lg p-5">
                    <div className="text-sm text-[#bdc3c7] mb-1">Lower Heating Value (LHV)</div>
                    <div className="text-3xl font-bold text-[#f39c12]">{results.lhv} <span className="text-lg font-normal text-[#bdc3c7]">MJ/m³</span></div>
                  </div>

                  <div className="bg-[#2c3e50] rounded-lg p-5">
                    <div className="text-sm text-[#bdc3c7] mb-1">Minimum Air Required</div>
                    <div className="text-3xl font-bold text-white">{results.minAir} <span className="text-lg font-normal text-[#bdc3c7]">m³/m³</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="text-xs text-[#7f8c8d] mb-1">CO₂ Production</div>
                      <div className="text-2xl font-bold text-[#2c3e50]">{results.co2}</div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="text-xs text-[#7f8c8d] mb-1">H₂O Production</div>
                      <div className="text-2xl font-bold text-[#2c3e50]">{results.h2o}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[#7f8c8d]">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p>Please adjust composition to total 100%</p>
                </div>
              )}
            </div>

            {/* Formula Reference */}
            <div className="bg-white rounded-lg p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">Reference Formulas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-[#f39c12] font-semibold">Density:</span>
                  <span className="text-[#555]">ρ = Σ(xᵢ × Mᵢ) / 22.4</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#f39c12] font-semibold">LHV:</span>
                  <span className="text-[#555]">Q = Σ(xᵢ × LHVᵢ)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#f39c12] font-semibold">Min Air:</span>
                  <span className="text-[#555]">Vₐ = Σ(xᵢ × Aᵢ)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Tools */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/unit-converter"
            className="bg-white rounded-lg p-6 border border-gray-300 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 bg-[#f39c12]/10 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📐
            </div>
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">Unit Converter</h3>
            <p className="text-sm text-[#7f8c8d]">Convert between different engineering units</p>
          </Link>

          <Link 
            to="/emission"
            className="bg-white rounded-lg p-6 border border-gray-300 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🌱
            </div>
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">Emission Calculator</h3>
            <p className="text-sm text-[#7f8c8d]">Calculate emissions and compliance</p>
          </Link>

          <Link 
            to="/database"
            className="bg-white rounded-lg p-6 border border-gray-300 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📚
            </div>
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">Fuel Database</h3>
            <p className="text-sm text-[#7f8c8d]">Browse standard fuel properties</p>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-8 px-6 mt-16">
        <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
      </footer>
    </div>
  )
}
