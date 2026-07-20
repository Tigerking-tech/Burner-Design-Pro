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
    if (Math.abs(Ts - tsGuess) < 0.001) break
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
  return { Ts, q_linear }
}

const materialProps = {
  mineralwool: { k: 0.032, kCoeff: 9.4e-5, name: 'Mineral Wool 850F' }
}

const allTestCases = [
  {
    group: '基础厚度系列 (ε=0.9, v=0, Ta=20°C, Tf=150°C)',
    cases: [
      { name: 'Bare管', thickness_mm: 0, e3plus_Ts: 149.9, e3plus_q: 441.71 },
      { name: '15mm', thickness_mm: 15, e3plus_Ts: 42.8, e3plus_q: 76.11 },
      { name: '25mm', thickness_mm: 25, e3plus_Ts: 37.3, e3plus_q: 61.41 },
      { name: '40mm', thickness_mm: 40, e3plus_Ts: 31.2, e3plus_q: 45.59 },
      { name: '50mm', thickness_mm: 50, e3plus_Ts: 28.2, e3plus_q: 37.57 },
      { name: '80mm', thickness_mm: 80, e3plus_Ts: 25.3, e3plus_q: 29.66 },
      { name: '100mm', thickness_mm: 100, e3plus_Ts: 23.8, e3plus_q: 25.2 },
    ]
  },
  {
    group: '低发射率 (ε=0.1, v=0, Ta=20°C, Tf=150°C)',
    cases: [
      { name: '15mm ε=0.1', thickness_mm: 15, e3plus_Ts: 55.9, e3plus_q: 68.55, epsilon: 0.1 },
      { name: '25mm ε=0.1', thickness_mm: 25, e3plus_Ts: 48.3, e3plus_q: 56.58, epsilon: 0.1 },
      { name: '50mm ε=0.1', thickness_mm: 50, e3plus_Ts: 35.0, e3plus_q: 35.94, epsilon: 0.1 },
      { name: '100mm ε=0.1', thickness_mm: 100, e3plus_Ts: 27.8, e3plus_q: 24.58, epsilon: 0.1 },
    ]
  },
  {
    group: '风速2m/s (ε=0.9, v=2, Ta=20°C, Tf=150°C)',
    cases: [
      { name: 'Bare管 2m/s', thickness_mm: 0, e3plus_Ts: 149.9, e3plus_q: 752.01, v: 2 },
      { name: '15mm 2m/s', thickness_mm: 15, e3plus_Ts: 31.9, e3plus_q: 82.08, v: 2 },
      { name: '25mm 2m/s', thickness_mm: 25, e3plus_Ts: 28.8, e3plus_q: 64.99, v: 2 },
      { name: '50mm 2m/s', thickness_mm: 50, e3plus_Ts: 24.0, e3plus_q: 38.56, v: 2 },
      { name: '100mm 2m/s', thickness_mm: 100, e3plus_Ts: 21.9, e3plus_q: 25.49, v: 2 },
    ]
  },
  {
    group: '冷介质场景 (ε=0.9, v=0, Ta=25°C, Tf=5°C)',
    cases: [
      { name: '25mm 冷介质', thickness_mm: 25, e3plus_Ts: 18.5, e3plus_q: 18.2, Tf: 5, Ta: 25 },
      { name: '50mm 冷介质', thickness_mm: 50, e3plus_Ts: 21.8, e3plus_q: 10.5, Tf: 5, Ta: 25 },
    ]
  },
  {
    group: '高温场景 (ε=0.9, v=0, Ta=20°C, Tf=400°C)',
    cases: [
      { name: '50mm 400°C', thickness_mm: 50, e3plus_Ts: 65.2, e3plus_q: 195.3, Tf: 400, Ta: 20 },
      { name: '100mm 400°C', thickness_mm: 100, e3plus_Ts: 42.1, e3plus_q: 102.8, Tf: 400, Ta: 20 },
    ]
  }
]

const D_mm = 63.5
const mat = materialProps['mineralwool']

console.log('='.repeat(120))
console.log('3E Plus 实测 vs 本地计算 全面验证报告 (与前端代码一致)')
console.log('管道外径: 63.5mm | 材料: 850F Mineral Wool')
console.log('='.repeat(120))
console.log()

let totalTsPass = 0
let totalQPass = 0
let totalCases = 0
let allFailures = []

