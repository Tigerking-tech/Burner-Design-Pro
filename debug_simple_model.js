// 用简化对流模型验证 - 这是之前匹配率88%的模型
const SIGMA_SB = 5.670374419e-8

// 简化对流模型 (之前88%匹配率用的)
const hcSimple = (dM, tsC, taC, v) => {
  const dT = Math.abs(tsC - taC)
  if (v < 0.1) {
    return 1.32 * Math.pow(Math.max(dT / dM, 0.001), 0.25)
  } else {
    return 5.7 + 3.8 * v
  }
}

// 辐射换热系数（无气体吸收修正）
const hrRadiation = (epsilon, tsC, taC) => {
  const Ts = tsC + 273.15
  const Ta = taC + 273.15
  if (Math.abs(Ts - Ta) < 1e-6) {
    return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
  }
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
}

// 导热系数
const getK = (baseK, kCoeff, Tf, Ts) => {
  const T_mean = (Tf + Ts) / 2
  return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean
}

// 管道计算
const calcPipe = (D_mm, baseK, kCoeff, Tf, Ta, delta_mm, v, eps) => {
  const r1 = D_mm / 2 / 1000
  const r2 = r1 + delta_mm / 1000
  const D2 = 2 * r2

  let tsGuess = Ta + 0.5 * (Tf - Ta)
  let Ts = tsGuess, q_linear = 0

  for (let i = 0; i < 100; i++) {
    const k = getK(baseK, kCoeff, Tf, tsGuess)
    const hc = hcSimple(D2, tsGuess, Ta, v)
    const hr = hrRadiation(eps, tsGuess, Ta)
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

// 3E Plus数据
const data_150C = [
  { thickness: 15, Ts: 82.7, q: 65.93 },
  { thickness: 25, Ts: 61.5, q: 43.83 },
  { thickness: 40, Ts: 49.0, q: 31.58 },
  { thickness: 50, Ts: 44.3, q: 27.43 },
  { thickness: 65, Ts: 39.9, q: 23.63 },
  { thickness: 80, Ts: 37.0, q: 21.12 },
  { thickness: 100, Ts: 33.9, q: 18.84 },
  { thickness: 150, Ts: 29.9, q: 15.98 },
]

console.log('简化对流模型验证 (D=63.5mm, Tf=150°C, Ta=20°C, ε=0.9, v=0)')
console.log('baseK=0.032, kCoeff=9.4e-5')
console.log('='.repeat(100))
console.log('厚度(mm)  Ts_3E   Ts_我们  误差%   q_3E    q_我们   误差%')
console.log('-' .repeat(100))

let totalTsErr = 0, totalQErr = 0
for (const d of data_150C) {
  const r = calcPipe(63.5, 0.032, 9.4e-5, 150, 20, d.thickness, 0, 0.9)
  const tsErr = Math.abs(r.Ts - d.Ts) / d.Ts * 100
  const qErr = Math.abs(r.q_linear - d.q) / d.q * 100
  totalTsErr += tsErr
  totalQErr += qErr
  console.log(`${d.thickness.toString().padEnd(8)}  ${d.Ts.toFixed(1).padEnd(6)}  ${r.Ts.toFixed(1).padEnd(7)}  ${tsErr.toFixed(1).padEnd(5)}  ${d.q.toFixed(2).padEnd(7)}  ${r.q_linear.toFixed(2).padEnd(7)}  ${qErr.toFixed(1)}`)
}
console.log('-' .repeat(100))
console.log(`平均误差: Ts=${(totalTsErr/data_150C.length).toFixed(1)}%, q=${(totalQErr/data_150C.length).toFixed(1)}%`)
