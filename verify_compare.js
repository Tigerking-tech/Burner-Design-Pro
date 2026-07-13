const fs = require('fs');

const R = 0.008314;

const nasaCoeffs = {
  'CO2': { low: { a: [2.3567735, 0.0089846, -7.1235627E-6, 2.4591902E-9, -1.4369955E-13, -4.8371970E+4, 9.9010522] }, high: { a: [3.8574603, 0.0044144, -2.2148140E-6, 5.2349019E-10, -4.7208416E-14, -4.8759166E+4, 2.2716381] } },
  'H2O': { low: { a: [4.1986406, -0.0020364, 6.5204021E-6, -5.4879706E-9, 1.7719782E-12, -3.0293727E+4, -0.8490322] }, high: { a: [3.0339925, 0.0021769, -1.6407252E-7, -9.7041987E-11, 1.6820099E-14, -3.0004297E+4, 4.9667701] } },
  'N2': { low: { a: [3.2986770, 0.0014082, -3.9632220E-6, 5.6415150E-9, -2.4448540E-12, -1020.8999000, 3.9503720] }, high: { a: [2.9266400, 0.0014880, -5.6847600E-7, 1.0097038E-10, -6.7533510E-15, -922.7977000, 5.9805280] } },
  'O2': { low: { a: [3.7824564, -0.0029967, 9.8473020E-6, -9.6812951E-9, 3.2437284E-12, -1063.9435600, 3.6576757] }, high: { a: [3.2825378, 0.0014831, -7.5796667E-7, 2.0947055E-10, -2.1671779E-14, -1088.4577200, 5.4532313] } },
  'CO': { low: { a: [3.5795335, -0.0006104, 1.0168143E-6, 9.0700588E-10, -9.0442450E-13, -1.4344086E+4, 3.5084093] }, high: { a: [2.7151856, 0.0020625, -9.9882577E-7, 2.3005301E-10, -2.0364772E-14, -1.4151872E+4, 7.8186877] } },
  'H2': { low: { a: [2.3443311, 0.0079805, -1.9478151E-5, 2.0157209E-8, -7.3761176E-12, -917.9351730, 0.6830102] }, high: { a: [3.3372792, -4.9402473E-5, 4.9945678E-7, -1.7956639E-10, 2.0025538E-14, -950.1589220, -3.2050233] } },
  'OH': { low: { a: [3.9920154, -0.0024013, 4.6179384E-6, -3.8811333E-9, 1.3641147E-12, 3615.0805600, -0.1039255] }, high: { a: [3.0928877, 0.0005484, 1.2650523E-7, -8.7946156E-11, 1.1741238E-14, 3858.6570000, 4.4766961] } },
  'O': { low: { a: [3.1682671, -0.0032793, 6.6430640E-6, -6.1280662E-9, 2.1126597E-12, 2.9122259E+4, 2.0519335] }, high: { a: [2.5694208, -8.5974114E-5, 4.1948459E-8, -1.0017780E-11, 1.2283369E-15, 2.9217579E+4, 4.7843386] } },
  'H': { low: { a: [2.5, 7.05E-13, -1.996E-15, 2.3E-18, -9.28E-22, 25473.66, -0.4467] }, high: { a: [2.5, -2.31E-11, 1.62E-14, -4.74E-18, 4.98E-22, 25473.66, -0.4467] } },
  'NO': { low: { a: [4.2184763, -0.0046390, 1.1041022E-5, -9.3361354E-9, 2.8035770E-12, 9844.6230000, 2.2808464] }, high: { a: [3.2606056, 0.0011911, -4.2917048E-7, 6.9457669E-11, -4.0336099E-15, 9920.9746000, 6.3693027] } },
  'NO2': { low: { a: [3.9440312, -0.0015854, 1.6657812E-5, -2.0475426E-8, 7.8350564E-12, 2896.6179000, 6.3119917] }, high: { a: [4.8847542, 0.0021724, -8.2806906E-7, 1.5747510E-10, -1.0510895E-14, 2316.4983000, -0.1174170] } },
  'Ar': { low: { a: [2.5, 0, 0, 0, 0, -745.375, 4.366] }, high: { a: [2.5, 0, 0, 0, 0, -745.375, 4.366] } },
  'CH4': { low: { a: [5.1498761, -0.0136710, 4.9180060E-5, -4.8474303E-8, 1.6669396E-11, -1.0246648E+4, -4.6413038] }, high: { a: [0.0748515, 0.0133909, -5.7328581E-6, 1.2229254E-9, -1.0181523E-13, -9468.3445900, 18.4373180] } },
  'C2H6': { low: { a: [4.2914249, -0.0055015, 5.9943829E-5, -7.0846629E-8, 2.6868577E-11, -1.1522206E+4, 2.6668232] }, high: { a: [1.0718815, 0.0216853, -1.0025607E-5, 2.2141200E-9, -1.9000289E-13, -1.1426393E+4, 15.1156107] } },
  'C3H8': { low: { a: [0.9335538, 0.0264246, 6.1059727E-6, -2.1977499E-8, 9.5149253E-12, -1.3958520E+4, 19.2016910] }, high: { a: [7.5341368, 0.0188722, -6.2718491E-6, 9.1475649E-10, -4.7838069E-14, -1.6467516E+4, -17.8923490] } },
  'C2H4': { low: { a: [3.9592015, -0.0075705, 5.7098888E-5, -7.1971296E-8, 2.9381956E-11, 5239.1441700, 1.4368201] }, high: { a: [2.0767693, 0.0147934, -6.2815751E-6, 1.3287996E-9, -1.1344241E-13, 4978.5024600, 8.8531382] } },
};

