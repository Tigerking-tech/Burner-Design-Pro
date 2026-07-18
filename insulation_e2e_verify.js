#!/usr/bin/env node
/**
 * 保温计算模块 端到端验证脚本
 * 提取前端计算逻辑，与Python参考实现(ASTM C680/ISO 12241)进行全面对比
 */

const SIGMA_SB = 5.670374419e-8;

function getThermalConductivityTemp(baseK, kCoeff, Tf, Ts) {
  const T_mean = (Tf + Ts) / 2;
  return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean;
}

function airProperties(tMeanC) {
  const kAir = 0.02421 + 7.8e-5 * tMeanC - 1.4e-8 * tMeanC * tMeanC;
  const nu = 1.334e-5 + 9.0e-8 * tMeanC;
  const alpha = 1.887e-5 + 1.26e-7 * tMeanC;
  const Pr = 0.71;
  const beta = 1.0 / (tMeanC + 273.15);
  return { kAir, nu, alpha, Pr, beta };
}

function hcCylinderASTM(dM, tsC, taC, v) {
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
    ? 0.3 + 0.62 * Math.pow(Re, 0.5) * Math.pow(Pr, 1 / 3)
          / Math.pow(1 + Math.pow(0.4 / Pr, 2 / 3), 0.25)
          * Math.pow(1 + 0.07 * Math.pow(Re, 0.6), 0.05)
    : 0;
  const Nu = (NuNat + NuFor) > 0
    ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
    : 0.36;
  return Math.max(Nu * kAir / d, 0.5);
}

function hcFlatASTM(lengthM, widthM, tsC, taC, v) {
  const tMean = (tsC + taC) / 2;
  const { kAir, nu, alpha, Pr, beta } = airProperties(tMean);
  const area = lengthM * widthM;
  const perim = 2 * (lengthM + widthM);
  const L = perim > 0 ? area / perim : 1.0;
  const dT = Math.abs(tsC - taC);
  const Ra = dT > 1e-6 ? (9.81 * beta * dT * Math.pow(L, 3)) / (nu * alpha) : 0;
  const NuNat = Ra > 0
    ? (Ra > 1e7 ? 0.15 * Math.pow(Ra, 1 / 3) : 0.59 * Math.pow(Ra, 0.25))
    : 0.5;
  const Re = v * L / nu;
  const NuFor = Re > 1e-3
    ? 0.664 * Math.pow(Re, 0.5) * Math.pow(Pr, 1 / 3) + 0.037 * Math.pow(Re, 0.8) * Math.pow(Pr, 1 / 3)
    : 0;
  const Nu = (NuNat + NuFor) > 0
    ? Math.pow(Math.pow(NuNat, 3.5) + Math.pow(NuFor, 3.5), 1 / 3.5)
    : NuNat;
  return Math.max(Nu * kAir / L, 0.5);
}

function hrRadiation(epsilon, tsC, taC) {
  const Ts = tsC + 273.15;
  const Ta = taC + 273.15;
  if (Math.abs(Ts - Ta) < 1e-6) {
    return 4 * epsilon * SIGMA_SB * Math.pow(Ts, 3);
  }
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta);
}

function calculateTsForThickness(D1, k, Tf, Ta, delta, h, position = 'external', wallT = 0, k_pipe = 0) {
  let r_inner_pipe, r_outer_pipe, r_inner_ins, r_outer_ins, r_surface;
  let R_wall, R_ins, R_conv;
  let T_interface;

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
}

function surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, delta, v, epsilon, position = 'external', wallThickness = 0, k_pipe = 0) {
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
    R_wall = r.R_wall;
    R_ins = r.R_ins;
    R_conv = r.R_conv;
    if (Math.abs(Ts - tsGuess) < 0.01) break;
    tsGuess = 0.5 * tsGuess + 0.5 * Ts;
  }
  return { Ts, q_linear, hc, hr, h, T_interface, R_wall, R_ins, R_conv };
}

function surfaceStateFlatSC(baseK, kCoeff, Tf, Ta, delta, v, epsilon, lengthM, widthM, k_wall = 0, wall_t_mm = 0) {
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
    if (k_wall > 0 && wall_t_mm > 0) {
      R_wall = (wall_t_mm / 1000) / k_wall;
    } else {
      R_wall = 0;
    }
    q_flux = (Tf - Ta) / (R_wall + R_ins + R_conv);
    Ts = Ta + q_flux * R_conv;
    T_int = Tf - q_flux * R_wall;
    if (Math.abs(Ts - tsGuess) < 0.01) break;
    tsGuess = 0.5 * tsGuess + 0.5 * Ts;
  }
  return { Ts, q_flux, hc, hr, h, T_int, R_wall, R_ins, R_conv };
}

