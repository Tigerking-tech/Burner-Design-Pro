// Updated replica with Cantera NASA coeffs
const fs = require('fs');
const canteraNASA = JSON.parse(fs.readFileSync('/workspace/cantera_nasa.json', 'utf8'));

const R = 0.008314;

const nasaCoeffs = {};
for (const [sp, data] of Object.entries(canteraNASA)) {
  nasaCoeffs[sp] = {
    low: { a: data.low.a },
    high: { a: data.high.a }
  };
}
// Add C4H10 back
nasaCoeffs['C₄H₁₀'] = {
  low: { a: [1.33955402E-01, 8.39408501E-02, -4.51009455E-05, 1.18846864E-08, -1.20565410E-12, -1.65443107E+04, 2.50664018E+01] },
  high: { a: [1.61309592E+01, 2.30272879E-02, -7.58774190E-06, 1.18186093E-09, -6.94827490E-14, -2.04427373E+04, -5.36822040E+01] }
};

const enthalpyOfFormation = {
  'H₂': 0, 'CO': -110.5, 'NH₃': -45.9, 'H₂S': -20.6,
  'CH₄': -74.87, 'C₂H₆': -84.7, 'C₃H₈': -103.85, 'C₄H₁₀': -126.15,
  'C₅H₁₂': -147.1, 'C₆H₁₄': -170.0, 'C₇H₁₆': -190.0,
  'C₆H₆': 49.0, 'C₂H₄': 52.5, 'C₃H₆': 20.4, 'C₄H₈': -0.1, 'C₂H₂': 226.7,
  'N₂': 0, 'CO₂': -393.52, 'O₂': 0, 'H₂O': -241.83
};

const atomicComp = {
  'H₂': { c: 0, h: 2, o: 0, n: 0 }, 'CO': { c: 1, h: 0, o: 1, n: 0 },
  'NH₃': { c: 0, h: 3, o: 0, n: 1 }, 'H₂S': { c: 0, h: 2, o: 0, n: 0 },
  'CH₄': { c: 1, h: 4, o: 0, n: 0 }, 'C₂H₆': { c: 2, h: 6, o: 0, n: 0 },
  'C₃H₈': { c: 3, h: 8, o: 0, n: 0 }, 'C₄H₁₀': { c: 4, h: 10, o: 0, n: 0 },
  'C₅H₁₂': { c: 5, h: 12, o: 0, n: 0 }, 'C₆H₁₄': { c: 6, h: 14, o: 0, n: 0 },
  'C₇H₁₆': { c: 7, h: 16, o: 0, n: 0 }, 'C₆H₆': { c: 6, h: 6, o: 0, n: 0 },
  'C₂H₄': { c: 2, h: 4, o: 0, n: 0 }, 'C₃H₆': { c: 3, h: 6, o: 0, n: 0 },
  'C₄H₈': { c: 4, h: 8, o: 0, n: 0 }, 'C₂H₂': { c: 2, h: 2, o: 0, n: 0 },
  'N₂': { c: 0, h: 0, o: 0, n: 2 }, 'CO₂': { c: 1, h: 0, o: 2, n: 0 },
  'O₂': { c: 0, h: 0, o: 2, n: 0 }, 'H₂O': { c: 0, h: 2, o: 1, n: 0 },
  'OH': { c: 0, h: 1, o: 1, n: 0 }, 'O': { c: 0, h: 0, o: 1, n: 0 },
  'H': { c: 0, h: 1, o: 0, n: 0 }, 'NO': { c: 0, h: 0, o: 1, n: 1 },
  'NO₂': { c: 0, h: 0, o: 2, n: 1 }, 'Ar': { c: 0, h: 0, o: 0, n: 0 }
};

const equilibriumSpecies = ['CO₂', 'H₂O', 'CO', 'H₂', 'O₂', 'N₂', 'OH', 'O', 'H', 'NO', 'NO₂'];

