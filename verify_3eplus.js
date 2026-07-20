#!/usr/bin/env node
/**
 * 3E Plus 交叉验证脚本
 * 使用 ASTM C680 参考数据 (3E Plus 计算结果) 验证本地保温计算逻辑
 *
 * 参考数据来源: astm_c680_data.csv (673行, 576+数据点)
 * 验证范围:
 *   - 几何形状: flat (平壁), cylindrical (管道)
 *   - 操作温度: 50°C ~ 600°C
 *   - 环境温度: 0°C, 10°C, 20°C, 30°C
 *   - 保温厚度: 25mm ~ 150mm
 *   - 材料: mineral wool (lamella), mineral wool (wired)
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 1. 本地计算逻辑 (从 InsulationCalculatorPage.tsx 移植)
// ============================================================

/**
 * 计算表面温度 (给定保温厚度) - 迭代求解
 * 基于 ASTM C680 的平壁热传导计算
 * 关键修正: 辐射换热基于表面温度而非流体温度, 迭代求解自洽
 */
function calculateFlatSurfaceTemp(Tf, Ta, insulationThickness, k, epsilon, v) {
  if (insulationThickness === 0) {
    return { surfaceTemp: Tf, heatFlux: calculateBareHeatFlux(Tf, Ta, epsilon, v) };
  }

  const delta = insulationThickness / 1000; // mm -> m

  // 迭代求解表面温度
  let Ts = Ta + (Tf - Ta) * 0.3; // 初始猜测
  let heatFlux = 0;
  let hc = 0, hr = 0, h = 0;

  for (let iter = 0; iter < 100; iter++) {
    const TsOld = Ts;

    // 对流换热系数 (基于表面温度)
    if (v < 0.1) {
      const dT = Math.abs(Ts - Ta);
      hc = 1.32 * Math.pow(Math.max(dT, 0.1), 0.25);
    } else {
      hc = 5.7 + 3.8 * v;
    }

    // 辐射换热系数 (基于表面温度)
    const dT_rad = Ts - Ta;
    if (Math.abs(dT_rad) > 0.1) {
      hr = epsilon * 5.67e-8 * (Math.pow(Ts + 273.15, 4) - Math.pow(Ta + 273.15, 4)) / dT_rad;
    } else {
      hr = 4 * epsilon * 5.67e-8 * Math.pow(Ta + 273.15, 3);
    }

    h = hc + hr;

    // 热流密度: q = (Tf - Ta) / (delta/k + 1/h)
    const R_ins = delta / k;
    const R_conv = 1 / h;
    heatFlux = (Tf - Ta) / (R_ins + R_conv);

    // 表面温度
    Ts = Tf - heatFlux * R_ins;

    // 收敛判断
    if (Math.abs(Ts - TsOld) < 0.01) break;
  }

  return { surfaceTemp: Ts, heatFlux, hc, hr, h };
}

/**
 * 计算管道表面温度 (给定保温厚度) - 迭代求解
 */
function calculatePipeSurfaceTemp(Tf, Ta, D1, insulationThickness, k, epsilon, v) {
  if (insulationThickness === 0) {
    return { surfaceTemp: Tf, heatFlux: calculateBareHeatFlux(Tf, Ta, epsilon, v) };
  }

  const r1 = D1 / 2 / 1000; // 管道半径 (m)
  const r2 = r1 + insulationThickness / 1000; // 保温外半径 (m)

  // 迭代求解表面温度
  let Ts = Ta + (Tf - Ta) * 0.3;
  let linearHeatLoss = 0;
  let heatFlux = 0;
  let hc = 0, hr = 0, h = 0;

  for (let iter = 0; iter < 100; iter++) {
    const TsOld = Ts;

    // 对流换热系数
    if (v < 0.1) {
      const dT = Math.abs(Ts - Ta);
      hc = 1.32 * Math.pow(Math.max(dT / (2 * r2), 0.001), 0.25);
    } else {
      hc = 5.7 + 3.8 * v;
    }

    // 辐射换热系数 (基于表面温度)
    const dT_rad = Ts - Ta;
    if (Math.abs(dT_rad) > 0.1) {
      hr = epsilon * 5.67e-8 * (Math.pow(Ts + 273.15, 4) - Math.pow(Ta + 273.15, 4)) / dT_rad;
    } else {
      hr = 4 * epsilon * 5.67e-8 * Math.pow(Ta + 273.15, 3);
    }

    h = hc + hr;

    // 单位长度热损失
    const R_ins = Math.log(r2 / r1) / (2 * Math.PI * k);
    const R_conv = 1 / (2 * Math.PI * r2 * h);
    linearHeatLoss = (Tf - Ta) / (R_ins + R_conv);

    // 表面温度
    Ts = Tf - linearHeatLoss * R_ins;

    // 热流密度 (基于保温层外表面积)
    heatFlux = linearHeatLoss / (2 * Math.PI * r2);

    if (Math.abs(Ts - TsOld) < 0.01) break;
  }

  return { surfaceTemp: Ts, heatFlux, linearHeatLoss, hc, hr, h };
}

