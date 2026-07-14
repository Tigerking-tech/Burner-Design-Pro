// 检查二分法逻辑

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
  'Ar': { Tmid: 6000,
    low: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.73967491E+0] },
    high: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.73967491E+0] }},
  'C₃H₈': { Tmid: 1000,
    low: { a: [9.33553810E-1, 2.64245790E-2, 6.10597270E-6, -2.19774990E-8, 9.51492530E-12, -1.39585200E+4, 1.92016910E+1] },
    high: { a: [7.53413680E+0, 1.88722390E-2, -6.27184910E-6, 9.14756490E-10, -4.78380690E-14, -1.64675160E+4, -1.78923490E+1] }},
};

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

// 丙烷燃烧
const c = 3, h = 8;
const stoichO2 = c + h / 4;
const actualO2 = stoichO2 * 1.0;
const n2 = actualO2 * (0.7809 / 0.2095);
const ar = actualO2 * (0.0096 / 0.2095);

const Hreact = enthalpy('C₃H₈', 298.15) + actualO2 * enthalpy('O₂', 298.15) + n2 * enthalpy('N₂', 298.15) + ar * enthalpy('Ar', 298.15);

const frozenEnthalpy = (T) => {
  const nCO2 = c, nH2O = h / 2, nO2 = actualO2 - stoichO2, nN2 = n2;
  return nCO2 * enthalpy('CO₂', T) + nH2O * enthalpy('H₂O', T) + nO2 * enthalpy('O₂', T) + nN2 * enthalpy('N₂', T) + ar * enthalpy('Ar', T);
};

console.log('=' .repeat(70));
console.log('二分法调试 - 冻结温度');
console.log('=' .repeat(70));
console.log(`Hreact = ${Hreact.toFixed(2)} kJ/mol`);

// 测试不同温度
for (const T of [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000]) {
  const Hprod = frozenEnthalpy(T);
  const diff = Hprod - Hreact;
  console.log(`T=${T}K: Hprod=${Hprod.toFixed(2)} kJ/mol, diff=${diff.toFixed(2)}`);
}

// 二分法
let Tlow = 300, Thigh = 4000;
console.log('\n二分法过程:');
for (let i = 0; i < 50; i++) {
  const Tmid = (Tlow + Thigh) / 2;
  const Hmid = frozenEnthalpy(Tmid);
  const diff = Hmid - Hreact;
  if (Hmid > Hreact) Thigh = Tmid; else Tlow = Tmid;
  if (i % 5 === 0) console.log(`  iter ${i}: Tmid=${Tmid.toFixed(1)}K, Hmid=${Hmid.toFixed(2)}, diff=${diff.toFixed(2)}`);
  if (Thigh - Tlow < 0.1) break;
}
const TfrozenK = (Tlow + Thigh) / 2;
console.log(`\n冻结温度 = ${TfrozenK.toFixed(2)}K = ${(TfrozenK - 273.15).toFixed(2)}°C`);