function getCoeffs(species, T) {
  const data = nasaCoeffs[species];
  if (!data) return null;
  return T < 1000 ? data.low.a : data.high.a;
}

function enthalpy(species, T) {
  const a = getCoeffs(species, T);
  if (!a) {
    const cpMap = {
      'C₂H₆': 0.053, 'C₅H₁₂': 0.12, 'C₆H₁₄': 0.14, 'C₇H₁₆': 0.16,
      'C₆H₆': 0.082, 'C₂H₄': 0.043, 'C₃H₆': 0.059, 'C₄H₈': 0.072,
      'C₂H₂': 0.044, 'NH₃': 0.036, 'H₂S': 0.034
    };
    return (enthalpyOfFormation[species] || 0) + (cpMap[species] || 0.05) * (T - 298.15);
  }
  const H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T;
  return R * T * H_RT;
}

function entropy(species, T) {
  const a = getCoeffs(species, T);
  if (!a) return 0.2;
  const S_R = a[0] * Math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6];
  return R * S_R;
}

function chemPotential(species, T) {
  return enthalpy(species, T) - T * entropy(species, T);
}

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    if (Math.abs(M[maxRow][i]) < 1e-30) return null;
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

function equilibriumComposition(b, T) {
  const elementNames = ['c', 'h', 'o', 'n'];
  const activeElements = [];
  const elementIndex = {};
  for (const el of elementNames) {
    if (b[el] > 1e-12) {
      elementIndex[el] = activeElements.length;
      activeElements.push(el);
    }
  }
  const ne = activeElements.length;
  if (ne === 0) return {};

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

  function computePi(lambda) {
    return activeSpecies.map(sp => {
      const comp = atomicComp[sp];
      const mu = chemPotential(sp, T);
      let arg = -mu / RT;
      for (const el of activeElements) arg += comp[el] * lambda[elementIndex[el]] / RT;
      return Math.exp(Math.max(-700, Math.min(700, arg)));
    });
  }

  let lambda = new Array(ne).fill(0);
  if (elementIndex['o'] !== undefined) lambda[elementIndex['o']] = chemPotential('O₂', T) / 2;
  if (elementIndex['n'] !== undefined) lambda[elementIndex['n']] = chemPotential('N₂', T) / 2;
  if (elementIndex['c'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['c']] = chemPotential('CO₂', T) - 2 * lambda[elementIndex['o']];
  }
  if (elementIndex['h'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['h']] = (chemPotential('H₂O', T) - lambda[elementIndex['o']]) / 2;
  }

  const refEl = activeElements[ne - 1];
  const bRef = b[refEl];

  for (let iter = 0; iter < 300; iter++) {
    const pi = computePi(lambda);
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

    const dlambda = solveLinear(J, Rvec.map(v => -v));
    if (!dlambda) break;

    let stepScale = 1.0;
    for (let attempt = 0; attempt < 15; attempt++) {
      const newLambda = lambda.map((v, j) => v + stepScale * dlambda[j]);
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
        lambda = newLambda;
        break;
      }
      stepScale *= 0.5;
    }
  }

  const pi = computePi(lambda);
  const sumEl = activeElements.map(el => pi.reduce((s, v, i) => s + atomicComp[activeSpecies[i]][el] * v, 0));
  const nTotal = bRef / sumEl[ne - 1];
  const result = {};
  for (let i = 0; i < ns; i++) result[activeSpecies[i]] = nTotal * pi[i];
  return result;
}

function productEnthalpy(b, T, arMoles = 0) {
  const eq = equilibriumComposition(b, T);
  let sum = 0;
  for (const sp of equilibriumSpecies) sum += (eq[sp] || 0) * enthalpy(sp, T);
  sum += arMoles * enthalpy('Ar', T);
  return sum;
}

