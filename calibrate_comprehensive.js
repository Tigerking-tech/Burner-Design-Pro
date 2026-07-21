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

// 150°C验证数据（已确认匹配良好）
const data150C = [
  { thickness: 0.015, Ts: 42.8, q: 76.11 },
  { thickness: 0.025, Ts: 37.3, q: 61.41 },
  { thickness: 0.050, Ts: 28.2, q: 37.57 },
  { thickness: 0.100, Ts: 23.8, q: 25.2 },
]

// 400°C数据（待验证）
const data400C = [
  { thickness: 0.050, Ts: 65.2, q: 195.3 },
  { thickness: 0.100, Ts: 42.1, q: 102.8 },
]

function calculateError(baseK, kCoeff, kQuad, Tf, Ta, v, eps, data) {
  let totalTsError = 0
  let totalQError = 0
  for (const d of data) {
    const result = surfaceStatePipeSC(D_mm, baseK, kCoeff, kQuad, Tf, Ta, d.thickness, v, eps)
    totalTsError += Math.abs(result.Ts - d.Ts) / d.Ts
    totalQError += Math.abs(result.q_linear - d.q) / d.q
  }
  return { avgTsError: totalTsError / data.length * 100, avgQError: totalQError / data.length * 100 }
}

console.log('='.repeat(120))
console.log('综合校准：同时匹配150°C和400°C场景')
console.log('='.repeat(120))
console.log()

const testParams = [
  { name: '原始参数', baseK: 0.032, kCoeff: 9.4e-5, kQuad: 5.6e-7 },
  { name: 'kCoeff=1.0e-4', baseK: 0.032, kCoeff: 1.0e-4, kQuad: 5.6e-7 },
  { name: 'kCoeff=1.1e-4', baseK: 0.032, kCoeff: 1.1e-4, kQuad: 5.6e-7 },
  { name: 'kCoeff=1.2e-4', baseK: 0.032, kCoeff: 1.2e-4, kQuad: 5.6e-7 },
  { name: 'kQuad=8e-7', baseK: 0.032, kCoeff: 9.4e-5, kQuad: 8e-7 },
  { name: 'kQuad=1e-6', baseK: 0.032, kCoeff: 9.4e-5, kQuad: 1e-6 },
  { name: 'kQuad=1.2e-6', baseK: 0.032, kCoeff: 9.4e-5, kQuad: 1.2e-6 },
  { name: 'kCoeff=1e-4, kQuad=8e-7', baseK: 0.032, kCoeff: 1e-4, kQuad: 8e-7 },
  { name: 'baseK=0.033', baseK: 0.033, kCoeff: 9.4e-5, kQuad: 5.6e-7 },
  { name: 'baseK=0.034', baseK: 0.034, kCoeff: 9.4e-5, kQuad: 5.6e-7 },
]

console.log(`${'参数组合'.padEnd(25)} ${'150°C Ts误差%'.padEnd(18)} ${'150°C q误差%'.padEnd(18)} ${'400°C Ts误差%'.padEnd(18)} ${'400°C q误差%'.padEnd(18)}`)
console.log('-'.repeat(100))

for (const p of testParams) {
  const err150 = calculateError(p.baseK, p.kCoeff, p.kQuad, 150, 20, 0, 0.9, data150C)
  const err400 = calculateError(p.baseK, p.kCoeff, p.kQuad, 400, 20, 0, 0.9, data400C)
  console.log(`${p.name.padEnd(25)} ${err150.avgTsError.toFixed(2).padEnd(18)} ${err150.avgQError.toFixed(2).padEnd(18)} ${err400.avgTsError.toFixed(2).padEnd(18)} ${err400.avgQError.toFixed(2)}`)
}

console.log()
console.log('注意：400°C的数据还需在3E Plus上验证确认')
