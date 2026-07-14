/**
 * 直接使用项目代码验证平衡温度计算
 * 从 FlameTemperaturePage.tsx 提取核心计算逻辑
 */

const R = 0.008314; // kJ/mol/K

// NASA 系数（与 FlameTemperaturePage.tsx 同步）
const nasaCoeffs = {
  'CO2': { Tmid: 1000, low: { a: [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222] }, high: { a: [4.63659493, 0.00274131991, -9.95828531e-07, 1.60373011e-10, -9.16103468e-15, -49024.9341, -1.93534855] } },
  'H2O': { Tmid: 1000, low: { a: [4.19864056, -0.0020364341, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -30293.7267, -0.849032208] }, high: { a: [2.67703787, 0.00297318329, -7.7376969e-07, 9.44336689e-11, -4.26900959e-15, -29885.8938, 6.88255571] } },
  'N2': { Tmid: 1000, low: { a: [3.53100528, -0.000123660987, -5.02999437e-07, 2.43530612e-09, -1.40881235e-12, -1046.97628, 2.96747468] }, high: { a: [2.95257626, 0.00139690057, -4.92631691e-07, 7.86010367e-11, -4.60755321e-15, -923.948645, 5.87189252] } },
  'O2': { Tmid: 1000, low: { a: [3.78245636, -0.00299673415, 9.847302e-06, -9.68129508e-09, 3.24372836e-12, -1063.94356, 3.65767573] }, high: { a: [3.66096083, 0.000656365523, -1.41149485e-07, 2.05797658e-11, -1.29913248e-15, -1215.97725, 3.41536184] } },
  'CO': { Tmid: 1000, low: { a: [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.086, 3.50840928] }, high: { a: [3.04848583, 0.00135172818, -4.85794075e-07, 7.88536486e-11, -4.69807489e-15, -14266.1171, 6.0170979] } },
  'H2': { Tmid: 1000, low: { a: [2.34433112, 0.00798052075, -1.9478151e-05, 2.01572094e-08, -7.37611761e-12, -917.935173, 0.683010238] }, high: { a: [2.93286579, 0.000826607967, -1.46402335e-07, 1.54100359e-11, -6.88804432e-16, -813.065597, -1.02432887] } },
  'CH4': { Tmid: 1000, low: { a: [5.14987613, -0.0136709788, 4.91800599e-05, -4.84743026e-08, 1.66693956e-11, -10246.6476, -4.64130376] }, high: { a: [1.63552643, 0.0100842795, -3.36916254e-06, 5.34958667e-10, -3.15518833e-14, -10005.6455, 9.99313326] } },
  'C2H6': { Tmid: 1000, low: { a: [4.29142492, -0.0055015427, 5.99438288e-05, -7.08466285e-08, 2.68685771e-11, -11522.2055, 2.66682316] }, high: { a: [4.04666674, 0.0153538766, -5.47039321e-06, 8.77826228e-10, -5.23167305e-14, -12447.3512, -0.968683607] } },
  'C3H8': { Tmid: 1000, low: { a: [4.2110262, 0.00171599803, 7.06183472e-05, -9.19594116e-08, 3.64421372e-11, -14381.2106, 5.60930491] }, high: { a: [6.66789363, 0.0206120214, -7.36553027e-06, 1.18440761e-09, -7.0695321e-14, -16274.8521, -13.1859503] } },
  'C4H10': { Tmid: 1000, low: { a: [6.14746806, 0.000155947389, 9.67913517e-05, -1.2548391e-07, 4.97816555e-11, -17599.4402, -1.09409879] }, high: { a: [9.44535834, 0.0257858073, -9.23619122e-06, 1.48632755e-09, -8.87897158e-14, -20138.2165, -26.3470076] } },
  'C2H4': { Tmid: 1000, low: { a: [3.95920148, -0.00757052247, 5.70990292e-05, -6.91588753e-08, 2.69884373e-11, 5089.77593, 4.09733096] }, high: { a: [3.99182761, 0.010483391, -3.71721385e-06, 5.94628514e-10, -3.53630526e-14, 4268.65819, -0.269052151] } },
  'OH': { Tmid: 1000, low: { a: [3.99201543, -0.00240131752, 4.61793841e-06, -3.88113333e-09, 1.3641147e-12, 3615.08056, -0.103925458] }, high: { a: [2.83864607, 0.00110725586, -2.93914978e-07, 4.20524247e-11, -2.42169092e-15, 3943.95852, 5.84452662] } },
  'O': { Tmid: 1000, low: { a: [3.1682671, -0.00327931884, 6.64306396e-06, -6.12806624e-09, 2.11265971e-12, 29122.2592, 2.05193346] }, high: { a: [2.54363697, -2.73162486e-05, -4.1902952e-09, 4.95481845e-12, -4.79553694e-16, 29226.012, 4.92229457] } },
  'H': { Tmid: 1000, low: { a: [2.5, 0.0, 0.0, 0.0, 0.0, 25473.6599, -0.446682853] }, high: { a: [2.50000286, -5.65334214e-09, 3.63251723e-12, -9.1994972e-16, 7.95260746e-20, 25473.6589, -0.446698494] } },
  'NO': { Tmid: 1000, low: { a: [4.21847630, -0.004638976, 1.10410220e-05, -9.33613540e-09, 2.80357700e-12, 9844.623, 2.28084640] }, high: { a: [3.26060560, 0.0011911043, -4.29170480e-07, 6.94576690e-11, -4.03360990e-15, 9920.9746, 6.3693027] } },
  'Ar': { Tmid: 1000, low: { a: [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491] }, high: { a: [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491] } },
};

