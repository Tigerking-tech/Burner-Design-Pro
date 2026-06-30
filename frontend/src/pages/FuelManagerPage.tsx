import { useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import {
  createPDF,
  addCoverPage,
  drawPageHeader,
  drawSectionTitle,
  drawSubSectionTitle,
  drawInfoTable,
  drawResultCard,
  drawPageFooter,
  addDisclaimerPage,
  checkPageBreak,
  formatNumber,
  sanitizeText,
  MARGIN_LEFT,
  CONTENT_WIDTH,
} from '../utils/pdfUtils'

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
  { name: 'Air', symbol: 'Air', percentage: '0' },
]

const gasPresets: GasPreset[] = [
  {
    name: 'Nordsee-Erdgas H',
    composition: { 'CH₄': '88.79', 'C₂H₆': '6.88', 'C₃H₈': '1.23', 'C₄H₁₀': '0.27', 'C₅H₁₂': '0.05', 'C₆H₁₄': '0.02', 'N₂': '0.82', 'CO₂': '1.93', 'O₂': '0.01' }
  },
  {
    name: 'Russland-Erdgas H',
    composition: { 'CH₄': '96.97', 'C₂H₆': '1.36', 'C₃H₈': '0.44', 'C₄H₁₀': '0.15', 'C₅H₁₂': '0.02', 'C₆H₁₄': '0.01', 'N₂': '0.86', 'CO₂': '0.18', 'O₂': '0.01' }
  },
  {
    name: 'Holland-Erdgas L',
    composition: { 'CH₄': '83.67', 'C₂H₆': '3.53', 'C₃H₈': '0.60', 'C₄H₁₀': '0.19', 'C₅H₁₂': '0.04', 'C₆H₁₄': '0.06', 'N₂': '10.23', 'CO₂': '1.67', 'O₂': '0.01' }
  },
  {
    name: 'Erdgas L (Low Calorific)',
    composition: { 'CH₄': '81.4', 'C₂H₆': '2.85', 'C₃H₈': '0.42', 'C₄H₁₀': '0.23', 'N₂': '14.3', 'CO₂': '0.89', 'O₂': '0.01' }
  },
  {
    name: 'Erdgas H (High Calorific)',
    composition: { 'CH₄': '93.3', 'C₂H₆': '3.38', 'C₃H₈': '0.94', 'C₄H₁₀': '0.71', 'N₂': '0.78', 'CO₂': '0.89' }
  },
  {
    name: 'Kokereigas',
    composition: { 'H₂': '55.0', 'CO': '6.0', 'CH₄': '25.0', 'C₂H₆': '2.0', 'N₂': '10.0', 'CO₂': '2.0' }
  },
  {
    name: 'Coke Oven Gas',
    composition: { 'H₂': '57.9', 'CO': '4.5', 'CH₄': '30.3', 'C₄H₁₀': '3.3', 'N₂': '2.2', 'CO₂': '1.8' }
  },
  {
    name: 'Gichtgas',
    composition: { 'H₂': '3.0', 'CO': '25.0', 'N₂': '52.0', 'CO₂': '20.0' }
  },
  {
    name: 'Blast Furnace Gas',
    composition: { 'H₂': '1.65', 'CO': '25.1', 'N₂': '57.5', 'CO₂': '15.4', 'O₂': '0.35' }
  },
  {
    name: 'Mischgas',
    composition: { 'H₂': '23.8', 'CO': '17.4', 'CH₄': '10.0', 'C₂H₆': '0.8', 'N₂': '35.2', 'CO₂': '12.8' }
  },
  {
    name: 'Biogas',
    composition: { 'CH₄': '60.0', 'N₂': '1.0', 'CO₂': '38.7', 'O₂': '0.3' }
  },
  {
    name: 'Wasserstoff 100%',
    composition: { 'H₂': '100.0' }
  },
  {
    name: 'Methan',
    composition: { 'CH₄': '100.0' }
  },
  {
    name: 'Propan',
    composition: { 'C₃H₈': '100.0' }
  },
  {
    name: 'Propan, Handelsüblich',
    composition: { 'C₂H₆': '2.2', 'C₃H₈': '97.3', 'C₄H₁₀': '0.5' }
  },
  {
    name: 'Butan',
    composition: { 'C₄H₁₀': '100.0' }
  },
  {
    name: 'Durchschnittliches Erdgas',
    composition: { 'CH₄': '89.45', 'C₂H₆': '5.08', 'C₃H₈': '1.44', 'C₄H₁₀': '0.31', 'N₂': '2.99', 'CO₂': '0.73' }
  },
  {
    name: 'Deponiegas, Cagistrio 81',
    composition: { 'CH₄': '53.4', 'N₂': '12.25', 'CO₂': '34.3', 'O₂': '0.05' }
  },
  {
    name: 'Erdgas Birmingham',
    composition: { 'CH₄': '93.34', 'C₂H₆': '2.5', 'C₃H₈': '0.67', 'C₄H₁₀': '0.32', 'N₂': '2.14', 'CO₂': '1.06' }
  },
  {
    name: 'Erdgas East Ohio',
    composition: { 'CH₄': '94.25', 'C₂H₆': '3.98', 'C₃H₈': '0.57', 'C₄H₁₀': '0.16', 'H₂': '0.01', 'N₂': '0.3', 'CO₂': '0.68', 'O₂': '0.1' }
  },
  {
    name: 'Erdgas Pittsburgh',
    composition: { 'CH₄': '94.13', 'C₂H₆': '3.58', 'C₃H₈': '0.79', 'C₄H₁₀': '0.28', 'N₂': '0.4', 'CO₂': '0.8', 'O₂': '0.01' }
  },
  {
    name: 'Erdgas UGI',
    composition: { 'CH₄': '95.68', 'C₂H₆': '2.44', 'C₃H₈': '0.51', 'C₄H₁₀': '0.07', 'N₂': '0.41', 'CO₂': '0.92', 'O₂': '0.1' }
  },
  {
    name: 'Generatorgas, Koppers-Totzek',
    composition: { 'CO': '58.7', 'H₂': '32.9', 'N₂': '1.4', 'CO₂': '7.0' }
  },
  {
    name: 'Generatorgas, Lurgi',
    composition: { 'CH₄': '10.2', 'CO': '17.1', 'H₂': '40.2', 'N₂': '1.1', 'CO₂': '31.4' }
  },
  {
    name: 'UGI-Gas',
    composition: { 'CH₄': '95.84', 'C₂H₆': '2.24', 'C₃H₈': '0.51', 'C₄H₁₀': '0.41', 'N₂': '1.1' }
  },
]