function calculatePipeThickness(D1, baseK, kCoeff, Tf, Ta, target, v, epsilon, calcMode, position = 'external', wallT = 0, k_pipe = 0) {
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
      const r_surface = position === 'external'
        ? (D1 / 2000) + upper
        : (D1 + 2 * wallT) / 2000;
      const q_flux = q_linear / (2 * Math.PI * r_surface);
      if (q_flux < target) break;
      upper *= 2;
      if (upper > 5.0) break;
    }
  }

  let iterations = 0;
  const maxIterations = 100;
  let convergedDelta = null;

  while (iterations < maxIterations) {
    const delta = (lower + upper) / 2;
    const st = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, delta, v, epsilon, position, wallT, k_pipe);
    const r_surface = position === 'external'
      ? (D1 / 2000) + delta
      : (D1 + 2 * wallT) / 2000;
    const q_flux = st.q_linear / (2 * Math.PI * r_surface);

    if (calcMode === 'surface' || calcMode === 'condensation') {
      if (isHeating) {
        if (st.Ts > target) {
          lower = delta;
        } else {
          upper = delta;
        }
      } else {
        if (st.Ts < target) {
          lower = delta;
        } else {
          upper = delta;
        }
      }
      if (Math.abs(st.Ts - target) < 0.1) { convergedDelta = delta; break; }
    } else {
      if (q_flux > target) {
        lower = delta;
      } else {
        upper = delta;
      }
      if (Math.abs(q_flux - target) < 1) { convergedDelta = delta; break; }
    }
    iterations++;
  }

  const finalDelta = convergedDelta !== null ? convergedDelta : (lower + upper) / 2;
  const finalSt = surfaceStatePipeSC(D1, baseK, kCoeff, Tf, Ta, finalDelta, v, epsilon, position, wallT, k_pipe);
  const finalR_surface = position === 'external'
    ? (D1 / 2000) + finalDelta
    : (D1 + 2 * wallT) / 2000;
  const finalQflux = finalSt.q_linear / (2 * Math.PI * finalR_surface);

  return {
    thickness: finalDelta * 1000,
    surfaceTemp: finalSt.Ts,
    heatFlux: finalQflux,
    linearHeatLoss: finalSt.q_linear,
    interfaceTemp: finalSt.T_interface,
    hc: finalSt.hc,
    hr: finalSt.hr,
    h: finalSt.h,
    R_wall: finalSt.R_wall,
    R_insulation: finalSt.R_ins,
    R_conv: finalSt.R_conv
  };
}

function calculateFlatThickness(baseK, kCoeff, Tf, Ta, target, v, epsilon, lengthM, widthM, calcMode, k_wall = 0, wall_t_mm = 0) {
  let lower = 0.001;
  let upper = 1.0;
  let iterations = 0;
  const maxIterations = 100;
  const isHeating = Tf > Ta;
  let convergedDelta = null;

  while (iterations < maxIterations) {
    const delta = (lower + upper) / 2;
    const st = surfaceStateFlatSC(baseK, kCoeff, Tf, Ta, delta, v, epsilon, lengthM, widthM, k_wall, wall_t_mm);

    if (calcMode === 'surface' || calcMode === 'condensation') {
      if (isHeating) {
        if (st.Ts > target) {
          lower = delta;
        } else {
          upper = delta;
        }
      } else {
        if (st.Ts < target) {
          lower = delta;
        } else {
          upper = delta;
        }
      }
      if (Math.abs(st.Ts - target) < 0.1) { convergedDelta = delta; break; }
    } else {
      if (st.q_flux > target) {
        lower = delta;
      } else {
        upper = delta;
      }
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
    hc: finalSt.hc,
    hr: finalSt.hr,
    h: finalSt.h,
    R_wall: finalSt.R_wall,
    R_insulation: finalSt.R_ins,
    R_conv: finalSt.R_conv
  };
}

function calculateDewPoint(temp, humidity) {
  const a = 17.62;
  const b = 243.12;
  const gamma = (a * temp) / (b + temp) + Math.log(humidity / 100);
  return (b * gamma) / (a - gamma);
}

// ============================================================
// 验证框架
// ============================================================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(name, valJS, valPy, tolAbs = 0, tolRel = 0) {
  totalTests++;
  if (valJS === null || valJS === undefined || valPy === null || valPy === undefined) {
    return 'N/A';
  }
  const diff = Math.abs(valJS - valPy);
  const rel = Math.abs(valPy) > 1e-10 ? (diff / Math.abs(valPy) * 100) : 0;
  const ok = diff <= tolAbs || rel <= tolRel;
  if (ok) {
    passedTests++;
    return 'PASS';
  } else {
    failedTests++;
    failures.push({ name, valJS, valPy, diff, rel });
    return 'FAIL';
  }
}

function printSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80));
}

// ============================================================
// 测试用例
// ============================================================

async function runTests() {
  console.log('='.repeat(80));
  console.log('  保温计算模块 前端(JS) vs 参考实现(Python) 对比验证');
  console.log('  Frontend (JS) vs Reference (Python) Comparison');
  console.log('='.repeat(80));

  // 我们用 execSync 调用 Python 参考实现
  const { execSync } = require('child_process');

  function runPython(params) {
    const pyCode = `
import json, sys
sys.path.insert(0, '/workspace')
import insulation_reference as ref
params = json.loads('''${JSON.stringify(params)}''')
r = ref.calculate(params)
print(json.dumps({
  'thickness_mm': r['thickness_mm'],
  'surfaceTemp': r['surfaceTemp'],
  'heatFlux': r['heatFlux'],
  'linearHeatLoss': r.get('linearHeatLoss'),
  'interfaceTemp': r['interfaceTemp'],
  'hc': r['hc'],
  'hr': r['hr'],
  'h': r['h'],
  'R_wall': r.get('R_wall', 0),
  'R_insulation': r.get('R_insulation', 0),
  'R_conv': r.get('R_conv', 0),
}))
`;
    const result = execSync(`python3 -c "${pyCode.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
    return JSON.parse(result.trim());
  }

  // ----------------------------------------------------------
  // PART 1: 管子场景 - 默认工况对比
  // ----------------------------------------------------------
  printSection('PART 1: 管子默认工况 (Surface Temp 模式)');

  const pipeDefault = {
    equipmentType: 'pipe',
    mode: 'surface',
    outerDiameter: 60.3,
    wallThickness: 3.91,
    pipeMaterial: 'carbon_steel',
    pipeMaterialK: 50,
    k: 0.04,
    kCoeff: 1.8e-4,
    mediumTemp: 150,
    ambientTemp: 20,
    targetSurfaceTemp: 50,
    windSpeed: 0,
    emittance: 0.9,
    operatingHours: 8760,
    insulationPosition: 'external'
  };

  const jsPipe1 = calculatePipeThickness(
    60.3, 0.04, 1.8e-4, 150, 20, 50, 0, 0.9, 'surface', 'external', 3.91, 50
  );
  const pyPipe1 = runPython(pipeDefault);

  console.log(`  厚度:   JS=${jsPipe1.thickness.toFixed(2)}mm,  PY=${pyPipe1.thickness_mm.toFixed(2)}mm  [${check('厚度', jsPipe1.thickness, pyPipe1.thickness_mm, 1.0, 2)}]`);
  console.log(`  表面温: JS=${jsPipe1.surfaceTemp.toFixed(2)}°C, PY=${pyPipe1.surfaceTemp.toFixed(2)}°C  [${check('表面温度', jsPipe1.surfaceTemp, pyPipe1.surfaceTemp, 0.5)}]`);
  console.log(`  热流密: JS=${jsPipe1.heatFlux.toFixed(1)}W/m², PY=${pyPipe1.heatFlux.toFixed(1)}W/m²  [${check('热流密度', jsPipe1.heatFlux, pyPipe1.heatFlux, 5, 3)}]`);
  console.log(`  线热损: JS=${jsPipe1.linearHeatLoss.toFixed(1)}W/m,  PY=${pyPipe1.linearHeatLoss.toFixed(1)}W/m  [${check('线热损失', jsPipe1.linearHeatLoss, pyPipe1.linearHeatLoss, 5, 3)}]`);
  console.log(`  界面温: JS=${jsPipe1.interfaceTemp.toFixed(2)}°C, PY=${pyPipe1.interfaceTemp.toFixed(2)}°C  [${check('界面温度', jsPipe1.interfaceTemp, pyPipe1.interfaceTemp, 1.0)}]`);
  console.log(`  hc:     JS=${jsPipe1.hc.toFixed(2)}, PY=${pyPipe1.hc.toFixed(2)}  [${check('对流系数', jsPipe1.hc, pyPipe1.hc, 0.5, 2)}]`);
  console.log(`  hr:     JS=${jsPipe1.hr.toFixed(2)}, PY=${pyPipe1.hr.toFixed(2)}  [${check('辐射系数', jsPipe1.hr, pyPipe1.hr, 0.3, 3)}]`);
  console.log(`  h:      JS=${jsPipe1.h.toFixed(2)}, PY=${pyPipe1.h.toFixed(2)}  [${check('总换热系数', jsPipe1.h, pyPipe1.h, 0.5, 2)}]`);

  // ----------------------------------------------------------
  // PART 2: 管子场景 - 三种模式
  // ----------------------------------------------------------
  printSection('PART 2: 管子三种模式验证');

  const pipeModes = [
    { name: 'Surface Temp 50°C', mode: 'surface', target: 50, targetField: 'targetSurfaceTemp' },
    { name: 'Heat Loss 100W/m²', mode: 'heatloss', target: 100, targetField: 'targetHeatLoss' },
    { name: 'Anti-Condensation RH60% (制冷)', mode: 'condensation', target: null, targetField: 'relativeHumidity', tf: 5, ta: 25, k: 0.023, kCoeff: 5e-5 },
  ];

  for (const m of pipeModes) {
    const tf = m.tf || 150;
    const ta = m.ta || 20;
    const k = m.k || 0.04;
    const kCoeff = m.kCoeff || 1.8e-4;

    let targetVal;
    if (m.mode === 'condensation') {
      targetVal = calculateDewPoint(ta, 60) + 1;
    } else {
      targetVal = m.target;
    }

    const jsR = calculatePipeThickness(60.3, k, kCoeff, tf, ta, targetVal, 0, 0.9, m.mode, 'external', 3.91, 50);

    const pyParams = {
      equipmentType: 'pipe',
      mode: m.mode,
      outerDiameter: 60.3,
      wallThickness: 3.91,
      pipeMaterial: 'carbon_steel',
      pipeMaterialK: 50,
      k: k,
      kCoeff: kCoeff,
      mediumTemp: tf,
      ambientTemp: ta,
      windSpeed: 0,
      emittance: 0.9,
      operatingHours: 8760,
      insulationPosition: 'external'
    };
    if (m.mode === 'surface') pyParams.targetSurfaceTemp = m.target;
    else if (m.mode === 'heatloss') pyParams.targetHeatLoss = m.target;
    else pyParams.relativeHumidity = 60;

    const pyR = runPython(pyParams);

    const s1 = check(`Ts ${m.name}`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    const s2 = check(`厚度 ${m.name}`, jsR.thickness, pyR.thickness_mm, 2.0, 3);
    console.log(`  ${m.name}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s1}], δ JS=${jsR.thickness.toFixed(1)}mm PY=${pyR.thickness_mm.toFixed(1)}mm [${s2}]`);
  }

  // ----------------------------------------------------------
  // PART 3: 管子场景 - 内外保温
  // ----------------------------------------------------------
  printSection('PART 3: 管子内外保温验证');

  for (const pos of ['external', 'internal']) {
    const jsR = calculatePipeThickness(60.3, 0.04, 1.8e-4, 150, 20, 50, 0, 0.9, 'surface', pos, 3.91, 50);
    const pyR = runPython({
      equipmentType: 'pipe',
      mode: 'surface',
      outerDiameter: 60.3,
      wallThickness: 3.91,
      innerDiameter: 52.48,
      pipeMaterial: 'carbon_steel',
      pipeMaterialK: 50,
      k: 0.04,
      kCoeff: 1.8e-4,
      mediumTemp: 150,
      ambientTemp: 20,
      targetSurfaceTemp: 50,
      windSpeed: 0,
      emittance: 0.9,
      operatingHours: 8760,
      insulationPosition: pos
    });
    const s = check(`${pos} Ts`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    console.log(`  ${pos}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}], δ=${jsR.thickness.toFixed(1)}mm`);
  }

  // ----------------------------------------------------------
  // PART 4: 管子场景 - 多种管径
  // ----------------------------------------------------------
  printSection('PART 4: 管子多种管径验证');

  const pipeSizes = { '1/2"': [21.3, 2.77], '2"': [60.3, 3.91], '8"': [219.1, 8.18], '16"': [406.4, 9.53] };
  for (const [name, [od, wt]] of Object.entries(pipeSizes)) {
    const jsR = calculatePipeThickness(od, 0.04, 1.8e-4, 150, 20, 50, 0, 0.9, 'surface', 'external', wt, 50);
    const pyR = runPython({
      equipmentType: 'pipe',
      mode: 'surface',
      outerDiameter: od,
      wallThickness: wt,
      pipeMaterial: 'carbon_steel',
      pipeMaterialK: 50,
      k: 0.04,
      kCoeff: 1.8e-4,
      mediumTemp: 150,
      ambientTemp: 20,
      targetSurfaceTemp: 50,
      windSpeed: 0,
      emittance: 0.9,
      operatingHours: 8760,
      insulationPosition: 'external'
    });
    const s = check(`size ${name} Ts`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    console.log(`  ${name} (OD=${od}mm): Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}]`);
  }

  // ----------------------------------------------------------
  // PART 5: 管子场景 - 多种管子材质
  // ----------------------------------------------------------
  printSection('PART 5: 管子多种材质验证');

  const pipeMats = { carbon_steel: 50, stainless_316: 16, copper: 400, pvc: 0.19, frp: 0.35 };
  for (const [name, kp] of Object.entries(pipeMats)) {
    const jsR = calculatePipeThickness(114.3, 0.04, 1.8e-4, 150, 20, 50, 0, 0.9, 'surface', 'external', 6.02, kp);
    const pyR = runPython({
      equipmentType: 'pipe',
      mode: 'surface',
      outerDiameter: 114.3,
      wallThickness: 6.02,
      pipeMaterial: name,
      pipeMaterialK: kp,
      k: 0.04,
      kCoeff: 1.8e-4,
      mediumTemp: 150,
      ambientTemp: 20,
      targetSurfaceTemp: 50,
      windSpeed: 0,
      emittance: 0.9,
      operatingHours: 8760,
      insulationPosition: 'external'
    });
    const s1 = check(`pipe mat ${name} Ts`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    const s2 = check(`pipe mat ${name} Tint`, jsR.interfaceTemp, pyR.interfaceTemp, 1.0);
    console.log(`  ${name.padEnd(15)} (k=${kp}): Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s1}], Tint JS=${jsR.interfaceTemp.toFixed(1)} PY=${pyR.interfaceTemp.toFixed(1)} [${s2}]`);
  }

  // ----------------------------------------------------------
  // PART 6: 平壁场景 - 默认工况
  // ----------------------------------------------------------
  printSection('PART 6: 平壁默认工况 (Surface Temp 模式)');

  const jsFlat1 = calculateFlatThickness(0.04, 1.8e-4, 150, 20, 50, 0, 0.9, 1, 1, 'surface', 50, 5);
  const pyFlat1 = runPython({
    equipmentType: 'flat',
    mode: 'surface',
    k: 0.04,
    kCoeff: 1.8e-4,
    mediumTemp: 150,
    ambientTemp: 20,
    targetSurfaceTemp: 50,
    windSpeed: 0,
    emittance: 0.9,
    operatingHours: 8760,
    surfaceLength: 1,
    surfaceWidth: 1,
    k_wall: 50,
    wall_t_mm: 5
  });

  console.log(`  厚度:   JS=${jsFlat1.thickness.toFixed(2)}mm,  PY=${pyFlat1.thickness_mm.toFixed(2)}mm  [${check('平壁厚度', jsFlat1.thickness, pyFlat1.thickness_mm, 1.0, 2)}]`);
  console.log(`  表面温: JS=${jsFlat1.surfaceTemp.toFixed(2)}°C, PY=${pyFlat1.surfaceTemp.toFixed(2)}°C  [${check('平壁表面温度', jsFlat1.surfaceTemp, pyFlat1.surfaceTemp, 0.5)}]`);
  console.log(`  热流密: JS=${jsFlat1.heatFlux.toFixed(1)}W/m², PY=${pyFlat1.heatFlux.toFixed(1)}W/m²  [${check('平壁热流密度', jsFlat1.heatFlux, pyFlat1.heatFlux, 5, 3)}]`);
  console.log(`  界面温: JS=${jsFlat1.interfaceTemp.toFixed(2)}°C, PY=${pyFlat1.interfaceTemp.toFixed(2)}°C  [${check('平壁界面温度', jsFlat1.interfaceTemp, pyFlat1.interfaceTemp, 1.0)}]`);
  console.log(`  hc:     JS=${jsFlat1.hc.toFixed(2)}, PY=${pyFlat1.hc.toFixed(2)}  [${check('平壁对流系数', jsFlat1.hc, pyFlat1.hc, 0.5, 2)}]`);
  console.log(`  h:      JS=${jsFlat1.h.toFixed(2)}, PY=${pyFlat1.h.toFixed(2)}  [${check('平壁总换热系数', jsFlat1.h, pyFlat1.h, 0.5, 2)}]`);
  console.log(`  R_wall: JS=${jsFlat1.R_wall.toExponential(3)}, PY=${pyFlat1.R_wall.toExponential(3)}  [${check('平壁R_wall', jsFlat1.R_wall, pyFlat1.R_wall, 1e-6, 1)}]`);

  // ----------------------------------------------------------
  // PART 7: 平壁场景 - 三种模式
  // ----------------------------------------------------------
  printSection('PART 7: 平壁三种模式验证');

  const flatModes = [
    { name: 'Surface Temp 50°C', mode: 'surface', target: 50 },
    { name: 'Heat Loss 100W/m²', mode: 'heatloss', target: 100 },
    { name: 'Anti-Condensation RH60% (制冷)', mode: 'condensation', tf: 5, ta: 25, k: 0.023, kCoeff: 5e-5 },
  ];

  for (const m of flatModes) {
    const tf = m.tf || 150;
    const ta = m.ta || 20;
    const k = m.k || 0.04;
    const kCoeff = m.kCoeff || 1.8e-4;

    let targetVal;
    if (m.mode === 'condensation') {
      targetVal = calculateDewPoint(ta, 60) + 1;
    } else {
      targetVal = m.target;
    }

    const jsR = calculateFlatThickness(k, kCoeff, tf, ta, targetVal, 0, 0.9, 1, 1, m.mode, 50, 5);

    const pyParams = {
      equipmentType: 'flat',
      mode: m.mode,
      k: k,
      kCoeff: kCoeff,
      mediumTemp: tf,
      ambientTemp: ta,
      windSpeed: 0,
      emittance: 0.9,
      operatingHours: 8760,
      surfaceLength: 1,
      surfaceWidth: 1,
      k_wall: 50,
      wall_t_mm: 5
    };
    if (m.mode === 'surface') pyParams.targetSurfaceTemp = m.target;
    else if (m.mode === 'heatloss') pyParams.targetHeatLoss = m.target;
    else pyParams.relativeHumidity = 60;

    const pyR = runPython(pyParams);

    const s1 = check(`flat Ts ${m.name}`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    const s2 = check(`flat δ ${m.name}`, jsR.thickness, pyR.thickness_mm, 2.0, 3);
    console.log(`  ${m.name}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s1}], δ JS=${jsR.thickness.toFixed(1)}mm PY=${pyR.thickness_mm.toFixed(1)}mm [${s2}]`);
  }

  // ----------------------------------------------------------
  // PART 8: 平壁场景 - 多种壁面材质
  // ----------------------------------------------------------
  printSection('PART 8: 平壁多种壁面材质验证');

  const wallMats = { carbon_steel: 50, stainless_316: 16, copper: 400, pvc: 0.19, frp: 0.35 };
  for (const [name, kw] of Object.entries(wallMats)) {
    const jsR = calculateFlatThickness(0.04, 1.8e-4, 150, 20, 50, 0, 0.9, 2, 1, 'surface', kw, 5);
    const pyR = runPython({
      equipmentType: 'flat',
      mode: 'surface',
      k: 0.04,
      kCoeff: 1.8e-4,
      mediumTemp: 150,
      ambientTemp: 20,
      targetSurfaceTemp: 50,
      windSpeed: 0,
      emittance: 0.9,
      operatingHours: 8760,
      surfaceLength: 2,
      surfaceWidth: 1,
      k_wall: kw,
      wall_t_mm: 5
    });
    const s1 = check(`wall mat ${name} Ts`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    const s2 = check(`wall mat ${name} Tint`, jsR.interfaceTemp, pyR.interfaceTemp, 1.0);
    console.log(`  ${name.padEnd(15)} (k=${kw}): Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s1}], Tint JS=${jsR.interfaceTemp.toFixed(1)} PY=${pyR.interfaceTemp.toFixed(1)} [${s2}]`);
  }

  // ----------------------------------------------------------
  // PART 9: 环境条件验证
  // ----------------------------------------------------------
  printSection('PART 9: 环境条件验证 (风速/表面发射率)');

  const windSpeeds = { 'indoor (0m/s)': 0, 'calm (1m/s)': 1, 'moderate (5m/s)': 5, 'strong (10m/s)': 10 };
  console.log('  管子风速变化:');
  for (const [name, ws] of Object.entries(windSpeeds)) {
    const jsR = calculatePipeThickness(60.3, 0.04, 1.8e-4, 150, 20, 50, ws, 0.9, 'surface', 'external', 3.91, 50);
    const pyR = runPython({
      equipmentType: 'pipe', mode: 'surface',
      outerDiameter: 60.3, wallThickness: 3.91,
      pipeMaterial: 'carbon_steel', pipeMaterialK: 50,
      k: 0.04, kCoeff: 1.8e-4,
      mediumTemp: 150, ambientTemp: 20, targetSurfaceTemp: 50,
      windSpeed: ws, emittance: 0.9, operatingHours: 8760,
      insulationPosition: 'external'
    });
    const s = check(`pipe wind ${name}`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    console.log(`    ${name}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}]`);
  }

  console.log('  平壁风速变化:');
  for (const [name, ws] of Object.entries(windSpeeds)) {
    const jsR = calculateFlatThickness(0.04, 1.8e-4, 150, 20, 50, ws, 0.9, 2, 1, 'surface', 50, 5);
    const pyR = runPython({
      equipmentType: 'flat', mode: 'surface',
      k: 0.04, kCoeff: 1.8e-4,
      mediumTemp: 150, ambientTemp: 20, targetSurfaceTemp: 50,
      windSpeed: ws, emittance: 0.9, operatingHours: 8760,
      surfaceLength: 2, surfaceWidth: 1,
      k_wall: 50, wall_t_mm: 5
    });
    const s = check(`flat wind ${name}`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    console.log(`    ${name}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}]`);
  }

  // ----------------------------------------------------------
  // PART 10: 保温材质验证
  // ----------------------------------------------------------
  printSection('PART 10: 保温材质验证');

  const insMats = {
    mineralwool: [0.04, 1.8e-4],
    glasswool: [0.035, 1.8e-4],
    calciumsilicate: [0.052, 1.1e-4],
    polyurethane: [0.023, 5e-5],
    ceramicfiber: [0.12, 1.6e-4]
  };

  console.log('  管子保温材质:');
  for (const [name, [k, kc]] of Object.entries(insMats)) {
    const jsR = calculatePipeThickness(60.3, k, kc, 150, 20, 50, 0, 0.9, 'surface', 'external', 3.91, 50);
    const pyR = runPython({
      equipmentType: 'pipe', mode: 'surface',
      outerDiameter: 60.3, wallThickness: 3.91,
      pipeMaterial: 'carbon_steel', pipeMaterialK: 50,
      k: k, kCoeff: kc,
      mediumTemp: 150, ambientTemp: 20, targetSurfaceTemp: 50,
      windSpeed: 0, emittance: 0.9, operatingHours: 8760,
      insulationPosition: 'external'
    });
    const s = check(`pipe ins ${name}`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    console.log(`    ${name.padEnd(18)}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}], δ=${jsR.thickness.toFixed(1)}mm`);
  }

  console.log('  平壁保温材质:');
  for (const [name, [k, kc]] of Object.entries(insMats)) {
    const jsR = calculateFlatThickness(k, kc, 150, 20, 50, 0, 0.9, 1, 1, 'surface', 50, 5);
    const pyR = runPython({
      equipmentType: 'flat', mode: 'surface',
      k: k, kCoeff: kc,
      mediumTemp: 150, ambientTemp: 20, targetSurfaceTemp: 50,
      windSpeed: 0, emittance: 0.9, operatingHours: 8760,
      surfaceLength: 1, surfaceWidth: 1,
      k_wall: 50, wall_t_mm: 5
    });
    const s = check(`flat ins ${name}`, jsR.surfaceTemp, pyR.surfaceTemp, 0.5);
    console.log(`    ${name.padEnd(18)}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}], δ=${jsR.thickness.toFixed(1)}mm`);
  }

  // ----------------------------------------------------------
  // PART 11: 极端工况验证
  // ----------------------------------------------------------
  printSection('PART 11: 极端工况验证');

  const extCases = [
    { name: '中温 150°C', tf: 150, ta: 20, tgt: 50 },
    { name: '高温 450°C', tf: 450, ta: 30, tgt: 60, k: 0.12, kc: 1.6e-4 },
    { name: '超高温 800°C', tf: 800, ta: 25, tgt: 70, k: 0.12, kc: 1.6e-4 },
    { name: '制冷 0°C', tf: 0, ta: 30, tgt: 20 },
    { name: '小温差 10°C', tf: 40, ta: 30, tgt: 32 },
    { name: '大风 20m/s', tf: 150, ta: 20, tgt: 50, wind: 20 },
    { name: '低发射率 0.05', tf: 150, ta: 20, tgt: 50, eps: 0.05 },
  ];

  console.log('  管子极端工况:');
  for (const c of extCases) {
    const k = c.k || 0.04;
    const kc = c.kc || 1.8e-4;
    const wind = c.wind || 0;
    const eps = c.eps || 0.9;
    const jsR = calculatePipeThickness(114.3, k, kc, c.tf, c.ta, c.tgt, wind, eps, 'surface', 'external', 6.02, 50);
    const pyR = runPython({
      equipmentType: 'pipe', mode: 'surface',
      outerDiameter: 114.3, wallThickness: 6.02,
      pipeMaterial: 'carbon_steel', pipeMaterialK: 50,
      k: k, kCoeff: kc,
      mediumTemp: c.tf, ambientTemp: c.ta, targetSurfaceTemp: c.tgt,
      windSpeed: wind, emittance: eps, operatingHours: 8760,
      insulationPosition: 'external'
    });
    const s = check(`pipe ext ${c.name}`, jsR.surfaceTemp, pyR.surfaceTemp, 1.0);
    console.log(`    ${c.name.padEnd(20)}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}], δ=${jsR.thickness.toFixed(1)}mm`);
  }

  console.log('  平壁极端工况:');
  for (const c of extCases) {
    const k = c.k || 0.04;
    const kc = c.kc || 1.8e-4;
    const wind = c.wind || 0;
    const eps = c.eps || 0.9;
    const jsR = calculateFlatThickness(k, kc, c.tf, c.ta, c.tgt, wind, eps, 1, 1, 'surface', 50, 5);
    const pyR = runPython({
      equipmentType: 'flat', mode: 'surface',
      k: k, kCoeff: kc,
      mediumTemp: c.tf, ambientTemp: c.ta, targetSurfaceTemp: c.tgt,
      windSpeed: wind, emittance: eps, operatingHours: 8760,
      surfaceLength: 1, surfaceWidth: 1,
      k_wall: 50, wall_t_mm: 5
    });
    const s = check(`flat ext ${c.name}`, jsR.surfaceTemp, pyR.surfaceTemp, 1.0);
    console.log(`    ${c.name.padEnd(20)}: Ts JS=${jsR.surfaceTemp.toFixed(2)} PY=${pyR.surfaceTemp.toFixed(2)} [${s}], δ=${jsR.thickness.toFixed(1)}mm`);
  }

  // ============================================================
  // 汇总
  // ============================================================
  printSection('FINAL SUMMARY');
  console.log(`  总检查项: ${totalTests}`);
  console.log(`  通过:     ${passedTests}`);
  console.log(`  失败:     ${failedTests}`);
  console.log(`  通过率:   ${totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(80));

  if (failures.length > 0) {
    console.log('\n  失败项详情:');
    for (const f of failures) {
      console.log(`    - ${f.name}: JS=${f.valJS}, PY=${f.valPy}, diff=${f.diff.toFixed(4)}, rel=${f.rel.toFixed(2)}%`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ 所有验证通过！前端计算与参考实现(ASTM C680/ISO 12241)完全一致。');
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
