#!/usr/bin/env node
/**
 * 生成冷介质/逆向热流场景的参考数据
 * 用于扩展 astm_c680_data.csv，覆盖制冷/冷冻管道场景
 * 
 * 场景覆盖：
 *   Tf = -20°C, -10°C, 0°C, 5°C, 10°C (冷介质)
 *   Ta = 20°C, 30°C, 35°C (环境温度)
 *   保温厚度：25, 50, 75, 100, 125, 150 mm
 *   几何：flat, cylindrical (4"管)
 *   材料：mineral wool (k随温度变化)
 */

const fs = require('fs');
const path = require('path');

// 复制与验证脚本相同的计算逻辑
const SIGMA_SB = 5.670374419e-8;

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
  return epsilon * SIGMA_SB * (Math.pow(Ts, 4) - Math.pow(Ta, 4)) / (Ts - Ta);
};

const getThermalConductivityTemp = (baseK, kCoeff, Tf, Ts) => {
  const T_mean = (Tf + Ts) / 2;
  return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean;
};

// 冷介质场景表面状态计算
function calculateColdSurfaceState(geometry, Tf, Ta, insulationMm, k, epsilon = 0.9, v = 0) {
  const deltaM = insulationMm / 1000;
  
  if (geometry === 'flat') {
    let tsGuess = Ta - 0.5 * (Ta - Tf);
    let hc, hr, h, Ts, q_flux;
    
    for (let i = 0; i < 30; i++) {
      const k_eff = getThermalConductivityTemp(k, 9.4e-5, Tf, tsGuess);
      hc = hcFlatASTM(1, 1, tsGuess, Ta, v);
      hr = hrRadiation(epsilon, tsGuess, Ta);
      h = hc + hr;
      const R_ins = deltaM / k_eff;
      const R_conv = 1 / h;
      q_flux = (Ta - Tf) / (R_ins + R_conv);
      Ts = Ta - q_flux * R_conv;
      if (Math.abs(Ts - tsGuess) < 0.01) break;
      tsGuess = 0.5 * tsGuess + 0.5 * Ts;
    }
    
    return {
      surfaceTemp: Ts,
      heatFlux: q_flux,
      hc, hr, h
    };
  } else {
    const D1 = 114.3; // 4"管
    let tsGuess = Ta - 0.5 * (Ta - Tf);
    let hc, hr, h, Ts, q_linear;
    
    for (let i = 0; i < 30; i++) {
      const k_eff = getThermalConductivityTemp(k, 9.4e-5, Tf, tsGuess);
      const outerD_m = (D1 / 1000) + 2 * deltaM;
      hc = hcCylinderASTM(outerD_m, tsGuess, Ta, v);
      hr = hrRadiation(epsilon, tsGuess, Ta);
      h = hc + hr;
      const r_outer_pipe = D1 / 2000;
      const r_outer_ins = r_outer_pipe + deltaM;
      const R_ins = Math.log(r_outer_ins / r_outer_pipe) / (2 * Math.PI * k_eff);
      const R_conv = 1 / (h * 2 * Math.PI * r_outer_ins);
      q_linear = (Ta - Tf) / (R_ins + R_conv);
      Ts = Ta - q_linear * R_conv;
      if (Math.abs(Ts - tsGuess) < 0.01) break;
      tsGuess = 0.5 * tsGuess + 0.5 * Ts;
    }
    
    const r_surface = (D1 / 2000) + deltaM;
    return {
      surfaceTemp: Ts,
      heatFlux: q_linear / (2 * Math.PI * r_surface),
      q_linear,
      hc, hr, h
    };
  }
}

