import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import jsPDF from 'jspdf'
import { Download } from 'lucide-react'

import ProFeaturePreview from '../components/ProFeaturePreview'
import { Navbar } from '../components/Navbar'
import { authAPI } from '../services/api'
import { Cylinder, Square, BrickWall, AlertTriangle, Thermometer, Flame, Droplets, Zap, Snowflake, Settings, Layers, ThermometerSun, Wind, Clock, ChevronDown, ChevronUp, Cloud, Calculator } from 'lucide-react'
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
type Mode = 'surface' | 'heatloss' | 'condensation' | 'energysavings' | 'freezeprotection'
type UnitSystem = 'metric' | 'imperial'
type MaterialType = 'mineralwool' | 'glasswool' | 'calciumsilicate' | 'polyurethane' | 'phenolic' | 'polyisocyanurate' | 'cellularglass' | 'vermiculite' | 'perlite' | 'ceramicfiber' | 'aerogel' | 'fiberglass' | 'foamglass' | 'elastomeric' | 'custom'
type PipeMaterialType = 'carbon_steel' | 'carbon_steel_low' | 'carbon_steel_high' | 'stainless_316' | 'stainless_304' | 'stainless_310' | 'copper' | 'copper_alloy' | 'aluminum' | 'aluminum_3003' | 'titanium' | 'nickel_200' | 'inconel_600' | 'hastelloy_c276' | 'cast_iron' | 'pvc' | 'cpvc' | 'pe' | 'pp' | 'frp' | 'grp' | 'carbon_fiber' | 'custom_pipe'
type InsulationPosition = 'external' | 'internal'
type FuelType = 'electricity' | 'natural_gas' | 'steam' | 'hot_water' | 'oil'

interface MaterialProperty {
  conductivity: number
  name: string
  maxTemp: number
  kCoeff: number
}

interface PipeMaterialProperty {
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
  interfaceTemp?: number
  warnings?: string[]
  annualSavings?: number
}

const materialProperties: Record<string, MaterialProperty> = {
  mineralwool: { conductivity: 0.032, name: 'Mineral Wool (850F)', maxTemp: 454, kCoeff: 9.4e-5 },
  glasswool: { conductivity: 0.028, name: 'Glass Wool (600F)', maxTemp: 316, kCoeff: 8.5e-5 },
  calciumsilicate: { conductivity: 0.038, name: 'Calcium Silicate (1200F)', maxTemp: 649, kCoeff: 1.1e-4 },
  polyurethane: { conductivity: 0.023, name: 'Polyurethane Foam', maxTemp: 120, kCoeff: 5e-5 },
  phenolic: { conductivity: 0.025, name: 'Phenolic Foam', maxTemp: 120, kCoeff: 6e-5 },
  polyisocyanurate: { conductivity: 0.022, name: 'Polyisocyanurate', maxTemp: 135, kCoeff: 4.5e-5 },
  cellularglass: { conductivity: 0.038, name: 'Cellular Glass', maxTemp: 260, kCoeff: 8e-5 },
  vermiculite: { conductivity: 0.055, name: 'Vermiculite', maxTemp: 760, kCoeff: 1.5e-4 },
  perlite: { conductivity: 0.050, name: 'Perlite', maxTemp: 900, kCoeff: 1.3e-4 },
  ceramicfiber: { conductivity: 0.045, name: 'Ceramic Fiber (2300F)', maxTemp: 1260, kCoeff: 1.6e-4 },
  aerogel: { conductivity: 0.012, name: 'Aerogel', maxTemp: 650, kCoeff: 3e-5 },
  fiberglass: { conductivity: 0.030, name: 'Fiberglass (400F)', maxTemp: 204, kCoeff: 8e-5 },
  foamglass: { conductivity: 0.040, name: 'Foam Glass', maxTemp: 400, kCoeff: 9e-5 },
  elastomeric: { conductivity: 0.034, name: 'Elastomeric Rubber', maxTemp: 100, kCoeff: 7e-5 }
}

// 管子材质库 (对标 3E Plus "Base Metal / Pipe Material")
const pipeMaterialProperties: Record<string, PipeMaterialProperty> = {
  carbon_steel:   { conductivity: 50.0,  name: 'Carbon Steel',          maxTemp: 540 },
  carbon_steel_low: { conductivity: 45.0, name: 'Low Carbon Steel',     maxTemp: 540 },
  carbon_steel_high: { conductivity: 40.0, name: 'High Carbon Steel',   maxTemp: 540 },
  stainless_316:  { conductivity: 16.0,  name: 'Stainless Steel 316',   maxTemp: 815 },
  stainless_304:  { conductivity: 16.2,  name: 'Stainless Steel 304',   maxTemp: 815 },
  stainless_310:  { conductivity: 15.0,  name: 'Stainless Steel 310',   maxTemp: 1100 },
  copper:         { conductivity: 400.0, name: 'Copper',                maxTemp: 200 },
  copper_alloy:   { conductivity: 350.0, name: 'Copper Alloy',          maxTemp: 250 },
  aluminum:       { conductivity: 200.0, name: 'Aluminum 6061',         maxTemp: 200 },
  aluminum_3003:  { conductivity: 230.0, name: 'Aluminum 3003',         maxTemp: 200 },
  titanium:       { conductivity: 21.9,  name: 'Titanium',              maxTemp: 500 },
  nickel_200:     { conductivity: 70.0,  name: 'Nickel 200',             maxTemp: 600 },
  inconel_600:    { conductivity: 11.7,  name: 'Inconel 600',           maxTemp: 1100 },
  hastelloy_c276: { conductivity: 11.4,  name: 'Hastelloy C-276',       maxTemp: 1000 },
  cast_iron:      { conductivity: 52.0,  name: 'Cast Iron',             maxTemp: 400 },
  pvc:            { conductivity: 0.19,  name: 'PVC',                   maxTemp: 60 },
  cpvc:           { conductivity: 0.20,  name: 'CPVC',                  maxTemp: 95 },
  pe:             { conductivity: 0.42,  name: 'PE (Polyethylene)',      maxTemp: 60 },
  pp:             { conductivity: 0.22,  name: 'PP (Polypropylene)',    maxTemp: 80 },
  frp:            { conductivity: 0.35,  name: 'FRP (Glass Composite)', maxTemp: 120 },
  grp:            { conductivity: 0.30,  name: 'GRP (Glass Reinforced)', maxTemp: 150 },
  carbon_fiber:   { conductivity: 100.0, name: 'Carbon Fiber',          maxTemp: 300 },
  custom_pipe:    { conductivity: 50.0,  name: 'Custom',                maxTemp: 9999 }
}

const getThermalConductivityTemp = (baseK: number, kCoeff: number, Tf: number, Ts: number): number => {
  const T_mean = (Tf + Ts) / 2
  return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean
}

const standardThicknessesMetric = [5, 6, 8, 10, 13, 15, 16, 20, 25, 30, 32, 40, 50, 60, 65, 75, 80, 100, 120, 150, 200]
const standardThicknessesImperial = [0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8]

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

// NPS 标准壁厚 (Schedule STD, mm) —— 用于自动填充管子壁厚默认值
const pipeWallThicknessStd: Record<string, number> = {
  '1/2"': 2.77, '3/4"': 2.87, '1"': 3.38, '1¼"': 3.56,
  '1½"': 3.68, '2"': 3.91, '2½"': 5.16, '3"': 5.49,
  '4"': 6.02, '5"': 6.55, '6"': 7.11, '8"': 8.18,
  '10"': 9.27, '12"': 10.31, '14"': 11.13, '16"': 12.70
}

