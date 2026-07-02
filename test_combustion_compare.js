/**
 * 对比测试脚本：验证 Gas Mixture 模式(calculateGasKeyData) 和 
 * Combustion 模式(calculateCombustion) 的基础计算结果是否一致
 * 
 * 共同计算项：density, hi
 * Combustion独有：Lmin, relativeDensity, 烟气参数
 */

const AIR_DENSITY = 1.293;
const O2_IN_AIR = 0.2095;
const N2_IN_AIR = 0.7808;

// ====== 使用和前端代码完全一致的 gasProperties ======
const gasProperties = {
  'H₂': { density: 0.090, hs: 3.540, hi: 2.995 },
  'CO': { density: 1.250, hs: 3.509, hi: 3.509 },
  'NH₃': { density: 0.771, hs: 4.816, hi: 3.986 },
  'H₂S': { density: 1.538, hs: 7.035, hi: 6.484 },
  'CH₄': { density: 0.72408, hs: 11.064, hi: 9.971 },
  'C₂H₆': { density: 1.342134, hs: 19.537, hi: 17.884 },
  'C₃H₈': { density: 2.01, hs: 28.095, hi: 25.866 },
  'C₄H₁₀': { density: 2.586, hs: 37.254, hi: 34.405 },
  'C₅H₁₂': { density: 3.220863, hs: 45.778, hi: 42.359 },
  'C₆H₁₄': { density: 3.846675, hs: 58.328, hi: 54.007 },
  'C₇H₁₆': { density: 4.76, hs: 72.524, hi: 67.217 },
  'C₆H₆': { density: 3.49, hs: 44.203, hi: 42.419 },
  'C₂H₄': { density: 1.251624, hs: 17.621, hi: 16.522 },
  'C₃H₆': { density: 1.879, hs: 25.999, hi: 24.331 },
  'C₄H₈': { density: 2.594, hs: 34.891, hi: 32.63 },
  'C₂H₂': { density: 1.1637, hs: 16.27, hi: 15.72 },
  'N₂': { density: 1.256796, hs: 0, hi: 0 },
  'CO₂': { density: 1.975704, hs: 0, hi: 0 },
  'O₂': { density: 1.429, hs: 0, hi: 0 },
  'H₂O': { density: 0.81459, hs: 0, hi: 0 },
  'Air': { density: 1.293, hs: 0, hi: 0 },
};

const gasCombustionProps = {
  'H₂': { nC: 0, nH: 2, nO: 0, nN: 0, nS: 0 },
  'CO': { nC: 1, nH: 0, nO: 1, nN: 0, nS: 0 },
  'NH₃': { nC: 0, nH: 3, nO: 0, nN: 1, nS: 0 },
  'H₂S': { nC: 0, nH: 2, nO: 0, nN: 0, nS: 0 }, // 注意：前端 nS: 1 但没用到S的燃烧产物计算
  'CH₄': { nC: 1, nH: 4, nO: 0, nN: 0, nS: 0 },
  'C₂H₆': { nC: 2, nH: 6, nO: 0, nN: 0, nS: 0 },
  'C₃H₈': { nC: 3, nH: 8, nO: 0, nN: 0, nS: 0 },
  'C₄H₁₀': { nC: 4, nH: 10, nO: 0, nN: 0, nS: 0 },
  'C₅H₁₂': { nC: 5, nH: 12, nO: 0, nN: 0, nS: 0 },
  'C₆H₁₄': { nC: 6, nH: 14, nO: 0, nN: 0, nS: 0 },
  'C₇H₁₆': { nC: 7, nH: 16, nO: 0, nN: 0, nS: 0 },
  'C₆H₆': { nC: 6, nH: 6, nO: 0, nN: 0, nS: 0 },
  'C₂H₄': { nC: 2, nH: 4, nO: 0, nN: 0, nS: 0 },
  'C₃H₆': { nC: 3, nH: 6, nO: 0, nN: 0, nS: 0 },
  'C₄H₈': { nC: 4, nH: 8, nO: 0, nN: 0, nS: 0 },
  'C₂H₂': { nC: 2, nH: 2, nO: 0, nN: 0, nS: 0 },
  'N₂': { nC: 0, nH: 0, nO: 0, nN: 1, nS: 0 },
  'CO₂': { nC: 1, nH: 0, nO: 2, nN: 0, nS: 0 },
  'O₂': { nC: 0, nH: 0, nO: 1, nN: 0, nS: 0 },
  'H₂O': { nC: 0, nH: 2, nO: 1, nN: 0, nS: 0 },
  'Air': { nC: 0, nH: 0, nO: 0.2095, nN: 0.7808, nS: 0 },
};