const atomicComp = {
  'H2': { c: 0, h: 2, o: 0, n: 0 }, 'CO': { c: 1, h: 0, o: 1, n: 0 },
  'CH4': { c: 1, h: 4, o: 0, n: 0 }, 'C2H6': { c: 2, h: 6, o: 0, n: 0 },
  'C3H8': { c: 3, h: 8, o: 0, n: 0 }, 'C4H10': { c: 4, h: 10, o: 0, n: 0 },
  'C2H4': { c: 2, h: 4, o: 0, n: 0 },
  'CO2': { c: 1, h: 0, o: 2, n: 0 }, 'H2O': { c: 0, h: 2, o: 1, n: 0 },
  'O2': { c: 0, h: 0, o: 2, n: 0 }, 'N2': { c: 0, h: 0, o: 0, n: 2 },
  'OH': { c: 0, h: 1, o: 1, n: 0 }, 'O': { c: 0, h: 0, o: 1, n: 0 },
  'H': { c: 0, h: 1, o: 0, n: 0 }, 'NO': { c: 0, h: 0, o: 1, n: 1 },
};

const equilibriumSpecies = ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO'];

// ============ 热力学函数（与项目完全一致） ============

function getCoeffs(species, T) {
  const data = nasaCoeffs[species];
  if (!data) return null;
  return T < data.Tmid ? data.low.a : data.high.a;
}

function enthalpy(species, T) {
  const a = getCoeffs(species, T);
  if (!a) return 0;
  const H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T;
  return R * T * H_RT;
}

function entropy(species, T) {
  const a = getCoeffs(species, T);
  if (!a) return 0;
  const S_R = a[0] * Math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6];
  return R * S_R;
}

function chemPotential(species, T, P_bar = 1) {
  return enthalpy(species, T) - T * entropy(species, T) + R * T * Math.log(Math.max(P_bar, 1e-30));
}

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-30) return null;
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
    }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

