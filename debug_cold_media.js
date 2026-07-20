const SIGMA_SB = 5.670374419e-8

const airProperties = (tMeanC) => {
  const kAir = 0.02421 + 7.8e-5 * tMeanC - 1.4e-8 * tMeanC * tMeanC
  const nu = 1.334e-5 + 9.0e-8 * tMeanC
  const alpha = 1.887e-5 + 1.26e-7 * tMeanC
  const Pr = 0.71
  const beta = 1.0 / (tMeanC + 273.15)
  return { kAir, nu, alpha, Pr, beta }
}

const getThermalConductivityTemp = (baseK, kCoeff, Tf, Ts) => {
  const T_mean = (Tf + Ts) / 2
  return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean
}

const hcCylinderASTM = (dM, tsC, taC, v) => {
  const tMean = (tsC + taC) / 2
  const { kAir, nu, alpha, Pr, beta } = airProperties(tMean)
  const d = Math.max(dM, 1e-3)
  const dT = Math.abs(tsC - taC)
  const Ra = dT > 1e-6 ? (9.81 * beta * dT * Math.pow(d, 3)) / (nu * alpha) : 0
  const NuNat = Ra > 0
    ? 0.36 + 0.518 * Math.pow(Ra, 0.25) / Math.pow(1 + Math.pow(0.559 / Pr, 0.5625), 0.45)
    : 0.36
  const Re = v * d / nu
  const NuFor = Re > 1e-3
    ? 0.3 + 0.62 * Math.pow(Re, 0.5) * Math.pow(Pr, 1 / 3)
        / Math.pow(1 + Math.pow(0.4 / Pr, 2 / 3), 0.25)
        * Math.pow(1 + 0.07 * Math.pow(Re, 0.6), 0.05)
    : 0
  const Nu = (NuNat + NuFor) > 0
    ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
    : 0.36
  return Math.max(Nu * kAir / d, 0.5)
}

const hrRadiation = (epsilon, tsC, taC) => {
  const Ts = tsC + 273.15
  const Ta = taC + 273.15
  if (Math.abs(Ts - Ta) < 1e-6) {
    return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
  }
  let hr = epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
  const tMeanC = (tsC + taC) / 2
  let gasAbsorptionFactor = 1.0
  if (tMeanC > 50) {
    const tempFactor = Math.min((tMeanC - 50) / 550, 1.0)
    gasAbsorptionFactor = 1.0 - 0.20 * tempFactor - 0.15 * tempFactor * tempFactor
  }
  if (tsC > 400) {
    const highTempFactor = (tsC - 400) / 400
    gasAbsorptionFactor *= (1.0 - 0.08 * Math.min(highTempFactor, 1.0))
  }
  return hr * gasAbsorptionFactor
}