function calculateFlameTemperature(gasComponents, oxidizerType, excessOxygen, fuelTemperature, oxidizerTemperature, heatLoss, pressure) {
  const totalPercentage = gasComponents.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
  if (Math.abs(totalPercentage - 100) > 0.01) return null;

  let totalC = 0, totalH = 0, totalO = 0, totalN = 0;

  gasComponents.forEach(component => {
    const moleFraction = parseFloat(component.percentage) / 100;
    if (moleFraction > 0 && atomicComp[component.symbol]) {
      const comp = atomicComp[component.symbol];
      totalC += moleFraction * comp.c;
      totalH += moleFraction * comp.h;
      totalO += moleFraction * comp.o;
      totalN += moleFraction * comp.n;
    }
  });

  const stoichO2 = totalC + totalH / 4 - totalO / 2;
  if (stoichO2 <= 0) return null;

  const excessAirRatio = 1 + parseFloat(excessOxygen) / 100;
  const actualO2 = stoichO2 * excessAirRatio;

  let o2InOxidizer, n2InOxidizer, arInOxidizer;
  if (oxidizerType === 'air') {
    o2InOxidizer = 0.2095;
    n2InOxidizer = 0.7809;
    arInOxidizer = 0.0096;
  } else if (oxidizerType === 'oxygen') {
    o2InOxidizer = 1.0;
    n2InOxidizer = 0.0;
    arInOxidizer = 0.0;
  } else {
    o2InOxidizer = (parseFloat(airRatio) * 0.2095 + parseFloat(oxygenRatio)) / 100;
    n2InOxidizer = parseFloat(airRatio) * 0.7809 / 100;
    arInOxidizer = parseFloat(airRatio) * 0.0096 / 100;
  }

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

  const Tfuel = parseFloat(fuelTemperature) || 25;
  const TfuelK = Tfuel + 273.15;

  let Hreact = 0;
  gasComponents.forEach(component => {
    const moleFraction = parseFloat(component.percentage) / 100;
    if (moleFraction > 0) {
      Hreact += moleFraction * enthalpy(component.symbol, TfuelK);
    }
  });

  const Tox = (parseFloat(oxidizerTemperature) || 25) + 273.15;
  Hreact += actualO2 * enthalpy('O₂', Tox) + n2FromOxidizer * enthalpy('N₂', Tox) + arMoles * enthalpy('Ar', Tox);

  const heatLossFraction = parseFloat(heatLoss) / 100;
  Hreact *= (1 - heatLossFraction);

  const frozenEnthalpy = (T) => {
    const nCO2 = totalC;
    const nH2O = totalH / 2;
    const nO2 = actualO2 - stoichO2;
    const nN2 = n2FromOxidizer + totalN / 2;
    return nCO2 * enthalpy('CO₂', T)
         + nH2O * enthalpy('H₂O', T)
         + nO2 * enthalpy('O₂', T)
         + nN2 * enthalpy('N₂', T)
         + arMoles * enthalpy('Ar', T);
  };

  const Tmax = oxidizerType === 'oxygen' ? 7000 : 4000;
  let Tlow = 300, Thigh = Tmax;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow + Thigh) / 2;
    const Hmid = productEnthalpy(b, Tmid, arMoles);
    if (Hmid > Hreact) Thigh = Tmid;
    else Tlow = Tmid;
    if (Thigh - Tlow < 0.1) break;
  }
  const TeqK = (Tlow + Thigh) / 2;

  Tlow = 300; Thigh = Tmax;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow + Thigh) / 2;
    const Hmid = frozenEnthalpy(Tmid);
    if (Hmid > Hreact) Thigh = Tmid;
    else Tlow = Tmid;
    if (Thigh - Tlow < 0.1) break;
  }
  const TfrozenK = (Tlow + Thigh) / 2;

  const composition = equilibriumComposition(b, TeqK);
  const totalMoles = Object.values(composition).reduce((s, v) => s + v, 0) + arMoles;

  const compositionPercent = {};
  for (const [sp, moles] of Object.entries(composition)) {
    compositionPercent[sp] = (moles / totalMoles) * 100;
  }
  if (arMoles > 0) {
    compositionPercent['Ar'] = (arMoles / totalMoles) * 100;
  }

  return {
    theoretical: Math.max(0, TfrozenK - 273.15),
    actual: Math.max(0, TeqK - 273.15),
    stoichO2,
    composition: compositionPercent,
    totalMoles,
    pressure: parseFloat(pressure) || 1
  };
}

