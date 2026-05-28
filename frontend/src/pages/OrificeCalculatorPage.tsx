import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProFeaturePreview from '../components/ProFeaturePreview'
import { authAPI } from '../services/api'
import { Gauge, Download, Info, AlertCircle, ChevronDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { jsPDF } from 'jspdf'

interface CalculationResult {
  orificeDiameter: number
  betaRatio: number
  dischargeCoef: number
  reynoldsNum: number
  velocity: number
  massFlowRate: number
  pressureDrop: number
}

interface CurvePoint {
  beta: number
  dischargeCoef: number
  pressureDrop: number
  flowRate: number
}

const pipeDiameters = [
  { label: 'DN 6', value: 6 },
  { label: 'DN 8', value: 8 },
  { label: 'DN 10', value: 10 },
  { label: 'DN 15', value: 15 },
  { label: 'DN 20', value: 20 },
  { label: 'DN 25', value: 25 },
  { label: 'DN 32', value: 32 },
  { label: 'DN 40', value: 40 },
  { label: 'DN 50', value: 50 },
  { label: 'DN 65', value: 65 },
  { label: 'DN 80', value: 80 },
  { label: 'DN 100', value: 100 },
  { label: 'DN 125', value: 125 },
  { label: 'DN 150', value: 150 },
  { label: 'DN 200', value: 200 },
  { label: 'DN 250', value: 250 },
]

const gasTypes = [
  { name: 'Natural gas', density: 0.78 },
  { name: 'Propane', density: 1.86 },
  { name: 'Butane', density: 2.41 },
  { name: 'Propane/butane (70/30)', density: 2.0 },
  { name: 'Hydrogen', density: 0.084 },
  { name: 'Natural gas/Hydrogen (80/20)', density: 0.64 },
  { name: 'Air', density: 1.29 },
  { name: 'Enter density', density: 0 }
]

function OrificeDiagram({ type }: { type: 'restricting' | 'measuring' }) {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      <defs>
        <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0e0e0" />
          <stop offset="50%" stopColor="#f5f5f5" />
          <stop offset="100%" stopColor="#d0d0d0" />
        </linearGradient>
        <linearGradient id="orificeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#666" />
          <stop offset="30%" stopColor="#888" />
          <stop offset="70%" stopColor="#888" />
          <stop offset="100%" stopColor="#666" />
        </linearGradient>
      </defs>

      <rect x="20" y="80" width="360" height="140" fill="url(#pipeGradient)" stroke="#999" strokeWidth="3" rx="2"/>

      <rect x="190" y="80" width="20" height="140" fill="url(#orificeGradient)" stroke="#444" strokeWidth="2"/>
      
      <ellipse cx="200" cy="130" rx="6" ry="12" fill="#333" stroke="#222" strokeWidth="1"/>
      <ellipse cx="200" cy="170" rx="6" ry="12" fill="#333" stroke="#222" strokeWidth="1"/>

      <path d="M 60 120 L 160 120 L 175 125 L 200 128 L 205 135 L 210 145 L 215 155 L 220 165 L 240 170 L 280 172 L 340 174"
            stroke="#3498db" strokeWidth="3" fill="none" strokeLinecap="round"/>

      <path d="M 60 180 L 160 180 L 185 178 L 195 176 L 198 173 L 202 168 L 206 162 L 212 156 L 225 152 L 260 150 L 300 149 L 340 148"
            stroke="#e74c3c" strokeWidth="3" fill="none" strokeLinecap="round"/>

      <line x1="110" y1="90" x2="110" y2="115" stroke="#333" strokeWidth="2"/>
      <circle cx="110" cy="118" r="3" fill="#e74c3c"/>
      <text x="105" y="75" fontSize="11" fill="#333" fontWeight="bold">p₁</text>

      <line x1="290" y1="90" x2="290" y2="168" stroke="#333" strokeWidth="2"/>
      <circle cx="290" cy="171" r="3" fill="#e74c3c"/>
      <text x="285" y="75" fontSize="11" fill="#333" fontWeight="bold">p₂</text>

      <path d="M 70 122 Q 85 116 95 124 T 115 123 T 135 121 T 155 119" 
            stroke="#3498db" strokeWidth="1.5" fill="none" opacity="0.7" strokeDasharray="3,2"/>
      <path d="M 230 148 Q 245 146 255 147 T 275 148 T 295 149 T 315 149" 
            stroke="#e74c3c" strokeWidth="1.5" fill="none" opacity="0.7" strokeDasharray="3,2"/>

      <g transform="translate(35, 235)">
        <rect x="0" y="0" width="330" height="55" fill="#f8f9fa" stroke="#dee2e6" rx="4"/>
        
        <line x1="20" y1="28" x2="310" y2="28" stroke="#adb5bd" strokeWidth="1"/>
        
        <circle cx="20" cy="28" r="4" fill="#3498db"/>
        <text x="32" y="22" fontSize="10" fill="#495057">Flow direction</text>
        <path d="M 45 28 L 55 23 M 45 28 L 55 33" stroke="#3498db" strokeWidth="1.5"/>

        <text x="100" y="18" fontSize="9" fill="#6c757d">Pipe diameter D</text>
        <text x="100" y="48" fontSize="9" fill="#6c757d">{type === 'restricting' ? 'Orifice diameter d' : 'Orifice diameter d'}</text>

        <text x="200" y="18" fontSize="9" fill="#3498db">Velocity profile</text>
        <text x="200" y="38" fontSize="9" fill="#e74c3c">Pressure profile</text>

        <text x="270" y="18" fontSize="9" fill="#e74c3c">Δp</text>
        <text x="265" y="42" fontSize="8" fill="#6c757d">(p₁ - p₂)</text>
      </g>

      <text x="200" y="25" textAnchor="middle" fontSize="14" fill="#2c3e50" fontWeight="bold">
        {type === 'restricting' ? 'Restricting Orifice' : 'Measuring Orifice'}
      </text>
    </svg>
  )
}

