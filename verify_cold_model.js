// 验证冷介质场景 - 对比不同对流模型
const SIGMA_SB = 5.670374419e-8

// 空气物性
const airProperties = (tMeanC) => {
  const kAir = 0.02421 + 7.8e-5 * tMeanC - 1.4e-8 * tMeanC * tMeanC
  const nu = 1.334e-5 + 9.0e-8 * tMeanC
  const alpha = 1.887e-5 + 1.26e-7 * tMeanC
  const Pr = 0.71
  const beta = 1.0 / (tMeanC + 273.15)
  return { kAir, nu, alpha, Pr, beta }
}

// ASTM完整模型
const hcASTM = (dM, tsC, taC, v) => {
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

// 简化模型
const hcSimple = (dM, tsC, taC, v) => {
  const dT = Math.abs(tsC - taC)
  if (v < 0.1) {
    return 1.32 * Math.pow(Math.max(dT / dM, 0.001), 0.25)
  } else {
    return 5.7 + 3.8 * v
  }
}

// 辐射
const hr = (epsilon, tsC, taC) => {
  const Ts = tsC + 273.15
  const Ta = taC + 273.15
  if (Math.abs(Ts - Ta) < 1e-6) return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
}

// 管道计算
const calcPipe = (D_mm, baseK, kCoeff, Tf, Ta, delta_mm, v, eps, useASTM) => {
  const r1 = D_mm / 2 / 1000
  const r2 = r1 + delta_mm / 1000
  const D2 = 2 * r2

  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0

  for (let i = 0; i < 200; i++) {
    const T_mean = (Tf + tsGuess) / 2
    const k = baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean
    const hc = useASTM ? hcASTM(D2, tsGuess, Ta, v) : hcSimple(D2, tsGuess, Ta, v)
    const h = hc + hr(eps, tsGuess, Ta)
    const R_ins = Math.log(r2 / r1) / (2 * Math.PI * k)
    const R_conv = 1 / (h * 2 * Math.PI * r2)
    q_linear = (Tf - Ta) / (R_ins + R_conv)
    Ts = Ta + q_linear * R_conv
    if (Math.abs(Ts - tsGuess) < 0.001) break
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
  return { Ts, q_linear }
}

// 3E Plus冷介质ε=0.1数据（Tf=5°C, Ta=25°C, D=63.5mm）
const data_cold = [
  { thickness: 15, Ts: 19.2, q: 7.13 },
  { thickness: 25, Ts: 20.3, q: 6.0 },
  { thickness: 40, Ts: 21.7, q: 4.67 },
  { thickness: 50, Ts: 22.5, q: 3.95 },
  { thickness: 65, Ts: 22.9, q: 3.52 },
  { thickness: 80, Ts: 23.2, q: 3.2 },
  { thickness: 100, Ts: 23.5, q: 2.76 },
  { thickness: 150, Ts: 24.1, q: 2.28 },
]

console.log('冷介质ε=0.1场景验证 (Tf=5°C, Ta=25°C, D=63.5mm)')
console.log('='.repeat(120))

for (const useASTM of [false, true]) {
  console.log(`\n【${useASTM ? 'ASTM完整模型' : '简化模型'}】`)
  console.log(`${'-'.repeat(120)}`)
  console.log('厚度(mm)  Ts_3E   Ts_我们  Ts误差%  q_3E    q_我们  q误差%')
  console.log(`${'-'.repeat(120)}`)
  let totalTs = 0, totalQ = 0
  for (const d of data_cold) {
    const r = calcPipe(63.5, 0.032, 9.4e-5, 5, 25, d.thickness, 0, 0.1, useASTM)
    const tsErr = Math.abs(r.Ts - d.Ts) / d.Ts * 100
    const qErr = Math.abs(r.q_linear - d.q) / d.q * 100
    totalTs += tsErr
    totalQ += qErr
    console.log(`${d.thickness.toString().padEnd(8)}  ${d.Ts.toFixed(1).padEnd(6)}  ${r.Ts.toFixed(1).padEnd(7)}  ${tsErr.toFixed(1).padEnd(6)}  ${d.q.toFixed(2).padEnd(7)}  ${r.q_linear.toFixed(2).padEnd(7)}  ${qErr.toFixed(1)}`)
  }
  console.log(`${'-'.repeat(120)}`)
  console.log(`平均: Ts=${(totalTs/data_cold.length).toFixed(1)}%, q=${(totalQ/data_cold.length).toFixed(1)}%`)
}