function equilibriumComposition(b, T, P = 1) {
  const activeElements = ['c', 'h', 'o', 'n'].filter(el => b[el] > 1e-12);
  const ne = activeElements.length;
  if (ne === 0) return {};

  const elementIndex = {};
  activeElements.forEach((el, i) => { elementIndex[el] = i; });

  const activeSpecies = equilibriumSpecies.filter(sp => {
    const comp = atomicComp[sp];
    if (b.c < 1e-12 && comp.c > 0) return false;
    if (b.h < 1e-12 && comp.h > 0) return false;
    if (b.o < 1e-12 && comp.o > 0) return false;
    if (b.n < 1e-12 && comp.n > 0) return false;
    return true;
  });

  const RT = R * T;
  const ns = activeSpecies.length;

  function computePi(lam) {
    return activeSpecies.map(sp => {
      const comp = atomicComp[sp];
      const mu = chemPotential(sp, T, P);
      let arg = -mu / RT;
      for (const el of activeElements) arg += comp[el] * lam[elementIndex[el]] / RT;
      return Math.exp(Math.max(-700, Math.min(700, arg)));
    });
  }

  let lam = new Array(ne).fill(0);
  if (elementIndex['o'] !== undefined) lam[elementIndex['o']] = chemPotential('O2', T, P) / 2;
  if (elementIndex['n'] !== undefined) lam[elementIndex['n']] = chemPotential('N2', T, P) / 2;
  if (elementIndex['c'] !== undefined && elementIndex['o'] !== undefined) {
    lam[elementIndex['c']] = chemPotential('CO2', T, P) - 2 * lam[elementIndex['o']];
  }
  if (elementIndex['h'] !== undefined && elementIndex['o'] !== undefined) {
    lam[elementIndex['h']] = (chemPotential('H2O', T, P) - lam[elementIndex['o']]) / 2;
  }

  const refEl = activeElements[ne - 1];
  const bRef = b[refEl];

  for (let iter = 0; iter < 300; iter++) {
    const pi = computePi(lam);
    const sumPi = pi.reduce((s, v) => s + v, 0);

    const sumEl = activeElements.map(el => {
      let s = 0;
      for (let i = 0; i < ns; i++) s += atomicComp[activeSpecies[i]][el] * pi[i];
      return s;
    });

    const Rvec = new Array(ne).fill(0);
    for (let j = 0; j < ne - 1; j++) {
      Rvec[j] = b[activeElements[j]] * sumEl[ne - 1] - bRef * sumEl[j];
    }
    Rvec[ne - 1] = sumPi - 1.0;

    const err = Math.sqrt(Rvec.reduce((s, v) => s + v * v, 0));
    if (err < 1e-10) {
      const nTotal = bRef / sumEl[ne - 1];
      const result = {};
      for (let i = 0; i < ns; i++) result[activeSpecies[i]] = nTotal * pi[i];
      return result;
    }

    const J = Array(ne).fill(0).map(() => Array(ne).fill(0));
    for (let k = 0; k < ne; k++) {
      const sumAkPi = pi.reduce((s, v, i) => s + atomicComp[activeSpecies[i]][activeElements[k]] * v, 0) / RT;

      for (let j = 0; j < ne - 1; j++) {
        let crossJ = 0;
        let crossRef = 0;
        for (let i = 0; i < ns; i++) {
          const comp = atomicComp[activeSpecies[i]];
          const val = comp[activeElements[j]] * comp[activeElements[k]] * pi[i] / RT;
          crossJ += val;
          crossRef += comp[activeElements[ne - 1]] * comp[activeElements[k]] * pi[i] / RT;
        }
        J[j][k] = b[activeElements[j]] * crossRef - bRef * crossJ;
      }

      J[ne - 1][k] = sumAkPi;
    }

    const delta = solveLinear(J, Rvec.map(v => -v));
    if (!delta) break;

    // 步长缩放（与 TypeScript 代码完全一致）
    let stepScale = 1.0;
    for (let attempt = 0; attempt < 15; attempt++) {
      const newLambda = lam.map((v, j) => v + stepScale * delta[j]);
      const newPi = computePi(newLambda);
      const newSumEl = activeElements.map(el => {
        let s = 0;
        for (let i = 0; i < ns; i++) s += atomicComp[activeSpecies[i]][el] * newPi[i];
        return s;
      });
      const newRvec = new Array(ne).fill(0);
      for (let j = 0; j < ne - 1; j++) {
        newRvec[j] = b[activeElements[j]] * newSumEl[ne - 1] - bRef * newSumEl[j];
      }
      newRvec[ne - 1] = newPi.reduce((s, v) => s + v, 0) - 1.0;
      const newErr = Math.sqrt(newRvec.reduce((s, v) => s + v * v, 0));
      if (newErr < err || stepScale < 1e-6) {
        lam = newLambda;
        break;
      }
      stepScale *= 0.5;
    }
  }

  // 未收敛，返回近似结果
  const pi = computePi(lam);
  const sumEl = activeElements.map(el => {
    let s = 0;
    for (let i = 0; i < ns; i++) s += atomicComp[activeSpecies[i]][el] * pi[i];
    return s;
  });
  const nTotal = bRef / sumEl[ne - 1];
  const result = {};
  for (let i = 0; i < ns; i++) result[activeSpecies[i]] = Math.max(0, nTotal * pi[i]);
  return result;
}

function productEnthalpy(b, T, arMoles = 0, P = 1) {
  const eq = equilibriumComposition(b, T, P);
  let sum = 0;
  for (const sp of equilibriumSpecies) sum += (eq[sp] || 0) * enthalpy(sp, T);
  sum += arMoles * enthalpy('Ar', T);
  return sum;
}

