// ========================================================================================================================
// 最终验证报告 - 使用3E Plus真实数据
// ========================================================================================================================

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

// ASTM完整对流模型
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

// 辐射换热系数（含气体吸收修正）
const hrRadiation = (epsilon, tsC, taC, useGasAbsorption = true) => {
  const Ts = tsC + 273.15
  const Ta = taC + 273.15
  if (Math.abs(Ts - Ta) < 1e-6) {
    return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
  }
  let hr = epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
  
  if (useGasAbsorption) {
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
  
  return hr
}

// 管道计算
const calcPipe = (D_mm, baseK, kCoeff, kQuad, Tf, Ta, delta_mm, v, eps) => {
  const r1 = D_mm / 2 / 1000
  const r2 = r1 + delta_mm / 1000
  const D2 = 2 * r2

  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0

  for (let i = 0; i < 200; i++) {
    const T_mean = (Tf + tsGuess) / 2
    const k = baseK + kCoeff * T_mean + kQuad * T_mean * T_mean
    const hc = hcASTM(D2, tsGuess, Ta, v)
    const hr = hrRadiation(eps, tsGuess, Ta, true)
    const h = hc + hr
    const R_ins = Math.log(r2 / r1) / (2 * Math.PI * k)
    const R_conv = 1 / (h * 2 * Math.PI * r2)
    q_linear = (Tf - Ta) / (R_ins + R_conv)
    Ts = Ta + q_linear * R_conv
    if (Math.abs(Ts - tsGuess) < 0.001) break
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
  return { Ts, q_linear: Math.abs(q_linear) }
}

// ========================================================================================================================
// 3E Plus真实数据
// ========================================================================================================================

const scenarios = [
  {
    name: '150°C 基础 (ε=0.9, v=0)',
    Tf: 150, Ta: 20, v: 0, eps: 0.9, D: 63.5,
    data: [
      { t: 15, Ts: 42.8, q: 76.11 },
      { t: 25, Ts: 37.3, q: 61.41 },
      { t: 40, Ts: 31.2, q: 45.59 },
      { t: 50, Ts: 28.2, q: 37.57 },
      { t: 65, Ts: 26.5, q: 32.90 },
      { t: 80, Ts: 25.3, q: 29.66 },
      { t: 100, Ts: 23.8, q: 25.20 },
      { t: 150, Ts: 22.4, q: 20.52 },
    ]
  },
  {
    name: '150°C 风速2m/s (ε=0.9, v=2)',
    Tf: 150, Ta: 20, v: 2, eps: 0.9, D: 63.5,
    data: [
      { t: 15, Ts: 31.9, q: 82.08 },
      { t: 25, Ts: 28.8, q: 64.99 },
      { t: 40, Ts: 25.5, q: 47.26 },
      { t: 50, Ts: 24.0, q: 38.56 },
      { t: 65, Ts: 23.2, q: 33.57 },
      { t: 80, Ts: 22.6, q: 30.15 },
      { t: 100, Ts: 21.9, q: 25.49 },
      { t: 150, Ts: 21.0, q: 20.76 },
    ]
  },
  {
    name: '冷介质 (Tf=5°C, Ta=25°C, ε=0.1, v=0)',
    Tf: 5, Ta: 25, v: 0, eps: 0.1, D: 63.5,
    data: [
      { t: 15, Ts: 19.2, q: 7.13 },
      { t: 25, Ts: 20.3, q: 6.00 },
      { t: 40, Ts: 21.7, q: 4.67 },
      { t: 50, Ts: 22.5, q: 3.95 },
      { t: 65, Ts: 22.9, q: 3.52 },
      { t: 80, Ts: 23.2, q: 3.20 },
      { t: 100, Ts: 23.7, q: 2.76 },
      { t: 150, Ts: 24.1, q: 2.28 },
    ]
  },
]

// ========================================================================================================================
// 生成报告
// ========================================================================================================================

const baseK = 0.032
const kCoeff = 9.4e-5
const kQuad = 5.6e-7

console.log('\n' + '='.repeat(120))
console.log('保温计算模块 3E Plus 交叉验证报告')
console.log('='.repeat(120))
console.log(`参数: baseK=${baseK}, kCoeff=${kCoeff.toExponential(2)}, kQuad=${kQuad.toExponential(2)}`)
console.log(`对流模型: ASTM C680 Churchill-Chu + Churchill-Bernstein`)
console.log(`辐射模型: Stefan-Boltzmann + 高温气体吸收修正`)
console.log('='.repeat(120))

let allTsErrors = []
let allQErrors = []

for (const s of scenarios) {
  console.log(`\n【${s.name}】`)
  console.log(`Tf=${s.Tf}°C, Ta=${s.Ta}°C, v=${s.v}m/s, ε=${s.eps}, D=${s.D}mm`)
  console.log(`${'-'.repeat(120)}`)
  console.log('厚度(mm)  Ts_3E   Ts_我们  Ts误差%  q_3E    q_我们  q误差%   状态')
  console.log(`${'-'.repeat(120)}`)

  for (const d of s.data) {
    const r = calcPipe(s.D, baseK, kCoeff, kQuad, s.Tf, s.Ta, d.t, s.v, s.eps)
    const tsErr = Math.abs(r.Ts - d.Ts) / d.Ts * 100
    const qErr = Math.abs(r.q_linear - d.q) / d.q * 100
    allTsErrors.push(tsErr)
    allQErrors.push(qErr)
    
    const ok = tsErr < 3 && qErr < 10 ? '✅' : (tsErr < 5 && qErr < 15 ? '⚠️' : '❌')
    console.log(
      `${d.t.toString().padEnd(8)}  ${d.Ts.toFixed(1).padEnd(6)}  ${r.Ts.toFixed(1).padEnd(7)}  ${tsErr.toFixed(1).padEnd(6)}  ${d.q.toFixed(2).padEnd(7)}  ${r.q_linear.toFixed(2).padEnd(7)}  ${qErr.toFixed(1).padEnd(6)} ${ok}`
    )
  }
}

const avgTs = allTsErrors.reduce((a, b) => a + b, 0) / allTsErrors.length
const avgQ = allQErrors.reduce((a, b) => a + b, 0) / allQErrors.length
const tsWithin3 = allTsErrors.filter(e => e < 3).length / allTsErrors.length * 100
const qWithin10 = allQErrors.filter(e => e < 10).length / allQErrors.length * 100

console.log('\n' + '='.repeat(120))
console.log('【汇总统计】')
console.log('='.repeat(120))
console.log(`总测试点数: ${allTsErrors.length}`)
console.log(`表面温度平均误差: ${avgTs.toFixed(2)}%`)
console.log(`热流平均误差: ${avgQ.toFixed(2)}%`)
console.log(`Ts误差<3%比例: ${tsWithin3.toFixed(1)}%`)
console.log(`q误差<10%比例: ${qWithin10.toFixed(1)}%`)
console.log('='.repeat(120))

// 评级
let grade = ''
let comment = ''
if (avgTs < 2 && avgQ < 5) {
  grade = 'A+'
  comment = '优秀！与3E Plus高度一致，完全满足工程计算精度要求。'
} else if (avgTs < 3 && avgQ < 8) {
  grade = 'A'
  comment = '良好！精度满足绝大多数工程应用需求。'
} else if (avgTs < 5 && avgQ < 12) {
  grade = 'B'
  comment = '合格！可用于初步设计和估算。'
} else {
  grade = 'C'
  comment = '需改进，建议进一步校准模型参数。'
}

console.log(`\n综合评级: ${grade}`)
console.log(`评价: ${comment}`)
console.log('='.repeat(120))
console.log('\n注: 验证数据来自3E Plus官方软件实测')
console.log('    测试场景覆盖: 常温/高温、自然对流/强制对流、热流正向/逆向')
console.log('')
