import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { authAPI } from '../services/api'

interface GasComponent {
  name: string
  symbol: string
  percentage: string
}

interface OilElement {
  name: string
  symbol: string
  percentage: string
}

interface GasPreset {
  name: string
  composition: Record<string, string>
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

const gasPresets: GasPreset[] = [
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

const gasProperties: Record<string, { density: number; hs: number; hi: number }> = {
  'H₂': { density: 0.090, hs: 3.0, hi: 2.7 },
  'CO': { density: 1.250, hs: 3.0, hi: 3.0 },
  'NH₃': { density: 0.771, hs: 2.5, hi: 2.2 },
  'H₂S': { density: 1.539, hs: 2.0, hi: 1.9 },
  'CH₄': { density: 0.716, hs: 10.0, hi: 9.0 },
  'C₂H₆': { density: 1.342, hs: 18.0, hi: 16.5 },
  'C₃H₈': { density: 1.967, hs: 26.0, hi: 24.0 },
  'C₄H₁₀': { density: 2.593, hs: 34.0, hi: 31.0 },
  'C₅H₁₂': { density: 3.219, hs: 42.0, hi: 38.5 },
  'C₆H₁₄': { density: 3.845, hs: 50.0, hi: 45.5 },
  'C₇H₁₆': { density: 4.471, hs: 58.0, hi: 52.5 },
  'C₆H₆': { density: 3.486, hs: 40.0, hi: 37.5 },
  'C₂H₄': { density: 1.261, hs: 14.5, hi: 13.5 },
  'C₃H₆': { density: 1.886, hs: 22.0, hi: 20.5 },
  'C₄H₈': { density: 2.512, hs: 30.0, hi: 27.5 },
  'C₂H₂': { density: 1.170, hs: 13.5, hi: 13.0 },
  'N₂': { density: 1.250, hs: 0, hi: 0 },
  'CO₂': { density: 1.977, hs: 0, hi: 0 },
  'O₂': { density: 1.429, hs: 0, hi: 0 },
  'H₂O': { density: 0.84, hs: 0, hi: 0 },
}

const oilPresets = [
  { 
    name: 'Oil #1', 
    C: 86.2, H: 13.2, S: 0.1, O: 0.1, N: 0.1, Ash: 0.1, Moisture: 0.2,
    density: 0.82, viscosity: 5.0, flashPoint: 38, pourPoint: -18 
  },
  { 
    name: 'Oil #2', 
    C: 86.0, H: 12.7, S: 0.8, O: 0.1, N: 0.2, Ash: 0.1, Moisture: 0.1,
    density: 0.84, viscosity: 10.0, flashPoint: 52, pourPoint: -6 
  },
  { 
    name: 'Oil #4', 
    C: 85.5, H: 12.0, S: 1.8, O: 0.2, N: 0.3, Ash: 0.1, Moisture: 0.1,
    density: 0.88, viscosity: 20.0, flashPoint: 66, pourPoint: 10 
  },
  { 
    name: 'Oil #5', 
    C: 85.0, H: 11.0, S: 2.8, O: 0.3, N: 0.5, Ash: 0.3, Moisture: 0.1,
    density: 0.90, viscosity: 50.0, flashPoint: 80, pourPoint: 25 
  },
  { 
    name: 'Oil #6', 
    C: 84.0, H: 10.0, S: 3.5, O: 0.5, N: 0.8, Ash: 1.0, Moisture: 0.2,
    density: 0.92, viscosity: 100.0, flashPoint: 95, pourPoint: 38 
  },
]

export default function FuelManagerPage() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'gas' | 'oil'>('gas')
  const [gas1Components, setGas1Components] = useState<GasComponent[]>(defaultGasComponents.map(c => ({ ...c })))
  const [gas2Components, setGas2Components] = useState<GasComponent[]>(defaultGasComponents.map(c => ({ ...c })))
  const [selectedGas1Preset, setSelectedGas1Preset] = useState('')
  const [selectedGas2Preset, setSelectedGas2Preset] = useState('')
  const [gas1MixturePercent, setGas1MixturePercent] = useState('50')
  const [showGas1Results, setShowGas1Results] = useState(false)
  const [showGas2Results, setShowGas2Results] = useState(false)
  const [showMixtureResults, setShowMixtureResults] = useState(false)
  
  const [selectedOil, setSelectedOil] = useState(0)
  const [oilElements, setOilElements] = useState<OilElement[]>(() => {
    const preset = oilPresets[0]
    return [
      { name: 'C', symbol: 'C', percentage: preset.C.toString() },
      { name: 'H', symbol: 'H', percentage: preset.H.toString() },
      { name: 'S', symbol: 'S', percentage: preset.S.toString() },
      { name: 'O', symbol: 'O', percentage: preset.O.toString() },
      { name: 'N', symbol: 'N', percentage: preset.N.toString() },
      { name: 'Ash', symbol: 'Ash', percentage: preset.Ash.toString() },
      { name: 'Moist', symbol: 'Moist', percentage: preset.Moisture.toString() },
    ]
  })
  const [showOilResults, setShowOilResults] = useState(false)

  useEffect(() => {
    setIsLoggedIn(authAPI.isAuthenticated())
    setIsAdmin(authAPI.isAdmin())
  }, [])

  const handleLogout = () => {
    authAPI.logout()
    setIsLoggedIn(false)
    setIsAdmin(false)
    navigate('/')
  }

  const applyGasPreset = (presetName: string, gasNum: 1 | 2) => {
    const preset = gasPresets.find(p => p.name === presetName)
    if (!preset) return

    const newComponents = defaultGasComponents.map(c => ({
      ...c,
      percentage: preset.composition[c.symbol] || '0'
    }))

    if (gasNum === 1) {
      setGas1Components(newComponents)
    } else {
      setGas2Components(newComponents)
    }
  }

  const calculateGasKeyData = (components: GasComponent[]) => {
    const total = getTotalPercentage(components)
    if (Math.abs(total - 100) > 0.01) return null

    let density = 0
    let hs = 0
    let hi = 0

    components.forEach(c => {
      const pct = parseFloat(c.percentage) || 0
      if (pct > 0 && gasProperties[c.symbol]) {
        const props = gasProperties[c.symbol]
        const fraction = pct / 100
        density += props.density * fraction
        hs += props.hs * fraction
        hi += props.hi * fraction
      }
    })

    const ws = hs / Math.sqrt(density / 1.22)
    const wi = hi / Math.sqrt(density / 1.22)

    return { density, hs, hi, ws, wi }
  }

  const calculateMixture = () => {
    const gas1Data = calculateGasKeyData(gas1Components)
    const gas2Data = calculateGasKeyData(gas2Components)
    
    if (!gas1Data || !gas2Data) return null

    const pct1 = parseFloat(gas1MixturePercent) || 50
    const gas2MixturePercent = 100 - pct1
    const gas1Fraction = pct1 / 100
    const gas2Fraction = gas2MixturePercent / 100

    const density = gas1Data.density * gas1Fraction + gas2Data.density * gas2Fraction
    const hs = gas1Data.hs * gas1Fraction + gas2Data.hs * gas2Fraction
    const hi = gas1Data.hi * gas1Fraction + gas2Data.hi * gas2Fraction
    const ws = hs / Math.sqrt(density / 1.22)
    const wi = hi / Math.sqrt(density / 1.22)

    return { density, hs, hi, ws, wi }
  }

  const calculateOilKeyData = () => {
    const C = parseFloat(oilElements.find(el => el.symbol === 'C')?.percentage || '') || 0
    const H = parseFloat(oilElements.find(el => el.symbol === 'H')?.percentage || '') || 0
    const S = parseFloat(oilElements.find(el => el.symbol === 'S')?.percentage || '') || 0
    const O = parseFloat(oilElements.find(el => el.symbol === 'O')?.percentage || '') || 0
    const N = parseFloat(oilElements.find(el => el.symbol === 'N')?.percentage || '') || 0
    const Ash = parseFloat(oilElements.find(el => el.symbol === 'Ash')?.percentage || '') || 0
    const Moisture = parseFloat(oilElements.find(el => el.symbol === 'Moist')?.percentage || '') || 0

    const dryMass = 100 - Moisture
    
    const Hs_kJ_kg = 339 * C + 1030 * H + 109 * S - 103 * O - 25 * N
    const Hi_kJ_kg = 339 * C + 1030 * (H - 9 * H / 100 * Moisture / (100 - Moisture)) + 109 * S - 103 * O - 25 * N
    
    const hs = Hs_kJ_kg / 3600
    const hi = Hi_kJ_kg / 3600

    const density = oilPresets[selectedOil].density
    const viscosity = oilPresets[selectedOil].viscosity
    const flashPoint = oilPresets[selectedOil].flashPoint
    const pourPoint = oilPresets[selectedOil].pourPoint

    return {
      density,
      hs,
      hi,
      viscosity,
      flashPoint,
      pourPoint,
      dryMass,
      wetMass: 100 - Moisture
    }
  }

  const handleComponentChange = (gasNum: 1 | 2, symbol: string, value: string) => {
    if (value !== '') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue < 0) return
    }
    
