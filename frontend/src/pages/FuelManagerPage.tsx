import { useState } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { AlertTriangle, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { Navbar } from '../components/Navbar'
import GasComposition, { GasComponent, GasPreset, defaultGasComponents } from '../components/GasComposition'
import {
  addCoverPage,
  drawPageHeader,
  drawSectionTitle,
  drawSubSectionTitle,
  drawInfoTable,
  drawResultCard,
  drawBulletList,
  drawPageFooter,
  addDisclaimerPage,
  checkPageBreak,
  MARGIN_LEFT,
  CONTENT_WIDTH,
  sanitizeText,
  formatNumber as pdfFormatNumber,
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
    composition: { 'CH₄': '81.4', 'C₂H₆': '2.85', 'C₃H₈': '0.42', 'C₄H₁₀': '0.23', 'N₂': '14.2', 'CO₂': '0.89', 'O₂': '0.01' }
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
    composition: { 'CH₄': '93.34', 'C₂H₆': '2.5', 'C₃H₈': '0.67', 'C₄H₁₀': '0.32', 'N₂': '2.11', 'CO₂': '1.06' }
  },
  {
    name: 'Erdgas East Ohio',
    composition: { 'CH₄': '94.25', 'C₂H₆': '3.98', 'C₃H₈': '0.57', 'C₄H₁₀': '0.16', 'H₂': '0.01', 'N₂': '0.25', 'CO₂': '0.68', 'O₂': '0.1' }
  },
  {
    name: 'Erdgas Pittsburgh',
    composition: { 'CH₄': '94.13', 'C₂H₆': '3.58', 'C₃H₈': '0.79', 'C₄H₁₀': '0.28', 'N₂': '0.4', 'CO₂': '0.8', 'O₂': '0.01' }
  },
  {
    name: 'Erdgas UGI',
    composition: { 'CH₄': '95.68', 'C₂H₆': '2.44', 'C₃H₈': '0.51', 'C₄H₁₀': '0.07', 'N₂': '0.28', 'CO₂': '0.92', 'O₂': '0.1' }
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
    composition: { 'CH₄': '95.84', 'C₂H₆': '2.24', 'C₃H₈': '0.51', 'C₄H₁₀': '0.41', 'N₂': '1.0' }
  },
]

const AIR_DENSITY = 1.293
const O2_IN_AIR = 0.2095
const N2_IN_AIR = 0.7808

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

interface GasCombustionProps {
  nC: number
  nH: number
  nO: number
  nN: number
  nS: number
}

interface CombustionResult {
  density: number
  relativeDensity: number
  hi: number
  lmin: number
  gasFlowRate: number
  airFlowRate: number
  co2Volume: number
  h2oVolume: number
  o2Volume: number
  n2Volume: number
  dryFlueGasVolume: number
  wetFlueGasVolume: number
  co2Percent: number
  o2Percent: number
  n2Percent: number
  h2oPercent: number
  wetFlueGasDensity: number
}

