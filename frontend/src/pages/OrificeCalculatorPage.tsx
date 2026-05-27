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
  { label: 'DN 15 (1/2")', value: 15.8 },
  { label: 'DN 20 (3/4")', value: 21.0 },
  { label: 'DN 25 (1")', value: 26.6 },
  { label: 'DN 32 (1-1/4")', value: 35.1 },
  { label: 'DN 40 (1-1/2")', value: 40.9 },
  { label: 'DN 50 (2")', value: 52.5 },
  { label: 'DN 65 (2-1/2")', value: 62.7 },
  { label: 'DN 80 (3")', value: 77.9 },
  { label: 'DN 100 (4")', value: 102.3 },
  { label: 'DN 125 (5")', value: 128.2 },
  { label: 'DN 150 (6")', value: 154.0 },
  { label: 'DN 200 (8")', value: 202.7 },
  { label: 'DN 250 (10")', value: 254.5 },
]

const gasTypes = [
  { label: 'Natural Gas (SG=0.6)', density: 0.6, adiabatic: 1.3 },
  { label: 'Propane (SG=1.52)', density: 1.52, adiabatic: 1.13 },
  { label: 'Butane (SG=2.01)', density: 2.01, adiabatic: 1.095 },
  { label: 'Hydrogen (SG=0.07)', density: 0.07, adiabatic: 1.4 },
  { label: 'Air (SG=1.0)', density: 1.0, adiabatic: 1.4 },
  { label: 'Methane (SG=0.55)', density: 0.55, adiabatic: 1.3 },
  { label: 'Nitrogen (SG=0.97)', density: 0.97, adiabatic: 1.4 },
]

