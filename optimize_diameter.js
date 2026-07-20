#!/usr/bin/env node
/**
 * 管径优化 - 找到3E Plus参考数据对应的最佳管径
 */

const fs = require('fs');
const path = require('path');

function calculatePipeSurfaceTemp(Tf, Ta, D1, insulationThickness, k, epsilon, v) {
  if (insulationThickness === 0) return { surfaceTemp: Tf, heatFlux: 0 };

  const r1 = D1 / 2 / 1000;
  const r2 = r1 + insulationThickness / 1000;

  let Ts = Ta + (Tf - Ta) * 0.3;
  let heatFlux = 0;

  for (let iter = 0; iter < 100; iter++) {
    const TsOld = Ts;
    const dT = Math.abs(Ts - Ta);
    const D_m = 2 * r2;

    // 水平圆柱自然对流 (Churchill-Chu 简化)
    let hc;
    if (v < 0.1) {
      hc = 1.32 * Math.pow(Math.max(dT / D_m, 0.001), 0.25);
    } else {
      hc = 5.7 + 3.8 * v;
    }

    const dT_rad = Ts - Ta;
    let hr;
    if (Math.abs(dT_rad) > 0.1) {
      hr = epsilon * 5.67e-8 * (Math.pow(Ts + 273.15, 4) - Math.pow(Ta + 273.15, 4)) / dT_rad;
    } else {
      hr = 4 * epsilon * 5.67e-8 * Math.pow(Ta + 273.15, 3);
    }

    const h = hc + hr;
    const R_ins = Math.log(r2 / r1) / (2 * Math.PI * k);
    const R_conv = 1 / (2 * Math.PI * r2 * h);
    const linearHeatLoss = (Tf - Ta) / (R_ins + R_conv);
    Ts = Tf - linearHeatLoss * R_ins;
    heatFlux = linearHeatLoss / (2 * Math.PI * r2);

    if (Math.abs(Ts - TsOld) < 0.01) break;
  }

  return { surfaceTemp: Ts, heatFlux };
}

function readReferenceData() {
  const content = fs.readFileSync(path.join(__dirname, 'astm_c680_data.csv'), 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, j) => {
      const v = values[j];
      row[h] = isNaN(parseFloat(v)) ? v : parseFloat(v);
    });
    return row;
  });
}

// 尝试不同管径
const diameters = [21.3, 33.4, 48.3, 60.3, 88.9, 114.3, 168.3, 219.1, 273.1, 406.4];
const refData = readReferenceData().filter(r => r.geometry === 'cylindrical' && r.insulation_mm > 0);

console.log('管径优化测试:');
console.log('管径(mm) | 平均误差ST(°C) | 平均误差HF(W/m²) | 匹配率(%)');
console.log('-'.repeat(70));

for (const D1 of diameters) {
  let sumErrST = 0, sumErrHF = 0, matched = 0, total = 0;

  for (const ref of refData) {
    const result = calculatePipeSurfaceTemp(
      ref.operating_temp_C, ref.ambient_temp_C, D1,
      ref.insulation_mm, ref.lambda_WmK, 0.9, 0
    );

    const errST = Math.abs(result.surfaceTemp - ref.surface_temp_C);
    const errHF = Math.abs(result.heatFlux - ref.heat_flux_insulated_Wm2);
    const errSTPct = ref.surface_temp_C !== 0 ? errST / Math.abs(ref.surface_temp_C) * 100 : errST;
    const errHFPct = ref.heat_flux_insulated_Wm2 !== 0 ? errHF / Math.abs(ref.heat_flux_insulated_Wm2) * 100 : errHF;

    if (errST <= 5 || errSTPct <= 10) matched++;
    total++;
    sumErrST += errST;
    sumErrHF += errHF;
  }

  console.log(`${String(D1).padEnd(8)} | ${String((sumErrST/total).toFixed(1)).padEnd(14)} | ${String((sumErrHF/total).toFixed(1)).padEnd(15)} | ${(matched/total*100).toFixed(1)}%`);
}