const gasCombustionProps: Record<string, GasCombustionProps> = {
  'H₂': { nC: 0, nH: 2, nO: 0, nN: 0, nS: 0 },
  'CO': { nC: 1, nH: 0, nO: 1, nN: 0, nS: 0 },
  'NH₃': { nC: 0, nH: 3, nO: 0, nN: 1, nS: 0 },
  'H₂S': { nC: 0, nH: 2, nO: 0, nN: 0, nS: 1 },
  'CH₄': { nC: 1, nH: 4, nO: 0, nN: 0, nS: 0 },
  'C₂H₆': { nC: 2, nH: 6, nO: 0, nN: 0, nS: 0 },
  'C₃H₈': { nC: 3, nH: 8, nO: 0, nN: 0, nS: 0 },
  'C₄H₁₀': { nC: 4, nH: 10, nO: 0, nN: 0, nS: 0 },
  'C₅H₁₂': { nC: 5, nH: 12, nO: 0, nN: 0, nS: 0 },
  'C₆H₁₄': { nC: 6, nH: 14, nO: 0, nN: 0, nS: 0 },
  'C₇H₁₆': { nC: 7, nH: 16, nO: 0, nN: 0, nS: 0 },
  'C₆H₆': { nC: 6, nH: 6, nO: 0, nN: 0, nS: 0 },
  'C₂H₄': { nC: 2, nH: 4, nO: 0, nN: 0, nS: 0 },
  'C₃H₆': { nC: 3, nH: 6, nO: 0, nN: 0, nS: 0 },
  'C₄H₈': { nC: 4, nH: 8, nO: 0, nN: 0, nS: 0 },
  'C₂H₂': { nC: 2, nH: 2, nO: 0, nN: 0, nS: 0 },
  'N₂': { nC: 0, nH: 0, nO: 0, nN: 1, nS: 0 },
  'CO₂': { nC: 1, nH: 0, nO: 2, nN: 0, nS: 0 },
  'O₂': { nC: 0, nH: 0, nO: 1, nN: 0, nS: 0 },
  'H₂O': { nC: 0, nH: 2, nO: 1, nN: 0, nS: 0 },
  'Air': { nC: 0, nH: 0, nO: 0.2095, nN: 0.7808, nS: 0 },
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

const defaultOilElements: OilElement[] = (() => {
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
})()

export default function FuelManagerPage() {
  const [activeTab, setActiveTab] = usePersistentState<'gas' | 'oil'>('fuelmanager_activeTab', 'gas')
  const [gas1Components, setGas1Components] = usePersistentState<GasComponent[]>('fuelmanager_gas1Components', defaultGasComponents.map(c => ({ ...c })))
  const [gas2Components, setGas2Components] = usePersistentState<GasComponent[]>('fuelmanager_gas2Components', defaultGasComponents.map(c => ({ ...c })))
  const [selectedGas1Preset, setSelectedGas1Preset] = usePersistentState('fuelmanager_selectedGas1Preset', '')
  const [selectedGas2Preset, setSelectedGas2Preset] = usePersistentState('fuelmanager_selectedGas2Preset', '')
  const [gas1MixturePercent, setGas1MixturePercent] = usePersistentState('fuelmanager_gas1MixturePercent', '50')
  const [showGas1Results, setShowGas1Results] = usePersistentState('fuelmanager_showGas1Results', false)
  const [showGas2Results, setShowGas2Results] = usePersistentState('fuelmanager_showGas2Results', false)
  const [showMixtureResults, setShowMixtureResults] = usePersistentState('fuelmanager_showMixtureResults', false)

  const [selectedOil, setSelectedOil] = usePersistentState('fuelmanager_selectedOil', 0)
  const [oilElements, setOilElements] = usePersistentState<OilElement[]>('fuelmanager_oilElements', defaultOilElements)
  const [showOilResults, setShowOilResults] = usePersistentState('fuelmanager_showOilResults', false)

  const [gasMode, setGasMode] = usePersistentState<'mixture' | 'combustion'>('fuelmanager_gasMode', 'mixture')
  const [burnerCapacity, setBurnerCapacity] = usePersistentState('fuelmanager_burnerCapacity', '100')
  const [lambda, setLambda] = usePersistentState('fuelmanager_lambda', '1.1')
  const [selectedCombustionGasPreset, setSelectedCombustionGasPreset] = usePersistentState('fuelmanager_selectedCombustionGasPreset', '')
  const [combustionGasComponents, setCombustionGasComponents] = usePersistentState<GasComponent[]>('fuelmanager_combustionGasComponents', defaultGasComponents.map(c => ({ ...c })))
  const [showCombustionResults, setShowCombustionResults] = usePersistentState('fuelmanager_showCombustionResults', false)

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
    
    if (!gas1Data || !gas2Data) return null

    const pct1 = parseFloat(gas1MixturePercent) || 50
    const gas2MixturePercent = 100 - pct1
    const gas1Fraction = pct1 / 100
    const gas2Fraction = gas2MixturePercent / 100

    const density = gas1Data.density * gas1Fraction + gas2Data.density * gas2Fraction
    const hs = gas1Data.hs * gas1Fraction + gas2Data.hs * gas2Fraction
    const hi = gas1Data.hi * gas1Fraction + gas2Data.hi * gas2Fraction
    const ws = hs / Math.sqrt(density / AIR_DENSITY)
    const wi = hi / Math.sqrt(density / AIR_DENSITY)

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

  const calculateCombustion = (components: GasComponent[], capacityKW: number, lambdaVal: number): CombustionResult | null => {
    const total = getTotalPercentage(components)
    if (Math.abs(total - 100) > 0.01) return null

    let density = 0
    let hi = 0
    let totalCO2 = 0
    let totalH2O = 0
    let o2Needed = 0
    let fuelN2 = 0

    components.forEach(c => {
      const pct = parseFloat(c.percentage) || 0
      if (pct > 0) {
        const fraction = pct / 100
        const props = gasProperties[c.symbol]
        const combProps = gasCombustionProps[c.symbol]

        if (props) {
          density += props.density * fraction
          hi += props.hi * fraction
        }

        if (combProps) {
          totalCO2 += fraction * combProps.nC
          totalH2O += fraction * (combProps.nH / 2)
          o2Needed += fraction * (combProps.nC + combProps.nH / 4 - combProps.nO / 2)
          fuelN2 += fraction * (combProps.nN / 2)
        }
      }
    })

    const lmin = o2Needed / O2_IN_AIR
    const actualAir = lmin * lambdaVal
    const n2FromAir = actualAir * N2_IN_AIR
    const totalN2 = fuelN2 + n2FromAir
    const excessO2 = actualAir * O2_IN_AIR - o2Needed
    const dryVolume = totalCO2 + totalN2 + excessO2
    const wetVolume = dryVolume + totalH2O

    const co2Percent = dryVolume > 0 ? (totalCO2 / dryVolume) * 100 : 0
    const o2Percent = dryVolume > 0 ? (excessO2 / dryVolume) * 100 : 0
    const n2Percent = dryVolume > 0 ? (totalN2 / dryVolume) * 100 : 0
    const h2oPercent = wetVolume > 0 ? (totalH2O / wetVolume) * 100 : 0

    const CO2_DENSITY = 1.977
    const H2O_DENSITY = 0.804
    const O2_DENSITY = 1.429
    const N2_DENSITY = 1.251

    const wetFlueGasDensity = wetVolume > 0
      ? (totalCO2 * CO2_DENSITY + totalH2O * H2O_DENSITY + excessO2 * O2_DENSITY + totalN2 * N2_DENSITY) / wetVolume
      : 0

    const gasFlowRate = hi > 0 ? capacityKW / hi : 0
    const airFlowRate = gasFlowRate * lmin * lambdaVal

    return {
      density,
      relativeDensity: density / AIR_DENSITY,
      hi,
      lmin,
      gasFlowRate,
      airFlowRate,
      co2Volume: totalCO2,
      h2oVolume: totalH2O,
      o2Volume: excessO2,
      n2Volume: totalN2,
      dryFlueGasVolume: dryVolume,
      wetFlueGasVolume: wetVolume,
      co2Percent,
      o2Percent,
      n2Percent,
      h2oPercent,
      wetFlueGasDensity,
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

  const handleCombustionComponentChange = (symbol: string, value: string) => {
    if (value !== '') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue < 0) return
    }
    
    const newComponents = combustionGasComponents.map(c =>
      c.symbol === symbol ? { ...c, percentage: value } : c
    )
    setCombustionGasComponents(newComponents)
    setSelectedCombustionGasPreset('')
  }

  const applyCombustionGasPreset = (presetName: string) => {
    if (presetName === '__enter__') {
      setCombustionGasComponents(defaultGasComponents.map(c => ({ ...c, percentage: '0' })))
      setSelectedCombustionGasPreset('__enter__')
      return
    }
    const preset = gasPresets.find(p => p.name === presetName)
    if (!preset) return

    const newComponents = defaultGasComponents.map(c => ({
      ...c,
      percentage: preset.composition[c.symbol] || '0'
    }))

    setCombustionGasComponents(newComponents)
    setSelectedCombustionGasPreset(presetName)
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

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    addCoverPage(doc, {
      title: 'Fuel Analysis Report',
      subtitle: activeTab === 'gas' ? 'Fuel gas composition and property calculation' : 'Liquid fuel elemental analysis and property calculation',
      reportType: 'Fuel Manager Analysis',
    });

    let y = drawPageHeader(doc, 'Fuel Analysis Report', 'Calculation Results');

    if (activeTab === 'gas') {
      if (gasMode === 'combustion') {
        const combustionData = calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1);

        y = drawSectionTitle(doc, 'Fuel Gas Composition', y, selectedCombustionGasPreset || 'Custom gas composition');
        const gasRows = combustionGasComponents
          .filter(c => parseFloat(c.percentage) > 0)
          .map(c => [c.name + ' (' + c.symbol + ')', c.percentage + '%'] as [string, string]);
        if (gasRows.length > 0) {
          y = drawInfoTable(doc, gasRows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);
        } else {
          y += 10;
        }

        if (combustionData) {
          y = checkPageBreak(doc, y, 80, 'Fuel Analysis Report', 'Key Data');
          y = drawSectionTitle(doc, 'Key Data', y);
          const cardWidth = (CONTENT_WIDTH - 8) / 3;
          drawResultCard(doc, { label: 'Density', value: pdfFormatNumber(combustionData.density, 3) + ' kg/m3', x: MARGIN_LEFT, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Relative Density', value: pdfFormatNumber(combustionData.relativeDensity, 4), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Hi (kWh/m3)', value: pdfFormatNumber(combustionData.hi, 2), x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, highlight: true });
          y += 37;
          drawResultCard(doc, { label: 'Lmin (m3/m3)', value: pdfFormatNumber(combustionData.lmin, 3), x: MARGIN_LEFT, y, width: cardWidth, status: 'info' });
          y += 37;

          y = checkPageBreak(doc, y, 100, 'Fuel Analysis Report', 'Capacity / Flow Rate');
          y = drawSectionTitle(doc, 'Capacity / Flow Rate', y, `Burner capacity: ${burnerCapacity} kW, Lambda: ${lambda}`);
          const flowRows: [string, string][] = [
            ['Burner Capacity', burnerCapacity + ' kW'],
            ['Air Ratio (λ)', lambda],
            ['Gas Flow Rate', pdfFormatNumber(combustionData.gasFlowRate, 3) + ' m3/h'],
            ['Air Flow Rate', pdfFormatNumber(combustionData.airFlowRate, 2) + ' m3/h'],
          ];
          y = drawInfoTable(doc, flowRows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);

          y = checkPageBreak(doc, y, 150, 'Fuel Analysis Report', 'Flue Gas');
          y = drawSectionTitle(doc, 'Flue Gas Composition', y);
          y = drawSubSectionTitle(doc, 'Gas Composition (per m3 fuel)', y);
          const flueGasRows: [string, string][] = [
            ['CO2 Volume', pdfFormatNumber(combustionData.co2Volume, 4) + ' m3/m3'],
            ['H2O Volume', pdfFormatNumber(combustionData.h2oVolume, 4) + ' m3/m3'],
            ['O2 Volume (excess)', pdfFormatNumber(combustionData.o2Volume, 4) + ' m3/m3'],
            ['N2 Volume', pdfFormatNumber(combustionData.n2Volume, 4) + ' m3/m3'],
            ['Dry Flue Gas Volume', pdfFormatNumber(combustionData.dryFlueGasVolume, 3) + ' m3/m3'],
            ['Wet Flue Gas Volume', pdfFormatNumber(combustionData.wetFlueGasVolume, 3) + ' m3/m3'],
          ];
          y = drawInfoTable(doc, flueGasRows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);

          y = checkPageBreak(doc, y, 100, 'Fuel Analysis Report', 'Flue Gas Percentages');
          y = drawSubSectionTitle(doc, 'Volume Percentages', y);
          const percentRows: [string, string][] = [
            ['CO2 (dry basis)', pdfFormatNumber(combustionData.co2Percent, 2) + ' %'],
            ['O2 (dry basis)', pdfFormatNumber(combustionData.o2Percent, 2) + ' %'],
            ['N2 (dry basis)', pdfFormatNumber(combustionData.n2Percent, 2) + ' %'],
            ['H2O (wet basis)', pdfFormatNumber(combustionData.h2oPercent, 2) + ' %'],
            ['Wet Flue Gas Density', pdfFormatNumber(combustionData.wetFlueGasDensity, 4) + ' kg/m3'],
          ];
          y = drawInfoTable(doc, percentRows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);
        }
      } else {
        const gas1Data = calculateGasKeyData(gas1Components);
        const gas2Data = calculateGasKeyData(gas2Components);
        const mixtureData = calculateMixture();

        y = drawSectionTitle(doc, 'Gas 1 Composition', y, selectedGas1Preset || 'Custom gas composition');
        const gas1Rows = gas1Components
          .filter(c => parseFloat(c.percentage) > 0)
          .map(c => [c.name + ' (' + c.symbol + ')', c.percentage + '%'] as [string, string]);
        if (gas1Rows.length > 0) {
          y = drawInfoTable(doc, gas1Rows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);
        } else {
          y += 10;
        }

        if (gas1Data) {
          y = checkPageBreak(doc, y, 60, 'Fuel Analysis Report', 'Gas 1 Properties');
          y = drawSubSectionTitle(doc, 'Gas 1 Key Properties', y);
          const cardWidth = (CONTENT_WIDTH - 8) / 3;
          drawResultCard(doc, { label: 'Density', value: pdfFormatNumber(gas1Data.density, 3) + ' kg/m3', x: MARGIN_LEFT, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Hs (kWh/m3)', value: pdfFormatNumber(gas1Data.hs, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Hi (kWh/m3)', value: pdfFormatNumber(gas1Data.hi, 2), x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, highlight: true });
          y += 37;
          drawResultCard(doc, { label: 'Ws (kWh/m3)', value: pdfFormatNumber(gas1Data.ws, 2), x: MARGIN_LEFT, y, width: cardWidth, status: 'info' });
          drawResultCard(doc, { label: 'Wi (kWh/m3)', value: pdfFormatNumber(gas1Data.wi, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, status: 'info' });
          y += 37;
        }

        y = checkPageBreak(doc, y, 100, 'Fuel Analysis Report', 'Gas 2 Composition');
        y = drawSectionTitle(doc, 'Gas 2 Composition', y, selectedGas2Preset || 'Custom gas composition');
        const gas2Rows = gas2Components
          .filter(c => parseFloat(c.percentage) > 0)
          .map(c => [c.name + ' (' + c.symbol + ')', c.percentage + '%'] as [string, string]);
        if (gas2Rows.length > 0) {
          y = drawInfoTable(doc, gas2Rows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);
        } else {
          y += 10;
        }

        if (gas2Data) {
          y = checkPageBreak(doc, y, 60, 'Fuel Analysis Report', 'Gas 2 Properties');
          y = drawSubSectionTitle(doc, 'Gas 2 Key Properties', y);
          const cardWidth = (CONTENT_WIDTH - 8) / 3;
          drawResultCard(doc, { label: 'Density', value: pdfFormatNumber(gas2Data.density, 3) + ' kg/m3', x: MARGIN_LEFT, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Hs (kWh/m3)', value: pdfFormatNumber(gas2Data.hs, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Hi (kWh/m3)', value: pdfFormatNumber(gas2Data.hi, 2), x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, highlight: true });
          y += 37;
          drawResultCard(doc, { label: 'Ws (kWh/m3)', value: pdfFormatNumber(gas2Data.ws, 2), x: MARGIN_LEFT, y, width: cardWidth, status: 'info' });
          drawResultCard(doc, { label: 'Wi (kWh/m3)', value: pdfFormatNumber(gas2Data.wi, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, status: 'info' });
          y += 37;
        }

        if (mixtureData) {
          y = checkPageBreak(doc, y, 100, 'Fuel Analysis Report', 'Gas Mixture');
          y = drawSectionTitle(doc, 'Gas Mixture Properties', y, `Mixture ratio: ${gas1MixturePercent}% Gas 1 / ${(100 - parseFloat(gas1MixturePercent) || 0).toFixed(0)}% Gas 2`);
          const cardWidth = (CONTENT_WIDTH - 8) / 3;
          drawResultCard(doc, { label: 'Density', value: pdfFormatNumber(mixtureData.density, 3) + ' kg/m3', x: MARGIN_LEFT, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Hs (kWh/m3)', value: pdfFormatNumber(mixtureData.hs, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, highlight: true });
          drawResultCard(doc, { label: 'Hi (kWh/m3)', value: pdfFormatNumber(mixtureData.hi, 2), x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, highlight: true });
          y += 37;
          drawResultCard(doc, { label: 'Ws (kWh/m3)', value: pdfFormatNumber(mixtureData.ws, 2), x: MARGIN_LEFT, y, width: cardWidth, status: 'info' });
          drawResultCard(doc, { label: 'Wi (kWh/m3)', value: pdfFormatNumber(mixtureData.wi, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, status: 'info' });
          y += 37;
        }
      }
    } else {
      const oilData = calculateOilKeyData();
      const oilName = oilPresets[selectedOil]?.name || 'Custom oil';

      y = drawSectionTitle(doc, 'Oil Fuel Analysis', y, oilName);

      y = drawSubSectionTitle(doc, 'Elemental Analysis', y);
      const oilRows = oilElements
        .filter(el => parseFloat(el.percentage) > 0)
        .map(el => [el.name + ' (' + el.symbol + ')', el.percentage + '%'] as [string, string]);
      if (oilRows.length > 0) {
        y = drawInfoTable(doc, oilRows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);
      }

      if (oilData) {
        y = checkPageBreak(doc, y, 100, 'Fuel Analysis Report', 'Oil Properties');
        y = drawSubSectionTitle(doc, 'Key Properties', y);
        const cardWidth = (CONTENT_WIDTH - 8) / 3;
        drawResultCard(doc, { label: 'Density', value: pdfFormatNumber(oilData.density, 3) + ' kg/L', x: MARGIN_LEFT, y, width: cardWidth, highlight: true });
        drawResultCard(doc, { label: 'Hs (kWh/kg)', value: pdfFormatNumber(oilData.hs, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, highlight: true });
        drawResultCard(doc, { label: 'Hi (kWh/kg)', value: pdfFormatNumber(oilData.hi, 2), x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, highlight: true });
        y += 37;
        drawResultCard(doc, { label: 'Viscosity', value: pdfFormatNumber(oilData.viscosity, 1) + ' cSt', x: MARGIN_LEFT, y, width: cardWidth, status: 'info' });
        drawResultCard(doc, { label: 'Flash Point', value: pdfFormatNumber(oilData.flashPoint, 0) + ' deg C', x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, status: 'info' });
        drawResultCard(doc, { label: 'Pour Point', value: pdfFormatNumber(oilData.pourPoint, 0) + ' deg C', x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, status: 'info' });
        y += 37;
      }
    }

    addDisclaimerPage(doc, {
      title: 'FUEL ANALYSIS DISCLAIMER',
    });

    drawPageFooter(doc);

    doc.save('fuel-analysis-report.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <section className="bg-slate-900 dark:bg-slate-800 text-white py-16 px-6 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Fuel Manager
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Determine gas key data and calculate gas mixtures for optimal combustion
          </p>
          <p className="text-sm text-slate-400 mt-2">Volume standard condition: Nm³ at 0 °C (32 °F)</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Inline Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-400">Professional Engineering Judgment Required</p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Results are for reference only. All fuel properties should be verified with laboratory analysis
              and reviewed by qualified combustion engineers before application.
            </p>
          </div>
        </div>

        <div className="flex mb-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveTab('gas')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              activeTab === 'gas' 
                ? 'bg-white dark:bg-white/10 border-b-4 border-blue-600 text-slate-900 dark:text-white' 
                : 'bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
            }`}
          >
            Gas
          </button>
          <button
            onClick={() => setActiveTab('oil')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              activeTab === 'oil' 
                ? 'bg-white dark:bg-white/10 border-b-4 border-blue-600 text-slate-900 dark:text-white' 
                : 'bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
            }`}
          >
            Oil
          </button>
        </div>

        {activeTab === 'gas' ? (
          <>
            <div className="flex mb-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setGasMode('mixture')}
                className={`flex-1 py-3 px-4 font-semibold transition-colors text-sm sm:text-base ${
                  gasMode === 'mixture' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                Gas Mixture Calculation
              </button>
              <button
                onClick={() => setGasMode('combustion')}
                className={`flex-1 py-3 px-4 font-semibold transition-colors text-sm sm:text-base ${
                  gasMode === 'combustion' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                Combustion Values Calculation
              </button>
            </div>

            {gasMode === 'mixture' ? (
              <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gas 1</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Proportion</span>
                    <input
                      type="text"
                      value={gas1MixturePercent}
                      onChange={(e) => handleGasMixturePercentChange(e.target.value)}
                      className="w-16 px-2 py-1.5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-lg text-center text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">%</span>
                  </div>
                </div>

                <GasComposition
                  components={gas1Components}
                  setComponents={(c) => { setGas1Components(c); setSelectedGas1Preset(''); }}
                  presets={gasPresets}
                  selectedPreset={selectedGas1Preset}
                  setSelectedPreset={(p) => { setSelectedGas1Preset(p); if (p) applyGasPreset(p, 1); }}
                  title=""
                  presetLabel="Gas type"
                />

                <button
                  onClick={() => setShowGas1Results(!showGas1Results)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition-colors text-sm mt-4"
                >
                  {showGas1Results ? 'Hide' : 'Calculate'} Gas 1 Key Data
                </button>

                {showGas1Results && calculateGasKeyData(gas1Components) && (
                  <div className="mt-3 p-3 bg-slate-900 dark:bg-slate-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-2">Gas 1 Key Data</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Density</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas1Components)!.density.toFixed(3)} kg/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Higher Heating Value (Hs)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas1Components)!.hs.toFixed(2)} kWh/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Lower Heating Value (Hi)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas1Components)!.hi.toFixed(2)} kWh/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Superior Wobbe Index (Ws)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas1Components)!.ws.toFixed(2)} kWh/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Inferior Wobbe Index (Wi)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas1Components)!.wi.toFixed(2)} kWh/m³</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gas 2</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Proportion</span>
                    <input
                      type="text"
                      value={(100 - (parseFloat(gas1MixturePercent) || 0)).toString()}
                      readOnly
                      className="w-16 px-2 py-1.5 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 rounded-lg text-center text-sm text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">%</span>
                  </div>
                </div>

                <GasComposition
                  components={gas2Components}
                  setComponents={(c) => { setGas2Components(c); setSelectedGas2Preset(''); }}
                  presets={gasPresets}
                  selectedPreset={selectedGas2Preset}
                  setSelectedPreset={(p) => { setSelectedGas2Preset(p); if (p) applyGasPreset(p, 2); }}
                  title=""
                  presetLabel="Gas type"
                />

                <button
                  onClick={() => setShowGas2Results(!showGas2Results)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition-colors text-sm mt-4"
                >
                  {showGas2Results ? 'Hide' : 'Calculate'} Gas 2 Key Data
                </button>

                {showGas2Results && calculateGasKeyData(gas2Components) && (
                  <div className="mt-3 p-3 bg-slate-900 dark:bg-slate-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-2">Gas 2 Key Data</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Density</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas2Components)!.density.toFixed(3)} kg/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Higher Heating Value (Hs)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas2Components)!.hs.toFixed(2)} kWh/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Lower Heating Value (Hi)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas2Components)!.hi.toFixed(2)} kWh/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Superior Wobbe Index (Ws)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas2Components)!.ws.toFixed(2)} kWh/m³</div>
                      </div>
                      <div className="bg-white/10 p-2 rounded-lg">
                        <div className="text-xs text-slate-300">Inferior Wobbe Index (Wi)</div>
                        <div className="text-sm font-bold text-blue-400">{calculateGasKeyData(gas2Components)!.wi.toFixed(2)} kWh/m³</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2">3</span>
                Gas Mixture
              </h2>

              <button
                onClick={() => setShowMixtureResults(!showMixtureResults)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition-colors text-sm"
              >
                {showMixtureResults ? 'Hide' : 'Calculate'} Mixture Key Data
              </button>

              {showMixtureResults && calculateMixture() && (
                <div className="mt-3 p-3 bg-slate-900 dark:bg-slate-800 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2">Gas Mixture Key Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <div className="text-xs text-slate-300">Density</div>
                      <div className="text-sm font-bold text-blue-400">{calculateMixture()!.density.toFixed(3)} kg/m³</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <div className="text-xs text-slate-300">Higher Heating Value (Hs)</div>
                      <div className="text-sm font-bold text-blue-400">{calculateMixture()!.hs.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <div className="text-xs text-slate-300">Lower Heating Value (Hi)</div>
                      <div className="text-sm font-bold text-blue-400">{calculateMixture()!.hi.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <div className="text-xs text-slate-300">Superior Wobbe Index (Ws)</div>
                      <div className="text-sm font-bold text-blue-400">{calculateMixture()!.ws.toFixed(2)} kWh/m³</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <div className="text-xs text-slate-300">Inferior Wobbe Index (Wi)</div>
                      <div className="text-sm font-bold text-blue-400">{calculateMixture()!.wi.toFixed(2)} kWh/m³</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 sm:mt-6">
              <button
                onClick={exportToPDF}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download size={20} />
                Export PDF Report
              </button>
            </div>
              </>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 sm:px-4 sm:py-5 md:px-5 md:py-6 border border-slate-200 dark:border-white/10 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                      <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2">1</span>
                      Fuel Gas Input
                    </h2>

                    <GasComposition
                      components={combustionGasComponents}
                      setComponents={(c) => { setCombustionGasComponents(c); setSelectedCombustionGasPreset(''); }}
                      presets={gasPresets}
                      selectedPreset={selectedCombustionGasPreset}
                      setSelectedPreset={(p) => { applyCombustionGasPreset(p); }}
                      title=""
                      presetLabel="Gas type"
                    />

                  </div>

                  <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 sm:px-4 sm:py-5 md:px-5 md:py-6 border border-slate-200 dark:border-white/10 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                      <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2">2</span>
                      Calculation Results
                    </h2>

                    {calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1) ? (
                      <>
                        <div className="mb-4 sm:mb-5">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">Key Data</h3>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="bg-blue-600 p-2 sm:p-3 rounded-xl text-white">
                              <div className="text-xs text-blue-200">Density</div>
                              <div className="text-lg font-bold">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.density.toFixed(3)} kg/m³</div>
                            </div>
                            <div className="bg-blue-600 p-2 sm:p-3 rounded-xl text-white">
                              <div className="text-xs text-blue-200">Relative Density</div>
                              <div className="text-lg font-bold">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.relativeDensity.toFixed(4)}</div>
                            </div>
                            <div className="bg-blue-600 p-2 sm:p-3 rounded-xl text-white">
                              <div className="text-xs text-blue-200">Hi (kWh/m³)</div>
                              <div className="text-lg font-bold">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.hi.toFixed(2)}</div>
                            </div>
                            <div className="bg-blue-600 p-2 sm:p-3 rounded-xl text-white">
                              <div className="text-xs text-blue-200">Lmin (m³/m³)</div>
                              <div className="text-lg font-bold">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.lmin.toFixed(3)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 sm:mb-5">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">Capacity / Flow Rate</h3>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Burner Capacity (kW)</label>
                              <input
                                type="text"
                                value={burnerCapacity}
                                onChange={(e) => setBurnerCapacity(e.target.value)}
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Air Ratio λ</label>
                              <input
                                type="text"
                                value={lambda}
                                onChange={(e) => setLambda(e.target.value)}
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-xl border border-blue-200 dark:border-blue-800/30">
                              <div className="text-xs text-slate-600 dark:text-slate-400">Gas Flow Rate</div>
                              <div className="text-base font-bold text-blue-600 dark:text-blue-400">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.gasFlowRate.toFixed(3)} m³/h</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-xl border border-blue-200 dark:border-blue-800/30">
                              <div className="text-xs text-slate-600 dark:text-slate-400">Air Flow Rate</div>
                              <div className="text-base font-bold text-blue-600 dark:text-blue-400">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.airFlowRate.toFixed(2)} m³/h</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2 sm:mb-3">Flue Gas Composition</h3>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <div className="text-xs text-slate-600 dark:text-slate-400">CO₂ (dry)</div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.co2Percent.toFixed(2)} %</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <div className="text-xs text-slate-600 dark:text-slate-400">O₂ (dry)</div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.o2Percent.toFixed(2)} %</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <div className="text-xs text-slate-600 dark:text-slate-400">N₂ (dry)</div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.n2Percent.toFixed(2)} %</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <div className="text-xs text-slate-600 dark:text-slate-400">H₂O (wet)</div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.h2oPercent.toFixed(2)} %</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <div className="text-xs text-slate-600 dark:text-slate-400">Dry Flue Gas Volume</div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.dryFlueGasVolume.toFixed(3)} m³/m³</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10">
                              <div className="text-xs text-slate-600 dark:text-slate-400">Wet Flue Gas Volume</div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.wetFlueGasVolume.toFixed(3)} m³/m³</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-white/10 col-span-2">
                              <div className="text-xs text-slate-600 dark:text-slate-400">Wet Flue Gas Density</div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">{calculateCombustion(combustionGasComponents, parseFloat(burnerCapacity) || 0, parseFloat(lambda) || 1)!.wetFlueGasDensity.toFixed(4)} kg/m³</div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p>Please select a gas type or enter gas composition</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <button
                    onClick={exportToPDF}
                    className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Download size={20} />
                    Export PDF Report
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-white/5 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 border border-slate-200 dark:border-white/10 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Oil Fuel Data</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Select Oil Type</label>
              <select
                value={selectedOil}
                onChange={(e) => handleOilTypeChange(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200"
              >
                {oilPresets.map((oil, index) => (
                  <option key={index} value={index}>{oil.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Elemental Analysis</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 dark:bg-slate-800 text-white">
                      <th className="text-left py-1.5 px-2 font-medium">Element</th>
                      <th className="text-right py-1.5 px-2 font-medium w-20">Vol.-%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oilElements.map((element, idx) => (
                      <tr key={element.symbol} className={idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50 dark:bg-white/5'}>
                        <td className="py-1 px-2 text-slate-700 dark:text-slate-300">{element.name}</td>
                        <td className="py-1 px-2 text-right">
                          <input
                            type="text"
                            value={element.percentage}
                            onChange={(e) => handleOilElementChange(element.symbol, e.target.value)}
                            className="w-16 px-1.5 py-0.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-xs text-right text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-slate-100 dark:bg-white/5 rounded-xl">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Percentage:</span>
                <span className={`text-lg font-bold ${Math.abs(getOilElementTotal() - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {getOilElementTotal().toFixed(2)}%
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowOilResults(!showOilResults)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {showOilResults ? 'Hide' : 'Show'} Oil Key Data
            </button>

            {showOilResults && calculateOilKeyData() && (
              <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-slate-900 dark:bg-slate-800 rounded-xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Oil Key Data ({oilPresets[selectedOil].name})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-slate-300">Density</div>
                    <div className="text-lg md:text-2xl font-bold text-blue-400">{calculateOilKeyData()!.density.toFixed(3)} kg/L</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-slate-300">Higher Heating Value (Hs)</div>
                    <div className="text-lg md:text-2xl font-bold text-blue-400">{calculateOilKeyData()!.hs.toFixed(2)} kWh/kg</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-slate-300">Lower Heating Value (Hi)</div>
                    <div className="text-lg md:text-2xl font-bold text-blue-400">{calculateOilKeyData()!.hi.toFixed(2)} kWh/kg</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-slate-300">Viscosity</div>
                    <div className="text-lg md:text-2xl font-bold text-blue-400">{calculateOilKeyData()!.viscosity.toFixed(1)} cSt</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-slate-300">Flash Point</div>
                    <div className="text-lg md:text-2xl font-bold text-blue-400">{calculateOilKeyData()!.flashPoint.toFixed(0)} °C</div>
                  </div>
                  <div className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="text-sm text-slate-300">Pour Point</div>
                    <div className="text-lg md:text-2xl font-bold text-blue-400">{calculateOilKeyData()!.pourPoint.toFixed(0)} °C</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-6">
              <button
                onClick={exportToPDF}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download size={20} />
                Export PDF Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
