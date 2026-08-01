import { useState } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { useSEO } from '../hooks/useSEO'
import { AlertTriangle, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { Navbar } from '../components/Navbar'
import SeoContentSection from '../components/SeoContentSection'
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

interface OilElement {
  name: string
  symbol: string
  percentage: string
}

const gasPresets: GasPreset[] = [
  {
    name: 'North sea natural gas H',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '88.79', 'C₂H₆': '6.88', 'C₃H₈': '1.23', 'C₄H₁₀': '0.27', 'C₅H₁₂': '0.05', 'C₆H₁₄': '0.02', 'N₂': '0.82', 'CO₂': '1.93', 'O₂': '0.01' }
  },
  {
    name: 'Russian natural gas H',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '96.97', 'C₂H₆': '1.36', 'C₃H₈': '0.44', 'C₄H₁₀': '0.15', 'C₅H₁₂': '0.02', 'C₆H₁₄': '0.01', 'N₂': '0.86', 'CO₂': '0.18', 'O₂': '0.01' }
  },
  {
    name: 'Dutch natural gas L',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '83.67', 'C₂H₆': '3.53', 'C₃H₈': '0.6', 'C₄H₁₀': '0.19', 'C₅H₁₂': '0.04', 'C₆H₁₄': '0.06', 'N₂': '10.23', 'CO₂': '1.67', 'O₂': '0.01' }
  },
  {
    name: 'Erdgas L (Low Calorific)',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '81.31', 'C₂H₆': '2.85', 'C₃H₈': '0.42', 'C₄H₁₀': '0.23', 'N₂': '14.29', 'CO₂': '0.89', 'O₂': '0.01' }
  },
  {
    name: 'Erdgas H (High Calorific)',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '93.3', 'C₂H₆': '3.38', 'C₃H₈': '0.94', 'C₄H₁₀': '0.71', 'N₂': '0.78', 'CO₂': '0.89' }
  },
  {
    name: 'Coke oven gas',
    composition: { 'H₂': '55', 'CO': '6', 'CH₄': '25', 'C₂H₆': '2', 'N₂': '10', 'CO₂': '2' }
  },
  {
    name: 'Coke Oven Gas',
    composition: { 'H₂': '57.78', 'CO': '4.49', 'CH₄': '30.24', 'C₄H₁₀': '3.29', 'N₂': '2.2', 'CO₂': '1.8', 'O₂': '0.2' }
  },
  {
    name: 'Blast furnace gas (BFG)',
    composition: { 'H₂': '3', 'CO': '25', 'N₂': '52', 'CO₂': '20' }
  },
  {
    name: 'Mixed natural gas H',
    composition: { 'H₂': '23.8', 'CO': '17.4', 'CH₄': '10', 'C₂H₆': '0.8', 'N₂': '35.2', 'CO₂': '12.8' }
  },
  {
    name: 'Biogas',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '60', 'N₂': '1', 'CO₂': '38.7', 'O₂': '0.3' }
  },
  {
    name: 'Hydrogen',
    composition: { 'H₂': '100' }
  },
  {
    name: 'Methane',
    composition: { 'CH₄': '100' }
  },
  {
    name: 'Propane',
    composition: { 'C₃H₈': '100' }
  },
  {
    name: 'Propane, Commercial',
    composition: { 'C₂H₆': '2.2', 'C₃H₈': '97.3', 'C₄H₁₀': '0.5' }
  },
  {
    name: 'Butane',
    composition: { 'C₄H₁₀': '100' }
  },
  {
    name: 'Average Natural Gas',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '89.45', 'C₂H₆': '5.08', 'C₃H₈': '1.44', 'C₄H₁₀': '0.31', 'N₂': '2.99', 'CO₂': '0.73' }
  },
  {
    name: 'Blast Furnace Gas',
    composition: { 'H₂': '1.65', 'CO': '25.1', 'N₂': '57.5', 'CO₂': '15.4', 'O₂': '0.35' }
  },
  {
    name: 'Landfill, Cagistrio 81',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '53.4', 'N₂': '12.25', 'CO₂': '34.3', 'O₂': '0.05' }
  },
  {
    name: 'N.Gas Birmingham',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '93.31', 'C₂H₆': '2.5', 'C₃H₈': '0.67', 'C₄H₁₀': '0.32', 'N₂': '2.14', 'CO₂': '1.06' }
  },
  {
    name: 'N.Gas East Ohio',
    composition: { 'H₂': '0.01', 'CO': '0', 'CH₄': '94.2', 'C₂H₆': '3.98', 'C₃H₈': '0.57', 'C₄H₁₀': '0.16', 'N₂': '0.3', 'CO₂': '0.68', 'O₂': '0.1' }
  },
  {
    name: 'N.Gas Pittsburgh',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '94.14', 'C₂H₆': '3.58', 'C₃H₈': '0.79', 'C₄H₁₀': '0.28', 'N₂': '0.4', 'CO₂': '0.8', 'O₂': '0.01' }
  },
  {
    name: 'N.Gas UGI',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '95.55', 'C₂H₆': '2.44', 'C₃H₈': '0.51', 'C₄H₁₀': '0.07', 'N₂': '0.41', 'CO₂': '0.92', 'O₂': '0.1' }
  },
  {
    name: 'Producer, Koppers-Totzek',
    composition: { 'H₂': '32.9', 'CO': '58.7', 'N₂': '1.4', 'CO₂': '7' }
  },
  {
    name: 'Producer, Lurgi',
    composition: { 'H₂': '40.2', 'CO': '17.1', 'CH₄': '10.2', 'N₂': '1.1', 'CO₂': '31.4' }
  },
  {
    name: 'UGI Gas',
    composition: { 'H₂': '0', 'CO': '0', 'CH₄': '95.74', 'C₂H₆': '2.24', 'C₃H₈': '0.51', 'C₄H₁₀': '0.41', 'N₂': '1.1' }
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

interface OilPreset {
  name: string
  C: number
  H: number
  S: number
  O: number
  N: number
  Ash: number
  Moisture: number
  gravity: number
  hs: number
  hi: number
  viscositySSU: string
  viscosityCS: string
  flashPoint: number
  pourPoint: string
  apiGravity: string
  hsMJ: number
  hiMJ: number
}

const oilPresets: OilPreset[] = [
  {
    name: 'Oil #1',
    C: 86.6, H: 13.3, S: 0.14, O: 0, N: 0, Ash: 0, Moisture: 0,
    gravity: 0.83,
    hs: 45.81, hi: 42.95,
    viscositySSU: '----', viscosityCS: '1.4 - 2.2',
    flashPoint: 38, pourPoint: '-18',
    apiGravity: '35 min',
    hsMJ: 38.02, hiMJ: 35.65,
  },
  {
    name: 'Oil #2',
    C: 87.3, H: 12.5, S: 0.21, O: 0, N: 0, Ash: 0, Moisture: 0,
    gravity: 0.87,
    hs: 45.19, hi: 42.46,
    viscositySSU: '32.6 - 37.9', viscosityCS: '2.0 - 3.6',
    flashPoint: 38, pourPoint: '-6',
    apiGravity: '30 min',
    hsMJ: 39.32, hiMJ: 36.94,
  },
  {
    name: 'Oil #4',
    C: 86.4, H: 11.6, S: 1.99, O: 0, N: 0, Ash: 0.02, Moisture: 0.2,
    gravity: 0.92,
    hs: 43.77, hi: 41.24,
    viscositySSU: '45 - 125', viscosityCS: '5.8 - 26.4',
    flashPoint: 55, pourPoint: '-----',
    apiGravity: '-----',
    hsMJ: 40.27, hiMJ: 37.94,
  },
  {
    name: 'Oil #5',
    C: 88.7, H: 10.7, S: 0.57, O: 0, N: 0, Ash: 0.02, Moisture: 0.4,
    gravity: 0.96,
    hs: 43.43, hi: 41.00,
    viscositySSU: '300 - 900', viscosityCS: '65 - 194',
    flashPoint: 55, pourPoint: '------',
    apiGravity: '-----',
    hsMJ: 41.69, hiMJ: 39.36,
  },
  {
    name: 'Oil #6',
    C: 88.3, H: 9.3, S: 0.85, O: 0.7, N: 0.3, Ash: 0.04, Moisture: 0.2,
    gravity: 1.02,
    hs: 42.38, hi: 40.14,
    viscositySSU: '900 - 9000', viscosityCS: '92 - 638',
    flashPoint: 60, pourPoint: '-------',
    apiGravity: '-----',
    hsMJ: 43.23, hiMJ: 40.94,
  },
  {
    name: 'Customized Oil Mixture',
    C: 0, H: 0, S: 0, O: 0, N: 0, Ash: 0, Moisture: 0,
    gravity: 0,
    hs: 0, hi: 0,
    viscositySSU: '----', viscosityCS: '----',
    flashPoint: 0, pourPoint: '----',
    apiGravity: '----',
    hsMJ: 0, hiMJ: 0,
  },
  {
    name: 'Custom Oil',
    C: 0, H: 0, S: 0, O: 0, N: 0, Ash: 0, Moisture: 0,
    gravity: 0,
    hs: 0, hi: 0,
    viscositySSU: '----', viscosityCS: '----',
    flashPoint: 0, pourPoint: '----',
    apiGravity: '----',
    hsMJ: 0, hiMJ: 0,
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
  useSEO({
    title: 'Fuel Gas Properties Calculator | ISO 6976 & ASTM D4868',
    description:
      'Calculate gas calorific value, Wobbe index, and fuel mixtures per ISO 6976 & ASTM D4868. Free online tool for engineers.',
    canonicalPath: '/fuel-manager',
    ogTitle: 'Fuel Gas Properties Calculator | ISO 6976',
    ogDescription:
      'Calculate gas calorific value, Wobbe index per ISO 6976 & ASTM D4868. Free online tool for engineers.',
    jsonLd: {
      name: 'Fuel Manager — Gas & Oil Properties Calculator',
      url: 'https://burnerdesignpro.com/fuel-manager',
      description:
        'Calculate gas calorific value, Wobbe index, density, and fuel mixtures per ISO 6976 & ASTM D4868.',
      offers: { price: '0', priceCurrency: 'USD' },
    },
  })

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

  const [oilMixturePercentages, setOilMixturePercentages] = usePersistentState<number[]>('fuelmanager_oilMixturePercentages', [0, 0, 0, 0, 0])

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

  const KROSCHROEDER_HS_COEFF = { C: 0.3544, H: 1.1293, S: 0.3625 }
const LATENT_HEAT_WATER = 2.442

  const calcASTMD4868 = (density_g_cm3: number, S_pct: number, Ash_pct: number, Moisture_pct: number) => {
    const d = density_g_cm3 * 1000
    const x = Moisture_pct / 100
    const y = Ash_pct / 100
    const s = S_pct / 100
    const qv_base = 51.916 - 8.792e-6 * d * d
    const Hs = qv_base * (1 - x - y - s) + 9.420 * s
    const qp_base = 46.423 - 8.792e-6 * d * d + 3.170e-3 * d
    const Hi = qp_base * (1 - x - y - s) + 9.420 * s - 2.449 * x
    return { Hs: roundTo(Hs, 2), Hi: roundTo(Hi, 2) }
  }

  const calcKromschroeder = (C: number, H: number, S: number, Moisture_pct: number) => {
    const Hs = roundTo(KROSCHROEDER_HS_COEFF.C * C + KROSCHROEDER_HS_COEFF.H * H + KROSCHROEDER_HS_COEFF.S * S, 2)
    const Hi = roundTo(Hs - LATENT_HEAT_WATER * (9 * H / 100 + Moisture_pct / 100), 2)
    return { Hs, Hi }
  }

  const roundToStr = (num: number, decimals: number) => {
    const factor = Math.pow(10, decimals)
    return (Math.round(num * factor) / factor).toFixed(decimals)
  }

  const roundTo = (num: number, decimals: number) => {
    const factor = Math.pow(10, decimals)
    return Math.round(num * factor) / factor
  }

  const getNormalizedElements = () => {
    if (selectedOil === 6) return oilElements
    const total = oilElements.reduce((sum, el) => sum + (parseFloat(el.percentage) || 0), 0)
    const isMixture = selectedOil === 5
    const tolerance = isMixture ? 0.05 : 0.005
    if (Math.abs(total - 100) < tolerance) return oilElements
    const factor = 100 / total
    const normalized = oilElements.map(el => ({
      ...el,
      percentage: roundToStr(parseFloat(el.percentage) * factor, 2)
    }))
    const normTotal = normalized.reduce((sum, el) => sum + (parseFloat(el.percentage) || 0), 0)
    const diff = 100 - normTotal
    if (Math.abs(diff) > 0.001) {
      let maxIdx = 0
      let maxVal = 0
      normalized.forEach((el, idx) => {
        const val = parseFloat(el.percentage)
        if (val > maxVal) {
          maxVal = val
          maxIdx = idx
        }
      })
      const adjusted = parseFloat(normalized[maxIdx].percentage) + diff
      normalized[maxIdx] = {
        ...normalized[maxIdx],
        percentage: roundToStr(adjusted, 2)
      }
    }
    return normalized
  }

  const calculateOilKeyData = () => {
    const C = parseFloat(oilElements.find(el => el.symbol === 'C')?.percentage || '') || 0
    const H = parseFloat(oilElements.find(el => el.symbol === 'H')?.percentage || '') || 0
    const S = parseFloat(oilElements.find(el => el.symbol === 'S')?.percentage || '') || 0
    const O = parseFloat(oilElements.find(el => el.symbol === 'O')?.percentage || '') || 0
    const N = parseFloat(oilElements.find(el => el.symbol === 'N')?.percentage || '') || 0
    const Ash = parseFloat(oilElements.find(el => el.symbol === 'Ash')?.percentage || '') || 0
    const Moisture = parseFloat(oilElements.find(el => el.symbol === 'Moist')?.percentage || '') || 0

    const isCustomMix = selectedOil === 5
    const isCustomOil = selectedOil === 6

    if (isCustomMix) {
      const totalMix = oilMixturePercentages.reduce((s, v) => s + v, 0)
      if (totalMix === 0) {
        return {
          density: 0,
          gravity: 0,
          hs: 0,
          hi: 0,
          hsMJ: 0,
          hiMJ: 0,
          viscositySSU: '----',
          viscosityCS: '----',
          flashPoint: 0,
          pourPoint: '----',
          apiGravity: '----',
          dryMass: 100,
          wetMass: 100,
        }
      }
      for (let i = 0; i < 5; i++) {
        if (oilMixturePercentages[i] === 100) {
          const preset = oilPresets[i]
          return {
            density: preset.gravity,
            gravity: preset.gravity,
            hs: preset.hs,
            hi: preset.hi,
            hsMJ: preset.hsMJ,
            hiMJ: preset.hiMJ,
            viscositySSU: preset.viscositySSU,
            viscosityCS: preset.viscosityCS,
            flashPoint: preset.flashPoint,
            pourPoint: preset.pourPoint,
            apiGravity: preset.apiGravity,
            dryMass: 100 - Moisture,
            wetMass: 100 - Moisture,
          }
        }
      }
      let gravity = 0
      let flashPoint = 0
      for (let i = 0; i < 5; i++) {
        gravity += oilPresets[i].gravity * (oilMixturePercentages[i] / totalMix)
        flashPoint += oilPresets[i].flashPoint * (oilMixturePercentages[i] / totalMix)
      }
      const astmResult = calcASTMD4868(gravity, S, Ash, Moisture)
      return {
        density: gravity,
        gravity: roundTo(gravity, 4),
        hs: astmResult.Hs,
        hi: astmResult.Hi,
        hsMJ: roundTo(gravity * astmResult.Hs, 2),
        hiMJ: roundTo(gravity * astmResult.Hi, 2),
        viscositySSU: 'Calculated',
        viscosityCS: 'Calculated',
        flashPoint: Math.round(flashPoint),
        pourPoint: '---',
        apiGravity: '---',
        dryMass: 100 - Moisture,
        wetMass: 100 - Moisture,
      }
    }

    if (isCustomOil) {
      const matchedPreset = oilPresets.find(p =>
        Math.abs(C - p.C) < 0.01 &&
        Math.abs(H - p.H) < 0.01 &&
        Math.abs(S - p.S) < 0.01 &&
        Math.abs(O - p.O) < 0.01 &&
        Math.abs(N - p.N) < 0.01 &&
        Math.abs(Ash - p.Ash) < 0.01 &&
        Math.abs(Moisture - p.Moisture) < 0.01
      )

      if (matchedPreset) {
        const hs = matchedPreset.hs
        const hi = matchedPreset.hi
        const gravity = matchedPreset.gravity
        const hsMJ = matchedPreset.hsMJ
        const hiMJ = matchedPreset.hiMJ
        return {
          density: gravity,
          gravity,
          hs,
          hi,
          hsMJ,
          hiMJ,
          viscositySSU: matchedPreset.viscositySSU,
          viscosityCS: matchedPreset.viscosityCS,
          flashPoint: matchedPreset.flashPoint,
          pourPoint: matchedPreset.pourPoint,
          apiGravity: matchedPreset.apiGravity,
          dryMass: 100 - Moisture,
          wetMass: 100 - Moisture,
        }
      }

      const gravity = roundTo(Math.min(1.02, Math.max(0.80, 1.06 - 0.015 * H)), 4)
      const astmResult = calcASTMD4868(gravity, S, Ash, Moisture)
      return {
        density: gravity,
        gravity,
        hs: astmResult.Hs,
        hi: astmResult.Hi,
        hsMJ: roundTo(gravity * astmResult.Hs, 2),
        hiMJ: roundTo(gravity * astmResult.Hi, 2),
        viscositySSU: '---',
        viscosityCS: '---',
        flashPoint: 0,
        pourPoint: '---',
        apiGravity: '---',
        dryMass: 100 - Moisture,
        wetMass: 100 - Moisture,
      }
    }

    const preset = oilPresets[selectedOil]
    const elementsMatchPreset = preset &&
      Math.abs(C - preset.C) < 0.01 &&
      Math.abs(H - preset.H) < 0.01 &&
      Math.abs(S - preset.S) < 0.01 &&
      Math.abs(O - preset.O) < 0.01 &&
      Math.abs(N - preset.N) < 0.01 &&
      Math.abs(Ash - preset.Ash) < 0.01 &&
      Math.abs(Moisture - preset.Moisture) < 0.01

    const gravity = elementsMatchPreset ? preset.gravity : 0.83 + (selectedOil - 1) * 0.05
    const flashPoint = elementsMatchPreset ? preset.flashPoint : 38
    const pourPoint = elementsMatchPreset ? preset.pourPoint : '--'
    const viscositySSU = elementsMatchPreset ? preset.viscositySSU : '--'
    const viscosityCS = elementsMatchPreset ? preset.viscosityCS : '--'
    const apiGravity = elementsMatchPreset ? preset.apiGravity : '--'
    const astmResult = elementsMatchPreset
      ? { Hs: preset.hs, Hi: preset.hi }
      : calcASTMD4868(gravity, S, Ash, Moisture)
    const hs = astmResult.Hs
    const hi = astmResult.Hi
    const hsMJ = roundTo(gravity * hs, 2)
    const hiMJ = roundTo(gravity * hi, 2)

    return {
      density: gravity,
      gravity,
      hs,
      hi,
      hsMJ,
      hiMJ,
      viscositySSU,
      viscosityCS,
      flashPoint,
      pourPoint,
      apiGravity,
      dryMass: 100 - Moisture,
      wetMass: 100 - Moisture,
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
    if (index === 5) {
      let percentages = [...oilMixturePercentages]
      const totalMix = percentages.reduce((s, v) => s + v, 0)
      if (totalMix !== 100 && totalMix > 0) {
        percentages = percentages.map(v => roundTo(v * 100 / totalMix, 1))
        const newTotal = percentages.reduce((s, v) => s + v, 0)
        if (Math.abs(newTotal - 100) > 0.01) {
          const maxIdx = percentages.reduce((a, b) => percentages[a] > percentages[b] ? a : b)
          percentages[maxIdx] = roundTo(percentages[maxIdx] + 100 - newTotal, 1)
        }
        setOilMixturePercentages(percentages)
      } else if (totalMix === 0) {
        percentages = [100, 0, 0, 0, 0]
        setOilMixturePercentages(percentages)
      }
      const blended = calculateOilMixtureElements(percentages)
      setOilElements(blended)
    } else if (index === 6) {
      const emptyElements = [
        { name: 'C', symbol: 'C', percentage: '0' },
        { name: 'H', symbol: 'H', percentage: '0' },
        { name: 'S', symbol: 'S', percentage: '0' },
        { name: 'O', symbol: 'O', percentage: '0' },
        { name: 'N', symbol: 'N', percentage: '0' },
        { name: 'Ash', symbol: 'Ash', percentage: '0' },
        { name: 'Moist', symbol: 'Moist', percentage: '0' },
      ]
      setOilElements(emptyElements)
    } else {
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
  }

  const calculateOilMixtureElements = (percentages: number[] = oilMixturePercentages) => {
    const elements: Array<{ name: string; symbol: string; key: keyof OilPreset }> = [
      { name: 'C', symbol: 'C', key: 'C' },
      { name: 'H', symbol: 'H', key: 'H' },
      { name: 'S', symbol: 'S', key: 'S' },
      { name: 'O', symbol: 'O', key: 'O' },
      { name: 'N', symbol: 'N', key: 'N' },
      { name: 'Ash', symbol: 'Ash', key: 'Ash' },
      { name: 'Moist', symbol: 'Moist', key: 'Moisture' },
    ]
    const totalMix = percentages.reduce((s, v) => s + v, 0)
    if (totalMix === 0) {
      return elements.map(el => ({ name: el.name, symbol: el.symbol, percentage: '0.00' }))
    }
    const raw = elements.map((el) => {
      let sum = 0
      for (let j = 0; j < 5; j++) {
        const volumeFraction = percentages[j] / totalMix
        sum += (oilPresets[j][el.key] as number) * volumeFraction
      }
      return { name: el.name, symbol: el.symbol, percentage: roundToStr(sum, 2) }
    })
    const rawTotal = raw.reduce((s, el) => s + (parseFloat(el.percentage) || 0), 0)
    const diff = roundToStr(100 - rawTotal, 2)
    if (parseFloat(diff) !== 0) {
      let maxIdx = 0
      let maxVal = -1
      raw.forEach((el, idx) => {
        const val = parseFloat(el.percentage)
        if (val > maxVal) {
          maxVal = val
          maxIdx = idx
        }
      })
      raw[maxIdx] = {
        ...raw[maxIdx],
        percentage: roundToStr(parseFloat(raw[maxIdx].percentage) + parseFloat(diff), 2)
      }
    }
    return raw
  }

  const handleOilMixturePercentageChange = (oilIndex: number, value: string) => {
    const newPercentages = [...oilMixturePercentages]

    if (value === '' || value === '-' || value === '.') {
      newPercentages[oilIndex] = 0
      setOilMixturePercentages(newPercentages)
      return
    }

    const numValue = parseFloat(value) || 0
    const oldValue = newPercentages[oilIndex]
    const diff = numValue - oldValue

    if (diff === 0) return

    if (numValue >= 100) {
      for (let i = 0; i < 5; i++) {
        newPercentages[i] = i === oilIndex ? 100 : 0
      }
    } else if (numValue === 0) {
      newPercentages[oilIndex] = 0
      const others = [0, 1, 2, 3, 4].filter(i => i !== oilIndex)
      const otherTotal = others.reduce((s, i) => s + newPercentages[i], 0)
      if (otherTotal > 0) {
        const remaining = 100 - newPercentages[oilIndex]
        others.forEach(i => {
          newPercentages[i] = roundTo(newPercentages[i] * remaining / otherTotal, 1)
        })
        const assigned = others.reduce((s, i) => s + newPercentages[i], 0)
        if (Math.abs(assigned - remaining) > 0.01) {
          const maxIdx = others.reduce((a, b) => newPercentages[a] > newPercentages[b] ? a : b)
          newPercentages[maxIdx] = roundTo(newPercentages[maxIdx] + remaining - assigned, 1)
        }
      }
    } else {
      newPercentages[oilIndex] = numValue
      const others = [0, 1, 2, 3, 4].filter(i => i !== oilIndex)
      const otherTotal = others.reduce((s, i) => s + newPercentages[i], 0)
      if (otherTotal > 0 && Math.abs(diff) > 0) {
        others.forEach(i => {
          newPercentages[i] = roundTo(newPercentages[i] - diff * newPercentages[i] / otherTotal, 1)
        })
      }
      const total = newPercentages.reduce((s, v) => s + v, 0)
      if (Math.abs(total - 100) > 0.01) {
        const maxIdx = newPercentages.reduce((a, b) => newPercentages[a] > newPercentages[b] ? a : b)
        newPercentages[maxIdx] = roundTo(newPercentages[maxIdx] + 100 - total, 1)
      }
    }

    setOilMixturePercentages(newPercentages)
    if (selectedOil === 5) {
      const blended = calculateOilMixtureElements(newPercentages)
      setOilElements(blended)
    }
  }

  const getOilMixtureTotal = () => {
    return oilMixturePercentages.reduce((sum, v) => sum + v, 0)
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
      const oilRows = getNormalizedElements()
        .filter(el => parseFloat(el.percentage) > 0)
        .map(el => [el.name + ' (' + el.symbol + ')', el.percentage + '%'] as [string, string]);
      if (oilRows.length > 0) {
        y = drawInfoTable(doc, oilRows, MARGIN_LEFT, y, CONTENT_WIDTH / 2 - 4);
      }

      if (oilData) {
        y = checkPageBreak(doc, y, 100, 'Fuel Analysis Report', 'Oil Properties');
        y = drawSubSectionTitle(doc, 'Key Properties', y);
        const cardWidth = (CONTENT_WIDTH - 8) / 3;
        drawResultCard(doc, { label: 'Density Ratio', value: pdfFormatNumber(oilData.gravity, 2), x: MARGIN_LEFT, y, width: cardWidth, highlight: true });
        drawResultCard(doc, { label: 'Hs (MJ/kg)', value: pdfFormatNumber(oilData.hs, 2), x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, highlight: true });
        drawResultCard(doc, { label: 'Hi (MJ/kg)', value: pdfFormatNumber(oilData.hi, 2), x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, highlight: true });
        y += 37;
        drawResultCard(doc, { label: 'Viscosity (SSU)', value: oilData.viscositySSU, x: MARGIN_LEFT, y, width: cardWidth, status: 'info' });
        drawResultCard(doc, { label: 'Viscosity (cSt)', value: oilData.viscosityCS, x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, status: 'info' });
        drawResultCard(doc, { label: 'Flash Point', value: String(oilData.flashPoint) + ' deg C', x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, status: 'info' });
        y += 37;
        drawResultCard(doc, { label: 'Pour Point', value: String(oilData.pourPoint) + ' deg C', x: MARGIN_LEFT, y, width: cardWidth, status: 'info' });
        drawResultCard(doc, { label: 'API Gravity', value: oilData.apiGravity, x: MARGIN_LEFT + cardWidth + 4, y, width: cardWidth, status: 'info' });
        drawResultCard(doc, { label: 'Hs (MJ/l)', value: pdfFormatNumber(oilData.hsMJ, 2), x: MARGIN_LEFT + (cardWidth + 4) * 2, y, width: cardWidth, status: 'info' });
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

      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white py-16 px-6 text-center border-b border-slate-800 relative overflow-hidden">
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
            className={`flex-1 py-4 font-semibold transition-all ${
              activeTab === 'gas' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                : 'bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
            }`}
          >
            Gas
          </button>
          <button
            onClick={() => setActiveTab('oil')}
            className={`flex-1 py-4 font-semibold transition-all ${
              activeTab === 'oil' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
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
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                    : 'bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                Gas Mixture Calculation
              </button>
              <button
                onClick={() => setGasMode('combustion')}
                className={`flex-1 py-3 px-4 font-semibold transition-colors text-sm sm:text-base ${
                  gasMode === 'combustion' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                    : 'bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                Combustion Values Calculation
              </button>
            </div>

            {gasMode === 'mixture' ? (
              <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 border border-slate-200 dark:border-white/10 shadow-md hover:shadow-lg transition-shadow">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-xl font-semibold transition-all text-sm mt-4 shadow-md hover:shadow-lg"
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

              <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 border border-slate-200 dark:border-white/10 shadow-md hover:shadow-lg transition-shadow">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-xl font-semibold transition-all text-sm mt-4 shadow-md hover:shadow-lg"
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

            <div className="bg-white dark:bg-white/5 rounded-2xl px-3 py-4 border border-slate-200 dark:border-white/10 shadow-md hover:shadow-lg transition-shadow mb-6">
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
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl"
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
          <div className="bg-white dark:bg-white/5 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 border border-slate-200 dark:border-white/10 shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Oil Fuel Data</h2>

            <div className="mb-4 sm:mb-6 flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">Oil</span>
              <select
                value={selectedOil}
                onChange={(e) => handleOilTypeChange(parseInt(e.target.value))}
                className="flex-1 max-w-xs px-3 py-2 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-colors duration-200 text-sm"
              >
                {oilPresets.map((oil, index) => (
                  <option key={index} value={index}>{oil.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 mb-4">
              <div className="flex-1">
                {selectedOil === 5 && (
                  <div className="mb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse table-fixed">
                        <thead>
                          <tr className="bg-slate-900 dark:bg-slate-800 text-white">
                            <th className="text-left py-1.5 px-2 font-medium w-1/2">Oil</th>
                            <th className="text-left py-1.5 px-2 font-medium w-1/2">Vol.-%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oilPresets.slice(0, 5).map((oil, idx) => (
                            <tr key={oil.name} className={idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50 dark:bg-white/5'}>
                              <td className="py-1 px-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">{oil.name}</td>
                              <td className="py-1 px-2 border border-slate-200 dark:border-white/10">
                                <input
                                  type="number"
                                  value={oilMixturePercentages[idx] || ''}
                                  onChange={(e) => handleOilMixturePercentageChange(idx, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  onBlur={(e) => {
                                    if (e.target.value === '') {
                                      const newPercents = [...oilMixturePercentages]
                                      newPercents[idx] = 0
                                      setOilMixturePercentages(newPercents)
                                      if (selectedOil === 5) {
                                        setOilElements(calculateOilMixtureElements(newPercents))
                                      }
                                    }
                                  }}
                                  className="w-full px-2 py-0.5 border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                />
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-200 dark:bg-white/10">
                            <td className="py-1 px-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">Total</td>
                            <td className="py-1 px-2 border border-slate-200 dark:border-white/10">
                              <span className={`text-xs font-bold ${Math.abs(getOilMixtureTotal() - 100) < 0.01 ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'}`}>
                                {getOilMixtureTotal().toFixed(0)}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-900 dark:bg-slate-800 text-white">
                          <th className="text-left py-1.5 px-2 font-medium w-1/2">Element</th>
                          <th className="text-left py-1.5 px-2 font-medium w-1/2">Wt.-%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getNormalizedElements().map((element, idx) => {
                          const isEditable = selectedOil === 6
                          return (
                            <tr key={element.symbol} className={idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50 dark:bg-white/5'}>
                              <td className="py-1 px-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                {element.symbol === 'C' ? 'C, Available' : element.symbol === 'H' ? 'H, Available' : element.symbol === 'Moist' ? 'Moisture' : element.name}
                              </td>
                              <td className="py-1 px-2 border border-slate-200 dark:border-white/10">
                                {isEditable ? (
                                  <input
                                    type="text"
                                    value={element.percentage}
                                    onChange={(e) => handleOilElementChange(element.symbol, e.target.value)}
                                    className="w-full px-2 py-0.5 border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="block w-full px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded">
                                    {element.percentage}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        {(() => {
                          const normTotal = getNormalizedElements().reduce((sum, el) => sum + (parseFloat(el.percentage) || 0), 0)
                          const isOK = Math.abs(normTotal - 100) < 0.05
                          return (
                            <tr className="bg-slate-200 dark:bg-white/10">
                              <td className="py-1 px-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">Total</td>
                              <td className="py-1 px-2 border border-slate-200 dark:border-white/10">
                                <span className={`text-xs font-bold ${isOK ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'}`}>
                                  {normTotal.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          )
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="lg:w-64 flex-shrink-0">
                {calculateOilKeyData() && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32">Density ratio</span>
                      <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                        {calculateOilKeyData()!.gravity.toFixed(selectedOil === 5 ? 4 : 2)}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32 pt-1">
                        Higher heating value H<sub>s</sub> (H<sub>o</sub>)
                      </span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                          {calculateOilKeyData()!.hs.toFixed(2)}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">MJ/kg</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32 pt-1">
                        Lower heating value H<sub>i</sub> (H<sub>u</sub>)
                      </span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                          {calculateOilKeyData()!.hi.toFixed(2)}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">MJ/kg</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400 w-32">Viscosity (SSU) at 37.8°C</span>
                        <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                          {calculateOilKeyData()!.viscositySSU}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32">Viscosity (cSt) at 37.8°C</span>
                      <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                        {calculateOilKeyData()!.viscosityCS}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32">Flash Temperature max</span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                          {calculateOilKeyData()!.flashPoint}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32">Pour Temperature Point min</span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                          {calculateOilKeyData()!.pourPoint}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32">API Gravity</span>
                      <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                        {calculateOilKeyData()!.apiGravity}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400 w-32 pt-1">
                          Higher heating value H<sub>s</sub> (H<sub>o</sub>)
                        </span>
                        <div className="flex-1 flex items-center gap-1">
                          <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                            {calculateOilKeyData()!.hsMJ.toFixed(2)}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">MJ/l</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-32 pt-1">
                        Lower heating value H<sub>i</sub> (H<sub>u</sub>)
                      </span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 px-2 py-1 border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 rounded text-xs text-slate-900 dark:text-white font-medium">
                          {calculateOilKeyData()!.hiMJ.toFixed(2)}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">MJ/l</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={exportToPDF}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl"
              >
                <Download size={20} />
                Export PDF Report
              </button>
            </div>
          </div>
        )}
      </div>

      <SeoContentSection
        ariaLabel="About Fuel Manager"
        title="Fuel Gas Properties Calculator"
        intro="The Fuel Manager tool calculates thermodynamic properties of fuel gases and oils according to ISO 6976 (natural gas — calculation of calorific values, density, relative density and Wobbe index) and ASTM D4868 (standard test method for estimation of net and gross heat of combustion of burner and diesel fuels). This free online calculator is designed for combustion engineers, process engineers, and energy analysts who need accurate fuel property data for burner design and emission calculations. The tool supports 25+ gas presets from around the world including North Sea, Russian, Dutch natural gases, as well as coke oven gas, blast furnace gas, biogas, hydrogen, and common hydrocarbons. The combustion calculation mode determines flue gas composition, air requirements, and energy output for burner capacity sizing."
        blocks={[
          {
            type: 'list',
            heading: 'What You Can Calculate',
            items: [
              'Gross and net calorific value (heating value) of natural gas mixtures per ISO 6976',
              'Wobbe index — critical for fuel interchangeability and burner compatibility assessment',
              'Gas density and relative density referenced to air per ISO 6976:2016',
              'Gas compressibility factor at standard and reference conditions',
              'Fuel mixture properties for blended gases (e.g., LNG + pipeline gas)',
              'Oil heating value per ASTM D4868 using Kroschroeder and ASTM D4868 formulas',
              'Combustion stoichiometry: minimum air requirement, flue gas volume, and composition',
              'Burner capacity sizing from fuel consumption and lambda (excess air ratio)',
              'Flue gas analysis including CO2, H2O, O2, N2 volume percentages',
              'Annual fuel consumption estimation based on operating hours and load factor',
            ],
          },
          {
            type: 'paragraph',
            heading: 'Fuel Property Calculation Methodology',
            text: 'Calculations use the ISO 6976:2016 standard method for natural gas, which employs the summation of component properties mole-fraction weighted approach. Each gas component (CH4, C2H6, C3H8, N2, CO2, H2, CO, O2, etc.) contributes to the mixture properties based on its mole fraction. The gross calorific value (Hs) and net calorific value (Hi) are calculated from component contributions using the formula H = Σ(xi × Hi), where xi is the mole fraction of component i. Density follows the same additive principle: ρ = Σ(xi × ρi). The Wobbe index (Ws and Wi) is derived by dividing calorific value by the square root of relative density, providing a measure of fuel interchangeability for burner design. For liquid fuels, the ASTM D4868-17 method is used, which correlates heating value with density and elemental analysis (C, H, S, O, N, ash, moisture content). The Kroschroeder formula provides an alternative calculation based on carbon, hydrogen, and sulfur content percentages.',
          },
          {
            type: 'paragraph',
            heading: 'Combustion and Flue Gas Analysis',
            text: 'The combustion calculation mode performs complete stoichiometric analysis of fuel oxidation. Based on the fuel composition and specified lambda (excess air ratio), the tool calculates the minimum stoichiometric air requirement (Lmin), actual air flow, and resulting flue gas composition. The flue gas analysis includes both dry-basis and wet-basis volume percentages of CO2, H2O, O2, and N2, as well as the total wet and dry flue gas volumes per unit of fuel. This is essential for heat exchanger design, stack sizing, and emission estimation. The density of the wet flue gas is also calculated for fan sizing and duct design. Results can be exported as a professional PDF report for engineering documentation and project handover.',
          },
          {
            type: 'list',
            heading: 'Industry Applications',
            items: [
              'Burner design and combustion chamber sizing for industrial furnaces and boilers',
              'Fuel interchangeability studies when switching between gas suppliers or blending fuels',
              'Pipeline gas quality assessment and Wobbe index compliance verification',
              'LNG terminal operations and vaporization facility design',
              'Emission reporting preparation by providing accurate fuel property data',
              'Energy audit and efficiency studies for process heating systems',
              'LPG/propane/butane system design and conversion projects',
            ],
          },
          {
            type: 'paragraph',
            heading: 'Standards & Compliance',
            text: 'All calculations follow the formulas and methods specified in ISO 6976:2016 and ASTM D4868-17. Results are deterministic and traceable to the standards\' equations, making them suitable for engineering documentation and compliance reporting. The tool provides volume data in normal cubic meters (Nm³) at 0°C and 1.01325 bar per ISO 13443 reference conditions. For oil fuels, both gross (higher) and net (lower) heating values are provided in MJ/kg and MJ/m³, along with viscosity estimates in both Saybolt Seconds Universal (SSU) and centistokes (cSt) units. Professional engineering judgment should be applied when interpreting results for critical applications.',
          },
        ]}
      />
    </div>
  )
}
