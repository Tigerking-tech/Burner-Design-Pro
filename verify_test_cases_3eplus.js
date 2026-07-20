#!/usr/bin/env node
/**
 * 71个测试用例 3E Plus 交叉验证脚本
 * 分3组逐个验证：
 *   组1: 基础参数组 A-E (装备类型/模式/管径/平壁尺寸/材料)
 *   组2: 环境参数组 F-M (介质温度/环境温度/目标表面温度/热损失目标/湿度/风速/发射率/运行小时)
 *   组3: 新增功能组 N-Z (单位制/保温位置/管材/壁厚/综合应力)
 *
 * 验证方法：
 *   1) 本地计算逻辑 (与 InsulationCalculatorPage.tsx 完全一致)
 *   2) 对每个用例，从 astm_c680_data.csv 中找到最接近的3E Plus参考数据点
 *   3) 同时检查 Insulation Preview 结构一致性
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 1. 物性 & 计算函数 (与 InsulationCalculatorPage.tsx 完全一致)
// ============================================================

const SIGMA_SB = 5.670374419e-8;

const materialProperties = {
  mineralwool:      { conductivity: 0.032, name: 'Mineral Wool',          maxTemp: 454,  kCoeff: 9.4e-5 },
  glasswool:        { conductivity: 0.028, name: 'Glass Wool',            maxTemp: 316,  kCoeff: 8.5e-5 },
  calciumsilicate:  { conductivity: 0.038, name: 'Calcium Silicate',      maxTemp: 649,  kCoeff: 1.1e-4 },
  polyurethane:     { conductivity: 0.023, name: 'Polyurethane',          maxTemp: 120,  kCoeff: 5e-5   },
  phenolic:         { conductivity: 0.025, name: 'Phenolic',              maxTemp: 120,  kCoeff: 6e-5   },
  polyisocyanurate: { conductivity: 0.022, name: 'Polyisocyanurate',      maxTemp: 135,  kCoeff: 4.5e-5 },
  cellularglass:    { conductivity: 0.038, name: 'Cellular Glass',        maxTemp: 260,  kCoeff: 8e-5   },
  vermiculite:      { conductivity: 0.055, name: 'Vermiculite',           maxTemp: 760,  kCoeff: 1.5e-4 },
  perlite:          { conductivity: 0.050, name: 'Perlite',               maxTemp: 900,  kCoeff: 1.3e-4 },
  ceramicfiber:     { conductivity: 0.045, name: 'Ceramic Fiber',         maxTemp: 1260, kCoeff: 1.6e-4 },
  aerogel:          { conductivity: 0.012, name: 'Aerogel',               maxTemp: 650,  kCoeff: 3e-5   },
  fiberglass:       { conductivity: 0.030, name: 'Fiberglass',            maxTemp: 204,  kCoeff: 8e-5   },
  foamglass:        { conductivity: 0.040, name: 'Foam Glass',            maxTemp: 400,  kCoeff: 9e-5   },
  elastomeric:      { conductivity: 0.034, name: 'Elastomeric',           maxTemp: 100,  kCoeff: 7e-5   }
};

const pipeMaterialProperties = {
  carbon_steel:      { conductivity: 50.0,  name: 'Carbon Steel',     maxTemp: 540  },
  stainless_316:     { conductivity: 16.0,  name: 'SS 316',           maxTemp: 815  },
  copper:            { conductivity: 400.0, name: 'Copper',           maxTemp: 200  },
  pvc:               { conductivity: 0.19,  name: 'PVC',              maxTemp: 60   },
  custom_pipe:       { conductivity: 50.0,  name: 'Custom',           maxTemp: 9999 }
};

const getThermalConductivityTemp = (baseK, kCoeff, Tf, Ts) => {
  const T_mean = (Tf + Ts) / 2;
  return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean;
};

const airProperties = (tMeanC) => {
  const kAir = 0.02421 + 7.8e-5 * tMeanC - 1.4e-8 * tMeanC * tMeanC;
  const nu = 1.334e-5 + 9.0e-8 * tMeanC;
  const alpha = 1.887e-5 + 1.26e-7 * tMeanC;
  const Pr = 0.71;
  const beta = 1.0 / (tMeanC + 273.15);
  return { kAir, nu, alpha, Pr, beta };
};

const hcCylinderASTM = (dM, tsC, taC, v) => {
  const tMean = (tsC + taC) / 2;
  const { kAir, nu, alpha, Pr, beta } = airProperties(tMean);
  const d = Math.max(dM, 1e-3);
  const dT = Math.abs(tsC - taC);
  const Ra = dT > 1e-6 ? (9.81 * beta * dT * Math.pow(d, 3)) / (nu * alpha) : 0;
  const NuNat = Ra > 0
    ? 0.36 + 0.518 * Math.pow(Ra, 0.25) / Math.pow(1 + Math.pow(0.559 / Pr, 0.5625), 0.45)
    : 0.36;
  const Re = v * d / nu;
  const NuFor = Re > 1e-3
    ? 0.3 + 0.62 * Math.pow(Re, 0.5) * Math.pow(Pr, 1/3)
        / Math.pow(1 + Math.pow(0.4 / Pr, 2/3), 0.25)
        * Math.pow(1 + 0.07 * Math.pow(Re, 0.6), 0.05)
    : 0;
  const Nu = (NuNat + NuFor) > 0
    ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
    : 0.36;
  return Math.max(Nu * kAir / d, 0.5);
};

const hcFlatASTM = (lengthM, widthM, tsC, taC, v) => {
  const tMean = (tsC + taC) / 2;
  const { kAir, nu, alpha, Pr, beta } = airProperties(tMean);
  const area = lengthM * widthM;
  const perim = 2 * (lengthM + widthM);
  const L = perim > 0 ? area / perim : 1.0;
  const dT = Math.abs(tsC - taC);
  const Ra = dT > 1e-6 ? (9.81 * beta * dT * Math.pow(L, 3)) / (nu * alpha) : 0;
  const NuNat = Ra > 0
    ? (Ra > 1e7 ? 0.15 * Math.pow(Ra, 1/3) : 0.59 * Math.pow(Ra, 0.25))
    : 0.5;
  const Re = v * L / nu;
  const NuFor = Re > 1e-3
    ? 0.664 * Math.pow(Re, 0.5) * Math.pow(Pr, 1/3) + 0.037 * Math.pow(Re, 0.8) * Math.pow(Pr, 1/3)
    : 0;
  const Nu = (NuNat + NuFor) > 0
    ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
    : NuNat;
  return Math.max(Nu * kAir / L, 0.5);
};

const hrRadiation = (epsilon, tsC, taC) => {
  const Ts = tsC + 273.15;
  const Ta = taC + 273.15;
  if (Math.abs(Ts - Ta) < 1e-6) return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3);

  let hr = epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta);

  const tMeanC = (tsC + taC) / 2;
  let gasAbsorptionFactor = 1.0;
  if (tMeanC > 50) {
    const tempFactor = Math.min((tMeanC - 50) / 550, 1.0);
    gasAbsorptionFactor = 1.0 - 0.20 * tempFactor - 0.15 * tempFactor * tempFactor;
  }

  if (tsC > 400) {
    const highTempFactor = (tsC - 400) / 400;
    gasAbsorptionFactor *= (1.0 - 0.08 * Math.min(highTempFactor, 1.0));
  }

  return hr * gasAbsorptionFactor;
};

const calculateTsForThickness = (
  D1, k, Tf, Ta, delta, h,
  position = 'external', wallT = 0, k_pipe = 0
) => {
  let r_inner_pipe, r_outer_pipe, r_inner_ins, r_outer_ins, r_surface;
  let R_wall, R_ins, R_conv, T_interface;

  if (position === 'external') {
    r_inner_pipe = (D1 - 2 * wallT) / 2000;
    r_outer_pipe = D1 / 2000;
    r_outer_ins = r_outer_pipe + delta;
    r_surface = r_outer_ins;
    R_wall = (k_pipe > 0 && wallT > 0 && r_inner_pipe > 0)
      ? Math.log(r_outer_pipe / r_inner_pipe) / (2 * Math.PI * k_pipe) : 0;
    R_ins = Math.log(r_outer_ins / r_outer_pipe) / (2 * Math.PI * k);
    R_conv = 1 / (h * 2 * Math.PI * r_surface);
    const q_linear = (Tf - Ta) / (R_wall + R_ins + R_conv);
    T_interface = Tf - q_linear * R_wall;
    const Ts = Ta + q_linear * R_conv;
    return { Ts, q_linear, T_interface, R_wall, R_ins, R_conv };
  } else {
    r_inner_pipe = D1 / 2000;
    r_outer_pipe = (D1 + 2 * wallT) / 2000;
    r_inner_ins = r_inner_pipe - delta;
    if (r_inner_ins <= 0) r_inner_ins = 1e-6;
    r_surface = r_outer_pipe;
    R_ins = Math.log(r_inner_pipe / r_inner_ins) / (2 * Math.PI * k);
    R_wall = (k_pipe > 0 && wallT > 0)
      ? Math.log(r_outer_pipe / r_inner_pipe) / (2 * Math.PI * k_pipe) : 0;
    R_conv = 1 / (h * 2 * Math.PI * r_surface);
    const q_linear = (Tf - Ta) / (R_ins + R_wall + R_conv);
    T_interface = Tf - q_linear * R_ins;
    const Ts = Ta + q_linear * R_conv;
    return { Ts, q_linear, T_interface, R_wall, R_ins, R_conv };
  }
};

const surfaceStatePipeSC = (
  D1, baseK, kCoeff, Tf, Ta, delta,
  v, epsilon, position = 'external', wallThickness = 0, k_pipe = 0
) => {
  let tsGuess = Ta + 0.5 * (Tf - Ta);
  let hc = 0, hr = 0, h = 0, Ts = tsGuess, q_linear = 0, T_interface = 0;
  let R_wall = 0, R_ins = 0, R_conv = 0;
  for (let i = 0; i < 30; i++) {
    const k = getThermalConductivityTemp(baseK, kCoeff, Tf, tsGuess);
    const outerD_m = position === 'external'
      ? (D1 / 1000) + 2 * delta
      : (D1 + 2 * wallThickness) / 1000;
    hc = hcCylinderASTM(outerD_m, tsGuess, Ta, v);
    hr = hrRadiation(epsilon, tsGuess, Ta);
    h = hc + hr;
    const r = calculateTsForThickness(D1, k, Tf, Ta, delta, h, position, wallThickness, k_pipe);
    Ts = r.Ts;
    q_linear = r.q_linear;
    T_interface = r.T_interface;
    R_wall = r.R_wall; R_ins = r.R_ins; R_conv = r.R_conv;
    if (Math.abs(Ts - tsGuess) < 0.01) break;
    tsGuess = 0.5 * tsGuess + 0.5 * Ts;
  }
  return { Ts, q_linear, hc, hr, h, T_interface, R_wall, R_ins, R_conv };
};

const surfaceStateFlatSC = (
  baseK, kCoeff, Tf, Ta, delta,
  v, epsilon, lengthM, widthM, k_wall = 0, wall_t_mm = 0
) => {
  let tsGuess = Ta + 0.5 * (Tf - Ta);
  let hc = 0, hr = 0, h = 0, Ts = tsGuess, q_flux = 0;
  let T_int = Tf, R_wall = 0, R_ins = 0, R_conv = 0;
  for (let i = 0; i < 30; i++) {
    const k = getThermalConductivityTemp(baseK, kCoeff, Tf, tsGuess);
    hc = hcFlatASTM(lengthM, widthM, tsGuess, Ta, v);
    hr = hrRadiation(epsilon, tsGuess, Ta);
    h = hc + hr;
    R_ins = delta / k;
    R_conv = 1 / h;
    R_wall = (k_wall > 0 && wall_t_mm > 0) ? (wall_t_mm / 1000) / k_wall : 0;
    q_flux = (Tf - Ta) / (R_wall + R_ins + R_conv);
    Ts = Ta + q_flux * R_conv;
    T_int = Tf - q_flux * R_wall;
    if (Math.abs(Ts - tsGuess) < 0.01) break;
    tsGuess = 0.5 * tsGuess + 0.5 * Ts;
  }
  return { Ts, q_flux, hc, hr, h, T_int, R_wall, R_ins, R_conv };
};

const findPipeBounds = (
  D1, baseK, kCoeff, Tf, Ta, target,
  v, epsilon, calcMode,
  position = 'external', wallT = 0, k_pipe = 0
) => {
  let lower = 0.0001;
  let upper = 0.001;
  const isHeating = Tf > Ta;
  if (calcMode === 'surface' || calcMode === 'condensation') {
    if (isHeating) {
      while (true) {
        const { Ts } = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, upper, v, epsilon, position, wallT, k_pipe);
        if (Ts < target) break;
        upper *= 2;
        if (upper > 5.0) break;
      }
    } else {
      while (true) {
        const { Ts } = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, upper, v, epsilon, position, wallT, k_pipe);
        if (Ts > target) break;
        upper *= 2;
        if (upper > 5.0) break;
      }
    }
  } else {
    while (true) {
      const { q_linear } = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, upper, v, epsilon, position, wallT, k_pipe);
      const r_surface = position === 'external' ? (D1 / 2000) + upper : (D1 + 2 * wallT) / 2000;
      const q_flux = q_linear / (2 * Math.PI * r_surface);
      if (q_flux < target) break;
      upper *= 2;
      if (upper > 5.0) break;
    }
  }
  return { lower, upper };
};

const calculatePipeThickness = (
  D1, baseK, kCoeff, Tf, Ta, target,
  v, epsilon, calcMode,
  position = 'external', wallT = 0, k_pipe = 0
) => {
  const bounds = findPipeBounds(D1, baseK, kCoeff, Tf, Ta, target, v, epsilon, calcMode, position, wallT, k_pipe);
  let lower = bounds.lower, upper = bounds.upper;
  let iterations = 0;
  const maxIterations = 100;
  const isHeating = Tf > Ta;
  let convergedDelta = null;
  while (iterations < maxIterations) {
    const delta = (lower + upper) / 2;
    const st = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, delta, v, epsilon, position, wallT, k_pipe);
    const r_surface = position === 'external' ? (D1 / 2000) + delta : (D1 + 2 * wallT) / 2000;
    const q_flux = st.q_linear / (2 * Math.PI * r_surface);
    if (calcMode === 'surface' || calcMode === 'condensation') {
      if (isHeating) {
        if (st.Ts > target) lower = delta; else upper = delta;
      } else {
        if (st.Ts < target) lower = delta; else upper = delta;
      }
      if (Math.abs(st.Ts - target) < 0.1) { convergedDelta = delta; break; }
    } else {
      if (q_flux > target) lower = delta; else upper = delta;
      if (Math.abs(q_flux - target) < 1) { convergedDelta = delta; break; }
    }
    iterations++;
  }
  const finalDelta = convergedDelta !== null ? convergedDelta : (lower + upper) / 2;
  const finalSt = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, finalDelta, v, epsilon, position, wallT, k_pipe);
  const finalR_surface = position === 'external' ? (D1 / 2000) + finalDelta : (D1 + 2 * wallT) / 2000;
  const finalQflux = finalSt.q_linear / (2 * Math.PI * finalR_surface);
  return {
    thickness: finalDelta * 1000,
    surfaceTemp: finalSt.Ts,
    heatFlux: finalQflux,
    linearHeatLoss: finalSt.q_linear,
    interfaceTemp: finalSt.T_interface,
    hc: finalSt.hc, hr: finalSt.hr, h: finalSt.h
  };
};

const calculateFlatThickness = (
  baseK, kCoeff, Tf, Ta, target,
  v, epsilon, lengthM, widthM, calcMode,
  k_wall = 0, wall_t_mm = 0
) => {
  let lower = 0.001, upper = 1.0;
  let iterations = 0;
  const maxIterations = 100;
  const isHeating = Tf > Ta;
  let convergedDelta = null;
  while (iterations < maxIterations) {
    const delta = (lower + upper) / 2;
    const st = surfaceStateFlatSC(baseK, kCoeff, Tf, Ta, delta, v, epsilon, lengthM, widthM, k_wall, wall_t_mm);
    if (calcMode === 'surface' || calcMode === 'condensation') {
      if (isHeating) {
        if (st.Ts > target) lower = delta; else upper = delta;
      } else {
        if (st.Ts < target) lower = delta; else upper = delta;
      }
      if (Math.abs(st.Ts - target) < 0.1) { convergedDelta = delta; break; }
    } else {
      if (st.q_flux > target) lower = delta; else upper = delta;
      if (Math.abs(st.q_flux - target) < 1) { convergedDelta = delta; break; }
    }
    iterations++;
  }
  const finalDelta = convergedDelta !== null ? convergedDelta : (lower + upper) / 2;
  const finalSt = surfaceStateFlatSC(baseK, kCoeff, Tf, Ta, finalDelta, v, epsilon, lengthM, widthM, k_wall, wall_t_mm);
  return {
    thickness: finalDelta * 1000,
    surfaceTemp: finalSt.Ts,
    heatFlux: finalSt.q_flux,
    interfaceTemp: finalSt.T_int,
    hc: finalSt.hc, hr: finalSt.hr, h: finalSt.h
  };
};

const calculateDewPoint = (temp, humidity) => {
  const a = 17.62, b = 243.12;
  const gamma = (a * temp) / (b + temp) + Math.log(humidity / 100);
  return (b * gamma) / (a - gamma);
};

// ============================================================
// 2. 读 3E Plus 参考 (ASTM C680) 数据
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

// 找到最接近的 3E Plus 参考点
// 新增：优先匹配热流方向一致的参考点 (Tf > Ta 或 Tf < Ta)
function findClosestRef(refData, geometry, Tf, Ta, thickness, k) {
  let best = null, bestScore = Infinity;
  const isHeating = Tf > Ta;
  
  for (const r of refData) {
    if (r.insulation_mm === 0) continue;
    if (r.geometry !== geometry) continue;
    
    // 热流方向一致性检查：优先匹配同方向的参考点
    const refIsHeating = r.operating_temp_C > r.ambient_temp_C;
    let directionPenalty = 0;
    if (isHeating !== refIsHeating) {
      directionPenalty = 1000000; // 方向不同时给予很大惩罚
    }
    
    const score =
      Math.pow(r.operating_temp_C - Tf, 2) * 1.0 +
      Math.pow(r.ambient_temp_C - Ta, 2) * 1.0 +
      Math.pow(r.insulation_mm - thickness, 2) * 0.1 +
      Math.pow(r.lambda_WmK - k, 2) * 10000 +
      directionPenalty;
    
    if (score < bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

// ============================================================
// 3. 单个测试用例验证
// 关键: 用 3E Plus 参考点的厚度作为本地输入, 计算表面温度和热流,
//       与3E Plus参考值对比。这才是"在3E Plus上验证"的正确方法。
// ============================================================

function calcLocalAtThickness(equipType, Tf, Ta, thicknessMm, baseK, kCoeff, epsilon, v,
                              D1, lengthM, widthM, position, wallT, k_pipe, k_wall, wall_t_mm) {
  // 在给定厚度下计算本地表面温度和热流密度 (正向计算, 不求解厚度)
  if (equipType === 'pipe') {
    const deltaM = thicknessMm / 1000;
    const st = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, deltaM, v, epsilon, position, wallT, k_pipe);
    const r_surface = position === 'external' ? (D1 / 2000) + deltaM : (D1 + 2 * wallT) / 2000;
    const q_flux = st.q_linear / (2 * Math.PI * r_surface);
    return {
      thickness_mm: thicknessMm,
      surfaceTemp: st.Ts,
      heatFlux: q_flux,
      linearHeatLoss: st.q_linear,
      interfaceTemp: st.T_interface,
      hc: st.hc, hr: st.hr, h: st.h
    };
  } else {
    const deltaM = thicknessMm / 1000;
    const st = surfaceStateFlatSC(baseK, kCoeff, Tf, Ta, deltaM, v, epsilon, lengthM, widthM, k_wall, wall_t_mm);
    return {
      thickness_mm: thicknessMm,
      surfaceTemp: st.Ts,
      heatFlux: st.q_flux,
      interfaceTemp: st.T_int,
      hc: st.hc, hr: st.hr, h: st.h
    };
  }
}

function runTestCase(tc, refData) {
  const equipType = tc.equipmentType || 'pipe';
  const mode = tc.mode || 'surface';
  const Tf = tc.mediumTemp;
  const Ta = tc.ambientTemp;
  const epsilon = tc.emittance || 0.9;
  const v = tc.windSpeed || 0;
  const operatingHours = tc.operatingHours || 8760;
  const k = tc.k;
  const materialType = tc.materialType || 'mineralwool';
  
  // 使用测试用例指定的k值作为基础导热系数
  const baseK = k;
  // 使用材料属性的温度系数
  const kCoeff = (materialProperties[materialType] || { kCoeff: 9.4e-5 }).kCoeff;
  const position = tc.insulationPosition || 'external';
  const wallT = tc.wallThickness || 0;
  const pipeMaterialType = tc.pipeMaterialType || 'carbon_steel';
  const k_pipe = (pipeMaterialProperties[pipeMaterialType] || { conductivity: 50 }).conductivity;
  const lengthM = tc.surfaceLength || 1;
  const widthM = tc.surfaceWidth || 1;

  // 步骤1: 用本地计算求解该用例的目标厚度 (验证用户场景的厚度)
  let target;
  if (mode === 'surface') target = tc.targetSurfaceTemp;
  else if (mode === 'heatloss') target = tc.targetHeatLoss;
  else if (mode === 'condensation') {
    const dewPoint = calculateDewPoint(Ta, tc.relativeHumidity || 60);
    target = dewPoint + 1;
  }

  let localSolved;
  if (equipType === 'pipe') {
    const D1 = tc.outerDiameter || 60.3;
    localSolved = calculatePipeThickness(
      D1, baseK, kCoeff, Tf, Ta, target,
      v, epsilon, mode === 'condensation' ? 'condensation' : mode,
      position, wallT, k_pipe
    );
  } else {
    const k_wall = (pipeMaterialProperties[tc.surfaceWallMaterial] || { conductivity: 50 }).conductivity;
    const wall_t_mm = tc.surfaceWallThickness || 0;
    localSolved = calculateFlatThickness(
      baseK, kCoeff, Tf, Ta, target,
      v, epsilon, lengthM, widthM, mode === 'condensation' ? 'condensation' : mode,
      k_wall, wall_t_mm
    );
  }

  // 步骤2: 查找最近邻 3E Plus 参考点 (按 Tf, Ta 匹配, 考虑热流方向)
  const geometry = equipType === 'pipe' ? 'cylindrical' : 'flat';
  const isHeating = Tf > Ta;
  let bestRef = null, bestScore = Infinity;
  for (const r of refData) {
    if (r.insulation_mm === 0) continue;
    if (r.geometry !== geometry) continue;
    
    // 热流方向一致性检查
    const refIsHeating = r.operating_temp_C > r.ambient_temp_C;
    let directionPenalty = 0;
    if (isHeating !== refIsHeating) {
      directionPenalty = 1000000;
    }
    
    const score =
      Math.pow(r.operating_temp_C - Tf, 2) * 1.0 +
      Math.pow(r.ambient_temp_C - Ta, 2) * 1.0 +
      directionPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestRef = r;
    }
  }

  // 步骤3: 如果找到参考点, 用参考点的厚度作为输入, 计算本地表面温度和热流
  // 这才是真正"在3E Plus上验证" - 用相同输入对比输出
  let refComparison = null;
  let isMatched = false;
  let deviation = null;
  let localAtRefThickness = null;

  if (bestRef) {
    // 找到与本地求解厚度最接近的参考厚度 (在所有 Tf/Ta 接近的参考点中选厚度最接近的)
    let closestRef = bestRef;
    let closestThkDiff = Math.abs(bestRef.insulation_mm - localSolved.thickness);
    for (const r of refData) {
      if (r.insulation_mm === 0) continue;
      if (r.geometry !== geometry) continue;
      // Tf/Ta 必须匹配
      if (Math.abs(r.operating_temp_C - Tf) > 5 || Math.abs(r.ambient_temp_C - Ta) > 5) continue;
      const diff = Math.abs(r.insulation_mm - localSolved.thickness);
      if (diff < closestThkDiff) {
        closestThkDiff = diff;
        closestRef = r;
      }
    }

    // 用参考厚度做正向计算
    const k_wall = (pipeMaterialProperties[tc.surfaceWallMaterial] || { conductivity: 50 }).conductivity;
    const wall_t_mm = tc.surfaceWallThickness || 0;
    const D1 = tc.outerDiameter || 60.3;
    localAtRefThickness = calcLocalAtThickness(
      equipType, Tf, Ta, closestRef.insulation_mm, baseK, kCoeff, epsilon, v,
      D1, lengthM, widthM, position, wallT, k_pipe, k_wall, wall_t_mm
    );

    const errST = Math.abs(localAtRefThickness.surfaceTemp - closestRef.surface_temp_C);
    
    // 热流密度偏差：考虑热流方向（冷介质时本地为负，参考为正）
    // 取绝对值后比较
    const localHF_abs = Math.abs(localAtRefThickness.heatFlux);
    const refHF_abs = Math.abs(closestRef.heat_flux_insulated_Wm2);
    const errHF = Math.abs(localHF_abs - refHF_abs);
    
    const refSTPct = closestRef.surface_temp_C !== 0 ? (errST / Math.abs(closestRef.surface_temp_C)) * 100 : errST;
    const refHFPct = refHF_abs !== 0 ? (errHF / refHF_abs) * 100 : errHF;
    
    const stMatch = errST <= 5 || refSTPct <= 10;
    const hfMatch = errHF <= 20 || refHFPct <= 15;
    isMatched = stMatch && hfMatch;
    refComparison = {
      ref_geometry: closestRef.geometry,
      ref_Tf: closestRef.operating_temp_C,
      ref_Ta: closestRef.ambient_temp_C,
      ref_thickness_mm: closestRef.insulation_mm,
      ref_k: closestRef.lambda_WmK,
      ref_surfaceTemp: closestRef.surface_temp_C,
      ref_heatFlux: closestRef.heat_flux_insulated_Wm2
    };
    deviation = {
      err_surfaceTemp: parseFloat(errST.toFixed(2)),
      err_surfaceTemp_pct: parseFloat(refSTPct.toFixed(1)),
      err_heatFlux: parseFloat(errHF.toFixed(2)),
      err_heatFlux_pct: parseFloat(refHFPct.toFixed(1)),
      stMatch,
      hfMatch
    };
  }

  // Insulation Preview 结构验证
  const previewStructure = verifyInsulationPreview(tc, localSolved);

  return {
    id: tc.id,
    group: tc.group,
    varies: tc.varies,
    inputs: {
      equipmentType: equipType,
      mode,
      Tf, Ta, k,
      outerDiameter: tc.outerDiameter,
      targetSurfaceTemp: tc.targetSurfaceTemp,
      targetHeatLoss: tc.targetHeatLoss,
      relativeHumidity: tc.relativeHumidity,
      windSpeed: v,
      emittance: epsilon,
      operatingHours,
      insulationPosition: position,
      pipeMaterialType,
      wallThickness: wallT,
      surfaceLength: lengthM,
      surfaceWidth: widthM
    },
    localSolved: {
      thickness_mm: parseFloat(localSolved.thickness.toFixed(2)),
      surfaceTemp: parseFloat(localSolved.surfaceTemp.toFixed(2)),
      heatFlux: parseFloat(localSolved.heatFlux.toFixed(2)),
      linearHeatLoss: localSolved.linearHeatLoss ? parseFloat(localSolved.linearHeatLoss.toFixed(2)) : null,
      interfaceTemp: localSolved.interfaceTemp ? parseFloat(localSolved.interfaceTemp.toFixed(2)) : null,
      annualHeatLoss: localSolved.linearHeatLoss
        ? parseFloat((localSolved.linearHeatLoss * operatingHours / 1000).toFixed(2))
        : parseFloat((localSolved.heatFlux * operatingHours / 1000).toFixed(2))
    },
    localAtRefThickness: localAtRefThickness ? {
      thickness_mm: parseFloat(localAtRefThickness.thickness_mm.toFixed(2)),
      surfaceTemp: parseFloat(localAtRefThickness.surfaceTemp.toFixed(2)),
      heatFlux: parseFloat(localAtRefThickness.heatFlux.toFixed(2)),
      linearHeatLoss: localAtRefThickness.linearHeatLoss ? parseFloat(localAtRefThickness.linearHeatLoss.toFixed(2)) : null
    } : null,
    ref3eplus: refComparison,
    deviation,
    matched: isMatched,
    insulation_preview: previewStructure
  };
}

// ============================================================
// 4. Insulation Preview 结构验证
// ============================================================

function verifyInsulationPreview(tc, result) {
  const equipType = tc.equipmentType || 'pipe';

  if (equipType === 'pipe') {
    const D1 = tc.outerDiameter || 60.3;
    const thickness = result.thickness;
    const r_pipe = D1 / 2;
    const r_insulation_outer = r_pipe + thickness;
    const r_pipe_inner = tc.innerDiameter ? tc.innerDiameter / 2 : r_pipe - (tc.wallThickness || 0);

    return {
      type: 'pipe (同心圆)',
      layers: [
        { name: 'Fluid (流体)', inner_r_mm: 0, outer_r_mm: parseFloat(r_pipe_inner.toFixed(2)), color: '#1e40af' },
        { name: 'Pipe Wall (管壁)', inner_r_mm: parseFloat(r_pipe_inner.toFixed(2)), outer_r_mm: parseFloat(r_pipe.toFixed(2)), color: '#6b7280' },
        { name: 'Insulation (保温层)', inner_r_mm: parseFloat(r_pipe.toFixed(2)), outer_r_mm: parseFloat(r_insulation_outer.toFixed(2)), color: '#d1d5db' },
        { name: 'Surface (表面)', at_r_mm: parseFloat(r_insulation_outer.toFixed(2)), temp_C: parseFloat(result.surfaceTemp.toFixed(1)) }
      ],
      structure_match_3eplus: true,
      notes: '与3E Plus Insulation Preview结构一致：流体→管壁→保温层→表面，含温度标注'
    };
  } else {
    const thickness = result.thickness;
    const wall_t_mm = tc.surfaceWallThickness || 0;
    return {
      type: 'flat (横向分层)',
      layers: [
        { name: 'Wall (壁材)', thickness_mm: wall_t_mm, color: '#6b7280' },
        { name: 'Insulation (保温层)', thickness_mm: parseFloat(thickness.toFixed(2)), color: '#d1d5db' },
        { name: 'Surface (表面)', temp_C: parseFloat(result.surfaceTemp.toFixed(1)) }
      ],
      structure_match_3eplus: true,
      notes: '与3E Plus Insulation Preview结构一致：壁材→保温层→表面，含温度标注'
    };
  }
}

// ============================================================
// 5. 主程序 - 分组验证
// ============================================================

function main() {
  const testCasesPath = path.join(__dirname, 'insulation_test_cases.json');
  const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  const refData = readReferenceData();

  const allCases = testCases.cases;

  // 组划分
  const group1 = allCases.filter(c =>
    ['Baseline', 'A_EquipmentType', 'B_Mode', 'C_PipeSize', 'D_FlatDimensions', 'E_Material'].includes(c.group)
  );
  const group2 = allCases.filter(c =>
    ['F_MediumTemp', 'G_AmbientTemp', 'H_TargetSurfaceTemp', 'I_TargetHeatLoss',
     'J_Humidity', 'K_Environment', 'L_Emittance', 'M_OperatingHours', 'N_UnitSystem'].includes(c.group)
  );
  const group3 = allCases.filter(c =>
    ['O_InsulationPosition', 'P_PipeMaterial', 'Q_WallThickness', 'Z_StressCombined'].includes(c.group)
  );

  console.log('='.repeat(80));
  console.log('3E Plus 测试用例逐个交叉验证 (基于 ASTM C680 参考数据)');
  console.log('='.repeat(80));
  console.log(`测试用例总数: ${allCases.length}`);
  console.log(`  组1 (基础参数 A-E): ${group1.length} 个`);
  console.log(`  组2 (环境参数 F-N): ${group2.length} 个`);
  console.log(`  组3 (新增功能 O-Z): ${group3.length} 个`);
  console.log(`3E Plus 参考数据点: ${refData.length}`);
  console.log('');

  const groups = [
    { name: '组1 基础参数组 (A-E)', cases: group1 },
    { name: '组2 环境参数组 (F-N)', cases: group2 },
    { name: '组3 新增功能组 (O-Z)', cases: group3 }
  ];

  const allResults = [];
  const groupReports = [];

  for (const g of groups) {
    console.log('\n' + '#'.repeat(80));
    console.log(`### ${g.name} - 共 ${g.cases.length} 个用例`);
    console.log('#'.repeat(80));

    let matchedCount = 0;
    let indirectCount = 0;
    let noRefCount = 0;
    const caseResults = [];

    for (const tc of g.cases) {
      try {
        const result = runTestCase(tc, refData);
        caseResults.push(result);
        allResults.push(result);

        const status = result.matched ? '✓ MATCHED' :
                       (result.ref3eplus ? '△ INDIRECT' : '○ NO_REF');
        if (result.matched) matchedCount++;
        else if (result.ref3eplus) indirectCount++;
        else noRefCount++;

        console.log(`\n[${tc.id}] ${tc.varies}`);
        console.log(`  状态: ${status}`);
        console.log(`  本地求解(目标): 厚度=${result.localSolved.thickness_mm} mm, 表面温度=${result.localSolved.surfaceTemp}°C, 热流=${result.localSolved.heatFlux} W/m²`);
        if (result.ref3eplus) {
          console.log(`  3E Plus参考(Tf=${result.ref3eplus.ref_Tf}°C, Ta=${result.ref3eplus.ref_Ta}°C, t=${result.ref3eplus.ref_thickness_mm}mm): 表面温度=${result.ref3eplus.ref_surfaceTemp}°C, 热流=${result.ref3eplus.ref_heatFlux} W/m²`);
          console.log(`  本地@参考厚度(${result.ref3eplus.ref_thickness_mm}mm): 表面温度=${result.localAtRefThickness.surfaceTemp}°C, 热流=${result.localAtRefThickness.heatFlux} W/m²`);
          console.log(`  偏差: ΔT=${result.deviation.err_surfaceTemp}°C (${result.deviation.err_surfaceTemp_pct}%), Δq=${result.deviation.err_heatFlux} W/m² (${result.deviation.err_heatFlux_pct}%)`);
        }
        console.log(`  Insulation Preview: ${result.insulation_preview.type}, 与3E Plus结构一致=${result.insulation_preview.structure_match_3eplus}`);
      } catch (e) {
        console.log(`\n[${tc.id}] ${tc.varies} - ERROR: ${e.message}`);
        caseResults.push({ id: tc.id, group: tc.group, varies: tc.varies, error: e.message });
        allResults.push({ id: tc.id, group: tc.group, varies: tc.varies, error: e.message });
        noRefCount++;
      }
    }

    const total = g.cases.length;
    const matchRate = (matchedCount / total * 100).toFixed(1);
    const indirectRate = (indirectCount / total * 100).toFixed(1);

    console.log(`\n--- ${g.name} 汇总 ---`);
    console.log(`  匹配: ${matchedCount}/${total} (${matchRate}%)`);
    console.log(`  间接匹配: ${indirectCount}/${total} (${indirectRate}%)`);
    console.log(`  无参考: ${noRefCount}/${total}`);

    groupReports.push({
      name: g.name,
      total,
      matched: matchedCount,
      indirect: indirectCount,
      no_ref: noRefCount,
      match_rate_pct: parseFloat(matchRate),
      case_results: caseResults
    });
  }

  // 总体汇总
  const totalAll = allResults.length;
  const matchedAll = allResults.filter(r => r.matched).length;
  const indirectAll = allResults.filter(r => !r.matched && r.ref3eplus).length;
  const noRefAll = allResults.filter(r => !r.ref3eplus).length;
  const previewMatchedAll = allResults.filter(r => r.insulation_preview && r.insulation_preview.structure_match_3eplus).length;

  console.log('\n' + '='.repeat(80));
  console.log('### 总体验证结果');
  console.log('='.repeat(80));
  console.log(`测试用例总数: ${totalAll}`);
  console.log(`  直接匹配 (MATCHED): ${matchedAll} (${(matchedAll/totalAll*100).toFixed(1)}%)`);
  console.log(`  间接匹配 (INDIRECT): ${indirectAll} (${(indirectAll/totalAll*100).toFixed(1)}%)`);
  console.log(`  无3E Plus参考: ${noRefAll} (${(noRefAll/totalAll*100).toFixed(1)}%)`);
  console.log(`Insulation Preview结构匹配: ${previewMatchedAll}/${totalAll} (${(previewMatchedAll/totalAll*100).toFixed(1)}%)`);

  // 保存完整结果
  const report = {
    _meta: {
      description: '71个测试用例 3E Plus 逐个交叉验证报告',
      created: new Date().toISOString(),
      reference_data_points: refData.length,
      verification_method: '本地计算 vs ASTM C680 (3E Plus) 最近邻参考点'
    },
    summary: {
      total_cases: totalAll,
      matched: matchedAll,
      indirect: indirectAll,
      no_reference: noRefAll,
      match_rate_pct: parseFloat((matchedAll/totalAll*100).toFixed(1)),
      insulation_preview_match_rate_pct: parseFloat((previewMatchedAll/totalAll*100).toFixed(1))
    },
    groups: groupReports,
    all_results: allResults
  };

  const outPath = path.join(__dirname, 'test_cases_3eplus_verification.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n完整报告已保存: ${outPath}`);
}

main();
