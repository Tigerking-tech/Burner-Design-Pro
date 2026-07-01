const AIR_DENSITY = 1.293;
const O2_IN_AIR = 0.2095;
const N2_IN_AIR = 0.7808;

const gasProperties = {
  'H₂': { density: 0.0899, hs: 3.05, hi: 2.57 },
  'CO': { density: 1.25, hs: 3.52, hi: 3.52 },
  'NH₃': { density: 0.771, hs: 3.32, hi: 2.88 },
  'H₂S': { density: 1.539, hs: 6.48, hi: 5.73 },
  'CH₄': { density: 0.717, hs: 10.91, hi: 9.81 },
  'C₂H₆': { density: 1.356, hs: 20.07, hi: 18.22 },
  'C₃H₈': { density: 2.01, hs: 29.33, hi: 26.73 },
  'C₄H₁₀': { density: 2.703, hs: 38.65, hi: 35.27 },
  'C₅H₁₂': { density: 3.454, hs: 48.08, hi: 43.87 },
  'C₆H₁₄': { density: 4.19, hs: 57.47, hi: 52.46 },
  'C₇H₁₆': { density: 4.75, hs: 66.92, hi: 61.08 },
  'C₆H₆': { density: 3.48, hs: 40.26, hi: 37.49 },
  'C₂H₄': { density: 1.261, hs: 17.23, hi: 15.82 },
  'C₃H₆': { density: 1.914, hs: 26.58, hi: 24.43 },
  'C₄H₈': { density: 2.596, hs: 35.89, hi: 33 },
  'C₂H₂': { density: 1.171, hs: 15.37, hi: 14.87 },
  'N₂': { density: 1.251, hs: 0, hi: 0 },
  'CO₂': { density: 1.977, hs: 0, hi: 0 },
  'O₂': { density: 1.429, hs: 0, hi: 0 },
  'H₂O': { density: 0.804, hs: 0, hi: 0 },
  'Air': { density: 1.293, hs: 0, hi: 0 },
};

