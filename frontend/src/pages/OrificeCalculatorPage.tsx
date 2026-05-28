import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProFeaturePreview from '../components/ProFeaturePreview'
import { authAPI } from '../services/api'
import { Gauge, Download, Info, AlertCircle } from 'lucide-react'
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

function RestrictingOrificeDiagram() {
  return (
    <svg viewBox="0 0 450 300" className="w-full h-auto">
      <rect x="50" y="70" width="350" height="110" fill="#E0C84F" stroke="#000" strokeWidth="2.5" rx="1"/>
      
      <line x1="195" y1="70" x2="195" y2="180" stroke="#000" strokeWidth="3"/>
      <line x1="212" y1="85" x2="212" y2="165" stroke="#000" strokeWidth="3"/>
      
      <path d="M 188 165 L 178 182 L 198 182 Z" fill="#000"/>
      <path d="M 219 165 L 229 182 L 209 182 Z" fill="#000"/>

      <defs>
        <marker id="arrow-up-d" markerWidth="7" markerHeight="7" refX="3.5" refY="6" orient="auto-start-reverse">
          <polygon points="3.5 0, 0 7, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-down-d" markerWidth="7" markerHeight="7" refX="3.5" refY="1" orient="auto">
          <polygon points="3.5 0, 0 7, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-left" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse">
          <polygon points="7 0, 0 3.5, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-right" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <polygon points="7 0, 0 3.5, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-right-q" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="10 0, 0 4, 10 8" fill="#000"/>
        </marker>
      </defs>

      <line x1="58" y1="95" x2="58" y2="155" stroke="#000" strokeWidth="1.2"
            markerStart="url(#arrow-up-d)" markerEnd="url(#arrow-down-d)"/>
      <text x="35" y="130" fontSize="22" fill="#000" fontFamily="Arial, sans-serif">D</text>

      <line x1="197" y1="105" x2="210" y2="145" stroke="#000" strokeWidth="1.2"
            markerStart="url(#arrow-up-d)" markerEnd="url(#arrow-down-d)"/>
      <text x="218" y="130" fontSize="17" fill="#000" fontFamily="Arial, sans-serif">d</text>

      <line x1="320" y1="125" x2="365" y2="125" stroke="#000" strokeWidth="1.5"
            markerEnd="url(#arrow-right-q)"/>
      <text x="338" y="115" fontSize="19" fill="#000" fontFamily="Arial, sans-serif">Q</text>

      <line x1="80" y1="210" x2="155" y2="210" stroke="#000" strokeWidth="1.2"
            markerStart="url(#arrow-left)" markerEnd="url(#arrow-right)"/>
      <text x="102" y="228" fontSize="15" fill="#000" fontFamily="Arial, sans-serif" fontWeight="normal">5×DN</text>

      <line x1="255" y1="210" x2="330" y2="210" stroke="#000" strokeWidth="1.2"
            markerStart="url(#arrow-left)" markerEnd="url(#arrow-right)"/>
      <text x="277" y="228" fontSize="15" fill="#000" fontFamily="Arial, sans-serif" fontWeight="normal">5×DN</text>

      <rect x="105" y="180" width="22" height="12" fill="#E0C84F" stroke="#000" strokeWidth="1.5"/>
      <rect x="278" y="180" width="22" height="12" fill="#E0C84F" stroke="#000" strokeWidth="1.5"/>

      <line x1="108" y1="255" x2="305" y2="255" stroke="#000" strokeWidth="1.8"
            markerStart="url(#arrow-left)" markerEnd="url(#arrow-right)"/>
      <text x="195" y="248" fontSize="19" fill="#000" fontFamily="Arial, sans-serif" fontWeight="bold">Δp</text>

      <text x="120" y="280" fontSize="14" fill="#333" fontFamily="Arial, sans-serif">Medium temperature 10 – 30°C</text>
    </svg>
  )
}