    if (gasNum === 1) {
      const newComponents = gas1Components.map(c =>
        c.symbol === symbol ? { ...c, percentage: value } : c
      )
      setGas1Components(newComponents)
      setSelectedGas1Preset('')
    } else {
      const newComponents = gas2Components.map(c =>
        c.symbol === symbol ? { ...c, percentage: value } : c
      )
      setGas2Components(newComponents)
      setSelectedGas2Preset('')
    }
  }

  const handleOilElementChange = (symbol: string, value: string) => {
    if (value !== '') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue < 0) return
    }
    
    const newElements = oilElements.map(el =>
      el.symbol === symbol ? { ...el, percentage: value } : el
    )
    setOilElements(newElements)
  }

  const handleGasMixturePercentChange = (value: string) => {
    if (value !== '') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        if (numValue < 0) {
          setGas1MixturePercent('0')
          return
        }
        if (numValue > 100) {
          setGas1MixturePercent('100')
          return
        }
      }
    }
    setGas1MixturePercent(value)
  }

  const handleOilTypeChange = (index: number) => {
    setSelectedOil(index)
    const preset = oilPresets[index]
    const newElements = [
      { name: 'C', symbol: 'C', percentage: preset.C.toString() },
      { name: 'H', symbol: 'H', percentage: preset.H.toString() },
      { name: 'S', symbol: 'S', percentage: preset.S.toString() },
      { name: 'O', symbol: 'O', percentage: preset.O.toString() },
      { name: 'N', symbol: 'N', percentage: preset.N.toString() },
      { name: 'Ash', symbol: 'Ash', percentage: preset.Ash.toString() },
      { name: 'Moist', symbol: 'Moist', percentage: preset.Moisture.toString() },
    ]
    setOilElements(newElements)
  }

  const getTotalPercentage = (components: GasComponent[]) => {
    return components.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0)
  }

  const getOilElementTotal = () => {
    return oilElements.reduce((sum, el) => sum + (parseFloat(el.percentage) || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="sticky top-0 z-50 bg-[#2c3e50] text-white px-12 py-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="text-2xl font-semibold tracking-tight text-white hover:text-[#bdc3c7] transition-colors">
          <span className="text-[#f39c12]">⛽</span> Burner-Design-Pro
        </Link>
        <div className="flex gap-8 items-center">
          <Link to="/" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Home</Link>
          <a href="/#features" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Features</a>
          <a href="/#pricing" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">Pricing</a>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                  Admin
                </Link>
              )}
              <Link to="/account" className="text-[#bdc3c7] hover:text-white transition-colors text-sm">
                Account
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#bdc3c7] hover:text-white transition-colors text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] px-5 py-2 rounded font-semibold text-sm transition-colors shadow-md">
              Get Started
            </Link>
          )}
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold mb-4 leading-tight">
            Fuel Manager
          </h1>
          <p className="text-lg text-[#bdc3c7] max-w-2xl mx-auto">
            Determine gas key data and calculate gas mixtures for optimal combustion
          </p>
          <p className="text-sm text-[#7f8c8d] mt-2">Volume standard condition: Nm³ at 0 °C (32 °F)</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Inline Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-yellow-800">⚠️ Professional Engineering Judgment Required</p>
            <p className="text-yellow-700 mt-1">
              Results are for reference only. All fuel properties should be verified with laboratory analysis
              and reviewed by qualified combustion engineers before application.
            </p>
          </div>
        </div>

        <div className="flex mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setActiveTab('gas')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              activeTab === 'gas' 
                ? 'bg-white border-b-4 border-[#f39c12] text-[#2c3e50]' 
                : 'bg-gray-100 hover:bg-gray-200 text-[#7f8c8d]'
            }`}
          >
            Gas
          </button>
          <button
            onClick={() => setActiveTab('oil')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              activeTab === 'oil' 
                ? 'bg-white border-b-4 border-[#f39c12] text-[#2c3e50]' 
                : 'bg-gray-100 hover:bg-gray-200 text-[#7f8c8d]'
            }`}
          >
            Oil
          </button>
        </div>

        {activeTab === 'gas' ? (
          <>
            <div className="bg-white rounded-lg px-8 py-10 border border-gray-300 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#2c3e50] flex items-center">
                  <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">1</span>
                  Gas 1
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#7f8c8d]">Percentage proportion for gas mixture</span>
                  <input
                    type="text"
                    value={gas1MixturePercent}
                    onChange={(e) => handleGasMixturePercentChange(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded text-center text-gray-900"
                  />
                  <span className="text-sm text-[#7f8c8d]">%</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] mb-2">Gas type</label>
                <select
                  value={selectedGas1Preset}
                  onChange={(e) => {
                    setSelectedGas1Preset(e.target.value)
                    if (e.target.value) applyGasPreset(e.target.value, 1)
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900"
                >
                  <option value="">Select gas type...</option>
                  {gasPresets.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 mb-6">
                {gas1Components.map((component) => (
                  <div key={component.symbol} className="flex flex-col bg-gray-50 p-2 rounded">
                    <div className="text-xs font-medium text-[#555] line-clamp-1">{component.name}</div>
                    <div className="text-xs text-[#7f8c8d] mb-1">{component.symbol}</div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={component.percentage}
                        onChange={(e) => handleComponentChange(1, component.symbol, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs text-center text-gray-900"
                        placeholder="0"
                      />
                      <span className="text-xs text-[#7f8c8d]">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded">
                <span className="text-sm font-medium text-[#555]">Total Percentage:</span>
                <span className={`text-lg font-bold ${Math.abs(getTotalPercentage(gas1Components) - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalPercentage(gas1Components).toFixed(2)}%
                </span>
              </div>

              <button
                onClick={() => setShowGas1Results(!showGas1Results)}
                className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded font-semibold transition-colors"
              >
                {showGas1Results ? 'Hide' : 'Calculate'} Gas 1 Key Data
              </button>

              {showGas1Results && calculateGasKeyData(gas1Components) && (
                <div className="mt-6 p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Gas 1 Key Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Density</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.density.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.hs.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.hi.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Superior Wobbe Index (Ws)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.ws.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Inferior Wobbe Index (Wi)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.wi.toFixed(2)} kWh/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg px-8 py-10 border border-gray-300 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#2c3e50] flex items-center">
                  <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">2</span>
                  Gas 2
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#7f8c8d]">Percentage proportion for gas mixture</span>
                  <input
                    type="text"
                    value={(100 - (parseFloat(gas1MixturePercent) || 0)).toString()}
                    readOnly
                    className="w-20 px-3 py-2 border border-gray-300 rounded text-center bg-gray-100 text-gray-900"
                  />
                  <span className="text-sm text-[#7f8c8d]">%</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] mb-2">Gas type</label>
                <select
                  value={selectedGas2Preset}
                  onChange={(e) => {
                    setSelectedGas2Preset(e.target.value)
                    if (e.target.value) applyGasPreset(e.target.value, 2)
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900"
                >
                  <option value="">Select gas type...</option>
                  {gasPresets.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 mb-6">
                {gas2Components.map((component) => (
                  <div key={component.symbol} className="flex flex-col bg-gray-50 p-2 rounded">
                    <div className="text-xs font-medium text-[#555] line-clamp-1">{component.name}</div>
                    <div className="text-xs text-[#7f8c8d] mb-1">{component.symbol}</div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={component.percentage}
                        onChange={(e) => handleComponentChange(2, component.symbol, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs text-center text-gray-900"
                        placeholder="0"
                      />
                      <span className="text-xs text-[#7f8c8d]">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded">
                <span className="text-sm font-medium text-[#555]">Total Percentage:</span>
                <span className={`text-lg font-bold ${Math.abs(getTotalPercentage(gas2Components) - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalPercentage(gas2Components).toFixed(2)}%
                </span>
              </div>

              <button
                onClick={() => setShowGas2Results(!showGas2Results)}
                className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded font-semibold transition-colors"
              >
                {showGas2Results ? 'Hide' : 'Calculate'} Gas 2 Key Data
              </button>

              {showGas2Results && calculateGasKeyData(gas2Components) && (
                <div className="mt-6 p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Gas 2 Key Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Density</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.density.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.hs.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.hi.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Superior Wobbe Index (Ws)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.ws.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Inferior Wobbe Index (Wi)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.wi.toFixed(2)} kWh/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg px-8 py-10 border border-gray-300 shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-[#2c3e50] mb-6 flex items-center">
                <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">3</span>
                Gas Mixture
              </h2>

              <button
                onClick={() => setShowMixtureResults(!showMixtureResults)}
                className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded font-semibold transition-colors"
              >
                {showMixtureResults ? 'Hide' : 'Calculate'} Mixture Key Data
              </button>

              {showMixtureResults && calculateMixture() && (
                <div className="mt-6 p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Gas Mixture Key Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Density</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateMixture()!.density.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateMixture()!.hs.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateMixture()!.hi.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Superior Wobbe Index (Ws)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateMixture()!.ws.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Inferior Wobbe Index (Wi)</div>
                      <div className="text-2xl font-bold text-[#f39c12]">{calculateMixture()!.wi.toFixed(2)} kWh/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg px-8 py-10 border border-gray-300 shadow-lg">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-6">Oil Fuel Data</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#555] mb-2">Select Oil Type</label>
              <select
                value={selectedOil}
                onChange={(e) => handleOilTypeChange(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900"
              >
                {oilPresets.map((oil, index) => (
                  <option key={index} value={index}>{oil.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">Elemental Analysis</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
                {oilElements.map((element) => (
                  <div key={element.symbol} className="flex flex-col bg-gray-50 p-2 rounded">
                    <div className="text-xs font-medium text-[#555] line-clamp-1">{element.name}</div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={element.percentage}
                        onChange={(e) => handleOilElementChange(element.symbol, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs text-center text-gray-900"
                        placeholder="0"
                      />
                      <span className="text-xs text-[#7f8c8d]">%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded">
                <span className="text-sm font-medium text-[#555]">Total Percentage:</span>
                <span className={`text-lg font-bold ${Math.abs(getOilElementTotal() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  {getOilElementTotal().toFixed(2)}%
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowOilResults(!showOilResults)}
              className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded font-semibold transition-colors"
            >
              {showOilResults ? 'Hide' : 'Show'} Oil Key Data
            </button>

            {showOilResults && calculateOilKeyData() && (
              <div className="mt-6 p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">Oil Key Data ({oilPresets[selectedOil].name})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Density</div>
                    <div className="text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.density.toFixed(3)} kg/L</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                    <div className="text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.hs.toFixed(2)} kWh/kg</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                    <div className="text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.hi.toFixed(2)} kWh/kg</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Viscosity</div>
                    <div className="text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.viscosity.toFixed(1)} cSt</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Flash Point</div>
                    <div className="text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.flashPoint.toFixed(0)} °C</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Pour Point</div>
                    <div className="text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.pourPoint.toFixed(0)} °C</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-12 px-6 mt-20">
        <div className="flex justify-center gap-8 mb-5 flex-wrap">
          <Link to="/" className="text-sm hover:text-white transition-colors">Home</Link>
          <a href="/#features" className="text-sm hover:text-white transition-colors">Features</a>
          <a href="/#pricing" className="text-sm hover:text-white transition-colors">Pricing</a>
          <Link to="/about" className="text-sm hover:text-white transition-colors">About</Link>
          <Link to="/privacy-policy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms-of-service" className="text-sm hover:text-white transition-colors">Terms of Service</Link>
          <a href="mailto:Support@burnerdesignpro.com" className="text-sm hover:text-white transition-colors">Contact</a>
        </div>
        <div className="text-center mb-4">
          <a href="mailto:Support@burnerdesignpro.com" className="text-[#f39c12] hover:text-white transition-colors text-sm font-medium">
            Support@burnerdesignpro.com
          </a>
        </div>
        <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
      </footer>
    </div>
  )
}