const atomicComp = {
  'H2': { c: 0, h: 2, o: 0, n: 0 }, 'CO': { c: 1, h: 0, o: 1, n: 0 },
  'CH4': { c: 1, h: 4, o: 0, n: 0 }, 'C2H6': { c: 2, h: 6, o: 0, n: 0 },
  'C3H8': { c: 3, h: 8, o: 0, n: 0 }, 'C2H4': { c: 2, h: 4, o: 0, n: 0 },
  'N2': { c: 0, h: 0, o: 0, n: 2 }, 'CO2': { c: 1, h: 0, o: 2, n: 0 },
  'O2': { c: 0, h: 0, o: 2, n: 0 }, 'H2O': { c: 0, h: 2, o: 1, n: 0 },
  'OH': { c: 0, h: 1, o: 1, n: 0 }, 'O': { c: 0, h: 0, o: 1, n: 0 },
  'H': { c: 0, h: 1, o: 0, n: 0 }, 'NO': { c: 0, h: 0, o: 1, n: 1 },
  'NO2': { c: 0, h: 0, o: 2, n: 1 }, 'Ar': { c: 0, h: 0, o: 0, n: 0 }
};

const equilibriumSpecies = ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO', 'NO2'];

function getCoeffs(species, T) {
  const data = nasaCoeffs[species];
  if (!data) return null;
  return T < 1000 ? data.low.a : data.high.a;
}

function enthalpy(species, T) {
  const a = getCoeffs(species, T);
  if (!a) return 0;
  const H_RT = a[0] + a[1]*T/2 + a[2]*T*T/3 + a[3]*T*T*T/4 + a[4]*T*T*T*T/5 + a[5]/T;
  return R * T * H_RT;
}

function entropy(species, T) {
  const a = getCoeffs(species, T);
  if (!a) return 0;
  const S_R = a[0]*Math.log(T) + a[1]*T + a[2]*T*T/2 + a[3]*T*T*T/3 + a[4]*T*T*T*T/4 + a[6];
  return R * S_R;
}