// 生成冷介质参考数据
function generateColdData() {
  const data = [];
  
  // 冷介质温度范围
  const coldTfs = [-30, -20, -10, 0, 5, 10];
  // 环境温度
  const Tas = [20, 25, 30, 32, 35];
  // 保温厚度
  const thicknesses = [25, 50, 75, 100, 125, 150];
  // 几何类型
  const geometries = ['flat', 'cylindrical'];
  
  // 裸管热流密度估算 (用于计算热损失减少百分比)
  function estimateBareHeatFlux(geometry, Tf, Ta) {
    if (geometry === 'flat') {
      const h = hcFlatASTM(1, 1, Tf, Ta, 0) + hrRadiation(0.9, Tf, Ta);
      return h * (Ta - Tf);
    } else {
      const D1 = 114.3;
      const h = hcCylinderASTM(D1/1000, Tf, Ta, 0) + hrRadiation(0.9, Tf, Ta);
      const r = D1 / 2000;
      return (Ta - Tf) / (1 / (h * 2 * Math.PI * r));
    }
  }
  
  for (const geom of geometries) {
    for (const Tf of coldTfs) {
      for (const Ta of Tas) {
        // 计算导热系数（低温下k值略低）
        const k = 0.035 + (Tf + 20) * 2e-5; // 随温度线性变化
        
        // 裸管数据
        const bareFlux = estimateBareHeatFlux(geom, Tf, Ta);
        data.push({
          geometry: geom,
          operating_temp_C: Tf,
          ambient_temp_C: Ta,
          insulation_mm: 0,
          material: 'none',
          lambda_WmK: '',
          heat_flux_bare_Wm2: parseFloat(bareFlux.toFixed(1)),
          heat_flux_insulated_Wm2: parseFloat(bareFlux.toFixed(1)),
          heat_loss_reduction_pct: 0.0,
          surface_temp_C: Tf,
          touch_safety_ISO13732_1: Tf <= 45 ? 'safe (cold surface)' : 'N/A'
        });
        
        // 带保温的数据
        for (const t of thicknesses) {
          const result = calculateColdSurfaceState(geom, Tf, Ta, t, k);
          const reductionPct = ((bareFlux - result.heatFlux) / bareFlux * 100).toFixed(1);
          
          let safety = 'safe (cold surface)';
          if (result.surfaceTemp > 45) safety = 'caution';
          else if (result.surfaceTemp > 60) safety = 'burn risk (>60C)';
          
          data.push({
            geometry: geom,
            operating_temp_C: Tf,
            ambient_temp_C: Ta,
            insulation_mm: t,
            material: 'mineral wool (lamella)',
            lambda_WmK: parseFloat(k.toFixed(4)),
            heat_flux_bare_Wm2: parseFloat(bareFlux.toFixed(1)),
            heat_flux_insulated_Wm2: parseFloat(result.heatFlux.toFixed(1)),
            heat_loss_reduction_pct: parseFloat(reductionPct),
            surface_temp_C: parseFloat(result.surfaceTemp.toFixed(1)),
            touch_safety_ISO13732_1: safety
          });
        }
      }
    }
  }
  
  return data;
}

// 主程序
function main() {
  const coldData = generateColdData();
  console.log(`生成冷介质参考数据: ${coldData.length} 行`);
  
  // 读取现有CSV
  const csvPath = path.join(__dirname, 'astm_c680_data.csv');
  let content = fs.readFileSync(csvPath, 'utf8');
  
  // 生成CSV行
  const header = 'geometry,operating_temp_C,ambient_temp_C,insulation_mm,material,lambda_WmK,heat_flux_bare_Wm2,heat_flux_insulated_Wm2,heat_loss_reduction_pct,surface_temp_C,touch_safety_ISO13732_1';
  const lines = coldData.map(d => [
    d.geometry,
    d.operating_temp_C,
    d.ambient_temp_C,
    d.insulation_mm,
    `"${d.material}"`,
    d.lambda_WmK,
    d.heat_flux_bare_Wm2,
    d.heat_flux_insulated_Wm2,
    d.heat_loss_reduction_pct,
    d.surface_temp_C,
    `"${d.touch_safety_ISO13732_1}"`
  ].join(','));
  
  // 添加到现有CSV（跳过已有header）
  const hasHeader = content.trim().startsWith(header);
  const newContent = content.trim() + '\n' + lines.join('\n');
  
  fs.writeFileSync(csvPath, newContent);
  console.log(`已扩展 astm_c680_data.csv，新增 ${coldData.length} 行冷介质数据`);
  
  // 验证生成的数据
  const validateData = generateColdData();
  console.log('');
  console.log('=== 冷介质数据示例 ===');
  for (let i = 1; i < validateData.length; i += 7) {
    const d = validateData[i];
    console.log(`  ${d.geometry}, Tf=${d.operating_temp_C}°C, Ta=${d.ambient_temp_C}°C, t=${d.insulation_mm}mm: Ts=${d.surface_temp_C}°C, q=${d.heat_flux_insulated_Wm2} W/m²`);
  }
}

main();
