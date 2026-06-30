import { useState } from 'react'
import ProFeaturePreview from '../components/ProFeaturePreview'
import { Navbar } from '../components/Navbar'
import { authAPI } from '../services/api'
import { Thermometer, AlertTriangle, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'

interface GasComponent {
  name: string
  symbol: string
  percentage: string
}

const defaultGasComponents: GasComponent[] = [
  { name: 'Hydrogen', symbol: 'H₂', percentage: '0' },
  { name: 'Carbon Monoxide', symbol: 'CO', percentage: '0' },
  { name: 'Ammonia', symbol: 'NH₃', percentage: '0' },
  { name: 'Hydrogen sulphide', symbol: 'H₂S', percentage: '0' },
  { name: 'Methane', symbol: 'CH₄', percentage: '0' },
  { name: 'Ethane', symbol: 'C₂H₆', percentage: '0' },
  { name: 'Propane', symbol: 'C₃H₈', percentage: '0' },
  { name: 'Butane', symbol: 'C₄H₁₀', percentage: '0' },
  { name: 'Pentane', symbol: 'C₅H₁₂', percentage: '0' },
  { name: 'Hexane', symbol: 'C₆H₁₄', percentage: '0' },
  { name: 'Heptane', symbol: 'C₇H₁₆', percentage: '0' },
  { name: 'Benzene', symbol: 'C₆H₆', percentage: '0' },
  { name: 'Ethene', symbol: 'C₂H₄', percentage: '0' },
  { name: 'Propene', symbol: 'C₃H₆', percentage: '0' },
  { name: 'Butene', symbol: 'C₄H₈', percentage: '0' },
  { name: 'Ethine', symbol: 'C₂H₂', percentage: '0' },
  { name: 'Nitrogen', symbol: 'N₂', percentage: '0' },
  { name: 'Carbon Dioxide', symbol: 'CO₂', percentage: '0' },
  { name: 'Oxygen', symbol: 'O₂', percentage: '0' },
  { name: 'Steam', symbol: 'H₂O', percentage: '0' },
]

const gasPresets: Array<{ name: string; composition: Record<string, string> }> = [
  {
    name: 'North sea natural gas H',
    composition: { 'CH₄': '92.0', 'C₂H₆': '3.5', 'C₃H₈': '1.5', 'C₄H₁₀': '0.5', 'N₂': '1.5', 'CO₂': '1.0' }
  },
  {
    name: 'Russian natural gas H',
    composition: { 'CH₄': '98.0', 'C₂H₆': '0.7', 'C₃H₈': '0.3', 'N₂': '0.8', 'CO₂': '0.2' }
  },
  {
    name: 'Dutch natural gas L',
    composition: { 'CH₄': '81.0', 'C₂H₆': '3.0', 'C₃H₈': '0.8', 'N₂': '13.2', 'CO₂': '2.0' }
  },
  {
    name: 'Erdgas L (Low Calorific)',
    composition: { 'CH₄': '86.0', 'C₂H₆': '4.0', 'C₃H₈': '1.0', 'N₂': '7.0', 'CO₂': '2.0' }
  },
  {
    name: 'Erdgas H (High Calorific)',
    composition: { 'CH₄': '95.0', 'C₂H₆': '2.5', 'C₃H₈': '0.8', 'N₂': '1.2', 'CO₂': '0.5' }
  },
  {
    name: 'Coke oven gas',
    composition: { 'H₂': '58.0', 'CH₄': '27.0', 'CO': '6.0', 'N₂': '5.0', 'CO₂': '2.0', 'C₂H₄': '2.0' }
  },
  {
    name: 'Blast furnace gas (BFG)',
    composition: { 'N₂': '55.0', 'CO': '25.0', 'CO₂': '18.0', 'H₂': '2.0' }
  },
  {
    name: 'Mixed natural gas H',
    composition: { 'CH₄': '94.0', 'C₂H₆': '3.0', 'C₃H₈': '1.0', 'N₂': '1.5', 'CO₂': '0.5' }
  },
  {
    name: 'Biogas',
    composition: { 'CH₄': '60.0', 'CO₂': '40.0' }
  },
  {
    name: 'Hydrogen',
    composition: { 'H₂': '100.0' }
  },
  {
    name: 'Methane',
    composition: { 'CH₄': '100.0' }
  },
  {
    name: 'Propane',
    composition: { 'C₃H₈': '100.0' }
  },
  {
    name: 'Propane, Commercial',
    composition: { 'C₃H₈': '95.0', 'C₄H₁₀': '5.0' }
  },
  {
    name: 'Butane',
    composition: { 'C₄H₁₀': '100.0' }
  },
  {
    name: 'Average Natural Gas',
    composition: { 'CH₄': '90.0', 'C₂H₆': '5.0', 'C₃H₈': '1.5', 'N₂': '2.5', 'CO₂': '1.0' }
  },
  {
    name: 'Landfill, Cagistrio 81',
    composition: { 'CH₄': '50.0', 'CO₂': '45.0', 'N₂': '5.0' }
  },
  {
    name: 'N.Gas Birmingham',
    composition: { 'CH₄': '92.5', 'C₂H₆': '3.0', 'C₃H₈': '0.5', 'N₂': '3.0', 'CO₂': '1.0' }
  },
  {
    name: 'N.Gas East Ohio',
    composition: { 'CH₄': '94.0', 'C₂H₆': '2.5', 'C₃H₈': '0.8', 'N₂': '1.7', 'CO₂': '1.0' }
  },
  {
    name: 'N.Gas Pittsburgh',
    composition: { 'CH₄': '93.0', 'C₂H₆': '3.0', 'C₃H₈': '0.5', 'N₂': '2.5', 'CO₂': '1.0' }
  },
  {
    name: 'N.Gas UGI',
    composition: { 'CH₄': '91.0', 'C₂H₆': '3.5', 'C₃H₈': '0.8', 'N₂': '3.7', 'CO₂': '1.0' }
  },
  {
    name: 'Producer, Koppers-Totzek',
    composition: { 'CO': '30.0', 'H₂': '14.0', 'N₂': '52.0', 'CO₂': '4.0' }
  },
  {
    name: 'Producer, Lurgi',
    composition: { 'CO': '28.0', 'H₂': '12.0', 'N₂': '54.0', 'CO₂': '6.0' }
  },
  {
    name: 'UGI Gas',
    composition: { 'CO': '25.0', 'H₂': '15.0', 'CH₄': '10.0', 'N₂': '45.0', 'CO₂': '5.0' }
  },
]

const fuelData: Record<string, { hf: number; c: number; h: number; o: number; n: number }> = {
  'H₂': { hf: 0, c: 0, h: 2, o: 0, n: 0 },
  'CO': { hf: -110.5, c: 1, h: 0, o: 1, n: 0 },
  'NH₃': { hf: -45.9, c: 0, h: 3, o: 0, n: 1 },
  'H₂S': { hf: -20.6, c: 0, h: 2, o: 0, n: 0 },
  'CH₄': { hf: -74.87, c: 1, h: 4, o: 0, n: 0 },
  'C₂H₆': { hf: -84.7, c: 2, h: 6, o: 0, n: 0 },
  'C₃H₈': { hf: -103.85, c: 3, h: 8, o: 0, n: 0 },
  'C₄H₁₀': { hf: -126.15, c: 4, h: 10, o: 0, n: 0 },
  'C₅H₁₂': { hf: -147.1, c: 5, h: 12, o: 0, n: 0 },
  'C₆H₁₄': { hf: -170.0, c: 6, h: 14, o: 0, n: 0 },
  'C₇H₁₆': { hf: -190.0, c: 7, h: 16, o: 0, n: 0 },
  'C₆H₆': { hf: 49.0, c: 6, h: 6, o: 0, n: 0 },
  'C₂H₄': { hf: 52.5, c: 2, h: 4, o: 0, n: 0 },
  'C₃H₆': { hf: 20.4, c: 3, h: 6, o: 0, n: 0 },
  'C₄H₈': { hf: -0.1, c: 4, h: 8, o: 0, n: 0 },
  'C₂H₂': { hf: 226.7, c: 2, h: 2, o: 0, n: 0 },
  'N₂': { hf: 0, c: 0, h: 0, o: 0, n: 2 },
  'CO₂': { hf: -393.52, c: 1, h: 0, o: 2, n: 0 },
}

const productData: Record<string, { hf: number; cp: number }> = {
  'CO₂': { hf: -393.52, cp: 0.055 },
  'H₂O': { hf: -241.83, cp: 0.045 },
  'N₂': { hf: 0, cp: 0.035 },
  'O₂': { hf: 0, cp: 0.038 },
}

type OxidizerType = 'air' | 'oxygen' | 'mixed'

export default function FlameTemperaturePage() {
  const [gasComponents, setGasComponents] = useState<GasComponent[]>(
    defaultGasComponents.map(c => ({ ...c }))
  )
  const [selectedPreset, setSelectedPreset] = useState('')
  
  const [fuelTemperature, setFuelTemperature] = useState('25')
  const [oxidizerType, setOxidizerType] = useState<OxidizerType>('air')
  const [airRatio, setAirRatio] = useState('100')
  const [oxygenRatio, setOxygenRatio] = useState('0')
  const [oxidizerTemperature, setOxidizerTemperature] = useState('25')
  const [excessOxygen, setExcessOxygen] = useState('10')
  
  const [showResults, setShowResults] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  const isProUser = authAPI.isAuthenticated() && authAPI.getSubscriptionTier() !== 'free'

  const handleProAction = (action: () => void) => {
    if (!isProUser) {
      setShowSubscriptionModal(true)
    } else {
      action()
    }
  }

  const applyPreset = (presetName: string) => {
    const preset = gasPresets.find(p => p.name === presetName)
    if (!preset) return

    const newComponents = defaultGasComponents.map(c => ({
      ...c,
      percentage: preset.composition[c.symbol] || '0'
    }))
    setGasComponents(newComponents)
  }

  const handleComponentChange = (symbol: string, value: string) => {
    if (value !== '' && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) return
    
    const newComponents = gasComponents.map(c =>
      c.symbol === symbol ? { ...c, percentage: value } : c
    )
    setGasComponents(newComponents)
    setSelectedPreset('')
  }

  const getTotalPercentage = () => {
    return gasComponents.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0)
  }

  const calculateFlameTemperature = () => {
    const totalPercentage = getTotalPercentage()
    if (Math.abs(totalPercentage - 100) > 0.01) return null

    let totalC = 0, totalH = 0, totalO = 0, totalN = 0
    let totalHfReactants = 0

    gasComponents.forEach(component => {
      const moleFraction = parseFloat(component.percentage) / 100
      if (moleFraction > 0 && fuelData[component.symbol]) {
        const data = fuelData[component.symbol]
        totalC += moleFraction * data.c
        totalH += moleFraction * data.h
        totalO += moleFraction * data.o
        totalN += moleFraction * data.n
        totalHfReactants += moleFraction * data.hf
      }
    })

    const stoichO2 = totalC + totalH / 4 - totalO / 2
    const excessAirRatio = 1 + parseFloat(excessOxygen) / 100
    const actualO2 = stoichO2 * excessAirRatio

    let o2InOxidizer, n2InOxidizer
    if (oxidizerType === 'air') {
      o2InOxidizer = 0.21
      n2InOxidizer = 0.79
    } else if (oxidizerType === 'oxygen') {
      o2InOxidizer = 1.0
      n2InOxidizer = 0.0
    } else {
      o2InOxidizer = (parseFloat(airRatio) * 0.21 + parseFloat(oxygenRatio)) / 100
      n2InOxidizer = parseFloat(airRatio) * 0.79 / 100
    }

    const oxidizerMoles = actualO2 / o2InOxidizer
    const n2FromAir = oxidizerMoles * n2InOxidizer + totalN / 2

    const molesCO2 = totalC
    const molesH2O = totalH / 2
    const molesO2 = actualO2 - stoichO2
    const molesN2 = n2FromAir

    const totalHfProducts = 
      molesCO2 * productData['CO₂'].hf +
      molesH2O * productData['H₂O'].hf +
      molesO2 * productData['O₂'].hf +
      molesN2 * productData['N₂'].hf

    const heatReleased = totalHfReactants - totalHfProducts

    const totalCpProducts = 
      molesCO2 * productData['CO₂'].cp +
      molesH2O * productData['H₂O'].cp +
      molesO2 * productData['O₂'].cp +
      molesN2 * productData['N₂'].cp

    const initialTemp = Math.max(
      parseFloat(fuelTemperature) || 25,
      parseFloat(oxidizerTemperature) || 25
    )
    const initialTempK = initialTemp + 273.15

    let theoreticalTempK
    if (totalCpProducts > 0) {
      theoreticalTempK = initialTempK + heatReleased / totalCpProducts
    } else {
      theoreticalTempK = initialTempK + 1800
    }

    let theoreticalTempC = theoreticalTempK - 273.15
    
    let maxTempC
    if (oxidizerType === 'oxygen') {
      maxTempC = 2900
    } else {
      maxTempC = 2400
    }
    
    if (theoreticalTempC > maxTempC) {
      if (oxidizerType === 'oxygen') {
        theoreticalTempC = 2900
      } else {
        const excess = theoreticalTempC - maxTempC
        theoreticalTempC = maxTempC + 200 * Math.log(1 + excess / 100)
      }
    }
    
    const actualTempC = theoreticalTempC * 0.9

    return {
      theoretical: Math.max(0, theoreticalTempC),
      actual: Math.max(0, actualTempC),
      stoichO2,
      molesCO2,
      molesH2O,
      molesN2,
      molesO2
    }
  }

  const results = calculateFlameTemperature()

  const exportToPDF = () => {
    if (!results) return

    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Flame Temperature Calculation Report', 20, 20)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text('Standard: Thermodynamic heat balance calculation', 20, 36)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Input Parameters:', 20, 48)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    let yPos = 56
    gasComponents.forEach(c => {
      const pct = parseFloat(c.percentage) || 0
      if (pct > 0) {
        doc.text(`${c.name} (${c.symbol}): ${pct.toFixed(2)}%`, 20, yPos)
        yPos += 6
      }
    })
    
    yPos += 4
    doc.text(`Fuel Temperature: ${fuelTemperature} °C`, 20, yPos)
    yPos += 6
    doc.text(`Oxidizer Type: ${oxidizerType === 'air' ? 'Air' : oxidizerType === 'oxygen' ? 'Pure Oxygen' : 'Mixed'}`, 20, yPos)
    yPos += 6
    doc.text(`Oxidizer Temperature: ${oxidizerTemperature} °C`, 20, yPos)
    yPos += 6
    doc.text(`Excess Oxygen: ${excessOxygen}%`, 20, yPos)
    
    yPos += 10
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Calculation Results:', 120, 48)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Theoretical Flame Temperature: ${results.theoretical.toFixed(0)} °C`, 120, 56)
    doc.text(`Actual Flame Temperature: ${results.actual.toFixed(0)} °C`, 120, 62)
    doc.text(`Stoichiometric O₂: ${results.stoichO2.toFixed(4)} mol/mol`, 120, 68)
    
    yPos = 78
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Combustion Products (per mole fuel):', 20, yPos)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`CO₂: ${results.molesCO2.toFixed(4)} mol`, 20, yPos + 8)
    doc.text(`H₂O: ${results.molesH2O.toFixed(4)} mol`, 20, yPos + 14)
    doc.text(`N₂: ${results.molesN2.toFixed(4)} mol`, 20, yPos + 20)
    doc.text(`Excess O₂: ${results.molesO2.toFixed(4)} mol`, 20, yPos + 26)
    
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('Note: Results are for reference only. Consult qualified combustion engineers.', 20, 280)
    
    doc.save('flame-temperature-report.pdf')
  }

  return (
    <ProFeaturePreview
      title="Flame Temperature Calculator"
      description="Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations."
      icon={<Thermometer size={40} />}
    >
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />

        <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-16 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-semibold mb-4 leading-tight">
              Flame Temperature Calculator
            </h1>
            <p className="text-lg text-[#bdc3c7] max-w-2xl mx-auto">
              Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Inline Disclaimer */}
          <div className="bg-yellow-50 dark:bg-gray-800 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Professional Engineering Judgment Required</p>
              <p className="text-yellow-700 dark:text-gray-300 mt-1">
                Results are for reference only. Actual flame temperatures depend on many factors including 
                burner design, heat transfer, and combustion efficiency. Consult qualified combustion engineers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700 shadow-lg overflow-hidden">
              <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">1</span>
                Fuel Gas Composition
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Gas type</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => {
                    setSelectedPreset(e.target.value)
                    if (e.target.value) applyPreset(e.target.value)
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                >
                  <option value="">Select gas type...</option>
                  {gasPresets.map((preset, i) => (
                    <option key={i} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 mb-6">
                {gasComponents.map((component) => (
                  <div key={component.symbol} className="flex flex-col bg-gray-50 dark:bg-gray-700/50 p-2 sm:p-3 rounded touch-manipulation h-full">
                    <div className="mb-2">
                      <div className="text-xs font-medium text-[#555] dark:text-gray-300 break-words leading-tight line-clamp-2 min-h-[32px] sm:min-h-[36px]">{component.name}</div>
                      <div className="text-xs text-[#7f8c8d] dark:text-gray-400 mt-1">{component.symbol}</div>
                    </div>
                    <div className="flex items-center gap-1 mt-auto">
                      <input
                        type="text"
                        value={component.percentage}
                        onChange={(e) => handleComponentChange(component.symbol, e.target.value)}
                        className="flex-1 w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded text-sm sm:text-xs text-center text-gray-900 dark:text-white min-h-[32px]"
                        placeholder="0"
                      />
                      <span className="text-xs text-[#7f8c8d] dark:text-gray-400 flex-shrink-0 w-4 text-center">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded">
                <span className="text-sm font-medium text-[#555] dark:text-gray-300">Total Percentage:</span>
                <span className={`text-lg font-bold ${Math.abs(getTotalPercentage() - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {getTotalPercentage().toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700 shadow-lg overflow-hidden">
              <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">2</span>
                Operating Conditions
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Fuel Temperature</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={fuelTemperature}
                    onChange={(e) => setFuelTemperature(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                  <span className="text-sm text-[#7f8c8d] dark:text-gray-400">°C</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Oxidizer Type</label>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setOxidizerType('air')}
                    className={`flex-1 py-2.5 px-4 rounded font-semibold transition-colors ${
                      oxidizerType === 'air'
                        ? 'bg-[#f39c12] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#555] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Air
                  </button>
                  <button
                    onClick={() => setOxidizerType('oxygen')}
                    className={`flex-1 py-2.5 px-4 rounded font-semibold transition-colors ${
                      oxidizerType === 'oxygen'
                        ? 'bg-[#f39c12] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#555] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Pure O₂
                  </button>
                  <button
                    onClick={() => setOxidizerType('mixed')}
                    className={`flex-1 py-2.5 px-4 rounded font-semibold transition-colors ${
                      oxidizerType === 'mixed'
                        ? 'bg-[#f39c12] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#555] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Mixed
                  </button>
                </div>

                {oxidizerType === 'mixed' && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className="text-sm text-[#555] dark:text-gray-300 font-medium mb-2">Oxygen-Enriched Air Mixture</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#555] dark:text-gray-400 mb-1">Air %</label>
                        <input
                          type="text"
                          value={airRatio}
                          onChange={(e) => {
                            const airVal = e.target.value
                            setAirRatio(airVal)
                            if (airVal !== '') {
                              const num = parseFloat(airVal) || 0
                              setOxygenRatio((100 - num).toString())
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 rounded text-center dark:text-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#555] dark:text-gray-400 mb-1">Pure O₂ %</label>
                        <input
                          type="text"
                          value={oxygenRatio}
                          onChange={(e) => {
                            const oxyVal = e.target.value
                            setOxygenRatio(oxyVal)
                            if (oxyVal !== '') {
                              const num = parseFloat(oxyVal) || 0
                              setAirRatio((100 - num).toString())
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 rounded text-center dark:text-white"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-[#7f8c8d] dark:text-gray-400 mt-2">
                      Total: {((parseFloat(airRatio) || 0) + (parseFloat(oxygenRatio) || 0)).toFixed(0)}% {Math.abs(((parseFloat(airRatio) || 0) + (parseFloat(oxygenRatio) || 0)) - 100) < 0.01 ? '✓' : '(must equal 100%)'}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Oxidizer Temperature</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={oxidizerTemperature}
                    onChange={(e) => setOxidizerTemperature(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                  <span className="text-sm text-[#7f8c8d] dark:text-gray-400">°C</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Excess Oxygen</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={excessOxygen}
                    onChange={(e) => setExcessOxygen(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                  <span className="text-sm text-[#7f8c8d] dark:text-gray-400">%</span>
                </div>
              </div>

              <button
                onClick={() => handleProAction(() => setShowResults(!showResults))}
                className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded font-semibold transition-colors"
              >
                {showResults ? 'Hide Results' : 'Calculate Flame Temperature'}
              </button>
            </div>
          </div>

          {showResults && results && (
            <div className="mt-6 p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-white mb-6">Flame Temperature Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 p-6 rounded">
                  <div className="text-sm text-[#bdc3c7] mb-2">Theoretical Flame Temperature</div>
                  <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{results.theoretical.toFixed(0)} °C</div>
                  <div className="text-sm text-[#7f8c8d] mt-2">Adiabatic flame temperature</div>
                </div>
                <div className="bg-white/10 p-6 rounded">
                  <div className="text-sm text-[#bdc3c7] mb-2">Actual Flame Temperature</div>
                  <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{results.actual.toFixed(0)} °C</div>
                  <div className="text-sm text-[#7f8c8d] mt-2">With 10% heat loss</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white/5 rounded">
                <h4 className="text-white font-medium mb-3">Combustion Products (per mole fuel)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[#bdc3c7]">
                  <div>CO₂: {results.molesCO2.toFixed(2)} mol</div>
                  <div>H₂O: {results.molesH2O.toFixed(2)} mol</div>
                  <div>N₂: {results.molesN2.toFixed(2)} mol</div>
                  <div>Excess O₂: {results.molesO2.toFixed(2)} mol</div>
                </div>
              </div>

              {/* Export PDF Button */}
              <div className="mt-6">
                <button
                  onClick={exportToPDF}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Export PDF Report
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="bg-[#2c3e50] dark:bg-gray-900 text-[#bdc3c7] text-center py-12 px-6 mt-20">
          <div className="flex justify-center gap-8 mb-5 flex-wrap">
            <a href="/#features" className="text-sm hover:text-white transition-colors">Features</a>
            <a href="/#pricing" className="text-sm hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-sm hover:text-white transition-colors">About</a>
            <a href="#privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-sm hover:text-white transition-colors">Terms of Service</a>
            <a href="#contact" className="text-sm hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-[#7f8c8d] dark:text-gray-500">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
        </footer>
      </div>
    </ProFeaturePreview>
  )
}