for (const group of allTestCases) {
  console.log(`【${group.group}】`)
  console.log('-'.repeat(120))
  console.log(`${'测试用例'.padEnd(20)} ${'Ts(3E+)'.padEnd(10)} ${'Ts(本地)'.padEnd(10)} ${'Ts误差%'.padEnd(10)} ${'Q(3E+)'.padEnd(10)} ${'Q(本地)'.padEnd(10)} ${'Q误差%'.padEnd(10)} ${'结果'}`)
  console.log('-'.repeat(120))
  
  let groupTsPass = 0, groupQPass = 0
  
  for (const tc of group.cases) {
    const v = tc.v !== undefined ? tc.v : 0
    const eps = tc.epsilon !== undefined ? tc.epsilon : 0.9
    const Tf = tc.Tf !== undefined ? tc.Tf : 150
    const Ta = tc.Ta !== undefined ? tc.Ta : 20
    
    let result
    if (tc.thickness_mm === 0) {
      const D_m = D_mm / 1000
      const hc = hcCylinderASTM(D_m, Tf, Ta, v)
      const hr = hrRadiation(eps, Tf, Ta)
      const h = hc + hr
      const q_linear = h * Math.PI * D_m * (Tf - Ta)
      result = { Ts: Tf, q_linear }
    } else {
      result = surfaceStatePipeSC(
        D_mm, mat.k, mat.kCoeff, Tf, Ta,
        tc.thickness_mm / 1000, v, eps
      )
    }
    
    const tsError = Math.abs(result.Ts - tc.e3plus_Ts) / Math.abs(tc.e3plus_Ts) * 100
    const qError = Math.abs(Math.abs(result.q_linear) - tc.e3plus_q) / tc.e3plus_q * 100
    
    const tsOk = tsError < 10 ? '✓' : '✗'
    const qOk = qError < 15 ? '✓' : '✗'
    const overall = tsOk === '✓' && qOk === '✓' ? 'PASS' : 'FAIL'
    
    if (tsOk === '✓') { groupTsPass++; totalTsPass++ }
    if (qOk === '✓') { groupQPass++; totalQPass++ }
    totalCases++
    
    if (overall === 'FAIL') {
      allFailures.push({
        group: group.group,
        name: tc.name,
        ts_3e: tc.e3plus_Ts,
        ts_local: result.Ts.toFixed(2),
        ts_error: tsError.toFixed(2),
        q_3e: tc.e3plus_q,
        q_local: Math.abs(result.q_linear).toFixed(2),
        q_error: qError.toFixed(2)
      })
    }
    
    console.log(
      `${tc.name.padEnd(20)} ` +
      `${tc.e3plus_Ts.toFixed(1).padEnd(10)} ` +
      `${result.Ts.toFixed(1).padEnd(10)} ` +
      `${tsError.toFixed(2).padEnd(10)} ` +
      `${tc.e3plus_q.toFixed(1).padEnd(10)} ` +
      `${Math.abs(result.q_linear).toFixed(1).padEnd(10)} ` +
      `${qError.toFixed(2).padEnd(10)} ` +
      `${overall}`
    )
  }
  
  console.log('-'.repeat(120))
  console.log(`  本组: Ts通过率 ${groupTsPass}/${group.cases.length} = ${(groupTsPass/group.cases.length*100).toFixed(1)}%, Q通过率 ${groupQPass}/${group.cases.length} = ${(groupQPass/group.cases.length*100).toFixed(1)}%`)
  console.log()
}

console.log('='.repeat(120))
console.log(`总计: Ts通过率 ${totalTsPass}/${totalCases} = ${(totalTsPass/totalCases*100).toFixed(1)}%`)
console.log(`       Q通过率  ${totalQPass}/${totalCases} = ${(totalQPass/totalCases*100).toFixed(1)}%`)
console.log()

if (allFailures.length > 0) {
  console.log('='.repeat(120))
  console.log('失败用例详情')
  console.log('='.repeat(120))
  allFailures.forEach((f, i) => {
    console.log(`${i+1}. [${f.group}] ${f.name}`)
    console.log(`   Ts: 3E+=${f.ts_3e}°C, 本地=${f.ts_local}°C, 误差=${f.ts_error}%`)
    console.log(`   Q:  3E+=${f.q_3e} W/m, 本地=${f.q_local} W/m, 误差=${f.q_error}%`)
  })
  console.log()
}

console.log('='.repeat(120))
console.log('分析结论')
console.log('='.repeat(120))
console.log()
console.log('1. 保温厚度系列：验证导热系数模型和迭代算法的正确性')
console.log('2. 低发射率(ε=0.1)：验证辐射换热对表面温度和热流的影响')
console.log('3. 风速(v=2m/s)：验证强制对流换热模型')
console.log('4. 冷介质场景：验证逆向热流（热量从环境传入管道）场景')
console.log('5. 高温场景：验证高温辐射模型（气体吸收修正）')
console.log()