function MeasuringOrificeDiagram() {
  return (
    <svg viewBox="0 0 400 260" className="w-full h-auto">
      <rect x="50" y="70" width="300" height="110" fill="#E0C84F" stroke="#000" strokeWidth="2.5" rx="1"/>
      
      <line x1="195" y1="70" x2="195" y2="180" stroke="#000" strokeWidth="3"/>
      <line x1="212" y1="85" x2="212" y2="165" stroke="#000" strokeWidth="3"/>
      
      <path d="M 188 165 L 178 182 L 198 182 Z" fill="#000"/>
      <path d="M 219 165 L 229 182 L 209 182 Z" fill="#000"/>

      <defs>
        <marker id="arrow-up-d2" markerWidth="7" markerHeight="7" refX="3.5" refY="6" orient="auto-start-reverse">
          <polygon points="3.5 0, 0 7, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-down-d2" markerWidth="7" markerHeight="7" refX="3.5" refY="1" orient="auto">
          <polygon points="3.5 0, 0 7, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-left2" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse">
          <polygon points="7 0, 0 3.5, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-right2" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <polygon points="7 0, 0 3.5, 7 7" fill="#000"/>
        </marker>
        <marker id="arrow-right-q2" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="10 0, 0 4, 10 8" fill="#000"/>
        </marker>
      </defs>

      <line x1="58" y1="95" x2="58" y2="155" stroke="#000" strokeWidth="1.2"
            markerStart="url(#arrow-up-d2)" markerEnd="url(#arrow-down-d2)"/>
      <text x="35" y="130" fontSize="22" fill="#000" fontFamily="Arial, sans-serif">D</text>

      <line x1="197" y1="105" x2="210" y2="145" stroke="#000" strokeWidth="1.2"
            markerStart="url(#arrow-up-d2)" markerEnd="url(#arrow-down-d2)"/>
      <text x="218" y="130" fontSize="17" fill="#000" fontFamily="Arial, sans-serif">d</text>

      <line x1="270" y1="125" x2="315" y2="125" stroke="#000" strokeWidth="1.5"
            markerEnd="url(#arrow-right-q2)"/>
      <text x="288" y="115" fontSize="19" fill="#000" fontFamily="Arial, sans-serif">Q</text>

      <rect x="178" y="180" width="16" height="11" fill="#E0C84F" stroke="#000" strokeWidth="1.5"/>
      <rect x="213" y="180" width="16" height="11" fill="#E0C84F" stroke="#000" strokeWidth="1.5"/>

      <line x1="175" y1="225" x2="232" y2="225" stroke="#000" strokeWidth="1.8"
            markerStart="url(#arrow-left2)" markerEnd="url(#arrow-right2)"/>
      <text x="196" y="217" fontSize="19" fill="#000" fontFamily="Arial, sans-serif" fontWeight="bold">Δp</text>
    </svg>
  )
}

