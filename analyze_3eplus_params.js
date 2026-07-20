const SIGMA_SB = 5.670374419e-8

const hcCylinderASTM = (D_m, tsC, taC, v) => {
  const Tfilm = (tsC + taC) / 2
  const kAir = 0.0241 + 7.6e-5 * Tfilm
  const nu = 1.328e-5 + 9.5e-8 * Tfilm
  const alpha = 1.81e-5 + 1.25e-7 * Tfilm
  const Pr = 0.715 - 2.5e-5 * Tfilm
  const beta = 1 / (Tfilm + 273.15)
  const dT = Math.abs(tsC - taC)
  const Ra = dT > 1e-6 ? (9.81 * beta * dT * Math.pow(D_m, 3)) / (nu * alpha) : 0
  const NuNat = Ra > 0
    ? (Ra > 1e7 ? 0.15 * Math.pow(Ra, 1 / 3) : 0.59 * Math.pow(Ra, 0.25))
    : 0.5
  const Re = v * D_m / nu
  const NuFor = Re > 1e-3
    ? 0.664 * Math.pow(Re, 0.5) * Math.pow(Pr, 1 / 3) + 0.037 * Math.pow(Re, 0.8) * Math.pow(Pr, 1 / 3)
    : 0
  const Nu = (NuNat + NuFor) > 0
    ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
    : NuNat
  return Math.max(Nu * kAir / D_m, 0.5)
}

const hrRadiation = (epsilon, tsC, taC) => {
  const Ts = tsC + 273.15
  const Ta = taC + 273.15
  if (Math.abs(Ts - Ta) < 1e-6) {
    return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3)
  }
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta)
}

console.log('='.repeat(80))
console.log('Bare管换热系数分析 (用3E Plus实测反推)')
console.log('='.repeat(80))
console.log()

// 3E Plus Bare管实测数据 (63.5mm管)
const bareCases = [
  { name: '150°C/20°C/ε0.9', Tf: 150, Ts: 149.9, Ta: 20, q: 441.71, eps: 0.9, v: 0 },
  { name: '150°C/20°C/ε0.1', Tf: 150, Ts: 149.9, Ta: 20, q: 441.71, eps: 0.1, v: 0 },
]

for (const c of bareCases) {
  const D = 0.0635
  const qPerM2 = c.q / (Math.PI * D)
  
  const hc = hcCylinderASTM(D, c.Ts, c.Ta, c.v)
  const hr = hrRadiation(c.eps, c.Ts, c.Ta)
  const h_local = hc + hr
  
  const h_3eplus = qPerM2 / (c.Ts - c.Ta)
  
  console.log(`场景: ${c.name}`)
  console.log(`  3E Plus 实测: Ts=${c.Ts}°C, q=${c.q} W/m`)
  console.log(`  3E Plus h = ${h_3eplus.toFixed(2)} W/m²·K (q''=${qPerM2.toFixed(1)} W/m², dT=${(c.Ts-c.Ta).toFixed(1)}K)`)
  console.log(`  本地 hc = ${hc.toFixed(2)}, hr = ${hr.toFixed(2)}, h_total = ${h_local.toFixed(2)} W/m²·K`)
  console.log(`  h比值: 3E+/本地 = ${(h_3eplus/h_local).toFixed(3)}`)
  console.log()
}

// 用50mm保温的情况分析
console.log('='.repeat(80))
console.log('50mm保温层热阻分析')
console.log('='.repeat(80))
console.log()

const D1 = 0.0635
const delta = 0.050
const D2 = D1 + 2 * delta
const r1 = D1 / 2
const r2 = D2 / 2

// 3E Plus数据: Ts=35°C, q=35.94 W/m, Tf=150°C, Ta=20°C
const Tf = 150, Ta = 20, Ts_3ep = 35.0, q_3ep = 35.94

// 反推保温层导热系数
// q = (Tf - Ts) / R_ins, R_ins = ln(r2/r1)/(2πk)
const R_ins_3ep = (Tf - Ts_3ep) / q_3ep
const k_3ep = Math.log(r2 / r1) / (2 * Math.PI * R_ins_3ep)

// 表面换热系数
const q_per_m2 = q_3ep / (Math.PI * D2)
const h_surface_3ep = q_per_m2 / (Ts_3ep - Ta)

console.log(`3E Plus 50mm保温 (Tf=150°C, Ta=20°C, ε=0.9):`)
console.log(`  Ts = ${Ts_3ep}°C, q = ${q_3ep} W/m`)
console.log(`  保温层热阻 R_ins = ${R_ins_3ep.toFixed(4)} m·K/W`)
console.log(`  反推保温k = ${k_3ep.toFixed(4)} W/m·K (平均温度 ${(Tf+Ts_3ep)/2}°C)`)
console.log(`  表面换热 h = ${h_surface_3ep.toFixed(2)} W/m²·K`)
console.log(`  保温外径 D2 = ${(D2*1000).toFixed(1)} mm`)
console.log()

// 本地计算的k值
const k_local_base = 0.032
const kCoeff = 9.4e-5
const Tmean = (Tf + Ts_3ep) / 2
const k_local = k_local_base + kCoeff * Tmean + 5.6e-7 * Tmean * Tmean
console.log(`本地模型 k@${Tmean.toFixed(0)}°C = ${k_local.toFixed(4)} W/m·K`)
console.log(`k比值: 3E+/本地 = ${(k_3ep/k_local).toFixed(3)}`)
console.log()

// 计算本地R_ins
const R_ins_local = Math.log(r2 / r1) / (2 * Math.PI * k_local)
console.log(`本地 R_ins = ${R_ins_local.toFixed(4)} m·K/W`)