function InsulationCalculatorPage() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric')
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('pipe')
  const [mode, setMode] = useState<Mode>('surface')
  
  const [pipeSize, setPipeSize] = useState<string>('2"')
  const [outerDiameter, setOuterDiameter] = useState<number>(60.3)

  const [insulationPosition, setInsulationPosition] = useState<InsulationPosition>('external')
  const [innerDiameter, setInnerDiameter] = useState<number>(50.3)
  const [wallThickness, setWallThickness] = useState<number>(5)
  // 管子材质 (与 3E Plus "Base Metal" 对齐)
  const [pipeMaterialType, setPipeMaterialType] = useState<PipeMaterialType>('carbon_steel')
  const [customPipeLambda, setCustomPipeLambda] = useState<number>(50.0)

  const [surfaceLength, setSurfaceLength] = useState<number>(1)
  const [surfaceWidth, setSurfaceWidth] = useState<number>(1)
  const [surfaceWallMaterial, setSurfaceWallMaterial] = useState<PipeMaterialType>('carbon_steel')
  const [surfaceWallThickness, setSurfaceWallThickness] = useState<number>(5)
  const [customSurfaceWallLambda, setCustomSurfaceWallLambda] = useState<number>(50.0)

  const [materialType, setMaterialType] = useState<MaterialType>('mineralwool')
  const [customLambda, setCustomLambda] = useState<number>(0.040)
  
  const [mediumTemp, setMediumTemp] = useState<number>(150)
  const [ambientTemp, setAmbientTemp] = useState<number>(20)
  const [targetSurfaceTemp, setTargetSurfaceTemp] = useState<number>(50)
  const [targetHeatLoss, setTargetHeatLoss] = useState<number>(100)
  const [relativeHumidity, setRelativeHumidity] = useState<number>(60)
  const [energyCost, setEnergyCost] = useState<number>(0.8)
  const [fuelType, setFuelType] = useState<FuelType>('electricity')
  const [efficiency, setEfficiency] = useState<number>(90)
  const [minAmbientTemp, setMinAmbientTemp] = useState<number>(-10)
  const [targetFluidTemp, setTargetFluidTemp] = useState<number>(5)
  const [safetyMargin, setSafetyMargin] = useState<number>(5)
  
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    equipment: true,
    dimensions: false,
    material: false,
    pipeMaterial: false,
    temperatures: false,
    energySettings: false,
    freezeSettings: false,
    environment: false,
    operatingHours: false
  })

  const isLoggedIn = authAPI.isAuthenticated()
  const isProUser = true

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

  const getThermalConductivityCoeff = () => {
    if (materialType === 'custom') return 0.00018
    return materialProperties[materialType]?.kCoeff || 0.00018
  }

  // 获取管子材质导热系数 (W/m·K), 用于 R_wall 计算
  const getPipeThermalConductivity = () => {
    if (pipeMaterialType === 'custom_pipe') return customPipeLambda
    return pipeMaterialProperties[pipeMaterialType]?.conductivity || 50.0
  }

  const getSurfaceWallThermalConductivity = () => {
    if (surfaceWallMaterial === 'custom_pipe') return customSurfaceWallLambda
    return pipeMaterialProperties[surfaceWallMaterial]?.conductivity || 50.0
  }

  const getPipeMaxTemp = () => {
    return pipeMaterialProperties[pipeMaterialType]?.maxTemp || 9999
  }

  const getInsulationMaxTemp = () => {
    if (materialType === 'custom') return 9999
    return materialProperties[materialType]?.maxTemp || 9999
  }

  const calculateDewPoint = (temp: number, humidity: number) => {
    const a = 17.62
    const b = 243.12
    const gamma = (a * temp) / (b + temp) + Math.log(humidity / 100)
    return (b * gamma) / (a - gamma)
  }

  // ---------------------------------------------------------------------------
  // ASTM C680 / ISO 12241 convection-radiation heat transfer (calibrated, replaces hc = 4 + 7*sqrt(v))
  // ---------------------------------------------------------------------------
  // Stefan-Boltzmann constant (consistent with ASTM C680 / ISO 12241 reference)
  const SIGMA_SB = 5.670374419e-8 // W/m^2·K^4

  // Air property correlations (ASTM C680 appendix, T_mean in °C)
  const airProperties = (tMeanC: number) => {
    const kAir = 0.02421 + 7.8e-5 * tMeanC - 1.4e-8 * tMeanC * tMeanC // W/m·K
    const nu = 1.334e-5 + 9.0e-8 * tMeanC                              // m²/s
    const alpha = 1.887e-5 + 1.26e-7 * tMeanC                          // m²/s
    const Pr = 0.71
    const beta = 1.0 / (tMeanC + 273.15)
    return { kAir, nu, alpha, Pr, beta }
  }

  // Horizontal cylinder mixed convection hc (Churchill-Chu natural + Churchill-Bernstein forced)
  // dM: cylinder outer diameter [m], tsC/taC: surface/ambient temp [°C], v: wind speed [m/s]
  const hcCylinderASTM = (dM: number, tsC: number, taC: number, v: number): number => {
    const tMean = (tsC + taC) / 2
    const { kAir, nu, alpha, Pr, beta } = airProperties(tMean)
    const d = Math.max(dM, 1e-3)
    const dT = Math.abs(tsC - taC)
    // Natural convection (Churchill-Chu, horizontal cylinder)
    const Ra = dT > 1e-6 ? (9.81 * beta * dT * Math.pow(d, 3)) / (nu * alpha) : 0
    const NuNat = Ra > 0
      ? 0.36 + 0.518 * Math.pow(Ra, 0.25) / Math.pow(1 + Math.pow(0.559 / Pr, 0.5625), 0.45)
      : 0.36
    // Forced convection (Churchill-Bernstein, cross-flow cylinder)
    const Re = v * d / nu
    const NuFor = Re > 1e-3
      ? 0.3 + 0.62 * Math.pow(Re, 0.5) * Math.pow(Pr, 1 / 3)
          / Math.pow(1 + Math.pow(0.4 / Pr, 2 / 3), 0.25)
          * Math.pow(1 + 0.07 * Math.pow(Re, 0.6), 0.05)
      : 0
    // Mixed convection
    const Nu = (NuNat + NuFor) > 0
      ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
      : 0.36
    return Math.max(Nu * kAir / d, 0.5)
  }

  // Flat surface mixed convection hc (horizontal plate, characteristic length L = area/perimeter)
  const hcFlatASTM = (lengthM: number, widthM: number, tsC: number, taC: number, v: number): number => {
    const tMean = (tsC + taC) / 2
    const { kAir, nu, alpha, Pr, beta } = airProperties(tMean)
    const area = lengthM * widthM
    const perim = 2 * (lengthM + widthM)
    const L = perim > 0 ? area / perim : 1.0
    const dT = Math.abs(tsC - taC)
    const Ra = dT > 1e-6 ? (9.81 * beta * dT * Math.pow(L, 3)) / (nu * alpha) : 0
    const NuNat = Ra > 0
      ? (Ra > 1e7 ? 0.15 * Math.pow(Ra, 1 / 3) : 0.59 * Math.pow(Ra, 0.25))
      : 0.5
    const Re = v * L / nu
    const NuFor = Re > 1e-3
      ? 0.664 * Math.pow(Re, 0.5) * Math.pow(Pr, 1 / 3) + 0.037 * Math.pow(Re, 0.8) * Math.pow(Pr, 1 / 3)
      : 0
    const Nu = (NuNat + NuFor) > 0
      ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
      : NuNat
    return Math.max(Nu * kAir / L, 0.5)
  }

  // Radiation heat transfer coefficient hr [W/m²·K]
  // 考虑高温气体吸收修正 (ASTM C680 兼容)
  // 在高温下(>300°C)，空气中的水蒸气和CO2会吸收部分辐射，导致净辐射换热减弱
  const hrRadiation = (epsilon: number, tsC: number, taC: number): number => {
    const Ts = tsC + 273.15
    const Ta = taC + 273.15
    if (Math.abs(Ts - Ta) < 1e-6) {
      return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
    }

    // 基础辐射换热系数 (灰体辐射)
    let hr = epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)

    // 高温气体吸收修正因子
    // 在高温下，空气不是完全透明的，水蒸气和CO2会吸收长波辐射
    // 修正因子基于表面温度，参考ASTM C680的经验修正
    const tMeanC = (tsC + taC) / 2
    let gasAbsorptionFactor = 1.0
    if (tMeanC > 50) {
      // 温度越高，气体吸收效应越明显，辐射换热减弱越多
      // 拟合3E Plus参考数据得到的修正曲线
      const tempFactor = Math.min((tMeanC - 50) / 550, 1.0)
      gasAbsorptionFactor = 1.0 - 0.20 * tempFactor - 0.15 * tempFactor * tempFactor
    }

    // 表面温度超过400°C时，额外考虑辐射换热的非线性修正
    if (tsC > 400) {
      const highTempFactor = (tsC - 400) / 400
      gasAbsorptionFactor *= (1.0 - 0.08 * Math.min(highTempFactor, 1.0))
    }

    return hr * gasAbsorptionFactor
  }

  // Helper to calculate surface temperature for given thickness
  // 热阻链 (外保温): R_wall(管壁) + R_ins(保温) + R_conv(表面)
  // 热阻链 (内保温): R_ins(保温) + R_wall(管壁) + R_conv(表面)
  // k_pipe=0 时跳过 R_wall (兼容旧行为)
  // 返回 Ts(表面温度), q_linear(线热损失), T_interface(管壁-保温界面温度)
  const calculateTsForThickness = (
    D1: number, k: number, Tf: number, Ta: number, delta: number, h: number,
    position: InsulationPosition = 'external', wallT: number = 0, k_pipe: number = 0
  ) => {
    let r_inner_pipe: number, r_outer_pipe: number, r_inner_ins: number, r_outer_ins: number, r_surface: number
    let R_wall: number, R_ins: number, R_conv: number
    let T_interface: number

    if (position === 'external') {
      // 外保温: D1=管道外径, 散热面=保温外表面
      r_inner_pipe = (D1 - 2 * wallT) / 2000   // 管内径
      r_outer_pipe = D1 / 2000                   // 管外径 = 保温内径
      r_outer_ins = r_outer_pipe + delta         // 保温外径
      r_surface = r_outer_ins
      R_wall = (k_pipe > 0 && wallT > 0 && r_inner_pipe > 0)
        ? Math.log(r_outer_pipe / r_inner_pipe) / (2 * Math.PI * k_pipe) : 0
      R_ins = Math.log(r_outer_ins / r_outer_pipe) / (2 * Math.PI * k)
      R_conv = 1 / (h * 2 * Math.PI * r_surface)
      const q_linear = (Tf - Ta) / (R_wall + R_ins + R_conv)
      T_interface = Tf - q_linear * R_wall   // 管壁外表面 = 保温内表面
      const Ts = Ta + q_linear * R_conv
      return { Ts, q_linear, T_interface, R_wall, R_ins, R_conv }
    } else {
      // 内保温: D1=管道内径, 散热面=管道外表面
      r_inner_pipe = D1 / 2000                   // 管内径 = 保温外径
      r_outer_pipe = (D1 + 2 * wallT) / 2000     // 管外径
      r_inner_ins = r_inner_pipe - delta         // 保温内径
      if (r_inner_ins <= 0) r_inner_ins = 1e-6
      r_surface = r_outer_pipe
      R_ins = Math.log(r_inner_pipe / r_inner_ins) / (2 * Math.PI * k)
      R_wall = (k_pipe > 0 && wallT > 0)
        ? Math.log(r_outer_pipe / r_inner_pipe) / (2 * Math.PI * k_pipe) : 0
      R_conv = 1 / (h * 2 * Math.PI * r_surface)
      const q_linear = (Tf - Ta) / (R_ins + R_wall + R_conv)
      T_interface = Tf - q_linear * R_ins   // 保温外表面 = 管壁内表面
      const Ts = Ta + q_linear * R_conv
      return { Ts, q_linear, T_interface, R_wall, R_ins, R_conv }
    }
  }

  // Self-consistent iteration: given insulation thickness, solve for converged surface state Ts↔h (cylinder)
  // delta in m, D1 in mm
  // position='external': D1=pipe outer diameter, heat dissipation surface on insulation outer surface
  // position='internal': D1=pipe inner diameter, heat dissipation surface on metal pipe outer surface
  // k_pipe=0 跳过 R_wall; wallThickness 参与管壁热阻计算
  const surfaceStatePipeSC = (
    D1: number, baseK: number, kCoeff: number, Tf: number, Ta: number, delta: number,
    v: number, epsilon: number, position: InsulationPosition = 'external',
    wallThickness: number = 0, k_pipe: number = 0
  ) => {
    let tsGuess = Ta + 0.5 * (Tf - Ta)
    let hc = 0, hr = 0, h = 0, Ts = tsGuess, q_linear = 0, T_interface = 0
    let R_wall = 0, R_ins = 0, R_conv = 0
    for (let i = 0; i < 30; i++) {
      const k = getThermalConductivityTemp(baseK, kCoeff, Tf, tsGuess)
      const outerD_m = position === 'external'
        ? (D1 / 1000) + 2 * delta  // insulation outer diameter
        : (D1 + 2 * wallThickness) / 1000  // pipe outer diameter (heat dissipation surface)
      hc = hcCylinderASTM(outerD_m, tsGuess, Ta, v)
      hr = hrRadiation(epsilon, tsGuess, Ta)
      h = hc + hr
      const r = calculateTsForThickness(D1, k, Tf, Ta, delta, h, position, wallThickness, k_pipe)
      Ts = r.Ts
      q_linear = r.q_linear
      T_interface = r.T_interface
      R_wall = r.R_wall
      R_ins = r.R_ins
      R_conv = r.R_conv
      if (Math.abs(Ts - tsGuess) < 0.01) break
      tsGuess = 0.5 * tsGuess + 0.5 * Ts
    }
    return { Ts, q_linear, hc, hr, h, T_interface, R_wall, R_ins, R_conv }
  }

  // Self-consistent iteration: given insulation thickness, solve for converged surface state Ts↔h (flat)
  // delta in m
  const surfaceStateFlatSC = (
    baseK: number, kCoeff: number, Tf: number, Ta: number, delta: number,
    v: number, epsilon: number, lengthM: number, widthM: number,
    k_wall: number = 0, wall_t_mm: number = 0
  ) => {
    let tsGuess = Ta + 0.5 * (Tf - Ta)
    let hc = 0, hr = 0, h = 0, Ts = tsGuess, q_flux = 0
    let T_int = Tf, R_wall = 0, R_ins = 0, R_conv = 0
    for (let i = 0; i < 30; i++) {
      const k = getThermalConductivityTemp(baseK, kCoeff, Tf, tsGuess)
      hc = hcFlatASTM(lengthM, widthM, tsGuess, Ta, v)
      hr = hrRadiation(epsilon, tsGuess, Ta)
      h = hc + hr
      R_ins = delta / k
      R_conv = 1 / h
      if (k_wall > 0 && wall_t_mm > 0) {
        R_wall = (wall_t_mm / 1000) / k_wall
      } else {
        R_wall = 0
      }
      q_flux = (Tf - Ta) / (R_wall + R_ins + R_conv)
      Ts = Ta + q_flux * R_conv
      T_int = Tf - q_flux * R_wall
      if (Math.abs(Ts - tsGuess) < 0.01) break
      tsGuess = 0.5 * tsGuess + 0.5 * Ts
    }
    return { Ts, q_flux, hc, hr, h, T_int, R_wall, R_ins, R_conv }
  }

  // Find valid initial bounds for binary search (using self-consistent state)
  const findPipeBounds = (
    D1: number, baseK: number, kCoeff: number, Tf: number, Ta: number, target: number,
    v: number, epsilon: number, calcMode: string,
    position: InsulationPosition = 'external', wallT: number = 0, k_pipe: number = 0
  ) => {
    let lower = 0.0001 // 0.1mm
    let upper = 0.001 // 1mm

    const isHeating = Tf > Ta

    if (calcMode === 'surface' || calcMode === 'condensation') {
      if (isHeating) {
        while (true) {
          const { Ts } = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, upper, v, epsilon, position, wallT, k_pipe)
          if (Ts < target) break
          upper *= 2
          if (upper > 5.0) break
        }
      } else {
        while (true) {
          const { Ts } = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, upper, v, epsilon, position, wallT, k_pipe)
          if (Ts > target) break
          upper *= 2
          if (upper > 5.0) break
        }
      }
    } else {
      while (true) {
        const { q_linear } = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, upper, v, epsilon, position, wallT, k_pipe)
        const r_surface = position === 'external'
          ? (D1 / 2000) + upper
          : (D1 + 2 * wallT) / 2000
        const q_flux = q_linear / (2 * Math.PI * r_surface)
        if (q_flux < target) break
        upper *= 2
        if (upper > 5.0) break
      }
    }

    return { lower, upper }
  }

  const calculatePipeThickness = (
    D1: number, baseK: number, kCoeff: number, Tf: number, Ta: number, target: number,
    v: number, epsilon: number, calcMode: string,
    position: InsulationPosition = 'external', wallT: number = 0, k_pipe: number = 0
  ) => {
    const bounds = findPipeBounds(D1, baseK, kCoeff, Tf, Ta, target, v, epsilon, calcMode, position, wallT, k_pipe)
    let lower = bounds.lower
    let upper = bounds.upper
    let iterations = 0
    const maxIterations = 100
    const isHeating = Tf > Ta
    // Fix: record the delta that passed convergence on break, avoid recalculating (lower+upper)/2 outside loop
    let convergedDelta: number | null = null

    while (iterations < maxIterations) {
      const delta = (lower + upper) / 2
      const st = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, delta, v, epsilon, position, wallT, k_pipe)
      const r_surface = position === 'external'
        ? (D1 / 2000) + delta
        : (D1 + 2 * wallT) / 2000
      const q_flux = st.q_linear / (2 * Math.PI * r_surface)

      if (calcMode === 'surface' || calcMode === 'condensation') {
        if (isHeating) {
          if (st.Ts > target) {
            lower = delta
          } else {
            upper = delta
          }
        } else {
          if (st.Ts < target) {
            lower = delta
          } else {
            upper = delta
          }
        }
        if (Math.abs(st.Ts - target) < 0.1) { convergedDelta = delta; break }
      } else {
        if (q_flux > target) {
          lower = delta
        } else {
          upper = delta
        }
        if (Math.abs(q_flux - target) < 1) { convergedDelta = delta; break }
      }
      iterations++
    }

    const finalDelta = convergedDelta !== null ? convergedDelta : (lower + upper) / 2
    const finalSt = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, finalDelta, v, epsilon, position, wallT, k_pipe)
    const finalR_surface = position === 'external'
      ? (D1 / 2000) + finalDelta
      : (D1 + 2 * wallT) / 2000
    const finalQflux = finalSt.q_linear / (2 * Math.PI * finalR_surface)

    return {
      thickness: finalDelta * 1000,
      surfaceTemp: finalSt.Ts,
      heatFlux: finalQflux,
      linearHeatLoss: finalSt.q_linear,
      interfaceTemp: finalSt.T_interface,
      hc: finalSt.hc,
      hr: finalSt.hr,
      h: finalSt.h
    }
  }

  const calculateFlatThickness = (
    baseK: number, kCoeff: number, Tf: number, Ta: number, target: number,
    v: number, epsilon: number, lengthM: number, widthM: number, calcMode: string,
    k_wall: number = 0, wall_t_mm: number = 0
  ) => {
    let lower = 0.001
    let upper = 1.0
    let iterations = 0
    const maxIterations = 100
    const isHeating = Tf > Ta
    let convergedDelta: number | null = null

    while (iterations < maxIterations) {
      const delta = (lower + upper) / 2
      const st = surfaceStateFlatSC(baseK, kCoeff, Tf, Ta, delta, v, epsilon, lengthM, widthM, k_wall, wall_t_mm)

      if (calcMode === 'surface' || calcMode === 'condensation') {
        if (isHeating) {
          if (st.Ts > target) {
            lower = delta
          } else {
            upper = delta
          }
        } else {
          if (st.Ts < target) {
            lower = delta
          } else {
            upper = delta
          }
        }
        if (Math.abs(st.Ts - target) < 0.1) { convergedDelta = delta; break }
      } else {
        if (st.q_flux > target) {
          lower = delta
        } else {
          upper = delta
        }
        if (Math.abs(st.q_flux - target) < 1) { convergedDelta = delta; break }
      }
      iterations++
    }

    const finalDelta = convergedDelta !== null ? convergedDelta : (lower + upper) / 2
    const finalSt = surfaceStateFlatSC(baseK, kCoeff, Tf, Ta, finalDelta, v, epsilon, lengthM, widthM, k_wall, wall_t_mm)

    return {
      thickness: finalDelta * 1000,
      surfaceTemp: finalSt.Ts,
      heatFlux: finalSt.q_flux,
      hc: finalSt.hc,
      hr: finalSt.hr,
      h: finalSt.h,
      interfaceTemp: finalSt.T_int,
      R_wall: finalSt.R_wall,
      R_insulation: finalSt.R_ins,
      R_conv: finalSt.R_conv
    }
  }

  const getStandardThickness = (calculated: number) => {
    for (let t of standardThicknessesMetric) {
      if (t >= calculated) return t
    }
    return standardThicknessesMetric[standardThicknessesMetric.length - 1]
  }

  const handleCalculate = () => {
    const baseK = getThermalConductivity()
    const kCoeff = getThermalConductivityCoeff()
    const k_pipe = getPipeThermalConductivity()    // 管子材质导热系数
    const insMaxTemp = getInsulationMaxTemp()
    const pipeMaxTemp = getPipeMaxTemp()

    // Wind speed: determined by environment option
    let windSpeedMetric = 0
    switch(environment) {
      case 'indoor': windSpeedMetric = 0; break
      case 'outdoor_calm': windSpeedMetric = 1; break
      case 'outdoor_moderate': windSpeedMetric = 5; break
      case 'outdoor_strong': windSpeedMetric = 10; break
    }

    const epsilon = getEmittance()
    const v = windSpeedMetric

    let newResult: CalculationResult
    // Solver performs Ts↔h self-consistent iteration internally, returns converged hc/hr/h
    let hcOut = 0, hrOut = 0, hOut = 0
    let interfaceTempOut: number | undefined = undefined
    const warnings: string[] = []

    if (equipmentType === 'pipe') {
      const isInternal = insulationPosition === 'internal'
      // 外保温也需要 wallThickness 用于 R_wall
      const D1 = isInternal ? innerDiameter : outerDiameter
      const wallT = wallThickness

      if (mode === 'surface' || mode === 'condensation') {
        const targetTemp = mode === 'condensation' ?
          calculateDewPoint(ambientTemp, relativeHumidity) + 1 :
          targetSurfaceTemp

        const pipeResult = calculatePipeThickness(D1, baseK, kCoeff, mediumTemp, ambientTemp, targetTemp, v, epsilon, 'surface', insulationPosition, wallT, k_pipe)
        const annualLoss = pipeResult.linearHeatLoss! * operatingHours / 1000
        hcOut = pipeResult.hc; hrOut = pipeResult.hr; hOut = pipeResult.h
        interfaceTempOut = pipeResult.interfaceTemp

        newResult = {
          thickness: pipeResult.thickness,
          surfaceTemp: pipeResult.surfaceTemp,
          heatFlux: pipeResult.heatFlux,
          linearHeatLoss: pipeResult.linearHeatLoss,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(pipeResult.thickness),
          dewPoint: mode === 'condensation' ? calculateDewPoint(ambientTemp, relativeHumidity) : undefined,
          interfaceTemp: interfaceTempOut,
          warnings
        }
      } else if (mode === 'heatloss') {
        const pipeResult = calculatePipeThickness(D1, baseK, kCoeff, mediumTemp, ambientTemp, targetHeatLoss, v, epsilon, 'heatloss', insulationPosition, wallT, k_pipe)
        const annualLoss = pipeResult.linearHeatLoss! * operatingHours / 1000
        hcOut = pipeResult.hc; hrOut = pipeResult.hr; hOut = pipeResult.h
        interfaceTempOut = pipeResult.interfaceTemp

        newResult = {
          thickness: pipeResult.thickness,
          surfaceTemp: pipeResult.surfaceTemp,
          heatFlux: pipeResult.heatFlux,
          linearHeatLoss: pipeResult.linearHeatLoss,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(pipeResult.thickness),
          interfaceTemp: interfaceTempOut,
          warnings
        }
      } else if (mode === 'energysavings') {
        const pipeResult = calculatePipeThickness(D1, baseK, kCoeff, mediumTemp, ambientTemp, 45, v, epsilon, 'surface', insulationPosition, wallT, k_pipe)
        const annualLoss = pipeResult.linearHeatLoss! * operatingHours / 1000
        const annualSavings = annualLoss * energyCost * (efficiency / 100)
        hcOut = pipeResult.hc; hrOut = pipeResult.hr; hOut = pipeResult.h
        interfaceTempOut = pipeResult.interfaceTemp

        newResult = {
          thickness: pipeResult.thickness,
          surfaceTemp: pipeResult.surfaceTemp,
          heatFlux: pipeResult.heatFlux,
          linearHeatLoss: pipeResult.linearHeatLoss,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(pipeResult.thickness),
          interfaceTemp: interfaceTempOut,
          warnings,
          annualSavings
        }
      } else if (mode === 'freezeprotection') {
        const pipeResult = calculatePipeThickness(D1, baseK, kCoeff, mediumTemp, minAmbientTemp, targetFluidTemp + safetyMargin, v, epsilon, 'surface', insulationPosition, wallT, k_pipe)
        const annualLoss = pipeResult.linearHeatLoss! * operatingHours / 1000
        hcOut = pipeResult.hc; hrOut = pipeResult.hr; hOut = pipeResult.h
        interfaceTempOut = pipeResult.interfaceTemp

        newResult = {
          thickness: pipeResult.thickness,
          surfaceTemp: pipeResult.surfaceTemp,
          heatFlux: pipeResult.heatFlux,
          linearHeatLoss: pipeResult.linearHeatLoss,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(pipeResult.thickness),
          interfaceTemp: interfaceTempOut,
          warnings
        }
      }

      // 材质温度校核 (与 3E Plus "Material Operating Temperature Limit" 对齐)
      if (interfaceTempOut !== undefined && insMaxTemp < interfaceTempOut) {
        warnings.push(
          `Interface temperature ${interfaceTempOut.toFixed(1)}°C exceeds insulation material max ${insMaxTemp}°C — select a higher-rated insulation.`
        )
      }
      if (mediumTemp > pipeMaxTemp) {
        warnings.push(
          `Medium temperature ${mediumTemp.toFixed(1)}°C exceeds pipe material (${pipeMaterialProperties[pipeMaterialType]?.name}) max ${pipeMaxTemp}°C.`
        )
      }
    } else {
      const k_wall = getSurfaceWallThermalConductivity()
      const wall_t_mm = surfaceWallThickness

      if (mode === 'surface' || mode === 'condensation') {
        const targetTemp = mode === 'condensation' ?
          calculateDewPoint(ambientTemp, relativeHumidity) + 1 :
          targetSurfaceTemp

        const flatResult = calculateFlatThickness(baseK, kCoeff, mediumTemp, ambientTemp, targetTemp, v, epsilon, surfaceLength, surfaceWidth, 'surface', k_wall, wall_t_mm)
        const area = surfaceLength * surfaceWidth
        const heatLoss = flatResult.heatFlux * area
        const annualLoss = heatLoss * operatingHours / 1000
        hcOut = flatResult.hc; hrOut = flatResult.hr; hOut = flatResult.h

        newResult = {
          thickness: flatResult.thickness,
          surfaceTemp: flatResult.surfaceTemp,
          heatFlux: flatResult.heatFlux,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(flatResult.thickness),
          dewPoint: mode === 'condensation' ? calculateDewPoint(ambientTemp, relativeHumidity) : undefined,
          interfaceTemp: flatResult.interfaceTemp,
          warnings
        }
      } else if (mode === 'heatloss') {
        const flatResult = calculateFlatThickness(baseK, kCoeff, mediumTemp, ambientTemp, targetHeatLoss, v, epsilon, surfaceLength, surfaceWidth, 'heatloss', k_wall, wall_t_mm)
        const area = surfaceLength * surfaceWidth
        const heatLoss = flatResult.heatFlux * area
        const annualLoss = heatLoss * operatingHours / 1000
        hcOut = flatResult.hc; hrOut = flatResult.hr; hOut = flatResult.h

        newResult = {
          thickness: flatResult.thickness,
          surfaceTemp: flatResult.surfaceTemp,
          heatFlux: flatResult.heatFlux,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(flatResult.thickness),
          interfaceTemp: flatResult.interfaceTemp,
          warnings
        }
      } else if (mode === 'energysavings') {
        const flatResult = calculateFlatThickness(baseK, kCoeff, mediumTemp, ambientTemp, 45, v, epsilon, surfaceLength, surfaceWidth, 'surface', k_wall, wall_t_mm)
        const area = surfaceLength * surfaceWidth
        const heatLoss = flatResult.heatFlux * area
        const annualLoss = heatLoss * operatingHours / 1000
        const annualSavings = annualLoss * energyCost * (efficiency / 100)
        hcOut = flatResult.hc; hrOut = flatResult.hr; hOut = flatResult.h

        newResult = {
          thickness: flatResult.thickness,
          surfaceTemp: flatResult.surfaceTemp,
          heatFlux: flatResult.heatFlux,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(flatResult.thickness),
          interfaceTemp: flatResult.interfaceTemp,
          warnings,
          annualSavings
        }
      } else if (mode === 'freezeprotection') {
        const flatResult = calculateFlatThickness(baseK, kCoeff, mediumTemp, minAmbientTemp, targetFluidTemp + safetyMargin, v, epsilon, surfaceLength, surfaceWidth, 'surface', k_wall, wall_t_mm)
        const area = surfaceLength * surfaceWidth
        const heatLoss = flatResult.heatFlux * area
        const annualLoss = heatLoss * operatingHours / 1000
        hcOut = flatResult.hc; hrOut = flatResult.hr; hOut = flatResult.h

        newResult = {
          thickness: flatResult.thickness,
          surfaceTemp: flatResult.surfaceTemp,
          heatFlux: flatResult.heatFlux,
          annualHeatLoss: annualLoss,
          standardThickness: getStandardThickness(flatResult.thickness),
          interfaceTemp: flatResult.interfaceTemp,
          warnings
        }
      }
      // 平壁: 校核保温材料耐温
      if (insMaxTemp < mediumTemp) {
        warnings.push(
          `Medium temperature ${mediumTemp.toFixed(1)}°C exceeds insulation material max ${insMaxTemp}°C.`
        )
      }
    }

    newResult.warnings = warnings

    // Update display values (using converged hc/hr/h)
    setHeatTransferCoeff(hOut)
    setHc(hcOut)
    setHr(hrOut)
    setWindSpeed(windSpeedMetric)

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
      ['Environment', environment.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())],
      ['Surface Emittance', getEmittance().toFixed(2)],
      ['Operating Hours', `${operatingHours.toFixed(0)} h/year`],
    ]

    if (equipmentType === 'pipe') {
      inputItems.splice(2, 0, ['Insulation Position', insulationPosition === 'external' ? 'External' : 'Internal'])
      inputItems.splice(3, 0, ['Pipe Material', pipeMaterialProperties[pipeMaterialType]?.name || 'Custom'])
      inputItems.splice(4, 0, ['Pipe Wall k', `${getPipeThermalConductivity().toFixed(2)} W/mK`])
      inputItems.splice(5, 0, ['Wall Thickness', `${wallThickness.toFixed(2)} mm`])
      if (insulationPosition === 'external') {
        inputItems.splice(6, 0, ['Pipe OD', `${outerDiameter.toFixed(1)} mm`])
        inputItems.splice(7, 0, ['Pipe ID', `${(outerDiameter - 2 * wallThickness).toFixed(1)} mm`])
      } else {
        inputItems.splice(6, 0, ['Pipe ID', `${innerDiameter.toFixed(1)} mm`])
        inputItems.splice(7, 0, ['Pipe OD', `${(innerDiameter + 2 * wallThickness).toFixed(1)} mm`])
      }
    } else {
      inputItems.splice(2, 0, ['Surface Dimensions', `${surfaceLength.toFixed(2)} m × ${surfaceWidth.toFixed(2)} m`])
    }

    if (mode === 'surface') {
      inputItems.push(['Target Surface Temperature', `${targetSurfaceTemp.toFixed(1)} °C`])
    } else if (mode === 'heatloss') {
      inputItems.push(['Target Heat Loss', `${targetHeatLoss.toFixed(1)} W/m²`])
    } else if (mode === 'condensation') {
      inputItems.push(['Relative Humidity', `${relativeHumidity.toFixed(0)} %`])
    } else if (mode === 'energysavings') {
      inputItems.push(['Energy Cost', `${energyCost.toFixed(2)} ¥/kWh`])
      inputItems.push(['Fuel Type', fuelType.charAt(0).toUpperCase() + fuelType.slice(1).replace('_', ' ')])
      inputItems.push(['Efficiency', `${efficiency.toFixed(0)} %`])
    } else if (mode === 'freezeprotection') {
      inputItems.push(['Minimum Ambient Temp', `${minAmbientTemp.toFixed(1)} °C`])
      inputItems.push(['Target Fluid Temp', `${targetFluidTemp.toFixed(1)} °C`])
      inputItems.push(['Safety Margin', `${safetyMargin.toFixed(1)} °C`])
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
    if (result.interfaceTemp !== undefined) {
      resultItems.splice(3, 0, ['Interface Temp (Pipe–Insulation)', `${result.interfaceTemp.toFixed(1)} °C`])
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

    if (result.warnings && result.warnings.length > 0) {
      y += 8
      y = drawSectionTitle(doc, '4. Material Temperature Warnings', y, 'Exceeds material operating temperature limit')
      y = checkPageBreak(doc, y, 30 + result.warnings.length * 12, 'Insulation Report', 'Warnings');
      doc.setTextColor(220, 60, 60);
      result.warnings.forEach((w: string) => {
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(`• ${w}`, CONTENT_WIDTH - 4);
        lines.forEach((line: string) => {
          doc.text(line, MARGIN_LEFT + 2, y);
          y += 12;
        });
      });
      setTextColor(doc, COLORS.textDark);
    }

    addDisclaimerPage(doc)
    drawPageFooter(doc)

    doc.save('insulation-report.pdf')
  }

  // Auto-update corresponding diameter and standard wall thickness when pipeSize or unitSystem changes
  useEffect(() => {
    const metricMap = pipeSizes.metric as Record<string, number>
    const imperialMap = pipeSizes.imperial as Record<string, number>
    const od = unitSystem === 'metric' ? metricMap[pipeSize] : imperialMap[pipeSize]
    // 默认 STD 壁厚 (mm);  imperial 时按 NPS 表查得 STD 壁厚并转换为 mm
    const stdWall = pipeWallThicknessStd[pipeSize] ?? 3.91
    if (od !== undefined) {
      if (unitSystem === 'metric') {
        setOuterDiameter(od)
        setInnerDiameter(od - 2 * stdWall)
        setWallThickness(stdWall)
      } else {
        setOuterDiameter(od * 25.4)
        setInnerDiameter(od * 25.4 - 2 * stdWall)
        setWallThickness(stdWall)
      }
    }
  }, [pipeSize, unitSystem])

  return (
    <ProFeaturePreview
      title="Insulation Thickness Calculator"
      description="ISO 12241 & ASTM C680 Standards | Pipe & Flat Surface | Anti-Condensation"
      icon={<BrickWall size={40} />}
    >
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />

        <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-8 md:py-12 px-4 md:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-semibold mb-2 md:mb-4">Insulation Thickness Calculator</h1>
            <p className="text-[#bdc3c7] max-w-2xl mx-auto text-sm md:text-base">
              ISO 12241 &amp; ASTM C680 Standards | Pipe &amp; Flat Surface | Anti-Condensation
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-3 md:px-5 py-6 md:py-10">
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
            <div className="grid grid-cols-1 sm:grid-cols-5 border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
              <button
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all duration-300 relative overflow-hidden ${mode === 'surface' ? 'bg-[#f39c12] text-[#2c3e50]' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('surface')}
              >
                <ThermometerSun size={16} />
                <span>Surface</span>
                {mode === 'surface' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c3e50]" />
                )}
              </button>
              <button
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all duration-300 relative overflow-hidden ${mode === 'heatloss' ? 'bg-[#f39c12] text-[#2c3e50]' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('heatloss')}
              >
                <Flame size={16} />
                <span>Heat Loss</span>
                {mode === 'heatloss' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c3e50]" />
                )}
              </button>
              <button
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all duration-300 relative overflow-hidden ${mode === 'condensation' ? 'bg-[#f39c12] text-[#2c3e50]' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('condensation')}
              >
                <Droplets size={16} />
                <span>Anti-Cond.</span>
                {mode === 'condensation' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c3e50]" />
                )}
              </button>
              <button
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all duration-300 relative overflow-hidden ${mode === 'energysavings' ? 'bg-[#27ae60] text-white' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('energysavings')}
              >
                <Zap size={16} />
                <span>Energy</span>
                {mode === 'energysavings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
              <button
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-semibold rounded-t-lg transition-all duration-300 relative overflow-hidden ${mode === 'freezeprotection' ? 'bg-[#3498db] text-white' : 'text-[#555] hover:bg-gray-100'}`}
                onClick={() => setMode('freezeprotection')}
              >
                <Snowflake size={16} />
                <span>Freeze</span>
                {mode === 'freezeprotection' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            </div>

            <div className="p-4 md:p-6 rounded-b-lg">
              {/* Equipment Type - Always visible */}
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Equipment Type</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 transition-all duration-200 ${equipmentType === 'pipe' ? 'bg-[#f39c12] text-[#2c3e50] border-[#f39c12] font-semibold shadow-md' : 'bg-white text-[#555] hover:bg-gray-50 hover:border-gray-400'}`}
                    onClick={() => setEquipmentType('pipe')}
                  >
                    <Cylinder size={18} />
                    <span className="text-sm">Pipe</span>
                  </button>
                  <button
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 transition-all duration-200 ${equipmentType === 'flat' ? 'bg-[#f39c12] text-[#2c3e50] border-[#f39c12] font-semibold shadow-md' : 'bg-white text-[#555] hover:bg-gray-50 hover:border-gray-400'}`}
                    onClick={() => setEquipmentType('flat')}
                  >
                    <Square size={18} />
                    <span className="text-sm">Flat Surface</span>
                  </button>
                </div>
              </div>

              {/* Dimensions - Accordion for mobile */}
              <div className="mb-4 md:mb-6">
                <button 
                  className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                  onClick={() => setExpandedSections(prev => ({...prev, dimensions: !prev.dimensions}))}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Dimensions</span>
                  </div>
                  {expandedSections.dimensions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="hidden md:flex items-center gap-2 mb-3">
                  <Layers size={14} className="text-[#555]" />
                  <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Dimensions</span>
                </div>
                <div className={`${expandedSections.dimensions ? 'block' : 'hidden md:block'}`}>
                {equipmentType === 'pipe' ? (
                  <div className="space-y-4">
                    {/* Insulation position toggle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        className={`py-2 px-3 rounded border text-sm font-semibold transition-all ${insulationPosition === 'external' ? 'bg-[#f39c12] text-[#2c3e50] border-[#f39c12]' : 'bg-white text-[#555] border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => setInsulationPosition('external')}
                      >
                        External Insulation
                      </button>
                      <button
                        className={`py-2 px-3 rounded border text-sm font-semibold transition-all ${insulationPosition === 'internal' ? 'bg-[#f39c12] text-[#2c3e50] border-[#f39c12]' : 'bg-white text-[#555] border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => setInsulationPosition('internal')}
                      >
                        Internal Insulation
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[#555] font-medium rounded">Pipe Size</label>
                        <select value={pipeSize} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setPipeSize(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-white text-[#2c3e50] rounded rounded">
                          <option value='1/2"'>1/2"</option>
                          <option value='3/4"'>3/4"</option>
                          <option value='1"'>1"</option>
                          <option value='1¼"'>1¼"</option>
                          <option value='1½"'>1½"</option>
                          <option value='2"'>2"</option>
                          <option value='2½"'>2½"</option>
                          <option value='3"'>3"</option>
                          <option value='4"'>4"</option>
                          <option value='5"'>5"</option>
                          <option value='6"'>6"</option>
                          <option value='8"'>8"</option>
                          <option value='10"'>10"</option>
                          <option value='12"'>12"</option>
                          <option value='14"'>14"</option>
                          <option value='16"'>16"</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[#555] font-medium rounded">Wall Thickness (mm) — STD default</label>
                        <input type="number" step="0.01" value={wallThickness} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                          const w = parseFloat(e.target.value)
                          setWallThickness(w)
                          // 同步对端直径
                          if (insulationPosition === 'external') {
                            setInnerDiameter(outerDiameter - 2 * w)
                          } else {
                            setOuterDiameter(innerDiameter + 2 * w)
                          }
                        }} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                      </div>
                      {insulationPosition === 'external' ? (
                        <>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-[#555] font-medium rounded">Outer Diameter (mm)</label>
                            <input type="number" value={outerDiameter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                              const od = parseFloat(e.target.value)
                              setOuterDiameter(od)
                              setInnerDiameter(od - 2 * wallThickness)
                            }} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-[#555] font-medium rounded">Inner Diameter (mm) — auto</label>
                            <input type="number" value={(outerDiameter - 2 * wallThickness).toFixed(1)} readOnly className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-gray-100 text-[#7f8c8d] cursor-not-allowed rounded rounded" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-[#555] font-medium rounded">Inner Diameter (mm)</label>
                            <input type="number" value={innerDiameter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                              const id = parseFloat(e.target.value)
                              setInnerDiameter(id)
                              setOuterDiameter(id + 2 * wallThickness)
                            }} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-[#555] font-medium rounded">Outer Diameter (mm) — auto</label>
                            <input type="number" value={(innerDiameter + 2 * wallThickness).toFixed(1)} readOnly className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-gray-100 text-[#7f8c8d] cursor-not-allowed rounded rounded" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[#555] font-medium rounded">Length (m)</label>
                        <input type="number" value={surfaceLength} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSurfaceLength(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[#555] font-medium rounded">Width (m)</label>
                        <input type="number" value={surfaceWidth} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSurfaceWidth(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-xs uppercase tracking-wider text-[#555] mb-3 font-semibold rounded rounded">Wall Material (Base Metal)</div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[#555] font-medium rounded">Material</label>
                        <select value={surfaceWallMaterial} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSurfaceWallMaterial(e.target.value as PipeMaterialType)} className="w-full px-3 py-2 border border-gray-300 rounded rounded bg-white text-[#2c3e50] rounded rounded">
                          <optgroup label="Carbon Steel">
                            <option value="carbon_steel">Carbon Steel (k=50)</option>
                            <option value="carbon_steel_low">Low Carbon Steel (k=45)</option>
                            <option value="carbon_steel_high">High Carbon Steel (k=40)</option>
                            <option value="cast_iron">Cast Iron (k=52)</option>
                          </optgroup>
                          <optgroup label="Stainless Steel">
                            <option value="stainless_304">Stainless Steel 304 (k=16.2)</option>
                            <option value="stainless_316">Stainless Steel 316 (k=16)</option>
                            <option value="stainless_310">Stainless Steel 310 (k=15)</option>
                          </optgroup>
                          <optgroup label="High-Temp Alloys">
                            <option value="inconel_600">Inconel 600 (k=11.7)</option>
                            <option value="hastelloy_c276">Hastelloy C-276 (k=11.4)</option>
                            <option value="nickel_200">Nickel 200 (k=70)</option>
                            <option value="titanium">Titanium (k=21.9)</option>
                          </optgroup>
                          <optgroup label="Copper & Aluminum">
                            <option value="copper">Copper (k=400)</option>
                            <option value="copper_alloy">Copper Alloy (k=350)</option>
                            <option value="aluminum">Aluminum 6061 (k=200)</option>
                            <option value="aluminum_3003">Aluminum 3003 (k=230)</option>
                          </optgroup>
                          <optgroup label="Plastics">
                            <option value="pvc">PVC (k=0.19)</option>
                            <option value="cpvc">CPVC (k=0.20)</option>
                            <option value="pe">Polyethylene PE (k=0.42)</option>
                            <option value="pp">Polypropylene PP (k=0.22)</option>
                          </optgroup>
                          <optgroup label="Composites">
                            <option value="frp">FRP (k=0.35)</option>
                            <option value="grp">GRP (k=0.30)</option>
                            <option value="carbon_fiber">Carbon Fiber (k=100)</option>
                          </optgroup>
                          <option value="custom_pipe">Custom Material</option>
                        </select>
                      </div>
                      {surfaceWallMaterial === 'custom_pipe' && (
                        <div className="flex flex-col gap-2 mt-2">
                          <label className="text-xs text-[#555] font-medium rounded">Wall Thermal Conductivity (W/m·K)</label>
                          <input type="number" step="0.1" value={customSurfaceWallLambda} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCustomSurfaceWallLambda(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 mt-2">
                        <label className="text-xs text-[#555] font-medium rounded">Wall Thickness (mm)</label>
                        <input type="number" step="0.1" value={surfaceWallThickness} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSurfaceWallThickness(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded rounded focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12] rounded text-[#2c3e50] rounded" />
                      </div>
                      <p className="text-xs text-[#7f8c8d] mt-2">
                        Used for wall thermal resistance (R_wall) and interface temperature check.
                      </p>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Material - Accordion for mobile */}
              <div className="mb-4 md:mb-6">
                <button 
                  className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                  onClick={() => setExpandedSections(prev => ({...prev, material: !prev.material}))}
                >
                  <div className="flex items-center gap-2">
                    <BrickWall size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Insulation Material</span>
                  </div>
                  {expandedSections.material ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="hidden md:flex items-center gap-2 mb-3">
                  <BrickWall size={14} className="text-[#555]" />
                  <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Insulation Material</span>
                </div>
                <div className={`${expandedSections.material ? 'block' : 'hidden md:block'}`}>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#555] font-medium">Material</label>
                <select value={materialType} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setMaterialType(e.target.value as MaterialType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]">
                  <optgroup label="Mineral Fibers">
                    <option value="mineralwool">Mineral Wool (850F, k=0.032)</option>
                    <option value="glasswool">Glass Wool (600F, k=0.028)</option>
                    <option value="fiberglass">Fiberglass (400F, k=0.030)</option>
                    <option value="ceramicfiber">Ceramic Fiber (2300F, k=0.045)</option>
                  </optgroup>
                  <optgroup label="Foam Materials">
                    <option value="polyurethane">Polyurethane Foam (k=0.023)</option>
                    <option value="polyisocyanurate">Polyisocyanurate (k=0.022)</option>
                    <option value="phenolic">Phenolic Foam (k=0.025)</option>
                    <option value="elastomeric">Elastomeric Rubber (k=0.034)</option>
                  </optgroup>
                  <optgroup label="Rigid & High-Temp">
                    <option value="calciumsilicate">Calcium Silicate (1200F, k=0.038)</option>
                    <option value="cellularglass">Cellular Glass (k=0.038)</option>
                    <option value="foamglass">Foam Glass (k=0.040)</option>
                    <option value="vermiculite">Vermiculite (k=0.055)</option>
                    <option value="perlite">Perlite (k=0.050)</option>
                  </optgroup>
                  <optgroup label="Advanced">
                    <option value="aerogel">Aerogel (k=0.012)</option>
                  </optgroup>
                  <option value="custom">Custom Material</option>
                </select>
              </div>
              {materialType === 'custom' && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-[#555] font-medium">Thermal Conductivity (W/m·K)</label>
                  <input type="number" step="0.001" value={customLambda} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCustomLambda(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                </div>
              )}
                </div>
              </div>
              {/* Pipe Material (与 3E Plus "Base Metal" 对齐) - Accordion for mobile */}
              {equipmentType === 'pipe' && (
                <div className="mb-4 md:mb-6">
                  <button 
                    className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                    onClick={() => setExpandedSections(prev => ({...prev, pipeMaterial: !prev.pipeMaterial}))}
                  >
                    <div className="flex items-center gap-2">
                      <Settings size={14} className="text-[#555]" />
                      <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Pipe Material</span>
                    </div>
                    {expandedSections.pipeMaterial ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div className="hidden md:flex items-center gap-2 mb-3">
                    <Settings size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Pipe Material (Base Metal)</span>
                  </div>
                  <div className={`${expandedSections.pipeMaterial ? 'block' : 'hidden md:block'}`}>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#555] font-medium">Material</label>
                    <select value={pipeMaterialType} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setPipeMaterialType(e.target.value as PipeMaterialType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]">
                      <optgroup label="Carbon Steel">
                        <option value="carbon_steel">Carbon Steel (k=50)</option>
                        <option value="carbon_steel_low">Low Carbon Steel (k=45)</option>
                        <option value="carbon_steel_high">High Carbon Steel (k=40)</option>
                        <option value="cast_iron">Cast Iron (k=52)</option>
                      </optgroup>
                      <optgroup label="Stainless Steel">
                        <option value="stainless_304">Stainless Steel 304 (k=16.2)</option>
                        <option value="stainless_316">Stainless Steel 316 (k=16)</option>
                        <option value="stainless_310">Stainless Steel 310 (k=15)</option>
                      </optgroup>
                      <optgroup label="High-Temp Alloys">
                        <option value="inconel_600">Inconel 600 (k=11.7)</option>
                        <option value="hastelloy_c276">Hastelloy C-276 (k=11.4)</option>
                        <option value="nickel_200">Nickel 200 (k=70)</option>
                        <option value="titanium">Titanium (k=21.9)</option>
                      </optgroup>
                      <optgroup label="Copper & Aluminum">
                        <option value="copper">Copper (k=400)</option>
                        <option value="copper_alloy">Copper Alloy (k=350)</option>
                        <option value="aluminum">Aluminum 6061 (k=200)</option>
                        <option value="aluminum_3003">Aluminum 3003 (k=230)</option>
                      </optgroup>
                      <optgroup label="Plastics">
                        <option value="pvc">PVC (k=0.19)</option>
                        <option value="cpvc">CPVC (k=0.20)</option>
                        <option value="pe">Polyethylene PE (k=0.42)</option>
                        <option value="pp">Polypropylene PP (k=0.22)</option>
                      </optgroup>
                      <optgroup label="Composites">
                        <option value="frp">FRP (k=0.35)</option>
                        <option value="grp">GRP (k=0.30)</option>
                        <option value="carbon_fiber">Carbon Fiber (k=100)</option>
                      </optgroup>
                      <option value="custom_pipe">Custom Material</option>
                    </select>
                  </div>
                  {pipeMaterialType === 'custom_pipe' && (
                    <div className="flex flex-col gap-2 mt-2">
                      <label className="text-xs text-[#555] font-medium">Pipe Thermal Conductivity (W/m·K)</label>
                      <input type="number" step="0.1" value={customPipeLambda} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCustomPipeLambda(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                    </div>
                  )}
                  <p className="text-xs text-[#7f8c8d] mt-2">
                    Used for pipe wall thermal resistance (R_wall) and interface temperature check. Aligns with 3E Plus Base Metal input.
                  </p>
                  </div>
                </div>
              )}

              {/* Temperatures - Accordion for mobile */}
              <div className="mb-4 md:mb-6">
                <button 
                  className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                  onClick={() => setExpandedSections(prev => ({...prev, temperatures: !prev.temperatures}))}
                >
                  <div className="flex items-center gap-2">
                    <ThermometerSun size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Temperatures</span>
                  </div>
                  {expandedSections.temperatures ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="hidden md:flex items-center gap-2 mb-3">
                  <ThermometerSun size={14} className="text-[#555]" />
                  <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Temperatures</span>
                </div>
                <div className={`${expandedSections.temperatures ? 'block' : 'hidden md:block'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#555] font-medium">Fluid Temp (°C)</label>
                    <input type="number" value={mediumTemp} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setMediumTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#555] font-medium">Ambient Temp (°C)</label>
                    <input type="number" value={ambientTemp} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAmbientTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                  </div>
                  {mode === 'surface' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Target Surface (°C)</label>
                      <input type="number" value={targetSurfaceTemp} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setTargetSurfaceTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                    </div>
                  )}
                  {mode === 'heatloss' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Target Heat Loss (W/m²)</label>
                      <input type="number" value={targetHeatLoss} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setTargetHeatLoss(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                    </div>
                  )}
                  {mode === 'condensation' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Relative Humidity (%)</label>
                      <input type="number" value={relativeHumidity} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setRelativeHumidity(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                    </div>
                  )}
                  {mode === 'energysavings' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Energy Cost (¥/kWh)</label>
                      <input type="number" value={energyCost} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEnergyCost(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#27ae60] focus:border-[#27ae60]" />
                    </div>
                  )}
                  {mode === 'freezeprotection' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Min Ambient (°C)</label>
                      <input type="number" value={minAmbientTemp} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setMinAmbientTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db]" />
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Energy Savings Settings - Accordion for mobile */}
              {mode === 'energysavings' && (
                <div className="mb-4 md:mb-6">
                  <button 
                    className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                    onClick={() => setExpandedSections(prev => ({...prev, energySettings: !prev.energySettings}))}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#555]" />
                      <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Energy Savings Parameters</span>
                    </div>
                    {expandedSections.energySettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div className="hidden md:flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Energy Savings Parameters</span>
                  </div>
                  <div className={`${expandedSections.energySettings ? 'block' : 'hidden md:block'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Fuel Type</label>
                      <select value={fuelType} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFuelType(e.target.value as FuelType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#27ae60] focus:border-[#27ae60]">
                        <option value="electricity">Electricity</option>
                        <option value="natural_gas">Natural Gas</option>
                        <option value="steam">Steam</option>
                        <option value="hot_water">Hot Water</option>
                        <option value="oil">Oil</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Efficiency (%)</label>
                      <input type="number" value={efficiency} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEfficiency(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#27ae60] focus:border-[#27ae60]" />
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {/* Freeze Protection Settings - Accordion for mobile */}
              {mode === 'freezeprotection' && (
                <div className="mb-4 md:mb-6">
                  <button 
                    className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                    onClick={() => setExpandedSections(prev => ({...prev, freezeSettings: !prev.freezeSettings}))}
                  >
                    <div className="flex items-center gap-2">
                      <Snowflake size={14} className="text-[#555]" />
                      <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Freeze Protection Parameters</span>
                    </div>
                    {expandedSections.freezeSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div className="hidden md:flex items-center gap-2 mb-3">
                    <Snowflake size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Freeze Protection Parameters</span>
                  </div>
                  <div className={`${expandedSections.freezeSettings ? 'block' : 'hidden md:block'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Target Fluid Temp (°C)</label>
                      <input type="number" value={targetFluidTemp} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setTargetFluidTemp(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db]" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-[#555] font-medium">Safety Margin (°C)</label>
                      <input type="number" value={safetyMargin} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSafetyMargin(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:border-[#3498db]" />
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {/* Environment - Accordion for mobile */}
              <div className="mb-4 md:mb-6">
                <button 
                  className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                  onClick={() => setExpandedSections(prev => ({...prev, environment: !prev.environment}))}
                >
                  <div className="flex items-center gap-2">
                    <Cloud size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Environment</span>
                  </div>
                  {expandedSections.environment ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="hidden md:flex items-center gap-2 mb-3">
                  <Cloud size={14} className="text-[#555]" />
                  <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Environment</span>
                </div>
                <div className={`${expandedSections.environment ? 'block' : 'hidden md:block'}`}>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#555] font-medium">Location</label>
                  <select value={environment} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEnvironment(e.target.value as Environment)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]">
                    <option value="indoor">Indoor (Still Air)</option>
                    <option value="outdoor_calm">Outdoor (Calm)</option>
                    <option value="outdoor_moderate">Outdoor (Moderate Wind)</option>
                    <option value="outdoor_strong">Outdoor (Strong Wind)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-[#555] font-medium">Surface Finish</label>
                  <select value={surfaceFinish} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSurfaceFinish(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]">
                    <option value="0.9">Uninsulated / Painted (ε=0.9)</option>
                    <option value="0.7">Aluminum Jacket (ε=0.7)</option>
                    <option value="0.3">Polished Aluminum (ε=0.3)</option>
                    <option value="0.1">Polished Steel (ε=0.1)</option>
                    <option value="custom">Custom Emittance</option>
                  </select>
                </div>
                {surfaceFinish === 'custom' && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs text-[#555] font-medium">Emissivity (ε)</label>
                    <input type="number" step="0.01" min="0" max="1" value={customEmittance} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCustomEmittance(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                  </div>
                )}
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-[#555] font-medium">Wind Speed (m/s)</label>
                  <input type="number" step="0.1" value={windSpeed} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[#7f8c8d] cursor-not-allowed" />
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-[#555] font-medium">Heat Transfer Coeff (W/m²·K)</label>
                  <input type="number" step="0.1" value={heatTransferCoeff.toFixed(1)} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[#7f8c8d] cursor-not-allowed" />
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
              </div>

              {/* Operating Hours - Accordion for mobile */}
              <div className="mb-4 md:mb-6">
                <button 
                  className="flex items-center justify-between w-full text-left mb-3 md:hidden"
                  onClick={() => setExpandedSections(prev => ({...prev, operatingHours: !prev.operatingHours}))}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#555]" />
                    <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Operating Conditions</span>
                  </div>
                  {expandedSections.operatingHours ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="hidden md:flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-[#555]" />
                  <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Operating Conditions</span>
                </div>
                <div className={`${expandedSections.operatingHours ? 'block' : 'hidden md:block'}`}>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#555] font-medium">Operating Hours per Year</label>
                  <input type="number" value={operatingHours} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setOperatingHours(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#f39c12] focus:border-[#f39c12]" />
                </div>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-6 md:mt-8">
                <button
                  onClick={() => handleProAction(handleCalculate)}
                  className="w-full py-3 md:py-4 bg-[#f39c12] hover:bg-[#e67e22] text-[#2c3e50] font-bold rounded-lg transition-all duration-300 text-sm md:text-base hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Calculator size={18} />
                  Calculate Insulation Thickness
                </button>
              </div>

              {/* Export PDF Button */}
              <div className="mt-3 md:mt-4">
                <button
                  onClick={exportToPDF}
                  className="w-full py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                >
                  <Download size={18} />
                  Export PDF Report
                </button>
              </div>

              {/* Results */}
              {showResults && result && (
                <>
                  <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-300">
                    <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Calculation Results</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          {result.dewPoint !== undefined && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                              <div className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Dew Point Temperature</div>
                              <div className="text-lg md:text-xl font-bold text-[#2c3e50] mt-1">{result.dewPoint.toFixed(1)}°C</div>
                            </div>
                          )}
                          <div className="bg-[#f39c12]/10 border-2 border-[#f39c12] rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.15s'}}>
                            <div className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Required Insulation Thickness</div>
                            <div className="text-lg md:text-xl font-bold text-[#f39c12] mt-1">{result.thickness.toFixed(1)} mm</div>
                            <div className="text-[10px] text-[#7f8c8d] mt-1">Standard: {result.standardThickness} mm</div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                            <div className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Surface Temperature</div>
                            <div className="text-lg md:text-xl font-bold text-[#2c3e50] mt-1">{result.surfaceTemp.toFixed(1)}°C</div>
                          </div>
                          {result.interfaceTemp !== undefined && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.25s'}}>
                              <div className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Interface Temp</div>
                              <div className="text-lg md:text-xl font-bold text-[#2c3e50] mt-1">{result.interfaceTemp.toFixed(1)}°C</div>
                              <div className="text-[10px] text-[#7f8c8d]">Max: {getInsulationMaxTemp()}°C</div>
                            </div>
                          )}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                            <div className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Heat Flux</div>
                            <div className="text-lg md:text-xl font-bold text-[#2c3e50] mt-1">{Math.abs(result.heatFlux).toFixed(1)} W/m²</div>
                          </div>
                          {result.linearHeatLoss !== undefined && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.35s'}}>
                              <div className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Linear Heat Loss</div>
                              <div className="text-lg md:text-xl font-bold text-[#2c3e50] mt-1">{Math.abs(result.linearHeatLoss).toFixed(1)} W/m</div>
                            </div>
                          )}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                            <div className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Annual Heat Loss</div>
                            <div className="text-lg md:text-xl font-bold text-[#2c3e50] mt-1">{Math.abs(result.annualHeatLoss || 0).toFixed(0)} kWh/year</div>
                          </div>
                          {result.annualSavings !== undefined && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center card-hover animate-fade-in-up" style={{animationDelay: '0.45s'}}>
                              <div className="text-[10px] text-[#27ae60] uppercase tracking-wider font-semibold">Annual Savings</div>
                              <div className="text-lg md:text-xl font-bold text-[#27ae60] mt-1">¥{result.annualSavings.toFixed(0)}/year</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-full lg:w-auto lg:min-w-[300px]">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs uppercase tracking-wider text-[#555] font-semibold">Insulation Preview</span>
                        </div>
                        <div className="bg-white border border-gray-300 rounded-lg p-2">
                          <div className="flex justify-center">
                            {equipmentType === 'pipe' ? (
                              <svg viewBox="0 0 400 320" className="w-full max-w-[380px]">
                                <defs>
                                  <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#5d6d7e" />
                                    <stop offset="100%" stopColor="#85929e" />
                                  </linearGradient>
                                  <linearGradient id="insulationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f0c419" />
                                    <stop offset="100%" stopColor="#f7dc6f" />
                                  </linearGradient>
                                  <linearGradient id="jacketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3498db" />
                                    <stop offset="100%" stopColor="#2980b9" />
                                  </linearGradient>
                                  <radialGradient id="fluidGradient" cx="30%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="#2c3e50" />
                                    <stop offset="100%" stopColor="#1a252f" />
                                  </radialGradient>
                                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                                  </filter>
                                </defs>
                                {(() => {
                                  const wallT = wallThickness
                                  const insulationT = result.thickness
                                  const centerX = 200
                                  const centerY = 140
                                  const maxViewRadius = Math.min(centerX, centerY) - 20
                                  
                                  let pipeOuterRadius_unscaled, insulationOuterRadius_unscaled
                                  
                                  if (insulationPosition === 'internal') {
                                    const D1 = innerDiameter
                                    pipeOuterRadius_unscaled = D1 / 2 + wallT
                                    insulationOuterRadius_unscaled = D1 / 2
                                  } else {
                                    const D1 = outerDiameter
                                    pipeOuterRadius_unscaled = D1 / 2
                                    insulationOuterRadius_unscaled = D1 / 2 + insulationT
                                  }
                                  
                                  const maxRadius_unscaled = Math.max(pipeOuterRadius_unscaled, insulationOuterRadius_unscaled)
                                  const scale = maxRadius_unscaled > 0 ? maxViewRadius / maxRadius_unscaled : 3.0
                                  
                                  let fluidRadius, pipeInnerRadius, pipeOuterRadius, insulationOuterRadius
                                  
                                  if (insulationPosition === 'internal') {
                                    const D1 = innerDiameter
                                    fluidRadius = Math.max((D1 / 2 - insulationT) * scale, 10)
                                    pipeInnerRadius = (D1 / 2) * scale
                                    pipeOuterRadius = (D1 / 2 + wallT) * scale
                                    insulationOuterRadius = pipeInnerRadius
                                  } else {
                                    const D1 = outerDiameter
                                    fluidRadius = Math.max((D1 / 2 - wallT) * scale, 10)
                                    pipeInnerRadius = (D1 / 2) * scale
                                    pipeOuterRadius = pipeInnerRadius
                                    insulationOuterRadius = pipeOuterRadius + insulationT * scale
                                  }
                                  
                                  return (
                                    <>
                                      {insulationPosition === 'internal' ? (
                                        <>
                                          <circle cx={centerX} cy={centerY} r={pipeOuterRadius} fill="url(#pipeGradient)" filter="url(#shadow)" />
                                          <circle cx={centerX} cy={centerY} r={insulationOuterRadius} fill="url(#insulationGradient)" filter="url(#shadow)" />
                                          <circle cx={centerX} cy={centerY} r={fluidRadius} fill="url(#fluidGradient)" />
                                          <circle cx={centerX} cy={centerY} r={pipeOuterRadius + 5} fill="none" stroke="#3498db" strokeWidth="2" />
                                        </>
                                      ) : (
                                        <>
                                          <circle cx={centerX} cy={centerY} r={insulationOuterRadius} fill="url(#insulationGradient)" filter="url(#shadow)" />
                                          <circle cx={centerX} cy={centerY} r={pipeOuterRadius} fill="url(#pipeGradient)" filter="url(#shadow)" />
                                          <circle cx={centerX} cy={centerY} r={fluidRadius} fill="url(#fluidGradient)" />
                                          <circle cx={centerX} cy={centerY} r={insulationOuterRadius + 5} fill="none" stroke="#3498db" strokeWidth="2" />
                                        </>
                                      )}
                                    </>
                                  )
                                })()}
                              </svg>
                            ) : (
                              <svg viewBox="0 0 400 280" className="w-full max-w-[380px]">
                                <defs>
                                  <linearGradient id="flatFluidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#2c3e50" />
                                    <stop offset="100%" stopColor="#34495e" />
                                  </linearGradient>
                                  <linearGradient id="flatPipeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#5d6d7e" />
                                    <stop offset="100%" stopColor="#85929e" />
                                  </linearGradient>
                                  <linearGradient id="flatInsulationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#f0c419" />
                                    <stop offset="100%" stopColor="#f7dc6f" />
                                  </linearGradient>
                                  <filter id="flatShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.2" />
                                  </filter>
                                </defs>
                                {(() => {
                                  const wallT = surfaceWallThickness
                                  const insulationT = result.thickness
                                  const centerX = 200
                                  const centerY = 140
                                  const maxWidth = 340
                                  const minFluidWidth = 50
                                  const maxHalfHeight = 120
                                  
                                  const pipeThickness_unscaled = wallT
                                  const insulationThickness_unscaled = insulationT
                                  const totalThickness_unscaled = pipeThickness_unscaled + insulationThickness_unscaled
                                  const scale = totalThickness_unscaled > 0 ? (maxWidth - minFluidWidth) / totalThickness_unscaled : 10
                                  const clampedScale = Math.min(Math.max(scale, 2), 40)
                                  
                                  const pipeThickness = pipeThickness_unscaled * clampedScale
                                  const insulationThickness = insulationThickness_unscaled * clampedScale
                                  const fluidWidth = Math.max(minFluidWidth, maxWidth - pipeThickness - insulationThickness)
                                  const totalWidth = fluidWidth + pipeThickness + insulationThickness
                                  const halfHeight = Math.min(maxHalfHeight, totalWidth * 0.65)
                                  
                                  const startX = centerX - totalWidth / 2
                                  
                                  if (insulationPosition === 'internal') {
                                    return (
                                      <>
                                        <rect x={startX} y={centerY - halfHeight} width={insulationThickness} height={halfHeight * 2} fill="url(#flatInsulationGradient)" filter="url(#flatShadow)" />
                                        <rect x={startX + insulationThickness} y={centerY - halfHeight} width={pipeThickness} height={halfHeight * 2} fill="url(#flatPipeGradient)" filter="url(#flatShadow)" />
                                        <rect x={startX + insulationThickness + pipeThickness} y={centerY - halfHeight} width={fluidWidth} height={halfHeight * 2} fill="url(#flatFluidGradient)" filter="url(#flatShadow)" />
                                        <rect x={startX + insulationThickness + pipeThickness + fluidWidth} y={centerY - halfHeight - 5} width={3} height={halfHeight * 2 + 10} fill="#3498db" />
                                      </>
                                    )
                                  } else {
                                    return (
                                      <>
                                        <rect x={startX} y={centerY - halfHeight} width={fluidWidth} height={halfHeight * 2} fill="url(#flatFluidGradient)" filter="url(#flatShadow)" />
                                        <rect x={startX + fluidWidth} y={centerY - halfHeight} width={pipeThickness} height={halfHeight * 2} fill="url(#flatPipeGradient)" filter="url(#flatShadow)" />
                                        <rect x={startX + fluidWidth + pipeThickness} y={centerY - halfHeight} width={insulationThickness} height={halfHeight * 2} fill="url(#flatInsulationGradient)" filter="url(#flatShadow)" />
                                        <rect x={startX + fluidWidth + pipeThickness + insulationThickness} y={centerY - halfHeight - 5} width={3} height={halfHeight * 2 + 10} fill="#3498db" />
                                      </>
                                    )
                                  }
                                })()}
                              </svg>
                            )}
                          </div>
                          <div className="mt-3 flex justify-center gap-3 text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded bg-[#2c3e50]"></div>
                              <span className="text-[#555]">Fluid</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded bg-[#5d6d7e]"></div>
                              <span className="text-[#555]">Wall</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded bg-[#f0c419]"></div>
                              <span className="text-[#555]">Insulation</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded bg-[#3498db]"></div>
                              <span className="text-[#555]">Surface</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 flex items-start gap-3 mt-6">
                        <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                        <div className="text-sm">
                          <p className="font-semibold text-red-800">Material Temperature Limit Exceeded</p>
                          {result.warnings.map((w: string, i: number) => (
                            <p key={i} className="text-red-700 mt-1">• {w}</p>
                          ))}
                        </div>
                      </div>
                    )}
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