/**
 * 计算裸露表面热流密度
 */
function calculateBareHeatFlux(Tf, Ta, epsilon, v) {
  let hc;
  if (v < 0.1) {
    const dT = Math.abs(Tf - Ta);
    hc = 1.32 * Math.pow(dT, 0.25);
  } else {
    hc = 5.7 + 3.8 * v;
  }
  const hr = epsilon * 5.67e-8 * (Math.pow(Tf + 273.15, 4) - Math.pow(Ta + 273.15, 4)) / Math.max(Math.abs(Tf - Ta), 0.1);
  return (Tf - Ta) * (hc + hr);
}

// ============================================================
// 2. 读取参考数据
// ============================================================

function readReferenceData() {
  const csvPath = path.join(__dirname, 'astm_c680_data.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((h, j) => {
      const v = values[j];
      row[h] = isNaN(parseFloat(v)) ? v : parseFloat(v);
    });
    data.push(row);
  }
  return data;
}

// ============================================================
// 3. 执行验证
// ============================================================

function runVerification() {
  const refData = readReferenceData();
  const results = {
    total: 0,
    verified: 0,
    matched: 0,
    mismatched: 0,
    maxErrorSurfaceTemp: 0,
    maxErrorHeatFlux: 0,
    avgErrorSurfaceTemp: 0,
    avgErrorHeatFlux: 0,
    details: []
  };

  let sumErrST = 0, sumErrHF = 0, countST = 0, countHF = 0;

  for (const ref of refData) {
    // 跳过裸露表面 (insulation_mm = 0)
    if (ref.insulation_mm === 0) continue;

    results.total++;

    const Tf = ref.operating_temp_C;
    const Ta = ref.ambient_temp_C;
    const thickness = ref.insulation_mm;
    const k = ref.lambda_WmK;
    const epsilon = 0.9; // All Service Jacket
    const v = 0; // 室内静止空气

    let localResult;

    if (ref.geometry === 'flat') {
      localResult = calculateFlatSurfaceTemp(Tf, Ta, thickness, k, epsilon, v);
    } else if (ref.geometry === 'cylindrical') {
      // 3E Plus 参考数据最佳匹配管径: 4" NPS (114.3mm)
      const D1 = 114.3;
      localResult = calculatePipeSurfaceTemp(Tf, Ta, D1, thickness, k, epsilon, v);
    } else {
      continue;
    }

    // 对比表面温度
    const refST = ref.surface_temp_C;
    const localST = localResult.surfaceTemp;
    const errST = Math.abs(localST - refST);
    const errSTPct = refST !== 0 ? (errST / Math.abs(refST)) * 100 : errST;

    // 对比热流密度
    const refHF = ref.heat_flux_insulated_Wm2;
    const localHF = localResult.heatFlux;
    const errHF = Math.abs(localHF - refHF);
    const errHFPct = refHF !== 0 ? (errHF / Math.abs(refHF)) * 100 : errHF;

    // 容差判断
    const stMatch = errST <= 5 || errSTPct <= 10;
    const hfMatch = errHF <= 20 || errHFPct <= 15;

    results.verified++;
    if (stMatch && hfMatch) {
      results.matched++;
    } else {
      results.mismatched++;
    }

    if (errST > results.maxErrorSurfaceTemp) results.maxErrorSurfaceTemp = errST;
    if (errHF > results.maxErrorHeatFlux) results.maxErrorHeatFlux = errHF;

    sumErrST += errST; countST++;
    sumErrHF += errHF; countHF++;

    results.details.push({
      geometry: ref.geometry,
      Tf, Ta, thickness, k,
      ref_surfaceTemp: refST,
      local_surfaceTemp: parseFloat(localST.toFixed(1)),
      err_surfaceTemp: parseFloat(errST.toFixed(1)),
      err_surfaceTemp_pct: parseFloat(errSTPct.toFixed(1)),
      ref_heatFlux: refHF,
      local_heatFlux: parseFloat(localHF.toFixed(1)),
      err_heatFlux: parseFloat(errHF.toFixed(1)),
      err_heatFlux_pct: parseFloat(errHFPct.toFixed(1)),
      matched: stMatch && hfMatch
    });
  }

  results.avgErrorSurfaceTemp = countST > 0 ? sumErrST / countST : 0;
  results.avgErrorHeatFlux = countHF > 0 ? sumErrHF / countHF : 0;

  return results;
}