// ============ 计算 ============

const fuels = {
  'H2': '氢气', 'CO': '一氧化碳', 'CH4': '甲烷',
  'C2H4': '乙烯', 'C2H6': '乙烷', 'C3H8': '丙烷', 'C4H10': '丁烷',
};

// Cantera 参考值 (λ=1.0, 空气氧化)
const canteraRef = {
  'H2': { T: 2106.7, products: { H2O: 32.40, N2: 64.44, H2: 1.51, OH: 0.68, O2: 0.48, H: 0.18, NO: 0.25 } },
  'CO': { T: 2110.2, products: { CO2: 29.73, N2: 63.61, CO: 4.24, O2: 1.82, NO: 0.49, O: 0.11 } },
  'CH4': { T: 1951.5, products: { N2: 70.86, H2O: 18.35, CO2: 8.54, CO: 0.90, OH: 0.29, O2: 0.46, H2: 0.36, NO: 0.19 } },
  'C2H4': { T: 2095.5, products: { N2: 72.59, CO2: 10.88, H2O: 12.23, CO: 2.03, OH: 0.47, O2: 0.90, H2: 0.39, NO: 0.36 } },
  'C2H6': { T: 1985.6, products: { N2: 71.71, H2O: 15.85, CO2: 9.75, CO: 1.16, OH: 0.32, O2: 0.56, H2: 0.35, NO: 0.22 } },
  'C3H8': { T: 1992.6, products: { N2: 72.08, H2O: 14.85, CO2: 10.27, CO: 1.25, OH: 0.32, O2: 0.59, H2: 0.33, NO: 0.23 } },
  'C4H10': { T: 2002.4, products: { N2: 72.36, H2O: 14.02, CO2: 10.66, CO: 1.33, OH: 0.31, O2: 0.62, H2: 0.31, NO: 0.24 } },
};

function calculate(fuel, lambda_val = 1.0) {
  const comp = atomicComp[fuel];
  if (!comp) return null;
  
  const totalC = comp.c, totalH = comp.h, totalO = comp.o, totalN = comp.n;
  const stoichO2 = totalC + totalH / 4 - totalO / 2;
  if (stoichO2 <= 0) return null;
  
  const actualO2 = stoichO2 * lambda_val;
  const o2InOxidizer = 0.2095;
  const n2InOxidizer = 0.7809;
  const arInOxidizer = 0.0096;
  
  const oxidizerMoles = actualO2 / o2InOxidizer;
  const n2FromOxidizer = oxidizerMoles * n2InOxidizer;
  const arFromOxidizer = oxidizerMoles * arInOxidizer;
  
  const b = {
    c: totalC,
    h: totalH,
    o: totalO + actualO2 * 2,
    n: totalN + n2FromOxidizer * 2
  };
  
  const arMoles = arFromOxidizer;
  
  // 反应物焓
  const T0 = 298.15;
  let Hreact = enthalpy(fuel, T0) + actualO2 * enthalpy('O2', T0) + n2FromOxidizer * enthalpy('N2', T0) + arMoles * enthalpy('Ar', T0);
  
  // 冻结温度
  const frozenEnthalpy = (T) => {
    const nCO2 = totalC;
    const nH2O = totalH / 2;
    const nO2 = actualO2 - stoichO2;
    const nN2 = n2FromOxidizer + totalN / 2;
    return nCO2 * enthalpy('CO2', T) + nH2O * enthalpy('H2O', T)
         + nO2 * enthalpy('O2', T) + nN2 * enthalpy('N2', T)
         + arMoles * enthalpy('Ar', T);
  };
  
  let Tlow = 300, Thigh = 4000;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow + Thigh) / 2;
    const Hmid = productEnthalpy(b, Tmid, arMoles, 1);
    if (Hmid > Hreact) Thigh = Tmid;
    else Tlow = Tmid;
    if (Thigh - Tlow < 0.1) break;
  }
  const T_eq_K = (Tlow + Thigh) / 2;
  
  Tlow = 300; Thigh = 4000;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow + Thigh) / 2;
    const Hmid = frozenEnthalpy(Tmid);
    if (Hmid > Hreact) Thigh = Tmid;
    else Tlow = Tmid;
    if (Thigh - Tlow < 0.1) break;
  }
  const T_frozen_K = (Tlow + Thigh) / 2;
  
  // 平衡产物组成
  const composition = equilibriumComposition(b, T_eq_K, 1);
  const totalMoles = Object.values(composition).reduce((s, v) => s + v, 0) + arMoles;
  
  const products = {};
  for (const [sp, moles] of Object.entries(composition)) {
    products[sp] = (moles / totalMoles) * 100;
  }
  if (arMoles > 0) {
    products['Ar'] = (arMoles / totalMoles) * 100;
  }
  
  return {
    T_frozen: T_frozen_K - 273.15,
    T_equilibrium: T_eq_K - 273.15,
    products,
  };
}