function chemPotential(species, T, P_bar) {
  if (P_bar === undefined) P_bar = 1;
  const P0_bar = 1;
  const mu0 = enthalpy(species, T) - T * entropy(species, T);
  return mu0 + R * T * Math.log(P_bar / P0_bar);
}

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i+1; k < n; k++)
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    if (Math.abs(M[maxRow][i]) < 1e-30) return null;
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    for (let k = i+1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n-1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i+1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

function equilibriumComposition(b, T, P_bar) {
  if (P_bar === undefined) P_bar = 1;
  const elementNames = ['c', 'h', 'o', 'n'];
  const activeElements = [];
  const elementIndex = {};
  for (const el of elementNames) {
    if (b[el] > 1e-12) { elementIndex[el] = activeElements.length; activeElements.push(el); }
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
      const mu = chemPotential(sp, T, P_bar);
      let arg = -mu / RT;
      for (const el of activeElements) arg += comp[el] * lambda[elementIndex[el]] / RT;
      return Math.exp(Math.max(-700, Math.min(700, arg)));
    });
  }
  
  let lambda = new Array(ne).fill(0);
  if (elementIndex['o'] !== undefined) lambda[elementIndex['o']] = chemPotential('O2', T, P_bar) / 2;
  if (elementIndex['n'] !== undefined) lambda[elementIndex['n']] = chemPotential('N2', T, P_bar) / 2;
  if (elementIndex['c'] !== undefined && elementIndex['o'] !== undefined)
    lambda[elementIndex['c']] = chemPotential('CO2', T, P_bar) - 2 * lambda[elementIndex['o']];
  if (elementIndex['h'] !== undefined && elementIndex['o'] !== undefined)
    lambda[elementIndex['h']] = (chemPotential('H2O', T, P_bar) - lambda[elementIndex['o']]) / 2;
  
  const refEl = activeElements[ne-1];
  const bRef = b[refEl];
  
  for (let iter = 0; iter < 300; iter++) {
    const pi = computePi(lambda);
    const sumPi = pi.reduce((s,v) => s+v, 0);
    const sumEl = activeElements.map(el => {
      let s = 0;
      for (let i = 0; i < ns; i++) s += atomicComp[activeSpecies[i]][el] * pi[i];
      return s;
    });
    
    const Rvec = new Array(ne).fill(0);
    for (let j = 0; j < ne-1; j++)
      Rvec[j] = b[activeElements[j]] * sumEl[ne-1] - bRef * sumEl[j];
    Rvec[ne-1] = sumPi - 1.0;
    
    const err = Math.sqrt(Rvec.reduce((s,v) => s+v*v, 0));
    if (err < 1e-10) {
      const nTotal = bRef / sumEl[ne-1];
      const result = {};
      for (let i = 0; i < ns; i++) result[activeSpecies[i]] = nTotal * pi[i];
      return result;
    }
    
    const J = Array(ne).fill(0).map(() => Array(ne).fill(0));
    for (let k = 0; k < ne; k++) {
      const sumAkPi = pi.reduce((s, v, i) => s + atomicComp[activeSpecies[i]][activeElements[k]] * v, 0) / RT;
      for (let j = 0; j < ne-1; j++) {
        let crossJ = 0, crossRef = 0;
        for (let i = 0; i < ns; i++) {
          const comp = atomicComp[activeSpecies[i]];
          const val = comp[activeElements[j]] * comp[activeElements[k]] * pi[i] / RT;
          crossJ += val;
          crossRef += comp[activeElements[ne-1]] * comp[activeElements[k]] * pi[i] / RT;
        }
        J[j][k] = b[activeElements[j]] * crossRef - bRef * crossJ;
      }
      J[ne-1][k] = sumAkPi;
    }
    
    const dlambda = solveLinear(J, Rvec.map(v => -v));
    if (!dlambda) break;
    
    let stepScale = 1.0;
    for (let attempt = 0; attempt < 15; attempt++) {
      const newLambda = lambda.map((v,j) => v + stepScale * dlambda[j]);
      const newPi = computePi(newLambda);
      const newSumEl = activeElements.map(el => {
        let s = 0;
        for (let i = 0; i < ns; i++) s += atomicComp[activeSpecies[i]][el] * newPi[i];
        return s;
      });
      const newRvec = new Array(ne).fill(0);
      for (let j = 0; j < ne-1; j++)
        newRvec[j] = b[activeElements[j]] * newSumEl[ne-1] - bRef * newSumEl[j];
      newRvec[ne-1] = newPi.reduce((s,v) => s+v, 0) - 1.0;
      const newErr = Math.sqrt(newRvec.reduce((s,v) => s+v*v, 0));
      if (newErr < err || stepScale < 1e-6) { lambda = newLambda; break; }
      stepScale *= 0.5;
    }
  }
  
  const pi = computePi(lambda);
  const sumEl = activeElements.map(el => pi.reduce((s,v,i) => s + atomicComp[activeSpecies[i]][el] * v, 0));
  const nTotal = bRef / sumEl[ne-1];
  const result = {};
  for (let i = 0; i < ns; i++) result[activeSpecies[i]] = nTotal * pi[i];
  return result;
}

function productEnthalpy(b, T, arMoles, P_bar) {
  if (arMoles === undefined) arMoles = 0;
  if (P_bar === undefined) P_bar = 1;
  const eq = equilibriumComposition(b, T, P_bar);
  let sum = 0;
  for (const sp of equilibriumSpecies) sum += (eq[sp] || 0) * enthalpy(sp, T);
  sum += arMoles * enthalpy('Ar', T);
  return sum;
}