// ====== 模式1: Gas Mixture 的 calculateGasKeyData ======
function calculateGasKeyData(components) {
  let density = 0, hs = 0, hi = 0;
  components.forEach(c => {
    const pct = parseFloat(c.percentage) || 0;
    if (pct > 0 && gasProperties[c.symbol]) {
      const props = gasProperties[c.symbol];
      const fraction = pct / 100;
      density += props.density * fraction;
      hs += props.hs * fraction;
      hi += props.hi * fraction;
    }
  });
  const ws = hs / Math.sqrt(density / AIR_DENSITY);
  const wi = hi / Math.sqrt(density / AIR_DENSITY);
  return { density, hs, hi, ws, wi };
}

// ====== 模式2: Combustion 的 calculateCombustion ======
function calculateCombustion(components, capacityKW = 0, lambdaVal = 1) {
  let density = 0, hi = 0, totalCO2 = 0, totalH2O = 0, o2Needed = 0, fuelN2 = 0;

  components.forEach(c => {
    const pct = parseFloat(c.percentage) || 0;
    if (pct > 0) {
      const fraction = pct / 100;
      const props = gasProperties[c.symbol];
      const combProps = gasCombustionProps[c.symbol];

      if (props) {
        density += props.density * fraction;
        hi += props.hi * fraction;
      }
      if (combProps) {
        totalCO2 += fraction * combProps.nC;
        totalH2O += fraction * (combProps.nH / 2);
        o2Needed += fraction * (combProps.nC + combProps.nH / 4 - combProps.nO / 2);
        fuelN2 += fraction * (combProps.nN / 2);
      }
    }
  });

  const lmin = o2Needed / O2_IN_AIR;
  const actualAir = lmin * lambdaVal;
  const n2FromAir = actualAir * N2_IN_AIR;
  const totalN2 = fuelN2 + n2FromAir;
  const excessO2 = actualAir * O2_IN_AIR - o2Needed;
  const dryVolume = totalCO2 + totalN2 + excessO2;
  const wetVolume = dryVolume + totalH2O;

  const co2Percent = dryVolume > 0 ? (totalCO2 / dryVolume) * 100 : 0;
  const o2Percent = dryVolume > 0 ? (excessO2 / dryVolume) * 100 : 0;
  const n2Percent = dryVolume > 0 ? (totalN2 / dryVolume) * 100 : 0;
  const h2oPercent = wetVolume > 0 ? (totalH2O / wetVolume) * 100 : 0;

  const CO2_DENSITY = 1.977, H2O_DENSITY = 0.804, O2_DENSITY = 1.429, N2_DENSITY = 1.251;
  const wetFlueGasDensity = wetVolume > 0
    ? (totalCO2 * CO2_DENSITY + totalH2O * H2O_DENSITY + excessO2 * O2_DENSITY + totalN2 * N2_DENSITY) / wetVolume
    : 0;

  const gasFlowRate = hi > 0 ? capacityKW / hi : 0;
  const airFlowRate = gasFlowRate * lmin * lambdaVal;

  return {
    density, relativeDensity: density / AIR_DENSITY, hi, lmin,
    gasFlowRate, airFlowRate,
    co2Volume: totalCO2, h2oVolume: totalH2O, o2Volume: excessO2, n2Volume: totalN2,
    dryFlueGasVolume: dryVolume, wetFlueGasVolume: wetVolume,
    co2Percent, o2Percent, n2Percent, h2oPercent, wetFlueGasDensity,
  };
}

