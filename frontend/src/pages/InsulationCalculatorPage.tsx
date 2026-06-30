import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import ProFeaturePreview from '../components/ProFeaturePreview'
import { Navbar } from '../components/Navbar'
import { authAPI } from '../services/api'
import { Cylinder, Square, BrickWall, AlertTriangle } from 'lucide-react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'

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
  const [unitSystem, setUnitSystem] = useLocalStorageState<UnitSystem>('insulation-unit-system', 'metric')
  const [equipmentType, setEquipmentType] = useLocalStorageState<EquipmentType>('insulation-equipment-type', 'pipe')
  const [mode, setMode] = useLocalStorageState<Mode>('insulation-mode', 'surface')

  const [pipeSize, setPipeSize] = useLocalStorageState<string>('insulation-pipe-size', '2"')
  const [outerDiameter, setOuterDiameter] = useLocalStorageState<number>('insulation-outer-dia', 60.3)

  const [surfaceLength, setSurfaceLength] = useLocalStorageState<number>('insulation-surface-length', 1)
  const [surfaceWidth, setSurfaceWidth] = useLocalStorageState<number>('insulation-surface-width', 1)

  const [materialType, setMaterialType] = useLocalStorageState<MaterialType>('insulation-material', 'mineralwool')
  const [customLambda, setCustomLambda] = useLocalStorageState<number>('insulation-custom-lambda', 0.040)

  const [mediumTemp, setMediumTemp] = useLocalStorageState<number>('insulation-medium-temp', 150)
  const [ambientTemp, setAmbientTemp] = useLocalStorageState<number>('insulation-ambient-temp', 20)
  const [targetSurfaceTemp, setTargetSurfaceTemp] = useLocalStorageState<number>('insulation-target-surface-temp', 50)
  const [targetHeatLoss, setTargetHeatLoss] = useLocalStorageState<number>('insulation-target-heat-loss', 100)
  const [relativeHumidity, setRelativeHumidity] = useLocalStorageState<number>('insulation-relative-humidity', 60)

  const [environment, setEnvironment] = useLocalStorageState<Environment>('insulation-environment', 'indoor')
  const [windSpeed, setWindSpeed] = useLocalStorageState<number>('insulation-wind-speed', 0)
  const [surfaceFinish, setSurfaceFinish] = useLocalStorageState<string>('insulation-surface-finish', '0.9')
  const [customEmittance, setCustomEmittance] = useLocalStorageState<number>('insulation-custom-emittance', 0.9)

  const [operatingHours, setOperatingHours] = useLocalStorageState<number>('insulation-operating-hours', 8760)

  const [heatTransferCoeff, setHeatTransferCoeff] = useLocalStorageState<number>('insulation-heat-transfer-coeff', 12)
  const [hc, setHc] = useLocalStorageState<number>('insulation-hc', 10)
  const [hr, setHr] = useLocalStorageState<number>('insulation-hr', 2)

  const [result, setResult] = useState<CalculationResult | null>(null)
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
    
    const hcVal = 10 + 4 * Math.sqrt(windSpeedMetric)
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
    </ProFeaturePreview>
  )
}

export default InsulationCalculatorPage
