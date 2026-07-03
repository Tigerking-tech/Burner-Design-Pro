import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import jsPDF from 'jspdf'
import { Download } from 'lucide-react'

import ProFeaturePreview from '../components/ProFeaturePreview'
import { Navbar } from '../components/Navbar'
import { authAPI } from '../services/api'
import { Cylinder, Square, BrickWall, AlertTriangle } from 'lucide-react'
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  CONTENT_WIDTH,
  COLORS,
  setTextColor,
  sanitizeText,
  drawPageFooter,
  checkPageBreak,
  addCoverPage,
  addDisclaimerPage,
  drawSectionTitle,
  drawInfoTable
} from '../utils/pdfUtils'

type Environment = 'indoor' | 'outdoor_calm' | 'outdoor_moderate' | 'outdoor_strong'
type EquipmentType = 'pipe' | 'flat'
type Mode = 'surface' | 'heatloss' | 'condensation'
type UnitSystem = 'metric' | 'imperial'
type MaterialType = 'mineralwool' | 'glasswool' | 'calciumsilicate' | 'polyurethane' | 'ceramicfiber' | 'custom'

interface MaterialProperty {
  conductivity: number
  name: string
  maxTemp: number
}

interface CalculationResult {
  thickness: number
  surfaceTemp: number
  heatFlux: number
  linearHeatLoss?: number
  annualHeatLoss?: number
  standardThickness?: number
  dewPoint?: number
}

const materialProperties: Record<string, MaterialProperty> = {
  mineralwool: { conductivity: 0.040, name: 'Mineral Wool', maxTemp: 650 },
  glasswool: { conductivity: 0.035, name: 'Glass Wool', maxTemp: 450 },
  calciumsilicate: { conductivity: 0.052, name: 'Calcium Silicate', maxTemp: 650 },
  polyurethane: { conductivity: 0.023, name: 'Polyurethane Foam', maxTemp: 120 },
  ceramicfiber: { conductivity: 0.120, name: 'Ceramic Fiber', maxTemp: 1260 }
}

const standardThicknessesMetric = [10, 13, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150]
const standardThicknessesImperial = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6]

const pipeSizes = {
  metric: { 
    '1/2"': 21.3, '3/4"': 26.9, '1"': 33.7, '1¼"': 42.4, 
    '1½"': 48.3, '2"': 60.3, '2½"': 76.1, '3"': 88.9, 
    '4"': 114.3, '5"': 141.3, '6"': 168.3, '8"': 219.1,
    '10"': 273.0, '12"': 323.9, '14"': 355.6, '16"': 406.4
  },
  imperial: {
    '1/2"': 0.84, '3/4"': 1.06, '1"': 1.325, '1¼"': 1.66,
    '1½"': 1.9, '2"': 2.375, '2½"': 2.875, '3"': 3.5,
    '4"': 4.5, '5"': 5.563, '6"': 6.625, '8"': 8.625,
    '10"': 10.75, '12"': 12.75, '14"': 14.0, '16"': 16.0
  }
}