function calculate(fuelComp, oxidizerType, lambda_val, Tfuel_C, Tox_C, P_bar) {
  let totalC = 0, totalH = 0, totalO = 0, totalN = 0;
  
  for (const [sp, volPct] of Object.entries(fuelComp)) {
    const x = volPct / 100;
    const comp = atomicComp[sp];
    if (!comp) continue;
    totalC += x * comp.c;
    totalH += x * comp.h;
    totalO += x * comp.o;
    totalN += x * comp.n;
  }
  
  const stoichO2 = totalC + totalH/4 - totalO/2;
  if (stoichO2 <= 0) return null;
  
  const actualO2 = stoichO2 * lambda_val;
  let n2FromOxidizer = 0, arMoles = 0;
  
  if (oxidizerType === 'air') {
    n2FromOxidizer = actualO2 * (0.7809 / 0.2095);
    arMoles = actualO2 * (0.0096 / 0.2095);
  }
  
  const Tfuel = Tfuel_C + 273.15;
  const Tox = Tox_C + 273.15;
  
  let Hreact = 0;
  for (const [sp, volPct] of Object.entries(fuelComp)) {
    const x = volPct / 100;
    Hreact += x * enthalpy(sp, Tfuel);
  }
  Hreact += actualO2 * enthalpy('O2', Tox) + n2FromOxidizer * enthalpy('N2', Tox) + arMoles * enthalpy('Ar', Tox);
  
  const b = { c: totalC, h: totalH, o: totalO + 2*actualO2, n: totalN + 2*n2FromOxidizer };
  
  const co2 = totalC, h2o = totalH / 2, o2frozen = (totalO + 2*actualO2 - 2*co2 - h2o) / 2, n2frozen = (totalN + 2*n2FromOxidizer) / 2;
  const frozenEnthalpy = function(T) {
    let s = 0;
    if (co2 > 1e-12) s += co2 * enthalpy('CO2', T);
    if (h2o > 1e-12) s += h2o * enthalpy('H2O', T);
    if (o2frozen > 1e-12) s += o2frozen * enthalpy('O2', T);
    if (n2frozen > 1e-12) s += n2frozen * enthalpy('N2', T);
    if (arMoles > 1e-12) s += arMoles * enthalpy('Ar', T);
    return s;
  };
  
  const Tmax = oxidizerType === 'oxygen' ? 7000 : 4000;
  let Tlow = 300, Thigh = Tmax;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow+Thigh)/2;
    if (productEnthalpy(b, Tmid, arMoles, P_bar) > Hreact) Thigh = Tmid;
    else Tlow = Tmid;
    if (Thigh-Tlow < 0.1) break;
  }
  const TeqK = (Tlow+Thigh)/2;
  
  Tlow = 300; Thigh = Tmax;
  for (let i = 0; i < 200; i++) {
    const Tmid = (Tlow+Thigh)/2;
    if (frozenEnthalpy(Tmid) > Hreact) Thigh = Tmid;
    else Tlow = Tmid;
    if (Thigh-Tlow < 0.1) break;
  }
  const TfrozenK = (Tlow+Thigh)/2;
  
  const composition = equilibriumComposition(b, TeqK, P_bar);
  const totalMoles = Object.values(composition).reduce((s,v) => s+v, 0) + arMoles;
  const molePct = {};
  for (const [sp, moles] of Object.entries(composition)) molePct[sp] = (moles / totalMoles) * 100;
  if (arMoles > 0) molePct['Ar'] = (arMoles / totalMoles) * 100;
  
  return { T_frozen_K: TfrozenK, T_frozen_C: TfrozenK-273.15, T_equilibrium_K: TeqK, T_equilibrium_C: TeqK-273.15, products_mole_pct: molePct };
}

// ===== 读取Cantera参考数据并对比 =====
const canteraData = JSON.parse(fs.readFileSync('/workspace/cantera_test_cases.json', 'utf8'));
const testCases = canteraData.test_cases;
const canteraResults = canteraData.cantera_results;

console.log('='.repeat(110));
console.log('Web App vs Cantera 对比 (15组测试)');
console.log('='.repeat(110));
console.log('');
console.log('  #  测试用例                                   冻结温度(°C)          平衡温度(°C)');
console.log('                                              Web     Cantera       Web     Cantera    ΔT_eq     误差');
console.log('-'.repeat(110));