const gasCombustionProps = {
  'H₂': { nC: 0, nH: 2, nO: 0, nN: 0, nS: 0 },
  'CO': { nC: 1, nH: 0, nO: 1, nN: 0, nS: 0 },
  'NH₃': { nC: 0, nH: 3, nO: 0, nN: 1, nS: 0 },
  'H₂S': { nC: 0, nH: 2, nO: 0, nN: 0, nS: 1 },
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

const nordseeComposition = { 'CH₄': 88.79, 'C₂H₆': 6.88, 'C₃H₈': 1.23, 'C₄H₁₀': 0.27, 'C₅H₁₂': 0.05, 'C₆H₁₄': 0.02, 'N₂': 0.82, 'CO₂': 1.93, 'O₂': 0.01 };

function calculateCombustion(composition, capacityKW, lambdaVal) {
  let density = 0;
  let hi = 0;
  let totalCO2 = 0;
  let totalH2O = 0;
  let o2Needed = 0;
  let fuelN2 = 0;
  let totalPct = 0;

  Object.entries(composition).forEach(([symbol, pct]) => {
    if (pct > 0) {
      totalPct += pct;
      const fraction = pct / 100;
      const props = gasProperties[symbol];
      const combProps = gasCombustionProps[symbol];

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

  const CO2_DENSITY = 1.977;
  const H2O_DENSITY = 0.804;
  const O2_DENSITY = 1.429;
  const N2_DENSITY = 1.251;

  const wetFlueGasDensity = wetVolume > 0
    ? (totalCO2 * CO2_DENSITY + totalH2O * H2O_DENSITY + excessO2 * O2_DENSITY + totalN2 * N2_DENSITY) / wetVolume
    : 0;

  const gasFlowRate = hi > 0 ? capacityKW / hi : 0;
  const airFlowRate = gasFlowRate * lmin * lambdaVal;

  return {
    density,
    relativeDensity: density / AIR_DENSITY,
    hi,
    lmin,
    gasFlowRate,
    airFlowRate,
    co2Volume: totalCO2,
    h2oVolume: totalH2O,
    o2Volume: excessO2,
    n2Volume: totalN2,
    dryFlueGasVolume: dryVolume,
    wetFlueGasVolume: wetVolume,
    co2Percent,
    o2Percent,
    n2Percent,
    h2oPercent,
    wetFlueGasDensity,
  };
}

console.log('=== Test 1: Nordsee-Erdgas H, λ=1, 0 kW ===');
const result1 = calculateCombustion(nordseeComposition, 0, 1);
console.log('Density:', result1.density.toFixed(3), 'kg/m³ (ref: 0.81)');
console.log('Relative density:', result1.relativeDensity.toFixed(4), '(ref: 0.63)');
console.log('Hi:', result1.hi.toFixed(2), 'kWh/m³ (ref: 10.5)');
console.log('Lmin:', result1.lmin.toFixed(3), 'm³/m³ (ref: 10)');
console.log('CO2 (dry):', result1.co2Percent.toFixed(2), '% (ref: 12.2)');
console.log('O2 (dry):', result1.o2Percent.toFixed(2), '% (ref: 0)');
console.log('N2 (dry):', result1.n2Percent.toFixed(2), '% (ref: 87.8)');
console.log('Dry flue gas volume:', result1.dryFlueGasVolume.toFixed(3), 'm³/m³ (ref: 9)');
console.log('H2O volume:', result1.h2oVolume.toFixed(3), 'm³/m³ (ref: 2.18)');
console.log('H2O (wet):', result1.h2oPercent.toFixed(2), '% (ref: 19.5)');
console.log('Wet flue gas volume:', result1.wetFlueGasVolume.toFixed(3), 'm³/m³ (ref: 11.2)');
console.log('Wet flue gas density:', result1.wetFlueGasDensity.toFixed(4), 'kg/m³ (ref: 1.23)');

console.log('\n=== Test 2: Nordsee-Erdgas H, λ=1.1, 100 kW ===');
const result2 = calculateCombustion(nordseeComposition, 100, 1.1);
console.log('Gas flow rate:', result2.gasFlowRate.toFixed(3), 'm³/h');
console.log('Air flow rate:', result2.airFlowRate.toFixed(2), 'm³/h');
console.log('CO2 (dry):', result2.co2Percent.toFixed(2), '%');
console.log('O2 (dry):', result2.o2Percent.toFixed(2), '%');

const russianComposition = { 'CH₄': 96.97, 'C₂H₆': 1.36, 'C₃H₈': 0.44, 'C₄H₁₀': 0.15, 'C₅H₁₂': 0.02, 'C₆H₁₄': 0.01, 'N₂': 0.86, 'CO₂': 0.18, 'O₂': 0.01 };
console.log('\n=== Test 3: Russian Natural Gas H, λ=1 ===');
const result3 = calculateCombustion(russianComposition, 0, 1);
console.log('Density:', result3.density.toFixed(3), 'kg/m³');
console.log('Hi:', result3.hi.toFixed(2), 'kWh/m³');
console.log('Lmin:', result3.lmin.toFixed(3), 'm³/m³');
console.log('CO2 (dry):', result3.co2Percent.toFixed(2), '%');
console.log('Dry flue gas volume:', result3.dryFlueGasVolume.toFixed(3), 'm³/m³');
console.log('Wet flue gas volume:', result3.wetFlueGasVolume.toFixed(3), 'm³/m³');

const cokeOvenGasComposition = { 'H₂': 57.9, 'CO': 4.5, 'CH₄': 30.3, 'C₄H₁₀': 3.3, 'N₂': 2.2, 'CO₂': 1.8 };
console.log('\n=== Test 4: Coke Oven Gas, λ=1 ===');
const result4 = calculateCombustion(cokeOvenGasComposition, 0, 1);
console.log('Density:', result4.density.toFixed(3), 'kg/m³');
console.log('Hi:', result4.hi.toFixed(2), 'kWh/m³');
console.log('Lmin:', result4.lmin.toFixed(3), 'm³/m³');
console.log('CO2 (dry):', result4.co2Percent.toFixed(2), '%');
console.log('O2 (dry):', result4.o2Percent.toFixed(2), '%');
console.log('H2O (wet):', result4.h2oPercent.toFixed(2), '%');

const blastFurnaceGasComposition = { 'H₂': 3.0, 'CO': 25.0, 'N₂': 52.0, 'CO₂': 20.0 };
console.log('\n=== Test 5: Blast Furnace Gas, λ=1 ===');
const result5 = calculateCombustion(blastFurnaceGasComposition, 0, 1);
console.log('Density:', result5.density.toFixed(3), 'kg/m³');
console.log('Hi:', result5.hi.toFixed(2), 'kWh/m³');
console.log('Lmin:', result5.lmin.toFixed(3), 'm³/m³');
console.log('CO2 (dry):', result5.co2Percent.toFixed(2), '%');
console.log('O2 (dry):', result5.o2Percent.toFixed(2), '%');
console.log('Dry flue gas volume:', result5.dryFlueGasVolume.toFixed(3), 'm³/m³');
