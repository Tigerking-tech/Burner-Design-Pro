// 使用正确的冻结温度逻辑，重新验证平衡温度

const R = 0.008314;

const nasaCoeffs = {
  'CO₂': { Tmid: 1000,
    low: { a: [2.35677352E+0, 8.98459677E-3, -7.12356269E-6, 2.45919022E-9, -1.43699548E-13, -4.83719697E+4, 9.90105222E+0] },
    high: { a: [3.85746029E+0, 4.41437026E-3, -2.21481404E-6, 5.23490188E-10, -4.72084164E-14, -4.87591660E+4, 2.27163806E+0] }},
  'H₂O': { Tmid: 1000,
    low: { a: [4.19864056E+0, -2.03643410E-3, 6.52040211E-6, -5.48797062E-9, 1.77197817E-12, -3.02937267E+4, -8.49032208E-1] },
    high: { a: [3.03399249E+0, 2.17691804E-3, -1.64072518E-7, -9.70419870E-11, 1.68200992E-14, -3.00042971E+4, 4.96677010E+0] }},
  'N₂': { Tmid: 1000,
    low: { a: [3.29867700E+0, 1.40824040E-3, -3.96322200E-6, 5.64151500E-9, -2.44485400E-12, -1.02089990E+3, 3.95037200E+0] },
    high: { a: [2.92664000E+0, 1.48797680E-3, -5.68476000E-7, 1.00970380E-10, -6.75335100E-15, -9.22797700E+2, 5.98052800E+0] }},
  'O₂': { Tmid: 1000,
    low: { a: [3.78245636E+0, -2.99673416E-3, 9.84730201E-6, -9.68129509E-9, 3.24372837E-12, -1.06394356E+3, 3.65767573E+0] },
    high: { a: [3.28253784E+0, 1.48308754E-3, -7.57966669E-7, 2.09470555E-10, -2.16717794E-14, -1.08845772E+3, 5.45323129E+0] }},
  'CO': { Tmid: 1000,
    low: { a: [3.57953347E+0, -6.10353680E-4, 1.01681433E-6, 9.07005884E-10, -9.04424499E-13, -1.43440860E+4, 3.50840928E+0] },
    high: { a: [2.71518561E+0, 2.06252743E-3, -9.98825771E-7, 2.30053008E-10, -2.03647716E-14, -1.41518724E+4, 7.81868772E+0] }},
  'H₂': { Tmid: 1000,
    low: { a: [2.34433112E+0, 7.98052075E-3, -1.94781510E-5, 2.01572094E-8, -7.37611761E-12, -9.17935173E+2, 6.83010238E-1] },
    high: { a: [3.33727920E+0, -4.94024731E-5, 4.99456778E-7, -1.79566394E-10, 2.00255376E-14, -9.50158922E+2, -3.20502331E+0] }},
  'OH': { Tmid: 1000,
    low: { a: [3.99201543E+0, -2.40131752E-3, 4.61793841E-6, -3.88113333E-9, 1.36411470E-12, 3.61508056E+3, -1.03925458E-1] },
    high: { a: [3.09288767E+0, 5.48429716E-4, 1.26505228E-7, -8.79461556E-11, 1.17412376E-14, 3.85865700E+3, 4.47669610E+0] }},
  'O': { Tmid: 1000,
    low: { a: [3.16826710E+0, -3.27931884E-3, 6.64306396E-6, -6.12806624E-9, 2.11265971E-12, 2.91222592E+4, 2.05193346E+0] },
    high: { a: [2.56942078E+0, -8.59741137E-5, 4.19484589E-8, -1.00177799E-11, 1.22833691E-15, 2.92175791E+4, 4.78433864E+0] }},
  'H': { Tmid: 1000,
    low: { a: [2.50000000E+0, 7.05332819E-13, -1.99591964E-15, 2.30081632E-18, -9.27732332E-22, 2.54736599E+4, -4.46682853E-1] },
    high: { a: [2.50000001E+0, -2.30842973E-11, 1.61561948E-14, -4.73515235E-18, 4.98197357E-22, 2.54736599E+4, -4.46682914E-1] }},
  'NO': { Tmid: 1000,
    low: { a: [4.21847630E+0, -4.63897600E-3, 1.10410220E-5, -9.33613540E-9, 2.80357700E-12, 9.84462300E+3, 2.28084640E+0] },
    high: { a: [3.26060560E+0, 1.19110430E-3, -4.29170480E-7, 6.94576690E-11, -4.03360990E-15, 9.92097460E+3, 6.36930270E+0] }},
  'C₃H₈': { Tmid: 1000,
    low: { a: [9.33553810E-1, 2.64245790E-2, 6.10597270E-6, -2.19774990E-8, 9.51492530E-12, -1.39585200E+4, 1.92016910E+1] },
    high: { a: [7.53413680E+0, 1.88722390E-2, -6.27184910E-6, 9.14756490E-10, -4.78380690E-14, -1.64675160E+4, -1.78923490E+1] }},
  'C₄H₁₀': { Tmid: 1000,
    low: { a: [6.14746806E+0, 1.55947389E-4, 9.67913517E-5, -1.25483910E-7, 4.97816555E-11, -1.75994402E+4, -1.09409879E+0] },
    high: { a: [9.44535834E+0, 2.57858073E-2, -9.23619122E-6, 1.48632755E-9, -8.87897158E-14, -2.01382165E+4, -2.63470076E+1] }},
  'Ar': { Tmid: 6000,
    low: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.37967491E+0] },
    high: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.37967491E+0] }},
};