// ============ 主程序 ============

console.log('='.repeat(110));
console.log('全面验证：Web App 平衡温度和产物组成 vs Cantera');
console.log('='.repeat(110));

console.log(`\n${'燃料'.padEnd(10)} ${'冻结温度'.padStart(10)} ${'平衡温度'.padStart(10)} ${'Cantera'.padStart(10)} ${'冻结-Cantera'.padStart(12)} ${'平衡-Cantera'.padStart(12)} ${'结论'.padStart(8)}`);
console.log('-'.repeat(80));

const results = {};

for (const [fuel, name] of Object.entries(fuels)) {
  const result = calculate(fuel, 1.0);
  const ref = canteraRef[fuel];
  
  if (result && ref) {
    const delta_frozen = result.T_frozen - ref.T;
    const delta_eq = result.T_equilibrium - ref.T;
    
    let mark = '✓';
    if (Math.abs(delta_eq) > 200) mark = '✗';
    else if (Math.abs(delta_eq) > 50) mark = '⚠';
    
    console.log(`${name.padEnd(10)} ${result.T_frozen.toFixed(1).padStart(10)} ${result.T_equilibrium.toFixed(1).padStart(10)} ${ref.T.toFixed(1).padStart(10)} ${delta_frozen.toFixed(1).padStart(12)} ${delta_eq.toFixed(1).padStart(12)} ${mark.padStart(8)}`);
    results[fuel] = { ...result, ref };
  }
}

// 产物组成对比
console.log(`\n${'='.repeat(110)}`);
console.log('产物组成对比 (λ=1.0)');
console.log('='.repeat(110));

for (const [fuel, name] of Object.entries(fuels)) {
  const result = results[fuel];
  const ref = canteraRef[fuel];
  if (!result || !ref) continue;
  
  console.log(`\n  ${name} (平衡温度: ${result.T_equilibrium.toFixed(0)}°C, Cantera: ${ref.T.toFixed(0)}°C):`);
  console.log(`    ${'物种'.padEnd(8)} ${'Web(%)'.padStart(10)} ${'Cantera(%)'.padStart(12)} ${'偏差'.padStart(10)}`);
  console.log(`    ${'-'.repeat(45)}`);
  
  const allSpecies = new Set([...Object.keys(result.products), ...Object.keys(ref.products)]);
  for (const sp of [...allSpecies].sort()) {
    const web_pct = result.products[sp] || 0;
    const ct_pct = ref.products[sp] || 0;
    if (web_pct > 0.01 || ct_pct > 0.01) {
      const diff = web_pct - ct_pct;
      let mark = '✓';
      if (Math.abs(diff) > 5) mark = '✗';
      else if (Math.abs(diff) > 2) mark = '⚠';
      console.log(`    ${sp.padEnd(8)} ${web_pct.toFixed(2).padStart(10)} ${ct_pct.toFixed(2).padStart(12)} ${diff.toFixed(2).padStart(10)} ${mark}`);
    }
  }
}

console.log(`\n${'='.repeat(110)}`);
console.log('排序对比');
console.log('='.repeat(110));

const webSorted = Object.entries(results).sort((a, b) => a[1].T_equilibrium - b[1].T_equilibrium);
const ctSorted = Object.entries(results).sort((a, b) => a[1].ref.T - b[1].ref.T);

console.log(`\n  Web App 平衡温度: ${webSorted.map(([f]) => fuels[f]).join(' < ')}`);
console.log(`  Cantera 平衡温度: ${ctSorted.map(([f]) => fuels[f]).join(' < ')}`);

if (webSorted.map(([f]) => f).join(',') === ctSorted.map(([f]) => f).join(',')) {
  console.log('  ✓ 排序完全一致！');
} else {
  console.log('  ⚠ 排序有差异，需检查');
}
