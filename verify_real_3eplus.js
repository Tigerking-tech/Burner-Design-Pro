// ========================================================================================================================
// 真实3E Plus数据验证
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

// 简化对流模型
const hcSimple = (dM, tsC, taC, v) => {
  const dT = Math.abs(tsC - taC)
  if (v < 0.1) {
    return 1.32 * Math.pow(Math.max(dT / dM, 0.001), 0.25)
  } else {
    return 5.7 + 3.8 * v
  }
}

// 辐射换热系数
const hrRadiation = (epsilon, tsC, taC, useGasAbsorption = false) => {
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

// 管道计算（迭代求解）
const calcPipe = (D_mm, baseK, kCoeff, kQuad, Tf, Ta, delta_mm, v, eps, useASTM, useGasAbs) => {
  const r1 = D_mm / 2 / 1000
  const r2 = r1 + delta_mm / 1000
  const D2 = 2 * r2

  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0

  for (let i = 0; i < 200; i++) {
    const T_mean = (Tf + tsGuess) / 2
    const k = baseK + kCoeff * T_mean + kQuad * T_mean * T_mean
    const hc = useASTM ? hcASTM(D2, tsGuess, Ta, v) : hcSimple(D2, tsGuess, Ta, v)
    const hr = hrRadiation(eps, tsGuess, Ta, useGasAbs)
    const h = hc + hr
    const R_ins = Math.log(r2 / r1) / (2 * Math.PI * k)
    const R_conv = 1 / (h * 2 * Math.PI * r2)
    q_linear = (Tf - Ta) / (R_ins + R_conv)
    Ts = Ta + q_linear * R_conv
    if (Math.abs(Ts - tsGuess) < 0.001) break
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
  return { Ts, q_linear }
}

// ========================================================================================================================
// 3E Plus真实数据
// ========================================================================================================================

// 场景1：150°C, ε=0.9, v=0, D=63.5mm, 850F Mineral Wool
const data_150C_eps09_v0 = [
  { thickness: 15, Ts: 42.8, q: 76.11 },
  { thickness: 25, Ts: 37.3, q: 61.41 },
  { thickness: 40, Ts: 31.2, q: 45.59 },
  { thickness: 50, Ts: 28.2, q: 37.57 },
  { thickness: 65, Ts: 26.5, q: 32.90 },
  { thickness: 80, Ts: 25.3, q: 29.66 },
  { thickness: 100, Ts: 23.8, q: 25.20 },
  { thickness: 150, Ts: 22.4, q: 20.52 },
]

// 场景2：冷介质ε=0.1, Tf=5°C, Ta=25°C, v=0, D=63.5mm
const data_cold_eps01 = [
  { thickness: 15, Ts: 19.2, q: 7.13 },
  { thickness: 25, Ts: 20.3, q: 6.00 },
  { thickness: 40, Ts: 21.7, q: 4.67 },
  { thickness: 50, Ts: 22.5, q: 3.95 },
  { thickness: 65, Ts: 22.9, q: 3.52 },
  { thickness: 80, Ts: 23.2, q: 3.20 },
  { thickness: 100, Ts: 23.7, q: 2.76 },
  { thickness: 150, Ts: 24.1, q: 2.28 },
]

// ========================================================================================================================
// 验证函数
// ========================================================================================================================

function validate(name, data, Tf, Ta, v, eps, baseK, kCoeff, kQuad, useASTM, useGasAbs) {
  console.log(`\n${'='.repeat(120)}`)
  console.log(`场景: ${name}`)
  console.log(`Tf=${Tf}°C, Ta=${Ta}°C, v=${v}m/s, ε=${eps}, D=63.5mm`)
  console.log(`模型: ${useASTM ? 'ASTM完整对流' : '简化对流'}, 气体吸收: ${useGasAbs ? '开' : '关'}`)
  console.log(`参数: baseK=${baseK}, kCoeff=${kCoeff.toExponential(2)}, kQuad=${kQuad.toExponential(2)}`)
  console.log(`${'-'.repeat(120)}`)
  console.log('厚度(mm)  Ts_3E   Ts_我们  Ts误差%  q_3E    q_我们  q误差%')
  console.log(`${'-'.repeat(120)}`)

  let totalTs = 0, totalQ = 0
  for (const d of data) {
    const r = calcPipe(63.5, baseK, kCoeff, kQuad, Tf, Ta, d.thickness, v, eps, useASTM, useGasAbs)
    const tsErr = Math.abs(r.Ts - d.Ts) / d.Ts * 100
    const qErr = Math.abs(r.q_linear - d.q) / d.q * 100
    totalTs += tsErr
    totalQ += qErr
    const tsOk = tsErr < 2 ? '✓' : (tsErr < 5 ? '~' : '✗')
    const qOk = qErr < 5 ? '✓' : (qErr < 10 ? '~' : '✗')
    console.log(`${d.thickness.toString().padEnd(8)}  ${d.Ts.toFixed(1).padEnd(6)}  ${r.Ts.toFixed(1).padEnd(7)}  ${tsErr.toFixed(1).padEnd(5)}${tsOk}  ${d.q.toFixed(2).padEnd(7)}  ${r.q_linear.toFixed(2).padEnd(7)}  ${qErr.toFixed(1).padEnd(5)}${qOk}`)
  }

  const avgTs = totalTs / data.length
  const avgQ = totalQ / data.length
  console.log(`${'-'.repeat(120)}`)
  console.log(`平均误差: Ts=${avgTs.toFixed(2)}%, q=${avgQ.toFixed(2)}%`)
  return { avgTs, avgQ }
}

// ========================================================================================================================
// 主程序
// ========================================================================================================================

console.log('\n' + '='.repeat(120))
console.log('3E Plus真实数据验证报告')
console.log('='.repeat(120))

// 默认参数验证
const baseK = 0.032
const kCoeff = 9.4e-5
const kQuad = 5.6e-7

console.log('\n【当前默认参数验证 - ASTM模型】')
const r1 = validate('150°C ε=0.9 v=0', data_150C_eps09_v0, 150, 20, 0, 0.9, baseK, kCoeff, kQuad, true, true)
const r2 = validate('冷介质 ε=0.1 v=0', data_cold_eps01, 5, 25, 0, 0.1, baseK, kCoeff, kQuad, true, true)

const overall = (r1.avgTs + r1.avgQ + r2.avgTs + r2.avgQ) / 4
console.log('\n' + '='.repeat(120))
console.log(`综合平均误差: ${overall.toFixed(2)}%`)
console.log('='.repeat(120))

// ========================================================================================================================
// 参数优化
// ========================================================================================================================

console.log('\n\n' + '='.repeat(120))
console.log('参数优化 - 寻找最优导热系数参数')
console.log('='.repeat(120))

let bestScore = Infinity
let bestParams = null

const baseKValues = [0.030, 0.031, 0.032, 0.033, 0.034, 0.035, 0.036, 0.038, 0.040]
const kCoeffValues = [5e-5, 6e-5, 7e-5, 8e-5, 9e-5, 9.4e-5, 1e-4, 1.2e-4, 1.5e-4]
const kQuadValues = [0, 2e-7, 4e-7, 5.6e-7, 8e-7, 1e-6, 1.5e-6, 2e-6]
const useGasValues = [true, false]

const allData = [
  { data: data_150C_eps09_v0, Tf: 150, Ta: 20, v: 0, eps: 0.9 },
  { data: data_cold_eps01, Tf: 5, Ta: 25, v: 0, eps: 0.1 },
]

for (const bk of baseKValues) {
  for (const kc of kCoeffValues) {
    for (const kq of kQuadValues) {
      for (const gas of useGasValues) {
        let totalErr = 0
        for (const s of allData) {
          let tsErr = 0, qErr = 0
          for (const d of s.data) {
            const r = calcPipe(63.5, bk, kc, kq, s.Tf, s.Ta, d.thickness, s.v, s.eps, true, gas)
            tsErr += Math.abs(r.Ts - d.Ts) / d.Ts
            qErr += Math.abs(r.q_linear - d.q) / d.q
          }
          totalErr += tsErr / s.data.length + qErr / s.data.length
        }
        totalErr /= allData.length * 2 // 平均每个场景的Ts和q误差
        
        if (totalErr < bestScore) {
          bestScore = totalErr
          bestParams = { baseK: bk, kCoeff: kc, kQuad: kq, useGasAbs: gas, score: totalErr * 100 }
        }
      }
    }
  }
}

console.log(`\n最优参数 (ASTM对流模型):`)
console.log(`  baseK = ${bestParams.baseK}`)
console.log(`  kCoeff = ${bestParams.kCoeff.toExponential(2)}`)
console.log(`  kQuad = ${bestParams.kQuad.toExponential(2)}`)
console.log(`  气体吸收修正 = ${bestParams.useGasAbs}`)
console.log(`  综合误差 = ${bestParams.score.toFixed(2)}%`)

// 用最优参数验证
console.log('\n\n' + '='.repeat(120))
console.log('【最优参数验证详情】')
console.log('='.repeat(120))

validate('150°C ε=0.9 v=0', data_150C_eps09_v0, 150, 20, 0, 0.9, 
  bestParams.baseK, bestParams.kCoeff, bestParams.kQuad, true, bestParams.useGasAbs)

validate('冷介质 ε=0.1 v=0', data_cold_eps01, 5, 25, 0, 0.1,
  bestParams.baseK, bestParams.kCoeff, bestParams.kQuad, true, bestParams.useGasAbs)

console.log('\n' + '='.repeat(120))
console.log('验证完成')
console.log('='.repeat(120))