const atomicComp = {
  'H₂': { c: 0, h: 2, o: 0, n: 0 }, 'CO': { c: 1, h: 0, o: 1, n: 0 },
  'C₃H₈': { c: 3, h: 8, o: 0, n: 0 }, 'C₄H₁₀': { c: 4, h: 10, o: 0, n: 0 },
  'N₂': { c: 0, h: 0, o: 0, n: 2 }, 'CO₂': { c: 1, h: 0, o: 2, n: 0 },
  'O₂': { c: 0, h: 0, o: 2, n: 0 }, 'H₂O': { c: 0, h: 2, o: 1, n: 0 },
  'OH': { c: 0, h: 1, o: 1, n: 0 }, 'O': { c: 0, h: 0, o: 1, n: 0 },
  'H': { c: 0, h: 1, o: 0, n: 0 }, 'NO': { c: 0, h: 0, o: 1, n: 1 },
  'Ar': { c: 0, h: 0, o: 0, n: 0 }
};

const equilibriumSpecies = ['CO₂', 'H₂O', 'CO', 'H₂', 'O₂', 'N₂', 'OH', 'O', 'H', 'NO'];

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
  const P0_bar = 1;
  const mu0 = enthalpy(species, T) - T * entropy(species, T);
  return mu0 + R * T * Math.log(P_bar / P0_bar);
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

