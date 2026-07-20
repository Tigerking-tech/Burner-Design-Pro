const fs = require('fs')

const SIGMA_SB = 5.670374419e-8

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

const hcConvection = (tsC, taC, D_m, windSpeed) => {
  const dT = Math.abs(tsC - taC)
  if (windSpeed > 0) {
    return 5.7 + 3.8 * windSpeed
  } else {
    if (dT < 0.1) dT = 0.1
    return 1.32 * Math.pow(dT / D_m, 0.25)
  }
}

const calculatePipe = (tf, ta, D_mm, tIns_mm, k, epsilon, windSpeed) => {
  const D1 = D_mm / 1000
  const D2 = (D_mm + 2 * tIns_mm) / 1000
  const D_ratio = D2 / D1

  let ts = (tf + ta) / 2
  for (let i = 0; i < 100; i++) {
    const hr = hrRadiation(epsilon, ts, ta)
    const hc = hcConvection(ts, ta, D2, windSpeed)
    const h = hr + hc

    const R_cond = Math.log(D_ratio) / (2 * Math.PI * k)
    const R_surf = 1 / (h * Math.PI * D2)
    const R_total = R_cond + R_surf

    const qL = (tf - ta) / R_total

    const tsNew = ta + qL / (h * Math.PI * D2)

    if (Math.abs(tsNew - ts) < 0.001) {
      ts = tsNew
      break
    }
    ts = ts + 0.5 * (tsNew - ts)
  }

  const hr = hrRadiation(epsilon, ts, ta)
  const hc = hcConvection(ts, ta, D2, windSpeed)
  const h = hr + hc
  const R_cond = Math.log(D_ratio) / (2 * Math.PI * k)
  const R_surf = 1 / (h * Math.PI * D2)
  const R_total = R_cond + R_surf
  const qL = (tf - ta) / R_total

  return {
    surfaceTemp: ts,
    heatLossPerMeter: qL,
    hc, hr, h
  }
}

const findMinThickness = (tf, ta, D_mm, tMax, k, epsilon, windSpeed) => {
  let lo = 1, hi = 500
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const res = calculatePipe(tf, ta, D_mm, mid, k, epsilon, windSpeed)
    if (res.surfaceTemp <= tMax) hi = mid
    else lo = mid
  }
  return hi
}

console.log('========== 3E Plus 实测 vs 我们的计算 对比 ==========\n')

const testCases = [
  {
    name: 'BASE-00 (Tf=150, Ta=20, D=63.5mm, Tmax=50, wind=0)',
    tf: 150, ta: 20, D: 63.5, tMax: 50, wind: 0, k: 0.040, epsilon: 0.9,
    ref3ePlus: { t50mm: 28.2, q50mm: 37.57, t25mm: 37.3, q25mm: 61.41, t15mm: 42.8, q15mm: 76.11 }
  },
  {
    name: 'BASE-01 (Tf=100, Ta=20, D=63.5mm, Tmax=50, wind=0)',
    tf: 100, ta: 20, D: 63.5, tMax: 50, wind: 0, k: 0.040, epsilon: 0.9,
    ref3ePlus: { t50mm: 24.8, q50mm: 20.56, t25mm: 30.2, q25mm: 33.46, t15mm: 33.5, q15mm: 41.35 }
  },
  {
    name: 'BASE-02 (Tf=200, Ta=20, D=63.5mm, Tmax=50, wind=0)',
    tf: 200, ta: 20, D: 63.5, tMax: 50, wind: 0, k: 0.040, epsilon: 0.9,
    ref3ePlus: { t50mm: 32.1, q50mm: 58.84, t25mm: 45.3, q25mm: 96.47, t15mm: 53.3, q15mm: 119.79 }
  },
  {
    name: 'BASE-04 (Tf=150, Ta=30, D=63.5mm, Tmax=50, wind=0)',
    tf: 150, ta: 30, D: 63.5, tMax: 50, wind: 0, k: 0.040, epsilon: 0.9,
    ref3ePlus: { t50mm: 37.4, q50mm: 35.35, t25mm: 45.7, q25mm: 57.76, t15mm: 50.7, q15mm: 71.57 }
  },
  {
    name: 'F-风5m/s (Tf=150, Ta=20, D=63.5mm, Tmax=50, wind=5)',
    tf: 150, ta: 20, D: 63.5, tMax: 50, wind: 5, k: 0.040, epsilon: 0.9,
    ref3ePlus: { t50mm: 22.7, q50mm: 38.88, t25mm: 25.9, q25mm: 66.18, t15mm: 28.1, q15mm: 84.15 }
  }
]

