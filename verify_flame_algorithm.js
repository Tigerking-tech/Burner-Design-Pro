#!/usr/bin/env node
// Standalone verification of the flame temperature algorithm used in FlameTemperaturePage.tsx

const fs = require('fs');

const R = 0.008314; // kJ/mol/K

const nasaCoeffs = {
  'CO₂': {
    low: { a: [2.35677352E+00, 8.98459677E-03, -7.12356269E-06, 2.45919022E-09, -1.43699548E-13, -4.83719697E+04, 9.90105222E+00] },
    high: { a: [3.85746029E+00, 4.41437026E-03, -2.21481404E-06, 5.23490188E-10, -4.72084164E-14, -4.87591660E+04, 2.27168103E+00] }
  },
  'H₂O': {
    low: { a: [4.19864056E+00, -2.03643410E-03, 6.52040211E-06, -5.48797062E-09, 1.77197817E-12, -3.02937267E+04, -8.49032208E-01] },
    high: { a: [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00] }
  },
  'N₂': {
    low: { a: [3.29867700E+00, 1.40824040E-03, -3.96322200E-06, 5.64151500E-09, -2.44485400E-12, -1.02089990E+03, 3.95037200E+00] },
    high: { a: [2.92664000E+00, 1.48797680E-03, -5.68476000E-07, 1.00970300E-10, -6.75335100E-15, -9.22797700E+02, 5.98052800E+00] }
  },
  'O₂': {
    low: { a: [3.78245636E+00, -2.99673416E-03, 9.84730201E-06, -9.68129509E-09, 3.24372837E-12, -1.06394356E+03, 3.65767573E+00] },
    high: { a: [3.28253784E+00, 1.48308754E-03, -7.57966669E-07, 2.09470555E-10, -2.16717794E-14, -1.08845772E+03, 5.45323129E+00] }
  },
  'CO': {
    low: { a: [3.57953347E+00, -6.10353680E-04, 1.01681433E-06, 9.07005884E-10, -9.04424499E-13, -1.43440860E+04, 3.50840928E+00] },
    high: { a: [2.71518561E+00, 2.06252743E-03, -9.98825771E-07, 2.30053008E-10, -2.03647716E-14, -1.41518724E+04, 7.81868772E+00] }
  },
  'H₂': {
    low: { a: [2.34433112E+00, 7.98052075E-03, -1.94781510E-05, 2.01572094E-08, -7.37611761E-12, -9.17935173E+02, 6.83010238E-01] },
    high: { a: [3.33727920E+00, -4.94024731E-05, 4.99456778E-07, -1.79566394E-10, 2.00255376E-14, -9.50158922E+02, -3.20502331E+00] }
  },
  'OH': {
    low: { a: [3.99201543E+00, -2.40131752E-03, 4.61793841E-06, -3.88113333E-09, 1.36411470E-12, 3.61508056E+03, -1.03925458E-01] },
    high: { a: [3.09288767E+00, 5.48429716E-04, 1.26505228E-07, -8.79461556E-11, 1.17481976E-14, 3.85865704E+03, 4.47669610E+00] }
  },
  'O': {
    low: { a: [3.16826710E+00, -3.27931884E-03, 6.64306396E-06, -6.12806624E-09, 2.11265971E-12, 2.91222592E+04, 2.05193346E+00] },
    high: { a: [2.56942078E+00, -8.59741137E-05, 4.19484586E-08, -1.00177799E-11, 1.22833691E-15, 2.92175791E+04, 4.78433864E+00] }
  },
  'H': {
    low: { a: [2.50000000E+00, 7.05332819E-13, -1.99592064E-15, 2.30081632E-18, -9.27732332E-22, 2.54736599E+04, -4.46682914E-01] },
    high: { a: [2.50000000E+00, 7.05332819E-13, -1.99592064E-15, 2.30081632E-18, -9.27732332E-22, 2.54736599E+04, -4.46682914E-01] }
  },
  'NO': {
    low: { a: [4.21859896E+00, -4.63988124E-03, 1.10443049E-05, -9.34055507E-09, 2.77256731E-12, 9.83572000E+03, 2.28061000E+00] },
    high: { a: [3.26060534E+00, 1.19110431E-03, -4.29170487E-07, 6.94588191E-11, -3.89803100E-15, 9.92143120E+03, 6.57240900E+00] }
  },
  'CH₄': {
    low: { a: [5.14987613E+00, -1.36709788E-02, 4.91800599E-05, -4.84743026E-08, 1.66693956E-11, -1.02466476E+04, -4.64130376E+00] },
    high: { a: [7.48514950E-02, 1.33909467E-02, -5.73285809E-06, 1.22292535E-09, -1.01815230E-13, -9.46834459E+03, 1.84373180E+01] }
  },
  'C₂H₆': {
    low: { a: [4.29142587E+00, -5.50154980E-03, 5.99438459E-05, -7.08466469E-08, 2.68685836E-11, -1.15222056E+04, 2.66678944E+00] },
    high: { a: [1.07188000E+00, 2.16852650E-02, -8.03970800E-06, 1.30768590E-09, -7.91968000E-14, -1.27337200E+04, 1.85E+01] }
  },
  'C₃H₈': {
    low: { a: [-6.69578170E-01, 6.66199664E-02, -3.44182634E-05, 8.87844759E-09, -8.86961885E-13, -1.39958323E+04, 2.96809492E+01] },
    high: { a: [1.24658720E+01, 1.76798584E-02, -5.32752862E-06, 7.97787789E-10, -4.48860300E-14, -1.83658740E+04, -3.43183150E+01] }
  },
  'C₄H₁₀': {
    low: { a: [1.33955402E-01, 8.39408501E-02, -4.51009455E-05, 1.18846864E-08, -1.20565410E-12, -1.65443107E+04, 2.50664018E+01] },
    high: { a: [1.61309592E+01, 2.30272879E-02, -7.58774190E-06, 1.18186093E-09, -6.94827490E-14, -2.04427373E+04, -5.36822040E+01] }
  }
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
  'H': { c: 0, h: 1, o: 0, n: 0 }, 'NO': { c: 0, h: 0, o: 1, n: 1 }
};