function equilibriumComposition(b, T, P = 1) {
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
      const mu = chemPotential(sp, T, P);
      let arg = -mu / RT;
      for (const el of activeElements) arg += comp[el] * lambda[elementIndex[el]] / RT;
      return Math.exp(Math.max(-700, Math.min(700, arg)));
    });
  }

  let lambda = new Array(ne).fill(0);
  if (elementIndex['o'] !== undefined) lambda[elementIndex['o']] = chemPotential('O₂', T, P) / 2;
  if (elementIndex['n'] !== undefined) lambda[elementIndex['n']] = chemPotential('N₂', T, P) / 2;
  if (elementIndex['c'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['c']] = chemPotential('CO₂', T, P) - 2 * lambda[elementIndex['o']];
  }
  if (elementIndex['h'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['h']] = (chemPotential('H₂O', T, P) - lambda[elementIndex['o']]) / 2;
  }

  const refEl = activeElements[ne - 1];
  const bRef = b[refEl];

  for (let iter = 0; iter < 300; iter++) {
    const pi = computePi(lambda);
    const sumPi = pi.reduce((s, v) => s + v, 0);
    const sumEl = activeElements.map(el => pi.reduce((s, v, i) => s + atomicComp[activeSpecies[i]][el] * v, 0));

    const Rvec = new Array(ne).fill(0);
    for (let j = 0; j < ne - 1; j++) Rvec[j] = b[activeElements[j]] * sumEl[ne - 1] - bRef * sumEl[j];
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
        let crossJ = 0, crossRef = 0;
        for (let i = 0; i < ns; i++) {
          const comp = atomicComp[activeSpecies[i]];
          crossJ += comp[activeElements[j]] * comp[activeElements[k]] * pi[i] / RT;
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
      const newSumEl = activeElements.map(el => newPi.reduce((s, v, i) => s + atomicComp[activeSpecies[i]][el] * v, 0));
      const newRvec = new Array(ne).fill(0);
      for (let j = 0; j < ne - 1; j++) newRvec[j] = b[activeElements[j]] * newSumEl[ne - 1] - bRef * newSumEl[j];
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

// 正确的计算逻辑
function calcFlame(fuelSymbol, c, h, fuelT_C, oxT_C, lambda, P_bar) {
  const stoichO2 = c + h / 4;
  const actualO2 = stoichO2 * lambda;
  const n2 = actualO2 * (0.7809 / 0.2095);
  const ar = actualO2 * (0.0096 / 0.2095);

  const b = { c, h, o: actualO2 * 2, n: n2 * 2 };
  const Tfuel = fuelT_C + 273.15;
  const Tox = oxT_C + 273.15;

  const Hreact = enthalpy(fuelSymbol, Tfuel) + actualO2 * enthalpy('O₂', Tox) + n2 * enthalpy('N₂', Tox) + ar * enthalpy('Ar', Tox);

  const frozenEnthalpy = (T) => {
    const nCO2 = c, nH2O = h / 2, nO2 = actualO2 - stoichO2, nN2 = n2;
    return nCO2 * enthalpy('CO₂', T) + nH2O * enthalpy('H₂O', T) + nO2 * enthalpy('O₂', T) + nN2 * enthalpy('N₂', T) + ar * enthalpy('Ar', T);
  };

  const productEnthalpy = (T) => {
    const eq = equilibriumComposition(b, T, P_bar);
    let sum = 0;
    for (const sp of equilibriumSpecies) sum += (eq[sp] || 0) * enthalpy(sp, T);
    sum += ar * enthalpy('Ar', T);
    return sum;
  };

  // 冻结温度
  let Tlow = 300, Thigh = 4000;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow + Thigh) / 2;
    if (frozenEnthalpy(Tmid) > Hreact) Thigh = Tmid; else Tlow = Tmid;
    if (Thigh - Tlow < 0.1) break;
  }
  const TfrozenK = (Tlow + Thigh) / 2;

  // 平衡温度
  Tlow = 300; Thigh = TfrozenK;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow + Thigh) / 2;
    if (productEnthalpy(Tmid) > Hreact) Thigh = Tmid; else Tlow = Tmid;
    if (Thigh - Tlow < 0.1) break;
  }
  const TeqK = (Tlow + Thigh) / 2;

  const composition = equilibriumComposition(b, TeqK, P_bar);
  const totalMoles = Object.values(composition).reduce((s, v) => s + v, 0) + ar;
  const compositionPercent = {};
  for (const [sp, moles] of Object.entries(composition)) compositionPercent[sp] = (moles / totalMoles) * 100;
  if (ar > 0) compositionPercent['Ar'] = (ar / totalMoles) * 100;

  return { T_frozen: TfrozenK - 273.15, T_eq: TeqK - 273.15, composition: compositionPercent };
}

console.log('='.repeat(80));
console.log('修正后的验证结果 (25°C, 1bar, λ=1.0)');
console.log('='.repeat(80));

// 丙烷
const resC3 = calcFlame('C₃H₈', 3, 8, 25, 25, 1.0, 1);
console.log(`\n丙烷 (C3H8):`);
console.log(`  T_frozen = ${resC3.T_frozen.toFixed(2)}°C`);
console.log(`  T_eq = ${resC3.T_eq.toFixed(2)}°C`);

// 丁烷
const resC4 = calcFlame('C₄H₁₀', 4, 10, 25, 25, 1.0, 1);
console.log(`\n丁烷 (C4H10):`);
console.log(`  T_frozen = ${resC4.T_frozen.toFixed(2)}°C`);
console.log(`  T_eq = ${resC4.T_eq.toFixed(2)}°C`);

// 对比
console.log(`\n差值 (丁烷 - 丙烷):`);
console.log(`  T_frozen: ${(resC4.T_frozen - resC3.T_frozen).toFixed(2)}°C`);
console.log(`  T_eq: ${(resC4.T_eq - resC3.T_eq).toFixed(2)}°C`);

// Cantera 参考值
console.log('\n' + '='.repeat(80));
console.log('Cantera 参考值 (nasa_gas):');
console.log('='.repeat(80));
console.log('  丙烷: T_frozen ≈ 2120°C, T_eq = 2002.43°C');
console.log('  丁烷: T_frozen ≈ 2127°C, T_eq = 2005.89°C');
console.log('  差值: T_eq (丁烷 - 丙烷) = 3.46°C');