function InsulationCalculatorPage() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric')
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('pipe')
  const [mode, setMode] = useState<Mode>('surface')
  
  const [pipeSize, setPipeSize] = useState<string>('2"')
  const [outerDiameter, setOuterDiameter] = useState<number>(60.3)
  
  const [surfaceLength, setSurfaceLength] = useState<number>(1)
  const [surfaceWidth, setSurfaceWidth] = useState<number>(1)
  
  const [materialType, setMaterialType] = useState<MaterialType>('mineralwool')
  const [customLambda, setCustomLambda] = useState<number>(0.040)
  
  const [mediumTemp, setMediumTemp] = useState<number>(150)
  const [ambientTemp, setAmbientTemp] = useState<number>(20)
  const [targetSurfaceTemp, setTargetSurfaceTemp] = useState<number>(50)
  const [targetHeatLoss, setTargetHeatLoss] = useState<number>(100)
  const [relativeHumidity, setRelativeHumidity] = useState<number>(60)
  
  const [environment, setEnvironment] = useState<Environment>('indoor')
  const [windSpeed, setWindSpeed] = useState<number>(0)
  const [surfaceFinish, setSurfaceFinish] = useState<string>('0.9')
  const [customEmittance, setCustomEmittance] = useState<number>(0.9)
  
  const [operatingHours, setOperatingHours] = useState<number>(8760)
  
  const [heatTransferCoeff, setHeatTransferCoeff] = useState<number>(12)
  const [hc, setHc] = useState<number>(10)
  const [hr, setHr] = useState<number>(2)
  
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const isLoggedIn = authAPI.isAuthenticated()
  const isProUser = isLoggedIn && authAPI.getSubscriptionTier() !== 'free'

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

  const getEmittance = () => {
    if (surfaceFinish === 'custom') return customEmittance
    return parseFloat(surfaceFinish) || 0.9
  }

  const getThermalConductivity = () => {
    if (materialType === 'custom') return customLambda
    return materialProperties[materialType]?.conductivity || 0.040
  }

  const calculateDewPoint = (temp: number, humidity: number) => {
    const a = 17.62
    const b = 243.12
    const gamma = (a * temp) / (b + temp) + Math.log(humidity / 100)
    return (b * gamma) / (a - gamma)
  }

  // Helper to calculate surface temperature for given thickness
  const calculateTsForThickness = (
    D1: number, k: number, Tf: number, Ta: number, delta: number, h: number
  ) => {
    const r1 = D1 / 2000
    const r2 = r1 + delta
    const R_cond = Math.log(r2 / r1) / (2 * Math.PI * k)
    const R_conv = 1 / (h * 2 * Math.PI * r2)
    const q_linear = (Tf - Ta) / (R_cond + R_conv)
    const Ts = Ta + q_linear * R_conv
    return { Ts, q_linear }
  }

  // Find valid initial bounds for binary search
  const findPipeBounds = (
    D1: number, k: number, Tf: number, Ta: number, target: number, h: number, calcMode: string
  ) => {
    let lower = 0.0001 // 0.1mm
    let upper = 0.001 // 1mm
    
    const isHeating = Tf > Ta
    
    if (calcMode === 'surface' || calcMode === 'condensation') {
      if (isHeating) {
        while (true) {
          const { Ts } = calculateTsForThickness(D1, k, Tf, Ta, upper, h)
          if (Ts < target) break
          upper *= 2
          if (upper > 5.0) break
        }
      } else {
        while (true) {
          const { Ts } = calculateTsForThickness(D1, k, Tf, Ta, upper, h)
          if (Ts > target) break
          upper *= 2
          if (upper > 5.0) break
        }
      }
    } else {
      while (true) {
        const { q_linear } = calculateTsForThickness(D1, k, Tf, Ta, upper, h)
        const r2 = (D1 / 2000) + upper
        const q_flux = q_linear / (2 * Math.PI * r2)
        if (q_flux < target) break
        upper *= 2
        if (upper > 5.0) break
      }
    }
    
    return { lower, upper }
  }

  const calculatePipeThickness = (
    D1: number, k: number, Tf: number, Ta: number, target: number, h: number, calcMode: string
  ) => {
    const bounds = findPipeBounds(D1, k, Tf, Ta, target, h, calcMode)
    let lower = bounds.lower
    let upper = bounds.upper
    let iterations = 0
    const maxIterations = 100
    const isHeating = Tf > Ta
    
    while (iterations < maxIterations) {
      const delta = (lower + upper) / 2
      const { Ts, q_linear } = calculateTsForThickness(D1, k, Tf, Ta, delta, h)
      const r2 = (D1 / 2000) + delta
      const q_flux = q_linear / (2 * Math.PI * r2)
      
      if (calcMode === 'surface' || calcMode === 'condensation') {
        if (isHeating) {
          if (Ts > target) {
            lower = delta
          } else {
            upper = delta
          }
        } else {
          if (Ts < target) {
            lower = delta
          } else {
            upper = delta
          }
        }
        if (Math.abs(Ts - target) < 0.1) break
      } else {
        if (q_flux > target) {
          lower = delta
        } else {
          upper = delta
        }
        if (Math.abs(q_flux - target) < 1) break
      }
      iterations++
    }
    
    const finalDelta = (lower + upper) / 2
    const { Ts: finalTs, q_linear: finalQlinear } = calculateTsForThickness(D1, k, Tf, Ta, finalDelta, h)
    const finalR2 = (D1 / 2000) + finalDelta
    const finalQflux = finalQlinear / (2 * Math.PI * finalR2)
    
    return {
      thickness: finalDelta * 1000,
      surfaceTemp: finalTs,
      heatFlux: finalQflux,
      linearHeatLoss: finalQlinear
    }
  }

  const calculateFlatThickness = (
    k: number, Tf: number, Ta: number, target: number, h: number, calcMode: string
  ) => {
    let lower = 0.001
    let upper = 1.0
    let iterations = 0
    const maxIterations = 100
    const isHeating = Tf > Ta
    
    while (iterations < maxIterations) {
      const delta = (lower + upper) / 2
      const R_cond = delta / k
      const R_conv = 1 / h
      const q_flux = (Tf - Ta) / (R_cond + R_conv)
      const Ts = Ta + q_flux * R_conv
      
      if (calcMode === 'surface' || calcMode === 'condensation') {
        if (isHeating) {
          if (Ts > target) {
            lower = delta
          } else {
            upper = delta
          }
        } else {
          if (Ts < target) {
            lower = delta
          } else {
            upper = delta
          }
        }
        if (Math.abs(Ts - target) < 0.1) break
      } else {
        if (q_flux > target) {
          lower = delta
        } else {
          upper = delta
        }
        if (Math.abs(q_flux - target) < 1) break
      }
      iterations++
    }
    
    const finalDelta = (lower + upper) / 2
    const R_cond = finalDelta / k
    const R_conv = 1 / h
    const q_flux = (Tf - Ta) / (R_cond + R_conv)
    const Ts = Ta + q_flux * R_conv
    
    return {
      thickness: finalDelta * 1000,
      surfaceTemp: Ts,
      heatFlux: q_flux
    }
  }

  const getStandardThickness = (calculated: number) => {
    for (let t of standardThicknessesMetric) {
      if (t >= calculated) return t
    }
    return standardThicknessesMetric[standardThicknessesMetric.length - 1]
  }

  const handleCalculate = () => {
    const k = getThermalConductivity()
    
    // Recalculate h immediately based on current inputs
    let windSpeedMetric = 0
    switch(environment) {
      case 'indoor': windSpeedMetric = 0; break
      case 'outdoor_calm': windSpeedMetric = 1; break
      case 'outdoor_moderate': windSpeedMetric = 5; break
      case 'outdoor_strong': windSpeedMetric = 10; break
    }
    
    const hcVal = 4 + 7 * Math.sqrt(windSpeedMetric)
    const epsilon = getEmittance()
    const sigma = 5.67e-8
    const Ts = targetSurfaceTemp + 273.15
    const Ta = ambientTemp + 273.15
    const hrVal = epsilon * sigma * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
    const h = hcVal + hrVal
    
    // Update display values
    setHeatTransferCoeff(h)
    setHc(hcVal)
    setHr(hrVal)
    setWindSpeed(windSpeedMetric)
    
    let newResult: CalculationResult
    
    if (equipmentType === 'pipe') {
      if (mode === 'surface' || mode === 'condensation') {
        const targetTemp = mode === 'condensation' ? 
          calculateDewPoint(ambientTemp, relativeHumidity) + 1 : 
          targetSurfaceTemp
        
        const pipeResult = calculatePipeThickness(outerDiameter, k, mediumTemp, ambientTemp, targetTemp, h, 'surface')
        const annualLoss = pipeResult.linearHeatLoss * operatingHours / 1000
        
        newResult = {
          thickness: pipeResult.thickness,
          surfaceTemp: pipeResult.surfaceTemp,
          heatFlux: pipeResult.heatFlux,
          linearHeatLoss: pipeResult.linearHeatLoss,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(pipeResult.thickness),
          dewPoint: mode === 'condensation' ? calculateDewPoint(ambientTemp, relativeHumidity) : undefined
        }
      } else {
        const pipeResult = calculatePipeThickness(outerDiameter, k, mediumTemp, ambientTemp, targetHeatLoss, h, 'heatloss')
        const annualLoss = pipeResult.linearHeatLoss * operatingHours / 1000
        
        newResult = {
          thickness: pipeResult.thickness,
          surfaceTemp: pipeResult.surfaceTemp,
          heatFlux: pipeResult.heatFlux,
          linearHeatLoss: pipeResult.linearHeatLoss,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(pipeResult.thickness)
        }
      }
    } else {
      if (mode === 'surface' || mode === 'condensation') {
        const targetTemp = mode === 'condensation' ? 
          calculateDewPoint(ambientTemp, relativeHumidity) + 1 : 
          targetSurfaceTemp
        
        const flatResult = calculateFlatThickness(k, mediumTemp, ambientTemp, targetTemp, h, 'surface')
        const area = surfaceLength * surfaceWidth
        const heatLoss = flatResult.heatFlux * area
        const annualLoss = heatLoss * operatingHours / 1000
        
        newResult = {
          thickness: flatResult.thickness,
          surfaceTemp: flatResult.surfaceTemp,
          heatFlux: flatResult.heatFlux,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(flatResult.thickness),
          dewPoint: mode === 'condensation' ? calculateDewPoint(ambientTemp, relativeHumidity) : undefined
        }
      } else {
        const flatResult = calculateFlatThickness(k, mediumTemp, ambientTemp, targetHeatLoss, h, 'heatloss')
        const area = surfaceLength * surfaceWidth
        const heatLoss = flatResult.heatFlux * area
        const annualLoss = heatLoss * operatingHours / 1000
        
        newResult = {
          thickness: flatResult.thickness,
          surfaceTemp: flatResult.surfaceTemp,
          heatFlux: flatResult.heatFlux,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(flatResult.thickness)
        }
      }
    }
    
    setResult(newResult)
    setShowResults(true)
  }

  const exportToPDF = () => {
    if (!result) return

    const doc = new jsPDF()
    let y = 0

    addCoverPage(doc, {
      title: 'Insulation Thickness Report',
      subtitle: 'Thermal insulation calculation',
      reportType: 'Insulation Analysis',
      standard: 'ISO 12241 & ASTM C680'
    })

    doc.addPage()
    y = 45

    y = drawSectionTitle(doc, '1. Input Parameters', y, 'User-provided insulation design parameters');

    const inputItems: [string, string][] = [
      ['Unit System', unitSystem === 'metric' ? 'Metric (mm, °C, W/mK)' : 'Imperial (in, °F, Btu/h·ft·°F)'],
      ['Equipment Type', equipmentType === 'pipe' ? 'Pipe / Cylindrical' : 'Flat Surface'],
      ['Calculation Mode', mode === 'surface' ? 'Max Surface Temperature' : mode === 'heatloss' ? 'Max Heat Loss' : 'Anti-Condensation'],
      ['Insulation Material', materialProperties[materialType]?.name || 'Custom'],
      ['Thermal Conductivity (k)', `${getThermalConductivity().toFixed(3)} W/mK`],
      ['Medium Temperature', `${mediumTemp.toFixed(1)} °C`],
      ['Ambient Temperature', `${ambientTemp.toFixed(1)} °C`],
      ['Environment', environment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())],
      ['Surface Emittance', getEmittance().toFixed(2)],
      ['Operating Hours', `${operatingHours.toFixed(0)} h/year`],
    ]

    if (equipmentType === 'pipe') {
      inputItems.splice(2, 0, ['Pipe Size / OD', `${outerDiameter.toFixed(1)} mm`])
    } else {
      inputItems.splice(2, 0, ['Surface Dimensions', `${surfaceLength.toFixed(2)} m × ${surfaceWidth.toFixed(2)} m`])
    }

    if (mode === 'surface') {
      inputItems.push(['Target Surface Temperature', `${targetSurfaceTemp.toFixed(1)} °C`])
    } else if (mode === 'heatloss') {
      inputItems.push(['Target Heat Loss', `${targetHeatLoss.toFixed(1)} W/m²`])
    } else {
      inputItems.push(['Relative Humidity', `${relativeHumidity.toFixed(0)} %`])
    }

    y = checkPageBreak(doc, y, 120, 'Insulation Report', 'Input Parameters');
    y = drawInfoTable(doc, inputItems, MARGIN_LEFT, y, CONTENT_WIDTH);

    y += 8
    y = drawSectionTitle(doc, '2. Calculation Results', y, 'Thermal insulation calculation results')

    const resultItems: [string, string][] = [
      ['Required Insulation Thickness', `${result.thickness.toFixed(1)} mm`],
      ['Standard Thickness', result.standardThickness ? `${result.standardThickness} mm` : 'N/A'],
      ['Surface Temperature', `${result.surfaceTemp.toFixed(1)} °C`],
      ['Heat Flux', `${Math.abs(result.heatFlux).toFixed(1)} W/m²`],
      ['Annual Heat Loss', `${Math.abs(result.annualHeatLoss || 0).toFixed(0)} kWh/year`],
    ]

    if (result.linearHeatLoss !== undefined) {
      resultItems.splice(3, 0, ['Linear Heat Loss', `${Math.abs(result.linearHeatLoss).toFixed(1)} W/m`])
    }
    if (result.dewPoint !== undefined) {
      resultItems.unshift(['Dew Point Temperature', `${result.dewPoint.toFixed(1)} °C`])
    }

    y = checkPageBreak(doc, y, 100, 'Insulation Report', 'Calculation Results');
    y = drawInfoTable(doc, resultItems, MARGIN_LEFT, y, CONTENT_WIDTH);

    y += 8
    y = drawSectionTitle(doc, '3. Heat Transfer Coefficient', y, 'Convective and radiative heat transfer')

    const hItems: [string, string][] = [
      ['Convective Coefficient (hc)', `${hc.toFixed(2)} W/m²K`],
      ['Radiative Coefficient (hr)', `${hr.toFixed(2)} W/m²K`],
      ['Total Heat Transfer Coeff (h)', `${heatTransferCoeff.toFixed(2)} W/m²K`],
      ['Wind Speed (approx.)', `${windSpeed.toFixed(1)} m/s`],
    ]

    y = checkPageBreak(doc, y, 60, 'Insulation Report', 'Heat Transfer Coefficient');
    y = drawInfoTable(doc, hItems, MARGIN_LEFT, y, CONTENT_WIDTH);

    addDisclaimerPage(doc)
    drawPageFooter(doc)

    doc.save('insulation-report.pdf')
  }

  useEffect(() => {
    if (pipeSizes.metric[pipeSize]) {
      setOuterDiameter(pipeSizes.metric[pipeSize])
    }
  }, [pipeSize])

  return (
    <ProFeaturePreview
      title="Insulation Thickness Calculator"
      description="ISO 12241 & ASTM C680 Standards | Pipe & Flat Surface | Anti-Condensation"
      icon={<BrickWall size={40} />}
    >
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />

        <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-semibold mb-4">Insulation Thickness Calculator</h1>
            <p className="text-[#bdc3c7] max-w-2xl mx-auto">
              ISO 12241 &amp; ASTM C680 Standards | Pipe &amp; Flat Surface | Anti-Condensation
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-5 py-10">
          {/* Inline Disclaimer */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800">⚠️ Professional Engineering Judgment Required</p>
              <p className="text-yellow-700 mt-1">
                Results are for reference only. Insulation specifications should be verified with material suppliers
                and reviewed by qualified thermal engineers to ensure compliance with local codes and standards.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl border border-gray-300 mb-6">
            {/* Mode Tabs */}
            <div className="flex border-b border-gray-300 bg-gray-50 rounded-lg rounded-t-lg rounded-t-lg">
              <button
                className={`flex-1 py-4 px-4 text-sm font-semibold rounded-t-lg transition-all duration-300 rounded-none rounded-tl ${mode === 'surface' ? 'bg-[#f39c12] text-[#2c3e50]' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('surface')}
              >
                Surface Temperature
              </button>
              <button
                className={`flex-1 py-4 px-4 text-sm font-semibold rounded-t-lg transition-all duration-300 rounded-none ${mode === 'heatloss' ? 'bg-[#f39c12] text-[#2c3e50]' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('heatloss')}
              >
                Heat Loss
              </button>
              <button
                className={`flex-1 py-4 px-4 text-sm font-semibold rounded-t-lg transition-all duration-300 rounded-none ${mode === 'condensation' ? 'bg-[#f39c12] text-[#2c3e50]' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('condensation')}
              >
                Anti-Condensation
              </button>
            </div>

            <div className="p-6 rounded-b-lg">
              {/* Equipment Type */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Equipment Type</div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded border border-gray-300 transition-all rounded ${equipmentType === 'pipe' ? 'bg-[#f39c12] text-[#2c3e50] border-[#f39c12] font-semibold rounded' : 'bg-white text-[#555] hover:bg-gray-100 rounded'}`}
                    onClick={() => setEquipmentType('pipe')}
                  >
                    <Cylinder size={20} />
                    Pipe
                  </button>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded border border-gray-300 transition-all rounded ${equipmentType === 'flat' ? 'bg-[#f39c12] text-[#2c3e50] border-[#f39c12] font-semibold rounded' : 'bg-white text-[#555] hover:bg-gray-100 rounded'}`}
                    onClick={() => setEquipmentType('flat')}
                  >
                    <Square size={20} />
                    Flat Surface
                  </button>
                </div>
              </div>

              {/* Dimensions */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Dimensions</div>
                {equipmentType === 'pipe' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium rounded">Pipe Size</label>
                      <select value={pipeSize} onChange={(e) => setPipeSize(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-white text-[#2c3e50] rounded rounded">
                        <option value="1/2">1/2"</option>
                        <option value="3/4">3/4"</option>
                        <option value="1">1"</option>
                        <option value="1¼">1¼"</option>
                        <option value="1½">1½"</option>
                        <option value="2">2"</option>
                        <option value="2½">2½"</option>
                        <option value="3">3"</option>
                        <option value="4">4"</option>
                        <option value="5">5"</option>
                        <option value="6">6"</option>
                        <option value="8">8"</option>
                        <option value="10">10"</option>
                        <option value="12">12"</option>
                        <option value="14">14"</option>
                        <option value="16">16"</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium rounded">Outer Diameter (mm)</label>
                      <input type="number" value={outerDiameter} onChange={(e) => setOuterDiameter(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium rounded">Length (m)</label>
                      <input type="number" value={surfaceLength} onChange={(e) => setSurfaceLength(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium rounded">Width (m)</label>
                      <input type="number" value={surfaceWidth} onChange={(e) => setSurfaceWidth(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                    </div>
                  </div>
                )}
              </div>

              {/* Material */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Insulation Material</div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#555] font-medium rounded">Material</label>
                  <select value={materialType} onChange={(e) => setMaterialType(e.target.value as MaterialType)} className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-white text-[#2c3e50] rounded rounded">
                    <option value="mineralwool">Mineral Wool (0.040 W/m·K)</option>
                    <option value="glasswool">Glass Wool (0.035 W/m·K)</option>
                    <option value="calciumsilicate">Calcium Silicate (0.052 W/m·K)</option>
                    <option value="polyurethane">Polyurethane Foam (0.023 W/m·K)</option>
                    <option value="ceramicfiber">Ceramic Fiber (0.120 W/m·K)</option>
                    <option value="custom">Custom Material</option>
                  </select>
                </div>
                {materialType === 'custom' && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs text-[#555] font-medium rounded">Thermal Conductivity (W/m·K)</label>
                    <input type="number" step="0.001" value={customLambda} onChange={(e) => setCustomLambda(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                  </div>
                )}
              </div>

              {/* Temperatures */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Temperatures</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#555] font-medium rounded">Fluid Temp (°C)</label>
                    <input type="number" value={mediumTemp} onChange={(e) => setMediumTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#555] font-medium rounded">Ambient Temp (°C)</label>
                    <input type="number" value={ambientTemp} onChange={(e) => setAmbientTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                  </div>
                  {mode === 'surface' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium rounded">Target Surface (°C)</label>
                      <input type="number" value={targetSurfaceTemp} onChange={(e) => setTargetSurfaceTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                    </div>
                  )}
                  {mode === 'heatloss' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium rounded">Target Heat Loss (W/m²)</label>
                      <input type="number" value={targetHeatLoss} onChange={(e) => setTargetHeatLoss(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                    </div>
                  )}
                  {mode === 'condensation' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium rounded">Relative Humidity (%)</label>
                      <input type="number" value={relativeHumidity} onChange={(e) => setRelativeHumidity(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                    </div>
                  )}
                </div>
              </div>

              {/* Environment */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Environment</div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#555] font-medium rounded">Location</label>
                  <select value={environment} onChange={(e) => setEnvironment(e.target.value as Environment)} className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-white text-[#2c3e50] rounded rounded">
                    <option value="indoor">Indoor (Still Air)</option>
                    <option value="outdoor_calm">Outdoor (Calm)</option>
                    <option value="outdoor_moderate">Outdoor (Moderate Wind)</option>
                    <option value="outdoor_strong">Outdoor (Strong Wind)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-[#555] font-medium rounded">Surface Finish</label>
                  <select value={surfaceFinish} onChange={(e) => setSurfaceFinish(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-white text-[#2c3e50] rounded rounded">
                    <option value="0.9">Uninsulated / Painted (ε=0.9)</option>
                    <option value="0.7">Aluminum Jacket (ε=0.7)</option>
                    <option value="0.3">Polished Aluminum (ε=0.3)</option>
                    <option value="0.1">Polished Steel (ε=0.1)</option>
                    <option value="custom">Custom Emittance</option>
                  </select>
                </div>
                {surfaceFinish === 'custom' && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs text-[#555] font-medium rounded">Emissivity (ε)</label>
                    <input type="number" step="0.01" min="0" max="1" value={customEmittance} onChange={(e) => setCustomEmittance(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                  </div>
                )}
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-[#555] font-medium rounded">Wind Speed (m/s)</label>
                  <input type="number" step="0.1" value={windSpeed} readOnly className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-gray-100 text-[#7f8c8d] cursor-not-allowed rounded rounded" />
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-[#555] font-medium rounded">Heat Transfer Coeff (W/m²·K)</label>
                  <input type="number" step="0.1" value={heatTransferCoeff.toFixed(1)} readOnly className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-gray-100 text-[#7f8c8d] cursor-not-allowed rounded rounded" />
                </div>
                
                {(() => {
                  const totalH = hc + hr;
                  const convPercent = (hc / totalH) * 100;
                  const radPercent = (hr / totalH) * 100;
                  return (
                    <div className="bg-gray-100 rounded-lg p-4 mt-4">
                      <div className="text-xs text-[#555] font-semibold mb-2">Heat Transfer Breakdown</div>
                      <div className="flex h-6 rounded overflow-hidden">
                        <div className="bg-[#3498db]" style={{ width: `${convPercent}%` }}></div>
                        <div className="bg-[#e74c3c]" style={{ width: `${radPercent}%` }}></div>
                      </div>
                      <div className="flex flex-wrap gap-6 mt-3 text-xs text-[#555]">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#3498db]"></span>
                          Convection: {hc.toFixed(1)} W/m²·K
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#e74c3c]"></span>
                          Radiation: {hr.toFixed(1)} W/m²·K
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Operating Hours */}
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Operating Conditions</div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#555] font-medium rounded">Operating Hours per Year</label>
                  <input type="number" value={operatingHours} onChange={(e) => setOperatingHours(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-8">
                <button
                  onClick={() => handleProAction(handleCalculate)}
                  className="w-full py-4 bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] font-bold rounded rounded transition-all duration-300 text-base"
                >
                  Calculate Insulation Thickness
                </button>
              </div>

              {/* Export PDF Button */}
              <div className="mt-4">
                <button
                  onClick={exportToPDF}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Download size={20} />
                  Export PDF Report
                </button>
              </div>

              {/* Results */}
              {showResults && result && (
                <>
                  <div className="mt-8 pt-8 border-t border-gray-300 rounded">
                    <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Calculation Results</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.dewPoint !== undefined && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center rounded">
                        <div className="text-xs text-[#555] uppercase tracking-wider font-semibold">Dew Point Temperature</div>
                        <div className="text-3xl font-bold text-[#2c3e50] mt-2">{result.dewPoint.toFixed(1)}°C</div>
                      </div>
                    )}
                    <div className="bg-[#f39c12]/10 border-2 border-[#f39c12] rounded-lg p-6 text-center rounded">
                      <div className="text-xs text-[#555] uppercase tracking-wider font-semibold">Required Insulation Thickness</div>
                      <div className="text-3xl font-bold text-[#f39c12] mt-2">{result.thickness.toFixed(1)} mm</div>
                      <div className="text-sm text-[#7f8c8d] mt-2">Standard Size: {result.standardThickness} mm</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center rounded">
                      <div className="text-xs text-[#555] uppercase tracking-wider font-semibold">Surface Temperature</div>
                      <div className="text-3xl font-bold text-[#2c3e50] mt-2">{result.surfaceTemp.toFixed(1)}°C</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center rounded">
                      <div className="text-xs text-[#555] uppercase tracking-wider font-semibold">Heat Flux</div>
                      <div className="text-3xl font-bold text-[#2c3e50] mt-2">{Math.abs(result.heatFlux).toFixed(1)} W/m²</div>
                    </div>
                    {result.linearHeatLoss !== undefined && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center rounded">
                        <div className="text-xs text-[#555] uppercase tracking-wider font-semibold">Linear Heat Loss</div>
                        <div className="text-3xl font-bold text-[#2c3e50] mt-2">{Math.abs(result.linearHeatLoss).toFixed(1)} W/m</div>
                      </div>
                    )}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center rounded">
                      <div className="text-xs text-[#555] uppercase tracking-wider font-semibold">Annual Heat Loss</div>
                      <div className="text-3xl font-bold text-[#2c3e50] mt-2">{Math.abs(result.annualHeatLoss || 0).toFixed(0)} kWh/year</div>
                    </div>
                  </div>

                </>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-[#7f8c8d] mt-8">
            <p>Calculations based on ISO 1224 and ASTM C680 standards</p>
          </div>
        </div>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cylinder className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isLoggedIn ? 'Pro Feature Required' : 'Login Required'}
              </h2>
              <p className="text-gray-600">
                {isLoggedIn
                  ? 'Upgrade to Pro to use this calculator and unlock all premium features.'
                  : 'Please log in to use the insulation calculator and access all features.'}
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
                    Insulation Calculator
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

export default InsulationCalculatorPage
