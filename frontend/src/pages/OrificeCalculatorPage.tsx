import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import ProFeaturePreview from '../components/ProFeaturePreview'
import { authAPI } from '../services/api'
import { Gauge } from 'lucide-react'

interface GasProperty {
  density: number
  name: string
}

const gasProperties: Record<string, GasProperty> = {
  'natural_gas': { density: 0.78, name: 'Natural Gas' },
  'propane': { density: 2.01, name: 'Propane' },
  'butane': { density: 2.59, name: 'Butane' },
  'hydrogen': { density: 0.09, name: 'Hydrogen' },
  'air': { density: 1.29, name: 'Air' }
}

const pipeDiameters: Record<string, number> = {
  '15': 15.8,
  '20': 21.0,
  '25': 26.6,
  '32': 35.1,
  '40': 40.9,
  '50': 52.5,
  '65': 62.7,
  '80': 77.9,
  '100': 102.3,
  '125': 128.2,
  '150': 154.0,
  '200': 202.7,
  '250': 254.5
}

export default function OrificeCalculatorPage() {
  const navigate = useNavigate()
  const [currentMode, setCurrentMode] = useState('restricting')
  const [gasType, setGasType] = useState('natural_gas')
  const [customDensity, setCustomDensity] = useState('')
  const [nominalSize, setNominalSize] = useState('50')
  const [internalDiameter, setInternalDiameter] = useState('52.5')
  const [flowRate, setFlowRate] = useState('500')
  const [pressureValue, setPressureValue] = useState('50')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState({
    orificeDiameter: '--',
    betaRatio: '--',
    dischargeCoef: '--',
    reynoldsNum: '--'
  })
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const isProUser = authAPI.isAuthenticated() && authAPI.getSubscriptionTier() !== 'free'

  const handleProAction = (action: () => void) => {
    if (!isProUser) {
      setShowSubscriptionModal(true)
    } else {
      action()
    }
  }

  useEffect(() => {
    updateInternalDiameter()
  }, [nominalSize])

  const updateInternalDiameter = () => {
    if (pipeDiameters[nominalSize]) {
      setInternalDiameter(pipeDiameters[nominalSize].toString())
    }
  }

  const getGasDensity = () => {
    if (gasType === 'custom') {
      return parseFloat(customDensity) || 1.0
    }
    return gasProperties[gasType]?.density || 0.78
  }

  const performCalculation = () => {
    const D_mm = parseFloat(internalDiameter)
    const D = D_mm / 1000
    const Q = parseFloat(flowRate) / 3600
    const deltaP = parseFloat(pressureValue) * 100
    const density = getGasDensity()

    if (!D || !Q || !deltaP) {
      alert('Please fill in all required fields')
      return
    }

    const C = 0.61
    const epsilon = 0.98

    const d_squared = Q / (C * epsilon * (Math.PI / 4) * Math.sqrt(2 * deltaP / density))
    const d = Math.sqrt(d_squared)
    const d_mm = d * 1000

    const beta = d / D
    const Re = (4 * Q * density) / (Math.PI * D * 0.000018)
    const Cd = C * (1 - beta) / Math.sqrt(beta)

    setResults({
      orificeDiameter: d_mm.toFixed(2),
      betaRatio: beta.toFixed(4),
      dischargeCoef: Cd.toFixed(4),
      reynoldsNum: Re.toFixed(0)
    })
    setShowResults(true)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Orifice Calculator Report', 20, 20)
    doc.setFontSize(12)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Mode: ${currentMode === 'restricting' ? 'Restricting Orifice' : 'Flow Meter'}`, 20, 40)
    doc.text(`Gas Type: ${gasProperties[gasType]?.name || 'Custom'}`, 20, 50)
    doc.text(`Flow Rate: ${flowRate} m³/h`, 20, 60)
    doc.text(`Pressure Drop: ${pressureValue} mbar`, 20, 70)
    doc.text(`Pipe Diameter: ${internalDiameter} mm`, 20, 80)
    doc.text(`Orifice Diameter: ${results.orificeDiameter} mm`, 20, 90)
    doc.text(`Beta Ratio: ${results.betaRatio}`, 20, 100)
    doc.text(`Discharge Coefficient: ${results.dischargeCoef}`, 20, 110)
    doc.text(`Reynolds Number: ${results.reynoldsNum}`, 20, 120)
    doc.save('orifice-calculator-report.pdf')
  }

  const resetForm = () => {
    setFlowRate('')
    setPressureValue('')
    setShowResults(false)
    setResults({
      orificeDiameter: '--',
      betaRatio: '--',
      dischargeCoef: '--',
      reynoldsNum: '--'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Orifice Calculator</h1>
          <p className="text-gray-400">Calculate orifice plate dimensions for gas flow measurement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-lg shadow-xl p-6">
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Calculation Mode</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentMode('restricting')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    currentMode === 'restricting'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Restricting Orifice
                </button>
                <button
                  onClick={() => setCurrentMode('metering')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    currentMode === 'metering'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Flow Meter
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Gas Type</label>
                <select
                  value={gasType}
                  onChange={(e) => setGasType(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.entries(gasProperties).map(([key, gas]) => (
                    <option key={key} value={key}>{gas.name}</option>
                  ))}
                  <option value="custom">Custom Density</option>
                </select>
              </div>

              {gasType === 'custom' && (
                <div>
                  <label className="block text-gray-300 mb-2">Custom Density (kg/m³)</label>
                  <input
                    type="number"
                    value={customDensity}
                    onChange={(e) => setCustomDensity(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 1.2"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-300 mb-2">Nominal Pipe Size (DN)</label>
                <select
                  value={nominalSize}
                  onChange={(e) => setNominalSize(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.keys(pipeDiameters).map((size) => (
                    <option key={size} value={size}>DN {size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Internal Diameter (mm)</label>
                <input
                  type="number"
                  value={internalDiameter}
                  onChange={(e) => setInternalDiameter(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  {currentMode === 'restricting' ? 'Flow Rate' : 'Required Flow Rate'} (m³/h)
                </label>
                <input
                  type="number"
                  value={flowRate}
                  onChange={(e) => setFlowRate(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  {currentMode === 'restricting' ? 'Max Pressure Drop' : 'Available Pressure Drop'} (mbar)
                </label>
                <input
                  type="number"
                  value={pressureValue}
                  onChange={(e) => setPressureValue(e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 50"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleProAction(performCalculation)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
                >
                  Calculate
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {showResults && (
              <>
                <div className="bg-slate-800 rounded-lg shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Gauge className="w-6 h-6" />
                    Calculation Results
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4">
                      <div className="text-sm text-blue-100 mb-1">Orifice Diameter</div>
                      <div className="text-2xl font-bold text-white">{results.orificeDiameter} mm</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4">
                      <div className="text-sm text-green-100 mb-1">Beta Ratio (β)</div>
                      <div className="text-2xl font-bold text-white">{results.betaRatio}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4">
                      <div className="text-sm text-purple-100 mb-1">Discharge Coefficient</div>
                      <div className="text-2xl font-bold text-white">{results.dischargeCoef}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4">
                      <div className="text-sm text-orange-100 mb-1">Reynolds Number</div>
                      <div className="text-2xl font-bold text-white">{results.reynoldsNum}</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleProAction(exportToPDF)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition"
                    >
                      Export to PDF
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg shadow-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Technical Notes</h3>
                  <div className="text-gray-300 space-y-2 text-sm">
                    <p>• The calculation follows ISO 5167 standards for orifice plates</p>
                    <p>• Discharge coefficient C = 0.61 (typical value)</p>
                    <p>• Expansion coefficient ε = 0.98 (for gases)</p>
                    <p>• Beta ratio should ideally be between 0.2 and 0.7</p>
                    <p>• Reynolds number should be &gt; 5000 for accurate measurement</p>
                  </div>
                </div>
              </>
            )}

            {!showResults && (
              <div className="bg-slate-800 rounded-lg shadow-xl p-12 text-center">
                <Gauge className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Enter Parameters to Calculate
                </h3>
                <p className="text-gray-500">
                  Fill in the gas properties and flow parameters on the left to calculate orifice dimensions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Pro Feature</h3>
            <p className="text-gray-300 mb-6">
              This feature is available for Pro users. Upgrade your account to unlock advanced calculations and export features.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/subscription')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
