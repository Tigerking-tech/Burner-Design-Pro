// 内保温算法验证
const SIGMA_SB = 5.670374419e-8

const airProperties = (tMeanC) => {
  const kAir = 0.02421 + 7.8e-5 * tMeanC - 1.4e-8 * tMeanC * tMeanC
  const nu = 1.334e-5 + 9.0e-8 * tMeanC
  const alpha = 1.887e-5 + 1.26e-7 * tMeanC
  const Pr = 0.71
  const beta = 1.0 / (tMeanC + 273.15)
  return { kAir, nu, alpha, Pr, beta }
}

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

const hr = (epsilon, tsC, taC) => {
  const Ts = tsC + 273.15
  const Ta = taC + 273.15
  if (Math.abs(Ts - Ta) < 1e-6) return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
}

const getK = (baseK, kCoeff, Tf, Ts) => {
  const T_mean = (Tf + Ts) / 2
  return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean
}

// 外保温计算
const calcExternal = (D_outer_mm, wallT_mm, delta_mm, Tf, Ta, v, eps, k_pipe) => {
  const r1 = (D_outer_mm - 2 * wallT_mm) / 2000
  const r2 = D_outer_mm / 2000
  const r3 = r2 + delta_mm / 1000
  
  let tsGuess = Ta + 0.5 * (Tf - Ta)
  for (let i = 0; i < 30; i++) {
    const k = getK(0.032, 9.4e-5, Tf, tsGuess)
    const hc = hcASTM(2 * r3, tsGuess, Ta, v)
    const hr_val = hr(eps, tsGuess, Ta)
    const h = hc + hr_val
    
    const R_wall = (k_pipe > 0 && wallT_mm > 0) 
      ? Math.log(r2 / r1) / (2 * Math.PI * k_pipe) : 0
    const R_ins = Math.log(r3 / r2) / (2 * Math.PI * k)
    const R_conv = 1 / (h * 2 * Math.PI * r3)
    
    const q = (Tf - Ta) / (R_wall + R_ins + R_conv)
    const Ts = Ta + q * R_conv
    
    if (Math.abs(Ts - tsGuess) < 0.001) return { Ts, q, r1, r2, r3, R_wall, R_ins, R_conv }
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
}

// 内保温计算
const calcInternal = (D_inner_mm, wallT_mm, delta_mm, Tf, Ta, v, eps, k_pipe) => {
  const r1 = (D_inner_mm - 2 * delta_mm) / 2000
  const r2 = D_inner_mm / 2000
  const r3 = (D_inner_mm + 2 * wallT_mm) / 2000
  
  if (r1 < 0) r1 = 1e-6
  
  let tsGuess = Ta + 0.5 * (Tf - Ta)
  for (let i = 0; i < 30; i++) {
    const k = getK(0.032, 9.4e-5, Tf, tsGuess)
    const hc = hcASTM(2 * r3, tsGuess, Ta, v)
    const hr_val = hr(eps, tsGuess, Ta)
    const h = hc + hr_val
    
    const R_ins = Math.log(r2 / r1) / (2 * Math.PI * k)
    const R_wall = (k_pipe > 0 && wallT_mm > 0)
      ? Math.log(r3 / r2) / (2 * Math.PI * k_pipe) : 0
    const R_conv = 1 / (h * 2 * Math.PI * r3)
    
    const q = (Tf - Ta) / (R_ins + R_wall + R_conv)
    const Ts = Ta + q * R_conv
    
    if (Math.abs(Ts - tsGuess) < 0.001) return { Ts, q, r1, r2, r3, R_wall, R_ins, R_conv }
    tsGuess = 0.5 * tsGuess + 0.5 * Ts
  }
}

console.log('内保温 vs 外保温 算法验证')
console.log('='.repeat(80))
console.log('参数: Tf=150°C, Ta=20°C, v=0, ε=0.9, k_pipe=50')
console.log('管子: D_outer=60.3mm(外保温) / D_inner=60.3mm(内保温), 壁厚=5mm')
console.log('保温: 25mm')
console.log('='.repeat(80))

const external = calcExternal(60.3, 5, 25, 150, 20, 0, 0.9, 50)
const internal = calcInternal(60.3, 5, 25, 150, 20, 0, 0.9, 50)

console.log('\n【外保温】')
console.log(`结构(从内到外): 流体(r=${external.r1.toFixed(4)}m) → 管壁 → 保温(r=${external.r2.toFixed(4)}m) → 表面(r=${external.r3.toFixed(4)}m)`)
console.log(`表面温度: ${external.Ts.toFixed(1)}°C`)
console.log(`线热损失: ${external.q.toFixed(2)} W/m`)
console.log(`热阻: R_wall=${external.R_wall.toFixed(4)}, R_ins=${external.R_ins.toFixed(4)}, R_conv=${external.R_conv.toFixed(4)}`)

console.log('\n【内保温】')
console.log(`结构(从内到外): 流体(r=${internal.r1.toFixed(4)}m) → 保温 → 管壁(r=${internal.r2.toFixed(4)}m) → 表面(r=${internal.r3.toFixed(4)}m)`)
console.log(`表面温度: ${internal.Ts.toFixed(1)}°C`)
console.log(`线热损失: ${internal.q.toFixed(2)} W/m`)
console.log(`热阻: R_ins=${internal.R_ins.toFixed(4)}, R_wall=${internal.R_wall.toFixed(4)}, R_conv=${internal.R_conv.toFixed(4)}`)

console.log('\n【对比分析】')
console.log(`表面温度差异: ${Math.abs(external.Ts - internal.Ts).toFixed(1)}°C`)
console.log(`热损失差异: ${Math.abs(external.q - internal.q).toFixed(2)} W/m`)

if (internal.Ts < external.Ts) {
  console.log('内保温表面温度更低，保温效果更好 ✓')
} else {
  console.log('外保温表面温度更低，保温效果更好')
}