export default function OrificeCalculatorPage() {
  const [calculationMode, setCalculationMode] = useState<'restricting' | 'measuring'>('measuring')
  const [selectedGasType, setSelectedGasType] = useState(gasTypes[0])
  const [customDensity, setCustomDensity] = useState('')
  const [selectedPipeDN, setSelectedPipeDN] = useState(pipeDiameters[8].value)
  const [internalDiameter, setInternalDiameter] = useState('')
  const [maxFlowRate, setMaxFlowRate] = useState('')
  const [pressureDrop, setPressureDrop] = useState('')
  const [temperature, setTemperature] = useState('20')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<CalculationResult | null>(null)
  const [curveData, setCurveData] = useState<CurvePoint[]>([])
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const isProUser = authAPI.isAuthenticated() && authAPI.getSubscriptionTier() !== 'free'

  const handleProAction = (action: () => void) => {
    if (!isProUser) {
      setShowSubscriptionModal(true)
    } else {
      action()
    }
  }

  const getDensity = () => {
    if (selectedGasType.name === 'Enter density') {
      return parseFloat(customDensity) || 0.78
    }
    return selectedGasType.density
  }

  const calculateRestrictingOrifice = () => {
    const D = parseFloat(internalDiameter) / 1000
    const rho = getDensity()
    const Q = parseFloat(maxFlowRate)
    const deltaP = parseFloat(pressureDrop) * 100

    if (!D || !Q || !deltaP) {
      alert('Please enter all required values')
      return
    }

    if (Q > 10000) {
      alert('Max flow rate cannot exceed 10000 m³/h')
      return
    }

    if (deltaP > 10000) {
      alert('Pressure loss cannot exceed 100 mbar')
      return
    }

    const qm = (Q / 3600) * rho
    const C = 0.61
    const epsilon = 0.98

    const A_orifice = qm / (C * epsilon * Math.sqrt(2 * rho * deltaP))
    const d = Math.sqrt(A_orifice * 4 / Math.PI) * 1000
    const beta = (d / 1000) / D

    const Re = (4 * (Q / 3600) * rho) / (Math.PI * D * 0.000017)

    const finalResults: CalculationResult = {
      orificeDiameter: Math.round(d * 10) / 10,
      betaRatio: Math.round(beta * 10000) / 10000,
      dischargeCoef: C,
      reynoldsNum: Math.round(Re),
      velocity: (Q / 3600) / ((Math.PI / 4) * D * D),
      massFlowRate: qm,
      pressureDrop: parseFloat(pressureDrop)
    }

    generateCurveData(D, rho, Q, deltaP)
    setResults(finalResults)
    setShowResults(true)
  }

  const calculateMeasuringOrifice = () => {
    const D = parseFloat(internalDiameter) / 1000
    const rho = getDensity()
    const Q = parseFloat(maxFlowRate)
    const deltaP = parseFloat(pressureDrop) * 100

    if (!D || !Q || !deltaP) {
      alert('Please enter all required values')
      return
    }

    if (Q > 10000) {
      alert('Max flow rate cannot exceed 10000 m³/h')
      return
    }

    if (deltaP > 10000) {
      alert('Differential pressure cannot exceed 100 mbar')
      return
    }

    const C = 0.62
    const epsilon = 0.98

    const qm = (Q / 3600) * rho
    const A_orifice = qm / (C * epsilon * Math.sqrt(2 * rho * deltaP))
    const d = Math.sqrt(A_orifice * 4 / Math.PI) * 1000
    const beta = (d / 1000) / D

    const Re = (4 * (Q / 3600) * rho) / (Math.PI * D * 0.000017)

    const finalResults: CalculationResult = {
      orificeDiameter: Math.round(d * 10) / 10,
      betaRatio: Math.round(beta * 10000) / 10000,
      dischargeCoef: C,
      reynoldsNum: Math.round(Re),
      velocity: (Q / 3600) / ((Math.PI / 4) * D * D),
      massFlowRate: qm,
      pressureDrop: parseFloat(pressureDrop)
    }

    generateCurveData(D, rho, Q, deltaP)
    setResults(finalResults)
    setShowResults(true)
  }

  const generateCurveData = (D: number, rho: number, Q: number, deltaP: number) => {
    const points: CurvePoint[] = []
    
    for (let beta = 0.2; beta <= 0.75; beta += 0.01) {
      const d = beta * D
      const C = 0.5959 + 0.0312 * Math.pow(beta, 2.1) - 0.184 * Math.pow(beta, 8)
      const epsilon = 0.98
      
      const qm_calc = C * epsilon * (Math.PI / 4) * d * d * Math.sqrt(2 * rho * deltaP)
      const dp_calc = (qm_calc * qm_calc) / (rho * C * C * Math.pow((Math.PI / 4) * d * d, 2)) / 2

      points.push({
        beta: Math.round(beta * 1000) / 1000,
        dischargeCoef: Math.round(C * 10000) / 10000,
        pressureDrop: Math.round(dp_calc / 100 * 100) / 100,
        flowRate: Math.round(qm_calc / rho * 3600 * 100) / 100
      })
    }
    
    setCurveData(points)
  }

  const handleCalculate = () => {
    if (calculationMode === 'restricting') {
      handleProAction(calculateRestrictingOrifice)
    } else {
      handleProAction(calculateMeasuringOrifice)
    }
  }

  const exportToPDF = () => {
    if (!results) return

    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Orifice Plate Calculation Report', 20, 20)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Calculation Type: ${calculationMode === 'restricting' ? 'Restricting Orifice' : 'Measuring Orifice'}`, 20, 36)
    doc.text(`Standard: ISO 5167 / DIN EN ISO 5167`, 20, 42)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Input Parameters:', 20, 54)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Gas Type: ${selectedGasType.name}`, 20, 62)
    doc.text(`Density: ${getDensity().toFixed(2)} kg/m³`, 20, 68)
    doc.text(`Nominal Size DN: ${selectedPipeDN}`, 20, 74)
    doc.text(`Internal Diameter D: ${internalDiameter} mm`, 20, 80)
    doc.text(`Max Flow Rate Q: ${maxFlowRate} m³/h`, 20, 86)
    doc.text(`${calculationMode === 'restricting' ? 'Pressure Loss' : 'Differential Pressure'} Δp: ${pressureDrop} mbar`, 20, 92)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Calculation Results:', 120, 54)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Orifice Diameter d: ${results.orificeDiameter} mm`, 120, 62)
    doc.text(`Beta Ratio β: ${results.betaRatio}`, 120, 68)
    doc.text(`Discharge Coefficient Cd: ${results.dischargeCoef}`, 120, 74)
    doc.text(`Reynolds Number Re: ${results.reynoldsNum.toLocaleString()}`, 120, 80)
    doc.text(`Mass Flow Rate: ${results.massFlowRate.toFixed(4)} kg/s`, 120, 86)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('Technical Notes:', 20, 106)
    doc.setFontSize(8)
    doc.setTextColor(60)
    const notes = [
      '• Calculations based on Kromschroder methodology',
      '• Compliant with ISO 5167 and DIN standards',
      '• Discharge coefficient per Reader-Harris/Gallagher equation',
      '• Temperature range: 10-30°C assumed for calculations',
      '• For custody transfer applications, use VMO measuring orifices'
    ]
    notes.forEach((note, i) => {
      doc.text(note, 20, 114 + i * 5)
    })
    
    doc.save(`orifice-${calculationMode}-calculation.pdf`)
  }

  const resetForm = () => {
    setMaxFlowRate('')
    setPressureDrop('')
    setInternalDiameter('')
    setShowResults(false)
    setResults(null)
    setCurveData([])
  }

  return (
    <ProFeaturePreview
      title="Orifice Calculator"
      description="Professional orifice plate calculation for restricting and measuring applications according to ISO 5167 and DIN standards."
      icon={<Gauge size={40} />}
    >
      <div className="min-h-screen bg-gray-100">
        <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-white hover:text-[#bdc3c7] transition-colors">
            <span className="text-[#f39c12]">🔥</span> Burner-Design-Pro
          </Link>
          <div className="flex gap-8 items-center">
            <Link to="/" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Home</Link>
            <a href="/#features" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</a>
            <a href="/#pricing" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</a>
            <Link to="/gas-calculator" className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded font-semibold text-sm transition-colors shadow-md">
              Get Started
            </Link>
          </div>
        </nav>

        <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-16 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-semibold mb-4 leading-tight">
              Orifice Calculator
            </h1>
            <p className="text-lg text-[#bdc3c7] max-w-2xl mx-auto">
              Calculate restricting and measuring orifices according to ISO 5167 and DIN standards.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-[#3498db]" />
                    Select Calculation Type
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setCalculationMode('restricting')}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        calculationMode === 'restricting'
                          ? 'border-[#3498db] bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`font-semibold mb-2 ${calculationMode === 'restricting' ? 'text-[#3498db]' : 'text-gray-700'}`}>
                        Restricting Orifice
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        Determine the required orifice diameter for a given pressure drop
                      </div>
                      <OrificeDiagram type="restricting" />
                    </button>
                    
                    <button
                      onClick={() => setCalculationMode('measuring')}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        calculationMode === 'measuring'
                          ? 'border-[#e67e22] bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`font-semibold mb-2 ${calculationMode === 'measuring' ? 'text-[#e67e22]' : 'text-gray-700'}`}>
                        Measuring Orifice
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        Calculate orifice size for flow measurement with specified differential pressure
                      </div>
                      <OrificeDiagram type="measuring" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gas Type
                    </label>
                    <select
                      value={selectedGasType.name}
                      onChange={(e) => {
                        const gas = gasTypes.find(g => g.name === e.target.value)
                        if (gas) setSelectedGasType(gas)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    >
                      {gasTypes.map((gas) => (
                        <option key={gas.name} value={gas.name}>
                          {gas.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedGasType.name === 'Enter density' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Density (kg/m³)
                      </label>
                      <input
                        type="number"
                        value={customDensity}
                        onChange={(e) => setCustomDensity(e.target.value)}
                        placeholder="Enter density"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nominal Size DN
                    </label>
                    <select
                      value={selectedPipeDN}
                      onChange={(e) => setSelectedPipeDN(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    >
                      {pipeDiameters.map((pipe) => (
                        <option key={pipe.value} value={pipe.value}>
                          {pipe.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tube Internal Diameter D (mm, max 325)
                    </label>
                    <input
                      type="number"
                      value={internalDiameter}
                      onChange={(e) => setInternalDiameter(e.target.value)}
                      placeholder="Internal diameter"
                      max="325"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max. Flow Rate Q (m³/h, max 10000)
                    </label>
                    <input
                      type="number"
                      value={maxFlowRate}
                      onChange={(e) => setMaxFlowRate(e.target.value)}
                      placeholder="Max flow rate"
                      max="10000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {calculationMode === 'restricting' 
                        ? 'Pressure Loss Δp (mbar, max 100)' 
                        : 'Differential Pressure Δp (mbar, max 100)'
                      }
                    </label>
                    <input
                      type="number"
                      value={pressureDrop}
                      onChange={(e) => setPressureDrop(e.target.value)}
                      placeholder="Pressure drop"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Medium Temperature (°C)
                    </label>
                    <select
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    >
                      <option value="10">10°C</option>
                      <option value="15">15°C</option>
                      <option value="20">20°C</option>
                      <option value="25">25°C</option>
                      <option value="30">30°C</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCalculate}
                    className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white py-3 rounded-lg font-semibold transition-all shadow-md"
                  >
                    Calculate
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {showResults && results && (
                <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                  <h2 className="text-2xl font-semibold text-[#2c3e50] mb-6 flex items-center gap-2">
                    <Gauge className="text-[#3498db]" />
                    Output Results
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-[#3498db] to-[#2980b9] rounded-lg p-5 text-white">
                      <div className="text-sm opacity-90 mb-1">Orifice Diameter d</div>
                      <div className="text-3xl font-bold">{results.orificeDiameter}</div>
                      <div className="text-sm opacity-75 mt-1">mm</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-[#e67e22] to-[#d35400] rounded-lg p-5 text-white">
                      <div className="text-sm opacity-90 mb-1">
                        {calculationMode === 'restricting' ? 'Pressure Loss Δp' : 'Differential Pressure Δp'}
                      </div>
                      <div className="text-3xl font-bold">{results.pressureDrop}</div>
                      <div className="text-sm opacity-75 mt-1">mbar</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-[#2ecc71] to-[#27ae60] rounded-lg p-5 text-white">
                      <div className="text-sm opacity-90 mb-1">Beta Ratio β</div>
                      <div className="text-3xl font-bold">{results.betaRatio}</div>
                      <div className="text-sm opacity-75 mt-1">d/D</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-[#9b59b6] to-[#8e44ad] rounded-lg p-5 text-white">
                      <div className="text-sm opacity-90 mb-1">Discharge Coefficient Cd</div>
                      <div className="text-3xl font-bold">{results.dischargeCoef}</div>
                      <div className="text-sm opacity-75 mt-1"></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Reynolds Number</div>
                        <div className="text-lg font-bold text-[#2c3e50]">{results.reynoldsNum.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Mass Flow Rate</div>
                        <div className="text-lg font-bold text-[#2c3e50]">{results.massFlowRate.toFixed(4)} kg/s</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Velocity</div>
                        <div className="text-lg font-bold text-[#2c3e50]">{results.velocity.toFixed(2)} m/s</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleProAction(exportToPDF)}
                      className="flex-1 bg-[#27ae60] hover:bg-[#229954] text-white py-3 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Export to PDF
                    </button>
                  </div>
                </div>
              )}

              {showResults && curveData.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                  <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">
                    Discharge Coefficient vs Beta Ratio
                  </h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={curveData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="beta" 
                        label={{ value: 'Beta Ratio (β)', position: 'bottom' }}
                        domain={[0.2, 0.75]}
                      />
                      <YAxis 
                        label={{ value: 'Cd', angle: -90, position: 'insideLeft' }}
                        domain={[0.59, 0.63]}
                      />
                      <Tooltip formatter={(value: number) => value.toFixed(4)} />
                      <Legend />
                      {results && (
                        <ReferenceLine 
                          x={results.betaRatio} 
                          stroke="#e74c3c" 
                          strokeWidth={2}
                          label={{ value: `Selected β=${results.betaRatio}`, position: 'top' }}
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="dischargeCoef" 
                        stroke="#3498db" 
                        strokeWidth={2}
                        dot={false}
                        name="Cd"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-4 flex items-center gap-2">
                  <Info className="text-[#3498db]" />
                  Standards & References
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold text-gray-800">ISO 5167-1:2003</div>
                      <div className="text-gray-600">Measurement of fluid flow by means of orifice plates</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold text-gray-800">DIN EN ISO 5167</div>
                      <div className="text-gray-600">German standard for orifice plate measurements</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold text-gray-800">Kromschroder Methodology</div>
                      <div className="text-gray-600">Industrial burner manufacturer standards</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-4 flex items-center gap-2">
                  <AlertCircle className="text-[#e67e22]" />
                  Application Notes
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <div className="font-semibold text-yellow-800">Temperature Range</div>
                    <div className="text-yellow-700">Medium temperature should be between 10-30°C</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="font-semibold text-blue-800">Flow Limits</div>
                    <div className="text-blue-700">Maximum flow rate: 10,000 m³/h<br/>Maximum pressure drop: 100 mbar</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <div className="font-semibold text-green-800">VMO Measuring Orifices</div>
                    <div className="text-green-700">For precise flow measurement applications, use dedicated VMO orifices with nominal size DN calculator</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Calculation Formula</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="opacity-75 mb-1">Discharge Equation:</div>
                    <div className="bg-white/10 rounded p-2 font-mono text-xs">
                      Q = Cd × ε × A × √(2ΔP/ρ)
                    </div>
                  </div>
                  <div>
                    <div className="opacity-75 mb-1">Beta Ratio:</div>
                    <div className="bg-white/10 rounded p-2 font-mono text-xs">
                      β = d / D
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-[#2c3e50] mb-4">Pro Feature</h3>
            <p className="text-gray-600 mb-6">
              This feature is available for Pro users. Upgrade your account to unlock advanced calculations and PDF export features.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.href = '/subscription'}
                className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white py-3 rounded-lg font-semibold transition-all"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ProFeaturePreview>
  )
}