const surfaceStatePipeSC = (D1_mm, baseK, kCoeff, Tf, Ta, delta_m, v, epsilon) => {
  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0
  let hc_val = 0, hr_val = 0, k_val = 0
  for (let i = 0; i < 50; i++) {
    const k = getThermalConductivityTemp(baseK, kCoeff, Tf, tsGuess)
    const outerD_m = (D1_mm / 1000) + 2 * delta_m
    const hc = hcCylinderASTM(outerD_m, tsGuess, Ta, v)
    const hr = hrRadiation(epsilon, tsGuess, Ta)
    const h = hc + hr
    const r_outer_pipe = D1_mm / 2000
    const r_outer_ins = r_outer_pipe + delta_m
    const R_ins = Math.log(r_outer_ins / r_outer_pipe) / (2 * Math.PI * k)
    const R_conv = 1 / (h * 2 * Math.PI * r_outer_ins)
    q_linear = (Tf - Ta) / (R_ins + R_conv)
    Ts = Ta + q_linear * R_conv
    hc_val = hc
    hr_val = hr
    k_val = k
    if (Math.abs(Ts - tsGuess) < 0.001) break
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
  return { Ts, q_linear, hc: hc_val, hr: hr_val, k: k_val }
}

const D_mm = 63.5
const baseK = 0.032
const kCoeff = 9.4e-5

console.log('='.repeat(100))
console.log('冷介质场景详细调试 (Tf=5°C, Ta=25°C, ε=0.9, v=0, D=63.5mm)')
console.log('='.repeat(100))

const coldCases = [
  { thickness: 25, e3plus_Ts: 18.5, e3plus_q: 18.2 },
  { thickness: 50, e3plus_Ts: 21.8, e3plus_q: 10.5 },
]

for (const tc of coldCases) {
  const result = surfaceStatePipeSC(D_mm, baseK, kCoeff, 5, 25, tc.thickness / 1000, 0, 0.9)
  console.log()
  console.log(`--- 厚度=${tc.thickness}mm ---`)
  console.log(`  表面温度 Ts: 本地=${result.Ts.toFixed(2)}°C, 3E+=${tc.e3plus_Ts}°C, 误差=${((result.Ts - tc.e3plus_Ts)/tc.e3plus_Ts*100).toFixed(2)}%`)
  console.log(`  热流 q: 本地=${Math.abs(result.q_linear).toFixed(2)} W/m, 3E+=${tc.e3plus_q} W/m, 误差=${((Math.abs(result.q_linear) - tc.e3plus_q)/tc.e3plus_q*100).toFixed(2)}%`)
  console.log(`  hc = ${result.hc.toFixed(3)} W/m²·K`)
  console.log(`  hr = ${result.hr.toFixed(3)} W/m²·K`)
  console.log(`  h = ${(result.hc + result.hr).toFixed(3)} W/m²·K`)
  console.log(`  k  = ${result.k.toFixed(4)} W/m·K (T_mean=${((5 + result.Ts)/2).toFixed(1)}°C)`)
  console.log()
  
  // 手动计算热阻
  const k = getThermalConductivityTemp(baseK, kCoeff, 5, result.Ts)
  const r_outer_pipe = D_mm / 2000
  const r_outer_ins = r_outer_pipe + tc.thickness / 1000
  const R_ins = Math.log(r_outer_ins / r_outer_pipe) / (2 * Math.PI * k)
  const h = result.hc + result.hr
  const R_conv = 1 / (h * 2 * Math.PI * r_outer_ins)
  console.log(`  R_ins  = ${R_ins.toFixed(4)} m·K/W`)
  console.log(`  R_conv = ${R_conv.toFixed(4)} m·K/W`)
  console.log(`  R_total = ${(R_ins + R_conv).toFixed(4)} m·K/W`)
  console.log(`  预期 q = (Ta-Tf)/R_total = ${(25-5)/(R_ins + R_conv).toFixed(4)} W/m`)
}

console.log()
console.log('='.repeat(100))
console.log('ε=0.1 冷介质场景 (3E Plus当前页面显示的数据)')
console.log('='.repeat(100))

const coldCasesEps01 = [
  { thickness: 15, e3plus_Ts: 19.2, e3plus_q: 7.13 },
  { thickness: 25, e3plus_Ts: 20.3, e3plus_q: 6.0 },
  { thickness: 50, e3plus_Ts: 22.5, e3plus_q: 3.95 },
  { thickness: 100, e3plus_Ts: 23.7, e3plus_q: 2.76 },
]

for (const tc of coldCasesEps01) {
  const result = surfaceStatePipeSC(D_mm, baseK, kCoeff, 5, 25, tc.thickness / 1000, 0, 0.1)
  const tsError = Math.abs(result.Ts - tc.e3plus_Ts) / tc.e3plus_Ts * 100
  const qError = Math.abs(Math.abs(result.q_linear) - tc.e3plus_q) / tc.e3plus_q * 100
  console.log(`  ${tc.thickness}mm: Ts=${result.Ts.toFixed(1)}°C (3E+=${tc.e3plus_Ts}, err=${tsError.toFixed(1)}%), q=${Math.abs(result.q_linear).toFixed(2)} W/m (3E+=${tc.e3plus_q}, err=${qError.toFixed(1)}%)`)
}

console.log()
console.log('='.repeat(100))
console.log('分析：冷介质场景的问题可能在于')
console.log('1. 辐射换热计算 - 当 Ts < Ta 时，hr 应该还是正值（从环境到表面）')
console.log('2. 自然对流方向 - 冷表面附近空气下沉，与热表面不同')
console.log('3. 导热系数温度修正 - 冷介质平均温度低')
console.log('='.repeat(100))