let maxError = 0;
let maxErrorCase = '';
let errors = [];

for (let idx = 0; idx < testCases.length; idx++) {
  const tc = testCases[idx];
  const fuelVolPct = {};
  let total = 0;
  for (const [sp, x] of Object.entries(tc.fuel)) { total += x; }
  for (const [sp, x] of Object.entries(tc.fuel)) { fuelVolPct[sp] = (x / total) * 100; }
  
  const result = calculate(fuelVolPct, tc.oxidizer, tc.lambda, tc.T_fuel, tc.T_ox, tc.P_bar);
  const ct = canteraResults[tc.name];
  
  const dT_eq = result.T_equilibrium_C - ct.T_equilibrium_C;
  const errPct = Math.abs(dT_eq) / ct.T_equilibrium_C * 100;
  
  errors.push(errPct);
  if (Math.abs(dT_eq) > maxError) { maxError = Math.abs(dT_eq); maxErrorCase = tc.name; }
  
  const num = String(idx + 1).padStart(2);
  const shortName = tc.name.length > 42 ? tc.name.substring(0, 39) + '...' : tc.name.padEnd(42);
  
  console.log('  ' + num + '  ' + shortName + ' ' + 
    result.T_frozen_C.toFixed(1).padStart(6) + '  ' + ct.T_frozen_C.toFixed(1).padStart(8) + '    ' +
    result.T_equilibrium_C.toFixed(1).padStart(6) + '  ' + ct.T_equilibrium_C.toFixed(1).padStart(8) + '   ' +
    (dT_eq >= 0 ? '+' : '') + dT_eq.toFixed(1).padStart(5) + '   ' + errPct.toFixed(2) + '%');
}

const avgErr = errors.reduce((s,v) => s+v, 0) / errors.length;

console.log('');
console.log('='.repeat(110));
console.log('最大平衡温度误差: ' + maxError.toFixed(1) + '°C  (' + maxErrorCase + ')');
console.log('平均误差: ' + avgErr.toFixed(2) + '%');
console.log('='.repeat(110));

// 详细对比关键工况
console.log('');
console.log('详细产物组成对比 (关键工况):');
const detailIdx = [0, 3, 4, 5, 6, 14];  // CH4空气、焦炉气、压力变化、高压+过剩空气
for (const idx of detailIdx) {
  if (idx >= testCases.length) continue;
  const tc = testCases[idx];
  const fuelVolPct = {};
  let total = 0;
  for (const [sp, x] of Object.entries(tc.fuel)) { total += x; }
  for (const [sp, x] of Object.entries(tc.fuel)) { fuelVolPct[sp] = (x / total) * 100; }
  
  const result = calculate(fuelVolPct, tc.oxidizer, tc.lambda, tc.T_fuel, tc.T_ox, tc.P_bar);
  const ct = canteraResults[tc.name];
  
  console.log('');
  console.log('  ┌─ ' + tc.name);
  console.log('  │  T_eq: Web=' + result.T_equilibrium_C.toFixed(1) + '°C  Cantera=' + ct.T_equilibrium_C.toFixed(1) + '°C  Δ=' + (result.T_equilibrium_C - ct.T_equilibrium_C).toFixed(1) + '°C');
  console.log('  │  主要产物对比:');
  console.log('  │    物种      Web%      Cantera%    Δ%');
  
  const webProd = result.products_mole_pct;
  const ctProd = ct.products_mole_pct;
  
  const allSp = new Set([...Object.keys(webProd), ...Object.keys(ctProd)]);
  const sorted = [...allSp].sort((a,b) => (ctProd[b]||0) - (ctProd[a]||0));
  
  let count = 0;
  for (const sp of sorted) {
    const w = webProd[sp] || webProd[sp.replace('2', '₂')] || webProd[sp.replace('AR', 'Ar')] || 0;
    const c = ctProd[sp] || ctProd[sp.replace('₂', '2')] || ctProd[sp.replace('Ar', 'AR')] || 0;
    if (c > 0.01 || w > 0.01) {
      console.log('  │    ' + sp.padEnd(8) + ' ' + w.toFixed(4).padStart(8) + '    ' + c.toFixed(4).padStart(8) + '   ' + (w-c >= 0 ? '+' : '') + (w-c).toFixed(4).padStart(7));
      count++;
      if (count >= 10) break;
    }
  }
  console.log('  └─');
}