for (const tc of testCases) {
  console.log(`\n--- ${tc.name} ---`)
  
  const res15 = calculatePipe(tc.tf, tc.ta, tc.D, 15, tc.k, tc.epsilon, tc.wind)
  const res25 = calculatePipe(tc.tf, tc.ta, tc.D, 25, tc.k, tc.epsilon, tc.wind)
  const res50 = calculatePipe(tc.tf, tc.ta, tc.D, 50, tc.k, tc.epsilon, tc.wind)
  const minT = findMinThickness(tc.tf, tc.ta, tc.D, tc.tMax, tc.k, tc.epsilon, tc.wind)

  console.log(`  15mm: 我们 Ts=${res15.surfaceTemp.toFixed(1)}°C q=${res15.heatLossPerMeter.toFixed(2)} W/m | 3E+ Ts=${tc.ref3ePlus.t15mm}°C q=${tc.ref3ePlus.q15mm} W/m`)
  console.log(`        Ts偏差=${(res15.surfaceTemp - tc.ref3ePlus.t15mm).toFixed(1)}°C (${((res15.surfaceTemp - tc.ref3ePlus.t15mm)/tc.ref3ePlus.t15mm*100).toFixed(1)}%), q偏差=${(res15.heatLossPerMeter - tc.ref3ePlus.q15mm).toFixed(2)} W/m (${((res15.heatLossPerMeter - tc.ref3ePlus.q15mm)/tc.ref3ePlus.q15mm*100).toFixed(1)}%)`)
  
  console.log(`  25mm: 我们 Ts=${res25.surfaceTemp.toFixed(1)}°C q=${res25.heatLossPerMeter.toFixed(2)} W/m | 3E+ Ts=${tc.ref3ePlus.t25mm}°C q=${tc.ref3ePlus.q25mm} W/m`)
  console.log(`        Ts偏差=${(res25.surfaceTemp - tc.ref3ePlus.t25mm).toFixed(1)}°C (${((res25.surfaceTemp - tc.ref3ePlus.t25mm)/tc.ref3ePlus.t25mm*100).toFixed(1)}%), q偏差=${(res25.heatLossPerMeter - tc.ref3ePlus.q25mm).toFixed(2)} W/m (${((res25.heatLossPerMeter - tc.ref3ePlus.q25mm)/tc.ref3ePlus.q25mm*100).toFixed(1)}%)`)
  
  console.log(`  50mm: 我们 Ts=${res50.surfaceTemp.toFixed(1)}°C q=${res50.heatLossPerMeter.toFixed(2)} W/m | 3E+ Ts=${tc.ref3ePlus.t50mm}°C q=${tc.ref3ePlus.q50mm} W/m`)
  console.log(`        Ts偏差=${(res50.surfaceTemp - tc.ref3ePlus.t50mm).toFixed(1)}°C (${((res50.surfaceTemp - tc.ref3ePlus.t50mm)/tc.ref3ePlus.t50mm*100).toFixed(1)}%), q偏差=${(res50.heatLossPerMeter - tc.ref3ePlus.q50mm).toFixed(2)} W/m (${((res50.heatLossPerMeter - tc.ref3ePlus.q50mm)/tc.ref3ePlus.q50mm*100).toFixed(1)}%)`)
  
  console.log(`  最小厚度(≤${tc.tMax}°C): 我们=${minT.toFixed(1)} mm`)
}

console.log('\n========== 对比完成 ==========')
