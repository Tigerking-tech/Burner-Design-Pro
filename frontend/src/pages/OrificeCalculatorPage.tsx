import { useState, useEffect } from 'react'
import ProFeaturePreview from '../components/ProFeaturePreview'
import { authAPI } from '../services/api'
import { Navbar } from '../components/Navbar'
import { Gauge, Download, Info, AlertCircle, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { jsPDF } from 'jspdf'
import { usePersistentState } from '../hooks/usePersistentState'
import {
  createPDF,
  addCoverPage,
  drawPageHeader,
  drawSectionTitle,
  drawSubSectionTitle,
  drawInfoTable,
  drawResultCard,
  drawTwoColumnTables,
  drawBulletList,
  drawPageFooter,
  addDisclaimerPage,
  checkPageBreak,
  sanitizeText,
  setTextColor,
  setFillColor,
  setDrawColor,
  COLORS,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  CONTENT_WIDTH,
} from '../utils/pdfUtils'

interface CalculationResult {
  orificeDiameter: number
  betaRatio: number
  dischargeCoef: number
  reynoldsNum: number
  velocity: number
  massFlowRate: number
  pressureDrop: number
  permanentPressureLoss: number
}

interface CurvePoint {
  beta: number
  dischargeCoef: number
  pressureDrop: number
  flowRate: number
}

interface PipeSize {
  dn: number
  label: string
  internalDiameter: number
}

const pipeSizes: PipeSize[] = [
  { dn: 6, label: 'DN 6', internalDiameter: 7 },
  { dn: 8, label: 'DN 8', internalDiameter: 9 },
  { dn: 10, label: 'DN 10', internalDiameter: 11.6 },
  { dn: 15, label: 'DN 15', internalDiameter: 17.3 },
  { dn: 20, label: 'DN 20', internalDiameter: 22.3 },
  { dn: 25, label: 'DN 25', internalDiameter: 28.8 },
  { dn: 32, label: 'DN 32', internalDiameter: 37.2 },
  { dn: 40, label: 'DN 40', internalDiameter: 43.1 },
  { dn: 50, label: 'DN 50', internalDiameter: 54.5 },
  { dn: 65, label: 'DN 65', internalDiameter: 70.3 },
  { dn: 80, label: 'DN 80', internalDiameter: 82.5 },
  { dn: 100, label: 'DN 100', internalDiameter: 107.1 },
  { dn: 125, label: 'DN 125', internalDiameter: 132.6 },
  { dn: 150, label: 'DN 150', internalDiameter: 160.4 },
  { dn: 200, label: 'DN 200', internalDiameter: 210.1 },
  { dn: 250, label: 'DN 250', internalDiameter: 263 },
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

type PressureUnit = 'bar' | 'mbar' | 'Pa' | 'kPa' | 'MPa' | 'psi' | 'atm'
type TemperatureUnit = 'C' | 'K' | 'F'

const pressureUnits: { value: PressureUnit; label: string; toBar: (val: number) => number }[] = [
  { value: 'bar', label: 'bar', toBar: (v) => v },
  { value: 'mbar', label: 'mbar', toBar: (v) => v / 1000 },
  { value: 'Pa', label: 'Pa', toBar: (v) => v / 100000 },
  { value: 'kPa', label: 'kPa', toBar: (v) => v / 100 },
  { value: 'MPa', label: 'MPa', toBar: (v) => v * 10 },
  { value: 'psi', label: 'psi', toBar: (v) => v * 0.0689476 },
  { value: 'atm', label: 'atm', toBar: (v) => v * 1.01325 }
]

const temperatureUnits: { value: TemperatureUnit; label: string; toCelsius: (val: number) => number }[] = [
  { value: 'C', label: '°C', toCelsius: (v) => v },
  { value: 'K', label: 'K', toCelsius: (v) => v - 273.15 },
  { value: 'F', label: '°F', toCelsius: (v) => (v - 32) * 5 / 9 }
]

function RestrictingOrificeDiagram() {
  return (
    <svg 
      version="1.1" 
      xmlns="http://www.w3.org/2000/svg" 
      xmlnsXlink="http://www.w3.org/1999/xlink" 
      x="0px" y="0px"
      viewBox="0 0 244.333 218.667" 
      className="w-full h-auto"
    >
      <g id="Drosselblende">
        <polygon fill="#E8F0F8" points="19.503,39.814 111.173,39.814 111.173,6 133.162,6 133.162,39.814 225.177,39.814 225.177,134.162 209.886,134.162 209.827,151.098 207.81,160.15 201.542,160.15 199.521,150.817 199.647,134.162 133.417,134.162 133.166,168.033 111.423,168.033 111.423,134.162 44.942,134.162 44.958,151.378 43.031,160.13 36.626,160.13 35.014,151.068 35.139,134.162 19.503,134.162"/>
        <text transform="matrix(1 0 0 1 52.0493 171.8242)" fill="#101111" fontFamily="ArialMT" fontSize="20">5xDN</text>
        <polygon fill="#101111" points="130.242,168.033 136.242,168.033 136.242,137.162 200.673,137.162 200.673,131.162 130.242,131.162"/>
        <polygon fill="#101111" points="200.427,160.363 202.392,159.988 200.659,150.91 200.676,131.162 198.676,131.162 198.676,151.098"/>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="53.181" y1="149.598" x2="100.929" y2="149.598"/>
            <g>
              <polygon fill="#101111" points="54.64,154.556 46.004,149.57 54.64,144.584"/>
            </g>
            <g>
              <polygon fill="#101111" points="99.47,154.556 108.105,149.57 99.47,144.584"/>
            </g>
          </g>
        </g>
        <text transform="matrix(1 0 0 1 142.6206 171.8242)" fill="#101111" fontFamily="ArialMT" fontSize="20">5xDN</text>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="143.752" y1="149.598" x2="191.5" y2="149.598"/>
            <g>
              <polygon fill="#101111" points="145.211,154.556 136.576,149.57 145.211,144.584"/>
            </g>
            <g>
              <polygon fill="#101111" points="190.041,154.556 198.676,149.57 190.041,144.584"/>
            </g>
          </g>
        </g>
        <polygon fill="#101111" points="35.755,160.363 34.022,151.285 34.004,131.162 36.004,131.162 36.004,151.098 37.72,159.988"/>
        <rect x="19.503" y="131.162" fill="#101111" width="16.501" height="6"/>
        <polygon fill="#101111" points="208.925,160.363 210.659,151.285 210.676,131.162 208.676,131.162 208.676,151.098 206.96,159.988"/>
        <rect x="208.676" y="131.162" fill="#101111" width="16.501" height="6"/>
        <polygon fill="#101111" points="114.439,168.033 108.439,168.033 108.439,137.162 44.007,137.162 44.007,131.162 114.439,131.162"/>
        <polygon fill="#101111" points="44.253,160.363 42.289,159.988 44.022,150.91 44.004,131.162 46.004,131.162 46.004,151.098"/>
        <text transform="matrix(1 0 0 1 110.7485 208.3584)" fill="#101111" fontFamily="ArialMT" fontSize="20">∆p</text>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="50.033" y1="191.142" x2="194.439" y2="191.142"/>
            <g>
              <polygon fill="#101111" points="52.075,198.083 39.986,191.104 52.075,184.123"/>
            </g>
            <g>
              <polygon fill="#101111" points="192.396,198.083 204.486,191.104 192.396,184.123"/>
            </g>
          </g>
        </g>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="39.986" y1="160.363" x2="39.986" y2="199.642"/>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="204.486" y1="160.363" x2="204.486" y2="199.642"/>
      </g>
      <g id="Allg_vorne">
        <text transform="matrix(1 0 0 1 41.7593 92.0869)" fill="#101111" fontFamily="ArialMT" fontSize="20">D</text>
        <text transform="matrix(1 0 0 1 108.9556 92.0869)" fill="#101111" fontFamily="ArialMT" fontSize="20">d</text>
        <text transform="matrix(1 0 0 1 196.5532 92.0869)" fill="#101111" fontFamily="ArialMT" fontSize="20">Q</text>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="148.503" y1="87.017" x2="182.913" y2="87.017"/>
            <g>
              <polygon fill="#101111" points="180.87,93.958 192.959,86.979 180.87,79.998"/>
            </g>
          </g>
        </g>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="61.069" y1="121.115" x2="61.069" y2="52.607"/>
            <g>
              <polygon fill="#101111" points="68.01,119.073 61.031,131.162 54.05,119.073"/>
            </g>
            <g>
              <polygon fill="#101111" points="68.01,54.65 61.031,42.561 54.05,54.65"/>
            </g>
          </g>
        </g>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="99.432" y1="95.161" x2="99.432" y2="78.872"/>
            <g>
              <polygon fill="#101111" points="104.39,93.702 99.405,102.337 94.418,93.702"/>
            </g>
            <g>
              <polygon fill="#101111" points="104.39,80.331 99.405,71.695 94.418,80.331"/>
            </g>
          </g>
        </g>
        <polygon fill="#101111" points="117.949,6 117.949,71.491 126.908,62.532 126.908,6"/>
        <polygon fill="#101111" points="117.949,168.033 117.949,102.542 126.908,111.501 126.908,168.033"/>
        <polygon fill="#101111" points="114.439,42.871 19.503,42.871 19.503,36.871 108.439,36.871 108.439,6 114.439,6"/>
        <polygon fill="#101111" points="225.177,42.871 130.242,42.871 130.242,6 136.242,6 136.242,36.871 225.177,36.871"/>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="117.949" y1="70.356" x2="94.331" y2="70.356"/>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="117.949" y1="103.677" x2="94.331" y2="103.677"/>
      </g>
    </svg>
  )
}

function MeasuringOrificeDiagram() {
  return (
    <svg 
      version="1.1" 
      xmlns="http://www.w3.org/2000/svg" 
      xmlnsXlink="http://www.w3.org/1999/xlink" 
      x="0px" y="0px"
      viewBox="0 0 244.333 218.667" 
      className="w-full h-auto"
    >
      <g id="Messblende">
        <polygon fill="#E8F0F8" points="19.503,39.814 111.173,39.814 111.173,6 133.162,6 133.162,39.814 225.177,39.814 225.177,134.162 157.646,134.162 157.586,151.098 155.57,160.15 149.302,160.15 147.281,150.817 147.407,134.162 133.417,134.162 133.166,168.033 111.423,168.033 111.423,134.162 97.182,134.162 97.198,151.378 95.271,160.13 88.867,160.13 87.254,151.068 87.379,134.162 19.503,134.162"/>
        <polygon fill="#101111" points="130.242,168.033 136.242,168.033 136.242,137.162 148.433,137.162 148.433,131.162 130.242,131.162"/>
        <polygon fill="#101111" points="148.187,160.363 150.152,159.988 148.418,150.91 148.436,131.162 146.436,131.162 146.436,151.098"/>
        <polygon fill="#101111" points="87.996,160.363 86.262,151.285 86.245,131.162 88.245,131.162 88.245,151.098 89.96,159.988"/>
        <rect x="19.503" y="131.162" fill="#101111" width="68.741" height="6"/>
        <polygon fill="#101111" points="156.685,160.363 158.418,151.285 158.436,131.162 156.436,131.162 156.436,151.098 154.72,159.988"/>
        <rect x="156.436" y="131.162" fill="#101111" width="68.741" height="6"/>
        <polygon fill="#101111" points="114.439,168.033 108.439,168.033 108.439,137.162 96.248,137.162 96.248,131.162 114.439,131.162"/>
        <polygon fill="#101111" points="96.494,160.363 94.529,159.988 96.262,150.91 96.245,131.162 98.245,131.162 98.245,151.098"/>
        <text transform="matrix(1 0 0 1 110.7485 208.3584)" fill="#101111" fontFamily="ArialMT" fontSize="20">∆p</text>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="102.273" y1="191.142" x2="142.199" y2="191.142"/>
            <g>
              <polygon fill="#101111" points="104.315,198.083 92.226,191.104 104.315,184.123"/>
            </g>
            <g>
              <polygon fill="#101111" points="140.156,198.083 152.246,191.104 140.156,184.123"/>
            </g>
          </g>
        </g>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="92.226" y1="160.363" x2="92.226" y2="199.642"/>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="152.246" y1="160.363" x2="152.246" y2="199.642"/>
      </g>
      <g id="Allg_vorne">
        <text transform="matrix(1 0 0 1 41.7593 92.0869)" fill="#101111" fontFamily="ArialMT" fontSize="20">D</text>
        <text transform="matrix(1 0 0 1 108.9556 92.0869)" fill="#101111" fontFamily="ArialMT" fontSize="20">d</text>
        <text transform="matrix(1 0 0 1 196.5532 92.0869)" fill="#101111" fontFamily="ArialMT" fontSize="20">Q</text>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="148.503" y1="87.017" x2="182.913" y2="87.017"/>
            <g>
              <polygon fill="#101111" points="180.87,93.958 192.959,86.979 180.87,79.998"/>
            </g>
          </g>
        </g>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="61.069" y1="121.115" x2="61.069" y2="52.607"/>
            <g>
              <polygon fill="#101111" points="68.01,119.073 61.031,131.162 54.05,119.073"/>
            </g>
            <g>
              <polygon fill="#101111" points="68.01,54.65 61.031,42.561 54.05,54.65"/>
            </g>
          </g>
        </g>
        <g>
          <g>
            <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="99.432" y1="95.161" x2="99.432" y2="78.872"/>
            <g>
              <polygon fill="#101111" points="104.39,93.702 99.405,102.337 94.418,93.702"/>
            </g>
            <g>
              <polygon fill="#101111" points="104.39,80.331 99.405,71.695 94.418,80.331"/>
            </g>
          </g>
        </g>
        <polygon fill="#101111" points="117.949,6 117.949,71.491 126.908,62.532 126.908,6"/>
        <polygon fill="#101111" points="117.949,168.033 117.949,102.542 126.908,111.501 126.908,168.033"/>
        <polygon fill="#101111" points="114.439,42.871 19.503,42.871 19.503,36.871 108.439,36.871 108.439,6 114.439,6"/>
        <polygon fill="#101111" points="225.177,42.871 130.242,42.871 130.242,6 136.242,6 136.242,36.871 225.177,36.871"/>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="117.949" y1="70.356" x2="94.331" y2="70.356"/>
        <line fill="none" stroke="#101111" strokeWidth="2" strokeMiterlimit="10" x1="117.949" y1="103.677" x2="94.331" y2="103.677"/>
      </g>
    </svg>
  )
}

export default function OrificeCalculatorPage() {
  const [calculationMode, setCalculationMode] = usePersistentState<'restricting' | 'measuring'>('orifice_calculationMode', 'restricting')
  const [featureMode, setFeatureMode] = usePersistentState<'basic' | 'advanced'>('orifice_featureMode', 'basic')
  const [selectedGasType, setSelectedGasType] = usePersistentState('orifice_selectedGasType', gasTypes[0])
  const [customDensity, setCustomDensity] = usePersistentState('orifice_customDensity', '0.78')

  const [internalDiameter, setInternalDiameter] = usePersistentState('orifice_internalDiameter', pipeSizes[3].internalDiameter.toString())
  const [maxFlowRate, setMaxFlowRate] = usePersistentState('orifice_maxFlowRate', '')
  const [pressureDrop, setPressureDrop] = usePersistentState('orifice_pressureDrop', '')
  const [orificeDiameterInput, setOrificeDiameterInput] = usePersistentState('orifice_orificeDiameterInput', '')
  const [outputMode, setOutputMode] = usePersistentState<'orifice' | 'pressure' | 'flowrate'>('orifice_outputMode', 'orifice')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<CalculationResult | null>(null)
  const [curveData, setCurveData] = useState<CurvePoint[]>([])

  const [operatingPressure, setOperatingPressure] = usePersistentState('orifice_operatingPressure', '1.013')
  const [operatingTemperature, setOperatingTemperature] = usePersistentState('orifice_operatingTemperature', '20')
  const [compressibilityZ, setCompressibilityZ] = usePersistentState('orifice_compressibilityZ', '1.0')
  const [isentropicExponentK, setIsentropicExponentK] = usePersistentState('orifice_isentropicExponentK', '1.4')
  const [pressureType, setPressureType] = usePersistentState<'gauge' | 'absolute'>('orifice_pressureType', 'absolute')
  const [pressureUnit, setPressureUnit] = usePersistentState<PressureUnit>('orifice_pressureUnit', 'bar')
  const [temperatureUnit, setTemperatureUnit] = usePersistentState<TemperatureUnit>('orifice_temperatureUnit', 'C')

  const isLoggedIn = authAPI.isAuthenticated()
  const isProUser = import.meta.env.DEV || (isLoggedIn && authAPI.getSubscriptionTier() !== 'free')

  useEffect(() => {
    const pipe = pipeSizes.find(p => p.dn === selectedPipeDN)
    if (pipe) {
      setInternalDiameter(pipe.internalDiameter.toString())
    }
  }, [selectedPipeDN])

  const handleProAction = (action: () => void) => {
    if (!isProUser) {
      setShowSubscriptionModal(true)
    } else {
      action()
    }
  }

  const handleLoginClick = () => {
    setShowSubscriptionModal(false)
    window.location.href = '/login'
  }

  const handleUpgradeClick = () => {
    setShowSubscriptionModal(false)
    window.location.href = '/subscription'
  }

  const getDensity = () => {
    if (featureMode === 'basic') {
      if (selectedGasType.name === 'Enter density') {
        return parseFloat(customDensity) || 0.78
      }
      return selectedGasType.density
    } else {
      if (selectedGasType.name === 'Enter density') {
        return parseFloat(customDensity) || 0.78
      }
      const pressureInBar = pressureUnits.find(p => p.value === pressureUnit)?.toBar(parseFloat(operatingPressure)) || 1.013
      const atmPressure = 1.01325
      const absolutePressure = pressureType === 'gauge' 
        ? pressureInBar + atmPressure 
        : pressureInBar
      const P = absolutePressure * 100000
      const tempInCelsius = temperatureUnits.find(t => t.value === temperatureUnit)?.toCelsius(parseFloat(operatingTemperature)) || 20
      const T = tempInCelsius + 273.15
      const Z = parseFloat(compressibilityZ)
      const M = selectedGasType.density * 28.96
      const R = 8314
      return (P * M) / (Z * R * T)
    }
  }

  const calculateExpansibilityFactor = (beta: number, deltaP_Pa: number, P1_Pa: number, k: number) => {
    // ISO 5167-2 expansibility factor (for all modes)
    // epsilon = 1 - (0.41 + 0.35*beta^4) * deltaP / (k * P1)
    // Valid for deltaP/P1 < 0.25
    if (P1_Pa <= 0) return 1.0
    return 1 - (0.41 + 0.35 * Math.pow(beta, 4)) * deltaP_Pa / (k * P1_Pa)
  }

  const calculateVelocityApproachFactor = (beta: number) => {
    // Velocity of approach factor E = 1/sqrt(1 - beta^4)
    // ISO 5167 fundamental factor
    const beta4 = Math.pow(beta, 4)
    if (beta4 >= 1) return 1.0
    return 1 / Math.sqrt(1 - beta4)
  }

  const calculateDischargeCoefficient = (beta: number, ReD: number, D_mm: number): number => {
    // Reader-Harris/Gallagher equation (ISO 5167-2:2003 §5.3.2.1)
    // for corner taps (L1=L2'=0)
    // C = 0.5961 + 0.0261*beta^2 - 0.216*beta^8
    //     + 0.000521*(10^6*beta/ReD)^0.7
    //     + (0.0188 + 0.0063*A) * beta^3.5 * (10^6/ReD)^0.3
    //     + 0.011*(0.75-beta)*(2.8-D/25.4)   [only for D >= 71.12 mm]
    // where A = (19000*beta/ReD)^0.8
    if (ReD <= 0) return 0.5961
    const beta2 = Math.pow(beta, 2)
    const beta8 = Math.pow(beta, 8)
    const termA = 0.5961 + 0.0261 * beta2 - 0.216 * beta8
    const termB = 0.000521 * Math.pow((1e6 * beta) / ReD, 0.7)
    const A = Math.pow((19000 * beta) / ReD, 0.8)
    const termC = (0.0188 + 0.0063 * A) * Math.pow(beta, 3.5) * Math.pow(1e6 / ReD, 0.3)
    const termD = D_mm >= 71.12 ? 0.011 * (0.75 - beta) * (2.8 - D_mm / 25.4) : 0
    return termA + termB + termC + termD
  }

  const calculateOrifice = () => {
    const D = parseFloat(internalDiameter)
    const rho = getDensity()
    const pressureInBar = featureMode === 'advanced'
      ? (pressureUnits.find(p => p.value === pressureUnit)?.toBar(parseFloat(operatingPressure)) || 1.013)
      : 1.01325
    const atmPressure = 1.01325
    const absolutePressure = featureMode === 'advanced' && pressureType === 'gauge'
      ? pressureInBar + atmPressure
      : pressureInBar
    const P1 = absolutePressure * 100000 // Pa
    const k = parseFloat(isentropicExponentK)

    if (!D || D > 325) {
      alert('Please enter valid internal diameter (max 325 mm)')
      return
    }

    const mu = 1.7e-5 // dynamic viscosity of gas (Pa·s), approximate for common gases at 20°C
    let finalOrificeDiameter: number
    let finalPressureDrop: number
    let Q: number
    let finalEpsilon: number
    let finalCd: number

    if (outputMode === 'orifice') {
      Q = parseFloat(maxFlowRate)
      const deltaP = parseFloat(pressureDrop)

      if (!Q || Q <= 0 || Q > 10000) {
        alert('Please enter valid flow rate (max 10000 m³/h)')
        return
      }
      if (!deltaP || deltaP <= 0 || deltaP > 100) {
        alert(`Please enter valid ${calculationMode === 'restricting' ? 'pressure loss' : 'differential pressure'} (max 100 mbar)`)
        return
      }

      const deltaP_Pa = deltaP * 100 // mbar → Pa
      const qm = (Q / 3600) * rho   // kg/s

      // ISO 5167 iterative calculation: solve for d
      // qm = Cd * E * epsilon * (pi/4) * d^2 * sqrt(2 * rho * deltaP)
      // where E = 1/sqrt(1 - beta^4), beta = d/D
      // Cd = Reader-Harris/Gallagher f(beta, Re)
      // epsilon = 1 - (0.41 + 0.35*beta^4) * deltaP/(k*P1)
      let d_est = Math.sqrt(qm / (0.6 * 0.98 * Math.sqrt(2 * rho * deltaP_Pa)) * 4 / Math.PI) * 1000 // initial guess in mm
      for (let iter = 0; iter < 30; iter++) {
        const beta = d_est / D
        const E = calculateVelocityApproachFactor(beta)
        const epsilon = calculateExpansibilityFactor(beta, deltaP_Pa, P1, k)
        // Estimate Re for Cd calculation
        const Re_est = (4 * qm) / (Math.PI * (D / 1000) * mu)
        const Cd = calculateDischargeCoefficient(beta, Re_est, D)
        const A_orifice = qm / (Cd * E * epsilon * Math.sqrt(2 * rho * deltaP_Pa))
        const d_new = Math.sqrt(A_orifice * 4 / Math.PI) * 1000 // mm
        if (Math.abs(d_new - d_est) < 0.001) { d_est = d_new; break }
        d_est = d_new
      }

      finalOrificeDiameter = d_est
      finalPressureDrop = deltaP
      const beta_final = d_est / D
      finalEpsilon = calculateExpansibilityFactor(beta_final, deltaP_Pa, P1, k)
      const Re_final = (4 * (Q / 3600) * rho) / (Math.PI * (D / 1000) * mu)
      finalCd = calculateDischargeCoefficient(beta_final, Re_final, D)

    } else if (outputMode === 'pressure') {
      Q = parseFloat(maxFlowRate)
      const d = parseFloat(orificeDiameterInput)

      if (!Q || Q <= 0 || Q > 10000) {
        alert('Please enter valid flow rate (max 10000 m³/h)')
        return
      }
      if (!d || d <= 0 || d > 325) {
        alert('Please enter valid orifice diameter (max 325 mm)')
        return
      }

      finalOrificeDiameter = d
      const qm = (Q / 3600) * rho
      const beta = d / D
      const E = calculateVelocityApproachFactor(beta)
      const A_orifice = (Math.PI / 4) * Math.pow(d / 1000, 2)

      // ISO 5167 iterative: solve for deltaP
      // qm = Cd * E * epsilon * A * sqrt(2 * rho * deltaP)
      // epsilon depends on deltaP, Cd depends on Re which depends on deltaP
      let deltaP_est = 10 // initial guess in mbar
      for (let iter = 0; iter < 30; iter++) {
        const deltaP_Pa = deltaP_est * 100
        const epsilon = calculateExpansibilityFactor(beta, deltaP_Pa, P1, k)
        const Re_est = (4 * qm) / (Math.PI * (D / 1000) * mu)
        const Cd = calculateDischargeCoefficient(beta, Re_est, D)
        // deltaP = (qm / (Cd * E * epsilon * A))^2 / (2 * rho)
        const deltaP_Pa_new = Math.pow(qm / (Cd * E * epsilon * A_orifice), 2) / (2 * rho)
        const deltaP_mbar_new = deltaP_Pa_new / 100
        if (Math.abs(deltaP_mbar_new - deltaP_est) < 0.001) { deltaP_est = deltaP_mbar_new; break }
        deltaP_est = deltaP_mbar_new
      }

      finalPressureDrop = deltaP_est
      finalEpsilon = calculateExpansibilityFactor(beta, deltaP_est * 100, P1, k)
      const Re_final = (4 * (Q / 3600) * rho) / (Math.PI * (D / 1000) * mu)
      finalCd = calculateDischargeCoefficient(beta, Re_final, D)

    } else {
      const d = parseFloat(orificeDiameterInput)
      const deltaP = parseFloat(pressureDrop)

      if (!d || d <= 0 || d > 325) {
        alert('Please enter valid orifice diameter (max 325 mm)')
        return
      }
      if (!deltaP || deltaP <= 0 || deltaP > 100) {
        alert('Please enter valid pressure loss (max 100 mbar)')
        return
      }

      finalOrificeDiameter = d
      finalPressureDrop = deltaP
      const beta = d / D
      const E = calculateVelocityApproachFactor(beta)
      const deltaP_Pa = deltaP * 100
      finalEpsilon = calculateExpansibilityFactor(beta, deltaP_Pa, P1, k)

      // ISO 5167 iterative: solve for Q (via qm)
      // qm = Cd * E * epsilon * (pi/4) * d^2 * sqrt(2 * rho * deltaP)
      // Cd depends on Re which depends on qm → iterate
      const A_orifice = (Math.PI / 4) * Math.pow(d / 1000, 2)
      let qm_est = 0.6 * E * finalEpsilon * A_orifice * Math.sqrt(2 * rho * deltaP_Pa) // initial guess
      for (let iter = 0; iter < 30; iter++) {
        const Re_est = (4 * qm_est) / (Math.PI * (D / 1000) * mu)
        const Cd = calculateDischargeCoefficient(beta, Re_est, D)
        const qm_new = Cd * E * finalEpsilon * A_orifice * Math.sqrt(2 * rho * deltaP_Pa)
        if (Math.abs(qm_new - qm_est) < 1e-8) { qm_est = qm_new; break }
        qm_est = qm_new
      }

      Q = (qm_est / rho) * 3600
      const Re_final = (4 * qm_est) / (Math.PI * (D / 1000) * mu)
      finalCd = calculateDischargeCoefficient(beta, Re_final, D)
    }

    const beta = finalOrificeDiameter / D
    const qm = (Q / 3600) * rho
    const Re = (4 * qm) / (Math.PI * (D / 1000) * mu)

    const permanentPressureLoss = finalPressureDrop * (1 - Math.pow(beta, 1.9))

    const finalResults: CalculationResult = {
      orificeDiameter: Math.round(finalOrificeDiameter * 10) / 10,
      betaRatio: Math.round(beta * 10000) / 10000,
      dischargeCoef: Math.round(finalCd * 10000) / 10000,
      reynoldsNum: Math.round(Re),
      velocity: (Q / 3600) / ((Math.PI / 4) * Math.pow(D / 1000, 2)),
      massFlowRate: qm,
      pressureDrop: Math.round(finalPressureDrop * 100) / 100,
      permanentPressureLoss: Math.round(permanentPressureLoss * 100) / 100
    }

    generateCurveData(finalOrificeDiameter, D, rho, Q, finalPressureDrop, beta, finalCd, P1, k)
    setResults(finalResults)
    setShowResults(true)
  }

  const generateCurveData = (d_mm: number, D_mm: number, rho: number, Q: number, deltaP: number, beta: number, Cd: number, P1: number, k: number) => {
    const points: CurvePoint[] = []
    const mu = 1.7e-5 // dynamic viscosity of gas (Pa·s)
    
    const maxDeltaP = deltaP * 1.5
    const steps = 50
    const d = d_mm / 1000 // m
    const E = calculateVelocityApproachFactor(beta)
    const A_orifice = (Math.PI / 4) * d * d
    
    for (let i = 0; i <= steps; i++) {
      const currentDeltaP = (maxDeltaP / steps) * i
      const currentDeltaP_Pa = currentDeltaP * 100
      const epsilon = calculateExpansibilityFactor(beta, currentDeltaP_Pa, P1, k)
      
      // Use iterative Cd based on estimated Re
      const qm_est = Cd * E * epsilon * A_orifice * Math.sqrt(2 * rho * currentDeltaP_Pa)
      const Re_est = (4 * qm_est) / (Math.PI * (D_mm / 1000) * mu)
      const Cd_calc = calculateDischargeCoefficient(beta, Re_est, D_mm)
      
      // Recalculate with proper Cd
      const qm_calc = Cd_calc * E * epsilon * A_orifice * Math.sqrt(2 * rho * currentDeltaP_Pa)
      const Q_calc = (qm_calc / rho) * 3600

      points.push({
        beta: beta,
        dischargeCoef: Math.round(Cd_calc * 10000) / 10000,
        pressureDrop: Math.round(currentDeltaP * 100) / 100,
        flowRate: Math.round(Q_calc * 100) / 100
      })
    }
    
    setCurveData(points)
  }

  const exportToPDF = () => {
    if (!results) return

    const doc = createPDF()
    const docTitle = 'Orifice Plate Calculation Report'
    const modeLabel = calculationMode === 'restricting' ? 'Restricting Orifice' : 'Measuring Orifice'

    // -- Cover page --
    addCoverPage(doc, {
      title: 'Orifice Plate Calculation Report',
      subtitle: `${modeLabel} sizing per ISO 5167 & DIN EN ISO 5167`,
      reportType: modeLabel,
      standard: 'ISO 5167-1:2003 / DIN EN ISO 5167',
      version: '1.0',
    })

    // -- Page 2: Input + Results --
    let y = drawPageHeader(doc, docTitle, 'Input Parameters & Results')

    // Section: Input Parameters
    y = drawSectionTitle(doc, '1. Input Parameters', y, 'Fluid and pipe configuration')
    const inputRows: [string, string][] = [
      ['Calculation Mode', modeLabel],
      ['Gas Type', selectedGasType.name],
      ['Density', `${getDensity().toFixed(2)} kg/m3`],
      ['Nominal Size', String(selectedPipeDN)],
      ['Internal Diameter D', `${internalDiameter} mm`],
      ['Max Flow Rate Q', `${maxFlowRate || ((results.massFlowRate / getDensity() * 3600).toFixed(2))} m3/h`],
      [calculationMode === 'restricting' ? 'Pressure Loss dp' : 'Differential Pressure dp', `${pressureDrop} mbar`],
    ]
    y = drawInfoTable(doc, inputRows, MARGIN_LEFT, y, CONTENT_WIDTH, { title: 'Input Parameters' })

    // Section: Results
    y = checkPageBreak(doc, y, 90, docTitle, 'Input Parameters & Results')
    y = drawSectionTitle(doc, '2. Calculation Results', y, 'ISO 5167 based orifice sizing')

    // Result cards
    const cardW = (CONTENT_WIDTH - 12) / 3
    y = checkPageBreak(doc, y, 40, docTitle, 'Input Parameters & Results')
    drawResultCard(doc, {
      label: 'Orifice Diameter d', value: String(results.orificeDiameter), unit: 'mm',
      x: MARGIN_LEFT, y, width: cardW, highlight: true,
    })
    drawResultCard(doc, {
      label: 'Beta Ratio', value: String(results.betaRatio),
      x: MARGIN_LEFT + cardW + 6, y, width: cardW,
    })
    drawResultCard(doc, {
      label: 'Discharge Coefficient Cd', value: String(results.dischargeCoef),
      x: MARGIN_LEFT + (cardW + 6) * 2, y, width: cardW,
    })
    y += 40

    y = checkPageBreak(doc, y, 40, docTitle, 'Input Parameters & Results')
    drawResultCard(doc, {
      label: 'Reynolds Number Re', value: results.reynoldsNum.toLocaleString(),
      x: MARGIN_LEFT, y, width: cardW,
    })
    drawResultCard(doc, {
      label: 'Velocity', value: results.velocity.toFixed(2), unit: 'm/s',
      x: MARGIN_LEFT + cardW + 6, y, width: cardW,
    })
    drawResultCard(doc, {
      label: 'Mass Flow Rate', value: (results.massFlowRate / getDensity() * 3600).toFixed(2), unit: 'm3/h',
      x: MARGIN_LEFT + (cardW + 6) * 2, y, width: cardW,
    })
    y += 40

    y = checkPageBreak(doc, y, 40, docTitle, 'Input Parameters & Results')
    drawResultCard(doc, {
      label: 'Permanent Pressure Loss', value: String(results.permanentPressureLoss), unit: 'mbar',
      x: MARGIN_LEFT, y, width: cardW,
    })
    y += 45

    // Two-column tables: Fluid properties + Intermediate values
    y = checkPageBreak(doc, y, 60, docTitle, 'Input Parameters & Results')
    y = drawTwoColumnTables(doc, {
      title: 'Fluid Properties',
      rows: [
        ['Gas Type', selectedGasType.name],
        ['Density', `${getDensity().toFixed(4)} kg/m3`],
        ['Temperature', `${operatingTemperature || 20} ${temperatureUnit}`],
        ['Pressure', `${operatingPressure} ${pressureUnit}`],
      ],
    }, {
      title: 'Intermediate Values',
      rows: [
        ['Beta Ratio', String(results.betaRatio)],
        ['Discharge Cd', String(results.dischargeCoef)],
        ['Isentropic k', isentropicExponentK],
        ['Pipe Area', `${(Math.PI / 4 * Math.pow(parseFloat(internalDiameter) / 1000, 2) * 1e6).toFixed(2)} mm2`],
        ['Permanent Press. Loss', `${results.permanentPressureLoss} mbar`],
      ],
    }, y)

    // -- Page 3: Curve chart --
    y = checkPageBreak(doc, y, 120, docTitle, 'Performance Curve')
    y = drawSectionTitle(doc, '3. Performance Curve', y, 'Pressure Drop vs Flow Rate')

    // Draw the curve chart in the PDF
    if (curveData.length > 0) {
      const chartX = MARGIN_LEFT + 5
      const chartY = y + 5
      const chartW = CONTENT_WIDTH - 10
      const chartH = 100

      // Chart background
      setFillColor(doc, { r: 252, g: 252, b: 252 })
      setDrawColor(doc, COLORS.border)
      doc.setLineWidth(0.2)
      doc.rect(chartX, chartY, chartW, chartH, 'FD')

      // Chart margins inside
      const padLeft = 20
      const padBottom = 18
      const padTop = 8
      const padRight = 8
      const plotX = chartX + padLeft
      const plotY = chartY + padTop
      const plotW = chartW - padLeft - padRight
      const plotH = chartH - padTop - padBottom

      // Find data ranges
      const maxDP = Math.max(...curveData.map(d => d.pressureDrop))
      const minDP = Math.min(...curveData.map(d => d.pressureDrop))
      const maxQ = Math.max(...curveData.map(d => d.flowRate))
      const minQ = Math.min(...curveData.map(d => d.flowRate))

      // Draw grid lines
      setDrawColor(doc, { r: 224, g: 224, b: 224 })
      doc.setLineWidth(0.1)
      const gridSteps = 5
      for (let i = 0; i <= gridSteps; i++) {
        const gx = plotX + (plotW / gridSteps) * i
        const gy = plotY + (plotH / gridSteps) * i
        doc.line(gx, plotY, gx, plotY + plotH)
        doc.line(plotX, gy, plotX + plotW, gy)
      }

      // Draw axes
      setDrawColor(doc, COLORS.textMedium)
      doc.setLineWidth(0.3)
      doc.line(plotX, plotY, plotX, plotY + plotH)           // Y axis
      doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH)  // X axis

      // Axis labels
      setTextColor(doc, COLORS.textMedium)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text('dp (mbar)', plotX + plotW / 2, chartY + chartH - 4, { align: 'center' })
      doc.text('Q (m3/h)', chartX + 4, plotY + plotH / 2, { align: 'center', angle: 90 })

      // Axis tick labels
      doc.setFontSize(6)
      for (let i = 0; i <= gridSteps; i++) {
        const dpVal = minDP + ((maxDP - minDP) / gridSteps) * i
        const gx = plotX + (plotW / gridSteps) * i
        doc.text(dpVal.toFixed(1), gx, plotY + plotH + 3, { align: 'center' })

        const qVal = maxQ - ((maxQ - minQ) / gridSteps) * i
        const gy = plotY + (plotH / gridSteps) * i
        doc.text(qVal.toFixed(0), plotX - 3, gy + 1, { align: 'right' })
      }

      // Draw the curve
      setDrawColor(doc, { r: 43, g: 107, b: 160 })
      doc.setLineWidth(0.6)
      for (let i = 1; i < curveData.length; i++) {
        const x1 = plotX + ((curveData[i - 1].pressureDrop - minDP) / (maxDP - minDP || 1)) * plotW
        const y1 = plotY + plotH - ((curveData[i - 1].flowRate - minQ) / (maxQ - minQ || 1)) * plotH
        const x2 = plotX + ((curveData[i].pressureDrop - minDP) / (maxDP - minDP || 1)) * plotW
        const y2 = plotY + plotH - ((curveData[i].flowRate - minQ) / (maxQ - minQ || 1)) * plotH
        doc.line(x1, y1, x2, y2)
      }

      // Reference lines
      const selX = plotX + ((results.pressureDrop - minDP) / (maxDP - minDP || 1)) * plotW
      setDrawColor(doc, COLORS.danger)
      doc.setLineWidth(0.4)
      doc.setLineDashPattern([2, 1], 0)
      doc.line(selX, plotY, selX, plotY + plotH)
      doc.setLineDashPattern([], 0)

      const selQ = parseFloat(maxFlowRate) || (results.massFlowRate / getDensity() * 3600)
      const selY = plotY + plotH - ((selQ - minQ) / (maxQ - minQ || 1)) * plotH
      setDrawColor(doc, COLORS.success)
      doc.setLineWidth(0.4)
      doc.setLineDashPattern([2, 1], 0)
      doc.line(plotX, selY, plotX + plotW, selY)
      doc.setLineDashPattern([], 0)

      // Operating point marker
      setFillColor(doc, COLORS.danger)
      doc.circle(selX, selY, 1.5, 'F')

      // Legend
      doc.setFontSize(7)
      setTextColor(doc, { r: 43, g: 107, b: 160 })
      doc.setFont('helvetica', 'normal')
      doc.text('Q (m3/h)', plotX + plotW - 30, plotY + 4)
      setTextColor(doc, COLORS.danger)
      doc.text(`dp = ${results.pressureDrop} mbar`, plotX + plotW - 30, plotY + 9)
      setTextColor(doc, COLORS.success)
      doc.text(`Q = ${selQ.toFixed(2)} m3/h`, plotX + plotW - 30, plotY + 14)

      y = chartY + chartH + 10
    }

    // Section: Standards & References
    y = checkPageBreak(doc, y, 60, docTitle, 'Standards & References')
    y = drawSectionTitle(doc, '4. Standards & References', y, 'Applicable codes and standards')
    y = drawTwoColumnTables(doc, {
      title: 'Standards',
      rows: [
        ['ISO 5167-1:2003', 'Measurement of fluid flow by means of orifice plates'],
        ['DIN EN ISO 5167', 'German standard for orifice plate measurements'],
      ],
    }, {
      title: 'Application Notes',
      rows: [
        ['Max Flow Rate', '10,000 m3/h'],
        ['Max Pressure Drop', '100 mbar'],
        ['Max Pipe Diameter', '325 mm'],
      ],
    }, y)

    // Disclaimer page
    addDisclaimerPage(doc, { title: 'IMPORTANT DISCLAIMER' })

    // Footer on all content pages
    drawPageFooter(doc)

    doc.save(`orifice-${calculationMode}-report.pdf`)
  }

  const resetForm = () => {
    setMaxFlowRate('')
    setPressureDrop('')
    setOrificeDiameterInput('')
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />

        <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-semibold mb-4">
              Determining the Orifices
            </h1>
            <p className="text-[#bdc3c7] max-w-2xl mx-auto">
              Calculate restricting and measuring orifices according to ISO 5167 and DIN EN ISO 5167 standards.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
          {/* Inline Disclaimer */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800">⚠️ Professional Engineering Judgment Required</p>
              <p className="text-yellow-700 mt-1">
                Results are for reference only. All calculations should be reviewed and validated by a qualified 
                professional engineer before application to any real-world project.
              </p>
            </div>
          </div>

          <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
            <div className="bg-[#2B6BA0] text-white px-6 py-3">
              <h2 className="text-base font-normal">
                Determining the {calculationMode === 'restricting' ? 'restricting' : 'measuring'} orifice
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={() => setFeatureMode('basic')}
                    className={`flex-1 py-2.5 px-4 rounded text-sm font-medium transition-all ${
                      featureMode === 'basic'
                        ? 'bg-[#27ae60] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Basic Mode
                  </button>
                  <button
                    onClick={() => setFeatureMode('advanced')}
                    className={`flex-1 py-2.5 px-4 rounded text-sm font-medium transition-all ${
                      featureMode === 'advanced'
                        ? 'bg-[#27ae60] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Advanced Mode
                  </button>
                </div>
                {featureMode === 'advanced' && (
                  <div className="mt-2 text-xs text-gray-600">
                    Advanced mode includes pressure, temperature, compressibility, and isentropic exponent calculations.
                  </div>
                )}
              </div>
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
                        if (gas) {
                          setSelectedGasType(gas)
                          if (gas.name !== 'Enter density') {
                            setCustomDensity(gas.density.toString())
                          }
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
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
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                    />
                  </div>

                  {featureMode === 'advanced' && (
                    <>
                      <div>
                        <label className="block text-sm font-normal text-black mb-1.5">
                          Operating Pressure
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="number"
                            value={operatingPressure}
                            onChange={(e) => setOperatingPressure(e.target.value)}
                            step="0.001"
                            className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                          />
                          <select
                            value={pressureUnit}
                            onChange={(e) => setPressureUnit(e.target.value as PressureUnit)}
                            className="px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                          >
                            {pressureUnits.map(unit => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex border border-gray-300 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setPressureType('gauge')}
                              className={`px-3 py-2 text-xs font-medium transition-colors ${
                                pressureType === 'gauge'
                                  ? 'bg-[#2B6BA0] text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Gauge
                            </button>
                            <button
                              type="button"
                              onClick={() => setPressureType('absolute')}
                              className={`px-3 py-2 text-xs font-medium transition-colors ${
                                pressureType === 'absolute'
                                  ? 'bg-[#2B6BA0] text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Absolute
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {pressureType === 'gauge' 
                            ? 'Gauge pressure (relative to atmospheric pressure)' 
                            : 'Absolute pressure (total pressure including atmosphere)'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-black mb-1.5">
                          Operating Temperature
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={operatingTemperature}
                            onChange={(e) => setOperatingTemperature(e.target.value)}
                            step="0.1"
                            className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                          />
                          <select
                            value={temperatureUnit}
                            onChange={(e) => setTemperatureUnit(e.target.value as TemperatureUnit)}
                            className="px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                          >
                            {temperatureUnits.map(unit => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Select temperature unit: Celsius, Kelvin, or Fahrenheit
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-black mb-1.5">
                          Compressibility Factor Z
                        </label>
                        <input
                          type="number"
                          value={compressibilityZ}
                          onChange={(e) => setCompressibilityZ(e.target.value)}
                          step="0.001"
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-black mb-1.5">
                          Isentropic Exponent κ
                        </label>
                        <input
                          type="number"
                          value={isentropicExponentK}
                          onChange={(e) => setIsentropicExponentK(e.target.value)}
                          step="0.01"
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-normal text-black mb-1.5">
                      Nominal size DN
                    </label>
                    <select
                      value={selectedPipeDN}
                      onChange={(e) => setSelectedPipeDN(parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                    >
                      {pipeSizes.map((pipe) => (
                        <option key={pipe.dn} value={pipe.dn}>
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
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                    />
                  </div>

                  {(outputMode === 'orifice' || outputMode === 'pressure') && (
                    <div>
                      <label className="block text-sm font-normal text-black mb-1.5">
                        Max. flow rate Q (m³/h, max 10000)
                      </label>
                      <input
                        type="number"
                        value={maxFlowRate}
                        onChange={(e) => setMaxFlowRate(e.target.value)}
                        max="10000"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                      />
                    </div>
                  )}

                  {(outputMode === 'orifice' || outputMode === 'flowrate') && (
                    <div>
                      <label className="block text-sm font-normal text-black mb-1.5">
                        {calculationMode === 'restricting' 
                          ? 'Pressure loss Δp (mbar, max 100)' 
                          : 'Differential pressure Δp (mbar, max 100)'}
                      </label>
                      <input
                        type="number"
                        value={pressureDrop}
                        onChange={(e) => setPressureDrop(e.target.value)}
                        max="100"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                      />
                    </div>
                  )}

                  {(outputMode === 'pressure' || outputMode === 'flowrate') && (
                    <div>
                      <label className="block text-sm font-normal text-black mb-1.5">
                        Orifice diameter d (mm, max 325)
                      </label>
                      <input
                        type="number"
                        value={orificeDiameterInput}
                        onChange={(e) => setOrificeDiameterInput(e.target.value)}
                        max="325"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#2B6BA0] focus:border-transparent text-sm text-gray-900"
                      />
                    </div>
                  )}
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

                <div className="mt-4">
                  <button
                    onClick={exportToPDF}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={20} />
                    Export PDF Report
                  </button>
                </div>

                {showResults && results && (
                  <div className="mt-5 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="text-3xl font-bold text-[#2B6BA0] mb-1">
                      {outputMode === 'orifice' && `${results.orificeDiameter} mm`}
                      {outputMode === 'pressure' && `${results.pressureDrop} mbar`}
                      {outputMode === 'flowrate' && `${(results.massFlowRate / getDensity() * 3600).toFixed(2)} m³/h`}
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div><span className="font-medium">Beta Ratio:</span> {results.betaRatio}</div>
                      <div><span className="font-medium">Cd:</span> {results.dischargeCoef}</div>
                      <div><span className="font-medium">Re:</span> {results.reynoldsNum.toLocaleString()}</div>
                      <div><span className="font-medium">Velocity:</span> {results.velocity.toFixed(2)} m/s</div>
                    </div>
                    <div className="mt-2 text-xs">
                      <div><span className="font-medium">Permanent Pressure Loss:</span> {results.permanentPressureLoss} mbar</div>
                    </div>
                  </div>
                )}

                {calculationMode === 'restricting' && (
                  <div className="mt-3 text-sm text-gray-600">
                    {featureMode === 'basic' 
                      ? 'Standard conditions: 1 atm (1.01325 bar), 20°C'
                      : 'Using operating conditions with specified pressure and temperature'}
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
            <div className="bg-white rounded p-4 sm:p-6 shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-[#2c3e50] mb-4">
                Pressure Drop vs Flow Rate
              </h2>
              <div className="orifice-chart-container w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curveData} margin={{ top: 40, right: 45, left: 55, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="pressureDrop"
                      tickCount={5}
                      minTickGap={20}
                      label={{ value: 'Pressure Drop dp (mbar)', position: 'bottom', offset: 30, style: { fontSize: 11, fill: '#555' } }}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickCount={5}
                      width={45}
                      label={{ value: 'Flow Rate Q (m³/h)', angle: -90, position: 'left', offset: 15, style: { fontSize: 11, fill: '#555' } }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" height={28} wrapperStyle={{ top: 0, right: 0, fontSize: 11 }} />
                    {results && (
                      <ReferenceLine
                        x={results.pressureDrop}
                        stroke="#e74c3c"
                        strokeWidth={2}
                        label={{ value: `dp=${results.pressureDrop}`, position: 'top', fontSize: 10, fill: '#e74c3c' }}
                      />
                    )}
                    {results && (
                      <ReferenceLine
                        y={parseFloat(maxFlowRate) || (results.massFlowRate / getDensity() * 3600)}
                        stroke="#27ae60"
                        strokeWidth={2}
                        label={{ value: `Q=${maxFlowRate || ((results.massFlowRate / getDensity() * 3600).toFixed(2))}`, position: 'right', fontSize: 10, fill: '#27ae60' }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="flowRate"
                      stroke="#2B6BA0"
                      strokeWidth={2}
                      dot={false}
                      name="Q (m³/h)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <div className="font-medium text-blue-800">Flow Limits</div>
                  <div className="text-blue-700">Maximum flow rate: 10,000 m³/h<br/> Maximum pressure drop: 100 mbar<br/> Maximum pipe diameter: 325 mm</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center pb-4">
          </div>
        </div>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gauge className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isLoggedIn ? 'Pro Feature Required' : 'Login Required'}
              </h2>
              <p className="text-gray-600">
                {isLoggedIn
                  ? 'Upgrade to Pro to use this calculator and unlock all premium features.'
                  : 'Please log in to use the orifice calculator and access all features.'}
              </p>
            </div>

            {!isLoggedIn && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Free account benefits:</h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Full access to basic calculators
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Calculation history
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Free forever - no credit card needed
                  </li>
                </ul>
              </div>
            )}

            {isLoggedIn && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Pro Features:</h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Orifice Plate Calculator
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    All Pro calculators
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    PDF report export
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Priority support
                  </li>
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isLoggedIn ? handleUpgradeClick : handleLoginClick}
                className="flex-1 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                {isLoggedIn ? 'Upgrade Now' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProFeaturePreview>
  )
}