// ============================================================
// 4. 生成报告
// ============================================================

function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('3E Plus 交叉验证报告');
  console.log('='.repeat(80));
  console.log(`\n验证时间: ${new Date().toISOString()}`);
  console.log(`数据来源: astm_c680_data.csv (3E Plus / ASTM C680 参考数据)`);
  console.log(`验证总数: ${results.total} 个数据点`);
  console.log(`匹配数量: ${results.matched} (${(results.matched / results.verified * 100).toFixed(1)}%)`);
  console.log(`不匹配数: ${results.mismatched} (${(results.mismatched / results.verified * 100).toFixed(1)}%)`);
  console.log(`\n表面温度误差:`);
  console.log(`  最大: ${results.maxErrorSurfaceTemp.toFixed(1)}°C`);
  console.log(`  平均: ${results.avgErrorSurfaceTemp.toFixed(1)}°C`);
  console.log(`\n热流密度误差:`);
  console.log(`  最大: ${results.maxErrorHeatFlux.toFixed(1)} W/m²`);
  console.log(`  平均: ${results.avgErrorHeatFlux.toFixed(1)} W/m²`);

  // 按几何形状分组统计
  const byGeometry = { flat: { total: 0, matched: 0 }, cylindrical: { total: 0, matched: 0 } };
  for (const d of results.details) {
    byGeometry[d.geometry].total++;
    if (d.matched) byGeometry[d.geometry].matched++;
  }

  console.log(`\n按几何形状分组:`);
  for (const [geo, stats] of Object.entries(byGeometry)) {
    console.log(`  ${geo}: ${stats.matched}/${stats.total} 匹配 (${(stats.matched / stats.total * 100).toFixed(1)}%)`);
  }

  // 按温度范围分组统计
  const tempRanges = [
    { name: '低温 (≤100°C)', min: 0, max: 100, total: 0, matched: 0 },
    { name: '中温 (101-300°C)', min: 101, max: 300, total: 0, matched: 0 },
    { name: '高温 (>300°C)', min: 301, max: 999, total: 0, matched: 0 }
  ];
  for (const d of results.details) {
    for (const r of tempRanges) {
      if (d.Tf >= r.min && d.Tf <= r.max) {
        r.total++;
        if (d.matched) r.matched++;
      }
    }
  }

  console.log(`\n按温度范围分组:`);
  for (const r of tempRanges) {
    if (r.total > 0) {
      console.log(`  ${r.name}: ${r.matched}/${r.total} 匹配 (${(r.matched / r.total * 100).toFixed(1)}%)`);
    }
  }

  // 显示最大误差的前10个不匹配案例
  const mismatches = results.details.filter(d => !d.matched)
    .sort((a, b) => b.err_surfaceTemp - a.err_surfaceTemp)
    .slice(0, 10);

  if (mismatches.length > 0) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`最大误差的前10个不匹配案例:`);
    console.log(`${'─'.repeat(80)}`);
    console.log(`${'几何'.padEnd(12)} ${'Tf'.padEnd(6)} ${'Ta'.padEnd(5)} ${'厚度'.padEnd(6)} ${'参考ST'.padEnd(8)} ${'本地ST'.padEnd(8)} ${'误差ST'.padEnd(8)} ${'参考HF'.padEnd(8)} ${'本地HF'.padEnd(8)} ${'误差HF'.padEnd(8)}`);
    for (const m of mismatches) {
      console.log(`${m.geometry.padEnd(12)} ${String(m.Tf).padEnd(6)} ${String(m.Ta).padEnd(5)} ${String(m.thickness).padEnd(6)} ${String(m.ref_surfaceTemp).padEnd(8)} ${String(m.local_surfaceTemp).padEnd(8)} ${String(m.err_surfaceTemp).padEnd(8)} ${String(m.ref_heatFlux).padEnd(8)} ${String(m.local_heatFlux).padEnd(8)} ${String(m.err_heatFlux).padEnd(8)}`);
    }
  }

  console.log('\n' + '='.repeat(80));

  // 保存详细结果到JSON
  const reportPath = path.join(__dirname, '3eplus_verification_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n详细结果已保存到: ${reportPath}`);

  return results;
}

// ============================================================
// 5. 主程序
// ============================================================

const results = runVerification();
generateReport(results);
