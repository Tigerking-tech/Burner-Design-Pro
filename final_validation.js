// ========================================================================================================================
// 最终验证和校准脚本 - 使用已确认的3E Plus实测数据
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

// 水平圆柱对流换热系数
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

// 辐射换热系数
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

// 导热系数随温度变化
const getThermalConductivityTemp = (baseK, kCoeff, Tf, Ts, kQuad = 5.6e-7) => {
  const T_mean = (Tf + Ts) / 2
  return baseK + kCoeff * T_mean + kQuad * T_mean * T_mean
}

// 计算表面温度和热流（圆筒壁，迭代求解）
const surfaceStatePipeSC = (D_mm, baseK, kCoeff, Tf, Ta, delta_m, v, eps, kQuad = 5.6e-7, useGasAbsorption = true) => {
  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0
  for (let i = 0; i < 50; i++) {
    const k = getThermalConductivityTemp(baseK, kCoeff, Tf, tsGuess, kQuad)
    const outerD_m = (D_mm / 1000) + 2 * delta_m
    const hc = hcCylinderASTM(outerD_m, tsGuess, Ta, v)
    const hr = hrRadiation(eps, tsGuess, Ta, useGasAbsorption)
    const h = hc + hr
    const r1 = D_mm / 2000
    const r2 = r1 + delta_m
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
// 已确认的3E Plus实测数据
// ========================================================================================================================

// 场景1：150°C基础系列（ε=0.9, v=0, 63.5mm管, 850F Mineral Wool）
const data_150C_eps09_v0 = [
  { thickness: 0.015, Ts: 82.7, q: 65.93 },
  { thickness: 0.025, Ts: 61.5, q: 43.83 },
  { thickness: 0.040, Ts: 49.0, q: 31.58 },
  { thickness: 0.050, Ts: 44.3, q: 27.43 },
  { thickness: 0.065, Ts: 39.9, q: 23.63 },
  { thickness: 0.080, Ts: 37.0, q: 21.12 },
  { thickness: 0.100, Ts: 33.9, q: 18.84 },
  { thickness: 0.150, Ts: 29.9, q: 15.98 },
]

// 场景2：150°C风速2m/s系列（ε=0.9, v=2, 63.5mm管, 850F Mineral Wool）
const data_150C_eps09_v2 = [
  { thickness: 0.015, Ts: 57.9, q: 112.45 },
  { thickness: 0.025, Ts: 47.2, q: 83.82 },
  { thickness: 0.040, Ts: 39.9, q: 64.78 },
  { thickness: 0.050, Ts: 37.0, q: 57.87 },
  { thickness: 0.065, Ts: 34.2, q: 51.72 },
  { thickness: 0.080, Ts: 32.3, q: 47.55 },
  { thickness: 0.100, Ts: 30.3, q: 43.65 },
  { thickness: 0.150, Ts: 27.6, q: 38.72 },
]

// 场景3：冷介质ε=0.1系列（Tf=5°C, Ta=25°C, ε=0.1, v=0, 63.5mm管, 850F Mineral Wool）
const data_cold_eps01 = [
  { thickness: 0.015, Ts: 23.6, q: 5.47 },
  { thickness: 0.025, Ts: 22.9, q: 4.10 },
  { thickness: 0.040, Ts: 22.0, q: 2.86 },
  { thickness: 0.050, Ts: 21.6, q: 2.35 },
  { thickness: 0.065, Ts: 21.1, q: 1.87 },
  { thickness: 0.080, Ts: 20.8, q: 1.55 },
  { thickness: 0.100, Ts: 20.5, q: 1.27 },
  { thickness: 0.150, Ts: 20.2, q: 0.89 },
]

// ========================================================================================================================
// 验证函数
// ========================================================================================================================

function validateScenario(name, data, Tf, Ta, v, eps, baseK, kCoeff, kQuad, useGasAbsorption) {
  console.log(`\n${'='.repeat(120)}`)
  console.log(`场景: ${name}`)
  console.log(`${'='.repeat(120)}`)
  console.log(`Tf=${Tf}°C, Ta=${Ta}°C, v=${v}m/s, ε=${eps}, D=63.5mm`)
  console.log(`参数: baseK=${baseK}, kCoeff=${kCoeff.toExponential(2)}, kQuad=${kQuad.toExponential(2)}, gasAbsorption=${useGasAbsorption}`)
  console.log(`-${'-'.repeat(118)}-`)
  console.log(`厚度(mm)    Ts_3E(°C)  Ts_我们(°C)  Ts误差%   q_3E(W/m)   q_我们(W/m)  q误差%`)
  console.log(`-${'-'.repeat(118)}-`)

  let totalTsError = 0
  let totalQError = 0

  for (const d of data) {
    const result = surfaceStatePipeSC(63.5, baseK, kCoeff, Tf, Ta, d.thickness, v, eps, kQuad, useGasAbsorption)
    const tsError = Math.abs(result.Ts - d.Ts) / d.Ts * 100
    const qError = Math.abs(result.q_linear - d.q) / d.q * 100
    totalTsError += tsError
    totalQError += qError

    const tsOk = tsError < 2 ? '✓' : (tsError < 5 ? '~' : '✗')
    const qOk = qError < 2 ? '✓' : (qError < 5 ? '~' : '✗')

    console.log(`${(d.thickness*1000).toString().padEnd(10)}  ${d.Ts.toFixed(1).padEnd(10)}  ${result.Ts.toFixed(1).padEnd(11)}  ${tsError.toFixed(1).padEnd(6)}${tsOk}  ${d.q.toFixed(2).padEnd(11)}  ${result.q_linear.toFixed(2).padEnd(11)}  ${qError.toFixed(1).padEnd(5)}${qOk}`)
  }

  const avgTsError = totalTsError / data.length
  const avgQError = totalQError / data.length
  console.log(`-${'-'.repeat(118)}-`)
  console.log(`平均误差: Ts=${avgTsError.toFixed(2)}%, q=${avgQError.toFixed(2)}%`)

  return { avgTsError, avgQError }
}

// ========================================================================================================================
// 主程序
// ========================================================================================================================

console.log('\n' + '='.repeat(120))
console.log('最终验证报告 - 使用3E Plus实测数据')
console.log('='.repeat(120))

// 当前默认参数
const defaultBaseK = 0.032
const defaultKCoeff = 9.4e-5
const defaultKQuad = 5.6e-7

console.log('\n【当前默认参数验证】')
console.log(`baseK=${defaultBaseK}, kCoeff=${defaultKCoeff.toExponential(2)}, kQuad=${defaultKQuad.toExponential(2)}`)

const r1 = validateScenario(
  '150°C基础系列 (ε=0.9, v=0)',
  data_150C_eps09_v0, 150, 20, 0, 0.9,
  defaultBaseK, defaultKCoeff, defaultKQuad, true
)

const r2 = validateScenario(
  '150°C风速2m/s系列 (ε=0.9, v=2)',
  data_150C_eps09_v2, 150, 20, 2, 0.9,
  defaultBaseK, defaultKCoeff, defaultKQuad, true
)

const r3 = validateScenario(
  '冷介质ε=0.1系列 (Tf=5°C, Ta=25°C)',
  data_cold_eps01, 5, 25, 0, 0.1,
  defaultBaseK, defaultKCoeff, defaultKQuad, true
)

// 整体评估
const overallTsError = (r1.avgTsError + r2.avgTsError + r3.avgTsError) / 3
const overallQError = (r1.avgQError + r2.avgQError + r3.avgQError) / 3

console.log('\n' + '='.repeat(120))
console.log('【整体评估】')
console.log(`平均 Ts 误差: ${overallTsError.toFixed(2)}%`)
console.log(`平均 q 误差: ${overallQError.toFixed(2)}%`)
console.log(`综合评分: ${(100 - (overallTsError + overallQError) / 2).toFixed(1)} / 100`)
console.log('='.repeat(120))

// ========================================================================================================================
// 参数优化：寻找最优的kCoeff和kQuad
// ========================================================================================================================

console.log('\n\n' + '='.repeat(120))
console.log('参数优化：寻找最优导热系数参数')
console.log('='.repeat(120))

let bestParams = null
let bestScore = Infinity

console.log('\n测试参数组合...\n')

const baseKValues = [0.030, 0.031, 0.032, 0.033, 0.034]
const kCoeffValues = [7e-5, 8e-5, 9e-5, 9.4e-5, 1e-4, 1.1e-4, 1.2e-4]
const kQuadValues = [0, 2e-7, 4e-7, 5.6e-7, 8e-7, 1e-6]
const useGasAbsorptionValues = [true, false]

let tested = 0

for (const baseK of baseKValues) {
  for (const kCoeff of kCoeffValues) {
    for (const kQuad of kQuadValues) {
      for (const useGA of useGasAbsorptionValues) {
        tested++

        // 计算三个场景的平均误差
        const calcError = (data, Tf, Ta, v, eps) => {
          let totalTs = 0, totalQ = 0
          for (const d of data) {
            const r = surfaceStatePipeSC(63.5, baseK, kCoeff, Tf, Ta, d.thickness, v, eps, kQuad, useGA)
            totalTs += Math.abs(r.Ts - d.Ts) / d.Ts
            totalQ += Math.abs(r.q_linear - d.q) / d.q
          }
          return { ts: totalTs / data.length * 100, q: totalQ / data.length * 100 }
        }

        const e1 = calcError(data_150C_eps09_v0, 150, 20, 0, 0.9)
        const e2 = calcError(data_150C_eps09_v2, 150, 20, 2, 0.9)
        const e3 = calcError(data_cold_eps01, 5, 25, 0, 0.1)

        const avgTs = (e1.ts + e2.ts + e3.ts) / 3
        const avgQ = (e1.q + e2.q + e3.q) / 3
        const score = avgTs + avgQ

        if (score < bestScore) {
          bestScore = score
          bestParams = { baseK, kCoeff, kQuad, useGasAbsorption: useGA, avgTs, avgQ, e1, e2, e3 }
        }
      }
    }
  }
}

console.log(`测试了 ${tested} 种参数组合`)
console.log('\n最优参数:')
console.log(`  baseK = ${bestParams.baseK}`)
console.log(`  kCoeff = ${bestParams.kCoeff.toExponential(2)}`)
console.log(`  kQuad = ${bestParams.kQuad.toExponential(2)}`)
console.log(`  气体吸收修正 = ${bestParams.useGasAbsorption}`)
console.log(`  平均 Ts 误差 = ${bestParams.avgTs.toFixed(2)}%`)
console.log(`  平均 q 误差 = ${bestParams.avgQ.toFixed(2)}%`)
console.log(`  综合得分 = ${(100 - bestScore / 2).toFixed(1)} / 100`)

// 用最优参数重新验证
console.log('\n\n' + '='.repeat(120))
console.log('【最优参数验证详情】')
console.log('='.repeat(120))

validateScenario(
  '150°C基础系列 (ε=0.9, v=0)',
  data_150C_eps09_v0, 150, 20, 0, 0.9,
  bestParams.baseK, bestParams.kCoeff, bestParams.kQuad, bestParams.useGasAbsorption
)

validateScenario(
  '150°C风速2m/s系列 (ε=0.9, v=2)',
  data_150C_eps09_v2, 150, 20, 2, 0.9,
  bestParams.baseK, bestParams.kCoeff, bestParams.kQuad, bestParams.useGasAbsorption
)

validateScenario(
  '冷介质ε=0.1系列 (Tf=5°C, Ta=25°C)',
  data_cold_eps01, 5, 25, 0, 0.1,
  bestParams.baseK, bestParams.kCoeff, bestParams.kQuad, bestParams.useGasAbsorption
)

console.log('\n' + '='.repeat(120))
console.log('验证完成')
console.log('='.repeat(120))