const equilibriumSpecies = ['CO₂', 'H₂O', 'CO', 'H₂', 'O₂', 'N₂', 'OH', 'O', 'H', 'NO'];

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
  let lambda = new Array(ne).fill(0);
  if (elementIndex['o'] !== undefined) lambda[elementIndex['o']] = chemPotential('O₂', T) / 2;
  if (elementIndex['n'] !== undefined) lambda[elementIndex['n']] = chemPotential('N₂', T) / 2;
  if (elementIndex['c'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['c']] = chemPotential('CO₂', T) - 2 * lambda[elementIndex['o']];
  }
  if (elementIndex['h'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['h']] = (chemPotential('H₂O', T) - lambda[elementIndex['o']]) / 2;
  }

  for (let iter = 0; iter < 300; iter++) {
    const mu = activeSpecies.map(sp => chemPotential(sp, T));
    const n = activeSpecies.map((sp, i) => {
      const comp = atomicComp[sp];
      let arg = -mu[i] / RT;
      for (const el of activeElements) arg += comp[el] * lambda[elementIndex[el]] / RT;
      return Math.exp(Math.max(-700, Math.min(700, arg)));
    });

    const f = activeElements.map(el => {
      let sum = 0;
      for (let i = 0; i < activeSpecies.length; i++) {
        sum += n[i] * atomicComp[activeSpecies[i]][el];
      }
      return sum - b[el];
    });

    const J = Array(ne).fill(0).map(() => Array(ne).fill(0));
    for (let j = 0; j < ne; j++) {
      for (let k = 0; k < ne; k++) {
        let sum = 0;
        for (let i = 0; i < activeSpecies.length; i++) {
          const comp = atomicComp[activeSpecies[i]];
          sum += n[i] * comp[activeElements[j]] * comp[activeElements[k]];
        }
        J[j][k] = sum / RT;
      }
    }

    const dlambda = solveLinear(J, f.map(v => -v));
    if (!dlambda) break;

    let stepScale = 1.0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const newLambda = lambda.map((v, j) => v + stepScale * dlambda[j]);
      const newN = activeSpecies.map((sp, i) => {
        const comp = atomicComp[sp];
        let arg = -mu[i] / RT;
        for (const el of activeElements) arg += comp[el] * newLambda[elementIndex[el]] / RT;
        return Math.exp(Math.max(-700, Math.min(700, arg)));
      });
      const newF = activeElements.map(el => {
        let sum = 0;
        for (let i = 0; i < activeSpecies.length; i++) {
          sum += newN[i] * atomicComp[activeSpecies[i]][el];
        }
        return sum - b[el];
      });
      const newErr = Math.sqrt(newF.reduce((s, v) => s + v * v, 0));
      const oldErr = Math.sqrt(f.reduce((s, v) => s + v * v, 0));
      if (newErr < oldErr || stepScale < 1e-4) {
        lambda = newLambda;
        break;
      }
      stepScale *= 0.5;
    }

    const err = Math.sqrt(f.reduce((s, v) => s + v * v, 0));
    if (err < 1e-10) break;
  }

  const mu = activeSpecies.map(sp => chemPotential(sp, T));
  const n = activeSpecies.map((sp, i) => {
    const comp = atomicComp[sp];
    let arg = -mu[i] / RT;
    for (const el of activeElements) arg += comp[el] * lambda[elementIndex[el]] / RT;
    return Math.exp(Math.max(-700, Math.min(700, arg)));
  });

  const result = {};
  for (let i = 0; i < activeSpecies.length; i++) result[activeSpecies[i]] = n[i];
  return result;
}

