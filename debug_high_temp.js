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

// 有气体吸收修正的辐射
const hrRadiationWithGas = (epsilon, tsC, taC) => {
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

// 无气体吸收修正的辐射（纯灰体）
const hrRadiationSimple = (epsilon, tsC, taC) => {
  const Ts = tsC + 273.15
  const Ta = taC + 273.15
  if (Math.abs(Ts - Ta) < 1e-6) {
    return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
  }
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
}

const surfaceStatePipeSC = (D1_mm, baseK, kCoeff, Tf, Ta, delta_m, v, epsilon, useGasCorrection = true) => {
  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0
  let hc_val = 0, hr_val = 0, k_val = 0
  for (let i = 0; i < 50; i++) {
    const k = getThermalConductivityTemp(baseK, kCoeff, Tf, tsGuess)
    const outerD_m = (D1_mm / 1000) + 2 * delta_m
    const hc = hcCylinderASTM(outerD_m, tsGuess, Ta, v)
    const hr = useGasCorrection 
      ? hrRadiationWithGas(epsilon, tsGuess, Ta)
      : hrRadiationSimple(epsilon, tsGuess, Ta)
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

console.log('='.repeat(120))
console.log('高温场景对比分析 (Tf=400°C, Ta=20°C, ε=0.9, v=0, D=63.5mm)')
console.log('='.repeat(120))

const highTempCases = [
  { thickness: 50, e3plus_Ts: 65.2, e3plus_q: 195.3 },
  { thickness: 100, e3plus_Ts: 42.1, e3plus_q: 102.8 },
]

console.log()
console.log('--- 有气体吸收修正 ---')
console.log()

for (const tc of highTempCases) {
  const result = surfaceStatePipeSC(D_mm, baseK, kCoeff, 400, 20, tc.thickness / 1000, 0, 0.9, true)
  const tsError = Math.abs(result.Ts - tc.e3plus_Ts) / tc.e3plus_Ts * 100
  const qError = Math.abs(result.q_linear - tc.e3plus_q) / tc.e3plus_q * 100
  console.log(`${tc.thickness}mm:`)
  console.log(`  Ts: 本地=${result.Ts.toFixed(1)}°C, 3E+=${tc.e3plus_Ts}°C, 误差=${tsError.toFixed(1)}%`)
  console.log(`  q:  本地=${result.q_linear.toFixed(1)} W/m, 3E+=${tc.e3plus_q} W/m, 误差=${qError.toFixed(1)}%`)
  console.log(`  hc=${result.hc.toFixed(2)}, hr=${result.hr.toFixed(2)}, h=${(result.hc+result.hr).toFixed(2)}`)
  console.log(`  k=${result.k.toFixed(4)} W/m·K`)
  console.log()
}

console.log('--- 无气体吸收修正（纯灰体辐射） ---')
console.log()

for (const tc of highTempCases) {
  const result = surfaceStatePipeSC(D_mm, baseK, kCoeff, 400, 20, tc.thickness / 1000, 0, 0.9, false)
  const tsError = Math.abs(result.Ts - tc.e3plus_Ts) / tc.e3plus_Ts * 100
  const qError = Math.abs(result.q_linear - tc.e3plus_q) / tc.e3plus_q * 100
  console.log(`${tc.thickness}mm:`)
  console.log(`  Ts: 本地=${result.Ts.toFixed(1)}°C, 3E+=${tc.e3plus_Ts}°C, 误差=${tsError.toFixed(1)}%`)
  console.log(`  q:  本地=${result.q_linear.toFixed(1)} W/m, 3E+=${tc.e3plus_q} W/m, 误差=${qError.toFixed(1)}%`)
  console.log(`  hc=${result.hc.toFixed(2)}, hr=${result.hr.toFixed(2)}, h=${(result.hc+result.hr).toFixed(2)}`)
  console.log(`  k=${result.k.toFixed(4)} W/m·K`)
  console.log()
}

console.log('='.repeat(120))
console.log('分析：')
console.log('  如果无气体吸收修正更接近3E Plus，说明我们的气体吸收修正方向反了')
console.log('  如果有气体吸收修正更接近，说明修正方向正确但幅值需要调整')
console.log()
console.log('  注意：对于热管道(Tf>Ta)，')
console.log('  hr越小 → 表面散热越弱 → Ts越高（越接近Tf）→ q越小')
console.log('  hr越大 → 表面散热越强 → Ts越低（越接近Ta）→ q越大')
console.log('='.repeat(120))