export default function OrificeCalculatorPage() {
  const [calculationMode, setCalculationMode] = useState<'restricting' | 'metering'>('metering')
  const [selectedPipeDiameter, setSelectedPipeDiameter] = useState(pipeDiameters[5].value)
  const [selectedGasType, setSelectedGasType] = useState(gasTypes[0])
  const [flowRate, setFlowRate] = useState('')
  const [designPressureDrop, setDesignPressureDrop] = useState('')
  const [temperature, setTemperature] = useState('20')
  const [operatingPressure, setOperatingPressure] = useState('')
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

  const calculateOrificePlate = () => {
    const D = selectedPipeDiameter / 1000
    const rho = selectedGasType.density
    const k = selectedGasType.adiabatic
    const T = parseFloat(temperature) + 273.15
    const P = (parseFloat(operatingPressure) || 0) * 101325 + 101325
    const Q = parseFloat(flowRate) / 3600

    if (!Q || Q <= 0) {
      alert('Please enter a valid flow rate')
      return
    }

    let targetPressureDrop = parseFloat(designPressureDrop) * 100

    if (calculationMode === 'metering') {
      if (!targetPressureDrop || targetPressureDrop <= 0) {
        alert('Please enter design pressure drop for metering mode')
        return
      }
    } else {
      targetPressureDrop = targetPressureDrop || 10000
    }

    const betaMin = 0.2
    const betaMax = 0.8
    const betaStep = 0.02
    const curvePoints: CurvePoint[] = []

    let targetBeta = 0.5
    let bestDiff = Infinity

    for (let beta = betaMin; beta <= betaMax; beta += betaStep) {
      const d = beta * D
      const betaSquared = beta * beta

      const C = 0.5959 + 0.0312 * Math.pow(beta, 2.1) - 0.184 * Math.pow(beta, 8)

      const epsilon = 1 - (0.41 + 0.35 * betaSquared) * (targetPressureDrop / (k * P))

      const qm = C * epsilon * (Math.PI / 4) * d * d * Math.sqrt(2 * rho * targetPressureDrop)

      const ReD = (4 * Q * rho) / (Math.PI * D * 0.000018)

      const velocity = Q / ((Math.PI / 4) * D * D)

      const diff = Math.abs(qm - Q * rho)
      if (diff < bestDiff) {
        bestDiff = diff
        targetBeta = beta
      }

      curvePoints.push({
        beta: Math.round(beta * 1000) / 1000,
        dischargeCoef: Math.round(C * 10000) / 10000,
        pressureDrop: Math.round((qm * qm * 2 / (rho * C * C * Math.PI * Math.PI * d * d * d * d)) * 100) / 100,
        flowRate: Math.round(qm * 3600 * 100) / 100
      })
    }

    const d = targetBeta * D
    const C = 0.5959 + 0.0312 * Math.pow(targetBeta, 2.1) - 0.184 * Math.pow(targetBeta, 8)
    const epsilon = 1 - (0.41 + 0.35 * targetBeta * targetBeta) * (targetPressureDrop / (k * P))
    const ReD = (4 * Q * rho) / (Math.PI * D * 0.000018)
    const velocity = Q / ((Math.PI / 4) * D * D)
    const massFlowRate = Q * rho

    const finalResults: CalculationResult = {
      orificeDiameter: Math.round(d * 1000 * 10) / 10,
      betaRatio: Math.round(targetBeta * 10000) / 10000,
      dischargeCoef: Math.round(C * 10000) / 10000,
      reynoldsNum: Math.round(ReD),
      velocity: Math.round(velocity * 100) / 100,
      massFlowRate: Math.round(massFlowRate * 1000) / 1000,
      pressureDrop: Math.round(targetPressureDrop / 100 * 100) / 100
    }

    setResults(finalResults)
    setCurveData(curvePoints)
    setShowResults(true)
  }

  const exportCurveToPDF = () => {
    if (!results || curveData.length === 0) return

    const doc = new jsPDF('landscape', 'mm', 'a4')

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Orifice Plate Calculation Report', 20, 20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Calculation Mode: ${calculationMode === 'metering' ? 'Flow Metering' : 'Restricting Orifice'}`, 20, 36)
    doc.text(`Standard: ISO 5167 / ASME MFC-14`, 20, 42)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Input Parameters:', 20, 54)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Gas Type: ${selectedGasType.label}`, 20, 62)
    doc.text(`Pipe Diameter: ${selectedPipeDiameter} mm`, 20, 68)
    doc.text(`Flow Rate: ${flowRate} m³/h`, 20, 74)
    doc.text(`Temperature: ${temperature} °C`, 20, 80)
    doc.text(`Design Pressure Drop: ${designPressureDrop || 'Auto'} mbar`, 20, 86)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Calculation Results:', 120, 54)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Orifice Diameter: ${results.orificeDiameter} mm`, 120, 62)
    doc.text(`Beta Ratio (β): ${results.betaRatio}`, 120, 68)
    doc.text(`Discharge Coefficient (Cd): ${results.dischargeCoef}`, 120, 74)
    doc.text(`Reynolds Number (ReD): ${results.reynoldsNum.toLocaleString()}`, 120, 80)
    doc.text(`Flow Velocity: ${results.velocity} m/s`, 120, 86)
    doc.text(`Mass Flow Rate: ${results.massFlowRate} kg/s`, 120, 92)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Beta Ratio vs Discharge Coefficient Curve', 20, 106)

    const chartWidth = 120
    const chartHeight = 60
    const startX = 20
    const startY = 110

    doc.setDrawColor(200)
    doc.rect(startX, startY, chartWidth, chartHeight)

    const xMin = 0.2
    const xMax = 0.8
    const yMin = 0.58
    const yMax = 0.62

    doc.setDrawColor(100)
    for (let i = 0; i <= 4; i++) {
      const x = startX + (i / 4) * chartWidth
      doc.line(x, startY, x, startY + chartHeight)
    }
    for (let i = 0; i <= 4; i++) {
      const y = startY + chartHeight - (i / 4) * chartHeight
      doc.line(startX, y, startX + chartWidth, y)
    }

    doc.setDrawColor(52, 152, 219)
    doc.setLineWidth(0.5)
    const firstPoint = curveData[0]
    let prevX = startX + ((firstPoint.beta - xMin) / (xMax - xMin)) * chartWidth
    let prevY = startY + chartHeight - ((firstPoint.dischargeCoef - yMin) / (yMax - yMin)) * chartHeight
    doc.moveTo(prevX, prevY)

    curveData.forEach((point) => {
      const x = startX + ((point.beta - xMin) / (xMax - xMin)) * chartWidth
      const y = startY + chartHeight - ((point.dischargeCoef - yMin) / (yMax - yMin)) * chartHeight
      doc.lineTo(x, y)
    })
    doc.stroke()

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text('β', startX + chartWidth / 2, startY + chartHeight + 5, { align: 'center' })
    doc.text('Cd', startX - 5, startY + chartHeight / 2, { angle: 90 })

    doc.setTextColor(0)
    doc.setFontSize(8)
    doc.text(`β min: ${xMin}`, startX, startY + chartHeight + 5)
    doc.text(`β max: ${xMax}`, startX + chartWidth - 15, startY + chartHeight + 5)
    doc.text(`Cd min: ${yMin}`, startX - 8, startY + chartHeight)
    doc.text(`Cd max: ${yMax}`, startX - 8, startY + 3)

    if (results) {
      doc.setDrawColor(255, 0, 0)
      doc.setLineWidth(1)
      const resultX = startX + ((results.betaRatio - xMin) / (xMax - xMin)) * chartWidth
      doc.line(resultX, startY, resultX, startY + chartHeight)
      doc.setFontSize(7)
      doc.text(`Selected: β=${results.betaRatio}`, resultX - 15, startY - 2)
    }

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('Technical Notes:', 150, 106)
    doc.setFontSize(8)
    doc.setTextColor(60)
    const notes = [
      '• Calculations follow ISO 5167-1:2003 standard',
      '• Discharge coefficient equation: Cd = 0.5959 + 0.0312β²·¹ - 0.184β⁸',
      '• Expansion coefficient (ε) accounts for gas expansion',
      '• Recommended β range: 0.20 - 0.70 for optimal accuracy',
      '• Reynolds number correction applied for β > 0.5',
      '• For custody transfer, additional uncertainty analysis required'
    ]
    notes.forEach((note, index) => {
      doc.text(note, 150, 114 + index * 5)
    })

    doc.save('orifice-plate-calculation.pdf')
  }

  const resetForm = () => {
    setFlowRate('')
    setDesignPressureDrop('')
    setShowResults(false)
    setResults(null)
    setCurveData([])
  }

  return (
    <ProFeaturePreview
      title="Orifice Plate Calculator"
      description="Calculate orifice plate dimensions for flow measurement and restriction. Compliant with ISO 5167 and ASME MFC-14 standards."
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
              Orifice Plate Calculator
            </h1>
            <p className="text-lg text-[#bdc3c7] max-w-2xl mx-auto">
              Professional orifice plate sizing for flow metering and restriction applications. 
              Compliant with ISO 5167 and ASME MFC-14 international standards.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                <h2 className="text-2xl font-semibold text-[#2c3e50] mb-6">Calculation Parameters</h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Calculation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setCalculationMode('metering')}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        calculationMode === 'metering'
                          ? 'bg-[#3498db] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Flow Metering
                    </button>
                    <button
                      onClick={() => setCalculationMode('restricting')}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        calculationMode === 'restricting'
                          ? 'bg-[#e67e22] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Restricting Orifice
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {calculationMode === 'metering' 
                      ? 'Calculate orifice size for flow measurement with specified pressure drop'
                      : 'Calculate pressure drop for flow restriction with specified orifice size'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gas Type
                    </label>
                    <select
                      value={selectedGasType.label}
                      onChange={(e) => {
                        const gas = gasTypes.find(g => g.label === e.target.value)
                        if (gas) setSelectedGasType(gas)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    >
                      {gasTypes.map((gas) => (
                        <option key={gas.label} value={gas.label}>
                          {gas.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pipe Diameter (mm)
                    </label>
                    <select
                      value={selectedPipeDiameter}
                      onChange={(e) => setSelectedPipeDiameter(parseFloat(e.target.value))}
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
                      Flow Rate (m³/h)
                    </label>
                    <input
                      type="number"
                      value={flowRate}
                      onChange={(e) => setFlowRate(e.target.value)}
                      placeholder="Enter flow rate"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {calculationMode === 'metering' ? 'Design Pressure Drop (mbar)' : 'Required Pressure Drop (mbar)'}
                    </label>
                    <input
                      type="number"
                      value={designPressureDrop}
                      onChange={(e) => setDesignPressureDrop(e.target.value)}
                      placeholder={calculationMode === 'metering' ? 'e.g., 100' : 'Optional'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Operating Pressure (bar gauge)
                    </label>
                    <input
                      type="number"
                      value={operatingPressure}
                      onChange={(e) => setOperatingPressure(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleProAction(calculateOrificePlate)}
                    className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white py-3 rounded-lg font-semibold transition-all shadow-md"
                  >
                    Calculate Orifice Plate
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
                    Calculation Results
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-lg p-4 text-white">
                      <div className="text-sm opacity-90 mb-1">Orifice Diameter</div>
                      <div className="text-2xl font-bold">{results.orificeDiameter} mm</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#2ecc71] to-[#27ae60] rounded-lg p-4 text-white">
                      <div className="text-sm opacity-90 mb-1">Beta Ratio (β)</div>
                      <div className="text-2xl font-bold">{results.betaRatio}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] rounded-lg p-4 text-white">
                      <div className="text-sm opacity-90 mb-1">Discharge Coef. (Cd)</div>
                      <div className="text-2xl font-bold">{results.dischargeCoef}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#e67e22] to-[#d35400] rounded-lg p-4 text-white">
                      <div className="text-sm opacity-90 mb-1">Reynolds Number</div>
                      <div className="text-2xl font-bold">{results.reynoldsNum.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Flow Velocity</div>
                      <div className="text-xl font-bold text-[#2c3e50]">{results.velocity} m/s</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Mass Flow Rate</div>
                      <div className="text-xl font-bold text-[#2c3e50]">{results.massFlowRate} kg/s</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Pressure Drop</div>
                      <div className="text-xl font-bold text-[#2c3e50]">{results.pressureDrop} mbar</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleProAction(exportCurveToPDF)}
                      className="flex-1 bg-[#27ae60] hover:bg-[#229954] text-white py-3 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Export Results & Curve to PDF
                    </button>
                  </div>
                </div>
              )}

              {showResults && curveData.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                  <h2 className="text-2xl font-semibold text-[#2c3e50] mb-4">
                    Discharge Coefficient vs Beta Ratio Curve
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    This chart shows the relationship between beta ratio and discharge coefficient per ISO 5167 equation.
                  </p>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={curveData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="beta" 
                        label={{ value: 'Beta Ratio (β)', position: 'bottom', offset: 0 }}
                        domain={[0.2, 0.8]}
                        tickCount={7}
                      />
                      <YAxis 
                        label={{ value: 'Discharge Coefficient (Cd)', angle: -90, position: 'insideLeft' }}
                        domain={[0.58, 0.62]}
                        tickCount={5}
                      />
                      <Tooltip 
                        formatter={(value: number) => value.toFixed(4)}
                        labelFormatter={(label) => `Beta Ratio: ${(label as number).toFixed(3)}`}
                      />
                      <Legend />
                      {results && (
                        <ReferenceLine 
                          x={results.betaRatio} 
                          stroke="#e74c3c" 
                          strokeWidth={2}
                          label={{ value: `Selected: β=${results.betaRatio}`, position: 'top', fill: '#e74c3c' }}
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="dischargeCoef" 
                        stroke="#3498db" 
                        strokeWidth={2}
                        dot={false}
                        name="Cd vs β"
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
                  Standards Compliance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">ISO 5167-1:2003</div>
                      <div className="text-xs text-gray-600">Measurement of fluid flow by means of orifice plates</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">ASME MFC-14M-2001</div>
                      <div className="text-xs text-gray-600">Measurement of fluid flow using orifice plates</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#27ae60] rounded-full mt-2"></div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">AGA Report No. 3</div>
                      <div className="text-xs text-gray-600">Orifice metering of natural gas</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-lg">
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-4 flex items-center gap-2">
                  <AlertCircle className="text-[#e67e22]" />
                  Design Guidelines
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="font-semibold text-yellow-800 mb-1">Recommended β Range</div>
                    <div className="text-yellow-700">Optimal range: 0.20 - 0.70 for best accuracy</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="font-semibold text-blue-800 mb-1">Pressure Tap Location</div>
                    <div className="text-blue-700">D-D/2 taps recommended for most applications</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="font-semibold text-green-800 mb-1">Reynolds Number</div>
                    <div className="text-green-700">ReD &gt; 5000 required for accurate measurement</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Calculation Method</h3>
                <div className="space-y-2 text-sm text-gray-200">
                  <p>Discharge Coefficient Equation:</p>
                  <div className="bg-white/10 rounded p-2 font-mono text-xs">
                    Cd = 0.5959 + 0.0312β²·¹ - 0.184β⁸
                  </div>
                  <p>Mass Flow Rate:</p>
                  <div className="bg-white/10 rounded p-2 font-mono text-xs">
                    qm = Cd · ε · A₂ · √(2·ΔP·ρ)
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