function productEnthalpy(b, T) {
  const eq = equilibriumComposition(b, T);
  let sum = 0;
  for (const sp of equilibriumSpecies) sum += (eq[sp] || 0) * enthalpy(sp, T);
  return sum;
}

function calculateFlameTemperature(gasComponents, oxidizerType, excessOxygen, fuelTemperature, oxidizerTemperature) {
  const totalPercentage = gasComponents.reduce((sum, c) => sum + c.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) return null;

  let totalC = 0, totalH = 0, totalO = 0, totalN = 0;
  let HfFuel = 0;

  for (const component of gasComponents) {
    const moleFraction = component.percentage / 100;
    if (moleFraction > 0 && atomicComp[component.symbol]) {
      const comp = atomicComp[component.symbol];
      totalC += moleFraction * comp.c;
      totalH += moleFraction * comp.h;
      totalO += moleFraction * comp.o;
      totalN += moleFraction * comp.n;
      HfFuel += moleFraction * (enthalpyOfFormation[component.symbol] || 0);
    }
  }

  const stoichO2 = totalC + totalH / 4 - totalO / 2;
  if (stoichO2 <= 0) return null;

  const excessAirRatio = 1 + excessOxygen / 100;
  const actualO2 = stoichO2 * excessAirRatio;

  let o2InOxidizer, n2InOxidizer;
  if (oxidizerType === 'air') {
    o2InOxidizer = 0.21;
    n2InOxidizer = 0.79;
  } else if (oxidizerType === 'oxygen') {
    o2InOxidizer = 1.0;
    n2InOxidizer = 0.0;
  } else {
    o2InOxidizer = 0.21; // default for verification, mixed not tested here
    n2InOxidizer = 0.79;
  }

  const oxidizerMoles = actualO2 / o2InOxidizer;
  const n2FromOxidizer = oxidizerMoles * n2InOxidizer;

  const b = {
    c: totalC,
    h: totalH,
    o: totalO + actualO2 * 2,
    n: totalN + n2FromOxidizer * 2
  };

  let HfuelSensible = 0;
  const TfuelK = fuelTemperature + 273.15;
  for (const component of gasComponents) {
    const moleFraction = component.percentage / 100;
    if (moleFraction > 0) {
      HfuelSensible += moleFraction * (enthalpy(component.symbol, TfuelK) - enthalpy(component.symbol, 298.15));
    }
  }

  const Tox = oxidizerTemperature + 273.15;
  const Hoxidizer = actualO2 * (enthalpy('O₂', Tox) - enthalpy('O₂', 298.15))
                  + n2FromOxidizer * (enthalpy('N₂', Tox) - enthalpy('N₂', 298.15));

  const Hreact = HfFuel + HfuelSensible + Hoxidizer;

  const frozenEnthalpy = (T) => {
    const nCO2 = totalC;
    const nH2O = totalH / 2;
    const nO2 = actualO2 - stoichO2;
    const nN2 = n2FromOxidizer + totalN / 2;
    return nCO2 * enthalpy('CO₂', T)
         + nH2O * enthalpy('H₂O', T)
         + nO2 * enthalpy('O₂', T)
         + nN2 * enthalpy('N₂', T);
  };

  const Tmax = oxidizerType === 'oxygen' ? 5000 : 4000;
  let Tlow = 300, Thigh = Tmax;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow + Thigh) / 2;
    const Hmid = productEnthalpy(b, Tmid);
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

  return {
    theoretical: Math.max(0, TfrozenK - 273.15),
    actual: Math.max(0, TeqK - 273.15),
    stoichO2,
    composition,
    Hreact,
    b
  };
}