const AIR_DENSITY = 1.293

const gasProperties: Record<string, { density: number; hs: number; hi: number }> = {
  'H₂': { density: 0.090, hs: 3.540, hi: 2.995 },
  'CO': { density: 1.250, hs: 3.509, hi: 3.509 },
  'NH₃': { density: 0.771, hs: 4.816, hi: 3.986 },
  'H₂S': { density: 1.538, hs: 7.035, hi: 6.484 },
  'CH₄': { density: 0.72408, hs: 11.064, hi: 9.971 },
  'C₂H₆': { density: 1.342134, hs: 19.537, hi: 17.884 },
  'C₃H₈': { density: 2.01, hs: 28.095, hi: 25.866 },
  'C₄H₁₀': { density: 2.586, hs: 37.254, hi: 34.405 },
  'C₅H₁₂': { density: 3.220863, hs: 45.778, hi: 42.359 },
  'C₆H₁₄': { density: 3.846675, hs: 58.328, hi: 54.007 },
  'C₇H₁₆': { density: 4.76, hs: 72.524, hi: 67.217 },
  'C₆H₆': { density: 3.49, hs: 44.203, hi: 42.419 },
  'C₂H₄': { density: 1.251624, hs: 17.621, hi: 16.522 },
  'C₃H₆': { density: 1.879, hs: 25.999, hi: 24.331 },
  'C₄H₈': { density: 2.594, hs: 34.891, hi: 32.63 },
  'C₂H₂': { density: 1.1637, hs: 16.27, hi: 15.72 },
  'N₂': { density: 1.256796, hs: 0, hi: 0 },
  'CO₂': { density: 1.975704, hs: 0, hi: 0 },
  'O₂': { density: 1.429, hs: 0, hi: 0 },
  'H₂O': { density: 0.81459, hs: 0, hi: 0 },
  'Air': { density: 1.293, hs: 0, hi: 0 },
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
  const [activeTab, setActiveTab] = useLocalStorageState<'gas' | 'oil'>('fuel-manager-active-tab', 'gas')
  const [gas1Components, setGas1Components] = useLocalStorageState<GasComponent[]>('fuel-manager-gas1', defaultGasComponents.map(c => ({ ...c })))
  const [gas2Components, setGas2Components] = useLocalStorageState<GasComponent[]>('fuel-manager-gas2', defaultGasComponents.map(c => ({ ...c })))
  const [selectedGas1Preset, setSelectedGas1Preset] = useLocalStorageState('fuel-manager-gas1-preset', '')
  const [selectedGas2Preset, setSelectedGas2Preset] = useLocalStorageState('fuel-manager-gas2-preset', '')
  const [gas1MixturePercent, setGas1MixturePercent] = useLocalStorageState('fuel-manager-mixture-pct', '50')
  const [showGas1Results, setShowGas1Results] = useState(false)
  const [showGas2Results, setShowGas2Results] = useState(false)
  const [showMixtureResults, setShowMixtureResults] = useState(false)

  const [selectedOil, setSelectedOil] = useLocalStorageState('fuel-manager-oil-index', 0)
  const [oilElements, setOilElements] = useLocalStorageState<OilElement[]>('fuel-manager-oil-elements', () => {
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

    const ws = hs / Math.sqrt(density / AIR_DENSITY)
    const wi = hi / Math.sqrt(density / AIR_DENSITY)

    return { density, hs, hi, ws, wi }
  }

  const calculateMixture = () => {
    const gas1Data = calculateGasKeyData(gas1Components)
    const gas2Data = calculateGasKeyData(gas2Components)
    
    if (!gas1Data && !gas2Data) return null

    // 单一气体情况：直接返回该气体的数据，并补充缺少的属性
    if (!gas1Data) {
      return {
        ...gas2Data,
        relativeDensity: gas2Data.density / AIR_DENSITY,
        wobbe: gas2Data.ws,
        methaneNumber: 0,
      }
    }
    if (!gas2Data) {
      return {
        ...gas1Data,
        relativeDensity: gas1Data.density / AIR_DENSITY,
        wobbe: gas1Data.ws,
        methaneNumber: 0,
      }
    }

    // 混合气体情况
    const pct1 = parseFloat(gas1MixturePercent) || 50
    const gas2MixturePercent = 100 - pct1
    const gas1Fraction = pct1 / 100
    const gas2Fraction = gas2MixturePercent / 100

    const density = gas1Data.density * gas1Fraction + gas2Data.density * gas2Fraction
    const hs = gas1Data.hs * gas1Fraction + gas2Data.hs * gas2Fraction
    const hi = gas1Data.hi * gas1Fraction + gas2Data.hi * gas2Fraction
    const ws = hs / Math.sqrt(density / AIR_DENSITY)
    const wi = hi / Math.sqrt(density / AIR_DENSITY)

    return {
      density,
      hs,
      hi,
      ws,
      wi,
      relativeDensity: density / AIR_DENSITY,
      wobbe: ws,
      methaneNumber: 0,
    }
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

  const gasResultRows = (data: ReturnType<typeof calculateGasKeyData>): PdfTableRow[] => {
    if (!data) return [['Status', 'Invalid composition. Total percentage must equal 100%.']]
    return [
      ['Density', `${data.density.toFixed(3)} kg/m3`],
      ['Higher Heating Value (Hs)', `${data.hs.toFixed(2)} kWh/m3`],
      ['Lower Heating Value (Hi)', `${data.hi.toFixed(2)} kWh/m3`],
      ['Superior Wobbe Index (Ws)', `${data.ws.toFixed(2)} kWh/m3`],
      ['Inferior Wobbe Index (Wi)', `${data.wi.toFixed(2)} kWh/m3`],
    ]
  }

  const compositionRows = (components: GasComponent[]): PdfTableRow[] => {
    const rows = components
      .filter(c => (parseFloat(c.percentage) || 0) > 0)
      .map(c => [`${c.name} (${c.symbol})`, `${parseFloat(c.percentage).toFixed(2)}%`] as PdfTableRow)
    return rows.length ? rows : [['Composition', 'No component percentage entered.']]
  }

  const exportGasPDF = () => {
    const gas1Data = calculateGasKeyData(gas1Components)
    const gas2Data = calculateGasKeyData(gas2Components)
    const mixtureData = calculateMixture()
    const gas2Percent = 100 - (parseFloat(gas1MixturePercent) || 0)
    const docTitle = 'Fuel Gas Key Data Report'

    const doc = createPDF()

    addCoverPage(doc, {
      title: 'Fuel Gas Analysis',
      subtitle: 'Gas composition, heating value, Wobbe index and mixture summary',
      reportType: 'Fuel Engineering',
      standard: 'ISO 6976 / DIN 51627 Reference',
      version: 'v1.0',
    })

    let y = drawPageHeader(doc, docTitle, 'Mixture Summary')
    y = drawSectionTitle(doc, 'GAS MIXTURE RESULTS', y, 'Combined gas properties at selected mixture ratio')

    const cardWidth = (CONTENT_WIDTH - 16) / 3
    drawResultCard(doc, {
      label: 'Lower Heating Value',
      value: formatNumber(mixtureData.hi, 2),
      unit: 'kWh/Nm3',
      x: MARGIN_LEFT,
      y: y,
      width: cardWidth,
      highlight: true,
    })
    drawResultCard(doc, {
      label: 'Higher Heating Value',
      value: formatNumber(mixtureData.hs, 2),
      unit: 'kWh/Nm3',
      x: MARGIN_LEFT + cardWidth + 8,
      y: y,
      width: cardWidth,
      status: 'info',
    })
    drawResultCard(doc, {
      label: 'Wobbe Index',
      value: formatNumber(mixtureData.wobbe, 2),
      unit: 'kWh/Nm3',
      x: MARGIN_LEFT + (cardWidth + 8) * 2,
      y: y,
      width: cardWidth,
      status: 'success',
    })
    y += 42

    y = checkPageBreak(doc, y, 50, docTitle, 'Mixture Summary')
    drawResultCard(doc, {
      label: 'Density',
      value: formatNumber(mixtureData.density, 4),
      unit: 'kg/Nm3',
      x: MARGIN_LEFT,
      y: y,
      width: cardWidth,
      status: 'warning',
    })
    drawResultCard(doc, {
      label: 'Relative Density',
      value: formatNumber(mixtureData.relativeDensity, 4),
      unit: 'd (air = 1)',
      x: MARGIN_LEFT + cardWidth + 8,
      y: y,
      width: cardWidth,
    })
    drawResultCard(doc, {
      label: 'Methane Number',
      value: formatNumber(mixtureData.methaneNumber, 1),
      unit: 'MN',
      x: MARGIN_LEFT + (cardWidth + 8) * 2,
      y: y,
      width: cardWidth,
    })
    y += 42

    y = checkPageBreak(doc, y, 80, docTitle, 'Mixture Basis')
    y = drawSectionTitle(doc, 'MIXTURE BASIS', y, 'Input parameters and mixture configuration')

    const basisRows: [string, string][] = [
      ['Gas 1 Preset', selectedGas1Preset || 'Custom gas composition'],
      ['Gas 2 Preset', selectedGas2Preset || 'Custom gas composition'],
      ['Gas 1 Mixture Share', `${gas1MixturePercent}%`],
      ['Gas 2 Mixture Share', `${formatNumber(gas2Percent, 2)}%`],
      ['Gas 1 Total Composition', `${formatNumber(getTotalPercentage(gas1Components), 2)}%`],
      ['Gas 2 Total Composition', `${formatNumber(getTotalPercentage(gas2Components), 2)}%`],
    ]
    y = drawInfoTable(doc, basisRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Input Summary',
    })

    y = checkPageBreak(doc, y, 100, docTitle, 'Individual Gas Data')
    y = drawSectionTitle(doc, 'INDIVIDUAL GAS DATA', y, 'Key data for each gas stream')

    const halfWidth = (CONTENT_WIDTH - 8) / 2
    drawInfoTable(doc, gasResultRows(gas1Data), MARGIN_LEFT, y, halfWidth, {
      title: 'Gas 1 Key Data',
    })
    y = drawInfoTable(doc, gasResultRows(gas2Data), MARGIN_LEFT + halfWidth + 8, y, halfWidth, {
      title: 'Gas 2 Key Data',
    })

    y = checkPageBreak(doc, y, 100, docTitle, 'Mixture Data')
    y = drawSectionTitle(doc, 'GAS MIXTURE KEY DATA', y, 'Complete calculated mixture properties')

    y = drawInfoTable(doc, gasResultRows(mixtureData), MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Mixture Properties',
    })

    doc.addPage()
    y = drawPageHeader(doc, docTitle, 'Composition Details')
    y = drawSectionTitle(doc, 'GAS 1 COMPOSITION', y, 'Non-zero components in Gas 1')

    const gas1CompRows = compositionRows(gas1Components)
    y = drawInfoTable(doc, gas1CompRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Gas 1 Components',
    })

    y = checkPageBreak(doc, y, Math.min(150, gas2Components.filter(c => parseFloat(c.percentage) > 0).length * 8 + 20), docTitle, 'Composition Details')
    y = drawSectionTitle(doc, 'GAS 2 COMPOSITION', y, 'Non-zero components in Gas 2')

    drawInfoTable(doc, compositionRows(gas2Components), MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Gas 2 Components',
    })

    addDisclaimerPage(doc, {
      title: 'FUEL GAS REPORT DISCLAIMER',
      sections: [
        {
          heading: 'General Information',
          items: [
            'This fuel gas analysis report is provided for informational and reference purposes only.',
            'Calculations are based on the input composition data provided by the user.',
            'Results should not be used for final engineering design without independent verification.'
          ]
        },
        {
          heading: 'Accuracy and Reliability',
          items: [
            'Gas property calculations are based on standard thermodynamic models and correlations.',
            'Actual gas properties may differ due to impurities, trace components, and measurement uncertainty.',
            'Wobbe index and methane number values are estimates based on simplified correlations.'
          ]
        },
        {
          heading: 'Engineering Application',
          items: [
            'All fuel gas data should be verified with laboratory gas chromatography analysis.',
            'Combustion system design should consider the full range of expected gas compositions.',
            'Consult qualified combustion engineers for burner design and safety assessment.',
            'Verify compliance with local gas quality standards and pipeline specifications.'
          ]
        },
        {
          heading: 'Limitation of Liability',
          items: [
            'In no event shall Burner-Design-Pro be liable for damages arising from use of these calculations.',
            'Use of this tool and its results is at the sole risk of the user.'
          ]
        }
      ]
    })
    drawPageFooter(doc, 'Fuel gas data for reference only. Verify with laboratory analysis and qualified combustion engineers.')

    doc.save('fuel-gas-key-data-report.pdf')
  }

  const exportOilPDF = () => {
    const oilData = calculateOilKeyData()
    const docTitle = 'Oil Fuel Data Report'

    const doc = createPDF()

    addCoverPage(doc, {
      title: 'Oil Fuel Analysis',
      subtitle: 'Elemental analysis, heating value and fuel property summary',
      reportType: 'Fuel Engineering',
      standard: 'DIN 51603 / ISO 8217 Reference',
      version: 'v1.0',
    })

    let y = drawPageHeader(doc, docTitle, 'Key Results')
    y = drawSectionTitle(doc, 'FUEL OIL KEY DATA', y, 'Calculated fuel properties from elemental analysis')

    const cardWidth = (CONTENT_WIDTH - 16) / 3
    drawResultCard(doc, {
      label: 'Lower Heating Value',
      value: formatNumber(oilData.hi, 2),
      unit: 'kWh/kg',
      x: MARGIN_LEFT,
      y: y,
      width: cardWidth,
      highlight: true,
    })
    drawResultCard(doc, {
      label: 'Higher Heating Value',
      value: formatNumber(oilData.hs, 2),
      unit: 'kWh/kg',
      x: MARGIN_LEFT + cardWidth + 8,
      y: y,
      width: cardWidth,
      status: 'info',
    })
    drawResultCard(doc, {
      label: 'Density',
      value: formatNumber(oilData.density, 3),
      unit: 'kg/L',
      x: MARGIN_LEFT + (cardWidth + 8) * 2,
      y: y,
      width: cardWidth,
      status: 'success',
    })
    y += 42

    y = checkPageBreak(doc, y, 50, docTitle, 'Key Results')
    drawResultCard(doc, {
      label: 'Viscosity',
      value: formatNumber(oilData.viscosity, 1),
      unit: 'cSt',
      x: MARGIN_LEFT,
      y: y,
      width: cardWidth,
      status: 'warning',
    })
    drawResultCard(doc, {
      label: 'Flash Point',
      value: formatNumber(oilData.flashPoint, 0),
      unit: 'deg C',
      x: MARGIN_LEFT + cardWidth + 8,
      y: y,
      width: cardWidth,
    })
    drawResultCard(doc, {
      label: 'Pour Point',
      value: formatNumber(oilData.pourPoint, 0),
      unit: 'deg C',
      x: MARGIN_LEFT + (cardWidth + 8) * 2,
      y: y,
      width: cardWidth,
    })
    y += 42

    y = checkPageBreak(doc, y, 80, docTitle, 'Fuel Selection')
    y = drawSectionTitle(doc, 'FUEL SELECTION', y, 'Oil type and basic parameters')

    const selectionRows: [string, string][] = [
      ['Oil Type', oilPresets[selectedOil].name],
      ['Element Total', `${formatNumber(getOilElementTotal(), 2)}%`],
    ]
    y = drawInfoTable(doc, selectionRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Fuel Identification',
    })

    y = checkPageBreak(doc, y, Math.min(200, oilElements.length * 8 + 30), docTitle, 'Elemental Analysis')
    y = drawSectionTitle(doc, 'ELEMENTAL ANALYSIS', y, 'Mass composition by element')

    const elementRows: [string, string][] = oilElements.map(el => [
      el.name,
      `${formatNumber(parseFloat(el.percentage || '0'), 2)}%`,
    ])
    y = drawInfoTable(doc, elementRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Mass Composition',
    })

    y = checkPageBreak(doc, y, 100, docTitle, 'Fuel Properties')
    y = drawSectionTitle(doc, 'CALCULATED FUEL PROPERTIES', y, 'Complete derived fuel property data')

    const propRows: [string, string][] = [
      ['Density', `${formatNumber(oilData.density, 4)} kg/L`],
      ['Higher Heating Value (Hs)', `${formatNumber(oilData.hs, 3)} kWh/kg`],
      ['Lower Heating Value (Hi)', `${formatNumber(oilData.hi, 3)} kWh/kg`],
      ['Volumetric LHV', `${formatNumber(oilData.hi * oilData.density, 2)} kWh/L`],
      ['Kinematic Viscosity', `${formatNumber(oilData.viscosity, 2)} cSt`],
      ['Flash Point', `${formatNumber(oilData.flashPoint, 1)} deg C`],
      ['Pour Point', `${formatNumber(oilData.pourPoint, 1)} deg C`],
      ['Dry Mass Basis', `${formatNumber(oilData.dryMass, 2)}%`],
      ['Wet Mass Basis', `${formatNumber(oilData.wetMass, 2)}%`],
    ]
    y = drawInfoTable(doc, propRows, MARGIN_LEFT, y, CONTENT_WIDTH, {
      title: 'Derived Properties',
    })

    addDisclaimerPage(doc, {
      title: 'OIL FUEL REPORT DISCLAIMER',
      sections: [
        {
          heading: 'General Information',
          items: [
            'This oil fuel analysis report is provided for informational and reference purposes only.',
            'Calculations are based on the input elemental analysis data provided by the user.',
            'Results should not be used for final engineering design without independent verification.'
          ]
        },
        {
          heading: 'Accuracy and Reliability',
          items: [
            'Fuel property calculations are based on standard empirical correlations.',
            'Actual oil properties may differ due to crude source, refining process, and additive packages.',
            'Heating values are calculated estimates and should be verified with bomb calorimetry testing.'
          ]
        },
        {
          heading: 'Engineering Application',
          items: [
            'All fuel oil data should be verified with certified laboratory analysis.',
            'Combustion system design should consider the full range of expected fuel properties.',
            'Consult qualified combustion engineers for burner design, handling, and safety assessment.',
            'Verify compliance with fuel oil standards and local environmental regulations.'
          ]
        },
        {
          heading: 'Limitation of Liability',
          items: [
            'In no event shall Burner-Design-Pro be liable for damages arising from use of these calculations.',
            'Use of this tool and its results is at the sole risk of the user.'
          ]
        }
      ]
    })
    drawPageFooter(doc, 'Oil fuel data for reference only. Verify with laboratory analysis and qualified combustion engineers.')

    doc.save('oil-fuel-data-report.pdf')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-16 px-6 text-center">
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
            <div className="bg-white rounded-lg px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 border border-gray-300 shadow-lg mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[#2c3e50] flex items-center">
                  <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">1</span>
                  Gas 1
                </h2>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-sm text-[#7f8c8d] hidden sm:inline">Percentage proportion for gas mixture</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
                {gas1Components.map((component) => (
                  <div key={component.symbol} className="flex flex-col bg-gray-50 p-2 sm:p-3 rounded">
                    <div className="text-xs font-medium text-[#555] break-words">{component.name}</div>
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
                <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Gas 1 Key Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Density</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.density.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.hs.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.hi.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Superior Wobbe Index (Ws)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.ws.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Inferior Wobbe Index (Wi)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas1Components)!.wi.toFixed(2)} kWh/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 border border-gray-300 shadow-lg mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[#2c3e50] flex items-center">
                  <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">2</span>
                  Gas 2
                </h2>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-sm text-[#7f8c8d] hidden sm:inline">Percentage proportion for gas mixture</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
                {gas2Components.map((component) => (
                  <div key={component.symbol} className="flex flex-col bg-gray-50 p-2 sm:p-3 rounded">
                    <div className="text-xs font-medium text-[#555] break-words">{component.name}</div>
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
                <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Gas 2 Key Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Density</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.density.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.hs.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.hi.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Superior Wobbe Index (Ws)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.ws.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Inferior Wobbe Index (Wi)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateGasKeyData(gas2Components)!.wi.toFixed(2)} kWh/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 border border-gray-300 shadow-lg mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#2c3e50] mb-4 sm:mb-6 flex items-center">
                <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">3</span>
                Gas Mixture
              </h2>

              <button
                onClick={() => setShowMixtureResults(!showMixtureResults)}
                className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-3 rounded font-semibold transition-colors"
              >
                {showMixtureResults ? 'Hide' : 'Calculate'} Mixture Key Data
              </button>

              <button
                onClick={exportGasPDF}
                className="mt-3 w-full bg-[#2c3e50] hover:bg-[#34495e] text-white py-3 rounded font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export Gas PDF Report
              </button>

              {showMixtureResults && calculateMixture() && (
                <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Gas Mixture Key Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Density</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateMixture()!.density.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateMixture()!.hs.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateMixture()!.hi.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Superior Wobbe Index (Ws)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateMixture()!.ws.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-3 sm:p-4 rounded">
                      <div className="text-sm text-[#bdc3c7]">Inferior Wobbe Index (Wi)</div>
                      <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateMixture()!.wi.toFixed(2)} kWh/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 border border-gray-300 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2c3e50] mb-4 sm:mb-6">Oil Fuel Data</h2>

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

            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-4">Elemental Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4 sm:mb-6">
                {oilElements.map((element) => (
                  <div key={element.symbol} className="flex flex-col bg-gray-50 p-2 sm:p-3 rounded">
                    <div className="text-xs font-medium text-[#555] break-words">{element.name}</div>
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

            <button
              onClick={exportOilPDF}
              className="mt-3 w-full bg-[#2c3e50] hover:bg-[#34495e] text-white py-3 rounded font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export Oil PDF Report
            </button>

            {showOilResults && calculateOilKeyData() && (
              <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Oil Key Data ({oilPresets[selectedOil].name})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white/10 p-3 sm:p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Density</div>
                    <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.density.toFixed(3)} kg/L</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Higher Heating Value (Hs)</div>
                    <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.hs.toFixed(2)} kWh/kg</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Lower Heating Value (Hi)</div>
                    <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.hi.toFixed(2)} kWh/kg</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Viscosity</div>
                    <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.viscosity.toFixed(1)} cSt</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Flash Point</div>
                    <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.flashPoint.toFixed(0)} °C</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded">
                    <div className="text-sm text-[#bdc3c7]">Pour Point</div>
                    <div className="text-lg md:text-2xl font-bold text-[#f39c12]">{calculateOilKeyData()!.pourPoint.toFixed(0)} °C</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bg-[#2c3e50] text-[#bdc3c7] text-center py-12 px-6 mt-20">
        <div className="flex justify-center gap-8 mb-5 flex-wrap">
          <a href="/#features" className="text-sm hover:text-white transition-colors">Features</a>
          <a href="/#pricing" className="text-sm hover:text-white transition-colors">Pricing</a>
          <a href="#about" className="text-sm hover:text-white transition-colors">About</a>
          <a href="#privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-sm hover:text-white transition-colors">Terms of Service</a>
          <a href="#contact" className="text-sm hover:text-white transition-colors">Contact</a>
        </div>
        <p className="text-sm text-[#7f8c8d]">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
      </footer>
    </div>
  )
}