const testCases = [
  { name: 'CH4_PureO2_6pct_0C', fuel: [{symbol:'CH₄', percentage:'100'}], ox: 'oxygen', excess: '6', fT: '0', oT: '0' },
  { name: 'CH4_Air_0pct_25C', fuel: [{symbol:'CH₄', percentage:'100'}], ox: 'air', excess: '0', fT: '25', oT: '25' },
  { name: 'CH4_Air_10pct_25C', fuel: [{symbol:'CH₄', percentage:'100'}], ox: 'air', excess: '10', fT: '25', oT: '25' },
  { name: 'H2_Air_0pct_25C', fuel: [{symbol:'H₂', percentage:'100'}], ox: 'air', excess: '0', fT: '25', oT: '25' },
  { name: 'H2_PureO2_0pct_25C', fuel: [{symbol:'H₂', percentage:'100'}], ox: 'oxygen', excess: '0', fT: '25', oT: '25' },
  { name: 'C3H8_Air_0pct_25C', fuel: [{symbol:'C₃H₈', percentage:'100'}], ox: 'air', excess: '0', fT: '25', oT: '25' },
  { name: 'CO_Air_0pct_25C', fuel: [{symbol:'CO', percentage:'100'}], ox: 'air', excess: '0', fT: '25', oT: '25' },
];

const canteraRef = JSON.parse(fs.readFileSync('/workspace/cantera_ref.json', 'utf8'));

console.log('='.repeat(80));
console.log('VALIDATION AFTER FIX: Web Logic (Updated NASA) vs Cantera');
console.log('='.repeat(80));

for (const tc of testCases) {
  const res = calculateFlameTemperature(tc.fuel, tc.ox, tc.excess, tc.fT, tc.oT, '0', '1');
  const ref = canteraRef[tc.name];

  console.log(`\nCase: ${tc.name}`);
  console.log(`  Frozen T:    Web=${res.theoretical.toFixed(1)}°C  Cantera=${ref.T_frozen_C.toFixed(1)}°C  Diff=${(res.theoretical - ref.T_frozen_C).toFixed(1)}°C (${((res.theoretical - ref.T_frozen_C)/ref.T_frozen_C*100).toFixed(1)}%)`);
  console.log(`  Equilibrium T: Web=${res.actual.toFixed(1)}°C  Cantera=${ref.T_equilibrium_C.toFixed(1)}°C  Diff=${(res.actual - ref.T_equilibrium_C).toFixed(1)}°C (${((res.actual - ref.T_equilibrium_C)/ref.T_equilibrium_C*100).toFixed(1)}%)`);

  const allSpecies = new Set([...Object.keys(res.composition), ...Object.keys(ref.products_mole_pct)]);
  console.log(`  Species Comparison:`);
  for (const sp of Array.from(allSpecies).sort()) {
    const w = res.composition[sp] || 0;
    const c = ref.products_mole_pct[sp] || 0;
    const diff = w - c;
    const pctDiff = c > 0 ? (diff/c*100).toFixed(1) : (w > 0 ? 'N/A' : '');
    if (w > 0.01 || c > 0.01) {
      const flag = Math.abs(diff) > 1 ? '<<< LARGE DEVIATION' : '';
      console.log(`    ${sp.padEnd(6)}: Web=${w.toFixed(4).padStart(8)}%  Cantera=${c.toFixed(4).padStart(8)}%  Diff=${diff.toFixed(4).padStart(8)}%  (${pctDiff}%) ${flag}`);
    }
  }
}