// Test cases matching Cantera reference
const cases = [
  { name: 'H2/air stoich', fuel: [{symbol:'H₂', percentage:100}], ox: 'air', excess: 0 },
  { name: 'CH4/air stoich', fuel: [{symbol:'CH₄', percentage:100}], ox: 'air', excess: 0 },
  { name: 'CO/air stoich', fuel: [{symbol:'CO', percentage:100}], ox: 'air', excess: 0 },
  { name: 'C3H8/air stoich', fuel: [{symbol:'C₃H₈', percentage:100}], ox: 'air', excess: 0 },
  { name: 'H2/O2 stoich', fuel: [{symbol:'H₂', percentage:100}], ox: 'oxygen', excess: 0 },
  { name: 'CH4/O2 stoich', fuel: [{symbol:'CH₄', percentage:100}], ox: 'oxygen', excess: 0 },
  { name: 'CO/O2 stoich', fuel: [{symbol:'CO', percentage:100}], ox: 'oxygen', excess: 0 },
  { name: 'CH4/air 10% excess', fuel: [{symbol:'CH₄', percentage:100}], ox: 'air', excess: 10 },
  { name: 'H2/air 10% excess', fuel: [{symbol:'H₂', percentage:100}], ox: 'air', excess: 10 },
];

console.log('Frontend algorithm verification results:');
console.log('========================================');
const results = {};
for (const c of cases) {
  const r = calculateFlameTemperature(c.fuel, c.ox, c.excess, 25, 25);
  results[c.name] = r;
  if (r) {
    console.log(`${c.name}: actual=${r.actual.toFixed(1)}C, theoretical=${r.theoretical.toFixed(1)}C, stoichO2=${r.stoichO2.toFixed(4)}`);
    // Check element balance
    const eq = r.composition;
    let cBal = 0, hBal = 0, oBal = 0, nBal = 0, total = 0;
    for (const sp in eq) {
      const moles = eq[sp];
      const comp = atomicComp[sp];
      cBal += moles * comp.c;
      hBal += moles * comp.h;
      oBal += moles * comp.o;
      nBal += moles * comp.n;
      total += moles;
    }
    console.log(`  Element balance: C=${cBal.toFixed(4)}/${r.b.c.toFixed(4)}, H=${hBal.toFixed(4)}/${r.b.h.toFixed(4)}, O=${oBal.toFixed(4)}/${r.b.o.toFixed(4)}, N=${nBal.toFixed(4)}/${r.b.n.toFixed(4)}`);
    console.log(`  Total moles=${total.toFixed(4)}, Hprod=${productEnthalpy(r.b, r.actual+273.15).toFixed(2)} vs Hreact=${r.Hreact.toFixed(2)}`);
  } else {
    console.log(`${c.name}: FAILED`);
  }
}

fs.writeFileSync('frontend_results.json', JSON.stringify(results, null, 2));