export default function OrificeCalculatorPage() {
  const [calculationMode, setCalculationMode] = useState<'restricting' | 'measuring'>('restricting')
  const [selectedGasType, setSelectedGasType] = useState(gasTypes[0])
  const [customDensity, setCustomDensity] = useState('0.8')
  const [selectedPipeDN, setSelectedPipeDN] = useState(pipeDiameters[2].value)
  const [internalDiameter, setInternalDiameter] = useState('7')
  const [maxFlowRate, setMaxFlowRate] = useState('')
  const [pressureDrop, setPressureDrop] = useState('')
  const [outputMode, setOutputMode] = useState<'orifice' | 'pressure' | 'flowrate'>('orifice')
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

  const calculateOrifice = () => {
    const D = parseFloat(internalDiameter)
    const rho = getDensity()
    const Q = parseFloat(maxFlowRate)
    const deltaP = parseFloat(pressureDrop)

    if (!D || !rho || D > 325) {
      alert('Please enter valid internal diameter (max 325 mm)')
      return
    }

    if (!Q || Q <= 0 || Q > 10000) {
      alert('Please enter valid flow rate (max 10000 m³/h)')
      return
    }

    let targetDeltaP = deltaP
    
    if (outputMode === 'orifice') {
      if (!targetDeltaP || targetDeltaP <= 0 || targetDeltaP > 100) {
        alert(`Please enter valid ${calculationMode === 'restricting' ? 'pressure loss' : 'differential pressure'} (max 100 mbar)`)
        return
      }
      targetDeltaP = targetDeltaP * 100
    } else if (outputMode === 'pressure') {
      targetDeltaP = 50 * 100
    } else {
      targetDeltaP = 50 * 100
    }

    const C = calculationMode === 'restricting' ? 0.61 : 0.62
    const epsilon = 0.98
    const qm = (Q / 3600) * rho
    const A_orifice = qm / (C * epsilon * Math.sqrt(2 * rho * targetDeltaP))
    const d = Math.sqrt(A_orifice * 4 / Math.PI)
    const beta = d / D
    const Re = (4 * (Q / 3600) * rho) / (Math.PI * (D/1000) * 0.000017)

    let finalPressureDrop = deltaP
    let finalFlowRate = Q
    let finalOrificeDiameter = d

    if (outputMode === 'pressure') {
      finalOrificeDiameter = parseFloat(internalDiameter) * 0.5
      finalPressureDrop = (qm * qm) / (rho * C * C * Math.pow((Math.PI / 4) * (finalOrificeDiameter/1000), 2)) / 2 / 100
      finalFlowRate = Q
    } else if (outputMode === 'flowrate') {
      finalPressureDrop = deltaP
      finalOrificeDiameter = d
      finalFlowRate = Q
    }

    const finalResults: CalculationResult = {
      orificeDiameter: Math.round(finalOrificeDiameter * 10) / 10,
      betaRatio: Math.round((finalOrificeDiameter/D) * 10000) / 10000,
      dischargeCoef: C,
      reynoldsNum: Math.round(Re),
      velocity: (Q / 3600) / ((Math.PI / 4) * Math.pow(D/1000, 2)),
      massFlowRate: qm,
      pressureDrop: Math.round(finalPressureDrop * 100) / 100
    }

    generateCurveData(D/1000, rho, Q || 500, targetDeltaP)
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

      points.push({
        beta: Math.round(beta * 1000) / 1000,
        dischargeCoef: Math.round(C * 10000) / 10000,
        pressureDrop: Math.round(deltaP / 100 * 100) / 100,
        flowRate: Math.round(qm_calc / rho * 3600 * 100) / 100
      })
    }
    
    setCurveData(points)
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
    doc.text(`Type: ${calculationMode === 'restricting' ? 'Restricting Orifice' : 'Measuring Orifice'}`, 20, 36)
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
    
    doc.save(`orifice-${calculationMode}-report.pdf`)
  }

  const resetForm = () => {
    setMaxFlowRate('')
    setPressureDrop('')
    setShowResults(false)
    setResults(null)
    setCurveData([])
  }

  return (
    <ProFeaturePreview
      title="Orifice Calculator"
      description="Professional orifice plate calculator for restricting and measuring applications according to ISO 5167 and DIN standards."
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

        <section className="bg-gradient-to-br from-[#2B6BA0] to-[#1e4d73] text-white py-16 px-6 text-center border-r-4 border-r-[#2B8BD6]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-semibold mb-4 leading-tight">
              Determining the Orifices
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Calculate restricting and measuring orifices according to ISO 5167 and DIN EN ISO 5167 standards.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">

          <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
            <div className="bg-[#2B6BA0] text-white px-6 py-3">
              <h2 className="text-base font-normal">
                Determining the {calculationMode === 'restricting' ? 'restricting' : 'measuring'} orifice
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      onClick={() => setCalculationMode('restricting')}
                      className={`flex-1 py-2.5 px-4 rounded text-sm font-medium transition-all ${
                        calculationMode === 'restricting'
                          ? 'bg-[#2B6BA0] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Restricting Orifice
                    </button>
                    <button
                      onClick={() => setCalculationMode('measuring')}
                      className={`flex-1 py-2.5 px-4 rounded text-sm font-medium transition-all ${
                        calculationMode === 'measuring'
                          ? 'bg-[#2B6BA0] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Measuring Orifice
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-black mb-1.5">
                      Gas type
                    </label>
                    <select
                      value={selectedGasType.name}
                      onChange={(e) => {
                        const gas = gasTypes.find(g => g.name === e.target.value)
                        if (gas) setSelectedGasType(gas)
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm"
                    >
                      {gasTypes.map((gas) => (
                        <option key={gas.name} value={gas.name}>
                          {gas.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-black mb-1.5">
                      Density (kg/m³)
                    </label>
                    <input
                      type="number"
                      value={customDensity}
                      onChange={(e) => setCustomDensity(e.target.value)}
                      step="0.01"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-black mb-1.5">
                      Nominal size DN
                    </label>
                    <select
                      value={selectedPipeDN}
                      onChange={(e) => setSelectedPipeDN(parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm"
                    >
                      {pipeDiameters.map((pipe) => (
                        <option key={pipe.value} value={pipe.value}>
                          {pipe.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-black mb-1.5">
                      Tube internal diameter D (mm, max 325)
                    </label>
                    <input
                      type="number"
                      value={internalDiameter}
                      onChange={(e) => setInternalDiameter(e.target.value)}
                      max="325"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-black mb-1.5">
                      Max. flow rate Q (m³/h, max 10000)
                    </label>
                    <input
                      type="number"
                      value={maxFlowRate}
                      onChange={(e) => setMaxFlowRate(e.target.value)}
                      max="10000"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-black mb-1.5">
                      {calculationMode === 'restricting' 
                        ? 'Pressure loss Δp (mbar, max 100)' 
                        : 'Differential pressure Δp (mbar, max 100)'
                      }
                    </label>
                    <input
                      type="number"
                      value={pressureDrop}
                      onChange={(e) => setPressureDrop(e.target.value)}
                      max="100"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-center bg-white p-4 rounded border border-gray-200">
                  {calculationMode === 'restricting' ? (
                    <RestrictingOrificeDiagram />
                  ) : (
                    <MeasuringOrificeDiagram />
                  )}
                </div>
              </div>

              <div className="border-t pt-5 mt-5">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Output</h3>
                
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setOutputMode('orifice')}
                    className={`px-5 py-2 rounded text-sm font-medium transition-all ${
                      outputMode === 'orifice'
                        ? 'bg-[#2B6BA0] text-white'
                        : 'bg-white border-2 border-[#2B6BA0] text-[#2B6BA0]'
                    }`}
                  >
                    Orifice diameter d
                  </button>
                  
                  <button
                    onClick={() => setOutputMode('pressure')}
                    className={`px-5 py-2 rounded text-sm font-medium transition-all ${
                      outputMode === 'pressure'
                        ? 'bg-[#2B6BA0] text-white'
                        : 'bg-white border-2 border-[#2B6BA0] text-[#2B6BA0]'
                    }`}
                  >
                    {calculationMode === 'restricting' ? 'Pressure loss Δp' : 'Differential pressure Δp'}
                  </button>
                  
                  {calculationMode === 'restricting' && (
                    <button
                      onClick={() => setOutputMode('flowrate')}
                      className={`px-5 py-2 rounded text-sm font-medium transition-all ${
                        outputMode === 'flowrate'
                          ? 'bg-[#2B6BA0] text-white'
                          : 'bg-white border-2 border-[#2B6BA0] text-[#2B6BA0]'
                      }`}
                    >
                      Max. flow rate Q
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleProAction(calculateOrifice)}
                    className="flex-1 bg-[#2B6BA0] hover:bg-[#1e4d73] text-white py-2.5 rounded text-base font-medium transition-all shadow-md"
                  >
                    Calculate
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded text-base font-medium transition-all"
                  >
                    Reset
                  </button>
                </div>

                {showResults && results && (
                  <div className="mt-5 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="text-3xl font-bold text-[#2B6BA0] mb-1">
                      {outputMode === 'orifice' && `${results.orificeDiameter}`}
                      {outputMode === 'pressure' && `${results.pressureDrop}`}
                      {outputMode === 'flowrate' && results.massFlowRate.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {outputMode === 'orifice' && 'mm'}
                      {outputMode === 'pressure' && 'mbar'}
                      {outputMode === 'flowrate' && 'kg/s'}
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div><span className="font-medium">Beta Ratio:</span> {results.betaRatio}</div>
                      <div><span className="font-medium">Cd:</span> {results.dischargeCoef}</div>
                      <div><span className="font-medium">Re:</span> {results.reynoldsNum.toLocaleString()}</div>
                      <div><span className="font-medium">Velocity:</span> {results.velocity.toFixed(2)} m/s</div>
                    </div>

                    <button
                      onClick={() => handleProAction(exportToPDF)}
                      className="mt-3 bg-[#27ae60] hover:bg-[#229954] text-white py-2 px-5 rounded text-sm font-medium transition-all inline-flex items-center gap-2"
                    >
                      <Download size={14} />
                      Export to PDF
                    </button>
                  </div>
                )}

                {calculationMode === 'restricting' && (
                  <div className="mt-3 text-sm text-gray-600">
                    Medium temperature 10 – 30°C
                  </div>
                )}

                {calculationMode === 'measuring' && (
                  <div className="mt-3 p-2.5 bg-blue-50 rounded border-l-3 border-[#2B6BA0]">
                    <a href="#" className="text-[#2B6BA0] hover:underline text-sm font-medium">
                      To calculate the measuring orifice VMO, please use the app 'Nominal size DN'.
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showResults && curveData.length > 0 && (
            <div className="bg-white rounded p-6 shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-[#2c3e50] mb-4">
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
                    stroke="#2B6BA0" 
                    strokeWidth={2}
                    dot={false}
                    name="Cd"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded p-6 shadow border border-gray-200">
              <h3 className="text-base font-semibold text-[#2c3e50] mb-4 flex items-center gap-2">
                <Info className="text-[#2B6BA0]" />
                Standards & References
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-800">ISO 5167-1:2003</div>
                    <div className="text-gray-600">Measurement of fluid flow by means of orifice plates</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-800">DIN EN ISO 5167</div>
                    <div className="text-gray-600">German standard for orifice plate measurements</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded p-6 shadow border border-gray-200">
              <h3 className="text-base font-semibold text-[#2c3e50] mb-4 flex items-center gap-2">
                <AlertCircle className="text-[#e67e22]" />
                Application Notes
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <div className="font-medium text-yellow-800">Temperature Range</div>
                  <div className="text-yellow-700">Medium temperature should be between 10-30°C</div>
                </div>
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <div className="font-medium text-blue-800">Flow Limits</div>
                  <div className="text-blue-700">Maximum flow rate: 10,000 m³/h<br/>Maximum pressure drop: 100 mbar<br/>Maximum pipe diameter: 325 mm</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center pb-4">
            Edition 10.24 &nbsp;&nbsp;&nbsp;&nbsp; © 2026 Elster GmbH &nbsp;&nbsp;&nbsp;&nbsp; Imprint &nbsp;&nbsp;&nbsp;&nbsp; Privacy Policy
          </div>
        </div>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-[#2c3e50] mb-4">Pro Feature</h3>
            <p className="text-gray-600 mb-6">
              This feature is available for Pro users. Upgrade your account to unlock advanced calculations and PDF export features.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.href = '/subscription'}
                className="flex-1 bg-[#2B6BA0] hover:bg-[#1e4d73] text-white py-3 rounded-lg font-semibold transition-all"
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
