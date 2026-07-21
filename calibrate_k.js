const SIGMA_SB = 5.670374419e-8

const airProperties = (tMeanC) => {
  const kAir = 0.02421 + 7.8e-5 * tMeanC - 1.4e-8 * tMeanC * tMeanC
  const nu = 1.334e-5 + 9.0e-8 * tMeanC
  const alpha = 1.887e-5 + 1.26e-7 * tMeanC
  const Pr = 0.71
  const beta = 1.0 / (tMeanC + 273.15)
  return { kAir, nu, alpha, Pr, beta }
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
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
}

const surfaceStatePipeSC = (D1_mm, baseK, kCoeff, kQuad, Tf, Ta, delta_m, v, epsilon) => {
  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0
  for (let i = 0; i < 50; i++) {
    const T_mean = (Tf + tsGuess) / 2
    const k = baseK + kCoeff * T_mean + kQuad * T_mean * T_mean
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
    if (Math.abs(Ts - tsGuess) < 0.001) break
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
  return { Ts, q_linear }
}

const D_mm = 63.5
const Tf = 400
const Ta = 20

console.log('='.repeat(120))
console.log('导热系数参数校准 (Tf=400°C, Ta=20°C, ε=0.9, v=0)')
console.log('='.repeat(120))
console.log()

const e3plus_50mm = { Ts: 65.2, q: 195.3 }
const e3plus_100mm = { Ts: 42.1, q: 102.8 }

// 测试不同的kCoeff和kQuad组合
const testCases = [
  { name: '原始 (9.4e-5, 5.6e-7)', kCoeff: 9.4e-5, kQuad: 5.6e-7 },
  { name: 'kCoeff=1.2e-4', kCoeff: 1.2e-4, kQuad: 5.6e-7 },
  { name: 'kCoeff=1.5e-4', kCoeff: 1.5e-4, kQuad: 5.6e-7 },
  { name: 'kCoeff=1.8e-4', kCoeff: 1.8e-4, kQuad: 5.6e-7 },
  { name: 'kCoeff=2.0e-4', kCoeff: 2.0e-4, kQuad: 5.6e-7 },
  { name: 'kQuad=1e-6', kCoeff: 9.4e-5, kQuad: 1e-6 },
  { name: 'kQuad=2e-6', kCoeff: 9.4e-5, kQuad: 2e-6 },
  { name: 'kQuad=3e-6', kCoeff: 9.4e-5, kQuad: 3e-6 },
  { name: 'kCoeff=1.5e-4, kQuad=1e-6', kCoeff: 1.5e-4, kQuad: 1e-6 },
  { name: 'kCoeff=1.2e-4, kQuad=1.5e-6', kCoeff: 1.2e-4, kQuad: 1.5e-6 },
]

console.log('50mm保温:')
console.log(`${'参数组合'.padEnd(30)} ${'Ts(本地)'.padEnd(12)} ${'Ts误差%'.padEnd(12)} ${'q(本地)'.padEnd(12)} ${'q误差%'.padEnd(12)}`)
console.log('-'.repeat(80))
for (const tc of testCases) {
  const result = surfaceStatePipeSC(D_mm, 0.032, tc.kCoeff, tc.kQuad, Tf, Ta, 0.05, 0, 0.9)
  const tsErr = Math.abs(result.Ts - e3plus_50mm.Ts) / e3plus_50mm.Ts * 100
  const qErr = Math.abs(result.q_linear - e3plus_50mm.q) / e3plus_50mm.q * 100
  console.log(`${tc.name.padEnd(30)} ${result.Ts.toFixed(2).padEnd(12)} ${tsErr.toFixed(2).padEnd(12)} ${result.q_linear.toFixed(1).padEnd(12)} ${qErr.toFixed(2)}`)
}

console.log()
console.log('100mm保温:')
console.log(`${'参数组合'.padEnd(30)} ${'Ts(本地)'.padEnd(12)} ${'Ts误差%'.padEnd(12)} ${'q(本地)'.padEnd(12)} ${'q误差%'.padEnd(12)}`)
console.log('-'.repeat(80))
for (const tc of testCases) {
  const result = surfaceStatePipeSC(D_mm, 0.032, tc.kCoeff, tc.kQuad, Tf, Ta, 0.10, 0, 0.9)
  const tsErr = Math.abs(result.Ts - e3plus_100mm.Ts) / e3plus_100mm.Ts * 100
  const qErr = Math.abs(result.q_linear - e3plus_100mm.q) / e3plus_100mm.q * 100
  console.log(`${tc.name.padEnd(30)} ${result.Ts.toFixed(2).padEnd(12)} ${tsErr.toFixed(2).padEnd(12)} ${result.q_linear.toFixed(1).padEnd(12)} ${qErr.toFixed(2)}`)
}

console.log()
console.log('分析：')
console.log('  我们的Ts偏低、q偏低 → 说明我们的保温层热阻偏大')
console.log('  → 说明我们的导热系数k偏小')
console.log('  → 需要增大kCoeff或kQuad来提高高温下的导热系数')
console.log()
console.log('  注意：同时还要保证150°C场景的准确度')