// ====== 气体预设 ======
const gasPresets = {
  'Nordsee-Erdgas H': { 'CH₄': '88.79', 'C₂H₆': '6.88', 'C₃H₈': '1.23', 'C₄H₁₀': '0.27', 'C₅H₁₂': '0.05', 'C₆H₁₄': '0.02', 'N₂': '0.82', 'CO₂': '1.93', 'O₂': '0.01' },
  'Russland-Erdgas H': { 'CH₄': '96.97', 'C₂H₆': '1.36', 'C₃H₈': '0.44', 'C₄H₁₀': '0.15', 'C₅H₁₂': '0.02', 'C₆H₁₄': '0.01', 'N₂': '0.86', 'CO₂': '0.18', 'O₂': '0.01' },
  'Holland-Erdgas L': { 'CH₄': '83.67', 'C₂H₆': '3.53', 'C₃H₈': '0.60', 'C₄H₁₀': '0.19', 'C₅H₁₂': '0.04', 'C₆H₁₄': '0.06', 'N₂': '10.23', 'CO₂': '1.67', 'O₂': '0.01' },
  'Kokereigas': { 'H₂': '55.0', 'CO': '6.0', 'CH₄': '25.0', 'C₂H₆': '2.0', 'N₂': '10.0', 'CO₂': '2.0' },
  'Gichtgas': { 'H₂': '3.0', 'CO': '25.0', 'N₂': '52.0', 'CO₂': '20.0' },
  'Mischgas': { 'H₂': '54.0', 'CO': '7.0', 'CH₄': '20.0', 'C₂H₆': '1.0', 'N₂': '14.0', 'CO₂': '4.0' },
  'Biogas': { 'CH₄': '65.0', 'CO₂': '35.0' },
  'Wasserstoff 100%': { 'H₂': '100.0' },
  'Methan': { 'CH₄': '100.0' },
  'Propan': { 'C₃H₈': '100.0' },
  'Butan': { 'C₄H₁₀': '100.0' },
  'Erdgas L': { 'CH₄': '81.4', 'C₂H₆': '2.85', 'C₃H₈': '0.42', 'C₄H₁₀': '0.23', 'N₂': '14.3', 'CO₂': '0.89', 'O₂': '0.01' },
  'Erdgas H': { 'CH₄': '93.3', 'C₂H₆': '3.38', 'C₃H₈': '0.94', 'C₄H₁₀': '0.71', 'N₂': '0.78', 'CO₂': '0.89' },
  'Generatorgas Koppers-Totzek': { 'CO': '58.7', 'H₂': '32.9', 'N₂': '1.4', 'CO₂': '7.0' },
  'Generatorgas Lurgi': { 'CH₄': '10.2', 'CO': '17.1', 'H₂': '40.2', 'N₂': '1.1', 'CO₂': '31.4' },
};

function presetToComponents(composition) {
  // 创建完整的21组分列表，未指定的为0
  const allSymbols = ['H₂', 'CO', 'NH₃', 'H₂S', 'CH₄', 'C₂H₆', 'C₃H₈', 'C₄H₁₀', 'C₅H₁₂', 'C₆H₁₄', 'C₇H₁₆', 'C₆H₆', 'C₂H₄', 'C₃H₆', 'C₄H₈', 'C₂H₂', 'N₂', 'CO₂', 'O₂', 'H₂O', 'Air'];
  return allSymbols.map(symbol => ({
    symbol,
    percentage: composition[symbol] || '0'
  }));
}

// ====== 对比测试 ======
console.log('================================================================================');
console.log('  对比测试: Gas Mixture(calculateGasKeyData) vs Combustion(calculateCombustion)');
console.log('  共同参数: Density, Hi (kWh/m³)');
console.log('  Combustion独有: Lmin, Relative Density, CO₂%, O₂%, N₂%, Flue gas等');
console.log('================================================================================\n');

let totalTests = 0;
let matchCount = 0;
let mismatchCount = 0;

for (const [name, composition] of Object.entries(gasPresets)) {
  const components = presetToComponents(composition);
  const gasResult = calculateGasKeyData(components);
  const combResult = calculateCombustion(components, 100, 1.1);

  totalTests++;

  console.log(`--- ${name} ---`);

  // Density 对比
  const densityDiff = Math.abs(gasResult.density - combResult.density);
  const densityMatch = densityDiff < 0.0001;
  console.log(`  Density:  GasMixture=${gasResult.density.toFixed(4)}  Combustion=${combResult.density.toFixed(4)}  差值=${densityDiff.toFixed(6)} ${densityMatch ? '✅' : '❌'}`);

  // Hi 对比
  const hiDiff = Math.abs(gasResult.hi - combResult.hi);
  const hiMatch = hiDiff < 0.0001;
  console.log(`  Hi:       GasMixture=${gasResult.hi.toFixed(4)}   Combustion=${combResult.hi.toFixed(4)}   差值=${hiDiff.toFixed(6)} ${hiMatch ? '✅' : '❌'}`);

  if (densityMatch && hiMatch) {
    matchCount++;
  } else {
    mismatchCount++;
    console.log('  ⚠️ 发现不一致！');
  }

  // Combustion 独有参数
  console.log(`  [Combustion独有]`);
  console.log(`  Relative Density: ${combResult.relativeDensity.toFixed(4)}`);
  console.log(`  Lmin (λ=1): ${combResult.lmin.toFixed(3)} m³/m³`);
  console.log(`  --- λ=1.1, 100kW ---`);
  console.log(`  Gas Flow Rate:   ${combResult.gasFlowRate.toFixed(3)} m³/h`);
  console.log(`  Air Flow Rate:   ${combResult.airFlowRate.toFixed(2)} m³/h`);
  console.log(`  CO₂ (dry):       ${combResult.co2Percent.toFixed(2)} %`);
  console.log(`  O₂ (dry):        ${combResult.o2Percent.toFixed(2)} %`);
  console.log(`  N₂ (dry):        ${combResult.n2Percent.toFixed(2)} %`);
  console.log(`  H₂O (wet):       ${combResult.h2oPercent.toFixed(2)} %`);
  console.log(`  Dry Flue Gas:    ${combResult.dryFlueGasVolume.toFixed(3)} m³/m³`);
  console.log(`  Wet Flue Gas:    ${combResult.wetFlueGasVolume.toFixed(3)} m³/m³`);
  console.log(`  Flue Gas Density:${combResult.wetFlueGasDensity.toFixed(4)} kg/m³`);
  console.log('');
}

console.log('================================================================================');
console.log(`  总测试: ${totalTests} 组气体`);
console.log(`  Density & Hi 全部一致: ${matchCount} 组 ✅`);
console.log(`  Density & Hi 存在差异: ${mismatchCount} 组 ❌`);
console.log('================================================================================');

// 额外：检查某些边缘情况
console.log('\n--- 额外检查：单组分纯气体 ---');
const singleGases = [
  { symbol: 'CH₄', name: 'Methane 100%' },
  { symbol: 'H₂', name: 'Hydrogen 100%' },
  { symbol: 'CO', name: 'Carbon Monoxide 100%' },
  { symbol: 'C₂H₆', name: 'Ethane 100%' },
  { symbol: 'N₂', name: 'Nitrogen 100%' },
  { symbol: 'CO₂', name: 'Carbon Dioxide 100%' },
];

for (const gas of singleGases) {
  const components = presetToComponents({ [gas.symbol]: '100' });
  const gasResult = calculateGasKeyData(components);
  const combResult = calculateCombustion(components, 0, 1);

  const densityMatch = Math.abs(gasResult.density - combResult.density) < 0.0001;
  const hiMatch = Math.abs(gasResult.hi - combResult.hi) < 0.0001;
  console.log(`  ${gas.name}: Density ${densityMatch ? '✅' : '❌'} (${gasResult.density.toFixed(4)} vs ${combResult.density.toFixed(4)}), Hi ${hiMatch ? '✅' : '❌'} (${gasResult.hi.toFixed(4)} vs ${combResult.hi.toFixed(4)})`);
  if (combResult.hi > 0) {
    console.log(`    → Lmin=${combResult.lmin.toFixed(3)}, CO₂=${combResult.co2Percent.toFixed(2)}%, WetFlueGas=${combResult.wetFlueGasVolume.toFixed(3)} m³/m³`);
  }
}
